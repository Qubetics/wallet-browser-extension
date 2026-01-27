/* global BigInt */
import axios from "axios";
import { BTCHelper } from "./btc.helper";
import { Web3Helper } from "./web3.helper";
import { WalletHelper } from "./wallet.helper";
import { server } from "../server";
import { store } from "..";
import BigNumber from "bignumber.js";
const { ethers } = require("ethers");

const QUBETICS_RPC = process.env.REACT_APP_QUBETIC_RPC;
const STAGE_MPC_BASE_URL = process.env.REACT_APP_CHAIN_ABSTRACTION_API_URL;
const INTENT_STATUS_BASE_URL = process.env.REACT_APP_CHAIN_ABSTRACTION_STAGE_API_URL;
/**
 * MPC Chain Abstraction Helper
 * Handles cross-chain transactions using MPC wallets
 */
export class MpcChainAbstractionHelper {
  chainId;

  constructor(chainId) {
    this.chainId = chainId;
  }

  /**
   * Get chain identifier for intent
   */
  getIntentChainId = (coinFamily) => {
    switch (coinFamily) {
      case 7:
        return "TICS";
      case 2:
        return "sepolia";
      case 3:
        return "BTC";
      default:
        return "TICS";
    }
  };

  /**
   * Create MPC swap order via API
   * @param {Object} swapData - Contains signature and message
   * @returns {Promise<Object>} API response
   */
  createMpcSwapOrder = async (data) => {
    try {
      const response = await axios.post(
        `${STAGE_MPC_BASE_URL}/user_mpc_deposit`,
        data,
        {
          headers: {
            "X-API-KEY":
              "REDACTED",
          },
        }
      );

      console.log("this is  data ", response.data);

      const result = await response?.data;
      console.log("result", result);
      return result;
    } catch (err) {
      console.error("[MPC] registerUser error:", err);
      throw err;
    }
  };

  /**
   * Submit intent hash to backend
   */
  saveIntentHash = async (data) => {
    try {
      const { account } = store.getState();

      // Determine the chain path based on coin symbol or family
      let chainPath = "qubetics/";
      if (data.coin_family === 3 || data.coin_symbol === "btc") {
        chainPath = "bitcoin/";
      }
      // Determine coin symbol (lowercase)
      const coinSymbol = data?.coin_symbol || "tics";

      // Build the endpoint
      const endpoint = `${chainPath}${coinSymbol}/saveTransaction`;

      console.log("Saving transaction with endpoint:", endpoint);
      console.log("Transaction data:", data);

      const response = await server.post(endpoint, data, {
        headers: {
          Authorization: account.jwtToken,
        },
      });

      console.log("Save transaction response:", response);
      return response;
    } catch (error) {
      console.error("Error saving intent hash:", error);
      return false;
    }
  };

  /**
   * Poll intent status until completion
   * Retries up to 5 times even for HTTP 500 errors
   */
  async pollIntentStatus(intentHash) {
    const url = `${INTENT_STATUS_BASE_URL}/api/routes/intent-status?intent-hash=${intentHash}`;
    const MAX_RETRIES = 10;
    const MAX_500_RETRIES = 5; // Retry 5 times even for 500 errors
    let attempts = 0;
    let error500Attempts = 0;

    return new Promise((resolve) => {
      async function poll() {
        attempts++;
        try {
          const response = await axios.get(url);
          const { error, data } = response.data;

          // Check for HTTP 500 error - retry up to 5 times
          if (response.status === 500 || (error && response.status >= 500)) {
            error500Attempts++;
            console.error(
              `Intent API returned 500 error (Attempt ${error500Attempts}/${MAX_500_RETRIES}):`,
              response.data
            );

            if (error500Attempts < MAX_500_RETRIES) {
              console.log(
                `Retrying after 500 error in 2 seconds... (500 Error Attempt ${error500Attempts})`
              );
              setTimeout(poll, 2000);
              return;
            } else {
              console.error(
                "Max 500 error retries reached. Transaction failed."
              );
              resolve({
                error: true,
                message: "Transaction failed - intent API error",
                statusCode: 500,
                data: response.data,
              });
              return;
            }
          }

          // Reset 500 error counter on successful response
          error500Attempts = 0;

          if (!error && data) {
            console.log("Final Success Response:", response?.data);
            resolve(response?.data);
          } else if (attempts < MAX_RETRIES) {
            console.log(`Polling again in 2 seconds... (Attempt ${attempts})`);
            setTimeout(poll, 2000);
          } else {
            console.warn("Max retries reached. Stopping polling.");
            resolve({ error: true, message: "Max retries reached" });
          }
        } catch (error) {
          // Check if it's an HTTP 500 error
          if (error.response && error.response.status === 500) {
            error500Attempts++;
            console.error(
              `Intent API returned 500 error (Attempt ${error500Attempts}/${MAX_500_RETRIES}):`,
              error.response.data
            );

            if (error500Attempts < MAX_500_RETRIES) {
              console.log(
                `Retrying after 500 error in 2 seconds... (500 Error Attempt ${error500Attempts})`
              );
              setTimeout(poll, 2000);
              return;
            } else {
              console.error(
                "Max 500 error retries reached. Transaction failed."
              );
              resolve({
                error: true,
                message: "Transaction failed - intent API error",
                statusCode: 500,
                data: error.response?.data,
              });
              return;
            }
          }

          console.error(
            `Error fetching intent status (Attempt ${attempts}), retrying in 2 seconds:`,
            error
          );
          if (attempts < MAX_RETRIES) {
            setTimeout(poll, 2000);
          } else {
            console.warn("Max retries reached after errors. Stopping polling.");
            resolve({
              error: true,
              message: "Max retries reached after errors",
            });
          }
        }
      }

      poll();
    });
  }

  /**
   * Exponential to decimal conversion
   */
  exponentialToDecimal(num) {
    const data = String(num).split(/[eE]/);
    if (data.length === 1) return data[0];

    let z = "";
    const sign = num < 0 ? "-" : "";
    const str = data[0].replace(".", "");
    let mag = Number(data[1]) + 1;

    if (mag < 0) {
      z = sign + "0.";
      while (mag++) z += "0";
      return z + str.replace(/^-/, "");
    }
    mag -= str.length;
    while (mag--) z += "0";
    return str + z;
  }

  /**
   * Main MPC Send Transaction function
   * @param {Object} token1 - Source token
   * @param {Object} token2 - Destination token
   * @param {number} amount - Amount to send
   * @param {number} receivedAmount - Amount to receive
   * @param {string} mpcFromAddress - MPC wallet address
   * @param {Object} chain - Chain configuration
   * @param {number} fee - Network fee
   * @param {number} fiatValue - Fiat value
   * @param {Object} parentCoin - Parent coin data
   * @param {string} rpc - RPC endpoint
   * @param {string} symbol - Token symbol
   * @param {string} sessionPassword - User password
   * @param {string} toAddress - Recipient address
   * @returns {Promise<Object>} Transaction result
   */
  SendMpcTransaction = async (
    token1,
    token2,
    amount,
    receivedAmount,
    mpcFromAddress,
    chain,
    fee,
    fiatValue,
    parentCoin,
    rpc,
    symbol,
    sessionPassword,
    toAddress
  ) => {
    try {
      console.log("=== MPC Transaction Start ===");
      console.log("Transaction parameters:", {
        token1,
        token2: token2?.symbol,
        amount,
        receivedAmount,
        mpcFromAddress,
        toAddress,
        chainId: chain?.chainId,
        coinFamily: token1?.coinFamily,
      });

      // Get account and private key
      const { account } = store.getState();

      // Get the appropriate private key based on coin family
      const keyData = await WalletHelper.getPrivateKeyWithPassword(
        account,
        sessionPassword
      );
      const privateKey = keyData?.privateKey;

      if (!privateKey) {
        throw new Error("Unable to fetch private key");
      }

      console.log("token1?.decimals", token1?.decimals);

      // ============================================
      // FIX: Correct decimal calculation for Bitcoin (8 decimals)
      // ============================================
      let decimals;
      if (token1?.coinFamily === 3) {
        decimals = 8; // Bitcoin uses 8 decimals (satoshis)
      } else {
        decimals = token1?.chain?.currencyDecimals || 18;
      }

      console.log(`Using ${decimals} decimals for ${token1?.coinSymbol}`);

      // let amountWithDecimals = amount * Math.pow(10, decimals);
      // amountWithDecimals = this.exponentialToDecimal(
      //   Number(amountWithDecimals).toFixed(0)
      // );

      const amountWithDecimals =
        BigInt(amount) * BigInt(10) ** BigInt(decimals);

      console.log("Amount with decimals:", amountWithDecimals.toString());

      console.log("Amount with decimals:", amountWithDecimals);

      // Prepare message for signature
      // For same-coin transfers, both chains and tokens are the same
      const isSameCoin =
        token1?.coinSymbol?.toLowerCase() === token2?.coinSymbol?.toLowerCase();
      const sourceChain =
        token1?.coinSymbol?.toLowerCase() === "tics" ? "qubetics" : "bitcoin";
      const targetChain =
        token2?.coinSymbol?.toLowerCase() === "tics" ? "qubetics" : "bitcoin";

      const msg = {
        source_address: mpcFromAddress,
        target_address: toAddress,
        source_chain: sourceChain,
        target_chain: isSameCoin ? sourceChain : targetChain, 
        amount: amountWithDecimals.toString(),
        // amount: Number(amountWithDecimals),
        source_token: token1?.coinSymbol?.toLowerCase(),
        target_token: isSameCoin
          ? token1?.coinSymbol?.toLowerCase()
          : token2?.coinSymbol?.toLowerCase(),
        timestamp: new Date().getTime(),
      };

      console.log("Message to sign:", msg);

      const payloadStr = JSON.stringify(msg);

      // Sign the message
      const provider = new ethers.providers.JsonRpcProvider(
        token1?.rpc || QUBETICS_RPC
      );
      const wallet = new ethers.Wallet(privateKey).connect(provider);
      const signature = await wallet.signMessage(payloadStr);

      console.log("Signature:", signature);

      // Create swap order
      const swapData = {
        signature: signature,
        msg: msg,
      };

      const response = await this.createMpcSwapOrder(swapData);
      console.log("MPC swap order response:", response);

      if (!response || response.error) {
        throw new Error(response?.message || "Failed to create MPC swap order");
      }

      // Get transaction hash
      let txId = response?.user_to_network_tx_id;

      // Handle timeout case
      if (response?.status === "timeout" && response?.error_message) {
        const parts = response.error_message.split("Intent hash: ");
        if (parts.length > 1) {
          const hash = parts[1].split(".")[0];
          txId = "0x" + hash;
        }
      }

      console.log("Transaction ID:", txId);

      if (!txId) {
        throw new Error("No transaction ID received");
      }

      // Get gas price
      const gasprice = await this.getGasPrice(
        token1?.coinSymbol?.toLowerCase() === "tics" ? "qubetics" : "bitcoin",
        toAddress,
        mpcFromAddress,
        false,
        "",
        token1?.coinSymbol
      );

      console.log("Gas price:", gasprice);

      const coinFamily2 = token1?.coinFamily;
      const fromAddress = account?.coinFamilyAndAddress?.[coinFamily2];

      console.log("From address:", fromAddress);

      // ============================================
      // NEW FLOW: Poll intent status FIRST before saving transaction
      // ============================================
      console.log("Polling intent status before saving transaction...");
      const transactionResult = await this.pollIntentStatus(txId);

      console.log("Intent status poll result:", transactionResult);

      // Check if intent API returned an error (500 or other error)
      if (transactionResult?.error || transactionResult?.statusCode === 500) {
        console.error(
          "Intent API returned error - transaction failed:",
          transactionResult
        );
        // Return error result - don't save transaction
        throw new Error(
          transactionResult?.message || "Transaction failed - intent API error"
        );
      }

      // If we reach here, intent API returned success
      // Now prepare and save transaction data
      console.log("Intent API returned success - saving transaction...");

      // Prepare save data
      const saveData = {
        amount: Number(amount),
        gas_price: gasprice?.gas_price || "0",
        from: fromAddress,
        tx_hash: txId,
        to: toAddress,
        tx_type: "chain_abstraction",
        tx_status: "pending",
        coin_symbol: token1?.coinSymbol?.toLowerCase(),
        coin_family: token1?.coinFamily,
      };

      if (token1?.coinFamily !== 3) {
        saveData.gas_estimate = "30000";
      }

      // Save intent hash only after intent API confirms success
      await this.saveIntentHash(saveData);
      console.log(
        "Transaction saved successfully after intent API confirmation"
      );

      // ============================================
      // Update transaction status on backend
      // ============================================
      if (transactionResult?.data) {
        const intentHash = transactionResult.data.intent_hash;
        const status = transactionResult.data.status;

        console.log("Updating transaction status:", { intentHash, status });

        // Only update if we have a valid intent hash and status
        if (intentHash && status) {
          try {
            // Use helper function to get URL path
            const urlPath = this.getCoinFamilyUrl(token1?.coinFamily);

            const updateData = {
              tx_hash: txId,
              tx_status: status,
            };

            console.log("Calling update status API:", { urlPath, updateData });

            // Call the update status API
            const updateResponse = await server.post(
              `${urlPath}/updateTransactionStatus`,
              updateData,
              {
                headers: { Authorization: account.jwtToken },
              }
            );

            console.log("Update status API response:", updateResponse);
          } catch (updateError) {
            // Log error but don't fail the transaction
            console.error("Error updating transaction status:", updateError);
            // Don't throw - we still want to return the transaction result
          }
        } else {
          console.warn(
            "Skipping status update - missing intent hash or status:",
            { intentHash, status }
          );
        }
      }

      return {
        hash: transactionResult?.data?.intent_hash || txId,
        status: transactionResult?.data?.status || "pending",
        solver: transactionResult?.data?.solver_id || "N/A",
        source_address: transactionResult?.data?.source_address || "N/A",
      };
    } catch (error) {
      console.error("Error in SendMpcTransaction:", error);
      throw error;
    }
  };

  // ============================================
  // Helper function to get URL path (if not already in your class)
  // ============================================
  getCoinFamilyUrl = (coinFamily) => {
    const urlMap = {
      3: "bitcoin/btc", // Bitcoin
      7: "qubetics/tics", // Qubetics TICS
    };
    return urlMap[coinFamily] || "bitcoin/btc"; // Default to bitcoin
  };

  /**
   * Get coin balance from MPC wallet
   */
  async getMpcCoinBalance(address, rpc) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      const balance = await provider.getBalance(address);
      const balanceInEth = ethers.utils.formatUnits(balance, 18);
      return new BigNumber(balanceInEth).toNumber();
    } catch (error) {
      console.error("Error fetching MPC balance:", error);
      return 0;
    }
  }

  /**
   * Get token balance from MPC wallet
   */
  async getMpcTokenBalance(mpcAddress, tokenAddress, rpc, decimals = 18) {
    try {
      const balance = await Web3Helper.getTokenBalance(
        tokenAddress,
        mpcAddress,
        rpc,
        decimals
      );
      return parseFloat(balance) || 0;
    } catch (error) {
      console.error("Error fetching MPC token balance:", error);
      return 0;
    }
  }

  /**
   * Validate MPC wallet has sufficient balance
   */
  async validateMpcBalance(token, mpcAddress, amount, networkFee = 0) {
    try {
      let balance;

      if (token?.coinFamily === 3) {
        // BTC balance
        balance = await BTCHelper.getBTCBalance(mpcAddress);
        balance = parseFloat(balance) || 0;
      } else if (token?.isToken) {
        // ERC20 token
        balance = await this.getMpcTokenBalance(
          mpcAddress,
          token.tokenAddress,
          token.rpc,
          token.decimals
        );

        // Also check native balance for gas
        const nativeBalance = await this.getMpcCoinBalance(
          mpcAddress,
          token.rpc
        );

        if (nativeBalance < networkFee) {
          return {
            valid: false,
            message: "Insufficient native balance for gas fees",
            balance: nativeBalance,
          };
        }
      } else {
        // Native coin (ETH, TICS, etc.)
        balance = await this.getMpcCoinBalance(mpcAddress, token.rpc);
      }

      const totalRequired = token?.isToken
        ? parseFloat(amount)
        : parseFloat(amount) + networkFee;

      if (balance < totalRequired) {
        return {
          valid: false,
          message: `Insufficient MPC balance. Required: ${totalRequired}, Available: ${balance}`,
          balance,
        };
      }

      return {
        valid: true,
        message: "Sufficient balance",
        balance,
      };
    } catch (error) {
      console.error("Error validating MPC balance:", error);
      return {
        valid: false,
        message: "Error checking balance",
        balance: 0,
      };
    }
  }

  async getGasPrice(
    slug,
    toAddress,
    fromAddress,
    isToken,
    tokenAddress,
    symbol
  ) {
    const { account } = store.getState();
    try {
      const { data } = await server.post(
        `/${slug}/${isToken ? tokenAddress : symbol}/gas_estimation`,
        {
          from: fromAddress,
          to: toAddress,
          amount: "",
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      if (slug == "qubetics") {
        return {
          estimate: data.gas_estimate,
          fast: data.gas_price,
          propose: data.gas_price,
          safe: data.gas_price,
        };
      } else {
        return {
          estimate: data.gas_estimate,
          fast: data.resultList.fast_gas_price,
          propose: data.resultList.propose_gas_price,
          safe: data.resultList.safe_gas_price,
        };
      }
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const mpcChainAbstractionHelper = new MpcChainAbstractionHelper();
