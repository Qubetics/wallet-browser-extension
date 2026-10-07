import { AlphaRouter } from '@uniswap/smart-order-router';
import { ethers } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES } from '../config/uniswap.config';
import { ABI } from '../config/abi';
import { WalletHelper } from './wallet.helper';
import { Web3Helper } from './web3.helper';
import Web3 from 'web3';
import { server } from '../server';
import { store } from '..';

export class UniswapHelper {
  web3Provider = null;
  router = null;
  WETH = null;
  chainId = null;

  constructor(rpcUrl) {
    // console.log(
    //   "🚀 ~ file: uniswap.helper.js:33 ~ UniswapHelper ~ constructor ~ rpcUrl:",
    //   rpcUrl
    // );
    this.ethProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.router = new AlphaRouter({
      chainId: parseInt(1),
      provider: this.ethProvider,
    });
    this.WETH = UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES[parseInt(1)].address;
    this.chainId = 1;
  }

  getTransactionStatusThroughHash = async (hash) => {
    try {
      const data = await this.ethProvider.getTransactionReceipt(hash);
      // console.log(
      //   "🚀 ~ file: pancake.helper.js:37 ~ PancakeHelper ~ getTransactionStatusThroughHash= ~ data:",
      //   data
      // );
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
      return data.data;
    } catch (error) {
      // console.log('GET QOUTE AND ROUTE ERROR :', error);
      return {
        error: true,
        message: error?.response?.data?.message ?? 'Something went wrong',
      };
    }
  }

  async sendForApproval(
    tokenAddress,
    walletAddress,
    spenderAddress,
    slug,
    symbol,
    isToken,
    chainId,
    sessionPassword
  ) {
    try {
      slug = slug == 'matic' ? 'polygon' : slug;
      const { account } = store.getState();
      const { privateKey } = await WalletHelper.getPrivateKeyEvm(
        sessionPassword
      );
      const contract = new ethers.Contract(
        tokenAddress, // The address of the ERC20 token contract
        ABI, // Replace with the actual ABI of the ERC20 token contract
        this.ethProvider // The provider you're using (e.g., Infura, Alchemy, etc.)
      );

      // Unlimited allowance value (2^256 - 1)
      const unlimitedAllowance = ethers.constants.MaxUint256;
      // console.log(
      //   '🚀 ~ file: pancake.helper.js:138 ~ PancakeHelper ~ sendForApproval ~ unlimitedAllowance:',
      //   unlimitedAllowance
      // );

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
      approveTx.gasPrice = ethers.utils.parseUnits(
        Math.max(gasPrice.fast, 1).toString(),
        'gwei'
      );
      approveTx.from = walletAddress;
      approveTx.value = '0x0';
      approveTx.chainId = chainId;
      approveTx.nonce = nonce;

      // console.log(approveTx);

      // Sign the transaction with the wallet's private key
      const wallet = new ethers.Wallet(privateKey, this.ethProvider);
      // console.log(
      //   '🚀 ~ file: pancake.helper.js:149 ~ PancakeHelper ~ sendForApproval ~ wallet:',
      //   wallet
      // );
      const signedTransaction = await wallet.signTransaction(approveTx);
      // console.log(
      //   '🚀 ~ file: pancake.helper.js:151 ~ PancakeHelper ~ sendForApproval ~ signedTransaction:',
      //   signedTransaction
      // );

      const response = await server.post(
        `${slug}/${symbol}/send`,
        {
          nonce: nonce,
          tx_raw: signedTransaction.split('0x')[1],
          from: walletAddress,
          to: spenderAddress,
          amount: 0,
          gas_estimate: gasLimitRequired.toNumber(),
          gas_price: ethers.utils
            .parseUnits(Math.max(gasPrice?.fast || 1, 1).toString(), 'gwei')
            .toString(),
          tx_type: 'approve',
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
    token1,
    slug,
    symbol,
    isToken,
    slippage,
    commision,
    sessionPassword
  ) {
    try {
      slug = slug == 'matic' ? 'polygon' : slug;
      if (route) {
        const { account } = store.getState();

        // console.log('amount', amount); // should be a string
        // console.log('typeof amount', typeof amount); // should be "string"
        // console.log(
        //   'decimals',
        //   token1.decimals,

        //   new BigNumber(amount)
        //     .multipliedBy(new BigNumber(10).pow(token1.decimals))
        //     .toFixed(0)
        // ); // should be 18

        const { data } = await server.post(
          '/on-chain/swap',
          {
            chain_id: parseInt(token1.chain.chainId),
            src: route.fromToken.address,
            dst: route.toToken.address,
            fee: 0.5,
            amount: new BigNumber(amount)
              .multipliedBy(new BigNumber(10).pow(token1.decimals))
              .toFixed(0),
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

        const { privateKey } = await WalletHelper.getPrivateKeyEvm(
          sessionPassword
        );
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

        const increasedGasLimitDecimal = (
          Number(data.data.tx.gas) * 1.5
        ).toFixed(0);

        const transaction = {
          data: data.data.tx.data,
          to: '0x1111111254eeb25477b68fb85ed929f73a960582',
          value: Web3.utils.toHex(data.data.tx.value),
          // from: walletAddress,
          gasPrice: Web3.utils.toHex(
            Math.max(gasPrice.fast * Math.pow(10, 9), 1e9)
          ),
          gasLimit: Web3.utils.toHex(increasedGasLimitDecimal),
          nonce: nonce,
          chainId: parseInt(token1.chain.chainId),
        };
        // console.log('🚀 ~ UniswapHelper ~ transaction:', transaction);

        const wallet = new ethers.Wallet(privateKey, this.ethProvider);

        // console.log('walllet address', wallet.address);

        const signedTransaction = await wallet.signTransaction(transaction);
        // console.log(
        //   '🚀 ~ UniswapHelper ~ signedTransaction:',
        //   signedTransaction
        // );

        const response = await server.post(
          `${slug}/${isToken ? token1.tokenAddress : symbol}/send`,
          {
            nonce: nonce,
            tx_raw: signedTransaction.split('0x')[1],
            from: walletAddress,
            to: '0x1111111254eeb25477b68fb85ed929f73a960582',
            amount: amount,
            gas_estimate: +increasedGasLimitDecimal,
            gas_price: Math.max(gasPrice?.fast * Math.pow(10, 9), 1e9),
            tx_type: 'swap',
          },
          {
            headers: {
              Authorization: account.jwtToken,
            },
          }
        );
        // console.log('🚀 ~ UniswapHelper ~ response:', response);

        return response.data.tx_hash;
      }
    } catch (error) {
      // console.log('SWAP ERROR : ', error);
      return error?.response?.data?.message ? error?.response?.data : false;
    }
  }

}
