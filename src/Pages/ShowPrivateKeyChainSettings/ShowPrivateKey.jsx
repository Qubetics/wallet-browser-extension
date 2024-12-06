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

  return (
    <div>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={'/manage-wallet'}
          title={'Private key'}
        />
        <div className={`flexedContent`}>
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
        </div>
      </div>
    </div>
  );
}

export default ShowPrivateKey;
