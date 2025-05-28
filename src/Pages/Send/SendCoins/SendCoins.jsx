/* eslint-disable react-hooks/exhaustive-deps */
/*global chrome*/
import { message, Slider } from 'antd';
import { ethers } from 'ethers';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { store } from '../../..';
import { setLoading } from '../../../actions/loading';
import MenuRestofHeaders from '../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import ButtonComp from '../../../Components/ButtonComp/ButtonComp';
import InputFieldSimple, {
  InputField,
  InputFieldOnly,
} from '../../../Components/InputField/InputFieldSimple';
import ModalCustom from '../../../Components/ModalCustom/ModalCustom';
import { Web3Helper } from '../../../helpers/web3.helper';
import style from './style.module.scss';
import AddressBook from '../../../Assets/address-book-svgrepo-com.svg';
import { useEffect } from 'react';
import { SolanaHelper } from '../../../helpers/solana.helper';
import { BTCHelper } from '../../../helpers/btc.helper';
import { WalletHelper } from '../../../helpers/wallet.helper';
import { AdaHelper } from '../../../helpers/ada.helper';
import { ENSHelper } from '../../../helpers/ens.helper';
import { UnstoppableDomainHelper } from '../../../helpers/unstopable.helper';
import Add from '../../../Assets/add.svg';
import BigNumber from 'bignumber.js';
import {
  addCommasToNumber,
  getFlooredFixed,
} from '../../../helpers/conversion.helper';
import { server } from '../../../server';
import { formatNumberFiat } from '../../../helpers/common.helper';
import AddressTableSend from '../../../Components/AddressTable/AddressTableSend';
import { BL_CODE } from '../../../helpers/constant';

let inputCount = 0;
let transactionSize = 0;
let outputCount = 2;
let btcTosatoshi = 100000000;
let btcTosatoshiMultiplier = 0.00000001;

const crypto = {
  1: 'BNB',

  2: 'ETH',

  3: 'BTC',

  4: 'POL',

  5: 'SOL',

  6: 'TRX',
};

function SendCoins() {
  const { account, currency } = useSelector((state) => state);

  const {
    state: { coin, redirectTo, backAddress, backAmount },
  } = useLocation();
  const navigate = useNavigate();

  const [myBalance, setBalance] = useState(0);
  const [gasPriceType, setGasPriceType] = useState(2); // 1 slow, 2 medium, 3 fast

  let [address, setAddress] = useState(backAddress || null);
  const [contact, setContact] = useState(null);
  const [amount, setAmount] = useState(backAmount || null);
  const [value, setValue] = useState(0.0);
  const [price, setPrice] = useState(0);
  const [percent, setPercent] = useState(null);
  const [isLogoutModalOpen, setLogoutOpenmodal] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({});
  const [list, setList] = useState([]);
  const [selectedGasPrice, setSelectedGasPrice] = useState(0);
  const [selectedGasPriceSol, setSelectedGasPriceSol] = useState(0);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [isModalOpen, setConfirmModal] = useState(false);

  const [nativeCoinPrice, setNativeCoinPrice] = useState(0);

  const [myGasPrice, setGasPrice] = useState({
    estimate: 0,
    fast: 0,
    propose: 0,
    safe: 0,
  });

  const fetchNativePrice = async () => {
    const parentCoin = await server.post(
      '/wallet/nativeCoinFiatPrice',

      {
        coin_family: coin.coin.coin_family,

        fiat_currency: currency.name,
      },

      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    setNativeCoinPrice(parentCoin?.data?.data?.fiatCoinPrice?.value);
  };

  useEffect(() => {
    fetchNativePrice();
    init();
    const price = coin.coin.fiat_price_data || 0;

    if (price) {
      const value = parseFloat(coin.balance) * parseFloat(price.value);
      setValue(value);
      setPrice(price.value);
    }
    return () => {
      inputCount = 0;
      inputCount = 0;
      transactionSize = 0;
      outputCount = 2;
      btcTosatoshi = 100000000;
      btcTosatoshiMultiplier = 0.00000001;
    };
  }, []);

  const init = async () => {
    try {
      setBalance(coin.balance);
      store.dispatch(setLoading(true));

      const { chains } = await chrome.storage.local.get('chains');
      const chain = chains.find(
        (chain) => chain.coinFamily === coin.coin.coin_family
      );

      if (chain.isEVM) {
        const result = await Web3Helper.getGasPrice(
          chain.slug == 'matic' ? 'polygon' : chain.slug,
          account.coinFamilyAndAddress[coin.coin.coin_family],
          account.coinFamilyAndAddress[coin.coin.coin_family],
          coin.coin.token_address ? 1 : 0,
          coin.coin.token_address,
          coin.coin.coin_symbol
        );

        setSelectedGasPrice(result.fast);
        setGasPriceType(2);
        setGasPrice(result);
      }

      if (!chain.isEVM && chain.currencyName === 'BTC') {
        try {
          const gasPrice = await BTCHelper.getBTCGasPrice();
          const unspent = await BTCHelper.getUnspent(coin.wallet_address);
          if (!unspent) {
            store.dispatch(setLoading(false));
            return messageApi.error('Unable to fetch unspent at the moment.');
          }
          if (unspent.length === 0) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              'You have a pending transaction in your account or you do not have enough balance to proceed with the transaction.'
            );
          }

          const inputs = [];
          let totalAmountAvailable = 0;
          unspent.forEach((element) => {
            let utxo = {};
            utxo.satoshis = Math.floor(Number(element.value));
            utxo.script = element.script;
            utxo.address = coin.wallet_address;
            utxo.txId = element.tx_hash;
            utxo.outputIndex = element.tx_output_n;
            totalAmountAvailable += parseFloat(utxo.satoshis);
            inputCount += 1;
            inputs.push(utxo);
          });
          transactionSize =
            inputCount * 146 + outputCount * 34 + 10 - inputCount;
          let fee = transactionSize * gasPrice;

          const totalFee = (
            transactionSize *
            gasPrice *
            btcTosatoshiMultiplier
          ).toFixed(8);

          setSelectedGasPriceSol(totalFee);
        } catch (error) {
          store.dispatch(setLoading(false));
        }
      }
      if (!chain.isEVM && chain.currencyName === 'SOL') {
        const solanaHelper = new SolanaHelper(chain.rpcUrl);
        const gasPrice = solanaHelper.getGasPrice();
        setSelectedGasPriceSol(gasPrice);
      }

      const { data } = await server.post(
        '/user/address_book',
        {
          address: [account.coinFamilyAndAddress[coin.coin.coin_family]],
          coin_family: [coin.coin.coin_family],
          limit: 2000,
          page: 1,
          search: '',
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      setList(data.data);
      store.dispatch(setLoading(false));
    } catch (error) {
      store.dispatch(setLoading(false));
      messageApi.error(error.message);
    }
  };

  const onLogoutClick = () => {
    setLogoutOpenmodal(true);
  };

  const handlLogouteOk = () => {
    setLogoutOpenmodal(false);
  };

  const handleLogoutCancel = () => {
    setLogoutOpenmodal(false);
  };

  const calculatePercentageWise = async (percentage) => {
    if (coin.coin.token_address) {
      let rpc;
      let amountToSend = 0;

      switch (coin.coin.coin_family) {
        case 1:
          rpc = process.env.REACT_APP_BNB_RPC;
          break;
        case 2:
          rpc = process.env.REACT_APP_ETH_RPC;
          break;
        case 3:
          rpc = process.env.REACT_APP_BTC_RPC;
          break;
        case 4:
          rpc = process.env.REACT_APP_MATIC_RPC;
          break;
        case 5:
          rpc = process.env.REACT_APP_SOL_RPC;
          break;
        case 7:
          rpc = process.env.REACT_APP_QUBETIC_RPC;
          break;
        default:
          rpc = process.env.REACT_APP_TRON_RPC;
      }
      store.dispatch(setLoading(true));
      amountToSend = await Web3Helper.getTokenBalance(
        coin.coin.token_address,
        coin.wallet_address,
        rpc
      );

      if (!amountToSend) {
        store.dispatch(setLoading(false));
        amountToSend = coin.balance;
      }
      setBalance(amountToSend);
      store.dispatch(setLoading(false));

      //setAmount without rounding off the last didgits after decimal use bignumber
      const amountToSend2 = new BigNumber(amountToSend);

      // Calculate the maximum number of decimal places based on the precision of the number
      const maxDecimals = amountToSend2.decimalPlaces();

      // Set the amount without rounding and without exponential notation
      const amountString = amountToSend2.toFixed(
        maxDecimals,
        BigNumber.ROUND_DOWN
      );

      setAmount(amountString);
    } else {
      const { chains } = await chrome.storage.local.get('chains');
      const chain = chains.find(
        (chain) => chain.coinFamily === coin.coin.coin_family
      );

      if (chain.isEVM) {
        store.dispatch(setLoading(true));
        const balance = new BigNumber(coin.balance).times(
          '1000000000000000000'
        );
        const amountToSend = new BigNumber(balance);
        // Get the current gas price
        const gasPrice = await Web3Helper.getGasPrice(
          chain.slug == 'matic' ? 'polygon' : chain.slug,
          coin.wallet_address,
          coin.wallet_address,
          false,
          null,
          coin.coin.coin_symbol
        );

        if (!gasPrice) {
          store.dispatch(setLoading(false));
          return messageApi.error('Unable to fetch gas price at the moment.');
        }

        // Estimate the gas cost for a sample transaction
        // const gasLimit = gasPrice.estimate * 2; // Assuming a standard transaction
        const gasLimit = gasPrice.estimate; // Assuming a standard transaction
        const gasCost = new BigNumber(
          new BigNumber(gasPrice.fast).times(1000000000)
        ).times(gasLimit);

        // Apply the buffer factor to the gas cost
        const bufferedGasCost = gasCost.times(2.5);

        // Subtract the buffered gas cost from the maximum BNB
        const maxBNBAfterGas = new BigNumber(amountToSend).minus(
          bufferedGasCost
        );

        if (maxBNBAfterGas.isNegative()) {
          store.dispatch(setLoading(false));
          return messageApi.error('Insufficient balance to cover gas fee.');
        }

        let amt = formatNumberFiat(
          maxBNBAfterGas
            .integerValue(BigNumber.ROUND_DOWN)
            .dividedBy(coin.coin.decimals)
            .toString()
        );
        console.log('amt',amt);
        setAmount(amt);
        store.dispatch(setLoading(false));
      } else if (!chain.isEVM && chain.currencyName === 'SOL') {
        const solanaHelper = new SolanaHelper(chain.rpcUrl);

        store.dispatch(setLoading(true));
        let balance = coin.balance;
        balance = (balance * 99) / 100;
        const gasPrice = solanaHelper.getGasPrice();
        balance = balance - 0.0015; // Added fee with some buffer values i.e 0.001495 + gas price = 0.0015
        // balance = balance - 0.0015;
        const amountToSend = parseFloat(balance) * (percentage / 100);
        if (parseFloat(amountToSend) - parseFloat(gasPrice) * 3 < 0) {
          store.dispatch(setLoading(false));
          return messageApi.error(
            'You do not have enough balance to proceed with the transaction.'
          );
        }
        let amt = formatNumberFiat(
          (parseFloat(amountToSend) - parseFloat(gasPrice) * 3)
            .toFixed(6)
            .toString()
        );
        setAmount(amt);
        store.dispatch(setLoading(false));
      } else if (!chain.isEVM && chain.currencyName === 'BTC') {
        try {
          store.dispatch(setLoading(true));

          let gasPrice = await BTCHelper.getBTCGasPrice();
          let unspent = await BTCHelper.getUnspent(coin.wallet_address);

          let balance = coin.balance;
          balance = (balance * 99) / 100;
          const amountToSend = parseFloat(balance) * (percentage / 100);

          if (!unspent) {
            store.dispatch(setLoading(false));
            return messageApi.error('Unable to fetch unspent at the moment.');
          }

          if (unspent.length === 0) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              'You have a pending transaction in your account or you do not have enough balance to proceed with the transaction.'
            );
          }

          let inputs = [];
          let totalAmountAvailable = 0;

          unspent.forEach((element) => {
            let utxo = {};
            utxo.satoshis = Math.floor(Number(element.value));
            utxo.script = element.script;
            utxo.address = coin.address;
            utxo.txId = element.tx_hash;
            utxo.outputIndex = element.tx_output_n;
            totalAmountAvailable += parseFloat(utxo.satoshis);
            inputCount += 1;
            inputs.push(utxo);
          });

          transactionSize =
            inputCount * 146 + outputCount * 34 + 10 - inputCount;
          let totalFee = (
            transactionSize *
            gasPrice *
            btcTosatoshiMultiplier
          ).toFixed(8);

          if (amountToSend - totalFee * 2.5 < 0) {
            store.dispatch(setLoading(false));

            return messageApi.error(
              'You do not have enough balance to proceed with the transaction.'
            );
          }

          let amt = formatNumberFiat(
            (amountToSend - totalFee * 2.5).toString()
          );
          setAmount(amt);
          setSelectedGasPriceSol(totalFee);
          store.dispatch(setLoading(false));
        } catch (error) {
          store.dispatch(setLoading(false));
          return messageApi.error(error.message);
        }
      }
    }
  };

  const handleChange = (val) => {
    switch (val) {
      case 0: {
        setSelectedGasPrice(myGasPrice?.safe);
        setGasPriceType(1);
        break;
      }
      case 50: {
        setSelectedGasPrice(myGasPrice?.propose);
        setGasPriceType(2);
        break;
      }
      case 100: {
        setSelectedGasPrice(myGasPrice?.fast);
        setGasPriceType(3);
        break;
      }
      default: {
      }
    }
  };

  const handleSend = async () => {
    store.dispatch(setLoading(true));

    const { chains } = await chrome.storage.local.get('chains');

    const chain = chains.find(
      (chain) => chain.coinFamily === coin.coin.coin_family
    );

    if (!amount) {
      store.dispatch(setLoading(false));
      return messageApi.error('Please enter a valid amount to proceed.');
    }

    const finalAmount = new BigNumber(amount);
    const balance = new BigNumber(myBalance);
    if (finalAmount.gt(balance)) {
      store.dispatch(setLoading(false));
      return messageApi.error(
        'Insufficient balance to proceed with the transaction'
      );
    }

    if (isNaN(parseFloat(amount))) {
      store.dispatch(setLoading(false));
      return messageApi.error('Please enter a valid amount to proceed.');
    }
    if (parseFloat(amount) <= 0) {
      store.dispatch(setLoading(false));
      return messageApi.error('Please enter a valid amount to proceed.');
    }
    if (!address) {
      store.dispatch(setLoading(false));
      return messageApi.error('Please enter a valid address to proceed.');
    }

    const myAddress = account.coinFamilyAndAddress[chain.coinFamily];

    if (myAddress.toLowerCase() === address.toLowerCase()) {
      store.dispatch(setLoading(false));
      return messageApi.error('You cannot send to your own address.');
    }

    let ENSName = null;
    const checkIfUserEnteredENS = address.split('.')[1]
      ? address.split('.')[1].toLowerCase()
      : null;
    if (checkIfUserEnteredENS) {
      if (checkIfUserEnteredENS === 'eth') {
        const checkForENS = await ENSHelper.findAddress(address);
        if (!checkForENS.status) {
          store.dispatch(setLoading(false));
          return messageApi.error('Invalid ENS name provided.');
        } else {
          ENSName = address;
          address = checkForENS.address;
        }
      } else {
        const checkForENS = await UnstoppableDomainHelper.findAddress(
          address,
          chain.currencySymbol.toUpperCase()
        );
        if (!checkForENS.status) {
          store.dispatch(setLoading(false));
          return messageApi.error('Invalid domain name provided.');
        } else {
          ENSName = address;
          address = checkForENS.address;
        }
      }
    }

    const findContact = list.find(
      (l) => l.address.toLowerCase() === address.toLowerCase()
    );

    if (chain.isEVM) {
      if (!ethers.utils.isAddress(address)) {
        store.dispatch(setLoading(false));
        return messageApi.error('Please provide a valid address to proceed.');
      }

      if (!amount) {
        store.dispatch(setLoading(false));
        return messageApi.error('Please provide a valid amount to proceed.');
      }

      const nativeCoinResponse = await Web3Helper.getCoinBalance(
        myAddress,
        coin.coin.coin_family == 1
          ? process.env.REACT_APP_BNB_RPC
          : coin.coin.coin_family == 2
          ? process.env.REACT_APP_ETH_RPC
          : coin.coin.coin_family == 4
          ? process.env.REACT_APP_MATIC_RPC
          : process.env.REACT_APP_QUBETIC_RPC
      );

      const nativeCoinBalance = new BigNumber(nativeCoinResponse);
      const finalAmount = new BigNumber(amount);
      let gasEstimate = new BigNumber(myGasPrice.estimate);
      const gasPrice = new BigNumber(selectedGasPrice).times(1000000000);
      const gasInEth = gasPrice.times(gasEstimate).div(Math.pow(10, 18));

      if (coin.coin.token_address) {
        if (nativeCoinBalance.isLessThan(gasInEth)) {
          store.dispatch(setLoading(false));
          return messageApi.error(
            'Insufficient fee to proceed with the transaction.'
          );
        }

        const tokenBalance = new BigNumber(myBalance);
        if (tokenBalance.isLessThan(finalAmount)) {
          store.dispatch(setLoading(false));
          return messageApi.error(
            'Insufficient balance to proceed with the transaction'
          );
        }
      } else {
        const totalAmountIncludingGasPriceInEth = gasInEth.plus(finalAmount);

        if (nativeCoinBalance.isLessThan(totalAmountIncludingGasPriceInEth)) {
          store.dispatch(setLoading(false));
          return messageApi.error(
            'Insufficient balance to proceed with the transaction'
          );
        }
      }

      store.dispatch(setLoading(false));

      let prc =
        gasPriceType == 1
          ? myGasPrice?.safe
          : gasPriceType == 2
          ? myGasPrice?.propose
          : myGasPrice?.fast;
      console.log('amount ~ 602 ~ SendCoins.jsx',amount);
      console.log('GAS PRICE IN SEND CONFIRM :',Math.max(prc,1) , prc);
      navigate('/confirmCurrency', {
        state: {
          to: address,
          amount: amount,
          coin,
          networkFee: ((myGasPrice?.estimate * Math.max(prc,1)) / 10 ** 9)?.toFixed(5),
          ENSName,
          contact: findContact?.name,
          redirectTo,
          gasPriceType,
          sessionPassword,
        },
      });
    } else if (!chain.isEVM && chain.currencyName === 'SOL') {
      const solanaHelper = new SolanaHelper(chain.rpcUrl);

      const gasPrice = solanaHelper.getGasPrice();

      if (amount > parseFloat(myBalance)) {
        store.dispatch(setLoading(false));
        return messageApi.error('Please provide a valid amount to proceed.');
      }
      store.dispatch(setLoading(false));
      navigate('/confirmCurrency', {
        state: {
          to: address,
          amount: amount,
          coin,
          networkFee: gasPrice,
          redirectTo,
          sessionPassword,
        },
      });
    }
    //  else if (!chain.isEVM && chain.currencyName === 'BTC') {
    //   try {
    //     const gasPrice = await BTCHelper.getBTCGasPrice();
    //     const unspent = await BTCHelper.getUnspent(coin.wallet_address);

    //     if (!unspent) {
    //       store.dispatch(setLoading(false));
    //       return messageApi.error('Unable to fetch unspent at the moment.');
    //     }

    //     if (unspent.length === 0) {
    //       store.dispatch(setLoading(false));
    //       return messageApi.error(
    //         'You have a pending transaction or insufficient balance.'
    //       );
    //     }

    //     // 2. Prepare inputs and calculate available satoshis
    //     let totalAmountAvailable = 0;
    //     const inputs = unspent.map((utxo) => {
    //       const satoshis = Math.floor(Number(utxo.satoshis));
    //       totalAmountAvailable += satoshis;
    //       return {
    //         satoshis,
    //         script: utxo.scriptPubKey,
    //         address: coin.wallet_address,
    //         txId: utxo.txid,
    //         outputIndex: utxo.vout,
    //       };
    //     });

    //     const inputCount = inputs.length;
    //     const transactionSize =
    //       inputCount * 146 + outputCount * 34 + 10 - inputCount;
    //     const fee = transactionSize * gasPrice;
    //     const totalFee = (fee * btcTosatoshiMultiplier).toFixed(8);
    //     const totalAmount = parseFloat(totalFee) + parseFloat(amount);

    //     if (totalAmount > myBalance) {
    //       store.dispatch(setLoading(false));
    //       return messageApi.error('Not enough balance to proceed.');
    //     }

    //     const sendAmount = Math.round(amount * btcTosatoshi);
    //     if (totalAmountAvailable - sendAmount - fee < 0) {
    //       store.dispatch(setLoading(false));
    //       return messageApi.error('Insufficient UTXO balance.');
    //     }

    //     const bitcore = require('bitcore-lib');

    //     const transaction = new bitcore.Transaction()
    //       .from(inputs)
    //       .to(address, sendAmount);

    //     const change = totalAmountAvailable - sendAmount - fee;
    //     if (change > 546) {
    //       transaction.change(coin.wallet_address);
    //       transaction.fee(fee);
    //     } else {
    //       transaction.fee(fee + change);
    //     }

    //     const btcPrivateKey =
    //       await WalletHelper.getBitcoinPrivateKeyWithPassword(sessionPassword);
    //     if (!btcPrivateKey) {
    //       store.dispatch(setLoading(false));
    //       return messageApi.error(
    //         'Unable to fetch private key. Please try again later.'
    //       );
    //     }

    //     transaction.sign(btcPrivateKey);
    //     const rawTransaction = transaction.serialize();
    //     store.dispatch(setLoading(false));

    //     navigate('/confirmCurrency', {
    //       state: {
    //         rawTransaction,
    //         to: address,
    //         amount,
    //         coin,
    //         ENSName,
    //         redirectTo,
    //         networkFee: totalFee,
    //         sessionPassword,
    //       },
    
    //     });
    //   } catch (error) {
    //     console.error('BTC Transaction Error:', error);
    //     store.dispatch(setLoading(false));

    //     if (error.message.includes('Dust amount detected in one output')) {
    //       return messageApi.error(
    //         'Amount is below the dust threshold. Please enter a higher value.'
    //       );
    //     }

    //     return messageApi.error(
    //       error.message || 'An unexpected error occurred.'
    //     );
    //   }
    // }

    else if (!chain.isEVM && chain.currencyName === 'BTC') {
      try {
        const bitcoin = require('bitcoinjs-lib');
        
        const gasPrice = await BTCHelper.getBTCGasPrice(); 
        const unspent = await BTCHelper.getUnspent(coin.wallet_address);
        console.log("🚀 ~ handleSend ~ unspent:", unspent)
        console.log(coin,"coin");
        
        if (!unspent || unspent.length === 0) {
          store.dispatch(setLoading(false));
          return messageApi.error('No UTXOs available or insufficient balance.');
        }
      
        let totalAmountAvailable = 0;
        
        // Process UTXOs
        const utxos = unspent.map((utxo) => {
          console.log(utxo,"utxoutxoutxo");
          
          const satoshis = Math.floor(Number(utxo.satoshis));
          totalAmountAvailable += satoshis;
          
          return {
            txid: utxo.txid,
            vout: utxo.vout,
            value: satoshis,
          };
        });
      
        const inputCount = utxos.length;
        const outputCount = 2;
        const transactionSize = inputCount * 146 + outputCount * 34 + 10;
        const fee = Math.ceil(transactionSize * gasPrice);
        const sendAmount = Math.round(amount * btcTosatoshi);
        const totalFee = (fee * btcTosatoshiMultiplier).toFixed(8);
        const totalAmount = sendAmount + fee;

        
      
        if (totalAmountAvailable < totalAmount) {
          store.dispatch(setLoading(false));
          return messageApi.error('Insufficient UTXO balance.');
        }
      
        // Get private key
        const btcPrivateKeyStr = await WalletHelper.getBitcoinPrivateKeyWithPassword(sessionPassword);
        if (!btcPrivateKeyStr) {
          store.dispatch(setLoading(false));
          return messageApi.error('Unable to fetch private key.');
        }
      
        // Convert WIF to key pair
        const keyPair = bitcoin.ECPair.fromWIF(btcPrivateKeyStr);
        
        // Determine address type and create appropriate payment
        let payment;
        if (coin.wallet_address.startsWith('bc1q')) {
          // P2WPKH (Bech32)
          payment = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });
          console.log("Using P2WPKH (SegWit) address:", payment.address);
        } else if (coin.wallet_address.startsWith('3')) {
          // P2SH-P2WPKH (SegWit wrapped in P2SH)
          const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });
          payment = bitcoin.payments.p2sh({ redeem: p2wpkh });
          console.log("Using P2SH-P2WPKH address:", payment.address);
        } else {
          // P2PKH (Legacy)
          payment = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
          console.log("Using P2PKH (Legacy) address:", payment.address);
        }
      
        // Verify address match
        if (payment.address !== coin.wallet_address) {
          console.error("Address mismatch:", payment.address, "vs", coin.wallet_address);
          store.dispatch(setLoading(false));
          return messageApi.error('Private key does not match wallet address.');
        }
      
        // Create transaction
        const psbt = new bitcoin.Psbt();
        
        // Add inputs
        for (const utxo of utxos) {
          const inputData = {
            hash: utxo.txid,
            index: utxo.vout,
            // For SegWit inputs, we need to specify the value
            ...(coin.wallet_address.startsWith('bc1q') && { witnessUtxo: {
              script: payment.output,
              value: utxo.value,
            }}),
            // For P2SH-P2WPKH
            ...(coin.wallet_address.startsWith('3') && { 
              witnessUtxo: {
                script: payment.output,
                value: utxo.value,
              },
              redeemScript: payment.redeem.output
            }),
            // For legacy inputs, you'd need the full previous transaction
            // This is more complex and requires fetching the full tx
          };
          
          psbt.addInput(inputData);
        }
      
        // Add outputs
        const change = totalAmountAvailable - sendAmount - fee;
        
        // Add recipient output
        psbt.addOutput({
          address: address,
          value: sendAmount,
        });
      
        // Add change output if above dust threshold
        if (change > 546) {
          psbt.addOutput({
            address: coin.wallet_address,
            value: change,
          });
        }
      
        // Sign all inputs
        for (let i = 0; i < utxos.length; i++) {
          psbt.signInput(i, keyPair);
        }
      
        // Validate signatures
        psbt.validateSignaturesOfAllInputs();
        
        // Finalize and extract transaction
        psbt.finalizeAllInputs();
        const rawTransaction = psbt.extractTransaction().toHex();
        
        console.log("Transaction created successfully");
        store.dispatch(setLoading(false));
        console.log({rawTransaction,
          to: address,
          amount,
          coin,
          ENSName,
          redirectTo,
          networkFee: totalFee,
          sessionPassword,});
        
      
        navigate('/confirmCurrency', {
          state: {
            rawTransaction,
            to: address,
            amount,
            coin,
            ENSName,
            redirectTo,
            networkFee: totalFee,
            sessionPassword,
          },
        });
      
      }  catch (error) {
        console.error('BTC Transaction Error:', error);
        store.dispatch(setLoading(false));
        return messageApi.error(
          error.message.includes('Dust amount') ?
            'Amount is below dust threshold.' :
            error.message || 'Transaction failed.'
        );
      }
    }
    
    
     else if (!chain.isEVM && chain.currencyName === 'ADA') {
      try {
        if (coin.tokenAddress) {
          store.dispatch(setLoading(true));
          const fee = await AdaHelper.getFee(
            address,
            coin.wallet_address,
            amount
          );
          if (!fee) {
            store.dispatch(setLoading(false));
            return messageApi.error('Unable to fetch fee.');
          }
          const adaBalance = myBalance;
          if (parseFloat(adaBalance) < parseFloat(fee) + parseFloat(1)) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              'You do not have enough gas fee to proceed with the transaction.'
            );
          }
          const totalAmount = parseFloat(amount);
          if (totalAmount > parseFloat(myBalance)) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              'You do not have enough balance to proceed with the transaction.'
            );
          }
          store.dispatch(setLoading(false));
          navigate('/confirmCurrency', {
            state: {
              to: address,
              amount: amount,
              coin,
              networkFee: fee,
              ENSName,
              sessionPassword,
            },
          });
        } else {
          store.dispatch(setLoading(true));
          const fee = await AdaHelper.getFee(
            address,
            coin.wallet_address,
            amount
          );
          if (!fee) {
            store.dispatch(setLoading(false));
            return messageApi.error('Unable to fetch fee.');
          }
          const totalAmount = parseFloat(fee) + parseFloat(amount);
          if (totalAmount > parseFloat(myBalance)) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              'You do not have enough balance to proceed with the transaction.'
            );
          }
          store.dispatch(setLoading(false));
          navigate('/confirmCurrency', {
            state: {
              to: address,
              amount: amount,
              coin,
              networkFee: fee,
              ENSName,
              redirectTo,
              sessionPassword,
            },
          });
        }
      } catch (error) {
        console.log('~ sendcoin.jsx ~ handleSend ~ 848 error ~:', error);
      }
    }
  };

  return (
    <div className={`scrollableCont ${style.send}`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={redirectTo ? redirectTo : '/send'}
        title={`Send ${coin.coin.coin_symbol.toUpperCase()}`}
        coin={coin}
      />
      <div
        className={`flexedContent manageWalletHeight `}
        style={{ gap: '30px' }}
      >
        <div>
          <InputField
            placeholder={'Wallet Address'}
            label="Address"
            value={address}
            checkForSymbols={true}
            getData={setAddress}
            addonAfter={
              <>
                <span
                  onClick={async (e) => {
                    onLogoutClick();
                  }}
                >
                  <img
                    src={AddressBook}
                    style={{
                      width: '18px',
                      marginRight: '10px',
                      cursor: 'pointer',
                    }}
                    alt=""
                  />
                </span>
                <span
                  className={style.send__pasteText}
                  style={{
                    position: 'relative',
                    top: '-4px',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={async (e) => {
                    const text = await navigator.clipboard.readText();
                    setAddress(text);
                  }}
                >
                  Paste
                </span>
              </>
            }
          />
          <InputField
            placeholder={'Enter Amount'}
            addonAfter={
              <>
                <span
                  className={style.send__pasteText}
                  style={{
                    position: 'relative',
                    top: '-1px',
                    left: '-5px',
                    borderLeft: '0px',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    calculatePercentageWise(100);
                  }}
                >
                  Max
                </span>
              </>
            }
            getData={(amount) => {
              const afterDecimal = amount.split('.')[1];

              // Get the maximum allowed characters before the decimal point (15 characters)
              const maxCharactersBeforeDecimal = 15;

              if (afterDecimal) {
                // Get the maximum allowed decimals for the cryptocurrency (e.g., Bitcoin has 8 decimals)
                const maxDecimals = coin.coin.decimals.toString().length - 1;
                // Check if the entered decimal part is longer than the maximum allowed
                if (afterDecimal.toString().length > maxDecimals) {
                  return; // Return if decimal part is too long
                }

                // Check if the characters before the decimal exceed the maximum allowed
                const beforeDecimal = amount.split('.')[0];
                if (
                  beforeDecimal.toString().length > maxCharactersBeforeDecimal
                ) {
                  return; // Return if characters before decimal exceed the maximum allowed
                }
              } else {
                // If there's no decimal, check the whole input length
                if (amount.length > maxCharactersBeforeDecimal) {
                  return; // Return if the whole input exceeds the maximum allowed
                }
              }

              setAmount(amount);
            }}
            type={'number'}
            label="Amount"
            value={amount} //  {amount}
            checkForSymbols={true}
          />

          <div className={style.do}>
            <div
              className={style.send__infoText}
              // style={{
              //   position: 'relative',
              //   left: '20px',
              // }}
            >
              = {currency.symbol}
              {addCommasToNumber(
                getFlooredFixed(
                  parseFloat(amount ? amount : 0) * parseFloat(price),
                  2
                )
              )}
            </div>
            <div className={style.send__infoText}>
              <span
                style={{
                  color: '#6F6F6F',
                  // position: 'relative',
                  // top: '-6px',
                  marginRight: '5px',
                  fontWeight: '#6F6F6F',
                }}
              >
                Balance:
              </span>
              {addCommasToNumber(getFlooredFixed(myBalance, 5))}{' '}
              {coin.coin.coin_symbol.toUpperCase()} ~ {currency.symbol}
              {getFlooredFixed(value, 2)}
            </div>
          </div>

          {/* <ReactSlider
          className='horizontal-slider'
          marks={[myGasPrice.safe, myGasPrice.propose, myGasPrice.fast]}
          markClassName='example-mark'
          min={myGasPrice.safe}
          max={myGasPrice.fast}
          thumbClassName='example-thumb'
          trackClassName='example-track'
          renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
        /> */}
          <div className="transactionFee">
            <h4>Transaction Fee ({BL_CODE[coin?.coin?.coin_family] ?? ''})</h4>

            {coin?.coin?.coin_family == 3 || coin?.coin?.coin_family == 5 ? (
              <InputFieldOnly
                placeholder={'Transaction Fee'}
                label=""
                value={selectedGasPriceSol}
                readonly={true}
                placeholderBaseColor={true}
              />
            ) : coin?.coin?.coin_family == 2 || coin?.coin?.coin_family == 7 ? (
              <>
                <InputFieldOnly
                  placeholder={'Transaction Fee'}
                  label=""
                  value={parseFloat(
                    (myGasPrice?.estimate * myGasPrice?.fast) / 10 ** 9
                  )?.toFixed(coin?.coin?.coin_family == 7 ? 15 : 5)}
                  readonly={true}
                  placeholderBaseColor={true}
                />
              </>
            ) : (
              <>
                <Slider
                  marks={{
                    0: 'Low',
                    50: 'Average',
                    100: 'High',
                  }}
                  tooltip={{ open: false }}
                  defaultValue={50}
                  step={null}
                  onChange={handleChange}
                />

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p style={{ color: 'white' }}>
                      {isNaN(
                        parseFloat(
                          (myGasPrice?.estimate * myGasPrice?.safe) / 10 ** 9
                        )
                      )
                        ? '0.00'
                        : parseFloat(
                            (myGasPrice?.estimate * myGasPrice?.safe) / 10 ** 9
                          )?.toFixed(5)}{' '}
                      {crypto[coin?.coin?.coin_family]?.toUpperCase()}
                    </p>
                    <p style={{ color: 'white' }}>
                      {' '}
                      {isNaN(
                        (
                          parseFloat(nativeCoinPrice) *
                          parseFloat(
                            (myGasPrice?.estimate * myGasPrice?.safe) / 10 ** 9
                          )
                        )
                      )
                        ? '0.00'
                        : (
                            parseFloat(nativeCoinPrice) *
                            parseFloat(
                              (myGasPrice?.estimate * myGasPrice?.safe) /
                                10 ** 9
                            )
                          )?.toFixed(5)}{' '}
                      {currency?.name?.toUpperCase()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p style={{ color: 'white' }}>
                      {isNaN(
                        parseFloat(
                          (myGasPrice?.estimate * myGasPrice?.propose) / 10 ** 9
                        )
                      )
                        ? '0.00'
                        : parseFloat(
                            (myGasPrice?.estimate * myGasPrice?.propose) /
                              10 ** 9
                          )?.toFixed(5)}{' '}
                      {crypto[coin?.coin?.coin_family]?.toUpperCase()}
                    </p>

                    <p style={{ color: 'white' }}>
                      {' '}
                      {isNaN(
                        (
                          parseFloat(nativeCoinPrice) *
                          parseFloat(
                            (myGasPrice?.estimate * myGasPrice?.propose) /
                              10 ** 9
                          )
                        )
                      )
                        ? '0.00'
                        : (
                            parseFloat(nativeCoinPrice) *
                            parseFloat(
                              (myGasPrice?.estimate * myGasPrice?.propose) /
                                10 ** 9
                            )
                          )?.toFixed(5)}{' '}
                      {currency?.name?.toUpperCase()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p style={{ color: 'white' }}>
                      {isNaN(
                        parseFloat(
                          (myGasPrice?.estimate * myGasPrice?.fast) / 10 ** 9
                        )
                      )
                        ? '0.00'
                        : parseFloat(
                            (myGasPrice?.estimate * myGasPrice?.fast) / 10 ** 9
                          )?.toFixed(5)}{' '}
                      {crypto[coin?.coin?.coin_family]?.toUpperCase()}
                    </p>

                    <p style={{ color: 'white' }}>
                      {' '}
                      {isNaN(
                        (
                          parseFloat(nativeCoinPrice) *
                          parseFloat(
                            (myGasPrice?.estimate * myGasPrice?.fast) / 10 ** 9
                          )
                        )
                      )
                        ? '0.00'
                        : (
                            parseFloat(nativeCoinPrice) *
                            parseFloat(
                              (myGasPrice?.estimate * myGasPrice?.fast) /
                                10 ** 9
                            )
                          )?.toFixed(5)}{' '}
                      {currency?.name?.toUpperCase()}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div>
          <ButtonComp
            onClick={() => {
              if (!address) {
                return messageApi.error(
                  'Please enter a valid address.'
                );
              }
              if (!amount) {
                return messageApi.error(
                  'Please enter valid amount.'
                );
              } else {
                setSessionPassword('');
                setConfirmModal(!isModalOpen);
              }
            }}
            text={'Send'}
            maxWidth={'100%'}
          />
        </div>
      </div>
      <ModalCustom
        title={'Address Book'}
        handleCancel={handleLogoutCancel}
        isModalOpen={isLogoutModalOpen}
        handleOk={handlLogouteOk}
        customClass="customClassModal"
      >
        <div className={style.viewphrases}>
          {list.length > 0 ? (
            <>
              <AddressTableSend
                setAddress={(value, name) => {
                  setAddress(value);
                  setContact(name);
                  handlLogouteOk();
                }}
                dataArray={list.map((el) => {
                  return {
                    address: el.address,

                    name: el.name,

                    id: el?.id,

                    wallet_data: el?.wallet_data,
                  };
                })}
              />
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: '10px',
                  color: '#fff',
                }}
              >
                <span
                  style={{ cursor: 'pointer', display: 'flex' }}
                  to={void 0}
                  onClick={() => {
                    navigate('/add-contact', {
                      state: {
                        coin,
                        redirectTo,
                      },
                    });
                  }}
                >
                  <img src={Add} alt="" />
                  <span className="noAddress">Add Address</span>
                </span>
              </div>
            </>
          ) : (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <span
                style={{ cursor: 'pointer', display: 'flex' }}
                to={void 0}
                onClick={() => {
                  navigate('/add-contact', {
                    state: {
                      coin,
                      redirectTo,
                    },
                  });
                }}
              >
                <img src={Add} style={{ marginRight: '7px' }} alt="" />
                <span className="noAddress">Add Address</span>
              </span>
            </div>
          )}
        </div>
      </ModalCustom>

      <ModalCustom
        title={'Password'}
        handleCancel={() => setConfirmModal(!isModalOpen)}
        isModalOpen={isModalOpen}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <InputFieldSimple
            placeholder="Password"
            value={sessionPassword}
            getData={(value) => {
              const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
              if (value.length <= 100 && !hasEmoji) {
                setSessionPassword(value);
              }
            }}
            customFunction={async () => {
              if (!sessionPassword) {
                return messageApi.error('Please enter password.');
              }
              const res = await WalletHelper.verifyPassword(sessionPassword);
              if (!res) {
                return messageApi.error(
                  'Please enter valid password to proceed.'
                );
              }
              setConfirmModal(!isModalOpen);
              store.dispatch(setLoading(true));
              await handleSend();
              store.dispatch(setLoading(false));
            }}
          />
          <div style={{ marginTop: '10px' }}></div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              if (!sessionPassword) {
                return messageApi.error('Please enter password.');
              }
              const res = await WalletHelper.verifyPassword(sessionPassword);
              if (!res) {
                return messageApi.error(
                  'Please enter valid password to proceed.'
                );
              }
              setConfirmModal(!isModalOpen);
              store.dispatch(setLoading(true));
              await handleSend();
              store.dispatch(setLoading(false));
            }}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default SendCoins;
