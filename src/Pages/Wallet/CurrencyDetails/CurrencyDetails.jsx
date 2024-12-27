/*global chrome*/

import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import "./CurrencyDetails.scss";
import BalanceDetails from "../../../Components/BalanceDetails/BalanceDetails";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { message } from "antd";
import { useSelector } from "react-redux";
import { DURATION } from "../../../config/message.config";
import {
  addCommasToNumber,
  balanceToFiatConversion,
  getFlooredFixed,
} from "../../../helpers/conversion.helper";
import { server } from "../../../server";
import HistryList from "../../../Components//HistryList/HistryList";
import Sendhistry from "../../../Assets/sendhistry.svg";
import Deposit from "../../../Assets/deposit.svg";
import FilterIcon from "../../../Assets/Filtericon.svg";
import { store } from "../../..";
import { setFilter } from "../../../actions/filter";
import DarkFilterIcon from "../../../Assets/DarkFilterIcon.svg";
import * as moment from "moment";
import {
  InputField,
  InputFieldOnly,
} from "../../../Components/InputField/InputFieldSimple";
import CopyIcon from "../../../Assets/CopyIconBlue.svg";
import ShareIcon from "../../../Assets/ShareIcon.png";
import usdt from "../../../Assets/Coins/usdt.svg";
import CurrencyBalanceDetails from "./CurrencyBalance";

function CurrencyDetails() {
  const { currency, account } = useSelector((state) => state);


  const [isModalOpen, setIsModalOpen] = useState(false);

  const getLocation = useLocation();

  const path = getLocation.pathname.replace('/', '');

  const navigate = useNavigate();

  const { state } = useLocation();
  const {
    state: { coin },
  } = useLocation();

  // const { state } = useLocation();

  const [price, setPrice] = useState(0);

  useEffect(() => {
    setPrice(coin.coin.fiat_price_data || 0);
  }, []);

  const showModal = () => {

    setIsModalOpen(true);

  };

  const handleOk = () => {

    setIsModalOpen(false);

  };

  const handleCancel = () => {

    setIsModalOpen(false);

  };







  const [isStared, setIsStared] = useState(

    coin.coin.watchlist_data && coin.coin.watchlist_data.status === '1'

      ? true

      : false

  );





  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const [history, setHistory] = useState([]);
  const { theme } = useSelector((state) => state);
  const init = async () => {
    if (!state.status) {
      store.dispatch(
        setFilter({
          coinId: "all",
          status: "all",
          fromDate: null,
          toDate: null,
          type: "all",
        })
      );
    }

    const transactionList = await server.post(
      `/wallet/transaction/list`,
      {
        coin_id: coin.coin.coin_id,
        coin_type: coin.coin.coin_symbol,
        coin_family: [coin.coin.coin_family],
        addrsListKeys: [coin.wallet_address],
        page: 1,
        limit: 250,
        status: state
          ? state.status === "all"
            ? undefined
            : state.status
          : undefined,
        date_from: state
          ? state.fromDate
            ? moment(state.fromDate).startOf("day")
            : undefined
          : undefined,
        date_to: state
          ? state.toDate
            ? moment(state.toDate).endOf("day")
            : undefined
          : undefined,
        trnx_type: state ? (state.type ? state.type : undefined) : undefined,
      },
      {
        headers: {
          Authorization: account?.jwtToken,
        },
      }
    );

    setHistory(transactionList?.data?.data);
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={"/wallet"}
        title={
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {coin.coin.coin_image ? (
              <img src={coin?.coin?.coin_image} className="detailIcon" alt="" />
            ) : (
              <div
                className="randb extra borderDarkLight"
                style={{
                  height: "35px",
                  width: "35px",
                  background: "rgb(202, 201, 201)",
                  borderRadius: "50%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  border: "1px solid",
                }}
              >
                {coin?.coin?.coin_name &&
                  coin?.coin?.coin_name?.split("")[0]?.toUpperCase()}
              </div>
            )}
            <p
              style={{
                maxWidth: "200px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {" "}
              {coin.coin.coin_symbol &&
                (coin?.coin?.coin_symbol?.toUpperCase() === "BNB"
                  ? "BNB Smart Chain"
                  : coin?.coin?.coin_symbol?.toUpperCase())}
            </p>
          </span>
        }
        chartIcon={() => {
          chrome.tabs.create({
            url: `https://trading.skymarvel.io?key=${coin?.coin?.coin_symbol?.toUpperCase()}`,
          });
        }}
        // stared={() => {
        //   navigate("/watch-list-tokens");
        // }}
        stared={async () => {
          try {
            await server.post(
              'wallet/updateWatchlist',
              {
                data: [
                  {
                    address: account.address,
                    coin_id: coin.coin.coin_id,
                    status: coin?.coin?.watchlist_data?.status == '1'
                      ? 0
                      : 1,
                  },
                ],
              },
              {
                headers: {
                  Authorization: account.jwtToken,
                },
              }
            );
            console.log('accountaccountaccount ', account);
            console.log('coincoincoincoincoin ', coin);

            setIsStared(!isStared)
          } catch (error) {
            messageApi.error('Unable to favourite the selected coin');
          }
        }}
        isStared={isStared}
      />

      <div className={`flexedContent padding-Top`}>
        {/* <span onClick={()=>  navigate("/watch-list-tokens")}>Watch</span> */}
        <div className="currDetails currencyCard">
          <div className="currDetails__card">
            <div className="currDetails__card__topTexts">
              <p
                className="currDetails__card__text"
                style={{
                  color: "#fff",
                }}
              >
                {coin.coin.coin_family === 1 ? "BEP20" : coin.coin.coin_family === 2 ? "ERC20" : coin.coin.coin_family === 4 ? "ERC20" : coin.coin.coin_family === 5 ? "SPL" : coin.coin.coin_family === 6 ? "TRC20" : ""}
              </p>
              <p
                className="currDetails__card__text"
                style={{
                  color: "#fff",
                }}
              >
                {currency.symbol}
                {price
                  ? addCommasToNumber(
                    getFlooredFixed(
                      Number(price?.value),
                      parseFloat(price?.value) < 1 ? 12 : 2
                    )
                  )
                  : "0.00"}{" "}
                <span
                  style={{
                    color:
                      parseFloat(price?.price_change_percentage_24h) <= 0
                        ? "red"
                        : "lightgreen",
                  }}
                >
                  {parseFloat(
                    price?.price_change_percentage_24h || 0
                  ).toLocaleString() <= 0
                    ? ""
                    : "+"}
                  {getFlooredFixed(
                    price
                      ? price?.price_change_percentage_24h
                        ? price?.price_change_percentage_24h
                        : 0
                      : 0,
                    2
                  )}
                  %
                </span>
              </p>
            </div>
            <div style={{ textAlign: "center", margin: "12px auto" }}>
              <img src={usdt} alt="usdt" />
            </div>
            <CurrencyBalanceDetails
              mt0="currDetails__card__mt0"
              className="currDetails__card__paddingOverride"
              textLeft="currDetails__card__textLeft"
              balance={`${addCommasToNumber(
                parseFloat(getFlooredFixed(coin?.balance, 4))
              )} ${coin?.coin?.coin_symbol}`}
              coin={coin}
            />
            {/* <BalanceDetails
              mt0="currDetails__card__mt0"
              className="currDetails__card__paddingOverride"
              textLeft="currDetails__card__textLeft"
              balance={`${addCommasToNumber(
                parseFloat(getFlooredFixed(coin?.balance, 4))
              )} ${coin?.coin?.coin_symbol}`}
              coin={coin}
            /> */}
          </div>

          {coin && (
            <div className="editWallet__linkOuter">
              {console.log('account.coinFamilyAndAddress ', account)}
              {console.log('CCCCCCCCCCCCCCCCC', coin.coin.coin_family)}
              <InputField
                value={account.coinFamilyAndAddress[coin.coin.coin_family]}
                readonly={true}
                placeholderBaseColor={true}
                addonAfter={
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <img
                      src={CopyIcon}
                      width={14}
                      alt=""
                      height={16}
                      style={{
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(
                          account.coinFamilyAndAddress[coin.coin.coin_family]
                        );
                        messageApi.success("Address copied to clipboard");
                      }}
                    />
                    <img
                      src={ShareIcon}
                      style={{
                        cursor: "pointer",
                      }}
                    />
                  </span>
                }
              />
            </div>
          )}

          <div className="currDetails__dataSec">
            <div className="currDetails__dataSec__header">
              <p>Transaction History</p>
              <Link
                to=""
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/filter-history", {
                    state: {
                      currencyDetail: coin,
                    },
                  });
                }}
              >
                {theme == "darkTheme" ? (
                  <img src={DarkFilterIcon} />
                ) : (
                  <img src={DarkFilterIcon} />
                )}
              </Link>
            </div>
            <div className="currDetails__dataSec__table">
              {history.length > 0 ? (
                history.map((data) => {
                  let name = null;

                  const price = data?.coin_data?.fiat_price_data;

                  let transactionType =
                    data.type === "dapp"
                      ? "Smart Contract"
                      : data.type === "deposit"
                        ? "Received"
                        : data.type === "withdraw"
                          ? "Sent"
                          : data.type.toLowerCase() === "swap"
                            ? "Swap"
                            : "Withdraw";

                  return (
                    <HistryList
                      hash={data?.tx_id}
                      status={data?.blockchain_status?.toUpperCase()}
                      sendRecieve={transactionType}
                      coinname={data?.coin_data?.coin_symbol?.toUpperCase()}
                      address={`${data?.from_adrs?.substring(0, 5)}.....
          ${data?.from_adrs?.substring(
                        data?.from_adrs?.length - 5,
                        data?.from_adrs?.length
                      )}`}
                      valueCurrency={`${addCommasToNumber(
                        getFlooredFixed(data?.amount, 5)
                      )} ${data?.coin_data?.coin_symbol?.toUpperCase()}`}
                      dollercurrency={balanceToFiatConversion(
                        price ? price?.value : 0,
                        data?.amount
                      )}
                      addressTo={
                        name
                          ? name
                          : `${data?.to_adrs?.substring(0, 5)}.....
          ${data?.to_adrs?.substring(
                            data?.to_adrs?.length - 5,
                            data?.to_adrs?.length
                          )}`
                      }
                      TickIcon={
                        transactionType === "Deposit" ? Deposit : Sendhistry
                      }
                      def={currency.symbol}
                      allData={data}
                      coin={coin}
                      date={moment(data.created_at).format(
                        "DD, MMM YYYY | hh:mm A"
                      )}
                    />
                  );
                })
              ) : (
                <p
                  className="noAddress"
                  style={{
                    marginTop: "24%",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  No Transactions Found...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CurrencyDetails;
