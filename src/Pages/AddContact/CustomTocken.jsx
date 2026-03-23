/*global chrome*/
import React, { useEffect, useState } from 'react';
import { message, Select } from 'antd';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import style from './style.module.scss';
import { InputField } from '../../Components/InputField/InputFieldSimple';
import { InputFieldOnly } from '../../Components/InputField/InputFieldSimple.jsx';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { DURATION } from '../../config/message.config';
import { validate } from 'bitcoin-address-validation';
import { server } from '../../server';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { PublicKey } from '@solana/web3.js';

var WAValidator = require('multicoin-address-validator');

function AddContact() {
  const { state } = useLocation();

  const { chain, account, currency } = useSelector((state) => state);
  const [name, setName] = useState(state ? state.oldName : null);
  const [address, setAddress] = useState(state ? state.oldAddress : null);

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const navigate = useNavigate();

  const [chains, setChains] = useState([]);
  const [selectedChain, setSelectedChain] = useState(chain);

  console.log('ADDDDDDDDDDDDD FROM SEND ', state?.coin, state?.redirectTo);

  const selectAfterTo = (
    <div className={'addonAfter'}>
      <Select
        placement="bottomRight"
        popupClassName="placementRightPopup"
        options={chains.map((myChain) => {
          return {
            value: myChain.coinFamily,
            label: (
              <span
                className="flexedItemSelect"
                style={{
                  textAlign: 'center',
                }}
              >
                <img src={myChain.image} className={style.chainImage} alt="" />
                {myChain.currencySymbol}
              </span>
            ),
          };
        })}
        defaultValue={[
          {
            value: chain.coinFamily,
            label: (
              <span
                className="flexedItemSelect"
                style={{
                  textAlign: 'center',
                }}
              >
                <img src={chain.image} className={style.chainImage} alt="" />
                {chain.currencySymbol}
              </span>
            ),
          },
        ]}
        onChange={(value) => {
          const selectedChain = chains.find((el) => el.coinFamily == value);
          console.log('selectedChain', selectedChain);
          setSelectedChain(selectedChain);
        }}
        style={{
          width: '100',
        }}
      />
    </div>
  );

  const init = async () => {
    const { chains } = await chrome.storage.local.get('chains');
    setChains(chains);
    console.log('CCCCCCCCCC ', state?.coin?.coin_family, chains);

    if (state?.coin?.coin_family) {
      const selectedChain = chains.find(
        (el) => el.coinFamily == state?.coin?.coin_family
      );
      setSelectedChain(selectedChain);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const handleSubmit = async () => {
    try {
      // wallet_address: account.coinFamilyAndAddress[1]

      console.log('selectedChainselectedChain ', selectedChain?.coinFamily);

      store.dispatch(setLoading(true));
      const parentCoin = await server.post(
        // '/wallet/coin/coins_market_data',
        '/user/add_address_book',
        {
          address: account?.coinFamilyAndAddress[selectedChain?.coinFamily],
          wallet_name: '',
          contact_name: name, //selectedChain?.chainName,
          coin_family: selectedChain?.coinFamily,
          wallet_address: address,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      console.log('parentCoin----> ', parentCoin);

      // let response = await server.post(
      //   '/wallet/save_address',
      //   {
      //     wallet_address: account.coinFamilyAndAddress[1],
      //     name: name,
      //     address: address,
      //     coin_family: selectedChain.coinFamily,
      //     coin_id: parentCoin.data.data.id,
      //   },
      //   {
      //     headers: {
      //       Authorization: account.jwtToken,
      //     },
      //   }
      // );

      store.dispatch(setLoading(false));
      navigate(-1);
    } catch (error) {
      console.log('ERRR======> ', error);

      store.dispatch(setLoading(false));
      return messageApi.error(error?.response?.data?.message);
    }
  };

  return (
    <div className={`scrollableCont  `}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={'/address-book'}
        coin={state?.coin}
        redirectTo={state?.redirectTo}
        title={'Address Book'}
      />
      <div className={`flexedContent manageWalletHeight`}>
        <div className={style.token}>
          <InputField
            placeholder={selectedChain.chainName}
            label="Network"
            readonly={true}
            addonAfter={selectAfterTo}
          />
          <InputFieldOnly
            placeholder="Enter Address Name"
            label="Address Name"
            getData={(name) => {
              if (name.length <= 25) {
                if (/^\s/.test(name)) {
                  setName('');
                } else {
                  setName(name);
                }
              } else {
                return;
              }
            }}
            value={name}
            checkForSymbols={true}
          />

          <InputField
            placeholder="Wallet Address"
            label="Address or Naming Service"
            getData={(address) => {
              setAddress(address);
            }}
            value={address}
            checkForSymbols={true}
            addonAfter={
              <div className={style.token__selectStyle}>
                <span
                  style={{ color: '#fff' }}
                  className={style.token__pasteText}
                  onClick={async () => {
                    const data = await navigator.clipboard.readText();
                    setAddress(data);
                  }}
                >
                  Paste
                </span>
              </div>
            }
          />
          <Link
            className="bottomBtn"
            to="/manage"
            onClick={async (e) => {
              e.preventDefault();

              // Validate name
              if (!name) {
                return messageApi.error('Name for the contact is required.');
              }

              const trimmedName = name.trim();
              if (trimmedName.length < 2) {
                return messageApi.error(
                  'Name should have a minimum of 2 characters.'
                );
              }

              if (trimmedName.length > 25) {
                return messageApi.error(
                  'Name should not have more than 25 characters.'
                );
              }

              // Validate address
              if (!address) {
                return messageApi.error('Address for the contact is required.');
              }

              // Address validation based on chain type
              const isValidAddress = () => {
                if (selectedChain.isEVM) {
                  // Special case for Qubetics (coinFamily 7)
                  if (selectedChain.coinFamily === 7) {
                    return (
                      address.startsWith('qubetics1') ||
                      ethers.utils.isAddress(address)
                    );
                  }
                  return ethers.utils.isAddress(address);
                }

                // Non-EVM chains
                switch (selectedChain.currencyName) {
                  case 'SOL':
                    try {
                      // Option 1: If you have @solana/web3.js installed
                      new PublicKey(address);
                      return true;

                      // // Option 2: Better regex validation (current approach)
                      // // This checks for valid base58 characters and length
                      // const isValidLength =
                      //   address.length >= 32 && address.length <= 44;
                      // const hasValidChars = /^[1-9A-HJ-NP-Za-km-z]+$/.test(
                      //   address
                      // );
                      // return isValidLength && hasValidChars;
                    } catch {
                      return false;
                    }
                  case 'BTC':
                    return validate(address);
                  case 'ADA':
                    return WAValidator.validate(address, 'ada');
                  default:
                    return true;
                }
              };

              if (!isValidAddress()) {
                return messageApi.error(
                  `Please provide a valid ${selectedChain.chainName} address.`
                );
              }

              await handleSubmit();
            }}
          >
            {' '}
            <ButtonComp
              text={
                state
                  ? state.index >= 0
                    ? 'Edit Contact'
                    : 'Confirm'
                  : 'Confirm'
              }
              maxWidth={'352px'}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AddContact;
