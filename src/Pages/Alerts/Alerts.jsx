/*global chrome*/

import React, { useEffect, useState } from "react";
import style from "./style.module.scss";
import CoinsTable from "../../Components/CoinsTable/CoinsTable";
import BTC from "../../Assets/Coins/BTC.png";
import Search from "../../Assets/SearchIcon.svg";

import { server } from "../../server";
import { useSelector } from "react-redux";
import {
  addCommasToNumber,
  formatSmallNumber,
} from "../../helpers/conversion.helper";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { InputField } from "../../Components/InputField/InputFieldSimple";

function getFlooredFixed(number, precision) {
  const factor = 10 ** precision;
  const roundedNumber = Math.floor(number * factor) / factor;
  let formattedNumber = roundedNumber.toFixed(precision);

  // If precision is 12 and the number has trailing zeros, remove them
  if (precision === 12 && formattedNumber.includes(".")) {
    formattedNumber = formattedNumber.replace(/\.?0+$/, "");
  }

  return formattedNumber;
}

function Alerts() {
  const { currency, alerts, account } = useSelector((state) => state);
  // console.log("🚀 ~ file: Alerts.jsx:20 ~ Alerts ~ alerts:", alerts);

  const [myAlerts, setAlerts] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [keyword, setKeyword] = useState(null);

  const init = async () => {
    store.dispatch(setLoading(true));

    const newAlerts = alerts
      .reverse()
      .filter((el) => el.accountId == account.id)
      .map((el) => {
        return {
          coinIcon: el.selectedToken.coin_data.coin_image
            ? `${process.env.REACT_APP_IMAGE_BASE_URL}${el.selectedToken.coin_data.coin_image}`
            : null,
          coinName: el.selectedToken.coin_data.coin_symbol.toUpperCase(),
          coinSubName: el.selectedToken.coin_data.coin_name,
          coinPrice: `${el.currencySymbol}${
            parseFloat(el.selectedToken.coin_data.coins_market.current_price)
              ? formatSmallNumber(
                  el.selectedToken.coin_data.coins_market.current_price
                )
              : "0.00"
          }`,
          coinStatus: addCommasToNumber(
            getFlooredFixed(
              el.selectedToken.coin_data.coins_market
                .price_change_percentage_24h || 0,
              2
            )
          ),
          currCryptoBal: `${el.currencySymbol}${addCommasToNumber(
            getFlooredFixed(Number(el.price), parseFloat(el.price) < 1 ? 12 : 2)
          )}`,
          currDollerBal: el.type.toUpperCase(),
          routeTo: "no-where",
          sent: el.sent,
          alertId: el.id,
          coinId: el.coinId,
          originalPrice: el.price,
          currencyUsed: el.currencyName,
          currencyUsedSymbol: el.currencySymbol,
        };
      });

    setAlerts(newAlerts);
    setFilteredTokens(newAlerts);

    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
  }, [alerts]);

  return (
    <div>
      <div className={`scrollableCont`}>
        <div className={style.alertList}>
          {filteredTokens.length > 0 ? (
            <CoinsTable dataArray={filteredTokens} />
          ) : (
            <p
              className="noAddress"
              style={{
                marginTop: "50%",
                fontWeight: "bold",
                fontSize: "17px",
              }}
            >
              Price Alert Not Found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Alerts;
