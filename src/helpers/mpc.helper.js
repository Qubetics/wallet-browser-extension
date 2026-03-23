/*global chrome*/
import axios from "axios";
import { server } from "../server";
import { store } from "..";
import { WalletHelper } from "./wallet.helper";
import { Web3Helper } from "./web3.helper";
import { BTCHelper } from "./btc.helper";

// Base URL for MPC service
const STAGE_MPC_BASE_URL = process.env.REACT_APP_CHAIN_ABSTRACTION_API_URL_PROD;
const mpcApi = axios.create({ baseURL: STAGE_MPC_BASE_URL });

export const registerUser = async (ethereumAddress, signature = null, message = null) => {
  const data = { tics_address: ethereumAddress };
  
  // Add signature and message if provided
  if (signature && message) {
    data.signature = signature;
    data.message = message;
  }
  
  // console.log("data", data);
  
  try {
    const response = await fetch(`${STAGE_MPC_BASE_URL}/register_user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.REACT_APP_CHAIN_ABSTRACTION_API_KEY,
      },
      body: JSON.stringify(data),
    });

    // console.log("response", response);

    if (!response.ok) {
      throw new Error(`Register failed: ${response.status} ${response.statusText}`);
    }

    // ✅ Use global JSON.parse, not response.JSON
    const result = await response.json();
    // console.log("result", result);

    return result;
  } catch (err) {
    // console.error("[MPC] registerUser error:", err);
    throw err;
  }
};

export const getUserInfo = async (ethereumAddress) => {
  try {
    const res = await mpcApi.get(`/user_info/${ethereumAddress}`);
    return res?.data;
  } catch (err) {
    // console.error("[MPC] registerUser error:", err);
    throw err;
  }
};


export const getStoredMpcAddresses = async () => {
  const data = await chrome.storage.local.get("accounts");
  const accounts = data.accounts || [];
  // console.log("accounts",accounts);
  // Find the default account
  const defaultAccount = accounts.find(account => account?.default);
  // console.log("defaultAccount",defaultAccount);

  if (!defaultAccount) {
    // console.log("[MPC] No default account found");
    return null;
  }

  // console.log("[MPC] Default account MPC addresses ->", defaultAccount?.mpcAddresses);
  return defaultAccount?.mpcAddresses || null;
};

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
  // console.log("[MPC] Updated default account with mpcAddresses <-", addresses);

  return updatedAccounts;
};

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

    // console.log("[MPC] Getting MPC wallets from backend:", payload);

    const response = await server.post(
      "/mpc/getMpcWallets",
      payload,
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    // console.log("[MPC] Get MPC wallets response:", response);
    // Response structure: response.data.data.data is the array of wallet objects
    const walletData = response?.data?.data?.data || response?.data?.data || null;
    // console.log("[MPC] Extracted wallet data:", walletData);
    return walletData;
  } catch (error) {
    // console.error("[MPC] Error getting MPC wallets:", error);
    return null;
  }
};


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

    // console.log("[MPC] Saving MPC wallets to backend:", payload);

    const response = await server.post(
      "mpc/saveMpcWallets",
      payload,
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    // console.log("[MPC] Save MPC wallets response:", response);
    return response;
  } catch (error) {
    // console.error("[MPC] Error saving MPC wallets:", error);
    // Don't throw - this is not critical for the flow
    return null;
  }
};

export const ensureMpcAddresses = async (currentEthAddress, sessionPassword = null) => {
    // console.log("[MPC] ensureMpcAddresses start for ETH addr:", currentEthAddress);
  
    // Get password from chrome storage session if not provided
    if (!sessionPassword) {
      try {
        const { password } = await chrome.storage.session.get('password');
        if (password) {
          sessionPassword = password;
          // console.log("[MPC] Retrieved password from chrome storage session");
        }
      } catch (err) {
        // console.warn("[MPC] Could not retrieve password from storage:", err?.message || err);
      }
    }
  
    // 1) Check storage first
    const existing = await getStoredMpcAddresses();
    if (existing?.eth && existing?.btc) {
      // console.log("[MPC] Found existing addresses in storage:", existing);
      return existing;
    }
  
    // 2) Try user_info first
    try {
      // console.log("[MPC] calling user_info");
      const info = await getUserInfo(currentEthAddress);
      // console.log("info", info);
      
      // If user_info returned an error indicating user not found
      if (info?.status === "error" && info?.error?.error_code === "USER_NOT_FOUND") {
        // console.warn("[MPC] User not found, proceeding to register");
        const registered = await registerAndFetchAddresses(currentEthAddress, sessionPassword);
        if (registered) return registered;
      }
  
      const eth = info?.derived_eth_address;
      const btc = info?.derived_btc_address;
      // console.log("[MPC] user_info response:", { eth, btc });
  
      if (eth || btc) {
        const stored = await setStoredMpcAddresses({ eth, btc });
        //  console.log("[MPC] Stored addresses from user_info:", stored);
        
        // Save MPC wallets to backend API
        await saveMpcWallets(currentEthAddress, {
          derived_eth_address: eth,
          derived_btc_address: btc,
        });
        
        return { eth, btc };
      }
    } catch (err) {
      // console.warn("[MPC] user_info failed, proceeding to register:", err?.message || err); 
    }
    
    // 3) If user_info didn't work, try to register
    // console.log("[MPC] Proceeding to register user");
    const registered = await registerAndFetchAddresses(currentEthAddress, sessionPassword);
    if (registered) {
      // console.log("[MPC] Registration successful, returning addresses:", registered);
      return registered;
    }
  
    // 4) Final fallback - check storage again
    const finalCheck = await getStoredMpcAddresses();
    // console.log("[MPC] Final storage check:", finalCheck);
    return finalCheck;
  };
  
  // Helper to register user and fetch addresses
  export const registerAndFetchAddresses = async (ethAddress, sessionPassword = null) => {
    try {
      // console.log("[MPC] calling register_user");
      
      // Get password from chrome storage session if not provided
      if (!sessionPassword) {
        try {
          const { password } = await chrome.storage.session.get('password');
          if (password) {
            sessionPassword = password;
            // console.log("[MPC] Retrieved password from chrome storage session for registration");
          }
        } catch (err) {
          // console.warn("[MPC] Could not retrieve password from storage:", err?.message || err);
        }
      }
      
      // Generate signature and message if password is provided
      let signature = null;
      let message = null;
      
      if (sessionPassword) {
        try {
          const timestamp = Math.floor(new Date().getTime() / 1000);
          message = `register:${ethAddress}:${timestamp}`;
          
          // Get wallet to sign the message
          const wallet = await WalletHelper.getPrivateKeyEvm(sessionPassword);
          if (wallet && wallet !== false && typeof wallet.signMessage === 'function') {
            signature = await wallet.signMessage(message);
            // console.log("[MPC] Generated signature for registration:", signature);
            // console.log("[MPC] Message:", message);
          } else {
            // console.warn("[MPC] Could not get valid wallet (returned:", wallet, "), registering without signature");
          }
        } catch (signError) {
          // console.error("[MPC] Failed to generate signature:", signError?.message || signError);
        }
      } else {
        // console.warn("[MPC] No session password provided, registering without signature");
      }
      
      const registerResponse = await registerUser(ethAddress, signature, message);
      //  console.log("registerResponse", registerResponse);
      if (registerResponse?.status === "error") {
        // console.error("[MPC] register_user failed:", registerResponse?.error?.error_message);
        return null;
      }
      
      // Get addresses from the register response
      const eth = registerResponse?.derived_eth_address;
      const btc = registerResponse?.derived_btc_address;
      // console.log("[MPC] addresses from register response:", { eth, btc });
      
      if (eth || btc) {
        const stored = await setStoredMpcAddresses({ eth, btc });
        // console.log("[MPC] stored addresses:", stored); 
        
        // Save MPC wallets to backend API
        await saveMpcWallets(ethAddress, {
          derived_eth_address: eth,
          derived_btc_address: btc,
        });
        
        return { eth, btc };
      }
      
      // Fallback: try user_info if register response doesn't have addresses
      // console.log("[MPC] register_user done, re-calling user_info");
      const info = await getUserInfo(ethAddress);
      const ethFromInfo = info?.derived_eth_address;
      const btcFromInfo = info?.derived_btc_address;
      // console.log("[MPC] user_info after register:", { ethFromInfo, btcFromInfo });
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
      // console.error("[MPC] register flow failed:", err?.message || err);
      await setStoredMpcAddresses({ eth: null, btc: null });
    }
    return null;
  };


export const getNetworkAddresses = async () => {
  try {
    const response = await fetch(`${STAGE_MPC_BASE_URL}/get_network_addresses`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch network addresses: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // console.log("[MPC] Network addresses:", result);
    
    if (result?.status === "success" && result?.network_addresses) {
      const networkAddresses = {
        btc_address: result?.network_addresses?.btc_address, 
        eth_address: result?.vault_address 
      };
      return networkAddresses;
    }
    
    throw new Error("Invalid response format from network addresses API");
  } catch (err) {
    // console.error("[MPC] Error fetching network addresses:", err);
    throw err;
  }
};


export const checkLiquidityAvailability = async (token1, token2 = null, rpcUrl = null, requiredAmount = null) => {
  try {
    const isCrossChain = token2 && token1?.id !== token2?.id;
    // Always check the destination token (token2) liquidity if provided
    const tokenToCheck = token2 || token1;
    const tokenSymbol = tokenToCheck?.coinSymbol || token1?.coinSymbol;
    
    // Get network addresses
    const networkAddresses = await getNetworkAddresses();
    
    // Determine if destination token is BTC or ETH/TICS
    const isBTC = tokenToCheck?.coinFamily === 3 || tokenToCheck?.chain?.currencyName === "BTC";
    const isEVM = tokenToCheck?.chain?.isEVM || tokenToCheck?.coinFamily === 7 || tokenToCheck?.coinFamily === 2;
    
    // For cross-chain, use destination token's RPC if available
    const rpcToUse = isCrossChain && token2?.rpc ? token2.rpc : rpcUrl;
    let balance = 0;
    let hasLiquidity = false;
    const minimumThreshold = 0.001; // Minimum liquidity threshold
    
    if (isBTC) {
      // Check BTC network address balance
      const btcAddress = networkAddresses?.btc_address;
      if (!btcAddress) {
        return {
          available: false,
          message: "Network address not available. Please try again later.",
        };
      }
      
      balance = await BTCHelper.getMempoolBTC(btcAddress);
      balance = parseFloat(balance) || 0;
      
      // Calculate required amount (use provided amount or minimum threshold)
      const required = requiredAmount ? parseFloat(requiredAmount) : minimumThreshold;
      


      // Log liquidity details
      // console.log("[MPC] ===== BTC Liquidity Check =====");
      // console.log("[MPC] Swap Type:", isCrossChain ? `Cross-Chain (${token1?.coinSymbol} → BTC)` : "Same-Chain");
      // console.log("[MPC] Available Liquidity:", balance, "BTC");
      // console.log("[MPC] Required Liquidity:", required, "BTC");
      // console.log("[MPC] Minimum Threshold:", minimumThreshold, "BTC");
      // console.log("[MPC] Liquidity Status:", balance >= required ? "SUFFICIENT" : "INSUFFICIENT");
      if (balance < required) {
        // console.log("[MPC] Shortfall:", (required - balance), "BTC");
      }
      // console.log("[MPC] ===============================");
      
      // Consider liquidity available if balance >= required amount
      hasLiquidity = balance >= required;
      
    } else if (isEVM && rpcToUse) {
      // Check ETH/TICS network address balance
      const ethAddress = networkAddresses?.eth_address;
      if (!ethAddress) {
        // console.warn("[MPC] ETH network address not found");
        return {
          available: false,
          message: "Network address not available. Please try again later.",
        };
      }
      
      // console.log("[MPC] Checking EVM liquidity for address:", ethAddress);
      
      if (tokenToCheck?.isToken && tokenToCheck?.tokenAddress) {
        // Check token balance
        balance = await Web3Helper.getTokenBalance(
          tokenToCheck.tokenAddress,
          ethAddress,
          rpcToUse
        );
        balance = parseFloat(balance) || 0;
      } else {
        // Check native coin balance
        const balanceBN = await Web3Helper.getCoinBalance(ethAddress, rpcToUse);
        if (balanceBN && balanceBN.toNumber) {
          balance = balanceBN.toNumber();
        } else {
          balance = parseFloat(balanceBN?.toString() || 0);
        }
      }
      
      // Calculate required amount (use provided amount or minimum threshold)
      const required = requiredAmount ? parseFloat(requiredAmount) : minimumThreshold;
      
      // Log liquidity details
      // console.log("[MPC] ===== EVM Liquidity Check =====");
      // console.log("[MPC] Swap Type:", isCrossChain ? `Cross-Chain (${token1?.coinSymbol} → ${tokenSymbol})` : "Same-Chain");
      // console.log("[MPC] Token Symbol:", tokenSymbol);
      // console.log("[MPC] Available Liquidity:", balance, tokenSymbol);
      // console.log("[MPC] Required Liquidity:", required, tokenSymbol);
      // console.log("[MPC] Minimum Threshold:", minimumThreshold, tokenSymbol);
      // console.log("[MPC] Liquidity Status:", balance >= required ? "SUFFICIENT" : "INSUFFICIENT");
      if (balance < required) {
        // console.log("[MPC] Shortfall:", (required - balance), tokenSymbol);
      }
      // console.log("[MPC] ===============================");
      
      // Consider liquidity available if balance >= required amount
      hasLiquidity = balance >= required;
      
    } else {
      // console.warn("[MPC] Unsupported chain type for liquidity check");
      // For unsupported chains, assume liquidity is available
      return {
        available: true,
        message: "Liquidity check skipped for this chain",
      };
    }
    
    if (!hasLiquidity) {
      const required = requiredAmount ? parseFloat(requiredAmount) : minimumThreshold;
      // console.error("[MPC] ❌ INSUFFICIENT LIQUIDITY");
      // console.error("[MPC] Available:", balance, "| Required:", required, "| Shortfall:", (required - balance));
      
      return {
        available: false,
        message: "No liquidity available at the moment. Please try again later.",
        balance: balance,
        required: required,
        shortfall: required - balance,
      };
    }
    
    // console.log("[MPC] ✅ SUFFICIENT LIQUIDITY - Proceeding with transaction");
    return {
      available: true,
      message: "Liquidity available",
      balance: balance,
      required: requiredAmount ? parseFloat(requiredAmount) : minimumThreshold,
    };
  } catch (error) {
    // console.error("[MPC] Error checking liquidity:", error?.message || error);
    // On error, don't block the transaction - assume liquidity is available
    return {
      available: true,
      message: "Liquidity check failed, proceeding anyway",
      error: error?.message,
    };
  }
};
  
