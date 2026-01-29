/*global chrome*/
import React, { useEffect, useState } from 'react';
import { Drawer, message, Radio, Select } from 'antd';
import BTC from '../../Assets/Coins/BTC.png';
import DownArrowSuffix from '../../Assets/DownArrowSuffix.svg';
import ETH from '../../Assets/Coins/ETH.png';
import ADA from '../../Assets/Coins/ADA.png';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import darkclose from '../../Assets/darkclose.svg';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import './AddPriceAlert.scss';
import { InputField } from '../../Components/InputField/InputFieldSimple';
import { InputFieldOnly } from '../../Components/InputField/InputFieldSimple.jsx';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { WalletHelper } from '../../helpers/wallet.helper';
import { ethers } from 'ethers';
import { setLoading } from '../../actions/loading';
import { store } from '../..';
import { DURATION } from '../../config/message.config';
import ButtonCompGray from '../../Components/ButtonCompGray/ButtonCompGray';
import { server } from '../../server';
import {
  addCommasToNumber,
  getFlooredFixed,
  toFixed,
} from '../../helpers/conversion.helper';

function AddPriceAlert() {
  const { chain, account, currency , loading } = useSelector((state) => state);
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState(null);
  const { state } = useLocation();
    // console.log(
    //   '🚀 ~ file: AddPriceAlert.jsx:34 ~ AddPriceAlert ~ state:',
    //   state
    // );

  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [price, setPrice] = useState(0);
  const [percentage, setPercentage] = useState();
  const [name, setName] = useState(state ? state.price : null);
  const [type, setType] = useState(state ? state.type.toLowerCase() : 'above');
  const [coin, setCoin] = useState(null);
  const { theme } = useSelector((state) => state);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const navigate = useNavigate();

  const init = async () => {
    try {
      store.dispatch(setLoading(true));
      const walletsList = await server.post(
        `/wallet/tokens`,
        {
          address_list: account.addressLists,
          coin_family: account.coinFamilies,
          fiat_currency: state?.currencyUsed?.toUpperCase() || currency.name,
          per_page: 2000,
          page: 1,
          search: keyword ? keyword.trim() : undefined,
          is_watch_only: account.isWatchOnly ? 1 : 0,
          wallet_name: account.name,
          address_list_array: Object.keys(account.coinFamilyAndAddress)
            .map((key) => {
              return {
                coin_family: key,
                address: account.coinFamilyAndAddress[key],
              };
            })
            .filter((el) => el.address),
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      const finalData = walletsList.data.data.filter(
        (token) => token.coin_data.coins_market
      );

      if (finalData.length > 0) {
        if (finalData.length > 0) {
          setTokens(finalData);
          const tokenToSet = state
            ? finalData.find((el) => el.coin_data.id == state.coinId)
            : finalData[0];

          setSelectedToken(tokenToSet);
          setPrice(
            finalData[0].coin_data.coins_market
              ? finalData[0].coin_data.coins_market.current_price
              : 0
          );

          if (!state) {
            setName(
              toFixed(
                finalData[0].coin_data.coins_market
                  ? finalData[0].coin_data.coins_market.current_price
                  : 0
              )
            );
          }

          setPercentage(
            finalData[0].coin_data.coins_market
              ? finalData[0].coin_data.coins_market.price_change_percentage_24h
                ? finalData[0].coin_data.coins_market
                    .price_change_percentage_24h
                : 0
              : 0
          );

          setCoin(tokenToSet);
        }
      } else {
        setTokens([]);
      }

      store.dispatch(setLoading(false));
    } catch (error) {
      store.dispatch(setLoading(false));

      // console.log(error);
    }
  };

  useEffect(() => {
    let debounceTimer;

    const handleDebouncedSearch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        init();
      }, 2000);
    };

    if (keyword) {
      handleDebouncedSearch();
    } else {
      init();
    }

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);
  const selectAfterTo = (
    <div className={'addonAfter'}>
      <Select
        open={false}
        onClick={() => {
          setOpen(state ? false : true);
        }}
        disabled={state ? true : false}
        value={[
          {
            value: selectedToken?.coin_data.id,
            label: (
              <span className='flexedItemSelect'>
                {!selectedToken?.coin_data.coin_image ? (
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
                    {selectedToken?.coin_data.coin_name.split('')[0]}
                  </div>
                ) : (
                  <img
                    style={{
                      width: '29px',
                      borderRadius: '14px',
                    }}
                    src={`${process.env.REACT_APP_IMAGE_BASE_URL}${selectedToken?.coin_data.coin_image}`}
                    alt=''
                  />
                )}
                {selectedToken?.coin_data.coin_symbol.toUpperCase()}
              </span>
            ),
          },
        ]}
        defaultValue={[
          {
            value: selectedToken?.coin_data.id,
            label: (
              <span className='flexedItemSelect'>
                {!selectedToken?.coin_image ? (
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
                    {selectedToken?.coin_data.coin_name.split('')[0]}
                  </div>
                ) : (
                  <img
                    style={{
                      width: '29px',
                      marginRight: '15px',
                    }}
                    src={`${process.env.REACT_APP_IMAGE_BASE_URL}${selectedToken?.coin_data.coin_image}`}
                    alt=''
                  />
                )}
                {selectedToken?.coin_data.coin_symbol.toUpperCase()}
              </span>
            ),
          },
        ]}
        style={{
          width: 100,
        }}
      />
    </div>
  );

  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={'/alerts'}
        title={state ? 'Edit Price Alerts' : 'Create Price Alerts'}
        chartIcon={() => {
          if (!selectedToken?.coin_data.graph_pair) {
            return messageApi.error(
              'Trading Graph not available for the token.'
            );
          } else {
            chrome.tabs.create({
              url: `${
                process.env.REACT_APP_TRADING_GRAPH
              }?key=${selectedToken?.coin_data.graph_pair.toUpperCase()}`,
            });
          }
        }}
      />
      <div className={`flexedContent`}>
        <div className='token'>
          <InputField
            mb0={false}
            inputSelect={true}
            placeholder={selectedToken?.coin_data.coin_name}
            label='Select Coin'
            addonAfter={selectAfterTo}
            readonly={true}
          />

          <p className='currDetails__card__text noAddress'>
            {state?.currencyUsedSymbol || currency.symbol}
            {addCommasToNumber(
              getFlooredFixed(
                selectedToken?.coin_data.coins_market?.current_price || 0,
                parseFloat(
                  selectedToken?.coin_data.coins_market?.current_price || 0
                ) < 1
                  ? 12
                  : 2
              )
            )}{' '}
            <span
              style={{
                color:
                  parseFloat(
                    selectedToken?.coin_data.coins_market
                      ?.price_change_percentage_24h || 0
                  ) < 0
                    ? 'red'
                    : 'green',
              }}
            >
              {parseFloat(
                selectedToken?.coin_data.coins_market
                  ?.price_change_percentage_24h || 0
              ).toLocaleString() < 0
                ? ''
                : '+'}
              {getFlooredFixed(
                selectedToken?.coin_data.coins_market
                  ?.price_change_percentage_24h || 0,
                2
              )}
              %
            </span>
          </p>

          <label
            style={{
              display: "flex"
            }}
            className={`${'boxStyle__label'}`}
          >
            Alert Type
          </label>

          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '30px',
              marginTop: '20px',
            }}
          >
            {type === 'above' ? (
              <ButtonComp text={'Price Rises Above'} maxWidth={'45%'} />
            ) : (
              <ButtonCompGray
                text={'Price Rises Above'}
                maxWidth={'45%'}
                onClick={() => setType('above')}
              />
            )}

            {type === 'below' ? (
              <ButtonComp text={'Price Falls Below'} maxWidth={'45%'} />
            ) : (
              <ButtonCompGray
                text={'Price Falls Below'}
                maxWidth={'45%'}
                onClick={() => setType('below')}
              />
            )}
          </div>

          <InputField
            placeholder={`Enter token price in (${currency.name})`}
            label='Add Token Price'
            getData={(name) => {
              if (!name.toString().includes('.')) {
                if (name.toString().length > 8) {
                  // If no dot and length is greater than 8, truncate the name to 8 characters
                  setName(name.slice(0, 8));
                } else {
                  setName(name); // Set the name if it is within the limit
                }
              } else {
                // Split the name by the decimal point
                const [beforeDecimal, afterDecimal] = name
                  .toString()
                  .split('.');

                // Check if the number before the decimal point has more than 8 digits
                if (beforeDecimal.length > 8) {
                  // Truncate the number before the decimal to 8 digits and combine with the decimal part
                  setName(`${beforeDecimal.slice(0, 8)}.${afterDecimal || ''}`);
                } else {
                  setName(name); // Set the name if it contains a dot and meets the criteria
                }
              }
            }}
            type={'number'}
            value={name}
            checkForSymbols={true}
          />

          <Link
            to='/price-alerts'
            onClick={async (e) => {
              e.preventDefault();

              if (!name) {
                return messageApi.error(
                  'Please enter a valid price to proceed.'
                );
              }

              if (!selectedToken.coin_data.coins_market) {
                return messageApi.error(
                  'Alert not available for this token since there is no price available.'
                );
              }

              if (type === 'above') {
                if (
                  parseFloat(name) <=
                  parseFloat(selectedToken.coin_data.coins_market.current_price)
                ) {
                  return messageApi.error(
                    'Please enter an amount greater than the current price.'
                  );
                }
              }

              if (type === 'below') {
                if (
                  parseFloat(name) >=
                  parseFloat(selectedToken.coin_data.coins_market.current_price)
                ) {
                  return messageApi.error(
                    'Please enter an amount less than the current price.'
                  );
                }
              }

              if (!state) {
                store.dispatch(setLoading(true));

                const { alerts } = await chrome.storage.local.get('alerts');

                const oldAlert = alerts.find(
                  (el) =>
                    el.price == name &&
                    el.coinId === selectedToken.coin_data.id &&
                    el.currencyName == currency.name &&
                    el.accountId == account.id
                );

                if (oldAlert) {
                  store.dispatch(setLoading(false));
                  return messageApi.error('Alert already exists.');
                }

                await WalletHelper.addAlert(
                  selectedToken.coin_data.id,
                  type,
                  name,
                  account.id,
                  currency.name,
                  currency.symbol,
                  selectedToken
                );
              } else {
                store.dispatch(setLoading(true));
                const { alerts } = await chrome.storage.local.get('alerts');

                const oldAlert = alerts.find(
                  (el) =>
                    el.price == name &&
                    el.coinId === selectedToken.coin_data.id &&
                    el.currencyName == currency.name &&
                    el.accountId == account.id &&
                    !el.sent
                );

                if (oldAlert) {
                  store.dispatch(setLoading(false));
                  return messageApi.error('Alert already exists.');
                }
                await WalletHelper.editAlert(state.id, type, name);
              }

              store.dispatch(setLoading(false));
              navigate(-1);
            }}
          >
            {' '}
            <ButtonComp text={state ? 'Save' : 'Confirm'} maxWidth={'100%'} />
          </Link>
        </div>
      </div>
      <Drawer
        title='Select Token'
        placement='bottom'
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
          className='contain'
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className='search' style={{ marginBottom: '30px' }}>
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
              }}
            />
          </div>

          <div
            className='right'
            style={{
              flex: 1,
              overflow: 'scroll',
            }}
          >
            {tokens.length > 0 ? (
              tokens.map((token) => (
                <div
                  className='design'
                  style={{
                    width: '100%',
                  }}
                >
                  <div
                    className='token'
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
                      backgroundColor: 'transparent',
                      color: '#000',
                    }}
                    onClick={() => {
                      if (selectedToken?.id == token.id) {
                        setOpen(false);
                      }

                      setSelectedToken(token);
                      setName(
                        toFixed(
                          token.coin_data.coins_market
                            ? token.coin_data.coins_market.current_price
                            : 0
                        )
                      );
                      setOpen(false);
                    }}
                  >
                    {!token.coin_data.coin_image ? (
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
                        {token.coin_data.coin_name.split('')[0]}
                      </div>
                    ) : (
                      <img
                        style={{
                          width: '29px',
                          marginRight: '15px',
                        }}
                        src={`${process.env.REACT_APP_IMAGE_BASE_URL}${token.coin_data.coin_image}`}
                        alt=''
                      />
                    )}

                    <p className='selctCoinText'>
                      <span style={{ fontSize: '17px' }} className='noAddress'>
                        {token.coin_data.coin_name}{' '}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          marginLeft: '5px',
                        }}
                        className='noAddress'
                      >
                        /{' '}
                        {token.coin_data.token_type
                          ? token.coin_data.coin_family == 4
                            ? 'SPL20'
                            : token.coin_data.token_type
                          : 'Coin'}
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
                  className='noAddress'
                  style={{
                    marginTop: '4%',
                    marginBottom: '15px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                  }}
                >
                {loading ? 'Loading...' : 'No assets found'}
                </p>
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default AddPriceAlert;
