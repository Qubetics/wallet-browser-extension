/*global chrome*/

import React, { useEffect, useState } from 'react';
import MenuRestofHeaders from '../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import './CurrencyDetails.scss';
import { useLocation } from 'react-router-dom';
import { message, Select } from 'antd';
import { useSelector } from 'react-redux';
import { DURATION } from '../../../config/message.config';
import {
  addCommasToNumber,
  balanceToFiatConversion,
  getFlooredFixed,
} from '../../../helpers/conversion.helper';
import { server } from '../../../server';
import HistryList from '../../../Components//HistryList/HistryList';
import Sendhistry from '../../../Assets/sendhistry.svg';
import Deposit from '../../../Assets/deposit.svg';
import { store } from '../../..';
import { setFilter } from '../../../actions/filter';
import * as moment from 'moment';
import { InputField } from '../../../Components/InputField/InputFieldSimple';
import CopyIcon from '../../../Assets/CopyIconBlue.svg';
import CurrencyBalanceDetails from './CurrencyBalance';
import { token_type } from '../../../helpers/constant';
import { getCosmosAddress } from '../../../helpers/cosmos.helper';
import { setTokens } from '../../../actions/tokens';
import { setLoading } from '../../../actions/loading';
import { formatNumberInput } from '../../../helpers/common.helper';

function CurrencyDetails() {
  const { currency, account,tokens, loading } = useSelector((state) => state);
  const [crossChainDetail, setCrossChainDetail] = useState(null);
  const [price, setPrice] = useState(0);
  const [isGraphExist, setIsGraphExist] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [options, setOptions] = useState([]);
  const { state } = useLocation();
  const {
    state: { coin: coinDetail },
    ...rest
  } = useLocation();
  
  // Use passed coin data directly if available, otherwise find in tokens array
  const coin = coinDetail || tokens.find(
    (item) => item?.coin?.coin_id === coinDetail?.coin?.coin_id
  );
  
  // Find the full coin data from tokens array to get coin_id and cmc_id
  // This handles both scenarios: passed coin data and direct navigation
  const fullCoinData = coin?.coin?.coin_id ? coin : tokens.find(
    (item) => item?.coin?.coin_symbol === coin?.coin?.coin_symbol && 
              item?.coin?.coin_family === coin?.coin?.coin_family
  );
  
  // Debug logging to understand which path is taken
  // console.log('CurrencyDetails Debug:', {
  //   hasCoinDetail: !!coinDetail,
  //   hasCoin: !!coin,
  //   hasFullCoinData: !!fullCoinData,
  //   coinStructure: coin,
  //   fullCoinDataStructure: fullCoinData,
  //   tokensLength: tokens.length
  // });
  const [isStared, setIsStared] = useState(
    coin?.coin?.watchlist_data && coin.coin.watchlist_data.status === '1'
      ? true
      : false
  );
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [history, setHistory] = useState([]);
  const { theme } = useSelector((state) => state);

  const init = async () => {
    store.dispatch(setLoading(true));
    let cosmosAddress = '';
    if (!state.status) {
      store.dispatch(
        setFilter({
          coinId: 'all',
          status: 'all',
          fromDate: null,
          toDate: null,
          type: 'all',
        })
      );
    }

    // Validate required coin data before making API calls
    if (!coin?.wallet_address) {
      // console.error('Missing required coin data for API calls:', { coin });
      messageApi.error('Missing coin data. Please try again.');
      return;
    }

    try {
      if (!fullCoinData) {
        // console.error('Could not find full coin data:', { coin, fullCoinData, tokens });  
        messageApi.error('Coin data not found. Please try again.');
        return;
      }

      // Ensure we have the required fields for API calls
      if (!fullCoinData.coin?.coin_id) {
        // console.error('Missing coin_id in fullCoinData:', { fullCoinData });
        messageApi.error('Missing coin ID. Please try again.');
        return;
      }

      const coinDetail = await server.post(
        '/wallet/coinWalletDetail',
        {
          coin_id: fullCoinData.coin.coin_id,
          cmc_id: fullCoinData.coin.cmc_id,
          fiat_currency: 'USD',
          wallet_address: coin.wallet_address,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      // console.log('coinDetail', coinDetail);
      setCrossChainDetail(coinDetail?.data?.data?.coin?.cross_chain_data);
      setIsGraphExist(coinDetail?.data?.graph?.length > 0 ? true : false);
    } catch (error) {
      // console.error('Error fetching coin details:', error);
      messageApi.error('Failed to load currency details. Please try again.');
      return;
    }

    if (coin?.coin?.coin_family === 7) {
      cosmosAddress = await getCosmosAddress();
      setOptions((prev) => [
        ...prev,
        {
          label: 'Qubetics Address',
          value: coin?.wallet_address,
        },
        { label: 'Cosmos Address', value: cosmosAddress },
      ]);
      setSelectedOption(coin?.wallet_address);
    }


    // console.log('cosmosAddress',cosmosAddress);
    
    const transactionList = await server.post(
      `/wallet/transaction/list`,
      {
        coin_id: coin.coin.coin_id,
        coin_family: [coin.coin.coin_family],
        addrsListKeys: cosmosAddress ? [coin.wallet_address, cosmosAddress] : [coin.wallet_address],
        page: 1,
        limit: 250,
        status: state
          ? state.status === 'all'
            ? undefined
            : state.status
          : undefined,
        date_from: state
          ? state.fromDate
            ? moment(state.fromDate).format('YYYY-MM-DD') //moment(state.fromDate).startOf("day")
            : undefined
          : undefined,
        date_to: state
          ? state.toDate
            ? moment(state.toDate).format('YYYY-MM-DD') //moment(state.toDate).endOf("day")
            : undefined
          : undefined,
        trnx_type: state ? (state.type ? state.type : undefined) : undefined,
      },
      {
        headers: {
          Authorization: account?.jwtToken,
        },
      }
    );
    setHistory(transactionList?.data?.data);

  };

  useEffect(() => {
    setPrice(coin?.coin?.fiat_price_data || 0);
    init();
    setTimeout(() => fetchPortfolio(), 6000);
  }, []);

  // Re-run init when tokens are loaded (for direct navigation scenario)
  useEffect(() => {
    if (tokens.length > 0 && !fullCoinData && coin) {
      // console.log('Tokens loaded, re-running init...');
      init();
    }
  }, [tokens]);

  const fetchPortfolio = async () => {
    try {
      store.dispatch(setLoading(true));
      const walletsList = await server.post(
        `/wallet/portfolio`,
        {
          addressListKeys: account?.addressLists?.slice(0, 6),
          coin_family: account.coinFamilies,
          fiat_type: currency.name,
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
      store.dispatch(setTokens([]));
      store.dispatch(setTokens(walletsList.data.data));
    } catch (error) {
      // console.log(error);
    } finally {
      store.dispatch(setLoading(false));
    }
  };

  // Guard clause to prevent rendering when coin is undefined
  if (!coin) {
    return (
      <div className={`scrollableCont`}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading currency details...</p>
        </div>
      </div>
    );
  }

  // If tokens array is empty, try to fetch it first
  if (tokens.length === 0) {
    // console.log('Tokens array is empty, fetching portfolio...');
    fetchPortfolio();
  }

  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={'/wallet'}
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {coin.coin.coin_image ? (
              <img src={coin?.coin?.coin_image} className="detailIcon" alt="" />
            ) : (
              <div
                className="randb extra borderDarkLight"
                style={{
                  height: '35px',
                  width: '35px',
                  background: 'rgb(202, 201, 201)',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '1px solid',
                  color: 'black',
                }}
              >
                {coin?.coin?.coin_name &&
                  coin?.coin?.coin_name?.split('')[0]?.toUpperCase()}
              </div>
            )}
            <p
              style={{
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {' '}
              {coin.coin.coin_symbol &&
                (coin?.coin?.coin_symbol?.toUpperCase() === 'BNB'
                  ? 'BNB Smart Chain'
                  : coin?.coin?.coin_symbol?.toUpperCase())}
            </p>
          </span>
        }
        chartIcon={() => {
          if (
            coin?.coin?.graph_pair ||
            isGraphExist ||
            coin?.coin?.graph_source
          ) {
            let pay = {
              coin_id: coin?.coin?.coin_id,
              cmc_id: coin?.coin?.cmc_id,
              coin_family: coin?.coin?.coin_family,
            };
            chrome.tabs.create({
              url: `https://trading-view.qubetics.work/?key=${encodeURIComponent(
                coin?.coin?.graph_pair?.toUpperCase()
              )}&item=${encodeURIComponent(
                JSON.stringify(pay)
              )}&account=${encodeURIComponent(
                JSON.stringify(account)
              )}&wallet_address=${encodeURIComponent(
                coin?.wallet_address
              )}&token=${encodeURIComponent(account?.jwtToken)}&currency=${
                currency?.name
              }`,
            });
          }
        }}
        pairExist={
          coin?.coin?.graph_pair || isGraphExist || coin?.coin?.graph_source
        }
        stared={async () => {
          // console.log('coin?.coin', coin, account);
          try {
            await server.post(
              'wallet/updateWatchlist',
              {
                data: [
                  {
                    address:
                      coin?.coin?.coin_family === 3 ||
                      coin?.coin?.coin_family === 5
                        ? coin.wallet_address
                        : account.address,
                    coin_id: fullCoinData.coin.coin_id,
                    status: coin?.coin?.watchlist_data?.status == '1' ? 0 : 1,
                  },
                ],
              },
              {
                headers: {
                  Authorization: account.jwtToken,
                },
              }
            );
            messageApi.success(
              `${
                !isStared ? 'Added in' : 'Removed from '
              } watchlist successfully`
            );
            setIsStared(!isStared);
          } catch (error) {
            messageApi.error('Unable to favourite the selected coin');
          }
        }}
        isStared={isStared}
      />

      <div className={`flexedContent padding-Top`}>
        <div className="currDetails currencyCard">
          <div className="currDetails__card">
            <div className="currDetails__card__topTexts">
              <p
                className="currDetails__card__text"
                style={{
                  color: '#fff',
                }}
              >
                {coin?.coin?.token_address !== null
                  ? token_type(coin?.coin?.coin_family)
                  : 'Coin'}
              </p>
              <p
                className="currDetails__card__text"
                style={{
                  color: '#fff',
                }}
              >
                {currency.symbol}
                {price
                  ? addCommasToNumber(
                      getFlooredFixed(
                        Number(price?.value),
                        parseFloat(price?.value) < 1 ? 4 : 2
                      )
                    )
                  : '0.00'}{' '}
                <span
                  style={{
                    color:
                      parseFloat(price?.price_change_percentage_24h) <= 0
                        ? 'red'
                        : 'lightgreen',
                  }}
                >
                  {parseFloat(
                    price?.price_change_percentage_24h || 0
                  ).toLocaleString() <= 0
                    ? ''
                    : '+'}
                  {getFlooredFixed(
                    price
                      ? price?.price_change_percentage_24h
                        ? price?.price_change_percentage_24h
                        : 0
                      : 0,
                    2
                  )}
                  %
                </span>
              </p>
            </div>
            <div
              style={{
                textAlign: 'center',
                margin: '12px auto',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {coin?.coin?.coin_image ? (
                <img
                  style={{ height: 50, width: 50, borderRadius: '50%' }}
                  src={coin?.coin?.coin_image}
                  alt="usdt"
                />
              ) : (
                <div
                  className="randb extra borderDarkLight"
                  style={{
                    height: '30px',
                    width: '30px',
                    background: 'rgb(202, 201, 201)',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid',
                  }}
                >
                  {coin?.coin?.coin_name?.split('')[0]}
                </div>
              )}
            </div>
            <CurrencyBalanceDetails
              mt0="currDetails__card__mt0"
              className="currDetails__card__paddingOverride"
              textLeft="currDetails__card__textLeft"
              balance={`${addCommasToNumber(
                parseFloat(getFlooredFixed(coin?.balance, 4))
              )} ${coin?.coin?.coin_symbol}`}
              coin={coin}
              crossChainDetail={crossChainDetail}
            />
          </div>

          {coin?.coin?.coin_family === 7 && (
            <div className="inputpaddingIssue">
              <div className={'filterHistory__selctHis'}>
                <Select
                  value={selectedOption}
                  popupClassName="filterHistoryDropdown"
                  onChange={(value) => {
                    // console.log('value', value);
                    setSelectedOption(value);
                  }}
                  options={options.map((option) => ({
                    value: option.value,
                    label: <span>{option.label}</span>,
                  }))}
                  placeholder="Select Chain"
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: '10px' }}></div>

          {coin?.coin?.coin_family !== 7 ? (
            <div className="editWallet__linkOuter shareIconaad">
              <InputField
                value={account.coinFamilyAndAddress[coin.coin.coin_family]}
                readonly={true}
                placeholderBaseColor={true}
                addonAfter={
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <img
                      src={CopyIcon}
                      width={14}
                      alt=""
                      height={16}
                      style={{
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(
                          account.coinFamilyAndAddress[coin.coin.coin_family]
                        );
                        messageApi.success('Address copied to clipboard');
                      }}
                    />
                  </span>
                }
              />
            </div>
          ) : (
            <div className="editWallet__linkOuter shareIconaad">
              <InputField
                value={
                  selectedOption ||
                  account.coinFamilyAndAddress[coin.coin.coin_family]
                }
                readonly={true}
                placeholderBaseColor={true}
                addonAfter={
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <img
                      src={CopyIcon}
                      width={14}
                      alt=""
                      height={16}
                      style={{
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOption);
                        messageApi.success('Address copied to clipboard');
                      }}
                    />
                  </span>
                }
              />
            </div>
          )}

          <div className="currDetails__dataSec">
            <div className="currDetails__dataSec__header">
              <p>Transactions</p>
            </div>
            <div className="currDetails__dataSec__table">
              {history.length > 0 ? (
                history.map((data) => {
                  let name = null;

                  const price = data?.coin_data?.fiat_price_data;

                  let transactionType =
                    data.type === 'dapp'
                      ? 'Smart Contract'
                      : data.type === 'deposit'
                      ? 'Received'
                      : data.type === 'withdraw'
                      ? 'Sent'
                      : data.type.toLowerCase() === 'swap'
                      ? 'Swap'
                      : data.type.toLowerCase() === 'cross_chain'
                      ? 'Cross Chain'
                      : 'Approve';

                  return (
                    <HistryList
                      hash={data?.tx_id}
                      status={data?.blockchain_status?.toUpperCase()}
                      sendRecieve={transactionType}
                      coinname={data?.coin_data?.coin_symbol?.toUpperCase()}
                      address={`${data?.from_adrs?.substring(0, 5)}.....
                      ${data?.from_adrs?.substring(
                        data?.from_adrs?.length - 5,
                        data?.from_adrs?.length
                      )}`}
                      valueCurrency={`${formatNumberInput(data?.amount
                      )} ${data?.coin_data?.coin_symbol?.toUpperCase()}`}
                      dollercurrency={balanceToFiatConversion(
                        price ? price?.value : 0,
                        data?.amount
                      )}
                      addressTo={
                        name
                          ? name
                          : `${data?.to_adrs?.substring(0, 5)}.....
                      ${data?.to_adrs?.substring(
                        data?.to_adrs?.length - 5,
                        data?.to_adrs?.length
                      )}`
                      }
                      TickIcon={
                        transactionType === 'Deposit' ? Deposit : Sendhistry
                      }
                      def={currency.symbol}
                      allData={data}
                      coin={coin}
                      date={moment(data.created_at).format(
                        'DD, MMM YYYY | hh:mm A'
                      )}
                      coinNameNotShow={true}
                    />
                  );
                })
              ) : (
                <p
                  className="noAddress"
                  style={{
                    marginTop: '24%',
                    fontWeight: 'bold',
                    fontSize: '15px',
                  }}
                >
                  {loading ? 'Loading...' : 'No Transactions Found...'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CurrencyDetails;
