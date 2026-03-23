const AGENT_PORTS = Array.from({ length: 10 }, (_item, idx) => 51821 + idx);

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
};

export const findRunningAgent = async () => {
  for (const port of AGENT_PORTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const response = await fetch(`http://127.0.0.1:${port}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) continue;
      const body = await parseJsonSafe(response);
      if (!body || String(body?.status || "").toLowerCase() !== "running") continue;
      return {
        reachable: true,
        baseUrl: `http://127.0.0.1:${port}`,
        port,
      };
    } catch (_error) {
      // Keep probing known ports.
    }
  }
  return {
    reachable: false,
    baseUrl: "",
    port: null,
  };
};

export const getAgentStatus = async (baseUrl) => {
  if (!baseUrl) throw new Error("Agent base URL is required");
  const response = await fetch(`${baseUrl}/status`);
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(body?.error || "Failed to query agent status");
  }
  return body || {};
};

export const startAgentTunnel = async ({ baseUrl, config }) => {
  if (!baseUrl) throw new Error("Agent base URL is required");
  if (!config) throw new Error("WireGuard config is required");
  const response = await fetch(`${baseUrl}/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  const response = await fetch(`${baseUrl}/stop`, {
    method: "POST",
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
