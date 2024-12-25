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

  function copyToClipboard() {
    navigator.clipboard.writeText(address);
    messageApi.success('Private key copied to clipboard');
  }

  const coin = {

    1: "BNB",

    2: "ETH",

    3: "BTC",

    4: "POL",

    5: "SOL",

    6: "TRX",

  };



  return (
    <div>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={'/manage-wallet'}
          title={'Private key'}
        />
        {/* <div className={`flexedContent`}>
          <div className='editWallet'>
            <h2 className='editWallet__title'>Private Key</h2>
            <p
              className='editWallet__subTitle'
              style={{ marginBottom: 24 }}
            ></p>
            <div className='editWallet__linkOuter'>
              <InputFieldOnly
                placeholder={'Private Key'}
                label='Private Key'
                value={address}
                readonly={true}
                placeholderBaseColor={true}
                getData={(address) => {
                  setAddress(address);
                }}
              />
              <div
                onClick={copyToClipboard}
                className='setPassword__secretPharse__copyField'
              >
                <img src={CopyIcon} width={14} height={16} />
                <span>Copy</span>
              </div>
            </div>
          </div>
        </div> */}
        <div className={`flexedContent`}>

          <div className="editWallet privateWallet">

            <h2>Keep your private key safe!</h2>

            {account &&

              address &&

              account?.coinFamilies.map((data, idx) => (

                <div

                  className="editWallet__linkOuter"

                  key={idx}

                  style={{ display: "flex", alignItems: "center" }}

                >

                  <span style={{ color: "white" }}>

                    {address?.slice(0, 15)}...{coin?.[data]}

                  </span>

                  <div className="secretkeyss">

                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>

                      <span style={{ color: "white" }}>{coin?.[data]}</span>



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
