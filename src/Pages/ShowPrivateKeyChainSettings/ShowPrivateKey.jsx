/*global chrome*/

import React, { useEffect, useState } from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import './NewAddress.scss';
import { useLocation } from 'react-router-dom';
import { InputFieldOnly } from '../../Components/InputField/InputFieldSimple';
import { message } from 'antd';
import { useSelector } from 'react-redux';
import { DURATION } from '../../config/message.config';
import CopyIcon from '../../Assets/CopyIconBlue.svg';
import { WalletHelper } from '../../helpers/wallet.helper';
import { SystemProgram } from "@solana/web3.js";
import bs58 from 'bs58';




const coin = {
  1: "BNB",
  2: "ETH",
  3: "BTC",
  4: "POL",
  5: "SOL",
  6: "TRX",
};


function ShowPrivateKey() {
  const [address, setAddress] = useState(null);

  const [btcKey, setBtcKey] = useState(null);
  const [solKey, setSolKey] = useState(null);

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const {
    state: { account },
  } = useLocation();

  const init = () => {
    setAddress(account?.privateKey);
  };

  useEffect(() => {
    init();
  }, []);

  function copyToClipboard() {
    navigator.clipboard.writeText(address);
    messageApi.success('Private key copied to clipboard');
  }


 
  const get_privateKey = async () => {
    const btcK = await WalletHelper.getBitcoinPrivateKey();
    setBtcKey(btcK) 
    const rr = await WalletHelper?.getSolanaPrivateKey();
    const privateKey =  bs58.encode(rr)
    console.log("EEEEEEEEEEEEEEEEEEEEe ", privateKey); 
    setSolKey(privateKey); 
  }

  useEffect(() => {
    get_privateKey();
  }, []);

  console.log("CCCCCCCCCCCCCXS ", account);
  
  return (
    <div>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={'/manage-wallet'}
          title={'Private key'}
        /> 
        <div className={`flexedContent`}>
          <div className="editWallet privateWallet">
            <h2 style={{ color: "#fff", marginBottom: 25 }}>
              Keep your private key safe!</h2>
            {Array.isArray(account?.coinFamilies) &&
              address &&
              account?.coinFamilies.map(async (data, idx) => (
                <div className="editWallet__linkOuter"
                  key={idx}
                  style={{ display: "flex", alignItems: "center", backgroundColor: "#295a72", borderRadius: 25, justifyContent: 'space-between', marginBottom: '16px', padding: "15px 24px" }}
                >
                  <span style={{ color: "white" }}>
                    {data == 3 ? btcKey?.slice(0, 15) :
                      data == 5 ? solKey?.slice(0, 15) : <>{address?.slice(0, 15)}...{coin[data]}</>}
                  </span>
                  <div className="secretkeyss">
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ color: "white" }}>{coin[data]}</span>
                      <img
                        src={CopyIcon}
                        width={14}
                        height={16}
                        onClick={copyToClipboard}
                      />
                    </span>
                  </div>
                  {/* <InputFieldOnly

        placeholder={"Private Key"}

        label="Keep your private key safe!"

        value={address}

        readonly={true}

        placeholderBaseColor={true}

        getData={(address) => {

          setAddress(address);

        }}

      /> */}

                  {/* <div

        onClick={copyToClipboard}

        className="setPassword__secretPharse__copyField"

      >

        <img src={CopyIcon} width={14} height={16} />

        <span>Copy</span>

      </div> */}

                </div>

              ))}

          </div>
        </div>
      </div>
    </div>
  );
}

export default ShowPrivateKey;
