/*global chrome*/
import { message, Tooltip } from "antd";
import React, { useState } from "react";
import { useRef } from "react";
import { useSelector } from "react-redux";
import { DURATION } from "../../config/message.config";
import "./HistryList.scss";
import recieveIcon from "../../Assets/ReceiveIcon.svg";
import swapIcon from "../../Assets/SwapIconWhite.svg";
import dAppIcon from "../../Assets/datatransfer.svg";
import { MpcChainAbstractionHelper } from "../../helpers/chain_abstraction.helperMPC";
import AbstractProcessingModel from "../CustomModelAbstraction/Model";
import { server } from "../../server";
import { getExplorerUrl } from "../../helpers/explorer.helper";

function HistoryListOuter(props) {
  const [transactionResult, setTransactionResult] = useState({
    hash: "",
    status: "",
    solver: "",
    symbol: "",
    fee: "",
    source_address: "",
  });
  const [showsuccess, setShowSuccess] = useState(false);
  const [isProcessModalOpen, setIsProcessModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { chain, account, currency } = useSelector((state) => state);
  const ChainAbstractionInstance = useRef(
    new MpcChainAbstractionHelper(chain.chainId)
  );
  
  const {
    address,
    valueCurrency,
    addressTo,
    TickIcon,
    status,
    date,
    allData,
    type,
  } = props;
  // console.log("props",props);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  // Helper function to get the correct URL path based on coin family
  const getCoinFamilyUrl = (coinFamily) => {
    const urlMap = {
      3: "bitcoin/btc",  // Bitcoin
      7: "qubetics/tics", // Qubetics TICS
    };
    return urlMap[coinFamily] || "bitcoin/btc"; // Default to bitcoin if unknown
  };

  // Update intent status on backend
  const updateIntentStatus = async (coinFamily, intentHash, status) => {
    try {
      const urlPath = getCoinFamilyUrl(coinFamily);
      console.log("Updating intent status:", { urlPath, intentHash, status });

      const data = {
        tx_hash: intentHash,
        tx_status: status,
      };

      const response = await server.post(
        `${urlPath}/updateTransactionStatus`,
        data,
        {
          headers: { Authorization: account.jwtToken },
        }
      );
      
      console.log("Update intent status response:", response);
      return response;
    } catch (error) {
      console.error("Error updating intent status:", error);
      throw error?.message || "Failed to update transaction status";
    }
  };

  const updateExp = async (e) => {
    console.log("Transaction data:", allData);
    e.preventDefault();

    // Prevent multiple simultaneous updates
    if (isUpdating) {
      return;
    }

    let coinFamily = "ETH";
    let explorer = "";
    let transactionHash = allData?.tx_id;
    let txnType = allData?.type;
    let intentData = allData?.intent_data;

    // Handle Chain Abstraction transactions
    if (txnType === "chain_abstraction" || type === "chain_abstraction") {
      if (!transactionHash) {
        return messageApi.error("Transaction hash not available");
      }

      try {
        setIsUpdating(true);
        
        // Poll for the latest status
        const response = await ChainAbstractionInstance.current.pollIntentStatus(
          transactionHash
        );
        
        console.log("Poll intent status response:", response?.data);

        if (!response?.data) {
          return messageApi.error("Unable to fetch transaction status");
        }

        const intentHash = response.data.intent_hash;
        const currentStatus = response.data.status;

        // Set transaction result for modal
        setTransactionResult({
          hash: intentHash || transactionHash,
          status: currentStatus || "pending",
          solver: response.data.solver_id || "N/A",
          fee: intentData?.fees || response.data.fees || "0",
          symbol: allData?.coin_data?.coin_symbol?.toUpperCase() || "",
          source_address: response.data.source_address || address,
        });

        // If status is pending and we got an intent_hash, update backend status
        if (intentHash && (status?.status === "pending" || currentStatus == true || currentStatus == false ) ) {
          try {
            await updateIntentStatus(
              allData?.coin_family,
              transactionHash,
              currentStatus == 1 ? "confirmed" : "failed"
            );
            // messageApi.success("Transaction status updated");
          } catch (updateError) {
            console.error("Error updating backend status:", updateError);
            // Don't block showing modal if update fails
          }
        }

        // Show the processing modal
        setIsProcessModal(true);
      } catch (error) {
        console.error("Error fetching transaction status:", error);
        messageApi.error("Failed to fetch transaction status");
      } finally {
        setIsUpdating(false);
      }
      
      return; // Exit early for chain abstraction
    }

    // Handle regular blockchain transactions
    // Use helper function to get explorer URL based on environment
    explorer = getExplorerUrl(allData?.coin_family, transactionHash);
    
    // Set coinFamily for display purposes
    switch (allData?.coin_family) {
      case 1:
        coinFamily = "BNB";
        break;
      case 2:
        coinFamily = "ETH";
        break;
      case 3:
        coinFamily = "BTC";
        break;
      case 4:
        coinFamily = "POL";
        break;
      case 5:
        coinFamily = "SOL";
        break;
      case 6:
        coinFamily = "ADA";
        break;
      case 7:
        coinFamily = 'TICS';
        break;
      case 8:
        coinFamily = "CRO";
        break;
      case 9:
        coinFamily = "PLS";
        break;
      default:
        break;
    }

    if (!allData.tx_id) {
      return messageApi.error("Please wait for transaction hash.");
    }

    chrome.tabs.create({
      url: explorer,
    });
  };

  // Determine which status to display
  const getDisplayStatus = () => {
    if (type === "chain_abstraction") {
      // For chain abstraction, use status field
      return status?.status || "pending";
    } else {
      // For regular transactions, use blockchain_status
      return status?.blockchain_status || status?.status || "pending";
    }
  };

  const displayStatus = getDisplayStatus();

  return (
    <>
      {contextHolder}
      <div 
        className="histryList" 
        onClick={(e) => updateExp(e)}
        // style={{ cursor: isUpdating ? "wait" : "pointer" }}
      >
        <div className="statusCurrency">
          <div className="Status">
            {type === "deposit" && <img src={recieveIcon} alt="deposit" />}
            {type === "withdraw" && <img src={TickIcon} alt="withdraw" />}
            {type === "swap" && <img src={swapIcon} alt="swap" />}
            {type === "cross_chain" && <img src={swapIcon} alt="cross-chain" />}
            {type === "dapp" && <img src={dAppIcon} alt="dapp" />}
            {type === "approve" && <img src={swapIcon} alt="approve" />}
            {type === "chain_abstraction" && <img src={swapIcon} alt="chain-abstraction" />}
            {![
              "deposit",
              "withdraw",
              "swap",
              "cross_chain",
              "dapp",
              "approve",
              "chain_abstraction",
            ].includes(type) && <img src={TickIcon} alt="default" />}

            <div className="send">
              <p className="sendRecieve">
                {/* {sendRecieve} */}
                {type =='deposit' && <span>Deposit</span>}
                {type =='withdraw' && <span>Withdraw</span>}
                {type =='swap' && <span>Swap</span>}
                {type =='cross_chain' && <span>Cross Chain</span>}
                {type =='dapp' && <span>Smart Contract</span>}
                {type=='approve' && <span>Approve</span>}
                {/* Default case added  */}
                {!['deposit', 'withdraw', 'swap', 'cross_chain', 'dapp', 'approve'].includes(type) && (
                 <span>Withdraw</span>
                 )}
                {' '}
                {type !='dapp' && valueCurrency}
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
                  displayStatus === "confirmed" || displayStatus === "completed"
                    ? "#00BE00"
                    : displayStatus === "failed"
                    ? "#FF0D0D"
                    : "#ECB300",
              }}
            >
              {displayStatus === "confirmed" || displayStatus === "completed"
                ? "Completed"
                : displayStatus === "failed"
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
      <AbstractProcessingModel
        showProcessing={isProcessModalOpen}
        setShowProcess={setIsProcessModal}
        showSuccess={showsuccess}
        setSuccessModal={setShowSuccess}
        transactionResult={transactionResult}
        setTransactionResult={setTransactionResult}
        loader={false}
        onClose={() => {
          console.log("Modal was closed!");
          setTransactionResult({
            hash: "",
            fee: "",
            link: "",
            status: "",
            symbol: "",
            solver: "",
            source_address: "",
          });
        }}
      />
    </>
  );
}

export default HistoryListOuter;