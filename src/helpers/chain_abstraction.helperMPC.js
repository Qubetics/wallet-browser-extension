/* global BigInt */
import axios from "axios";
import { BTCHelper } from "./btc.helper";
import { Web3Helper } from "./web3.helper";
import { WalletHelper } from "./wallet.helper";
import { server } from "../server";
import { store } from "..";
import BigNumber from "bignumber.js";
import { getRpcUrl } from './rpcService';
const { ethers } = require("ethers");


const getQubeticsRpc = () => getRpcUrl('REACT_APP_QUBETIC_RPC');
const STAGE_MPC_BASE_URL = process.env.REACT_APP_CHAIN_ABSTRACTION_API_URL_PROD;
const RESOLVE_API_BASE_URL = process.env.REACT_APP_CHAIN_ABSTRACTION_PROD_API_URL;
const INTENT_DETAILS_BASE_URL = process.env.REACT_APP_CHAIN_ABSTRACTION_API_URL_PROD;

export class MpcChainAbstractionHelper {
  chainId;

  constructor(chainId) {
    this.chainId = chainId;
  }

  createMpcSwapOrder = async (data) => {
    try {
      const response = await axios.post(
        `${STAGE_MPC_BASE_URL}/user_mpc_deposit`,
        data,
        {
          headers: {
            "X-API-KEY": process.env.REACT_APP_CHAIN_ABSTRACTION_API_KEY,
          },
        }
      );

      // console.log("this is  data ", response.data);

      const result = await response?.data;
      // console.log("result", result);
      return result;
    } catch (err) {
      // console.error("[MPC] registerUser error:", err);
      throw err;
    }
  };


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

      // console.log("Saving transaction with endpoint:", endpoint);
      // console.log("Transaction data:", data);

      const response = await server.post(endpoint, data, {
        headers: {
          Authorization: account.jwtToken,
        },
      });

      // console.log("Save transaction response:", response);
      return response;
    } catch (error) {
      // console.error("Error saving intent hash:", error);
      return false;
    }
  };

  callResolveIntent = async (intentId) => {
    try {
      const url = `${RESOLVE_API_BASE_URL}/api/routes/intent/resolve`;
      await axios.post(url, { intent_id: intentId }, { headers: { "Content-Type": "application/json" } });
    } catch (err) {
      // console.error("[MPC] callResolveIntent error:", err);
      throw err;
    }
  };


  getIntentDetails = async (intentId) => {
    try {
    const url = `${INTENT_DETAILS_BASE_URL}/intent_details/${intentId}`;
      const response = await axios.get(url);
      return response?.data;
    } catch (err) {
      // console.error("[MPC] getIntentDetails error:", err);
      throw err;
    }
  };


  async pollIntentStatus(intentHash) {
    try {
      const intentId = String(intentHash || "").replace(/^0x/, "");
      const details = await this.getIntentDetails(intentId);

      if (!details || details?.status === "not_found") {
        return { data: null };
      }

      const intentStatus = String(details?.intent_status || "Pending").toLowerCase();
      let status = 2; // pending
      if (intentStatus === "solved") status = 1;
      if (intentStatus === "failed" || intentStatus === "rejected") status = 0;

      return {
        data: {
          intent_hash: details?.intent_hash || intentId,
          status,
          solver_id: details?.final_solver_id || "N/A",
          source_address: details?.source_address || "N/A",
          fees: details?.fees,
          user_to_network_tx_id: details?.user_to_network_tx_id,
          network_to_target_tx_id: details?.network_to_target_tx_id,
        },
      };
    } catch (err) {
      return { data: null, error: true, message: err?.message || "Failed to fetch intent details" };
    }
  }
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
    toAddress,
    options = {}
  ) => {
    try {
      // console.log("=== MPC Transaction Start ===");
      // console.log("Transaction parameters:", {
      //   token1,
      //   token2: token2?.symbol,
      //   amount,
      //   receivedAmount,
      //   mpcFromAddress,
      //   toAddress,
      //   chainId: chain?.chainId,
      //   coinFamily: token1?.coinFamily,
      // });

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

      // console.log("token1?.decimals", token1?.decimals);

      // ============================================
      // FIX: Correct decimal calculation for Bitcoin (8 decimals)
      // ============================================
      let decimals;
      if (token1?.coinFamily === 3) {
        decimals = 8; // Bitcoin uses 8 decimals (satoshis)
      } else {
        decimals = token1?.chain?.currencyDecimals || 18;
      }

      // console.log(`Using ${decimals} decimals for ${token1?.coinSymbol}`);

      // let amountWithDecimals = amount * Math.pow(10, decimals);
      // amountWithDecimals = this.exponentialToDecimal(
      //   Number(amountWithDecimals).toFixed(0)
      // );

      const amountWithDecimals = new BigNumber(amount || 0)
        .multipliedBy(new BigNumber(10).pow(decimals))
        .integerValue(BigNumber.ROUND_DOWN);

      if (!amountWithDecimals.isFinite() || amountWithDecimals.lte(0)) {
        throw new Error("Invalid amount for chain abstraction transaction.");
      }

      // console.log("Amount with decimals:", amountWithDecimals.toString());

      // console.log("Amount with decimals:", amountWithDecimals);

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
        amount: amountWithDecimals.toFixed(0),
        // amount: Number(amountWithDecimals),
        source_token: token1?.coinSymbol?.toLowerCase(),
        target_token: isSameCoin
          ? token1?.coinSymbol?.toLowerCase()
          : token2?.coinSymbol?.toLowerCase(),
        timestamp: new Date().getTime(),
      };

      // console.log("Message to sign:", msg);

      const payloadStr = JSON.stringify(msg);

      // Sign the message
      const provider = new ethers.providers.JsonRpcProvider(
        token1?.rpc || getQubeticsRpc()
      );
      const wallet = new ethers.Wallet(privateKey).connect(provider);
      const signature = await wallet.signMessage(payloadStr);

      // console.log("Signature:", signature);

      // Create swap order
      const swapData = {
        signature: signature,
        msg: msg,
      };

      const response = await this.createMpcSwapOrder(swapData);
      // console.log("MPC swap order response:", response);

      if (!response) {
        throw new Error("Failed to create MPC swap order");
      }

      // Extract intent_hash (new API can return status "error" with intent_hash)
      let intentHash = response?.intent_hash;

      const intentData = await this.getIntentDetails(intentHash);
      
      if (!intentHash && response?.status === "timeout" && response?.error_message) {
        const parts = response.error_message.split("Intent hash: ");
        if (parts.length > 1) {
          const hash = parts[1].split(".")[0];
          intentHash = hash.startsWith("0x") ? hash : "0x" + hash;
        }
      }
      const intentId = intentHash && typeof intentHash === "string"
        ? (intentHash.startsWith("0x") ? intentHash.slice(2) : intentHash)
        : null;

      const intentStatus = String(intentData?.intent_status || "Pending").toLowerCase();

      const coinFamily2 = token1?.coinFamily;
      const fallbackFromAddress = mpcFromAddress || account?.coinFamilyAndAddress?.[coinFamily2];
      const resolvedFromAddress = intentData?.source_address || fallbackFromAddress;
      const resolvedToAddress = intentData?.target_address || toAddress;

      if (
        intentId &&
        (intentStatus === "pending" ||
          intentStatus === "solved" ||
          intentStatus === "failed" ||
          intentStatus === "rejected")
      ) {
        if (options?.onIntentCreated) {
          options.onIntentCreated(intentHash || intentId);
        }

        // Fire resolve in background so we don't block the UI
        this.callResolveIntent(intentId).catch(() => {});


        let gasprice = { gas_price: "0" };
        try {
          gasprice = await this.getGasPrice(
            token1?.coinSymbol?.toLowerCase() === "tics" ? "qubetics" : "bitcoin",
            toAddress,
            mpcFromAddress,
            false,
            "",
            token1?.coinSymbol
          ) || gasprice;
        } catch (e) {
          // use default
        }

        const txStatusForSave =
          intentStatus === "solved"
            ? "confirmed"
            : intentStatus === "failed" || intentStatus === "rejected"
            ? "failed"
            : "pending";

        const saveData = {
          amount: Number(amount),
          gas_price: gasprice?.gas_price || "0",
          from: resolvedFromAddress,
          tx_hash: intentId,
          intent_hash: intentId,
          to: resolvedToAddress,
          tx_type: "chain_abstraction",
          tx_status: txStatusForSave,
          coin_symbol: token1?.coinSymbol?.toLowerCase(),
          coin_family: token1?.coinFamily,
        };
        if (token1?.coinFamily !== 3) {
          saveData.gas_estimate = "30000";
        }

          await this.saveIntentHash(saveData);
     
        return {
          hash: intentId,
          status:
            intentStatus === "solved"
              ? 1
              : intentStatus === "failed" || intentStatus === "rejected"
              ? 0
              : 2, // pending
          solver: "N/A",
          source_address: mpcFromAddress || "N/A",
        };
      }

    } catch (error) {
      throw error;
    }
  };


  getCoinFamilyUrl = (coinFamily) => {
    const urlMap = {
      3: "bitcoin/btc", // Bitcoin
      7: "qubetics/tics", // Qubetics TICS
    };
    return urlMap[coinFamily] || "bitcoin/btc"; // Default to bitcoin
  };

  async getMpcCoinBalance(address, rpc) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      const balance = await provider.getBalance(address);
      const balanceInEth = ethers.utils.formatUnits(balance, 18);
      return new BigNumber(balanceInEth).toNumber();
    } catch (error) {
      return 0;
    }
  }


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
        balance = await BTCHelper.getMempoolBTC(mpcAddress);
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
