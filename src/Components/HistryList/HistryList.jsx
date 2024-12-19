/*global chrome*/
import { message } from "antd";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DURATION } from "../../config/message.config";
import { capitalize } from "../../helpers/conversion.helper";
import "./HistryList.scss";
import ReceiveIcon from "../../Assets/ReceiveIcon.svg"
function HistryList(props) {
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
  } = props;

  const navigate = useNavigate();

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  return (
    <>
      {contextHolder}
      <div
        className="histryList"
        onClick={() => {
          // if (!spritz) {
          //   navigate('/detail', {
          //     state: {
          //       allData,
          //       coin,
          //     },
          //   });
          // } else {
          //   navigate('/detail-spritz', {
          //     state: {
          //       allData,
          //     },
          //   });
          // }
        }}
      >
        <div className="Status">
          <img src={TickIcon}></img>
          <div className="histryList_Status__Send">
            <p className="withSend">
              {sendRecieve === "WITHDRAW"
                ? "Send"
                : sendRecieve === "DEPOSIT"
                ? "Receive"
                : capitalize(sendRecieve)}
              <span>/{coinname}</span>
            </p>
            <div className="histryStatus">
              <p className="withStatus">
                {spritz ? null : "To | "}
                {address}
              </p>
            </div>
          </div>
        </div>
        <div className="Currency">
          <p className="curncyStatus">{valueCurrency}</p>
          <p className="withStatus">{date}</p>
        </div>
      </div>
    </>
  );
}

export default HistryList;
