/*global chrome*/
import './CrossChain.scss';
import { Drawer, message, Select } from 'antd';
import React from 'react';
import InputFieldSimple, {
  InputField,
} from '../../Components/InputField/InputFieldSimple';
import DownArrowSuffix from '../../Assets/DownArrowSuffix.svg';
import SwapVerticalIcon from '../../Assets/SwapVerticalIcon.svg';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Web3Helper } from '../../helpers/web3.helper';
import darkclose from '../../Assets/darkclose.svg';
import { useSelector } from 'react-redux';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { useRef } from 'react';
import { CrossChainHelper } from '../../helpers/crosschain.helper';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import Search from '../../Assets/SearchIcon.svg';
import { BTCHelper } from '../../helpers/btc.helper';
import { DURATION } from '../../config/message.config';
import {
  exponential_to_decimal,
  newBalanceToFiatConversion,
  toFixed,
} from '../../helpers/conversion.helper';
import { server } from '../../server';
import { swapDetailAc } from '../../actions/swap';
import useCurrentHeight from '../../CustomHooks/useCurrentHeight';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import ConfirmAbstractModal from './chainabstractionconfirmmodal';
import { WalletHelper } from '../../helpers/wallet.helper';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import BigNumber from 'bignumber.js';
import { ChainAbstractionHelper } from '../../helpers/chain_abstraction.helper';
import AbstractProcessingModal from '../../Components/CustomModelAbstraction/Model';

function getFlooredFixed(v, d) {
  return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
}

function addCommasToNumber(number) {
  var parts = number.toString().split('.');
  var integerPart = parts[0];
  var decimalPart = parts[1] || '';
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (decimalPart !== '') {
    return integerPart + '.' + decimalPart;
  } else {
    return integerPart;
  }
}

export function bigNumberSafeMath(a, operation, b) {
  try {
    const numA = new BigNumber(a || 0);
    const numB = new BigNumber(b || 0);

    switch (operation) {
      case '+':
        return numA.plus(numB);
      case '-':
        return numA.minus(numB);
      case '*':
        return numA.times(numB);
      case '/':
        return numB.isZero() ? new BigNumber(0) : numA.dividedBy(numB);
      case '%':
        return numB.isZero() ? new BigNumber(0) : numA.modulo(numB);
      default:
        return numA;
    }
  } catch (error) {
    console.error('bigNumberSafeMath error:', error);
    return new BigNumber(0);
  }
}

function ChainAbstraction({ state }) {
  const parentRef = useRef(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectDrawer, setTokenDrawer] = useState(false);
  const { chain, account, currency } = useSelector((state) => state);
  let timeOutId = useRef();
  const crossChainHelper = useRef(new CrossChainHelper());
  const [availableTokens, setAvailableTokens] = useState([]);
  const [loading, setCompentLoading] = useState(false);
  const [token1, setToken1] = useState(null);
  const [token2, setToken2] = useState(null);
  const [balance, setBalance] = useState(0);
  const [receivedBalance, setReceivedBalance] = useState(0);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  const [toAddress, setToAddress] = useState('');
  const [receivedAmount, setReceivedAmount] = useState(null);
  const [amount, setWithdrawAmount] = useState(null);
  const [route, setRoute] = useState(null);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [selected, setSelected] = useState(null);
  const height = useCurrentHeight();
  const [allToken, setAllTokens] = useState([]);
  const [keyword, setKeyword] = useState(null);
  const [show, setShow] = useState(true);
  const updateRef = useRef(true);
  const [percent, setPercent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [isPasswordModalOpen, setPasswordModal] = useState(false);
  const [showsuccess, setShowSuccess] = useState(false);
  const { theme, swapDetail } = useSelector((state) => state);
  const debounceTimeout = useRef(null);
  const ChainAbstractionInstance = useRef(
    new ChainAbstractionHelper(chain.chainId)
  );
  const [isProcessModalOpen, setIsProcessModal] = useState(false);
  const [transactionresult, setTransactionResult] = useState({
    hash: '',
    fee: '',
    link: '',
    status: '',
    symbol: '',
    solver: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const onChangeFromValue = (val) => {
    setWithdrawAmount(val);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      const fromFiatValue = token1?.price;
      console.log('fromFiatValue>>>', fromFiatValue);

      const toFiatValue = token2?.price;
      console.log('toFiatValue>>>', toFiatValue);

      const toValue = new BigNumber(val || 0)
        .times(new BigNumber(fromFiatValue || 0))
        .dividedBy(new BigNumber(toFiatValue || 0));
      console.log('toValue>>>', toValue);
      console.log('toValue>>>', exponential_to_decimal(toValue, 8));
      const toAmt = exponential_to_decimal(toValue, 8);
      const valueAfterSlippage = exponential_to_decimal(
        bigNumberSafeMath(toAmt, '*', 0.995),
        6
      );
      // const valueAfterSlippage = bigNumberSafeMath(toValue, "*", 0.995);
      console.log('valueAfterSlippage>>>', valueAfterSlippage);

      setReceivedAmount(getFlooredFixed(valueAfterSlippage, 8));
    }, 800);
  };

  const getTokenMeta = (coinFamily) => {
    switch (coinFamily) {
      case 7:
        return {
          coinFamilyName: 'TICS',
          tokenType: 'ERC20',
          rpc: process.env.REACT_APP_QUBETIC_RPC,
        };
      case 3:
        return {
          coinFamilyName: 'BTC',
          tokenType: null,
          rpc: process.env.REACT_APP_BTC_RPC,
        };
      default:
        return { coinFamilyName: 'ETH', tokenType: 'ERC20', rpc: '' };
    }
  };

  const buildTokenObject = (token, chains, account) => {
    const { coinFamilyName, tokenType, rpc } = getTokenMeta(token?.coin_family);
    return {
      id: token?.coin_id,
      symbol: token?.coin_symbol,
      showName: token?.coin_name,
      coinSymbol: token?.coin_symbol,
      active: true,
      iHave: !!token?.wallet_data,
      name: token?.coin_name,
      tokenAddress: token?.token_address || null,
      image: token?.coin_image,
      address: account?.coinFamilyAndAddress[token?.coin_family],
      isToken: !!token?.token_address,
      coinFamilyName,
      coinFamily: token?.coin_family,
      balance: token?.wallet_data?.balance || 0,
      price: token?.fiat_price_data?.value || 0,
      type: token?.token_address ? tokenType : null,
      chain: chains.find((chain) => chain?.coinFamily == token?.coin_family),
      native: token?.fiat_price_data,
      decimals: parseInt(token?.coinDecimal ?? 10),
      rpc,
    };
  };

  const init = async () => {
    try {
      console.log('account.coinFamilyAndAddress', account.coinFamilyAndAddress);

      const data = await server.post(
        '/chainAbstraction/getCoinList',
        {
          coinFamilies: [3, 7],
          addrsList: Object.values(account.coinFamilyAndAddress).filter(
            Boolean
          ),
        },
        {
          headers: { Authorization: account.jwtToken },
        }
      );

      console.log('🚀 ~ init ~ data:', data);
      setTotal(data?.data?.data?.length || 0);

      const { chains } = await chrome.storage.local.get('chains');
      let tokens = data?.data?.data?.map((token) =>
        buildTokenObject(token, chains, account)
      );

      console.log('tokens', tokens);

      if (tokens.length === 0) {
        setCompentLoading(false);
        return;
      }

      const activeTokens = tokens;
      let modifiedList = await uniqueList(allToken, tokens);
      console.log('🚀 ~ init ~ modifiedList:', modifiedList);

      setAllTokens(modifiedList);
      setFilteredTokens(modifiedList);

      let { crossToken1 } = await chrome.storage.local.get('crossToken1');
      let { crossToken2 } = await chrome.storage.local.get('crossToken2');

      if (!crossToken1 && !crossToken2) {
        let myToken1 =
          modifiedList.find(
            (token) => !token.tokenAddress && token.coinFamily == 2
          ) ||
          modifiedList.find((token) => !token.tokenAddress) ||
          modifiedList[0];

        const myToken2 =
          modifiedList.find(
            (token) => !token.tokenAddress && token.coinFamily == 1
          ) ||
          modifiedList.find((token) => token.id !== myToken1?.id) ||
          modifiedList[1];

        setBalance(myToken1.balance);
        setReceivedBalance(0);
        setAvailableTokens(modifiedList);
        setToken1(myToken1);
        setToken2(myToken2);
        setCompentLoading(true);
        console.log('myToken1', myToken1);
        console.log('myToken2', myToken2);
        const route = await crossChainHelper.current.getQuoteAndRoute(
          myToken1?.symbol,
          myToken2?.symbol,
          1
        );

        if (
          route?.status &&
          route?.message &&
          (route?.status !== '' || route?.message !== '')
        ) {
          setCompentLoading(false);
          return messageApi.error(route?.message);
        }

        setRoute(route);
        setCompentLoading(false);
      } else {
        const myToken1 =
          activeTokens.find((el) => el.id == crossToken1.id) || null;
        const myToken2 =
          modifiedList.find((el) => el.id == crossToken2.id) || modifiedList[1];

        const updatedToken = modifiedList.find((el) => el.id == crossToken1.id);

        setCompentLoading(true);
        setToken1(myToken1);
        setToken2(myToken2);
        setBalance(updatedToken?.balance || 0);
        setAvailableTokens(modifiedList);

        if (myToken1) {
          const route = await crossChainHelper.current.getQuoteAndRoute(
            myToken1?.symbol,
            myToken2?.symbol,
            1
          );

          if (
            route?.status &&
            route?.message &&
            (route?.status !== '' || route?.message !== '')
          ) {
            setCompentLoading(false);
            return messageApi.error(route?.message);
          }

          setRoute(route);
        }

        setCompentLoading(false);
      }

      console.log('state && state.coinId', state, state?.coinId);

      if (state?.coinId) {
        const tokenExists = activeTokens.find(
          (token) => token?.id === state?.coinId
        );
        if (tokenExists) {
          const tokenFromSearch = buildTokenObject(
            tokenExists,
            chains,
            account
          );

          if (!tokenFromSearch) {
            return messageApi.error('Token not available for swap.');
          }

          if (crossToken2?.id !== tokenFromSearch.id) {
            crossToken1 = tokenFromSearch;
            await chrome.storage.local.set({ crossToken1: tokenFromSearch });
            setToken1(crossToken1);
          } else {
            messageApi.error('Cannot set the same tokens on both sides.');
          }
        }
      }
    } catch (error) {
      console.log('error in the init function:', error);
      setCompentLoading(false);
      messageApi.error(
        'Unable to perform swap currently. Please try again later.'
      );
    }
  };

  useEffect(() => {
    if (swapDetail) {
      if (swapDetail?.tab == 1) {
        setToken1(swapDetail?.token1);
        setToken2(swapDetail?.token2);
        setWithdrawAmount(+swapDetail?.amount);
        setReceivedAmount(+swapDetail?.receivedAmount);
        setTimeout(() => {
          initialSwapDetail(
            +swapDetail?.amount,
            swapDetail?.receivedAmount,
            swapDetail?.token1,
            swapDetail?.token2
          );
        }, 2000);
      }
    }
  }, []);

  const initialSwapDetail = async (amount, tokenOne, tokenTwo) => {
    try {
      if (updateRef?.current || swapDetail?.tab) {
        if (amount > 0 && amount && tokenTwo) {
          setCompentLoading(true);

          const route = await crossChainHelper?.current.getQuoteAndRoute(
            tokenOne?.symbol,
            tokenTwo?.symbol,
            amount
          );

          if (
            route?.status &&
            route?.message &&
            (route?.status !== '' || route?.message !== '')
          ) {
            setCompentLoading(false);
            return messageApi.error(route?.message);
          }

          const outAmount = parseFloat(route?.outAmount || 0);
          const flooredOutAmount = getFlooredFixed(outAmount, 6);
          const formattedOutAmount = toFixed(flooredOutAmount);

          setRoute(route);
          setReceivedAmount(formattedOutAmount);
          setCompentLoading(false);
        }
      }

      updateRef.current = true;
    } catch (error) {
      console.log('ERR ', error);
      setCompentLoading(false);
      return messageApi.error('Pair not available for swap.');
    }
  };

  const uniqueList = (arr1, arr2) => {
    const list = [...arr1, ...arr2];

    const uniqueNames = new Set();
    const result = list.filter((obj) => {
      if (!uniqueNames.has(obj?.name)) {
        uniqueNames.add(obj?.name);
        return true;
      }
      return false;
    });
    return result;
  };

  const handleTokensSwapChangePosition = async () => {
    if (token1 && token2) {
      await handlePositionChange(token1);
      await handleToken2Change(token2);
    }
  };

  useEffect(() => {
    handleTokensSwapChangePosition();
  }, [token1, token2]);

  const handlePositionChange = async (updatedToken1) => {
    await chrome.storage.local.set({
      crossToken1: updatedToken1,
    });

    setBalance(updatedToken1?.balance);

    if (updatedToken1.tokenAddress) {
      if (updatedToken1.id != token1.id) {
        setReceivedAmount(null);
        setWithdrawAmount(null);
        setPercent(null);
        updateRef.current = false;
      }
    } else {
      if (updatedToken1.id != token1.id) {
        setReceivedAmount(null);
        setWithdrawAmount(null);
        setPercent(null);
        updateRef.current = false;
      }
    }

    const route = await crossChainHelper.current.getQuoteAndRoute(
      updatedToken1?.symbol,
      token2?.symbol,
      1
    );
    if (route?.status && route?.message) {
      if (route?.status != '' || route?.message != '') {
        return messageApi.error(route?.message);
      }
    }
    setRoute(route);
  };

  const handleToken2Change = async (updatedToken2) => {
    await chrome.storage.local.set({
      crossToken2: updatedToken2,
    });

    setReceivedBalance(updatedToken2.balance);

    if (updatedToken2.tokenAddress) {
      if (updatedToken2.id != token2.id) {
        setReceivedAmount(null);
        setWithdrawAmount(null);
        setPercent(null);
        updateRef.current = false;
      }

      const route = await crossChainHelper.current.getQuoteAndRoute(
        token1?.symbol,
        updatedToken2?.symbol,
        1
      );
      // console.log("ROUTES:::::::730", route);
      if (route?.status && route?.message) {
        if (route?.status != '' || route?.message != '') {
          return messageApi.error(route?.message);
        }
      }
      setRoute(route);
    } else {
      if (updatedToken2.id != token2.id) {
        setReceivedAmount(null);
        setWithdrawAmount(null);
        setPercent(null);
        updateRef.current = false;
      }
    }
  };

  const handleRouteQuotation = async (amount) => {
    if (updateRef.current) {
      if (amount && amount > 0 && token2) {
        setCompentLoading(true);
        const route = {
          pair: [token1?.id, token2?.id],
          outAmount: 1.000003,
          exchangeData: {
            depositMin: 0.00000001,
            depositMax: 10,
          },
        };
        console.log('🚀 ~ handleRouteQuotation ~ route:', route);
        setRoute(route);
        console.log('🚀 ~ handleRouteQuotation ~ setRoute(route);:');
        setReceivedAmount(
          toFixed(getFlooredFixed(parseFloat(route?.outAmount), 6))
        );
        setCompentLoading(false);
      }
    }
    updateRef.current = true;
  };

  function handleSwapInput(withdrawAmount) {
    onChangeFromValue(withdrawAmount);
  }

  useEffect(() => {
    setReceivedAmount(null);
    init();
    return () => {
      setWithdrawAmount(0);
      setReceivedAmount(null);
    };
  }, [page]);

  const handleChainAbstraction = async () => {
    setIsProcessing(true);
    try {
      const parsedAmount = parseFloat(amount);
      const parsedReceivedAmount = parseFloat(receivedAmount);
      const depositMin = parseFloat(route?.exchangeData?.depositMin);
      const depositMax = parseFloat(route?.exchangeData?.depositMax);
      const parsedBalance = parseFloat(balance);

      const throwError = (msg) => {
        messageApi.error(msg);
        setIsProcessing(false);
      };

      if (isNaN(parsedAmount) || isNaN(parsedReceivedAmount)) {
        return throwError('Please enter a valid amount to proceed.');
      }

      // if (parsedAmount < depositMin) {
      //   return throwError(
      //     `The minimum deposit amount to swap is ${depositMin} ${token1?.symbol}`
      //   );
      // }

      // if (parsedAmount > depositMax) {
      //   return throwError(
      //     `The maximum deposit amount to swap is ${depositMax} ${token1?.symbol}`
      //   );
      // }

      if (token2?.coinFamily === 3) {
        const isValidBTCAddress = BTCHelper.validateBTCAddress(toAddress);
        if (!isValidBTCAddress) {
          return throwError('Please enter a valid Bitcoin address.');
        }
      } else if (token2?.chain?.isEVM == true) {
        const isValidEVMAddress = Web3Helper.validateETHAddress(toAddress);
        if (!isValidEVMAddress) {
          return throwError('Please enter a valid address.');
        }
      }
      // if (parsedBalance < parsedAmount) {
      //   console.log('first insufficient balance case');
      //   return throwError(
      //     'Insufficient balance to proceed with the transaction.'
      //   );
      // }

      const buildSwapDetails = (
        networkFee,
        parentCoinValue = token1?.native
      ) => ({
        route,
        token1,
        token2,
        amount,
        amount2: receivedAmount,
        tokenChain: token1.chain,
        networkFee,
        walletAddress: token1?.address,
        token1Price: newBalanceToFiatConversion(token1?.price, amount),
        parentCoin: { value: parentCoinValue },
        tab: 1,
        rpc: token1.rpc,
        coinSymbol: token1.coinSymbol,
      });

      const finalizeSwap = (details) => {
        store.dispatch(swapDetailAc(details));
        store.dispatch(setLoading(false));
        setPasswordModal(true);
      };

      if (token1?.chain?.isEVM) {
        console.log('in the evm', token1);
        const gasPrice = await Web3Helper.getGasPrice(
          token1?.chain.slug,
          token1?.address,
          token1?.address,
          token1?.isToken,
          token1?.tokenAddress,
          token1?.coinSymbol
        );
        console.log('gasPrices', gasPrice);
        if (!gasPrice) {
          store.dispatch(setLoading(false));
          return throwError('Unable to fetch gas price at the moment.');
        }

        const gasInEth = (gasPrice.fast * 1e9 * gasPrice.estimate) / 1e18;

        const nativeCoinBalance = await Web3Helper.getCoinBalance(
          token1?.address,
          token1?.rpc
        );

        const hasEnoughNative = token1?.isToken
          ? Number(nativeCoinBalance?.toString()) >= gasInEth
          : parsedBalance >= parsedAmount + gasInEth;

        console.log('hasEnoughNative', hasEnoughNative);

        if (!hasEnoughNative) {
          return throwError(
            'Insufficient native balance to proceed with the transaction.'
          );
        }

        const { data: parentCoinData } = await server.post(
          '/wallet/nativeCoinFiatPrice',
          {
            coin_family: token1.coinFamily,
            fiat_currency: currency.name,
          },
          {
            headers: { Authorization: account.jwtToken },
          }
        );
        console.log('data of the parentCoinData', parentCoinData);
        const swapDetails = buildSwapDetails(
          gasInEth,
          parentCoinData?.fiatCoinPrice?.value
        );
        console.log('swapDetails', swapDetails);
        finalizeSwap(swapDetails);
      } else if (token1?.chain?.currencyName === 'BTC') {
        const gasPrice = Math.max(await BTCHelper.getBTCGasPrice(), 10);
        const networkFee = gasPrice / 1e8;

        const swapDetails = buildSwapDetails(networkFee);
        finalizeSwap(swapDetails);
      }
    } catch (error) {
      console.error('Error in handleChainAbstraction:', error);
      messageApi.error(error.message || 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAbstraction = async () => {
    setIsProcessing(true);
    try {
      let networkFee = 0;
      if (token1?.chain?.isEVM) {
        const gasPrice = await Web3Helper.getGasPrice(
          token1?.chain.slug,
          token1?.address,
          token1?.address,
          token1?.isToken,
          token1?.tokenAddress,
          token1?.coinSymbol
        );
        if (!gasPrice) {
          setIsProcessing(false);
          return messageApi.error('Unable to fetch gas price at the moment.');
        }

        networkFee =
          (gasPrice.fast * Math.pow(10, 9) * gasPrice.estimate) /
          Math.pow(10, 18);
        setTransactionResult((prev) => ({
          ...prev,
          symbol: token1?.coinSymbol.toUpperCase(),
        }));
      } else if (token1?.chain?.currencyName === 'BTC') {
        const gasPrice = Math.max(await BTCHelper.getBTCGasPrice(), 10);
        networkFee = gasPrice / 1e8;
        setTransactionResult((prev) => ({
          ...prev,
          symbol: 'BTC',
        }));
      }
      console.log('token1', token1);
      console.log('token2', token2);
      const data = await ChainAbstractionInstance.current.SendTransaction(
        token1,
        token2,
        amount,
        receivedAmount,
        token1?.address,
        token1?.chain,
        networkFee,
        newBalanceToFiatConversion(token1?.price, amount),
        token1?.native,
        token1?.rpc,
        token1?.coinSymbol,
        sessionPassword,
        toAddress
      );

      console.log('data', data);

      if (!data) {
        setIsProcessing(false);
        return messageApi.error(
          'Unable to process your transaction at the moment. Please try again later.'
        );
      }
      setIsOpen(!isOpen);
      setTransactionResult((prev) => ({
        ...prev,
        hash: data?.hash,
        fee: networkFee,
        status: data?.status,
        solver: data?.solver,
      }));
      setIsProcessModal(true);
    } catch (error) {
      console.error('Error in handleAbstraction:', error);
      messageApi.error('Transaction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <MenuRestofHeaders backTo={'/wallet'} title={'Chain Abstraction'} />
      <div className="flexedContent">
        <div
          className={`${'fixedContent height-571'} ${
            height <= 600 ? 'fixedContentOuterExt' : ''
          }`}
        >
          <div style={{ width: '100%', marginBottom: '20px' }}>
            {contextHolder}
            <div
              style={{ width: '90%', marginRight: 'auto', marginLeft: 'auto' }}
              className="swap "
            >
              <div className="swap_onChain ">
                <div className="swap_onChain_balance">
                  <div>
                    <input
                      type="number"
                      className="myInput"
                      placeholder="0.000"
                      onWheel={(e) => e.currentTarget.blur()}
                      inputMode="decimal"
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

                        if (allowedKeys.includes(e.key)) return;
                        if (!/^[0-9.]$/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={({ target: { value: _amount } }) => {
                        if (percent != null) {
                          setPercent(null);
                        }

                        const [beforeDecimal = '', afterDecimal = ''] =
                          _amount.split('.');
                        const maxCharactersBeforeDecimal = 15;
                        const maxDecimals = token1.decimals;

                        if (beforeDecimal.length > maxCharactersBeforeDecimal)
                          return;
                        if (afterDecimal.length > maxDecimals) return;

                        // setWithdrawAmount(_amount);
                        handleSwapInput(_amount);
                      }}
                      value={amount}
                    />
                    <p style={{ marginBottom: '8px' }}>
                      {currency?.symbol}
                      {addCommasToNumber(
                        getFlooredFixed(
                          parseFloat(amount ? amount : 0) *
                            parseFloat(token1 ? token1.price : 0),
                          2
                        )
                      ) !== 'NaN'
                        ? addCommasToNumber(
                            getFlooredFixed(
                              parseFloat(amount ? amount : 0) *
                                parseFloat(token1 ? token1.price : 0),
                              2
                            )
                          )
                        : '0.00'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Select
                      suffixIcon={<img src={DownArrowSuffix} />}
                      style={{
                        width: 100,
                      }}
                      disabled={!token1 || !token2 || loading}
                      onClick={() => {
                        if (!token1 || !token2 || loading) return;
                        setSelected(1);
                        setTokenDrawer(true);
                      }}
                      open={false}
                      value={[
                        {
                          value: token1?.id,
                          label: (
                            <span className="flexedItemSelect">
                              {!token1?.image ? (
                                <div
                                  style={{
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(98,126,234,.2)',
                                    borderRadius: '49%',
                                    display: 'flex',
                                    height: '29px',
                                    justifyContent: 'center',
                                    width: '29px',
                                    marginRight: '15px',
                                  }}
                                >
                                  {token1?.name.split('')[0]}
                                </div>
                              ) : (
                                <img
                                  style={{
                                    height: '30px',
                                    width: '30px',
                                    objectFit: 'contain',
                                    position: 'relative',
                                    borderRadius: '15px',
                                  }}
                                  alt=""
                                  src={token1?.image}
                                />
                              )}
                              {token1?.symbol}
                            </span>
                          ),
                        },
                      ]}
                      onSelect={(value) => {
                        setWithdrawAmount(null);
                        setToken2(availableTokens.find((el) => el.id == value));
                        handlePositionChange(
                          availableTokens.find((el) => el.id == value)
                        );
                      }}
                      options={availableTokens
                        .filter((token) => token.id !== token1?.id)
                        .map((token) => {
                          return {
                            value: token?.id,
                            label: (
                              <span className="flexedItemSelect">
                                <img
                                  style={{
                                    height: '20px',
                                    width: '20px',
                                    objectFit: 'contain',
                                    marginLeft: '20px',
                                    marginRight: '20px',
                                  }}
                                  src={token?.image}
                                />
                                {token?.symbol}
                              </span>
                            ),
                          };
                        })}
                    />
                    <div className="swap_onChain_pay">
                      <p style={{ textAlign: 'right' }}>
                        Balance{' '}
                        <span>
                          {addCommasToNumber(
                            parseFloat(getFlooredFixed(balance || 0, 6))
                          )}{' '}
                          {token1?.symbol}{' '}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '10px', width: '100%' }}>
                <InputField
                  placeholder={'From Address'}
                  type={'text'}
                  label="From Address"
                  value={token1?.address}
                />
              </div>

              <div className="swap__icon">
                {availableTokens?.length !== 0 && (
                  <img
                    src={SwapVerticalIcon}
                    width={44}
                    alt=""
                    height={44}
                    style={
                      loading
                        ? { pointerEvents: 'none' }
                        : { pointerEvents: 'auto' }
                    }
                    onClick={() => {
                      if (token2?.iHave) {
                        setToken1(token2);
                        setToken2(token1);
                        setReceivedAmount(0);
                        setWithdrawAmount(0);
                        setPercent(0);
                      } else {
                        return messageApi.error(
                          `Please enable ${token2?.name} in your wallet.`
                        );
                      }
                    }}
                  />
                )}
              </div>
              <div className="swap_onChain">
                <div className="swap_onChain_balance">
                  <div>
                    <input
                      type="number"
                      className="myInput"
                      readOnly={true}
                      placeholder="0.000"
                      value={receivedAmount}
                    />
                    <p style={{ marginBottom: '8px' }}>
                      {currency.symbol}
                      {addCommasToNumber(
                        getFlooredFixed(
                          parseFloat(receivedAmount ? receivedAmount : 0) *
                            parseFloat(token2 ? token2.price : 0),
                          2
                        )
                      )}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Select
                      suffixIcon={<img src={DownArrowSuffix} />}
                      style={{
                        width: 100,
                      }}
                      disabled={!token1 || !token2 || loading}
                      onClick={() => {
                        if (!token1 || !token2 || loading) return;
                        setSelected(2);
                        setTokenDrawer(true);
                      }}
                      open={false}
                      value={[
                        {
                          value: token2?.id,
                          label: (
                            <span className="flexedItemSelect">
                              {!token2?.image ? (
                                <div
                                  style={{
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(98,126,234,.2)',
                                    borderRadius: '49%',
                                    display: 'flex',
                                    height: '29px',
                                    justifyContent: 'center',
                                    width: '29px',
                                    marginRight: '15px',
                                  }}
                                >
                                  {token2?.name.split('')[0]}
                                </div>
                              ) : (
                                <img
                                  style={{
                                    height: '30px',
                                    width: '30px',
                                    objectFit: 'contain',
                                    position: 'relative',
                                    borderRadius: '15px',
                                  }}
                                  alt=""
                                  src={token2?.image}
                                />
                              )}
                              {token2?.symbol}
                            </span>
                          ),
                        },
                      ]}
                      onSelect={(value) => {
                        setToken2(availableTokens.find((el) => el.id == value));
                        handleToken2Change(
                          availableTokens.find((el) => el.id == value)
                        );
                      }}
                      options={availableTokens
                        .filter((token) => token.id !== token1?.id)
                        .map((token) => {
                          return {
                            value: token?.id,
                            label: (
                              <span className="flexedItemSelect">
                                <img
                                  style={{
                                    height: '20px',
                                    width: '20px',
                                    objectFit: 'contain',
                                    marginLeft: '20px',
                                    marginRight: '20px',
                                  }}
                                  src={token?.image}
                                />
                                {token?.symbol}
                              </span>
                            ),
                          };
                        })}
                    />
                    {/* <div className="swap_onChain_pay">
                      <p style={{ textAlign: 'right' }}>
                        Balance{' '}
                        <span>
                          {addCommasToNumber(
                            parseFloat(getFlooredFixed(token2?.balance || 0, 6))
                          )}{" "}
                          {token2?.symbol}{" "}
                        </span>
                      </p>
                    </div> */}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '10px', width: '100%' }}>
                <InputField
                  placeholder={'To Address'}
                  type={'text'}
                  label="To Address"
                  value={toAddress}
                  getData={(address) => {
                    setToAddress(address);
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '10px',
                }}
              >
                <ButtonComp
                  onClick={handleChainAbstraction}
                  text={
                    isProcessing
                      ? 'Processing...'
                      : amount === null || amount === 0
                      ? 'Enter Amount'
                      : toAddress === '' || !toAddress
                      ? 'Enter Recipient Address'
                      : 'Abstract'
                  }
                  maxWidth={'100%'}
                  disabled={
                    !token1 ||
                    !token2 ||
                    !amount ||
                    !receivedAmount ||
                    amount <= 0 ||
                    receivedAmount <= 0 ||
                    !toAddress ||
                    loading ||
                    isProcessing
                  }
                />
              </div>
            </div>
          </div>
          <Drawer
            title="Select Token"
            placement="bottom"
            onClose={() => {
              setTokenDrawer(false);
              setKeyword(null);
              setFilteredTokens(allToken);
            }}
            open={selectDrawer}
            closeIcon={
              theme == 'darkTheme' ? (
                <img src={darkclose} />
              ) : (
                <img src={ModalCloseIcon} />
              )
            }
            height={500}
          >
            <div
              className="contain"
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {show ? (
                <div className="search" style={{ marginBottom: '30px' }}>
                  <InputField
                    placeholder={'Search name or paste address'}
                    coloredBg={'#eef3f9'}
                    value={keyword}
                    checkForSymbols={true}
                    getData={(value) => {
                      setKeyword(value);
                      if (value.trim().length === 0) {
                        setFilteredTokens(allToken);
                      } else {
                        const matches = allToken.filter(
                          (el) =>
                            el.symbol
                              .toLowerCase()
                              .indexOf(value.trim().toLowerCase()) > -1 ||
                            el.name
                              .toLowerCase()
                              .indexOf(value.trim().toLowerCase()) > -1 ||
                            (el.tokenAddress &&
                              el.tokenAddress
                                .toLowerCase()
                                .indexOf(value.trim().toLowerCase()) > -1)
                        );

                        setFilteredTokens(matches);
                      }
                    }}
                    addonBefore={
                      <span>
                        <img
                          src={Search}
                          style={{
                            width: '17px',
                          }}
                          alt=""
                        />
                      </span>
                    }
                  />
                </div>
              ) : null}

              <div
                ref={parentRef}
                className="right"
                style={{
                  flex: 1,
                  overflow: 'scroll',
                }}
              >
                {filteredTokens.filter((el) => {
                  if (selected == 1) {
                    if (el.active) {
                      return el;
                    }
                  } else {
                    return el;
                  }
                }).length > 0 ? (
                  filteredTokens
                    .filter((el) => {
                      if (selected == 1) {
                        if (el.active) {
                          return el;
                        }
                      } else {
                        return el;
                      }
                    })
                    .map((token) => (
                      <div
                        className="design"
                        style={{
                          width: '100%',
                        }}
                      >
                        <div
                          className="token"
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            marginBottom: '20px',
                            padding: '8px',
                            borderRadius: '30px',
                            marginLeft: '7px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            width: '100%;',
                            backgroundColor:
                              token1?.id == token?.id || token2?.id == token?.id
                                ? 'transparent'
                                : 'transparent',
                            color:
                              token1?.id == token?.id || token2?.id == token?.id
                                ? '#000'
                                : '#000',
                          }}
                          onClick={() => {
                            if (
                              token1?.id == token.id ||
                              token2?.id == token.id
                            ) {
                              setTokenDrawer(false);
                            }
                            if (selected == 1) {
                              if (token2?.id == token.id) {
                                setKeyword(null);
                                setFilteredTokens(allToken);
                                return messageApi.error(
                                  'You cannot select the same tokens on both sides. Please select a different token.'
                                );
                              }
                              setToken1(token);
                              handlePositionChange(token);
                            } else {
                              if (token1?.id == token.id) {
                                setKeyword(null);
                                setFilteredTokens(allToken);
                                return messageApi.error(
                                  'You cannot select the same tokens on both sides. Please select a different token.'
                                );
                              }
                              setToken2(token);
                              handleToken2Change(token);
                            }
                            setFilteredTokens(allToken);
                            setKeyword(null);
                            setTokenDrawer(false);
                          }}
                        >
                          {!token.image ? (
                            <div
                              style={{
                                alignItems: 'center',
                                backgroundColor: 'rgba(98,126,234,.2)',
                                borderRadius: '49%',
                                display: 'flex',
                                height: '29px',
                                justifyContent: 'center',
                                width: '29px',
                                marginRight: '15px',
                              }}
                            >
                              {' '}
                              {token.name.split('')[0]}
                            </div>
                          ) : (
                            <img
                              style={{
                                width: '29px',
                                marginRight: '15px',
                              }}
                              src={token.image}
                              alt=""
                            />
                          )}

                          <p>
                            <span
                              style={{ fontSize: '17px' }}
                              className="noAddress"
                            >
                              {token.name}{' '}
                            </span>
                            <span
                              className="noAddress"
                              style={{
                                fontSize: '11px',
                                marginLeft: '5px',
                              }}
                            >
                              {token.type ? ` /${token.type}` : null}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                    }}
                  >
                    <p
                      className="noAddress"
                      style={{
                        marginTop: '4%',
                        marginBottom: '15px',
                        fontWeight: 'bold',
                        fontSize: '15px',
                      }}
                    >
                      No assets found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Drawer>
        </div>
      </div>
      <ConfirmAbstractModal
        availableTokens={availableTokens}
        token1={token1}
        token2={token2}
        receivedAmount={receivedAmount}
        amount={amount}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        balance={balance}
        fromAddress={token1?.address}
        toAddress={toAddress}
        handleAbstract={handleAbstraction}
        isProcessing={isProcessing}
      />

      <ModalCustom
        title={'Verify Password'}
        handleCancel={() => setPasswordModal(!isPasswordModalOpen)}
        isModalOpen={isPasswordModalOpen}
        customClass="customClassModal"
        closable={!isProcessing}
      >
        <div className="viewphrases">
          <div
            style={{
              marginBottom: '36px',
              width: '100%',
            }}
          >
            <InputFieldSimple
              placeholder="Password"
              getData={setSessionPassword}
              value={sessionPassword}
              customFunction={async () => {
                const isCorrectPassword = await WalletHelper.verifyPassword(
                  sessionPassword
                );
                if (!isCorrectPassword) {
                  return messageApi.error('Incorrect password provided.');
                }
                setPasswordModal(false);
                setIsOpen(!isOpen);
              }}
            />
          </div>

          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            disabled={isProcessing}
            onClick={async () => {
              const isCorrectPassword = await WalletHelper.verifyPassword(
                sessionPassword
              );
              if (!isCorrectPassword) {
                return messageApi.error('Incorrect password provided.');
              }
              setPasswordModal(false);
              setIsOpen(!isOpen);
            }}
          />
        </div>
      </ModalCustom>
      <AbstractProcessingModal
        showProcessing={isProcessModalOpen}
        setShowProcess={setIsProcessModal}
        showSuccess={showsuccess}
        setSuccessModal={setShowSuccess}
        transactionResult={transactionresult}
        loader={true}
      />
    </>
  );
}

export default ChainAbstraction;
