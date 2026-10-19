import axios from 'axios';
import { SWFT_BASE_URL } from '../config/crosschain.config';
import { BTCHelper } from './btc.helper';
import { getFlooredFixed } from './conversion.helper';
import { WalletHelper } from './wallet.helper';
import { server } from '../server';
import { store } from '..';
const { ethers } = require('ethers');
const { ABI_ABSTRACTION } = require('../config/abi');

const QUBETICS_RPC = 'https://rpc-testnet.qubetics.work';

export class ChainAbstraction {
  axiosInstance;
  chainId;

  constructor(chainId) {
    this.axiosInstance = axios.create({
      baseURL: SWFT_BASE_URL,
    });
    this.chainId = chainId;
  }

  getQuoteAndRoute = async (fromCoinId, toCoinId, amount) => {
    console.log(
      '🚀 ~ ChainAbstraction ~ getQuoteAndRoute= ~ fromCoinId, toCoinId, amount:',
      fromCoinId,
      toCoinId,
      amount
    );
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
      console.log(
        '🚀 ~ ChainAbstraction ~ getQuoteAndRoute= ~ response:',
        response
      );
      const exchangeRate = response?.data?.data?.data;
      console.log(
        '🚀 ~ ChainAbstraction ~ getQuoteAndRoute= ~ exchangeRate:',
        exchangeRate
      );
      if (exchangeRate?.instantRate == 0) {
        return false;
      }

      let instantRate = exchangeRate?.instantRate;
      let receiveCoinFee = exchangeRate?.receiveCoinFee;
      let convertedAmount = amount * instantRate;
      convertedAmount = (convertedAmount * 99.7) / 100;
      convertedAmount = convertedAmount - receiveCoinFee;
      convertedAmount = convertedAmount <= 0 ? 0 : convertedAmount;
      console.log('GET QUOTE AND PRICE AMOUNT:', {
        pair: [fromCoinId, toCoinId],
        outAmount: convertedAmount,
        exchangeData: exchangeRate,
      });
      return {
        pair: [fromCoinId, toCoinId],
        outAmount: convertedAmount,
        exchangeData: exchangeRate,
      };
    } catch (error) {
      return false;
    }
  };

  SendTransaction = async (
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
      console.log({
        depositCoinCode: fromCoin.symbol,
        receiveCoinCode: toCoin.symbol,
        depositCoinAmt: getFlooredFixed(depositAmount, 8),
        receiveCoinAmt: receiveAmount,
        destinationAddr: toCoin.address,
        refundAddr: walletAddress,
        equipmentNo: walletAddress,
        sourceType: 'iOS',
        sourceFlag: 'widget',
        fromCoin: fromCoin,
        chain: chain,
      });

      const { account } = store.getState();
      const btcPrivateKey = await WalletHelper.getBitcoinPrivateKeyWithPassword(
        sessionPassword
      );
      if (!btcPrivateKey) {
        return console.error('Unable to fetch private key.');
      }
      const response = await server.post(
        '/swftc/accountExchange',
        {
          depositCoinCode: fromCoin.symbol,
          receiveCoinCode: toCoin.symbol,
          depositCoinAmt: getFlooredFixed(depositAmount, 8),
          receiveCoinAmt: receiveAmount,
          destinationAddr: 'tb1qe6hf4x7qark8cg0kcm9z7rhdgmtkwwppst006v', //toCoin.address,
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
      console.log('🚀 ~ accountExchange response:', response);
      const orderData = response?.data?.data?.data;
      let hash = '';
      let coinFamily = fromCoin?.coinFamily;

      if (coinFamily === 3) {
        console.log('🚀 ~ BTC Transaction Start');

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

        console.log('Total UTXO amount available:', totalAmountAvailable);

        const inputCount = utxos.length;
        const outputCount = 2;
        const estimatedSize = inputCount * 146 + outputCount * 34 + 10;
        const fee = Math.ceil(estimatedSize * gasPrice);
        const sendAmount = Math.round(depositAmount * btcTosatoshi);
        const totalFee = parseFloat((fee * btcTosatoshiMultiplier).toFixed(8));
        const totalAmount = sendAmount + fee;

        console.log('Send amount (satoshis):', sendAmount);
        console.log('Estimated fee (satoshis):', fee);
        console.log('Transaction size (vB):', estimatedSize);
        console.log('Total amount required:', totalAmount);

        const keyPair = bitcoin.ECPair.fromWIF(
          btcPrivateKey,
          bitcoin.networks.testnet
        );
        console.log('🚀 ~ ChainAbstraction ~ keyPair:', keyPair);
        let payment;

        if (walletAddress.startsWith('bc1q')) {
          payment = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });
        } else if (walletAddress.startsWith('3')) {
          const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });
          payment = bitcoin.payments.p2sh({ redeem: p2wpkh });
        } else if (walletAddress.startsWith('tb')) {
          payment = bitcoin.payments.p2wpkh({
            pubkey: keyPair.publicKey,
            network: bitcoin.networks.testnet,
          });
        } else {
          payment = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
        }
        console.log('🚀 ~ ChainAbstraction ~ payment:', payment);

        if (payment.address !== walletAddress) {
          return console.error('Private key does not match wallet address.');
        }

        const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });

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
          console.log('input', input);
          psbt.addInput(input);
        }

        const change = totalAmountAvailable - sendAmount - fee;
        if (change < 0) {
          return console.error('Insufficient funds after fee.');
        }

        console.log('orderData', orderData, 'sendAmount', sendAmount);

        psbt.addOutput({
          address: 'tb1qe6hf4x7qark8cg0kcm9z7rhdgmtkwwppst006v', //orderData?.platformAddr,
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

        console.log('Actual transaction size:', actualSize, 'vBytes');
        console.log('Actual fee rate:', actualFeeRate, 'sat/vByte');
        console.log('Final tx_fee (BTC):', tx_fee);
        console.log('RAW TRANSACTION:', rawTransaction);

        hash = await BTCHelper.generateRawTransactionForCoinAndBroadcast(
          'tb1qe6hf4x7qark8cg0kcm9z7rhdgmtkwwppst006v', //orderData?.platformAddr
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

        console.log('HASH CREATED IN BTC CROSS-CHAIN SWAP:', hash);

        const resposne = await this.ticsFunction(
          QUBETICS_RPC,
          process.env.REACT_APP_TICS_TESTNET_MNEMONIC,
          hash?.data
        );
        console.log('🚀 ~ ChainAbstraction ~ resposne:', resposne);

        // const sendResponse = await server.post(
        //   'qubetics/tics/sendIntent',
        //   {
        //     gas_estimate:'',
        //     gas_price:'',
        //     from:'',
        //     tx_raw:'',
        //     hash:'',
        //   },
        //   {
        //     headers: {
        //       Authorization: account.jwtToken,
        //     },
        //   }
        // );
      }

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  ticsFunction = async (rpc, mnemonics, transactionHash) => {
    try {
      const amount = ethers.BigNumber.from('500000');
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      const wallet = ethers.Wallet.fromMnemonic(mnemonics).connect(provider);
      console.log(
        '🚀 ~ ChainAbstraction ~ ticsFunction= ~ wallet:',
        wallet,
        wallet.address
      );
      const contract = new ethers.Contract(
        '0xD97764b666Fe5446fbccf92a08BA09fafa185eAa',
        ABI_ABSTRACTION,
        wallet
      );

      const depositIntentResponse = await contract.depositIntent(
        'tb1qe6hf4x7qark8cg0kcm9z7rhdgmtkwwppst006v',
        wallet.address,
        'bitcoin',
        'tics',
        amount,
        'BTC',
        'tics',
        ethers.utils.toUtf8Bytes('btc->tics'),
        transactionHash
      );

      console.log(
        '🚀 ~ ChainAbstraction ~ ticsFunction= ~ depositIntentResponse:',
        depositIntentResponse
      );

      const signTransactionRaw = await wallet.signTransaction(
        depositIntentResponse
      );
      console.log(
        '🚀 ~ ChainAbstraction ~ ticsFunction= ~ signTransactionRaw:',
        signTransactionRaw
      );
      return signTransactionRaw;
    } catch (error) {
      console.log('🚀 ~ ChainAbstraction ~ ticsFunction= ~ error:', error);
    }
  };
}
