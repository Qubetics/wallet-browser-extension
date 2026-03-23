/*global chrome*/

import { Layout } from 'antd';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import BalanceDetails from '../Components/BalanceDetails/BalanceDetails';
import MenuRestofHeaders from '../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import MenuFooter from '../Components/MenuFooter/MenuFooter';
import darkWallet from '../Assets/darkWallet.svg';
import './style.scss';
import walletIcon from '../Assets/walletIcon.svg';
import { useSelector } from 'react-redux';
import { store } from '..';
import { setCreate } from '../actions/create';
import DarkEyeOpen from '../Assets/DarkEyeOpen.svg';
import OpenLight from '../Assets/open-light.png';
import DarkCloseLight from '../Assets/DarkCloseLight.svg';
import CloseLight from '../Assets/close-light.png';
import { setBalanceOfOut } from '../actions/balance-off-out';
import useCurrentHeight from '../CustomHooks/useCurrentHeight';
import { swapDetailAc } from '../actions/swap';

function FixWidthLayout() {
  const { balance, currency, theme, balanceOut, spritzBank, coin, swapDetail } =
    useSelector((state) => state);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const { Content } = Layout;
  const getLocation = useLocation();
  const { state } = useLocation();

  const path = getLocation.pathname.replace('/', '');
  const hideFooterRoutes = new Set([]);
  const historyTabParam = parseInt(new URLSearchParams(getLocation.search).get('tab') || '0');
  const navigate = useNavigate();
  const height = useCurrentHeight();

  if (getLocation?.pathname == '/wallet' && swapDetail) {
    store.dispatch(swapDetailAc(null));
  }

  const getSidePanelStatus = async () => {
    const isSidePanelOpen = await chrome.storage.local.get('openSidePanel');
    setIsSidePanelOpen(isSidePanelOpen.openSidePanel);
  };

  useEffect(() => {
    getSidePanelStatus();
  }, [isSidePanelOpen]);
  const balanceLength = balance.toString().length;
  // console.log("getLocation?.pathname ===XXXXXXXXXXX  ", getLocation?.pathname);
  return (
    <div className="fixedLayout">
      <div
        className={`${'fixedLayout__inner'} ${
          height <= 600 ? 'fixedLayout__heightExt' : ''
        } ${path !== 'wallet' ? 'fixedLayout__innerBgChange' : ''}`}
        style={
          !isSidePanelOpen
            ? {
                maxHeight: '746px',
                maxWidth: '400px',
              }
            : {
                maxWidth: '600px',
                minWidth: '360px',
              }
        }
      >
        {path === 'wallet' && (
          <div className="fixedLayout__inner__walletLayout">
            <div className="decoratedBg" style={{ textAlign: 'left' }}>
              {/* <img src={LogoHorizontal} width={155} height={20} /> */}
              <BalanceDetails coin={false} />
            </div>
          </div>
        )}
        {/* {path === "defi" && (
         <MenuRestofHeaders backTo={"/"} title={"DeFi"} />
        )} */}
        {path === 'history' && (
          <MenuRestofHeaders
            backTo={
              getLocation?.state?.path === '/wallet' ? '/wallet' : '/setting'
            }
            title={'History'}
            FilterIcon={historyTabParam === 0 ? '/filter-history' : undefined}
            path={state?.path ?? ''}
          />
        )}
        {path === 'changePin' && (
          <MenuRestofHeaders backTo={'/setting'} title={'Reset Password'} />
        )}
        {path === 'setting' && <MenuRestofHeaders title={'Settings'} />}
        {/* {path === "emailAddress" && <MenuRestofHeaders title={"Banking"} />} */}
        {path === "apiKey" && <MenuRestofHeaders backTo={"/emailAddress"} />}
        {path === "withdraw" && (
          <MenuRestofHeaders AddAccount title={"Qubetics"} logout />
        )}
        {path === 'bankAccountListing' && !state?.fromBillPay && (
          <MenuRestofHeaders
            backTo={'/enter-price-spritz'}
            // backTo={"/bankAccount"}
            title={'Bank Accounts'}
            coin={state?.coin}
            account={state?.account}
            backAmount={state?.amount}
            // addIcon={"/billbankaccount"}
          />
        )}

        {/* *********************Changes************************ */}
        {path === 'bankAccountListing' && state?.fromBillPay && (
          <MenuRestofHeaders
            backTo={'/withdraw'}
            // backTo={"/bankAccount"}
            title={'Bank Accounts'}
            // coin={state?.coin}
            // account={state?.account}
            // backAmount={state?.amount}
            addIcon={'/billbankaccount'}
          />
        )}

        {/* {path === "billbankaccount" && state?.fromBankList && ( */}
        {path === 'billbankaccount' && (
          <MenuRestofHeaders
            backTo={'/bankAccountListing'}
            // backTo={"/bankAccount"}
            title={'Bank Accounts'}
            // coin={state?.coin}
            // account={state?.account}
            // backAmount={state?.amount}
            // addIcon={"/billbankaccount"}
          />
        )}

        {/* state.fromBillPay ? "/withdraw" */}
        {path === 'bankAccount' && (
          <MenuRestofHeaders
            backTo={spritzBank.length === 0 ? '/kyc' : '/withdraw'}
            title={'Bank Account'}
          />
        )}
        {/* {path === "billbankaccount" && (
          <MenuRestofHeaders backTo={"/withdraw"} title={"Bank Account"} />
        )} */}
        {path === 'editBankAccount' && (
          <MenuRestofHeaders backTo={'/withdraw'} title={'Edit Account'} />
        )}
        {path === 'editBill' && (
          <MenuRestofHeaders backTo={'/withdraw'} title={'Edit Bill'} />
        )}
        {path === 'detail-spritz' && (
          <MenuRestofHeaders
            backTo={'/history-spritz'}
            title={'Transaction Detail'}
          />
        )}
        {path === 'detail-billPay-spritz' && (
          <MenuRestofHeaders
            backTo={'/billPay-history-spritz'}
            title={'Transaction Detail'}
          />
        )}
        {path === 'filter-spritz' && (
          <MenuRestofHeaders
            backTo={'/history-spritz'}
            title={'Filter'}
            filterValue={state?.filterValue}
          />
        )}
        {path === 'history-spritz' && (
          <MenuRestofHeaders
            backTo={'/withdraw'}
            title={'History'}
            FilterIcon={'/filter-spritz'}
            filterValue={state?.filterValue}
          />
        )}
        {/* ********** change************** */}
        {path === 'billpay-filter-spritz' && (
          <MenuRestofHeaders
            backTo={'/billPay-history-spritz'}
            title={'Filter'}
            filterValue={state?.filterValue}
          />
        )}
        {path === 'billPay-history-spritz' && (
          <MenuRestofHeaders
            backTo={'/withdraw'}
            title={'History'}
            FilterIcon={'/billpay-filter-spritz'}
            filterValue={state?.filterValue}
          />
        )}
        {/* ********** change End************** */}
        {path === 'kyc' && <MenuRestofHeaders logout />}
        {path === 'alerts' && (
          <MenuRestofHeaders addIcon={'/add-pa'} title={'Price Alerts'} />
        )}
        {path === 'walletListing' && (
          <div className="walletListingMain">
            <div className="walletListing">
              <div
                className="walletListing__listingHeader"
                style={{ position: 'relative' }}
              >
                {isSidePanelOpen ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="21"
                    height="21"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      position: 'absolute',
                      right: '25px',
                      top: '15px',
                      cursor: 'pointer',
                    }}
                    onClick={async () => {
                      chrome.runtime.sendMessage({
                        type: 'CLOSE_SIDE_PANEL',
                      });
                      await chrome.storage.local.set({ openSidePanel: false });
                      setIsSidePanelOpen(false);
                      window.close();
                    }}
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {' '}
                      <path
                        d="M14 10L21 3M21 3H16.5M21 3V7.5M10 14L3 21M3 21H7.5M3 21L3 16.5"
                        stroke="#fff"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>{' '}
                    </g>
                  </svg>
                ) : (
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      position: 'absolute',
                      right: '25px',
                      top: '15px',
                      cursor: 'pointer',
                    }}
                    onClick={async () => {
                      chrome.runtime.sendMessage({
                        type: 'OPEN_SIDE_PANEL',
                      });
                      let queryOptions = {
                        active: true,
                        lastFocusedWindow: true,
                      };
                      let [tab] = await chrome.tabs.query(queryOptions);
                      chrome.sidePanel.open({ windowId: tab.windowId });
                      await chrome.storage.local.set({ openSidePanel: true });
                      setIsSidePanelOpen(true);
                      window.close();
                    }}
                  >
                    <path
                      d="M10 2V14M12.6667 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V3.33333C14 2.97971 13.8595 2.64057 13.6095 2.39052C13.3594 2.14048 13.0203 2 12.6667 2Z"
                      stroke="#fff"
                      stroke-width="1.33333"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                )}
                <h2>My Wallets</h2>
              </div>
              <div className="walletListing__addWallet">
                <button
                  onClick={() => {
                    store.dispatch(setCreate(true));
                    navigate('/add-wallet');
                  }}
                >
                  {theme == 'darkTheme' ? (
                    <img src={darkWallet} />
                  ) : (
                    <img src={walletIcon} />
                  )}{' '}
                  Add Wallet
                </button>
                <div
                  className="walletListing__walletPrice"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {balanceOut ? (
                    <h3 style={{ fontSize: balanceLength > 6 ? 20 : 26 }}>
                      {currency.symbol}
                      {balance}
                    </h3>
                  ) : (
                    <h3>****</h3>
                  )}

                  {balanceOut ? (
                    <img
                      src={theme === 'darkTheme' ? DarkEyeOpen : OpenLight}
                      alt=""
                      onClick={async () => {
                        await chrome.storage.local.set({
                          balanceOut: false,
                        });
                        store.dispatch(setBalanceOfOut(false));
                      }}
                      style={{
                        width: '21px',
                        marginLeft: '6px',
                      }}
                    />
                  ) : (
                    <img
                      src={theme === 'darkTheme' ? DarkCloseLight : CloseLight}
                      alt=""
                      onClick={async () => {
                        await chrome.storage.local.set({
                          balanceOut: true,
                        });
                        store.dispatch(setBalanceOfOut(true));
                      }}
                      style={{
                        width: '21px',
                        marginLeft: '18px',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {path === 'conectswapedApp' && (
          <MenuRestofHeaders backTo={'/wallet'} title={'dApp'} />
        )}
        <Content
          className={`fixedLayout__content  ${
            path === 'withdraw' ? 'payWithdraw' : ''
          }`}
        >
          <Outlet />
        </Content>
        {!hideFooterRoutes.has(path) && <MenuFooter />}
      </div>
    </div>
  );
}

export default FixWidthLayout;
