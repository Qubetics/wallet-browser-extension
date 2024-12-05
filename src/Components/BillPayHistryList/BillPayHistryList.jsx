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
function BillPayHistryList(props) {
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
          if (!spritz) {
            navigate("/detail", {
              state: {
                allData,
                coin,
              },
            });
          } else {
            navigate("/detail-billPay-spritz", {
              state: {
                allData,
              },
            });
          }
        }}
      >
        <div className="Status">
          <img src={TickIcon} />
          <div className="histryList_Status__Send">
            <p>
              {/* {sendRecieve === "WITHDRAW"
                ? "Send"
                : sendRecieve === "DEPOSIT"
                ? "Receive"
                : capitalize(sendRecieve)}
              <span>/{coinname}</span> */}
              Bill Paid
            </p>
            <div className="histryStatus">
              <p>
                {spritz ? null : "From | "}
                {address}
              </p>
            </div>
          </div>
        </div>
        <div className="Currency">
          <p className="curncyStatus">
            {valueCurrency}
            {spritz ? null : (
              <>
                <br></br>{" "}
                <span
                  style={{
                    fontSize: "11px",
                    color: "#6e737e",
                    marginLeft: "5px",
                  }}
                >
                  /{def}
                  {dollercurrency}
                </span>
              </>
            )}
          </p>
          <p>
            {" "}
            {spritz ? null : " To | "}
            {addressTo}
          </p>
        </div>
      </div>
    </>
  );
}

export default BillPayHistryList;
