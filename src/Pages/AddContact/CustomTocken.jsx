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
import { validate, getAddressInfo } from 'bitcoin-address-validation';
import { server } from '../../server';
import { store } from '../..';
import { setLoading } from '../../actions/loading';

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

  const selectAfterTo = (
    <div className={'addonAfter'}>
      <Select
        placement='bottomRight'
        popupClassName='placementRightPopup'
        options={chains.map((myChain) => {
          return {
            value: myChain.coinFamily,
            label: (
              <span
                className='flexedItemSelect'
                style={{
                  textAlign: 'center',
                }}
              >
                <img src={myChain.image} className={style.chainImage} alt='' />
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
                className='flexedItemSelect'
                style={{
                  textAlign: 'center',
                }}
              >
                <img src={chain.image} className={style.chainImage} alt='' />
                {chain.currencySymbol}
              </span>
            ),
          },
        ]}
        onChange={(value) => {
          const selectedChain = chains.find((el) => el.coinFamily == value);
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
  };

  useEffect(() => {
    init();
  }, []);

  const handleSubmit = async () => {
    try {
      // wallet_address: account.coinFamilyAndAddress[1] 

      console.log('selectedChainselectedChain ', selectedChain);
      
      store.dispatch(setLoading(true));
      const parentCoin = await server.post(
        // '/wallet/coin/coins_market_data',
        "/user/add_address_book",
        { 
          "address": account?.coinFamilyAndAddress[selectedChain?.coinFamily], 
          "wallet_name": name, 
          "contact_name": selectedChain?.chainName, 
          "coin_family": selectedChain?.coinFamily, 
          "wallet_address": address
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
      return messageApi.error(error.response.message);
    }
  };

  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={'/address-book'}
        coin={state?.coin}
        redirectTo={state?.redirectTo}
        title={'Address Book'}
      />
      <div className={`flexedContent`}>
        <div className={style.token}>
          <InputField
            placeholder={selectedChain.chainName}
            label='Network'
            readonly={true}
            addonAfter={selectAfterTo}
          />
          <InputFieldOnly
            placeholder='Enter Address Name'
            label='Address Name'
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
            placeholder='Wallet Address'
            label='Address or Naming Service'
            getData={(address) => {
              setAddress(address);
            }}
            value={address}
            checkForSymbols={true}
            addonAfter={
              <div className={style.token__selectStyle}>
                <span
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
            to='/manage'
            onClick={async (e) => {
              e.preventDefault();

              if (!address) {
                return messageApi.error('Address for the contact is required.');
              }

              if (!name) {
                return messageApi.error('Name for the contact is required.');
              }

              if (name.trim().length === 0) {
                return messageApi.error(
                  'Name should have a minimum of 2 characters.'
                );
              }

              if (name.length < 2) {
                return messageApi.error(
                  'Name should have a minimum of 2 characters.'
                );
              }

              if (name.length > 25) {
                return messageApi.error(
                  'Name should not have more than 25 characters.'
                );
              }

              // const format = /[!@#$%^`&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

              // if (format.test(name)) {
              //   return messageApi.error(
              //     "Name should not contain any special characters."
              //   );
              // }

              if (selectedChain.isEVM) {
                const valid = ethers.utils.isAddress(address);
                if (!valid)
                  return messageApi.error(
                    `Please provide a valid ${selectedChain.chainName} address.`
                  );
              } else if (
                !selectedChain.isEVM &&
                selectedChain.currencyName === 'SOL'
              ) {
                const regexPattern = /^([1-9A-HJ-NP-Za-km-z]{32,44})$/;
                if (!regexPattern.test(address)) {
                  return messageApi.error(
                    `Please provide a valid ${selectedChain.chainName} address.`
                  );
                }
              } else if (
                !selectedChain.isEVM &&
                selectedChain.currencyName === 'BTC'
              ) {
                const valid = validate(address);
                if (!valid) {
                  return messageApi.error(
                    `Please provide a valid ${selectedChain.chainName} address.`
                  );
                }
              } else if (
                !selectedChain.isEVM &&
                selectedChain.currencyName === 'ADA'
              ) {
                const valid = WAValidator.validate(address, 'ada');
                if (!valid) {
                  return messageApi.error(
                    `Please provide a valid ${selectedChain.chainName} address.`
                  );
                }
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
              maxWidth={'100%'}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AddContact;
