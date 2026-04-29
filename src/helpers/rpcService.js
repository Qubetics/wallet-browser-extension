const RPC_API_URL = `${process.env.REACT_APP_BASE_URL}/wallet/rpcUrl`;

const API_KEY_TO_ENV = {
  ETH_RPC_URL: 'REACT_APP_ETH_RPC',
  BNB_RPC_URL: 'REACT_APP_BNB_RPC',
  POL_RPC_URL: 'REACT_APP_MATIC_RPC',
  SOL_RPC_URL: 'REACT_APP_SOL_RPC',
  BTC_RPC_URL: 'REACT_APP_BTC_RPC',
  TRON_NODE: 'REACT_APP_TRON_RPC',
  ETH_DAPP_RPC_URL: 'REACT_APP_ETH_DAPP_RPC',
  TICS_RPC_URL: 'REACT_APP_QUBETIC_RPC',
  TICS_NATIVE_RPC_URL: 'REACT_APP_COSMO_RPC_URL',
};

let rpcCache = null;

export async function initRpcUrls() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(RPC_API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return;
    const data = await res.json();
    rpcCache = {};
    for (const [apiKey, envKey] of Object.entries(API_KEY_TO_ENV)) {
      if (data[apiKey]) rpcCache[envKey] = data[apiKey];
    }
    if (data.TRON_NODE) {
      rpcCache['REACT_APP_TRON_FULL_NODE'] = data.TRON_NODE;
      rpcCache['REACT_APP_TRON_SOLIDITY_NODE'] = data.TRON_NODE;
      rpcCache['REACT_APP_TRON_EVENTSERVER'] = data.TRON_NODE;
    }
  } catch {
    // silently fall back to env vars
  }
}

export function getRpcUrl(envKey) {
  return (rpcCache && rpcCache[envKey]) || process.env[envKey] || '';
}
