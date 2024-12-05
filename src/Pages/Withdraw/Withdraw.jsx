import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import WithdrawCard from "./WithdrawCard";
import backimg from "../../Assets/snapchat.svg";
import darkHistoryList from "../../Assets/settings/DarkTransaction.svg";
import { store } from "../..";
import { setCreate } from "../../actions/create";
import { Link, useNavigate } from "react-router-dom";
import { spritzHelper } from "../../helpers/spritz.helper";
import { setLoading } from "../../actions/loading";
import { message } from "antd";
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";

import HistoryList from "../../Assets/his.svg";
import { useSelector } from "react-redux";
import {
  spritzAccounts,
  spritzActionTab,
  updateSpritzAccounts,
} from "../../actions/spritz";
import BillPay from "../BillPay/BillPay";

function Withdraw() {
  const [accounts, setAccounts] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [sel, setSel] = useState(0);
  const { theme, spritzTab } = useSelector((state) => state);

  useEffect(() => {
    setSel(spritzTab == "withdraw" ? 1 : 0);
  }, [spritzTab]);

  const init = async () => {
    store.dispatch(updateSpritzAccounts(false));
    store.dispatch(setLoading(true));
    const accounts = await spritzHelper.getBankAccounts();
    if (!accounts) {
      return messageApi.error("Unable to fetch accounts at the moment.");
    }
    setAccounts(accounts);
    store.dispatch(spritzAccounts(accounts));
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
  }, []);

  const navigate = useNavigate();
  return (
    <Tabs
      className="withdrawTabs"
      selectedIndex={spritzTab == "withdraw" ? 1 : 0}
    >
      <div className="tabList">
        <TabList
          className="payTabs"
          style={{
            border: "none",
            borderRadius: "30px",
            display: "flex",
            justifyContent: "space-evenly",
            listStyle: "none",
          }}
        >
          <Tab
            className="swapTab"
            onClick={() => {
              store.dispatch(spritzActionTab("billpay"));
              setSel(0);
            }}
            style={{
              backgroundColor: sel === 0 ? "#4096ff" : "transparent",
              borderRadius: "30px",
              padding: "16px 30px",
              fontSize: "13px",
              flex: 1,
              borderColor: "#4096ff",
              fontWeight: "700",
            }}
          >
            Bill Pay
          </Tab>
          <Tab
            className="swapTab"
            onClick={() => {
              store.dispatch(spritzActionTab("withdraw"));
              setSel(1);
            }}
            style={{
              backgroundColor: sel === 1 ? "#4096ff" : "transparent",
              borderRadius: "30px",
              padding: "16px 30px",
              fontSize: "13px",
              flex: 1,
              borderColor: "#4096ff",
              fontWeight: "700",
            }}
          >
            Withdraw
          </Tab>
        </TabList>
      </div>
      <TabPanel>
        <BillPay />
      </TabPanel>

      <TabPanel>
        <div
          style={{
            marginLeft: "28px",
            marginRight: "28px",
            paddingBottom: "30px",
          }}
        >
          {contextHolder}
          {accounts.length === 0 ? (
            <p
              className="noAddress"
              style={{
                marginTop: "50%",
                fontWeight: "bold",
                fontSize: "17px",
              }}
            >
              No accounts found
            </p>
          ) : (
            <>
              <div className="withdrawHeading">
                <h3></h3>
                <div
                  style={{
                    display: "flex",
                    cursor: "pointer",
                    alignItems: "center",
                    marginTop: "15px"
                  }}
                  onClick={() => {
                    store.dispatch(setCreate(true));
                    navigate("/history-spritz");
                  }}
                >
                  <img
                    src={theme == "darkTheme" ? darkHistoryList : HistoryList}
                    alt=""
                    style={{ marginRight: "2px" }}
                  />
                  <h4>History</h4>
                </div>
              </div>
              {accounts.map((account) => {
                return (
                  <WithdrawCard
                    imgage={
                      account.institution ? account.institution.logo : backimg
                    }
                    BankName={
                      account.institution
                        ? account.institution.name
                        : "Dummy Account"
                    }
                    BankClient={account.name}
                    Accountnumber={account.accountNumber}
                    Routingnumber={account.bankAccountDetails.routingNumber}
                    account={account}
                    init={init}
                    holderName={account.holder}
                  />
                );
              })}
            </>
          )}
        </div>
      </TabPanel>
    </Tabs>
  );
}

export default Withdraw;
