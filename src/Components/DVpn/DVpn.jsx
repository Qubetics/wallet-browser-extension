import React, { useEffect, useRef, useState } from "react";
import "./DVpn.scss";
import { useNavigate } from "react-router-dom";
import { message, Skeleton } from "antd";
import {
  CrownIcon,
  GreenSwitchIcon,
  ReconnectIcon,
  WalletBlueIcon,
} from "../../Assets/SvgImg";
import USA from "../../Assets/cuntry/usa.svg";
import useCurrentHeight from "../../CustomHooks/useCurrentHeight";
import { useSelector } from "react-redux";
import ModalCustom from "../ModalCustom/ModalCustom";
import InputFieldSimple from "../InputField/InputFieldSimple";
import ButtonComp from "../ButtonComp/ButtonComp";
import { WalletHelper } from "../../helpers/wallet.helper";
import {
  detectOS,
  formatDateTime,
  getActiveSubscription,
  getDaysLeftText,
  getDownloadMap,
  getDurationLabel,
  getSessionLocation,
  normalizeQuickNode,
  normalizeRecentProviders,
  normalizeRecentProvider,
  normalizeRecentSessions,
  normalizeSubscriptions,
} from "../../helpers/dvpn.helpers";
import {
  connectVpnWithWireguardConfig,
  disconnectVpn,
  ensureDvpnLogin,
  findRunningAgent,
  getActiveWalletAddress,
  getAgentStatus,
  getRandomWireguardNode,
  getRecentProviders,
  getRecentSessions,
  getSubscriptions,
  getWalletDvpnState,
  resetNativePendingState,
  startAgentTunnel,
  stopAgentTunnel,
} from "../../services/dvpn";
import DvpnLoader from "../../Assets/JsonFiles/DvpnLoader";

const BUILD_API_BASE = process.env.REACT_APP_BUILD_API_BASE || "";
const VPN_BASE_URL = process.env.REACT_APP_VPN_URL || "";
const VPN_HEALTH_URL = `${VPN_BASE_URL}/health`;
const APP_BASE_URL = process.env.REACT_APP_APP_URL || "";
const DOWNLOAD_MAP = getDownloadMap({
  appBaseUrl: APP_BASE_URL,
  vpnBaseUrl: VPN_BASE_URL,
  vpnHealthUrl: VPN_HEALTH_URL,
});

function DVpn() {
  const height = useCurrentHeight();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [agentReachable, setAgentReachable] = useState(null);
  const [detectedOS, setDetectedOS] = useState("unknown");
  const [downloadingFor, setDownloadingFor] = useState("");
  const [downloadedFileNames, setDownloadedFileNames] = useState({});
  const [authChecking, setAuthChecking] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [sessionPassword, setSessionPassword] = useState("");
  const [activeDvpnWallet, setActiveDvpnWallet] = useState("");
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [recentProvider, setRecentProvider] = useState(null);
  const [recentProviders, setRecentProviders] = useState([]);
  const [recentSessionsData, setRecentSessionsData] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [quickConnectNode, setQuickConnectNode] = useState(null);
  const [homeDataLoading, setHomeDataLoading] = useState(false);
  const [isConnectionLoading, setIsConnectionLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [agentBaseUrl, setAgentBaseUrl] = useState("");
  const [isBuyPlanModalOpen, setIsBuyPlanModalOpen] = useState(false);
  const [isInstallCommandOpen, setIsInstallCommandOpen] = useState(false);
  const [isCommandCopied, setIsCommandCopied] = useState(false);
  const [isAgentUpdateModalOpen, setIsAgentUpdateModalOpen] = useState(false);
  const [agentHealthVersion, setAgentHealthVersion] = useState("");
  const [agentDiag, setAgentDiag] = useState(null);
  const [isServiceLostModalOpen, setIsServiceLostModalOpen] = useState(false);
  const [latestAgentVersion, setLatestAgentVersion] = useState("");
  const [copiedUninstallKey, setCopiedUninstallKey] = useState("");
  const [showRunAfterDownload, setShowRunAfterDownload] = useState(false);
  const [pendingStartNode, setPendingStartNode] = useState(null);
  const [pendingStopSessionId, setPendingStopSessionId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRechecking, setIsRechecking] = useState(false);
  const { account } = useSelector(
    (state) => state
  );
  // console.log("account", account);
  const authToken = account?.jwtToken;
  const isAutoDisconnectingRef = useRef(false);
  const hasShownUpdatePromptRef = useRef(false);
  const sessionPasswordRef = useRef("");
  // Counts consecutive failed agent-reachability checks on macOS.
  // We wait for 2 failures before committing agentReachable=false so the helper
  // has a chance to start up right after installation without the install screen
  // flashing immediately.
  const macosFailCountRef = useRef(0);
  const isRecheckingRef = useRef(false);

  useEffect(() => {
    sessionPasswordRef.current = sessionPassword;
  }, [sessionPassword]);

  const logFlow = () => { };

  const openDownloadUrl = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", "");
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getUrlFromApiResponse = (payload) => {
    if (!payload) return "";
    if (typeof payload === "string") {
      if (payload.startsWith("http")) return payload;
      try {
        const parsed = JSON.parse(payload);
        return getUrlFromApiResponse(parsed);
      } catch (error) {
        return "";
      }
    }
    return (
      payload?.url ||
      payload?.downloadUrl ||
      payload?.download_url ||
      payload?.fileUrl ||
      payload?.file_url ||
      payload?.data?.url ||
      payload?.data?.downloadUrl ||
      payload?.data?.download_url ||
      ""
    );
  };

  const getFileNameFromUrl = (url) => {
    if (!url) return "";
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/");
      return decodeURIComponent(parts[parts.length - 1] || "");
    } catch (error) {
      return "";
    }
  };

  const getCommandWithResolvedFileName = (downloadInfo, field = "cmd") => {
    const rawCmd = downloadInfo?.[field] || "";
    if (!rawCmd) return "";
    const platform = downloadInfo?.buildKey;
    if (!platform) return rawCmd;

    const fileName = downloadedFileNames[platform];
    if (!fileName) return rawCmd;

    if (platform === "linux") {
      return rawCmd.replaceAll("wg-agent_1.0.0_amd64.deb", fileName);
    }
    if (platform === "windows") {
      return rawCmd.replaceAll("wg-agent.exe", fileName);
    }
    if (platform === "macos") {
      return rawCmd.replaceAll("QubeticsVPN-Installer.pkg", fileName);
    }
    return rawCmd;
  };

  const renderHighlightedCommand = (commandStr) => {
    if (!commandStr) return null;
    return commandStr.split("\n").map((line, i, arr) => {
      const trimmed = line.trim();
      const isComment = trimmed.startsWith("#");
      const isLast = i === arr.length - 1;
      return (
        <span key={i} className={isComment ? "bash-comment" : "bash-command"}>
          {line}
          {!isLast && "\n"}
        </span>
      );
    });
  };

  const handleCopyInstallCommand = async (downloadInfo) => {
    const command = getCommandWithResolvedFileName(downloadInfo, "copyCmd") || getCommandWithResolvedFileName(downloadInfo, "cmd");
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      setIsCommandCopied(true);
      setTimeout(() => setIsCommandCopied(false), 1800);
    } catch (error) {
      message.error("Unable to copy command.");
    }
  };

  const handleBuildDownload = async (platform, fallbackHref) => {
    // Resolve relative fallback URLs using APP_BASE_URL
    const resolvedFallback = (fallbackHref && fallbackHref.startsWith("/"))
      ? `${APP_BASE_URL}${fallbackHref}`
      : fallbackHref;

    if (!platform || (platform !== "linux" && platform !== "windows" && platform !== "macos")) {
      if (resolvedFallback) openDownloadUrl(resolvedFallback);
      return;
    }

    // Skip API call if not logged in
    if (!account?.jwtToken) {
      if (resolvedFallback) openDownloadUrl(resolvedFallback);
      return;
    }

    try {
      setDownloadingFor(platform);

      let response = await fetch(`${BUILD_API_BASE}/${platform}`, {
        method: "GET",
        headers: {
          Authorization: account?.jwtToken,
        },
      });
      if (!response.ok) {
        response = await fetch(`${BUILD_API_BASE}/${platform}`, {
          method: "GET",
          headers: {
            Authorization: account?.jwtToken,
          },
        });
      }
      if (!response.ok) {
        throw new Error("Build API request failed");
      }

      const responseText = await response.text();
      const downloadUrl = getUrlFromApiResponse(responseText);
      if (!downloadUrl) {
        throw new Error("Download URL not found in build API response");
      }
      const fileName = getFileNameFromUrl(downloadUrl);
      if (fileName) {
        setDownloadedFileNames((prev) => ({
          ...prev,
          [platform]: fileName,
        }));
      }
      setIsInstallCommandOpen(true);
      openDownloadUrl(downloadUrl);
      setShowRunAfterDownload(true);
    } catch (error) {
      if (resolvedFallback) openDownloadUrl(resolvedFallback);
    } finally {
      setDownloadingFor("");
    }
  };

  const normalizeVersion = (value) => {
    const v = String(value || "").trim();
    const match = v.match(/\d+(\.\d+){0,3}/);
    return match ? match[0] : "";
  };

  const compareVersions = (a, b) => {
    const pa = normalizeVersion(a).split(".").map((x) => Number(x));
    const pb = normalizeVersion(b).split(".").map((x) => Number(x));
    const len = Math.max(pa.length, pb.length, 3);
    for (let i = 0; i < len; i += 1) {
      const na = Number.isFinite(pa[i]) ? pa[i] : 0;
      const nb = Number.isFinite(pb[i]) ? pb[i] : 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  };

  const getLatestBuildVersion = async (platform) => {
    if (!platform || (platform !== "linux" && platform !== "windows" && platform !== "macos")) return "";
    if (!BUILD_API_BASE) return "";
    try {
      const response = await fetch(`${BUILD_API_BASE}/version/latest/${platform}`, {
        method: "GET",
        headers: {
          Authorization: account?.jwtToken,
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return "";
      return (
        payload?.data?.build_version ||
        payload?.data?.buildVersion ||
        payload?.data?.version ||
        payload?.build_version ||
        payload?.buildVersion ||
        payload?.version ||
        ""
      );
    } catch (_error) {
      return "";
    }
  };

  const getUninstallSteps = (platform) => {
    if (platform === "linux") {
      return [
        { key: "linux.stop", label: "Stop the running service", cmd: "sudo systemctl stop wg-agent" },
        {
          key: "linux.disable",
          label: "Prevent it from starting on boot (optional)",
          cmd: "sudo systemctl disable wg-agent",
        },
        { key: "linux.remove", label: "Remove the installed package", cmd: "sudo dpkg -r wg-agent" },
      ];
    }
    if (platform === "windows") {
      return [
        {
          key: "win.close",
          label: "Close and remove old agent",
          cmd: "Close wg-agent if running, then delete the old wg-agent.exe (or uninstall the service if you installed it as one).",
        },
      ];
    }
    return [];
  };

  const handleCopyUninstallStep = async (step) => {
    const cmd = String(step?.cmd || "");
    if (!cmd) return;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedUninstallKey(String(step?.key || "copied"));
      setTimeout(() => setCopiedUninstallKey(""), 1800);
    } catch (_error) {
      message.error("Unable to copy command.");
    }
  };

  const checkAgentHealth = async () => {
    console.log("[dVPN Native] checkAgentHealth called");
    const result = await findRunningAgent();
    console.log("[dVPN Native] checkAgentHealth result:", result);
    const wasReachable = !!agentBaseUrl;
    console.log("[dVPN Native] checkAgentHealth wasReachable:", wasReachable);
    if (result?.reachable && result?.baseUrl) {
      macosFailCountRef.current = 0; // reset grace-period counter on success
      setAgentBaseUrl(result.baseUrl);
      setAgentHealthVersion(normalizeVersion(result?.version || ""));
      setAgentDiag(result?.diag || null);
      if (isServiceLostModalOpen) setIsServiceLostModalOpen(false);
      setAgentReachable(true);
      return true;
    }

    // On macOS give the helper 2 consecutive failures before showing the
    // install screen — but ONLY during initial detection (wasReachable=false).
    // If the agent WAS reachable and now fails, surface it immediately.
    if (detectOS() === "macos" && !wasReachable) {
      macosFailCountRef.current += 1;
      if (macosFailCountRef.current < 2) {
        // Keep agentReachable as null so the "Checking…" banner stays visible.
        setAgentBaseUrl("");
        setAgentHealthVersion("");
        setAgentDiag(null);
        return false;
      }
    }

    // When the agent was previously reachable (wasReachable=true) or the
    // grace period on macOS is exhausted, commit the failure immediately.
    setAgentReachable(false);
    setAgentBaseUrl("");
    setAgentHealthVersion("");
    setAgentDiag(null);
    // Reset native port state so the next health-check opens a fresh connection.
    if (detectOS() === "macos") {
      resetNativePendingState();
    }
    return false;
  };

  useEffect(() => {
    setDetectedOS(detectOS());
    // For macOS, checkAgentHealth honours the grace-period counter internally;
    // only commit agentReachable=false once the counter threshold is reached.
    checkAgentHealth().then((isUp) => {
      if (isUp) setAgentReachable(true);
      // For macOS: if the first check failed, agentReachable stays null while
      // the counter hasn't hit the threshold yet — the polling loop takes over.
      // For other platforms, commit false immediately so the install screen shows.
      else if (detectOS() !== "macos" || macosFailCountRef.current >= 2) {
        setAgentReachable(false);
      }
    });
    return () => {
      // On unmount clear the stale pending-status promise so that the next
      // mount's checkAgentHealth call gets a fresh native status check
      // instead of re-using an old settled (or timed-out) promise.
      resetNativePendingState();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (agentReachable !== true) return;
    if (!detectedOS || (detectedOS !== "linux" && detectedOS !== "windows" && detectedOS !== "macos")) return;
    if (!agentHealthVersion) return;
    if (hasShownUpdatePromptRef.current) return;

    let cancelled = false;
    const checkVersion = async () => {
      const latest = normalizeVersion(await getLatestBuildVersion(detectedOS));
      if (cancelled) return;
      setLatestAgentVersion(latest);
      if (!latest) return;
      if (compareVersions(agentHealthVersion, latest) >= 0) return;
      hasShownUpdatePromptRef.current = true;
      setIsAgentUpdateModalOpen(true);
    };

    checkVersion();
    return () => {
      cancelled = true;
    };
  }, [agentReachable, detectedOS, agentHealthVersion]);

  useEffect(() => {
    let cancelled = false;
    const bootstrapDvpnAuth = async () => {
      if (agentReachable !== true) {
        setAuthChecking(false);
        setIsPasswordModalOpen(false);
        return;
      }
      try {
        setAuthChecking(true);
        const walletAddress = await getActiveWalletAddress();
        if (cancelled) return;
        if (!walletAddress) {
          message.error("No active wallet found for dVPN.");
          navigate("/wallet", { replace: true });
          return;
        }

        setActiveDvpnWallet(walletAddress);
        const state = (await getWalletDvpnState(walletAddress)) || {};
        const accessToken = state?.tokens?.accessToken;
        if (cancelled) return;

        if (accessToken) {
          setAuthChecking(false);
          return;
        }

        setAuthChecking(false);
        setIsPasswordModalOpen(true);
      } catch (error) {
        if (cancelled) return;
        message.error(error?.message || "Unable to open dVPN.");
        navigate("/wallet", { replace: true });
      } finally {
        if (!cancelled) {
          setAuthChecking(false);
        }
      }
    };

    bootstrapDvpnAuth();
    return () => {
      cancelled = true;
    };
  }, [agentReachable, navigate]);

  useEffect(() => {
    console.log("[dVPN Native] checkAgentHealth called313123123");
    // Poll agent health when agent is NOT yet reachable (null = initial, false = went offline).
    // Once the agent comes online, stop polling — the bootstrapDvpnAuth effect handles the rest.
    if (agentReachable === true) return undefined;
    console.log("[dVPN Native] agentReachable agentReachable", agentReachable);
    const intervalMs = agentReachable === false || showRunAfterDownload ? 1000 : 2000;
    console.log("[dVPN Native] intervalMs intervalMs", intervalMs);
    const poll = setInterval(async () => {
      console.log("[dVPN Native] poll poll poll");
      const isUp = await checkAgentHealth();
      console.log("[dVPN Native] isUp isUp", isUp);
      if (isUp) {
        setAgentReachable(true);
        clearInterval(poll);
        console.log("[dVPN Native] clearInterval(poll)");
      } else if (detectOS() === "macos" && macosFailCountRef.current >= 2 && agentReachable === null && !isRecheckingRef.current) {
        // Grace period exhausted — surface the install screen.
        setAgentReachable(false);
        console.log("[dVPN Native] setAgentReachable(false)");
      }
    }, intervalMs);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentReachable]);

  useEffect(() => {
    if (agentReachable !== true || !agentBaseUrl) return undefined;
    let cancelled = false;

    const syncTunnelStatus = async () => {
      try {
        const status = await getAgentStatus(agentBaseUrl);
        if (cancelled) return;
        const isRunning = !!status?.is_running;
        setIsConnected(isRunning);

        if (isRunning || isAutoDisconnectingRef.current || !activeDvpnWallet) {
          return;
        }

        const walletState = (await getWalletDvpnState(activeDvpnWallet)) || {};
        const runtime = walletState?.sessionRuntime || {};
        const staleSessionId = Number(
          currentSessionId || runtime?.sessionId || runtime?.lastSessionId || 0
        );
        const runtimeStatus = String(runtime?.status || "").toLowerCase();
        const hasStaleConnectedSession =
          staleSessionId > 0 && (runtimeStatus === "connected" || runtimeStatus === "starting");

        if (!hasStaleConnectedSession) {
          return;
        }

        isAutoDisconnectingRef.current = true;
        logFlow("ui.agent_status.stale_session_cleanup.start", {
          walletAddress: activeDvpnWallet,
          staleSessionId,
          runtimeStatus,
        });
        try {
          await disconnectVpn({
            walletAddress: activeDvpnWallet,
            sessionId: staleSessionId,
            sessionPassword: sessionPasswordRef.current,
          });
          setCurrentSessionId(null);
          logFlow("ui.agent_status.stale_session_cleanup.success", {
            walletAddress: activeDvpnWallet,
            staleSessionId,
          });
        } catch (cleanupError) {
          logFlow("ui.agent_status.stale_session_cleanup.error", {
            walletAddress: activeDvpnWallet,
            staleSessionId,
            message: cleanupError?.message || "cleanup failed",
          });
        } finally {
          isAutoDisconnectingRef.current = false;
        }
      } catch (error) {
        if (cancelled) return;
        // If the agent/helper became unreachable (e.g. helper removed, host crashed),
        // reset to the install screen so the user can re-download.
        const errMsg = String(error?.message || "").toLowerCase();
        const isAgentGone = errMsg.includes("not reachable") ||
          errMsg.includes("helper not installed") ||
          errMsg.includes("not found") ||
          errMsg.includes("disconnected");
        if (isAgentGone) {
          console.warn("[dVPN] Agent/helper lost during tunnel status poll. Resetting to install screen.");
          setIsConnected(false);
          setAgentReachable(false);
          setAgentBaseUrl("");
          resetNativePendingState();
        }
      }
    };

    syncTunnelStatus();
    const pollIntervalMs = isConnected ? 10000 : 20000;
    const poll = setInterval(syncTunnelStatus, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [agentReachable, agentBaseUrl, activeDvpnWallet, currentSessionId, isConnected]);

  useEffect(() => {
    if (agentReachable !== true || authChecking || isPasswordModalOpen || !activeDvpnWallet) return;
    let cancelled = false;

    const loadHomeData = async () => {
      setHomeDataLoading(true);
      const [providersResult, sessionsResult, subscriptionsResult, quickNodeResult] =
        await Promise.allSettled([
          getRecentProviders(activeDvpnWallet),
          getRecentSessions(activeDvpnWallet),
          getSubscriptions(activeDvpnWallet),
          getRandomWireguardNode(activeDvpnWallet),
        ]);

      if (cancelled) return;

      if (providersResult.status === "fulfilled") {
        setRecentProvider(normalizeRecentProvider(providersResult.value));
        setRecentProviders(normalizeRecentProviders(providersResult.value));
      }
      if (sessionsResult.status === "fulfilled") {
        setRecentSessionsData(normalizeRecentSessions(sessionsResult.value));
      }
      if (subscriptionsResult.status === "fulfilled") {
        const subscriptions = normalizeSubscriptions(subscriptionsResult.value);
        setActiveSubscription(getActiveSubscription(subscriptions));
      }
      if (quickNodeResult.status === "fulfilled") {
        setQuickConnectNode(normalizeQuickNode(quickNodeResult.value));
      } else {
        setQuickConnectNode(null);
      }

      const state = (await getWalletDvpnState(activeDvpnWallet)) || {};
      const runtime = state?.sessionRuntime || {};
      const isRuntimeConnected = String(runtime?.status || "").toLowerCase() === "connected";
      setIsConnected(isRuntimeConnected);
      setCurrentSessionId(runtime?.sessionId || null);
      if (isRuntimeConnected && runtime?.activeNode) {
        setQuickConnectNode(runtime.activeNode);
      }

      setHomeDataLoading(false);
    };

    loadHomeData();
    return () => {
      cancelled = true;
    };
  }, [activeDvpnWallet, agentReachable, authChecking, isPasswordModalOpen, refreshKey]);

  const handlePasswordSubmit = async () => {
    if (!sessionPassword) {
      return message.error("Please enter password.");
    }
    const verified = await WalletHelper.verifyPassword(sessionPassword);
    if (!verified) {
      return message.error("Please enter valid password to proceed.");
    }

    try {
      setIsPasswordSubmitting(true);
      await ensureDvpnLogin(activeDvpnWallet, {
        sessionPassword,
      });
      const nodeToStart = pendingStartNode;
      const sessionToStop = pendingStopSessionId;
      setPendingStartNode(null);
      setPendingStopSessionId(null);
      setIsPasswordModalOpen(false);
      if (nodeToStart) {
        await startConnectionFromNode(nodeToStart, sessionPassword);
      }
      if (sessionToStop) {
        await stopConnection(sessionPassword, sessionToStop);
      }
      setSessionPassword("");
    } catch (error) {
      // Login errors are already surfaced through dVPN error popup helper.
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handlePasswordCancel = () => {
    setSessionPassword("");
    setIsPasswordModalOpen(false);
    setPendingStopSessionId(null);
    if (pendingStartNode) {
      setPendingStartNode(null);
      return;
    }
    navigate("/wallet", { replace: true });
  };

  const selectedDownload = DOWNLOAD_MAP[detectedOS] || DOWNLOAD_MAP.unknown;
  const daysLeftSource = quickConnectNode?.subscriptions || activeSubscription;
  const isQuickNodeAvailable = !!(quickConnectNode?.address || quickConnectNode?.remote_url || quickConnectNode?.url);
  const activeProviderAddress =
    String(
      activeSubscription?.plans?.provider_address ||
      recentProvider?.address ||
      recentProvider?.provider_address ||
      ""
    ).toLowerCase();
  const getProviderAddress = (provider) =>
    String(provider?.address || provider?.provider_address || provider?.prov_address || "").toLowerCase();
  const getProviderPlanId = (provider) =>
    provider?.plan_id ||
    provider?.planId ||
    provider?.subscription?.plan_id ||
    provider?.subscription?.planId ||
    provider?.subscribedPlanIds?.[0] ||
    provider?.subscribed_plan_ids?.[0] ||
    activeSubscription?.plan_id ||
    activeSubscription?.planId ||
    "";
  const connectedRecentServers = (recentProviders.length ? recentProviders : [recentProvider]).filter(Boolean);
  const openProviderServers = (provider) => {
    navigate("/servers", {
      state: {
        providerAddress:
          provider?.address || provider?.provider_address || provider?.prov_address || "",
        providerName: provider?.name || provider?.provider_name || provider?.identity || "",
        planId: getProviderPlanId(provider),
      },
    });
  };

  const toRuntimeOptionsFromNode = (node) => ({
    sessionPassword,
    planId: node?.plan_id || node?.planId || activeSubscription?.plan_id || activeSubscription?.planId,
    subscriptionId:
      node?.subscriptions?.id ||
      node?.subscription_id ||
      node?.subscriptionId ||
      activeSubscription?.id ||
      activeSubscription?.subscription_id ||
      activeSubscription?.subscriptionId ||
      "",
    providerUrl: node?.url || node?.remote_url || node?.node_url || "",
    nodeAddress: node?.node_address || node?.nodeAddress || node?.address || "",
    selectedNode: node,
  });

  const isPasswordRequiredError = (error) => {
    const message = String(error?.message || "").toLowerCase();
    return (
      message.includes("please enter password") ||
      message.includes("unable to unlock wallet") ||
      message.includes("invalid credentials") ||
      message.includes("wallet/password")
    );
  };

  const startConnectionFromNode = async (node, providedPassword = "") => {
    if (!activeDvpnWallet) return;
    console.log("[DVpn] startConnectionFromNode called with node activeDvpnWallet:", activeDvpnWallet);
    console.log("[DVpn] startConnectionFromNode called with node:", node);
    if (!node) {
      logFlow("ui.quickconnect.blocked_no_node", {
        walletAddress: activeDvpnWallet,
      });
      setIsBuyPlanModalOpen(true);
      return;
    }
    try {
      setIsConnectionLoading(true);
      console.log(`[DVpn] Starting connection for node ID: ${node?.id}, Address: ${node?.address}`);
      logFlow("ui.connect.start", {
        walletAddress: activeDvpnWallet,
        nodeId: node?.id || "",
        nodeAddress: node?.address || "",
        providerUrl: node?.url || node?.remote_url || "",
      });

      console.log("[DVpn] Fetching WireGuard config from backend...");
      const result = await connectVpnWithWireguardConfig({
        walletAddress: activeDvpnWallet,
        serverId: node?.id || node?.address || "",
        countryId: node?.country || "",
        cityId: node?.city || "",
        runtimeConfigOptions: {
          ...toRuntimeOptionsFromNode(node),
          ...(providedPassword ? { sessionPassword: providedPassword } : {}),
        },
      });

      const wireguardConfig = result?.wireguardConfig || result?.runtime?.config || "";
      console.log("[DVpn] Backend returned wireguardConfig length:", wireguardConfig.length);
      console.log("[DVpn] Raw wireguardConfig snippet:", wireguardConfig.substring(0, 50).replace(/\n/g, '\\n') + "...");

      if (!wireguardConfig) {
        throw new Error("Missing WireGuard tunnel config");
      }

      console.log("[DVpn] Checking for effective agent base URL...");
      const effectiveAgentBaseUrl =
        agentBaseUrl || (await findRunningAgent()).baseUrl || "";
      console.log("[DVpn] effectiveAgentBaseUrl resolved to:", effectiveAgentBaseUrl);

      if (!effectiveAgentBaseUrl) {
        throw new Error("Local wg-agent is not reachable");
      }
      if (!agentBaseUrl) {
        setAgentBaseUrl(effectiveAgentBaseUrl);
      }

      console.log(`[DVpn] Calling startAgentTunnel onto: ${effectiveAgentBaseUrl}`);
      await startAgentTunnel({
        baseUrl: effectiveAgentBaseUrl,
        config: wireguardConfig,
      });

      console.log("[DVpn] startAgentTunnel call succeeded, checking tunnel status...");

      // On macOS the native host already confirmed connection via the 'connected' event
      // that resolved startAgentTunnel — calling getAgentStatus immediately after would
      // race with the polling loop's own status check and leave the loader stuck.
      // We trust the connect ack and read the cached is_running value instead.
      let isRunning = false;
      if (effectiveAgentBaseUrl === "native") {
        // agent.js already set currentNativeStatus.is_running = true when the
        // "connected" message resolved the connect promise.
        isRunning = true;
      } else {
        const tunnelStatus = await getAgentStatus(effectiveAgentBaseUrl);
        console.log("[DVpn] Initial Tunnel status from getAgentStatus:", tunnelStatus);
        isRunning = !!tunnelStatus?.is_running;
      }
      setIsConnected(isRunning);
      setCurrentSessionId(result?.runtime?.sessionId || null);
      if (result?.runtime?.node) {
        setQuickConnectNode(result.runtime.node);
      }
      logFlow("ui.connect.success", {
        walletAddress: activeDvpnWallet,
        sessionId: result?.runtime?.sessionId || null,
      });
      message.success("dVPN session started.");
      console.log("[DVpn] Connection flow finished successfully.");
    } catch (error) {
      console.error("[DVpn] startConnectionFromNode caught an error:", error);
      console.error("[DVpn] Error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack,
      });
      logFlow("ui.connect.error", {
        walletAddress: activeDvpnWallet,
        code: error?.code || "UNKNOWN",
        message: error?.message || "Failed",
        details: JSON.stringify(error?.details || {}),
      });
      if (isPasswordRequiredError(error)) {
        console.log("[DVpn] Error indicates a password is required. Opening password modal...");
        setPendingStartNode(node);
        setIsPasswordModalOpen(true);
      }
      // Errors are surfaced by service layer.
    } finally {
      setIsConnectionLoading(false);
    }
  };

  const stopConnection = async (providedPassword = "", providedSessionId = null) => {
    const resolvedSessionId = Number(providedSessionId || currentSessionId || 0);
    if (!activeDvpnWallet && !agentBaseUrl) {
      setIsConnected(false);
      return;
    }
    if (!resolvedSessionId && !isConnected) {
      setIsConnected(false);
      return;
    }
    try {
      setIsConnectionLoading(true);
      logFlow("ui.disconnect.start", {
        walletAddress: activeDvpnWallet,
        sessionId: resolvedSessionId || null,
      });
      if (activeDvpnWallet && resolvedSessionId) {
        await disconnectVpn({
          walletAddress: activeDvpnWallet,
          sessionId: resolvedSessionId,
          sessionPassword: providedPassword || sessionPassword,
        });
      }
      const effectiveAgentBaseUrl =
        agentBaseUrl || (await findRunningAgent()).baseUrl || "";
      if (effectiveAgentBaseUrl) {
        await stopAgentTunnel(effectiveAgentBaseUrl);
      }
      setIsConnected(false);
      setCurrentSessionId(null);
      logFlow("ui.disconnect.success", {
        walletAddress: activeDvpnWallet,
        sessionId: resolvedSessionId || null,
      });
      message.success("dVPN session stopped.");
      // Refresh all data after tunnel stops
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      if (isPasswordRequiredError(error)) {
        setPendingStopSessionId(resolvedSessionId || null);
        setIsPasswordModalOpen(true);
      }
      logFlow("ui.disconnect.error", {
        walletAddress: activeDvpnWallet,
        sessionId: resolvedSessionId || null,
        code: error?.code || "UNKNOWN",
        message: error?.message || "Failed",
      });
      // Errors are surfaced by service layer.
    } finally {
      setIsConnectionLoading(false);
    }
  };

  const handleQuickConnectToggle = async () => {
    if (isConnectionLoading) return;
    if (isConnected) {
      await stopConnection();
      return;
    }
    if (!isQuickNodeAvailable) {
      setIsBuyPlanModalOpen(true);
      return;
    }
    console.log("[DVpn] Quick connect node:", quickConnectNode);
    await startConnectionFromNode(quickConnectNode);
  };

  if (agentReachable === true && (authChecking || isPasswordModalOpen)) {
    return (
      <div className={`${"vpn-dashboard"} ${height <= 600 ? "heightExt" : ""}`}>
        {isConnectionLoading && (
          <div className="dvpn-loader-overlay" role="status" aria-live="polite">
            <div className="dvpn-loader-card">
              <DvpnLoader />
              <p>Processing VPN request...</p>
            </div>
          </div>
        )}
        <div className="header">
          <div className="header-content">
            <h2>Qubetics dVPN</h2>
          </div>
        </div>
        <div className="agent-checking-banner">
          {authChecking ? "Preparing dVPN..." : "Enter password to access dVPN."}
        </div>
        <ModalCustom
          title={"Verify Password"}
          handleCancel={handlePasswordCancel}
          isModalOpen={isPasswordModalOpen}
          customClass="customClassModal"
        >
          <div className="viewphrases">
            <InputFieldSimple
              placeholder="Enter Password"
              value={sessionPassword}
              getData={(value) => {
                const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
                if (value.length <= 100 && !hasEmoji) {
                  setSessionPassword(value);
                }
              }}
              customFunction={handlePasswordSubmit}
            />
            <div style={{ marginTop: "10px" }} />
            <ButtonComp
              text={isPasswordSubmitting ? "Submitting..." : "Submit"}
              maxWidth={"100%"}
              onClick={handlePasswordSubmit}
              disabled={isPasswordSubmitting}
            />
          </div>
        </ModalCustom>
      </div>
    );
  }

  return (
    <div className={`${"vpn-dashboard"} ${height <= 600 ? "heightExt" : ""
      }`}>
      {isConnectionLoading && (
        <div className="dvpn-loader-overlay" role="status" aria-live="polite">
          <div className="dvpn-loader-card">
            <DvpnLoader />
            <p>Processing VPN request...</p>
          </div>
        </div>
      )}
      <ModalCustom
        isOpen={isServiceLostModalOpen}
        setIsOpen={setIsServiceLostModalOpen}
        title="VPN Agent Disconnected"
      >
        <div style={{ padding: "10px 0", textAlign: "center" }}>
          <p style={{ color: "#d9d9d9", fontSize: "14px", marginBottom: "20px" }}>
            The local dVPN agent has stopped responding. Please ensure the
            terminal is running and has not been closed.
          </p>
          <ButtonComp
            text="Got it"
            onClick={() => setIsServiceLostModalOpen(false)}
            maxWidth="130px"
          />
        </div>
      </ModalCustom>
      <div className="header">
        <div className="header-content">
          <h2>Qubetics dVPN</h2>
          {/* <p className={`connection-label ${isConnected ? "connected" : ""}`}>
            {isConnected ? "Connected" : "Disconnected"}
          </p> */}
        </div>
        {agentReachable === true && (
          <span
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/service-provider")}
          >
            <CrownIcon />
          </span>
        )}
      </div>

      {agentReachable === true && agentDiag && (
        <div className="agent-diag-warnings">
          {detectedOS === "windows" && agentDiag.wireguard_is_admin === false && (
            <div className="diag-warning">
              ⚠️ WireGuard must be run as Administrator.
            </div>
          )}
          {agentDiag.wireguard_installed === false && (
            <div className="diag-warning">
              ⚠️ WireGuard is not installed.{" "}
              <a
                href="https://download.wireguard.com/windows-client/wireguard-installer.exe"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#fff", textDecoration: "underline" }}
              >
                Download here
              </a>
            </div>
          )}
        </div>
      )}
      {agentReachable === true && agentDiag?.is_admin === false && detectedOS === "windows" && (
        <div className="admin-blocking-overlay">
          <div className="admin-modal-content">
            <span style={{ fontSize: "40px", marginBottom: "16px", display: "block" }}>⚠️</span>
            <h2>Administrator Required</h2>
            <p>
              The dVPN agent must be run as Administrator to function correctly on Windows.
            </p>
            <div className="instruction-step">
              1. Close the current agent window.
            </div>
            <div className="instruction-step">
              2. Right-click <b>wg-agent.exe</b>.
            </div>
            <div className="instruction-step">
              3. Select <b>"Run as administrator"</b>.
            </div>
            <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "20px" }}>
              This screen will automatically refresh once the agent starts with Admin rights.
            </p>
          </div>
        </div>
      )}

      {agentReachable === true && agentDiag?.is_admin !== false && (
        <>
          <div className="status-bar">
            <button className={`status ${isConnected ? "connected" : "disconnected"}`}>
              {isConnected ? "Connected" : "Disconnected"}
            </button>
            <p
              className="days-left"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/service-provider")}
            >
              <WalletBlueIcon />{" "}
              <span>{homeDataLoading ? "Loading..." : getDaysLeftText(daysLeftSource)}</span>
            </p>
          </div>
          <div className="quick-connect-section">
            <div
              className="switch"
              style={{ cursor: "pointer" }}
              onClick={handleQuickConnectToggle}
            >
              <GreenSwitchIcon />
            </div>
            <h3>{isConnected ? "" : "Quick Connect"}</h3>
            {!isConnected && (
              <p className="quick-node-name">
                {homeDataLoading ? (
                  // <Skeleton.Input className="dvpn-skeleton-wave" active size="small" style={{ width: 180 }} /> 
                  "-"
                ) : (
                  [quickConnectNode?.country, quickConnectNode?.city]
                    .filter(Boolean)
                    .join(" - ") ||
                  quickConnectNode?.remote_url ||
                  quickConnectNode?.address ||
                  "Wireguard node"
                )}
              </p>
            )}
          </div>
        </>
      )}
      {agentReachable === null && (
        <div className="agent-checking-banner">🔍 Checking local VPN agent...</div>
      )}

      {agentReachable === false && (
        <div className="agent-install-container">
          <div className="install-card">
            <h3>VPN Agent Not Found</h3>
            <p className="install-desc">
              {detectedOS === "macos"
                ? "The Qubetics macOS application is required to manage secure VPN connections on your Mac."
                : "We could not reach the local agent on ports 51821-51830. Install it and this screen will auto-recover when the service comes online."}
            </p>

            <div className="install-actions">
              <button
                className="dvpn-solid-btn"
                onClick={() => handleBuildDownload(selectedDownload.buildKey, selectedDownload.href)}
              >
                {downloadingFor === selectedDownload.buildKey ? "Preparing..." : `Download for ${selectedDownload.label}`}
              </button>
              {detectedOS === "macos" && (
                <button
                  className="dvpn-outline-btn"
                  style={{ marginTop: 10 }}
                  disabled={isRechecking}
                  onClick={() => {
                    setIsRechecking(true);
                    isRecheckingRef.current = true;
                    macosFailCountRef.current = 0;
                    resetNativePendingState();
                    setAgentReachable(null);
                    // Use a slight delay to ensure Chrome has time to "notice" the socket closure
                    // before we try a fresh connection.
                    setTimeout(() => {
                      checkAgentHealth().then((isUp) => {
                        setIsRechecking(false);
                        isRecheckingRef.current = false;
                        if (isUp) {
                          setAgentReachable(true);
                          message.success("VPN Agent detected!");
                        } else {
                          // Allow it to stay in "Not Found" state if still fails
                          if (macosFailCountRef.current >= 2) setAgentReachable(false);
                          message.info("Agent still not detected. Please make sure the installation finished.");
                        }
                      });
                    }, 1000);
                  }}
                >
                  {isRechecking ? "Searching..." : "🔄 Already installed? Recheck"}
                </button>
              )}
            </div>

            <div className="install-guide-section">
              <details className="agent-install-steps" open>
                <summary>{detectedOS === "macos" ? "Installation guide" : "Install and run command"}</summary>
                <div className="guide-content">
                  {selectedDownload.guide && (
                    <ol className="install-steps-list">
                      {selectedDownload.guide.map((step, index) => (
                        <li key={`${detectedOS}-guide-${index}`}>{step}</li>
                      ))}
                    </ol>
                  )}
                  {selectedDownload.cmd && detectedOS !== "macos" && (
                    <div className="command-box-wrapper">
                      <button
                        type="button"
                        className="dvpn-outline-btn"
                        onClick={() => handleCopyInstallCommand(selectedDownload)}
                      >
                        {isCommandCopied ? "Copied" : "Copy command"}
                      </button>
                      <div
                        className="command-box"
                        onClick={() => handleCopyInstallCommand(selectedDownload)}
                      >
                        <pre>
                          {renderHighlightedCommand(
                            getCommandWithResolvedFileName(selectedDownload)
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {agentReachable === true && isConnected ? (
        <>
          <div className="connected-status-card">
            <div>
              <p className="label">Status</p>
              <h4>Connected</h4>
            </div>
            <span className="protected">Protected</span>
          </div>

          <div className="connected-location-card">
            <div className="left">
              <span className="globe">◎</span>
              <div>
                <h5>
                  {quickConnectNode?.location ||
                    [quickConnectNode?.country, quickConnectNode?.city]
                      .filter(Boolean)
                      .join(", ") ||
                    quickConnectNode?.node_name ||
                    "Connected node"}
                </h5>
                <p>
                  {quickConnectNode?.remote_url ||
                    quickConnectNode?.subscriptions?.status ||
                    quickConnectNode?.node_status ||
                    "Node active"}
                </p>
              </div>
            </div>
          </div>

          <div className="recent-servers">
            <div className="recent-title">
              <h3>Recent Servers</h3>
              <span className="view-all" onClick={() => navigate("/service-provider")}>
                View all
              </span>
            </div>

            {connectedRecentServers.length ? (
              connectedRecentServers.slice(0, 2).map((provider, index) => (
                <div
                  className="server-item"
                  key={`${provider?.address || provider?.provider_address || "provider"}-${index}`}
                  onClick={() => openProviderServers(provider)}
                >
                  <div className="server-main">
                    <div className="server-meta">
                      <h4>
                        {provider?.name ||
                          provider?.provider_name ||
                          provider?.identity ||
                          provider?.address ||
                          "Provider"}
                      </h4>
                      <p>{provider?.countryCount || provider?.country_count || 0} Locations</p>
                    </div>
                  </div>
                  {!!provider?.isUserSubscribed && <span className="server-badge">Subscribed</span>}
                </div>
              ))
            ) : (
              <div className="server-item">
                <div className="server-main">
                  <div className="server-meta">
                    <h4>No recent servers</h4>
                    <p>Your latest providers will appear here.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : agentReachable === true ? (
        <>
          {/* <div className="country-list">
            <h3>Country List</h3>
            <div className="countryInner">
              <div className="country">
                {" "}
                <img src={USA} alt="usa" />
                USA
              </div>
              <div className="country">
                {" "}
                <img src={Germany} alt="germany" />
                Germany
              </div>
              <div className="country">
                {" "}
                <img src={Japan} alt="japan" />
                Japan
              </div>
            </div>
          </div> */}
          <div className="recent-sessions">
            <div className="recent-title">
              <h3>Recent Providers</h3>
              <span
                className="view-all"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/service-provider")}
              >
                View all
              </span>
            </div>
            <div className="provider-grid-row">
              {homeDataLoading ? (
                <Skeleton.Input className="dvpn-skeleton-wave" active size="small" style={{ width: 180 }} />
              ) : (
                (recentProviders.length ? recentProviders : [recentProvider]).map((provider, index) => (
                  <div
                    className={`provider-pill ${(activeProviderAddress && getProviderAddress(provider) === activeProviderAddress) ||
                      (!activeProviderAddress && index === 0)
                      ? "selected"
                      : ""
                      }`}
                    key={`${provider?.address || provider?.provider_address || provider?.identity || "provider"}-${index}`}
                    onClick={() => navigate("/service-provider")}
                  >
                    {provider?.name ||
                      provider?.provider_name ||
                      provider?.identity ||
                      provider?.provider_address ||
                      provider?.address ||
                      activeSubscription?.plans?.providers?.name ||
                      activeSubscription?.plans?.provider_address ||
                      "No recent provider"}
                  </div>
                ))
              )}
            </div>

            {/* {(recentProvider || activeSubscription) && (
              <p className="provider-meta">
                {recentProvider?.provider_address ||
                  recentProvider?.address ||
                  recentProvider?.providerAddress ||
                  activeSubscription?.plans?.provider_address ||
                  ""}
                {recentProvider?.plan_id || recentProvider?.planId || activeSubscription?.plan_id
                  ? ` | Plan: ${
                      recentProvider?.plan_id ||
                      recentProvider?.planId ||
                      activeSubscription?.plan_id
                    }`
                  : ""}
                {typeof recentProvider?.subscribed !== "undefined"
                  ? ` | Subscribed: ${recentProvider?.subscribed ? "Yes" : "No"}`
                  : activeSubscription?.status
                    ? ` | Status: ${activeSubscription?.status}`
                  : ""}
              </p>
            )} */}

            <div className="recent-title">
              <h3>Recent Sessions</h3>
              <span
                className="view-all"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/recentSessions")}
              >
                View all
              </span>
            </div>
            <div className="mutliSession">
              {homeDataLoading && (
                <>
                  <div className="session">
                    <Skeleton className="dvpn-skeleton-wave" active paragraph={{ rows: 2 }} title={false} />
                  </div>
                  <div className="session">
                    <Skeleton className="dvpn-skeleton-wave" active paragraph={{ rows: 2 }} title={false} />
                  </div>
                </>
              )}
              {!homeDataLoading && recentSessionsData.length === 0 && (
                <div className="session">
                  <div className="session-inner">
                    <div className="session-info">
                      <div className="flag">
                        <img src={USA} alt="session" />
                      </div>
                      <div className="location-time">
                        <h5>No recent sessions</h5>
                        <p>Your latest sessions will appear here.</p>
                      </div>
                    </div>
                    <div className="duration">-</div>
                  </div>
                </div>
              )}
              {recentSessionsData.map((session, index) => (
                <div
                  className="session"
                  key={`${session?.id || session?.subscription_id || "recent"}-${index}`}
                >
                  <div className="session-inner">
                    <div className="session-info">
                      <div className="flag">
                        <img src={session?.nodes?.flag_url || USA} alt="session" />
                      </div>
                      <div className="location-time">
                        <h5>{getSessionLocation(session)}</h5>
                        <p>
                          {formatDateTime(
                            session?.start_at ||
                            session?.start_time ||
                            session?.started_at ||
                            session?.created_at ||
                            session?.createdAt
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="duration">{getDurationLabel(session)}</div>
                  </div>
                  <button
                    className="reconnect-btn"
                    onClick={() => startConnectionFromNode(quickConnectNode)}
                    disabled={isConnectionLoading}
                  >
                    <ReconnectIcon />
                    {session?.reconnect_metadata ||
                      session?.reconnectMeta ||
                      session?.session_id ||
                      session?.id
                      ? "Reconnect"
                      : "Reconnect"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
      <ModalCustom
        title={"No Active Plan Found"}
        handleCancel={() => setIsBuyPlanModalOpen(false)}
        isModalOpen={isBuyPlanModalOpen}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <p style={{ marginBottom: 12, marginLeft: 30 }}>
            Please buy an active dVPN plan first to start a session.
          </p>
          <button
            className="dvpn-solid-btn"
            onClick={() => {
              setIsBuyPlanModalOpen(false);
              navigate("/service-provider");
            }}
          >
            Buy Plan
          </button>
        </div>
      </ModalCustom>

      <ModalCustom
        title={"Update VPN Agent"}
        handleCancel={() => setIsAgentUpdateModalOpen(false)}
        isModalOpen={isAgentUpdateModalOpen}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <p style={{ marginBottom: 12, color: "#fff" }}>
            Your local VPN agent is outdated.
            {agentHealthVersion ? ` Current: ${agentHealthVersion}.` : ""}
            {latestAgentVersion ? ` Latest: ${latestAgentVersion}.` : ""}
          </p>

          <p style={{ marginBottom: 8, fontWeight: 600, color: "#fff" }}>Remove old agent</p>
          <div style={{ display: "grid", gap: 10, marginBottom: 8 }}>
            {getUninstallSteps(detectedOS).map((step) => (
              <div
                key={step.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: detectedOS === "windows" ? "1fr" : "1fr auto",
                  gap: 10,
                  alignItems: "start",
                }}
              >
                <div>
                  <div style={{ color: "#cfcdd6", fontSize: 12, marginBottom: 6 }}>
                    {step.label}
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: 10,
                      borderRadius: 10,
                      background: "rgba(0,0,0,0.35)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#fff",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {step.cmd}
                  </pre>
                </div>
                {detectedOS !== "windows" && (
                  <button
                    type="button"
                    className="agent-copy-btn"
                    onClick={() => handleCopyUninstallStep(step)}
                    style={{ width: "auto", minWidth: 72 }}
                  >
                    {copiedUninstallKey === step.key ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }} />
          <button
            className="dvpn-solid-btn"
            onClick={() => {
              const download = DOWNLOAD_MAP[detectedOS] || DOWNLOAD_MAP.unknown;
              if (download?.buildKey) {
                handleBuildDownload(download.buildKey, download.href);
              }
              setIsInstallCommandOpen(true);
              setShowRunAfterDownload(true);
            }}
          >
            Download latest agent
          </button>

          {showRunAfterDownload && (DOWNLOAD_MAP[detectedOS] || DOWNLOAD_MAP.unknown)?.cmd && detectedOS !== "macos" && (
            <>
              <div style={{ marginTop: 14 }} />
              <p style={{ marginBottom: 8, fontWeight: 600, color: "#fff" }}>
                After download, run this command
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                <button
                  type="button"
                  className="agent-copy-btn"
                  onClick={() => handleCopyInstallCommand(DOWNLOAD_MAP[detectedOS] || DOWNLOAD_MAP.unknown)}
                  style={{ width: "auto", minWidth: 96 }}
                >
                  {isCommandCopied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 10,
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  whiteSpace: "pre-wrap",
                }}
              >
                {renderHighlightedCommand(getCommandWithResolvedFileName(DOWNLOAD_MAP[detectedOS] || DOWNLOAD_MAP.unknown))}
              </pre>
            </>
          )}
        </div>
      </ModalCustom>
    </div>
  );
}

export default DVpn;
