import React, { useEffect, useState } from "react";
import HistryList from "../../Components/HistryList/HistryList";
import Deposit from "../../Assets/deposit.svg";
import { store } from "../..";
import { setLoading } from "../../actions/loading";

import "./style.module.scss";
import { useSelector } from "react-redux";
import { spritzHelper } from "../../helpers/spritz.helper";
import moment from "moment";
import {
  addCommasToNumber,
  getFlooredFixed,
} from "../../helpers/conversion.helper";
import { useLocation } from "react-router-dom";
import { setSpritzFilter } from "../../actions/filter";

function HistorySpritz() {
  const [payments, setPayments] = useState([]);
  const { spritzBank, loading } = useSelector((state) => state);
  const { state } = useLocation();
  const init = async () => {
    if (!state) {
      store.dispatch(setSpritzFilter(null));
    }

    store.dispatch(setLoading(true));
    const paymentsHistory = await spritzHelper.getTransactions(
      state?.filterValue || spritzBank[0].id
    );
    const pHistory = [...paymentsHistory];
    pHistory.sort((a, b) => new Date(b?.createdAt) - new Date(a?.createdAt));
    setPayments(pHistory);
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div
      style={{
        overflow: "scroll",
      }}
    >
      {payments.length > 0 ? (
        payments.map((data) => {
          return (
            <HistryList
              date={""}
              status={""}
              sendRecieve={"DEPOSIT"}
              coinname={"USD"}
              address={data.status}
              valueCurrency={`$${addCommasToNumber(
                getFlooredFixed(data.amount, 2)
              )}`}
              addressTo={moment(data.createdAt).format("MM/DD/YYYY hh:mm A")}
              TickIcon={Deposit}
              allData={data}
              coin={false}
              spritz={true}
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
          {loading ? 'Loading...' : 'No Transactions Found...'}
        </p>
      )}
    </div>
  );
}

export default HistorySpritz;
