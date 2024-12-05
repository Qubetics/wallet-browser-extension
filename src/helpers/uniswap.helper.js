import { AlphaRouter, SwapType } from '@uniswap/smart-order-router';
import {
  CurrencyAmount,
  Ether,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import { BigNumber } from 'bignumber.js';
import {
  UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES,
  UNI_MAINNET_ROUTER,
  UNI_ROUTER_ABI,
  UNI_TESTNET_ROUTER,
  WETH_ABI,
} from '../config/uniswap.config';
import { ABI, WRAP_ABI } from '../config/abi';
import { WalletHelper } from './wallet.helper';
import { Web3Helper } from './web3.helper';
import Web3 from 'web3';
import JSBI from 'jsbi';
import { server } from '../server';
import { store } from '..';

export class UniswapHelper {
  web3Provider = null;
  router = null;
  WETH = null;
  chainId = null;

  constructor(rpcUrl) {
    console.log(
      '🚀 ~ file: uniswap.helper.js:33 ~ UniswapHelper ~ constructor ~ rpcUrl:',
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
        '🚀 ~ file: pancake.helper.js:37 ~ PancakeHelper ~ getTransactionStatusThroughHash= ~ data:',
        data
      );
      return data.status;
    } catch (error) {
      return false;
    }
  };

  async getQuoteAndRoute(from, to, amount, walletAddress, reverse, slippage) {
    console.log(
      '🚀 ~ file: uniswap.helper.js:60 ~ UniswapHelper ~ getQuoteAndRoute ~ slippage:',
      slippage
    );
    try {
      const token1 = from.isToken
        ? new Token(
            parseInt(this.chainId),
            from.tokenAddress,
            from.decimals,
            from.symbol,
            from.name
          )
        : new Ether(parseInt(this.chainId));

      console.log(
        '🚀 ~ file: uniswap.helper.js:42 ~ UniswapHelper ~ getQuoteAndRoute ~ token1:',
        token1
      );

      const token2 = to.isToken
        ? new Token(
            parseInt(this.chainId),
            to.tokenAddress,
            to.decimals,
            to.symbol,
            to.name
          )
        : new Ether(parseInt(this.chainId));

      console.log(
        '🚀 ~ file: uniswap.helper.js:55 ~ UniswapHelper ~ getQuoteAndRoute ~ token2:',
        token2
      );

      const wei = ethers.utils.parseUnits(
        amount,
        parseInt(reverse ? to.decimals : from.decimals)
      );
      console.log(
        '🚀 ~ file: uniswap.helper.js:68 ~ UniswapHelper ~ getQuoteAndRoute ~ wei:',
        wei
      );
      const inputAmount = CurrencyAmount.fromRawAmount(
        reverse ? token2 : token1,
        JSBI.BigInt(wei)
      );
      console.log(
        '🚀 ~ file: uniswap.helper.js:70 ~ UniswapHelper ~ getQuoteAndRoute ~ inputAmount:',
        inputAmount
      );
      // console.log('router uniswap::::::::::', this.router);
      const generatedRoute = await this.router.route(
        inputAmount,
        reverse ? token1 : token2,
        reverse ? TradeType.EXACT_OUTPUT : TradeType.EXACT_INPUT,
        {
          recipient: walletAddress,
          slippageTolerance: new Percent(slippage, 100),
          deadline: Math.floor(Date.now() / 1000 + 1800),
          type: SwapType.SWAP_ROUTER_02
          // type: SwapType.UNIVERSAL_ROUTER
        }
      );
      console.log(
        '🚀 ~ file: uniswap.helper.js:82 ~ UniswapHelper ~ getQuoteAndRoute ~ generatedRoute:',
        generatedRoute
      );

      // console.log(
      //   generatedRoute?.quote?.toFixed(5),
      //   'route.quote.toFixed(token1.decimals)'
      // );

      return generatedRoute;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async sendForApproval(tokenAddress, walletAddress, spenderAddress, coinId) {
    try {
      const { account } = store.getState();
      const WALLET_SECRET = await WalletHelper.getPrivateKey();
      console.log(
        '🚀 ~ file: pancake.helper.js:129 ~ PancakeHelper ~ sendForApproval ~ WALLET_SECRET:',
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
        '🚀 ~ file: pancake.helper.js:138 ~ PancakeHelper ~ sendForApproval ~ unlimitedAllowance:',
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
        'eth',
        walletAddress,
        walletAddress,
        0
      );

      approveTx.gasLimit = gasLimitRequired._hex;
      approveTx.gasPrice = Web3.utils.toHex(gasPrice.price * Math.pow(10, 9));
      approveTx.from = walletAddress;
      approveTx.value = '0x0';
      approveTx.chainId = 1;
      approveTx.nonce = gasPrice.nonce;

      console.log(approveTx);

      // Sign the transaction with the wallet's private key
      const wallet = new ethers.Wallet(WALLET_SECRET, this.web3Provider);
      console.log(
        '🚀 ~ file: pancake.helper.js:149 ~ PancakeHelper ~ sendForApproval ~ wallet:',
        wallet
      );
      const signedTransaction = await wallet.signTransaction(approveTx);
      console.log(
        '🚀 ~ file: pancake.helper.js:151 ~ PancakeHelper ~ sendForApproval ~ signedTransaction:',
        signedTransaction
      );

      // Send the signed transaction to the server for approval
      const response = await server.post(
        `/eth/send`,
        {
          address_book_name: '',
          amount: 0, // Set to 0 for an approve transaction
          coin_id: coinId, // Set to the appropriate coin ID
          fiat_price: 0,
          fiat_type: 'usd', // Set to the appropriate fiat type
          from_address: walletAddress,
          gas_estimate: parseFloat(gasLimitRequired.toString()),
          gas_price: gasPrice.price,
          source_type: 'ANDROID',
          to_address: tokenAddress, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
          trnx_raw: signedTransaction.split('0x')[1],
          trnx_type: 'approval',
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
    coinId,
    adminDetails,
    token1
  ) {
    try {
      if (route) {
        console.log(
          '🚀 ~ file: uniswap.helper.js:224 ~ UniswapHelper ~ sendSwapTransaction ~ route:',
          route
        );
        const { account } = store.getState();

        const WALLET_SECRET = await WalletHelper.getPrivateKey();

        const gasPrice = await Web3Helper.getGasPrice(
          'eth',
          walletAddress,
          walletAddress,
          0
        );

        const gasLimitHex = route.estimatedGasUsed._hex;
        console.log(
          '🚀 ~ file: uniswap.helper.js:248 ~ UniswapHelper ~ sendSwapTransaction ~ gasLimitHex:',
          gasLimitHex
        );

        // Convert the hexadecimal string to a decimal number
        const gasLimitDecimal = parseInt(gasLimitHex, 16);
        console.log(
          '🚀 ~ file: uniswap.helper.js:252 ~ UniswapHelper ~ sendSwapTransaction ~ gasLimitDecimal:',
          gasLimitDecimal
        );

        // Multiply the gas limit by 2
        const increasedGasLimitDecimal = gasLimitDecimal * 2;
        console.log(
          '🚀 ~ file: uniswap.helper.js:256 ~ UniswapHelper ~ sendSwapTransaction ~ increasedGasLimitDecimal:',
          increasedGasLimitDecimal
        );

        const transaction = {
          data: route.methodParameters.calldata,
          to: UNI_MAINNET_ROUTER,
          value: route.methodParameters.value,
          from: walletAddress,
          gasPrice: Web3.utils.toHex(gasPrice.price * Math.pow(10, 9)),
          gasLimit: Web3.utils.toHex(increasedGasLimitDecimal),
          nonce: gasPrice.nonce + 1,
        chainId: 1,
        };

        const wallet = new ethers.Wallet(WALLET_SECRET, this.web3Provider);
        const signedTransaction = await wallet.signTransaction(transaction);

        const response = await server.post(
          `/eth/send_swap_trxn`,
          {
            address_list: [
              {
                address_book_name: '',
                amount: parseFloat(amount), // Set to 0 for an approve transaction
                coin_id: coinId, // Set to the appropriate coin ID
                fiat_price: 0,
                fiat_type: 'USD', // Set to the appropriate fiat type
                from_address: walletAddress,
                gas_estimate: parseFloat(route.estimatedGasUsed.toString()),
                gas_price: gasPrice.price,
                to_address: UNI_MAINNET_ROUTER, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
                trnx_raw: signedTransaction.split('0x')[1],
                trnx_type: 'swap',
                coin_symbol: token1.symbol,
                swap_fee: 0,
              },
              {
                address_book_name: '',
                amount: parseFloat(adminDetails.amount), // Set to 0 for an approve transaction
                coin_id: adminDetails.coinId, // Set to the appropriate coin ID
                fiat_price: 0,
                fiat_type: 'USD', // Set to the appropriate fiat type
                from_address: walletAddress,
                gas_estimate: parseFloat(route.estimatedGasUsed.toString()),
                gas_price: gasPrice.price,
                to_address: adminDetails.address, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
                trnx_raw: adminDetails.raw_trnx,
                trnx_type: 'admin_fees',
                coin_symbol: 'eth',
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
      }
    } catch (error) {
      console.log(error);
      return false;
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
        'eth',
        walletAddress,
        walletAddress,
        0
      );

      const gasLimit = await Web3Helper.fetchGasEstimateForWrap(
        UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES[1].address,
        token1.address,
        token1.rpc,
        token1.isToken ? 'withdraw' : 'deposit',
        bigAmount
      );

      const { account } = store.getState();
      const WALLET_SECRET = await WalletHelper.getPrivateKey();
      const increasedGasLimitDecimal = gasLimit * 2;

      const web3 = new Web3();
      const contract = new web3.eth.Contract(WRAP_ABI);

      const transaction = {
        to: UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES[1].address,
        value: token1.tokenAddress ? '0x0' : bigAmount,
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
              address_book_name: '',
              amount: parseFloat(amount), // Set to 0 for an approve transaction
              coin_id: coinId, // Set to the appropriate coin ID
              fiat_price: 0,
              fiat_type: 'USD', // Set to the appropriate fiat type
              from_address: walletAddress,
              gas_estimate: parseFloat(increasedGasLimitDecimal),
              gas_price: gasPrice.price,
              to_address: UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES[1].address, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
              trnx_raw: signedTransaction.split('0x')[1],
              trnx_type: 'swap',
              coin_symbol: token1.symbol,
              swap_fee: 0,
            },
            {
              address_book_name: '',
              amount: parseFloat(adminDetails.amount), // Set to 0 for an approve transaction
              coin_id: adminDetails.coinId, // Set to the appropriate coin ID
              fiat_price: 0,
              fiat_type: 'USD', // Set to the appropriate fiat type
              from_address: walletAddress,
              gas_estimate: parseFloat(increasedGasLimitDecimal),
              gas_price: gasPrice.price,
              to_address: adminDetails.address, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
              trnx_raw: adminDetails.raw_trnx,
              trnx_type: 'admin_fees',
              coin_symbol: 'eth',
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
