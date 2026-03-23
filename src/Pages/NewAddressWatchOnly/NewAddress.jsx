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
import { validate, getAddressInfo } from 'bitcoin-address-validation';

var WAValidator = require('multicoin-address-validator');

function NewAddressWatchOnly() {
  const navigate = useNavigate();
  const [address, setAddress] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const {
    state: { chain },
  } = useLocation();

  const { account } = useSelector((state) => state);

  return (
    <div>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={'/watch-only-list'}
          title={'Watch Only Address'}
        />
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
                value={address}
                placeholderBaseColor={true}
                getData={(address) => {
                  setAddress(address);
                }}
              />
            </div>
            <div className='setPassword__footerbuttons'>
              <ButtonComp
                onClick={async () => {
                  const { name } = await chrome.storage.session.get('name');

                  try {
                    if (chain.isEVM) {
                      const valid = ethers.utils.isAddress(address);
                      if (!valid)
                        return messageApi.error(
                          `Please provide a valid ${chain.chainName} address.`
                        );
                    } else if (!chain.isEVM && chain.currencyName === 'SOL') {
                      const publicKey = new PublicKey(address);
                      const valid = PublicKey.isOnCurve(publicKey.toBytes());
                      if (!valid) {
                        return messageApi.error(
                          `Please provide a valid ${chain.chainName} address.`
                        );
                      }
                    } else if (!chain.isEVM && chain.currencyName === 'BTC') {
                      const valid = validate(address);
                      if (!valid) {
                        return messageApi.error(
                          `Please provide a valid ${chain.chainName} address.`
                        );
                      }
                    } else if (!chain.isEVM && chain.currencyName === 'ADA') {
                      const valid = WAValidator.validate(address, 'ada');
                      if (!valid) {
                        return messageApi.error(
                          `Please provide a valid ${chain.chainName} address.`
                        );
                      }
                    }
                  } catch (error) {
                    return messageApi.error('Please enter a valid address.');
                  }

                  store.dispatch(setLoading(true));
                  // const response =
                  //   await WalletHelper.generateAndSetWalletForWatchOnlySameWallet(
                  //     chain.coinFamily,
                  //     address,
                  //     account.id,
                  //     password
                  //   );
                  // if (!response) {
                  //   store.dispatch(setLoading(false));
                  //   return messageApi.error(
                  //     'Unable to create wallet. Please try again later.'
                  //   );
                  // }

                  store.dispatch(setLoading(false));
                  navigate('/wallet');
                }}
                text={'Continue'}
                maxWidth='100%'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewAddressWatchOnly;
