/*global chrome*/
import React, { useState } from "react";
import InputFieldSimple from "../../Components/InputField/InputFieldSimple";
import "./Welcome.scss";
import TickIcon from "../../Assets/TickIcon.svg";
import BorderedRoundIcon from "../../Assets/BorderedRoundIcon.svg";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { useLocation, useNavigate } from "react-router-dom";
import SecretPhrase from "./SecretPhrase";
import ConfirmSecretPhrase from "./ConfirmSecretPhrase";
import CongratulationsScreen from "./CongratulationsScreen";
import { message } from "antd";
import { WalletHelper } from "../../helpers/wallet.helper";
import SecretPhrasePaste from "./SecretPhrasePaste";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
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

function ForgotPassword() {
  const type = "import";

  const [validation, setValidation] = useState({
    valid: false,
    errors: { length: true, uppercase: true, digit: true, symbol: true },
  });

  const handlePasswordChange = (password) => {
    setPassword(password);
    setValidation(validatePassword(password));
  };

  const [iconState, setIconState] = useState(false);
  const [activeTab, setActiveTab] = useState("setPassword");
  const [getMnemonicsData, setGetMnemonicsData] = useState(null);
  const [correct, setCorrect] = useState(false);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState(null);
  const [mnemonics, setMnemonics] = useState(null);
  const [shuffledMnemonics, setShuffledMnemonics] = useState([]);
  const [shuffled, setShuffled] = useState(false);
  const [selectMnemonics, setSelectedMnemonics] = useState([]);
  const [terms, setTerms] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const navigate = useNavigate();

  function popError(error) {
    setError(error);
    messageApi.error(error);
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
      text: "At least one digit",
      icon: validation.errors.digit ? BorderedRoundIcon : TickIcon,
    },
    {
      text: "At least one symbol",
      icon: validation.errors.symbol ? BorderedRoundIcon : TickIcon,
    },
  ];
  return (
    <div className="cardWhite setPassword">
      {contextHolder}
      {activeTab !== "congrats" && (
        <div className="setPassword__tabs">
          <div
            className={`${"setPassword__tabs__itself"} ${
              type === "import" ? "setPassword__tabs__increase" : ""
            } ${
              activeTab === "setPassword" && "setPassword__tabs__itself_active"
            }`}
          ></div>
          {type === "create" ? (
            <div
              className={`${"setPassword__tabs__itself"} ${
                activeTab === "secretPhrase" &&
                "setPassword__tabs__itself_active"
              }`}
            ></div>
          ) : null}

          <div
            className={`${"setPassword__tabs__itself"}  ${
              type === "import" ? "setPassword__tabs__increase" : ""
            } ${
              activeTab === "confirmSecretPhrase" &&
              "setPassword__tabs__itself_active"
            }`}
          ></div>
        </div>
      )}
      <h2 className="setPassword__title">
        {" "}
        {/* {type === "create"
          ? activeTab === "setPassword"
            ? "Set a Password"
            : activeTab === "secretPhrase"
              ? "Save Secret Phrase"
              : activeTab === "confirmSecretPhrase"
                ? "Confirm Your Secret Phrase"
                : "Congratulations!"
          : activeTab === "setPassword"
            ? "New Password"
            : activeTab === "confirmSecretPhrase"
              ? "Please enter the secret phrase used to create this wallet."
              : "Congratulations!"} */}
        asdfghjkl
      </h2>
      {activeTab === "setPassword" && (
        <>
          <InputFieldSimple
            placeholder={"Password"}
            getData={handlePasswordChange}
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
          />
          <div className="setPassword__footerbuttons">
            {/* <ButtonComp
              onClick={() => navigate("/")}
              text={"Back"}
              bordered={true}
            /> */}
            <ButtonComp
              onClick={async () => {
                if (!password) {
                  return popError("Password fields are required.");
                }

                if (confirmPassword !== password) {
                  return popError("The passwords do not match.");
                }

                if (!validation.valid) {
                  return popError(
                    "Please ensure that all conditions for a strong password are met."
                  );
                }

                if (password) {
                 
                  if (type === "create") {
                    const mnemonics = await WalletHelper.getMnemonicsByPassword('',password);
                    setMnemonics(mnemonics);
                    setShuffledMnemonics(
                      mnemonics.split(" ").sort(() => Math.random() - 0.5)
                    );
                    setValidation({
                      valid: false,
                      errors: {
                        length: true,
                        uppercase: true,
                        digit: true,
                        symbol: true,
                      },
                    });
                    setActiveTab("secretPhrase");
                  } else {
                    setValidation({
                      valid: false,
                      errors: {
                        length: true,
                        uppercase: true,
                        digit: true,
                        symbol: true,
                      },
                    });
                    setActiveTab("confirmSecretPhrase");
                  }
                }
              }}
              text={"Continue"}
              maxWidth={"100%"}
            />
          </div>
        </>
      )}
      {activeTab === "secretPhrase" && (
        <SecretPhrase mnemonics={mnemonics} termsCheck={setTerms}>
          <div className="setPassword__footerbuttons">
            {/* <ButtonComp
              onClick={() => setActiveTab("setPassword")}
              text={"Back"}
              bordered={true}
            /> */}
            <ButtonComp
              onClick={() => {
                if (!terms) {
                  return popError(
                    "Please accept the terms and conditions below."
                  );
                }
                setActiveTab("confirmSecretPhrase");
              }}
              text={"Continue"}
              maxWidth={"100%"}
            />
          </div>
        </SecretPhrase>
      )}
      {activeTab === "confirmSecretPhrase" &&
        (type === "create" ? (
          <ConfirmSecretPhrase
            mnemonics={mnemonics}
            shuffledMnemonics={shuffledMnemonics}
            checkIfCorrect={setCorrect}
          >
            <div className="setPassword__footerbuttons">
              {/* <ButtonComp
                onClick={() => setActiveTab("secretPhrase")}
                text={"Back"}
                bordered={true}
              /> */}
              <ButtonComp
                onClick={async () => {
                  if (correct) {
                    const { name } = await chrome.storage.session.get("name");

                    await WalletHelper.generateAndSetWallet(mnemonics, name);
                    setActiveTab("congrats");
                  } else {
                    popError(
                      "Please check the order of the phrase and try again."
                    );
                  }
                }}
                text={"Continue"}
                maxWidth={"100%"}
              />
            </div>
          </ConfirmSecretPhrase>
        ) : (
          <SecretPhrasePaste
            termsCheck={setTerms}
            getMnemonics={setGetMnemonicsData}
            type={
              "We don't store your password, so you will need to reset your wallet password using your Secret Phrase. If you enter a different Secret Phrase, your current wallet will be replaced."
            }
          >
            <div className="setPassword__footerbuttons">
              <ButtonComp
                onClick={async () => {
                  if (!terms) {
                    return popError(
                      "Please accept the terms and conditions below."
                    );
                  }
                  store.dispatch(setLoading(true));
                  const valid = WalletHelper.checkMnemonics(getMnemonicsData);
                  if (valid) {
                    await chrome.storage.local.remove([
                      "accounts",
                      "mnemonics",
                      "registered",
                      "alerts",
                    ]);
                    await chrome.storage.session.remove(["accounts"]);

                    const response = await WalletHelper.generateAndSetWallet(
                      getMnemonicsData,
                      "Account 1"
                    );
                    if (!response) {
                      store.dispatch(setLoading(false));
                      return popError(
                        "Invalid mnemonics. Please check and try again"
                      );
                    }
                    store.dispatch(setLoading(false));
                    setActiveTab("congrats");
                  } else {
                    store.dispatch(setLoading(false));
                    return popError(
                      "Invalid mnemonics. Please check and try again"
                    );
                  }
                }}
                text={"Continue"}
                maxWidth={"100%"}
              />
            </div>
          </SecretPhrasePaste>
        ))}
      {activeTab === "congrats" && (
        <CongratulationsScreen>
          <ButtonComp
            onClick={() => navigate("/wallet")}
            text={"Open Wallet"}
          />
        </CongratulationsScreen>
      )}
    </div>
  );
}

export default ForgotPassword;
