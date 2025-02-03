/*global chrome*/
import { message } from "antd";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DURATION } from "../../config/message.config";
import { capitalize } from "../../helpers/conversion.helper";
import "./HistryList.scss"; 
import recieveIcon from "../../Assets/ReceiveIcon.svg"
import swapIcon1 from "../../Assets/SwapIcon.svg"
import swapIcon from "../../Assets/SwapIconWhite.svg"
import dAppIcon from "../../Assets/datatransfer.svg";



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



  const viewOnExplorer = (e) => {
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
      <div
        className="histryList"
        onClick={(e) => {
          viewOnExplorer(e);
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
          {sendRecieve =='Received' && <img src={recieveIcon}></img>}
          {sendRecieve =='Sent' && <img src={TickIcon}></img>}
          {sendRecieve =='Swap' && <img src={swapIcon}></img>}
          {sendRecieve =='Smart Contract' && <img src={dAppIcon}></img>}
          {sendRecieve =='Cross Chain' && <img src={swapIcon}></img>}
          {sendRecieve =='Approve' && <img src={swapIcon}></img>}

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
