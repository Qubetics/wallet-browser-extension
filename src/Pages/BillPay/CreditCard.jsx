import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { InputField } from "../../Components/InputField/InputFieldSimple";
import { spritzHelper } from "../../helpers/spritz.helper";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { message } from "antd";
import { DURATION } from "../../config/message.config";

function CreditCard() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  const { state } = useLocation();
  // console.log("🚀 ~ CreditCard ~ state:", state);
  const [cardNumber, setCardNumber] = useState(null);

  const handleCreditCard = async () => {
    try {
      if (!cardNumber) {
        return messageApi.error("Please enter a valid number.");
      }
      store.dispatch(setLoading(true));
      const result = await spritzHelper.addBill(
        state?.billName?.id,
        cardNumber,
        state?.billType
      );
      if (result) {
        messageApi.success("You've successfully linked your account!");
        setTimeout(() => {
          navigate("/withdraw");
        }, 2000);
      }
      store.dispatch(setLoading(false));

      // console.log("result::", result);
    } catch (error) {
      messageApi.error(error.message);
      store.dispatch(setLoading(false));
    }
  };

  // console.log("cardNumber::", cardNumber);
  // console.log("state cre:::", state);
  return (
    <>
      <MenuRestofHeaders backTo={"/withdraw"} title={state?.billName?.name} />
      {contextHolder}
      <div className={`flexedContent`}>
        <div className="billBankInput">
          <InputField
            label={
              state?.billName?.name.includes("Credit") ||
                state?.billName?.name.includes("credit")
                ? `Credit Card Number`
                : "Account Number"
            }
            placeholder={`Enter here`}
            getData={(value) => {
              if (value.toString().length <= 25) {
                setCardNumber(value);
              }
            }}
            type={'number'}
          />
          <ButtonComp
            onClick={() => handleCreditCard()}
            text={"Continue"}
            maxWidth={"100%"}
            marginTop={"20px"}
          />
        </div>
      </div>
    </>
  );
}

export default CreditCard;
