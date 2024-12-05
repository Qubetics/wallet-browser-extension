import React, { useEffect, useRef, useState } from 'react';
import HistryList from '../../Components/HistryList/HistryList';
import Sendhistry from '../../Assets/sendhistry.svg';
import Deposit from '../../Assets/deposit.svg';
import { useSelector } from 'react-redux';
import {
  addCommasToNumber,
  balanceToFiatConversion,
  getFlooredFixed,
} from '../../helpers/conversion.helper';
import { server } from '../../server';
import { useLocation } from 'react-router-dom';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { setFilter } from '../../actions/filter';
import './style.module.scss';
import moment from 'moment';

function History() {
  const { account, currency, filter } = useSelector((state) => state);

  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [total, setTotal] = useState(0);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { state } = useLocation();

  const init = async () => {
    if (!state) {
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

    store.dispatch(setLoading(true));
    const transactionList = await server.post(
      `/wallet/transaction/list`,
      {
        per_page: 10,
        page: currentPage,
        address_list: account.addressLists,
        type: state ? state.type : 'all',
        order_type: 'DESC',
        order_by: 'created_at',
        fiat_currency: currency.name.toUpperCase(),

        coin_family: state
          ? state.coinId === 'all'
            ? undefined
            : state.coinId
          : undefined,
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
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    setTotal(transactionList.data.meta.total);
    setHistory([...history, ...transactionList.data.data]);
    setIsFetchingData(false);
    store.dispatch(setLoading(false));
  };

  const parentRef = useRef(null);

  const handleScroll = () => {
    // Get the parent container's height and scroll position
    const { scrollHeight, scrollTop, clientHeight } = parentRef.current;

    // Check if the user has reached the bottom of the scrollable container
    const tolerance = 15; // Adjust this value as needed
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - tolerance;

    if (isAtBottom && !isFetchingData && currentPage < Math.ceil(total / 10)) {
      // Prevent loading more data if already refreshing or reached the last page
      setIsFetchingData(true);
      // Increment the currentPage state to load the next page
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    init();
  }, [currentPage]);

  return (
    <div
      style={{
        height: '560px',
        overflow: 'scroll',
      }}
      ref={parentRef}
      onScroll={handleScroll}
    >
      {history.length > 0 ? (
        history.map((data) => {
          let name = null;

          const price = data.trxn_fiat_price_detail.find(
            (el) =>
              el.fiat_currency.toUpperCase() === currency.name.toUpperCase()
          );

          let transactionType =
            data.type.toLowerCase() == 'cross-chain' ||
            data.type.toLowerCase() == 'swap'
              ? 'Swap'
              : data.type.toLowerCase() == 'approval'
              ? 'Approval'
              : data.type.toLowerCase() == 'smart_contract'
              ? 'Smart Contract Call'
              : data.req_type == 'APP'
              ? data.tx_type == 'withdraw'
                ? 'Withdraw'
                : 'Deposit'
              : data.type.toLowerCase() == 'buy' ||
                data.type.toLowerCase() == 'sell'
              ? data.type
              : data.req_type == 'EXNG' && data.tx_type == 'deposit'
              ? 'deposit'
              : data.req_type == 'EXNG'
              ? data.from_adrs.toLowerCase() ==
                account.coinFamilyAndAddress[data.coin_family].toLowerCase()
                ? 'Withdraw'
                : 'Deposit'
              : 'Deposit';

          return (
            <HistryList
              hash={data.tx_id}
              date={data.created_at}
              status={data.blockchain_status.toUpperCase()}
              sendRecieve={transactionType}
              coinname={data.coin_data.coin_symbol.toUpperCase()}
              address={`${data.from_adrs.substring(0, 5)}.....
              ${data.from_adrs.substring(
                data.from_adrs.length - 5,
                data.from_adrs.length
              )}`}
              valueCurrency={`${addCommasToNumber(
                getFlooredFixed(data.amount, 5)
              )} ${data.coin_data.coin_symbol.toUpperCase()}`}
              dollercurrency={balanceToFiatConversion(
                price ? price.current_price : 0,
                data.amount
              )}
              addressTo={
                name
                  ? name
                  : `${data.to_adrs.substring(0, 5)}.....
          ${data.to_adrs.substring(
            data.to_adrs.length - 5,
            data.to_adrs.length
          )}`
              }
              TickIcon={transactionType === 'Deposit' ? Deposit : Sendhistry}
              def={currency.symbol}
              allData={data}
              coin={false}
            />
          );
        })
      ) : (
        <p
          className='noAddress'
          style={{
            marginTop: '50%',
            fontWeight: 'bold',
            fontSize: '17px',
          }}
        >
          No Transactions Found...
        </p>
      )}
    </div>
  );
}

export default History;
