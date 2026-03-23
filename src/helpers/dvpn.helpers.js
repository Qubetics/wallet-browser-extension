export const detectOS = () => {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  if (/Win/i.test(platform)) return "windows";
  if (/Linux/i.test(platform)) return "linux";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "unknown";
};

export const getDownloadMap = ({ appBaseUrl, vpnBaseUrl, vpnHealthUrl }) => ({
  linux: {
    href: "/Vpn_Downloads/wg-agent_1.0.0_amd64.deb",
    buildKey: "linux",
    label: "Linux (.deb)",
    icon: "🐧",
    guide: [
      "Download the Linux package to your computer.",
      "Open Terminal and go to the folder where the file was downloaded (usually Downloads).",
      "Install the package and start the wg-agent service.",
      "Confirm the service is running, then verify the local health URL.",
    ],
    cmd: `# 1. Download the .deb file
# Click the "Download for Linux (.deb)" button on this page.

# 2. Go to the folder where the file is downloaded
cd ~/Downloads

# 3. Install
sudo dpkg -i wg-agent_1.0.0_amd64.deb

# 4. Start as a systemd service (auto-enabled by postinst)
sudo systemctl start wg-agent

# 5. Check it's running
sudo systemctl status wg-agent

# 6. Verify the HTTP API is up
curl ${vpnHealthUrl}`,
  },
  windows: {
    href: "/Vpn_Downloads/wg-agent.exe",
    buildKey: "windows",
    label: "Windows (.exe)",
    icon: "🪟",
    guide: [
      "Install WireGuard for Windows first (required): https://download.wireguard.com/windows-client/wireguard-installer.exe",
      "Download wg-agent.exe from this page.",
      "Right-click the downloaded wg-agent.exe and choose 'Run as administrator'.",
      "If Windows SmartScreen appears, click 'More info' then 'Run anyway'.",
      "Keep the agent window running and return to this page; it will auto-connect.",
    ],
    cmd: `# 1. Install WireGuard for Windows (required)
Download: https://download.wireguard.com/windows-client/wireguard-installer.exe

# 2. Download and run the VPN agent
# Download wg-agent.exe from this page, then right-click -> Run as Administrator

# 3. (Optional) Verify in PowerShell
# Open PowerShell as Administrator and run:
.\\wg-agent.exe

# 4. Verify it's listening
curl ${vpnBaseUrl}/health
# or in PowerShell:
Invoke-WebRequest -Uri ${vpnBaseUrl}/health`,
  },
  ios: {
    href: null,
    label: "iOS",
    icon: "🍎",
    guide: ["Nothing for iOS yet. Integration guidance will be added soon."],
    cmd: `# iOS
Nothing for iOS yet. Integration guidance will be added soon.`,
  },
  unknown: {
    href: "/Vpn_Downloads/wg-agent_1.0.0_amd64.deb",
    label: "Linux (.deb)",
    icon: "⬇️",
    guide: [
      "Use a desktop OS (Linux/Windows) to install the local VPN agent.",
      "Download the package from this page and follow the install steps.",
    ],
    cmd: `# 1. Download
wget ${appBaseUrl}/downloads/wg-agent_1.0.0_amd64.deb

# 2. Go to the folder where the file is downloaded
cd ~/Downloads

# 3. Install
sudo dpkg -i wg-agent_1.0.0_amd64.deb

# 4. Start service
sudo systemctl start wg-agent

# 5. Verify the HTTP API is up
curl ${vpnHealthUrl}`,
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

export const getDurationLabel = (session) => {
  const explicitDuration =
    session?.duration ||
    session?.duration_label ||
    session?.durationLabel ||
    session?.session_duration;
  if (explicitDuration) return String(explicitDuration);

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
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
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
