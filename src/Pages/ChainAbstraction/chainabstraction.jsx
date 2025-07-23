/*global chrome*/
import './CrossChain.scss';
import { Drawer, message, Select } from 'antd';
import React from 'react';
import { InputField } from '../../Components/InputField/InputFieldSimple';
import DownArrowSuffix from '../../Assets/DownArrowSuffix.svg';
import SwapVerticalIcon from '../../Assets/SwapVerticalIcon.svg';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useState } from 'react';
import { Web3Helper } from '../../helpers/web3.helper';
import darkclose from '../../Assets/darkclose.svg';
import { useSelector } from 'react-redux';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { ClipLoader } from 'react-spinners';
import { useRef } from 'react';
import { CrossChainHelper } from '../../helpers/crosschain.helper';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import Search from '../../Assets/SearchIcon.svg';
import { SolanaHelper } from '../../helpers/solana.helper';
import { BTCHelper } from '../../helpers/btc.helper';
import { DURATION } from '../../config/message.config';
import BigNumber from 'bignumber.js';
import {
  newBalanceToFiatConversion,
  toFixed,
} from '../../helpers/conversion.helper';
import { server } from '../../server';
import { swapDetailAc } from '../../actions/swap';
import { setLoading as overAllLoader } from '../../actions/loading';
import useCurrentHeight from '../../CustomHooks/useCurrentHeight';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';

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
  const [balance2, setBalance2] = useState(0);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  const [receivedAmount, setReceivedAmount] = useState(null);
  const [amount, setWithdrawAmount] = useState(null);
  const [route, setRoute] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [selectedChain] = useState(chain.chainId);
  const [selected, setSelected] = useState(null);
  const [infoData, setInfoData] = useState([]);
  const height = useCurrentHeight();

  const [allToken, setAllTokens] = useState([]);

  const [keyword, setKeyword] = useState(null);
  const [show, setShow] = useState(true);

  const updateRef = useRef(true);

  const [percent, setPercent] = useState(null);
  const { theme, swapDetail } = useSelector((state) => state);
  const [activeIndex, setActiveIndex] = useState(null);
  const percentages = [25, 50, 75, 100];
  const debounceTimeout = useRef(null);

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

        const myToken2 = modifiedList.find(
          (token) => !token.tokenAddress && token.coinFamily == 1
        );

        setBalance(myToken1.balance);
        setBalance2(0);
        setAvailableTokens(modifiedList);
        setToken1(myToken1);
        setToken2(myToken2);
        setCompentLoading(true);

        const route = await crossChainHelper.current.getQuoteAndRoute(
          myToken1.symbol,
          myToken2.symbol,
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
            myToken1.symbol,
            myToken2.symbol,
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
    console.log('SWAPDETAILS', swapDetail);
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

  const initialSwapDetail = async (amount, receivedAmount, tokenOne, tokenTwo) => {
    try {
      if (updateRef?.current || swapDetail?.tab) {
        if (amount > 0 && amount && tokenTwo) {
          setCompentLoading(true);

          const route = await crossChainHelper?.current.getQuoteAndRoute(
            tokenOne?.symbol,
            tokenTwo?.symbol,
            amount
          );

          // ✅ Only show error if both status/message are non-empty
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

          const instantRate = parseFloat(route?.exchangeData?.instantRate || 0);
          const depositFeeRate = route?.exchangeData?.depositCoinFeeRate || 0;
          const receiveCoinFee = parseFloat(
            getFlooredFixed(
              parseFloat(route?.exchangeData?.receiveCoinFee || 0),
              5
            )
          );

          const relayerFee = parseFloat(getFlooredFixed(receiveCoinFee, 6));

          setRoute(route);
          setReceivedAmount(formattedOutAmount);
          setCompentLoading(false);

          setInfoData([
            {
              text: 'Estimate Rate',
              textVal: `1 ${tokenOne?.symbol} = ${getFlooredFixed(
                instantRate,
                5
              )} ${tokenTwo.symbol}`,
            },
            {
              text: 'Service Fee',
              textVal: `${new BigNumber(depositFeeRate)
                .multipliedBy(100)
                .toString()}%`,
            },
            {
              text: 'Relayer Service Fee',
              textVal: `${relayerFee} ${tokenTwo?.symbol}`,
            },
            {
              text: 'You will receive',
              textVal: `${formattedOutAmount} ${tokenTwo?.symbol}`,
            },
            {
              text: 'Estimated time of receiving',
              textVal: '1~20 Minutes',
            },
          ]);
        }
      }

      updateRef.current = true;
    } catch (error) {
      console.log('ERR ', error);
      setCompentLoading(false);
      return messageApi.error('Pair not available for swap.');
    }
  };

  const calculateAccordingly = async (percentage) => {
    if (selectedChain.isEVM) {
      account.address = account.evmAddress;
    } else if (!selectedChain.isEVM && selectedChain.currencyName === 'BTC') {
      account.address = account.bitcoinAddress;
    } else {
      account.address = account.evmAddress;
    }

    if (token1?.tokenAddress) {
      if (
        token1.coinFamily == 4 ||
        token1.coinFamily == 5 ||
        token1.coinFamily == 2
      ) {
        const finalAmountToSend = new BigNumber(token1.balance).multipliedBy(
          new BigNumber(percentage).dividedBy(100)
        );
        setWithdrawAmount(
          finalAmountToSend == 0
            ? finalAmountToSend.toString()
            : finalAmountToSend.toFixed(6).replace(/\.?0+$/, '')
        );
        updateRef.current = true;
        handleSwapInput(
          finalAmountToSend.toString() == 0
            ? finalAmountToSend.toString()
            : finalAmountToSend.toFixed(6).replace(/\.?0+$/, '')
        );
      } else {
        const amountToSend = await Web3Helper.getTokenBalance(
          token1.tokenAddress,
          token1.address,
          token1.rpc
        );

        if (amountToSend == 0) {
          setReceivedAmount(0);
          setInfoData([]);
        }
        store.dispatch(overAllLoader(true));
        const finalAmountToSend = new BigNumber(amountToSend).multipliedBy(
          new BigNumber(percentage).dividedBy(100)
        );
        setWithdrawAmount(
          finalAmountToSend == 0
            ? finalAmountToSend.toString()
            : finalAmountToSend.toFixed(token1.decimals).replace(/\.?0+$/, '')
        );
        setBalance(toFixed(amountToSend.toString()));
        updateRef.current = true;
        handleSwapInput(
          finalAmountToSend.toString() == 0
            ? finalAmountToSend.toString()
            : finalAmountToSend.toFixed(token1.decimals).replace(/\.?0+$/, '')
        );
        store.dispatch(overAllLoader(false));
      }
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
      await handleToken1Change(token1);
      await handleToken2Change(token2);
    }
  };

  useEffect(() => {
    handleTokensSwapChangePosition();
    if (amount) {
      if (timeOutId.current) {
        clearTimeout(timeOutId);
      }
      timeOutId.current = setTimeout(() => {
        handleRouteQuotation();
      }, 2000);
    }

    if (amount == '' || amount == null) {
      setInfoData([]);
      setReceivedAmount(null);
    }
  }, [token1, amount, token2, refresh]);

  const handleToken1Change = async (updatedToken1) => {
    await chrome.storage.local.set({
      crossToken1: updatedToken1,
    });

    setBalance(updatedToken1.balance);

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
      updatedToken1.symbol,
      token2.symbol,
      1
    );
    // console.log("ROUTES:::::::700", route);
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

    setBalance2(updatedToken2.balance);

    if (updatedToken2.tokenAddress) {
      if (updatedToken2.id != token2.id) {
        setReceivedAmount(null);
        setWithdrawAmount(null);
        setPercent(null);
        updateRef.current = false;
      }

      const route = await crossChainHelper.current.getQuoteAndRoute(
        token1.symbol,
        updatedToken2.symbol,
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
          const route =  {
            pair: [token1?.id, token2?.id],
            outAmount: 1.000003,
            exchangeData: {
              depositMin:.00000001,
              depositMax:10,
            },
          }
          console.log('🚀 ~ handleRouteQuotation ~ route:', route);
          setRoute(route);
          console.log("🚀 ~ handleRouteQuotation ~ setRoute(route);:")
          setReceivedAmount(
            toFixed(getFlooredFixed(parseFloat(route?.outAmount), 6))
          );
          setCompentLoading(false);
        }
      }
      updateRef.current = true;
  };

  

  function handleSwapInput(withdrawAmount) {
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      handleRouteQuotation(withdrawAmount);
      setWithdrawAmount(withdrawAmount);
    }, 3000);
  }

  useEffect(() => {
    init();
    return () => {
      setWithdrawAmount(0);
    };
  }, [page]);

  // const handleScroll = () => {
  //   const { scrollHeight, scrollTop, clientHeight } = parentRef.current;
  //   const tolerance = 15;
  //   const isAtBottom = scrollTop + clientHeight >= scrollHeight - tolerance;
  //   if (isAtBottom && !loading && page < Math.ceil(total / 10)) {
  //     setCompentLoading(true);
  //     setPage((prevPage) => prevPage + 1);
  //   }
  // };


  const handleChainAbstraction = async () => {
    if (isNaN(parseFloat(amount)) || isNaN(parseFloat(receivedAmount))) {
      return messageApi.error(
        'Please enter a valid amount to proceed.'
      );
    }

    if (
      parseFloat(amount) < parseFloat(route?.exchangeData?.depositMin)
    ) {
      return messageApi.error(
        `The minimum deposit amount to swap is ${route?.exchangeData?.depositMin} ${token1?.symbol}`
      );
    }

    if (
      parseFloat(amount) > parseFloat(route?.exchangeData?.depositMax)
    ) {
      return messageApi.error(
        `The maximum deposit amount to swap is ${route?.exchangeData?.depositMax} ${token1?.symbol}`
      );
    }

    // if (parseFloat(balance) < parseFloat(amount)) {
    //   console.log('first insufficient balance case');
    //   return messageApi.error(
    //     'Insufficient balance to proceed with the transaction.'
    //   );
    // }

    if (token1.chain.isEVM) {
      const gasPrice = await Web3Helper.getGasPrice(
        token1.chain.slug,
        token1.address,
        token1.address,
        token1.isToken,
        token1.tokenAddress,
        token1.coinSymbol
      );

      if (!gasPrice) {
        store.dispatch(setLoading(false));

        return messageApi.error(
          'Unable to fetch gas price at the moment.'
        );
      }

      const gasInEth =
        (gasPrice.fast * Math.pow(10, 9) * gasPrice.estimate) /
        Math.pow(10, 18);

      const nativeCoinBalance = await Web3Helper.getCoinBalance(
        token1?.address,
        token1?.rpc
      );

      if (token1?.isToken) {
        console.log(
          'nativeCoinBalance',
          nativeCoinBalance,
          'Number(gasInEth))',
          Number(gasInEth)
        );
        if (
          Number(nativeCoinBalance.toString()) <
          parseFloat(Number(gasInEth))
        ) {
          return messageApi.error(
            'Insufficient native balance to proceed with the transaction.'
          );
        }
      } else {
        console.log(
          'parseFloat(balance)',
          parseFloat(balance),
          parseFloat(Number(amount)),
          Number(gasInEth)
        );
        // if (
        //   parseFloat(balance) <
        //   parseFloat(Number(amount) + Number(gasInEth))
        // ) {
        //   console.log('first insufficient balance case');
        //   return messageApi.error(
        //     'Insufficient balance to proceed with the transaction.'
        //   );
        // }
      }

      store.dispatch(setLoading(false));

      const parentCoin = await server.post(
        '/wallet/nativeCoinFiatPrice',
        {
          coin_family: token1.coinFamily,
          fiat_currency: currency.name,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      let swapDetailed = {
        route,
        token1,
        token2,
        amount,
        amount2: receivedAmount,
        tokenChain: token1.chain,
        networkFee: gasInEth,
        walletAddress: token1.address,
        token1Price: newBalanceToFiatConversion(token1.price, amount),
        parentCoin: {
          value: parentCoin.data.data.fiatCoinPrice.value,
        },
        tab: 1,
        rpc: token1.rpc,
        coinSymbol: token1.coinSymbol,
      };
      store.dispatch(swapDetailAc(swapDetailed));
      navigate('/chain-abstraction-detail', {
        state: swapDetailed,
      });
    } else if (token1.chain.currencyName == 'SOL') {
      console.log('Cross Chain swap for Solana');

      const solanaHelper = new SolanaHelper(token1?.chain?.rpcUrl);
      const gasPrice = solanaHelper.getGasPrice();

      store.dispatch(setLoading(false));

      let swapDetailed = {
        route,
        token1,
        token2,
        amount,
        amount2: receivedAmount,
        tokenChain: token1?.chain,
        networkFee: gasPrice,
        walletAddress: token1?.address,
        token1Price: newBalanceToFiatConversion(
          token1?.price,
          amount
        ),
        parentCoin: token1?.native || null,
        tab: 1,
      };
      store.dispatch(swapDetailAc(swapDetailed));

      navigate('/chain-abstraction-detail', {
        state: swapDetailed,
      });
    } else if (token1.chain.currencyName === 'BTC') {
      try {
        const gasPrice = Math.max(
          await BTCHelper.getBTCGasPrice(),
          10
        );
        let swapDetailed = {
          route,
          token1,
          token2,
          amount,
          amount2: receivedAmount,
          tokenChain: token1.chain,
          networkFee: gasPrice / Math.pow(10, 8),
          walletAddress: token1.address,
          token1Price: newBalanceToFiatConversion(
            token1.price,
            amount
          ),
          parentCoin: token1.native,
          tab: 1,
        };
        store.dispatch(swapDetailAc(swapDetailed));
        store.dispatch(setLoading(false));
        navigate('/chain-abstraction-detail', {
          state: swapDetailed,
        });
      } catch (error) {
        store.dispatch(setLoading(false));
        return messageApi.error(error.message);
      }
    }
  }

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
            {/* <div
              className="send__infoText"
              style={{
                marginBottom: '10px',
                marginTop: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <span
                style={{
                  color: '#f5da76',
                }}
              >
                {' '}
                Min-Max
              </span>{' '}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                {addCommasToNumber(
                  parseFloat(route ? route.exchangeData?.depositMin : 0)
                )}{' '}
                -{' '}
                {addCommasToNumber(
                  parseFloat(route ? route.exchangeData?.depositMax : 0)
                )}{' '}
              </div>
              {token1?.symbol?.toUpperCase()}
            </div> */}
            {contextHolder}
            <div style={{ width: '100%' }} className="swap ">
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

                        setWithdrawAmount(_amount);
                        handleSwapInput(_amount);
                      }}
                      value={amount}
                    />
                    <p style={{ marginBottom: '8px' }}>
                      {currency.symbol}
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
                        handleToken1Change(
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
                        setInfoData([]);
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
                    <div
                      // style={{ marginBottom: "20px" }}
                      className="swap_onChain_pay"
                    >
                      {/* <p>You Receive</p> */}
                      <p style={{ textAlign: 'right' }}>
                        Balance{' '}
                        <span>
                          {addCommasToNumber(
                            parseFloat(getFlooredFixed(token2?.balance || 0, 6))
                          )}{' '}
                          {token2?.symbol}{' '}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {token1?.isToken && (
                <div className="swap_percentage">
                  {percentages.map((percentage, index) => (
                    <p
                      style={{ cursor: 'pointer' }}
                      key={index}
                      className={activeIndex === index ? 'active' : ''}
                      onClick={() => {
                        setActiveIndex(index);
                        setPercent(percentage);
                        calculateAccordingly(percentage);
                      }}
                    >
                      {percentage}%
                    </p>
                  ))}
                </div>
              )}

              {loading ? (
                <div className="swap__infoText">
                  <ClipLoader size={20} color="#00adee" />{' '}
                  <p
                    style={{
                      marginLeft: '7px',
                    }}
                  >
                    Fetching the best price. Please wait...
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          <ButtonComp
            onClick={handleChainAbstraction}
            text={'Swap'}
            maxWidth={'100%'}
            disabled={
              !token1 ||
              !token2 ||
              !amount ||
              !receivedAmount ||
              amount <= 0 ||
              receivedAmount <= 0 ||
              loading
            }
          />

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
                // onScroll={handleScroll}
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
                              handleToken1Change(token);
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
    </>
  );
}

export default ChainAbstraction;
