import { message } from "antd";

const DVPN_NOTIFIED_FLAG = "__dvpn_error_notified__";
let lastNotifiedMessage = "";
let lastNotifiedAt = 0;
const DEDUPE_WINDOW_MS = 2500;

export const getDvpnErrorMessage = (error, fallback = "Something went wrong in dVPN") => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error?.message || fallback;
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
    message.error(msg);
    lastNotifiedMessage = msg;
    lastNotifiedAt = now;
    if (error && typeof error === "object") {
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

