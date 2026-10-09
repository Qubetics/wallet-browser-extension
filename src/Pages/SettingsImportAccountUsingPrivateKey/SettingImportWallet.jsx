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

function SettingImportWallet() {
  const { state } = useLocation();

  const navigate = useNavigate();
  const { account } = useSelector((state) => state);
  const [name, setName] = useState(state ? (state.name ? state.name : "") : "");
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  return (
    <div>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders backTo={"/manage-wallet"} title={"New Account"} />
        <div className={`flexedContent padding-top`}>
          <div className="editWalle manageWalletHeight">
            <div>
              <h2 className="editWallet__titl noAddress">Wallet Name</h2>
              <p className="editWallet__subTitle" style={{ marginBottom: 16 }}>
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
                  
                  const { accounts } = await chrome.storage.session.get("accounts");

                  const checkIfExists = await accounts.find(
                    (el) => el.name.toLowerCase() === name.trim().toLowerCase()
                  );

                  if (checkIfExists) {
                    return messageApi.error(
                      "Wallet with this name already exists"
                    );
                  }

                  navigate("/import-wallet-private-key", {
                    state: {
                      name: name.trim(),
                    },
                  });
                }}
                text={"Continue"}
                maxWidth="352px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingImportWallet;
