/*global chrome*/

import React, { useEffect, useState } from 'react';
import MenuRestofHeaders from '../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import './CurrencyDetails.scss';
import BalanceDetails from '../../../Components/BalanceDetails/BalanceDetails';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
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
import FilterIcon from '../../../Assets/Filtericon.svg';
import { store } from '../../..';
import { setFilter } from '../../../actions/filter';
import DarkFilterIcon from '../../../Assets/DarkFilterIcon.svg';
import moment from 'moment';
function CurrencyDetails() {
  const { currency, account } = useSelector((state) => state);

  const navigate = useNavigate();

  const {
    state: { coin },
  } = useLocation();

  const { state } = useLocation();

  const [price, setPrice] = useState(0);

  useEffect(() => {
    setPrice(coin.coin_data.coins_market || 0);
  }, []);

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const [history, setHistory] = useState([]);
  const { theme } = useSelector((state) => state);
  const init = async () => {
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

    console.log('FilterData', {
      per_page: 2000,
      page: 1,
      address_list: [account.coinFamilyAndAddress[coin.coin_data.coin_family]],
      type: state ? (state.type === '' ? 'all' : state.type) : 'all',
      order_type: 'DESC',
      order_by: 'created_at',
      fiat_currency: currency.name && currency?.name?.toUpperCase(),
      coin_id: coin.coin_data.id,
      status: state
        ? state.status === 'all'
          ? undefined
          : state.status
        : undefined,
      date_from: state
        ? state.fromDate
          ? moment(state.fromDate).startOf('day')
          : undefined
        : undefined,
      date_to: state
        ? state.toDate
          ? moment(state.toDate).endOf('day')
          : undefined
        : undefined,
    });

    const transactionList = await server.post(
      `/wallet/transaction/list`,
      {
        per_page: 2000,
        page: 1,
        address_list: [
          account.coinFamilyAndAddress[coin?.coin_data?.coin_family],
        ],
        type: state ? (state?.type === '' ? 'all' : state?.type) : 'all',
        order_type: 'DESC',
        order_by: 'created_at',
        fiat_currency: currency?.name && currency?.name?.toUpperCase(),
        coin_id: coin?.coin_data?.id,
        status: state
          ? state?.status === 'all'
            ? undefined
            : state?.status
          : undefined,
        date_from: state
          ? state?.fromDate
            ? moment(state?.fromDate).startOf('day')
            : undefined
          : undefined,
        date_to: state
          ? state.toDate
            ? moment(state?.toDate).endOf('day')
            : undefined
          : undefined,
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
    init();
  }, []);

  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={'/wallet'}
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {coin.coin_data.coin_image ? (
              <img
                src={`${process.env.REACT_APP_IMAGE_BASE_URL}${coin?.coin_data?.coin_image}`}
                className='detailIcon'
                alt=''
              />
            ) : (
              <div
                className='randb extra borderDarkLight'
                style={{
                  height: '35px',
                  width: '35px',
                  background: 'rgb(202, 201, 201)',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '1px solid',
                }}
              >
                {coin?.coin_data?.coin_name &&
                  coin?.coin_data?.coin_name?.split('')[0]?.toUpperCase()}
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
              {coin.coin_data.coin_symbol &&
                (coin?.coin_data?.coin_symbol?.toUpperCase() === 'BNB'
                  ? 'BNB Smart Chain'
                  : coin?.coin_data?.coin_symbol?.toUpperCase())}
            </p>
          </span>
        }
        chartIcon={() => {
          if (!coin?.coin_data?.graph_pair) {
            return messageApi.error(
              'Trading Graph not available for the token.'
            );
          } else {
            chrome.tabs.create({
              url: `${
                process.env.REACT_APP_TRADING_GRAPH
              }?key=${coin?.coin_data?.graph_source?.toUpperCase()}:${
                coin?.coin_data?.graph_pair &&
                coin?.coin_data?.graph_pair?.toUpperCase()
              }`,
            });
          }
        }}
      />

      <div className={`flexedContent`}>
        <div className='currDetails'>
          <div className='currDetails__card'>
            <div className='currDetails__card__topTexts'>
              <p
                className='currDetails__card__text'
                style={{
                  color: '#fff',
                }}
              >
                {coin.coin_data.token_type
                  ? coin.coin_data.coin_family == 4
                    ? 'SPL20'
                    : coin.coin_data.coin_family == 9
                    ? 'PLS'
                    : coin.coin_data.token_type
                  : coin.coin_data.coin_symbol === 'bnb'
                  ? 'BEP20'
                  : ''}
              </p>
              <p
                className='currDetails__card__text'
                style={{
                  color: '#fff',
                }}
              >
                {currency.symbol}
                {price
                  ? addCommasToNumber(
                      getFlooredFixed(
                        Number(price?.current_price),
                        parseFloat(price?.current_price) < 1 ? 12 : 2
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
            <BalanceDetails
              mt0='currDetails__card__mt0'
              className='currDetails__card__paddingOverride'
              textLeft='currDetails__card__textLeft'
              balance={`${addCommasToNumber(
                parseFloat(getFlooredFixed(coin?.balance, 4))
              )} ${coin?.coin_data?.coin_symbol}`}
              coin={coin}
            />
          </div>

          <div className='currDetails__dataSec'>
            <div className='currDetails__dataSec__header'>
              <p>Transaction History</p>
              <Link
                to=''
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/filter-history', {
                    state: {
                      currencyDetail: coin,
                    },
                  });
                }}
              >
                {theme == 'darkTheme' ? (
                  <img src={DarkFilterIcon} />
                ) : (
                  <img src={FilterIcon} />
                )}
              </Link>
            </div>
            <div className='currDetails__dataSec__table'>
              {history.length > 0 ? (
                history.map((data) => {
                  let name = null;

                  const price =
                    data?.trxn_fiat_price_detail &&
                    data?.trxn_fiat_price_detail.find(
                      (el) =>
                        el?.fiat_currency?.toUpperCase() ===
                        currency?.name?.toUpperCase()
                    );

                  let transactionType =
                    data?.type?.toLowerCase() == 'cross-chain' ||
                    data?.type?.toLowerCase() == 'swap'
                      ? 'Swap'
                      : data?.type?.toLowerCase() == 'approval'
                      ? 'Approval'
                      : data?.type?.toLowerCase() == 'smart_contract'
                      ? 'Smart Contract Call'
                      : data?.req_type == 'APP'
                      ? data?.tx_type == 'withdraw'
                        ? 'Withdraw'
                        : 'Deposit'
                      : data?.type?.toLowerCase() == 'buy' ||
                        data?.type?.toLowerCase() == 'sell'
                      ? data?.type
                      : data.req_type == 'EXNG' && data.tx_type == 'deposit'
                      ? 'deposit'
                      : data.req_type == 'EXNG'
                      ? data?.from_adrs?.toLowerCase() ==
                        account?.coinFamilyAndAddress[
                          data?.coin_family
                        ].toLowerCase()
                        ? 'Withdraw'
                        : 'Deposit'
                      : 'Deposit';

                  console.log(
                    '🚀 ~ file: CurrencyDetails.jsx:236 ~ history.map ~ transactionType:',
                    transactionType
                  );

                  return (
                    <HistryList
                      hash={data?.tx_id}
                      date={data?.created_at}
                      status={data?.blockchain_status?.toUpperCase()}
                      sendRecieve={transactionType}
                      coinname={data?.coin_data?.coin_symbol?.toUpperCase()}
                      address={`${data?.from_adrs?.substring(0, 5)}.....
          ${data?.from_adrs?.substring(
            data?.from_adrs?.length - 5,
            data?.from_adrs?.length
          )}`}
                      valueCurrency={`${addCommasToNumber(
                        getFlooredFixed(data?.amount, 5)
                      )} ${data?.coin_data?.coin_symbol?.toUpperCase()}`}
                      dollercurrency={balanceToFiatConversion(
                        price ? price?.current_price : 0,
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
                    />
                  );
                })
              ) : (
                <p
                  className='noAddress'
                  style={{
                    marginTop: '50%',
                    fontWeight: 'bold',
                    fontSize: '15px',
                  }}
                >
                  No Transactions Found...
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
