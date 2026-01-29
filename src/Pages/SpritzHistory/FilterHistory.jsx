import { Select } from "antd";
import React, { useEffect, useState } from "react";
import ButtonComp from "../../Components/ButtonComp/ButtonComp.jsx";
import "./FilterHistory.scss";
import { useSelector } from "react-redux";
import { store } from "../..";
import { useLocation, useNavigate } from "react-router-dom";
import { setFilter, setSpritzFilter } from "../../actions/filter";

function FilterHistorySpritz() {
  const { spritzBank, spritzFilter } = useSelector((state) => state);

  const [filterValue, setFilterValue] = useState(spritzBank[0].id);
  const navigate = useNavigate();
  const { state } = useLocation();
  useEffect(() => {
    // console.log("statestatestatestate ", state, spritzFilter);
    if (spritzFilter) {
      setFilterValue(spritzFilter);
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
            options={spritzBank.map((bank) => {
              return {
                value: bank.id,
                label: bank.name,
              };
            })}
          />
        </div>

        <div className={"filterHistoryNew__selctHis"}>
          <ButtonComp
            text={"Apply"}
            maxWidth={"100%"}
            onClick={() => {
              store.dispatch(setSpritzFilter(filterValue));
              navigate("/history-spritz", {
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

export default FilterHistorySpritz;
