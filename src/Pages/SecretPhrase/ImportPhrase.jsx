/* global chrome*/
import React, { useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders.jsx";
import {
  InputField,
} from "../../Components/InputField/InputFieldSimple";
import style from "./style.module.scss";
import ButtonComp from "../../Components/ButtonComp/ButtonComp.jsx";
import { Checkbox, message } from "antd";
import { store } from "../../index.js";
import { setLoading } from "../../actions/loading.js";
import { WalletHelper } from "../../helpers/wallet.helper.js";
import { useLocation, useNavigate } from "react-router-dom";
import { DURATION } from "../../config/message.config.js";
function ImportPhrase() {
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const {state} = useLocation();
  const navigate = useNavigate();
  const [mnemonics, setMnemonics] = useState(null);
  const [terms, setTerms] = useState(false);

  const onChange = (e) => {
    setTerms(e.target.checked);
  };


  // console.log('PASSWORD IN INPORT PHRASE :',state.password)

  return (
    <div 
    >
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={"/new-name"}
          title={"Enter Secret Phrase"}
          mnemonics={null}
        />
        <div className={`flexedContent`}>
          <div className={style.input_text}>
            <p>Paste or type your secret Phrase.</p>

            <InputField
              placeholder={"Enter Your Secret Phrase Here"}
              width="353px"
              value={mnemonics}
              getData={(phrase) => {
                setMnemonics(phrase);
              }}
              checkForSymbols={true}
              addonAfter={
                <div className={style.token__selectStyle}>
                  <span
                    className={style.token__pasteText}
                    onClick={async () => {
                      const data = await navigator.clipboard.readText();
                      setMnemonics(data);
                    }}
                  >
                    Paste
                  </span>
                </div>
              }
            />
            <div className={"checkboxOuter checkboxMain"}>
              <Checkbox onChange={onChange} style={{}}>
                <p style={{ marginLeft: "10px", textAlign: "left" }}>
                I understand that the risk of losing my funds by
                exposing my Secret Phrase to others.
                </p>
              </Checkbox>
            </div>
            <ButtonComp
              text={"Proceed"}
              onClick={async (e) => { 
                if (!mnemonics) {
                  return messageApi.error("Please enter Secret Phrase.");
                }

                if (!terms) {
                  return messageApi.error(
                    "Please accept the privacy policy."
                  );
                }

                store.dispatch(setLoading(true));

                const checkIfThere = await WalletHelper.isAccountExistWithMnemonics(
                  mnemonics,
                  state.password
                );

                if (checkIfThere) {
                  store.dispatch(setLoading(false));
                  return messageApi.error(
                    "Mnemonics already exist. Please try with a different mnemonic."
                  );
                }
                const { name } = await chrome.storage.session.get("name");

                const response = await WalletHelper.generateAndSetWallet(
                  mnemonics,
                  name
                );

                if (!response) {
                  store.dispatch(setLoading(false));
                  return messageApi.error(
                    "Invalid mnemonics provided. Please check and try again."
                  );
                }

                store.dispatch(setLoading(false));
                navigate("/wallet");
              }}
              maxWidth={"100%"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportPhrase;
