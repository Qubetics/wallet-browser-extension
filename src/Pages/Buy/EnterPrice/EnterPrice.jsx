/*global chrome*/
import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import "./EnterPrice.scss";
import { useLocation, useNavigate } from "react-router-dom";
import ButtonComp from "../../../Components/ButtonComp/ButtonComp";
import { InputFieldOnly } from "../../../Components/InputField/InputFieldSimple";
import { Drawer, message } from "antd";
import { useSelector } from "react-redux";
import ModalCloseIcon from "../../../Assets/ModalCloseIcon.svg";
import darkclose from "../../../Assets/darkclose.svg";
import Mercuryo from "../../../Assets/Coins/Mercuryo.png";
import Transak from "../../../Assets/Coins/Transak.png";
import Alchemy from "../../../Assets/Coins/Alchemy.png";
import ArrowRightIcon from "../../../Assets/ArrowRightIcon.svg";
import { TranskHelper } from "../../../helpers/transak.helper";
import { store } from "../../..";
import { setLoading } from "../../../actions/loading";
import { v4 as uuidv4 } from "uuid";
import { SHA512 } from "crypto-js";
import { DURATION } from "../../../config/message.config";
import { formatNumber } from "../../../helpers/conversion.helper";
import BigNumber from "bignumber.js";

function EnterPrice() {
  const {
    state: { coin, type, balanceDetail },
  } = useLocation();

  // console.log("🚀 ~ EnterPrice ~ balanceDetail:", balanceDetail);

  const navigate = useNavigate();
  const { account, chain, currency } = useSelector((state) => state);
  const [amount, setAmount] = useState(type === "BUY" ? 100 : null);

  // console.log("🚀 ~ file: EnterPrice.jsx:34 ~ EnterPrice ~ amount:", amount);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [open, setOpen] = useState(false);

  const [drawerData, setDrawerData] = useState([]);
  const [network, setNetwork] = useState("ethereum");
  const [tranAmount, setTranAmount] = useState(0);
  const [merAmount, setMerAmount] = useState(0);
  const [simplexAmount, setSimplexAmount] = useState(0);
  const [alchemyAmount, setAlchemyAmount] = useState(0);
  const { theme } = useSelector((state) => state);
  const onClose = () => {
    setOpen(false);
  };

  const init = async () => {
    const helper = new TranskHelper(
      false,
      chain.chainId,
      account.address,
      0,
      coin.coinName
    );

    const data = await helper.getMInMax();
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={"/buy-sell"}
          title={`Enter ${type.toLowerCase()} amount`}
          coin={balanceDetail || null}
        />
        <div className={`flexedContent`}>
          <div className="editWallet">
            <h2 className="editWallet__title">
              {type} {coin.coinName.toUpperCase()}
            </h2>
            <p className="editWallet__subTitle" style={{ marginBottom: 24 }}>
              {type === "BUY"
                ? "Please enter amount in fiat to proceed with the transaction."
                : "Please enter amount in crypto to proceed with the transaction."}
            </p>
            <div className="editWallet__linkOuter">
              <InputFieldOnly
                placeholder={
                  type === "BUY" ? "Enter fiat amount" : "Enter crypto amount"
                }
                label={
                  type === "BUY" ? "Enter fiat amount" : "Enter crypto amount"
                }
                value={type === "BUY" ? `${currency.symbol}${amount}` : amount}
                checkForSymbols={true}
                placeholderBaseColor={true}
                doCheckForSymbols={true}
                currencySymbol={type === "SELL" ? false : currency.symbol}
                getData={(name) => {
                  if (type === "BUY") {
                    if (name) {
                      const parsedAmount = name.split(currency.symbol)[1] || "";
                      setAmount(parsedAmount);
                    }
                  } else {
                    setAmount(name);
                  }
                }}
              />
            </div>
            <div className="setPassword__footerbuttons">
              <ButtonComp
                onClick={async () => {
                  if (parseFloat(amount) === 0) {
                    return messageApi.error(
                      "Please enter a valid amount to proceed."
                    );
                  }

                  if (!amount || isNaN(parseFloat(amount))) {
                    return messageApi.error(
                      "Please enter a valid amount to proceed."
                    );
                  }

                  if (
                    type !== "BUY" &&
                    new BigNumber(amount).isGreaterThan(
                      new BigNumber(
                        balanceDetail ? balanceDetail.balance : coin.balance
                      )
                    )
                  ) {
                    return messageApi.error("Insufficient balance to proceed.");
                  }

                  if (coin.provider === "BOTH" || coin.provider === "TRANSAK") {
                    if (type === "BUY") {
                      if (parseFloat(amount) < 100) {
                        return messageApi.error(
                          "Please enter a USD value equal to or more than 100."
                        );
                      }
                    }
                  }

                  let network = "";

                  switch (coin.coinFamily) {
                    case 1:
                      network = "ethereum";
                      break;
                    case 3:
                      network = "bsc";
                      break;
                    case 7:
                      network = "avaxcchain";
                      break;
                    case 6:
                      network = "polygon";
                      break;
                    case 8:
                      network = "cronos";
                      break;
                    case 4:
                      network = "solana";
                      break;
                    case 2:
                      network = "mainnet";
                      break;
                    case 5:
                      network = "mainnet";
                      break;
                    case 9:
                      network = "pulsechain";
                      break;
                    default:
                      network = "ethereum";
                      break;
                  }

                  setNetwork(network);
                  store.dispatch(setLoading(true));

                  try {
                    let transakErrorMessage = null;
                    let mercuryoErrorMessage = null;
                    let alchemyErrorMessage = null;
                    let simplexErrorMessage = null;

                    const tempDrawerData = [];

                    const data = new TranskHelper(
                      false,
                      chain.chainId,
                      account.address,
                      amount,
                      coin.coinName
                    );


                    const getAllBlk = await data.getMercuryoPrice(
                      coin.coinName.toUpperCase(),
                      type,
                      amount,
                      coin.currencyMercuryo || coin.currencyTransk || coin.currencyAlchemy || coin.currencySimplex || "USD",
                      coin,
                      account.coinFamilyAndAddress[coin.coinFamily],
                      account
                    );

                    for await (let el of coin.provider) {
                      if (el === "TRANSAK") {
                        let transkPrice = getAllBlk?.transak;
                        let amnt = 0;
                        if (type == "BUY") {
                          amnt =
                            transkPrice?.response?.cryptoAmount &&
                            formatNumber(transkPrice?.response?.cryptoAmount);
                        } else {
                          amnt =
                            transkPrice?.response?.fiat_amount &&
                            formatNumber(transkPrice?.response?.fiat_amount);
                        }
                        if (transkPrice?.error) {
                          setTranAmount(0);
                          transakErrorMessage =
                            "Unable to process your request. Entered amount is not supported by the partner.";
                        } else {
                          setTranAmount(amnt);
                        }

                        tempDrawerData.push({
                          coinIcon: Transak,
                          coinName: "Transak",
                          coinPrice: !transakErrorMessage
                            ? amnt //parseFloat(amnt).toLocaleString()
                            : transakErrorMessage,
                          coinSubName: !transakErrorMessage
                            ? type === "BUY"
                              ? coin.coinName.toUpperCase()
                              : coin.currencyTransk
                            : "",
                          backArrow: ArrowRightIcon,
                          link: "https://global.transak.com/",
                          currencyToBuyFrom: coin.currencyTransk,
                          address:
                            account.coinFamilyAndAddress[coin.coinFamily],
                        });
                      }

                      if (el === "MERCURYO") {
                        const data = new TranskHelper(
                          false,
                          chain.chainId,
                          account.address,
                          amount,
                          coin.coinName
                        );

                        const mercuryoPrice = getAllBlk?.mercuryo;
                        let amnt = 0;
                        if (type == "BUY") {
                          amnt =
                            mercuryoPrice?.data?.amount &&
                            formatNumber(mercuryoPrice?.data?.amount);
                        } else {
                          amnt =
                            mercuryoPrice?.data?.fiat_amount &&
                            formatNumber(mercuryoPrice?.data?.fiat_amount);
                        }
                        if (mercuryoPrice?.status == 400) {
                          setMerAmount(0);
                          mercuryoErrorMessage =
                            "Unable to process your request. Entered amount is not supported by the partner.";
                        } else {
                          setMerAmount(amnt);
                        }

                        tempDrawerData.push({
                          coinIcon: Mercuryo,
                          coinName: "Mercuryo",
                          coinPrice: !mercuryoErrorMessage
                            ? amnt //parseFloat(amnt).toLocaleString()
                            : mercuryoErrorMessage,
                          coinSubName: !mercuryoErrorMessage
                            ? type === "BUY"
                              ? coin.coinName.toUpperCase()
                              : coin.currencyMercuryo
                            : "",
                          backArrow: ArrowRightIcon,
                          link: `https://sandbox-exchange.mrcr.io/?widget_id=${process.env.REACT_APP_MERCURYO_SANDBOX_WIDGET_ID}`,
                          currencyToBuyFrom: coin.currencyMercuryo,
                          address:
                            account.coinFamilyAndAddress[coin.coinFamily],
                        });
                      }

                      if (el === "ALCHEMY") {
                        const data = new TranskHelper(
                          false,
                          chain.chainId,
                          account.address,
                          amount,
                          coin.coinName
                        );

                        const alchemyPrice = getAllBlk?.alchemy;

                        let amnt = 0;
                        if (type == "BUY") {
                          amnt =
                            alchemyPrice?.data?.cryptoQuantity &&
                            formatNumber(alchemyPrice?.data?.cryptoQuantity);
                        } else {
                          amnt =
                            alchemyPrice?.data?.fiatQuantity &&
                            formatNumber(alchemyPrice?.data?.fiatQuantity);
                        }
                        if (!alchemyPrice?.success) {
                          setAlchemyAmount(0);
                          alchemyErrorMessage =
                            "Unable to process your request. Entered amount is not supported by the partner.";
                        } else {
                          setAlchemyAmount(amnt);
                        }
                        tempDrawerData.push({
                          coinIcon: Alchemy,
                          coinName: "Alchemy",
                          coinPrice: !alchemyErrorMessage
                            ? amnt //parseFloat(amnt).toLocaleString()
                            : alchemyErrorMessage,
                          coinSubName: !alchemyErrorMessage
                            ? type === "BUY"
                              ? coin.coinName.toUpperCase()
                              : coin.currencyAlchemy
                            : "",
                          backArrow: ArrowRightIcon,
                          link: "https://global.transak.com/",
                          currencyToBuyFrom: coin.currencyAlchemy,
                          address:
                            account.coinFamilyAndAddress[coin.coinFamily],
                        });
                      }

                      if (el === "SIMPLEX") {
                        const data = new TranskHelper(
                          false,
                          chain.chainId,
                          account.address,
                          amount,
                          coin.coinName
                        );

                        const simplexPrice = getAllBlk?.simplex;
                        let amnt = 0;
                        if (type == "BUY") {
                          amnt =
                            simplexPrice?.digital_money?.amount &&
                            formatNumber(simplexPrice?.digital_money?.amount);
                        } else {
                          amnt =
                            simplexPrice?.fiat_money?.total_amount &&
                            formatNumber(
                              simplexPrice?.fiat_money?.total_amount
                            );
                        }
                        if (simplexPrice?.error) {
                          setSimplexAmount(0);
                          simplexErrorMessage =
                            "Unable to process your request. Entered amount is not supported by the partner.";
                        } else {
                          setSimplexAmount(amnt);
                        }

                        tempDrawerData.push({
                          coinIcon:
                            "https://www.simplex.com/favicon/favicon-32x32.png",
                          coinName: "Simplex",
                          coinPrice: !simplexErrorMessage
                            ? amnt //parseFloat(amnt).toLocaleString()
                            : simplexErrorMessage,
                          coinSubName: !simplexErrorMessage
                            ? type === "BUY"
                              ? coin.coinName.toUpperCase()
                              : coin.currencySimplex
                            : "",
                          backArrow: ArrowRightIcon,
                          link: `https://sandbox-exchange.mrcr.io/?widget_id=${process.env.REACT_APP_MERCURYO_SANDBOX_WIDGET_ID}`,
                          currencyToBuyFrom: coin.currencySimplex,
                          address:
                            account.coinFamilyAndAddress[coin.coinFamily],
                          simplexCoinSymbol:
                            coin.simplexCoinSymbol.toUpperCase(),
                          coin_family: coin.coin_family,
                        });
                      }
                    }



                    setDrawerData(
                      tempDrawerData.sort((a, b) => {
                        const coinPriceA = parseFloat(
                          a.coinPrice.replace(/,/g, "")
                        );
                        const coinPriceB = parseFloat(
                          b.coinPrice.replace(/,/g, "")
                        );
                    
                        if (isNaN(coinPriceA)) return 1; // Move error messages to the end
                        if (isNaN(coinPriceB)) return -1; // Move error messages to the end
                    
                        return coinPriceB - coinPriceA; // Compare the prices in descending order
                      })
                    );

                    setOpen(true);
                    store.dispatch(setLoading(false));
                  } catch (error) {
                    // console.log(error);
                    store.dispatch(setLoading(false));
                    setOpen(false);
                    return messageApi.error(
                      "Unable to fetch price. Please try again later."
                    );
                  }
                }}
                text={type}
                maxWidth="100%"
              />
            </div>
          </div>
        </div>
      </div>

      <Drawer
        title="Third Party Provider"
        placement="bottom"
        onClose={onClose}
        open={open}
        closeIcon={
          theme == "darkTheme" ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
      >
        {drawerData.map((ele, index) => (
          <div
            className="swapDrawer"
            onClick={async () => {
              if (ele.coinName === "Transak") {
                if (tranAmount == 0 || isNaN(parseFloat(tranAmount))) {
                  return messageApi.error(
                    "Please fill in the valid amount as shown to proceed with the transaction."
                  );
                }
                const transakHelper = new TranskHelper(
                  chain.testnet,
                  chain.chainId,
                  ele.address,
                  amount,
                  coin.coinName,
                  network,
                  type,
                  ele.currencyToBuyFrom
                );
                transakHelper.initiate();
                setOpen(false);
                navigate("/wallet");
              } else if (ele.coinName === "Mercuryo") {
                if (merAmount == 0 || isNaN(parseFloat(merAmount))) {
                  return messageApi.error(
                    "Please fill in the valid amount as shown to proceed with the transaction."
                  );
                }
                const transactionId = uuidv4();

                if (type === "BUY") {
                  chrome.tabs.create({
                    url: `
                    https://exchange.mercuryo.io/?widget_id=${process.env.REACT_APP_MERCURYO_WIDGET_ID}&type=${type.toLowerCase()}&fiat_currency=${
                      ele.currencyToBuyFrom
                    }&fix_fiat_currency=true&currency=${coin.coinName.toUpperCase()}&fix_currency=true&fiat_amount=${amount}&fix_fiat_amount=true&address=${
                      ele.address
                    }&redirect_url=${process.env.REACT_APP_MERCURYO_TX_REDIRECT_URL}&merchant_transaction_id=${transactionId}&signature=${SHA512(
                      `${ele.address}${process.env.REACT_APP_MERCURYO_SECRET_KEY}`
                    )}
                    `,
                  });
                } else {
                  chrome.tabs.create({
                    url: `
                    https://exchange.mercuryo.io/?widget_id=${process.env.REACT_APP_MERCURYO_WIDGET_ID}&type=${type.toLowerCase()}&fiat_currency=${
                      ele.currencyToBuyFrom
                    }&fix_fiat_currency=true&currency=${coin.coinName.toUpperCase()}&fix_currency=true&amount=${amount}&fix_fiat_amount=true&address=${
                      ele.address
                    }&redirect_url=${process.env.REACT_APP_MERCURYO_TX_REDIRECT_URL}&merchant_transaction_id=${transactionId}&signature=${SHA512(
                      `${ele.address}${process.env.REACT_APP_MERCURYO_SECRET_KEY}`
                    )}
                    `,
                  });
                }

                setOpen(false);
                navigate("/wallet");
              } else if (ele.coinName === "Alchemy") {
                if (alchemyAmount == 0 || isNaN(parseFloat(alchemyAmount))) {
                  return messageApi.error(
                    "Please fill in the valid amount as shown to proceed with the transaction."
                  );
                }

                store.dispatch(setLoading(true));

                const transakHelper = new TranskHelper(
                  chain.testnet,
                  chain.chainId,
                  ele.address,
                  amount,
                  coin.coinName,
                  network,
                  type
                );
                const transactionId = uuidv4();
                const url = await transakHelper.generateAlchemyOrderURL(
                  ele.address,
                  coin.coinName.toUpperCase(),
                  coin.alchemy_network.toUpperCase(),
                  amount,
                  type.toUpperCase(),
                  ele.currencyToBuyFrom,
                  account,
                  transactionId
                );

                chrome.tabs.create({
                  url,
                });
                store.dispatch(setLoading(false));
                setOpen(false);
                navigate("/wallet");
              } else if (ele.coinName === "Simplex") {
                if (simplexAmount == 0 || isNaN(parseFloat(simplexAmount))) {
                  return messageApi.error(
                    "Please fill in the valid amount as shown to proceed with the transaction."
                  );
                }

                store.dispatch(setLoading(true));
                chrome.tabs.create({
                  url: `${process.env.REACT_APP_SIMPLEX_URL}/?crypto=${ele.simplexCoinSymbol}&fiat=${ele.currencyToBuyFrom}&amount=${amount}&wallet_address=${ele.address}&ref_id=simplex`,
                });
                store.dispatch(setLoading(false));
                setOpen(false);
                // navigate("/wallet");
              }
            }}
          >
            <div key={index} className="swapDrawer__left">
              <img src={ele.coinIcon} alt="" width={30} height={30} />
              <div className="swapDrawer__left__texts">
                <div className="swapDrawer__left__textsTop">{ele.coinName}</div>
                <div className="swapDrawer__left__textsBottom">
                  {ele.coinPrice}{" "}
                  <span>
                    {ele.coinSubName} {index === 0 ? `(Best Price)` : null}
                  </span>
                </div>
              </div>
            </div>
            <div className="swapDrawer__right">
              <img src={ele.backArrow} width={8} height={15} />
            </div>
          </div>
        ))}
      </Drawer>
    </div>
  );
}

export default EnterPrice;
