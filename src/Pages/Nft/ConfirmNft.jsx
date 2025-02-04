/*global chrome*/

import { message } from 'antd';
import BigNumber from 'bignumber.js';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { setNfts } from '../../actions/nfts';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import InputFieldSimple from '../../Components/InputField/InputFieldSimple';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import {
  addCommasToNumber,
  getFlooredFixed,
} from '../../helpers/conversion.helper';
import { Web3Helper } from '../../helpers/web3.helper';
import { server } from '../../server';
import './Nft.scss';

function ConfirmNft() {
  const { currency, account } = useSelector((state) => state);

  const [sessionPassword, setPassword] = useState(null);
  const [isModalOpen, setOpenmodal] = useState(false);

  const {
    state: { detail, toAddress, fromAddress, networkFee, ENSName, contact },
  } = useLocation();

  const navigate = useNavigate();

  const handleOk = () => {
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
    setPassword(null);
  };

  const [fiatGasFee, setFiatGasFee] = useState(0);
  const [parentCoin, setParentCoin] = useState(null);
  const [toName, setToName] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const init = async () => {
    store.dispatch(setLoading(true));

    const parentCoin = await server.post(
      '/wallet/coin/coins_market_data',
      {
        coin_family: detail.coin_family,
        fiat_currency: currency.name,
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    setParentCoin(parentCoin.data.data);
    const feePrice = parentCoin.data.data.coins_market;

    if (feePrice) {
      const value = parseFloat(networkFee) * parseFloat(feePrice.current_price);
      setFiatGasFee(value);
    }
    setToName(contact);
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTransaction = async () => {
    store.dispatch(setLoading(true));

    const { data } = await server.post(
      '/wallet/get_coin_balances',
      {
        wallet_address: fromAddress,
        coin_family: detail.coin_family,
        fiat_currency: currency.name,
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    const balance = new BigNumber(data.data.balance);
    const fee = new BigNumber(networkFee);

    if (fee.isGreaterThan(balance)) {
      store.dispatch(setLoading(false));
      setOpenmodal(false);
      return messageApi.error(
        'Insufficient balance to proceed with the transaction.'
      );
    }

    if (detail.token_type == 'ERC721') {
      const response =
        await Web3Helper.generateRawTransactionForNFTAndBroadcast(
          toAddress,
          fromAddress,
          1,
          detail.nft_coin_data.id,
          0,
          currency.name,
          toName,
          detail.coin_family == 1 ? 'eth' : 'bnb',
          detail.coin_family == 1 ? 1 : 56,
          detail.token_address,
          detail.token_type,
          null,
          'WITHDRAW',
          detail.token_id
        );
      if (!response) {
        store.dispatch(setLoading(false));
        return messageApi.error(
          'Insufficient balance to proceed with transaction.'
        );
      }
    } else {
      const response =
        await Web3Helper.generateRawTransactionFor1155AndBroadcast(
          toAddress,
          fromAddress,
          detail.amount,
          detail.nft_coin_data.id,
          0,
          currency.name,
          toName,
          detail.coin_family == 1 ? 'eth' : 'bnb',
          detail.coin_family == 1 ? 1 : 56,
          detail.token_address,
          detail.token_type,
          null,
          'WITHDRAW',
          detail.token_id
        );

      if (!response) {
        store.dispatch(setLoading(false));
        return messageApi.error(
          'Insufficient balance to proceed with transaction.'
        );
      }
    }

    const walletsList = await server.post(
      `/wallet/nft/from_moalis`,
      {
        address_list: [
          {
            coin_symbol: 'eth',
            coin_family: '1',
            wallet_address: account.coinFamilyAndAddress[1],
          },
          {
            coin_symbol: 'bnb',
            coin_family: '3',
            wallet_address: account.coinFamilyAndAddress[3],
          },
        ],
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    store.dispatch(setNfts(walletsList.data.data));

    store.dispatch(setLoading(false));
    navigate('/history');
  };

  return (
    <>
      <div className='tokenNft nfDetail'>
        {contextHolder}
        <div className='card_name'>
          <table>
            <tr>
              <td className='left'>Name</td>
              <td className='right'>{detail.nft_coin_data.coin_name}</td>
            </tr>
            <tr>
              <td className='left'>From</td>
              <td className='right'>
                {fromAddress.substring(0, 7)}.....
                {fromAddress.substring(
                  fromAddress.length - 7,
                  fromAddress.length
                )}
              </td>
            </tr>
            <tr>
              <td className='left'>To</td>
              <td className='right'>
                {toName
                  ? toName
                  : ENSName
                  ? ENSName
                  : `${toAddress.substring(0, 7)}.....${toAddress.substring(
                      toAddress.length - 7,
                      toAddress.length
                    )}`}
              </td>
            </tr>
            <tr>
              <td className='left'>Network Fee</td>
              <td className='right'>{`${parseFloat(
                getFlooredFixed(networkFee, 8)
              )} ${parentCoin ? parentCoin.coin_symbol.toUpperCase() : ''}/ ${
                currency.symbol
              }${addCommasToNumber(
                parseFloat(getFlooredFixed(fiatGasFee, 2))
              )}`}</td>
            </tr>
          </table>
          <div className='border1'></div>
          <table>
            <tr>
              <td className='left'>Max Total</td>
              <td className='right'>{`${parseFloat(
                getFlooredFixed(networkFee, 8)
              )} ${parentCoin ? parentCoin.coin_symbol.toUpperCase() : ''}/ ${
                currency.symbol
              }${addCommasToNumber(
                parseFloat(getFlooredFixed(fiatGasFee, 2))
              )}`}</td>
            </tr>
          </table>
        </div>
        <ButtonComp
          onClick={async () => {
            setOpenmodal(true);
          }}
          text={'Confirm'}
          maxWidth={'100%'}
          marginTop={'10px'}
        />
      </div>
      <ModalCustom
        title={'Enter password'}
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        customClass='customClassModal'
      >
        <div className='viewphrases'>
          <InputFieldSimple
            placeholder='Password'
            getData={setPassword}
            value={sessionPassword}
            customFunction={async () => {
              const { password } = await chrome.storage.session.get('password');

              if (sessionPassword !== password) {
                return messageApi.error('Incorrect password provided.');
              }

              handleTransaction();
            }}
          />
          <div style={{ marginTop: '15px' }}>
            <ButtonComp
              text={'Proceed'}
              maxWidth={'100%'}
              onClick={async () => {
                const { password } = await chrome.storage.session.get(
                  'password'
                );

                if (sessionPassword !== password) {
                  return messageApi.error('Incorrect password provided.');
                }

                handleTransaction();
              }}
            />
          </div>
        </div>
      </ModalCustom>
    </>
  );
}

export default ConfirmNft;
