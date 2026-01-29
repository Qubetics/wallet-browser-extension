import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import CoinsTable from "../../Components/CoinsTable/CoinsTable";
import style from "./style.module.scss";
import { useSelector } from "react-redux";
import { InputField } from "../../Components/InputField/InputFieldSimple";
import { useLocation, useNavigate } from "react-router-dom";
import Search from "../../Assets/SearchIcon.svg";
import BigNumber from "bignumber.js";
import {
  addCommasToNumber,
  formatSmallNumber,
  getFlooredFixed,
} from "../../helpers/conversion.helper";
import { server } from "../../server";
import { store } from "../..";
import { setTokens } from "../../actions/tokens";
import { QRCode } from "react-qrcode-logo";
import { Drawer, message } from "antd";
import { DURATION } from "../../config/message.config";
import CopyIconBlue from "../../Assets/CopyIconBlue.svg";
import ModalCustom from "../../Components/ModalCustom/ModalCustom";
import ModalCloseIcon from "../../Assets/ModalCloseIcon.svg";
import darkclose from "../../Assets/darkclose.svg";
import { setLoading } from "../../actions/loading";

function BuyCoins() {
  const { account, tokens, currency, balanceIn, loading } = useSelector(
    (state) => state
  );

  const [keyword, setKeyword] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [newMyPrice, setNewMyPrice] = useState(0);
  const [myTokens, setMyTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);

  const navigate = useNavigate();
  const { theme } = useSelector((state) => state);
  const showModal = (coin) => {
    setIsModalOpen(true);
    setSelectedCoin(coin);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const { state } = useLocation();

  const init = async () => {
    store.dispatch(setLoading(true));
    const walletsList = await server.post(
      `/wallet/buy-sell-coins`,
      {
        addresses: account.addressLists,
        coin_family: account.coinFamilies,
        fiat_currency: currency.name,
        is_watch_only: account.isWatchOnly ? 1 : 0,
        address_list_array: Object.keys(account.coinFamilyAndAddress)
          .map((key) => {
            return {
              coin_family: key,
              address: account.coinFamilyAndAddress[key],
            };
          })
          .filter((el) => el.address),
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    let rtk = walletsList.data.data.filter((el) => {
      // console.log(filterOutTheCoins(el, "BUY"), filterOutTheCoins(el, "SELL"));
      if (filterOutTheCoins(el, "BUY") || filterOutTheCoins(el, "SELL")) {
        return el;
      }
    });
    // console.log("walletsListwalletsList ", walletsList, rtk);

    setMyTokens(rtk);
    setFilteredTokens(
      walletsList.data.data.filter((el) => {
        // console.log(
        //   filterOutTheCoins(el, "BUY"),
        //   filterOutTheCoins(el, "SELL")
        // );
        if (filterOutTheCoins(el, "BUY") || filterOutTheCoins(el, "SELL")) {
          return el;
        }
      })
    );
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkIfAvailableAndSendIt = async (type) => {
    store.dispatch(setLoading(true));

    let provider = [];

    switch (type) {
      case "BUY":
        if (selectedCoin.is_transak == 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_transak_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : selectedCoin.sell_transak_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push("TRANSAK");
          }
        }
        if (selectedCoin.is_mercuryo == 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_mercuryo_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : selectedCoin.sell_mercuryo_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push("MERCURYO");
          }
        }
        if (selectedCoin.is_alchemy == 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_alchemy_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : selectedCoin.sell_alchemy_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push("ALCHEMY");
          }
        }
        if (selectedCoin.is_simplex === 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_simplex_country
                  ?.split(",")
                  .map((el) => el.toUpperCase())
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : null;

          if (check) {
            provider.push("SIMPLEX");
          }
        }
        break;
      case "SELL":
        if (selectedCoin.transak_sell == 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_transak_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : selectedCoin.sell_transak_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push("TRANSAK");
          }
        }
        if (selectedCoin.mercuryo_sell == 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_mercuryo_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : selectedCoin.sell_mercuryo_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push("MERCURYO");
          }
        }
        if (selectedCoin.alchemy_sell == 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_alchemy_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : selectedCoin.sell_alchemy_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push("ALCHEMY");
          }
        }
        break;

      default:
        break;
    }

    const newCoin = {
      alchemy_network: selectedCoin.alchemy_network,
      network: selectedCoin.network,
      id: selectedCoin.coin_id,
      provider,
      coin_family: selectedCoin.coin_family,
      coinIcon: selectedCoin.coin_data.coin_image
        ? `${process.env.REACT_APP_IMAGE_BASE_URL}${selectedCoin.coin_data.coin_image}`
        : null,
      coinName: selectedCoin.coin_symbol,
      coinSubName: selectedCoin.coin_name,
      balance: selectedCoin.coin_data.wallet_addresses_data
        ? selectedCoin.coin_data.wallet_addresses_data.balance
        : 0,
      type:
        selectedCoin.coin_data.coin_symbol === "bnb"
          ? "BEP20"
          : selectedCoin.coin_data.token_address
          ? selectedCoin.coin_data.token_type
          : "",
      coinPrice: addCommasToNumber(
        selectedCoin.coin_data.coins_market.current_price.toFixed(2)
      ),
      coinStatus: getFlooredFixed(
        selectedCoin.coin_data.coins_market
          ? parseFloat(
              selectedCoin.coin_data.coins_market.price_change_percentage_24h ||
                0
            ).toLocaleString()
          : 0,
        2
      ),
      currCryptoBal: ``,
      currDollerBal: ``,
      coinFamily: parseInt(selectedCoin.coin_family),
      simplexCoinSymbol: selectedCoin.simplex_coin_symbol,
      currencyTransk:
        type === "BUY"
          ? selectedCoin.buy_transak_country
              ?.split(",")
              .includes(currency.name.toUpperCase())
            ? currency.name.toUpperCase()
            : null
          : selectedCoin.sell_transak_country
              ?.split(",")
              .includes(currency.name.toUpperCase())
          ? currency.name.toUpperCase()
          : null,

      currencyMercuryo:
        type === "BUY"
          ? selectedCoin.buy_mercuryo_country
              ?.split(",")
              .includes(currency.name.toUpperCase())
            ? currency.name.toUpperCase()
            : null
          : selectedCoin.sell_mercuryo_country
              ?.split(",")
              .includes(currency.name.toUpperCase())
          ? currency.name.toUpperCase()
          : null,

      currencySimplex:
        type === "BUY"
          ? selectedCoin.buy_simplex_country
              ?.split(",")
              .map((el) => el.toUpperCase())
              .includes(currency.name.toUpperCase())
            ? currency.name.toUpperCase()
            : null
          : null,

      currencyAlchemy:
        type === "BUY"
          ? selectedCoin.buy_alchemy_country
              ?.split(",")
              .includes(currency.name.toUpperCase())
            ? currency.name.toUpperCase()
            : null
          : selectedCoin.sell_alchemy_country
              ?.split(",")
              .includes(currency.name.toUpperCase())
          ? currency.name.toUpperCase()
          : null,
    };

    store.dispatch(setLoading(false));
    return newCoin;
  };

  const filterOutTheCoins = (selectedCoin, type) => {
    let provider = [];

    switch (type) {
      case "BUY":
        if (selectedCoin.is_transak == 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_transak_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : selectedCoin.sell_transak_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push("TRANSAK");
          }
        }
        if (selectedCoin.is_mercuryo == 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_mercuryo_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : selectedCoin.sell_mercuryo_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push("MERCURYO");
          }
        }
        if (selectedCoin.is_alchemy == 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_alchemy_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : selectedCoin.sell_alchemy_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push("ALCHEMY");
          }
        }
        if (selectedCoin.is_simplex === 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_simplex_country
                  ?.split(",")
                  .map((el) => el.toUpperCase())
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : null;

          if (check) {
            provider.push("SIMPLEX");
          }
        }
        break;
      case "SELL":
        if (selectedCoin.transak_sell == 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_transak_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : selectedCoin.sell_transak_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push("TRANSAK");
          }
        }
        if (selectedCoin.mercuryo_sell == 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_mercuryo_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : selectedCoin.sell_mercuryo_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push("MERCURYO");
          }
        }
        if (selectedCoin.alchemy_sell == 1) {
          const check =
            type === "BUY"
              ? selectedCoin.buy_alchemy_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
                ? currency.name.toUpperCase()
                : null
              : selectedCoin.sell_alchemy_country
                  ?.split(",")
                  .includes(currency.name.toUpperCase())
              ? currency.name.toUpperCase()
              : null;

          if (check) {
            provider.push("ALCHEMY");
          }
        }
        break;

      default:
        break;
    }

    // console.log(provider, "===============");

    return provider.length === 0 ? false : true;
  };

  return (
    <div className={`scrollableCont ${style.send}`}>
      <div className="searchBarFixed">
        {contextHolder}
        <MenuRestofHeaders
          backTo={"/wallet"}
          title={account.isWatchOnly ? "Buy" : "Buy/Sell"}
          coin={state ? (state.coin ? state.coin : null) : null}
        />
        <div className="search">
          <InputField
            placeholder={"Search"}
            value={keyword}
            checkForSymbols={true}
            getData={(value) => {
                const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
              if (hasEmoji) {return false}
              setKeyword(value);
              if (value.trim().length === 0) {
                setFilteredTokens(myTokens);
              } else {
                const matches = myTokens.filter(
                  (el) =>
                    el.coin_symbol
                      .toLowerCase()
                      .indexOf(value.trim().toLowerCase()) > -1 ||
                    el.coin_name
                      .toLowerCase()
                      .indexOf(value.trim().toLowerCase()) > -1
                );

                setFilteredTokens(matches);
              }
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
      </div>
      <div className={`flexedContent`}>
        {filteredTokens.length > 0 ? (
          <CoinsTable
            dataArray={filteredTokens.map((token) => {
              const price = token.coin_data.coins_market || null;
              const myPrice = new BigNumber(price ? price.current_price : 0);
              const balance = new BigNumber(
                token.coin_data.wallet_addresses_data
                  ? token.coin_data.wallet_addresses_data.balance
                  : 0
              );
              const result = myPrice.times(balance);
              const formattedResult = result.toString();

              return {
                coinIcon: token.coin_data.coin_image
                  ? `${process.env.REACT_APP_IMAGE_BASE_URL}${token.coin_data.coin_image}`
                  : null,
                coinName: token.coin_symbol.toUpperCase(),
                coinSubName: token.coin_name,
                coinPrice: `${currency.symbol}${
                  myPrice.toNumber()
                    ? formatSmallNumber(myPrice.toString())
                    : "0.00"
                }`,
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
                      parseFloat(
                        getFlooredFixed(
                          token.coin_data.wallet_addresses_data
                            ? token.coin_data.wallet_addresses_data.balance
                            : 0,
                          6
                        )
                      )
                    )}`
                  : "****",
                currDollerBal: balanceIn
                  ? `${currency.symbol}${addCommasToNumber(
                      getFlooredFixed(formattedResult, 2)
                    )}`
                  : "****",
                routeTo: "no-where",
                type:
                  token.coin_family === 1
                    ? "ETH"
                    : token.coin_family === 3
                    ? "BNB"
                    : token.coin_family === 7
                    ? "AVAX"
                    : token.coin_family === 6
                    ? "POL"
                    : token.coin_family === 8
                    ? "CRO"
                    : token.coin_family === 4
                    ? "SOL"
                    : token.coin_family === 2
                    ? "BTC"
                    : token.coin_family === 5
                    ? "ADA"
                    : "ethereum",
                status: true,
                coin: token,
                showModal,
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

      <Drawer
        // title={"Buy/Sell"}
        placement="bottom"
        title="Buy/Sell"
        onClose={() => setSelectedCoin(null)}
        height={287}
        open={selectedCoin}
        closeIcon={
          theme == "darkTheme" ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
      >
        {selectedCoin ? (
          <CoinsTable
            dataArray={[
              {
                coinIcon: selectedCoin.coin_data.coin_image
                  ? `${process.env.REACT_APP_IMAGE_BASE_URL}${selectedCoin.coin_data.coin_image}`
                  : null,
                coinName: selectedCoin.coin_symbol.toUpperCase(),
                coinSubName: selectedCoin.coin_name,
                coinPrice: `${currency.symbol}${
                  parseFloat(selectedCoin.coin_data.coins_market.current_price)
                    ? formatSmallNumber(
                        selectedCoin.coin_data.coins_market.current_price
                      )
                    : "0.00"
                }`,
                coinStatus: getFlooredFixed(
                  selectedCoin.coin_data.coins_market
                    ? parseFloat(
                        selectedCoin.coin_data.coins_market
                          .price_change_percentage_24h || 0
                      ).toLocaleString()
                    : 0,
                  2
                ),
                currCryptoBal: ``,
                currDollerBal: ``,
                routeTo: "no-where",
                type:
                  selectedCoin.coin_family === 1
                    ? "ETH"
                    : selectedCoin.coin_family === 3
                    ? "BNB"
                    : selectedCoin.coin_family === 7
                    ? "AVAX"
                    : selectedCoin.coin_family === 6
                    ? "POL"
                    : selectedCoin.coin_family === 8
                    ? "CRO"
                    : selectedCoin.coin_family === 4
                    ? "SOL"
                    : selectedCoin.coin_family === 2
                    ? "BTC"
                    : selectedCoin.coin_family === 5
                    ? "ADA"
                    : "ethereum",
                status: true,
                coin: selectedCoin,
                showModal,
              },
            ]}
          />
        ) : null}

        <div
          className="buttons"
          style={{
            marginTop: selectedCoin ? "30px" : "0px",
            display: "flex",
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            top: "28px",
          }}
        >
          <div
            className="green"
            style={{
              padding: "12px 53px",
              backgroundColor: "green",
              color: "white",
              fontSize: "18px",
              borderRadius: "7px",
              marginRight: "10px",
              cursor: "pointer",
            }}
            onClick={async () => {
              const myNew = await checkIfAvailableAndSendIt("BUY");
              // console.log("myNewmyNewmyNewmyNewmyNewmyNewmyNew ", myNew);

              if (myNew.provider.length === 0) {
                return messageApi.error(
                  "This coin is not supported for purchase."
                );
              }
              return navigate("/enter-price", {
                state: {
                  type: "BUY",
                  coin: myNew,
                  balanceDetail: null,
                },
              });
            }}
          >
            Buy
          </div>
          {account.isWatchOnly ? null : (
            <div
              className="red"
              style={{
                padding: "12px 53px",
                backgroundColor: "red",
                color: "white",
                fontSize: "18px",
                borderRadius: "7px",
                marginLeft: "10px",
                cursor: "pointer",
              }}
              onClick={async () => {
                const myNew = await checkIfAvailableAndSendIt("SELL");

                if (myNew.provider.length === 0) {
                  return messageApi.error("Coin not supported for sell.");
                }

                return navigate("/enter-price", {
                  state: {
                    type: "SELL",
                    coin: myNew,
                    balanceDetail: null,
                  },
                });
              }}
            >
              Sell
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}

export default BuyCoins;
