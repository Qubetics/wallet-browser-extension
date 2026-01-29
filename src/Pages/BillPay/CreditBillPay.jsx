/*global chrome */
import { Drawer, Select, message } from "antd";
import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import DarkArrowRightIcon from "../../Assets/DarkArrowRightIcon.svg";
import ticketcheck1 from "../../Assets/ArrowRightIcon.svg";
import { InputField } from "../../Components/InputField/InputFieldSimple";
import { server } from "../../server";
import { useSelector } from "react-redux";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import ModalCloseIcon from "../../Assets/ModalCloseIcon.svg";
import darkclose from "../../Assets/darkclose.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { spritzHelper } from "../../helpers/spritz.helper";
import { PaymentNetwork } from "@spritz-finance/api-client";
import { Web3Helper } from "../../helpers/web3.helper";
import BigNumber from "bignumber.js";
import { DURATION } from "../../config/message.config";
import Search from "../../Assets/SearchIcon.svg";
function CreditBillPay() {
  const { state } = useLocation();
  const { theme, account, currency, bankAccount } = useSelector(
    (state) => state
  );

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  const navigate = useNavigate();
  const [allToken, setAllTokens] = useState([]);
  const [token, setToken] = useState(null);
  const [keyword, setKeyword] = useState(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(state?.backAmount || null);

  const init = async () => {
    try {
      store.dispatch(setLoading(true));
      const walletsList = await server.post(
        `/wallet/tokens`,
        {
          address_list: [
            account.coinFamilyAndAddress[6],
            account.coinFamilyAndAddress[3],
            account.coinFamilyAndAddress[7],
            account.coinFamilyAndAddress[1],
          ],
          coin_family: [6, 3, 7, 1],
          fiat_currency: "USD",
          per_page: 5000,
          page: 1,
          search: keyword ? keyword.trim() : undefined,
          is_watch_only: account.isWatchOnly ? 1 : 0,
          wallet_name: account.name,
          address_list_array: [
            {
              coin_family: 4,
              address: account.coinFamilyAndAddress[6],
            },
            {
              coin_family: 3,
              address: account.coinFamilyAndAddress[3],
            },
            {
              coin_family: 7,
              address: account.coinFamilyAndAddress[7],
            },
            {
              coin_family: 1,
              address: account.coinFamilyAndAddress[1],
            },
          ],
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      setAllTokens(walletsList.data.data);
      const { billPaytoken } = await chrome.storage.local.get("billPaytoken");
      // console.log(billPaytoken, "billPaytoken");    

      if (billPaytoken) {
        const findToken = walletsList.data.data.find(
          (el) => el.id == billPaytoken.id
        );
        // console.log("findToken", findToken);
        await chrome.storage.local.set({
          billPaytoken: findToken ? findToken : walletsList.data.data[0],
        });
        setToken(findToken ? findToken : walletsList.data.data[0]);
      } else {
        await chrome.storage.local.set({
          billPaytoken: walletsList.data.data[0],
        });
        setToken(walletsList.data.data[0]);
      }

      store.dispatch(setLoading(false));
    } catch (error) {
      store.dispatch(setLoading(false));
      // console.log("error:::", error);
    }
  };

  useEffect(() => {
    let debounceTimer;

    const handleDebouncedSearch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        init();
      }, 2000);
    };

    if (keyword) {
      handleDebouncedSearch();
    } else {
      init();
    }

    return () => clearTimeout(debounceTimer);
  }, [keyword]);

  useEffect(() => {
    if (state?.billAmount) {
      setAmount(
        state?.billAmount?.billAccountDetails?.amountDue
          ? state?.billAmount?.billAccountDetails?.amountDue
          : 0
      );
    }
  }, []);

  // console.log("token::", token);

  const doPayment = async () => {
    // console.log("amount::", amount);
    const { chains } = await chrome.storage.local.get("chains");
    const chain = chains.find(
      (chain) => chain.coinFamily == token?.coin_family
    );
    try {
      store.dispatch(setLoading(true));
      let paymentRequest = await spritzHelper.generatePaymentRequest(
        Number(amount),
        state?.billAmount?.id,
        token?.coin_family == 1
          ? PaymentNetwork.Ethereum
          : token?.coin_family == 3
            ? PaymentNetwork.Binance
            : token?.coin_family == 6
              ? PaymentNetwork.Polygon
              : PaymentNetwork.Avalanche,
        token?.coin_data?.token_address
          ? token?.coin_data?.token_address
          : "0x0000000000000000000000000000000000000000",
        "STANDARD"
      );
      console.log("paymentRequest:::", paymentRequest);
      if (paymentRequest && paymentRequest?.error) {
        store.dispatch(setLoading(false));
        return messageApi.error(paymentRequest?.message);
      }
      console.log("paymentRequest:::", paymentRequest);
      const nativeCoinResponse = await server.post(
        "/wallet/get_coin_balances",
        {
          wallet_address:
            account.coinFamilyAndAddress[token?.coin_data.coin_family],
          coin_family: token?.coin_data.coin_family,
          fiat_currency: currency?.name,
        },
        {
          headers: {
            Authorization: account?.jwtToken,
          },
        }
      );

      console.log("nativeCoinResponsenativeCoinResponse ", nativeCoinResponse);
      const gasData = await Web3Helper.getGasPrice(
        chain?.slug,
        account?.coinFamilyAndAddress[token?.coin_family],
        account?.coinFamilyAndAddress[token?.coin_family],
        0
      );

      console.log("gasData::", gasData);

      const nativeCoinBalance = new BigNumber(
        nativeCoinResponse?.data?.data?.balance
      );
      console.log("nativeCoinBalancenativeCoinBalance ", nativeCoinBalance);
      const finalAmount = new BigNumber(paymentRequest?.amount).dividedBy(
        new BigNumber(token?.coin_data?.decimals)
      );

      console.log("finalAmountfinalAmount ", finalAmount);

      let gasEstimate = new BigNumber(paymentRequest?.gasLimit);
      console.log("gasEstimate::", gasEstimate);
      const gasPrice = new BigNumber(gasData?.price).times(1000000000);
      console.log("gasPrice:::", gasPrice);

      const gasInEth = gasPrice.times(gasEstimate).div(Math.pow(10, 18));
      console.log("gasInEth:::", gasInEth);
      if (token?.coin_data?.token_address) {
        if (nativeCoinBalance.isLessThan(gasInEth)) {
          store.dispatch(setLoading(false));
          return messageApi.error(
            "Insufficient fee to proceed with the transaction."
          );
        }

        const tokenBalance = new BigNumber(token?.balance);

        if (tokenBalance.isLessThan(finalAmount)) {
          store.dispatch(setLoading(false));
          return messageApi.error(
            "Insufficient balance to proceed with the transaction"
          );
        }
      } else {
        const totalAmountIncludingGasPriceInEth = gasInEth.plus(finalAmount);
        console.log(
          "totalAmountIncludingGasPriceInEth:::",
          totalAmountIncludingGasPriceInEth
        );
        if (nativeCoinBalance.isLessThan(totalAmountIncludingGasPriceInEth)) {
          store.dispatch(setLoading(false));
          return messageApi.error(
            "Insufficient balance to proceed with the transaction"
          );
        }
      }

      navigate("/confirmCurrencySpritz", {
        state: {
          to: paymentRequest.contractAddress,
          amount: new BigNumber(paymentRequest?.amount).dividedBy(
            new BigNumber(token?.coin_data?.decimals)
          ),
          coin: token,
          networkFee: gasInEth.toFixed(5),
          paymentRequest: paymentRequest,
          bankAccount: bankAccount,
          fiatAmountToSend: amount,
          billPay: true,
          billItem: state.billAmount,
          fromBillPay: true,
          // fiatAmountToSend: amount
        },
      });

      store.dispatch(setLoading(false));
    } catch (error) {
      store.dispatch(setLoading(false));
      console.log("error::", error);
    }
  };

  return (
    <div>
      {contextHolder}
      <MenuRestofHeaders backTo={"/withdraw"} title={"Bill Pay"} />
      <div className={`flexedContent`}>
        <div className=" billpaySec">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              alignItems: "center",
              marginTop: "0"
            }}
            className="topHeadingPay"
          >
            {!token?.coin_data?.coin_image ? (
              <div
                style={{
                  alignItems: "center",
                  backgroundColor: "rgba(98,126,234,.2)",
                  borderRadius: "49%",
                  display: "flex",
                  height: "20px",
                  justifyContent: "center",
                  width: "20px",
                  marginRight: "0px",
                  cursor: "pointer",
                  // marginTop: "20px",
                }}
              >
                {" "}
                {token?.coin_data?.coin_name.split("")[0]}
              </div>
            ) : (
              <img
                style={{
                  width: "20px",
                  // marginRight: "15px",
                  // marginTop: "20px",
                }}
                src={`${process.env.REACT_APP_IMAGE_BASE_URL}${token?.coin_data?.coin_image}`}
                alt=""
              />
            )}
            <h2
              style={{ cursor: "pointer" }}
              onClick={() => setOpen(true)}
              className="h2Heading"
            >
              {token?.coin_data?.coin_name}{" "}
              <img
                style={{
                  width: "7px",
                  transform: "rotate(90deg)",
                  cursor: "pointer",
                }}
                src={DarkArrowRightIcon}
              />
            </h2>
            <p className="pHeading">
              {" "}
              {token?.address &&
                `${token?.address.substring(
                  0,
                  7
                )}.....${token?.address.substring(
                  token?.address.length - 7,
                  token?.address.length
                )}`}
            </p>
          </div>
        </div>
        <div className="billBankInput">
          <InputField
            label="Amount"
            value={amount}
            // maxLength={15}
            getData={(value) => {
              const regex = /^[0-9]{1,15}(\.[0-9]{0,5})?$/;
              if (value === "" || regex.test(value)) {
                console.log("i am set ", value);
                setAmount(value);
              }
            }}
          // addonBefore={
          //   <span>
          //     <img
          //       src={Search}
          //       style={{
          //         width: "17px",
          //       }}
          //       alt=""
          //     />
          //   </span>
          // }
          />

          <div className="billDetails">
            <div className="deatilHeading">
              <h2>Bill Details</h2>
            </div>
            <div className="paymentDetail">
              <div className="innerDetail">
                <h2>Bill payment </h2>
                <p>{`$${amount ? amount : "0.00"}`}</p>
              </div>
              <div className="innerDetail" style={{ borderTop: 0 }}>
                <h2>Fee</h2>
                <p>$0.00</p>
              </div>
            </div>
            <div className="paymentDetail">
              <div className="innerDetail">
                <h2>Total Amount </h2>
                <p>{`$${amount ? amount : "0.00"}`}</p>
              </div>
            </div>
          </div>

          <ButtonComp
            onClick={() => doPayment()}
            text={"Continue"}
            maxWidth={"100%"}
            marginTop={"20px"}
          />
        </div>
      </div>
      {/* ******************************Drop Down************************************ */}
      <Drawer
        title="Select Token"
        placement="bottom"
        onClose={() => {
          setOpen(false);
          setKeyword(null);
        }}
        open={open}
        closeIcon={
          theme == "darkTheme" ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
        height={500}
      >
        <div
          className="contain"
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="search" style={{ marginBottom: "30px" }}>
            <InputField
              placeholder={"Search"}
              coloredBg={"#eef3f9"}
              value={keyword}
              checkForSymbols={true}
              getData={(value) => {
                const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
                if (hasEmoji && value.length > 25) {
                  return false;
                }
                setKeyword(value);
              }}
              addonBefore={
                <span>
                  <img
                    src={Search}
                    style={{
                      width: "17px",
                    }}
                    alt=""
                  />
                </span>
              }
            />
          </div>

          <div
            className="right"
            style={{
              flex: 1,
              overflow: "scroll",
            }}
          >
            {allToken.length > 0 ? (
              allToken.map((token) => (
                <div
                  className="design"
                  style={{
                    width: "100%",
                  }}
                  onClick={async () => {
                    await chrome.storage.local.set({
                      billPaytoken: token,
                    });
                    setToken(token);
                    setOpen(false);
                  }}
                >
                  <div
                    className="token"
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      marginBottom: "20px",
                      padding: "8px",
                      borderRadius: "30px",
                      marginLeft: "7px",
                      fontSize: "11px",
                      cursor: "pointer",
                      width: "100%;",
                    }}
                    onClick={async () => {
                      await chrome.storage.local.set({
                        billPaytoken: token,
                      });
                      setToken(token);
                      setOpen(false);
                    }}
                  >
                    {!token.coin_data.coin_image ? (
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
                        {token?.coin_data?.coin_name.split("")[0]}
                      </div>
                    ) : (
                      <img
                        style={{
                          width: "29px",
                          marginRight: "15px",
                        }}
                        src={`${process.env.REACT_APP_IMAGE_BASE_URL}${token.coin_data.coin_image}`}
                        alt=""
                      />
                    )}

                    <p>
                      <span style={{ fontSize: "17px" }} className="noAddress">
                        {token.coin_data.coin_name}{" "}
                      </span>
                      <span
                        className="noAddress"
                        style={{
                          fontSize: "11px",
                          marginLeft: "5px",
                        }}
                      >
                        {token.coin_data.token_type
                          ? `/ ${token.coin_data.token_type}`
                          : null}
                      </span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: "center",
                }}
              >
                <p
                  className="noAddress"
                  style={{
                    marginTop: "4%",
                    marginBottom: "15px",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  Asset not found
                </p>
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default CreditBillPay;
