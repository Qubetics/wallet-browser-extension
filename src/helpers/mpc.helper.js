/*global chrome*/
import axios from "axios";
import { server } from "../server";
import { store } from "..";

// Base URL for MPC service
const MPC_BASE_URL = "http://124.243.183.85:8082";

const mpcApi = axios.create({ baseURL: MPC_BASE_URL });

// Action type for getting MPC wallets

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

/**
 * Get MPC wallets from backend API
 * @param {string} walletAddress - Original wallet address
 * @param {number} coinFamily - Coin family (not used, always sends 1 to get balance)
 * @returns {Promise<Array>} Array of MPC wallet data with balances
 */
export const getMpcWallets = async (walletAddress, coinFamily = 1) => {
  try {
    const { account } = store.getState();
    
    if (!account?.jwtToken) {
      console.warn("[MPC] No JWT token available, skipping get MPC wallets API call");
      return null;
    }

    // API expects an array with coin_family: 1 to return balance
    const payload = {
      wallet_address: walletAddress,
      coin_family: 1,
    };

    console.log("[MPC] Getting MPC wallets from backend:", payload);

    const response = await server.post(
      "/mpc/getMpcWallets",
      payload,
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    console.log("[MPC] Get MPC wallets response:", response);
    // Response structure: response.data.data.data is the array of wallet objects
    const walletData = response?.data?.data?.data || response?.data?.data || null;
    console.log("[MPC] Extracted wallet data:", walletData);
    return walletData;
  } catch (error) {
    console.error("[MPC] Error getting MPC wallets:", error);
    return null;
  }
};

/**
 * Save MPC wallets to backend API
 * @param {string} ethereumAddress - Original Ethereum address
 * @param {Object} derivedAddresses - Object with derived_btc_address and derived_eth_address
 */
export const saveMpcWallets = async (ethereumAddress, derivedAddresses) => {
  try {
    const { account } = store.getState();
    
    if (!account?.jwtToken) {
      console.warn("[MPC] No JWT token available, skipping save MPC wallets API call");
      return;
    }

    const payload = {
      wallet_address: ethereumAddress,
      btc_wallet_address: derivedAddresses?.derived_btc_address || derivedAddresses?.btc || null,
      tics_wallet_address: derivedAddresses?.derived_eth_address || derivedAddresses?.eth || null,
    };

    console.log("[MPC] Saving MPC wallets to backend:", payload);

    const response = await server.post(
      "mpc/saveMpcWallets",
      payload,
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    console.log("[MPC] Save MPC wallets response:", response);
    return response;
  } catch (error) {
    console.error("[MPC] Error saving MPC wallets:", error);
    // Don't throw - this is not critical for the flow
    return null;
  }
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
        
        // Save MPC wallets to backend API
        await saveMpcWallets(currentEthAddress, {
          derived_eth_address: eth,
          derived_btc_address: btc,
        });
        
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
        
        // Save MPC wallets to backend API
        await saveMpcWallets(ethAddress, {
          derived_eth_address: eth,
          derived_btc_address: btc,
        });
        
        return { eth, btc };
      }
      
      // Fallback: try user_info if register response doesn't have addresses
      console.log("[MPC] register_user done, re-calling user_info");
      const info = await getUserInfo(ethAddress);
      const ethFromInfo = info?.derived_eth_address;
      const btcFromInfo = info?.derived_btc_address;
      console.log("[MPC] user_info after register:", { ethFromInfo, btcFromInfo });
      if (ethFromInfo || btcFromInfo) {
        await setStoredMpcAddresses({ eth: ethFromInfo, btc: btcFromInfo });
        
        // Save MPC wallets to backend API
        await saveMpcWallets(ethAddress, {
          derived_eth_address: ethFromInfo,
          derived_btc_address: btcFromInfo,
        });
        
        return { eth: ethFromInfo, btc: btcFromInfo };
      }
    } catch (err) {
      console.error("[MPC] register flow failed:", err?.message || err);
      await setStoredMpcAddresses({ eth: null, btc: null });
    }
    return null;
  };
  
