/*global chrome*/
const STORAGE_KEY = "dvpnWalletStore";

const getChromeRuntime = () => {
  if (typeof chrome === "undefined") return null;
  return chrome;
};

const hasChromeStorage = () => {
  return !!getChromeRuntime()?.storage?.local;
};

const readLocalStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};

const writeLocalStorage = (value) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

const readChromeStorage = async () => {
  try {
    const runtimeChrome = getChromeRuntime();
    if (!runtimeChrome?.storage?.local) return {};
    const result = await runtimeChrome.storage.local.get(STORAGE_KEY);
    return result?.[STORAGE_KEY] || {};
  } catch (error) {
    return {};
  }
};

const writeChromeStorage = async (value) => {
  const runtimeChrome = getChromeRuntime();
  if (!runtimeChrome?.storage?.local) return;
  await runtimeChrome.storage.local.set({ [STORAGE_KEY]: value });
};

export const getDvpnWalletAddress = (walletOrAddress) => {
  if (!walletOrAddress) return "";

  if (typeof walletOrAddress === "string") {
    return walletOrAddress.trim();
  }

  // dVPN identity is Cosmos/TICS scoped by default.
  const family = walletOrAddress?.coinFamilyAndAddress;
  const qubeticsLike = (value) => /^qubetics1/i.test(String(value || "").trim());

  // Preferred account shape: coinFamilyAndAddress.cosmos
  const directCosmos = family?.cosmos;
  if (directCosmos) return String(directCosmos).trim();

  // Fallback legacy/indexed shapes observed across account payloads.
  const indexedCandidates = [family?.[6], family?.[7], family?.["6"], family?.["7"]];
  const indexedCosmos = indexedCandidates.find((value) => qubeticsLike(value));
  if (indexedCosmos) return String(indexedCosmos).trim();

  // Last fallback: scan all values and pick the first Cosmos-like address.
  if (family && typeof family === "object") {
    const anyCosmos = Object.values(family).find((value) => qubeticsLike(value));
    if (anyCosmos) return String(anyCosmos).trim();
  }

  return String(walletOrAddress?.address || "").trim();
};

const normalizeWalletKey = (walletOrAddress) => {
  return getDvpnWalletAddress(walletOrAddress);
};

export const readDvpnStore = async () => {
  if (hasChromeStorage()) {
    return readChromeStorage();
  }
  return readLocalStorage();
};

export const writeDvpnStore = async (store) => {
  if (hasChromeStorage()) {
    await writeChromeStorage(store);
    return;
  }
  writeLocalStorage(store);
};

export const getWalletDvpnState = async (walletAddress) => {
  const walletKey = normalizeWalletKey(walletAddress);
  if (!walletKey) return null;
  const store = await readDvpnStore();
  return store[walletKey] || null;
};

export const setWalletDvpnState = async (walletAddress, nextState) => {
  const walletKey = normalizeWalletKey(walletAddress);
  if (!walletKey) return;
  const store = await readDvpnStore();
  const current = store[walletKey] || {};
  const merged = {
    ...current,
    ...nextState,
  };
  store[walletKey] = merged;
  await writeDvpnStore(store);
};

export const updateWalletTokens = async (walletAddress, tokens) => {
  const walletKey = normalizeWalletKey(walletAddress);
  if (!walletKey) return;
  const current = (await getWalletDvpnState(walletKey)) || {};
  await setWalletDvpnState(walletKey, {
    ...current,
    tokens: {
      ...(current.tokens || {}),
      ...(tokens || {}),
    },
  });
};

export const clearWalletTokens = async (walletAddress) => {
  const walletKey = normalizeWalletKey(walletAddress);
  if (!walletKey) return;
  const current = (await getWalletDvpnState(walletKey)) || {};
  await setWalletDvpnState(walletKey, {
    ...current,
    tokens: {},
  });
};

export const clearWalletDvpnState = async (walletAddress) => {
  const walletKey = normalizeWalletKey(walletAddress);
  if (!walletKey) return;
  const store = await readDvpnStore();
  delete store[walletKey];
  await writeDvpnStore(store);
};

