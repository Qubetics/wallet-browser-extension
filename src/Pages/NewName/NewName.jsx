/*global chrome*/

import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import "./NewName.scss"
import { useLocation, useNavigate } from "react-router-dom";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { InputFieldOnly } from "../../Components/InputField/InputFieldSimple";
import { WalletHelper } from "../../helpers/wallet.helper";
import { message } from "antd";
import { useSelector } from "react-redux";
import { DURATION } from "../../config/message.config";

function NewName() {
  const navigate = useNavigate();
  const { account } = useSelector((state) => state);
  const [name, setName] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [myAccounts, setAccounts] = useState([]);

  const {
    state: { goTo, mnemonics },
  } = useLocation();

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
        <MenuRestofHeaders backTo={"/setting"} title={""} />
        <div className={`flexedContent`}>
          <div className="editWallet">
            <h2 className="editWallet__title">Wallet Name</h2>
            <p
              className="editWallet__subTitle"
              style={{ marginBottom: 24 }}
            >
              You can simply identify multiple wallets and label your own
              wallet.
            </p>
            <div className="editWallet__linkOuter">
              <InputFieldOnly
                placeholder={"Enter Wallet Name"}
                label='Enter Name'
                value={name}
                checkForSymbols={true}
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
            <div className="setPassword__footerbuttons">
              <ButtonComp
                onClick={async () => {
                  if (!name) {
                    return messageApi.error(
                      "Please enter a valid name to proceed."
                    );
                  }

                  if (name.trim().length === 0) {
                    return messageApi.error(
                      "Name should have a minimum of 5 characters."
                    );
                  }

                  if (name.length < 3) {
                    return messageApi.error(
                      "Name should have a minimum of 5 characters."
                    );
                  }

                  if (name.length > 25) {
                    return messageApi.error(
                      "Name should not have more than 25 characters."
                    );
                  }
                  const nameRegex = /^[A-Za-z\s]+$/;
                  if (!nameRegex.test(name)) {
                    return messageApi.error(
                      "Name should contain only alphabetic characters."
                    );
                  }

                  // const format = /[!@#$%^`&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

                  // if (format.test(name)) {
                  //   return messageApi.error(
                  //     "Name should not contain any special characters."
                  //   );
                  // }

                  const findDuplicateName = myAccounts.find(
                    (el) => el.name.toUpperCase() === name.toUpperCase()
                  );

                  if (findDuplicateName) {
                    return messageApi.error(
                      "Name already associated with one of the wallets."
                    );
                  }

                  await chrome.storage.session.set({
                    name,
                  });

                  // console.log(goTo);
                  // console.log(mnemonics);

                  navigate(goTo, {
                    state: {
                      mnemonics,
                    },
                  });
                }}
                text={"Continue"}
                maxWidth='100%'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewName;
