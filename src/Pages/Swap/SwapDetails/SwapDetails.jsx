/* eslint-disable jsx-a11y/alt-text */
/*global chrome*/
import React from "react";
import MenuRestofHeaders from "../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import "./SwapDetails.scss";
import BTC from "../../../Assets/Coins/BTC.png";
import ETH from "../../../Assets/Coins/ETH.png";
import ArrowDashedLine from "../../../Assets/ArrowDashedLine.svg";
import ButtonComp from "../../../Components/ButtonComp/ButtonComp";
import arr from "../../../Assets/arr.svg"
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useRef } from "react";
import { Web3Helper } from "../../../helpers/web3.helper";
import {
  UNI_MAINNET_ROUTER,
  UNI_TESTNET_ROUTER,
} from "../../../config/uniswap.config";
import { message, Tooltip } from "antd";
import { useState } from "react";
import { UniswapHelper } from "../../../helpers/uniswap.helper";
import ModalCustom from "../../../Components/ModalCustom/ModalCustom";
import { ClipLoader } from "react-spinners";
import { Loader } from "../../../Components/Loader/Loader";
import { DURATION } from "../../../config/message.config";
import warning from "../../../Assets/PNG/warning.png";
import DarkLogo from "../../../Assets/DarkLogo.svg";
import Logo from "../../../Assets/logo.png";
import InputFieldSimple from "../../../Components/InputField/InputFieldSimple";
import BigNumber from "bignumber.js";
import { PancakeHelper } from "../../../helpers/pancake.helper";
import { CAKE_MAINNET_ROUTER } from "../../../config/pancake.config";
import {
  addCommasToNumber,
  getFlooredFixed,
} from "../../../helpers/conversion.helper";
import { server } from "../../../server";
import { WalletHelper } from "../../../helpers/wallet.helper";
import { PulseChainHelper } from "../../../helpers/pulsechain.helper";
import { PULSE_MAINNET_ROUTER } from "../../../config/pulsechain.config";
import {
  Native,
  ChainId,
  CurrencyAmount,
  TradeType,
  Percent,
  ERC20Token,
} from "@pancakeswap/sdk";
import {
  SmartRouter,
  SmartRouterTrade,
  SMART_ROUTER_ADDRESSES,
  SwapRouter,
} from "@pancakeswap/smart-router/evm";
import { UNISWAP_NATIVE_WRAPPED_TOKEN_ADDRESSES } from "../../../config/uniswap.config";
import { PANCAKE_NATIVE_WRAPPED_TOKEN_ADDRESSES } from "../../../config/pancake.config";
import axios from "axios";
import { SolanaHelper } from "../../../helpers/solana.helper";
import { PublicKey } from "@solana/web3.js";
import {
  EditOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";

function SwapDetails() {
  const { chain, account, currency, theme } = useSelector((state) => state);
  const chainId = ChainId.BSC;

  const {
    state: {
      route,
      token1,
      token2,
      amount,
      amount2,
      feeAmount,
      slippage,
      isWrap,
      adminSwapFee,
      commision,
    },
  } = useLocation();

  console.log({
    route,
    token1,
    token2,
    amount,
    amount2,
    feeAmount,
    slippage,
    isWrap,
  });
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const [requireApproval, setRequireApproval] = useState(
    true
  );
  const [isLogoutModalOpen, setLogoutOpenmodal] = useState(false);
  const [swapModal, setSwapModal] = useState(false);
  const [gasPrice, setGasPrice] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(50000);
  const [approvalHash, setApprovalHash] = useState(null);
  const [approvalConfirmed, setApprovalConfirmed] = useState(
    false
  );
  const [loading, setLoading] = useState(true);
  const [sessionPassword, setPassword] = useState(null);
  const [isModalOpen, setOpenmodal] = useState(false);
  const [networkPrice, setNetworkPrice] = useState(0);
  const [networkPriceFiat, setNetworkPriceFiat] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [adminAddress, setAdminAddress] = useState(null);
  const [adminTransferGasFee, setAdminTransferGasFee] = useState(null);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [infoMessage, setInfoMessage] = useState(null);
  const handleOk = () => {
    setOpenmodal(false);
    setPassword(null);
  };

  const handleCancel = () => {
    setPassword(null);
    setOpenmodal(false);
  };

  const showModal = () => {
    setIsModalOpen1(true);
  };
  const handleOk1 = () => {
    setIsModalOpen1(false);
  };
  const handleCancel1 = () => {
    setIsModalOpen1(false);
    return navigate("/wallet");
  };

  const init = async () => {
    try {
      const parentCoin = await server.post(
        "/wallet/nativeCoinFiatPrice",
        {
          coin_family: token1.coinFamily,
          fiat_currency: currency.name,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      let finalFee = 0;
      const gasPrice = await Web3Helper.getGasPrice(
        token1.chain.slug,
        token1.address,
        token1.address,
        token1.isToken,
        token1.tokenAddress,
        token1.symbol.toLowerCase()
      );

      console.log("GASSSSSSSSSSSSSSS ", gasPrice);


      setGasPrice(gasPrice.fast);

      let estimatedGasUsed;

      // estimatedGasUsed = route.estimatedGasUsed.toString() * 2;
      estimatedGasUsed = route.gas.toString();
      setGasEstimate(estimatedGasUsed);

      let finalGasFee =
        (gasPrice.fast * Math.pow(10, 9) * parseInt(estimatedGasUsed) * 1.5) /
        Math.pow(10, 18);

      console.log("SINALLLLLLLLLLL ", finalGasFee, finalFee);
      console.log("parentCoinparentCoin ", parentCoin);


      setNetworkPrice(
        addCommasToNumber(
          getFlooredFixed(Number(finalGasFee) + Number(finalFee), 6)
        )
      );
      setNetworkPriceFiat(
        addCommasToNumber(
          getFlooredFixed(
            (Number(finalGasFee) + Number(finalFee)) *
            parseFloat(parentCoin.data.data.fiatCoinPrice.value),
            4
          )
        )
      );

      console.log("token1.tokenAddress-----> ", token1.tokenAddress);
      console.log("token1.address-----> ", token1.address);

      if (token1.isToken) {
        const approvedAmount = await Web3Helper.checkApproval(
          token1.tokenAddress, // token add
          token1.address, // owner add
          "0x1111111254eeb25477b68fb85ed929f73a960582",
          token1.rpc
        );
        console.log("🚀 ~ init ~ approvedAmount:", approvedAmount);
        console.log("approvedAmount === false:::", approvedAmount === false);

        if (approvedAmount === false) {
          setLoading(false);
          return messageApi.error(
            "Unable to fetch approval amount. Please try again later."
          );
        }

        const approvedAmountBig = new BigNumber(approvedAmount);
        console.log("approvedAmountBig>>>", approvedAmountBig.toFixed(10));
        const amountBig = new BigNumber(amount);
        // console.log(amountBig.toFixed(10));

        if (approvedAmountBig.isGreaterThan(amountBig)) {
          console.log("Inside Here");
          setRequireApproval(false);
          setApprovalConfirmed(true);
          setLoading(false);
        }
      } else {
        setRequireApproval(false);
        setApprovalConfirmed(true);
        setLoading(false);
      }

      // console.log("END OF FUNCTION");
      setLoading(false);
    } catch (error) {
      console.log("Swap error : ", error);
      setLoading(false);
      return messageApi.error("Something went wrong");
    }
  };

  const checkTransactionStatus = async () => {
    const uniswapHelper = new UniswapHelper(token1.rpc);
    const result = await uniswapHelper.getTransactionStatusThroughHash(
      approvalHash
    );

    if (result == false) {
      return;
    }

    if (result == 1) {
      setApprovalConfirmed(true);
      setRequireApproval(false);
    } else if (result == 0) {
      setApprovalConfirmed(false);
      setRequireApproval(true);
    }
  };

  useEffect(() => {
    if (approvalHash) {
      const checkApprovalStatus = setInterval(() => {
        checkTransactionStatus();
      }, 2000);

      if (approvalConfirmed) {
        clearInterval(checkApprovalStatus);
      }
    }
  }, [approvalHash]);

  useEffect(() => {
    init();
  }, []);

  const handleSwap = async () => {
    try {
      // console.log("TOKENNNNNNNNNNNNNNN ", token1 , token1?.coin?.token_address);
      // console.log("XXXXXXXXXXXXXXXXXXXX ", token2);
      let amtTosend = amount;
      const bal = token1?.balance * token1?.coin?.fiat_price_data?.value;
      // const totalAmt = (parseFloat(amount)+parseFloat(networkPrice)) * token1?.coin?.fiat_price_data?.value
      const totalAmt = (parseFloat(amount) * token1?.coin?.fiat_price_data?.value) + parseFloat(networkPriceFiat);
      // console.log('ppppppppppppppppp', token1, " amount : ", amount ,  " networkPrice : ", networkPrice, " networkPriceFiat ", networkPriceFiat);
      // console.log("SEND DETAIL : ", bal, totalAmt);
      // console.log("COME CHECK COIN");
      if ((parseFloat(token1?.balance) < (parseFloat(amount) + parseFloat(networkPrice))) && !token1?.coin?.token_address) {
        amtTosend = parseFloat(amount) - parseFloat(networkPrice * 1.5);
      }
      // if(bal<totalAmt && !token1?.coin?.token_address){
      //   return messageApi.error(
      //     "Insufficient balance to proceed with the transaction."
      //   );
      // }

      const totalAmtToken = (parseFloat(amount) * token1?.coin?.fiat_price_data?.value);
      // console.log("COME CHECK TOKEN");
      if (bal < totalAmtToken && token1?.coin?.token_address) {
        return messageApi.error(
          "Insufficient balance to proceed with the transaction."
        );
      }


      const uniHelper = new UniswapHelper(token1.rpc);

      if (requireApproval) {
        setLogoutOpenmodal(true);
        console.log("ZZZZZZZZZZZZ ", token1.tokenAddress,
          token1.address,
          "0x1111111254eeb25477b68fb85ed929f73a960582",
          token1.chain.slug,
          token1.isToken ? token1.tokenAddress : token1.symbol.toLowerCase(),
          token1.isToken,
          parseInt(token1.chain.chainId));

        const data = await uniHelper.sendForApproval(
          token1.tokenAddress,
          token1.address,
          "0x1111111254eeb25477b68fb85ed929f73a960582",
          token1.chain.slug,
          token1.isToken ? token1.tokenAddress : token1.symbol.toLowerCase(),
          token1.isToken,
          parseInt(token1.chain.chainId)
        );

        console.log("ccccccccccccccccccc", data);

        if (!data) {
          setSwapModal(false);
          setLogoutOpenmodal(false);
          return messageApi.error(
            "Insufficient balance in wallet for gas fee."
          );
        }
        setLogoutOpenmodal(false);
        setRequireApproval(false);
        setApprovalHash(data);
      } else {
        setSwapModal(true);

        if (token1.isToken) {
          const approval = await Web3Helper.checkApproval(
            token1.tokenAddress, // token add
            token1.address, // owner add
            "0x1111111254eeb25477b68fb85ed929f73a960582",
            token1.rpc
          );

          console.log("approvalapproval ", approval, " :: amount :: ", amount);

          if (
            parseFloat(approval) <= parseFloat(amount) ||
            approval === false
          ) {
            setSwapModal(false);
            return messageApi.error(
              "Please wait for approval to be completed."
            );
          }
        }

        // let amtSend = isMax ? (amount-networkPrice) : amount
        const data = await uniHelper.sendSwapTransaction(
          route,
          token1.address,
          amtTosend,
          token1,
          token1.chain.slug,
          token1.symbol.toLowerCase(),
          token1.isToken,
          slippage,
          commision
        );

        console.log("SWAAAAAAAAAAAAAAAAa ", data);

        if (!data) {
          setSwapModal(false);
          return messageApi.error("Something went wrong.");
        }
        setSwapModal(false);
        setIsModalOpen1(true);
      }
    } catch (error) {
      console.log("Confirm transaction error : ", error);
    }
  };

  return (
    <div className={`scrollableCont`}>
      {loading ? <Loader /> : null}
      {contextHolder}
      <MenuRestofHeaders backTo={"/swap"} title={"Confirm Swap"} />
      <div className={`flexedContent`}>
        <div className="swapDetails">
          <div className="swapDetails-bg">
            <div className="swapDetails__iconsTop">
              {token1.image ? (
                <img src={token1.image} width={30} height={30} />
              ) : (
                <div
                  style={{
                    alignItems: "center",
                    backgroundColor: "rgba(98,126,234,.2)",
                    borderRadius: "49%",
                    display: "flex",
                    height: "29px",
                    justifyContent: "center",
                    width: "29px",
                    marginRight: "15px",
                  }}
                >
                  {" "}
                  {token1?.symbol.split("")[0]}
                </div>
              )}
              <img src={arr} width={144} height={12} />
              {token2.image ? (
                <img src={token2.image} width={30} height={30} />
              ) : (
                <div
                  style={{
                    alignItems: "center",
                    backgroundColor: "rgba(98,126,234,.2)",
                    borderRadius: "49%",
                    display: "flex",
                    height: "29px",
                    justifyContent: "center",
                    width: "29px",
                    marginRight: "15px",
                  }}
                >
                  {" "}
                  {token2?.symbol.split("")[0]}
                </div>
              )}
            </div>
            <div className="swapDetails__valueText">
              <p className="swapDetails__valueText__text">
                <p style={{ margin: 0 }}>From</p>
                {addCommasToNumber(getFlooredFixed(parseFloat(amount), 8))}{" "}
                {token1.symbol}
              </p>
              <p className="swapDetails__valueText__text">
                <p style={{ margin: 0 }}>To</p>
                {addCommasToNumber(getFlooredFixed(parseFloat(amount2), 6))}
                {token2.symbol}
              </p>
            </div>
          </div>
          {/* <div className="swapDetails__border"></div> */}
          <div style={{ marginTop: "16px" }} className="swapDetails-bg">
            <div className="swapDetails__address">
              <p className="swapDetails__address__key">From</p>
              <p className="swapDetails__address__val">
                <span>
                  <Tooltip title={`${token1?.address}`}>
                    {token1.address?.substring(0, 7)}.....
                    {token1.address?.substring(
                      token1.address?.length - 7,
                      token1.address?.length
                    )}
                  </Tooltip>
                </span>
              </p>
            </div>
            <div className="swapDetails__address">
              <p className="swapDetails__address__key">To</p>
              <p className="swapDetails__address__val">
                <span>
                  <Tooltip title={`${token1?.address}`}>
                    {token1.address?.substring(0, 7)}.....
                    {token1.address?.substring(
                      token1.address?.length - 7,
                      token1.address?.length
                    )}
                  </Tooltip>
                </span>
              </p>
            </div>
          </div>

          {/* <div className="swapDetails__border"></div> */}
          <div className="swapDetails__keyValuesText">
            <div className="swapDetails__keyValuesText__inner">
              <p className="swapDetails__keyValuesText__key">Type</p>
              <p className="swapDetails__keyValuesText__val">
                <span>On-Chain</span>
              </p>
            </div>
            <div className="swapDetails__keyValuesText__inner">
              <p className="swapDetails__keyValuesText__key">Network Fee</p>
              <p className="swapDetails__keyValuesText__val">
                <span>
                  {networkPrice}{" "}
                  {token1.coinFamily == 1
                    ? "BNB"
                    : token1.coinFamily == 2
                      ? "ETH"
                      : token1.coinFamily == 4
                        ? "POL"
                        : "BNB"}{" "}
                  ({currency.symbol}
                  {networkPriceFiat})
                </span>
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
                  ? "Swap"
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
                textAlign: "center",
              }}
            >
              <p
                style={{
                  textAlign: "center",
                }}
              >
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
            className=""
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
                textAlign: "center",
              }}
            >
              <p
                className="noAddress"
                style={{
                  textAlign: "center",
                }}
              >
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
          <div
            style={{
              marginBottom: "36px",
              width: "100%",
            }}
          >
            <InputFieldSimple
              placeholder="Password"
              getData={setPassword}
              value={sessionPassword}
              customFunction={async () => {
                const { password } = await chrome.storage.session.get(
                  "password"
                );

                if (sessionPassword !== password) {
                  return messageApi.error("Incorrect password provided.");
                }

                setOpenmodal(false);
                setPassword(null);

                handleSwap();
              }}
            />
            <div className="viewphrases__iInner">
              <img src={warning} />
              <div>
                <p>Do not share your password with anyone!</p>
                <p>It can be used to steal all your funds.</p>
              </div>
            </div>
          </div>
          <ButtonComp
            text={"Proceed"}
            maxWidth={"100%"}
            onClick={async () => {
              const { password } = await chrome.storage.session.get("password");

              if (sessionPassword !== password) {
                return messageApi.error("Incorrect password provided.");
              }

              setOpenmodal(false);
              setPassword(null);

              handleSwap();
            }}
          />
        </div>
      </ModalCustom>

      <ModalCustom
        // title={"Show Secret Phrase"}
        handleCancel={handleCancel1}
        isModalOpen={isModalOpen1}
        handleOk={handleOk1}
        customClass="customClassModal"
      >
        <div className={"confirmationsModal"}>
          <div className={"iInner"}>
            {theme == "darkTheme" ? (
              <img src={DarkLogo} />
            ) : (
              <img
                src={Logo}
                style={{
                  height: "100px",
                }}
              />
            )}
            <div>
              <p>
                Swap request of {addCommasToNumber(getFlooredFixed(amount, 5))}{" "}
                {token1.symbol.toUpperCase()} has been processed successfully.
              </p>
            </div>
          </div>
          <ButtonComp
            text={"OK"}
            maxWidth={"100%"}
            onClick={() => {
              return navigate("/wallet");
            }}
          />
        </div>
      </ModalCustom>
      {infoMessage && (
        <ModalCustom
          isModalOpen={infoMessage}
          title={""}
          handleCancel={() => setInfoMessage("")}
          customClass={"disclamerModalSec "}
        >
          <div className="mainTanceSecModal">
            {theme == "darkTheme" ? <img src={DarkLogo} /> : <img src={Logo} />}

            <p className={theme == "darkTheme" ? "lightText" : "darkText"}>
              {infoMessage}
            </p>
            <ButtonComp
              maxWidth={"100%"}
              marginTop={"25px"}
              text={"Ok"}
              onClick={() => setInfoMessage("")}
            />
          </div>
        </ModalCustom>
      )}
    </div>
  );
}

export default SwapDetails;
