import React, { useEffect, useState } from "react";
import ListingBank from "./ListingBank";
import backimg from "../../Assets/snapchat.svg";
import { message } from "antd";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { spritzHelper } from "../../helpers/spritz.helper";
import { useLocation, useNavigate } from "react-router-dom";

function BankAccountListing() {
  const [accounts, setAccounts] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const init = async () => {
    store.dispatch(setLoading(true));
    const accounts = await spritzHelper.getBankAccounts();
    if (!accounts) {
      return messageApi.error("Unable to fetch accounts at the moment.");
    }
    setAccounts(accounts);
    store.dispatch(setLoading(false));
  };

  const { state } = useLocation();

  // console.log("BBBBBBBBBBBBBBB ", state);
  useEffect(() => {
    init();
  }, []);

  return (
    <div style={{ marginTop: "24px" }}>
      {contextHolder}
      {accounts.map((el) => (
        <ListingBank
          imgage={el.institution ? el.institution.logo : backimg}
          ListingName={el.name}
          onCLick={() => {
            if (!state?.fromBillPay) {
              return navigate(`/enter-price-spritz`, {
                state: {
                  coin: state.coin,
                  account: el,
                  backAmount: state.amount,
                },
              });
            }
          }}
        />
      ))}
    </div>
  );
}

export default BankAccountListing;
