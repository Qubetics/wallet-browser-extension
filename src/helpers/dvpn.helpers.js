import React from "react";
export const detectOS = () => {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  if (/Win/i.test(platform)) return "windows";
  if (/Mac/i.test(platform)) return "macos";
  if (/Linux/i.test(platform)) return "linux";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "unknown";
};

export const getDownloadMap = ({ appBaseUrl, vpnBaseUrl, vpnHealthUrl }) => ({
  linux: {
    href: "/Vpn_Downloads/wg-agent_1.0.0_amd64.deb",
    buildKey: "linux",
    label: "Linux (.deb)",
    icon: "",
    guide: [
      "Download the Linux package to your computer.",
      "Copy and run the install commands below in Terminal.",
      "Start the wg-agent service after installation.",
    ],
    cmd: `# 1. Download the .deb file
# Click the "Download for Linux (.deb)" button on this page.


# 2. Install agent package and start service (single command)
sudo dpkg -i wg-agent_1.0.0_amd64.deb && sudo systemctl start wg-agent

# If agent fails to run (dependency issues), use this command:
sudo apt install -f`,
    copyCmd: `sudo dpkg -i wg-agent_1.0.0_amd64.deb && sudo systemctl start wg-agent && sudo apt install -f`,
  },
  windows: {
    href: "/Vpn_Downloads/wg-agent.exe",
    buildKey: "windows",
    label: "Windows (.exe)",
    icon: "",
    guide: [
      <span style={{ color: '#fff' }}>
        Install WireGuard for Windows first (required):{" "}
        <a 
          href="https://download.wireguard.com/windows-client/wireguard-installer.exe" 
          target="_blank" 
          rel="noreferrer" 
          style={{ color: '#6366f1', textDecoration: 'underline', fontWeight: 'bold' }}
        >
          wireguard-installer.exe
        </a>
      </span>,
      "After installing, run WireGuard once as Administrator (required).",
      "Download wg-agent.exe from this page.",
      "Right-click the downloaded wg-agent.exe and choose 'Run as administrator'.",
      "If Windows SmartScreen appears, click 'More info' then 'Run anyway'.",
      "Keep the agent window running and return to this page; it will auto-connect.",
      "WireGuard and Agent Terminal must be installed and running on your system. The VPN will only connect when both services are active.",
    ],
    cmd: "",
  },
  macos: {
    href: "/Vpn_Downloads/QubeticsVPN-Installer.pkg",
    buildKey: "macos",
    label: "macOS (.pkg)",
    icon: "",
    guide: [
      "Download the QubeticsVPN installer for macOS.",
      "Open the downloaded .pkg file and follow the installation steps.",
      "The installer will automatically configure the background VPN service for this extension.",
      "Once installed, return to this page and the extension will connect automatically."
    ],
    cmd: `# macOS Installation
# Download the installer using the button above.
# Double-click the downloaded QubeticsVPN-Installer.pkg file.
# Follow the on-screen instructions to complete the setup.`
  },
  ios: {
    href: null,
    label: "Mac OS",
    icon: "",
    guide: ["Nothing for Mac OS yet. Integration guidance will be added soon."],
    cmd: `# Mac OS
Nothing for Mac OS yet. Integration guidance will be added soon.`,
  },
  unknown: {
    href: "/Vpn_Downloads/wg-agent_1.0.0_amd64.deb",
    label: "Linux (.deb)",
    icon: "",
    guide: [
      "Use a desktop OS (Linux/Windows) to install the local VPN agent.",
      "Copy and run the Linux commands below in Terminal.",
    ],
    cmd: `# 1. Download
wget ${appBaseUrl}/downloads/wg-agent_1.0.0_amd64.deb

# 2. Install dependencies + agent + start service (single command)
sudo apt update && sudo apt install -y wireguard-tools resolvconf && sudo dpkg -i ~/Downloads/wg-agent_1.0.0_amd64.deb && sudo systemctl start wg-agent

# If agent fails to run (dependency issues), use this command:
sudo apt install -f`,
    copyCmd: `sudo apt update && sudo apt install -y wireguard-tools resolvconf && sudo dpkg -i ~/Downloads/wg-agent_1.0.0_amd64.deb && sudo systemctl start wg-agent && sudo apt install -f`,
  },
});

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.list)) return value.list;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const extractData = (payload) => payload?.data || payload || {};

export const normalizeRecentProvider = (payload) => {
  const data = extractData(payload);
  const list = asArray(data);
  return list[0] || data?.provider || null;
};

export const normalizeRecentProviders = (payload) => {
  const data = extractData(payload);
  const list = asArray(data);
  if (list?.length) return list;
  return data?.provider ? [data.provider] : [];
};

export const normalizeRecentSessions = (payload) => {
  const data = extractData(payload);
  const list = Array.isArray(data?.sessions) ? data.sessions : asArray(data);
  return list?.slice(0, 4);
};

export const normalizeSubscriptions = (payload) => {
  const data = extractData(payload);
  if (Array.isArray(data?.subscriptions)) return data?.subscriptions;
  return asArray(data);
};

export const normalizeQuickNode = (payload) => {
  const data = extractData(payload);
  const list = asArray(data);
  return list[0] || data || null;
};

const isActiveSubscription = (subscription) => {
  const status = String(subscription?.status || subscription?.state || "").toLowerCase();
  if (status.includes("expired") || status.includes("inactive")) return false;
  if (status.includes("active")) return true;
  const inactiveAt = new Date(subscription?.inactive_at || subscription?.inactiveAt || 0);
  return Number.isFinite(inactiveAt.getTime()) && inactiveAt.getTime() > Date.now();
};

export const getActiveSubscription = (subscriptions) => {
  if (!Array.isArray(subscriptions) || !subscriptions.length) return null;
  return subscriptions.find(isActiveSubscription) || subscriptions[0];
};

export const getDaysLeftText = (subscription) => {
  if (!subscription) return "Buy plan";
  const inactiveAt = new Date(subscription?.inactive_at || subscription?.inactiveAt || 0);
  const expiresAtMs = inactiveAt.getTime();
  if (!Number.isFinite(expiresAtMs)) return "Plan active";
  const diffMs = expiresAtMs - Date.now();
  if (diffMs <= 0) return "Plan expired";
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return `${days} day${days > 1 ? "s" : ""} left`;
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString();
};

const formatDurationFromSeconds = (totalSeconds) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "-";
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}hr ${minutes}min`;
  return `${Math.max(totalMinutes, 1)}min`;
};

const parseDurationToSeconds = (duration) => {
  if (duration === null || typeof duration === "undefined") return null;

  if (typeof duration === "number" && Number.isFinite(duration)) {
    return duration;
  }

  const value = String(duration).trim().toLowerCase();
  if (!value) return null;

  // Support hh:mm:ss and mm:ss payloads.
  if (/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(value)) {
    const parts = value.split(":").map((part) => Number(part));
    if (parts.every((part) => Number.isFinite(part))) {
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      return parts[0] * 60 + parts[1];
    }
  }

  const hours = Number((value.match(/(\d+)\s*h(?:r|our|ours)?/) || [])[1] || 0);
  const minutes = Number((value.match(/(\d+)\s*m(?:in|ins|inute|inutes)?/) || [])[1] || 0);
  const seconds = Number((value.match(/(\d+)\s*s(?:ec|ecs|econd|econds)?/) || [])[1] || 0);
  const hasTimeUnit = hours || minutes || seconds;

  if (hasTimeUnit) {
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
};

export const getDurationLabel = (session) => {
  const explicitDuration =
    session?.duration ||
    session?.duration_label ||
    session?.durationLabel ||
    session?.session_duration;
  if (explicitDuration) {
    const explicitSeconds = parseDurationToSeconds(explicitDuration);
    if (explicitSeconds !== null) {
      return formatDurationFromSeconds(explicitSeconds);
    }
    return String(explicitDuration);
  }

  const startedAt = new Date(
    session?.start_at ||
    session?.started_at ||
    session?.startAt ||
    session?.start_time ||
    0
  );
  const endedAt = new Date(
    session?.status_at ||
    session?.ended_at ||
    session?.endAt ||
    session?.end_time ||
    0
  );
  const startMs = startedAt.getTime();
  const endMs = endedAt.getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return "-";

  const totalSeconds = Math.floor((endMs - startMs) / 1000);
  return formatDurationFromSeconds(totalSeconds);
};

export const getSessionLocation = (session) => {
  const city =
    session?.city ||
    session?.node_city ||
    session?.nodes?.city ||
    session?.node?.city ||
    session?.location?.city ||
    "";
  const country =
    session?.country ||
    session?.node_country ||
    session?.nodes?.country ||
    session?.node?.country ||
    session?.location?.country ||
    "";
  const label = [country, city].filter(Boolean).join(" - ");
  return (
    label ||
    session?.server_location ||
    session?.location_name ||
    session?.server ||
    "Recent session"
  );
};
