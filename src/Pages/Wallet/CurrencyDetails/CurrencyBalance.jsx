/*global chrome*/
/*global chrome*/
import React, { useEffect, useState } from "react";
// import "./BalanceDetails.scss";
import NewSend from "../../../Assets/NewSend.svg";
import RecieveNew from "../../../Assets/RecieveNew.svg";
// import SwapIcon from "../../../Assets/SwapIcon.svg";
import { Link, useLocation, useNavigate } from "react-router-dom";
// import ModalCustom from "../ModalCustom/ModalCustom";
import ModalCustom from "../../../Components/ModalCustom/ModalCustom";
import CopyIconBlue from "../../../Assets/CopyIconBlue.svg";
import JustLogo from "../../../Assets/JustLogo.svg";
import InfoIcon from "../../../Assets/InfoIcon.svg";
import PlusBordredIcon from "../../../Assets/PlusBordredIcon.svg";
import SendIconWhite from "../../../Assets/SendIconWhite.svg";
import RecieveIconWhite from "../../../Assets/RecieveIconWhite.svg";
import BuyIconWhite from "../../../Assets/other-buy.png";
import SwapIconWhite from "../../../Assets/SwapIconWhite.svg";
import DarkSendIcon from "../../../Assets/DarkSendIcon.svg";
import DarkRecieveIcon from "../../../Assets/DarkRecieveIcon.svg";
import Darkotherbuy from "../../../Assets/Newbuy.svg";
import DarkSwapIcon from "../../../Assets/DarkSwapIcon.svg";
import Buy from "../../../Assets/buy-sell.png";
import { Dropdown, message } from "antd";
import { WalletHelper } from "../../../helpers/wallet.helper";
import { useSelector } from "react-redux";
import { QRCode } from "react-qrcode-logo";
import TradeNew from "../../../Assets/TradeNew.svg";
// import { Drawer } from "antd";
// import ModalCloseIcon from "../../../Assets/ModalCloseIcon.svg";
import OpenDark from "../../../Assets/open-dark.png";
import CloseDark from "../../../Assets/close-dark.png";
import { DURATION } from "../../../config/message.config";
import { setLoading } from "../../../actions/loading";
// import CoinsTable from "../../../CoinsTable/CoinsTable";
import BigNumber from "bignumber.js";
// import Logo from "../../../Assets/Logo.png";
import HistoryIcon from "../../../Assets/HistoryIcon.svg";

import {
  addCommasToNumber,
  getFlooredFixed,
} from "../../../helpers/conversion.helper";
// import InputFieldSimple from "../InputField/InputFieldSimple";
// import darkclose from "../../../Assets/darkclose.svg";
// import DarkLogo from "../../../Assets/DarkLogo.svg";
// import warning from "../../../Assets/PNG/warning.png";
// import ButtonComp from "../ButtonComp/ButtonComp";
import { setBalancesIn } from "../../../actions/balance-off-out";
// import { server } from "../../server";
// import { SolanaHelper } from "../../helpers/solana.helper";
// import DownIcon from "../../../Assets/DownIcon.svg";
import { store } from "../../..";

function CurrencyBalanceDetails({ className, textLeft, mt0, coin }) {
  const { account, currency, chain, tokens, theme, balanceIn } = useSelector(
    (state) => {
      return state;
    }
  );

  const [accounts, setAccounts] = useState([]);

  const fetchAccounts = async () => {
    const { accounts } = await chrome.storage.session.get("accounts");
    const items = accounts.flatMap((account, index) => {
      const accountItem = {
        label: (
          <Link
            to="/"
            onClick={async (e) => {
              e.preventDefault();
              await WalletHelper.setWalletPreference(account.id);
            }}
          >
            {account.name}
          </Link>
        ),
        key: `${index}`,
      };

      // Add a divider after each item except the last one
      if (index < accounts.length - 1) {
        return [accountItem, { type: "divider" }];
      }

      return [accountItem];
    });

    setAccounts(items);
  };

  const [password, setPassword] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [chainItems, setChainItems] = useState([]);
  const [buySellM, setBuySellM] = useState({});
  const [isModalOpen5, setOpenmodal5] = useState(false);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const handleOk5 = () => {
    setOpenmodal5(false);
    setSessionPassword(null);
  };

  const handleCancel5 = () => {
    setPassword(null);
    setOpenmodal5(false);
  };

  let firstPrice = 0;

  if (coin) {
    firstPrice = coin.coin.fiat_price_data || 0;
  }

  const [open2, setOpen2] = useState(false);
  const onClose2 = () => {
    setOpen2(false);
  };

  const [total, setTotal] = useState(0.0);

  const calculateTotal = () => {
    let total = 0;

    tokens.forEach((token) => {
      const price = token.coin.fiat_price_data || null;
      if (price) {
        const fiatValue = parseFloat(token.balance) * parseFloat(price.value);
        total += fiatValue;
      }
    });
    setTotal(total);
  };

  const navigate = useNavigate();

  const init = async () => {
    const { chains } = await chrome.storage.local.get("chains");

    const myItems = [
      {
        key: "0",
        type: "group",
        label: "EVM Chains",
        children: [],
      },
    ];

    chains
      .filter((el) => el.isEVM)
      .forEach((data, index) => {
        if (data.isEVM) {
          myItems[0].children.push({
            label: (
              <Link
                to="/"
                onClick={async (e) => {
                  e.preventDefault();
                  store.dispatch(setLoading(true));
                  await WalletHelper.setNetworkPreference(data.chainId);
                  store.dispatch(setLoading(false));
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    height: "10px",
                    width: "10px",
                    background: data.chainId == chain.chainId ? "#fff" : "#fff",
                    borderRadius: "50%",
                  }}
                ></div>
                <img
                  src={data.image}
                  alt=""
                  style={{
                    height: "30px",
                    width: "30px",
                    objectFit: "contain",
                    marginRight: "8px",
                    marginLeft: "8px",
                  }}
                />
                {data.chainName}
              </Link>
            ),
            key: index,
          });
        } else {
          myItems[1].children.push({
            label: (
              <Link
                to="/"
                onClick={async (e) => {
                  e.preventDefault();
                  store.dispatch(setLoading(true));
                  await WalletHelper.setNetworkPreference(data.chainId);
                  store.dispatch(setLoading(false));
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    height: "10px",
                    width: "10px",
                    background:
                      data.chainId == chain.chainId ? "green" : "#fff",
                    borderRadius: "50%",
                  }}
                ></div>
                <img
                  src={data.image}
                  alt=""
                  style={{
                    height: "30px",
                    width: "30px",
                    objectFit: "contain",
                    marginRight: "8px",
                    marginLeft: "8px",
                  }}
                />
                {data.chainName}
              </Link>
            ),
            key: index,
          });
        }
      });

    const isSidePanelOpen = await chrome.storage.local.get("openSidePanel");
    setIsSidePanelOpen(isSidePanelOpen.openSidePanel);
    setChainItems(myItems);
  };

  useEffect(() => {
    fetchAccounts();
    calculateTotal();
    init();
    if (coin) {
      try {
        // Convert the numbers to BigNumber instances
        const myPrice = new BigNumber(firstPrice ? firstPrice.value : 0);
        const balance = new BigNumber(coin.balance);

        // Perform the multiplication
        const result = myPrice.times(balance);

        // Get the result as a string with the desired precision
        const formattedResult = getFlooredFixed(result.toString(), 2);

        // console.log(formattedResult, "formattedResult"); // Output: "0.21"
        setFiatValue(formattedResult);
      } catch (error) {
        console.log(error, "error");
      }
    }
  }, [tokens]);

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [fiatValue, setFiatValue] = useState(0.0);
  const getLocation = useLocation();

  const path = getLocation.pathname.replace("/", "");
  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleOk1 = () => {
    setIsModalOpen1(false);
  };
  const handleCancel1 = () => {
    setIsModalOpen1(false);
    setPassword(null);
  };

  const handleOk2 = () => {
    setIsModalOpen2(false);
  };
  const handleCancel2 = () => {
    setIsModalOpen2(false);
    setPassword(null);
  };

  return (
    <div className="balanceDetailsTop currencyBalance">
      {/* <div className={"balanceDetails__dropdownStyle"}> */}
      {/* <Dropdown menu={{ items: accounts }} trigger={["click"]}>
          <Link onClick={(e) => e.preventDefault()}>
            <p>{account.name}</p>
            <img src={DownIcon} alt="icon" />
          </Link>
        </Dropdown>
        <h5>Wallet</h5> */}
      {/* </div> */}
      <div
        className={`${"balanceDetails"} ${mt0 ? mt0 : ""}`}
        style={{ position: "relative" }}
      >
        {contextHolder}

        {path !== "currencyDetails" ? <></> : null}

        <div
          className={
            path !== "currencyDetails"
              ? chain.supportTokens
                ? "balanceDetails__decoratedSec"
                : "balanceDetails__decoratedSecWithoutAddTokens"
              : "balanceDetails__cardCurrencyDetails"
          }
        >
          {path !== "currencyDetails" ? (
            <>
              {/* <img
                src={JustLogo}
                style={{
                  height: "25px",
                  objectFit: "contain",
                }}
              /> */}
            </>
          ) : null}
          {/* <p className="yourBalance">Your Balance</p> */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: path === "currencyDetails" ? "flex-start" : "",
            }}
          >
            <h3
              className={`${"balanceDetails__title"} ${
                textLeft ? textLeft : ""
              }`}
              style={{
                maxWidth: "290px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginBottom: "0",
                fontSize: "28px",
                lineHeight: "28px",
              }}
            >
              {coin
                ? `${addCommasToNumber(
                    getFlooredFixed(coin.balance, 5)
                  )} ${coin.coin.coin_symbol.toUpperCase()}`
                : balanceIn
                ? `${currency.symbol}${addCommasToNumber(
                    getFlooredFixed(total, 2)
                  )}`
                : "****"}
            </h3>

            {path !== "currencyDetails" ? (
              balanceIn ? (
                <img
                  src={OpenDark}
                  alt=""
                  onClick={async () => {
                    await chrome.storage.local.set({
                      balanceIn: false,
                    });
                    await WalletHelper.updateBalanceInShow(false, account.id);
                    store.dispatch(setBalancesIn(false));
                  }}
                  style={{
                    width: "17px",
                    marginLeft: "9px",
                    position: "relative",
                  }}
                />
              ) : (
                <img
                  src={CloseDark}
                  alt=""
                  onClick={async () => {
                    await chrome.storage.local.set({
                      balanceIn: true,
                    });
                    await WalletHelper.updateBalanceInShow(true, account.id);
                    store.dispatch(setBalancesIn(true));
                  }}
                  style={{
                    width: "17px",
                    marginLeft: "9px",
                    position: "relative",
                    top: "-7px",
                  }}
                />
              )
            ) : null}
          </div>

          {coin ? (
            <h5
              style={{
                fontSize: "14px",
                color: "#fff",
                padding: "0px",
                fontWeight: "bold",
                lineHeight:"16px",
                padding:"10px 0"
              }}
              className={`${"balanceDetails__title"} ${
                textLeft ? textLeft : ""
              }`}
            >
              {currency.symbol}
              {addCommasToNumber(fiatValue)}
            </h5>
          ) : null}
        </div>
        <div
          className={`${"balanceDetails__itemsOuter"} ${
            className ? className : ""
          }`}
          style={
            coin
              ? { justifyContent: "center" }
              : { justifyContent: "space-between" }
          }
        >
          {!coin ? (
            <Link
              to="/send"
              onClick={(e) => {
                e.preventDefault();
                if (account.isWatchOnly) {
                  return;
                }
                navigate("/send");
              }}
              style={
                account.isWatchOnly ? { filter: "grayscale(1) blur(1px)" } : {}
              }
              className={
                path === "currencyDetails"
                  ? "balanceDetails__items__whiteText"
                  : "balanceDetails__items"
              }
            >
              <div className={"balanceDetails__items__img"}>
                {/* {path === "currencyDetails" ? (
                  <img src={SendIconWhite} height={50} width={50} />
                ) : theme === "darkTheme" ? (
                  <img src={DarkSendIcon} />
                ) : (
                  <img src={SendIcon} height={50} width={50} />
                )} */}
                <img src={NewSend} />
              </div>
              <span>Send</span>
            </Link>
          ) : (
            <Link
              to="/sendCurrency"
              style={
                account.isWatchOnly ? { filter: "grayscale(1) blur(1px)" } : {}
              }
              onClick={(e) => {
                e.preventDefault();
                if (account.isWatchOnly) {
                  return;
                }

                if (parseFloat(coin.balance) <= 0) {
                  return messageApi.error("Insufficient balance to proceed.");
                }

                navigate("/sendCurrency", {
                  state: {
                    symbol: coin.symbol,
                    image: coin.name,
                    type: "",
                    coin: coin,
                    redirectTo: "/currencyDetails",
                  },
                });
              }}
              className={
                path === "currencyDetails"
                  ? "balanceDetails__items__whiteText"
                  : "balanceDetails__items"
              }
            >
              <div className={"balanceDetails__items__img"}>
                <img src={NewSend} />
              </div>
              <span>Send</span>
            </Link>
          )}

          <Link
            onClick={(e) => {
              e.preventDefault();
              path === "currencyDetails"
                ? showModal()
                : navigate("/receive-tokens");
            }}
            to="#"
            className={
              path === "currencyDetails"
                ? "balanceDetails__items__whiteText"
                : "balanceDetails__items"
            }
          >
            <div className={"balanceDetails__items__img"}>
              {/* {path === "currencyDetails" ? (
                <img src={RecieveIconWhite} height={50} width={50} />
              ) : theme === "darkTheme" ? (
                <img src={DarkRecieveIcon} />
              ) : (
                <img src={RecieveIcon} height={50} width={50} />
              )} */}
              <img src={RecieveNew} />
            </div>
            <span>Receive</span>
          </Link>

          {/* <div>
            <img src={Darkotherbuy} alt='Buy/Sell' />
            <span>Buy/Sell</span>
          </div> */}

          {/* <Link
            to="/buy-sell"
            onClick={(e) => {
              e.preventDefault();
              if (buySellM?.is_maintenance) {
                return messageApi.error("Buy/Sell is under maintenance.");
              }
              if (path === "currencyDetails") {
                if (coin.coin.on_off_ramp_coin) {
                  return setSelectedCoin(coin.coin.on_off_ramp_coin);
                } else {
                  return messageApi.error("Coin not supported.");
                }
              } else {
                return navigate("/buy-sell");
              }
            }}
            className={
              path === "currencyDetails"
                ? "balanceDetails__items__whiteText"
                : "balanceDetails__items"
            }
          >
            <div className={"balanceDetails__items__img"}> */}
          {/* {path === "currencyDetails" ? (
                  <img
                    // src={BuyIconWhite}
                    height={50}
                    width={50}
                    style={{ filter: "brightness(0) invert(1)" }}
                    alt=""
                  />
                ) : theme === "darkTheme" ? (
                  <img src={Darkotherbuy} />
                ) : (
                  <img src={Buy} height={50} width={50} />
                )} */}
          {/* <img src={Darkotherbuy} />
            </div>
            <span>{account.isWatchOnly ? "Buy" : "Buy/Sell"} </span>
          </Link> */}
          <Link
            to="/buy-sell"
            onClick={(e) => {
              e.preventDefault();
              if (buySellM?.is_maintenance) {
                return messageApi.error("Buy/Sell is under maintenance.");
              }
              if (path === "currencyDetails") {
                // if (coin.coin.on_off_ramp_coin) {
                return setSelectedCoin(coin.coin.on_off_ramp_coin);
                // } else {
                //   return messageApi.error("Coin not supported.");
                // }
              } else {
                return navigate("/buy-sell");
              }
            }}
            className={
              path === "currencyDetails"
                ? "balanceDetails__items__whiteText"
                : "balanceDetails__items"
            }
          >
            <div className={"balanceDetails__items__img"}>
              <img src={Darkotherbuy} alt="" />
            </div>
            <span>{"Buy"} </span>
          </Link>
          <Link
            onClick={(e) => {
              e.preventDefault();
              path === "currencyDetails" ? showModal() : navigate("/swap");
            }}
            to="/swap"
            className={
              path === "currencyDetails"
                ? "balanceDetails__items__whiteText"
                : "balanceDetails__items"
            }
          >
            <div className={"balanceDetails__items__img"}>
              <img src={TradeNew} />
            </div>
            <span>Trade</span>
          </Link>
          {/* {path !== "currencyDetails" && (
            <Link
              onClick={(e) => {
                e.preventDefault();
                path === "currencyDetails"
                  ? showModal()
                  : navigate("/watch-list-tokens");
              }}
              to="#"
              className={
                path === "currencyDetails"
                  ? "balanceDetails__items__whiteText"
                  : "balanceDetails__items"
              }
            >
              <div className={"balanceDetails__items__img"}>
                {path === "currencyDetails" ? (
                  <img src={RecieveIconWhite} height={50} width={50} />
                ) : theme === "darkTheme" ? (
                  <img src={DarkRecieveIcon} />
                ) : (
                  <img src={RecieveIcon} height={50} width={50} />
                )}
              </div>
              <span>Watch List</span>
            </Link>
          )} */}
        </div>
        {coin ? (
          <ModalCustom
            isModalOpen={isModalOpen}
            handleOk={handleOk}
            handleCancel={handleCancel}
            customClass={""}
          >
            <div className={"balanceDetails__modal"}>
              <div>
                <div className={"balanceDetails__modal__scanner"}>
                  <QRCode
                    value={coin.wallet_address}
                    size={230}
                    qrStyle="square"
                    eyeRadius={10}
                    logoImage={coin.coin.coin_image}
                    logoHeight={55}
                    logoWidth={55}
                    logoPadding={8}
                    logoPaddingStyle="circle"
                    style={{
                      borderRadius: "20px",
                      padding: "15px",
                    }}
                  />
                </div>
              </div>
              <p
                className="noAddress"
                style={{
                  width: "100%",
                  textAlign: "center",
                  marginBottom: "17px",
                  fontSize: "15px",
                  fontWeight: "bold",
                }}
              >
                Address
              </p>
              <div
                className={"balanceDetails__modal__wrapedText"}
                onClick={async () => {
                  await navigator.clipboard.writeText(coin.wallet_address);
                  messageApi.success("Address copied successfully.");
                }}
              >
                <img src={CopyIconBlue} width={15} height={16} />
                <span>{coin.wallet_address}</span>
              </div>
            </div>
          </ModalCustom>
        ) : null}
      </div>
    </div>
  );
}

export default CurrencyBalanceDetails;
