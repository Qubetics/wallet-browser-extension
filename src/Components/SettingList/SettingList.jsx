/*global chrome*/
// import Link from 'antd/es/typography/Link';
import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import ticketcheck1 from '../../Assets/ArrowRightIcon.svg';
import DarkArrowRightIcon from '../../Assets/DarkArrowRightIcon.svg';
import './SettingList.scss';
import { WalletHelper } from '../../helpers/wallet.helper';
import { message, Switch } from 'antd';
import { DURATION } from '../../config/message.config';
import { useSelector } from 'react-redux';
import { store } from '../..';
import { setTheme } from '../../actions/theme';
import ArrowRyt from '../../Assets/ArrowRightIcon.svg';
import { setAuth } from '../../actions/auth';
import ModalCustom from '../ModalCustom/ModalCustom';
import InputFieldSimple from '../InputField/InputFieldSimple';
import { setLoading } from '../../actions/loading';
import ButtonComp from '../ButtonComp/ButtonComp';
import warning from '../../Assets/PNG/warning.png';

function SettingList(props) {
  const {
    setinglist,
    to,
    ticketcheck,
    onClick,
    chainId,
    switchToggle,
    changeTheme,
    RightArow,
  } = props;
  const [isModalOpen, setOpenmodal] = useState(false);
  const [isLogoutModalOpen, setLogoutOpenmodal] = useState(false);
  const [password, setPassword] = useState(null);

  const handleOk = () => {
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
  };

  const onLogoutClick = () => {
    setLogoutOpenmodal(true);
  };

  const handlLogouteOk = async () => {
    setLogoutOpenmodal(false);
  };

  const handleLogoutCancel = () => {
    setLogoutOpenmodal(false);
  };

  const { theme } = useSelector((state) => state);
  const [isAutoLock, setIsAutoLock] = useState(false);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  useEffect(() => {
    if (theme) {
      if (theme === 'darkTheme') {
        document.body.classList.remove('lightTheme');
        document.body.classList.add('darkTheme');
      } else {
        document.body.classList.remove('darkTheme');
        document.body.classList.add('lightTheme');
      }
    }
  }, [theme]);

  const getTheme = async () => {
    const { appTheme } = await chrome.storage.local.get('appTheme');
    const { autoLock } = await chrome.storage.local.get('autoLock');

    setIsAutoLock(autoLock);

    if (!appTheme) {
      store.dispatch(setTheme('lightTheme'));
      await chrome.storage.local.set({
        appTheme: 'lightTheme',
      });
    } else {
      store.dispatch(setTheme(appTheme));
    }
  };

  useEffect(() => {
    getTheme();
  }, []);

  const storeTheme = async () => {
    await chrome.storage.local.set({
      appTheme: theme,
    });
  };

  useEffect(() => {
    if (theme) {
      storeTheme();
    }
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'darkTheme') {
      store.dispatch(setTheme('lightTheme'));
      changeTheme('lightTheme');
      document.body.classList.add('lightTheme');
      document.body.classList.remove('darkTheme');
    }
    if (theme === 'lightTheme') {
      store.dispatch(setTheme('darkTheme'));
      changeTheme('darkTheme');

      document.body.classList.add('darkTheme');
      document.body.classList.remove('lightTheme');
    }
  };

  const toggleAutoLock = async () => {
    const { autoLock } = await chrome.storage.local.get('autoLock');
    await chrome.storage.local.set({
      autoLock: !autoLock,
    });
    setIsAutoLock(!autoLock);
  };

  const navigate = useNavigate();

  // const [theme, setTheme] = useState();
  // useEffect(() => {
  //   if (themes) {
  //     setTheme(themes);
  //   }
  // }, [themes]);
  // const changeTheme = (data) => {
  //   setTheme(data);
  // };
  return (
    <>
      {contextHolder}
      <div className='listItems'>
        <Link
          to={to}
          onClick={async (e) => {
            e.preventDefault();


            if(to === "/logout") {
              return setLogoutOpenmodal(true)
            } 

            if (to === '/lock') {
              await chrome.storage.session.remove(['accounts', 'password']);
              store.dispatch(setAuth(false));
              return navigate('/verify', {
                state: {
                  lock: true,
                },
              });
            }

            if (to === '/watch-password') {
              return navigate('/watch-password', {
                state: {
                  chainId,
                },
              });
            }

            if (to === '/address') {
              return navigate('/address', {
                state: {
                  chainId,
                },
              });
            }

            if (setinglist === 'Import Wallet') {
              const { accounts } = await chrome.storage.session.get('accounts');

              if (accounts.length === 4) {
                return messageApi.error(
                  'You have reached the maximum number of created wallets. Please delete one wallet to proceed with adding another.'
                );
              }

              return navigate('/new-name', {
                state: {
                  goTo: '/import-phrase',
                  mnemonics: null,
                },
              });
            }

            if (setinglist === 'Create Wallet') {
              const { accounts } = await chrome.storage.session.get('accounts');

              if (accounts.length === 50) {
                return messageApi.error(
                  'You have reached the maximum number of created wallets. Please delete one wallet to proceed with adding another.'
                );
              }
              return navigate('/new-name', {
                state: {
                  goTo: '/multiShowSecretPhrase',
                  mnemonics: WalletHelper.generateNewMnemonics(),
                },
              });
            }

            if (setinglist === 'Watch Only Wallet') {
              const { accounts } = await chrome.storage.session.get('accounts');

              if (accounts.length === 4) {
                return messageApi.error(
                  'You have reached the maximum number of created wallets. Please delete one wallet to proceed with adding another.'
                );
              }
              return navigate('/new-name', {
                state: {
                  goTo: '/watch-only-list',
                  mnemonics: null,
                },
              });
            }

            return navigate(to);
          }}
        >
          <div
            className='settingList'
            onClick={async () => {
              if(to === "/logout") {
                return setLogoutOpenmodal(true)
              } 
  
              if (to === '/watch-password') {
                return navigate('/watch-password', {
                  state: {
                    chainId,
                  },
                });
              }

              if (to === '/lock') {
                await chrome.storage.session.remove(['accounts', 'password']);
                store.dispatch(setAuth(false));
                return navigate('/verify', {
                  state: {
                    lock: true,
                  },
                });
              }

              if (to === '/address') {
                return navigate('/address', {
                  state: {
                    chainId,
                  },
                });
              }

              if (setinglist === 'Privacy Policy') {
                return chrome.tabs.create({
                  url: 'https://REDACTED/privacy-policy-2/',
                });
              }

              if (setinglist === 'Terms of Service') {
                return chrome.tabs.create({
                  url: 'https://REDACTED/terms-of-service-2/',
                });
              }

              if (setinglist === 'Import Wallet') {
                const { accounts } = await chrome.storage.session.get(
                  'accounts'
                );

                if (accounts.length === 4) {
                  return;
                }
                return navigate('/new-name', {
                  state: {
                    goTo: '/import-phrase',
                    mnemonics: null,
                  },
                });
              }

              if (setinglist === 'Create Wallet') {
                const { accounts } = await chrome.storage.session.get(
                  'accounts'
                );

                if (accounts.length === 4) {
                  return;
                }
                return navigate('/new-name', {
                  state: {
                    goTo: '/multiShowSecretPhrase',
                    mnemonics: WalletHelper.generateNewMnemonics(),
                  },
                });
              }
              onClick();
            }}
          >
            <div className='settingList__imgValue'>
              <img src={ticketcheck} />
              <p>{setinglist}</p>
            </div>
            {RightArow && (
              <img
                src={theme === 'darkTheme' ? DarkArrowRightIcon : ticketcheck1}
              />
            )}
            {switchToggle === 'switchToggle' && (
              <Switch
                className='switchSec'
                onChange={toggleTheme}
                checked={theme === 'darkTheme' ? false : true}
              />
            )}
            {switchToggle === 'switchToggleAutoLock' && (
              <div className='autoLockTogal'>
              <Switch
                className='switchSec2'
                onChange={toggleAutoLock}
                checked={isAutoLock}
              />
              </div>
            )}
          </div>
        </Link>
      </div>




      <ModalCustom
        title={'Show Secret Phrase'}
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        customClass='customClassModal'
      >
        <div className='viewphrases'>
          <InputFieldSimple
            placeholder='Password'
            getData={setPassword}
            customFunction={async () => {
              const { password: sessionPassword } =
                await chrome.storage.session.get('password');

              if (sessionPassword !== password) {
                return messageApi.error('Incorrect password provided.');
              }

              store.dispatch(setLoading(true));
              await WalletHelper.logout();
              store.dispatch(setLoading(false));
              navigate('/', {
                state: {
                  logout: true,
                },
              });
            }}
          />
          <div style={{ marginTop: '10px' }}></div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              const { password: sessionPassword } =
                await chrome.storage.session.get('password');

              if (sessionPassword !== password) {
                return messageApi.error('Incorrect password provided.');
              }

              store.dispatch(setLoading(true));
              await WalletHelper.logout();
              store.dispatch(setLoading(false));
              navigate('/', {
                state: {
                  logout: true,
                },
              });
            }}
          />
        </div>
      </ModalCustom>

      <ModalCustom
        title={'Reset'}
        handleCancel={handleLogoutCancel}
        isModalOpen={isLogoutModalOpen}
        handleOk={handlLogouteOk}
        customClass='customClassModal'
      >
        <div className='viewphrases'>
          <div className='viewphrases__iInner'>
            <img src={warning} />
            <div>
              <p>
                By resetting, all wallets you have saved within the Qubetics App
                will be erased. Please make sure you have each wallet's 12-word
                seed phrase written down before resetting.
              </p>
            </div>
          </div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              setOpenmodal(true);
            }}
          />
        </div>
      </ModalCustom>
    </>
  );
}

export default SettingList;
