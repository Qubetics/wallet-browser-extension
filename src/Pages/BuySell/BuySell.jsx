import React, { useState, useEffect } from "react";
import Buy from "./Buy";
import Sell from "./Sell";
import "react-tabs/style/react-tabs.css";
import "./BuySell.scss";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { useSelector } from "react-redux";
import { Tabs, TabList, Tab } from "react-tabs";
import { server } from "../../server";
import { supportedNetworks } from "../../helpers/constant";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { message } from "antd";
import { DURATION } from "../../config/message.config";




const BuySell = () => {
  const { account, tokens, loading } = useSelector((state) => state);
  const [selectedTab, setSelectedTab] = useState(0);
  const [coins, setCoins] = useState([]);
  const [fiats, setFiats] = useState([]);
  const [allFiats, setAllFiats] = useState([]);
  const [fiatsPayMethod, setFiatsPayMethod] = useState([]);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  // const [loading, setLoading] = useState(false);


  useEffect(() => { 
    if (selectedTab == 1) {
      let eurUsd = Array.isArray(allFiats) && allFiats.filter(itm => itm?.currency_code == "EUR" || itm?.currency_code == "USD");
      // console.log("eurUsdeurUsd ", eurUsd);
      setFiats(eurUsd);
    }else {
      setFiats(allFiats)
    }

  }, [selectedTab]);

  const getSupportedCurrency = async () => {
    try { 
      store.dispatch(setLoading(true));
      const response = await server.get("/wallet/currencyfiatlist", {
        headers: {
          Authorization: account.jwtToken,
        },
      });
      const data = response.data.data;
      const responseCurr = await fetch('https://api.mercuryo.io/v1.6/lib/currencies')
      const { data: mercurioResponse } = await responseCurr.json(); 
      const crypto_currencies = mercurioResponse?.config.crypto_currencies;
      const fiat = mercurioResponse?.fiat
      const fiat_payment_methods = mercurioResponse?.fiat_payment_methods

      const filterFiatCurr = data.filter(itm => fiat.some(symbol => symbol.toLowerCase() === itm?.currency_code?.toLowerCase())); 
      setFiats(filterFiatCurr);
      setAllFiats(filterFiatCurr)
      // List of supported blockchains/networks

      let cryptoCurrencies = crypto_currencies.filter(crypto => {
        let networkData = supportedNetworks.find(supportNetwork => crypto.network.toLowerCase() == supportNetwork.network.toLowerCase());
        if (networkData) {
          crypto.coin_family = networkData.coin_family;
          return crypto;
        }
      })
      const myCrypto = tokens.filter(itm => {
        const findData = cryptoCurrencies.find(crypto => itm?.coin.coin_family === crypto?.coin_family &&
          (itm?.coin.is_token === 0 ? crypto?.currency.toLowerCase() === itm?.coin?.coin_symbol.toLowerCase() : crypto?.contract.toLowerCase() === itm?.coin?.token_address.toLowerCase()))
        if (findData) {
          return itm;
        }
      }); 
      setCoins(myCrypto);
      setFiatsPayMethod(fiat_payment_methods);
      store.dispatch(setLoading(false));
    } catch (error) {
      // console.log("Error := ", error);
      messageApi.error(error?.message || "Something went wrong.");
      store.dispatch(setLoading(false));
    }

  }

  useEffect(() => {
    getSupportedCurrency();
  }, []);




  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders backTo={"/wallet"} title={"Buy Sell"} />
      <div className="flexedContent ">
        <Tabs selectedIndex={selectedTab}>
          <TabList
            className="buysellTabList"
            style={{
              display: "flex",
              justifyContent: "space-evenly",
              listStyle: "none",
            }}
          >
            <Tab
              onClick={(e) => {
                e.preventDefault();
                setSelectedTab(0);
              }}
              style={{
                fontSize: "18px",
                flex: 1,
                fontWeight: "400",
              }}
              className="buysellTab"
            >
              Buy
            </Tab>
            <Tab
              onClick={(e) => {
                e.preventDefault();
                setSelectedTab(1);
              }}
              className="buysellTab"
              style={{
                fontSize: "18px",
                flex: 1,
                fontWeight: "400",
              }}
            >
              Sell
            </Tab>
          </TabList>

          <div className="tabContent">
            {selectedTab === 0 && (
              <Buy fiats={fiats} coins={coins} />
            )}
            {selectedTab === 1 && (
              <Sell fiats={fiats} coins={coins} loading={loading} />
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default BuySell;
