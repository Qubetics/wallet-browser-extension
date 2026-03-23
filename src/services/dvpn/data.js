/*global chrome*/

import { dvpnRequest, getActiveWalletAddress } from "./client";
import { dvpnRoutes, withParams } from "./routes";
import { getDvpnWalletAddress, getWalletDvpnState, setWalletDvpnState } from "./storage";
import { ensureDvpnLogin } from "./auth";
import { notifyDvpnError } from "./errors";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES_PER_WALLET = 60;
const CACHE_MAX_BYTES_PER_WALLET = 300 * 1024;

const pruneCache = (cache = {}) => {
  const now = Date.now();
  const freshEntries = Object.entries(cache || {}).filter(([, entry]) => {
    const updatedAt = Number(entry?.updatedAt || 0);
    return Number.isFinite(updatedAt) && now - updatedAt <= CACHE_TTL_MS;
  });

  const sorted = freshEntries.sort(
    (a, b) => Number(b?.[1]?.updatedAt || 0) - Number(a?.[1]?.updatedAt || 0)
  );

  let kept = sorted.slice(0, CACHE_MAX_ENTRIES_PER_WALLET);
  while (kept.length > 0) {
    const candidate = Object.fromEntries(kept);
    const approxBytes = JSON.stringify(candidate).length;
    if (approxBytes <= CACHE_MAX_BYTES_PER_WALLET) {
      return candidate;
    }
    kept = kept.slice(0, kept.length - 1);
  }

  return {};
};

const saveCache = async (walletAddress, cacheKey, payload) => {
  if (!walletAddress || !cacheKey) return;
  const current = (await getWalletDvpnState(walletAddress)) || {};
  const nextCache = {
    ...(current.cache || {}),
    [cacheKey]: {
      payload,
      updatedAt: Date.now(),
    },
  };
  const cache = pruneCache(nextCache);
  await setWalletDvpnState(walletAddress, {
    ...current,
    cache,
  });
};

const WALLET_API_BASE = process.env.REACT_APP_BASE_URL;

const getWalletJwtToken = async (walletAddress) => {
  try {
    if (typeof chrome === "undefined" || !chrome?.storage?.session) return "";
    const result = await chrome.storage.session.get("accounts");
    const accounts = Array.isArray(result?.accounts) ? result.accounts : [];
    if (!accounts.length) return "";

    const activeAccount = accounts.find((item) => item?.default) || accounts[0];
    const normalizedWallet = String(walletAddress || "").toLowerCase();
    const matchedAccount = accounts.find(
      (item) => String(getDvpnWalletAddress(item) || "").toLowerCase() === normalizedWallet
    );

    return matchedAccount?.jwtToken || activeAccount?.jwtToken || "";
  } catch (error) {
    return "";
  }
};

export const getProviders = async (walletAddress) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const payload = await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.data.providers,
      walletAddress,
    });
    await saveCache(walletAddress, "providers", payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load dVPN providers");
    throw error;
  }
};

export const getAllProviders = async (walletAddress) => {
  return getProviders(walletAddress);
};

export const getCountries = async (providerId, walletAddress) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const payload = await dvpnRequest({
      method: "GET",
      path: withParams(dvpnRoutes.data.countries, { providerId }),
      walletAddress,
    });
    await saveCache(walletAddress, `countries:${providerId}`, payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load dVPN countries");
    throw error;
  }
};

export const getCities = async (providerId, countryId, walletAddress) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const payload = await dvpnRequest({
      method: "GET",
      path: withParams(dvpnRoutes.data.cities, { providerId, countryId }),
      walletAddress,
    });
    await saveCache(walletAddress, `cities:${providerId}:${countryId}`, payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load dVPN cities");
    throw error;
  }
};

export const getRecentProviders = async (walletAddress) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const payload = await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.data.recentProviders,
      walletAddress,
    });
    await saveCache(walletAddress, "recentProviders", payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load recent dVPN providers");
    throw error;
  }
};

export const getRecentSessions = async (walletAddress) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const query = {
      limit: 4,
      page: 1,
      order: "DESC",
    };
    const payload = await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.data.recentSessions,
      walletAddress,
      query,
    });
    await saveCache(walletAddress, "recentSessions:4:1:DESC", payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load recent dVPN sessions");
    throw error;
  }
};

export const getUserSessions = async (
  walletAddress,
  { limit = 10, page = 1, order = "DEC" } = {}
) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const payload = await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.data.recentSessions,
      walletAddress,
      query: { limit, page, order },
    });
    await saveCache(walletAddress, `userSessions:${limit}:${page}:${order}`, payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load dVPN sessions");
    throw error;
  }
};

export const getSubscriptions = async (walletAddress) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const query = {
      limit: 5,
      page: 1,
      order: "DESC",
    };
    const payload = await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.data.subscriptions,
      walletAddress,
      query,
    });
    await saveCache(walletAddress, "subscriptions:5:1:DESC", payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load dVPN subscriptions");
    throw error;
  }
};

export const getUserSubscriptions = async (
  walletAddress,
  { limit = 5, page = 1, order = "DESC" } = {}
) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const payload = await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.data.subscriptions,
      walletAddress,
      query: { limit, page, order },
    });
    await saveCache(walletAddress, `subscriptions:${limit}:${page}:${order}`, payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load dVPN subscriptions");
    throw error;
  }
};

export const getRenewPlanList = async (
  walletAddress,
  { limit = 10, page = 1 } = {}
) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const payload = await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.data.subscriptionRenew,
      walletAddress,
      query: { limit, page },
    });
    await saveCache(walletAddress, `subscriptionRenew:${limit}:${page}`, payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load renewable plans");
    throw error;
  }
};

export const getSessionTxnHistory = async (
  walletAddress,
  { limit = 10, page = 1 } = {}
) => {
  try {
    const activeWallet = walletAddress || (await getActiveWalletAddress());
    if (!activeWallet) {
      throw new Error("No active wallet found");
    }
    const walletJwtToken = await getWalletJwtToken(activeWallet);
    if (!walletJwtToken) {
      throw new Error("Wallet JWT token is missing");
    }

    const response = await fetch(`${WALLET_API_BASE}/dvpn/sessionHistory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: walletJwtToken,
      },
      body: JSON.stringify({ limit, page }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.message || "Failed to load transaction history";
      throw new Error(message);
    }

    await saveCache(activeWallet, `sessionTxnHistory:${limit}:${page}`, payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load transaction history");
    throw error;
  }
};

export const getNodes = async (
  walletAddress,
  {
    limit = 10,
    page = 1,
    order = "ASC",
    reverse = false,
    plan_id,
    country,
    city,
    protocol = "wireguard",
  } = {}
) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const query = {
      limit,
      page,
      order,
      reverse,
      protocol,
      ...(plan_id ? { plan_id } : {}),
      ...(country ? { country } : {}),
      ...(city ? { city } : {}),
    };
    const payload = await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.data.nodes,
      walletAddress,
      query,
    });
    const cacheKey = `nodes:${plan_id || "none"}:${country || "all"}:${city || "all"}:${protocol}:${order}:${page}:${limit}:${reverse}`;
    await saveCache(walletAddress, cacheKey, payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load dVPN nodes");
    throw error;
  }
};

export const getProviderPlans = async (
  walletAddress,
  { providerAddress, limit = 10, page = 1, order = "ASC", reverse = false, protocol = "wireguard" } = {}
) => {
  try {
    await ensureDvpnLogin(walletAddress);
    if (!providerAddress) {
      throw new Error("Provider address is required");
    }
    const payload = await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.data.plans,
      walletAddress,
      query: {
        limit,
        page,
        prov_address: providerAddress,
        order,
        reverse,
        protocol,
      },
    });
    await saveCache(walletAddress, `plans:${providerAddress}:${protocol}:${order}:${page}:${limit}:${reverse}`, payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load provider plans");
    throw error;
  }
};

export const getRandomWireguardNode = async (walletAddress) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const payload = await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.data.randomNode,
      walletAddress,
      query: {
        protocol: "wireguard",
      },
    });
    await saveCache(walletAddress, "randomNode:wireguard", payload);
    return payload;
  } catch (error) {
    const errMessage = String(error?.message || "").toLowerCase();
    if (errMessage.includes("no nodes found for this wallet address")) {
      await saveCache(walletAddress, "randomNode:wireguard", {
        message: "No nodes found for this wallet address",
        status: 404,
        data: null,
      });
      return null;
    }
    notifyDvpnError(error, "Failed to load quick connect node");
    throw error;
  }
};

export const getHistory = async ({ type, walletAddress }) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const payload = await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.data.history,
      walletAddress,
      query: type ? { type } : undefined,
    });
    await saveCache(walletAddress, type ? `history:${type}` : "history", payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load dVPN history");
    throw error;
  }
};

export const getTopupData = async (walletAddress) => {
  try {
    await ensureDvpnLogin(walletAddress);
    const payload = await dvpnRequest({
      method: "GET",
      path: dvpnRoutes.data.topup,
      walletAddress,
    });
    await saveCache(walletAddress, "topup", payload);
    return payload;
  } catch (error) {
    notifyDvpnError(error, "Failed to load dVPN top-up data");
    throw error;
  }
};
