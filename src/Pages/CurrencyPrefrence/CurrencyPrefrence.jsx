import React, { useEffect, useState } from "react";
import BSC from "../../Assets/Coins/BSC.png";
import Unitedstate from "../../Assets/cuntry/unitedstate.svg";
import "./CurrencyPrefrence.scss";
import Newzealand from "../../Assets/cuntry/newzealand.svg";
import Europe from "../../Assets/cuntry/europe.svg";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { WalletHelper } from "../../helpers/wallet.helper";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { server } from "../../server";
import TickIcon from "../../Assets/TickIconC.svg";
import { message } from "antd";
function CurrencyPrefrence() {
  const navigate = useNavigate();
  const { currency, account } = useSelector((state) => state);
  const [messageApi, contextHolder] = message.useMessage();
  // console.log("account::", account);
  const [data, setData] = useState([]);

  const init = async () => {
    store.dispatch(setLoading(true));
    const response = await server.get("/wallet/currencyfiatlist", {
      headers: {
        Authorization: account.jwtToken,
      },
    });
    // console.log("SSSSSSSSSSSSSSSSSS ", response);
    
    const data = response.data.data;

    const final = data.map((el) => {
      return {
        img: el.image,
        currency: el.currency_name,
        name: el.currency_code,
        symbol: el.currency_symbol,
      };
    });

    // Sort the 'final' array alphabetically by the 'name' property
    const sortedFinal = final.sort((a, b) => a.name.localeCompare(b.name));

    setData(sortedFinal);
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
  }, []);

  const { state } = useLocation();

  return (
    <>
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={state ? (state.backTo ? "/wallet" : "/setting") : "/setting"}
          title={"Native Currency"}
        />
        {contextHolder}
        <div className={`flexedContent`}>
          {/* <div className='listItems'>
            <ul>
              {data.map((data) => (
                <li
                  className='currency_click'
                  onClick={async () => {
                    await WalletHelper.setCurrencyPreference({
                      name: data.name,
                      symbol: data.symbol,
                    });
                    navigate('/wallet');
                  }}
                >
                  <div>
                    <p>
                      {data.name} - {data.currency}
                    </p>
                  </div>{' '}
                  <p>{data.name === currency.name ? '(Default)' : ''}</p>
                </li>
              ))}
            </ul>
          </div> */}
          {data.map((data) => (
            <div
              onClick={async () => {
                await WalletHelper.setCurrencyPreference({
                  name: data.name,
                  symbol: data.symbol,
                });

                message.success("Currency updated successfully")
                navigate('/setting');
              }}
              className="listItems"
              style={{
                display: "flex",
                flexDirection: 'column',
                gap: "25px",
                cursor: "pointer"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "13px",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
                  <img style={{ height: 30, width: 30 }} src={data?.img} alt="img" />
                  <span className="Currencyname">{data?.name}</span>
                </div>
                {data.name === currency.name ? <img style={{ height: 12, width: 12 }} src={TickIcon} alt="usd" /> : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default CurrencyPrefrence;
