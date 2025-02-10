import React, { useEffect, useRef, useState } from "react";
import HistryList from "../../Components/HistryList/HistryList";
import Sendhistry from "../../Assets/sendhistry.svg";
import Deposit from "../../Assets/deposit.svg";
import { useSelector } from "react-redux";
import {
  addCommasToNumber,
  balanceToFiatConversion,
  getFlooredFixed,
} from "../../helpers/conversion.helper";
import { server } from "../../server";
import { useLocation } from "react-router-dom";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { setFilter } from "../../actions/filter";
import "./style.module.scss";
import moment from "moment";
import HistoryListOuter from "../../Components/HistryList/HistryListOuter";

function History() {
  const { account, currency, filter } = useSelector((state) => state);

  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [total, setTotal] = useState(0);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { pathname, state } = useLocation();

  const init = async () => {
    if (!state) {
      store.dispatch(
        setFilter({
          coinId: "all",
          status: "all",
          fromDate: null,
          toDate: null,
          type: "all",
        })
      );
    }

    store.dispatch(setLoading(true));

    const transactionList = await server.post(
      `/wallet/transaction/list`,
      {
        coin_family: state
          ? state.coinId
            ? state.coinId == 'all' ? account.coinFamilies : [state.coinId]
            : account.coinFamilies
          : account.coinFamilies,
        addrsListKeys: state
          ? state.coinId
            ? state.coinId == 'all' ? account.addressLists : [account.coinFamilyAndAddress[state.coinId]]
            : account.addressLists
          : account.addressLists,
        page: currentPage,
        limit: 100,
        status: state
          ? state.status === "all"
            ? undefined
            : state.status
          : undefined,
        date_from: state
          ? state.fromDate
            // ? moment(state.fromDate).startOf("day")
            ? moment(state.fromDate).format("YYYY-MM-DD")
            : undefined
          : undefined,
        date_to: state
          ? state.toDate
            ? moment(state.toDate).format("YYYY-MM-DD")
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
    return () => { 
      if (pathname !== '/filter-history') {
        store.dispatch(
          setFilter({
            coinId: "all",
            status: "all",
            fromDate: null,
            toDate: null,
            type: "all",
          })
        );
      }
    }
  }, [currentPage, pathname]);

  return (
    <div className={`scrollableCont`}>
      <div className={`flexedContent`} ref={parentRef} onScroll={handleScroll}>
        {history.length > 0 ? (
          history.map((data) => {
            let name = null;

            const price = data?.coin_data?.fiat_price_data;

            let transactionType =
              data.type == "dapp"
                ? "Smart Contract"
                : data.type === "deposit"
                  ? "Received"
                  : data.type === "withdraw"
                    ? "Sent"
                    : data.type.toLowerCase() === "swap"
                      ? "Swap"
                      : "Withdraw";

            return (
              <HistoryListOuter
                hash={data?.tx_id}
                type={data.type}
                status={data?.blockchain_status}
                sendRecieve={transactionType}
                coinname={data?.coin_data?.coin_symbol?.toUpperCase()}
                address={data?.from_adrs}
                valueCurrency={`${addCommasToNumber(
                  getFlooredFixed(data?.amount, 5)
                )} ${data?.coin_data?.coin_symbol?.toUpperCase()}`}
                dollercurrency={balanceToFiatConversion(
                  price ? price?.value : 0,
                  data?.amount
                )}
                addressTo={data?.to_adrs}
                TickIcon={transactionType === "Deposit" ? Deposit : Sendhistry}
                def={currency.symbol}
                allData={data}
                coin={data?.coin_data}
                date={moment(data.created_at).format("DD, MMM YYYY | hh:mm A")}
              />
            );
          })
        ) : (
          <p
            className="noAddress"
            style={{
              marginTop: "50%",
              fontWeight: "bold",
              fontSize: "17px",
            }}
          >
            No Transactions Found...
          </p>
        )}
      </div>
    </div>
  );
}

export default History;
