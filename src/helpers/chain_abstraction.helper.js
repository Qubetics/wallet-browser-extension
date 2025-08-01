import axios from 'axios';
import { SWFT_BASE_URL } from '../config/crosschain.config';
import { BTCHelper } from './btc.helper';
import { Web3Helper } from './web3.helper';
import { getFlooredFixed } from './conversion.helper';
import { WalletHelper } from './wallet.helper';
import { server } from '../server';
import { store } from '..';
import { poll } from 'ethers/lib/utils';
import { toFixed } from './common.helper';
import BigNumber from 'bignumber.js';
import { log } from 'loglevel';
const { ethers } = require('ethers');
const { ABI_ABSTRACTION } = require('../config/abi');

const QUBETICS_RPC = 'https://rpc-testnet.qubetics.work';

export class ChainAbstractionHelper {
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
      '🚀 ~ ChainAbstractionHelper ~ getQuoteAndRoute= ~ fromCoinId, toCoinId, amount:',
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
        '🚀 ~ ChainAbstractionHelper ~ getQuoteAndRoute= ~ response:',
        response
      );
      const exchangeRate = response?.data?.data?.data;
      console.log(
        '🚀 ~ ChainAbstractionHelper ~ getQuoteAndRoute= ~ exchangeRate:',
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

  /**
   * Handles Bitcoin transaction creation and broadcasting.
   * @param {object} params - Transaction parameters
   * @param {string} params.walletAddress - User's wallet address
   * @param {string} params.privateKey - User's private key
   * @param {number} params.depositAmount - Amount to send
   * @param {object} params.fromCoin - Source coin object
   * @param {object} params.chain - Chain configuration
   * @param {number} params.fiatValue - Fiat value of transaction
   * @param {object} params.orderData - Order data from exchange
   * @param {string} params.destinationAddress - Destination address (optional)
   * @returns {Promise<string>} Transaction hash
   */
  async handleBTCTransaction({
    walletAddress,
    privateKey,
    depositAmount,
    fromCoin,
    chain,
    fiatValue,
    orderData,
    destinationAddress = null,
  }) {
    console.log('🚀 ~ BTC Transaction Start');

    // BTC setup
    const bitcoin = require('bitcoinjs-lib');
    const btcTosatoshi = 100000000;
    const btcTosatoshiMultiplier = 0.00000001;

    // Gas price and UTXO fetch
    const gasPrice = Math.max(await BTCHelper.getBTCGasPrice(), 10);
    const unspent = await BTCHelper.getUnspent(walletAddress);

    if (!unspent || unspent.length === 0) {
      throw new Error('No UTXOs available or balance too low.');
    }

    // Prepare UTXOs
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

    // Fee and amount calculations
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

    // Key pair and payment type
    const keyPair = bitcoin.ECPair.fromWIF(
      privateKey,
      bitcoin.networks.testnet
    );
    console.log('�� ~ ChainAbstractionHelper ~ keyPair:', keyPair);

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

    console.log('�� ~ ChainAbstractionHelper ~ payment:', payment);
    if (payment.address !== walletAddress) {
      throw new Error('Private key does not match wallet address.');
    }

    // Build PSBT
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

    // Outputs
    const change = totalAmountAvailable - sendAmount - fee;
    if (change < 0) {
      throw new Error('Insufficient funds after fee.');
    }

    const finalDestinationAddress =
      destinationAddress ||
      orderData?.platformAddr ||
      'tb1qe6hf4x7qark8cg0kcm9z7rhdgmtkwwppst006v';
    console.log('orderData', orderData, 'sendAmount', sendAmount);

    psbt.addOutput({
      address: finalDestinationAddress,
      value: sendAmount,
    });

    if (change > 546) {
      psbt.addOutput({
        address: walletAddress,
        value: change,
      });
    }

    // Sign and finalize
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

    // Broadcast transaction
    const hash = await BTCHelper.generateRawTransactionForCoinAndBroadcast(
      finalDestinationAddress,
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
      'chain_abstraction'
    );

    console.log('HASH CREATED IN BTC CROSS-CHAIN SWAP:', hash);
    return hash;
  }

  /**
   * Initiates account exchange with the server.
   * @param {object} fromCoin - Source coin object with symbol property.
   * @param {object} toCoin - Destination coin object with symbol and address properties.
   * @param {number} depositAmount - Amount to deposit.
   * @param {number} receiveAmount - Amount to receive.
   * @param {string} walletAddress - User's wallet address for refund.
   * @param {string} jwtToken - User's JWT token for authorization.
   * @param {string} destinationAddress - Optional destination address (defaults to toCoin.address).
   * @returns {Promise<object>} The server response.
   */
  async initiateAccountExchange(
    fromCoin,
    toCoin,
    depositAmount,
    receiveAmount,
    walletAddress,
    jwtToken,
    destinationAddress = null
  ) {
    // Validate required parameters
    if (!fromCoin?.symbol || !toCoin?.symbol || !walletAddress || !jwtToken) {
      throw new Error('Missing required parameters for account exchange');
    }

    try {
      const requestBody = {
        depositCoinCode: fromCoin.symbol,
        receiveCoinCode: toCoin.symbol,
        depositCoinAmt: getFlooredFixed(depositAmount, 8),
        receiveCoinAmt: receiveAmount,
        destinationAddr: destinationAddress || toCoin.address,
        refundAddr: walletAddress,
        equipmentNo: walletAddress, // Using wallet address as equipment number
        sourceType: 'iOS',
      };

      const response = await server.post(
        '/swftc/accountExchange',
        requestBody,
        {
          headers: {
            Authorization: jwtToken,
          },
        }
      );

      console.log('🚀 ~ accountExchange response:', response);
      return response;
    } catch (error) {
      console.error('Error initiating account exchange:', error);
      throw error;
    }
  }

  // =====================
  // SendTransaction: Handles cross-chain transaction logic
  // =====================
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
    sessionPassword,
    toAddress
  ) => {
    let privateKey = null;
    try {
      // --- Log transaction parameters ---
      console.log('transaction parameters', {
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
        sessionPassword: sessionPassword,
        toAddress: toAddress,
        fee: fee,
      });

      // --- Retrieve account and wallet info ---
      const { account } = store.getState();
      const mnemonics = await WalletHelper.getMnemonicsByPassword(
        walletAddress,
        sessionPassword
      );

      privateKey = await WalletHelper.getBitcoinPrivateKeyWithPassword(
        sessionPassword
      );
      if (!privateKey) {
        return console.error('Unable to fetch private key.');
      }
      // --- Initiate account exchange ---
      const response = await this.initiateAccountExchange(
        fromCoin,
        toCoin,
        depositAmount,
        receiveAmount,
        walletAddress,
        account.jwtToken,
        toAddress
      );
      console.log('🚀 ~ accountExchange response:', response);
      const orderData = response?.data?.data?.data;
      let hash = '';
      let coinFamily = fromCoin?.coinFamily;

      // =====================
      // BTC Transaction Logic
      // =====================

      if (coinFamily === 3) {
        hash = await this.handleBTCTransaction({
          walletAddress,
          privateKey,
          depositAmount,
          fromCoin,
          chain,
          fiatValue,
          orderData,
          destinationAddress: 'tb1qe6hf4x7qark8cg0kcm9z7rhdgmtkwwppst006v', // Optional
        });
      }

      if (coinFamily !== 3 && coinFamily !== 5) {
        console.log('EVM COIN CASE IN CHAIN ABSTRACTION', fromCoin?.isToken);
        hash = await this.createRawAndBroadCastTransactionEvm({
          to: toAddress,
          from: walletAddress,
          amount: depositAmount,
          coinId: fromCoin.id,
          fiatPrice: fiatValue,
          networkFeeInFiat: 0,
          fiatType: 'USD',
          contact: null,
          slug: chain.slug,
          chainId: chain.chainId,
          symbol: fromCoin.symbol,
          rpc: rpc,
          type: 'chain_abstraction',
          gasPriceType: 0,
          orderId: orderData?.orderId,
          sessionPassword: sessionPassword,
          isToken: fromCoin.isToken ? true : false,
          tokenAddress: fromCoin.isToken ? fromCoin?.tokenAddress : null,
          depositAmount,
        });
      }

      // --- Qubetics intent hash ---
      const intentHash = await this.ticsFunction(
        mnemonics,
        walletAddress,
        toAddress,
        getFlooredFixed(depositAmount, 8),
        receiveAmount,
        hash?.data,
        fromCoin,
        toCoin
      );

      console.log('🚀 ~ ChainAbstractionHelper ~ intentHash:', intentHash);

      // --- Save transaction intent hash ---
      const saveTransactionHashAndIntent = await this.saveIntentHash(
        hash?.data,
        intentHash,
        account.jwtToken,
        fee
      );
      console.log('saveTransactionHashAndIntent', saveTransactionHashAndIntent);

      const transactionResult = await this.pollIntentStatus(intentHash);

      console.log('transactionResult', transactionResult);

      return {
        hash: transactionResult?.data?.intent_hash,
        status: transactionResult?.data?.status,
        solver: transactionResult?.data?.solver_id,
      };
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  saveIntentHash = async (hash, intentHash, jwtToken, fee) => {
    try {
      const response = await server.post(
        'chainAbstraction/saveIntentHash',
        {
          hash,
          intentHash,
          fees: fee ? toFixed(fee, 8) : 0.0,
        },
        {
          headers: {
            Authorization: jwtToken,
          },
        }
      );
      return response;
    } catch (error) {
      console.error('Error saving intent hash:', error);
      return false;
    }
  };

  async pollIntentStatus(intentHash) {
    const url = `https://dev-abstraction-api.qubetics.work/api/routes/intent-status?intent-hash=${intentHash}`;
    return new Promise((resolve) => {
      async function poll() {
        try {
          const response = await axios.get(url);
          const { error, data } = response.data;
          if (!error && data) {
            console.log('Final Success Response:', response?.data);
            resolve(response?.data);
          } else {
            console.log('Polling again in 5 seconds...');
            setTimeout(poll, 5000);
          }
        } catch (error) {
          console.error(
            'Error fetching intent status, retrying in 5 seconds:',
            error
          );
          setTimeout(poll, 5000);
        }
      }
      poll();
    });
  }

  getIntentChainId = (coinFamily) => {
    switch (coinFamily) {
      case 7:
        return 'TICS';
      case 2:
        return 'sepolia';
      case 3:
        return 'BTC';
      default:
        return 'TICS';
    }
  };

  // ticsFunction = async (
  //   mnemonics,
  //   fromAddress,
  //   toAddress,
  //   fromAmount,
  //   toAmount,
  //   hash,
  //   fromToken,
  //   toToken
  // ) => {
  //   let fromTokenDecimal = fromToken?.decimals;
  //   let toTokenDecimal = toToken?.decimals;
  //   let fromTokenNew = fromToken?.coinSymbol;
  //   let toTokenNew = toToken?.coinSymbol;
  //   let bigNumberFromAmount = ethers.utils.parseUnits(
  //     fromAmount,
  //     fromTokenDecimal
  //   );
  //   let bigNumberToAmount = ethers.utils.parseUnits(toAmount, toTokenDecimal);

  //   try {
  //     const provider = new ethers.providers.JsonRpcProvider(QUBETICS_RPC);
  //     const wallet = ethers.Wallet.fromMnemonic(mnemonics).connect(provider);
  //     const tokenAddress = ('0x1379BD303fb4e4b11bd9b3473DC5670C47B96C4e');
  //     const contract = new ethers.Contract(
  //       tokenAddress,
  //       ABI_ABSTRACTION,
  //       wallet
  //     );

  //     console.log('intent_data', {
  //       fromAddress: fromAddress,
  //       toAddress: toAddress,
  //       sourceChain: this.getIntentChainId(fromToken?.coinFamily),
  //       destinationChain: this.getIntentChainId(toToken?.coinFamily),
  //       toAmount: bigNumberToAmount,
  //       fromAmount: bigNumberFromAmount,
  //       sourceToken: fromTokenNew,
  //       destinationToken: toTokenNew,
  //       byte: fromToken?.coinSymbol + '->' + toToken?.coinSymbol,
  //       intentHash: hash,
  //     });

  //     const transaction = await contract.depositIntent(
  //       fromAddress,
  //       toAddress,
  //       this.getIntentChainId(fromToken?.coinFamily),
  //       this.getIntentChainId(toToken?.coinFamily),
  //       bigNumberToAmount,
  //       bigNumberFromAmount,
  //       fromTokenNew,
  //       toTokenNew,
  //       ethers.utils.toUtf8Bytes(
  //         fromToken?.coinSymbol + '->' + toToken?.coinSymbol
  //       ),
  //       hash
  //     );
  //     console.log('depositIntentTics>>>', transaction);

  //     return transaction.hash;
  //   } catch (error) {
  //     console.error('depositIntent error:', error);
  //     throw error;
  //   }
  // };

  /**
   * Calls the depositIntent function on the abstraction contract and returns the transaction hash.
   * @param {string} mnemonics - Wallet mnemonics.
   * @param {string} fromAddress - Source address.
   * @param {string} toAddress - Destination address.
   * @param {string|number} fromAmount - Amount from source token (as string for precision).
   * @param {string|number} toAmount - Amount to destination token (as string for precision).
   * @param {string} hash - Intent hash.
   * @param {object} fromToken - Source token object (must have coinSymbol, decimals, coinFamily).
   * @param {object} toToken - Destination token object (must have coinSymbol, decimals, coinFamily).
   * @returns {Promise<string>} The transaction hash.
   */
  ticsFunction = async (
    mnemonics,
    fromAddress,
    toAddress,
    fromAmount,
    toAmount,
    hash,
    fromToken,
    toToken
  ) => {
    console.log({
      mnemonics,
      fromAddress,
      toAddress,
      fromAmount,
      toAmount,
      hash,
      fromToken,
      toToken,
    });

    // 1. Parameter validation
    if (
      !mnemonics ||
      !fromAddress ||
      !toAddress ||
      !fromAmount ||
      !toAmount ||
      !hash ||
      !fromToken ||
      !toToken
    ) {
      throw new Error('Missing required parameters for ticsFunction');
    }

    // 2. Safe extraction and defaults
    const fromTokenDecimal = fromToken.decimals ?? 18;
    const toTokenDecimal = toToken.decimals ?? 18;
    const fromTokenSymbol = fromToken.coinSymbol;
    const toTokenSymbol = toToken.coinSymbol;

    // 3. String conversion for amounts
    let bigNumberFromAmount, bigNumberToAmount;
    try {
      bigNumberFromAmount = ethers.utils.parseUnits(
        String(fromAmount),
        fromTokenDecimal
      );
      bigNumberToAmount = ethers.utils.parseUnits(
        String(toAmount),
        toTokenDecimal
      );
    } catch (err) {
      throw new Error('Invalid amount or decimals for token conversion');
    }

    try {
      // 4. Prepare provider, wallet, and contract
      const provider = new ethers.providers.JsonRpcProvider(QUBETICS_RPC);
      const wallet = ethers.Wallet.fromMnemonic(mnemonics).connect(provider);
      const tokenAddress = ('0x1379BD303fb4e4b11bd9b3473DC5670C47B96C4e');
      const contract = new ethers.Contract(
        tokenAddress,
        ABI_ABSTRACTION,
        wallet
      );

      // 5. Prepare intent data for logging
      const intentData = {
        fromAddress,
        toAddress,
        sourceChain: this.getIntentChainId(fromToken.coinFamily),
        destinationChain: this.getIntentChainId(toToken.coinFamily),
        toAmount: toAmount,
        fromAmount: fromAmount,
        sourceToken: fromTokenSymbol,
        destinationToken: toTokenSymbol,
        byte: `${fromTokenSymbol}->${toTokenSymbol}`,
        intentHash: hash,
      };
      console.log('intent_data', intentData);

      // 6. Call the contract
      const transaction = await contract.depositIntent(
        fromAddress,
        toAddress,
        intentData.sourceChain,
        intentData.destinationChain,
        bigNumberToAmount,
        bigNumberFromAmount,
        fromTokenSymbol,
        toTokenSymbol,
        ethers.utils.toUtf8Bytes(intentData.byte),
        hash
      );
      console.log('depositIntentTics>>>', transaction);

      // 7. Return only the transaction hash
      return transaction.hash;
    } catch (error) {
      // 8. Error handling
      console.error('depositIntent error:', error);
      throw error;
    }
  };

  /**
   * Creates, signs, and broadcasts a raw transaction for EVM-compatible chains (e.g., Qubetics).
   * Returns the transaction hash from the backend.
   *
   * @param {Object} params - Transaction parameters
   * @param {string} params.to - Recipient address
   * @param {string} params.from - Sender address
   * @param {string|number} params.amount - Amount to send (in ether units)
   * @param {string|number} params.coinId - Coin ID
   * @param {string|number} params.fiatPrice - Fiat price
   * @param {string|number} params.networkFeeInFiat - Network fee in fiat
   * @param {string} params.fiatType - Fiat type (e.g., 'USD')
   * @param {string} params.contact - Contact info (optional)
   * @param {string} params.slug - Chain slug (e.g., 'qubetics')
   * @param {string|number} params.chainId - Chain ID
   * @param {string} params.symbol - Coin symbol (e.g., 'tics')
   * @param {string} params.rpc - RPC endpoint
   * @param {string} params.type - Transaction type (default: 'withdraw')
   * @param {number} params.gasPriceType - 1: safe, 2: propose, else: fast
   * @param {string|number} params.orderId - Order ID (optional)
   * @param {string} params.sessionPassword - User's session password
   * @returns {Promise<string|false>} Transaction hash or false on failure
   */
  async createRawAndBroadCastTransactionEvm({
    to,
    from,
    amount,
    coinId,
    fiatPrice,
    networkFeeInFiat,
    fiatType,
    contact,
    slug,
    chainId,
    symbol,
    rpc,
    type = 'withdraw',
    gasPriceType = 0,
    orderId,
    sessionPassword,
    isToken,
    tokenAddress,
    depositAmount,
  }) {
    try {
      const { account } = store.getState();
      const { privateKey } = await WalletHelper.getPrivateKeyWithPassword(
        account,
        sessionPassword
      );

      if (!privateKey) {
        console.log('INVALID PRIVATE KEY :');
        return false;
      }

      console.log('slug', slug);
      console.log('to', to);
      console.log('from', from);
      console.log('symbol', symbol);
      console.log('tokenAddress', from);

      // Get gas price and nonce
      const gasPriceRes = await this.getGasPrice(
        slug,
        to,
        from,
        isToken,
        tokenAddress,
        symbol
      );

      console.log('gasPriceRes', gasPriceRes);

      const nonce = await this.getNonce(
        slug,
        isToken,
        tokenAddress,
        symbol,
        from
      );

      console.log('nonce', nonce);

      const gaslimit = Number(gasPriceRes.estimate) + 10000;

      console.log('gaslimit', gaslimit);

      const gsFee =
        gasPriceType === 1
          ? gasPriceRes.safe
          : gasPriceType === 2
          ? gasPriceRes.propose
          : gasPriceRes.fast;

      const gasInEth = (gsFee * Math.pow(10, 9) * gaslimit) / Math.pow(10, 18);
      console.log('gasInEth', gasInEth);

      const gasPrice =
        symbol === 'eth'
          ? Math.max(1.5 * gsFee * Math.pow(10, 9), 1e9)
          : Math.max(gsFee * Math.pow(10, 9), 1e9);
      console.log('gasPrice', gasPrice);
      const totalAmount = +gasInEth + +depositAmount;
      console.log('totalAmount', totalAmount);
      let balance;
      if (isToken === true) {
        balance = await Web3Helper.getTokenBalance(tokenAddress, from, rpc);
      } else {
        balance = await this.getCoinBalance(from, rpc);
      }

      console.log('balance', balance);

      if (totalAmount > balance) {
        return false;
      }

      // Prepare transaction
      const ethersProvider = new ethers.providers.JsonRpcProvider(rpc);
      const wallet = new ethers.Wallet(privateKey, ethersProvider);
      console.log('wallet', wallet);

      const value = ethers.utils.parseUnits(amount.toString(), 18);
      console.log('value', value);
      console.log('chainId', chainId);
      const tx = {
        nonce: nonce,
        gasLimit: ethers.BigNumber.from(gaslimit),
        gasPrice: ethers.BigNumber.from(Math.floor(gasPrice)),
        to: '0xa0687e6fc0275dfd27b81d8182ca36a5b4882f97',
        value: value,
        data: '0x',
        chainId: Number(chainId),
      };
      console.log('tx of the sign transaction', tx);
      const signedTransaction = await wallet.signTransaction(tx);
      const gasPriceInWei = Math.max(gsFee, 1) * 1e9;
      const stringWithout0x = signedTransaction.startsWith('0x')
        ? signedTransaction.slice(2)
        : signedTransaction;

      let payload = {
        nonce: nonce,
        tx_raw: stringWithout0x,
        from: from,
        to: to,
        amount: amount,
        gas_estimate: gaslimit,
        gas_price: gasPriceInWei,
        tx_type: type,
      };

      if (orderId) {
        payload['order_id'] = orderId;
      }

      // Normalize slug for known chains
      slug = slug === 'matic' ? 'polygon' : slug === 'tics' ? 'qubetics' : slug;

      const response = await server.post(
        `${slug}/${isToken === true ? tokenAddress : symbol}/send`,
        payload,
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      return {
        data: response?.data?.tx_hash,
      };
    } catch (error) {
      console.log('Error in createRawAndBroadCastTransactionEvm:', error);
      return false;
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
      slug = slug == 'matic' ? 'polygon' : slug == 'tics' ? 'qubetics' : slug;
      const { data } = await server.post(
        `/${slug}/${isToken ? tokenAddress : symbol}/gas_estimation`,
        {
          from: fromAddress,
          to: toAddress,
          amount: '',
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      if (slug == 'qubetics') {
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

  async getNonce(slug, isToken, tokenAddress, symbol, address) {
    const { account } = store.getState();
    try {
      slug = slug == 'matic' ? 'polygon' : slug == 'tics' ? 'qubetics' : slug;
      const { data } = await server.post(
        `/${slug}/${isToken ? tokenAddress : symbol}/nonce`,
        {
          amount: '',
          wallet_address: address,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      return data.data.nonce;
    } catch (error) {
      return false;
    }
  }

  async getCoinBalance(owner, rpc) {
    console.log('getCoinBalance', owner);
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      const balance = await provider.getBalance(owner);
      const balanceInEth = ethers.utils.formatUnits(balance, 18);
      return new BigNumber(balanceInEth);
    } catch (error) {
      return false;
    }
  }
}
