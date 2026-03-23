/* eslint-disable jsx-a11y/alt-text */
/* global chrome*/
import React from "react";
import MenuRestofHeaders from "../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import style from "./style.module.scss";
import BTC from "../../../Assets/Coins/BTC.png";
import ETH from "../../../Assets/Coins/ETH.png";
import ArrowDashedLine from "../../../Assets/arr.svg";
import ButtonComp from "../../../Components/ButtonComp/ButtonComp";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useRef } from "react";
import { Web3Helper } from "../../../helpers/web3.helper";
import { V3_SWAP_ROUTER_ADDRESS } from "../../../config/uniswap.config";
import { message } from "antd";
import { useState } from "react";
import { UniswapHelper } from "../../../helpers/uniswap.helper";
import ModalCustom from "../../../Components/ModalCustom/ModalCustom";
import { ClipLoader } from "react-spinners";
import { PancakeHelper } from "../../../helpers/pancake.helper";
import warning from "../../../Assets/PNG/warning.png";

import {
  CAKE_MAINNET_ROUTER,
  CAKE_TESTNET_ROUTER,
} from "../../../config/pancake.config";
import { Loader } from "../../../Components/Loader/Loader";
import { DURATION } from "../../../config/message.config";
import InputFieldSimple from "../../../Components/InputField/InputFieldSimple";

function getFlooredFixed(v, d) {
  return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
}

function PancakeSwapDetails() {
  const { chain, account, currency, transactions, prices } = useSelector(
    (state) => state
  );

  const firstPrice = prices[chain.chainId]
    ? prices[chain.chainId].find(
        (myPrice) =>
          myPrice.symbol.toUpperCase() === chain.currencySymbol.toUpperCase() &&
          myPrice.fiat_currency === currency.name.toLowerCase()
      )
    : 0;

  const {
    state: { route, token1, token2, amount, amount2, feeAmount },
  } = useLocation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  // console.log({ route, token1, token2, amount, amount2, feeAmount });

  const [requireApproval, setRequireApproval] = useState(true);
  const web3Helper = useRef(new Web3Helper(chain.rpcUrl));
  const pancakeHelper = useRef(new PancakeHelper(chain.chainId, chain.rpcUrl));
  const [isLogoutModalOpen, setLogoutOpenmodal] = useState(false);
  const [swapModal, setSwapModal] = useState(false);
  const [gasPrice, setGasPrice] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(21000);
  const [approvalHash, setApprovalHash] = useState(null);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [sessionPassword, setPassword] = useState(null);
  const [isModalOpen, setOpenmodal] = useState(false);

  const handleOk = () => {
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
  };

  const init = async () => {
    const gasPrice = await web3Helper.current.getGasPrice();
    // console.log(
    //   "🚀 ~ file: PancakeSwapDetails.jsx:67 ~ init ~ gasPrice:",
    //   gasPrice
    // );
    setGasPrice(gasPrice);

    let functionCall = null;

    if (token1.isToken && token2.isToken) {
      functionCall = 1;
    } else if (!token1.isToken && token2.isToken) {
      functionCall = 0;
    } else if (token1.isToken && !token2.isToken) {
      functionCall = 2;
    }

    const myGasEstimate = await pancakeHelper.current.getGasEstimate(
      route,
      account.address,
      amount,
      token1.name,
      token1.symbol,
      token1.image,
      token1.symbol === "BNB" && token2.symbol === "WBNB"
        ? "WRAP"
        : token1.symbol === "WBNB" && token2.symbol === "BNB"
        ? "UNWRAP"
        : null,
      token1.tokenAddress,
      token2.tokenAddress,
      token1.decimals,
      token2.decimals,
      functionCall,
      feeAmount
    );

    // console.log(
    //   "🚀 ~ file: PancakeSwapDetails.jsx:99 ~ init ~ myGasEstimate:",
    //   myGasEstimate
    // );

    if (myGasEstimate.status) {
      // console.log("here");
      setGasEstimate(150000);
    } else {
      // console.log("here2");
      setGasEstimate(myGasEstimate);
    }

    if (token1.isToken) {
      const approvedAmount = await web3Helper.current.checkApproval(
        token1.isToken ? token1.tokenAddress : pancakeHelper.current.WETH,
        account.address,
        chain.testnet ? CAKE_TESTNET_ROUTER : CAKE_MAINNET_ROUTER
      );

      if (approvedAmount === false) {
        setLoading(false);
        return messageApi.error(
          "Unable to fetch approval amount. Please try again later."
        );
      }

      if (parseFloat(approvedAmount) >= parseFloat(amount)) {
        setRequireApproval(false);
        setApprovalConfirmed(true);
        setLoading(false);
      }
    } else {
      setRequireApproval(false);
      setApprovalConfirmed(true);
      setLoading(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (approvalHash) {
      const transaction = transactions[chain.chainId].find(
        (transaction) => transaction.hash === approvalHash
      );

      if (transaction.status === "SUCCESS") {
        setApprovalConfirmed(true);
      }
    }
  }, [transactions]);

  useEffect(() => {
    init();
  }, []);

  const handleSwap = async () => {
    if (requireApproval) {
      setLogoutOpenmodal(true);
      const data = await pancakeHelper.current.sendForApproval(
        token1.tokenAddress,
        account.address,
        token1.name,
        token1.symbol,
        token1.image,
        token1.decimals
      );
      if (!data) {
        setLogoutOpenmodal(false);
        return messageApi.error("Insufficient balance in wallet for gas fee.");
      }
      setLogoutOpenmodal(false);
      setRequireApproval(false);
      setApprovalHash(data.hash);
    } else {
      setSwapModal(true);

      let functionCall = null;

      if (token1.isToken && token2.isToken) {
        functionCall = 1;
      } else if (!token1.isToken && token2.isToken) {
        functionCall = 0;
      } else if (token1.isToken && !token2.isToken) {
        functionCall = 2;
      }

      const data = await pancakeHelper.current.sendSwapTransaction(
        route,
        account.address,
        amount,
        token1.name,
        token1.symbol,
        token1.image,
        token1.symbol === "BNB" && token2.symbol === "WBNB"
          ? "WRAP"
          : token1.symbol === "WBNB" && token2.symbol === "BNB"
          ? "UNWRAP"
          : null,
        token1.tokenAddress,
        token2.tokenAddress,
        token1.decimals,
        token2.decimals,
        functionCall,
        feeAmount
      );

      if (data.status) {
        setSwapModal(false);
        return messageApi.error(data.message);
      }

      setSwapModal(false);
      return navigate("/history");
    }
  };

  return (
    <div className={`scrollableCont`}>
      {loading ? <Loader /> : null}
      {contextHolder}
      <MenuRestofHeaders backTo={"/pancake-swap"} title={"Swap"} />
      <div className={`flexedContent`}>
        <div className="swapDetails">
          <div className="swapDetails__iconsTop">
            <img src={token1.image} width={30} height={30} />
            <img src={ArrowDashedLine} width={144} height={12} />
            <img src={token2.image} width={30} height={30} />
          </div>
          <div className="swapDetails__valueText asdffg">
            <p
              style={{ textAlign: "center" }}
              className="swapDetails__valueText__text"
            >
              <span>To</span>
              <br />
              {parseFloat(amount)} {token1.symbol}
            </p>
            <p
              style={{ textAlign: "center" }}
              className="swapDetails__valueText__text"
            >
              <span>From</span>
              <br />
              {parseFloat(amount2)} {token2.symbol}
            </p>
          </div>
          <div className="swapDetails__border"></div>
          <div className="swapDetails__address">
            <p className="swapDetails__address__key">From</p>
            <p className="swapDetails__address__val">
              <sapn> {account.address}</sapn>
            </p>
          </div>
          <div className="swapDetails__address">
            <p className="swapDetails__address__key">To</p>
            <p className="swapDetails__address__val">
              <sapn> {account.address}</sapn>
            </p>
          </div>
          <div className="swapDetails__border"></div>
          <div className="swapDetails__keyValuesText">
            <div className="swapDetails__keyValuesText__inner">
              <p className="swapDetails__keyValuesText__key">Type</p>
              <p className="swapDetails__keyValuesText__val">On-Chain</p>
            </div>
            <div className="swapDetails__keyValuesText__inner">
              <p className="swapDetails__keyValuesText__key">Network Fee</p>
              <p className="swapDetails__keyValuesText__val">
                {parseFloat(
                  getFlooredFixed(
                    (parseFloat(gasPrice) * parseFloat(gasEstimate)) /
                      Math.pow(10, 18),
                    6
                  )
                )}{" "}
                {chain.currencySymbol} ({currency.symbol}
                {parseFloat(
                  getFlooredFixed(
                    (parseFloat(firstPrice.current_price) *
                      (parseFloat(gasPrice) * parseFloat(gasEstimate))) /
                      Math.pow(10, 18),
                    6
                  )
                ).toLocaleString()}
                )
              </p>
            </div>
          </div>
          <ButtonComp
            onClick={() => {
              setOpenmodal(true);
            }}
            disabled={!approvalConfirmed && approvalHash}
            text={
              requireApproval
                ? "Approve"
                : approvalConfirmed
                ? "Confirm"
                : "Approval Pending"
            }
            maxWidth={"100%"}
          />
        </div>
      </div>
      <ModalCustom
        title={"Approval Request"}
        isModalOpen={isLogoutModalOpen}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <div className="viewphrases__iInner">
            <ClipLoader size={65} color="#00adee" />
            <div
              style={{
                marginTop: "20px",
              }}
            >
              <p>
                Approval request has been processed successfully. Waiting for
                blockchain confirmation.
              </p>
            </div>
          </div>
        </div>
      </ModalCustom>

      <ModalCustom
        title={"Swap Transaction"}
        isModalOpen={swapModal}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <div
            className=" "
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <ClipLoader size={65} color="#00adee" />
            <div
              style={{
                marginTop: "20px",
              }}
            >
              <p className="noAddress">
                Swap request sent. Waiting for blockchain confirmation.
              </p>
            </div>
          </div>
        </div>
      </ModalCustom>

      <ModalCustom
        title={"Enter password"}
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <InputFieldSimple placeholder="Password" getData={setPassword} />
          <div className="viewphrases__iInner">
            <img src={warning} />
            <div>
              <p>Do not share your password with anyone!</p>
              <p>It can be used to steal all your funds.</p>
            </div>
          </div>
          <ButtonComp
            text={"Proceed"}
            maxWidth={"100%"}
            onClick={async () => {
              const isCorrectPassword = await WalletHelper.verifyPassword(
                sessionPassword
              );
              if (!isCorrectPassword) {
                return messageApi.error('Incorrect password provided.');
              }
              handleSwap();
            }}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default PancakeSwapDetails;
