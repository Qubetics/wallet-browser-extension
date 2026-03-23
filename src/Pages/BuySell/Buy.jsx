/*global chrome*/
import React, { useState, useEffect } from "react";
import crypto from 'crypto-browserify';
import TokenDrawer from "./TokenDrawer";
import { InputField } from "../../Components/InputField/InputFieldSimple";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { Select, message } from "antd";
import { server } from "../../server";
import { useSelector } from "react-redux";
import { DURATION } from "../../config/message.config";
import { supportedNetworks } from "../../helpers/constant";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { addCommasToNumber, getFlooredFixed } from "../../helpers/conversion.helper";

const Buy = ({ coins = [], fiats = [] }) => {
  const { account, theme, loading } = useSelector((state) => state);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [amount, setAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [selectedFiat, setSelectedFiat] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [sel, setSel] = useState(0);
  const [isAmountValid, setIsAmountValid] = useState(true);
  const [cryptoMinMax, setCryptoMinMax] = useState(null);
  const [fiatMinMax, setFiatMinMax] = useState(null);
  const [conversionDetail, setConversionDetail] = useState(null);



  const convertedAmtFun = async () => {
    try {
      store.dispatch(setLoading(true));
      const fiatItem = selectedFiat?.currency_code?.toUpperCase();
      const cryptoItem = selectedCoin?.coin?.coin_symbol?.toUpperCase()
      let url = `https://api.mercuryo.io/v1.6/widget/buy/rate?from=${fiatItem}&to=${cryptoItem}&amount=${amount}&widget_id=${process.env.REACT_APP_MERCURYO_WIDGET_ID}`
      if(cryptoItem<=0){
        return;
      }
      const response = await fetch(url);
      const res = await response?.json()
      // console.log("urlurlurlurl ", res);
      if (!response.ok) {
        store.dispatch(setLoading(false));
        // if (res?.message.includes('Amount off limits.')) {
          messageApi.info("Please enter amount between min max range");
          return;
        // }
      }
      setConversionDetail(res?.data);
      store.dispatch(setLoading(false));
    } catch (error) {
      // console.log("Error : ", error);
      setConversionDetail(null);
      messageApi.error(error?.message || "Something went wrong.")
      store.dispatch(setLoading(false));
    }
  }

  useEffect(() => {
    if (amount === "") {
      setReceiveAmount("");
    }
    const timer = setTimeout(() => {
      if (selectedFiat && selectedCoin && amount>0) {
        convertedAmtFun()
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [amount, selectedFiat, selectedCoin]);

  useEffect(() => { 
    if (fiats.length > 0) setSelectedFiat(fiats[0]);
    if (coins.length > 0) setSelectedCoin(coins[0]);
  }, [fiats, coins]);

  useEffect(() => {
    setFilteredTokens(sel === 0 ? fiats : coins);
  }, [sel, fiats, coins]);

  const handleSearch = (searchTerm) => { 
    setKeyword(searchTerm);
    if (sel === 0) { 
      setFilteredTokens(
        fiats.filter((fiat) =>
          fiat.currency_name?.toLowerCase().includes(searchTerm?.toLowerCase()) || fiat.currency_code?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredTokens(
        coins.filter((coin) =>
          coin?.coin?.coin_name?.toLowerCase().includes(searchTerm?.toLowerCase()) || coin?.coin?.coin_symbol?.toLowerCase().includes(searchTerm?.toLowerCase())
          ));
    }
  };

  const handleSelectToken = (token) => {
    if (sel === 0) {
      setSelectedFiat(token);
    } else {
      setSelectedCoin(token);
    }
    setOpen(false);
  };

  const handleAddonClick = (type) => {
    setSel(type);
    setFilteredTokens(sel === 0 ? fiats : coins);
    setOpen(true);
  };

  const handleFieldChange = async (amount) => {
    if (!amount) {
      setAmount("");
      setReceiveAmount("");
      setIsAmountValid(true);
      return;
    }
    setAmount(amount);

    if (selectedCoin && selectedFiat && amount) {
      try {
        const { data } = await server.post(
          `/moonpay/realTimeBuyQuote`,
          {
            crypto: selectedCoin.coin_symbol,
            fiat: selectedFiat.currency_code,
            cryptoAmount: amount,
          },
          { headers: { Authorization: account.jwtToken } }
        );
        setReceiveAmount(data?.quoteCurrencyAmount || "");
        const minAmount = data?.baseCurrency?.minBuyAmount;
        const maxAmount = data?.baseCurrency?.maxBuyAmount;

        if (amount < minAmount || amount > maxAmount) {
          setIsAmountValid(false);
          messageApi.error(
            `Amount should be between ${minAmount} and ${maxAmount}`
          );
          return;
        } else {
          setIsAmountValid(true);
        }
      } catch (error) {
        messageApi.error("This pair is not available for purchase");
        setAmount("");
        setReceiveAmount("");
        setIsAmountValid(false);
      }
    } else {
      messageApi.error("This pair is not available for purchase");
      setAmount("");
      setReceiveAmount("");
      setIsAmountValid(false);
    }
  };

  const findMinMax = async () => {
    try {
      store.dispatch(setLoading(true)); 
      store.dispatch(setLoading(true));
      const fiatItem = selectedFiat?.currency_code?.toUpperCase();
      const cryptoItem = selectedCoin?.coin?.coin_symbol?.toUpperCase()
      const response = await fetch(`https://api.mercuryo.io/v1.6/public/currency-limits?from=${fiatItem}&to=${cryptoItem}&widget_id=${process.env.REACT_APP_MERCURYO_WIDGET_ID}&type=buy`);
      const { data } = await response.json();
      setFiatMinMax(data[`${fiatItem}`]);
      setCryptoMinMax(data[`${cryptoItem}`]);
      store.dispatch(setLoading(false)); 
    } catch (error) {
      messageApi.error(error?.message || "Something went wrong.")
      store.dispatch(setLoading(false));
    }


  }
  useEffect(() => {
    const timer = setTimeout(() => {
      // if (selectedCoin && selectedFiat && amount) {
      if (selectedCoin && selectedFiat) {
        findMinMax();
        // handleFieldChange(amount);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedCoin, selectedFiat, amount]);

  const handleBuy = async () => {
    try {
      const { data } = await server.post(
        "/moonpay/signature",
        {
          flow: "buy",
          baseCurrencyCode: selectedFiat.currency_code,
          defaultCurrencyCode: selectedCoin.coin_symbol,
          baseCurrencyAmount: amount,
          walletAddress: account.address,
        },

        { headers: { Authorization: account.jwtToken } }
      );

      if (data?.data) {
        messageApi.success("Transaction initiated successfully!");
        setAmount("");
        setReceiveAmount("");

        if (chrome && chrome.tabs) {
          chrome.tabs.create({ url: data.data });
        } else {
          window.open(data.data, "_blank");
        }
      } else {
        messageApi.error("No URL received from the API.");
      }
    } catch (error) {
      // console.error("Error initiating transaction:", error);
      messageApi.error("Failed to initiate transaction. Please try again.");
    }
  };

  const selectAfter = (
    <div className={"addonAfter"}>
      <Select
        open={false}
        value={[
          {
            value: selectedFiat?.currency_id,
            label: (
              <span className="flexedItemSelect">
                {selectedFiat?.image ? (
                  <img
                    style={{
                      height: "20px",
                      width: "20px",
                      objectFit: "contain",
                      position: "relative",
                      borderRadius: "15px",
                    }}
                    src={selectedFiat?.image}
                  />
                ) : (
                  <div
                    className="randb extra"
                    style={{
                      height: "35px",
                      width: "35px",
                      background: "rgb(202, 201, 201)",
                      borderRadius: "50%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {selectedFiat?.currency_name?.split("")[0]}
                  </div>
                )}
                {selectedFiat?.currency_code}
              </span>
            ),
          },
        ]}
        defaultValue={[
          {
            value: selectedFiat?.currency_id,
            label: (
              <span className="flexedItemSelect">
                {selectedFiat?.image ? (
                  <img
                    style={{
                      height: "20px",
                      width: "20px",
                      objectFit: "contain",
                      borderRadius: "15px",
                    }}
                    src={selectedFiat?.image}
                  />
                ) : (
                  <div
                    className="randb extra"
                    style={{
                      height: "35px",
                      width: "35px",
                      background: "rgb(202, 201, 201)",
                      borderRadius: "50%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {selectedFiat?.currency_name?.split("")[0]}
                  </div>
                )}
                {selectedFiat?.currency_name}
              </span>
            ),
          },
        ]}
        style={{
          width: 100,
        }}
        onClick={() => {
          handleAddonClick(0);
        }}
      />
    </div>
  );

  const selectAfter2 = (
    <div className={"addonAfter"}>
      <Select
        open={false}
        value={[
          {
            value: selectedCoin?.coin?.coin_id,
            label: (
              <span className="flexedItemSelect">
                {selectedCoin?.coin?.coin_image ? (
                  <img
                    style={{
                      height: "20px",
                      width: "20px",
                      objectFit: "contain",
                      position: "relative",
                      borderRadius: "15px",
                    }}
                    src={selectedCoin?.coin?.coin_image}
                  />
                ) : (
                  <div
                    className="randb extra"
                    style={{
                      height: "35px",
                      width: "35px",
                      background: "rgb(202, 201, 201)",
                      borderRadius: "50%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {selectedCoin?.coin?.coin_name?.split("")[0]}
                  </div>
                )}
                {selectedCoin?.coin?.coin_symbol?.toUpperCase()}
              </span>
            ),
          },
        ]}
        defaultValue={[
          {
            value: selectedCoin?.coin?.coin_id,
            label: (
              <span className="flexedItemSelect">
                {selectedCoin?.coin?.coin_image ? (
                  <img
                    style={{
                      height: "20px",
                      width: "20px",
                      objectFit: "contain",
                      borderRadius: "15px",
                    }}
                    src={selectedCoin?.coin?.coin_image}
                  />
                ) : (
                  <div
                    className="randb extra"
                    style={{
                      height: "35px",
                      width: "35px",
                      background: "rgb(202, 201, 201)",
                      borderRadius: "50%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {selectedCoin?.coin?.coin_name?.split("")[0]}
                  </div>
                )}
                {selectedCoin?.coin?.coin_name}
              </span>
            ),
          },
        ]}
        style={{
          width: 100,
        }}
        onClick={() => {
          handleAddonClick(1);
        }}
      />
    </div>
  );


  const onPressContinue = () => {
    try {
      if (amount < +fiatMinMax?.min) {
        messageApi.error("Minimum amount should be greater then " + fiatMinMax?.min + selectedFiat?.currency_code)
        return
      } else if (amount > +fiatMinMax?.max) {
        messageApi.error("Maximum amount should be less then " + fiatMinMax?.max + selectedFiat?.currency_code)
        return
      } else if (!amount || !conversionDetail?.total[selectedCoin?.coin?.coin_symbol?.toUpperCase()]) {
        messageApi.error("Please enter amount")
        return
      }
      // console.log("selectedCrypto<<<", selectedCoin);
      let wallet_address = selectedCoin?.wallet_address;
      // console.log("wallet_address data ======", wallet_address);

      let networkItm = supportedNetworks.find(itm => itm?.coin_family == selectedCoin?.coin?.coin_family);
      // console.log("NETWWWWWWWWWWWWWW ", networkItm);
      let merchant_transaction_id = Math.random().toString(36).substr(2) + Date.now().toString(36);
      let secret = wallet_address + process.env.REACT_APP_MERCURYO_SECRET_KEY;
      let signature = crypto.createHash("sha512").update(secret).digest("hex");
      let orderUrl = ""
      let sourceCurrName = selectedFiat?.currency_code
      let network = networkItm?.network
      let targetCurrName = selectedCoin?.coin?.coin_symbol /// Need to check
      let sourceAmount = amount
      let targetAmount = conversionDetail?.total[selectedCoin?.coin?.coin_symbol?.toUpperCase()] || 0
      let coin_family = selectedCoin?.coin?.coin_family
      let backHead = "Buy "
      let coinId = selectedCoin?.coin?.coin_id


      let apiReq = {
        ramp_type: "mercuryo",
        coin_id: coinId,
        coin_family: coin_family,
        tx_type: 'buy',
        wallet_address: wallet_address,
        amount,
        fiat_price: Number(targetAmount),
        fiat_type: sourceCurrName,
        merchant_id: merchant_transaction_id,
        order_id: merchant_transaction_id
      }

      // console.log("REQ>>>>", apiReq);


      // selectedTabData == "sell"
      //   ? (orderUrl = `https://exchange.mercuryo.io/?widget_id=${Constants.MERCURYO_WIDGET_ID}&type=sell&fiat_currency=${sourceCurrName}&fix_fiat_currency=true&fiat_amount=${sourceAmount}&fix_fiat_amount=true&currency=${targetCurrName}&fix_currency=true&amount=${targetAmount}&fix_amount=true&address=${wallet_address}&redirect_url=${MERCURYO_REDIRECT_URL}&merchant_transaction_id=${merchant_transaction_id}&signature=${signature}&refund_address=${wallet_address}`)
      //   : (orderUrl = `https://exchange.mercuryo.io/?widget_id=${Constants.MERCURYO_WIDGET_ID}&type=buy&fiat_currency=${sourceCurrName}&fix_fiat_currency=true&network=${network}&currency=${targetCurrName}&fix_currency=true&fiat_amount=${sourceAmount}&fix_fiat_amount=true&amount=${targetAmount}&fix_amount=true&address=${wallet_address}&redirect_url=${MERCURYO_REDIRECT_URL}&merchant_transaction_id=${merchant_transaction_id}&signature=${signature}`)

      // console.log("DERRRRRRRRRRRRRRR ", {
      //   sourceCurrName,
      //   network,
      //   targetCurrName,
      //   targetAmount,
      //   wallet_address,
      //   merchant_transaction_id,
      //   signature
      // });

      window.open(`https://exchange.mercuryo.io/?widget_id=${process.env.REACT_APP_MERCURYO_WIDGET_ID}&type=buy&fiat_currency=${sourceCurrName}&fix_fiat_currency=true&network=${network}&currency=${targetCurrName}&fix_currency=true&fiat_amount=${sourceAmount}&fix_fiat_amount=true&amount=${targetAmount}&fix_amount=true&address=${wallet_address}&redirect_url=${process.env.REACT_APP_MERCURYO_REDIRECT_URL}&merchant_transaction_id=${merchant_transaction_id}&signature=${signature}`, '_blank', 'noopener,noreferrer')
      // console.log("orderUrl>>>>", orderUrl);


      // Actions.currentScene != "BuySellWebview" &&
      //   Actions.BuySellWebview({
      //     providerName: backHead + targetCurrName,
      //     redirectLink: orderUrl,
      //     apiReq: apiReq,
      //     onSuccess: () => {
      //       // setToValue("")
      //       // setYouPay("")
      //     }
      //   });
      // setTimeout(() => {
      //   // setIsLoading(false);
      // }, 800);
    } catch (error) {
      // console.log("error =======", error);
      messageApi.error("Something went wrong.")
      // setIsLoading(false);

    }
  };


  return (
    <div className="swap manageWalletHeight manageTabHeight">
      <div>
        {contextHolder}
        <InputField
          mb0={true}
          checkForSymbols={true}
          inputSelect={true}
          placeholder={"0.000"}
          label="You Pay"
          type="number"
          // disabled={loading}
          addonAfter={selectAfter}
          getData={(e) => { 
            setAmount(e)
          }}
          value={amount}
        />
        {fiatMinMax && <span style={{ color: "white" }}>Min : {
          addCommasToNumber(
            parseFloat(
              getFlooredFixed(fiatMinMax?.min, 2)
            )
          )
        } {" "} Max : {
            addCommasToNumber(
              parseFloat(
                getFlooredFixed(fiatMinMax?.max, 2)
              )
            )
          }</span>}

        <InputField
          mb0={true}
          inputSelect={true}
          placeholder={"0.000"}
          label="You Receive"
          type="number"
          checkForSymbols={true}
          disabled={true}
          addonAfter={selectAfter2}
          value={
            addCommasToNumber(
              parseFloat(
                getFlooredFixed(conversionDetail?.total[selectedCoin?.coin?.coin_symbol?.toUpperCase()] || 0, 6)
              )
            )
          }
        />
        {cryptoMinMax && <span style={{ color: "white" }}>Min : {
          addCommasToNumber(
            parseFloat(
              getFlooredFixed(cryptoMinMax?.min, 6)
            )
          )
        } {" "} Max : {
            addCommasToNumber(
              parseFloat(
                getFlooredFixed(cryptoMinMax?.max, 6)
              )
            )
          }</span>}

        {/* <div className="buy_sell_des">
                Buy/Sell digital assets are supported by Moonpay. Digital assets are high risk. Make sure you understand the risks associated with each digital asset before you invest.
            </div> */}
      </div>
      <div style={{ width: "100%" }}>
        <ButtonComp
          text="Buy"
          maxWidth={"100%"}
          // onClick={handleBuy}
          onClick={onPressContinue}
          disabled={!amount || !isAmountValid || amount == 0}
        />
      </div>

      <TokenDrawer
        open={open}
        onClose={() => {setOpen(false); setKeyword('')}}
        tokens={filteredTokens}
        keyword={keyword}
        setKeyword={setKeyword}
        handleSearch={handleSearch}
        handleSelectToken={handleSelectToken}
        theme={theme}
        sel={sel}
        loading={loading}
      />
    </div>
  );
};

export default Buy;
