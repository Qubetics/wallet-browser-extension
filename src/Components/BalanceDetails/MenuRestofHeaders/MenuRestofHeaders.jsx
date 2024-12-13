/*global chrome*/
import React, { useState } from 'react';
import './MenuRestofHeaders.scss';
import BackArrowIcon from '../../../Assets/BackArrowIcon.svg';
import DarkBackArrowIcon from '../../../Assets/DarkBackArrowIcon.svg';
import SearchIcon from '../../../Assets/SearchIcon.svg';
import DarkPlusBordredIcon from '../../../Assets/DarkPlusBordredIcon.svg';
import DarkChartIcon from '../../../Assets/DarkChartIcon.svg';
import DarkFilterIcon from '../../../Assets/DarkFilterIcon.svg';
import DarkSettignIcon from '../../../Assets/DarkSettignIcon.svg';
import DarkSearchIcon from '../../../Assets/DarkSearchIcon.svg';
import DarkLogout from '../../../Assets/settings/darkLogout.svg';
import LogoutIcon from '../../../Assets/settings/logout.svg';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SettignIcon from '../../../Assets/SettignIcon.svg';
import Filtericon from '../../../Assets/Filtericon.svg';
import ChartIcon from '../../../Assets/ChartIcon.svg';
import Add from '../../../Assets/PlusBordredIcon2.svg';
import { useSelector } from 'react-redux';
import Manage from '../../../Assets/twoLine.svg';
import LightManage from '../../../Assets/light-manage.svg';
import UploadAcc from '../../../Assets/uploadAcc.svg';
import darkclose from '../../../Assets/darkclose.svg';
import ModalCloseIcon from '../../../Assets/ModalCloseIcon.svg';
import BackImg from '../../../Assets/backImg.svg';
import { Drawer } from 'antd';
import ButtonCompGray from '../../ButtonCompGray/ButtonCompGray';
import { store } from '../../..';
import { setCreate } from '../../../actions/create';
import {
  spritzAccounts,
  spritzKyc,
  spritzLogin,
} from '../../../actions/spritz';
import ModalCustom from '../../ModalCustom/ModalCustom';

function MenuRestofHeaders({
  title,
  searchTo,
  backTo,
  settingTo,
  FilterIcon,
  chartIcon,
  addIcon,
  showFun,
  mnemonics,
  coin,
  watch,
  manage,
  redirectTo,
  amount,
  address,
  logout,
  AddAccount,
  mySpritzAccount,
  account,
  backAmount,
  billItem,
  name,
  stared,
}) {
  const { theme, spritzFilter, billPayFilter, spritzTab } = useSelector(
    (state) => state
  );

  const { filter, swapDetail } = useSelector((state) => state);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isModalOpen, setOpenmodal] = useState(false);

  const onClose = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
  };

  const handleOk = () => {
    setOpenmodal(false);
  };

  return (
    <div className=' restOfHeaders stickyHeader'>
      <div className='add_stiky'>
        {backTo && (
          <Link
            to={backTo}
            onClick={async (e) => {
              e.preventDefault();
              if (backTo === '/portfolio') {
                return navigate('/portfolio', {
                  state: {
                    activeTab: 1,
                  },
                });
              }
              if (backTo === '/import-wallet-name') {
                return navigate('/import-wallet-name', {
                  state: {
                    name,
                  },
                });
              }

              if (backTo === '/spritz-tokens') {
                return navigate('/spritz-tokens', {
                  state: {
                    account: mySpritzAccount,
                  },
                });
              }

              if (backTo === '/wallet') {
                if (redirectTo) {
                  return navigate('/wallet', {
                    state: {
                      showNftTrue: true,
                    },
                  });
                } else {
                  return navigate('/wallet');
                }
              }

              if (backTo === '/currencyDetails') {
                if (coin) {
                  return navigate('/currencyDetails', {
                    state: {
                      coin,
                      image: coin.image,
                      symbol: coin.symbol,
                      type: '',
                    },
                  });
                }
              }

              if (backTo === '/address-book') {
                if (coin) {
                  if (redirectTo === '/nftAddress') {
                    return navigate('/nftAddress', {
                      state: {
                        detail: coin,
                      },
                    });
                  } else {
                    return navigate('/sendCurrency', {
                      state: {
                        coin,
                      },
                    });
                  }
                } else {
                  return navigate('/address-book');
                }
              }

              if (backTo === '/new-name') {
                if (!mnemonics) {
                  if (watch) {
                    return navigate('/new-name', {
                      state: {
                        mnemonics,
                        goTo: '/watch-only-list',
                      },
                    });
                  } else {
                    return navigate('/new-name', {
                      state: {
                        mnemonics,
                        goTo: '/import-phrase',
                      },
                    });
                  }
                } else {
                  return navigate('/new-name', {
                    state: {
                      mnemonics,
                      goTo: '/multiShowSecretPhrase',
                    },
                  });
                }
              }

              if (backTo === '/multiShowSecretPhrase') {
                return navigate('/multiShowSecretPhrase', {
                  state: {
                    mnemonics,
                  },
                });
              }

              if (backTo === '/sendCurrency') {
                return navigate(backTo, {
                  state: {
                    coin,
                    redirectTo,
                    backAddress: address,
                    backAmount: amount,
                  },
                });
              }

              if (backTo === '/enter-price-spritz') {
                return navigate('/enter-price-spritz', {
                  state: {
                    coin,
                    account: account,
                    backAmount: backAmount,
                  },
                });
              }

              if (backTo === '/creditBillPay') {
                return navigate('/creditBillPay', {
                  state: {
                    billAmount: billItem,
                    backAmount: backAmount,
                  },
                });
              }

              if (backTo === '/confirmCurrencySpritz') {
                return navigate('/confirmCurrencySpritz', {
                  state: {
                    coin,
                    account: account,
                    backAmount: backAmount,
                  },
                });
              }

              if (backTo === '/history') {
                if (coin) {
                  return navigate('/currencyDetails', {
                    state: {
                      coin,
                      image: coin.image,
                      symbol: coin.symbol,
                      type: '',
                      ...filter,
                    },
                  });
                } else {
                  return navigate(backTo, {
                    state: { ...filter, coinId: filter.coinId.value },
                  });
                }
              }

              if (backTo === '/history-spritz') {
                return navigate(backTo, {
                  state: {
                    filterValue: spritzFilter,
                  },
                });
              }

              // chnage***********

              if (backTo === '/billPay-history-spritz') {
                return navigate(backTo, {
                  state: {
                    filterValue: billPayFilter,
                  },
                });
              }

              //  Change**********

              if (backTo === '/buy-sell') {
                if (coin) {
                  return navigate('/currencyDetails', {
                    state: {
                      coin,
                      image: coin.image,
                      symbol: coin.symbol,
                      type: '',
                    },
                  });
                } else {
                  return navigate(backTo);
                }
              }

              if (
                backTo == '/bankAccountListing' ||
                backTo == 'bankAccountListing'
              ) {
                return navigate(backTo, {
                  state: {
                    fromBillPay: true,
                  },
                });
              }

              return navigate(backTo);
            }}
          >
            {theme == 'darkTheme' ? (
              <img src={DarkBackArrowIcon} />
            ) : (
              <img src={BackArrowIcon} />
            )}
          </Link>
        )}
        {AddAccount && spritzTab == 'withdraw' && (
          <span
            style={{ cursor: 'pointer' }}
            to={void 0}
            onClick={() => {
              store.dispatch(setCreate(true));
              navigate('/bankAccount');
            }}
            className='addAccountHeader'
          >
            {theme == 'darkTheme' ? <img src={Add} /> : <img src={Add} />}
            Bank
          </span>
        )}
      </div>
      <h4>{title}</h4>
      <div className='loggOut'>
        {searchTo && (
          <Link
            to={searchTo}
            onClick={(e) => {
              e.preventDefault();
              showFun();
            }}
          >
            {theme == 'darkTheme' ? (
              <img src={DarkSearchIcon} />
            ) : (
              <img src={SearchIcon} />
            )}
          </Link>
        )}
        {settingTo && (
          <Link to={settingTo}>
            {theme == 'darkTheme' ? (
              <img src={DarkSettignIcon} />
            ) : (
              <img src={SettignIcon} />
            )}
          </Link>
        )}
        {FilterIcon && (
          <Link to={FilterIcon}>
            {theme == 'darkTheme' ? (
              <img src={DarkFilterIcon} />
            ) : (
              <img src={Filtericon} />
            )}
          </Link>
        )}
        {chartIcon && (
          <span style={{ cursor: 'pointer' }} to={void 0} onClick={chartIcon}>
            {theme == 'darkTheme' ? (
              <img src={DarkChartIcon} />
            ) : (
              <img src={ChartIcon} />
            )}
          </span>
        )}

        {stared && (
          <span style={{ cursor: 'pointer' }} to={void 0} onClick={stared}>
            <svg
              style={{
                position: 'relative',
                right: '-12px',
              }}
              height={21}
              width={21}
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <g id='SVGRepo_bgCarrier' stroke-width='0'></g>
              <g
                id='SVGRepo_tracerCarrier'
                stroke-linecap='round'
                stroke-linejoin='round'
              ></g>
              <g id='SVGRepo_iconCarrier'>
                {' '}
                <path
                  d='M6.03954 7.77203C3.57986 8.32856 2.35002 8.60682 2.05742 9.54773C1.76482 10.4886 2.60325 11.4691 4.2801 13.4299L4.71392 13.9372C5.19043 14.4944 5.42868 14.773 5.53586 15.1177C5.64305 15.4624 5.60703 15.8341 5.53498 16.5776L5.4694 17.2544C5.21588 19.8706 5.08912 21.1787 5.85515 21.7602C6.62118 22.3417 7.77268 21.8115 10.0757 20.7512L10.6715 20.4768C11.3259 20.1755 11.6531 20.0248 12 20.0248C12.3469 20.0248 12.6741 20.1755 13.3285 20.4768L13.9243 20.7512C16.2273 21.8115 17.3788 22.3417 18.1449 21.7602C18.9109 21.1787 18.7841 19.8706 18.5306 17.2544M19.7199 13.4299C21.3968 11.4691 22.2352 10.4886 21.9426 9.54773C21.65 8.60682 20.4201 8.32856 17.9605 7.77203L17.3241 7.62805C16.6251 7.4699 16.2757 7.39083 15.9951 7.17781C15.7144 6.96479 15.5345 6.64193 15.1745 5.99623L14.8468 5.40837C13.5802 3.13612 12.9469 2 12 2C11.0531 2 10.4198 3.13613 9.15316 5.40838'
                  stroke='#1C274C'
                  stroke-width='1.5'
                  stroke-linecap='round'
                ></path>{' '}
              </g>
            </svg>
          </span>
        )}
        {addIcon && (
          <span
            style={{ cursor: 'pointer' }}
            to={void 0}
            onClick={() => {
              if (addIcon == '/billbankaccount') {
                navigate(addIcon, {
                  state: { fromBankList: true, fromBillPay: true },
                });
              } else {
                navigate(addIcon);
              }
            }}
          >
            {theme == 'darkTheme' ? (
              <img src={DarkPlusBordredIcon} />
            ) : (
              <img src={Add} />
            )}
          </span>
        )}
        {logout && (
          <span
            style={{ cursor: 'pointer' }}
            to={void 0}
            onClick={async () => {
              setOpenmodal(true);
            }}
          >
            {theme == 'darkTheme' ? (
              <img src={DarkLogout} />
            ) : (
              <img src={LogoutIcon} />
            )}
          </span>
        )}
        {manage && (
          <span
            style={{ cursor: 'pointer' }}
            to={void 0}
            onClick={() => {
              navigate(manage);
            }}
          >
            {theme == 'darkTheme' ? (
              <img src={LightManage} />
            ) : (
              <img src={Manage} />
            )}
          </span>
        )}

        <div className='inner_modal_pp'>
          <Drawer
            title='Create Bank Account'
            placement='bottom'
            onClose={onClose}
            open={open}
            closeIcon={
              theme == 'darkTheme' ? (
                <img src={darkclose} />
              ) : (
                <img src={ModalCloseIcon} />
              )
            }
          >
            <div className='multiBankDrawer'>
              <div className='innerLink'>
                <img
                  src={UploadAcc}
                  // onClick={() => {
                  //   store.dispatch(setCreate(true));
                  //   navigate("/bankAccount");
                  // }}
                />
                <div className='multibankAccount'>
                  <img src={BackImg} />
                  <h4>Bank Account</h4>
                  <p>3 Accounts</p>
                </div>
              </div>
              <ButtonCompGray
                text={'Skip'}
                marginTop={'20px'}
                // onClick={() => {
                //   store.dispatch(setCreate(true));
                //   navigate("/withdraw");
                // }}
              />
            </div>
          </Drawer>

          <ModalCustom
            handleCancel={handleCancel}
            isModalOpen={isModalOpen}
            handleOk={handleOk}
            customClass='customClassModal'
            closable={false}
          >
            <div className='balanceDetails__modal'>
              <p
                className='balanceDetails__modal__title'
                style={{ textAlign: 'center' }}
              >
                Are you sure you want to logout?
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
                    backgroundColor: 'green',
                    color: 'white',
                    fontSize: '18px',
                    borderRadius: '7px',
                    marginRight: '20px',
                    cursor: 'pointer',
                  }}
                  onClick={async () => {
                    await chrome.storage.local.remove(['spritzData']);
                    await chrome.storage.session.remove(['spritzApiKey']);
                    store.dispatch(spritzKyc(null));
                    store.dispatch(spritzAccounts([]));
                    store.dispatch(spritzLogin(null));
                    navigate('/emailAddress');
                  }}
                >
                  Yes
                </div>
                <div
                  className='red'
                  style={{
                    padding: '12px 53px',
                    backgroundColor: 'red',
                    color: 'white',
                    fontSize: '18px',
                    borderRadius: '7px',
                    marginLeft: '20px',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    handleCancel();
                  }}
                >
                  No
                </div>
              </div>
            </div>
          </ModalCustom>
        </div>
      </div>
    </div>
  );
}

export default MenuRestofHeaders;
