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
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { WalletHelper } from "../../helpers/wallet.helper";
import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import { Web3Helper } from "../../helpers/web3.helper";
import { Loader } from "../../Components/Loader/Loader";
import { DURATION } from "../../config/message.config";

function AddNetwork() {
  const { chain } = useSelector((state) => state);
  const [name, setName] = useState(null);
  const [rpc, setRpc] = useState(null);
  const [testnet, setTestnet] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [currencyName, setCurrencyName] = useState(null);
  const [explorer, setExplorer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const navigate = useNavigate();
  const selectAfterTo = (
    <div className={"addonAfter"}>
      <Select
        disabled={true}
        suffixIcon={<img src={DownArrowSuffix} />}
        defaultValue={[
          {
            value: (
              <span className='flexedItemSelect'>
                <img src={chain.image} className={style.chainImage} />
                {chain.currencySymbol}
              </span>
            ),
          },
        ]}
        style={{
          width: 100,
        }}
      />
    </div>
  );

  const init = async () => {
    const tabs = await chrome.tabs.getCurrent();
    if (!tabs) {
      return chrome.tabs.create({ url: "index.html#add-network" });
    }
    return true;
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div className={`scrollableCont`}>
      {loading ? <Loader /> : null}
      {contextHolder}
      <MenuRestofHeaders
        // FilterIcon
        backTo={"/networks"}
        title={"Add Custom Network"}
      />
      <div className={`flexedContent`}>
        <div className={style.token}>
          <p className='support'>We only support EVM networks currently.</p>
          <InputField
            placeholder='Network Name'
            label=''
            getData={(name) => {
              setName(name);
            }}
            value={name}
            checkForSymbols={true}
          />

          <InputField
            placeholder='RPC URL'
            label=''
            getData={(address) => {
              setRpc(address);
            }}
            value={rpc}
            checkForSymbols={false}
          />

          <InputField
            placeholder='Chain ID'
            label=''
            getData={(address) => {
              setChainId(address);
            }}
            value={chainId}
            checkForSymbols={true}
          />

          <InputField
            placeholder='Currency Symbol'
            label=''
            getData={(address) => {
              setCurrencyName(address);
            }}
            value={currencyName}
            checkForSymbols={true}
          />

          <InputField
            placeholder='Explorer URL'
            label=''
            getData={(address) => {
              setExplorer(address);
            }}
            checkForSymbols={false}
            value={explorer}
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
              try {
                setLoading(true);
                e.preventDefault();

                if (!name || name === "") {
                  setLoading(false);

                  return messageApi.error("Name for the network is required.");
                }

                if (!rpc || rpc === "") {
                  setLoading(false);

                  return messageApi.error("RPC for the network is required.");
                }

                if (!chainId || chainId === "") {
                  setLoading(false);

                  return messageApi.error(
                    "Chain ID for the network is required."
                  );
                }

                if (!currencyName || currencyName === "") {
                  setLoading(false);

                  return messageApi.error(
                    "Currency Name for the network is required."
                  );
                }

                if (!explorer || explorer === "") {
                  setLoading(false);

                  return messageApi.error(
                    "Explorer for the network is required."
                  );
                }

                const { chains } = await chrome.storage.local.get("chains");
                const checkIfAlreadyExists = chains.find(
                  (el) => el.chainId == parseInt(chainId)
                );

                if (checkIfAlreadyExists) {
                  setLoading(false);
                  return messageApi.error("Chain ID already exists");
                }

                const web3Helper = new Web3Helper(rpc);
                const netID = await web3Helper.web3.eth.net.getId();

                if (!netID) {
                  setLoading(false);

                  return messageApi.error(
                    "Invalid RPC provided. Please ensure your RPC is working and then try again."
                  );
                }

                if (netID != parseInt(chainId)) {
                  setLoading(false);

                  return messageApi.error(
                    "The RPC provided does not match the Chain ID. Please check both fields and try again."
                  );
                }

                const newChain = {
                  id: uuidv4(),
                  chainName: name,
                  chainId: parseInt(chainId),
                  currencyName: currencyName,
                  currencySymbol: currencyName,
                  currencyDecimals: 18,
                  rpcUrl: rpc,
                  blockUrl: explorer,
                  default: true,
                  image:
                    "https://cdn-icons-png.flaticon.com/512/2152/2152488.png",
                  tokenType: "ERC20",
                  testnet,
                  swap: false,
                  isEVM: true,
                  supportTokens: true,
                };
                await WalletHelper.addNetwork(newChain);
                setLoading(false);
                navigate(-1);
              } catch (error) {
                setLoading(false);
                return messageApi.error(error.message);
              }
            }}
          >
            {" "}
            <ButtonComp text={"Add Network"} maxWidth={"100%"} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AddNetwork;
