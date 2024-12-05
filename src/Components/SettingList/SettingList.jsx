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

  const { theme } = useSelector((state) => state);

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
            {switchToggle && (
              <Switch
                className='switchSec'
                onChange={toggleTheme}
                checked={theme === 'darkTheme' ? false : true}
              />
            )}
          </div>
        </Link>
      </div>
    </>
  );
}

export default SettingList;
