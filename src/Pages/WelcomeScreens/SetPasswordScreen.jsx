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
  const errors = {
    length: password.length < 8,
    uppercase: !/[A-Z]/.test(password),
    digit: !/[0-9]/.test(password),
    symbol: !/[!@#$%^&*]/.test(password),
  };

  return {
    valid: !Object.values(errors).some(Boolean),
    errors,
  };
}

function SetPasswordScreen() {
  const { state } = useLocation();
  const [isShare, setIsShare] = useState(false);
  const [isSupport, setIsSupport] = useState(false);
  const { type, createWalletMnemonics, createShuffledMnemonics } = state;
  const navigate = useNavigate();
  const { layoutHeader } = useOutletContext();
  const { create } = useSelector((state) => state);

  // setActiveTab("secretPhrase");
  const [activeTab, setActiveTab] = useState(
    state?.addNew ? "secretPhrase" : state?.addNewImport?"confirmSecretPhrase":
      create
        ? type === "create"
          ? "secretPhrase"
          : "confirmSecretPhrase"
        : "setPassword"
  );
  const [validation, setValidation] = useState(validatePassword(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mnemonics, setMnemonics] = useState(createWalletMnemonics || "");
  const [shuffledMnemonics, setShuffledMnemonics] = useState(
    createShuffledMnemonics || []
  );
  const [correct, setCorrect] = useState(false);
  const [terms, setTerms] = useState(false);
  const [getMnemonicsData, setGetMnemonicsData] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const validations = [
    { text: "8 or more characters", key: "length" },
    { text: "At least one upper case character", key: "uppercase" },
    { text: "At least one digit", key: "digit" },
    { text: "At least one symbol", key: "symbol" },
  ].map((item) => ({
    ...item,
    icon: validation.errors[item.key] ? BorderedRoundIcon : TickIcon,
  }));

  useEffect(() => {
    if (activeTab === "congrats") {
      chrome.storage.local.set({ legalPolicy: false });
    }
  }, [activeTab]);

  const handlePasswordChange = (value) => {
    if (value.length <= 25) {
      setPassword(value);
      setValidation(validatePassword(value));
    }
  };

  const popError = (error) => {
    messageApi.error(error);
  };

  const handleProceed = async () => {
    if (confirmPassword !== password) {
      return popError("Passwords do not match.");
    }
    if (!validation.valid) {
      return popError("Please meet all password criteria.");
    }

    await chrome.storage.session.set({ password: password.trim() });

    if (type === "create") {
      await WalletHelper.setPasswordInSession(password);
      if (state?.addNew) {
        // createWalletMnemonics, createShuffledMnemonics
        setMnemonics(createWalletMnemonics);
        setShuffledMnemonics(
          createWalletMnemonics.split(" ").sort(() => Math.random() - 0.5)
        );
      } else {
        const mnemonics = await WalletHelper.getMnemonics();
        setMnemonics(mnemonics);
        setShuffledMnemonics(
          mnemonics.split(" ").sort(() => Math.random() - 0.5)
        );
      }

      setActiveTab("secretPhrase");
    } else {
      setActiveTab("confirmSecretPhrase");
    }

    setPassword("");
    setConfirmPassword("");
    setValidation(validatePassword(""));
  };

  const handleConfirmSecretPhrase = async () => {
    try {
      if (correct) {
        store.dispatch(setLoading(true));
        const { name } = await chrome.storage.session.get("name");
        // console.log("=================> ", mnemonics);

        await WalletHelper.generateAndSetWallet(mnemonics, name);
        store.dispatch(setLoading(false));
        setActiveTab("congrats");
      } else {
        store.dispatch(setLoading(false));
        popError("Please check the phrase order and try again.");
      }
    } catch (error) {
      console.log("Create error--> ", error);
      store.dispatch(setLoading(false));
    }

  };

  const handleImportSecretPhrase = async () => {
    try {

      if (!terms) {
        return popError("Please accept the terms and conditions.");
      }

      const isValid = WalletHelper.checkMnemonics(getMnemonicsData.trim());
      const { accounts } = await chrome.storage.session.get("accounts"); 
      if (
        accounts &&
        (await WalletHelper.checkIfAlreadyThere(getMnemonicsData.trim()))
      ) {
        return popError("Mnemonics already exist.");
      }

      if (isValid) {
        const { name } = await chrome.storage.session.get("name");
        store.dispatch(setLoading(true));
        await WalletHelper.generateAndSetWallet(
          getMnemonicsData.trim(),
          name,
          "IMPORT"
        );
        messageApi.success("Wallet imported successfully.")
        setActiveTab("congrats");
      } else {
        store.dispatch(setLoading(false));
        popError("Invalid mnemonics. Please try again.");
      }
      store.dispatch(setLoading(false));
    } catch (e) { 
      store.dispatch(setLoading(false));
      popError(e ? e : "An error occurred. Please try again.");
    }
  };

  return (
    <div className="cardWhite setPassword">
      {contextHolder}
      {activeTab !== "congrats" && (
        <div className="setPassword__tabs">
          {!create && (
            <div
              className={`setPassword__tabs__itself ${activeTab === "setPassword" &&
                "setPassword__tabs__itself_active"
                }`}
            ></div>
          )}

          {type === "create" && (
            <div
              className={`setPassword__tabs__itself ${activeTab === "secretPhrase" &&
                "setPassword__tabs__itself_active"
                }`}
            ></div>
          )}

          <div
            className={`setPassword__tabs__itself ${activeTab === "confirmSecretPhrase" &&
              "setPassword__tabs__itself_active"
              }`}
          ></div>
        </div>
      )}

      <div className={activeTab === "congrats" ? "congrates-item" : ""}>{layoutHeader}</div>

      <h3 className="setPassword__heading">
        {type === "create" &&
          (activeTab === "setPassword"
            ? "Create Password"
            : activeTab === "secretPhrase"
              ? "Write Down Your Seed Phrase"
              : activeTab === "confirmSecretPhrase"
                ? "Enter Your Seed Phrase"
                : "")}
      </h3>
      <p
        className="welcomeScreens-text"
        style={{ marginTop: "10px", textAlign: "left" }}
      >
        {type === "create" &&
          (activeTab === "setPassword"
            ? ""
            : activeTab === "secretPhrase"
              ? "This is your seed phrase. Write it down on a paper and keep it in a safe place. You'll be asked to re-enter this phrase (in order) on the next step."
              : activeTab === "confirmSecretPhrase"
                ? "Tap the words to put them next to each other in the correct order."
                : "")}
      </p>

      {activeTab === "setPassword" && (!state?.addNew ||!state?.addNewImport)&& (
        <div style={{}}>
          <InputFieldSimple
            placeholder="Enter Password"
            getData={handlePasswordChange}
            value={password}
            label="Password"
          />
          <div className="setPassword__validations">
            {validations.map((item, index) => (
              <p key={index}>
                <img src={item.icon} alt="validation icon" />
                {item.text}
              </p>
            ))}
          </div>
          <InputFieldSimple
            placeholder="Confirm Password"
            getData={(e) => {
              if (e?.length <= 25) {
                setConfirmPassword(e)
              }
            }}
            value={confirmPassword}
            label="Confirm Password"
          />
          <div className="setPassword__footerbuttons">
            <ButtonComp
              onClick={handleProceed}
              text="Proceed"
              maxWidth="100%"
            />
          </div>
        </div>
      )}

      {activeTab === "secretPhrase" && (
        <SecretPhrase mnemonics={mnemonics} termsCheck={setTerms} isShare={isShare} setIsShare={setIsShare} isSupport={isSupport} setIsSupport={setIsSupport}>
          <div className="setPassword__footerbuttons">
            <ButtonComp
              disabled={!isShare || !isSupport}
              onClick={() => { if (isShare && isSupport) { setActiveTab("confirmSecretPhrase") } }}
              text="Continue"
              maxWidth="100%"
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
                onClick={handleConfirmSecretPhrase}
                text="Proceed"
                maxWidth="100%"
              />
            </div>
          </ConfirmSecretPhrase>
        ) : (
          <SecretPhrasePaste
            termsCheck={setTerms}
            getMnemonics={setGetMnemonicsData}
          >
            <div className="setPassword__footerbuttons">
              <ButtonComp
                onClick={handleImportSecretPhrase}
                text="Continue"
                maxWidth="100%"
              />
            </div>
          </SecretPhrasePaste>
        ))}
      <div>
        {activeTab === "congrats" && (
          <CongratulationsScreen>
            {/* <img src={WalletCreated} alt="WalletCreated " width={"308px"} /> */}
            {/* <h1>ALL DONE!</h1>
            <p>Wallet Created Successfully</p> */}
            <ButtonComp
              onClick={() => navigate("/wallet")}
              text="Open Wallet"
            />
          </CongratulationsScreen>
        )}
      </div>
    </div>
  );
}

export default SetPasswordScreen;
