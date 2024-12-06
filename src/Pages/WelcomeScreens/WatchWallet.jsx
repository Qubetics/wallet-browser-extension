/*global chrome*/
import React, { useEffect, useState } from 'react';
import './Welcome.scss';
import SettingList from '../../Components/SettingList/SettingList.jsx';
import BTC from '../../Assets/Coins/BTC.png';
import ETH from '../../Assets/Coins/ETH.png';
import ADA from '../../Assets/Coins/ADA.png';
import BSC from '../../Assets/Coins/BSC.png';
import Solana from '../../Assets/Coins/solana.png';
import Polygon from '../../Assets/Coins/polygon.png';
import Avilanche from '../../Assets/Coins/avilanche.png';
import Cronos from '../../Assets/Coins/cronos.png';
import DarkBackArrowIcon from '../../Assets/DarkBackArrowIcon.svg';
import BackArrowIcon from '../../Assets/BackArrowIcon.svg';
import { Link } from 'react-router-dom';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { useSelector } from 'react-redux';
function WatchWallet() {
  const [chains, setChains] = useState([]);

  const { create } = useSelector((state) => state);
  const { theme } = useSelector((state) => state);
  const init = async () => {
    store.dispatch(setLoading(true));
    const { chains } = await chrome.storage.local.get('chains');
    const data = chains.map((chain) => {
      return {
        setinglist: chain.chainName,
        to: !create ? '/watch-password' : '/address',
        chainId: chain.chainId,
        ticketcheck: chain.image,
      };
    });
    setChains(data);
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <>
      <div className='cardWhite'>
        <h2
          className='cardWhite__title'
          style={{
            // display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            to={create ? '/wallet' : '/'}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {theme == 'darkTheme' ? (
              <img src={DarkBackArrowIcon} width={10} height={'100%'} />
            ) : (
              <img src={BackArrowIcon} width={10} height={'100%'} />
            )}
          </Link>
          <span>Select Chain</span>
          <p style={{fontSize:"20px"}}>You Can Add More Chains Later</p>
          <div></div>
        </h2>
        {/* <p className="cardWhite__subTitle">
          You can simply identify multiple wallets and label your own wallet.
        </p> */}
        <div className='cardWhite__linkOuter'>
          {chains.map((data) => (
            <SettingList
              setinglist={data.setinglist}
              to={data.to}
              ticketcheck={data.ticketcheck}
              chainId={data.chainId}
              onClick={data.onClick}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default WatchWallet;
