/*global chrome*/
import React, { useEffect, useState } from 'react';
import './BalanceDetails.scss';
import SendIcon from '../../Assets/SendIcon.svg';
import RecieveIcon from '../../Assets/RecieveIcon.svg';
import SwapIcon from '../../Assets/SwapIcon.svg';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ModalCustom from '../ModalCustom/ModalCustom';
import CopyIconBlue from '../../Assets/CopyIconBlue.svg';
import JustLogo from '../../Assets/JustLogo.svg';
import InfoIcon from '../../Assets/InfoIcon.svg';
import PlusBordredIcon from '../../Assets/PlusBordredIcon.svg';
import SendIconWhite from '../../Assets/SendIconWhite.svg';
import RecieveIconWhite from '../../Assets/RecieveIconWhite.svg';
import BuyIconWhite from '../../Assets/other-buy.png';
import SwapIconWhite from '../../Assets/SwapIconWhite.svg';
import DarkSendIcon from '../../Assets/DarkSendIcon.svg';
import DarkRecieveIcon from '../../Assets/DarkRecieveIcon.svg';
import Darkotherbuy from '../../Assets/Darkotherbuy.svg';
import DarkSwapIcon from '../../Assets/DarkSwapIcon.svg';
import Buy from '../../Assets/buy-sell.png';
import { Dropdown, message } from 'antd';
import { WalletHelper } from '../../helpers/wallet.helper';
import { useSelector } from 'react-redux';
import { QRCode } from 'react-qrcode-logo';
import { store } from '../..';
import { Drawer } from 'antd';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import OpenDark from '../../Assets/open-dark.png';
import CloseDark from '../../Assets/close-dark.png';
import { DURATION } from '../../config/message.config';
import { setLoading } from '../../actions/loading';
import CoinsTable from '../CoinsTable/CoinsTable';
import BigNumber from 'bignumber.js';
import Logo from '../../Assets/Logo.png';

import {
  addCommasToNumber,
  formatSmallNumber,
  getFlooredFixed,
} from '../../helpers/conversion.helper';
import InputFieldSimple from '../InputField/InputFieldSimple';
import darkclose from '../../Assets/darkclose.svg';
import DarkLogo from '../../Assets/DarkLogo.svg';
import warning from '../../Assets/PNG/warning.png';
import ButtonComp from '../ButtonComp/ButtonComp';
import { setBalancesIn } from '../../actions/balance-off-out';
import { server } from '../../server';
import { SolanaHelper } from '../../helpers/solana.helper';

function BalanceDetails({ className, textLeft, mt0, coin }) {
  const { account, currency, chain, prices, tokens, theme, balanceIn } =
    useSelector((state) => {
      return state;
    });

  const [password, setPassword] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [chainItems, setChainItems] = useState([]);
  const [buySellM, setBuySellM] = useState({});
  const [isModalOpen5, setOpenmodal5] = useState(false);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const handleOk5 = () => {
    setOpenmodal5(false);
    setSessionPassword(null);
  };

  const handleCancel5 = () => {
    setPassword(null);
    setOpenmodal5(false);
  };

  useEffect(() => {
    checkMaintanance();
  }, []);

  const checkMaintanance = async () => {
    const { data } = await server.get('/wallet/check_app_maintenance', {
      headers: {
        Authorization: account.jwtToken,
      },
    });
    // console.log("BUYSELL MAINTANANCE ", data, data.data);

    let buySellCheck = data.data.filter((data) => data?.type == 'buy_sell');
    if (buySellCheck.length > 0) {
      setBuySellM(buySellCheck[0]);
    }
  };

  let firstPrice = 0;

  if (coin) {
    firstPrice = coin.coin_data.coins_market || 0;
  }

  const [open2, setOpen2] = useState(false);
  const onClose2 = () => {
    setOpen2(false);
  };

  const [total, setTotal] = useState(0.0);

  const calculateTotal = () => {
    let total = 0;

    tokens.forEach((token) => {
      const price = token.coin_data.coins_market || null;
      if (price) {
        const fiatValue =
          parseFloat(token.balance) * parseFloat(price.current_price);
        total += fiatValue;
      }
    });
    setTotal(total);
  };

  const navigate = useNavigate();

  const init = async () => {
    const { chains } = await chrome.storage.local.get('chains');

    const myItems = [
      {
        key: '0',
        type: 'group',
        label: 'EVM Chains',
        children: [],
      },
    ];

    chains
      .filter((el) => el.isEVM)
      .forEach((data, index) => {
        if (data.isEVM) {
          myItems[0].children.push({
            label: (
              <Link
                to='/'
                onClick={async (e) => {
                  e.preventDefault();
                  store.dispatch(setLoading(true));
                  await WalletHelper.setNetworkPreference(data.chainId);
                  store.dispatch(setLoading(false));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    height: '10px',
                    width: '10px',
                    background: data.chainId == chain.chainId ? '#fff' : '#fff',
                    borderRadius: '50%',
                  }}
                ></div>
                <img
                  src={data.image}
                  alt=''
                  style={{
                    height: '30px',
                    width: '30px',
                    objectFit: 'contain',
                    marginRight: '8px',
                    marginLeft: '8px',
                  }}
                />
                {data.chainName}
              </Link>
            ),
            key: index,
          });
        } else {
          myItems[1].children.push({
            label: (
              <Link
                to='/'
                onClick={async (e) => {
                  e.preventDefault();
                  store.dispatch(setLoading(true));
                  await WalletHelper.setNetworkPreference(data.chainId);
                  store.dispatch(setLoading(false));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    height: '10px',
                    width: '10px',
                    background:
                      data.chainId == chain.chainId ? 'green' : '#fff',
                    borderRadius: '50%',
                  }}
                ></div>
                <img
                  src={data.image}
                  alt=''
                  style={{
                    height: '30px',
                    width: '30px',
                    objectFit: 'contain',
                    marginRight: '8px',
                    marginLeft: '8px',
                  }}
                />
                {data.chainName}
              </Link>
            ),
            key: index,
          });
        }
      });

    const isSidePanelOpen = await chrome.storage.local.get('openSidePanel');
    setIsSidePanelOpen(isSidePanelOpen.openSidePanel);
    setChainItems(myItems);
  };

  useEffect(() => {
    calculateTotal();
    init();
    if (coin) {
      try {
        // Convert the numbers to BigNumber instances
        const myPrice = new BigNumber(
          firstPrice ? firstPrice.current_price : 0
        );
        const balance = new BigNumber(coin.balance);

        // Perform the multiplication
        const result = myPrice.times(balance);

        // Get the result as a string with the desired precision
        const formattedResult = getFlooredFixed(result.toString(), 2);

        // console.log(formattedResult, "formattedResult"); // Output: "0.21"
        setFiatValue(formattedResult);
      } catch (error) {
        console.log(error, 'error');
      }
    }
  }, [tokens]);

  const checkIfAvailableAndSendIt = async (type) => {
    store.dispatch(setLoading(true));

    let provider = [];

    switch (type) {
      case 'BUY':
        if (coin.coin_data.on_off_ramp_coin_data.is_transak == 1) {
          const check =
            type === 'BUY'
              ? coin.coin_data.on_off_ramp_coin_data.buy_transak_country
                  ?.split(',')
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : coin.coin_data.on_off_ramp_coin_data.sell_transak_country
                  ?.split(',')
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push('TRANSAK');
          }
        }
        if (coin.coin_data.on_off_ramp_coin_data.is_mercuryo == 1) {
          const check =
            type === 'BUY'
              ? coin.coin_data.on_off_ramp_coin_data.buy_mercuryo_country
                  ?.split(',')
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : coin.coin_data.on_off_ramp_coin_data.sell_mercuryo_country
                  ?.split(',')
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push('MERCURYO');
          }
        }
        if (coin.coin_data.on_off_ramp_coin_data.is_alchemy == 1) {
          const check =
            type === 'BUY'
              ? coin.coin_data.on_off_ramp_coin_data.buy_alchemy_country
                  ?.split(',')
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : coin.coin_data.on_off_ramp_coin_data.sell_alchemy_country
                  ?.split(',')
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push('ALCHEMY');
          }
        }
        if (coin.coin_data.on_off_ramp_coin_data.is_simplex === 1) {
          const check =
            type === 'BUY'
              ? coin.coin_data.on_off_ramp_coin_data.buy_simplex_country
                  ?.split(',')
                  .map((el) => el.toUpperCase())
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : null;

          if (check) {
            provider.push('SIMPLEX');
          }
        }
        break;
      case 'SELL':
        if (coin.coin_data.on_off_ramp_coin_data.transak_sell == 1) {
          const check =
            type === 'BUY'
              ? coin.coin_data.on_off_ramp_coin_data.buy_transak_country
                  ?.split(',')
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : coin.coin_data.on_off_ramp_coin_data.sell_transak_country
                  ?.split(',')
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push('TRANSAK');
          }
        }
        if (coin.coin_data.on_off_ramp_coin_data.mercuryo_sell == 1) {
          const check =
            type === 'BUY'
              ? coin.coin_data.on_off_ramp_coin_data.buy_mercuryo_country
                  ?.split(',')
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : coin.coin_data.on_off_ramp_coin_data.sell_mercuryo_country
                  ?.split(',')
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push('MERCURYO');
          }
        }
        if (coin.coin_data.on_off_ramp_coin_data.alchemy_sell == 1) {
          const check =
            type === 'BUY'
              ? coin.coin_data.on_off_ramp_coin_data.buy_alchemy_country
                  ?.split(',')
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : coin.coin_data.on_off_ramp_coin_data.sell_alchemy_country
                  ?.split(',')
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push('ALCHEMY');
          }
        }
        break;

      default:
        break;
    }

    const newCoin = {
      id: coin.coin_id,
      provider,
      coinIcon: coin.coin_data.coin_image
        ? process.env.REACT_APP_IMAGE_BASE_URL + `${coin.coin_data.coin_image}`
        : null,
      coinName: coin.coin_symbol,
      coinSubName: coin.coin_name,
      coin_family: coin.coin_family,
      type:
        coin.coin_data.coin_symbol === 'bnb'
          ? 'BEP20'
          : coin.coin_data.token_address
          ? coin.coin_data.token_type
          : '',
      coinPrice: addCommasToNumber(
        coin.coin_data.coins_market.current_price.toFixed(2)
      ),
      coinStatus: getFlooredFixed(
        coin.coin_data.coins_market
          ? parseFloat(
              coin.coin_data.coins_market.price_change_percentage_24h || 0
            ).toLocaleString()
          : 0,
        2
      ),
      simplexCoinSymbol:
        coin.coin_data.on_off_ramp_coin_data.simplex_coin_symbol,
      currCryptoBal: ``,
      currDollerBal: ``,
      coinFamily: parseInt(coin.coin_family),
      currencyTransk:
        type === 'BUY'
          ? coin.coin_data.on_off_ramp_coin_data.buy_transak_country
              ?.split(',')
              .includes(currency.name.toUpperCase())
            ? currency.name.toUpperCase()
            : null
          : coin.coin_data.on_off_ramp_coin_data.sell_transak_country
              ?.split(',')
              .includes(currency.name.toUpperCase())
          ? currency.name.toUpperCase()
          : null,

      currencyMercuryo:
        type === 'BUY'
          ? coin.coin_data.on_off_ramp_coin_data.buy_mercuryo_country
              ?.split(',')
              .includes(currency.name.toUpperCase())
            ? currency.name.toUpperCase()
            : null
          : coin.coin_data.on_off_ramp_coin_data.sell_mercuryo_country
              ?.split(',')
              .includes(currency.name.toUpperCase())
          ? currency.name.toUpperCase()
          : null,

      currencySimplex:
        type === 'BUY'
          ? coin.coin_data.on_off_ramp_coin_data.buy_simplex_country
              ?.split(',')
              .map((el) => el.toUpperCase())
              .includes(currency.name.toUpperCase())
            ? currency.name.toUpperCase()
            : null
          : null,

      currencyAlchemy:
        type === 'BUY'
          ? coin.coin_data.on_off_ramp_coin_data.buy_alchemy_country
              ?.split(',')
              .includes(currency.name.toUpperCase())
            ? currency.name.toUpperCase()
            : null
          : coin.coin_data.on_off_ramp_coin_data.sell_alchemy_country
              ?.split(',')
              .includes(currency.name.toUpperCase())
          ? currency.name.toUpperCase()
          : null,
    };

    // console.log(newCoin, "newCoin");

    store.dispatch(setLoading(false));
    return newCoin;
  };

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [fiatValue, setFiatValue] = useState(0.0);
  const getLocation = useLocation();

  const path = getLocation.pathname.replace('/', '');
  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleOk1 = () => {
    setIsModalOpen1(false);
  };
  const handleCancel1 = () => {
    setIsModalOpen1(false);
    setPassword(null);
  };

  const handleOk2 = () => {
    setIsModalOpen2(false);
  };
  const handleCancel2 = () => {
    setIsModalOpen2(false);
    setPassword(null);
  };
  const items = !account.isWatchOnly
    ? [
        {
          label: <Link to='/editWalletName'>Edit</Link>,
          key: '0',
        },
        {
          type: 'divider',
        },
        {
          label: (
            <Link
              to='/currencyPreference'
              onClick={(e) => {
                e.preventDefault();
                setIsModalOpen1(true);
              }}
            >
              Show Secret Phrase
            </Link>
          ),
          key: '1',
        },
        {
          type: 'divider',
        },
        {
          label: (
            <Link
              to='/currencyPreference'
              onClick={(e) => {
                e.preventDefault();
                navigate('/currencyPreference', {
                  state: {
                    backTo: '/wallet',
                  },
                });
              }}
            >
              Set Currency
            </Link>
          ),
          key: '2',
        },
      ]
    : [
        {
          label: <Link to='/editWalletName'>Edit</Link>,
          key: '0',
        },
        {
          type: 'divider',
        },
        {
          label: (
            <Link
              to='/currencyPreference'
              onClick={(e) => {
                e.preventDefault();
                navigate('/currencyPreference', {
                  state: {
                    backTo: '/wallet',
                  },
                });
              }}
            >
              Set Currency
            </Link>
          ),
          key: '2',
        },
      ];

  return (
    <div
      className={`${'balanceDetails'} ${mt0 ? mt0 : ''}`}
      style={{ position: 'relative' }}
    >
      {contextHolder}
      {path !== 'currencyDetails' ? (
        isSidePanelOpen ? (
          <svg
            viewBox='0 0 24 24'
            width='21'
            height='21'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            style={{
              position: 'absolute',
              right: '25px',
              top: '15px',
              cursor: 'pointer',
            }}
            onClick={async () => {
              chrome.runtime.sendMessage({
                type: 'CLOSE_SIDE_PANEL',
              });
              await chrome.storage.local.set({ openSidePanel: false });
              setIsSidePanelOpen(false);
              window.close();
            }}
          >
            <g id='SVGRepo_bgCarrier' stroke-width='0'></g>
            <g
              id='SVGRepo_tracerCarrier'
              stroke-linecap='round'
              stroke-linejoin='round'
            ></g>
            <g id='SVGRepo_iconCarrier'>
              {' '}
              <path
                d='M14 10L21 3M21 3H16.5M21 3V7.5M10 14L3 21M3 21H7.5M3 21L3 16.5'
                stroke='#fff'
                stroke-width='2'
                stroke-linecap='round'
                stroke-linejoin='round'
              ></path>{' '}
            </g>
          </svg>
        ) : (
          <svg
            width='21'
            height='21'
            viewBox='0 0 16 16'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            style={{
              position: 'absolute',
              right: '25px',
              top: '15px',
              cursor: 'pointer',
            }}
            onClick={async () => {
              chrome.runtime.sendMessage({
                type: 'OPEN_SIDE_PANEL',
              });
              let queryOptions = {
                active: true,
                lastFocusedWindow: true,
              };
              let [tab] = await chrome.tabs.query(queryOptions);
              chrome.sidePanel.open({ windowId: tab.windowId });
              await chrome.storage.local.set({ openSidePanel: true });
              setIsSidePanelOpen(true);
              window.close();
            }}
          >
            <path
              d='M10 2V14M12.6667 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V3.33333C14 2.97971 13.8595 2.64057 13.6095 2.39052C13.3594 2.14048 13.0203 2 12.6667 2Z'
              stroke='#fff'
              stroke-width='1.33333'
              stroke-linecap='round'
              stroke-linejoin='round'
            />
          </svg>
        )
      ) : null}

      <div
        className={
          path !== 'currencyDetails'
            ? chain.supportTokens
              ? 'balanceDetails__decoratedSec'
              : 'balanceDetails__decoratedSecWithoutAddTokens'
            : 'balanceDetails__cardCurrencyDetails'
        }
      >
        {path !== 'currencyDetails' ? (
          <>
            {' '}
            <img
              src={JustLogo}
              style={{
                height: '25px',
                objectFit: 'contain',
              }}
            />
            <div className={'balanceDetails__dropdownStyle'}>
              <p>{account.name}</p>
              <Dropdown menu={{ items }} trigger={['click']}>
                <Link onClick={(e) => e.preventDefault()}>
                  <img src={InfoIcon} />
                </Link>
              </Dropdown>
            </div>
          </>
        ) : null}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              path === 'currencyDetails' ? 'flex-start' : 'center',
          }}
        >
          <h3
            className={`${'balanceDetails__title'} ${textLeft ? textLeft : ''}`}
            style={{
              maxWidth: '290px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {coin
              ? `${addCommasToNumber(
                  getFlooredFixed(coin.balance, 5)
                )} ${coin.coin_data.coin_symbol.toUpperCase()}`
              : balanceIn
              ? `${currency.symbol}${addCommasToNumber(
                  getFlooredFixed(total, 2)
                )}`
              : '****'}
          </h3>

          {path !== 'currencyDetails' ? (
            balanceIn ? (
              <img
                src={OpenDark}
                alt=''
                onClick={async () => {
                  await chrome.storage.local.set({
                    balanceIn: false,
                  });
                  await WalletHelper.updateBalanceInShow(false, account.id);
                  store.dispatch(setBalancesIn(false));
                }}
                style={{
                  width: '17px',
                  marginLeft: '9px',
                  position: 'relative',
                  top: '-7px',
                }}
              />
            ) : (
              <img
                src={CloseDark}
                alt=''
                onClick={async () => {
                  await chrome.storage.local.set({
                    balanceIn: true,
                  });
                  await WalletHelper.updateBalanceInShow(true, account.id);
                  store.dispatch(setBalancesIn(true));
                }}
                style={{
                  width: '17px',
                  marginLeft: '9px',
                  position: 'relative',
                  top: '-7px',
                }}
              />
            )
          ) : null}
        </div>

        {coin ? (
          <h5
            style={{
              fontSize: '14px',
              color: '#fff',
              padding: '0px',
              fontWeight: 'bold',
              position: 'relative',
              top: '-8px',
            }}
            className={`${'balanceDetails__title'} ${textLeft ? textLeft : ''}`}
          >
            {currency.symbol}
            {addCommasToNumber(fiatValue)}
          </h5>
        ) : null}

        {path !== 'currencyDetails' ? (
          chain.supportTokens ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Link
                to='/manage'
                onClick={(e) => {
                  e.preventDefault();
                  if (
                    account.isWatchOnly &&
                    account.coinFamilies.length === 1 &&
                    account.coinFamilies[0] == 2
                  ) {
                    return;
                  }
                  navigate('/manage');
                }}
                className={'balanceDetails__addTokensBTn'}
                style={
                  account.isWatchOnly &&
                  account.coinFamilies.length === 1 &&
                  account.coinFamilies[0] == 2
                    ? { filter: 'grayscale(1) blur(1px)' }
                    : {}
                }
              >
                <img src={PlusBordredIcon} width={20} height={20} />
                <span>Add Tokens</span>
              </Link>
              {account.isWatchOnly && (
                <Link
                  to='/watch-only-list'
                  className={'balanceDetails__addTokensBTn'}
                  style={
                    account.isWatchOnly &&
                    account.coinFamilies.length === 1 &&
                    account.coinFamilies[0] == 2
                      ? { filter: 'grayscale(1) blur(1px)', marginLeft: '10px' }
                      : {
                          marginLeft: '10px',
                        }
                  }
                >
                  <img src={PlusBordredIcon} width={20} height={20} />
                  <span>Add Chain</span>
                </Link>
              )}
            </div>
          ) : null
        ) : null}
      </div>
      <div
        className={`${'balanceDetails__itemsOuter'} ${
          className ? className : ''
        }`}
        style={
          coin
            ? { justifyContent: 'center' }
            : { justifyContent: 'space-between' }
        }
      >
        {!coin ? (
          <Link
            to='/send'
            onClick={(e) => {
              e.preventDefault();
              if (account.isWatchOnly) {
                return;
              }
              navigate('/send');
            }}
            style={
              account.isWatchOnly ? { filter: 'grayscale(1) blur(1px)' } : {}
            }
            className={
              path === 'currencyDetails'
                ? 'balanceDetails__items__whiteText'
                : 'balanceDetails__items'
            }
          >
            <div className={'balanceDetails__items__img'}>
              {path === 'currencyDetails' ? (
                <img src={SendIconWhite} height={24} width={24} />
              ) : theme === 'darkTheme' ? (
                <img src={DarkSendIcon} />
              ) : (
                <img src={SendIcon} height={24} width={24} />
              )}
            </div>
            <span>Send</span>
          </Link>
        ) : (
          <Link
            to='/sendCurrency'
            style={
              account.isWatchOnly ? { filter: 'grayscale(1) blur(1px)' } : {}
            }
            onClick={(e) => {
              e.preventDefault();
              if (account.isWatchOnly) {
                return;
              }

              if (parseFloat(coin.balance) <= 0) {
                return messageApi.error('Insufficient balance to proceed.');
              }

              navigate('/sendCurrency', {
                state: {
                  symbol: coin.symbol,
                  image: coin.name,
                  type: '',
                  coin: coin,
                  redirectTo: '/currencyDetails',
                },
              });
            }}
            className={
              path === 'currencyDetails'
                ? 'balanceDetails__items__whiteText'
                : 'balanceDetails__items'
            }
          >
            <div className={'balanceDetails__items__img'}>
              {path === 'currencyDetails' ? (
                <img src={SendIconWhite} height={24} width={24} />
              ) : theme === 'darkTheme' ? (
                <img src={DarkSendIcon} />
              ) : (
                <img src={SendIcon} height={24} width={24} />
              )}
            </div>
            <span>Send</span>
          </Link>
        )}

        <Link
          onClick={(e) => {
            e.preventDefault();
            path === 'currencyDetails'
              ? showModal()
              : navigate('/receive-tokens');
          }}
          to='#'
          className={
            path === 'currencyDetails'
              ? 'balanceDetails__items__whiteText'
              : 'balanceDetails__items'
          }
        >
          <div className={'balanceDetails__items__img'}>
            {path === 'currencyDetails' ? (
              <img src={RecieveIconWhite} height={24} width={24} />
            ) : theme === 'darkTheme' ? (
              <img src={DarkRecieveIcon} />
            ) : (
              <img src={RecieveIcon} height={24} width={24} />
            )}
          </div>
          <span>Receive</span>
        </Link>

        {!coin ? (
          <Link
            to='/buy-coins'
            onClick={(e) => {
              e.preventDefault();
              if (buySellM?.is_maintenance) {
                return messageApi.error('Buy/Sell is under maintenance.');
              }
              if (path === 'currencyDetails') {
                if (coin.coin_data.on_off_ramp_coin_data) {
                  return setSelectedCoin(coin.coin_data.on_off_ramp_coin_data);
                } else {
                  return messageApi.error('Coin not supported.');
                }
              } else {
                return navigate('/buy-coins');
              }
            }}
            className={
              path === 'currencyDetails'
                ? 'balanceDetails__items__whiteText'
                : 'balanceDetails__items'
            }
          >
            <div className={'balanceDetails__items__img'}>
              {path === 'currencyDetails' ? (
                <img
                  src={BuyIconWhite}
                  height={24}
                  width={24}
                  style={{ filter: 'brightness(0) invert(1)' }}
                  alt=''
                />
              ) : theme === 'darkTheme' ? (
                <img src={Darkotherbuy} />
              ) : (
                <img src={Buy} height={24} width={24} />
              )}
            </div>
            <span>{account.isWatchOnly ? 'Buy' : 'Buy/Sell'} </span>
          </Link>
        ) : coin.coin_data.on_off_ramp_coin_data ? (
          <Link
            to='/buy-coins'
            onClick={(e) => {
              e.preventDefault();
              if (buySellM?.is_maintenance) {
                return messageApi.error('Buy/Sell is under maintenance.');
              }
              if (path === 'currencyDetails') {
                // if (coin.coin_data.on_off_ramp_coin_data) {
                return setSelectedCoin(coin.coin_data.on_off_ramp_coin_data);
                // } else {
                //   return messageApi.error("Coin not supported.");
                // }
              } else {
                return navigate('/buy-coins');
              }
            }}
            className={
              path === 'currencyDetails'
                ? 'balanceDetails__items__whiteText'
                : 'balanceDetails__items'
            }
          >
            <div className={'balanceDetails__items__img'}>
              {path === 'currencyDetails' ? (
                <img
                  src={BuyIconWhite}
                  height={24}
                  width={24}
                  style={{ filter: 'brightness(0) invert(1)' }}
                  alt=''
                />
              ) : theme === 'darkTheme' ? (
                <img src={Darkotherbuy} />
              ) : (
                <img src={Buy} height={24} width={24} />
              )}
            </div>
            <span>{account.isWatchOnly ? 'Buy' : 'Buy/Sell'} </span>
          </Link>
        ) : null}

        {/* {console.log("coin:::::", coin, "chain:::::::::", chain)} */}

        {/* Chnages started here*************************************** */}

        {!coin ? (
          chain.swap ? (
            <Link
              style={
                account.isWatchOnly ? { filter: 'grayscale(1) blur(1px)' } : {}
              }
              to='/swap'
              onClick={(e) => {
                e.preventDefault();
                if (account.isWatchOnly) {
                  return;
                }
                navigate('/swap');
              }}
              className={
                path === 'currencyDetails'
                  ? 'balanceDetails__items__whiteText'
                  : 'balanceDetails__items'
              }
            >
              <div className={'balanceDetails__items__img'}>
                {path === 'currencyDetails' ? (
                  <img src={SwapIconWhite} height={24} width={24} />
                ) : theme === 'darkTheme' ? (
                  <img src={DarkSwapIcon} />
                ) : (
                  <img src={SwapIcon} height={24} width={24} />
                )}
              </div>
              <span>Swap</span>
            </Link>
          ) : (
            <Link
              style={
                account.isWatchOnly ? { filter: 'grayscale(1) blur(1px)' } : {}
              }
              to='/swap'
              onClick={(e) => {
                e.preventDefault();
                if (account.isWatchOnly) {
                  return;
                }
                navigate('/swap');
              }}
              className={
                path === 'currencyDetails'
                  ? 'balanceDetails__items__whiteText'
                  : 'balanceDetails__items'
              }
            >
              <div className={'balanceDetails__items__img'}>
                {path === 'currencyDetails' ? (
                  <img src={SwapIconWhite} height={24} width={24} />
                ) : theme === 'darkTheme' ? (
                  <img src={DarkSwapIcon} />
                ) : (
                  <img src={SwapIcon} height={24} width={24} />
                )}
              </div>
              <span>Swap</span>
            </Link>
          )
        ) : coin.coin_data.allow_swap == '1' ? (
          <>
            {/* {console.log("if is runnnig: swap::::::::::", coin.coin_data)} */}
            <Link
              style={
                account.isWatchOnly ? { filter: 'grayscale(1) blur(1px)' } : {}
              }
              to='/swap'
              onClick={(e) => {
                e.preventDefault();
                if (account.isWatchOnly) {
                  return;
                }
                navigate('/swap', {
                  state: {
                    tokenAddress: coin?.coin_data?.token_address,
                    fromOrTo: 1,
                    coinFamily: coin?.coin_data?.coin_family,
                  },
                });
              }}
              className={
                path === 'currencyDetails'
                  ? 'balanceDetails__items__whiteText'
                  : 'balanceDetails__items'
              }
            >
              <div className={'balanceDetails__items__img'}>
                {path === 'currencyDetails' ? (
                  <img src={SwapIconWhite} height={24} width={24} />
                ) : theme === 'darkTheme' ? (
                  <img src={DarkSwapIcon} />
                ) : (
                  <img src={SwapIcon} height={24} width={24} />
                )}
              </div>
              <span>Swap</span>
            </Link>
          </>
        ) : coin.coin_data.coin_name == 'Wrapped SOL' && coin.balance > 0 ? (
          <>
            <Link
              style={
                account.isWatchOnly ? { filter: 'grayscale(1) blur(1px)' } : {}
              }
              to='/swap'
              onClick={async (e) => {
                e.preventDefault();
                if (account.isWatchOnly) {
                  return;
                }
                setDeleteModal(true);
              }}
              className={
                path === 'currencyDetails'
                  ? 'balanceDetails__items__whiteText'
                  : 'balanceDetails__items'
              }
            >
              <div className={'balanceDetails__items__img'}>
                {path === 'currencyDetails' ? (
                  <img src={SwapIconWhite} height={24} width={24} />
                ) : theme === 'darkTheme' ? (
                  <img src={DarkSwapIcon} />
                ) : (
                  <img src={SwapIcon} height={24} width={24} />
                )}
              </div>
              <span>Unwrap</span>
            </Link>
          </>
        ) : null}
      </div>
      {coin ? (
        <ModalCustom
          isModalOpen={isModalOpen}
          handleOk={handleOk}
          handleCancel={handleCancel}
          customClass={'change'}
        >
          <div className={'balanceDetails__modal'}>
            <div>
              <div className={'balanceDetails__modal__scanner'}>
                <QRCode
                  value={coin.address}
                  size={230}
                  qrStyle='square'
                  eyeRadius={10}
                  logoImage={`${process.env.REACT_APP_IMAGE_BASE_URL}${coin.coin_data.coin_image}`}
                  logoHeight={55}
                  logoWidth={55}
                  logoPadding={8}
                  logoPaddingStyle='circle'
                  style={{
                    borderRadius: '20px',
                    padding: '15px',
                  }}
                />
              </div>
            </div>
            <p
              className='noAddress'
              style={{
                width: '100%',
                textAlign: 'center',
                marginBottom: '17px',
                fontSize: '15px',
                fontWeight: 'bold',
              }}
            >
              Address
            </p>
            <div
              className={'balanceDetails__modal__wrapedText'}
              onClick={async () => {
                await navigator.clipboard.writeText(coin.address);
                messageApi.success('Address copied successfully.');
              }}
            >
              <img src={CopyIconBlue} width={15} height={16} />
              <span>{coin.address}</span>
            </div>
          </div>
        </ModalCustom>
      ) : null}

      <Drawer
        // title={"Buy/Sell"}
        placement='bottom'
        title='Buy/Sell'
        onClose={() => setSelectedCoin(null)}
        height={287}
        open={selectedCoin}
        closeIcon={
          theme == 'darkTheme' ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
      >
        {selectedCoin ? (
          <CoinsTable
            dataArray={[
              {
                coinIcon: coin.coin_data.coin_image
                  ? process.env.REACT_APP_IMAGE_BASE_URL +
                    `${coin?.coin_data?.coin_image}`
                  : null,
                coinName: coin.coin_data.coin_symbol.toUpperCase(),
                coinSubName: coin.coin_data.coin_name,
                coinPrice: `${currency.symbol}${
                  parseFloat(coin.coin_data.coins_market.current_price)
                    ? formatSmallNumber(
                        coin.coin_data.coins_market.current_price
                      )
                    : '0.00'
                }`,
                coinStatus: getFlooredFixed(
                  coin.coin_data.coins_market
                    ? parseFloat(
                        coin.coin_data.coins_market
                          .price_change_percentage_24h || 0
                      ).toLocaleString()
                    : 0,
                  2
                ),
                currCryptoBal: ``,
                currDollerBal: ``,
                routeTo: 'no-where',
                type:
                  coin.coin_data.coin_symbol === 'bnb'
                    ? 'BEP20'
                    : coin.coin_data.token_address
                    ? coin.coin_data.token_type
                    : '',
                status: true,
                coin: coin,
                // showModal,
              },
            ]}
          />
        ) : null}

        <div
          className='buttons'
          style={{
            marginTop: selectedCoin ? '30px' : '0px',
            display: 'flex',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            top: '28px',
          }}
        >
          <div
            className='green'
            style={{
              padding: '12px 53px',
              backgroundColor: 'green',
              color: 'white',
              fontSize: '18px',
              borderRadius: '7px',
              marginRight: '10px',
              cursor: 'pointer',
            }}
            onClick={async () => {
              const myNew = await checkIfAvailableAndSendIt('BUY');

              if (myNew.provider.length === 0) {
                return messageApi.error(
                  'This coin is not supported for purchase.'
                );
              }
              return navigate('/enter-price', {
                state: {
                  type: 'BUY',
                  coin: myNew,
                  balanceDetail: coin,
                },
              });
            }}
          >
            Buy
          </div>
          {account.isWatchOnly ? null : (
            <div
              className='red'
              style={{
                padding: '12px 53px',
                backgroundColor: 'red',
                color: 'white',
                fontSize: '18px',
                borderRadius: '7px',
                marginLeft: '10px',
                cursor: 'pointer',
              }}
              onClick={async () => {
                const myNew = await checkIfAvailableAndSendIt('SELL');

                if (myNew.provider.length === 0) {
                  return messageApi.error('Coin not supported for sell.');
                }

                return navigate('/enter-price', {
                  state: {
                    type: 'SELL',
                    coin: myNew,
                    balanceDetail: coin,
                  },
                });
              }}
            >
              Sell
            </div>
          )}
        </div>
      </Drawer>

      <ModalCustom
        title={'Show Secret Phrase'}
        handleCancel={handleCancel1}
        isModalOpen={isModalOpen1}
        handleOk={handleOk1}
        customClass='customClassModal'
      >
        <div className={'viewphrases'}>
          <InputFieldSimple
            placeholder='Password'
            getData={setPassword}
            value={password}
            customFunction={async () => {
              await chrome.storage.session.set({
                password,
              });
              const response = await WalletHelper.getMnemonics(
                account.coinFamilyAndAddress[1]
              );
              if (!response) {
                return messageApi.error('Please enter a valid password.');
              }
              navigate('/showSecretPhrase', {
                state: {
                  mnemonics: response,
                  backTo: '/wallet',
                },
              });
            }}
          />
          <div className={'viewphrases__iInner'}>
            <img src={warning} />
            <div>
              <p>Do Not share your secret Phrase!</p>
              <p>These words can be used to steal all your funds.</p>
            </div>
          </div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              await chrome.storage.session.set({
                password,
              });
              const response = await WalletHelper.getMnemonics(
                account.coinFamilyAndAddress[1]
              );
              if (!response) {
                return messageApi.error('Please enter a valid password.');
              }
              navigate('/showSecretPhrase', {
                state: {
                  mnemonics: response,
                  backTo: '/wallet',
                },
              });
            }}
          />
        </div>
      </ModalCustom>

      <ModalCustom
        // title={"Show Secret Phrase"}
        handleCancel={handleCancel2}
        isModalOpen={isModalOpen2}
        handleOk={handleOk2}
        customClass='customClassModal'
      >
        <div className={'confirmationsModal'}>
          <div className={'iInner'}>
            {theme == 'darkTheme' ? (
              <img src={DarkLogo} />
            ) : (
              <img
                src={Logo}
                style={{
                  height: '100px',
                }}
              />
            )}
            <div>
              <p>
                Unwrap request of{' '}
                {addCommasToNumber(getFlooredFixed(coin.balance, 5))} WSOL has
                been processed successfully.
              </p>
            </div>
          </div>
          <ButtonComp
            text={'OK'}
            maxWidth={'100%'}
            onClick={() => {
              return navigate('/wallet');
            }}
          />
        </div>
      </ModalCustom>

      <ModalCustom
        title={'Unwrap WSOL'}
        isModalOpen={deleteModal}
        customClass='customClassModal'
        handleCancel={() => {
          setDeleteModal(false);
        }}
      >
        <div className='viewphrases'>
          <div className='viewphrases__iInner'>
            <p
              style={{
                fontSize: '20px',
              }}
            >
              Are you sure you want to unwrap WSOL?
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '30px',
            }}
          >
            <div
              className='green'
              style={{
                padding: '12px 53px',
                backgroundColor: 'green',
                color: 'white',
                fontSize: '18px',
                borderRadius: '7px',
                marginRight: '20px',
                cursor: 'pointer',
              }}
              onClick={async () => {
                setDeleteModal(false);
                setOpenmodal5(true);
              }}
            >
              Yes
            </div>
            <div
              className='red'
              style={{
                padding: '12px 53px',
                backgroundColor: 'red',
                color: 'white',
                fontSize: '18px',
                borderRadius: '7px',
                marginLeft: '20px',
                cursor: 'pointer',
              }}
              onClick={() => {
                setDeleteModal(false);
              }}
            >
              No
            </div>
          </div>
        </div>
      </ModalCustom>

      <ModalCustom
        title={'Confirm Transaction'}
        handleCancel={handleCancel5}
        isModalOpen={isModalOpen5}
        handleOk={handleOk5}
        customClass='customClassModal'
        closable={false}
      >
        <div className='viewphrases'>
          <div
            style={{
              marginBottom: '36px',
              width: '100%',
            }}
          >
            <InputFieldSimple
              placeholder='Password'
              getData={setSessionPassword}
              value={sessionPassword}
            />
          </div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              if (!sessionPassword) {
                return messageApi.error('Password is required.');
              }

              const { password } = await chrome.storage.session.get('password');
              if (password !== sessionPassword) {
                return messageApi.error('Password is incorrect.');
              }

              store.dispatch(setLoading(true));
              const solanaHelper = new SolanaHelper(
                process.env.REACT_APP_SOL_RPC
              );

              if (coin.balance == 0) {
                store.dispatch(setLoading(false));
                return messageApi.error('Insufficient balance to proceed.');
              }

              const result = await solanaHelper.unwrapSolana(
                coin.balance,
                coin.coin_id
              );

              if (!result) {
                store.dispatch(setLoading(false));
                return messageApi.error('Failed to unwrap SOL');
              }

              store.dispatch(setLoading(false));
              setOpenmodal5(false);
              setIsModalOpen2(true);
            }}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default BalanceDetails;
