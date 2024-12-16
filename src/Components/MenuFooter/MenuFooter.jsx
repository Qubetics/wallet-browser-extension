import React from 'react';
import './footer.scss';
import WalletIcon from '../../Assets/walletIcon.svg';
import AlertIcon from '../../Assets/Alerts.svg';
import SettignIcon from '../../Assets/SettignIcon.svg';
import { Link, useLocation } from 'react-router-dom';
import Browser from '../../Assets/broswer.svg';


function MenuFooter() {
  const getLocation = useLocation();
  const path = getLocation.pathname.replace('/', '');

  return (
    <>
      <div className='menuItems'>
        <Link
          to={
            path === 'wallet'
              ? '/wallet'
              : path === 'walletListing'
              ? '/wallet'
              : '/wallet'
          }
          // onClick={() => setactiveLink("wallet")}
          className={`${'menuItems__items'} ${
            path === 'wallet' ? 'menuItems__items__active' : ''
          }`}
        >
          <div className='menuItems__items__img'>
            <img src={WalletIcon} />
          </div>
          {/* <span className='menuItems__items__title'>Wallets</span> */}
        </Link>
        <Link
          to='/conectswapedApp'
          // onClick={() => setactiveLink("defi")}
          className={`${'menuItems__items'} ${
            path === 'conectswapedApp' ? 'menuItems__items__active' : ''
          }`}
        >
          <div className='menuItems__items__img'>
            <img src={Browser} />
          </div>
          {/* <span
            className='menuItems__items__title'
            style={{
              position: 'relative',
              top: '4px',
            }}
          >
            DApp
          </span> */}
        </Link>

        <Link
          to='/portfolio'
          // onClick={() => setactiveLink("setting")}
          className={`${'menuItems__items'} ${
            path === 'portfolio' ? 'menuItems__items__active' : ''
          }`}
        >
          <div className='menuItems__items__img'>
            <img src={SettignIcon} />
          </div>
          {/* <span className='menuItems__items__title'>Portfolio</span> */}
        </Link>
        
        <Link
          to='/swap'
          // onClick={() => setactiveLink("defi")}
          className={`${'menuItems__items'} ${
            path === 'swap' ? 'menuItems__items__active' : ''
          }`}
        >
          <div className='menuItems__items__img'>
            <img src={AlertIcon} />
          </div>
          {/* <span className='menuItems__items__title'>Swap</span> */}
        </Link>
        <Link
          to='/setting'
          // onClick={() => setactiveLink("setting")}
          className={`${'menuItems__items'} ${
            path === 'setting' ? 'menuItems__items__active' : ''
          }`}
        >
          <div className='menuItems__items__img'>
            <img src={SettignIcon} />
          </div>
          {/* <span className='menuItems__items__title'>Settings</span> */}
        </Link> 
      </div>
    </>
  );
}

export default MenuFooter;
