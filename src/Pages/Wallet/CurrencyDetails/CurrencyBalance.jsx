/*global chrome*/
import React, { useEffect, useState } from 'react';
import NewSend from '../../../Assets/NewSend.svg';
import RecieveNew from '../../../Assets/RecieveNew.svg';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ModalCustom from '../../../Components/ModalCustom/ModalCustom';
import CopyIconBlue from '../../../Assets/CopyIconBlue.svg';
import { message, Select } from 'antd';
import { WalletHelper } from '../../../helpers/wallet.helper';
import { useSelector } from 'react-redux';
import { QRCode } from 'react-qrcode-logo';
import TradeNew from '../../../Assets/TradeNew.svg';
import OpenDark from '../../../Assets/open-dark.svg';
import CloseDark from '../../../Assets/close-dark.svg';
import { DURATION } from '../../../config/message.config';
import { setLoading } from '../../../actions/loading';
import BigNumber from 'bignumber.js';
import {
  addCommasToNumber,
  getFlooredFixed,
} from '../../../helpers/conversion.helper';
import '../../History/FilterHistory.scss';
import { setBalancesIn } from '../../../actions/balance-off-out';
import { store } from '../../..';
import { getCosmosAddress } from '../../../helpers/cosmos.helper';
import ButtonComp from '../../../Components/ButtonComp/ButtonComp';

function CurrencyBalanceDetails({
  className,
  textLeft,
  mt0,
  coin,
  crossChainDetail,
}) {
  const { account, currency, chain, tokens, balanceIn } = useSelector(
    (state) => {
      return state;
    }
  );

  const { state } = useLocation();
  const [accounts, setAccounts] = useState([]);
  const [cosmosAddress, setCosmosAddress] = useState('');
  const [selectChainModal, setSelectChainModal] = useState(false);
  const [selectChain, setSelectChain] = useState('evm');
  const [total, setTotal] = useState(0.0);
  const [chainItems, setChainItems] = useState([]);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fiatValue, setFiatValue] = useState(0.0);
  const getLocation = useLocation();

  const path = getLocation.pathname.replace('/', '');

  let firstPrice = 0;

  if (coin) {
    firstPrice = coin.coin.fiat_price_data || 0;
  }

  const fetchAccounts = async () => {
    const { accounts } = await chrome.storage.session.get('accounts');
    const items = accounts.flatMap((account, index) => {
      const accountItem = {
        label: (
          <Link
            to="/"
            onClick={async (e) => {
              // console.log('PASSWORD CURRENCY BALANCE :', state);
              e.preventDefault();
              await WalletHelper.setWalletPreference(account.id);
            }}
          >
            {account.name}
          </Link>
        ),
        key: `${index}`,
      };

      // Add a divider after each item except the last one
      if (index < accounts.length - 1) {
        return [accountItem, { type: 'divider' }];
      }

      return [accountItem];
    });

    setAccounts(items);
  };

  const calculateTotal = () => {
    let total = 0;

    tokens.forEach((token) => {
      const price = token.coin.fiat_price_data || null;
      if (price) {
        const fiatValue = parseFloat(token.balance) * parseFloat(price.value);
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
                to="/"
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
                  alt=""
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
                to="/"
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
                  alt=""
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
    getCosmosAddress()
      .then((data) => {
        // console.log('🚀 ~ useEffect ~ cosmos_address:', data);
        setCosmosAddress(data);
      })
      .catch((error) => {
        // console.log('error');
      });
    setIsSidePanelOpen(isSidePanelOpen.openSidePanel);
    setChainItems(myItems);
  };

  useEffect(() => {
    fetchAccounts();
    calculateTotal();
    init();
    if (coin) {
      try {
        const myPrice = new BigNumber(firstPrice ? firstPrice.value : 0);
        const balance = new BigNumber(coin.balance);
        const result = myPrice.times(balance);
        const formattedResult = getFlooredFixed(result.toString(), 2);
        setFiatValue(formattedResult);
      } catch (error) {
        // console.log('Error in currency balance', error);
      }
    }
  }, [tokens]);

  const showModal = () => {
    if(coin?.coin?.coin_family === 7){
      setSelectChainModal(!selectChainModal);
    }
    else{
      setIsModalOpen(true);
    }
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="balanceDetailsTop currencyBalance">
      <div
        className={`${'balanceDetails'} ${mt0 ? mt0 : ''}`}
        style={{ position: 'relative' }}
      >
        {contextHolder}

        {path !== 'currencyDetails' ? <></> : null}

        <div
          className={
            path !== 'currencyDetails'
              ? chain.supportTokens
                ? 'balanceDetails__decoratedSec'
                : 'balanceDetails__decoratedSecWithoutAddTokens'
              : 'balanceDetails__cardCurrencyDetails'
          }
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: path === 'currencyDetails' ? 'flex-start' : '',
            }}
          >
            <h3
              className={`${'balanceDetails__title'} ${
                textLeft ? textLeft : ''
              }`}
              style={{
                maxWidth: '290px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '0',
                fontSize: '28px',
                lineHeight: '28px',
              }}
            >
              {coin
                ? `${addCommasToNumber(
                    getFlooredFixed(coin.balance, 5)
                  )} ${coin.coin.coin_symbol.toUpperCase()}`
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
                  alt=""
                  onClick={async () => {
                    await chrome.storage.local.set({
                      balanceIn: false,
                    });
                    await WalletHelper.updateBalanceInShow(false, account.id);
                    store.dispatch(setBalancesIn(false));
                  }}
                  style={{
                    width: '25px',
                    marginLeft: '9px',
                    position: 'relative',
                  }}
                />
              ) : (
                <img
                  src={CloseDark}
                  alt=""
                  onClick={async () => {
                    await chrome.storage.local.set({
                      balanceIn: true,
                    });
                    await WalletHelper.updateBalanceInShow(true, account.id);
                    store.dispatch(setBalancesIn(true));
                  }}
                  style={{
                    width: '25px',
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
                lineHeight: '16px',
                padding: '10px 0',
              }}
              className={`${'balanceDetails__title'} ${
                textLeft ? textLeft : ''
              }`}
            >
              ≈ {currency.symbol}
              {addCommasToNumber(fiatValue)}
            </h5>
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
              to="/send"
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
                {/* {path === "currencyDetails" ? (
                  <img src={SendIconWhite} height={50} width={50} />
                ) : theme === "darkTheme" ? (
                  <img src={DarkSendIcon} />
                ) : (
                  <img src={SendIcon} height={50} width={50} />
                )} */}
                <img src={NewSend} height={50} width={50} />
              </div>
              <span>Send</span>
            </Link>
          ) : (
            <Link
              to="/sendCurrency"
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
                <img src={NewSend} height={50} width={50} />
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
            to="#"
            className={
              path === 'currencyDetails'
                ? 'balanceDetails__items__whiteText'
                : 'balanceDetails__items'
            }
          >
            <div className={'balanceDetails__items__img'}>
              <img src={RecieveNew} height={50} width={50} />
            </div>
            <span>Receive</span>
          </Link>

          {coin?.coin?.for_swap === 1 || crossChainDetail !== null ? (
            <Link
              onClick={(e) => {
                e.preventDefault();
                navigate('/swap', {
                  state: {
                    fromOrTo: 1,
                    coinFamily: coin?.coin?.coin_family,
                    coinId: coin?.coin?.coin_id,
                    isCrossChain: crossChainDetail !== null ? true : false,
                    isOnChain: coin?.coin?.for_swap === 1 ? true : false,
                  },
                });
              }}
              to="/swap"
              className={
                path === 'currencyDetails'
                  ? 'balanceDetails__items__whiteText'
                  : 'balanceDetails__items'
              }
            >
              <div className={'balanceDetails__items__img'}>
                <img src={TradeNew} height={50} width={50} />
              </div>
              <span>Trade</span>
            </Link>
          ) : null}
        </div>
        {coin ? (
          <ModalCustom
            isModalOpen={isModalOpen}
            handleOk={handleOk}
            handleCancel={handleCancel}
            customClass={'reciveModal'}
            isWhite={true}
          >
            <div className={'balanceDetails__modal'}>
              <div>
                <div className={'balanceDetails__modal__scanner'}>
                  <QRCode
                    value={
                      selectChain === 'evm'
                        ? coin.wallet_address
                        : cosmosAddress
                    }
                    size={230}
                    qrStyle="dots"
                    eyeRadius={10}
                    logoImage={coin.coin.coin_image}
                    logoHeight={55}
                    logoWidth={55}
                    logoPadding={8}
                    // fgColor="url(#conicGradient)"
                    logoPaddingStyle="circle"
                    style={{
                      borderRadius: '20px',
                      padding: '15px',
                    }}
                  />
                </div>
              </div>
              <p
                className="noAddress"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  marginBottom: '17px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  display: 'none',
                }}
              >
                Address
              </p>
              <div
                className={'balanceDetails__modal__wrapedText'}
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    selectChain === 'evm' ? coin.wallet_address : cosmosAddress
                  );
                  messageApi.success('Address copied successfully.');
                }}
              >
                <img src={CopyIconBlue} width={15} height={16} />
                <span>
                  {selectChain === 'evm' ? coin.wallet_address : cosmosAddress}
                </span>
              </div>
            </div>
          </ModalCustom>
        ) : null}

        <ModalCustom
          title={'Select Chain'}
          handleCancel={() => setSelectChainModal(!selectChainModal)}
          isModalOpen={selectChainModal}
          customClass="customClassModal"
        >
          <div className="viewphrases viewPhraseNew inputpaddingIssue ">
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
              />
            </div>

            <div style={{ marginTop: '10px' }}></div>
            <ButtonComp
              text={'Submit'}
              maxWidth={'100%'}
              onClick={async () => {
                setSelectChainModal(!selectChainModal);
                setIsModalOpen(true);
              }}
            />
          </div>
        </ModalCustom>
      </div>
    </div>
  );
}

export default CurrencyBalanceDetails;
