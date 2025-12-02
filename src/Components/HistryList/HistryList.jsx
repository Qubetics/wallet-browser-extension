/*global chrome*/
import { message } from "antd";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DURATION } from "../../config/message.config";
import { capitalize } from "../../helpers/conversion.helper";
import { getExplorerUrl } from "../../helpers/explorer.helper";
import "./HistryList.scss"; 
import recieveIcon from "../../Assets/ReceiveIcon.svg"
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
    coinNameNotShow
  } = props;

  const navigate = useNavigate();

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });



  const viewOnExplorer = (e) => {
    e.preventDefault(); 
    e.preventDefault();
    let coinFamily = 'ETH';
    let transactionHash = allData.tx_id;
    
    // Use helper function to get explorer URL based on environment
    const explorer = getExplorerUrl(allData?.coin_family, transactionHash);
    
    // Set coinFamily for display purposes
    switch (allData?.coin_family) {
      case 1:
        coinFamily = 'BNB';
        break;
      case 2:
        coinFamily = 'ETH';
        break;
      case 3:
        coinFamily = 'BTC';
        break;
      case 4:
        coinFamily = 'POL';
        break;
      case 5:
        coinFamily = 'SOL';
        break;
      case 6:
        coinFamily = 'ADA';
        break;
      case 7:
        coinFamily = 'TICS';
        break;
      case 8:
        coinFamily = 'CRO';
        break;
      case 9:
        coinFamily = 'PLS';
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
              {sendRecieve === "Sent"
                ? "Withdraw"
                : sendRecieve === "Received"
                ? "Deposit"
                : capitalize(sendRecieve)}
              {!coinNameNotShow && <span>/{coinname}</span>}
            </p>
            <div className="histryStatus">
              <p className="withStatus">
                {spritz ? null : sendRecieve == 'Sent' ? "To | ":"From | "}
                {/* {address} */}
                {sendRecieve == 'Sent' ? `${allData?.to_adrs?.substring(0, 5)}.....
                      ${allData?.to_adrs?.substring(
                        allData?.to_adrs?.length - 5,
                        allData?.to_adrs?.length
                      )}`  : `${allData?.from_adrs?.substring(0, 5)}.....
                      ${allData?.from_adrs?.substring(
                        allData?.from_adrs?.length - 5,
                        allData?.from_adrs?.length
                      )}`}
              </p>
            </div>
          </div>
        </div>
        <div className="Currency">
          <p className="curncyStatus">{sendRecieve !='Smart Contract' && valueCurrency}</p>
          <p className="withStatus">{date}</p>
        </div>
      </div>
    </>
  );
}

export default HistryList;
