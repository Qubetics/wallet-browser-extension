import { Select } from "antd";
import React, { useEffect, useState } from "react";
import ButtonComp from "../../../Components/ButtonComp/ButtonComp.jsx";
import "./FilterHistory.scss";
import { useSelector } from "react-redux";
import { store } from "../../..";
import { useLocation, useNavigate } from "react-router-dom";
import { setBillPaySpritzFilter, setFilter, setSpritzFilter } from "../../../actions/filter";

function BillPayFilterHistorySpritz() {
  const { billList, billPayFilter } = useSelector((state) => state);

  const [filterValue, setFilterValue] = useState(billList[0]?.id);
  const navigate = useNavigate();
  const { state } = useLocation();
  useEffect(() => {
    // console.log("statestatestatestate ", state, billPayFilter);
    if (billPayFilter) {
      setFilterValue(billPayFilter);
    }
  }, []);

  return (
    <div>
      <div className="filterHistoryNew">
        <div className={"filterHistoryNew__selctHis"}>
          <label className="label">Select Account</label>
          <Select
            style={{
              width: 120,
              textAlign: "left",
            }}
            onChange={(value) => {
              setFilter(value);
              setFilterValue(value);
            }}
            // defaultValue={filterValue}
            value={filterValue}
            options={billList.map((bank) => {
              return {
                value: bank?.id,
                label: bank?.name,
              };
            })}
          />
        </div>

        <div className={"filterHistoryNew__selctHis"}>
          <ButtonComp
            text={"Apply"}
            maxWidth={"100%"}
            onClick={() => {
              store.dispatch(setBillPaySpritzFilter(filterValue));
              navigate("/billPay-history-spritz", {
                state: {
                  filterValue,
                },
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default BillPayFilterHistorySpritz;
