/*global chrome*/
import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import "./EnterPrice.scss";
import { useLocation, useNavigate } from "react-router-dom";
import ButtonComp from "../../../Components/ButtonComp/ButtonComp";
import { InputFieldOnly } from "../../../Components/InputField/InputFieldSimple";
import { message } from "antd";
import { useSelector } from "react-redux";
import { DURATION } from "../../../config/message.config";
import backimg from "../../../Assets/snapchat.svg";
import {
  addCommasToNumber,
  getFlooredFixed,
} from "../../../helpers/conversion.helper";
import BigNumber from "bignumber.js";
import WithdrawCard from "../../Withdraw/WithdrawCard";
import { server } from "../../../server";
import { Web3Helper } from "../../../helpers/web3.helper";
import { store } from "../../..";
import { setLoading } from "../../../actions/loading";
import { spritzHelper } from "../../../helpers/spritz.helper";
import { PaymentNetwork } from "@spritz-finance/api-client";
import BankAccountDrawer from "./BankAccountDrawer";
import DarkArrowRightIcon from "../../../Assets/DarkArrowRightIcon.svg";
import ticketcheck1 from "../../../Assets/ArrowRightIcon.svg";
import standard from "../../../Assets/PNG/Standardicon.png";
import Rapid from "../../../Assets/PNG/Rapidicon.png";

function EnterPriceSpritz() {
  const {
    state: { coin, account: bankAccount, backAmount },
  } = useLocation();

  const navigate = useNavigate();
  const { account, currency } = useSelector((state) => state);
  const [showValue, setShowValue] = useState(0);
  const [amount, setAmount] = useState(backAmount || 100);
  const { theme } = useSelector((state) => state);
  const [deliveryMethod, setDeliveryMethod] = useState("STANDARD");
  const [openDrawer, setOpenDrawer] = useState(false);

  const [cryptoAmount, setCryptoAmount] = useState(0);

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const closeDrawer = () => {
    setOpenDrawer(false);
  };

  const convertedAmt = async () => {
    store.dispatch(setLoading(true));
    if (parseFloat(amount) >= 1) {
      const { chains } = await chrome.storage.local.get("chains");
      const chain = chains.find(
        (chain) => chain.coinFamily == coin?.coin_data?.coin_family
      );
      const paymentRequest = await spritzHelper.generatePaymentRequest(
        parseFloat(amount),
        bankAccount?.id,
        chain.coinFamily == 1
          ? PaymentNetwork.Ethereum
          : chain.coinFamily == 3
          ? PaymentNetwork.Binance
          : chain.coinFamily == 6
          ? PaymentNetwork.Polygon
          : PaymentNetwork.Avalanche,
        coin?.coin_data?.token_address
          ? coin?.coin_data?.token_address
          : "0x0000000000000000000000000000000000000000",
        deliveryMethod
      );

      // console.log(
      //   "paymentRequestpaymentRequestpaymentRequest ",
      //   paymentRequest.amount
      // );

      setShowValue(
        new BigNumber(paymentRequest.amount || 0)
          .dividedBy(new BigNumber(coin.coin_data.decimals))
          .toString()
      );

      store.dispatch(setLoading(false));
    } else {
      store.dispatch(setLoading(false));
      setShowValue(0);
    }

    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    let debounceTimer;
    const handleDebouncedSearch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        convertedAmt();
      }, 3000);
    };

    if (amount) {
      handleDebouncedSearch();
    } else {
      convertedAmt();
    }

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  return (
    <div>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={"/spritz-tokens"}
          title={`Withdraw`}
          mySpritzAccount={bankAccount}
        />
        <div className={`flexedContent`}>
          <div className="editWallet">
            <h2 className="editWallet__title">
              Withdraw {coin?.coin_data?.coin_symbol.toUpperCase()}
            </h2>
            <p className="editWallet__subTitle" style={{ marginBottom: 24 }}>
              Please enter amount in fiat to proceed with the transaction.
            </p>
            <div className="editWallet__linkOuter">
              <InputFieldOnly
                placeholder={"Enter fiat amount"}
                label={"Enter fiat amount"}
                value={`$${amount}`}
                checkForSymbols={true}
                placeholderBaseColor={true}
                doCheckForSymbols={true}
                currencySymbol={"$"}
                getData={(name) => {
                  if (name) {
                    const parsedAmount = name.split("$")[1];
                    const amountValue = parsedAmount;

                    if (parseFloat(amountValue) >= 1) {
                      if (parseFloat(amountValue) <= 20000) {
                        setAmount(amountValue);
                      } else {
                        messageApi.error(
                          "Amount cannot be greater than $20000."
                        );
                      }
                    } else {
                      setAmount("");
                    }
                  }
                }}
              />
              <div className={"do"}>
                <div
                  className={"send__infoText"}
                  style={{
                    position: "relative",
                    left: "20px",
                  }}
                >
                  = {addCommasToNumber(getFlooredFixed(showValue, 5))}{" "}
                  {coin?.coin_data?.coin_symbol?.toUpperCase()}
                </div>
              </div>
            </div>
            <div style={{ cursor: "pointer" }}>
              <WithdrawCard
                imgage={
                  bankAccount?.institution
                    ? bankAccount?.institution?.logo
                    : backimg
                }
                BankName={
                  bankAccount?.institution
                    ? bankAccount?.institution?.name
                    : "Dummy Account"
                }
                BankClient={bankAccount?.name}
                Accountnumber={bankAccount?.accountNumber}
                Routingnumber={bankAccount?.bankAccountDetails?.routingNumber}
                account={bankAccount}
                enterPrice={true}
                coin={coin}
                amount={amount}
                holderName={bankAccount?.holder}
              />
            </div>

            {bankAccount?.country == "US" && (
              <div
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setOpenDrawer(true);
                }}
              >
                <div className="standardCard">
                  <h4>
                    <img src={deliveryMethod == "INSTANT" ? Rapid : standard} />
                    {deliveryMethod === "INSTANT" ? "RAPID" : deliveryMethod}
                  </h4>
                  <div className="threeDot">
                    <img
                      src={
                        theme === "darkTheme"
                          ? DarkArrowRightIcon
                          : ticketcheck1
                      }
                      alt=""
                    />
                  </div>
                </div>
              </div>
            )}

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
                    new BigNumber(coin?.balance).isLessThan(
                      new BigNumber(cryptoAmount)
                    )
                  ) {
                    return messageApi.error(
                      "Insufficient balance to proceed with the transaction."
                    );
                  }

                  const { chains } = await chrome.storage.local.get("chains");
                  const chain = chains.find(
                    (chain) => chain.coinFamily == coin?.coin_data?.coin_family
                  );

                  store.dispatch(setLoading(true));

                  const nativeCoinResponse = await server.post(
                    "/wallet/get_coin_balances",
                    {
                      wallet_address:
                        account.coinFamilyAndAddress[
                          coin?.coin_data.coin_family
                        ],
                      coin_family: coin?.coin_data.coin_family,
                      fiat_currency: currency?.name,
                    },
                    {
                      headers: {
                        Authorization: account?.jwtToken,
                      },
                    }
                  );

                  // console.log(
                  //   "nativeCoinResponsenativeCoinResponse ",
                  //   nativeCoinResponse
                  // );

                  if (chain.isEVM) {
                    const paymentRequest =
                      await spritzHelper.generatePaymentRequest(
                        parseFloat(amount),
                        bankAccount?.id,
                        chain.coinFamily == 1
                          ? PaymentNetwork.Ethereum
                          : chain.coinFamily == 3
                          ? PaymentNetwork.Binance
                          : chain.coinFamily == 6
                          ? PaymentNetwork.Polygon
                          : PaymentNetwork.Avalanche,
                        coin?.coin_data?.token_address
                          ? coin?.coin_data?.token_address
                          : "0x0000000000000000000000000000000000000000",
                        deliveryMethod
                      );

                    // console.log(
                    //   "paymentRequestpaymentRequestpaymentRequest ",
                    //   paymentRequest
                    // );

                    if (paymentRequest && paymentRequest?.error) {
                      store.dispatch(setLoading(false));
                      return messageApi.error(paymentRequest?.message);
                    }

                    const gasData = await Web3Helper.getGasPrice(
                      chain?.slug,
                      account?.coinFamilyAndAddress[
                        coin?.coin_data?.coin_family
                      ],
                      account?.coinFamilyAndAddress[
                        coin?.coin_data?.coin_family
                      ],
                      0
                    );

                    // console.log("gasDatagasDatagasData ", gasData);
                    const nativeCoinBalance = new BigNumber(
                      nativeCoinResponse?.data?.data?.balance
                    );
                    // console.log(
                    //   "nativeCoinBalancenativeCoinBalance ",
                    //   nativeCoinBalance
                    // );
                    const finalAmount = new BigNumber(
                      paymentRequest?.amount
                    ).dividedBy(new BigNumber(coin?.coin_data?.decimals));

                    // console.log("finalAmountfinalAmount ", finalAmount);

                    let gasEstimate = new BigNumber(paymentRequest?.gasLimit);
                    const gasPrice = new BigNumber(gasData?.price).times(
                      1000000000
                    );

                    const gasInEth = gasPrice
                      .times(gasEstimate)
                      .div(Math.pow(10, 18));

                    if (coin?.coin_data?.token_address) {
                      if (nativeCoinBalance.isLessThan(gasInEth)) {
                        store.dispatch(setLoading(false));
                        return messageApi.error(
                          "Insufficient fee to proceed with the transaction."
                        );
                      }

                      const tokenBalance = new BigNumber(coin?.balance);

                      if (tokenBalance.isLessThan(finalAmount)) {
                        store.dispatch(setLoading(false));
                        return messageApi.error(
                          "Insufficient balance to proceed with the transaction"
                        );
                      }
                    } else {
                      const totalAmountIncludingGasPriceInEth =
                        gasInEth.plus(finalAmount);

                      if (
                        nativeCoinBalance.isLessThan(
                          totalAmountIncludingGasPriceInEth
                        )
                      ) {
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
                          new BigNumber(coin?.coin_data?.decimals)
                        ),
                        coin,
                        networkFee: gasInEth.toFixed(5),
                        paymentRequest: paymentRequest,
                        bankAccount: bankAccount,
                        fiatAmountToSend: amount,
                      },
                    });

                    store.dispatch(setLoading(false));
                  }
                }}
                text={"Continue"}
                maxWidth="100%"
              />
            </div>
          </div>
        </div>
      </div>

      <BankAccountDrawer
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        setDeliveryMethod={setDeliveryMethod}
      />
    </div>
  );
}

export default EnterPriceSpritz;
