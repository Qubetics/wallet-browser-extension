/*global chrome*/
import { message } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import moment from "moment";
import { DURATION } from "../../config/message.config";
import { addCommasToNumber, getFlooredFixed } from "../../helpers/conversion.helper";
import { MpcChainAbstractionHelper } from "../../helpers/chain_abstraction.helperMPC";
import AbstractProcessingModel from "../CustomModelAbstraction/Model";
import { server } from "../../server";
import "./ChainAbstractionHistoryItem.scss";
import swapIcon from "../../Assets/SwapIconWhite.svg";
import BTCImage from "../../Assets/Coins/BTC.png";
import QubeticsImage from "../../Assets/QubeticsLogo.png";
import CopyIcon from "../../Assets/CopyIcon.svg";

function ChainAbstractionHistoryItem(props) {
  const {
    allData,
    onRefreshList,
  } = props;
  
  const { chain, account } = useSelector((state) => state);
  
  // Derive date and status from allData - no need for props
  const date = allData?.created_at ? moment(allData.created_at).format('MMM D, YYYY | hh:mm A') : '';
  const status = {
    blockchain_status: allData?.blockchain_status,
    status: allData?.status
  };
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });

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
  const [wasStatusUpdated, setWasStatusUpdated] = useState(false);
  const [sourceCoinImage, setSourceCoinImage] = useState(null);
  const [destinationCoinImage, setDestinationCoinImage] = useState(null);

  const ChainAbstractionInstance = useRef(
    new MpcChainAbstractionHelper(chain.chainId)
  );
  
  // Rate limiting for copy functionality
  const copyClickHistory = useRef([]);
  const lastErrorTime = useRef(0);
  const lastCopyTime = useRef(0);
  const RATE_LIMIT_WINDOW = 3000; // 3 seconds
  const MAX_CLICKS_PER_WINDOW = 1; // Max 1 click per 3 seconds
  const ERROR_MESSAGE_COOLDOWN = 5000; // 5 seconds between error messages
  const MIN_COPY_INTERVAL = 1000; // Minimum 1 second between copy operations

  // Get coin images from chrome storage
  useEffect(() => {
    const fetchCoinImages = async () => {
      try {
        const { chains } = await chrome.storage.local.get("chains");
        // coin_family is at root level, not in coin_data
        const sourceCoinFamily = allData?.coin_family;
        
        if (!chains || !Array.isArray(chains)) {
          // Fallback to default images
          if (sourceCoinFamily == 3) {
            setSourceCoinImage(BTCImage);
            setDestinationCoinImage(QubeticsImage);
          } else if (sourceCoinFamily == 7) {
            setSourceCoinImage(QubeticsImage);
            setDestinationCoinImage(BTCImage);
          }
          return;
        }

        // Get source coin image
        const sourceChain = chains.find((c) => c.coinFamily == sourceCoinFamily);
        
        if (sourceChain?.image) {
          setSourceCoinImage(sourceChain.image);
        } else {
          // Fallback based on coin family
          setSourceCoinImage(sourceCoinFamily == 3 ? BTCImage : QubeticsImage);
        }

        // Destination is always opposite of source for chain abstraction
        const destCoinFamily = sourceCoinFamily == 3 ? 7 : 3;
        const destChain = chains.find((c) => c.coinFamily == destCoinFamily);
        
        if (destChain?.image) {
          setDestinationCoinImage(destChain.image);
        } else {
          // Fallback based on coin family
          setDestinationCoinImage(destCoinFamily == 3 ? BTCImage : QubeticsImage);
        }
      } catch (error) {
        // console.error("Error fetching coin images:", error);
        // Fallback to default images
        const sourceCoinFamily = allData?.coin_family;
        if (sourceCoinFamily == 3) {
          setSourceCoinImage(BTCImage);
          setDestinationCoinImage(QubeticsImage);
        } else if (sourceCoinFamily == 7) {
          setSourceCoinImage(QubeticsImage);
          setDestinationCoinImage(BTCImage);
        }
      }
    };

    fetchCoinImages();
  }, [allData]);

  // Get source coin info from transaction data
  const getSourceCoin = () => {
    const coinData = allData?.coin_data;
    
    return {
      name: coinData?.coin_name || "Qubetics",
      symbol: coinData?.coin_symbol?.toUpperCase() || "TICS",
      amount: allData?.amount || 0,
    };
  };

  // Get destination coin info
  // For chain abstraction, destination must always be the opposite of source (BTC <-> TICS)
  const getDestinationCoin = () => {
    // coin_family is at root level
    const sourceCoinFamily = allData?.coin_family;
    
    // Enforce cross-chain: If source is BTC (3), destination MUST be TICS (7)
    // If source is TICS (7), destination MUST be BTC (3)
    const destCoinFamily = sourceCoinFamily == 3 ? 7 : 3;
    const destSymbol = destCoinFamily == 3 ? "BTC" : "TICS";
    const destName = destCoinFamily == 3 ? "Bitcoin" : "Qubetics";
    
    return {
      name: destName,
      symbol: destSymbol,
      amount: allData?.amount || 0,
      address: allData?.to_adrs,
      coinFamily: destCoinFamily,
      trx_id: allData?.tx_id,
    };
  };

  const sourceCoin = getSourceCoin();
  const destinationCoin = getDestinationCoin();

  // Helper function to get the correct URL path based on coin family
  const getCoinFamilyUrl = (coinFamily) => {
    const urlMap = {
      3: "bitcoin/btc",
      7: "qubetics/tics",
    };
    return urlMap[coinFamily] || "bitcoin/btc";
  };

  // Update intent status on backend
  const updateIntentStatus = async (coinFamily, intentHash, status) => {
    try {
      const urlPath = getCoinFamilyUrl(coinFamily);
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
      
      return response;
    } catch (error) {
      // console.error("Error updating intent status:", error);
      throw error?.message || "Failed to update transaction status";
    }
  };

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const transactionHash = allData?.tx_id;
    if (!transactionHash) {
      return messageApi.error("Transaction hash not available");
    }

    try {
      setIsUpdating(true);

      const intentId = (allData?.intent_hash || transactionHash || "").replace(/^0x/, "");
      if (!intentId) {
        messageApi.error("Intent hash not available");
        setIsUpdating(false);
        return;
      }

      const details = await ChainAbstractionInstance.current.getIntentDetails(intentId);
      if (!details || details?.status === "not_found") {
        messageApi.error("Unable to fetch transaction status");
        setIsUpdating(false);
        return;
      }

      const intentStatus = String(details?.intent_status || "Pending").toLowerCase();
      let statusValue = 2;
      if (intentStatus === "completed" || intentStatus === "solved") statusValue = 1;
      if (intentStatus === "failed" || intentStatus === "rejected") statusValue = 0;

      setTransactionResult({
        hash: details?.intent_hash || details?.user_to_network_tx_id || transactionHash,
        status: statusValue,
        solver: details?.final_solver_id || "N/A",
        fee: allData?.intent_data?.fees || allData?.tx_fee || "0",
        symbol: sourceCoin.symbol || "",
        source_address: details?.source_address || allData?.from_adrs || "",
        trx_id: allData?.tx_id,
      });
      
      setIsProcessModal(true);

      const listStatusRaw = status?.status || status?.blockchain_status || "pending";
      let normalizedListStatus = "pending";
      
      // Convert numeric status to string status
      if (listStatusRaw === "2" || listStatusRaw === 2) {
        normalizedListStatus = "pending";
      } else if (listStatusRaw === "1" || listStatusRaw === 1 || listStatusRaw === "confirmed" || listStatusRaw === "completed") {
        normalizedListStatus = "confirmed";
      } else if (listStatusRaw === "0" || listStatusRaw === 0 || listStatusRaw === "failed") {
        normalizedListStatus = "failed";
      } else {
        // For string statuses, convert to lowercase
        normalizedListStatus = String(listStatusRaw).toLowerCase();
      }
      
      const normalizedIntentStatus =
        intentStatus === "completed" || intentStatus === "solved"
          ? "confirmed"
          : intentStatus === "failed" || intentStatus === "rejected"
          ? "failed"
          : "pending";

      const shouldUpdate = (details?.intent_hash || transactionHash) && 
                           normalizedListStatus === "pending" && 
                           (normalizedIntentStatus === "confirmed" || normalizedIntentStatus === "failed") &&
                           normalizedListStatus !== normalizedIntentStatus;

      if (shouldUpdate) {
        try {
          await updateIntentStatus(
            allData?.coin_family,
            transactionHash,
            normalizedIntentStatus
          );
          // Mark that status was updated - will refresh list when modal closes
          setWasStatusUpdated(true);
        } catch (updateError) {
          // console.error("Error updating backend status:", updateError);
        }
      }

    } catch (error) {
      // console.error("Error fetching transaction status:", error);
      messageApi.error("Failed to fetch transaction status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyAddress = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    
    // Check minimum interval between copy operations
    if (now - lastCopyTime.current < MIN_COPY_INTERVAL) {
      return; // Silently ignore rapid clicks
    }
    
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Filter out clicks outside the time window
    copyClickHistory.current = copyClickHistory.current.filter(
      timestamp => timestamp > windowStart
    );
    
    // Check if too many clicks in the time window
    if (copyClickHistory.current.length >= MAX_CLICKS_PER_WINDOW) {
      // Only show error if enough time has passed since last error message
      if (now - lastErrorTime.current >= ERROR_MESSAGE_COOLDOWN) {
        messageApi.error("Please slow down. Too many copy attempts.");
        lastErrorTime.current = now;
      }
      return;
    }
    
    // Add current click timestamp
    copyClickHistory.current.push(now);
    lastCopyTime.current = now;
    
    // Perform the copy
    navigator.clipboard.writeText(destinationCoin.address);
    messageApi.success("Address copied to clipboard");
  };

  // Determine display status
  const getDisplayStatus = () => {
    const statusValue = status?.status || status?.blockchain_status || "pending";
    // Handle numeric status codes: "0" = failed, "1" = confirmed, "2" = pending
    if (statusValue === "confirmed" || statusValue === "completed" || statusValue === "1" || statusValue === 1) {
      return { text: "Completed", color: "#00BE00" };
    } else if (statusValue === "failed" || statusValue === "0" || statusValue === 0) {
      return { text: "Failed", color: "#FF0D0D" };
    } else {
      // "2" or 2 or "pending" or any other value defaults to pending
      return { text: "Pending", color: "#ECB300" };
    }
  };

  const displayStatus = getDisplayStatus();
  
  // Format amount with appropriate decimal places for small numbers
  const formatAmount = (amt) => {
    const amount = parseFloat(amt || 0);
    if (amount === 0) return '0';
    // For very small amounts (< 0.0001), use 8 decimal places
    // For larger amounts, use 5 decimal places
    const decimals = amount > 0 && amount < 0.0001 ? 8 : 5;
    const formatted = getFlooredFixed(amount, decimals);
    // Remove trailing zeros but keep at least one digit after decimal if needed
    return formatted.replace(/\.?0+$/, '') || '0';
  };
  
  const valueCurrency = `${addCommasToNumber(formatAmount(sourceCoin.amount))} ${sourceCoin.symbol}`;

  return (
    <>
      {contextHolder}
      <div 
        className="histryList chain-abstraction-item"
        style={{ cursor: "default" }}
      >
        <div className="statusCurrency">
          <div className="Status">
            <div className="swap-icon-bg">
            <img src={swapIcon} alt="chain-abstraction" />
            </div>
            <div className="send">
              <p className="sendRecieve">{date}</p>
              <div className="histryStatus">
                <p style={{ color: displayStatus.color }}>{displayStatus.text}</p>
              </div>
            </div>
          </div>
          <div className="Currency">
            <button
              className="viewButton"
              onClick={handleClick}
              disabled={isUpdating}
              style={{ cursor: isUpdating ? "wait" : "pointer" }}
            >
              {isUpdating ? "..." : "View"}
            </button>
          </div>
        </div>
        <div>
          <div className="outer-list">
            <p className="toFrom">Source</p>
            <div className="source-row">
              <div className="source-row__left">
              {sourceCoinImage ? (
                <img 
                  src={sourceCoinImage} 
                  alt={sourceCoin.name}
                    className="source-coin-img"
                  onError={(e) => {
                    e.target.style.display = "none";
                    const placeholder = e.target.nextElementSibling;
                    if (placeholder) placeholder.style.display = "flex";
                  }}
                />
              ) : null}
              <div 
                className="coin-icon-placeholder-small"
                style={{ display: sourceCoinImage ? "none" : "flex" }}
              >
                {sourceCoin.name.charAt(0)}
              </div>
                <span className="source-name">{sourceCoin.name}</span>
              </div>
              <span className="source-amount">
                {(() => {
                  const amount = parseFloat(sourceCoin.amount || 0);
                  const decimals = amount > 0 && amount < 0.0001 ? 8 : 5;
                  const formatted = getFlooredFixed(amount, decimals);
                  const cleaned = formatted.replace(/\.?0+$/, '') || '0';
                  return `${addCommasToNumber(cleaned)} ${sourceCoin.symbol}`;
                })()}
              </span>
            </div>
          </div>
          <div className="source-destination-divider" />
          <div className="outer-list">
            <p className="toFrom">Destination Recipient Address</p>
            {destinationCoin.address && (
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="addressList" style={{ color: "white", fontFamily: "monospace", fontSize: "13px" }}>
                  {destinationCoin.address}
                </span>
                <button 
                  onClick={handleCopyAddress}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                <img src={CopyIcon} alt="copy" width={16} height={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AbstractProcessingModel
        showProcessing={false}
        setShowProcess={setIsProcessModal}
        showSuccess={isProcessModalOpen}
        setSuccessModal={setIsProcessModal}
        transactionResult={transactionResult}
        setTransactionResult={setTransactionResult}
        loader={false}
        onClose={() => {
          // console.log("Modal was closed!");
          setIsProcessModal(false);
          setTransactionResult({
            hash: "",
            fee: "",
            link: "",
            status: "",
            symbol: "",
            solver: "",
            source_address: "",
          });
          
          // Only refresh the list if status update API was called
          if (wasStatusUpdated && onRefreshList && typeof onRefreshList === 'function') {
            onRefreshList();
          }
          
          // Reset the flag
          setWasStatusUpdated(false);
        }}
      />
    </>
  );
}

export default ChainAbstractionHistoryItem;
