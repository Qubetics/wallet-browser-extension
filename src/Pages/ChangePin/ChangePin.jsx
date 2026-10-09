/*global chrome*/

import React, { useState } from "react";
import "./ChangePin.scss";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import InputFieldSimple, {
  InputField,
} from "../../Components/InputField/InputFieldSimple";
import TickIcon from "../../Assets/TickIcon.svg";
import BorderedRoundIcon from "../../Assets/BorderedRoundIcon.svg";
import { message } from "antd";
import { WalletHelper } from "../../helpers/wallet.helper";
import { useNavigate } from "react-router-dom";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";

function ChangePin() {
  const [oldPassword, setOldPassword] = useState(null);
  const [newPassword, setNewPassword] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState(null);

  const [validation, setValidation] = useState({
    valid: false,
    errors: { length: true, uppercase: true, lowercase: true, digit: true, symbol: true },
  });

  const navigate = useNavigate();

  function validatePassword(password) {
    let valid = true;
    const errors = {
      length: false,
      uppercase: false,
      lowercase: false,
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

    if (!/[a-z]/.test(password)) {
      valid = false;
      errors.lowercase = true;
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
      text: "At least one lower case character",
      icon: validation.errors.lowercase ? BorderedRoundIcon : TickIcon,
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

  const handlePasswordChange = (password) => {
    setNewPassword(password);
    setValidation(validatePassword(password));
  };

  const [messageApi, contextHolder] = message.useMessage();

  return (
    <div className={`scrollableCont `}>
      <MenuRestofHeaders backTo={"/securitySetting"} title={"Reset Password"} />
      <div className="flexedContent manageWalletHeight ">
        <div>
          {contextHolder}
          <p className="createPassword-text">
            Create a password with at least 8 characters, including one
            uppercase letter, one lowercase letter, one number, and one special
            character.
          </p>
          <div className="changePinSec ">
            <div className="inputPass">
              <InputFieldSimple
                mb0={true}
                checkForSymbols={true}
                inputSelect={true}
                placeholder="Old Password"
                label="Old Password"
                type={"text"}
                value={oldPassword}
                getData={(password) => {
                  const hasEmoji = /[\p{Extended_Pictographic}]/u.test(
                    password
                  );
                  if (password?.length <= 25 && !hasEmoji) {
                    setOldPassword(password);
                  }
                }}
              />
            </div>
            <div className="inputPass">
              <InputFieldSimple
                mb0={true}
                checkForSymbols={true}
                inputSelect={true}
                placeholder="New Password"
                label="New Password"
                type={"text"}
                value={newPassword}
                getData={(password) => {
                  const hasEmoji = /[\p{Extended_Pictographic}]/u.test(
                    password
                  );
                  if (password?.length <= 25 && !hasEmoji) {
                    handlePasswordChange(password);
                  }
                }}
              />
            </div>
            {/* <div className="setPassword__validations">
          {validations.map((ele, index) => (
            <p key={index}>
              <img src={ele.icon} />
              {ele.text}
            </p>
          ))}
        </div> */}
            <div className="inputPass">
              <InputFieldSimple
                mb0={true}
                checkForSymbols={true}
                inputSelect={true}
                placeholder="Confirm Password"
                label="Confirm Password"
                type={"text"}
                value={confirmPassword}
                getData={(password) => {
                  const hasEmoji = /[\p{Extended_Pictographic}]/u.test(
                    password
                  );
                  if (password?.length <= 25 && !hasEmoji) {
                    setConfirmPassword(password);
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div style={{ marginTop: "50px" }}>
          <ButtonComp
            text={"Update"}
            onClick={async () => {
              if (!oldPassword) {
                return messageApi.error("Password fields are required.");
              }
              if (!newPassword) {
                return messageApi.error("New password is required.");
              }
              if (confirmPassword !== newPassword) {
                return messageApi.error("The passwords do not match.");
              }
              if (!validation.valid) {
                return messageApi.error(
                  "Please ensure that all conditions for a strong password are met."
                );
              }

              if (oldPassword === newPassword) {
                return messageApi.error(
                  "New password should not be the same as the old one."
                );
              }

              const result = await WalletHelper.updatePassword(
                oldPassword,
                newPassword
              );

              if (!result) {
                return messageApi.error("Invalid old password.");
              }

              setOldPassword("");
              setNewPassword("");
              setConfirmPassword("");
              // global toast, so it stays visible after leaving this screen
              message.success("Password updated successfully.");
              setTimeout(() => {
                navigate("/securitySetting");
              }, 600);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ChangePin;
