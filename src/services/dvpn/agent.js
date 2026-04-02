/* global chrome */
import { detectOS } from "../../helpers/dvpn.helpers";

const AGENT_PORTS = Array.from({ length: 10 }, (_item, idx) => 51821 + idx);
const NATIVE_HOST = "com.qubetics.vpn";
const API_KEY = "REDACTED";

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
};

const probePort = async (port) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: controller.signal,
      headers: { "X-API-Key": API_KEY },
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Port not ok");
    const body = await parseJsonSafe(response);
    if (!body || String(body?.status || "").toLowerCase() !== "running") {
      throw new Error("Agent not running");
    }

    return {
      reachable: true,
      baseUrl: `http://127.0.0.1:${port}`,
      port,
      version:
        body?.version ||
        body?.build_version ||
        body?.buildVersion ||
        body?.data?.version ||
        body?.data?.build_version ||
        body?.data?.buildVersion ||
        "",
      diag: body?.diag || body?.data?.diag || null,
    };
  } catch (error) {
    throw error;
  }
};

let LAST_SUCCESSFUL_PORT = null;

// export const findRunningAgent = async () => {
//   // 1. Try last successful port first (Fast Path)
//   if (LAST_SUCCESSFUL_PORT) {
//     try {
//       const result = await probePort(LAST_SUCCESSFUL_PORT);
//       return result;
//     } catch (_e) {
//       LAST_SUCCESSFUL_PORT = null;
//     }
//   }

//   // 2. Parallel probe as fallback (Slow Path)
//   const probes = AGENT_PORTS.map((port) => probePort(port));
//   try {
//     const result = await Promise.any(probes);
//     LAST_SUCCESSFUL_PORT = result.port;
//     return result;
//   } catch (_error) {
//     return {
//       reachable: false,
//       baseUrl: "",
//       port: null,
//       version: "",
//       diag: null,
//     };
//   }

// }
// --- macOS Native Messaging Integration ---

let persistentNativePort = null;
let currentNativeStatus = { is_running: false, nativeState: "disconnected" };
let activeResolvers = { connect: null, disconnect: null, status: null };
let pendingStatusPromise = null;

/**
 * Call this when the DVpn component unmounts so that stale pending promises
 * don't block the next mount's agent-health check.
 */
export const resetNativePendingState = () => {
  pendingStatusPromise = null;
  // Nullifying the port forces a fresh chrome.runtime.connectNative call
  // on the next check, which is necessary for Chrome to "notice" a newly
  // installed manifest on disk without a browser restart.
  persistentNativePort = null;
  // Do NOT clear activeResolvers here – they belong to in-flight native calls.
};

const getNativePort = () => {
  if (persistentNativePort) return persistentNativePort;

  try {
    console.log("[dVPN Native] Attempting to connect to native host:", NATIVE_HOST);
    persistentNativePort = chrome.runtime.connectNative(NATIVE_HOST);

    persistentNativePort.onMessage.addListener((msg) => {
      console.log("[dVPN Native] Received message:", msg);
      const state = msg.status || msg.error || "";
      currentNativeStatus.nativeState = state;

      if (state === "connected") {
        console.log("[dVPN Native] Status updated to 'connected'");
        currentNativeStatus.is_running = true;
        if (activeResolvers.connect) {
          console.log("[dVPN Native] Resolving pending connect promise");
          activeResolvers.connect.resolve({ success: true, message: msg.message });
          activeResolvers.connect = null;
        }
        // Also satisfy any concurrent status check – we already know the answer.
        if (activeResolvers.status) {
          console.log("[dVPN Native] Resolving pending status check via 'connected' event");
          activeResolvers.status.resolve({ is_running: true, status: state });
          activeResolvers.status = null;
        }
      } else if (state === "failed" || msg.error) {
        console.error("[dVPN Native] Native operation failed:", msg.message || msg.error);
        currentNativeStatus.is_running = false;
        const err = new Error(msg.message || msg.error || "Native operation failed");
        if (activeResolvers.connect) { activeResolvers.connect.reject(err); activeResolvers.connect = null; }
        if (activeResolvers.disconnect) { activeResolvers.disconnect.reject(err); activeResolvers.disconnect = null; }
        if (activeResolvers.status) {
          activeResolvers.status.resolve({ is_running: false, status: state });
          activeResolvers.status = null;
        }
      } else if (state === "disconnected") {
        console.log("[dVPN Native] Status updated to 'disconnected'");
        currentNativeStatus.is_running = false;
        if (activeResolvers.disconnect) {
          console.log("[dVPN Native] Resolving pending disconnect promise");
          activeResolvers.disconnect.resolve({ success: true, message: msg.message });
          activeResolvers.disconnect = null;
        }
        if (activeResolvers.status) {
          activeResolvers.status.resolve({ is_running: false, status: state });
          activeResolvers.status = null;
        }
      } else if (state === "error: helper_missing") {
        console.warn("[dVPN Native] Helper missing reported by host.");
        currentNativeStatus.is_running = false;
        if (activeResolvers.status) {
          activeResolvers.status.reject(new Error("Helper not installed"));
          activeResolvers.status = null;
        }
      } else {
        console.log("[dVPN Native] Intermediate state:", state);
        // For any other message, satisfy a waiting status resolver
        if (activeResolvers.status) {
          console.log("[dVPN Native] Resolving pending status check =>", state);
          activeResolvers.status.resolve({ is_running: currentNativeStatus.is_running, status: state });
          activeResolvers.status = null;
        }
      }
    });

    persistentNativePort.onDisconnect.addListener((res) => {
      console.warn("[dVPN Native] Port disconnected.", res);
      console.warn("[dVPN Native] Port persistentNativePort.", persistentNativePort);
      console.warn("[dVPN Native] Port disconnected.", activeResolvers);
      persistentNativePort = null;
      pendingStatusPromise = null;
      currentNativeStatus.is_running = false;
      currentNativeStatus.nativeState = "disconnected";

      const errMsg = chrome.runtime.lastError ? chrome.runtime.lastError.message : "";
      if (errMsg) {
        console.error("[dVPN Native] Disconnect error:", errMsg);
      }

      const err = errMsg ? new Error(errMsg) : new Error("Native host disconnected");

      if (activeResolvers.connect) activeResolvers.connect.reject(err);
      if (activeResolvers.disconnect) activeResolvers.disconnect.reject(err);

      if (activeResolvers.status) {
        // Port is dead — agent is not reachable regardless of error details.
        // Always reject so findRunningAgent maps this to reachable: false.
        console.warn("[dVPN Native] Port disconnected. Rejecting pending status check.", errMsg || "(clean disconnect)");
        activeResolvers.status.reject(err);
      }

      activeResolvers = { connect: null, disconnect: null, status: null };
    });

    return persistentNativePort;
  } catch (err) {
    console.error("[dVPN Native] Failed to initialize native port:", err);
    return null;
  }
};

// --- Exported API ---

export const findRunningAgent = async () => {
  console.log("[dVPN Native] findRunningAgent called", pendingStatusPromise);
  if (detectOS() === "macos") {
    if (pendingStatusPromise) {
      console.log("[dVPN Native] Re-using pending status check promise...");
      return pendingStatusPromise;
    }

    console.log("[dVPN Native] Running on macOS, testing native port...");
    pendingStatusPromise = new Promise((resolve) => {
      // Settled flag ensures the promise resolves exactly once, even if
      // multiple code-paths (onMessage, onDisconnect, timeout) try to settle it.
      let settled = false;
      const safeResolve = (val) => {
        if (settled) return;
        settled = true;
        resolve(val);
      };

      const port = getNativePort();
      console.log("[dVPN Native] Native port obtained:", port);
      if (!port) {
        console.warn("[dVPN Native] Failed to get native port. returning reachable: false");
        return safeResolve({ reachable: false, baseUrl: "", port: null });
      }

      // Fast-path: if we already know the tunnel is running AND the port is still
      // alive, report reachable immediately without an extra native round-trip.
      if (currentNativeStatus.is_running && persistentNativePort) {
        console.log("[dVPN Native] is_running already true & port alive – returning reachable: true immediately");
        return safeResolve({ reachable: true, baseUrl: "native", port: null });
      }

      activeResolvers.status = {
        resolve: (res) => {
          console.log("[dVPN Native] Status check resolved successfully. reachable: true", res);
          const version = res?.version || res?.build_version || res?.buildVersion || "";
          safeResolve({ reachable: true, baseUrl: "native", port: null, version });
        },
        reject: (err) => {
          console.warn("[dVPN Native] Status check rejected. reachable: false", err);
          safeResolve({ reachable: false, baseUrl: "", port: null });
        }
      };

      console.log("[dVPN Native] Dispatching status check message to native host...");
      port.postMessage({ action: "status" });

      // UNCONDITIONAL timeout — always settles the promise even if
      // activeResolvers.status was overwritten or cleared by another path.
      setTimeout(() => {
        if (!settled) {
          console.error("[dVPN Native] Status check timed out! reachable: false");
          activeResolvers.status = null;
        }
        safeResolve({ reachable: false, baseUrl: "", port: null });
      }, 4000);
    });

    // Clear pendingStatusPromise after it settles so the next call creates
    // a fresh status check. A 500 ms debounce window prevents rapid
    // successive calls from each opening a new native round-trip.
    const thisPromise = pendingStatusPromise;
    thisPromise.finally(() => {
      setTimeout(() => {
        if (pendingStatusPromise === thisPromise) {
          pendingStatusPromise = null;
        }
      }, 500);
    });

    return pendingStatusPromise;
  }

  // 1. Try last successful port first (Fast Path)
  if (LAST_SUCCESSFUL_PORT) {
    try {
      const result = await probePort(LAST_SUCCESSFUL_PORT);
      return result;
    } catch (_e) {
      LAST_SUCCESSFUL_PORT = null;
    }
  }

  // 2. Parallel probe as fallback (Slow Path)
  const probes = AGENT_PORTS.map((port) => probePort(port));
  try {
    const result = await Promise.any(probes);
    LAST_SUCCESSFUL_PORT = result.port;
    return result;
  } catch (_error) {
    return {
      reachable: false,
      baseUrl: "",
      port: null,
      version: "",
      diag: null,
    };
  }
};

export const getAgentStatus = async (baseUrl) => {
  if (!baseUrl) throw new Error("Agent base URL is required");

  if (baseUrl === "native") {
    // Always query the native host for live tunnel status rather than relying on
    // the cached is_running flag, which can become stale if the tunnel drops
    // silently without the native host sending a "disconnected" message.
    return new Promise((resolve, reject) => {
      let settled = false;
      const safeSettle = (val, isError) => {
        if (settled) return;
        settled = true;
        isError ? reject(val) : resolve(val);
      };

      const port = getNativePort();
      if (!port) return safeSettle(new Error("macOS native host not reachable"), true);

      // If another status check is already in-flight, chain on it instead of overwriting.
      if (activeResolvers.status) {
        const prev = activeResolvers.status;
        activeResolvers.status = {
          resolve: (res) => { prev.resolve(res); safeSettle(res, false); },
          reject: (err) => { prev.reject(err); safeSettle(err, true); },
        };
        // No need to postMessage again – the previous message is already in-flight.
        // Still set an unconditional timeout for THIS promise.
        setTimeout(() => {
          safeSettle({ is_running: currentNativeStatus.is_running }, false);
        }, 5000);
        return;
      }

      activeResolvers.status = {
        resolve: (res) => safeSettle(res, false),
        reject: (err) => safeSettle(err, true),
      };
      port.postMessage({ action: "status" });

      // Unconditional timeout — always settles this promise.
      setTimeout(() => {
        if (!settled) activeResolvers.status = null;
        safeSettle({ is_running: currentNativeStatus.is_running }, false);
      }, 5000);
    });
  }

  const response = await fetch(`${baseUrl}/status`, {
    headers: { "X-API-Key": API_KEY },
  });
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(body?.error || "Failed to query agent status");
  }
  return body || {};
};

export const startAgentTunnel = async ({ baseUrl, config }) => {
  console.log("startAgentTunnel baseUrl", baseUrl);
  console.log("startAgentTunnel config", config);

  if (!baseUrl) throw new Error("Agent base URL is required");
  if (!config) throw new Error("WireGuard config is required");

  if (baseUrl === "native") {
    return new Promise((resolve, reject) => {
      const port = getNativePort();
      console.log("startAgentTunnel port", port);
      if (!port) return reject(new Error("macOS native host not reachable"));

      activeResolvers.connect = { resolve, reject };
      port.postMessage({ action: "connect", configContent: config });

      setTimeout(() => {
        if (activeResolvers.connect) {
          activeResolvers.connect = null;
          reject(new Error("macOS native connection timed out"));
        }
      }, 35000); // UI disables button for 30s, give host 35s max
    });
  }
  console.log("startAgentTunnel baseUrl ---------");

  const response = await fetch(`${baseUrl}/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({ config }),
  });
  const body = await parseJsonSafe(response);
  if (!response.ok || body?.success === false) {
    throw new Error(body?.error || body?.message || "Failed to start VPN tunnel");
  }
  return body || { success: true };
};

export const stopAgentTunnel = async (baseUrl) => {
  if (!baseUrl) throw new Error("Agent base URL is required");

  if (baseUrl === "native") {
    return new Promise((resolve, reject) => {
      const port = getNativePort();
      if (!port) return reject(new Error("macOS native host not reachable"));

      activeResolvers.disconnect = { resolve, reject };
      port.postMessage({ action: "disconnect" });

      setTimeout(() => {
        if (activeResolvers.disconnect) {
          activeResolvers.disconnect = null;
          reject(new Error("macOS native disconnection timed out"));
        }
      }, 35000);
    });
  }

  const response = await fetch(`${baseUrl}/stop`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY },
  });
  const body = await parseJsonSafe(response);
  if (!response.ok || body?.success === false) {
    const message = String(body?.error || body?.message || "");
    if (message.toLowerCase().includes("not running")) {
      return { success: true, message: "Tunnel already stopped" };
    }
    throw new Error(message || "Failed to stop VPN tunnel");
  }
  return body || { success: true };
};
