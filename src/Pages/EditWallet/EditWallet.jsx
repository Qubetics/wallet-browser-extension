/*global chrome*/
import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import "./EditWallet.scss";
import { useLocation, useNavigate } from "react-router-dom";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { InputFieldOnly } from "../../Components/InputField/InputFieldSimple";
import { WalletHelper } from "../../helpers/wallet.helper";
import { message } from "antd";
import { useSelector } from "react-redux";
import { DURATION } from "../../config/message.config";

function EditWallet() {
  const { state } = useLocation();

  const navigate = useNavigate();
  const { account } = useSelector((state) => state);
  const [name, setName] = useState(state ? state.name : account.name);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [myAccounts, setAccounts] = useState([]);

  const init = async () => {
    const { accounts } = await chrome.storage.session.get("accounts");
    setAccounts(accounts);
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={state ? "/wallet" : "/wallet"}
          title={"Edit"}
        />
        <div className={`flexedContent padding-Top`}>
          <div className="editWalle manageWalletHeight">
            <div>
              <h2 className="editWallet__titl noAddress">Wallet Name</h2>
              <p className="editWallet__subTitle" style={{ marginBottom: 24 }}>
                You can simply identify multiple wallets and label your own
                wallet.
              </p>
              <div className="editWallet__linkOute">
                <InputFieldOnly
                  placeholder={account.name}
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

                  const { accounts } = await chrome.storage.session.get(
                    "accounts"
                  );

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

                  const updating = await WalletHelper.updateWalletName(
                    name.trim(),
                    state ? state.id : account.id
                  );
                  if (!updating) {
                    return messageApi.error(
                      "Unable to update name at the moment."
                    );
                  }
                  navigate(state ? "/wallet" : "/wallet");
                }}
                text={"Update"}
                maxWidth="352px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditWallet;
