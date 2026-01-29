/*global chrome*/
import React, { useEffect, useState } from "react";
import "./BalanceDetails.scss";
import SendIcon from "../../Assets/SendIcon.svg";
import RecieveIcon from "../../Assets/RecieveIcon.svg";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ModalCustom from "../ModalCustom/ModalCustom";
import CopyIconBlue from "../../Assets/CopyIconBlue.svg";
import SendIconWhite from "../../Assets/SendIconWhite.svg";
import RecieveIconWhite from "../../Assets/RecieveIconWhite.svg";
import DarkSendIcon from "../../Assets/DarkSendIcon.svg";
import DarkRecieveIcon from "../../Assets/DarkRecieveIcon.svg";
import { message } from "antd";
import { WalletHelper } from "../../helpers/wallet.helper";
import { useSelector } from "react-redux";
import { QRCode } from "react-qrcode-logo";
import { store } from "../..";
import OpenDark from "../../Assets/open-dark.svg";
import CloseDark from "../../Assets/close-dark.svg";
import { DURATION } from "../../config/message.config";
import { setLoading } from "../../actions/loading";
import BigNumber from "bignumber.js";
import {
  addCommasToNumber,
  getFlooredFixed,
} from "../../helpers/conversion.helper";
import { setBalancesIn } from "../../actions/balance-off-out";
import downeIcon from "../../Assets/downeIcon.svg";
import history from "../../Assets/history.svg";
import Abstract from "../../Assets/chain.svg";
import Trade from "../../Assets/Trade.svg";
import useCurrentHeight from "../../CustomHooks/useCurrentHeight";
import { setFilter } from "../../actions/filter";

function BalanceDetails({ className, textLeft, mt0, coin }) {
  const { account, currency, chain, tokens, theme, balanceIn } = useSelector(
    (state) => {
      return state;
    }
  );

  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0.0);

  const fetchAccounts = async () => {
    const { accounts } = await chrome.storage.session.get("accounts");

    // console.log("ACCOUNT DEFAULT :", accounts);

    const items = accounts.flatMap((account, index) => {
      const accountItem = {
        label: (
          <Link
            to="/"
            onClick={async (e) => {
              e.preventDefault();
              await WalletHelper.setWalletPreference(account?.id);
            }}
          >
            {account?.name}
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

    // console.log("ACCOUNT SET IN WALLET :", items);
    setAccounts(items);
  };

  const [password, setPassword] = useState(null);
  const [chainItems, setChainItems] = useState([]);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  let firstPrice = 0;

  if (coin) {
    firstPrice = coin.coin.fiat_price_data || 0;
  }

  const calculateTotal = () => {
    let total = 0;

    tokens.forEach((token) => {
      const price = token.coin.fiat_price_data || null;
      if (price) {
        const fiatValue = parseFloat(token.balance) * parseFloat(price.value);
        total += fiatValue;
      }
    });

    // console.log("total", total);
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
    init();
    if (coin) {
      try {
        const myPrice = new BigNumber(firstPrice ? firstPrice.value : 0);
        const balance = new BigNumber(coin.balance);
        const result = myPrice.times(balance);
        const formattedResult = getFlooredFixed(result.toString(), 2);
        setFiatValue(formattedResult);
      } catch (error) {
        // console.log(error, "error");
      }
    }
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [tokens, account]);

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const height = useCurrentHeight();
  return (
    <div
      className={`${"balanceDetails"} ${mt0 ? mt0 : ""}    ${
        height <= 600 ? "balanceDetailsOuterExt" : ""
      }`}
      style={{ position: "relative" }}
    >
      {contextHolder}

      {path !== "currencyDetails" ? (
        <>
          <div className={"balanceDetails__dropdownStyle"}>
            <div
              className="balanceLeft"
              onClick={() => {
                navigate("/manage-wallet", { state: { from: "myWallet" } });
              }}
            >
              {/* <img src={aName} alt="icon" /> */}
              <div className="balanceName">
                <h5>{account?.name.charAt(0).toUpperCase()}</h5>
              </div>
              <div>
                <Link
                  to={"/my-wallets"}
                  //  onClick={(e) => e.preventDefault()}
                >
                  <p style={{ display: "flex" }}>
                    {/* {account?.name.charAt(0).toUpperCase() +
                      account?.name.length <
                      10 ? (
                      <p> {account?.name} </p>
                    ) : (
                      <p> {account?.name.slice(0, 6)}...</p>
                    )} */}
                    {account?.name.length < 10 ? (
                      <p>
                        {account?.name.charAt(0).toUpperCase() +
                          account?.name.slice(1)}
                      </p>
                    ) : (
                      <p>
                        {account?.name.charAt(0).toUpperCase() +
                          account?.name.slice(1, 6)}
                        ...
                      </p>
                    )}

                    {}
                    <img
                      style={{ marginLeft: "10px" }}
                      src={downeIcon}
                      alt="downeIcon"
                    />
                  </p>
                </Link>
                {/* <Dropdown
                  overlayClassName="balanceAdmin"
                  menu={{ items: accounts }}
                  trigger={["click"]}
                >
                  <Link onClick={(e) => e.preventDefault()}>
                    <p>
                      {account.name.charAt(0).toUpperCase() +
                        account.name.slice(1)}
                      <img src={downeIcon} alt="downeIcon" />
                    </p>
                  </Link>
                </Dropdown> */}
                {/* <p className="mainNetwor"> ETH Main Network</p> */}
              </div>
            </div>
            {/* <div className="balanceRight">
              <div
                onClick={() => navigate("/push-notification")}
                style={{ cursor: "pointer" }}
              >
                <img src={Bell} alt="Bell" />
              </div>
            </div> */}
          </div>
        </>
      ) : null}

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
            {/* {" "}
            <img
              src={JustLogo}
              style={{
                height: "25px",
                objectFit: "contain",
              }}
            /> */}
            <p className="totalBalance">Total Balance</p>
          </>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              path === "currencyDetails" ? "flex-start" : "space-between",
          }}
        >
          <h3
            className={`${"balanceDetails__title"} ${textLeft ? textLeft : ""}`}
            style={{
              maxWidth: "290px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {/* {coin
              ? `${addCommasToNumber(
                  getFlooredFixed(coin.balance, 5)
                )} ${coin.coin.coin_symbol.toUpperCase()}`
              : balanceIn
              ? `${currency.symbol}${addCommasToNumber(
                  getFlooredFixed(total, 2)
                )}`
              : "****"} */}
            {coin
              ? `${addCommasToNumber(
                  getFlooredFixed(coin.balance, 5)
                )} ${coin.coin.coin_symbol.toUpperCase()}`
              : balanceIn
              ? (() => {
                  const formatted = getFlooredFixed(total, 2); // e.g., "23.56"
                  const [intPart, decPart] = formatted.split(".");
                  return (
                    <span>
                      {currency.symbol}
                      <span>{addCommasToNumber(intPart)}</span>
                      <span style={{ fontSize: "25px" }}>.{decPart}</span>
                    </span>
                  );
                })()
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
                  await WalletHelper.updateBalanceInShow(false, account?.id);
                  store.dispatch(setBalancesIn(false));
                }}
                style={{
                  width: "25px",
                  marginLeft: "9px",
                  position: "relative",
                  top: "-7px",
                  cursor: "pointer",
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
                  await WalletHelper.updateBalanceInShow(true, account?.id);
                  store.dispatch(setBalancesIn(true));
                }}
                style={{
                  width: "25px",
                  marginLeft: "9px",
                  position: "relative",
                  top: "-7px",
                  cursor: "pointer",
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
              position: "relative",
              top: "-8px",
            }}
            className={`${"balanceDetails__title"} ${textLeft ? textLeft : ""}`}
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
                : "balanceDetails__items gap0"
            }
          >
            <div className={"balanceDetails__items__img"}>
              {path === "currencyDetails" ? (
                <img src={SendIconWhite} height={50} width={50} />
              ) : theme === "darkTheme" ? (
                <img src={DarkSendIcon} />
              ) : (
                <img src={SendIcon} height={50} width={50} />
              )}
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
                : "balanceDetails__items gap0"
            }
          >
            <div className={"balanceDetails__items__img"}>
              {path === "currencyDetails" ? (
                <img src={SendIconWhite} height={50} width={50} />
              ) : theme === "darkTheme" ? (
                <img src={DarkSendIcon} />
              ) : (
                <img src={SendIcon} height={50} width={50} />
              )}
            </div>
            <span>Send</span>
          </Link>
        )}

        <Link
          onClick={(e) => {
            e.preventDefault();
            path === "currencyDetails"
              ? showModal()
              : navigate("/receive-tokens", { state: { nftButton: true } });
          }}
          to="#"
          className={
            path === "currencyDetails"
              ? "balanceDetails__items__whiteText"
              : "balanceDetails__items gap0"
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
          <span>Receive</span>
        </Link>
        <Link
          to="/swap"
          className={
            path === "currencyDetails"
              ? "balanceDetails__items__whiteText"
              : "balanceDetails__items gap0"
          }
        >
          <div className={"balanceDetails__items__img"}>
            <img src={Trade} height={50} width={50} />
          </div>
          <span>Trade</span>
        </Link>
        {path !== "currencyDetails" && (
          <Link
            onClick={(e) => {
              e.preventDefault();
              if (path === "currencyDetails") {
                showModal();
              } else {
                navigate("/history", { state: { path: "/wallet" } });
                store.dispatch(
                  setFilter({
                    coinId: "all",
                    status: "all",
                    fromDate: null,
                    toDate: null,
                    type: "all",
                  })
                );
              }
            }}
            to="#"
            className={
              path === "currencyDetails"
                ? "balanceDetails__items__whiteText"
                : "balanceDetails__items gap0"
            }
          >
            <div className={"balanceDetails__items__img"}>
              {path === "currencyDetails" ? (
                <img src={history} height={50} width={50} />
              ) : theme === "darkTheme" ? (
                <img src={history} />
              ) : (
                <img src={history} height={50} width={50} />
              )}
            </div>
            <span>History</span>
          </Link>
        )}

        {path !== "currencyDetails" && (
          <Link
            onClick={(e) => {
              e.preventDefault();
              if (path === "currencyDetails") {
                showModal();
              } else {
                navigate("/chain-abstraction", {
                  state: { path: "/chain-abstraction" },
                });
                store.dispatch(
                  setFilter({
                    coinId: "all",
                    status: "all",
                    fromDate: null,
                    toDate: null,
                    type: "all",
                  })
                );
              }
            }}
            to="#"
            className={
              path === "currencyDetails"
                ? "balanceDetails__items__whiteText"
                : "balanceDetails__items gap0"
            }
          >
            <div className={"balanceDetails__items__img"}>
                <img
                  src={Abstract}
                  alt="Abstract"
                  height={50} 
                  width={50}
                />
            </div>
            <span style={{ marginTop: "2px" }}>Abstract</span>
          </Link>
        )}
      </div>
      {coin ? (
        <ModalCustom
          isModalOpen={isModalOpen}
          handleOk={handleOk}
          handleCancel={handleCancel}
          customClass="change"
          style={{ background: "#100e0e" }}
        >
          <div className={"balanceDetails__modal"}>
            <div>
              <div className={"balanceDetails__modal__scanner"}>
                <QRCode
                  value={coin?.address}
                  size={230}
                  qrStyle="dots"
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
  );
}

export default BalanceDetails;
