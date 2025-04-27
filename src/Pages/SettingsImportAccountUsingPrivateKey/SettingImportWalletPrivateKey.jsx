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
import { store } from "../..";
import { setLoading } from "../../actions/loading";

function SettingImportWalletPrivatekey() {
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
          backTo={"/import-wallet-name"}
          name={state.name}
          title={"New Account"}
        />
        <div className={`flexedContent padding-top`}>
          <div className="editWalle manageWalletHeight">
            <div>
              <h2 className="editWallet__titl noAddress">Private key</h2>
              <p className="editWallet__subTitle" style={{ marginBottom: 24 }}>
                Please enter your existing private key in order to create a
                wallet.
              </p>
              <div className="editWallet__linkOute">
                <InputFieldOnly
                  placeholder={"Enter Private key"}
                  label="Private key"
                  checkForSymbols={true}
                  value={name}
                  placeholderBaseColor={true}
                  getData={(name) => {
                    setName(name);
                  }}
                  // coloredBg={true}
                />
              </div>
            </div>
            <div className="setPassword__footerbutton bottomBtn">
              <ButtonComp
                onClick={async () => {
                  store.dispatch(setLoading(false));
                  const walletName = state.name;
                  if (!name) {
                    return messageApi.error("Please enter a valid private key");
                  }

                  const { accounts } = await chrome.storage.session.get(
                    "accounts"
                  );

                  const checkIfExists = await accounts.find(
                    (el) => el.privateKey.toLowerCase() === name.toLowerCase()
                  );
                  if (checkIfExists) {
                    return messageApi.error(
                      "Account with this private key already exists."
                    );
                  }
 
                  const res = await WalletHelper.generateAndSetWalletPrivateKey(
                    name,
                    walletName
                  );

                  if (!res) {
                    store.dispatch(setLoading(false));
                    return messageApi.error("Please enter a valid private key");
                  }

                  await WalletHelper.setWalletPreference(res);

                  store.dispatch(setLoading(false));
                  navigate("/wallet");
                }}
                text={"Create"}
                maxWidth="352px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingImportWalletPrivatekey;
