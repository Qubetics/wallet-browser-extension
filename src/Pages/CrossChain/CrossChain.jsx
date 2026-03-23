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

function getFlooredFixed(v, d) {
  return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
}
let inputCount = 0;
let transactionSize = 0;
let outputCount = 2;
let btcTosatoshi = 100000000;
let btcTosatoshiMultiplier = 0.00000001;

function addCommasToNumber(number) {
  var parts = number.toString().split('.');
  var integerPart = parts[0];
  var decimalPart = parts[1] || ''; // Handle cases where there is no decimal part

  // Add commas to the integer part
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Combine the integer and decimal parts
  if (decimalPart !== '') {
    return integerPart + '.' + decimalPart;
  } else {
    return integerPart;
  }
}

function CrossChain({ state }) {
  const parentRef = useRef(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const { chain, account, currency } = useSelector((state) => state);
  let timeOutId = useRef();
  const crossChainHelper = useRef(new CrossChainHelper());
  const [chains, setChains] = useState([]);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [loading, setInnerLoading] = useState(false);
  const [token1, setToken1] = useState(null);
  const [token2, setToken2] = useState(null);
  const [balance, setBalance] = useState(0);
  const [balance2, setBalance2] = useState(0);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  const [amount2, setAmount2] = useState(null);
  const [amount, setAmount] = useState(null);
  const [route, setRoute] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [selectedChain, setSelectedChain] = useState(chain.chainId);
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
  // console.log('state', state);
  useEffect(() => {
    // console.log('swap detail found in cross chain swap:', swapDetail);
    if (swapDetail) {
      if (swapDetail?.tab == 1) {
        setToken1(swapDetail?.token1);
        setToken2(swapDetail?.token2);
        setAmount(+swapDetail?.amount);
        setAmount2(+swapDetail?.amount2);
        setTimeout(() => {
          initialSwapDetail(
            +swapDetail?.amount,
            swapDetail?.amount2,
            swapDetail?.token1,
            swapDetail?.token2
          );
        }, 2000);
      }
    }
  }, []);

  const initialSwapDetail = async (amount, amount2, tokenOne, tokenTwo) => {
    try {
      if (updateRef.current || swapDetail?.tab) {
        if (amount > 0 && amount && tokenTwo) {
          setInnerLoading(true);
          const route = await crossChainHelper.current.getQuoteAndRoute(
            tokenOne.symbol,
            tokenTwo.symbol,
            amount
          );

          if (route?.status && route?.message) {
            if (route?.status != '' || route?.message != '') {
              setInnerLoading(false);
              return messageApi.error(route?.message);
            }
          }

          // if (!route) {
          //   setInnerLoading(false);
          //   return messageApi.error('Pair not available for swap.');
          // }

          setRoute(route);

          setAmount2(
            // parseFloat(getFlooredFixed(parseFloat(route.outAmount), 6))
            // Number(route.outAmount).toFixed(18)
            // toFixed(route.outAmount.toString())
            toFixed(getFlooredFixed(parseFloat(route.outAmount), 6))
          );
          setInnerLoading(false);
          setInfoData([
            {
              text: 'Estimate Rate',
              textVal: `1 ${tokenOne.symbol} = ${
                route
                  ? getFlooredFixed(
                      parseFloat(route.exchangeData.instantRate),
                      5
                    )
                  : 0
              } ${tokenTwo.symbol}`,
            },
            {
              text: 'Service Fee',
              textVal: `${new BigNumber(route.exchangeData.depositCoinFeeRate)
                .multipliedBy(100)
                .toString()}%`,
            },
            {
              text: 'Relayer Service Fee',
              textVal: `${parseFloat(
                getFlooredFixed(
                  parseFloat(
                    route
                      ? getFlooredFixed(
                          parseFloat(route.exchangeData.receiveCoinFee),
                          5
                        )
                      : 0
                  ),
                  6
                )
              )} ${tokenTwo.symbol}`,
            },
            // {
            //   text: 'You will receive',
            //   textVal: `${parseFloat(
            //     getFlooredFixed(parseFloat(route ? route.outAmount : 0), 6)
            //   )} ${token2.symbol}`,
            // },
            {
              text: 'You will receive',
              textVal: `${toFixed(
                getFlooredFixed(parseFloat(route.outAmount), 6)
              )} ${tokenTwo.symbol}`,
            },
            {
              text: 'Estimated time of receiving',
              textVal: `1~20 Minutes`,
            },
          ]);
        }
      }

      updateRef.current = true;
    } catch (error) {
      // console.log('ERR ', error);
      setInnerLoading(false);
      return messageApi.error('Pair not available for swap.');
    }
  };

  const calculateAccordingly = async (percentage) => {
    if (selectedChain.isEVM) {
      account.address = account.evmAddress;
    } else if (!selectedChain.isEVM && selectedChain.currencyName === 'SOL') {
      account.address = account.solanaAddress;
    } else if (!selectedChain.isEVM && selectedChain.currencyName === 'BTC') {
      account.address = account.bitcoinAddress;
    } else if (!selectedChain.isEVM && selectedChain.currencyName === 'ADA') {
      account.address = account.adaAddress;
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
        setAmount(
          finalAmountToSend == 0
            ? finalAmountToSend.toString()
            : finalAmountToSend.toFixed(6).replace(/\.?0+$/, '')
        );
        updateRef.current = true;
        handleChangeForInput1(
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
          setAmount2(0);
          setInfoData([]);
        }
        store.dispatch(overAllLoader(true));
        const finalAmountToSend = new BigNumber(amountToSend).multipliedBy(
          new BigNumber(percentage).dividedBy(100)
        );
        setAmount(
          finalAmountToSend == 0
            ? finalAmountToSend.toString()
            : finalAmountToSend.toFixed(token1.decimals).replace(/\.?0+$/, '')
        );
        setBalance(toFixed(amountToSend.toString()));
        updateRef.current = true;
        handleChangeForInput1(
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

  const getTokenDisplayName = (token) => {
    const rawName = String(token?.name || '').trim();
    if (token?.coinFamily === 4 && rawName.toLowerCase() === 'matic network') {
      return 'Polygon';
    }
    return rawName;
  };

  const loadMoreTokens = async (currentPage) => {
    try {
      setInnerLoading(true);

      // Fetch inactive tokens for the current page
      const inActiveTokens = await server.post(
        '/swftc/queryCoinList',
        {
          addresses: Object.values(account.coinFamilyAndAddress).filter(
            (address) => address
          ),
          is_wallet: false,
          fiat_type: currency.name,
          per_page: 20,
          page: currentPage,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      const { chains } = await chrome.storage.local.get('chains');

      // Map the new tokens to the same format
      const newTokens = inActiveTokens?.data?.data?.map((token) => {
        let coinFamilyName = 'ETH';
        let tokenType = 'ERC20';

        switch (token?.coin_data?.coin_family) {
          case 1:
            coinFamilyName = 'BNB';
            tokenType = 'BEP20';
            break;
          case 2:
            coinFamilyName = 'ETH';
            tokenType = 'ERC20';
            break;
          case 4:
            coinFamilyName = 'POL';
            tokenType = 'ERC20';
            break;
          case 5:
            coinFamilyName = 'SOL';
            tokenType = 'SPL';
            break;
          case 7:
            coinFamilyName = 'TICS';
            tokenType = 'ERC20';
            break;
          default:
            break;
        }

        return {
          id: token.coin_data?.coin_id,
          symbol: token.coinCode,
          showName: token.coinCodeShow,
          coinSymbol: token.coin_data.coin_symbol,
          active: false,
          name: token.coinName,
          tokenAddress: token.coin_data.token_address || null,
          image: token.coinImageUrl,
          address: account.coinFamilyAndAddress[token?.coin_data?.coin_family],
          isToken: token.coin_data.token_address ? true : false,
          coinFamilyName,
          coinFamily: token.coin_data?.coin_family,
          balance: token?.coin_data?.wallet_data
            ? token.coin_data?.wallet_data.balance
            : 0,
          price: token?.coin_data?.fiat_price_data
            ? token?.coin_data?.fiat_price_data?.value
              ? token?.coin_data?.fiat_price_data?.value
              : 0
            : 0,
          type: token.coin_data.token_address ? tokenType : null,
          chain: chains.find(
            (chain) => chain.coinFamily == token?.coin_data?.coin_family
          ),
          native: token.coin_data.fiat_price_data,
          decimals: parseInt(token.coinDecimal),
          rpc:
            token?.coin_data?.coin_family == 1
              ? process.env.REACT_APP_BNB_RPC
              : token?.coin_data?.coin_family == 2
              ? process.env.REACT_APP_ETH_RPC
              : token?.coin_data?.coin_family == 3
              ? process.env.REACT_APP_BTC_RPC
              : token?.coin_data?.coin_family == 4
              ? process.env.REACT_APP_MATIC_RPC
              : token?.coin_data?.coin_family == 5
              ? process.env.REACT_APP_SOL_RPC
              : token?.coin_data?.coin_family == 7
              ? process.env.REACT_APP_QUBETIC_RPC
              : '',
        };
      });

      if (!newTokens || newTokens.length === 0) {
        setInnerLoading(false);
        return;
      }

      // Append new tokens to existing list
      setAllTokens((prev) => {
        const updated = uniqueList(prev, newTokens);

        // Update filteredTokens - if there's a keyword, re-apply the filter, otherwise show all
        if (keyword && keyword.trim().length > 0) {
          const matches = updated.filter(
            (el) =>
              el.symbol.toLowerCase().indexOf(keyword.trim().toLowerCase()) >
                -1 ||
              el.name.toLowerCase().indexOf(keyword.trim().toLowerCase()) >
                -1 ||
              (el.tokenAddress &&
                el.tokenAddress
                  .toLowerCase()
                  .indexOf(keyword.trim().toLowerCase()) > -1)
          );
          setFilteredTokens(matches);
        } else {
          setFilteredTokens(updated);
        }

        return updated;
      });

      setInnerLoading(false);
    } catch (error) {
      // console.log('error loadMoreTokens:::', error);
      setInnerLoading(false);
      messageApi.error('Unable to load more tokens. Please try again later.');
    }
  };

  const init = async () => {
    let inActiveTokens = [];
    try {
      const { data } = await server.post(
        '/swftc/queryCoinList',
        {
          addresses: Object.values(account.coinFamilyAndAddress).filter(
            (address) => address
          ),
          is_wallet: true,
          fiat_type: currency.name,
          per_page: 300,
          page,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      if (page === 1) {
        inActiveTokens = await server.post(
          '/swftc/queryCoinList',
          {
            addresses: Object.values(account.coinFamilyAndAddress).filter(
              (address) => address
            ),
            is_wallet: false,
            fiat_type: currency.name,
            per_page: 20,
            page,
          },
          {
            headers: {
              Authorization: account.jwtToken,
            },
          }
        );
      }

      setTotal(inActiveTokens?.data?.meta?.total || 0);
      const { chains } = await chrome.storage.local.get('chains');

      let tokens = data?.data?.map((token) => {
        let coinFamilyName = 'ETH';
        let tokenType = 'ERC20';
        switch (token?.coin_data?.coin_family) {
          case 1:
            coinFamilyName = 'BNB';
            tokenType = 'BEP20';
            break;
          case 2:
            coinFamilyName = 'ETH';
            tokenType = 'ERC20';
            break;
          case 4:
            coinFamilyName = 'POL';
            tokenType = 'ERC20';
            break;
          case 5:
            coinFamilyName = 'SOL';
            tokenType = 'SPL';
            break;
          case 7:
            coinFamilyName = 'TICS';
            tokenType = 'ERC20';
            break;
          default:
            break;
        }

        return {
          id: token?.coin_data?.coin_id,
          symbol: token?.coinCode,
          showName: token?.coinCodeShow,
          coinSymbol: token.coin_data?.coin_symbol,
          active: true,
          iHave: token?.coin_data?.wallet_data ? true : false,
          name: token?.coinName,
          tokenAddress: token?.coin_data?.token_address || null,
          image: token?.coin_data?.coin_image,
          address: account?.coinFamilyAndAddress[token?.coin_data?.coin_family],
          isToken: token?.coin_data?.token_address ? true : false,
          coinFamilyName,
          coinFamily: token?.coin_data?.coin_family,
          balance: token?.coin_data?.wallet_data
            ? token?.coin_data?.wallet_data?.balance
            : 0,
          price: token?.coin_data?.fiat_price_data
            ? token?.coin_data?.fiat_price_data?.value
              ? token?.coin_data?.fiat_price_data?.value
              : 0
            : 0,
          type: token?.coin_data?.token_address ? tokenType : null,
          chain: chains.find(
            (chain) => chain?.coinFamily == token?.coin_data?.coin_family
          ),
          native: token?.coin_data?.fiat_price_data,
          decimals: parseInt(token?.coinDecimal),
          rpc:
            token?.coin_data?.coin_family == 1
              ? process.env.REACT_APP_BNB_RPC
              : token?.coin_data?.coin_family == 2
              ? process.env.REACT_APP_ETH_RPC
              : token?.coin_data?.coin_family == 3
              ? process.env.REACT_APP_BTC_RPC
              : token?.coin_data?.coin_family == 4
              ? process.env.REACT_APP_MATIC_RPC
              : token?.coin_data?.coin_family == 5
              ? process.env.REACT_APP_SOL_RPC
              : token?.coin_data?.coin_family == 7
              ? process.env.REACT_APP_QUBETIC_RPC
              : '',
        };
      });

      const tokens2 = inActiveTokens?.data?.data?.map((token) => {
        let coinFamilyName = 'ETH';
        let tokenType = 'ERC20';

        switch (token?.coin_data?.coin_family) {
          case 1:
            coinFamilyName = 'BNB';
            tokenType = 'BEP20';
            break;
          case 2:
            coinFamilyName = 'ETH';
            tokenType = 'ERC20';
            break;
          case 4:
            coinFamilyName = 'POL';
            tokenType = 'ERC20';
            break;
          case 5:
            coinFamilyName = 'SOL';
            tokenType = 'SPL';
            break;
          case 7:
            coinFamilyName = 'TICS';
            tokenType = 'ERC20';
            break;
          default:
            break;
        }

        return {
          id: token.coin_data?.coin_id,
          symbol: token.coinCode,
          showName: token.coinCodeShow,
          coinSymbol: token.coin_data.coin_symbol,
          active: false,
          name: token.coinName,
          tokenAddress: token.coin_data.token_address || null,
          image: token.coinImageUrl,
          address: account.coinFamilyAndAddress[token?.coin_data?.coin_family],
          isToken: token.coin_data.token_address ? true : false,
          coinFamilyName,
          coinFamily: token.coin_family,
          balance: token?.coin_data?.wallet_data
            ? token.coin_data?.wallet_data.balance
            : 0,
          price: token?.coin_data?.fiat_price_data
            ? token?.coin_data?.fiat_price_data?.value
              ? token?.coin_data?.fiat_price_data?.value
              : 0
            : 0,
          type: token.coin_data.token_address ? tokenType : null,
          chain: chains.find(
            (chain) => chain.coinFamily == token?.coin_data?.coin_family
          ),
          native: token.coin_data.fiat_price_data,
          decimals: parseInt(token.coinDecimal),
          rpc:
            token?.coin_data?.coin_family == 1
              ? process.env.REACT_APP_BNB_RPC
              : token?.coin_data?.coin_family == 2
              ? process.env.REACT_APP_ETH_RPC
              : token?.coin_data?.coin_family == 3
              ? process.env.REACT_APP_BTC_RPC
              : token?.coin_data?.coin_family == 4
              ? process.env.REACT_APP_MATIC_RPC
              : token?.coin_data?.coin_family == 5
              ? process.env.REACT_APP_SOL_RPC
              : token?.coin_data?.coin_family == 7
              ? process.env.REACT_APP_QUBETIC_RPC
              : '',
        };
      });

      if (tokens.length === 0) {
        setInnerLoading(false);
        return;
      }

      const activeTokens = tokens;

      let combinedTokens = [...tokens, ...(tokens2 || [])];

      // Calculate modifiedList by merging with existing tokens
      let modifiedList = [];
      setAllTokens((prev) => {
        modifiedList = uniqueList(prev, combinedTokens);

        // Update filteredTokens - if there's a keyword, re-apply the filter, otherwise show all
        if (keyword && keyword.trim().length > 0) {
          const matches = modifiedList.filter(
            (el) =>
              el.symbol.toLowerCase().indexOf(keyword.trim().toLowerCase()) >
                -1 ||
              el.name.toLowerCase().indexOf(keyword.trim().toLowerCase()) >
                -1 ||
              (el.tokenAddress &&
                el.tokenAddress
                  .toLowerCase()
                  .indexOf(keyword.trim().toLowerCase()) > -1)
          );
          setFilteredTokens(matches);
        } else {
          setFilteredTokens(modifiedList);
        }

        return modifiedList;
      });

      let { crossToken1 } = await chrome.storage.local.get('crossToken1');
      let { crossToken2 } = await chrome.storage.local.get('crossToken2');

      if (!crossToken1 && !crossToken2) {
        let myToken1 = modifiedList.find(
          (token) => !token.tokenAddress && token.coinFamily == 2
        );

        if (!myToken1) {
          myToken1 = modifiedList.find((token) => !token.tokenAddress);
        }

        if (!myToken1) {
          myToken1 = modifiedList[0];
        }

        const myToken2 = modifiedList.find(
          (token) => !token.tokenAddress && token.coinFamily == 1
        );

        const balance = myToken1.balance;

        setBalance(balance);
        setBalance2(0);
        setAvailableTokens(modifiedList);
        setToken1(myToken1);
        setToken2(myToken2);
        setInnerLoading(true);

        const route = await crossChainHelper.current.getQuoteAndRoute(
          myToken1.symbol,
          myToken2.symbol,
          1
        );

        if (route?.status && route?.message) {
          if (route?.status != '' || route?.message != '') {
            setInnerLoading(false);
            return messageApi.error(route?.message);
          }
        }
        setRoute(route);
        setInnerLoading(false);
      } else {
        const myToken1 =
          activeTokens.find((el) => el.id == crossToken1.id) || null;
        const myToken2 =
          modifiedList.find((el) => el.id == crossToken2.id) || modifiedList[1];

        const updatedToken = modifiedList.find((el) => el.id == crossToken1.id);

        setInnerLoading(true);
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

          if (route?.status && route?.message) {
            if (route?.status != '' || route?.message != '') {
              setInnerLoading(false);
              return messageApi.error(route?.message);
            }
          }
          setRoute(route);
        }

        setInnerLoading(false);
      }

      if (state && state.coinId) {
        let tokenExists = activeTokens.find(
          (token) => token?.id === state.coinId
        );
        if (tokenExists) {
          let tokens = [tokenExists].map((token) => {
            let network = '';
            let coinFamilyName = 'ETH';
            let tokenType = 'ERC20';

            switch (token?.coinFamily) {
              case 1:
                coinFamilyName = 'BNB';
                tokenType = 'BEP20';
                break;
              case 2:
                coinFamilyName = 'ETH';
                tokenType = 'ERC20';
                break;
              case 4:
                coinFamilyName = 'POL';
                tokenType = 'ERC20';
                break;
              case 5:
                coinFamilyName = 'SOL';
                tokenType = 'SPL';
                break;
              case 7:
                coinFamilyName = 'TICS';
                tokenType = 'ERC20';
                break;
              default:
                break;
            }

            return {
              id: token?.id,
              symbol: token?.symbol,
              showName: token?.showName,
              coinSymbol: token?.coinSymbol,
              active: token?.active,
              iHave: token?.iHave,
              name: token.name,
              tokenAddress: token?.tokenAddress || null,
              image: token?.image,
              address: token?.address,
              isToken: token?.isToken,
              coinFamilyName,
              coinFamily: token?.coinFamily,
              balance: token?.balance,
              price: token?.price,
              type: token?.tokenAddress ? tokenType : null,
              chain: token?.chain,
              native: token?.native,
              decimals: token?.decimals,
              rpc: token?.rpc,
            };
          });
          let tokenFromSearch = tokens[0];
          if (!tokenFromSearch) {
            messageApi.error('Token not available for swap.');
          }
          if (tokenFromSearch) {
            if (crossToken2?.id != tokenFromSearch?.id) {
              crossToken1 = tokenFromSearch;

              await chrome.storage.local.set({
                crossToken1: tokenFromSearch,
              });
              setToken1(crossToken1);
            } else {
              messageApi.error('Cannot set the same tokens on both sides.');
            }
          }
        }
      }
    } catch (error) {
      // console.log('error CrossChain:::', error);
      setInnerLoading(false);
      messageApi.error(
        'Unable to perform swap currently. Please try again later.'
      );
      // navigate(-1);
    }
  };

  const handleTokensSwapChangePosition = async () => {
    if (token1 && token2) {
      await handleToken1Change(token1);
      await handleToken2Change(token2);
    }
  };
  // console.log("balance::", balance, "token1:::", token1);
  useEffect(() => {
    // console.log("Chnagesm chennee", amount);
    handleTokensSwapChangePosition();
    if (amount) {
      if (timeOutId.current) {
        clearTimeout(timeOutId);
      }
      timeOutId.current = setTimeout(() => {
        handleInputChange();
      }, 2000);
    }

    if (amount == '' || amount == null) {
      setInfoData([]);
      setAmount2(null);
    }
  }, [token1, amount, token2, refresh]);

  const handleToken1Change = async (updatedToken1) => {
    await chrome.storage.local.set({
      crossToken1: updatedToken1,
    });

    setBalance(updatedToken1.balance);

    if (updatedToken1.tokenAddress) {
      if (updatedToken1.id != token1.id) {
        setAmount2(null);
        setAmount(null);
        setPercent(null);
        updateRef.current = false;
      }
    } else {
      if (updatedToken1.id != token1.id) {
        setAmount2(null);
        setAmount(null);
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
        setAmount2(null);
        setAmount(null);
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
        setAmount2(null);
        setAmount(null);
        setPercent(null);
        updateRef.current = false;
      }
    }
  };

  const handleInputChange = async (amount) => {
    try {
      if (updateRef.current) {
        if (amount > 0 && amount && token2) {
          setInnerLoading(true);
          const route = await crossChainHelper.current.getQuoteAndRoute(
            token1.symbol,
            token2.symbol,
            amount
          );
          if (route?.status && route?.message) {
            if (route?.status != '' || route?.message != '') {
              setInnerLoading(false);
              return messageApi.error(route?.message);
            }
          }

          setRoute(route);
          setAmount2(toFixed(getFlooredFixed(parseFloat(route.outAmount), 6)));
          setInnerLoading(false);
          setInfoData([
            {
              text: 'Estimate Rate',
              textVal: `1 ${token1.symbol} = ${
                route
                  ? getFlooredFixed(
                      parseFloat(route.exchangeData.instantRate),
                      5
                    )
                  : 0
              } ${token2.symbol}`,
            },
            {
              text: 'Service Fee',
              textVal: `${new BigNumber(route.exchangeData.depositCoinFeeRate)
                .multipliedBy(100)
                .toString()}%`,
            },
            {
              text: 'Relayer Service Fee',
              textVal: `${parseFloat(
                getFlooredFixed(
                  parseFloat(
                    route
                      ? getFlooredFixed(
                          parseFloat(route.exchangeData.receiveCoinFee),
                          5
                        )
                      : 0
                  ),
                  6
                )
              )} ${token2.symbol}`,
            },
            {
              text: 'You will receive',
              textVal: `${toFixed(
                getFlooredFixed(parseFloat(route.outAmount), 6)
              )} ${token2.symbol}`,
            },
            {
              text: 'Estimated time of receiving',
              textVal: `1~20 Minutes`,
            },
          ]);
        }
      }

      updateRef.current = true;
    } catch (error) {
      setInnerLoading(false);
      return messageApi.error('Pair not available for swap.');
    }
  };

  const debounceTimeout = useRef(null);

  function handleChangeForInput1(newAmount) {
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      handleInputChange(newAmount);
      setAmount(newAmount);
    }, 3000);
  }

  useEffect(() => {
    if (page === 1) {
      init();
    } else {
      // Load more tokens when page > 1 (pagination)
      loadMoreTokens(page);
    }
    return () => {
      setAmount(0);
    };
  }, [page]);

  const handleScroll = () => {
    const { scrollHeight, scrollTop, clientHeight } = parentRef.current;
    const tolerance = 15;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - tolerance;
    // per_page is 20 for inactive tokens, so calculate pages accordingly
    if (isAtBottom && !loading && page < Math.ceil(total / 20)) {
      setInnerLoading(true);
      setPage((prevPage) => prevPage + 1);
    }
  };

  const selectAfter = (
    <div className={'addonAfter'}>
      {token1?.isToken ? (
        <span
          className="send__pasteText"
          style={{
            position: 'relative',
            top: '-1px',
            left: '-5px',
            borderLeft: '0px',
          }}
          onClick={() => {
            calculateAccordingly(100);
            setPercent(100);
          }}
        >
          Max
        </span>
      ) : null}

      <Select
        open={false}
        value={[
          {
            value: token1?.id,
            label: (
              <span className="flexedItemSelect">
                {token1?.image ? (
                  <img
                    style={{
                      height: '20px',
                      width: '20px',
                      objectFit: 'contain',
                      position: 'relative',
                      borderRadius: '15px',
                    }}
                    src={token1?.image}
                  />
                ) : (
                  <div
                    className="randb extra"
                    style={{
                      height: '35px',
                      width: '35px',
                      background: 'rgb(202, 201, 201)',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {token1?.symbol?.split('')[0]}
                  </div>
                )}
                {token1?.symbol}
              </span>
            ),
          },
        ]}
        defaultValue={[
          {
            value: token1?.id,
            label: (
              <span className="flexedItemSelect">
                {token1?.image ? (
                  <img
                    style={{
                      height: '20px',
                      width: '20px',
                      objectFit: 'contain',
                      borderRadius: '15px',
                    }}
                    src={token1?.image}
                  />
                ) : (
                  <div
                    className="randb extra"
                    style={{
                      height: '35px',
                      width: '35px',
                      background: 'rgb(202, 201, 201)',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {token1?.symbol?.split('')[0]}
                  </div>
                )}
                {token1?.symbol}
              </span>
            ),
          },
        ]}
        style={{
          width: 100,
        }}
        onClick={() => {
          setSelected(1);
          setOpen(true);
        }}
      />
    </div>
  );
  const selectAfterTo = (
    <div className={'addonAfter'}>
      <Select
        open={false}
        style={{
          width: 100,
        }}
        value={[
          {
            value: token2?.id,
            label: (
              <span className="flexedItemSelect">
                {token2?.image ? (
                  <img
                    style={{
                      height: '20px',
                      width: '20px',
                      objectFit: 'contain',
                      position: 'relative',
                      borderRadius: '15px',
                    }}
                    src={token2?.image}
                  />
                ) : (
                  <div
                    className="randb extra"
                    style={{
                      height: '35px',
                      width: '35px',
                      background: 'rgb(202, 201, 201)',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {token2?.symbol.split('')[0]}
                  </div>
                )}
                {token2?.symbol}
              </span>
            ),
          },
        ]}
        defaultValue={[
          {
            value: token2?.id,
            label: (
              <span className="flexedItemSelect">
                {token2?.image ? (
                  <img
                    style={{
                      height: '20px',
                      width: '20px',
                      objectFit: 'contain',
                      borderRadius: '15px',
                    }}
                    src={token2?.image}
                  />
                ) : (
                  <div
                    className="randb extra"
                    style={{
                      height: '35px',
                      width: '35px',
                      background: 'rgb(202, 201, 201)',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {token2?.symbol?.split('')[0]}
                  </div>
                )}

                {token2?.symbol}
              </span>
            ),
          },
        ]}
        onClick={() => {
          setSelected(2);
          setOpen(true);
        }}
      />
    </div>
  );

  return (
    <div
      className={`${'fixedContent height-571'} ${
        height <= 600 ? 'fixedContentOuterExt' : ''
      }`}
    >
      <div style={{ width: '100%', marginBottom: '20px' }}>
        <div
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
              parseFloat(route ? route.exchangeData.depositMin : 0)
            )}{' '}
            -{' '}
            {addCommasToNumber(
              parseFloat(route ? route.exchangeData.depositMax : 0)
            )}{' '}
          </div>
          {token1?.symbol?.toUpperCase()}
        </div>
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
                  onChange={({ target: { value: amount } }) => {
                    // Only allow numbers and optional decimal point
                    const numberRegex = /^\d*\.?\d*$/;

                    if (!numberRegex.test(amount)) {
                      return; // Block invalid input (alphabets, special chars, etc.)
                    }

                    if (percent != null) {
                      setPercent(null);
                    }

                    const afterDecimal = amount.split('.')[1];
                    const maxCharactersBeforeDecimal = 15;

                    if (afterDecimal) {
                      const maxDecimals = token1.decimals;

                      if (afterDecimal.toString().length > maxDecimals) {
                        return;
                      }

                      const beforeDecimal = amount.split('.')[0];
                      if (
                        beforeDecimal.toString().length >
                        maxCharactersBeforeDecimal
                      ) {
                        return;
                      }
                    } else {
                      if (amount.length > maxCharactersBeforeDecimal) {
                        return;
                      }
                    }

                    setAmount(amount);
                    handleChangeForInput1(amount);
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
                    setOpen(true);
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
                    setAmount(null);
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
                  {/* <p>You Pay</p> */}
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
                    setAmount2(0);
                    setAmount(0);
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
                  value={amount2}
                />
                <p style={{ marginBottom: '8px' }}>
                  {currency.symbol}
                  {addCommasToNumber(
                    getFlooredFixed(
                      parseFloat(amount2 ? amount2 : 0) *
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
                    setOpen(true);
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
        onClick={async () => {
          if (isNaN(parseFloat(amount)) || isNaN(parseFloat(amount2))) {
            return messageApi.error('Please enter a valid amount to proceed.');
          }

          if (parseFloat(amount) < parseFloat(route.exchangeData.depositMin)) {
            return messageApi.error(
              `Minimum swap amount is ${route.exchangeData.depositMin} ${token1.symbol}`
            );
          }

          if (parseFloat(amount) > parseFloat(route.exchangeData.depositMax)) {
            return messageApi.error(
              `Maximum swap amount is ${route.exchangeData.depositMax} ${token1.symbol}`
            );
          }

          if (parseFloat(balance) < parseFloat(amount)) {
            return messageApi.error(
              'Insufficient balance to proceed with the transaction.'
            );
          }

          if (token1?.chain?.isEVM) {
            const gasPrice = await Web3Helper.getGasPrice(
              token1?.chain.slug,
              token1?.address,
              token1?.address,
              token1?.isToken,
              token1?.tokenAddress,
              token1?.coinSymbol || token1?.symbol
            );

            if (!gasPrice) {
              store.dispatch(setLoading(false));

              return messageApi.error(
                'Unable to fetch gas price at the moment.'
              );
            }

            const gasInEth =
              (gasPrice?.fast * Math.pow(10, 9) * gasPrice?.estimate) /
              Math.pow(10, 18);

            const nativeCoinBalance = await Web3Helper.getCoinBalance(
              token1?.address,
              token1?.rpc
            );

            if (token1?.isToken) {
              if (
                Number(nativeCoinBalance.toString()) <
                parseFloat(Number(gasInEth))
              ) {
                return messageApi.error(
                  'Insufficient native balance to proceed with the transaction.'
                );
              }
            } else {
              if (
                parseFloat(balance) <
                parseFloat(Number(amount) + Number(gasInEth))
              ) {
                // console.log('first insufficient balance case');
                return messageApi.error(
                  'Insufficient balance to proceed with the transaction.'
                );
              }
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
              amount2,
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
            navigate('/crosschain-swapDetails', {
              state: swapDetailed,
            });
          } else if (token1.chain.currencyName == 'SOL') {
            // console.log('Cross Chain swap for Solana');

            const solanaHelper = new SolanaHelper(token1?.chain?.rpcUrl);
            const gasPrice = solanaHelper.getGasPrice();

            store.dispatch(setLoading(false));

            let swapDetailed = {
              route,
              token1,
              token2,
              amount,
              amount2,
              tokenChain: token1?.chain,
              networkFee: gasPrice,
              walletAddress: token1?.address,
              token1Price: newBalanceToFiatConversion(token1?.price, amount),
              parentCoin: token1?.native || null,
              tab: 1,
            };
            store.dispatch(swapDetailAc(swapDetailed));

            navigate('/crosschain-swapDetails', {
              state: swapDetailed,
            });
          } else if (token1.chain.currencyName === 'BTC') {
            try {
              const gasPrice = Math.max(await BTCHelper.getBTCGasPrice(), 10);
              let swapDetailed = {
                route,
                token1,
                token2,
                amount,
                amount2,
                tokenChain: token1.chain,
                networkFee: gasPrice / Math.pow(10, 8),
                walletAddress: token1.address,
                token1Price: newBalanceToFiatConversion(token1.price, amount),
                parentCoin: token1.native,
                tab: 1,
              };
              store.dispatch(swapDetailAc(swapDetailed));
              store.dispatch(setLoading(false));
              navigate('/crosschain-swapDetails', {
                state: swapDetailed,
              });
            } catch (error) {
              store.dispatch(setLoading(false));
              return messageApi.error(error.message);
            }
          }
        }}
        text={'Swap'}
        maxWidth={'100%'}
        disabled={
          !token1 ||
          !token2 ||
          !amount ||
          !amount2 ||
          amount <= 0 ||
          amount2 <= 0 ||
          loading
        }
      />

      <Drawer
        title="Select Token"
        placement="bottom"
        onClose={() => {
          setOpen(false);
          setKeyword(null);
          setFilteredTokens(allToken);
        }}
        open={open}
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
                  const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
                  if (hasEmoji && value.length > 25) {
                    return false;
                  }
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
            onScroll={handleScroll}
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
                .map((token) => {
                  const tokenDisplayName = getTokenDisplayName(token);
                  return (
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
                        // console.log("token===========", token);
                        if (token1?.id == token.id || token2?.id == token.id) {
                          setOpen(false);
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
                        setOpen(false);
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
                          {tokenDisplayName.split('')[0]}
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
                          {tokenDisplayName}{' '}
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
                )})
            ) : (
              <div
                style={{
                  textAlign: 'center',
                }}
              >
                <p
                  className="noAddress"
                  style={{
                    marginTop: '47%',
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
  );
}

export default CrossChain;
