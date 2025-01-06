/*global chrome*/

import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import "./NewAddress.scss";
import { useLocation } from "react-router-dom";
import { InputFieldOnly } from "../../Components/InputField/InputFieldSimple";
import { message } from "antd";
import { useSelector } from "react-redux";
import { DURATION } from "../../config/message.config";
import CopyIcon from "../../Assets/CopyIconBlue.svg";
import { WalletHelper } from "../../helpers/wallet.helper";
const bs58 = require("bs58");

function ShowPrivateKey() {
  const [address, setAddress] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const {
    state: { account },
  } = useLocation();

  const init = () => {
    setAddress(account.privateKey);
  };

  useEffect(() => {
    init();
  }, []);

  function copyToClipboard(address) {
    navigator.clipboard.writeText(address);
    messageApi.success("Private key copied to clipboard");
  }

  const coin = {
    1: "BNB",
    2: "ETH",
    3: "BTC",
    4: "POL",
    5: "SOL",
    6: "TRX",
  };

  const [solKey, setSolKey] = useState(null);
  const [btcKey, setBtcKey] = useState(null);

  const get_privateKey = async () => {
    const btcK = await WalletHelper.getBitcoinPrivateKey();
    setBtcKey(btcK);
    const rr = await WalletHelper?.getSolanaPrivateKey();
    const privateKey = bs58.encode(rr);
    setSolKey(privateKey);
  };

  useEffect(() => {
    get_privateKey();
  }, []);

  return (
    <div>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders backTo={"/manage-wallet"} title={"Private key"} />
        <div className={`flexedContent`}>
          <div className="editWallet privateWallet">
            <h2 style={{ color: "#fff", marginBottom: 25 }}>
              Keep your private key safe!
            </h2>
            {account &&
              address &&
              account?.coinFamilies.map((data, idx) => {
                let displayAddress;
                if (coin[`${data}`] === "BTC") {
                  displayAddress = btcKey;
                } else if (coin[`${data}`] === "SOL") {
                  displayAddress = solKey;
                } else {
                  displayAddress = address;
                }

                return (
                  <div
                    className="editWallet__linkOuter"
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#295a72",
                      borderRadius: 25,
                      justifyContent: "space-between",
                      marginBottom: "16px",
                      padding: "15px 24px",
                    }}
                  >
                    <span style={{ color: "white" }}>
                      {displayAddress?.slice(0, 15)}...
                    </span>
                    <div className="secretkeyss">
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ color: "white" }}>
                          {coin[`${data}`]}
                        </span>
                        <img
                          src={CopyIcon}
                          width={14}
                          height={16}
                          onClick={() => copyToClipboard(displayAddress)}
                        />
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShowPrivateKey;
