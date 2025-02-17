import { AlphaRouter, SwapType } from "@uniswap/smart-order-router";
import {
  CurrencyAmount,
  Ether,
  Percent,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import {
  UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES,
  UNI_MAINNET_ROUTER,
  UNI_ROUTER_ABI,
  UNI_TESTNET_ROUTER,
  WETH_ABI,
} from "../config/uniswap.config";
import { ABI, WRAP_ABI } from "../config/abi";
import { WalletHelper } from "./wallet.helper";
import { Web3Helper } from "./web3.helper";
import Web3 from "web3";
import JSBI from "jsbi";
import { server } from "../server";
import { store } from "..";

export class UniswapHelper {
  web3Provider = null;
  router = null;
  WETH = null;
  chainId = null;

  constructor(rpcUrl) {
    console.log(
      "🚀 ~ file: uniswap.helper.js:33 ~ UniswapHelper ~ constructor ~ rpcUrl:",
      rpcUrl
    );
    this.web3Provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.router = new AlphaRouter({
      chainId: parseInt(1),
      provider: this.web3Provider,
    });
    this.WETH = UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES[parseInt(1)].address;
    this.chainId = 1;
  }

  getTransactionStatusThroughHash = async (hash) => {
    try {
      const data = await this.web3Provider.getTransactionReceipt(hash);
      console.log(
        "🚀 ~ file: pancake.helper.js:37 ~ PancakeHelper ~ getTransactionStatusThroughHash= ~ data:",
        data
      );
      return data.status;
    } catch (error) {
      return false;
    }
  };

  async getQuoteAndRoute(chainId, src, dst, amount, fee) {
    try {
      const { account } = store.getState();
      const { data } = await server.post(
        "/on-chain/quote",
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
      return data.data;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async sendForApproval(
    tokenAddress,
    walletAddress,
    spenderAddress,
    slug,
    symbol,
    isToken,
    chainId
  ) {
    try {
      slug = slug=='matic'?'polygon':slug;
      const { account } = store.getState();
      const WALLET_SECRET = await WalletHelper.getPrivateKey();
      console.log(
        "🚀 ~ file: pancake.helper.js:129 ~ PancakeHelper ~ sendForApproval ~ WALLET_SECRET:",
        WALLET_SECRET
      );
      const contract = new ethers.Contract(
        tokenAddress, // The address of the ERC20 token contract
        ABI, // Replace with the actual ABI of the ERC20 token contract
        this.web3Provider // The provider you're using (e.g., Infura, Alchemy, etc.)
      );

      // Unlimited allowance value (2^256 - 1)
      const unlimitedAllowance = ethers.constants.MaxUint256;
      console.log(
        "🚀 ~ file: pancake.helper.js:138 ~ PancakeHelper ~ sendForApproval ~ unlimitedAllowance:",
        unlimitedAllowance
      );

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
        slug,
        walletAddress,
        walletAddress,
        isToken,
        tokenAddress,
        symbol
      );

      const nonce = await Web3Helper.getNonce(
        slug,
        isToken,
        tokenAddress,
        symbol,
        walletAddress
      );

      approveTx.gasLimit = gasLimitRequired._hex;
      approveTx.gasPrice = Web3.utils.toHex(gasPrice.fast * Math.pow(10, 9));
      approveTx.from = walletAddress;
      approveTx.value = "0x0";
      approveTx.chainId = chainId;
      approveTx.nonce = nonce;

      console.log(approveTx);

      // Sign the transaction with the wallet's private key
      const wallet = new ethers.Wallet(WALLET_SECRET, this.web3Provider);
      console.log(
        "🚀 ~ file: pancake.helper.js:149 ~ PancakeHelper ~ sendForApproval ~ wallet:",
        wallet
      );
      const signedTransaction = await wallet.signTransaction(approveTx);
      console.log(
        "🚀 ~ file: pancake.helper.js:151 ~ PancakeHelper ~ sendForApproval ~ signedTransaction:",
        signedTransaction
      );

      const response = await server.post(
        `${slug}/${symbol}/send`,
        {
          nonce: nonce,
          tx_raw: signedTransaction.split("0x")[1],
          from: walletAddress,
          to: spenderAddress,
          amount: 0,
          gas_estimate: gasLimitRequired.toNumber(),
          gas_price: gasPrice?.fast * Math.pow(10, 9),
          tx_type: "approve",
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      return response.data.tx_hash;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async sendSwapTransaction(
    route,
    walletAddress,
    amount,
    token1,
    slug,
    symbol,
    isToken,
    slippage,
    commision
  ) {
    try {
      slug = slug == 'matic' ? "polygon" : slug
      if (route) {
        const { account } = store.getState();

        const { data } = await server.post(
          "/on-chain/swap",
          {
            chain_id: parseInt(token1.chain.chainId),
            src: route.fromToken.address,
            dst: route.toToken.address,
            fee: 0.5,
            amount: new BigNumber(amount)
              .multipliedBy(Math.pow(10, token1.decimals))
              .toString(),
            from: walletAddress,
            slippage: parseInt(slippage),
            referrer: commision.walletAddress,
          },
          {
            headers: {
              Authorization: account.jwtToken,
            },
          }
        );

        const WALLET_SECRET = await WalletHelper.getPrivateKey();

        const gasPrice = await Web3Helper.getGasPrice(
          slug,
          walletAddress,
          walletAddress,
          isToken,
          token1.tokenAddress,
          symbol
        );

        const nonce = await Web3Helper.getNonce(
          slug,
          isToken,
          token1.tokenAddress,
          symbol,
          walletAddress
        );

        // console.log("NONCE-----> ", nonce);
        
        const increasedGasLimitDecimal = (
          Number(data.data.tx.gas) * 1.5
        ).toFixed(0);

        const transaction = {
          data: data.data.tx.data,
          to: "0x1111111254eeb25477b68fb85ed929f73a960582",
          value: Web3.utils.toHex(data.data.tx.value),
          from: walletAddress,
          gasPrice: Web3.utils.toHex(gasPrice.fast * Math.pow(10, 9)),
          gasLimit: Web3.utils.toHex(increasedGasLimitDecimal),
          nonce: nonce,
          chainId: parseInt(token1.chain.chainId),
        };

        const wallet = new ethers.Wallet(WALLET_SECRET, this.web3Provider);
        const signedTransaction = await wallet.signTransaction(transaction);

        // console.log("signedTransactionsignedTransaction ", signedTransaction);
        
        
        const response = await server.post(
          `${slug}/${isToken ? token1.tokenAddress : symbol}/send`,
          {
            nonce: nonce,
            tx_raw: signedTransaction.split("0x")[1],
            from: walletAddress,
            to: "0x1111111254eeb25477b68fb85ed929f73a960582",
            amount: amount,
            gas_estimate: +increasedGasLimitDecimal,
            gas_price: gasPrice?.fast* Math.pow(10, 9),
            //estimate:gasPrice?.estimate
            // fast: gasPrice?.fast,
            // propose: gasPrice?.propose,
            // safe: gasPrice?.safe,
            tx_type: "swap",
          },
          {
            headers: {
              Authorization: account.jwtToken,
            },
          }
        );
        console.log();
        
        return response.data.tx_hash;
      }
    } catch (error) {
      console.log("SEND ERROR : ", error?.response?.data?.message);
      return error?.response?.data?.message?error?.response?.data:false;
    }
  }

  async sendWrapTransaction(
    walletAddress,
    amount,
    coinId,
    adminDetails,
    token1
  ) {
    try {
      const bigAmount = new BigNumber(amount).multipliedBy(
        new BigNumber(10).pow(
          UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES[1].decimals
        )
      );

      const gasPrice = await Web3Helper.getGasPrice(
        "eth",
        walletAddress,
        walletAddress,
        0
      );

      const gasLimit = await Web3Helper.fetchGasEstimateForWrap(
        UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES[1].address,
        token1.address,
        token1.rpc,
        token1.isToken ? "withdraw" : "deposit",
        bigAmount
      );

      const { account } = store.getState();
      const WALLET_SECRET = await WalletHelper.getPrivateKey();
      const increasedGasLimitDecimal = gasLimit * 2;

      const web3 = new Web3();
      const contract = new web3.eth.Contract(WRAP_ABI);

      const transaction = {
        to: UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES[1].address,
        value: token1.tokenAddress ? "0x0" : bigAmount,
        from: walletAddress,
        gasPrice: Web3.utils.toHex(gasPrice.price * Math.pow(10, 9)),
        gasLimit: Web3.utils.toHex(increasedGasLimitDecimal),
        nonce: gasPrice.nonce + 1,
        chainId: 1,
        data: token1.isToken
          ? contract.methods.withdraw(amount).encodeABI()
          : contract.methods.deposit().encodeABI(),
      };

      const wallet = new ethers.Wallet(WALLET_SECRET, this.web3Provider);
      const signedTransaction = await wallet.signTransaction(transaction);

      const response = await server.post(
        `/eth/send_swap_trxn`,
        {
          address_list: [
            {
              address_book_name: "",
              amount: parseFloat(amount), // Set to 0 for an approve transaction
              coin_id: coinId, // Set to the appropriate coin ID
              fiat_price: 0,
              fiat_type: "USD", // Set to the appropriate fiat type
              from_address: walletAddress,
              gas_estimate: parseFloat(increasedGasLimitDecimal),
              gas_price: gasPrice.price,
              to_address: UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES[1].address, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
              trnx_raw: signedTransaction.split("0x")[1],
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
              gas_estimate: parseFloat(increasedGasLimitDecimal),
              gas_price: gasPrice.price,
              to_address: adminDetails.address, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
              trnx_raw: adminDetails.raw_trnx,
              trnx_type: "admin_fees",
              coin_symbol: "eth",
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
      console.log(error);
      return false;
    }
  }
}
