/*global chrome */

import { message } from "antd";
import React, { useState } from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import InputFieldSimple from "../../Components/InputField/InputFieldSimple";
import { DURATION } from "../../config/message.config";
import { WalletHelper } from "../../helpers/wallet.helper";
import "./Password.scss";
import useCurrentHeight from "../../CustomHooks/useCurrentHeight";

function VerifyPassword() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  const [password, setPassword] = useState(null);

  const { state } = useLocation();

  const { auth } = useSelector((state) => state);

  useEffect(() => {
    if (!state) {
      if (auth) {
        navigate("/wallet");
      }
    }
  }, []);

  const handleLogin = async () => {
    if (!password) {
      return messageApi.error("Please enter a valid password to proceed.");
    }
    store.dispatch(setLoading(true));
    const response = await WalletHelper.unlockWallet(password);
    if (!response) {
      store.dispatch(setLoading(false));
      return messageApi.error("Invalid password. Please try again.");
    }
    // await chrome.storage.session.set({
    //   password,
    // });
    store.dispatch(setLoading(false));
    navigate("/wallet",{ state : { password }});
  };
  const height = useCurrentHeight();

  return (
    <div
      className={`${"cardWhite"} ${height <= 600 ? "cardWhiteOuterExt" : ""}`}
    >
      {contextHolder}
      <h2 className="cardWhite__title">Verify</h2>
      <p className="cardWhite__subTitle" style={{ marginBottom: 24 }}>
        Please enter your password to verify your identity.
      </p>
      <div className="cardWhite__linkOuter">
        <InputFieldSimple
          placeholder={"Password"}
          label="Enter Password"
          placeholderBaseColor={true}
          coloredBg={true}
          value={password}
          customFunction={handleLogin}
          getData={(password) => {
            const hasEmoji = /[\p{Extended_Pictographic}]/u.test(password);
            console.log("-----------------> ", hasEmoji);
            if (!hasEmoji) {
              setPassword(password);
            }
          }}
        />
      </div>
      <div className="setPassword__footerbuttons">
        <ButtonComp
          onClick={async () => {
            handleLogin();
          }}
          text={"Unlock"}
        />
      </div>
      {/* <div>
        <Link className="forgotPassword" to='/forgot-password'>
          Forgot Password?
        </Link>
      </div> */}
    </div>
  );
}

export default VerifyPassword;
