/*global chrome*/

import React, { useState } from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import './NewAddress.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { InputFieldOnly } from '../../Components/InputField/InputFieldSimple';
import { WalletHelper } from '../../helpers/wallet.helper';
import { message } from 'antd';
import { useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { PublicKey } from '@solana/web3.js';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { DURATION } from '../../config/message.config';
var WAValidator = require('multicoin-address-validator');

function NewAddress() {
  const navigate = useNavigate();
  const [name, setName] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const {
    state: { chain, walletId },
  } = useLocation();

  // console.log(chain);
  // console.log(walletId);

  return (
    <div>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders backTo={'/setting'} title={'Watch Only Address'} />
        <div className={`flexedContent`}>
          <div className='editWallet'>
            <h2 className='editWallet__title'>
              {chain.currencyName.toUpperCase()} Address
            </h2>
            <p className='editWallet__subTitle' style={{ marginBottom: 24 }}>
              Public address can be view without revealing its private key. You
              can view balances and transactions with this, but you cannot send
              transactions.
            </p>
            <div className='editWallet__linkOuter'>
              <InputFieldOnly
                placeholder={'Wallet Address'}
                label='Enter address'
                value={name}
                placeholderBaseColor={true}
                getData={(name) => {
                  setName(name);
                }}
              />
            </div>
            <div className='setPassword__footerbuttons'></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewAddress;
