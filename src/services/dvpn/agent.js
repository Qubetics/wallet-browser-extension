/* global chrome */
import { detectOS } from "../../helpers/dvpn.helpers";

const AGENT_PORTS = Array.from({ length: 10 }, (_item, idx) => 51821 + idx);
const NATIVE_HOST = "com.qubetics.vpn";
const EXTENSION_ID = typeof chrome !== "undefined" && chrome.runtime ? chrome.runtime.id : "";

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
      headers: { "X-Extension-ID": EXTENSION_ID },
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
      } else if (state === "failed" || msg.error) {
        console.error("[dVPN Native] Native operation failed:", msg.message || msg.error);
        currentNativeStatus.is_running = false;
        const err = new Error(msg.message || msg.error || "Native operation failed");
        if (activeResolvers.connect) activeResolvers.connect.reject(err);
        if (activeResolvers.disconnect) activeResolvers.disconnect.reject(err);
        activeResolvers.connect = null;
        activeResolvers.disconnect = null;
      } else if (state === "disconnected") {
        console.log("[dVPN Native] Status updated to 'disconnected'");
        currentNativeStatus.is_running = false;
        if (activeResolvers.disconnect) {
          console.log("[dVPN Native] Resolving pending disconnect promise");
          activeResolvers.disconnect.resolve({ success: true, message: msg.message });
          activeResolvers.disconnect = null;
        }
      } else if (state === "error: helper_missing") {
        console.warn("[dVPN Native] Helper missing reported by host.");
        currentNativeStatus.is_running = false;
      } else {
        console.log("[dVPN Native] Intermediate state:", state);
      }

      // Every message updates the status resolver if someone is waiting for a status check
      if (activeResolvers.status) {
        if (state === "error: helper_missing") {
          console.warn("[dVPN Native] Helper missing reported by host. Rejecting status check.");
          activeResolvers.status.reject(new Error("Helper not installed"));
        } else {
          console.log("[dVPN Native] Resolving pending status check =>", state);
          activeResolvers.status.resolve({ is_running: currentNativeStatus.is_running, status: state });
        }
        activeResolvers.status = null;
      }
    });

    persistentNativePort.onDisconnect.addListener((res) => {
      console.warn("[dVPN Native] Port disconnected.asadsdad", res);
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

      const isNotFound = errMsg.toLowerCase().includes("not found") || errMsg.toLowerCase().includes("cannot find");
      const err = errMsg ? new Error(errMsg) : new Error("Native host disconnected");

      if (activeResolvers.connect) activeResolvers.connect.reject(err);
      if (activeResolvers.disconnect) activeResolvers.disconnect.reject(err);

      if (activeResolvers.status) {
        if (isNotFound) {
          console.warn("[dVPN Native] Host not found. Rejecting status check.");
          activeResolvers.status.reject(err);
        } else {
          console.log("[dVPN Native] Resolving status check with is_running: false.");
          activeResolvers.status.resolve({ is_running: false });
        }
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
  console.log("[dVPN Native] findRunningAgent called");
  if (detectOS() === "macos") {
    if (pendingStatusPromise) {
      console.log("[dVPN Native] Re-using pending status check promise...");
      return pendingStatusPromise;
    }

    console.log("[dVPN Native] Running on macOS, testing native port...");
    pendingStatusPromise = new Promise((resolve) => {
      const port = getNativePort();
      console.log("[dVPN Native] Native port obtained:", port);
      if (!port) {
        console.warn("[dVPN Native] Failed to get native port. returning reachable: false");
        return resolve({ reachable: false, baseUrl: "", port: null });
      }

      activeResolvers.status = {
        resolve: (res) => {
          console.log("[dVPN Native] Status check resolved successfully. reachable: true", res);
          resolve({ reachable: true, baseUrl: "native", port: null });
        },
        reject: (err) => {
          console.warn("[dVPN Native] Status check rejected. reachable: false", err);
          resolve({ reachable: false, baseUrl: "", port: null });
        }
      };

      console.log("[dVPN Native] Dispatching status check message to native host...");
      port.postMessage({ action: "status" });

      // Timeout if native host doesn't reply
      setTimeout(() => {
        if (activeResolvers.status) {
          console.error("[dVPN Native] Status check timed out! reachable: false");
          activeResolvers.status = null;
          resolve({ reachable: false, baseUrl: "", port: null });
        }
      }, 5000);
    });

    // Clear the pending promise after it resolves (with a tiny delay to debounce)
    pendingStatusPromise.finally(() => {
      setTimeout(() => {
        pendingStatusPromise = null;
      }, 2000);
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
    return new Promise((resolve, reject) => {
      const port = getNativePort();
      if (!port) return reject(new Error("macOS native host not reachable"));

      activeResolvers.status = { resolve, reject };
      port.postMessage({ action: "status" });

      setTimeout(() => {
        if (activeResolvers.status) {
          activeResolvers.status = null;
          resolve({ is_running: currentNativeStatus.is_running });
        }
      }, 5000);
    });
  }

  const response = await fetch(`${baseUrl}/status`, {
    headers: { "X-Extension-ID": EXTENSION_ID },
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
      "X-Extension-ID": EXTENSION_ID,
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
    headers: { "X-Extension-ID": EXTENSION_ID },
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
