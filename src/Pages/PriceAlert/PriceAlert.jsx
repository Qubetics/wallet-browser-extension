import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders.jsx";
import AddressNetworkCard from "../../Components/AddressNetworkCard/AddressNetworkCard.jsx";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import ButtonComp from "../../Components/ButtonComp/ButtonComp.jsx";
import CoinsTable from "../../Components/CoinsTable/CoinsTable.jsx";
import { message } from "antd";
import BigNumber from "bignumber.js";
import { addCommasToNumber } from "../../helpers/conversion.helper.js";

function getFlooredFixed(v, d) {
  return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
}
function PriceAlerts() {
  const { account, chain, alerts, prices, currency } = useSelector(
    (state) => state
  );

  const [show, setShow] = useState(false);

  useEffect(() => {
    const activeTokens = account.tokens[chain.chainId].filter(
      (el) => el.status == true
    );

    if (activeTokens.length === 0) {
      return messageApi.error("Please enable at least 1 coin to proceed.");
    }
    setShow(true);
  }, []);

  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  // console.log(alerts);
  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={"/setting"}
        title={"Price Alerts"}
        addIcon={show ? "/add-alert" : false}
      />
      <div
        className={`flexedContent`}
        style={
          alerts[chain.chainId]
            ? alerts[chain.chainId].length > 0
              ? {}
              : {
                  minHeight: "600px",
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }
            : {
                minHeight: "600px",
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }
        }
      >
        {/* <Link
          to='/add-alert'
          onClick={(e) => {
            navigate("/add-alert");
          }}
        >
          <ButtonComp
            text={"Add Price Alert"}
            maxWidth={"100%"}
            marginBottom={"40px"}
          />
        </Link> */}
        {alerts[chain.chainId] ? (
          alerts[chain.chainId].length > 0 ? (
            <CoinsTable
              dataArray={alerts[chain.chainId]
                .filter((el) => el.accountId == account.id)
                .reverse()
                .map((el, index) => {
                  const price = prices[chain.chainId]
                    ? prices[chain.chainId].find(
                        (myPrice) =>
                          myPrice.symbol.toUpperCase() ===
                            el.coinSymbol.toUpperCase() &&
                          myPrice.fiat_currency === currency.name.toLowerCase()
                      )
                    : 0;
                  return {
                    coinIcon: el.image,
                    coinName: el.coinSymbol,
                    coinSubName: el.coinName,
                    coinPrice: `${el.currencySymbol}${addCommasToNumber(
                      new BigNumber(price.current_price).toFixed(2)
                    )}`,
                    coinStatus: getFlooredFixed(
                      price
                        ? parseFloat(
                            price.price_change_percentage_24h || 0
                          ).toLocaleString()
                        : 0,
                      2
                    ),
                    currCryptoBal: el.type.toUpperCase(),
                    currDollerBal: addCommasToNumber(
                      new BigNumber(el.price).toFixed(2)
                    ),
                    routeTo: "no-where",
                    type: "",
                    status: true,
                    sent: el.sent,
                    removeAlert: true,
                    alertIndex: el.id,
                    coinId: el.coinId,
                    originalPrice: el.price,
                  };
                })}
            />
          ) : (
            <p style={{ fontSize: "17px", fontWeight: "bold" }}>
              Price Alerts Not Found
            </p>
          )
        ) : (
          <p style={{ fontSize: "17px", fontWeight: "bold" }}>
            Price Alerts Not Found
          </p>
        )}
      </div>
    </div>
  );
}

export default PriceAlerts;
