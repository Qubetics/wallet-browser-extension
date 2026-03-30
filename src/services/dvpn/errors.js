import { message } from "antd";

const DVPN_NOTIFIED_FLAG = "__dvpn_error_notified__";
let lastNotifiedMessage = "";
let lastNotifiedAt = 0;
const DEDUPE_WINDOW_MS = 2500;

export const getDvpnErrorMessage = (error, fallback = "Something went wrong in dVPN") => {
  if (!error) return fallback;
  const rawMsg = typeof error === "string" ? error : error?.message || fallback;
  const msg = String(rawMsg).toLowerCase();

  // Handle common technical blockchain errors
  if (msg.includes("insufficient funds") || msg.includes("smaller than") || msg.includes("spendable balance")) {
    return "Insufficient TICS balance to complete this purchase.";
  }
  // if (msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("abort")) {
  //   return "Connection error: Unable to reach the dVPN agent.";
  // }
  if (msg.includes("out of gas") || msg.includes("gas limit")) {
    return "Transaction failed: Out of gas.";
  }

  return rawMsg;
};

export const notifyDvpnError = (error, fallback) => {
  if (error && typeof error === "object" && error[DVPN_NOTIFIED_FLAG]) {
    return getDvpnErrorMessage(error, fallback);
  }

  const msg = getDvpnErrorMessage(error, fallback);
  const now = Date.now();
  if (msg && msg === lastNotifiedMessage && now - lastNotifiedAt <= DEDUPE_WINDOW_MS) {
    if (error && typeof error === "object") {
      error[DVPN_NOTIFIED_FLAG] = true;
    }
    return msg;
  }
  try {
    message.error({
      content: msg,
    });
    lastNotifiedMessage = msg;
    lastNotifiedAt = now;
    if (error && typeof error === "object") {
      // Mark as notified to avoid double popups
      Object.defineProperty(error, DVPN_NOTIFIED_FLAG, {
        value: true,
        configurable: true,
        enumerable: false,
        writable: true,
      });
    }
  } catch (notifyError) {
    // Keep runtime safe even if UI notification layer is unavailable.
  }
  return msg;
};

