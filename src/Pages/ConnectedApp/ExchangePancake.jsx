/*global chrome*/

import React from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import Btc from '../../Assets/Coins/BTC.png';
import MyWallet from '../../Assets/myWallet.svg';

import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'moment';

function startsWithSlash(str) {
  return str.startsWith('/');
}

const ExchangePancake = () => {
  const { state } = useLocation();

  function addDefaultSrc(ev) {
    ev.target.src = MyWallet;
  }

  const { account } = useSelector((state) => state);
  const navigate = useNavigate();
  return (
    <div className={`scrollableCont`}>
      <MenuRestofHeaders
        backTo={'/conectswapedApp'}
        title={state.connection.title}
      />
      <div className={`flexedContent`}>
        <div className='exchangePancake'>
          <div className='topConatct'>
            <img
              src={`${state.connection.url}${
                startsWithSlash(state.connection?.image)
                  ? `${state.connection.image}`
                  : `/${state.connection.image}`
              }`}
              style={{ height: '40px', width: '40px', objectFit: 'contain' }}
              onError={addDefaultSrc}
            />
            <h2>{state.connection.title}</h2>
            <p>{state.connection.url}</p>
          </div>
          <div className='connectesApp'>
            <div className='left'>
              <div className='textSec'>
                <h3>Wallet Connected</h3>
              </div>
            </div>
            <div className='ryt'>
              <p>
                {' '}
                {account.address.substring(0, 7)}.....
                {account.address.substring(
                  account.address.length - 7,
                  account.address.length
                )}
              </p>
            </div>
          </div>
          <div className='connectesApp'>
            <div className='left'>
              <div className='textSec'>
                <h3>First Connected</h3>
              </div>
            </div>
            <div className='ryt'>
              <p>
                {moment(state.connection.time).format('MM/DD/YYYY hh:mm a')}
              </p>
            </div>
          </div>
        </div>
        <ButtonComp
          text={'Revoke Access'}
          // maxWidth={'100%'}
          marginTop={'20px'}
          onClick={async () => {
            const { connectedDapps } = await chrome.storage.session.get(
              'connectedDapps'
            );

            const finalList = connectedDapps.filter(
              (el) => el.url != state.connection.url
            );
            // console.log(
            //   '🚀 ~ file: ExchangePancake.jsx:73 ~ onClick={ ~ finalList:',
            //   finalList
            // );

            await chrome.storage.session.set({
              connectedDapps: finalList,
            });

            navigate('/conectswapedApp');
          }}
        />
      </div>
    </div>
  );
};

export default ExchangePancake;
