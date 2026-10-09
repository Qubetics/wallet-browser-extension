/* eslint-disable react-hooks/exhaustive-deps */
/*global chrome*/
/* global BigInt */
import { message, Select, Slider } from 'antd';
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
import { getRpcUrl } from '../../../helpers/rpcService';
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
import {
  formatNumberFiat,
  formatNumberInput,
} from '../../../helpers/common.helper';
import AddressTableSend from '../../../Components/AddressTable/AddressTableSend';
import { BL_CODE } from '../../../helpers/constant';
import { calculateFee, GasPrice } from '@cosmjss/stargate';
import {
  estimateGasLimit,
  getCosmosAddress,
} from '../../../helpers/cosmos.helper';

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
    state: {
      coin,
      redirectTo,
      backAddress,
      backAmount,
      backFromConfirm,
      chainSelected,
      fromChainAbstraction,
    },
  } = useLocation();
  const navigate = useNavigate();

  const [myBalance, setBalance] = useState(0);
  const [gasPriceType, setGasPriceType] = useState(2); // 1 slow, 2 medium, 3 fast
  let [address, setAddress] = useState(backAddress || null);
  const [contact, setContact] = useState(null);
  const [amount, setAmount] = useState(backAmount || null);
  const [value, setValue] = useState(0.0);
  const [price, setPrice] = useState(0);
  const [isLogoutModalOpen, setLogoutOpenmodal] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({});
  const [list, setList] = useState([]);
  const [selectedGasPrice, setSelectedGasPrice] = useState(0);
  const [selectedGasPriceSol, setSelectedGasPriceSol] = useState(0);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [isModalOpen, setConfirmModal] = useState(false);
  const [selectChainModal, setSelectChainModal] = useState(false);
  const [selectChain, setSelectChain] = useState('evm');
  const [nativeCoinPrice, setNativeCoinPrice] = useState(0);
  const [myGasPrice, setGasPrice] = useState({
    estimate: 0,
    fast: 0,
    propose: 0,
    safe: 0,
  });
  const [loading, setComponentLoading] = useState(null);
  const [cosmosFee, setCosmosFee] = useState(0);

  const getDecimalPrecision = () => {
    const rawDecimals = Number(coin?.coin?.decimals);
    if (!Number.isFinite(rawDecimals) || rawDecimals <= 0) {
      return 18;
    }
    // Handles both formats:
    // - precision format: 18
    // - base unit format: 1000000000000000000
    if (rawDecimals <= 30) {
      return Math.floor(rawDecimals);
    }
    return Math.max(String(Math.trunc(rawDecimals)).length - 1, 0);
  };

  const getBaseUnitDivisor = () => {
    const rawDecimals = Number(coin?.coin?.decimals);
    if (!Number.isFinite(rawDecimals) || rawDecimals <= 0) {
      return new BigNumber(10).pow(18);
    }
    if (rawDecimals > 30) {
      return new BigNumber(rawDecimals);
    }
    return new BigNumber(10).pow(Math.floor(rawDecimals));
  };

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

  const fetchCosmosGasFee = async () => {
    const result = await server.get('/qubetics/gas_estimation/nativeAddress', {
      headers: {
        Authorization: account.jwtToken,
      },
    });

    const gasPriceLocal = GasPrice.fromString(result?.data?.data?.gas_price);
    let gasLimit = Math.round(result?.data?.data?.buffered_gas_estimate * 3.2);
    let stdFee = calculateFee(gasLimit, gasPriceLocal);

    // console.log(
    //   'buffered gasLimit, gasEstimate, gasPriceLocal, stdFee',
    //   gasLimit,
    //   gasPriceLocal,
    //   stdFee
    // );

    const numerator = BigInt(stdFee['amount'][0]['amount']);
    const denominator = BigInt('1000000000000000000');
    const integerPart = numerator / denominator;
    const remainder = numerator % denominator;
    const decimals = (remainder * BigInt(1_000_000)) / denominator;
    const feeFormatted = `${integerPart}.${decimals
      .toString()
      .padStart(6, '0')}`;
    setCosmosFee(feeFormatted);
  };

  useEffect(() => {
    const price = coin.coin.fiat_price_data || 0;
    if (price) {
      const value = parseFloat(coin.balance) * parseFloat(price.value);
      setValue(value);
      setPrice(price.value);
    }
    init();
    return () => {
      inputCount = 0;
      inputCount = 0;
      transactionSize = 0;
      outputCount = 2;
      btcTosatoshi = 100000000;
      btcTosatoshiMultiplier = 0.00000001;
    };
  }, []);

  useEffect(() => {
    // console.log('backFromConfirm', backFromConfirm);
    // Only skip chain selection modal when coming from chain abstraction
    if (loading !== null && coin?.coin?.coin_family === 7 && !backFromConfirm && fromChainAbstraction) {
      setSessionPassword('');
      setSelectChain('evm'); // Always set to evm for TICS when from chain abstraction
      // Skip the modal - directly proceed with evm chain
    } else if (loading !== null && coin?.coin?.coin_family === 7 && !backFromConfirm) {
      // Show modal for other cases
      setSessionPassword('');
      setSelectChainModal(!selectChainModal);
    }
    if (chainSelected) {
      setSelectChain(chainSelected);
      fetchCosmosGasFee();
    }
  }, [loading, backFromConfirm, chainSelected, fromChainAbstraction]);

  useEffect(() => {
    if (loading !== null && selectChain === 'cosmos' && !backFromConfirm) {
      fetchCosmosGasFee();
    }
    if (selectChain === 'evm') {
      fetchNativePrice();
    }
  }, [selectChain]);

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
              'You do not have enough balance to proceed with the transaction.'
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
          const totalFee = transactionSize * gasPrice * btcTosatoshiMultiplier;
          setSelectedGasPriceSol(formatNumberInput(totalFee * 1.5, 5));
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
      setComponentLoading(false);
    } catch (error) {
      store.dispatch(setLoading(false));
      setComponentLoading(false);
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
          rpc = getRpcUrl('REACT_APP_BNB_RPC');
          break;
        case 2:
          rpc = getRpcUrl('REACT_APP_ETH_RPC');
          break;
        case 3:
          rpc = getRpcUrl('REACT_APP_BTC_RPC');
          break;
        case 4:
          rpc = getRpcUrl('REACT_APP_MATIC_RPC');
          break;
        case 5:
          rpc = getRpcUrl('REACT_APP_SOL_RPC');
          break;
        case 7:
          rpc = getRpcUrl('REACT_APP_QUBETIC_RPC');
          break;
        default:
          rpc = getRpcUrl('REACT_APP_TRON_RPC');
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
        if (selectChain === 'cosmos') {
          const actualAmountLeft = Number(coin.balance) - Number(cosmosFee);
          setAmount(actualAmountLeft.toFixed(6));
          return;
        }
        store.dispatch(setLoading(true));
        const balance = new BigNumber(coin.balance).times(
          '1000000000000000000'
        );
        const amountToSend = new BigNumber(balance);
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

        const gasLimit = gasPrice.estimate;
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

        const baseUnitDivisor = getBaseUnitDivisor();
        let amt = formatNumberFiat(
          maxBNBAfterGas
            .integerValue(BigNumber.ROUND_DOWN)
            .dividedBy(baseUnitDivisor)
            .toString()
        );
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
              'You do not have enough balance to proceed with the transaction.'
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
          if (amountToSend - Number(totalFee * 1.5).toFixed(8) < 0) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              'You do not have enough balance to proceed with the transaction.'
            );
          }
          let amt = (Number(amountToSend) - Number(totalFee * 1.5)).toFixed(8);
          setAmount(amt);
          setSelectedGasPriceSol(Number(totalFee * 1.5).toFixed(8));
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
      (chain) => chain?.coinFamily === coin?.coin?.coin_family
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

    const myAddress = account?.coinFamilyAndAddress[chain?.coinFamily];

    if (myAddress?.toLowerCase() === address?.toLowerCase()) {
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
          return messageApi.error('Please enter valid address.');
        } else {
          ENSName = address;
          address = checkForENS.address;
        }
      }
    }

    const findContact = list.find(
      (l) => l.address.toLowerCase() === address.toLowerCase()
    );

    if (chain.isEVM && selectChain === 'evm') {
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
          ? getRpcUrl('REACT_APP_BNB_RPC')
          : coin.coin.coin_family == 2
          ? getRpcUrl('REACT_APP_ETH_RPC')
          : coin.coin.coin_family == 4
          ? getRpcUrl('REACT_APP_MATIC_RPC')
          : getRpcUrl('REACT_APP_QUBETIC_RPC')
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
      navigate('/confirmCurrency', {
        state: {
          to: address,
          amount: amount,
          coin,
          networkFee: (
            (myGasPrice?.estimate * Math.max(myGasPrice?.fast, 1)) /
            10 ** 9
          )?.toFixed(8),
          ENSName,
          contact: findContact?.name,
          redirectTo,
          gasPriceType,
          sessionPassword,
        },
      });
    }

    if (chain?.isEVM && selectChain === 'cosmos') {
      if (!amount) {
        store.dispatch(setLoading(false));
        return messageApi.error('Please provide a valid amount to proceed.');
      }
      if (!address.startsWith('qubetics1')) {
        store.dispatch(setLoading(false));
        return messageApi.error('Please provide a valid address');
      }
      const gasPromise = server.get('/qubetics/gas_estimation/nativeAddress', {
        headers: { Authorization: account.jwtToken },
      });

      const mnemonics = await WalletHelper.getMnemonicsByPassword(
        myAddress,
        sessionPassword
      );

      const addressPromise = getCosmosAddress();
      const [{ data }, cosmosFromAddress] = await Promise.all([
        gasPromise,
        addressPromise,
      ]);
      const { gas_estimate, gas_price, buffered_gas_estimate } =
        data?.data || {};
      const { stdFee } = await estimateGasLimit(
        mnemonics,
        address?.toLowerCase(),
        amount,
        cosmosFromAddress,
        gas_price,
        3.2,
        buffered_gas_estimate
      );

      const feeAmount = BigInt(stdFee?.amount?.[0]?.amount || '0');
      const denom = BigInt('1000000000000000000');
      const integerPart = feeAmount / denom;
      const remainder = feeAmount % denom;
      const decimals = (remainder * 1_000_000n) / denom;

      const feeFormatted = `${integerPart}.${decimals
        .toString()
        .padStart(6, '0')}`;
      const fiatPrice = coin?.coin?.fiat_price_data?.value || 0;

      const feeInUsd = (parseFloat(feeFormatted) * fiatPrice).toFixed(6);
      const amountInUsd = (amount * fiatPrice).toFixed(6);

      const cosmosData = {
        address: cosmosFromAddress,
        fee: feeFormatted,
        feeInUsd: feeInUsd,
        amountInUsd: amountInUsd,
        stdFee: stdFee,
        gasLimit: gas_estimate,
      };
      navigate('/confirmCurrency', {
        state: {
          to: address,
          amount: amount,
          coin,
          networkFee: null,
          ENSName,
          contact: findContact?.name,
          redirectTo,
          gasPriceType,
          sessionPassword,
          selectChain,
          mnemonics,
          cosmosData: cosmosData,
        },
      });
    } else if (!chain.isEVM && chain.currencyName === 'SOL') {
      const { PublicKey } = require('@solana/web3.js');

      const stopWithError = (msg) => {
        store.dispatch(setLoading(false));
        return messageApi.error(msg);
      };

      try {
        // --- Validate SOL recipient address ---
        try {
          new PublicKey(address); // throws error if invalid
        } catch {
          return stopWithError('Please provide a valid address to proceed.');
        }

        const solanaHelper = new SolanaHelper(chain.rpcUrl);

        // --- Get network fee ---
        const gasPrice = await solanaHelper.getGasPrice();

        // --- Validate amount ---
        if (amount > parseFloat(myBalance)) {
          return stopWithError('Please provide a valid amount to proceed.');
        }

        // --- Proceed to confirmation ---
        store.dispatch(setLoading(false));

        navigate('/confirmCurrency', {
          state: {
            to: address,
            amount,
            coin,
            networkFee: gasPrice,
            redirectTo,
            sessionPassword,
          },
        });
      } catch (error) {
        // console.log('SOL Transaction Error:', error);
        return stopWithError(error.message || 'Transaction failed.');
      }
    } else if (!chain.isEVM && chain.currencyName === 'BTC') {
      const bitcoin = require('bitcoinjs-lib');

      const stopWithError = (msg) => {
        store.dispatch(setLoading(false));
        return messageApi.error(msg);
      };

      try {
        // --- Validate BTC recipient address ---
        try {
          bitcoin.address.toOutputScript(address, bitcoin.networks.bitcoin);
        } catch {
          return stopWithError('Please provide a valid address to proceed.');
        }

        // --- Fetch data ---
        const gasPrice = await BTCHelper.getBTCGasPrice();
        const unspent = await BTCHelper.getUnspent(coin.wallet_address);

        if (!unspent?.length)
          return stopWithError('No UTXOs available or insufficient balance.');

        // --- Build UTXO list & compute total ---
        let totalAmountAvailable = 0;
        const utxos = unspent.map((u) => {
          const sat = Math.floor(Number(u.satoshis));
          totalAmountAvailable += sat;
          return { txid: u.txid, vout: u.vout, value: sat };
        });

        // --- Fee + amount ---
        const inputCount = utxos.length;
        const transactionSize = inputCount * 146 + 2 * 34 + 10;
        const fee = Math.ceil(transactionSize * gasPrice);

        const sendAmount = Math.round(amount * btcTosatoshi);
        const totalFee = formatNumberInput(fee * btcTosatoshiMultiplier, 6);
        const totalSpend = sendAmount + fee * 1.5;

        // --- DUST CHECK (recipient output must be >= 546 sats) ---
        if (sendAmount < 546) {
          return stopWithError('Amount is below dust threshold.');
        }

        if (totalAmountAvailable < totalSpend)
          return stopWithError('Insufficient UTXO balance.');

        // --- Fetch private key ---
        const wifKey = await WalletHelper.getBitcoinPrivateKeyWithPassword(
          coin.wallet_address,
          sessionPassword
        );
        if (!wifKey) return stopWithError('Unable to fetch private key.');

        const keyPair = bitcoin.ECPair.fromWIF(wifKey);

        // --- Detect address type once ---
        const isBech32 = coin.wallet_address.startsWith('bc1q');
        const isP2SH = coin.wallet_address.startsWith('3');

        // --- Prepare payment object (3 types simplified) ---
        const payment = isBech32
          ? bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey })
          : isP2SH
          ? bitcoin.payments.p2sh({
              redeem: bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey }),
            })
          : bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

        // --- Verify matching address for private key ---
        if (payment.address !== coin.wallet_address) {
          return stopWithError('Private key does not match wallet address.');
        }

        // --- Build transaction ---
        const psbt = new bitcoin.Psbt();

        for (const u of utxos) {
          const baseInput = { hash: u.txid, index: u.vout };

          if (isBech32) {
            baseInput.witnessUtxo = { script: payment.output, value: u.value };
          } else if (isP2SH) {
            baseInput.witnessUtxo = { script: payment.output, value: u.value };
            baseInput.redeemScript = payment.redeem.output;
          }

          psbt.addInput(baseInput);
        }

        // Outputs
        const change = totalAmountAvailable - sendAmount - fee;

        psbt.addOutput({ address, value: sendAmount });

        // change must also avoid dust — optional but recommended
        if (change > 546) {
          psbt.addOutput({ address: coin.wallet_address, value: change });
        }

        // Sign
        utxos.forEach((_, i) => psbt.signInput(i, keyPair));
        psbt.validateSignaturesOfAllInputs();
        psbt.finalizeAllInputs();

        const rawTransaction = psbt.extractTransaction().toHex();

        store.dispatch(setLoading(false));

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
      } catch (error) {
        store.dispatch(setLoading(false));
        // console.log('BTC Transaction Error:', error);

        return messageApi.error(
          error.message.includes('Dust amount')
            ? 'Amount is below dust threshold.'
            : error.message || 'Transaction failed.'
        );
      }
    } else if (!chain.isEVM && chain.currencyName === 'ADA') {
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
        // console.log('~ sendcoin.jsx ~ handleSend ~ 848 error ~:', error);
        store.dispatch(setLoading(false));
        return messageApi.error('Transaction failed. Please try again.');
      }
    }
  };

  // Checks the form before the password prompt, so an invalid send never reaches it
  const getSendValidationError = async () => {
    if (!address) {
      return 'Please enter a valid address.';
    }

    const enteredAmount = new BigNumber(amount);
    if (!amount || enteredAmount.isNaN()) {
      return 'Please enter valid amount.';
    }
    if (enteredAmount.lte(0)) {
      return 'Amount must be greater than 0.';
    }
    if (enteredAmount.gt(new BigNumber(myBalance || 0))) {
      return 'Insufficient balance to proceed with the transaction';
    }

    const { chains } = await chrome.storage.local.get('chains');
    const chain = chains?.find(
      (item) => item?.coinFamily === coin?.coin?.coin_family
    );
    const myAddress = account?.coinFamilyAndAddress?.[chain?.coinFamily];
    if (myAddress && myAddress.toLowerCase() === address.toLowerCase()) {
      return 'You cannot send to your own address.';
    }

    // ENS and Unstoppable domain names are resolved after the password step
    if (address.split('.')[1] || !chain) {
      return null;
    }

    if (chain.isEVM) {
      const isValid =
        selectChain === 'cosmos'
          ? address.startsWith('qubetics1')
          : ethers.utils.isAddress(address);
      return isValid ? null : 'Please provide a valid address to proceed.';
    }

    if (chain.currencyName === 'SOL') {
      try {
        const { PublicKey } = require('@solana/web3.js');
        new PublicKey(address);
      } catch {
        return 'Please provide a valid address to proceed.';
      }
    }

    if (chain.currencyName === 'BTC') {
      try {
        const bitcoin = require('bitcoinjs-lib');
        bitcoin.address.toOutputScript(address, bitcoin.networks.bitcoin);
      } catch {
        return 'Please provide a valid address to proceed.';
      }
    }

    return null;
  };

  // Runs the send after the password check and always reports a failure
  const submitSend = async () => {
    setConfirmModal(false);
    store.dispatch(setLoading(true));
    try {
      await handleSend();
    } catch (error) {
      messageApi.error('Unable to complete the transaction. Please try again.');
    } finally {
      store.dispatch(setLoading(false));
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
                    setAddress((text || "").trim());
                  }}
                >
                  Paste
                </span>
              </>
            }
          />
          <InputField
            placeholder={'Enter Amount'}
            onKeyDown={(e) => {
              const allowedKeys = [
                'Backspace',
                'Tab',
                'ArrowLeft',
                'ArrowRight',
                'Delete',
                'Home',
                'End',
              ];

              // Allow control/navigation keys
              if (allowedKeys.includes(e.key)) return;

              if (!/^[0-9.]$/.test(e.key)) {
                e.preventDefault(); // Block everything else (letters, +, -, e, etc.)
              }
            }}
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
                const maxDecimals = getDecimalPrecision();
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

          <div className="transactionFee">
            {selectChain === 'evm' && (
              <h4>
                Transaction Fee ({BL_CODE[coin?.coin?.coin_family] ?? ''})
              </h4>
            )}

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
                {selectChain === 'evm' && (
                  <InputFieldOnly
                    placeholder={'Transaction Fee'}
                    label=""
                    value={
                      myGasPrice?.estimate &&
                      myGasPrice?.fast &&
                      !isNaN(myGasPrice.estimate) &&
                      !isNaN(myGasPrice.fast)
                        ? formatNumberInput(
                            (myGasPrice?.estimate *
                              Math.max(myGasPrice?.fast, 1)) /
                              10 ** 9,
                            5
                          )
                        : '0.00'
                    }
                    readonly={true}
                    placeholderBaseColor={true}
                  />
                )}
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
                        parseFloat(nativeCoinPrice) *
                          parseFloat(
                            (myGasPrice?.estimate * myGasPrice?.safe) / 10 ** 9
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
                        parseFloat(nativeCoinPrice) *
                          parseFloat(
                            (myGasPrice?.estimate * myGasPrice?.propose) /
                              10 ** 9
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
                        parseFloat(nativeCoinPrice) *
                          parseFloat(
                            (myGasPrice?.estimate * myGasPrice?.fast) / 10 ** 9
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
            onClick={async () => {
              const validationError = await getSendValidationError();
              if (validationError) {
                return messageApi.error(validationError);
              }
              setSessionPassword('');
              setConfirmModal(true);
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
        <div className={`${style.viewphrases}`}>
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
        title={'Verify Password'}
        handleCancel={() => setConfirmModal(!isModalOpen)}
        isModalOpen={isModalOpen}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <InputFieldSimple
            placeholder="Enter Password"
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
              await submitSend();
            }}
          />
          <div style={{ marginTop: '10px' }}></div>
          <ButtonComp
            text={'Submit'}
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
              await submitSend();
            }}
          />
        </div>
      </ModalCustom>
      <ModalCustom
        title={'Select Chain'}
        isModalOpen={selectChainModal}
        customClass="customClassModal"
        handleCancel={() => {
          setSelectChainModal(!selectChainModal);
          navigate(-1);
        }}
      >
        <div className="viewphrases viewPhraseNew inputpaddingIssue">
          <div className={'filterHistory__selctHis'}>
            <Select
              options={[
                { label: 'Cosmos Chain', value: 'cosmos' },
                { label: 'Qubetics Chain', value: 'evm' },
              ]}
              value={selectChain}
              onChange={(value) => {
                // console.log('selected chain value', value);
                setSelectChain(value);
              }}
              popupClassName="filterHistoryDropdown"
              placeholder="Select Chain"
            />
          </div>
          <div style={{ marginTop: '10px' }}></div>
          <ButtonComp
            text={'Submit'}
            maxWidth={'100%'}
            onClick={async () => {
              setSelectChainModal(!selectChainModal);
            }}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default SendCoins;
