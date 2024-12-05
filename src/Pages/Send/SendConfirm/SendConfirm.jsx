/*global chrome*/

import { message } from "antd";
import moment from "moment";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { store } from "../../..";
import { setLoading } from "../../../actions/loading";
import MenuRestofHeaders from "../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import ButtonComp from "../../../Components/ButtonComp/ButtonComp";
import InputFieldSimple from "../../../Components/InputField/InputFieldSimple";
import ModalCustom from "../../../Components/ModalCustom/ModalCustom";
import { DURATION } from "../../../config/message.config";
// import { AdaHelper } from "../../../helpers/ada.helper";
import { BTCHelper } from "../../../helpers/btc.helper";
import { SolanaHelper } from "../../../helpers/solana.helper";
import { Web3Helper } from "../../../helpers/web3.helper";
import "./SendConfirm.scss";
import warning from "../../../Assets/PNG/warning.png";
import DarkLogo from "../../../Assets/DarkLogo.svg";
import Logo from "../../../Assets/Logo.png";
import {
  addCommasToNumber,
  getFlooredFixed,
} from "../../../helpers/conversion.helper";
import { server } from "../../../server";

function SendConfirm() {
  const {
    state: {
      coin,
      to,
      amount,
      networkFee,
      rawTransaction,
      ENSName,
      contact,
      theme,
      redirectTo,
    },
  } = useLocation();

  const { account, currency } = useSelector((state) => state);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [fiatGasFee, setFiatGasFee] = useState(0);
  const [parentCoin, setParentCoin] = useState(null);
  const [fiatCoin, setFiatCoin] = useState(0);
  const [toName, setToName] = useState(null);
  const [sessionPassword, setPassword] = useState(null);
  const [isModalOpen, setOpenmodal] = useState(false);

  const navigate = useNavigate();

  const handleOk = () => {
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
    setPassword(null);
  };

  const handleOk1 = () => {
    setIsModalOpen1(false);
  };
  const handleCancel1 = () => {
    setIsModalOpen1(true);
  };

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const init = async () => {
    store.dispatch(setLoading(true));

    const price = coin.coin_data.coins_market || 0;

    if (price) {
      const value = parseFloat(amount) * parseFloat(price.current_price);
      setFiatCoin(value);
    }

    const parentCoin = await server.post(
      "/wallet/coin/coins_market_data",
      {
        coin_family: coin.coin_data.coin_family,
        fiat_currency: currency.name,
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    setParentCoin(parentCoin.data.data);
    const feePrice = parentCoin.data.data.coins_market;

    if (feePrice) {
      const value = parseFloat(networkFee) * parseFloat(feePrice.current_price);
      setFiatGasFee(value);
    }

    setToName(contact);
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = [
    {
      text: "From",
      textVal: `${coin.address.substring(0, 7)}.....${coin.address.substring(
        to.length - 7,
        to.length
      )}`,
    },
    {
      text: "To",
      textVal: toName
        ? toName
        : ENSName
        ? ENSName
        : `${to.substring(0, 7)}.....${to.substring(to.length - 7, to.length)}`,
    },
    {
      text: "Network Fee",
      textVal: `${parseFloat(getFlooredFixed(+networkFee, 8))} ${
        parentCoin ? parentCoin.coin_symbol.toUpperCase() : ""
      }/ ${currency.symbol}${addCommasToNumber(
        getFlooredFixed(fiatGasFee, 4)
      )}`,
    },
    {
      text: "Total value",
      textVal: coin.coin_data.token_address
        ? `${addCommasToNumber(
            parseFloat(getFlooredFixed(amount, 8))
          )} ${coin.coin_data.coin_symbol.toUpperCase()}/ ${
            currency.symbol
          }${addCommasToNumber(getFlooredFixed(+fiatGasFee + +fiatCoin, 2))}`
        : `${addCommasToNumber(
            parseFloat(getFlooredFixed(+amount + +networkFee, 8))
          )} ${coin.coin_data.coin_symbol.toUpperCase()}/ ${
            currency.symbol
          }${addCommasToNumber(getFlooredFixed(+fiatGasFee + +fiatCoin, 2))}`,
    },
    {
      text: "Date",
      textVal: moment(new Date()).format("MM/DD/YY"),
    },
  ];

  const handleTransaction = async () => {
    try {
      store.dispatch(setLoading(true));

      const { chains } = await chrome.storage.local.get("chains");
      const chain = chains.find(
        (chain) => chain.coinFamily === coin.coin_data.coin_family
      );

      if (chain.isEVM) {
        if (coin.coin_data.token_address) {
          const response =
            await Web3Helper.generateRawTransactionForTokenAndBroadcast(
              to,
              coin.address,
              amount,
              coin.coin_data.id,
              fiatCoin,
              fiatGasFee,
              currency.name,
              toName,
              chain.slug,
              chain.chainId,
              coin.coin_data.token_address,
              coin.coin_data.decimals,
              coin.coin_data.token_type
            );

          if (!response) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              "Insufficient funds to perform transaction."
            );
          }
        } else {
          const response =
            await Web3Helper.generateRawTransactionForCoinAndBroadcast(
              to,
              coin.address,
              amount,
              coin.coin_data.id,
              fiatCoin,
              fiatGasFee,
              currency.name,
              toName,
              chain.slug,
              chain.chainId
            );

          if (!response) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              "Insufficient funds to perform transaction."
            );
          }
        }
      } else if (!chain.isEVM && chain.currencyName === "SOL") {
        const solanaHelper = new SolanaHelper(chain.rpcUrl);
        if (coin.coin_data.token_address) {
          const response =
            await solanaHelper.generateRawTransactionForTokenAndBroadcast(
              to,
              coin.address,
              amount,
              coin.coin_data.id,
              fiatCoin,
              fiatGasFee,
              currency.name,
              toName,
              chain.slug,
              chain.chainId,
              coin.coin_data.token_address,
              coin.coin_data.decimals,
              coin.coin_data.token_type,
              coin.balance
            );
          if (!response) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              "Insufficient funds to perform transaction."
            );
          }
        } else {
          const response =
            await solanaHelper.generateRawTransactionForCoinAndBroadcast(
              to,
              coin.address,
              amount,
              coin.coin_data.id,
              fiatCoin,
              fiatGasFee,
              currency.name,
              toName,
              chain.slug,
              chain.chainId
            );
          if (!response) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              "Insufficient funds to perform transaction."
            );
          }
        }
      } else if (!chain.isEVM && chain.currencyName === "BTC") {
        let tx_fee = parseFloat(getFlooredFixed(+networkFee, 8));
        const response =
          await BTCHelper.generateRawTransactionForCoinAndBroadcast(
            to,
            coin.address,
            amount,
            coin.coin_data.id,
            fiatCoin,
            fiatGasFee,
            currency.name,
            toName,
            chain.slug,
            chain.chainId,
            rawTransaction,
            tx_fee
          );

        if (!response) {
          store.dispatch(setLoading(false));
          return messageApi.error("Insufficient funds to perform transaction.");
        }
      } else if (!chain.isEVM && chain.currencyName === "ADA") {
        if (coin.coin_data.token_address) {
          const response = null;
            // await AdaHelper.generateRawTransactionForTokenAndBroadcast(
            //   to,
            //   coin.address,
            //   amount,
            //   coin.coin_data.id,
            //   fiatCoin,
            //   fiatGasFee,
            //   currency.name,
            //   toName,
            //   chain.slug,
            //   chain.chainId,
            //   networkFee,
            //   coin.coin_data.coin_name,
            //   coin.coin_data.token_address
            // );

          if (!response) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              "Insufficient funds to perform transaction."
            );
          }
        } else {
          const response = null;
            // await AdaHelper.generateRawTransactionForCoinAndBroadcast(
            //   to,
            //   coin.address,
            //   amount,
            //   coin.coin_data.id,
            //   fiatCoin,
            //   fiatGasFee,
            //   currency.name,
            //   toName,
            //   chain.slug,
            //   chain.chainId,
            //   networkFee
            // );

          if (!response) {
            store.dispatch(setLoading(false));
            return messageApi.error(
              "Insufficient funds to perform transaction."
            );
          }
        }
      }

      store.dispatch(setLoading(false));
      setOpenmodal(false);
      setIsModalOpen1(true);
    } catch (error) {
      console.log("HANDLE TRANSACTION CARDANO ", error);
      setOpenmodal(false);
    }
  };

  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={"/sendCurrency"}
        title={`Send ${coin.coin_data.coin_symbol.toUpperCase()}`}
        coin={coin}
        amount={amount}
        address={to}
        redirectTo={redirectTo}
      />
      <div className={`flexedContent`}>
        <div className="confirmCurrency">
          <div
            className="confirmCurrency__card"
            style={{
              display: "flex",
            }}
          >
            <div
              style={{
                flex: 2,
              }}
            >
              <h3 className="confirmCurrency__card__textTop">
                {addCommasToNumber(getFlooredFixed(amount, 5))}{" "}
                {coin.coin_data.coin_symbol.toUpperCase()}
              </h3>
              <p className="confirmCurrency__card__textBtm">
                {currency.symbol}
                {addCommasToNumber(getFlooredFixed(fiatCoin, 2))}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {coin.coin_data.coin_image ? (
                <img
                  src={`${process.env.REACT_APP_IMAGE_BASE_URL}${coin.coin_data.coin_image}`}
                  alt=""
                  style={{
                    width: "50px",
                  }}
                />
              ) : null}
            </div>
          </div>
          <div className="confirmCurrency__keyValuesOuter">
            {data.map((ele) => (
              <div className="confirmCurrency__keyValues">
                <div className="confirmCurrency__keyValues__key">
                  {ele.text}
                </div>
                <div className="confirmCurrency__keyValues__value">
                  {ele.textVal}
                </div>
              </div>
            ))}
          </div>
          <ButtonComp
            onClick={async () => {
              setOpenmodal(true);
            }}
            text={"Confirm"}
            maxWidth={"100%"}
          />
        </div>
      </div>

      <ModalCustom
        title={"Confirm Transaction"}
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <InputFieldSimple
            placeholder="Password"
            getData={setPassword}
            value={sessionPassword}
            customFunction={
              async () => {
                const { password } = await chrome.storage.session.get("password");
  
                if (sessionPassword !== password) {
                  return messageApi.error("Incorrect password provided.");
                }
  
                handleTransaction();
              }
            }
          />
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
              const { password } = await chrome.storage.session.get("password");

              if (sessionPassword !== password) {
                return messageApi.error("Incorrect password provided.");
              }

              handleTransaction();
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
        closable={false}
      >
        <div className={"confirmationsModal"}>
          <div className={"iInner"}>
            {theme == "darkTheme" ? (
              <img src={DarkLogo} alt="" />
            ) : (
              <img src={Logo} alt="" style={{
                width: "100px"
              }} />
            )}
            <div>
              <p>
                Withdraw request of{" "}
                {addCommasToNumber(getFlooredFixed(amount, 5))}{" "}
                {coin.coin_data.coin_symbol.toUpperCase()} has been processed
                successfully.
              </p>
            </div>
          </div>
          <ButtonComp
            text={"OK"}
            maxWidth={"100%"}
            onClick={() => {
              return navigate("/currencyDetails", {
                state: {
                  symbol: coin.coin_data.coin_symbol.toUpperCase(),
                  image: coin.coin_data.coin_image
                    ? `${process.env.REACT_APP_IMAGE_BASE_URL}${coin.coin_data.coin_image}`
                    : null,
                  type: "",
                  coin: coin,
                },
              });
            }}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default SendConfirm;
