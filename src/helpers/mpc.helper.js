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
      },
      body: JSON.stringify(data),
    });

    console.log("response", response);

    if (!response.ok) {
      throw new Error(`Register failed: ${response.status} ${response.statusText}`);
    }

    // ✅ Use global JSON.parse, not response.JSON
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
    if (existing?.eth && existing?.btc) {
      console.log("[MPC] Found existing addresses in storage:", existing);
      return existing;
    }
  
    // 2) Try user_info first
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
        const stored = await setStoredMpcAddresses({ eth, btc });
        console.log("[MPC] Stored addresses from user_info:", stored);
        return { eth, btc };
      }
    } catch (err) {
      console.warn("[MPC] user_info failed, proceeding to register:", err?.message || err);
    }
    
    // 3) If user_info didn't work, try to register
    console.log("[MPC] Proceeding to register user");
    const registered = await registerAndFetchAddresses(currentEthAddress);
    if (registered) {
      console.log("[MPC] Registration successful, returning addresses:", registered);
      return registered;
    }
  
    // 4) Final fallback - check storage again
    const finalCheck = await getStoredMpcAddresses();
    console.log("[MPC] Final storage check:", finalCheck);
    return finalCheck;
  };
  
  // Helper to register user and fetch addresses
  export const registerAndFetchAddresses = async (ethAddress) => {
    try {
      console.log("[MPC] calling register_user");
      const registerResponse = await registerUser(ethAddress);
      console.log("registerResponse", registerResponse);
      if (registerResponse?.status === "error") {
        console.error("[MPC] register_user failed:", registerResponse?.error?.error_message);
        return null;
      }
      
      // Get addresses from the register response
      const eth = registerResponse?.derived_eth_address;
      const btc = registerResponse?.derived_btc_address;
      console.log("[MPC] addresses from register response:", { eth, btc });
      
      if (eth || btc) {
        const stored = await setStoredMpcAddresses({ eth, btc });
        console.log("[MPC] stored addresses:", stored);
        return { eth, btc };
      }
      
      // Fallback: try user_info if register response doesn't have addresses
      console.log("[MPC] register_user done, re-calling user_info");
      const info = await getUserInfo(ethAddress);
      const ethFromInfo = info?.derived_eth_address;
      const btcFromInfo = info?.derived_btc_address;
      console.log("[MPC] user_info after register:", { ethFromInfo, btcFromInfo });
      if (ethFromInfo || btcFromInfo) {
        return await setStoredMpcAddresses({ eth: ethFromInfo, btc: btcFromInfo });
      }
    } catch (err) {
      console.error("[MPC] register flow failed:", err?.message || err);
      await setStoredMpcAddresses({ eth: null, btc: null });
    }
    return null;
  };
  
