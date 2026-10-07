/* global BigInt */
import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import Web3 from "web3";
import { ABI } from "../config/abi";
import { WalletHelper } from "./wallet.helper";
import { Web3Helper } from "./web3.helper";
import {
  CAKE_MAINNET_ROUTER,
  PANCAKE_NATIVE_WRAPPED_TOKEN_ADDRESSES,
} from "../config/pancake.config";

import { mainnet } from "wagmi";
import {
  Native,
  ChainId,
  CurrencyAmount,
  TradeType,
  Percent,
  ERC20Token,
} from "@pancakeswap/sdk";
import { store } from "..";
import { server } from "../server";
import { createPublicClient, http, hexToBigInt } from "viem";
import { GraphQLClient } from "graphql-request";
import {
  SmartRouter,
  SMART_ROUTER_ADDRESSES,
  SwapRouter,
} from "@pancakeswap/smart-router/evm";
import { exponential_to_decimal } from "./conversion.helper";
import { getRpcUrl } from './rpcService';
const chainId = ChainId.BSC;
const web3 = new Web3();

function getPublicClient() {
  return createPublicClient({
    chain: mainnet,
    transport: http(getRpcUrl('REACT_APP_BNB_RPC')),
    batch: {
      multicall: {
        batchSize: 1024 * 200,
      },
    },
  });
}
export class PancakeHelper {
  web3Provider = null;
  WETH = null;
  chainId = null;
  rpcUrl = null;
  routerAddress = null;

  constructor(rpcUrl) {
    this.rpcUrl = rpcUrl;
    this.web3Provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.WETH = PANCAKE_NATIVE_WRAPPED_TOKEN_ADDRESSES[56].address;
    this.chainId = 56;
    this.routerAddress = CAKE_MAINNET_ROUTER;
  }

  getTransactionStatusThroughHash = async (hash) => {
    try {
      const data = await this.web3Provider.getTransactionReceipt(hash);
      return data.status;
    } catch (error) {
      return false;
    }
  };

  async getQuoteAndRoute(chainId, src, dst, amount, fee) {
    try {
      const { account } = store.getState();
      const { data } = await server.post(
        '/on-chain/quote',
        {
          chain_id: parseInt(chainId),
          src,
          dst,
          amount,
          fee,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      return data.data
    } catch (error) {
      // console.log(error);
      return false;
    }
  }

  async sendForApproval(tokenAddress, walletAddress, spenderAddress, coinId) {
    try {
      const { account } = store.getState();
      const WALLET_SECRET = await WalletHelper.getPrivateKey();

      const contract = new ethers.Contract(
        tokenAddress, // The address of the ERC20 token contract
        ABI, // Replace with the actual ABI of the ERC20 token contract
        this.web3Provider // The provider you're using (e.g., Infura, Alchemy, etc.)
      );

      // Unlimited allowance value (2^256 - 1)
      const unlimitedAllowance = ethers.constants.MaxUint256;

      // Generate the approve transaction
      const approveTx = await contract.populateTransaction.approve(
        spenderAddress,
        unlimitedAllowance
      );

      const gasLimitRequired = await contract.estimateGas.approve(
        spenderAddress,
        unlimitedAllowance,
        {
          from: walletAddress,
        }
      );

      const gasPrice = await Web3Helper.getGasPrice(
        "bnb",
        walletAddress,
        walletAddress,
        0
      );

      approveTx.gasLimit = gasLimitRequired._hex;
      approveTx.gasPrice = Web3.utils.toHex(gasPrice.price * Math.pow(10, 9));
      approveTx.from = walletAddress;
      approveTx.value = "0x0";
      approveTx.chainId = 56;
      approveTx.nonce = gasPrice.nonce;

      // Sign the transaction with the wallet's private key
      const wallet = new ethers.Wallet(WALLET_SECRET, this.web3Provider);
      const signedTransaction = await wallet.signTransaction(approveTx);

      // Send the signed transaction to the server for approval
      const response = await server.post(
        `/bnb/send`,
        {
          address_book_name: "",
          amount: 0, // Set to 0 for an approve transaction
          coin_id: coinId, // Set to the appropriate coin ID
          fiat_price: 0,
          fiat_type: "usd", // Set to the appropriate fiat type
          from_address: walletAddress,
          gas_estimate: parseFloat(gasLimitRequired.toString()),
          gas_price: gasPrice.price,
          source_type: "ANDROID",
          to_address: tokenAddress, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
          trnx_raw: signedTransaction.split("0x")[1],
          trnx_type: "approval",
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      return response.data.tx_hash;
    } catch (error) {
      // console.log(error);
      return false;
    }
  }

  async sendSwapTransaction(
    route,
    walletAddress,
    amount,
    coinId,
    token1,
    functionCall,
    adminDetails,
    slippage
  ) {
    const { account } = store.getState();
    try {
      const swapCallParams = () => {
        if (!route) {
          return null;
        }
        const { value, calldata } = SwapRouter.swapCallParameters(route, {
          recipient: walletAddress,
          slippageTolerance: new Percent(slippage, 100),
        });
        return {
          address: SMART_ROUTER_ADDRESSES[chainId],
          calldata,
          value,
        };
      };
      const { value, calldata, address: routerAddress } = swapCallParams();

      const gasPrice = await Web3Helper.getGasPrice(
        "bnb",
        walletAddress,
        walletAddress,
        0
      );

      const getGasEstimate = await this.getGasEstimate(
        route,
        walletAddress,
        slippage
      );
      if (getGasEstimate.status) {
        return getGasEstimate;
      }

      const WALLET_SECRET = await WalletHelper.getPrivateKey();

      let rawTransaction = {
        gasPrice: web3.utils.toHex(gasPrice.price * 10 ** 9),
        gasLimit: web3.utils.toHex(getGasEstimate.c[0] * 2),
        to: routerAddress,
        value: value,
        data: calldata,
        nonce: web3.utils.toHex(gasPrice.nonce + 1),
        from: walletAddress,
        chainId: chainId,
      };

      const signedTransaction = await web3.eth.accounts.signTransaction(
        rawTransaction,
        WALLET_SECRET
      );

      const response = await server.post(
        `/bnb/send_swap_trxn`,
        {
          address_list: [
            {
              address_book_name: "",
              amount: parseFloat(amount), // Set to 0 for an approve transaction
              coin_id: coinId, // Set to the appropriate coin ID
              fiat_price: 0,
              fiat_type: "USD", // Set to the appropriate fiat type
              from_address: walletAddress,
              gas_estimate: getGasEstimate.c[0],
              gas_price: gasPrice.price,
              to_address: routerAddress, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
              trnx_raw: signedTransaction.rawTransaction.split("0x")[1],
              trnx_type: "swap",
              coin_symbol: token1.symbol,
              swap_fee: 0,
            },
            {
              address_book_name: "",
              amount: parseFloat(adminDetails.amount), // Set to 0 for an approve transaction
              coin_id: adminDetails.coinId, // Set to the appropriate coin ID
              fiat_price: 0,
              fiat_type: "USD", // Set to the appropriate fiat type
              from_address: walletAddress,
              gas_estimate: 22000,
              gas_price: gasPrice.price,
              to_address: adminDetails.address, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
              trnx_raw: adminDetails.raw_trnx,
              trnx_type: "admin_fees",
              coin_symbol: "bnb",
              swap_fee: 0,
            },
          ],
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      return response.data.tx_hash;
    } catch (error) {
      // console.log(error);
      return false;
    }
  }

  async getGasEstimate(route, walletAddress, slippage) {
    // console.log("🚀 ~ PancakeHelper ~ getGasEstimate ~ slippage:", slippage)
    try {
      let trade = route;
      const routerAddress = SMART_ROUTER_ADDRESSES[ChainId.BSC];
      const { value, calldata } = SwapRouter.swapCallParameters(trade, {
        recipient: walletAddress,
        slippageTolerance: new Percent(Math.round(slippage), 100),
      });

      const tx = {
        account: walletAddress,
        to: routerAddress,
        data: calldata,
        value: hexToBigInt(value),
      };
      const gasEstimate = await getPublicClient().estimateGas(tx);

      return BigNumber(gasEstimate.toString());
    } catch (error) {
      //  console.log(error);
      let err = error.message.split("\n\n");
      let errMsg = err[0] ? err[0] : error.message ? error.message : error;
      let message = errMsg.includes("Execution reverted with reason: STF.")
        ? "Insufficient funds for intrinsic transaction cost"
        : errMsg.includes("INSUFFICIENT_OUTPUT_AMOUNT")
        ? "Insufficient output amount. Please try increasing slippage tolerance."
        : errMsg.includes("Execution reverted for an unknown reason")
        ? `Unknown error "Execution reverted". Try increasing your slippage tolerance.` //"Please try increasing slippage."
        : "Unable to perform swap. Please try again later";
      return {
        status: "error",
        message: message,
        skip:
          errMsg.includes("Execution reverted with reason: STF.") ||
          errMsg.includes(
            "The total cost (gas * gas fee + value) of executing this"
          ) ||
          errMsg.includes(
            "Execution reverted with reason: Pancake: TRANSFER_FAILED."
          ),
      };
    }
  }
}
