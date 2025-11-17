import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import CoinsTable from "../../Components/CoinsTable/CoinsTable";
import "./Receive.scss";
import { useSelector } from "react-redux";
import { InputField } from "../../Components/InputField/InputFieldSimple";
import { useLocation } from "react-router-dom";
import Search from "../../Assets/SearchIcon.svg";
import BigNumber from "bignumber.js";
import {
  addCommasToNumber,
  formatSmallNumber,
  getFlooredFixed,
} from "../../helpers/conversion.helper";
import { server } from "../../server";
import { store } from "../..";
import { message } from "antd";
import { DURATION } from "../../config/message.config";
import { setLoading } from "../../actions/loading";

function SpritzTokens() {
  const { account, currency, balanceIn, loading } = useSelector((state) => state);

  const [keyword, setKeyword] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [list, setList] = useState([]);

  const { state } = useLocation();

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

      setList(walletsList.data.data);

      store.dispatch(setLoading(false));
    } catch (error) {
      store.dispatch(setLoading(false));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  return (
    <div className={`scrollableCont send`}>
      {contextHolder}
      <MenuRestofHeaders backTo={"/withdraw"} title={"Withdraw"} />

      <div className={`flexedContent`}>
        <div className="search" style={{ marginBottom: "20px" }}>
          <InputField
            placeholder={"Search coin"}
            value={keyword}
            checkForSymbols={true}
            getData={(value) => {
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

        {list.length > 0 ? (
          <CoinsTable
            dataArray={list.map((token) => {
              const price = token.coin_data.coins_market || null;
              const myPrice = new BigNumber(price ? price.current_price : 0);
              const balance = new BigNumber(token.balance);
              const result = myPrice.times(balance);
              const formattedResult = result.toString();

              return {
                coinIcon: token.coin_data.coin_image
                  ? `${process.env.REACT_APP_IMAGE_BASE_URL}${token.coin_data.coin_image}`
                  : null,
                coinName: token.coin_data.coin_symbol.toUpperCase(),
                coinSubName: token.coin_data.coin_name,
                coinPrice: myPrice.toNumber()
                  ? formatSmallNumber(myPrice.toString())
                  : "0.00",
                coinStatus: getFlooredFixed(
                  price
                    ? parseFloat(
                        price.price_change_percentage_24h || 0
                      ).toLocaleString()
                    : 0,
                  2
                ),
                currCryptoBal: balanceIn
                  ? `${addCommasToNumber(
                      parseFloat(getFlooredFixed(token.balance, 6))
                    )} ${token.coin_data.coin_symbol.toUpperCase()}`
                  : "****",
                currDollerBal: balanceIn
                  ? addCommasToNumber(getFlooredFixed(formattedResult, 2))
                  : "****",
                routeTo: "enter-price-spritz",
                type:
                  token.coin_data.coin_symbol === "bnb"
                    ? "BEP20"
                    : token.coin_data.token_address
                    ? token.coin_data.token_type
                    : "",
                status: true,
                coin: token,
                account: state.account,
              };
            })}
          />
        ) : (
          <p
            className="noAddress"
            style={{
              marginTop: "50%",
              fontWeight: "bold",
              fontSize: "17px",
            }}
          >
            {loading ? 'Loading...' : 'No assets found'}
          </p>
        )}
      </div>
    </div>
  );
}

export default SpritzTokens;
