/*global chrome*/
import React, { useEffect, useState } from "react";
import InputFieldSimple from "../../Components/InputField/InputFieldSimple";
import "./Welcome.scss";
import TickIcon from "../../Assets/TickIcon.svg";
import BorderedRoundIcon from "../../Assets/BorderedRoundIcon.svg";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import SecretPhrase from "./SecretPhrase";
import ConfirmSecretPhrase from "./ConfirmSecretPhrase";
import CongratulationsScreen from "./CongratulationsScreen";
import { message } from "antd";
import { WalletHelper } from "../../helpers/wallet.helper";
import SecretPhrasePaste from "./SecretPhrasePaste";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { DURATION } from "../../config/message.config";
import { useSelector } from "react-redux";

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

function SetPasswordScreen() {
  const { state } = useLocation();
  const { type, createWalletMnemonics, createShuffledMnemonics } = state;

  const [validation, setValidation] = useState({
    valid: false,
    errors: { length: true, uppercase: true, digit: true, symbol: true },
  });

  const { create } = useSelector((state) => state);

  const handlePasswordChange = (password) => {
    setPassword(password);
    setValidation(validatePassword(password));
  };

  const [iconState, setIconState] = useState(false);
  const [activeTab, setActiveTab] = useState(
    !create
      ? "setPassword"
      : type === "create"
      ? "secretPhrase"
      : "confirmSecretPhrase"
  );
  const [getMnemonicsData, setGetMnemonicsData] = useState(null);
  const [correct, setCorrect] = useState(false);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState(null);
  const [mnemonics, setMnemonics] = useState(createWalletMnemonics || null);
  const [shuffledMnemonics, setShuffledMnemonics] = useState(
    createShuffledMnemonics || []
  );
  const { layoutHeader } = useOutletContext();
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

  const removeLegalPolicyBanner = async () => {
    await chrome.storage.local.set({
      legalPolicy: false,
    });
  };
  useEffect(() => {
    if (activeTab === "congrats") {
      removeLegalPolicyBanner();
    }
  }, [activeTab]);

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

  // console.log(
  //   type,
  //   create,
  //   '========================================================================='
  // );

  return (
    <div className={`cardWhite setPassword`}>
      {contextHolder}
      {activeTab !== "congrats" && (
        <div className="setPassword__tabs">
          {create ? null : (
            <div
              className={`${"setPassword__tabs__itself"} ${
                type === "import" ? "setPassword__tabs__increase" : ""
              } ${
                activeTab === "setPassword" &&
                "setPassword__tabs__itself_active"
              }`}
            ></div>
          )}

          {type === "create" ? (
            <div
              className={`${"setPassword__tabs__itself"} ${
                create ? "setPassword__tabs__increase" : ""
              } ${
                activeTab === "secretPhrase" &&
                "setPassword__tabs__itself_active"
              }`}
            ></div>
          ) : null}

          <div
            className={`${"setPassword__tabs__itself"}  ${
              type === "import"
                ? create
                  ? "setPassword__tabs__full"
                  : "setPassword__tabs__increase"
                : ""
            }  ${
              type === "create"
                ? create
                  ? "setPassword__tabs__increase"
                  : ""
                : ""
            } ${
              activeTab === "confirmSecretPhrase" &&
              "setPassword__tabs__itself_active"
            }`}
          ></div>
        </div>
      )}
      {/* <h2 className="setPassword__title">
        {" "}
        {type === "create"
          ? activeTab === "setPassword"
            ? "Set a Password"
            : activeTab === "secretPhrase"
            ? "Save Secret Phrase"
            : activeTab === "confirmSecretPhrase"
            ? "Confirm Your Secret Phrase"
            : "Congratulations!"
          : activeTab === "setPassword"
          ? "Set a Password"
          : activeTab === "confirmSecretPhrase"
          ? "Enter Secret Phrase"
          : "Congratulations!"}
      </h2> */}

      {layoutHeader}
      {activeTab === "setPassword" && (
        <div>
          <InputFieldSimple
            placeholder={"Enter Password"}
            getData={handlePasswordChange}
            value={password}
            label="Password"
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
            placeholder={"Enter Confirm Password"}
            getData={setConfirmPassword}
            value={confirmPassword}
            label="Confirm Password"
          />
          <div className="setPassword__footerbuttons">
            {/* <ButtonComp
              onClick={() => navigate("/")}
              text={"Back"}
              bordered={true}
            /> */}
            <ButtonComp
              onClick={async () => {
                if (confirmPassword !== password) {
                  return popError("Passwords do not match.");
                }
                if (!validation.valid) {
                  return popError(
                    "Please make sure that all the conditions for a strong password are met."
                  );
                }
                if (password) {
                  await chrome.storage.session.set({
                    password: password.trim(),
                  });
                  if (type === "create") {
                    await WalletHelper.setPasswordInSession(password);
                    const mnemonics = await WalletHelper.getMnemonics();
                    setMnemonics(mnemonics);
                    setShuffledMnemonics(
                      mnemonics.split(" ").sort(() => Math.random() - 0.5)
                    );
                    setPassword(null);
                    setConfirmPassword(null);
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
                    setPassword(null);
                    setConfirmPassword(null);
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
              text={"Proceed"}
              maxWidth={"100%"}
            />
          </div>
        </div>
      )}
      {activeTab === "secretPhrase" && (
        <SecretPhrase mnemonics={mnemonics} termsCheck={setTerms}>
          <div className="setPassword__footerbuttons">
            {/* <ButtonComp
              onClick={() =>
                create
                  ? navigate("/createNewWallet", {
                      state,
                    })
                  : setActiveTab("setPassword")
              }
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
                setTerms(false);
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
              <ButtonComp
                onClick={() => setActiveTab("secretPhrase")}
                text={"Back"}
                bordered={true}
              />
              <ButtonComp
                onClick={async () => {
                  if (correct) {
                    store.dispatch(setLoading(true));
                    const { name } = await chrome.storage.session.get("name");
                    await WalletHelper.generateAndSetWallet(mnemonics, name);
                    store.dispatch(setLoading(false));
                    setActiveTab("congrats");
                  } else {
                    store.dispatch(setLoading(false));
                    popError(
                      "Please check the order of the phrase and try again."
                    );
                  }
                }}
                text={"Proceed"}
              />
            </div>
          </ConfirmSecretPhrase>
        ) : (
          <SecretPhrasePaste
            termsCheck={setTerms}
            getMnemonics={setGetMnemonicsData}
          >
            <div className="setPassword__footerbuttons">
              {/* <ButtonComp
                onClick={() => {
                  setGetMnemonicsData(null);
                  create
                    ? navigate("/createNewWallet", {
                        state,
                      })
                    : setActiveTab("setPassword");
                }}
                text={"Back"}
                bordered={true}
              /> */}
              <ButtonComp
                onClick={async () => {
                  try {
                    if (!terms) {
                      return popError(
                        "Please accept the terms and conditions below."
                      );
                    }
                    store.dispatch(setLoading(true));

                    const valid = WalletHelper.checkMnemonics(
                      getMnemonicsData.trim()
                    );

                    const { accounts } = await chrome.storage.session.get(
                      "accounts"
                    );

                    if (accounts) {
                      const result = await WalletHelper.checkIfAlreadyThere(
                        getMnemonicsData.trim()
                      );

                      if (result) {
                        store.dispatch(setLoading(false));
                        return messageApi.error("Mnemonics already exists.");
                      }
                    }

                    if (valid) {
                      const { name } = await chrome.storage.session.get("name");
                      await WalletHelper.generateAndSetWallet(
                        getMnemonicsData.trim(),
                        name,
                        "IMPORT"
                      );
                      store.dispatch(setLoading(false));
                      setActiveTab("congrats");
                    } else {
                      store.dispatch(setLoading(false));
                      return popError(
                        "Invalid mnemonics. Please check and try again"
                      );
                    }
                  } catch (error) {
                    store.dispatch(setLoading(false));
                    console.log(error);
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
            onClick={async () => {
              navigate("/wallet");
            }}
            text={"Open Wallet"}
          />
        </CongratulationsScreen>
      )}
    </div>
  );
}

export default SetPasswordScreen;
