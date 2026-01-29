import React, { useEffect, useState } from 'react';
import './Nft.scss';
import { server } from '../../server';
import { useSelector } from 'react-redux';
import useCurrentHeight from '../../CustomHooks/useCurrentHeight';
import './Nft.scss';
import nft1 from '../../Assets/NftImages/emptyNft.png';
import Lottie from 'react-lottie-player';
import NftJson from '../../Assets/JsonFiles/nft-monkey.json';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { useNavigate } from 'react-router-dom';
import { store } from '../..';
import { setImage } from '../../actions/image';
import { setNfts } from '../../actions/nfts';

function NFTappear() {
  const { account } = useSelector((state) => state);
  const { nfts } = useSelector((state) => state);
  // console.log(
  //   'account.coinFamilyAndAddress[1]::',
  //   account.coinFamilyAndAddress[1],
  //   'account.coinFamilyAndAddress[3]::',
  //   account.coinFamilyAndAddress[3]
  // );
  const init = async (refresh) => {
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
    // console.log('GET NFT API RESPONSE:::', walletsList);
    store.dispatch(setNfts(walletsList.data.data));
  };

  //in your component
  function addDefaultSrc(ev) {
    ev.target.src = nft1;
  }

  const renderNfts = () => {
    return nfts.map((nft) => {
      return (
        <div>
          <img
            src={nft.image || nft1}
            alt='nftData'
            onError={addDefaultSrc}
            onClick={() => {
              store.dispatch(setImage(nft.image || null));
              navigate('/nftDetail', {
                state: {
                  detail: nft,
                },
              });
            }}
          />
        </div>
      );
    });
  };

  useEffect(() => {
    init();
  }, []);

  const height = useCurrentHeight();
  const navigate = useNavigate();
  return (
    <div className='wallet'>
      {nfts.length === 0 ? (
        <>
          {' '}
          <div
            className={`${'wallet__tableOuter'} ${
              height <= 600 ? 'wallet__tabelOuterExt' : ''
            }`}
          >
            <div className='nftlottie'>
              <h2>NFTs will appear here</h2>
              <div className='nftJson'>
                <Lottie
                  loop
                  animationData={NftJson}
                  play
                  style={{ height: 182 }}
                />
              </div>
            </div>
          </div>
          <ButtonComp
            onClick={() => {
              navigate('/receive-tokens', {
                state: {
                  nft: true,
                },
              });
            }}
            text={'Receive'}
            maxWidth={'100%'}
            marginTop={'10px'}
          />{' '}
        </>
      ) : (
        <>
          <div
            className={`${'nftImgesScrool'} ${
              height <= 600 ? 'nftImgesScroolExt' : ''
            }`}
          >
            <div
              className='nftImages'
              style={{ columns: '2 155px', columnGap: '10px', rowGap: '10px' }}
            >
              {renderNfts()}
            </div>
          </div>
          <ButtonComp
            onClick={() => {
              navigate('/receive-tokens', {
                state: {
                  nft: true,
                },
              });
            }}
            text={'Receive'}
            maxWidth={'100%'}
            marginTop={'10px'}
          />{' '}
        </>
      )}
    </div>
  );
}

export default NFTappear;
