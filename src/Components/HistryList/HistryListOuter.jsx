/*global chrome*/
import { message } from "antd";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DURATION } from "../../config/message.config";
import { capitalize } from "../../helpers/conversion.helper";
import "./HistryList.scss";
// import TickIcon from "../../Assets/TickIcon.svg"
function HistoryListOuter(props) {
  const { chain, account, currency } = useSelector((state) => state);

  const {
    sendRecieve,
    coinname,
    address,
    valueCurrency,
    dollercurrency,
    addressTo,
    TickIcon,
    status,
    date,
    hash,
    def,
    allData,
    coin,
    spritz,
    type,
  } = props;

  const navigate = useNavigate();

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  return (
    <>
      {contextHolder}
      <div className="histryList">
        <div className="statusCurrency">
          <div className="Status">
            <img src={TickIcon}></img>
            <div className="send">
              <p className="sendRecieve">
                {sendRecieve}
                {valueCurrency}
              </p>
              <div className="histryStatus">
                <p>{date}</p>
              </div>
            </div>
          </div>
          <div className="Currency">
            <p
              className="curncyStatus"
              style={{
                color:
                  status === "confirmed"
                    ? "#00BE00"
                    : status === "failed"
                    ? "#FF0D0D"
                    : "#ECB300",
              }}
            >
              {status === "confirmed"
                ? "Completed"
                : status === "failed"
                ? "Failed"
                : "Pending"}
            </p>
          </div>
        </div>
        <div>
          <div className="outer-list">
            <p className="toFrom">From:</p>
            <p className="addressList">{address}</p>
          </div>
          <div className="outer-list">
            <p className="toFrom">To:</p>
            <p className="addressList">{addressTo}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default HistoryListOuter;
