/*global chrome*/
import React, { useEffect, useState } from "react";
import { Checkbox, message, Select } from "antd";
import BTC from "../../Assets/Coins/BTC.png";
import DownArrowSuffix from "../../Assets/DownArrowSuffix.svg";
import ETH from "../../Assets/Coins/ETH.png";
import ADA from "../../Assets/Coins/ADA.png";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import style from "./style.module.scss";
import { InputField } from "../../Components/InputField/InputFieldSimple";
import { InputFieldOnly } from "../../Components/InputField/InputFieldSimple.jsx";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { WalletHelper } from "../../helpers/wallet.helper";
import { DURATION } from "../../config/message.config";

function EditNetwork() {
  const {
    state: { chain },
  } = useLocation();

  const [name, setName] = useState(chain.chainName);
  const [rpc, setRpc] = useState(chain.rpcUrl);
  const [testnet, setTestnet] = useState(chain.testnet);
  const [rpcApiKey, setRpcApiKey] = useState(chain.rpcApiKey);
  const [chainId, setChainId] = useState(chain.chainId);
  const [currencyName, setCurrencyName] = useState(chain.currencyName);
  const [explorer, setExplorer] = useState(chain.blockUrl);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const navigate = useNavigate();

  // const init = async () => {
  //   const tabs = await chrome.tabs.getCurrent();
  //   if (!tabs) {
  //     return chrome.tabs.create({ url: "index.html#edit-network" });
  //   }
  //   return true;
  // };

  // useEffect(() => {
  //   init();
  // }, []);

  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders
        // FilterIcon
        backTo={"/networks"}
        title={"Edit Custom Network"}
      />
      <div className={`flexedContent`}>
        <div className={style.token}>
          <p className='support'>We only support EVM networks currently.</p>
          <InputField
            placeholder='Network Name'
            label='Network Name'
            value={name}
            getData={(name) => {
              setName(name);
            }}
            checkForSymbols={true}
          />

          <InputField
            placeholder='RPC URL'
            label='RPC URL'
            value={rpc}
            getData={(address) => {
              setRpc(address);
            }}
            readonly={chain.currencyName === "BTC"}
            checkForSymbols={false}
          />

          {chain.rpcApiKey ? (
            <InputField
              placeholder='API Key'
              label='API KEY'
              value={rpcApiKey}
              checkForSymbols={false}
              getData={(key) => {
                setRpcApiKey(key);
              }}
            />
          ) : null}

          <InputField
            placeholder='Chain ID'
            label='Chain ID'
            checkForSymbols={true}
            value={chainId}
            getData={(address) => {
              setChainId(address);
            }}
            readonly={true}
          />

          <InputField
            placeholder='Currency Symbol'
            label='Currency Symbol'
            checkForSymbols={true}
            value={currencyName}
            getData={(address) => {
              setCurrencyName(address);
            }}
          />

          <InputField
            placeholder='Explorer URL'
            label='Explorer URL'
            checkForSymbols={false}
            value={explorer}
            getData={(address) => {
              setExplorer(address);
            }}
            readonly={!chain.isEVM}
          />

          <div
            className={"checkboxOuter"}
            style={{
              marginBottom: "15px",
            }}
          >
            <Checkbox
              checked={testnet}
              onChange={(value) => {
                setTestnet(value.target.checked);
              }}
            >
              is it a testnet network?
            </Checkbox>
          </div>
          <h4>Double check the network info</h4>
          <p className='malicious'>
            A malicious network provider can lie about the state of the
            blockchain and record your network activity. Only add custom
            networks you trust.
          </p>

          <Link
            to='/manage'
            onClick={async (e) => {
              e.preventDefault();

              if (!name || name === "") {
                return messageApi.error("Name for the network is required.");
              }

              if (!rpc || rpc === "") {
                return messageApi.error("RPC for the network is required.");
              }

              if (!chainId || chainId === "") {
                return messageApi.error(
                  "Chain ID for the network is required."
                );
              }

              if (!currencyName || currencyName === "") {
                return messageApi.error(
                  "Currency Name for the network is required."
                );
              }

              if (!explorer || explorer === "") {
                return messageApi.error(
                  "Explorer for the network is required."
                );
              }

              const newChain = {
                id: chain.id,
                chainName: name,
                chainId: chainId,
                currencyName: currencyName,
                currencySymbol: currencyName,
                currencyDecimals: chain.currencyDecimals,
                rpcUrl: rpc,
                blockUrl: explorer,
                default: chain.default,
                image: chain.image,
                tokenType: chain.tokenType,
                testnet: testnet,
                swap: chain.swap,
                rpcApiKey: rpcApiKey,
                isEVM: chain.isEVM,
                supportTokens: chain.supportTokens,
              };

              const updated = await WalletHelper.updateNetwork(newChain);
              if (!updated) {
                return messageApi.error(
                  "Unable to update the chain. Please try again later."
                );
              }
              navigate(-1);
            }}
          >
            {" "}
            <ButtonComp text={"Save Changes"} maxWidth={"100%"} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EditNetwork;
