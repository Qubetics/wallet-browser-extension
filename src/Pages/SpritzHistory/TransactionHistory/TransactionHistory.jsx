/*global chrome*/
import { message } from "antd";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { store } from "../../..";
import { setLoading } from "../../../actions/loading";
import MenuRestofHeaders from "../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import {
  addCommasToNumber,
  getFlooredFixed,
} from "../../../helpers/conversion.helper";
import "./TransactionHistory.scss";

function TransactionHistorySpritz() {
  const {
    state: { allData },
  } = useLocation();

  const data = [
    {
      key: "Transaction ID",
      value: allData.id,
    },
    {
      key: "Account ID",
      value: allData.accountId,
    },
    {
      key: "Date",
      value: moment(allData.createdAt).format("MM/DD/YYYY hh:mm A"),
    },
    {
      key: "Amount",
      value: `$${addCommasToNumber(getFlooredFixed(allData.amount, 2))}`,
    },
    {
      key: "Status",
      value: allData.status,
    },
  ];
  return (
    <div className="transactionHistoryAnother">
      <div className="transactionHistoryAnother_keyValue">
        {data.map((ele, index) => (
          <div key={index} className="transactionHistoryAnother_keyValue_data">
            {ele.key && (
              <p className="transactionHistoryAnother_keyValue_key">
                {ele.key}
              </p>
            )}
            {ele.value && (
              <p className="transactionHistoryAnother_keyValue_value">
                {ele.value}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TransactionHistorySpritz;
