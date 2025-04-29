/* global chrome*/
import React, { useEffect } from "react";
import "./Welcome.scss";
import {
  InputField,
  InputFieldOnly,
} from "../../Components/InputField/InputFieldSimple";
import ScannerImg from "../../Assets/scanner.svg";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { message } from "antd";
import { Web3Helper } from "../../helpers/web3.helper";
import { ethers } from "ethers";
import { PublicKey } from "@solana/web3.js";
import { validate, getAddressInfo } from "bitcoin-address-validation";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { WalletHelper } from "../../helpers/wallet.helper";
import { DURATION } from "../../config/message.config";
import { useSelector } from "react-redux";
var WAValidator = require("multicoin-address-validator");

function WatchAddress() {
  const { create } = useSelector((state) => state);

  const [activeTab, setActiveTab] = useState("setPassword");
  const [address, setAddress] = useState(null);
  const [name, setName] = useState(null);
  const [chain, setChain] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const {
    state: { chainId },
  } = useLocation();

  const navigate = useNavigate();

  const init = async () => {
    store.dispatch(setLoading(true));
    const { chains } = await chrome.storage.local.get("chains");
    const myChain = chains.find((el) => el.chainId == chainId);
    setChain(myChain);
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      {contextHolder}
      <div className="cardWhite">
        <h2 className="cardWhite__title">Address</h2>
        <p
          className="cardWhite__subTitle"
          style={{ margin: "0 auto 24px", maxWidth: 325 }}
        >
          Public address can be view without revealing its private key. You can
          view balances and transactions with this, but you cannot send
          transactions.
        </p>
        <div className="cardWhite__linkOuter">
          <div className="token">
            <div className="token__fields">
              <InputFieldOnly
                placeholderBaseColor={true}
                label="Wallet Name"
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
                value={name}
                placeholder="Enter wallet name"
              />
              <div className="textInfoBaseColor">
                Max Limit: {name ? name.length : 0}/25
              </div>
              <div className="adreesInput">
                <InputField
                  placeholderBaseColor={true}
                  placeholder="Address"
                  label="Address"
                  value={address}
                  getData={setAddress}
                  coloredBg={true}
                />
                <div className="token__selectStyle">
                  <span
                    className="token__pasteText pasteText"
                    onClick={async () => {
                      const data = await navigator.clipboard.readText();
                      setAddress(data);
                    }}
                  >
                    Paste
                  </span>
                </div>
              </div>
              <div className="setPassword__footerbuttons">
                <ButtonComp
                  onClick={() => {
                    if (!create) {
                      return navigate("/watch-password", {
                        state: {
                          chainId,
                        },
                      });
                    }

                    return navigate("/watch-list");
                  }}
                  text={"Back"}
                  bordered={true}
                />
                <ButtonComp
                  onClick={async () => {
                    if (!name) {
                      messageApi.error("Wallet name is required.");
                    }

                    if (name.trim().length === 0) {
                      return messageApi.error(
                        "Name should have a minimum of 3 characters."
                      );
                    }

                    if (name.length < 3) {
                      return messageApi.error(
                        "Name should have a minimum of 3 characters."
                      );
                    }

                    if (name.length > 25) {
                      return messageApi.error(
                        "Name should not have more than 25 characters."
                      );
                    }

                    // const format = /[!@#$%^`&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

                    // if (format.test(name)) {
                    //   return messageApi.error(
                    //     'Name should not contain any special characters.'
                    //   );
                    // }

                    const nameRegex = /^[A-Za-z\s]+$/;
                    if (!nameRegex.test(name)) {
                      return messageApi.error(
                        "Name should contain only alphabetic characters."
                      );
                    }
                    const { accounts } = await chrome.storage.session.get(
                      "accounts"
                    );

                    if (accounts) {
                      const checkIfExists = accounts.find(
                        (el) => el.name.toLowerCase() === name.toLowerCase()
                      );

                      if (checkIfExists) {
                        return messageApi.error(
                          "This wallet name already exists. Use a different name."
                        );
                      }
                    }

                    try {
                      if (chain.isEVM) {
                        const valid = ethers.utils.isAddress(address);
                        if (!valid)
                          return messageApi.error(
                            `Please provide a valid ${chain.chainName} address.`
                          );
                      } else if (!chain.isEVM && chain.currencyName === "SOL") {
                        const publicKey = new PublicKey(address);
                        const valid = PublicKey.isOnCurve(publicKey.toBytes());
                        if (!valid) {
                          return messageApi.error(
                            `Please provide a valid ${chain.chainName} address.`
                          );
                        }
                      } else if (!chain.isEVM && chain.currencyName === "BTC") {
                        const valid = validate(address);
                        if (!valid) {
                          return messageApi.error(
                            `Please provide a valid ${chain.chainName} address.`
                          );
                        }
                      } else if (!chain.isEVM && chain.currencyName === "ADA") {
                        const valid = WAValidator.validate(address, "ada");
                        if (!valid) {
                          return messageApi.error(
                            `Please provide a valid ${chain.chainName} address.`
                          );
                        }
                      }
                    } catch (error) {
                      return messageApi.error(
                        "Please provide a valid address."
                      );
                    }

                    store.dispatch(setLoading(true));
                    // const response =
                    //   await WalletHelper.generateAndSetWalletForWatchOnly(
                    //     name,
                    //     chain.coinFamily,
                    //     address,
                    //     password
                    //   );
                    // if (!response) {
                    //   store.dispatch(setLoading(false));
                    //   return messageApi.error(
                    //     "Unable to create a wallet. Please try again later."
                    //   );
                    // }

                    store.dispatch(setLoading(false));
                    navigate("/wallet");
                  }}
                  // onClick={() => setActiveTab("/")}
                  text={"Proceed"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WatchAddress;
