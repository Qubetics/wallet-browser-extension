import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { store } from '../..';
import { setNFTbackData } from '../../actions/setNFTBackData';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import './Nft.scss';
import Copy from '../../Assets/CopyIconBlue.svg';
import { message } from 'antd';
import { useSelector } from 'react-redux';

function NftDetail() {
  const navigate = useNavigate();
  const { account } = useSelector((state) => state);
  const {
    state: { detail },
  } = useLocation();

  const [messageApi, contextHolder] = message.useMessage();

  return (
    <div className='nfDetail'>
      {contextHolder}
      <div className='tokenNft'>
        <h2 style={{ textAlign: 'left' }}>{detail.nft_coin_data.coin_name}</h2>
        <h3>Token</h3>
        <div className='card_name'>
          <table>
            <tr>
              <td className='left'>Coin Symbol</td>
              <td className='right'>
                {detail?.nft_coin_data?.coin_symbol?.toUpperCase()}
              </td>
            </tr>
            <tr>
              <td className='left'>Contract Address</td>
              <td
                className='right'
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <div>
                  {detail.token_address.substring(0, 7)}.....
                  {detail.token_address.substring(
                    detail.token_address.length - 7,
                    detail.token_address.length
                  )}
                </div>
                <img
                  src={Copy}
                  alt=''
                  width={15}
                  height={16}
                  style={{ marginLeft: '8px' }}
                  onClick={async () => {
                    await navigator.clipboard.writeText(detail.token_address);
                    messageApi.success('Contract address copied.');
                  }}
                />
              </td>
            </tr>
            <tr>
              <td className='left'>Token Id</td>
              <td className='right'>{detail.token_id}</td>
            </tr>
            <tr>
              <td className='left'> Standard</td>
              <td className='right'>{detail.token_type}</td>
            </tr>
            <tr>
              <td className='left'> Network</td>
              <td className='right'>
                {detail.coin_family == 1 ? 'Ethereum' : 'BNB Smart Chain'}
              </td>
            </tr>
          </table>
        </div>
      </div>
      {account.isWatchOnly ? null : (
        <ButtonComp
          onClick={() => {
            store.dispatch(setNFTbackData({ detail }));
            navigate('/nftAddress', {
              state: {
                detail,
              },
            });
          }}
          text={'Send'}
          maxWidth={'100%'}
          marginTop={'10px'}
        />
      )}
    </div>
  );
}

export default NftDetail;
