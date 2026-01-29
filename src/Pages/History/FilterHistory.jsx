/*global chrome*/

import { DatePicker, message, Select, Space } from "antd";
import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import Btc from "../../Assets/Coins/BTC.png";
import ButtonComp from "../../Components/ButtonComp/ButtonComp.jsx";
import "./FilterHistory.scss";
import { server } from "../../server";
import { useSelector } from "react-redux";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import style from "./FilterHistory.scss";
import { useLocation, useNavigate } from "react-router-dom";
import { setFilter } from "../../actions/filter";
import dayjs from "dayjs";
import moment from "moment";

function FilterHistory() {
  const { account, filter } = useSelector((state) => state);
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState([]);

  const [filterValue, setFilterValue] = useState({
    coinId: filter.coinId,
    status: filter.status,
    fromDate: filter.fromDate,
    toDate: filter.toDate,
    type: filter.type,
  });

  const disabledFromDate = (current, toDate) => {
    const today = dayjs().endOf("day");
    if (toDate && current) {
      return current.isAfter(toDate) || current.isAfter(today);
    }
    return current.isAfter(today);
  };

  const disabledToDate = (current, fromDate) => {
    const today = dayjs().endOf("day");
    if (fromDate && current) {
      return current.isBefore(fromDate) || current.isAfter(today);
    }
    return current.isAfter(today);
  };

  const { state } = useLocation();

  const init = async () => {
    try {
      store.dispatch(setLoading(true));
      const { chains } = await chrome.storage.local.get("chains");

      const finalData = [
        {
          value: "all",
          label: (
            <span className="flexedItemSelect">
              <div
                className="randb  borderDarkLight"
                style={{
                  height: "35px",
                  width: "35px",
                  border: "1.5px solid",
                  borderRadius: "50%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                A
              </div>
              All
            </span>
          ),
        },
      ];

      chains.forEach((el) => {
        finalData.push({
          value: el.coinFamily,
          label: (
            <span className="flexedItemSelect">
              <img
                src={el.image}
                style={{
                  width: "26px",
                  objectFit: "contain",
                }}
                alt=""
              />
              {el.currencySymbol.toUpperCase()}
            </span>
          ),
        });
      });

      setData(finalData);
      store.dispatch(setLoading(false));
    } catch (error) {
      store.dispatch(setLoading(false));
      return false;
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, []);

  const { RangePicker } = DatePicker;
  return (
    <div className="scrollableCont">
      <div>
        {contextHolder}
        <div className="searchBarFixed">
          <MenuRestofHeaders
            backTo={"/history"}
            path={state?.path ?? "/wallet"}
            title={"Filter"}
            coin={state?.currencyDetail || null}
          />
        </div>
        <div className="filterHistory ">
          <div className={"filterHistory__selctHis"}>
            {!state?.currencyDetail ? (
              <>
                <label className="label">Select Coin</label>

                <Select
                  popupClassName="filterHistoryDropdown"
                  style={{
                    width: 120,
                  }}
                  onChange={(value, label) => {
                    // console.log(value, label);
                    setFilterValue({
                      ...filterValue,
                      coinId: label,
                    });
                  }}
                  defaultValue={
                    filter.coinId === "all"
                      ? {
                          value: "all",
                          label: (
                            <span className="flexedItemSelect">
                              <div
                                className="randb  borderDarkLight"
                                style={{
                                  height: "26px",
                                  width: "26px",
                                  border: "1.5px solid",
                                  borderRadius: "50%",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                A
                              </div>
                              All
                            </span>
                          ),
                        }
                      : filter.coinId
                  }
                  options={data}
                />
              </>
            ) : null}
          </div>
          <div className={"filterHistory__selctHis"}>
            <label className="label">Transaction Type</label>
            <Select
              popupClassName="filterHistoryDropdown"
              style={{
                width: 120,
              }}
              defaultValue={{
                value: filter.type,
                label: (
                  <span className="flexedItemSelect">
                    {filter.type.charAt(0).toUpperCase() + filter.type.slice(1)}
                  </span>
                ),
              }}
              onChange={(value, label) => {
                setFilterValue({ ...filterValue, type: value });
              }}
              options={[
                {
                  value: "all",
                  label: <span className="flexedItemSelect">All</span>,
                },

                // {
                //   value: "buy",
                //   label: <span className="flexedItemSelect">Buy</span>,
                // },
                // {
                //   value: "sell",
                //   label: <span className="flexedItemSelect">Sell</span>,
                // },
                {
                  value: "swap",
                  label: <span className="flexedItemSelect">Swap</span>,
                },
                {
                  value: "withdraw",
                  label: <span className="flexedItemSelect">Withdrawal</span>,
                },
                {
                  value: "deposit",
                  label: <span className="flexedItemSelect">Deposit</span>,
                },
                {
                  value: "dapp",
                  label: <span className="flexedItemSelect">dApp</span>,
                },
              ]}
            />
          </div>
          <div className={"filterHistory__selctHis"}>
            <label className="label">Transaction Status</label>
            <Select
              popupClassName="filterHistoryDropdown"
              style={{
                width: 120,
              }}
              onChange={(value, label) => {
                setFilterValue({ ...filterValue, status: value });
              }}
              defaultValue={{
                value: filter.status,
                label:
                  filter.status === "confirmed" ? (
                    <span className="flexedItemSelect">Completed</span>
                  ) : (
                    <span className="flexedItemSelect">
                      {filter.status.charAt(0).toUpperCase() +
                        filter.status.slice(1)}
                    </span>
                  ),
              }}
              options={[
                {
                  value: "all",
                  label: <span className="flexedItemSelect">All</span>,
                },
                {
                  value: "confirmed",
                  label: <span className="flexedItemSelect">Completed</span>,
                },
                {
                  value: "pending",
                  label: <span className="flexedItemSelect">Pending</span>,
                },
                {
                  value: "failed",
                  label: <span className="flexedItemSelect">Failed</span>,
                },
              ]}
            />
          </div>
          <div className={"filterHistory__selctHis"}>
            <label className="label">Date</label>
            {/* {filter.toDate ? (
            <RangePicker
              defaultValue={[
                dayjs(filter.fromDate, "YYYY-MM-DD"),
                dayjs(filter.toDate, "YYYY-MM-DD"),
              ]}
              placeholder={["From", "To"]}
              onChange={(value) => {
                setFilterValue({
                  ...filterValue,
                  fromDate: value[0].format("YYYY-MM-DD"),
                  toDate: value[1].format("YYYY-MM-DD"),
                });
              }}
              disabledDate={(current) => current && current > today}
            />
          ) : (
            <RangePicker
              onChange={(value) => {
                setFilterValue({
                  ...filterValue,
                  fromDate: value[0].format("YYYY-MM-DD"),
                  toDate: value[1].format("YYYY-MM-DD"),
                });
              }}
            />
          )} */}
            <div className="dateFlex">
              <DatePicker
                value={
                  filterValue.fromDate
                    ? dayjs(filterValue.fromDate, "YYYY-MM-DD")
                    : null
                }
                placeholder="From"
                onChange={(value) => {
                  // console.log("CCCCCCCCCCC ", value.format("YYYY-MM-DD"), " ----- ", value);
                  // console.log("daysssss ", dayjs(value).format("YYYY-MM-DD"));

                  setFilterValue({
                    ...filterValue,
                    fromDate: value ? dayjs(value).format("YYYY-MM-DD") : null,
                  });
                }}
                disabledDate={(current) =>
                  disabledFromDate(current, filterValue.toDate)
                }
                onClick={() => {
                  setFilterValue({
                    ...filterValue,
                    toDate: null,
                    fromDate: null,
                  });
                }}
              />
              <DatePicker
                placeholder="To"
                value={
                  filterValue.toDate
                    ? dayjs(filterValue.toDate, "YYYY-MM-DD")
                    : null
                }
                onClick={() => {
                  setFilterValue({
                    ...filterValue,
                    toDate: null,
                  });
                }}
                onChange={(value) => {
                  setFilterValue({
                    ...filterValue,
                    toDate: value ? dayjs(value).format("YYYY-MM-DD") : null,
                  });
                }}
                disabledDate={(current) =>
                  disabledToDate(current, filterValue.fromDate)
                }
              />
            </div>
          </div>
        </div>
        <div className={" bottomBtn"}>
          <ButtonComp
            text={"Apply"}
            maxWidth={"352px"}
            onClick={() => {
              if (filterValue.fromDate && !filterValue.toDate) {
                return messageApi.error("Please select the to date.");
              }

              if (!filterValue.fromDate && filterValue.toDate) {
                return messageApi.error("Please select the from date.");
              }

              store.dispatch(setFilter(filterValue));
              if (state?.currencyDetail) {
                navigate("/currencyDetails", {
                  state: {
                    ...filterValue,
                    coinId: state.currencyDetail.coin_id,
                    coin: state.currencyDetail,
                  },
                });
              } else {
                navigate("/history", {
                  state: {
                    ...filterValue,
                    coinId: filterValue.coinId.value,
                    path: state?.path ?? "/wallet",
                  },
                });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default FilterHistory;
