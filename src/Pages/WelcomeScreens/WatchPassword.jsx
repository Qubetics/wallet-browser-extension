/* global chrome*/
import React from "react";
import "./Welcome.scss";
import InputFieldSimple, {
  InputField,
  InputFieldOnly,
} from "../../Components/InputField/InputFieldSimple";
import ScannerImg from "../../Assets/scanner.svg";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TickIcon from "../../Assets/TickIcon.svg";
import BorderedRoundIcon from "../../Assets/BorderedRoundIcon.svg";
import { message } from "antd";
import { DURATION } from "../../config/message.config";

function validatePassword(password) {
  let valid = true;
  const errors = {
    length: false,
    uppercase: false,
    digit: false,
    symbol: false,
  };

  if (password.length < 8) {
    valid = false;
    errors.length = true;
  }

  if (!/[A-Z]/.test(password)) {
    valid = false;
    errors.uppercase = true;
  }

  if (!/[0-9]/.test(password)) {
    valid = false;
    errors.digit = true;
  }

  if (!/[!@#$%^&*]/.test(password)) {
    valid = false;
    errors.symbol = true;
  }

  return { valid, errors };
}

function WatchPassword() {
  const {
    state: { chainId },
  } = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [validation, setValidation] = useState({
    valid: false,
    errors: { length: true, uppercase: true, digit: true, symbol: true },
  });

  const handlePasswordChange = (password) => {
    setPassword(password);
    setValidation(validatePassword(password));
  };

  const validations = [
    {
      text: "8 or more characters",
      icon: validation.errors.length ? BorderedRoundIcon : TickIcon,
    },
    {
      text: "At least one upper case character",
      icon: validation.errors.uppercase ? BorderedRoundIcon : TickIcon,
    },
    {
      text: "At least one digit",
      icon: validation.errors.digit ? BorderedRoundIcon : TickIcon,
    },
    {
      text: "At least one symbol",
      icon: validation.errors.symbol ? BorderedRoundIcon : TickIcon,
    },
  ];

  return (
    <div>
      <div className="cardWhite">
        {contextHolder}
        <h2 className="cardWhite__title">Set a Password</h2>
        <p
          className="cardWhite__subTitle"
          style={{ margin: "0 auto 24px", maxWidth: 325 }}
        ></p>
        <div className="cardWhite__linkOuter">
          <div className="token">
            <div className="token__fields">
              <InputFieldSimple
                placeholder={"Password"}
                getData={handlePasswordChange}
                value={password}
              />
              <div className="setPassword__validations">
                {validations.map((ele, index) => (
                  <p key={index}>
                    <img src={ele.icon} />
                    {ele.text}
                  </p>
                ))}
              </div>
              <InputFieldSimple
                placeholder={"Confirm Password"}
                getData={setConfirmPassword}
                value={confirmPassword}
              />
              <div className="setPassword__footerbuttons">
                <ButtonComp
                  onClick={() => navigate("/watch-list")}
                  text={"Back"}
                  bordered={true}
                />
                <ButtonComp
                  onClick={async () => {
                    if (!password) {
                      return messageApi.error("Password fields are required.");
                    }

                    if (confirmPassword !== password) {
                      return messageApi.error("The passwords do not match.");
                    }

                    if (!validation.valid) {
                      return messageApi.error(
                        "Please ensure that all conditions for a strong password are met."
                      );
                    }

                    if (password) {
                      await chrome.storage.session.set({
                        password: password.trim(),
                      });

                      navigate("/address", {
                        state: {
                          chainId,
                        },
                      });
                    } else {
                      return messageApi.error("All fields are required.");
                    }
                  }}
                  // onClick={() => setActiveTab("/")}
                  text={"Proceed"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WatchPassword;
