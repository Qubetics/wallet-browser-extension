/*global chrome */

import { Drawer, message, Select } from 'antd';
import React from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import { InputField } from '../../Components/InputField/InputFieldSimple';
import style from './style.module.scss';
import BTC from '../../Assets/Coins/BTC.png';
import DownArrowSuffix from '../../Assets/DownArrowSuffix.svg';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import Search from '../../Assets/SearchIcon.svg';
import darkclose from '../../Assets/darkclose.svg';
import ETH from '../../Assets/Coins/ETH.png';
import ADA from '../../Assets/Coins/ADA.png';
import SwapVerticalIcon from '../../Assets/SwapVerticalIcon.svg';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { useNavigate } from 'react-router-dom';
import { UniswapHelper } from '../../helpers/uniswap.helper';
import { useEffect } from 'react';
import { useState } from 'react';
import { Web3Helper } from '../../helpers/web3.helper';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { FETCH_COINS } from '../../config/uniswap.config';
import { store } from '../..';
import { setLoading as externalLoading } from '../../actions/loading';
import { Loader } from '../../Components/Loader/Loader';
import { ClipLoader } from 'react-spinners';
import { useRef } from 'react';
import { PancakeHelper } from '../../helpers/pancake.helper';
import { SLIPPAGE_TOLERANCE } from '../../config/pancake.config';
import { Percent } from '@pancakeswap-libs/sdk';
import { ethers } from 'ethers';
import 'react-tabs/style/react-tabs.css';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import CrossChain from '../CrossChain/CrossChain';
import { FETCH_IMAGES } from '../../config/api.config';
import { DURATION } from '../../config/message.config';
import BigNumber from 'bignumber.js';
import { balanceToFiatConversion } from '../../helpers/conversion.helper';

function getFlooredFixed(v, d) {
  return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
}

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

function PancakeSwap() {
  const { chain, account, currency } = useSelector((state) => state);
  let timeOutId = useRef();
  const web3Helper = useRef(new Web3Helper(chain.rpcUrl));
  const pancakeHelper = useRef(
    new PancakeHelper(parseInt(chain.chainId), chain.rpcUrl)
  );
  const { theme } = useSelector((state) => state);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token1, setToken1] = useState(null);
  const [token2, setToken2] = useState(null);
  const [balance, setBalance] = useState(0);
  const [balance2, setBalance2] = useState(0);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [amount2, setAmount2] = useState(null);
  const [amount, setAount] = useState(null);
  const [route, setRoute] = useState(null);
  const [selected, setSelected] = useState(0);
  const [sel, setSel] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  const [open, setOpen] = useState(false);
  const [allToken, setAllTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [keyword, setKeyword] = useState(null);
  const [show, setShow] = useState(true);

  const updateRef = useRef(true);

  const [percent, setPercent] = useState(null);

  const calculateAccordingly = async (percentage) => {
    if (token1.tokenAddress) {
      const amountToSend = parseFloat(balance) * (percentage / 100);
      setAount(amountToSend.toFixed(token1.decimals));
    } else {
      if (chain.isEVM) {
        store.dispatch(externalLoading(true));

        const web3Helper = new Web3Helper(chain.rpcUrl);

        const address = account.address; // Replace with the user's wallet address
        // console.log(
        //   '🚀 ~ file: SendCoins.jsx:187 ~ onClick={ ~ address:',
        //   address
        // );
        const balance = await web3Helper.web3.eth.getBalance(address);
        // console.log(
        //   '🚀 ~ file: SendCoins.jsx:191 ~ onClick={ ~ balance:',
        //   balance
        // );

        const amountToSend = new BigNumber(balance)
          .times(percentage)
          .integerValue(BigNumber.ROUND_DOWN)
          .div(100);
        // console.log(
        //   '🚀 ~ file: SendCoins.jsx:145 ~ amountToSend:',
        //   amountToSend
        // );

        // Get the current gas price
        const gasPrice = await web3Helper.web3.eth.getGasPrice();
        // console.log('🚀 ~ file: SendCoins.jsx:200 ~ gasPrice:', gasPrice);

        if (!gasPrice) {
          store.dispatch(externalLoading(false));
          return messageApi.error('Unable to fetch gas price at the moment.');
        }

        // Estimate the gas cost for a sample transaction
        const gasLimit = 21000; // Assuming a standard transaction
        // console.log('🚀 ~ file: SendCoins.jsx:212 ~ gasLimit:', gasLimit);
        const gasCost = new BigNumber(gasPrice).times(gasLimit);
        // console.log(
        //   '🚀 ~ file: SendCoins.jsx:216 ~ gasCost:',
        //   gasCost.toString()
        // );

        // Apply the buffer factor to the gas cost
        const bufferedGasCost = gasCost.times(2.5);
        // console.log(
        //   '🚀 ~ file: SendCoins.jsx:222 ~ bufferedGasCost:',
        //   bufferedGasCost.toString()
        // );

        // Subtract the buffered gas cost from the maximum BNB
        const maxBNBAfterGas = new BigNumber(amountToSend).minus(
          bufferedGasCost
        );
        // console.log(
        //   '🚀 ~ file: SendCoins.jsx:228 ~ maxBNBAfterGas:',
        //   maxBNBAfterGas.toString()
        // );

        if (maxBNBAfterGas.isNegative()) {
          store.dispatch(externalLoading(false));
          return messageApi.error('Insufficient balance to cover gas fee.');
        }

        // console.log(
        //   `Max BNB after deducting gas fee (with buffer): ${web3Helper.web3.utils.fromWei(
        //     maxBNBAfterGas.integerValue(BigNumber.ROUND_DOWN).toString(),
        //     'ether'
        //   )}`
        // );

        setAount(
          web3Helper.web3.utils.fromWei(
            maxBNBAfterGas.integerValue(BigNumber.ROUND_DOWN).toString(),
            'ether'
          )
        );
        store.dispatch(externalLoading(false));
      }
    }
  };

  const init = async () => {
    try {
      const { data } = await axios.get(
        `${FETCH_COINS}${chain.chainId}&fiat_currency=${currency.name}`
      );
      const tokens = data.data.map((token) => {
        const findIfIHave = account.tokens[chain.chainId].find(
          (el) =>
            el.symbol.toUpperCase() === token.coin_symbol.toUpperCase() &&
            el.status
        );

        return {
          id: token.id,
          symbol: token.coin_symbol.toUpperCase(),
          iHave: findIfIHave ? true : false,
          name: token.coin_name,
          tokenAddress: token.token_address,
          image: token.coin_image
            ? `${FETCH_IMAGES}${token.coin_image}`
            : token.coin_image,
          address: account.address,
          decimals: parseInt(token.decimals.toString().length) - 1,
          isToken: token.token_address ? true : false,
          price: token.coins_market
            ? token.coins_market.current_price
              ? token.coins_market.current_price
              : 0
            : 0,
        };
      });

      setAllTokens(tokens);
      setFilteredTokens(tokens);

      let { cakeToken1 } = await chrome.storage.local.get('cakeToken1');
      let { cakeToken2 } = await chrome.storage.local.get('cakeToken2');

      if (!cakeToken1 && !cakeToken2) {
        const myToken1 = tokens.find((token) => !token.tokenAddress);
        const myToken2 = tokens.find(
          (token) => token.tokenAddress && token.symbol === 'EGC'
        );

        const balance = await web3Helper.current.getCoinBalance(
          account.address
        );
        const tokenBalance = await web3Helper.current.getTokenBalance(
          account.address,
          myToken2.tokenAddress
        );

        setBalance(balance);
        setBalance2(tokenBalance);
        setAvailableTokens(tokens);
        setToken1(myToken1);
        setToken2(myToken2);
      } else {
        cakeToken1 = tokens.find((el) => el.id == cakeToken1.id);
        cakeToken2 = tokens.find((el) => el.id == cakeToken2.id);

        if (cakeToken1.tokenAddress) {
          const tokenBalance = await web3Helper.current.getTokenBalance(
            account.address,
            cakeToken1.tokenAddress
          );
          setBalance(tokenBalance);
        } else {
          const balance = await web3Helper.current.getCoinBalance(
            account.address
          );
          setBalance(balance);
        }

        if (cakeToken2.tokenAddress) {
          const tokenBalance = await web3Helper.current.getTokenBalance(
            account.address,
            cakeToken2.tokenAddress
          );
          setBalance2(tokenBalance);
        } else {
          const balance = await web3Helper.current.getCoinBalance(
            account.address
          );
          setBalance2(balance);
        }

        setAvailableTokens(tokens);
        setToken1(cakeToken1);
        setToken2(cakeToken2);
      }
    } catch (error) {
      // console.log(error);
      messageApi.error(
        'Unable to perform swap currently. Please try again later.'
      );
      navigate(-1);
    }
  };
  useEffect(() => {
    // init();
  }, []);

  const handleTokensSwapChangePosition = async () => {
    if (token1 && token2) {
      await handleToken1Change(token1);
      await handleToken2Change(token2);
    }
  };

  useEffect(() => {
    // console.log(useRef, 'useRef');
    handleTokensSwapChangePosition();
    if (amount) {
      if (timeOutId.current) {
        clearTimeout(timeOutId);
      }
      timeOutId.current = setTimeout(async () => {
        await handleInputChange();
      }, 800);
    }
  }, [token1, amount, token2]);

  if (!token1 || !token2 || availableTokens.length === 0) {
    return (
      <div className={`scrollableCont`}>
        {contextHolder}
        <MenuRestofHeaders backTo={'/wallet'} title={'Swap'} />
        <div className={`flexedContent`}>
          <Loader
            text={'Please wait while we load your tokens for swapping.'}
          />
        </div>
      </div>
    );
  }

  const handleToken1Change = async (updatedToken1) => {
    await chrome.storage.local.set({
      cakeToken1: updatedToken1,
    });

    if (updatedToken1.tokenAddress) {
      const balance = await web3Helper.current.getTokenBalance(
        account.address,
        updatedToken1.tokenAddress
      );
      setBalance(balance);
      if (updatedToken1.id != token1.id) {
        setAmount2(null);
        setAount(null);
        setPercent(null);
        updateRef.current = false;
      }
    } else {
      const balance = await web3Helper.current.getCoinBalance(account.address);
      setBalance(balance);
      if (updatedToken1.id != token1.id) {
        setAmount2(null);
        setAount(null);
        setPercent(null);
        updateRef.current = false;
      }
    }
  };

  const handleToken2Change = async (updatedToken2) => {
    await chrome.storage.local.set({
      cakeToken2: updatedToken2,
    });
    if (updatedToken2.tokenAddress) {
      const balance = await web3Helper.current.getTokenBalance(
        account.address,
        updatedToken2.tokenAddress
      );
      setBalance2(balance);
      if (updatedToken2.id != token2.id) {
        setAmount2(null);
        setAount(null);
        setPercent(null);
        updateRef.current = false;
      }
    } else {
      const balance = await web3Helper.current.getCoinBalance(account.address);
      setBalance2(balance);
      if (updatedToken2.id != token2.id) {
        setAmount2(null);
        setAount(null);
        setPercent(null);
        updateRef.current = false;
        // console.log(updateRef, 'second');
      }
    }
  };

  const handleInputChange = async () => {
    // console.log(updateRef.current, 'updateRef.current');
    if (updateRef.current) {
      if (amount > 0 && amount && token2) {
        if (token1.symbol === 'BNB' && token2.symbol === 'WBNB') {
          setAmount2(amount);
          return;
        } else if (token1.symbol === 'WBNB' && token2.symbol === 'BNB') {
          setAmount2(amount);
          return;
        }

        setLoading(true);
        const route = await pancakeHelper.current.getQuoteAndRoute(
          token1,
          token2,
          amount
        );

        if (!route) {
          setLoading(false);
          return messageApi.error('Unable to find route to perform the swap.');
        }

        setRoute(route);
        setFeeAmount(route.feeAmount);
        setAmount2(
          parseFloat(
            getFlooredFixed(
              parseFloat(route.outAmount) / Math.pow(10, token2.decimals),
              6
            )
          )
        );
        setLoading(false);
      }
    }
    updateRef.current = true;
  };

  const selectAfter = (
    <div className={'addonAfter'}>
      <span
        className={style.send__pasteText}
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
      <Select
        suffixIcon={<img src={DownArrowSuffix} />}
        onClick={() => {
          setSelected(1);
          setOpen(true);
        }}
        value={[
          {
            value: token1.id,
            label: (
              <span className="flexedItemSelect">
                <img
                  style={{
                    height: '30px',
                    width: '30px',
                    objectFit: 'contain',
                    position: 'relative',
                    borderRadius: '15px',
                  }}
                  src={token1?.image}
                />
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
                <img
                  style={{
                    height: '30px',
                    width: '30px',
                    objectFit: 'contain',
                    borderRadius: '15px',
                  }}
                  src={token1?.image}
                />
                {token1?.symbol}
              </span>
            ),
          },
        ]}
        style={{
          width: 100,
        }}
        open={false}
        onSelect={(value) => {
          setToken1(availableTokens.find((el) => el.id == value));
          handleToken1Change(availableTokens.find((el) => el.id == value));
        }}
        options={availableTokens
          .filter((token) => token.id != token2?.id)
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
    </div>
  );
  const selectAfterTo = (
    <div className={'addonAfter'}>
      <Select
        suffixIcon={<img src={DownArrowSuffix} />}
        style={{
          width: 100,
        }}
        open={false}
        onClick={() => {
          setSelected(2);
          setOpen(true);
        }}
        value={[
          {
            value: token2.id,
            label: (
              <span className="flexedItemSelect">
                <img
                  style={{
                    height: '30px',
                    width: '30px',
                    objectFit: 'contain',
                    position: 'relative',
                    borderRadius: '15px',
                  }}
                  src={token2?.image}
                />
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
                <img
                  style={{
                    height: '30px',
                    width: '30px',
                    objectFit: 'contain',
                    borderRadius: '15px',
                  }}
                  src={token2?.image}
                />
                {token2?.symbol}
              </span>
            ),
          },
        ]}
        onSelect={(value) => {
          setToken2(availableTokens.find((el) => el.id == value));
          handleToken2Change(availableTokens.find((el) => el.id == value));
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
    </div>
  );

  return (
    <div className={`scrollableCont`}>
      {contextHolder}

      <MenuRestofHeaders backTo={'/wallet'} title={'Swap'} />
      <div className={`flexedContent`}>
        <Tabs>
          <TabList
            style={{
              border: 'none',
              backgroundColor: '#fff',
              borderRadius: '30px',
              padding: '6px',
              marginBottom: '40px',
              display: 'flex',
              justifyContent: 'space-evenly',
            }}
          >
            <Tab
              onClick={() => {
                setSel(0);
              }}
              style={{
                backgroundColor: sel === 0 ? '#4096ff' : 'transparent',
                border: 'none',
                color: sel === 0 ? 'aliceblue' : '#222',
                borderRadius: '30px',
                padding: '13px 30px',
                fontSize: '13px',
                flex: 1,
              }}
            >
              On-Chain
            </Tab>
            <Tab
              disabled={chain.testnet}
              onClick={() => {
                if (chain.testnet) {
                  return messageApi.error(
                    'Cross chain swapping is only available in mainnet.'
                  );
                }

                setSel(1);
              }}
              style={{
                backgroundColor: sel === 1 ? '#4096ff' : 'transparent',
                border: 'none',
                color: sel === 1 ? 'aliceblue' : '#222',
                borderRadius: '30px',
                padding: '13px 30px',
                marginLeft: '10px',
                fontSize: '13px',
                flex: 1,
              }}
            >
              Cross Chain
            </Tab>
          </TabList>

          <TabPanel>
            <div className={style.swap}>
              <InputField
                mb0={true}
                getData={(amount) => {
                  setAount(amount);
                }}
                checkForSymbols={true}
                inputSelect={true}
                placeholder={'0.0000'}
                label="You Pay"
                type={'number'}
                value={amount}
                addonAfter={selectAfter}
              />
              <div className={style.send__infoText}>
                <span
                  style={{
                    color: 'rgb(0, 174, 239)',
                    position: 'relative',
                    top: '-6px',
                  }}
                >
                  {' '}
                  Available Balance
                </span>{' '}
                <br></br>{' '}
                {addCommasToNumber(parseFloat(getFlooredFixed(balance, 6)))}{' '}
                {token1?.symbol} ~ {currency.symbol}
                {balanceToFiatConversion(token1.price, balance)}
              </div>
              {/* <div className={style.swap__icon}>
                <img
                  src={SwapVerticalIcon}
                  width={44}
                  height={44}
                  alt=''
                  onClick={() => {
                    setToken1(token2);
                    setToken2(token1);
                    setAmount2(null);
                  }}
                />
              </div> */}
              <InputField
                mb0={true}
                inputSelect={true}
                placeholder={'0.0000'}
                label="You Receive"
                readonly={true}
                type={'number'}
                value={amount2}
                checkForSymbols={true}
                getData={(amount) => {
                  setAmount2(amount);
                }}
                addonAfter={selectAfterTo}
              />
              <div className={style.send__infoText}>
                <span
                  style={{
                    color: 'rgb(0, 174, 239)',
                    position: 'relative',
                    top: '-6px',
                  }}
                >
                  {' '}
                  Available Balance{' '}
                </span>
                <br></br>{' '}
                {addCommasToNumber(parseFloat(getFlooredFixed(balance2, 6)))}{' '}
                {token2?.symbol} ~ {currency.symbol}
                {balanceToFiatConversion(token2.price, balance2)}
              </div>

              <div
                className="periods"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '15px',
                  marginTop: '15px',
                  justifyContent: 'space-evenly',
                }}
              >
                <div
                  className={percent == 25 ? style.boxActive : style.box}
                  onClick={() => {
                    setPercent(25);
                    calculateAccordingly(25);
                  }}
                >
                  25%
                </div>
                <div
                  className={percent == 50 ? style.boxActive : style.box}
                  onClick={() => {
                    setPercent(50);
                    calculateAccordingly(50);
                  }}
                >
                  50%
                </div>
                <div
                  className={percent == 75 ? style.boxActive : style.box}
                  onClick={() => {
                    setPercent(75);
                    calculateAccordingly(75);
                  }}
                >
                  75%
                </div>
                <div
                  className={percent == 100 ? style.boxActive : style.box}
                  onClick={() => {
                    setPercent(100);
                    calculateAccordingly(100);
                  }}
                >
                  100%
                </div>
              </div>
              {loading ? (
                <div className={style.swap__infoText}>
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

              <div style={{ marginTop: '50px' }}>
                <ButtonComp
                  onClick={() => {
                    if (
                      isNaN(parseFloat(amount)) ||
                      isNaN(parseFloat(amount2))
                    ) {
                      return messageApi.error(
                        'Please enter a valid amount to proceed.'
                      );
                    }

                    if (parseFloat(balance) < parseFloat(amount)) {
                      return messageApi.error(
                        'Insufficient balance to proceed with the transaction.'
                      );
                    }

                    navigate('/pancake-swapDetails', {
                      state: {
                        route,
                        token1,
                        token2,
                        amount,
                        amount2,
                        feeAmount,
                      },
                    });
                  }}
                  text={
                    token1.symbol === 'BNB' && token2.symbol === 'WBNB'
                      ? 'Wrap'
                      : token1.symbol === 'WBNB' && token2.symbol === 'BNB'
                      ? 'Unwrap'
                      : 'Swap'
                  }
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
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <CrossChain />
          </TabPanel>
        </Tabs>
      </div>

      <Drawer
        title="Select Token"
        placement="bottom"
        onClose={() => {
          setOpen(false);
        }}
        open={open}
        // eslint-disable-next-line jsx-a11y/alt-text
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
                placeholder={'Search coin'}
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
            {filteredTokens.length > 0 ? (
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
                .map((token) => (
                  <div
                    className={style.design}
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
                          token1.id == token.id || token2.id == token.id
                            ? 'transparent'
                            : 'transparent',
                        color:
                          token1.id == token.id || token2.id == token.id
                            ? '#000'
                            : '#000',
                      }}
                      onClick={() => {
                        // console.log('clicking on the token.......');

                        if (token1.id == token.id || token2.id == token.id) {
                          setOpen(false);
                        }

                        if (selected == 1) {
                          if (token2.id == token.id) {
                            return messageApi.error(
                              'You cannot select the same tokens on both sides. Please select a different token.'
                            );
                          }
                          setToken1(
                            availableTokens.find((el) => el.id == token.id)
                          );
                          handleToken1Change(
                            availableTokens.find((el) => el.id == token.id)
                          );
                        } else {
                          if (token1.id == token.id) {
                            return messageApi.error(
                              'You cannot select the same tokens on both sides. Please select a different token.'
                            );
                          }
                          setToken2(
                            availableTokens.find((el) => el.id == token.id)
                          );
                          handleToken2Change(
                            availableTokens.find((el) => el.id == token.id)
                          );
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
                          / BEP20
                        </span>
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <p
                className="noAddress"
                style={{
                  marginTop: '50%',
                  fontWeight: 'bold',
                  fontSize: '15px',
                }}
              >
                No assets found
              </p>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default PancakeSwap;
