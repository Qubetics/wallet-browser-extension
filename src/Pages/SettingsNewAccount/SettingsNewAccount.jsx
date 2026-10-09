/*global chrome*/
import React, { useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import "./EditWallet.scss";
import { useLocation, useNavigate } from "react-router-dom";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { InputFieldOnly } from "../../Components/InputField/InputFieldSimple";
import { message } from "antd";
import { useSelector } from "react-redux";
import { DURATION } from "../../config/message.config";
import { WalletHelper } from "../../helpers/wallet.helper";
import { setLoading } from "../../actions/loading";
import { store } from "../..";

function AddNewWallet() {
  const { state } = useLocation();

  const navigate = useNavigate();
  const { account } = useSelector((state) => state);
  const [name, setName] = useState("");
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });


  return (
    <div>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={"/manage-wallet"}
          title={state?.type === "import" ? "Import Account" : "New Account"}
        />
        <div className={`flexedContent padding-top`}>
          <div className="editWalle manageWalletHeight">
            <div>
              <h2 className="editWallet__titl noAddress">Wallet Name</h2>
              <p className="editWallet__subTitle" style={{ marginBottom: 24 }}>
                You can simply identify multiple wallets and label your own
                wallet.
              </p>
              <div className="editWallet__linkOute">
                <InputFieldOnly
                  placeholder={"Enter Wallet Name"}
                  label="Enter Name"
                  checkForSymbols={true}
                  value={name}
                  placeholderBaseColor={true}
                  getData={(name) => {
                    const hasEmoji = /[\p{Extended_Pictographic}]/u.test(name);
                    if (name.length <= 25 && !hasEmoji) {
                      if (/^\s/.test(name)) {
                        setName("");
                      } else {
                        setName(name);
                      }
                    } else {
                      return;
                    }
                  }}
                // coloredBg={true}
                />
                <div className="textInfoBaseColor">
                  Max Limit: {name ? name.length : 0}/25
                </div>
              </div>
            </div>
            <div className="setPassword__footerbutton bottomBtn">
              <ButtonComp
                onClick={async () => {
                  try {
                    if (!name) {
                      return messageApi.error(
                        "Please enter a valid name to proceed."
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
                    const { accounts } = await chrome.storage.session.get(
                      "accounts"
                    );

                    const checkIfExists = await accounts.find(
                      (el) => el.name.toLowerCase() === name.trim().toLowerCase()
                    );

                    if (checkIfExists) {
                      return messageApi.error(
                        "Wallet with this name already exists"
                      );
                    }

                    store.dispatch(setLoading(true));
                    await chrome.storage.session.set({ name: name.trim(), });
                    const newMnemonic = await WalletHelper.generateNewMnemonics()

                    navigate("/setPassword", {
                      state: {
                        type: state?.type,
                        createWalletMnemonics: newMnemonic,
                        createShuffledMnemonics: newMnemonic
                          .split(" ")
                          .sort(() => Math.random() - 0.5),
                      },
                    });
                    store.dispatch(setLoading(false));
                  } catch (error) {
                    // console.error("Error occurred:", error);
                    messageApi.error("An error occurred. Please try again.");
                    store.dispatch(setLoading(false));
                  }
                }}
                text={state?.type=="import"?"Import":"Create"}
                maxWidth="352px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddNewWallet;
// column patch eagle grid cereal gather round capable mosquito icon damage yellow