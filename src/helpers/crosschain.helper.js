import axios from 'axios';
import { SWFT_BASE_URL } from '../config/crosschain.config';
import { BTCHelper } from './btc.helper';
import { getFlooredFixed } from './conversion.helper';
import { SolanaHelper } from './solana.helper';
import { WalletHelper } from './wallet.helper';
import { Web3Helper } from './web3.helper';
import { server } from '../server';
import { store } from '..';
import { IS_PRODUCTION } from '../config/bitcoin.config';

export class CrossChainHelper {
  axiosInstance;
  chainId;

  constructor(chainId) {
    this.axiosInstance = axios.create({
      baseURL: SWFT_BASE_URL,
    });
    this.chainId = chainId;
  }

  getQuoteAndRoute = async (fromCoinId, toCoinId, amount) => {
    try {
      const { account } = store.getState();
      const response = await server.post(
        '/swftc/getBaseInfo',
        {
          depositCoinCode: fromCoinId,
          receiveCoinCode: toCoinId,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      const exchangeRate = response?.data?.data?.data;
      if (exchangeRate?.instantRate == 0) {
        return false;
      }
      let instantRate = exchangeRate?.instantRate;
      let receiveCoinFee = exchangeRate?.receiveCoinFee;
      let convertedAmount = amount * instantRate;
      convertedAmount = (convertedAmount * 99.7) / 100;
      convertedAmount = convertedAmount - receiveCoinFee;
      convertedAmount = convertedAmount <= 0 ? 0 : convertedAmount;
      return {
        pair: [fromCoinId, toCoinId],
        outAmount: convertedAmount,
        exchangeData: exchangeRate,
      };
    } catch (error) {
      return false;
    }
  };

  sendOrder = async (
    fromCoin,
    toCoin,
    depositAmount,
    receiveAmount,
    walletAddress,
    chain,
    fee,
    fiatValue,
    parentCoin,
    rpc,
    symbol,
    sessionPassword
  ) => {
    try {
      // console.log({
      //   depositCoinCode: fromCoin.symbol,
      //   receiveCoinCode: toCoin.symbol,
      //   depositCoinAmt: getFlooredFixed(depositAmount, 8),
      //   receiveCoinAmt: receiveAmount,
      //   destinationAddr: toCoin.address,
      //   refundAddr: walletAddress,
      //   equipmentNo: walletAddress,
      //   sourceType: 'iOS',
      //   sourceFlag: 'widget',
      //   fromCoin: fromCoin,
      //   chain: chain,
      // });

      const { account } = store.getState();
      const btcPrivateKeyStr =
        await WalletHelper.getBitcoinPrivateKeyWithPassword(walletAddress, sessionPassword);
      if (!btcPrivateKeyStr) {
        return console.error('Unable to fetch private key.');
      }

      const response = await server.post(
        '/swftc/accountExchange',
        {
          depositCoinCode: fromCoin.symbol,
          receiveCoinCode: toCoin.symbol,
          depositCoinAmt: getFlooredFixed(depositAmount, 8),
          receiveCoinAmt: receiveAmount,
          destinationAddr: toCoin.address,
          refundAddr: walletAddress,
          equipmentNo: '123456568',
          sourceType: 'iOS',
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      // console.log('🚀 ~ accountExchange response:', response);

      const orderData = response?.data?.data?.data;
      let hash = '';
      let coinFamily = fromCoin?.coinFamily;
      let gasPriceType = 3;

      if (coinFamily === 3) {
        // console.log('🚀 ~ BTC Transaction Start');

        const bitcoin = require('bitcoinjs-lib');
        const btcTosatoshi = 100000000;
        const btcTosatoshiMultiplier = 0.00000001;

        const gasPrice = Math.max(await BTCHelper.getBTCGasPrice(), 10); // sat/vB
        const unspent = await BTCHelper.getUnspent(walletAddress);

        if (!unspent || unspent.length === 0) {
          return console.error('No UTXOs available or balance too low.');
        }

        const utxos = [];
        let totalAmountAvailable = 0;

        for (const element of unspent) {
          const satoshis = Math.floor(Number(element.satoshis));
          totalAmountAvailable += satoshis;
          utxos.push({
            txid: element.txid,
            vout: element.vout,
            value: satoshis,
          });
        }

        // console.log('Total UTXO amount available:', totalAmountAvailable);

        const inputCount = utxos.length;
        const outputCount = 2;
        const estimatedSize = inputCount * 146 + outputCount * 34 + 10;
        const fee = Math.ceil(estimatedSize * gasPrice);
        const sendAmount = Math.round(depositAmount * btcTosatoshi);
        const totalFee = parseFloat((fee * btcTosatoshiMultiplier).toFixed(8));
        const totalAmount = sendAmount + fee;

        // console.log('Send amount (satoshis):', sendAmount);
        // console.log('Estimated fee (satoshis):', fee);
        // console.log('Transaction size (vB):', estimatedSize);
        // console.log('Total amount required:', totalAmount);

        const keyPair = bitcoin.ECPair.fromWIF(
          btcPrivateKeyStr,
          IS_PRODUCTION ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
        );
        // console.log('🚀 ~ CrossChainHelper ~ keyPair:', keyPair);
        let payment;

        if (walletAddress.startsWith('bc1q')) {
          payment = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });
        } else if (walletAddress.startsWith('3')) {
          const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });
          payment = bitcoin.payments.p2sh({ redeem: p2wpkh });
        } else if (walletAddress.startsWith('tb')) {
          payment = bitcoin.payments.p2wpkh({
            pubkey: keyPair.publicKey,
            network: IS_PRODUCTION ? bitcoin.networks.bitcoin : bitcoin.networks.testnet,
          });
        } else {
          payment = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
        }
        // console.log('🚀 ~ CrossChainHelper ~ payment:', payment);

        if (payment.address !== walletAddress) {
          return console.error('Private key does not match wallet address.');
        }

        const psbt = new bitcoin.Psbt({ network: IS_PRODUCTION ? bitcoin.networks.bitcoin : bitcoin.networks.testnet });

        for (const utxo of utxos) {
          const input = {
            hash: utxo.txid,
            index: utxo.vout,
            ...(walletAddress.startsWith('bc1q') && {
              witnessUtxo: {
                script: payment.output,
                value: utxo.value,
              },
            }),
            ...(walletAddress.startsWith('tb') && {
              witnessUtxo: {
                script: payment.output,
                value: utxo.value,
              },
            }),
            ...(walletAddress.startsWith('3') && {
              witnessUtxo: {
                script: payment.output,
                value: utxo.value,
              },
              redeemScript: payment.redeem.output,
            }),
          };
          // console.log('input', input);
          psbt.addInput(input);
        }

        const change = totalAmountAvailable - sendAmount - fee;
        if (change < 0) {
          return console.error('Insufficient funds after fee.');
        }

        // console.log('orderData', orderData, 'sendAmount', sendAmount);

        psbt.addOutput({
          address: orderData?.platformAddr,
          value: sendAmount,
        });

        if (change > 546) {
          psbt.addOutput({
            address: walletAddress,
            value: change,
          });
        }

        for (let i = 0; i < utxos.length; i++) {
          psbt.signInput(i, keyPair);
        }

        psbt.validateSignaturesOfAllInputs();
        psbt.finalizeAllInputs();

        const tx = psbt.extractTransaction();
        const rawTransaction = tx.toHex();
        const actualSize = tx.virtualSize();
        const actualFeeRate = Math.ceil(fee / actualSize);
        const tx_fee = parseFloat(totalFee.toFixed(8));

        // console.log('Actual transaction size:', actualSize, 'vBytes');
        // console.log('Actual fee rate:', actualFeeRate, 'sat/vByte');
        // console.log('Final tx_fee (BTC):', tx_fee);
        // console.log('RAW TRANSACTION:', rawTransaction);

        hash = await BTCHelper.generateRawTransactionForCoinAndBroadcast(
          orderData?.platformAddr,
          walletAddress,
          depositAmount,
          fromCoin.id,
          fiatValue,
          0,
          'USD',
          null,
          `bitcoin/${chain.slug}`,
          chain.chainId,
          rawTransaction,
          tx_fee,
          orderData?.orderId,
          'chain_abstraction' // cross-chain
        );

        // console.log('HASH CREATED IN BTC CROSS-CHAIN SWAP:', hash);
      } else if (fromCoin?.coinFamily === 5 && fromCoin.tokenAddress) {
        const solanaHelper = new SolanaHelper(chain.rpcUrl);
        hash = await solanaHelper.generateRawTransactionForTokenAndBroadcast(
          orderData?.platformAddr,
          walletAddress,
          depositAmount,
          fromCoin.id,
          fiatValue,
          0,
          'USD',
          null,
          `solana/${chain.slug}`, //chain.slug,
          chain.chainId,
          fromCoin.tokenAddress,
          Math.pow(10, fromCoin.decimals),
          '',
          fromCoin.balance,
          orderData?.orderId,
          'cross_chain',
          gasPriceType,
          sessionPassword
        );
      } else if (fromCoin?.coinFamily === 5) {
        const solanaHelper = new SolanaHelper(chain.rpcUrl);
        hash = await solanaHelper.generateRawTransactionForCoinAndBroadcast(
          orderData?.platformAddr,
          walletAddress,
          depositAmount,
          fromCoin.id,
          fiatValue,
          0,
          'USD',
          null,
          `solana/${chain.slug}`,
          chain.chainId,
          orderData?.orderId,
          'cross_chain',
          sessionPassword
        );
      } else if (fromCoin?.coinFamily != 5 && fromCoin.tokenAddress) {
        //console.log('IN TOKEN CROSS SWAP EVM');
        hash = await Web3Helper.generateRawTransactionForTokenAndBroadcast(
          orderData?.platformAddr,
          walletAddress,
          depositAmount,
          fromCoin.id,
          fiatValue,
          0,
          'USD',
          null,
          chain.slug,
          chain.chainId,
          fromCoin.tokenAddress,
          Math.pow(10, fromCoin.decimals),
          symbol,
          'cross_chain',
          coinFamily,
          gasPriceType,
          orderData?.orderId,
          sessionPassword
        );
      } else {
        hash = await Web3Helper.generateRawTransactionForCoinAndBroadcast(
          orderData?.platformAddr,
          walletAddress,
          depositAmount,
          fromCoin.id,
          fiatValue,
          0,
          'USD',
          null,
          chain.slug,
          chain.chainId,
          symbol,
          rpc,
          'cross_chain',
          '',
          orderData?.orderId,
          sessionPassword
        );
      }

      if (!hash) {
        return false;
      }

      await this.axiosInstance.post('/v2/modifyTxId', {
        orderId: orderData?.orderId,
        depositTxid: hash,
      });

      return true;
    } catch (error) {
      //console.log(error);
      return false;
    }
  };
}
