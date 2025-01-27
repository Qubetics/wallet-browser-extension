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
import recieveIcon from "../../Assets/ReceiveIcon.svg"
import swapIcon from "../../Assets/SwapIcon.svg"

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

  console.log("typetypetypetypetype", type);
  

  const updateExp = (e) => {
    e.preventDefault(); 
    e.preventDefault();
    let coinFamily = 'ETH';
    let explorer = '';
    let transactionHash = allData.tx_id;
    switch (allData?.coin_family) {
      case 1:
        coinFamily = 'BNB';
        explorer = `https://bscscan.com/tx/${transactionHash}`;
        break;
      case 2:
        coinFamily = 'ETH';
        explorer = `https://etherscan.io/tx/${transactionHash}`;
        break;
      case 3:
        coinFamily = 'BTC';
        explorer = `https://www.blockchain.com/explorer/transactions/btc/${transactionHash}`;
        break;
      case 4:
        coinFamily = 'POL';
        explorer = `https://polygonscan.com/tx/${transactionHash}`;
        break;
      case 5:
        coinFamily = 'SOL';
        explorer = `https://explorer.solana.com/tx/${transactionHash}`;
        break;
      case 6:
        coinFamily = 'ADA';
        explorer = `https://cardanoscan.io/transaction/${transactionHash}`;
        break;
      case 7:
        coinFamily = 'AVAX';
        explorer = `https://snowtrace.io/tx/${transactionHash}`;
        break;
      case 8:
        coinFamily = 'CRO';
        explorer = `https://cronoscan.com/tx/${transactionHash}`;
        break;
      case 9:
        coinFamily = 'PLS';
        explorer = `https://scan.mypinata.cloud/ipfs/bafybeih3olry3is4e4lzm7rus5l3h6zrphcal5a7ayfkhzm5oivjro2cp4/#/tx/${transactionHash}`;
        break;
      default:
        break;
    }


    if (!allData.tx_id) {
      return messageApi.error('Please wait for transaction hash.');
    }
    chrome.tabs.create({
      url: explorer,
    });
  }

  return (
    <>
      {contextHolder}
      <div className="histryList" onClick={(e) => updateExp(e)}>
        <div className="statusCurrency">
          <div className="Status">
           {type =='deposit' && <img src={recieveIcon}></img>}
           {type =='withdraw' && <img src={TickIcon}></img>}
           {type =='swap' && <img src={swapIcon}></img>}
            <div className="send">
              <p className="sendRecieve">
                {sendRecieve}{' '}
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
