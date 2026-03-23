import { Token } from '@pancakeswap-libs/sdk';
import { ethers } from 'ethers';
import { BigNumber } from 'bignumber.js';
import Web3 from 'web3';
import { ABI } from '../config/abi';
import { WalletHelper } from './wallet.helper';
import { Web3Helper } from './web3.helper';
import { PancakeswapPair } from 'simple-pulsexchain-sdk';
import { store } from '..';
import { server } from '../server';
import { toFixed } from './conversion.helper';
import {
  PULSE_MAINNET_ROUTER,
  PULSE_NATIVE_WRAPPED_TOKEN_ADDRESSES,
  PULSE_ROUTER_ABI,
} from '../config/pulsechain.config';

export class PulseChainHelper {
  web3Provider = null;
  WETH = null;
  chainId = null;
  rpcUrl = null;
  routerAddress = null;

  constructor(rpcUrl) {
    this.rpcUrl = rpcUrl;
    this.web3Provider = new ethers.providers.JsonRpcProvider(rpcUrl, {
      chainId: 369,
    });
    this.WETH = PULSE_NATIVE_WRAPPED_TOKEN_ADDRESSES[369].address;
    this.chainId = 369;
    this.routerAddress = PULSE_MAINNET_ROUTER;
  }

  getTransactionStatusThroughHash = async (hash) => {
    try {
      const data = await this.web3Provider.getTransactionReceipt(hash);
      return data.status;
    } catch (error) {
      return false;
    }
  };

  async fetchPair(tokenFirst, tokenSecond, value, userAddress, slippage) {
    return new Promise(async (resolve, reject) => {
      try {
        let fromToken = {
          chainId: 369,
          contractAddress: tokenFirst.isToken
            ? tokenFirst.tokenAddress
            : '0xa1077a294dde1b09bb078844df40758a5d0f9a27',
          decimals: tokenFirst.decimals,
          symbol: tokenFirst.symbol,
          name: tokenFirst.name,
        };

        let toToken = {
          chainId: 369,
          contractAddress: tokenSecond.isToken
            ? tokenSecond.tokenAddress
            : '0xa1077a294dde1b09bb078844df40758a5d0f9a27',
          decimals: tokenSecond.decimals,
          symbol: tokenSecond.symbol,
          name: tokenSecond.name,
        };

        let pulseSwapPair = new PancakeswapPair({
          fromTokenContractAddress: fromToken,
          toTokenContractAddress: toToken,
          ethereumAddress: userAddress,
          settings: {
            slippage: parseFloat(slippage) / 100,
          },
        });

        const pancakeswapPairFactory = await pulseSwapPair.createFactory();
        const pairs = await pancakeswapPairFactory.trade(value);

        return resolve(pairs);
      } catch (err) {
        // console.log('v2RouteForBsc_Err:::', err);
        return reject(err);
      }
    });
  }

  async getQuoteAndRoute(from, to, amount, address, reverse, slippage) {
    // console.log('reverse::::', reverse);
    // console.log('from::::', from);
    // console.log('to::::', to);
    // console.log('amount::::', amount);
    try {
      const trade = await this.fetchPair(from, to, amount, address, slippage);
      // console.log('trade::', trade);
      const privateKey = await WalletHelper.getPrivateKey();
      const wallet = new ethers.Wallet(privateKey);
      const connectedWallet = wallet.connect(this.web3Provider);

      const pancakeswap = new ethers.Contract(
        this.routerAddress,
        PULSE_ROUTER_ABI,
        connectedWallet
      );

      const inputAmount = ethers.utils.parseUnits(
        amount.toString(),
        reverse ? to.decimals : from.decimals
      );

      // console.log('inputAmount::', inputAmount);
      let data = null;

      if (reverse) {
        data = await pancakeswap.getAmountsIn(inputAmount, trade.routePath);
      } else {
        data = await pancakeswap.getAmountsOut(inputAmount, trade.routePath);
      }

      // console.log('data:::', data);
      if (!data) return false;

      return {
        pair: trade.routePath,
        outAmount: reverse
          ? parseFloat(data[0].toString()) / Math.pow(10, from.decimals)
          : trade.expectedConvertQuote.toString(),
        feeAmount: trade.liquidityProviderFee,
        inputAmount: trade.baseConvertRequest,
        route: trade,
        reverse,
      };
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
        'pls',
        walletAddress,
        walletAddress,
        0
      );

      approveTx.gasLimit = gasLimitRequired._hex;
      approveTx.gasPrice = Web3.utils.toHex(gasPrice.price * Math.pow(10, 9));
      approveTx.from = walletAddress;
      approveTx.value = '0x0';
      approveTx.chainId = 369;
      approveTx.nonce = gasPrice.nonce;

      // console.log(approveTx);

      // Sign the transaction with the wallet's private key
      const wallet = new ethers.Wallet(WALLET_SECRET, this.web3Provider);

      const signedTransaction = await wallet.signTransaction(approveTx);

      // Send the signed transaction to the server for approval
      const response = await server.post(
        `/pls/send`,
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
    adminDetails
  ) {
    const { account } = store.getState();

    try {
      if (route) {
        const gasPrice = await Web3Helper.getGasPrice(
          'pls',
          walletAddress,
          walletAddress,
          0
        );
        // console.log(
        //   '🚀 ~ file: pancake.helper.js:255 ~ PancakeHelper ~ gasPrice:',
        //   gasPrice
        // );

        const getGasEstimate = await this.getGasEstimate(
          route,
          walletAddress,
          amount,
          token1.decimals,
          functionCall
        );

        // console.log(
        //   '🚀 ~ file: pancake.helper.js:264 ~ PancakeHelper ~ getGasEstimate:',
        //   getGasEstimate
        // );

        if (getGasEstimate.status) {
          return getGasEstimate;
        }

        const WALLET_SECRET = await WalletHelper.getPrivateKey();
        const wallet = new ethers.Wallet(WALLET_SECRET);
        const connectedWallet = wallet.connect(this.web3Provider);

        const amountToSend = BigNumber(amount);
        const amountString = amountToSend.multipliedBy(
          new BigNumber(10).pow(token1.decimals)
        );
        const inputAmount = amountString.toFixed(0);
        // console.log('🚀 ~ PulseChainHelper ~ inputAmount:', inputAmount);

        const amountToSend2 = BigNumber(route.minAmountConvertQuote);
        const amountString2 = amountToSend2.multipliedBy(
          new BigNumber(10).pow(route.toToken.decimals)
        );
        const amountOutMin = amountString2.toFixed(0);
        //  console.log('🚀 ~ PulseChainHelper ~ amountOutMin:', amountOutMin);

        const path = route.routePath;

        const to = wallet.address;

        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

        let tradeTransaction = null;

        const uniswap = new ethers.Contract(
          this.routerAddress,
          PULSE_ROUTER_ABI,
          connectedWallet
        );

        if (functionCall === 0) {
          tradeTransaction =
            await uniswap.populateTransaction.swapExactETHForTokens(
              amountOutMin,
              path,
              to,
              deadline,
              {
                gasLimit: ethers.utils.hexlify(getGasEstimate * 2),
                value: Web3.utils.toHex(inputAmount),
                nonce: parseInt(gasPrice.nonce) + 1,
                gasPrice: Web3.utils.toHex(gasPrice.price * Math.pow(10, 9)),
              }
            );
        } else if (functionCall === 1) {
          tradeTransaction =
            await uniswap.populateTransaction.swapExactTokensForTokensSupportingFeeOnTransferTokens(
              inputAmount,
              amountOutMin,
              path,
              to,
              deadline,
              {
                gasLimit: ethers.utils.hexlify(getGasEstimate * 2),
                nonce: parseInt(gasPrice.nonce) + 1,
                gasPrice: Web3.utils.toHex(gasPrice.price * Math.pow(10, 9)),
              }
            );
        } else if (functionCall === 2) {
          tradeTransaction =
            await uniswap.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(
              inputAmount,
              amountOutMin,
              path,
              to,
              deadline,
              {
                gasLimit: ethers.utils.hexlify(getGasEstimate * 2),
                nonce: parseInt(gasPrice.nonce) + 1,
                gasPrice: Web3.utils.toHex(gasPrice.price * Math.pow(10, 9)),
              }
            );
        }

        tradeTransaction.chainId = 369;

        const signedTransaction = await wallet.signTransaction(
          tradeTransaction
        );

        const response = await server.post(
          `/pls/send_swap_trxn`,
          {
            address_list: [
              {
                address_book_name: '',
                amount: parseFloat(amount), // Set to 0 for an approve transaction
                coin_id: coinId, // Set to the appropriate coin ID
                fiat_price: 0,
                fiat_type: 'USD', // Set to the appropriate fiat type
                from_address: walletAddress,
                gas_estimate: getGasEstimate,
                gas_price: gasPrice.price,
                to_address: PULSE_MAINNET_ROUTER, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
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
                gas_estimate: getGasEstimate,
                gas_price: gasPrice.price,
                to_address: adminDetails.address, // The ERC20 token contract address (to_address should be the token address for an approval transaction)
                trnx_raw: adminDetails.raw_trnx,
                trnx_type: 'admin_fees',
                coin_symbol: 'bnb',
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
      // console.log(error);
      return false;
    }
  }

  async getGasEstimate(
    route,
    walletAddress,
    amount,
    token1Decimals,
    functionCall,
    reverse
  ) {
    try {
      // console.log(
      //   route,
      //   walletAddress,
      //   amount,
      //   token1Decimals,
      //   functionCall,
      //   reverse
      // );

      if (route) {
        const WALLET_SECRET = await WalletHelper.getPrivateKey();
        const wallet = new ethers.Wallet(WALLET_SECRET);
        const connectedWallet = wallet.connect(this.web3Provider);

        const amountToSend = BigNumber(amount);
        const amountString = amountToSend.multipliedBy(
          new BigNumber(10).pow(token1Decimals)
        );
        const inputAmount = amountString.toFixed(0);
        // console.log('🚀 ~ PulseChainHelper ~ inputAmount:', inputAmount);

        const amountToSend2 = BigNumber(
          reverse ? route.baseConvertRequest : route.minAmountConvertQuote
        );
        const amountString2 = amountToSend2.multipliedBy(
          new BigNumber(10).pow(route.toToken.decimals)
        );
        const amountOutMin = amountString2.toFixed(0);
        // console.log('🚀 ~ PulseChainHelper ~ amountOutMin:', amountOutMin);

        const path = route.routePath;

        const to = wallet.address;

        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

        let gasEstimate = 300000;

        const uniswap = new ethers.Contract(
          this.routerAddress,
          PULSE_ROUTER_ABI,
          connectedWallet
        );

        if (functionCall === 0) {
          gasEstimate = await uniswap.estimateGas.swapExactETHForTokens(
            amountOutMin,
            path,
            to,
            deadline,
            {
              // from: walletAddress,
              value: inputAmount,
            }
          );

          return parseFloat(gasEstimate);
        } else if (functionCall === 1) {
          gasEstimate =
            await uniswap.estimateGas.swapExactTokensForTokensSupportingFeeOnTransferTokens(
              inputAmount,
              amountOutMin,
              path,
              to,
              deadline,
              {
                // from: walletAddress,
              }
            );
          return parseFloat(gasEstimate);
        } else if (functionCall === 2) {
          gasEstimate =
            await uniswap.estimateGas.swapExactTokensForETHSupportingFeeOnTransferTokens(
              inputAmount,
              amountOutMin,
              path,
              to,
              deadline,
              {
                // from: walletAddress,
              }
            );
          return parseFloat(gasEstimate);
        }
      }
    } catch (error) {
      // console.log(
      //   error.message.includes(
      //     'TransferHelper::transferFrom: transferFrom failed'
      //   ) || error.message.includes('TRANSFER_FROM_FAILED')
      // );
      // console.log(error.message.includes('INSUFFICIENT_OUTPUT_AMOUNT'));
      // console.log(error);
      return {
        status: 'error',
        message:
          error.message.includes(
            'TransferHelper::transferFrom: transferFrom failed'
          ) || error.message.includes('TRANSFER_FROM_FAILED')
            ? 'Insufficient funds for intrinsic transaction cost'
            : error.message.includes('INSUFFICIENT_OUTPUT_AMOUNT')
            ? 'Insufficient output amount. Please try increasing slippage tolerance.'
            : error.message.includes(
                'insufficient funds for gas * price + value'
              )
            ? 'Insufficient funds for intrinsic transaction cost'
            : 'Unable to perform swap.',
        skip:
          error.message.includes(
            'TransferHelper::transferFrom: transferFrom failed'
          ) ||
          error.message.includes('TRANSFER_FROM_FAILED') ||
          error.message.includes('transferFrom'),
      };
    }
  }
}
