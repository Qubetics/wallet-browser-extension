import {
  BankAccountSubType,
  BankAccountType,
} from "@spritz-finance/api-client";
import { message, Select } from "antd";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { store } from "../..";
import { setCreate } from "../../actions/create";
import { setLoading } from "../../actions/loading";
import { updateSpritzAccounts } from "../../actions/spritz";

import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { InputField } from "../../Components/InputField/InputFieldSimple";
import { spritzHelper } from "../../helpers/spritz.helper";
import "./BankAccount.scss";

function EditBankAccount() {
  const { state } = useLocation();

  const [accountName, setAccountName] = useState(state.account.name);

  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();

  // useEffect(() => {
  //   console.log("ACCCCC ", state, state?.account);
  // }, [state]);

  const handleCreateAccount = async () => {
    // Check if any of the required fields are empty
    if (!accountName) {
      // You can display an error message or take appropriate action here
      messageApi.error("Please fill in all required fields.");
      return; // Stop execution if any field is empty
    }

    // Check if account number and confirm account number match

    store.dispatch(setLoading(true));

    const response = await spritzHelper.renameBankAccount(
      state.account.id,
      accountName
    );

    if (response && response.error) {
      store.dispatch(setLoading(false));
      return messageApi.error(
        response.message || "Unable to create an account at the moment."
      );
    }

    store.dispatch(setLoading(false));
    store.dispatch(updateSpritzAccounts(true));
    navigate("/withdraw");
  };

  return (
    <div
      style={{
        marginTop: "28px",
        paddingBottom: "30px",
      }}
    >
      {contextHolder}
      <div className="backAccount">
        <div className="cardWhite__linkOuter">
          <InputField
            placeholder={"Enter Here"}
            label={state?.account?.ownedByUser ? "Holder Name" : "Account Name"}
            placeholderBaseColor={true}
            coloredBg={true}
            value={accountName}
            getData={(value) => {
              const alphanumericRegex = /^[a-zA-Z ]*$/; // Allow spaces in the input
              if (alphanumericRegex.test(value) && value.length < 20) {
                setAccountName(value);
              }
            }}
          />
        </div>

        <ButtonComp
          text={"Submit"}
          maxWidth={"100%"}
          marginTop={"20px"}
          onClick={() => {
            handleCreateAccount();
          }}
        />
      </div>
    </div>
  );
}

export default EditBankAccount;
