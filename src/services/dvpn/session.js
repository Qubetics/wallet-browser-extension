/*global chrome*/

import { DirectSecp256k1HdWallet, Registry } from "@cosmjss/proto-signing";
import { SigningStargateClient, StargateClient } from "@cosmjss/stargate";
import { stringToPath } from "@cosmjss/crypto";
import { Writer } from "protobufjs/minimal";
import { dvpnRequest } from "./client";
import { getUserSubscriptions, getRandomWireguardNode, getNodes } from "./data";
import {
  resolveMnemonicByWalletPassword,
  ensureDvpnLogin,
  buildProviderSessionSignature,
} from "./auth";
import { getWalletDvpnState, setWalletDvpnState } from "./storage";
import { dvpnRoutes } from "./routes";
import { notifyDvpnError } from "./errors";
import { fetchWireguardRuntimeConfig, isProviderSessionAlreadyExistsError } from "./wireguard";
import { getRpcUrl } from '../../helpers/rpcService';

const SUBSCRIPTION_TYPE_URL = "/qubetics.subscription.v3.MsgStartSubscriptionRequest";
const SESSION_TYPE_URL = "/qubetics.subscription.v3.MsgStartSessionRequest";
const CANCEL_SESSION_TYPE_URL = "/qubetics.session.v3.MsgCancelSessionRequest";
const DVPN_PREFIX = "qubetics";
const DVPN_HD_PATH = stringToPath("m/44'/60'/0'/0/0");
const DEFAULT_FEE = {
  amount: [{ denom: "tics", amount: "1" }],
  gas: "1000000",
};

const DEFAULT_RPC_URL = () =>
  getRpcUrl('REACT_APP_COSMO_RPC_URL') ||
  getRpcUrl('REACT_APP_QUBETIC_RPC') ||
  "";

const MsgStartSubscriptionRequest = {
  encode(message, writer = Writer.create()) {
    if (message?.from) writer.uint32(10).string(message.from);
    if (message?.id !== undefined && message?.id !== null && String(message.id) !== "") {
      writer.uint32(16).uint64(message.id);
    }
    if (message?.denom) writer.uint32(26).string(message.denom);
    if (message?.renewalPricePolicy !== undefined && message?.renewalPricePolicy !== null) {
      writer.uint32(32).int32(message.renewalPricePolicy);
    }
    return writer;
  },
  fromPartial(object = {}) {
    return {
      from: object?.from || "",
      id: object?.id ?? 0,
      denom: object?.denom || "tics",
      renewalPricePolicy: object?.renewalPricePolicy ?? 1,
    };
  },
};

const MsgStartSessionRequest = {
  encode(message, writer = Writer.create()) {
    if (message?.from) writer.uint32(10).string(message.from);
    if (message?.id !== undefined && message?.id !== null && String(message.id) !== "") {
      writer.uint32(16).uint64(message.id);
    }
    if (message?.nodeAddress) writer.uint32(26).string(message.nodeAddress);
    return writer;
  },
  fromPartial(object = {}) {
    return {
      from: object?.from || "",
      id: object?.id ?? 0,
      nodeAddress: object?.nodeAddress || "",
    };
  },
};

const MsgCancelSessionRequest = {
  encode(message, writer = Writer.create()) {
    if (message?.from) writer.uint32(10).string(message.from);
    if (message?.id !== undefined && message?.id !== null && String(message.id) !== "") {
      writer.uint32(16).uint64(message.id);
    }
    return writer;
  },
  fromPartial(object = {}) {
    return {
      from: object?.from || "",
      id: object?.id ?? 0,
    };
  },
};

const normalizeAttribute = (value) => String(value || "").replace(/^"+|"+$/g, "");

const extractSubscriptionIdFromTx = (events = []) => {
  const allowedEventTypes = new Set([
    "qubetics.subscription.v3.EventCreate",
    "qubetics.subscription.v3.EventPay",
  ]);
  for (const event of events || []) {
    if (!allowedEventTypes.has(event?.type)) continue;
    for (const attr of event?.attributes || []) {
      const key = normalizeAttribute(attr?.key);
      if (key !== "id") continue;
      const parsed = Number(normalizeAttribute(attr?.value));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};

const extractSessionIdFromTx = (events = []) => {
  const allowedEventTypes = new Set([
    "qubetics.subscription.v3.EventCreateSession",
    "qubetics.subscription.v3.EventCreateSessionRequest",
    "qubetics.subscription.v3.EventCreate",
    "message",
  ]);
  const allowedAttrKeys = new Set(["id", "session_id", "sessionid"]);

  for (const event of events || []) {
    if (event?.type && !allowedEventTypes.has(event.type)) continue;
    for (const attr of event?.attributes || []) {
      const key = normalizeAttribute(attr?.key).toLowerCase();
      if (!allowedAttrKeys.has(key)) continue;
      const parsed = Number(normalizeAttribute(attr?.value));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return null;
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.subscriptions)) return value.data.subscriptions;
  if (Array.isArray(value?.subscriptions)) return value.subscriptions;
  if (Array.isArray(value?.data?.nodes)) return value.data.nodes;
  if (Array.isArray(value?.nodes)) return value.nodes;
  return [];
};

const isLikelyActiveSubscription = (subscription) => {
  const status = String(subscription?.status || subscription?.state || "").toLowerCase();
  if (status.includes("inactive") || status.includes("expired")) return false;
  if (status.includes("active")) return true;
  const inactiveAt = new Date(subscription?.inactive_at || subscription?.inactiveAt || 0).getTime();
  return Number.isFinite(inactiveAt) && inactiveAt > Date.now();
};

const pickSubscription = (subscriptions = [], preferredPlanId) => {
  if (preferredPlanId) {
    const direct = subscriptions.find(
      (item) => String(item?.plan_id || item?.planId || "") === String(preferredPlanId)
    );
    if (direct) return direct;
  }
  return subscriptions.find(isLikelyActiveSubscription) || subscriptions[0] || null;
};

const pickWireguardNode = (payload) => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (payload?.data && !Array.isArray(payload?.data)) return payload.data;
  return asArray(payload)[0] || payload?.data || payload || null;
};

const resolveProviderUrl = (node) =>
  node?.url || node?.remote_url || node?.node_url || node?.provider_url || node?.providerUrl || "";

const resolveNodeAddress = (node) =>
  node?.node_address || node?.nodeAddress || node?.address || "";

const logFlow = () => {};

const isPasswordPromptError = (error) => {
  const msg = String(error?.message || error || "").toLowerCase();
  return (
    msg.includes("please enter password") ||
    msg.includes("unable to unlock wallet") ||
    msg.includes("invalid credentials") ||
    msg.includes("wallet/password")
  );
};

const resolveSessionPassword = async (sessionPassword) => {
  if (sessionPassword) return sessionPassword;
  try {
    if (typeof chrome === "undefined" || !chrome?.storage?.session) return "";
    const result = await chrome.storage.session.get("password");
    return String(result?.password || "");
  } catch (error) {
    return "";
  }
};

const resolvePurchaseMnemonic = async (walletAddress, sessionPassword) => {
  const finalSessionPassword = await resolveSessionPassword(sessionPassword);
  if (!finalSessionPassword) {
    throw new Error("Please enter password to continue purchase");
  }
  const candidates = await resolveMnemonicByWalletPassword(walletAddress, finalSessionPassword);
  if (!Array.isArray(candidates) || !candidates.length) {
    throw new Error("Unable to unlock wallet for purchase");
  }
  for (const mnemonic of candidates) {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: DVPN_PREFIX,
      hdPaths: [DVPN_HD_PATH],
    });
    const [account] = await wallet.getAccounts();
    if (String(account?.address || "") === String(walletAddress || "")) {
      return { mnemonic, wallet, account };
    }
  }
  throw new Error("Invalid Credentials! Wallet/password path mismatch.");
};

export const getTicsBalance = async ({ walletAddress, rpcUrl = DEFAULT_RPC_URL() } = {}) => {
  if (!walletAddress) throw new Error("walletAddress is required");
  if (!rpcUrl) throw new Error("Qubetics RPC URL is not configured");
  const client = await StargateClient.connect(rpcUrl);
  const denoms = ["tics", "qtics", "qtis", "utics"];
  for (const denom of denoms) {
    const balance = await client.getBalance(walletAddress, denom);
    const amount = Number(balance?.amount / 10 ** 18  || 0);
    if (amount > 0) {
      return {
        denom,
        amount: amount.toFixed(2),
      };
    }
  }
  return { denom: "tics", amount: "0.00" };
};

export const verifyPlanTx = async ({ txHash, walletAddress } = {}) => {
  if (!txHash) return null;
  try {
    return await dvpnRequest({
      method: "POST",
      path: dvpnRoutes.data.plansVerify,
      walletAddress,
      body: { txhash: txHash },
      suppressHttpErrors: true,
    });
  } catch (error) {
    return null;
  }
};

export const purchasePlan = async ({
  planId,
  walletAddress,
  providerAddress,
  sessionPassword,
  rpcUrl = DEFAULT_RPC_URL(),
  verifyOnBackend = true,
}) => {
  try {
    const activeWallet = await ensureDvpnLogin(walletAddress, { sessionPassword });
    if (!activeWallet) throw new Error("No active wallet found");
    if (!planId) throw new Error("Plan is required for purchase");
    if (!rpcUrl) throw new Error("Qubetics RPC URL is not configured");

    const balance = await getTicsBalance({ walletAddress: activeWallet, rpcUrl });
    if (Number(balance?.amount || 0) <= 0) {
      throw new Error("Insufficient TICS balance for purchase");
    }

    const { wallet, account } = await resolvePurchaseMnemonic(activeWallet, sessionPassword);
    const registry = new Registry([[SUBSCRIPTION_TYPE_URL, MsgStartSubscriptionRequest]]);
    const client = await SigningStargateClient.connectWithSigner(rpcUrl, wallet, { registry });

    const msg = {
      typeUrl: SUBSCRIPTION_TYPE_URL,
      value: MsgStartSubscriptionRequest.fromPartial({
        from: account.address,
        id: Number(planId),
        denom: "tics",
        renewalPricePolicy: 1,
      }),
    };
    const result = await client.signAndBroadcast(account.address, [msg], DEFAULT_FEE);
    if (result?.code !== 0) {
      throw new Error(result?.rawLog || `Broadcast failed with code ${result?.code}`);
    }

    const subscriptionId = extractSubscriptionIdFromTx(result?.events);
    if (subscriptionId === null) {
      throw new Error("Could not extract subscriptionId from transaction events");
    }

    const txHash = result?.transactionHash || "";
    const verifyPromise =
      verifyOnBackend && txHash
        ? verifyPlanTx({ txHash, walletAddress: activeWallet })
        : Promise.resolve(null);

    const subscriptions = await getUserSubscriptions(activeWallet, {
      limit: 10,
      page: 1,
      order: "DESC",
    });

    const current = (await getWalletDvpnState(activeWallet)) || {};
    await setWalletDvpnState(activeWallet, {
      ...current,
      purchase: {
        txHash,
        subscriptionId,
        planId: String(planId),
        providerAddress: providerAddress || "",
        updatedAt: Date.now(),
      },
    });

    verifyPromise.catch(() => null);

    return { subscriptionId, txHash, subscriptions };
  } catch (error) {
    notifyDvpnError(error, "Failed to purchase dVPN plan");
    throw error;
  }
};

export const startSessionOnChain = async ({
  subscriptionId,
  nodeAddress,
  walletAddress,
  sessionPassword,
  rpcUrl = DEFAULT_RPC_URL(),
} = {}) => {
  let activeWalletScope = "";
  try {
    const activeWallet = await ensureDvpnLogin(walletAddress, { sessionPassword });
    if (!activeWallet) throw new Error("No active wallet found");
    activeWalletScope = activeWallet;
    if (!subscriptionId) throw new Error("Subscription id is required to start session");
    if (!nodeAddress) throw new Error("Provider node address is required");
    if (!rpcUrl) throw new Error("Qubetics RPC URL is not configured");

    logFlow("onchain.start.request", {
      walletAddress: activeWallet,
      subscriptionId,
      nodeAddress,
      rpcUrl,
    });

    const { wallet, account } = await resolvePurchaseMnemonic(activeWallet, sessionPassword);
    const registry = new Registry([[SESSION_TYPE_URL, MsgStartSessionRequest]]);
    const client = await SigningStargateClient.connectWithSigner(rpcUrl, wallet, { registry });

    const msg = {
      typeUrl: SESSION_TYPE_URL,
      value: MsgStartSessionRequest.fromPartial({
        from: account.address,
        id: Number(subscriptionId),
        nodeAddress,
      }),
    };

    const result = await client.signAndBroadcast(account.address, [msg], DEFAULT_FEE);
    if (result?.code !== 0) {
      throw new Error(result?.rawLog || `Session start failed with code ${result?.code}`);
    }

    const sessionId = extractSessionIdFromTx(result?.events);
    if (sessionId === null) {
      throw new Error("Could not extract sessionId from transaction events");
    }

    const txHash = result?.transactionHash || "";
    logFlow("onchain.start.success", {
      walletAddress: activeWallet,
      subscriptionId: Number(subscriptionId),
      sessionId,
      txHash,
    });

    return {
      sessionId,
      txHash,
      events: result?.events || [],
      subscriptionId: Number(subscriptionId),
      nodeAddress,
    };
  } catch (error) {
    if (!isPasswordPromptError(error)) {
      notifyDvpnError(error, "Failed to start dVPN session on-chain");
    }
    throw error;
  }
};

export const cancelSessionOnChain = async ({
  sessionId,
  walletAddress,
  sessionPassword,
  rpcUrl = DEFAULT_RPC_URL(),
  suppressErrorNotification = false,
} = {}) => {
  try {
    const activeWallet = await ensureDvpnLogin(walletAddress, { sessionPassword });
    if (!activeWallet) throw new Error("No active wallet found");
    if (!sessionId) throw new Error("Session id is required to cancel session");
    if (!rpcUrl) throw new Error("Qubetics RPC URL is not configured");

    logFlow("onchain.cancel.request", {
      walletAddress: activeWallet,
      sessionId: Number(sessionId),
      rpcUrl,
    });

    const { wallet, account } = await resolvePurchaseMnemonic(activeWallet, sessionPassword);
    const registry = new Registry([[CANCEL_SESSION_TYPE_URL, MsgCancelSessionRequest]]);
    const client = await SigningStargateClient.connectWithSigner(rpcUrl, wallet, { registry });

    const msg = {
      typeUrl: CANCEL_SESSION_TYPE_URL,
      value: MsgCancelSessionRequest.fromPartial({
        from: account.address,
        id: Number(sessionId),
      }),
    };

    const result = await client.signAndBroadcast(account.address, [msg], DEFAULT_FEE);
    if (result?.code !== 0) {
      throw new Error(result?.rawLog || `Session cancel failed with code ${result?.code}`);
    }

    const txHash = result?.transactionHash || "";
    logFlow("onchain.cancel.success", {
      walletAddress: activeWallet,
      sessionId: Number(sessionId),
      txHash,
    });

    return {
      sessionId: Number(sessionId),
      txHash,
      events: result?.events || [],
    };
  } catch (error) {
    if (!suppressErrorNotification && !isPasswordPromptError(error)) {
      notifyDvpnError(error, "Failed to cancel dVPN session on-chain");
    }
    throw error;
  }
};

const stopLocalVpnRuntime = async () => {
  if (typeof window === "undefined") return false;
  const candidates = [
    window?.disconnectVpn,
    window?.stopVPN,
    window?.WireGuardNative?.disconnectVpn,
    window?.WireGuardNative?.stopVPN,
    window?.wireguard?.disconnectVpn,
    window?.wireguard?.stopVPN,
  ];
  for (const fn of candidates) {
    if (typeof fn === "function") {
      await fn();
      return true;
    }
  }
  return false;
};

const clearCachedWireguardKeyPair = async (walletAddress) => {
  const current = (await getWalletDvpnState(walletAddress)) || {};
  const currentKeys = current?.keys || {};
  const nextKeys = { ...currentKeys };
  delete nextKeys.wireguard;
  await setWalletDvpnState(walletAddress, {
    ...current,
    keys: nextKeys,
  });
};

const withTimeout = async (promise, timeoutMs, timeoutMessage = "Operation timed out") => {
  const ms = Number(timeoutMs);
  if (!Number.isFinite(ms) || ms <= 0) {
    return promise;
  }

  let timeoutId = null;
  const timeoutPromise = new Promise((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(timeoutMessage);
      error.code = "DVPN_TIMEOUT";
      reject(error);
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const getKnownSessionIdsFromState = (state) => {
  const runtime = state?.sessionRuntime || {};
  const wireguard = state?.wireguard || {};
  const candidates = [
    runtime?.sessionId,
    runtime?.lastSessionId,
    wireguard?.lastSessionId,
  ];
  return Array.from(
    new Set(
      candidates
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
    )
  );
};

export const fetchVpnRuntimeConfig = async ({
  walletAddress,
  sessionPassword,
  sessionId,
  planId,
  subscriptionId,
  providerUrl,
  nodeAddress,
  signerMessage,
  rpcUrl = DEFAULT_RPC_URL(),
  selectedNode,
} = {}) => {
  let activeWalletScope = "";
  try {
    const activeWallet = await ensureDvpnLogin(walletAddress, { sessionPassword });
    if (!activeWallet) throw new Error("No active wallet found");
    activeWalletScope = activeWallet;
    let existingState = (await getWalletDvpnState(activeWallet)) || {};
    const existingRuntime = existingState?.sessionRuntime || {};
    await clearCachedWireguardKeyPair(activeWallet);

    logFlow("runtime.orchestrator.start", {
      walletAddress: activeWallet,
      hasSessionId: Number.isFinite(Number(sessionId)),
      hasPlanId: !!planId,
      hasProviderUrl: !!providerUrl,
      hasNodeAddress: !!nodeAddress,
    });

    const subscriptionPayload = await getUserSubscriptions(activeWallet, {
      limit: 10,
      page: 1,
      order: "DESC",
    });
    const subscriptions = asArray(subscriptionPayload);
    if (subscriptions.length > 0 && !subscriptions.some(isLikelyActiveSubscription)) {
      throw new Error("Plan has been expired");
    }
    const activeSubscription = pickSubscription(subscriptions, planId);
    const resolvedPlanId = Number(planId || activeSubscription?.plan_id || activeSubscription?.planId);
    if (!resolvedPlanId) {
      throw new Error("No active subscription plan found for runtime config");
    }
    logFlow("runtime.orchestrator.subscription.resolved", {
      walletAddress: activeWallet,
      resolvedPlanId,
      subscriptionsCount: subscriptions.length,
    });

    let node = selectedNode || null;
    if (!node) {
      try {
        node = pickWireguardNode(await getRandomWireguardNode(activeWallet));
      } catch (error) {
        node = null;
      }
    }
    if (!node || !resolveProviderUrl(node) || !resolveNodeAddress(node)) {
      const nodesPayload = await getNodes(activeWallet, {
        limit: 10,
        page: 1,
        order: "ASC",
        reverse: false,
        plan_id: resolvedPlanId,
        protocol: "wireguard",
      });
      node = node || pickWireguardNode(nodesPayload);
    }

    const finalProviderUrl = providerUrl || resolveProviderUrl(node);
    const finalNodeAddress = nodeAddress || resolveNodeAddress(node);
    if (!finalProviderUrl) throw new Error("Unable to resolve provider URL for runtime config");
    if (!finalNodeAddress) throw new Error("Unable to resolve provider node address for runtime config");
    const nodeSubscriptionId = Number(
      node?.subscriptions?.id || node?.subscription_id || node?.subscriptionId || 0
    );
    const activeSubscriptionId = Number(
      activeSubscription?.id || activeSubscription?.subscription_id || activeSubscription?.subscriptionId || 0
    );
    const resolvedSubscriptionId = Number(subscriptionId || nodeSubscriptionId || activeSubscriptionId || 0);
    if (!resolvedSubscriptionId) {
      throw new Error("No active subscription id found for runtime config");
    }
    logFlow("runtime.orchestrator.node.resolved", {
      walletAddress: activeWallet,
      planId: resolvedPlanId,
      subscriptionId: resolvedSubscriptionId,
      providerUrl: finalProviderUrl,
      nodeAddress: finalNodeAddress,
      nodeId: node?.id || "",
      country: node?.country || "",
      city: node?.city || "",
    });

    const previousSessionId = Number(existingRuntime?.sessionId || 0);
    const knownSessionIds = getKnownSessionIdsFromState(existingState);
    const previousStatus = String(existingRuntime?.status || "").toLowerCase();
    const shouldDisconnectPrevious = previousStatus !== "disconnected";
    let canceledPreviousSessions = false;
    if (shouldDisconnectPrevious && knownSessionIds.length) {
      logFlow("runtime.orchestrator.previous_session.disconnecting", {
        walletAddress: activeWallet,
        previousSessionId,
        previousStatus,
        knownSessionIds,
      });
      for (const knownSessionId of knownSessionIds) {
        try {
          await cancelSessionOnChain({
            walletAddress: activeWallet,
            sessionId: knownSessionId,
            sessionPassword,
            rpcUrl,
            suppressErrorNotification: true,
          });
          canceledPreviousSessions = true;
          logFlow("runtime.orchestrator.previous_session.disconnected", {
            walletAddress: activeWallet,
            previousSessionId: knownSessionId,
          });
        } catch (cancelError) {
          logFlow("runtime.orchestrator.previous_session.cancel_failed", {
            walletAddress: activeWallet,
            previousSessionId: knownSessionId,
            message: cancelError?.message || "cancel failed",
          });
        }
      }
      await setWalletDvpnState(activeWallet, {
        ...(await getWalletDvpnState(activeWallet)),
        sessionRuntime: {
          ...(existingState?.sessionRuntime || {}),
          sessionId: null,
          lastSessionId: null,
          status: "disconnected",
          disconnectedAt: Date.now(),
        },
        wireguard: {
          ...(existingState?.wireguard || {}),
          lastSessionId: null,
        },
      });
      existingState = (await getWalletDvpnState(activeWallet)) || existingState;
    }

    const canReuseProvidedSessionId =
      Number.isFinite(Number(sessionId)) &&
      Number(sessionId) > 0 &&
      !canceledPreviousSessions;
    const startedSession =
      canReuseProvidedSessionId
        ? { sessionId: Number(sessionId), txHash: "" }
        : await (async () => {
            return startSessionOnChain({
              subscriptionId: resolvedSubscriptionId,
              nodeAddress: finalNodeAddress,
              walletAddress: activeWallet,
              sessionPassword,
              rpcUrl,
            });
          })();
    logFlow("runtime.orchestrator.session.ready", {
      walletAddress: activeWallet,
      planId: resolvedPlanId,
      sessionId: startedSession.sessionId,
      txHash: startedSession.txHash || "",
    });

    existingState = (await getWalletDvpnState(activeWallet)) || existingState;
    await setWalletDvpnState(activeWallet, {
      ...existingState,
      sessionRuntime: {
        ...(existingState?.sessionRuntime || {}),
        sessionId: startedSession.sessionId,
        txHash: startedSession.txHash || "",
        providerUrl: finalProviderUrl,
        nodeAddress: finalNodeAddress,
        planId: resolvedPlanId,
        subscriptionId: resolvedSubscriptionId,
        status: "starting",
        activeNode: node || null,
        updatedAt: Date.now(),
      },
    });
    logFlow("runtime.orchestrator.starting_state.persisted", {
      walletAddress: activeWallet,
      sessionId: startedSession.sessionId,
      status: "starting",
    });

    logFlow("runtime.orchestrator.provider.request", {
      walletAddress: activeWallet,
      sessionId: startedSession.sessionId,
      providerUrl: finalProviderUrl,
    });

    const signer = async () =>
      buildProviderSessionSignature({
        walletAddress: activeWallet,
        rawMessage: signerMessage || activeWallet,
        sessionPassword,
      });
    let runtime = null;
    let activeSession = startedSession;
    try {
      runtime = await fetchWireguardRuntimeConfig({
        walletAddress: activeWallet,
        sessionId: activeSession.sessionId,
        providerUrl: finalProviderUrl,
        signer,
        persistConfig: true,
      });
    } catch (providerError) {
      if (!isProviderSessionAlreadyExistsError(providerError)) {
        throw providerError;
      }

      logFlow("runtime.orchestrator.provider_peer_exists.recovering", {
        walletAddress: activeWallet,
        failedSessionId: activeSession.sessionId,
      });

      try {
        await cancelSessionOnChain({
          walletAddress: activeWallet,
          sessionId: activeSession.sessionId,
          sessionPassword,
          rpcUrl,
          suppressErrorNotification: true,
        });
      } catch (cancelError) {
        logFlow("runtime.orchestrator.provider_peer_exists.cancel_failed", {
          walletAddress: activeWallet,
          failedSessionId: activeSession.sessionId,
          message: cancelError?.message || "cancel failed",
        });
      }

      await clearCachedWireguardKeyPair(activeWallet);
      logFlow("runtime.orchestrator.provider_peer_exists.keypair_cleared", {
        walletAddress: activeWallet,
      });

      activeSession = await startSessionOnChain({
        subscriptionId: resolvedSubscriptionId,
        nodeAddress: finalNodeAddress,
        walletAddress: activeWallet,
        sessionPassword,
        rpcUrl,
      });
      await setWalletDvpnState(activeWallet, {
        ...(await getWalletDvpnState(activeWallet)),
        sessionRuntime: {
          sessionId: activeSession.sessionId,
          txHash: activeSession.txHash || "",
          providerUrl: finalProviderUrl,
          nodeAddress: finalNodeAddress,
          planId: resolvedPlanId,
          subscriptionId: resolvedSubscriptionId,
          status: "starting",
          activeNode: node || null,
          updatedAt: Date.now(),
        },
      });
      logFlow("runtime.orchestrator.provider_peer_exists.retrying", {
        walletAddress: activeWallet,
        retrySessionId: activeSession.sessionId,
      });

      runtime = await fetchWireguardRuntimeConfig({
        walletAddress: activeWallet,
        sessionId: activeSession.sessionId,
        providerUrl: finalProviderUrl,
        signer,
        persistConfig: true,
      });
    }

    const current = (await getWalletDvpnState(activeWallet)) || {};
    await setWalletDvpnState(activeWallet, {
      ...current,
      sessionRuntime: {
        sessionId: activeSession.sessionId,
        txHash: activeSession.txHash || "",
        providerUrl: finalProviderUrl,
        nodeAddress: finalNodeAddress,
        planId: resolvedPlanId,
        subscriptionId: resolvedSubscriptionId,
        status: "connected",
        activeNode: node || null,
        updatedAt: Date.now(),
      },
    });
    logFlow("runtime.orchestrator.persisted", {
      walletAddress: activeWallet,
      planId: resolvedPlanId,
      subscriptionId: resolvedSubscriptionId,
      sessionId: activeSession.sessionId,
      providerUrl: finalProviderUrl,
      nodeAddress: finalNodeAddress,
    });

    logFlow("runtime.orchestrator.success", {
      walletAddress: activeWallet,
      sessionId: activeSession.sessionId,
      planId: resolvedPlanId,
    });

    return {
      ...runtime,
      sessionId: activeSession.sessionId,
      txHash: activeSession.txHash || "",
      planId: resolvedPlanId,
      subscriptionId: resolvedSubscriptionId,
      providerUrl: finalProviderUrl,
      nodeAddress: finalNodeAddress,
      node,
    };
  } catch (error) {
    try {
      if (activeWalletScope) {
        const current = (await getWalletDvpnState(activeWalletScope)) || {};
        const runtime = current?.sessionRuntime || {};
        if (runtime?.sessionId) {
          await setWalletDvpnState(activeWalletScope, {
            ...current,
            sessionRuntime: {
              ...runtime,
              status: "failed",
              failedAt: Date.now(),
            },
          });
          logFlow("runtime.orchestrator.failed_state.persisted", {
            walletAddress: activeWalletScope,
            sessionId: runtime?.sessionId,
          });
        }
      }
    } catch (persistError) {
      // Best effort only.
    }
    if (!isPasswordPromptError(error)) {
      notifyDvpnError(error, "Failed to fetch WireGuard runtime config");
    }
    throw error;
  }
};

export const connectVpn = async ({
  providerId,
  countryId,
  cityId,
  serverId,
  walletAddress,
  retrieveRuntimeConfig = false,
  runtimeConfigOptions = {},
  sessionPassword,
}) => {
  try {
    const activeWallet = await ensureDvpnLogin(walletAddress, { sessionPassword });
    const connectPayload = null;
    const requestContext = {
      providerId: providerId || "",
      countryId: countryId || "",
      cityId: cityId || "",
      serverId: serverId || "",
    };
    logFlow("connect.entry", {
      walletAddress: activeWallet,
      retrieveRuntimeConfig,
      requestContext,
      flow: "mobile_runtime_only",
    });

    if (!retrieveRuntimeConfig) {
      return {
        connectPayload,
        requestContext,
      };
    }

    const runtime = await fetchVpnRuntimeConfig({
      walletAddress: activeWallet,
      ...runtimeConfigOptions,
    });

    return {
      connectPayload,
      requestContext,
      wireguardConfig: runtime?.config || "",
      runtime,
    };
  } catch (error) {
    if (!isPasswordPromptError(error)) {
      notifyDvpnError(error, "Failed to connect dVPN session");
    }
    throw error;
  }
};

export const disconnectVpn = async ({
  sessionId,
  walletAddress,
  sessionPassword,
  rpcUrl = DEFAULT_RPC_URL(),
} = {}) => {
  try {
    const activeWallet = await ensureDvpnLogin(walletAddress, { sessionPassword });
    const current = (await getWalletDvpnState(activeWallet)) || {};
    const runtime = current?.sessionRuntime || {};
    const resolvedSessionId = Number(sessionId || runtime?.sessionId || runtime?.lastSessionId || 0);

    logFlow("disconnect.request", {
      walletAddress: activeWallet,
      sessionId: resolvedSessionId || null,
    });

    let cancelTxHash = "";
    if (resolvedSessionId > 0) {
      try {
        const cancelTimeoutMs = 12000;
        const cancelResult = await withTimeout(
          cancelSessionOnChain({
            sessionId: resolvedSessionId,
            walletAddress: activeWallet,
            sessionPassword,
            rpcUrl,
          }),
          cancelTimeoutMs,
          "Session cancel timed out"
        );
        cancelTxHash = cancelResult?.txHash || "";
      } catch (cancelError) {
        if (isPasswordPromptError(cancelError)) {
          throw cancelError;
        }
        if (String(cancelError?.code || "") === "DVPN_TIMEOUT") {
          logFlow("disconnect.cancel.timeout", {
            walletAddress: activeWallet,
            sessionId: resolvedSessionId,
            timeoutMs: 12000,
          });
        }
        logFlow("disconnect.cancel.failed", {
          walletAddress: activeWallet,
          sessionId: resolvedSessionId,
          message: cancelError?.message || "cancel failed",
        });
      }
    }

    await setWalletDvpnState(activeWallet, {
      ...current,
      sessionRuntime: {
        ...runtime,
        sessionId: null,
        txHash: "",
        lastSessionId: null,
        activeNode: null,
        status: "disconnected",
        disconnectedAt: Date.now(),
      },
      wireguard: {
        ...(current?.wireguard || {}),
        lastSessionId: null,
        hasConfig: false,
        updatedAt: Date.now(),
      },
    });
    await clearCachedWireguardKeyPair(activeWallet);

    try {
      const didStopLocalRuntime = await stopLocalVpnRuntime();
      logFlow("disconnect.local_runtime.stop", {
        walletAddress: activeWallet,
        stopped: didStopLocalRuntime,
      });
    } catch (localRuntimeError) {
      logFlow("disconnect.local_runtime.failed", {
        walletAddress: activeWallet,
        message: localRuntimeError?.message || "local runtime stop failed",
      });
    }

    logFlow("disconnect.success", {
      walletAddress: activeWallet,
      sessionId: resolvedSessionId || null,
      cancelTxHash,
    });
    return {
      success: true,
      sessionId: resolvedSessionId || null,
      cancelTxHash,
    };
  } catch (error) {
    if (!isPasswordPromptError(error)) {
      notifyDvpnError(error, "Failed to disconnect dVPN session");
    }
    throw error;
  }
};

export const connectVpnWithWireguardConfig = async ({
  providerId,
  countryId,
  cityId,
  serverId,
  walletAddress,
  runtimeConfigOptions = {},
} = {}) => {
  return connectVpn({
    providerId,
    countryId,
    cityId,
    serverId,
    walletAddress,
    retrieveRuntimeConfig: true,
    runtimeConfigOptions,
  });
};
