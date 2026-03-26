/*global chrome*/

import { getWalletDvpnState, setWalletDvpnState } from "./storage";
import nacl from "tweetnacl";
import { detectOS } from "../../helpers/dvpn.helpers";

const DEFAULT_DNS = "1.1.1.1";
const DEFAULT_MTU = 1420;
const DEFAULT_ALLOWED_IPS = "0.0.0.0/0,::/0";
const DEFAULT_KEEPALIVE = 30;

const logFlow = () => {};

const createDvpnError = (code, message, details = {}) => {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
};

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

const toProviderErrorMessage = (body, fallback = "") => {
  if (typeof body === "string") return body;
  if (!isObject(body)) return fallback;
  const nestedError = body?.error;
  if (typeof nestedError === "string") return nestedError;
  if (isObject(nestedError) && nestedError?.message) return String(nestedError.message);
  if (typeof body?.message === "string") return body.message;
  if (isObject(body?.message) && body?.message?.message) return String(body.message.message);
  return fallback;
};

const parseProviderBusinessError = (body, context = {}) => {
  if (!isObject(body)) return null;
  const nestedError = isObject(body?.error) ? body.error : null;
  const providerCodeRaw = nestedError?.code ?? body?.code;
  const providerCode = Number(providerCodeRaw);
  const message = String(nestedError?.message || body?.message || body?.error || "").trim();
  const hasBusinessFailure =
    body?.success === false ||
    !!nestedError ||
    (Number.isFinite(providerCode) && providerCode > 0 && !!message);
  if (!hasBusinessFailure) return null;

  if (
    providerCode === 5 ||
    /session already exists for peer_key/i.test(message) ||
    /already exists for peer/i.test(message)
  ) {
    return createDvpnError("DVPN_PROVIDER_SESSION_ALREADY_EXISTS", message || "Provider session already exists", {
      providerCode: Number.isFinite(providerCode) ? providerCode : null,
      ...context,
      body,
    });
  }

  return createDvpnError("DVPN_PROVIDER_SESSION_BUSINESS_FAILED", message || "Provider rejected session request", {
    providerCode: Number.isFinite(providerCode) ? providerCode : null,
    ...context,
    body,
  });
};

const bytesToBase64 = (bytes) => {
  if (typeof btoa === "function") {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  throw createDvpnError("DVPN_BASE64_UNAVAILABLE", "Base64 encoder unavailable");
};

const base64ToBytes = (value) => {
  if (typeof atob === "function") {
    const binary = atob(value);
    return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  }
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(value, "base64"));
  }
  throw createDvpnError("DVPN_BASE64_UNAVAILABLE", "Base64 decoder unavailable");
};

const utf8ToBase64 = (value) => {
  const input = String(value ?? "");
  if (typeof TextEncoder !== "undefined") {
    return bytesToBase64(new TextEncoder().encode(input));
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf-8").toString("base64");
  }
  throw createDvpnError("DVPN_TEXT_ENCODER_UNAVAILABLE", "UTF-8 encoder unavailable");
};

const base64ToUtf8 = (value) => {
  if (!value) return "";
  const bytes = base64ToBytes(value);
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(bytes);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("utf-8");
  }
  throw createDvpnError("DVPN_TEXT_DECODER_UNAVAILABLE", "UTF-8 decoder unavailable");
};

const parseBody = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
};

const shouldRetryProviderCall = (error, status) => {
  if (status === 429) return true;
  if (Number.isFinite(status) && status >= 500) return true;
  if (!status && error) return true;
  return false;
};

const normalizeProviderUrl = (providerUrl) => {
  let normalized = String(providerUrl || "").trim().replace(/\/+$/, "");
  // If it starts with "https:", replace with "http:" and return
  if (/^https:/.test(normalized)) {
    normalized = normalized.replace(/^https:/, "http:");
    return normalized;
  }
  return normalized;
};

const getGlobalRef = () => {
  if (typeof window !== "undefined") return window;
  return {};
};

const resolveNativeWgGenerator = () => {
  const globalRef = getGlobalRef();
  if (typeof globalRef?.WireGuardNative?.generateWGKeyPair === "function") {
    return () => globalRef.WireGuardNative.generateWGKeyPair();
  }
  if (typeof globalRef?.wireguard?.generateKeyPair === "function") {
    return () => globalRef.wireguard.generateKeyPair();
  }
  return null;
};

const clampX25519PrivateKey = (privateKeyBytes) => {
  const key = Uint8Array.from(privateKeyBytes || []);
  if (key.length !== 32) {
    throw createDvpnError("DVPN_WG_KEYPAIR_INVALID", "WireGuard private key must be 32 bytes");
  }
  key[0] &= 248;
  key[31] &= 127;
  key[31] |= 64;
  return key;
};

const generateLocalWgKeyPair = () => {
  const rawPrivate = nacl.randomBytes(32);
  const privateKeyBytes = clampX25519PrivateKey(rawPrivate);
  const publicKeyBytes = nacl.scalarMult.base(privateKeyBytes);
  return {
    publicKey: bytesToBase64(publicKeyBytes),
    privateKey: bytesToBase64(privateKeyBytes),
  };
};

export const decodeProviderSessionData = (resultDataBase64) => {
  if (!resultDataBase64) {
    throw createDvpnError(
      "DVPN_PROVIDER_RESULT_DATA_MISSING",
      "Missing result.data in provider response"
    );
  }

  let decodedText = "";
  let parsed = null;
  try {
    decodedText = base64ToUtf8(resultDataBase64);
  } catch (error) {
    throw createDvpnError("DVPN_CONFIG_DECODE_FAILED", "Failed to decode provider config payload");
  }

  try {
    parsed = JSON.parse(decodedText);
  } catch (error) {
    throw createDvpnError("DVPN_CONFIG_PARSE_FAILED", "Decoded provider config payload is not valid JSON");
  }

  if (!isObject(parsed)) {
    throw createDvpnError("DVPN_CONFIG_SHAPE_INVALID", "Decoded provider config must be an object");
  }

  return parsed;
};

export const buildWireguardConfigFromSessionResponse = ({ sessionResponse, privateKey }) => {
  if (!privateKey) {
    throw createDvpnError("DVPN_WG_PRIVATE_KEY_MISSING", "Missing client private key");
  }
  if (!isObject(sessionResponse)) {
    throw createDvpnError("DVPN_PROVIDER_RESPONSE_INVALID", "Missing provider session response");
  }

  const responseResult = sessionResponse?.result;
  const decodedPayload = decodeProviderSessionData(responseResult?.data);

  const address = decodedPayload?.addrs?.[0];
  const metadata = decodedPayload?.metadata?.[0];
  const serverPublicKey = metadata?.public_key;
  const port = metadata?.port;
  const endpointHost = responseResult?.addrs?.[0];

  if (!address) {
    throw createDvpnError("DVPN_CONFIG_ADDRESS_MISSING", "Missing addrs[0] in decoded provider config");
  }
  if (!serverPublicKey) {
    throw createDvpnError(
      "DVPN_CONFIG_SERVER_PUBLIC_KEY_MISSING",
      "Missing metadata[0].public_key in decoded provider config"
    );
  }
  if (!port) {
    throw createDvpnError("DVPN_CONFIG_PORT_MISSING", "Missing metadata[0].port in decoded provider config");
  }
  if (!endpointHost) {
    throw createDvpnError(
      "DVPN_CONFIG_ENDPOINT_HOST_MISSING",
      "Missing result.addrs[0] in provider response"
    );
  }

  return `[Interface]
PrivateKey = ${privateKey}
Address = ${address}
DNS = ${DEFAULT_DNS}
MTU = ${DEFAULT_MTU}

[Peer]
PublicKey = ${serverPublicKey}
AllowedIPs = ${DEFAULT_ALLOWED_IPS}
Endpoint = ${endpointHost}:${port}
PersistentKeepalive = ${DEFAULT_KEEPALIVE}`;
};

export const buildProviderSessionPayload = ({ sessionId, pubKey, signature, wgPublicKey }) => {
  const numericSessionId = Number(sessionId);
  if (!Number.isFinite(numericSessionId) || numericSessionId <= 0) {
    throw createDvpnError("DVPN_SESSION_ID_MISSING", "sessionId is required to start provider session");
  }
  if (!pubKey) {
    throw createDvpnError("DVPN_PROVIDER_PUBKEY_MISSING", "Signer public key is required");
  }
  if (!signature) {
    throw createDvpnError("DVPN_PROVIDER_SIGNATURE_MISSING", "Signer signature is required");
  }
  if (!wgPublicKey) {
    throw createDvpnError("DVPN_WG_PUBLIC_KEY_MISSING", "WireGuard public key is required");
  }

  return {
    id: numericSessionId,
    pub_key: `ethsecp256k1:${pubKey}`,
    data: utf8ToBase64(JSON.stringify({ public_key: wgPublicKey })),
    signature,
  };
};

export const startProviderSession = async ({
  providerUrl,
  payload,
  maxAttempts = 3,
  backoffBaseMs = 400,
}) => {
  const normalizedProviderUrl = normalizeProviderUrl(providerUrl);
  if (!normalizedProviderUrl) {
    throw createDvpnError("DVPN_PROVIDER_URL_MISSING", "Provider URL is required");
  }
  if (!isObject(payload)) {
    throw createDvpnError("DVPN_PROVIDER_PAYLOAD_INVALID", "Provider payload is required");
  }

  let lastError = null;
  logFlow("provider.sessions.start", {
    providerUrl: normalizedProviderUrl,
    sessionId: payload?.id,
    maxAttempts,
  });
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response = null;
    try {
      logFlow("provider.sessions.attempt", {
        providerUrl: normalizedProviderUrl,
        sessionId: payload?.id,
        attempt,
      });
      const sessionUrl = `${normalizedProviderUrl}/sessions`;
      response = await fetch(sessionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body = await parseBody(response);

      if (!response?.ok) {
        const businessError = parseProviderBusinessError(body, {
          status: response.status,
          attempt,
          providerUrl: normalizedProviderUrl,
          sessionId: payload?.id,
        });
        if (businessError) {
          throw businessError;
        }
        const message = toProviderErrorMessage(
          body,
          `Provider /sessions request failed with status ${response.status}`
        );
        logFlow("provider.sessions.http_error", {
          providerUrl: normalizedProviderUrl,
          sessionId: payload?.id,
          status: response.status,
          attempt,
          message,
        });
        const error = createDvpnError("DVPN_PROVIDER_SESSION_HTTP_FAILED", message, {
          status: response.status,
          attempt,
        });
        if (!shouldRetryProviderCall(error, response.status) || attempt >= maxAttempts) {
          throw error;
        }
        lastError = error;
      } else {
        const businessError = parseProviderBusinessError(body, {
          status: response.status,
          attempt,
          providerUrl: normalizedProviderUrl,
          sessionId: payload?.id,
        });
        if (businessError) {
          throw businessError;
        }
        logFlow("provider.sessions.success", {
          providerUrl: normalizedProviderUrl,
          sessionId: payload?.id,
          status: response.status,
          attempt,
        });
        return body;
      }
    } catch (error) {
      logFlow("provider.sessions.request_error", {
        providerUrl: normalizedProviderUrl,
        sessionId: payload?.id,
        status: response?.status || null,
        attempt,
        code: error?.code || "UNKNOWN",
        message: error?.message || "Request failed",
      });
      const normalizedError = error?.code
        ? error
        : createDvpnError(
            "DVPN_PROVIDER_SESSION_REQUEST_FAILED",
            error?.message || "Provider /sessions request failed",
            { attempt, status: response?.status }
          );

      if (!shouldRetryProviderCall(normalizedError, response?.status) || attempt >= maxAttempts) {
        throw normalizedError;
      }
      lastError = normalizedError;
    }

    const waitMs = backoffBaseMs * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  throw (
    lastError ||
    createDvpnError("DVPN_PROVIDER_SESSION_FAILED", "Unable to start provider session after retries")
  );
};

export const getOrCreateWgKeyPair = async ({
  walletAddress,
  existingState,
  generateKeyPair,
  persist = true,
  allowCached = true,
} = {}) => {
  const walletState = existingState || (walletAddress ? await getWalletDvpnState(walletAddress) : null) || {};
  const cachedPair = walletState?.keys?.wireguard;
  if (allowCached && cachedPair?.publicKey && cachedPair?.privateKey) {
    return {
      publicKey: cachedPair.publicKey,
      privateKey: cachedPair.privateKey,
      source: "cache",
    };
  }

  const nativeGenerator = generateKeyPair || resolveNativeWgGenerator();
  let generated = null;
  let source = "generated";
  if (nativeGenerator) {
    generated = await nativeGenerator();
    source = "generated_native";
  } else {
    generated = generateLocalWgKeyPair();
    source = "generated_local";
    logFlow("runtime.config.keypair.local_fallback", {
      walletAddress: walletAddress || "",
    });
  }
  const publicKey = generated?.publicKey || generated?.public_key || "";
  const privateKey = generated?.privateKey || generated?.private_key || "";

  if (!publicKey || !privateKey) {
    throw createDvpnError("DVPN_WG_KEYPAIR_INVALID", "Failed to generate WireGuard keypair");
  }

  if (walletAddress && persist) {
    await setWalletDvpnState(walletAddress, {
      ...walletState,
      keys: {
        ...(walletState?.keys || {}),
        wireguard: {
          publicKey,
          privateKey,
          updatedAt: Date.now(),
        },
      },
    });
  }

  return {
    publicKey,
    privateKey,
    source,
  };
};

export const fetchWireguardRuntimeConfig = async ({
  walletAddress,
  sessionId,
  providerUrl,
  signer,
  wgKeyPair,
  getWgKeyPair,
  persistConfig = true,
}) => {
  logFlow("runtime.config.start", {
    walletAddress,
    sessionId: Number(sessionId),
    providerUrl: normalizeProviderUrl(providerUrl),
  });
  if (!walletAddress) {
    throw createDvpnError("DVPN_WALLET_MISSING", "walletAddress is required");
  }
  if (!providerUrl) {
    throw createDvpnError("DVPN_PROVIDER_URL_MISSING", "providerUrl is required");
  }
  if (!signer || typeof signer !== "function") {
    throw createDvpnError("DVPN_SIGNER_MISSING", "signer function is required");
  }

  const walletState = (await getWalletDvpnState(walletAddress)) || {};

  const signerPayload = await signer();
  const pubKey = signerPayload?.pubKeyBase64 || signerPayload?.pubKey || "";
  const signature = signerPayload?.signatureBase64 || signerPayload?.signature || "";
  if (!pubKey || !signature) {
    throw createDvpnError("DVPN_SIGNER_OUTPUT_INVALID", "Signer did not return pubKey/signature");
  }

  let finalKeyPair = wgKeyPair || null;
  if (!finalKeyPair?.publicKey || !finalKeyPair?.privateKey) {
    if (typeof getWgKeyPair === "function") {
      finalKeyPair = await getWgKeyPair();
    } else {
      finalKeyPair = await getOrCreateWgKeyPair({
        walletAddress,
        existingState: walletState,
        persist: false,
        allowCached: false,
      });
    }
  }
  logFlow("runtime.config.keypair.ready", {
    walletAddress,
    sessionId: Number(sessionId),
    source: finalKeyPair?.source || "provided",
  });

  const payload = buildProviderSessionPayload({
    sessionId,
    pubKey,
    signature,
    wgPublicKey: finalKeyPair.publicKey,
  });
  const sessionResponse = await startProviderSession({ providerUrl, payload });
  logFlow("runtime.config.provider_payload.received", {
    walletAddress,
    sessionId: Number(sessionId),
    hasResultData: !!sessionResponse?.result?.data,
    endpointHost: sessionResponse?.result?.addrs?.[0] || "",
  });
  const config = buildWireguardConfigFromSessionResponse({
    sessionResponse,
    privateKey: finalKeyPair.privateKey,
  });
  logFlow("runtime.config.built", {
    walletAddress,
    sessionId: Number(sessionId),
    hasConfig: !!config,
  });

  if (persistConfig) {
    await setWalletDvpnState(walletAddress, {
      ...walletState,
      wireguard: {
        ...(walletState?.wireguard || {}),
        lastSessionId: Number(sessionId),
        lastProviderUrl: normalizeProviderUrl(providerUrl),
        lastEndpoint: sessionResponse?.result?.addrs?.[0] || "",
        hasConfig: true,
        updatedAt: Date.now(),
      },
    });
    logFlow("runtime.config.persisted", {
      walletAddress,
      sessionId: Number(sessionId),
      providerUrl: normalizeProviderUrl(providerUrl),
    });
  }

  return {
    config,
    sessionResponse,
    payload,
    keyPair: finalKeyPair,
  };
};

export const isProviderSessionAlreadyExistsError = (error) => {
  if (String(error?.code || "") === "DVPN_PROVIDER_SESSION_ALREADY_EXISTS") return true;
  const providerCode = Number(error?.details?.providerCode);
  if (providerCode === 5) return true;
  const message = String(error?.message || "").toLowerCase();
  return message.includes("session already exists for peer_key") || message.includes("already exists for peer");
};

