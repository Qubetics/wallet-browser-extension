/*global chrome*/

import { buildDvpnUrl, dvpnRoutes } from "./routes";
import {
  getDvpnWalletAddress,
  getWalletDvpnState,
  updateWalletTokens,
} from "./storage";

const getSessionAccounts = async () => {
  try {
    if (!chrome?.storage?.session) return [];
    const result = await chrome.storage.session.get("accounts");
    return result?.accounts || [];
  } catch (error) {
    return [];
  }
};

export const getActiveWalletAddress = async () => {
  const accounts = await getSessionAccounts();
  const active = accounts.find((item) => item?.default) || accounts[0];
  return getDvpnWalletAddress(active);
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
};

const extractTokens = (payload) => {
  const accessToken =
    payload?.accessToken ||
    payload?.access_token ||
    payload?.data?.accessToken ||
    payload?.data?.access_token ||
    "";
  const refreshToken =
    payload?.refreshToken ||
    payload?.refresh_token ||
    payload?.data?.refreshToken ||
    payload?.data?.refresh_token ||
    "";
  return { accessToken, refreshToken };
};

const refreshAccessToken = async (walletAddress, refreshToken) => {
  const response = await fetch(buildDvpnUrl(dvpnRoutes.auth.refresh), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "refresh-token": refreshToken,
    },
  });

  if (!response.ok) {
    throw new Error("dVPN token refresh failed");
  }

  const payload = await parseResponse(response);
  const { accessToken, refreshToken: nextRefreshToken } = extractTokens(payload);

  if (!accessToken) {
    throw new Error("dVPN refresh did not return access token");
  }

  await updateWalletTokens(walletAddress, {
    accessToken,
    refreshToken: nextRefreshToken || refreshToken,
  });

  return accessToken;
};

export const dvpnRequest = async ({
  method = "GET",
  path,
  walletAddress,
  body,
  query,
  withAuth = true,
  retry = true,
  forcedAccessToken,
  extraHeaders = {},
  suppressHttpErrors = false,
}) => {
  const activeWallet =
    getDvpnWalletAddress(walletAddress) || (await getActiveWalletAddress());
  const walletState = activeWallet ? await getWalletDvpnState(activeWallet) : null;
  const accessToken = forcedAccessToken || walletState?.tokens?.accessToken;
  const refreshToken = walletState?.tokens?.refreshToken;

  const queryWithBuster = method === "GET" ? { ...query, _t: Date.now() } : query;
  const searchParams = new URLSearchParams(queryWithBuster || {}).toString();
  const url = buildDvpnUrl(searchParams ? `${path}?${searchParams}` : path);

  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (withAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && retry && activeWallet && refreshToken) {
    const nextAccessToken = await refreshAccessToken(activeWallet, refreshToken);
    return dvpnRequest({
      method,
      path,
      walletAddress: activeWallet,
      body,
      query,
      withAuth,
      retry: false,
      forcedAccessToken: nextAccessToken,
      extraHeaders,
      suppressHttpErrors,
    });
  }

  if (!response.ok) {
    const errorPayload = await parseResponse(response);
    if (suppressHttpErrors) {
      return null;
    }
    const message =
      errorPayload?.message || errorPayload?.error || `dVPN request failed: ${response.status}`;
    throw new Error(message);
  }

  return parseResponse(response);
};
