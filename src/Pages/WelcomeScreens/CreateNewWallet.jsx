/* global chrome */
import { message } from "antd";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { InputFieldOnly } from "../../Components/InputField/InputFieldSimple";
import { DURATION } from "../../config/message.config";
import "./Welcome.scss";
import { useOutletContext } from "react-router-dom";
import { WalletHelper } from "../../helpers/wallet.helper";

function CreateNewWallet() {
  const { state } = useLocation();
  const { type: stateType, createWalletMnemonics, createShuffledMnemonics } = state || {};
  const [type, setType] = useState(stateType);
  const { create } = useSelector((state) => state);

  useEffect(() => {
    const getFlowType = async () => {
      const { walletFlowType } = await chrome.storage.session.get("walletFlowType");
      if (walletFlowType && !stateType) {
        setType(walletFlowType);
      }
    };
    getFlowType();
  }, [stateType]);

  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [name, setName] = useState(null);
  const [remaining, setRemaining] = useState(25);
  const { layoutHeader } = useOutletContext();

  return (
    <div className="cardWhite termsPolicy">
      <div>
        {contextHolder}
        <div className="cardWhite__linkOuter">
          {layoutHeader}
          <div style={{ marginTop: "16px" }}>
            <InputFieldOnly
              placeholder={"Enter Wallet Name here"}
              value={name}
              label={"Enter Wallet Name"}
              checkForSymbols={true}
              placeholderBaseColor={true}
              coloredBg={true}
              getData={(name) => {
                const hasEmoji = /[\p{Extended_Pictographic}]/u.test(name);
                if (hasEmoji) { return false }
                if (name.length <= 25) {
                  if (/^\s/.test(name)) {
                    setName("");
                  } else {
                    setName(name);
                  }
                } else {
                  return;
                }
              }}
            />
          </div>
          <div className="textInfoBaseColor">
            Max Limit: {name ? name.length : 0}/25
          </div>
        </div>
      </div>
      <div className="setPassword__footerbuttons">
        {/* <ButtonComp
          onClick={() => {
            navigate(create ? "/wallet" : "/");
          }}
          text={"Back"}
          bordered={true}
        /> */}
        <ButtonComp
          onClick={async () => {
            if (!name) {
              return messageApi.error(
                "Please enter a valid name for the wallet."
              );
            }

            if (name.trim().length === 0) {
              return messageApi.error(
                "Name should have at least 3 characters, not counting spaces."
              );
            }

            if (name.replace(/\s/g, "").length < 3) {
              return messageApi.error(
                "Name should have at least 3 characters, not counting spaces."
              );
            }

            if (name.length > 25) {
              return messageApi.error(
                "Name should not have more than 25 characters."
              );
            }

            const nameRegex = /^[A-Za-z0-9 _-]+$/;
            if (!nameRegex.test(name)) {
              return messageApi.error(
                "Name can contain only letters, numbers, spaces, - and _."
              );
            }

            const { accounts } = await chrome.storage.session.get("accounts");

            if (accounts) {
              const checkIfExists = accounts.find(
                (el) => el.name.toLowerCase() === name.trim().toLowerCase()
              );

              if (checkIfExists) {
                return messageApi.error(
                  "This wallet name already exists. Use a different name."
                );
              }
            }

            // const format = /[!@#$%^`&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

            // if (format.test(name)) {
            //   return messageApi.error(
            //     "Name should not contain any special characters."
            //   );
            // }

            await chrome.storage.session.set({
              name: name.trim(),
            });

            let mnemonics = undefined;

            mnemonics = await WalletHelper.generateNewMnemonics();

            const finalData = createWalletMnemonics || mnemonics;
            navigate("/setPassword", {
              state: {
                type,
                createWalletMnemonics: finalData,
                createShuffledMnemonics: finalData
                  .split(" ")
                  .sort(() => Math.random() - 0.5),
              },
            });
          }}
          text={"Continue"}
          maxWidth={"100%"}
        />
      </div>
    </div>
  );
}

export default CreateNewWallet;
