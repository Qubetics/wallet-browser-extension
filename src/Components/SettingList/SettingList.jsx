/*global chrome*/
// import Link from 'antd/es/typography/Link';
import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import DarkArrowRightIcon from '../../Assets/DarkArrowRightIcon.svg';
import './SettingList.scss';
import { WalletHelper } from '../../helpers/wallet.helper';
import { Checkbox, Drawer, message, Switch } from 'antd';
import { DURATION } from '../../config/message.config';
import { useSelector } from 'react-redux';
import { store } from '../..';
import { setTheme } from '../../actions/theme';
import { setAuth } from '../../actions/auth';
import ModalCustom from '../ModalCustom/ModalCustom';
import InputFieldSimple from '../InputField/InputFieldSimple';
import { setLoading } from '../../actions/loading';
import ButtonComp from '../ButtonComp/ButtonComp';
import warning from '../../Assets/PNG/warning.png';
import darkclose from '../../Assets/darkclose.svg';
import { setFilter } from '../../actions/filter';

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
    path,
    from,
  } = props;
  const [isModalOpen, setOpenmodal] = useState(false);
  const [isLogoutModalOpen, setLogoutOpenmodal] = useState(false);
  const [password, setPassword] = useState(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [ischecked1, setIschecked1] = useState(false);
  const [ischecked2, setIschecked2] = useState(false);

  const handleOk = async () => {
    {
      const isCorrectPassword = await WalletHelper.verifyPassword(password);
      if (!isCorrectPassword) {
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
    }
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
    setPassword(null);
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
  const handleOk4 = () => {
    setDrawerOpen(false);
  };
  const handleCancel4 = () => {
    setDrawerOpen(false);
    setPassword(null);
    setIschecked1(false);
    setIschecked2(false);
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
      <div className="listItems">
        <Link
          to={to}
          // onClick={async () => {
          //   setIsModalOpen4(true);
          // }}
          onClick={async (e) => {
            e.preventDefault();

            if (to?.startsWith('http://') || to?.startsWith('https://')) {
              window.open(to, '_blank');
              return;
            }

            if (to === '/logout') {
              return setDrawerOpen(true);
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
                  password: password,
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

            if (to === '/history') {
              store.dispatch(
                setFilter({
                  coinId: 'all',
                  status: 'all',
                  fromDate: null,
                  toDate: null,
                  type: 'all',
                })
              );
              return navigate('/history', {
                state: { path: path ?? '' },
              });
            }

            return navigate(to, {
              state: { path: path ?? '', from: from ?? '' },
            });
          }}
        >
          <div className="settingList">
            <div className="settingList__imgValue">
              <img src={ticketcheck} />
              <p>{setinglist}</p>
            </div>
            {RightArow && (
              <img
                src={
                  theme === 'darkTheme'
                    ? DarkArrowRightIcon
                    : DarkArrowRightIcon
                }
              />
            )}
            {switchToggle === 'switchToggle' && (
              <Switch
                className="switchSec"
                onChange={toggleTheme}
                checked={theme === 'darkTheme' ? false : true}
              />
            )}
            {switchToggle === 'switchToggleAutoLock' && (
              <div className="autoLockTogal">
                <Switch
                  className="switchSec2"
                  onChange={toggleAutoLock}
                  checked={isAutoLock}
                />
              </div>
            )}
          </div>
        </Link>
      </div>
      <ModalCustom
        title={'Password'}
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <InputFieldSimple
            value={password}
            placeholder="Password"
            getData={(value) => {
              const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
              if (value.length <= 100 && !hasEmoji) {
                setPassword(value);
              }
            }}
            customFunction={async () => {
              const isCorrectPassword = await WalletHelper.verifyPassword(
                password
              );
              if (!isCorrectPassword) {
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
            onClick={async () => handleOk()}
          />
        </div>
      </ModalCustom>

      <ModalCustom
        title={'Logout'}
        handleCancel={handleLogoutCancel}
        isModalOpen={isLogoutModalOpen}
        handleOk={handlLogouteOk}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <div className="viewphrases__iInner">
            <img src={warning} />
            <div>
              <p>
                By resetting, all wallets you have saved within the Qubetics
                Extension will be erased. Please make sure you have each
                wallet's 12-word seed phrase written down before resetting.
              </p>
            </div>
          </div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              // console.log('CONTINUE TO VERIFY PASSWORD');
              setOpenmodal(true);
              setPassword(null);
            }}
          />
        </div>
      </ModalCustom>
      <Drawer
        title="Are you sure?"
        placement="bottom"
        onClose={handleCancel4}
        open={isDrawerOpen}
        closeIcon={<img src={darkclose} />}
      >
        <div className={`flexedContent`}>
          <div className="secretMasterKey">
            <Checkbox
              checked={ischecked1 === true ? true : false}
              onChange={(value) => {
                setIschecked1(value.target.checked);
              }}
            >
              <p>
                Please back up your seed phrase before logging out to avoid
                losing access to your wallet.
              </p>
            </Checkbox>
            <Checkbox
              checked={ischecked2 === true ? true : false}
              onChange={(value) => {
                setIschecked2(value.target.checked);
              }}
            >
              <p>
                Are you sure you want to log out? Without a backup, you may lose
                access to your funds.
              </p>
            </Checkbox>
            <div className="secretMasterKey_btns">
              <div className="cancelBtn">
                <ButtonComp
                  maxWidth="100%"
                  onClick={() => handleCancel4()}
                  text="Cancel"
                />
              </div>
              <ButtonComp
                maxWidth="100%"
                text="Continue"
                disabled={!ischecked1 || !ischecked2}
                onClick={() => setLogoutOpenmodal(true)}
              />
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}

export default SettingList;
