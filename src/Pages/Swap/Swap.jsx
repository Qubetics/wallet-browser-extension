/*global chrome */
import 'react-tabs/style/react-tabs.css';
import './Swap.scss';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import darkclose from '../../Assets/darkclose.svg';
import { Drawer, message, Select } from 'antd';
import { InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import React from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import { InputField } from '../../Components/InputField/InputFieldSimple';
import DownArrowSuffix from '../../Assets/DownArrowSuffix.svg';
import Search from '../../Assets/SearchIcon.svg';
import SwapVerticalIcon from '../../Assets/SwapVerticalIcon.svg';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { useLocation, useNavigate } from 'react-router-dom';
import { UniswapHelper } from '../../helpers/uniswap.helper';
import { useEffect } from 'react';
import { useState } from 'react';
import { Web3Helper } from '../../helpers/web3.helper';
import { useSelector } from 'react-redux';
import { store } from '../..';
import { ClipLoader } from 'react-spinners';
import { useRef } from 'react';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import CrossChain from '../CrossChain/CrossChain';
import { DURATION } from '../../config/message.config';
import BigNumber from 'bignumber.js';
import infoBg from '../../Assets/bgRedinfo.png';
import { toFixed } from '../../helpers/conversion.helper';
import { server } from '../../server';
import { PancakeHelper } from '../../helpers/pancake.helper';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import { setLoading as overAllLoader } from '../../actions/loading';
import { PulseChainHelper } from '../../helpers/pulsechain.helper';
import { UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES } from '../../config/uniswap.config';
import { PANCAKE_NATIVE_WRAPPED_TOKEN_ADDRESSES } from '../../config/pancake.config';
import Bignumber from 'bignumber.js';
import { generateString } from '../../helpers/common.helper';
import Maintanance from '../../Components/Maintanance/Maintanance';
import { swapDetailAc } from '../../actions/swap';
import useCurrentHeight from '../../CustomHooks/useCurrentHeight';
import { BL_CODE, rpc_chain, token_type } from '../../helpers/constant';
import { formatNumberInput } from '../../helpers/common.helper';

function getFlooredFixed(v, d) {
  return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
}
let randomString = generateString(15).trim();

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

function  Swap() {
  const [infoMessage, setInfoMessage] = useState(false);
  const { chain, account, currency, swapDetail } = useSelector(
    (state) => state
  );
  let timeOutId = useRef(null);
  let timeOutId1 = useRef(null);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token1, setToken1] = useState(null);
  const [token2, setToken2] = useState(null);
  const [tradingFee, setTradingFee] = useState(0);
  const [adminSwapFee, setAdminSwapFee] = useState(0);
  const [balance, setBalance] = useState(0);
  const [balance2, setBalance2] = useState(0);
  const [slippage, setSlippage] = useState(1);
  const [customSlippage, setCustomSlippage] = useState(null);
  const [slippage1, setSlippage1] = useState(1);
  const [customSlippage1, setCustomSlippage1] = useState(null);

  const [slippageDrawer, setSlippageDrawer] = useState(false);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  const [commision, setCommision] = useState(null);
  const [infoData, setInfoData] = useState([]);
  const [selectedCoinFamily, setSelectedCoinFamily] = useState(null);
  const [amount2, setAmount2] = useState(null);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [amount, setAount] = useState(null);
  const [route, setRoute] = useState(null);
  const [sel, setSel] = useState(0);
  const [selected, setSelected] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  const [open, setOpen] = useState(false);
  const [allToken, setAllTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [keyword, setKeyword] = useState(null);
  const [show, setShow] = useState(true);
  const [selectedCF, setSelectedCF] = useState(false);
  const [isWrap, setIsWrap] = useState(null);
  const [confirmSlippageAlert, setConfirmSlippageAlert] = useState(false);
  const height = useCurrentHeight();

  const [reverse, setReverse] = useState(false);

  const updateRef = useRef(true);
  const { theme } = useSelector((state) => state);
  const [percent, setPercent] = useState(null);

  const [onChainSwapM, setOnChainSwapM] = useState({});
  const [crossChainM, setCrossChainM] = useState({});
  const [activeIndex, setActiveIndex] = useState(null);
  const { state } = useLocation();

  const resetOnChainSelectionState = () => {
    setAount(null);
    setAmount2(null);
    setPercent(null);
    setActiveIndex(null);
    setInfoData([]);
  };

  useEffect(() => {
    if (swapDetail) {
      setSel(swapDetail?.tab);
      if (swapDetail?.tab == 0) {
        setAount(swapDetail?.amount.toString());
      }
    }
    if (state?.isCrossChain && !state?.isOnChain) {
      setSel(1);
    }
    if (state?.isOnChain && state?.isCrossChain) {
      setSel(0);
    }
    init();
  }, []);

  useEffect(() => {
    if ((amount == null || amount == '') && amount2 != null) {
      setAmount2(null);
      setInfoData([]);
    }
  }, [amount]);

  const percentages = [25, 50, 75, 100];

  const calculateAccordingly = async (percentage) => {
    try {
      store.dispatch(overAllLoader(true));
      if (token1.tokenAddress) {
        const token1Balance = token1?.balance;
        const amountToSend = await Web3Helper.getTokenBalance(
          token1.tokenAddress,
          token1.address,
          token1.rpc
        );
        console.log('amountToSend', amountToSend);
        // const amountToSend = token1Balance;
        console.log(
          '🚀 ~ calculateAccordingly ~ getTokenBalance:',
          amountToSend
        );
        if (amountToSend == 0) {
          setAmount2(0);
          setInfoData([]);
        }
        store.dispatch(overAllLoader(false));
        console.log('AMOUNT TO SWAP :', amountToSend);

        // const amountBN = new BigNumber(amountToSend);
        // const percentageBN = new BigNumber(percentage).dividedBy(100);

        // const amountCalculatedByPercentage =
        //   amountBN.multipliedBy(percentageBN);
        // const finalAmountToSend = amountCalculatedByPercentage.toString();

        const finalAmountToSend = new BigNumber(token1.balance).multipliedBy(
          new BigNumber(percentage).dividedBy(100)
        );
        const amountString = finalAmountToSend
          .decimalPlaces(6, BigNumber.ROUND_DOWN)
          .toString()
          .replace(/\.?0+$/, '');
        console.log('FINAL AMOUNT  :', percentage, finalAmountToSend);

        setAount(
          finalAmountToSend == 0 ? finalAmountToSend.toString() : amountString
        );
        setBalance(amountToSend);
        console.log(
          '🚀 ~ calculateAccordingly ~ parseFloat(amount.toFixed(18)).toString():',
          finalAmountToSend
        );

        await handleInputChange(
          finalAmountToSend == 0
            ? finalAmountToSend.toString()
            : finalAmountToSend.toFixed(6).replace(/\.?0+$/, ''),
          token1,
          token2,
          true
        );
      }
    } catch (error) {
      console.log('error', error);
      store.dispatch(overAllLoader(false));
      return messageApi.error('Something went wrong.');
    }
  };

  const init = async () => {
    let amountToSend = 0;
    const { chains } = await chrome.storage.local.get('chains');
    try {
      const comissionData = await server.get('/on-chain/commision_data', {
        headers: {
          Authorization: account.jwtToken,
        },
      });

      setCommision(comissionData.data.data);

      const { data } = await server.post(
        `/wallet/swap_coinlist`,
        {
          addrsListKeys: account.addressLists,
          coin_family: account.coinFamilies,
          fiat_type: currency.name,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      // console.log("DDDDDDDDDDDDDDDD ", data);

      const tokens = data.data.map((token) => {
        return {
          id: token.coin_id,
          coin: token,
          coinFamily: token.coin_family,
          iHave: token.wallets[0] ? true : false,
          symbol: token.coin_symbol.toUpperCase(),
          name: token.coin_name,
          tokenAddress: token.token_address,
          image: token.coin_image,
          address: account.coinFamilyAndAddress[token.coin_family],
          decimals: parseInt(token.decimals.toString().length) - 1,
          isToken: token.token_address ? true : false,
          price: token.fiat_price_data
            ? token.fiat_price_data.value
              ? token.fiat_price_data.value
              : 0
            : 0,
          chain: chains.find(
            (chain) => chain?.coinFamily == token?.coin_family
          ),
          balance: token.wallets[0] ? toFixed(token.wallets[0].balance) : 0,
          type: token_type(token.coin_family),
          jupiter_fee_address: null,
          rpc: rpc_chain(token.coin_family),
        };
      });

      setAllTokens(tokens);
      setFilteredTokens(tokens);

      let { [`uniToken1_${account.id}`]: uniToken1 } =
        await chrome.storage.local.get(`uniToken1_${account.id}`);
      let { [`uniToken2_${account.id}`]: uniToken2 } =
        await chrome.storage.local.get(`uniToken2_${account.id}`);

      if (!uniToken1 && !uniToken2) {
        if (tokens.length === 0) {
          return messageApi.error('Please enable tokens in your wallet.');
        }

        let myToken1 = tokens.find(
          (token) => !token.tokenAddress && token.iHave && token.coinFamily == 3
        );

        if (!myToken1) {
          myToken1 = tokens.find((token) => !token.tokenAddress);
        }

        if (!myToken1) {
          myToken1 = tokens.find((token) => token.tokenAddress);
        }

        let myToken2 = tokens.find(
          (token) =>
            token.tokenAddress &&
            token.coin.coin_family === myToken1.coin.coin_family
        );

        amountToSend = await Web3Helper.getTokenBalance(
          myToken1.tokenAddress,
          myToken1.address,
          myToken1.rpc
        );

        if (!myToken2) {
          myToken2 = tokens.find(
            (token) =>
              token.tokenAddress &&
              token.coin.coin_family === myToken1.coin.coin_family
          );
        }

        if (state && state.coinId) {
          const { data } = await server.post(
            `/wallet/swap_coinlist`,
            {
              addrsListKeys: account.addressLists,
              coin_family: account.coinFamilies,
              fiat_type: currency.name,
              coin_id: state.coinId,
            },
            {
              headers: {
                Authorization: account.jwtToken,
              },
            }
          );

          const newTokens = data.data.map((token) => {
            return {
              id: token.coin_id,
              coin: token,
              coinFamily: token.coin_family,
              iHave: token.wallets[0] ? true : false,
              symbol: token.coin_symbol.toUpperCase(),
              name: token.coin_name,
              tokenAddress: token.token_address,
              image: token.coin_image,
              address: account.coinFamilyAndAddress[token.coin_family],
              decimals: parseInt(token.decimals.toString().length) - 1,
              isToken: token.token_address ? true : false,
              price: token.fiat_price_data
                ? token.fiat_price_data.value
                  ? token.fiat_price_data.value
                  : 0
                : 0,
              chain: chains.find(
                (chain) => chain?.coinFamily == token?.coin_family
              ),
              balance: token.wallets[0] ? toFixed(token.wallets[0].balance) : 0,
              type: token_type(token.coin_family),
              jupiter_fee_address: null,
              rpc: rpc_chain(token.coin_family),
            };
          });

          //assign the object to my state token
          const myStateToken = newTokens[0];

          if (!myStateToken && !state?.isCrossChain) {
            messageApi.error('Token not available for swap.');
          }

          if (myStateToken) {
            if (state.fromOrTo == 1) {
              if (myToken2.id != myStateToken.id) {
                myToken1 = myStateToken;

                await chrome.storage.local.set({
                  [`uniToken1_${account.id}`]: myStateToken,
                });
              } else {
                messageApi.error('Cannot set the same tokens on both sides.');
              }
            } else {
              if (myToken1.id != myStateToken.id) {
                myToken2 = myStateToken;

                await chrome.storage.local.set({
                  [`uniToken2_${account.id}`]: myStateToken,
                });
              } else {
                messageApi.error('Cannot set the same tokens on both sides.');
              }
            }
          }
          if (state.coinFamily) {
            setToken1(myToken1);
            handleToken1Change(myStateToken);
            setSelectedCoinFamily(myStateToken?.coinFamily);
            setSelectedCF(true);
          }
        }

        const balance = amountToSend
          ? amountToSend
          : myToken1.balance
          ? myToken1.balance
          : 0;
        const tokenBalance = myToken2.balance || 0;

        await chrome.storage.local.set({
          [`uniToken1_${account.id}`]: myToken1,
        });

        await chrome.storage.local.set({
          [`uniToken2_${account.id}`]: myToken2,
        });

        setBalance(balance);
        setBalance2(tokenBalance);
        setAvailableTokens(tokens);
        setToken1(myToken1);
        setToken2(myToken2);
        setSelectedCoinFamily(myToken1.coinFamily);
        setLoading(false);
      } else {
        if (tokens.length === 0) {
          return;
        }
        ///////////////////////////////////////////////////////////////////////////////////
        let token1 = uniToken1 || null;

        amountToSend = await Web3Helper.getTokenBalance(
          token1.tokenAddress,
          token1.address,
          token1.rpc
        );

        const token1Response = await server.post(
          `/wallet/swap_coinlist`,
          {
            addrsListKeys: account.addressLists,
            coin_family: account.coinFamilies,
            fiat_type: currency.name,
            coin_id: uniToken1.id,
          },
          {
            headers: {
              Authorization: account.jwtToken,
            },
          }
        );

        const newTokens = token1Response.data.data
          .filter((el) => el.wallets[0])
          .map((token) => {
            return {
              id: token.coin_id,
              coin: token,
              coinFamily: token.coin_family,
              iHave: token.wallets[0] ? true : false,
              symbol: token.coin_symbol.toUpperCase(),
              name: token.coin_name,
              tokenAddress: token.token_address,
              image: token.coin_image,
              address: account.coinFamilyAndAddress[token.coin_family],
              decimals: parseInt(token.decimals.toString().length) - 1,
              isToken: token.token_address ? true : false,
              price: token.fiat_price_data
                ? token.fiat_price_data.value
                  ? token.fiat_price_data.value
                  : 0
                : 0,
              balance: token.wallets[0] ? toFixed(token.wallets[0].balance) : 0,
              type: token_type(token.coin_family),
              jupiter_fee_address: null,
              chain: chains.find(
                (chain) => chain?.coinFamily == token?.coin_family
              ),
              rpc: rpc_chain(token.coin_family),
            };
          });

        token1 = newTokens[0] || null;
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        setToken1(token1);

        if (!token1) {
          setBalance(token1?.balance || 0);

          setAvailableTokens(tokens);
          setToken1(token1);
          setToken2(null);

          setSelectedCoinFamily(token1?.coinFamily);
          setLoading(false);
          return;
        }

        if (newTokens.length === 0) {
          setBalance(token1?.balance || 0);

          setAvailableTokens(tokens);
          setToken1(token1);
          setToken2(null);

          setSelectedCoinFamily(token1?.coinFamily);
          setLoading(false);
          return;
        }

        uniToken2 = uniToken2 || null;

        if (!uniToken2) {
          setBalance(token1?.balance || 0);

          setAvailableTokens(tokens);
          setToken1(token1);
          setToken2(null);

          setSelectedCoinFamily(token1?.coinFamily);
          setLoading(false);
          return;
        }

        ///////////////////////////////////////////////////////////////////////////////////

        const token1Response2 = await server.post(
          `/wallet/swap_coinlist`,
          {
            addrsListKeys: account.addressLists,
            coin_family: account.coinFamilies,
            fiat_type: currency.name,
            coin_id: uniToken2.id,
          },
          {
            headers: {
              Authorization: account.jwtToken,
            },
          }
        );

        const newTokens2 = token1Response2.data.data.map((token) => {
          return {
            id: token.coin_id,
            coin: token,
            coinFamily: token.coin_family,
            iHave: token.wallets[0] ? true : false,
            symbol: token.coin_symbol.toUpperCase(),
            name: token.coin_name,
            tokenAddress: token.token_address,
            image: token.coin_image,
            address: account.coinFamilyAndAddress[token.coin_family],
            decimals: parseInt(token.decimals.toString().length) - 1,
            isToken: token.token_address ? true : false,
            price: token.fiat_price_data
              ? token.fiat_price_data.value
                ? token.fiat_price_data.value
                : 0
              : 0,
            chain: chains.find(
              (chain) => chain?.coinFamily == token?.coin_family
            ),
            balance: token.wallets[0] ? toFixed(token.wallets[0].balance) : 0,
            type: token_type(token.coin_family),
            jupiter_fee_address: null,
            rpc: rpc_chain(token.coin_family),
          };
        });

        uniToken2 = newTokens2[0] || null;
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        setToken2(uniToken2);

        if (state && state.coinId) {
          const { data } = await server.post(
            `/wallet/swap_coinlist`,
            {
              addrsListKeys: account.addressLists,
              coin_family: account.coinFamilies,
              fiat_type: currency.name,
              coin_id: state.coinId,
            },
            {
              headers: {
                Authorization: account.jwtToken,
              },
            }
          );

          //Configur ethe response like above

          const newTokens = data.data.map((token) => {
            return {
              id: token.coin_id,
              coin: token,
              coinFamily: token.coin_family,
              iHave: token.wallets[0] ? true : false,
              symbol: token.coin_symbol.toUpperCase(),
              name: token.coin_name,
              tokenAddress: token.token_address,
              image: token.coin_image,
              address: account.coinFamilyAndAddress[token.coin_family],
              decimals: parseInt(token.decimals.toString().length) - 1,
              isToken: token.token_address ? true : false,
              price: token.fiat_price_data
                ? token.fiat_price_data.value
                  ? token.fiat_price_data.value
                  : 0
                : 0,
              balance: token.wallets[0] ? toFixed(token.wallets[0].balance) : 0,
              type: token_type(token.coin_family),
              jupiter_fee_address: null,
              chain: chains.find(
                (chain) => chain?.coinFamily == token?.coin_family
              ),
              rpc: rpc_chain(token.coin_family),
            };
          });

          //assign the object to my state token
          const myStateToken = newTokens[0];

          if (!myStateToken && !state?.isCrossChain) {
            messageApi.error('Token not available for swap.');
          }

          if (myStateToken) {
            if (state.fromOrTo == 1) {
              if (uniToken2.id != myStateToken.id) {
                token1 = myStateToken;

                await chrome.storage.local.set({
                  [`uniToken1_${account.id}`]: myStateToken,
                });
              } else {
                messageApi.error('Cannot set the same tokens on both sides.');
              }
            } else {
              if (uniToken1.id != myStateToken.id) {
                uniToken2 = myStateToken;

                await chrome.storage.local.set({
                  [`uniToken2_${account.id}`]: myStateToken,
                });
              } else {
                messageApi.error('Cannot set the same tokens on both sides.');
              }
            }
          }
          if (state.coinFamily) {
            handleToken1Change(myStateToken);
            setSelectedCoinFamily(myStateToken?.coinFamily);
            setSelectedCF(true);
          }
        }
        setBalance(
          amountToSend ? amountToSend : token1?.balance ? token1?.balance : 0
        );
        setAvailableTokens(tokens);
        setToken1(token1);
        setToken2(uniToken2);
        setSelectedCoinFamily(token1?.coinFamily);
        setLoading(false);
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      messageApi.error('Something went wrong.');
      setLoading(false);
      // navigate(-1);
    }
  };

  useEffect(() => {
    if (token1 && token2) {
      if (
        '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' === token1.tokenAddress &&
        !token2.tokenAddress
      ) {
        setIsWrap(true);
      } else if (
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' === token1.tokenAddress &&
        !token2.tokenAddress
      ) {
        setIsWrap(true);
      } else if (
        '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' === token2.tokenAddress &&
        !token1.tokenAddress
      ) {
        setIsWrap(true);
      } else if (
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' === token2.tokenAddress &&
        !token1.tokenAddress
      ) {
        setIsWrap(true);
      } else {
        setIsWrap(false);
      }
    }
  }, [token1, token2]);

  const uniqueList = (arr1, arr2) => {
    const list = [...arr1, ...arr2];

    const uniqueNames = new Set();
    const result = list.filter((obj) => {
      if (!uniqueNames.has(obj.id)) {
        uniqueNames.add(obj.id);
        return true;
      }
      return false;
    });

    return result;
  };

  const getInactiveTokens = async () => {
    const { chains } = await chrome.storage.local.get('chains');
    try {
      store.dispatch(overAllLoader(true));
      const { data } = await server.post(
        `/wallet/swap_coinlist`,
        {
          addrsListKeys: [account.address],
          coin_family: [token1.coinFamily],
          fiat_type: currency.name,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      const tokens = data.data.map((token) => {
        return {
          id: token.coin_id,
          coin: token,
          coinFamily: token.coin_family,
          iHave: token.wallets[0] ? true : false,
          symbol: token.coin_symbol.toUpperCase(),
          name: token.coin_name,
          tokenAddress: token.token_address,
          image: token.coin_image,
          address: account.coinFamilyAndAddress[token.coin_family],
          decimals: parseInt(token.decimals.toString().length) - 1,
          isToken: token.token_address ? true : false,
          price: token.fiat_price_data
            ? token.fiat_price_data.value
              ? token.fiat_price_data.value
              : 0
            : 0,
          balance: token.wallets[0] ? toFixed(token.wallets[0].balance) : 0,
          type: token_type(token.coin_family),
          jupiter_fee_address: null,
          chain: chains.find(
            (chain) => chain?.coinFamily == token?.coin_family
          ),
          rpc: rpc_chain(token.coin_family),
        };
      });

      if (selectedCF) {
        if (token2) {
          if (token1?.coinFamily != token2?.coinFamily) {
            setToken2(tokens.find((el) => el.id != token1.id));
          }
        } else {
          setToken2(tokens.find((el) => el.id != token1.id));
        }
      }

      setAllTokens(uniqueList(tokens, allToken));
      setFilteredTokens(uniqueList(tokens, filteredTokens));
      setAvailableTokens(uniqueList(tokens, availableTokens));
      setSelectedCF(false);
      store.dispatch(overAllLoader(false));
    } catch (error) {
      store.dispatch(overAllLoader(false));
      messageApi.error('Something went wrong.');
      navigate(-1);
    }
  };

  useEffect(() => {
    if (selected == 2 || selectedCF) {
      getInactiveTokens();
    }
  }, [selected, selectedCF]);

  const handleTokensSwapChangePosition = async () => {
    if (token1 && token2) {
      await handleToken1Change(token1);
      await handleToken2Change(token2);
    }
  };

  const calculateTradingFee = async (route, amount, reverse) => {
    const { data } = await server.get('/wallet/get_admin_swap_fees', {
      headers: {
        Authorization: account.jwtToken,
      },
    });

    const myAdminFee = data.data.find((el) =>
      token1.coinFamily == 1
        ? el.network === 'bnb'
        : token1.coinFamily == 2
        ? el.network === 'eth'
        : token1.coinFamily == 4
        ? el.network === 'pol'
        : el.network === ''
    );

    let finalFee = 0;

    let finalGasFeeForTransaction = 0;

    if (myAdminFee && myAdminFee.status == 1) {
      const tokenPriceInUsd = amount * token1.price;

      const percent = myAdminFee.swap_fees / 100; // 0.1% = 0.001
      const originalNumber = tokenPriceInUsd; // Replace this with your desired original number
      const result = originalNumber * percent;
      finalFee = getFlooredFixed(
        result / token1.coin.native_coin_market_data.current_price,
        18
      );
    }

    if (token1.coinFamily == 5) {
      setAdminSwapFee(myAdminFee.swap_fees);
      const gasPrice = 0.000005;
      const finalFeeSol = new BigNumber(gasPrice)

        .plus(new BigNumber(finalFee))
        .toFixed();
      finalGasFeeForTransaction = finalFeeSol;
      setTradingFee(finalFeeSol);
      return getFlooredFixed(finalFeeSol, 9);
    }

    const gasPrice = await Web3Helper.getGasPrice(
      BL_CODE[token1.coinFamily].toLowerCase(),
      token1.address,
      token1.address,
      0
    );
    if (token1.coinFamily == 2) {
      let finalGasFee;
      if (!isWrap) {
        finalGasFee =
          (gasPrice.fast *
            Math.pow(10, 9) *
            parseInt(route.estimatedGasUsed.toString()) *
            2) /
          Math.pow(10, 18);
      } else {
        const estimate = await Web3Helper.fetchGasEstimateForWrap(
          UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES[1].address,
          token1.address,
          token1.rpc,
          token1.isToken ? 'withdraw' : 'deposit',
          new BigNumber(amount).multipliedBy(
            new BigNumber(10).pow(
              UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES[1].decimals
            )
          )
        );

        finalGasFee =
          (gasPrice.fast * Math.pow(10, 9) * estimate * 2) / Math.pow(10, 18);
      }

      if (finalFee) {
        if (token1.isToken) {
          const gasPrice = await Web3Helper.getGasPrice(
            'eth',
            token1.address,
            token1.address,
            1,
            token1.tokenAddress,
            amount,
            token1.type
          );

          finalGasFee +=
            (gasPrice.fast *
              Math.pow(10, 9) *
              (parseInt(gasPrice.estimate) + 10000)) /
            Math.pow(10, 18);
        } else {
          finalGasFee +=
            (gasPrice.fast * Math.pow(10, 9) * (parseInt(21000) + 5000)) /
            Math.pow(10, 18);
        }
      }

      finalGasFeeForTransaction = finalGasFee;
    } else if (token1.coinFamily == 1) {
      let functionCall = null;

      if (token1.isToken && token2.isToken) {
        functionCall = 1;
      } else if (!token1.isToken && token2.isToken) {
        functionCall = 0;
      } else if (token1.isToken && !token2.isToken) {
        functionCall = 2;
      }
      const pancakeHelper = new PancakeHelper(token1.rpc);
      let myGasEstimate;

      if (isWrap) {
        myGasEstimate = await Web3Helper.fetchGasEstimateForWrap(
          PANCAKE_NATIVE_WRAPPED_TOKEN_ADDRESSES[56].address,
          token1.address,
          token1.rpc,
          token1.isToken ? 'withdraw' : 'deposit',
          new BigNumber(amount).multipliedBy(
            new BigNumber(10).pow(
              PANCAKE_NATIVE_WRAPPED_TOKEN_ADDRESSES[56].decimals
            )
          )
        );
        if (!myGasEstimate) {
          myGasEstimate = 50000;
        }
      } else {
        myGasEstimate = await pancakeHelper.getGasEstimate(
          route,
          token1.address,
          slippage ? slippage : customSlippage
        );
      }

      if (myGasEstimate.status) {
        if (myGasEstimate.skip) {
          let finalGasFee =
            (gasPrice.fast * Math.pow(10, 9) * parseInt(150000)) /
            Math.pow(10, 18);

          if (finalFee) {
            if (token1.isToken) {
              const gasPrice = await Web3Helper.getGasPrice(
                'bnb',
                token1.address,
                token1.address,
                1,
                token1.tokenAddress,
                amount,
                token1.type
              );

              finalGasFee +=
                (gasPrice.fast *
                  Math.pow(10, 9) *
                  parseInt(gasPrice.estimate)) /
                Math.pow(10, 18);
            } else {
              finalGasFee +=
                (gasPrice.fast * Math.pow(10, 9) * parseInt(31000)) /
                Math.pow(10, 18);
            }
          }

          finalGasFeeForTransaction = finalGasFee;
        } else {
          return myGasEstimate;
        }
      } else {
        let finalGasFee =
          (gasPrice.fast *
            Math.pow(10, 9) *
            (parseInt(myGasEstimate) + 30000)) /
          Math.pow(10, 18);
        if (finalFee) {
          if (token1.isToken) {
            const gasPrice = await Web3Helper.getGasPrice(
              'bnb',
              token1.address,
              token1.address,
              1,
              token1.tokenAddress,
              amount,
              token1.type
            );
            finalGasFee +=
              (gasPrice.fast *
                Math.pow(10, 9) *
                (parseInt(gasPrice.estimate) + 10000)) /
              Math.pow(10, 18);
          } else {
            finalGasFee +=
              (gasPrice.fast * Math.pow(10, 9) * parseInt(31000)) /
              Math.pow(10, 18);
          }
        }

        finalGasFeeForTransaction = finalGasFee;
      }
    } else if (token1.coinFamily == 9) {
      let functionCall = null;

      if (token1.isToken && token2.isToken) {
        functionCall = 1;
      } else if (!token1.isToken && token2.isToken) {
        functionCall = 0;
      } else if (token1.isToken && !token2.isToken) {
        functionCall = 2;
      }
      const pancakeHelper = new PulseChainHelper(token1.rpc);

      const myGasEstimate = await pancakeHelper.getGasEstimate(
        route,
        token1.address,
        amount,
        token1.decimals,
        functionCall,
        reverse || false
      );

      if (myGasEstimate.status) {
        if (myGasEstimate.skip) {
          let finalGasFee =
            (gasPrice.fast * Math.pow(10, 9) * parseInt(150000)) /
            Math.pow(10, 18);

          if (finalFee) {
            if (token1.isToken) {
              const gasPrice = await Web3Helper.getGasPrice(
                'pls',
                token1.address,
                token1.address,
                1,
                token1.tokenAddress,
                amount,
                token1.type
              );

              finalGasFee +=
                (gasPrice.fast *
                  Math.pow(10, 9) *
                  parseInt(gasPrice.estimate)) /
                Math.pow(10, 18);
            } else {
              finalGasFee +=
                (gasPrice.fast * Math.pow(10, 9) * parseInt(31000)) /
                Math.pow(10, 18);
            }
          }

          finalGasFeeForTransaction = finalGasFee;
        } else {
          return myGasEstimate;
        }
      } else {
        let finalGasFee =
          (gasPrice.fast *
            Math.pow(10, 9) *
            (parseInt(myGasEstimate) + 30000)) /
          Math.pow(10, 18);

        if (finalFee) {
          if (token1.isToken) {
            const gasPrice = await Web3Helper.getGasPrice(
              'pls',
              token1.address,
              token1.address,
              1,
              token1.tokenAddress,
              amount,
              token1.type
            );

            finalGasFee +=
              (gasPrice.fast *
                Math.pow(10, 9) *
                (parseInt(gasPrice.estimate) + 10000)) /
              Math.pow(10, 18);
          } else {
            finalGasFee +=
              (gasPrice.fast * Math.pow(10, 9) * parseInt(31000)) /
              Math.pow(10, 18);
          }
        }

        finalGasFeeForTransaction = finalGasFee;
      }
    }

    setTradingFee(parseFloat(finalFee) + finalGasFeeForTransaction);
    return getFlooredFixed(parseFloat(finalFee) + finalGasFeeForTransaction, 5);
  };

  useEffect(() => {
    handleTokensSwapChangePosition();
    if (amount) {
      if (timeOutId.current) {
        clearTimeout(timeOutId);
      }
      timeOutId.current = setTimeout(() => {
        handleInputChange(amount, token1, token2);
      }, 800);
    }
  }, [token1, token2]);

  const handleToken1Change = async (updatedToken1, isWrap) => {
    await chrome.storage.local.set({
      [`uniToken1_${account.id}`]: updatedToken1,
    });
    if (percent != 100) {
      setBalance(updatedToken1?.balance);
    }

    if (updatedToken1?.tokenAddress) {
      if (updatedToken1?.id != token1?.id) {
        setAmount2(null);
        setAount(null);
        setPercent(null);
        setActiveIndex(null);
        setReverse(false);
        setInfoData([]);
        updateRef.current = false;
        // if (!isWrap) {
        //   handleInputChange(amount, updatedToken1, token2);
        // }
      }
    } else {
      if (updatedToken1?.id != token1?.id) {
        setAmount2(null);
        setAount(null);
        setPercent(null);
        setActiveIndex(null);
        setReverse(false);
        setInfoData([]);
        updateRef.current = false;
        // if (!isWrap) {
        //   handleInputChange(amount, updatedToken1, token2);
        // }
      }
    }
  };

  const handleToken2Change = async (updatedToken2, isWrap) => {
    await chrome.storage.local.set({
      [`uniToken2_${account.id}`]: updatedToken2,
    });

    if (updatedToken2.tokenAddress) {
      if (updatedToken2.id != token2.id) {
        setAmount2(null);
        //setAount(null);
        setPercent(null);
        setActiveIndex(null);
        setReverse(false);
        setInfoData([]);
        updateRef.current = false;
        if (!isWrap) {
          handleInputChange(amount, token1, updatedToken2);
        }
      }
    } else {
      if (updatedToken2.id != token2.id) {
        setAmount2(null);
        //setAount(null);
        setPercent(null);
        setActiveIndex(null);
        setReverse(false);
        setInfoData([]);
        updateRef.current = false;
        if (!isWrap) {
          handleInputChange(swapDetail?.amount, token1, updatedToken2);
        }
      }
    }
  };

  const handleInputChange = async (amount, token1, token2, second) => {
    try {
      if (amount > 0 && token1.coinFamily == token2.coinFamily) {
        setLoading(true);

        const uniHelper = new UniswapHelper(token1.rpc);
        const route = await uniHelper.getQuoteAndRoute(
          token1.chain.chainId,
          token1.tokenAddress || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          token2.tokenAddress || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          new BigNumber(amount)
            .multipliedBy(new BigNumber(10).pow(token1.decimals))
            .decimalPlaces(0, BigNumber.ROUND_DOWN),
          commision.percentage
        );

        if (route?.error) {
          setLoading(false);
          return messageApi.error(
            route?.message ||
              'This pair is not available for swap at the moment. Please try again later.'
          );
        }
        setRoute(route);
        setAmount2(
          new Bignumber(route.toAmount)
            .dividedBy(Math.pow(10, token2.decimals))
            .toFixed()
        );
        setLoading(false);
      }
      updateRef.current = true;
    } catch (error) {
      setLoading(false);
      updateRef.current = true;
    }
  };

  const handleInputChangeForToToken = async (amount, token2) => {
    try {
      if (amount > 0) {
        setLoading(true);
        if (token1.coinFamily == 2) {
          if (isWrap) {
            const tradingFee = await calculateTradingFee(null, amount, true);
            setInfoData([
              {
                text: 'Price',
                textVal: `1 ${token2.symbol} = 1 ${token1.symbol}`,
              },
              {
                text: 'Trading Fees',
                textVal: `${tradingFee} ETH`,
              },
              {
                text: 'Slippage Tolerance',
                textVal: `5%`,
              },
              {
                text: 'Route',
                textVal: `${token1.symbol} > ${token2.symbol}`,
              },
            ]);

            setAount(amount);
            setLoading(false);
            return;
          }
          const uniHelper = new UniswapHelper(token1.rpc);
          const route = await uniHelper.getQuoteAndRoute(
            token1,
            token2,
            amount,
            token1.address,
            true,
            slippage ? slippage : customSlippage
          );

          if (!route) {
            setLoading(false);
            return messageApi.error(
              'This pair is not available for swap at the moment. Please try again later.'
            );
          }

          const tradingFee = await calculateTradingFee(
            route,
            route.quote.toFixed(token1.decimals),
            true
          );

          if (!tradingFee || tradingFee.status) {
            setLoading(false);
            return messageApi.error(
              tradingFee.status ? tradingFee.message : 'Pair not supported.'
            );
          }

          setInfoData([
            {
              text: 'Price',
              textVal: `1 ${token2.symbol} = ${addCommasToNumber(
                getFlooredFixed(
                  parseFloat(route.quote.toFixed(token1.decimals)) /
                    parseFloat(amount),
                  12
                )
              )} ${token1.symbol}`,
            },
            {
              text: 'Trading Fees',
              textVal: `${tradingFee} ${BL_CODE[token1?.coinFamily]}`,
            },
            {
              text: 'Slippage Tolerance',
              textVal: `${slippage ? slippage : customSlippage}%`,
            },
            {
              text: 'Route',
              textVal: route.route[0].tokenPath
                .map((el) => el.symbol)
                .join('>'),
            },
          ]);

          setRoute(route);
          setAount(route.quote.toFixed(token1.decimals));

          setLoading(false);
        } else if (token1.coinFamily == 1) {
          if (isWrap) {
            const tradingFee = await calculateTradingFee(null, amount, true);

            setInfoData([
              {
                text: 'Price',
                textVal: `1 ${token2.symbol} = 1 ${token1.symbol}`,
              },
              {
                text: 'Trading Fees',
                textVal: `${tradingFee} BNB`,
              },
              {
                text: 'Slippage Tolerance',
                textVal: `0%`,
              },
              {
                text: 'Route',
                textVal: `${token1.symbol} > ${token2.symbol}`,
              },
            ]);

            setAount(amount);
            setLoading(false);
            return;
          }
          const pancakeHelper = new PancakeHelper(token1.rpc);
          const route = await pancakeHelper.getQuoteAndRoute(
            token1,
            token2,
            amount,
            token1.address,
            true,
            slippage ? slippage : customSlippage
          );

          if (!route) {
            setLoading(false);
            return messageApi.error(
              'Unable to perform swap: 403. Please try again later.'
            );
          }

          const tradingFee = await calculateTradingFee(
            route.route,
            route.outAmount.toFixed(token1.decimals),
            true
          );
          setAount(route.outAmount.toFixed(token1.decimals));

          setRoute(route.route);
          setFeeAmount(route.feeAmount);

          if (!tradingFee || tradingFee.status) {
            setLoading(false);
            setInfoData([]);
            return messageApi.error(
              tradingFee.status ? tradingFee.message : 'Pair not supported.'
            );
          }

          setInfoData([
            {
              text: 'Price',
              textVal: `1 ${token2.symbol} = ${addCommasToNumber(
                getFlooredFixed(
                  parseFloat(route.outAmount.toFixed(token1.decimals)) /
                    parseFloat(amount),
                  12
                )
              )} ${token1.symbol}`,
            },
            {
              text: 'Trading Fees',
              textVal: `${tradingFee} ${
                token1.coinFamily == 1 ? 'ETH' : 'BNB'
              }`,
            },
            {
              text: 'Slippage Tolerance',
              textVal: `${slippage ? slippage : customSlippage}%`,
            },
            {
              text: 'Route',
              // textVal: route.route.routeText,
              textVal:
                route.route.routes.length === 1
                  ? route.route.routes[0].path.map((el) => el.symbol).join('>')
                  : 'Complex Composite Route',
            },
          ]);

          setLoading(false);
        } else if (token1.coinFamily == 9) {
          const pancakeHelper = new PulseChainHelper(token1.rpc);
          const route = await pancakeHelper.getQuoteAndRoute(
            token1,
            token2,
            amount,
            token1.address,
            true,
            slippage ? slippage : customSlippage
          );

          if (!route) {
            setLoading(false);
            return messageApi.error(
              'This pair is not available for swap at the moment. Please try again later.'
            );
          }

          const tradingFee = await calculateTradingFee(
            route.route,
            route.outAmount.toFixed(token1.decimals),
            true
          );

          setAount(route.outAmount.toFixed(token1.decimals));

          setRoute(route.route);
          setFeeAmount(route.feeAmount);

          if (!tradingFee || tradingFee.status) {
            setLoading(false);
            setInfoData([]);
            return messageApi.error(
              tradingFee.status ? tradingFee.message : 'Pair not supported.'
            );
          }

          setInfoData([
            {
              text: 'Price',
              textVal: `1 ${token2.symbol} = ${addCommasToNumber(
                getFlooredFixed(
                  parseFloat(route.outAmount.toFixed(token1.decimals)) /
                    parseFloat(amount),
                  12
                )
              )} ${token1.symbol}`,
            },
            {
              text: 'Trading Fees',
              textVal: `${tradingFee} ${
                token1.coinFamily == 1
                  ? 'ETH'
                  : token1.coinFamily == 9
                  ? 'PLS'
                  : 'BNB'
              }`,
            },
            {
              text: 'Slippage Tolerance',
              textVal: `${slippage ? slippage : customSlippage}%`,
            },
            {
              text: 'Route',
              textVal: route.route.routeText,
            },
          ]);

          setLoading(false);
        } else if (token1.coinFamily == 5) {
          try {
            const response = await server.get(
              'https://quote-api.jup.ag/v6/quote',
              {
                params: {
                  amount: new BigNumber(amount)
                    .multipliedBy(Math.pow(10, token2.decimals))
                    .toFixed(0),
                  inputMint:
                    token1.tokenAddress ||
                    'So11111111111111111111111111111111111111112',
                  outputMint:
                    token2.tokenAddress ||
                    'So11111111111111111111111111111111111111112',
                  platformFeeBps: token1.jupiter_fee_address ? 100 : 0,
                  slippageBps: new Bignumber(
                    slippage ? slippage : customSlippage
                  )
                    .multipliedBy(100)
                    .toFixed(0),
                  swapMode: 'ExactOut',
                },
              }
            );

            const inAmount = new BigNumber(response.data.inAmount)
              .dividedBy(Math.pow(10, token1.decimals))
              .toFixed(token1.decimals);

            // console.log(response.data);
            setAount(inAmount);
            setRoute(response.data);

            const tradingFee = await calculateTradingFee(null, amount, true);

            setInfoData([
              {
                text: 'Price',
                textVal: `1 ${token2.symbol} = ${addCommasToNumber(
                  getFlooredFixed(parseFloat(inAmount) / parseFloat(amount), 12)
                )} ${token1.symbol}`,
              },
              {
                text: 'Trading Fees',
                textVal: `${tradingFee} SOL`,
              },
              {
                text: 'Slippage Tolerance',
                textVal: `${slippage ? slippage : customSlippage}%`,
              },
              {
                text: 'Route',
                textVal: response.data.routePlan
                  .map((el) => el.swapInfo.label)
                  .join('>'),
              },
            ]);
          } catch (error) {
            console.log(error);
            if (error?.response?.data?.error) {
              messageApi.error(
                error.response.data.error ===
                  'Query parameter amount cannot be parsed: ParseIntError { kind: PosOverflow }'
                  ? 'Please enter a smaller amount to proceed'
                  : error.response.data.error
              );
            } else {
              messageApi.error('Something went wrong');
            }
          }
        }
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const debounceTimeout = useRef(null);

  function handleChangeForInput1(newAmount) {
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      handleInputChange(newAmount, token1, token2);
    }, 2000);
  }

  const debounceTimeout2 = useRef(null);

  function handleChangeForInput2(newAmount) {
    clearTimeout(debounceTimeout2.current);
    debounceTimeout2.current = setTimeout(() => {
      handleInputChangeForToToken(newAmount, token2);
    }, 2000);
  }

  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders backTo={'/wallet'} title={'Swap'} />
      <div className={`flexedContent`}>
        <Tabs selectedIndex={sel}>
          <TabList
            className="swapTabList "
            style={{
              border: 'none',
              borderRadius: '14px',
              display: 'flex',
              justifyContent: 'space-evenly',
              listStyle: 'none',
            }}
          >
            <Tab
              className="swapTab"
              onClick={() => {
                if (swapDetail) {
                  store.dispatch(swapDetailAc(null));
                }
                setSel(0);
                resetOnChainSelectionState();
              }}
            >
              On-Chain
            </Tab>
            <Tab
              className="swapTab"
              disabled={chain.testnet}
              onClick={() => {
                if (chain.testnet) {
                  return messageApi.error(
                    'Cross chain swapping is only available in mainnet.'
                  );
                }
                if (swapDetail) {
                  store.dispatch(swapDetailAc(null));
                }
                resetOnChainSelectionState();
                setSel(1);
              }}
            >
              Cross-Chain
            </Tab>
          </TabList>

          <TabPanel>
            {onChainSwapM?.is_maintenance ? (
              <Maintanance text="On chain swap is in under maintenance" />
            ) : (
              <div
                className={`${'fixedContent height-571'} ${
                  height <= 600 ? 'fixedContentOuterExt' : ''
                }`}
              >
                <div style={{ width: '100%' }} className="swap ">
                  <div className="swap_onChain">
                    <div className="swap_onChain_balance">
                      <div>
                        <input
                          type="number"
                          className="myInput"
                          placeholder="0"
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

                            if (
                              beforeDecimal.length > maxCharactersBeforeDecimal
                            )
                              return;
                            if (afterDecimal.length > maxDecimals) return;

                            setAount(_amount);
                            handleChangeForInput1(_amount);
                            if (percent != null) {
                              setPercent(null);
                              setActiveIndex(null); // <--- unselect the percentage button
                            }
                          }}
                          value={amount}
                        />
                        <p style={{ marginTop: '8px' }}>
                          {currency.symbol}
                          {addCommasToNumber(
                            getFlooredFixed(
                              parseFloat(amount ? amount : 0) *
                                parseFloat(token1 ? token1.price : 0),
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
                            setAount(null);
                            setToken1(
                              availableTokens.find((el) => el.id == value)
                            );
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
                    {token2?.name && (
                      <img
                        src={SwapVerticalIcon}
                        width={44}
                        alt=""
                        height={44}
                        style={
                          loading
                            ? {
                                pointerEvents: 'none',
                              }
                            : {
                                pointerEvents: 'auto',
                              }
                        }
                        onClick={() => {
                          console.log('token2', token2, token1);
                          if (token2?.iHave) {
                            setAmount2(0);
                            setAount(0);

                            setToken1(token2);
                            setToken2(token1);

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
                          placeholder="0"
                          value={amount2}
                          readOnly={true}
                          onChange={({ target: { value: amount } }) => {
                            if (percent != null) {
                              setPercent(null);
                            }
                            const afterDecimal = amount.split('.')[1];
                            const maxCharactersBeforeDecimal = 15;

                            if (afterDecimal) {
                              const maxDecimals = token2?.decimals;
                              if (
                                afterDecimal.toString().length > maxDecimals
                              ) {
                                return; // Return if decimal part is too long
                              }
                              const beforeDecimal = amount.split('.')[0];
                              if (
                                beforeDecimal.toString().length >
                                maxCharactersBeforeDecimal
                              ) {
                                return; // Return if characters before decimal exceed the maximum allowed
                              }
                            } else {
                              if (amount.length > maxCharactersBeforeDecimal) {
                                return; // Return if the whole input exceeds the maximum allowed
                              }
                            }
                            setAmount2(amount);
                            handleChangeForInput2(amount);
                          }}
                        />
                        <p style={{ marginTop: '8px' }}>
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
                            setToken2(
                              availableTokens.find((el) => el.id == value)
                            );
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
                        <div className="swap_onChain_pay">
                          <p style={{ textAlign: 'right' }}>
                            Balance{' '}
                            <span>
                              {addCommasToNumber(
                                parseFloat(
                                  getFlooredFixed(token2?.balance || 0, 6)
                                )
                              )}{' '}
                              {token2?.symbol}
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
                  <div className="swap__infoText">
                    {loading ? (
                      <>
                        <ClipLoader size={20} color="#fff" />{' '}
                        <p
                          style={{
                            marginLeft: '7px',
                          }}
                        >
                          Fetching best price. Please wait...
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>
                <div style={{ width: '100%' }}>
                  {infoData.length > 0 ? null : (
                    <div className="slipPageSec">
                      <div className="innerslip">
                        <div className="innerslip">
                          <span
                            style={{
                              fontSize: '16px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setSlippageDrawer(true);
                            }}
                          >
                            {' '}
                            SET SLIPPAGE {slippage || customSlippage}%
                            {/* <EditOutlined /> */}
                          </span>
                          <SettingOutlined
                            onClick={() => {
                              setSlippageDrawer(true);
                            }}
                          />
                        </div>
                        <InfoCircleOutlined
                          style={{ cursor: 'pointer' }}
                          onClick={() => setInfoMessage(true)}
                        />
                      </div>
                    </div>
                  )}

                  <ButtonComp
                    onClick={async () => {
                      if (
                        (slippage >= 2 && !slippageDrawer) ||
                        (Number(customSlippage) >= 2 && !slippageDrawer)
                      ) {
                        setConfirmSlippageAlert(true);
                        return;
                      }
                      if (
                        isNaN(parseFloat(amount)) ||
                        isNaN(parseFloat(amount2))
                      ) {
                        return messageApi.error(
                          'Please enter a valid amount to proceed.'
                        );
                      }

                      const amountToSend = await Web3Helper.getTokenBalance(
                        token1.tokenAddress,
                        token1.address,
                        token1.rpc
                      );

                      console.log(
                        '🚀 ~ onClick={ ~ amountToSend:',
                        amountToSend
                      );

                      if (percent != 100) {
                        const balanceBig = new BigNumber(amountToSend);
                        const amountBig = new BigNumber(amount);
                        if (balanceBig.isLessThan(amountBig)) {
                          return messageApi.error(
                            'Insufficient balance to proceed with the transaction.'
                          );
                        }
                      }
                      store.dispatch(overAllLoader(true));
                      const getNativeBalance = await Web3Helper.getCoinBalance(
                        token1?.address,
                        token1?.rpc
                      );

                      const nativeBalance = new BigNumber(getNativeBalance); // Replace with your actual value
                      const feeAmount = new BigNumber(tradingFee); // Replace with your actual value
                      const amountToAdd = new BigNumber(
                        token1?.tokenAddress ? 0 : amount
                      );
                      const balanceExtraToAddIfFromIsNativeCoin =
                        feeAmount.plus(amountToAdd);

                      if (
                        balanceExtraToAddIfFromIsNativeCoin.gt(nativeBalance)
                      ) {
                        store.dispatch(overAllLoader(false));
                        return messageApi.error(
                          'Insufficient balance to proceed with the transaction.'
                        );
                      }

                      store.dispatch(overAllLoader(false));

                      let swapDetailed = {
                        route,
                        token1,
                        token2,
                        amount,
                        amount2,
                        feeAmount,
                        isWrap,
                        tab: sel,
                        slippage: slippage ? slippage : customSlippage,
                        commision,
                      };

                      store.dispatch(swapDetailAc(swapDetailed));
                      navigate('/swapDetails', {
                        state: swapDetailed,
                      });
                    }}
                    text={
                      token1?.id == token2?.id &&
                      token1 != null &&
                      token2 != null
                        ? 'Please select a different token'
                        : 'Swap'
                    }
                    maxWidth={'100%'}
                    marginBottom={30}
                    disabled={
                      !amount ||
                      !amount2 ||
                      amount <= 0 ||
                      amount2 <= 0 ||
                      loading ||
                      parseFloat(amount) > parseFloat(balance) ||
                      token1?.id == token2?.id
                    }
                  />
                </div>
              </div>
            )}
          </TabPanel>
          <TabPanel>
            {crossChainM?.is_maintenance ? (
              <Maintanance text="Cross chain swap is in under maintenance" />
            ) : (
              <CrossChain state={state} />
            )}
          </TabPanel>
        </Tabs>
      </div>
      <Drawer
        title="Select Token"
        placement="bottom"
        onClose={() => {
          setOpen(false);
          setKeyword('');
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
              />
            </div>
          ) : null}

          <div
            className="right"
            style={{
              flex: 1,
              overflow: 'scroll',
            }}
          >
            {filteredTokens
              .filter((el) => {
                if (selected == 1) {
                  if (el.iHave) {
                    return el;
                  }
                } else {
                  return el;
                }
              })
              .filter((el) => {
                if (selected == 2) {
                  if (el.coinFamily == selectedCoinFamily) {
                    return el;
                  }
                } else {
                  return el;
                }
              }).length > 0 ? (
              filteredTokens
                .filter((el) => {
                  if (selected == 1) {
                    if (el.iHave) {
                      return el;
                    }
                  } else {
                    return el;
                  }
                })
                .filter((el) => {
                  if (selected == 2) {
                    if (el.coinFamily == selectedCoinFamily) {
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
                          token1?.id == token.id || token2?.id == token.id
                            ? 'transparent'
                            : 'transparent',
                        color:
                          token1?.id == token.id || token2?.id == token.id
                            ? '#000'
                            : '#000',
                      }}
                      onClick={() => {
                        if (token1?.id == token.id || token2?.id == token.id) {
                          setOpen(false);
                        }

                        if (selected == 1) {
                          if (token2?.id == token.id) {
                            setKeyword('');
                            setFilteredTokens(allToken);
                            return messageApi.error(
                              'You cannot select the same tokens on both sides. Please select a different token.'
                            );
                          }

                          let myWrap = false;

                          if (
                            token.tokenAddress ===
                              '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' &&
                            !token2.tokenAddress
                          ) {
                            setIsWrap(true);
                            myWrap = true;
                          } else if (
                            token.tokenAddress ===
                              '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' &&
                            !token2.tokenAddress
                          ) {
                            setIsWrap(true);
                            myWrap = true;
                          } else {
                            setIsWrap(0);
                          }

                          setAount(0);
                          setAmount2(0);
                          setToken1(token);
                          handleToken1Change(token, myWrap);

                          setSelectedCoinFamily(token.coinFamily);
                          setSelectedCF(true);
                        } else {
                          if (token1?.id == token.id) {
                            setKeyword('');
                            setFilteredTokens(allToken);
                            return messageApi.error(
                              'You cannot select the same tokens on both sides. Please select a different token.'
                            );
                          }
                          let myWrap = false;

                          if (
                            token.tokenAddress ===
                              '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' &&
                            !token1.tokenAddress
                          ) {
                            setIsWrap(true);
                            myWrap = true;
                          } else if (
                            token.tokenAddress ===
                              '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' &&
                            !token1.tokenAddress
                          ) {
                            setIsWrap(true);
                            myWrap = true;
                          } else {
                            setIsWrap(0);
                          }

                          setToken2(token);
                          handleToken2Change(token, myWrap);
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
                          {token.name.split('')[0]}
                        </div>
                      ) : (
                        <img
                          style={{
                            width: '29px',
                            marginRight: '15px',
                            borderRadius: '50%',
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
                          {token.name}
                        </span>
                        <span
                          className="noAddress"
                          style={{
                            fontSize: '11px',
                            marginLeft: '5px',
                          }}
                        >
                          {token?.isToken && token?.type ? ` /${token.type}` : null}
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
                    marginTop: '47%',
                    marginBottom: '15px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                  }}
                >
                  Asset not found
                </p>
                {/* <ButtonComp
                  text={'Add Tokens'}
                  onClick={() => {
                    if (!token1) {
                      return messageApi.error(
                        'Please select a blockchain/token first.'
                      );
                    }
                    navigate('/add-token', {
                      state: {
                        swap: token1?.coinFamily,
                        selected,
                      },
                    });
                  }}
                  maxWidth={'50%'}
                /> */}
              </div>
            )}
          </div>
        </div>
      </Drawer>
      <Drawer
        title="Slippage Tolerance"
        placement="bottom"
        onClose={() => {
          // Allow user to close/cancel freely
          setSlippageDrawer(false);
        }}
        open={slippageDrawer}
        closable={true}
        closeIcon={
          theme === 'darkTheme' ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
        height={292}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              gap: '6px',
            }}
          >
            <div className="myvalues">
              <p
                className={slippage1 === 1 ? 'myValuesActive' : ''}
                onClick={() => {
                  setSlippage1(1);
                  setCustomSlippage1(null);
                }}
              >
                1%
              </p>
            </div>

            <div className="myvalues">
              <p
                className={slippage1 === 2 ? 'myValuesActive' : ''}
                onClick={() => {
                  setSlippage1(2);
                  setCustomSlippage1(null);
                }}
              >
                2%
              </p>
            </div>

            <div className="myvalues">
              <p
                className={slippage1 === 3 ? 'myValuesActive' : ''}
                onClick={() => {
                  setSlippage1(3);
                  setCustomSlippage1(null);
                }}
              >
                3%
              </p>
            </div>

            <div className="pthel_input">
              <InputField
                coloredBg={'transparent'}
                placeholder={'Custom'}
                // show empty string if null so input can be cleared
                value={customSlippage1 ?? ''}
                type="number"
                addonBefore={
                  <span>
                    <img
                      src={Search}
                      style={{ width: '17px', marginTop: '5px' }}
                      alt=""
                    />
                  </span>
                }
                getData={(value) => {
                  // normalize empty input
                  if (!value || value === '') {
                    // revert to default option (1%) when input cleared
                    setSlippage1(1);
                    setCustomSlippage1(null);
                    return;
                  }

                  // allow only up to 50 and reasonable length
                  const parsed = parseFloat(value);
                  if (
                    !isNaN(parsed) &&
                    parsed >= 0 &&
                    parsed <= 50 &&
                    value.toString().length <= 5
                  ) {
                    setSlippage1(null); // custom selected
                    setCustomSlippage1(value);
                  }
                }}
              />
            </div>
          </div>

          <ButtonComp
            text={'Done'}
            maxWidth={'50%'}
            marginTop={'40px'}
            alignSelf="center"
            onClick={() => {
              // Choose the active value: either preset (slippage1) or custom (customSlippage1)
              // Validate custom only when user selected a custom input
              if (slippage1 === null) {
                // user chose custom input -> validate it
                const parsed = parseFloat(customSlippage1);
                if (isNaN(parsed) || parsed < 0) {
                  return messageApi.error(
                    'Please enter a valid slippage value.'
                  );
                }
                // set values from custom
                setSlippage(parsed);
                setCustomSlippage(parsed);
              } else {
                // user selected 1/2/3 preset
                setSlippage(slippage1);
                setCustomSlippage(null);
              }

              setSlippageDrawer(false);
              handleChangeForInput1(amount);
            }}
          />
        </div>
      </Drawer>

      {infoMessage && (
        <ModalCustom
          isModalOpen={infoMessage}
          title={'Slippage Alert'}
          handleCancel={() => setInfoMessage(false)}
          customClass={'customClassModal '}
        >
          {/* <div className="mainTanceSecModal">
            {theme == "darkTheme" ? <img src={DarkLogo} /> : <img src={Logo} />} */}

          <p style={{ color: '#fff' }}>
            Slippage is the price change between order placement and execution.
            Higher slippage helps prevent failed transactions, particularly in
            fast moving markets. For taxed tokens, we recommend you set slippage
            at least 1% above the tax rate of the token.
          </p>
          {/* <ButtonComp
              maxWidth={"100%"}
              marginTop={"25px"}
              text={"Ok"}
              onClick={() => setInfoMessage("")}
            />
          </div> */}
        </ModalCustom>
      )}
      {confirmSlippageAlert && (
        <ModalCustom
          isModalOpen={confirmSlippageAlert}
          // title={'Slippage Alert'}
          handleCancel={() => setConfirmSlippageAlert(false)}
          customClass={'customClassModal '}
        >
          <div className="mainTanceSecModal">
            {/* {theme == 'darkTheme' ? <img src={InfoCircleOutlined} /> : <img src={InfoCircleOutlined} />} */}
            {/* <InfoCircleOutlined /> */}
            <img
              src={infoBg}
              alt="alert icon"
              height={35}
              style={{ width: '35px' }}
            />
            <p style={{ color: '#fff', fontSize: '20px', textAlign: 'center' }}>
              Slippage is too high
            </p>
            <ButtonComp
              maxWidth={'100%'}
              marginTop={'25px'}
              text={'Continue At Your Own Risk'}
              customClass={'customClassModal '}
              onClick={async () => {
                if (isNaN(parseFloat(amount)) || isNaN(parseFloat(amount2))) {
                  return messageApi.error(
                    'Please enter a valid amount to proceed.'
                  );
                }

                if (percent != 100) {
                  const balanceBig = new BigNumber(balance);
                  const amountBig = new BigNumber(amount);
                  if (balanceBig.isLessThan(amountBig)) {
                    return messageApi.error(
                      'Insufficient balance to proceed with the transaction.'
                    );
                  }
                }

                store.dispatch(overAllLoader(true));

                const getNativeBalance = await Web3Helper.getCoinBalance(
                  token1?.address,
                  token1?.rpc
                );

                // Assuming nativeBalance and tradingFee are strings or numbers
                const nativeBalance = new BigNumber(getNativeBalance); // Replace with your actual value

                const feeAmount = new BigNumber(tradingFee); // Replace with your actual value

                const amountToAdd = new BigNumber(
                  token1?.tokenAddress ? 0 : amount
                );

                const balanceExtraToAddIfFromIsNativeCoin =
                  feeAmount.plus(amountToAdd);

                if (balanceExtraToAddIfFromIsNativeCoin.gt(nativeBalance)) {
                  store.dispatch(overAllLoader(false));
                  return messageApi.error(
                    'Insufficient balance to proceed with the transaction.'
                  );
                }

                store.dispatch(overAllLoader(false));

                let swapDetailed = {
                  route,
                  token1,
                  token2,
                  amount,
                  amount2,
                  feeAmount,
                  isWrap,
                  tab: sel,
                  slippage: slippage ? slippage : customSlippage,
                  commision,
                };
                setConfirmSlippageAlert(false);
                store.dispatch(swapDetailAc(swapDetailed));
                navigate('/swapDetails', {
                  state: swapDetailed,
                });
              }}
            />
            <ButtonComp
              maxWidth={'100%'}
              bordered={true}
              marginTop={'25px'}
              text={'Reduce Slippage'}
              onClick={() => {
                setConfirmSlippageAlert(false);
                setSlippageDrawer(true);
              }}
            />
          </div>
        </ModalCustom>
      )}
    </div>
  );
}

export default Swap;
