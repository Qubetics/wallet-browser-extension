import React, { useCallback, useEffect, useState } from 'react';
import './footer.scss';
import WalletIcon from '../../Assets/walletIcon.svg';
import DefiIcon from '../../Assets/DefiIcon.svg';
import AlertIcon from '../../Assets/Alerts.svg';
import SettignIcon from '../../Assets/SettignIcon.svg';
import Spritz from '../../Assets/spritz.svg';
import HistoryIcon from '../../Assets/HistoryIcon.svg';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Browser from '../../Assets/broswer.svg';
import { DURATION } from '../../config/message.config';
import { message } from 'antd';
import { server } from '../../server';
import ModalCustom from '../ModalCustom/ModalCustom';

function MenuFooter() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  const [watchOnlyW, setWatchOnlyW] = useState(false);
  // const [activeLink, setactiveLink] = useState("wallet");
  const { account, spritz, spritzKyc, spritzBank } = useSelector(
    (state) => state
  );
  const [spritzM, setSpritzM] = useState({
    type: 'spritz',
    is_maintenance: 1,
  });

  const getLocation = useLocation();
  const path = getLocation.pathname.replace('/', '');

  // useEffect(() => {
  //   checkMaintanance();
  // }, []);

  // const checkMaintanance = async () => {
  //   const { data } = await server.get("/wallet/check_app_maintenance", {
  //     headers: {
  //       Authorization: account.jwtToken,
  //     },
  //   });
  //   console.log("BUYSELL MAINTANANCE ", data);

  //   let resp = data.filter((data) => data?.type == "spritz");
  //   if (resp.length > 0) {
  //     // setSpritzM(buySellCheck[0]);
  //   }
  // };

  // const throttle = (func, limit) => {
  //   let inThrottle = false;
  //   return (...args) => {
  //     if (!inThrottle) {
  //       func(...args);
  //       inThrottle = true;
  //       setTimeout(() => (inThrottle = false), limit);
  //     }
  //   };
  // };

  // const clickSpritz = async () => {
  //   console.log("COMEEEEEEEEEEE");
  //   const { data } = await server.get("/wallet/check_app_maintenance", {
  //     headers: {
  //       Authorization: account.jwtToken,
  //     },
  //   });
  //   console.log("BUYSELL MAINTANANCE ", data, data?.data);

  //   let resp = data?.data.filter((data) => data?.type == "spritz");
  //   console.log("fffffffffffffff ", resp, resp[0]?.is_maintenance);
  //   if (resp.length > 0 && resp[0]?.is_maintenance == 1) {
  //     return messageApi.error("Banking is under maintenance.");
  //   } else {
  //     if (spritz) {
  //       if (spritzKyc?.status !== "ACTIVE") {
  //         return navigate("/kyc");
  //       } else if (spritzBank?.length === 0) {
  //         return navigate("/kyc");
  //       } else {
  //         return navigate("/withdraw");
  //       }
  //     } else {
  //       return navigate("/emailAddress");
  //     }
  //   }
  // };

  // const throttledClick = useCallback(throttle(clickSpritz, 2000), []); // Memoize throttledClick with useCallback

  const clickSpritz = async () => {
    if (account?.isWatchOnly) {
      setWatchOnlyW(true);
      return false;
    }
    const { data } = await server.get('/wallet/check_app_maintenance', {
      headers: {
        Authorization: account.jwtToken,
      },
    });

    let resp = data?.data.filter((data) => data?.type == 'spritz');
    if (resp.length > 0 && resp[0]?.is_maintenance == 1) {
      return messageApi.error('Banking is under maintenance.');
    } else {
      navigate(
        spritz
          ? spritzKyc?.status !== 'ACTIVE'
            ? '/kyc'
            : spritzBank?.length === 0
            ? '/kyc'
            : '/withdraw'
          : '/emailAddress'
      );
    }
  };

  return (
    <>
      <ModalCustom
        handleCancel={() => setWatchOnlyW(false)}
        isModalOpen={watchOnlyW}
        handleOk={() => setWatchOnlyW(false)}
        customClass='customClassModal bankingModal'
        closable={false}
      >
        <div className='balanceDetails__modal'>
          <div className='headerModal'>
            <h2>Qubetics Banking</h2>
          </div>
          <div className='bodyContent'>
            <p
              className='balanceDetails__modal__title'
              style={{ textAlign: 'center' }}
            >
              Please switch to a non watch-only wallet to access the banking
              module.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '30px',
              }}
            >
              <div
                className='green'
                style={{
                  padding: '12px 53px',
                  backgroundColor: '#00adee',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '500',
                  borderRadius: '24px',
                  cursor: 'pointer',
                }}
                onClick={async () => {
                  setWatchOnlyW(false);
                }}
              >
                Ok
              </div>
            </div>
          </div>
        </div>
      </ModalCustom>
      {contextHolder}
      <div className='menuItems'>
        <Link
          to={
            path === 'wallet'
              ? '/walletListing'
              : path === 'walletListing'
              ? '/walletListing'
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
          <span className='menuItems__items__title'>Wallets</span>
        </Link>
        <Link
          // to={
          //    spritz
          //     ? spritzKyc?.status !== "ACTIVE"
          //       ? "/kyc"
          //       : spritzBank?.length === 0
          //       ? "/kyc"
          //       : "/withdraw"
          //     : "/emailAddress"
          // }
          onClick={() =>
            //   // throttle(clickSpritz, 2000)
            clickSpritz()
          }
          // onClick={() => throttledClick()}
          // onClick={() => setactiveLink("defi")}
          className={`${'menuItems__items'} ${
            path === 'kyc' ||
            path === 'emailAddress' ||
            path === 'apiKey' ||
            path === 'withdraw' ||
            path === 'bankAccount'
              ? 'menuItems__items__active'
              : ''
          }`}
        >
          <div className='menuItems__items__img'>
            <img src={Spritz} />
          </div>
          <span className='menuItems__items__title'>Banking</span>
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
          <span
            className='menuItems__items__title'
            style={{
              position: 'relative',
              top: '4px',
            }}
          >
            Connections
          </span>
        </Link>
        <Link
          to='/alerts'
          // onClick={() => setactiveLink("defi")}
          className={`${'menuItems__items'} ${
            path === 'alerts' ? 'menuItems__items__active' : ''
          }`}
        >
          <div className='menuItems__items__img'>
            <img src={AlertIcon} />
          </div>
          <span className='menuItems__items__title'>Alerts</span>
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
          <span className='menuItems__items__title'>Settings</span>
        </Link>
      </div>
    </>
  );
}

export default MenuFooter;
