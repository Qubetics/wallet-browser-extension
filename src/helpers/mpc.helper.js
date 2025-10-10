/*global chrome*/
import axios from "axios";



// Base URL for MPC service
const MPC_BASE_URL = "http://124.243.183.85:8082";

const mpcApi = axios.create({ baseURL: MPC_BASE_URL });

// export const registerUser = async (ethereumAddress) => {
//   const data = { ethereum_address: ethereumAddress };
//   const res = await mpcApi.post("/register_user", data);
//   return res?.data;
// };
export const registerUser = async (ethereumAddress) => {
  const data = { ethereum_address: ethereumAddress };
  console.log("data", data);
  try {
    const response = await fetch("http://124.243.183.85:8082/register_user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // include auth headers here if needed
      },
      body: JSON.stringify(data),
    });
    console.log("response", response.JSON.stringify(data));
    if (!response.ok) {
      // Throws error for non-2xx responses
      throw new Error(`Register failed: ${response.status} ${response.statusText}`);
    }
    console.log("response", response.JSON.stringify(data));
    const result = await response.json();
    console.log("result", result);
    return result;
  } catch (err) {
    console.error("[MPC] registerUser error:", err);
    throw err;
  }
};

export const getUserInfo = async (ethereumAddress) => {
  const res = await mpcApi.get(`/user_info/${ethereumAddress}`);
  return res?.data;
};

// export const getStoredMpcAddresses = async () => {
//   const result = await chrome.storage.local.get("mpcAddresses");
//   console.log("[MPC] getStoredMpcAddresses ->", result?.mpcAddresses);
//   return result?.mpcAddresses || null;
// };

export const getStoredMpcAddresses = async () => {
  const data = await chrome.storage.local.get("accounts");
  const accounts = data.accounts || [];
  console.log("accounts",accounts);
  // Find the default account
  const defaultAccount = accounts.find(account => account?.default);
  console.log("defaultAccount",defaultAccount);

  if (!defaultAccount) {
    console.log("[MPC] No default account found");
    return null;
  }

  console.log("[MPC] Default account MPC addresses ->", defaultAccount?.mpcAddresses);
  return defaultAccount?.mpcAddresses || null;
};


// export const setStoredMpcAddresses = async (addresses) => {
//   // persist only known keys
//   const toStore = {
//     eth: addresses?.eth || null,
//     btc: addresses?.btc || null,
//   };
  
//   await chrome.storage.local.set({ mpcAddresses: toStore });
//   console.log("[MPC] setStoredMpcAddresses <-", toStore);
//   return toStore;
// };

export const setStoredMpcAddresses = async (addresses) => {
  // Get all stored data first
  const data = await chrome.storage.local.get("accounts");
  const accounts = data.accounts || [];

  // Find the default account
  const updatedAccounts = accounts.map(account => {
    if (account?.default) {
      return {
        ...account,
        mpcAddresses: {
          eth: addresses?.eth || null,
          btc: addresses?.btc || null,
        },
      };
    }
    return account;
  });

  // Save back the updated accounts array
  await chrome.storage.local.set({ accounts: updatedAccounts });
  console.log("[MPC] Updated default account with mpcAddresses <-", addresses);

  return updatedAccounts;
};


export const ensureMpcAddresses = async (currentEthAddress) => {
    console.log("[MPC] ensureMpcAddresses start for ETH addr:", currentEthAddress);
  
    // 1) Check storage first
    const existing = await getStoredMpcAddresses();
    if (existing?.eth && existing?.btc) return existing;
  
    // 2) Try user_info
    try {
      console.log("[MPC] calling user_info");
      const info = await getUserInfo(currentEthAddress);
      console.log("info", info);
      // If user_info returned an error indicating user not found
      if (info?.status === "error" && info?.error?.error_code === "USER_NOT_FOUND") {
        console.warn("[MPC] User not found, proceeding to register");
        const registered = await registerAndFetchAddresses(currentEthAddress);
        if (registered) return registered;
      }
  
      const eth = info?.derived_eth_address;
      const btc = info?.derived_btc_address;
      console.log("[MPC] user_info response:", { eth, btc });
  
      if (eth || btc) {
        return await setStoredMpcAddresses({ eth, btc });
      }
    } catch (err) {
      console.warn("[MPC] user_info failed, proceeding to register:", err?.message || err);
      const registered = await registerAndFetchAddresses(currentEthAddress);
      if (registered) return registered;
    }
  
    return await getStoredMpcAddresses();
  };
  
  // Helper to register user and fetch addresses
  export const registerAndFetchAddresses = async (ethAddress) => {
    try {
      console.log("[MPC] calling register_user");
      await registerUser(ethAddress);
      console.log("[MPC] register_user done, re-calling user_info");
      const info = await getUserInfo(ethAddress);
      const eth = info?.eth;
      const btc = info?.btc;
      console.log("[MPC] user_info after register:", { eth, btc });
      if (eth || btc) {
        return await setStoredMpcAddresses({ eth, btc });
      }
    } catch (err) {
      console.error("[MPC] register flow failed:", err?.message || err);
      await setStoredMpcAddresses({ eth: null, btc: null });
    }
    return null;
  };
  
