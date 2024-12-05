/*global chrome*/
import React, { useEffect, useState } from 'react';
import SettingList from '../../Components/SettingList/SettingList.jsx';
import Download from '../../Assets/download.svg';
import Useredit from '../../Assets/useredit.svg';
import Eyes from '../../Assets/eyes.svg';
import CurrencyIcons from '../../Assets/settings/currency.svg';
import Editable from '../../Assets/editable.svg';
import AddressBook from '../../Assets/settings/address.svg';
import HelpDark from '../../Assets/help-dark.png';
import HelpLight from '../../Assets/help-light.png';
import Security from '../../Assets/settings/ic_privcay.png';
import ModalCustom from '../../Components/ModalCustom/ModalCustom.jsx';
import InputFieldSimple from '../../Components/InputField/InputFieldSimple.jsx';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import './Setting.scss';
import warning from '../../Assets/PNG/warning.png';
import LogoutIcon from '../../Assets/settings/logout.svg';
import DarkLogout from '../../Assets/settings/darkLogout.svg';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import darkclose from '../../Assets/darkclose.svg';
import JoinCom from '../../Assets/joinIcon.svg';
import ThemeIcon from '../../Assets/themeIcon.svg';
import Create from '../../Assets/settings/create.png';
import Price from '../../Assets/settings/price.png';
import Terms from '../../Assets/settings/term.svg';
import darkterm from '../../Assets/settings/Darkterms.svg';
import Wallets from '../../Assets/settings/wallet1.svg';
import WatchOnly from '../../Assets/settings/watch-only.png';
import darkCurrencyIcons from '../../Assets/settings/darkCurrencyIcons.svg';
import Insta from '../../Assets/Insta.svg';
import SnapChat from '../../Assets/snapchat.svg';
import facebookIcon from '../../Assets/facebook.svg';
import twiter from '../../Assets/twitter.svg';
import linkin from '../../Assets/linkIn.svg';
import HistoryList from '../../Assets/his.svg';
import darkChangePin from '../../Assets/settings/darkChangeoin.svg';
import ChangePin from '../../Assets/settings/changepin.svg';
import darkAddressBook from '../../Assets/settings/DarkAdressBook.svg';
import darkHistoryList from '../../Assets/settings/DarkTransaction.svg';
import darkThemeIcon from '../../Assets/settings/DarkTheme.svg';
import darkJoinCom from '../../Assets/settings/DarkJoin.svg';
import darkSecurity from '../../Assets/settings/DarkPrivacy.svg';
import watsapp from '../../Assets/watsapp.svg';
import { Link, useNavigate } from 'react-router-dom';
import { WalletHelper } from '../../helpers/wallet.helper.js';
import { Drawer, message } from 'antd';
import { store } from '../../index.js';
import { setLoading } from '../../actions/loading.js';
import { DURATION } from '../../config/message.config.js';
import { useSelector } from 'react-redux';
import { server } from '../../server.js';
import { generateString } from '../../helpers/common.helper.js';
import { setAuth } from '../../actions/auth.js';




function Setting() {
  const ZENDESK_KEY = 'REDACTED';
  const [open, setOpen] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);

  const { chain, account } = useSelector((state) => state);
  const navigate = useNavigate();
  const [password, setPassword] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const { theme } = useSelector((state) => state);
  const [isModalOpen, setOpenmodal] = useState(false);
  const [isLogoutModalOpen, setLogoutOpenmodal] = useState(false);
  const [socialIcons, setSocialIcons] = useState([]);

  const chunkArray = (array, chunkSize) => {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  };

  const init = async () => {
    const { data } = await server.get(`/wallet/social_media_links`, {
      headers: {
        Authorization: account.jwtToken,
      },
    });

    const chunkedData = chunkArray(data.data, 3);
    setSocialIcons(chunkedData);
  };

  useEffect(() => {
    init();
  }, []);

  const onClick = () => {
    setOpenmodal(true);
  };

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

  const onCloseHandle = () => {
    setOpen(false);
  };
  const drawerOpen = () => {
    setOpen(true);
  };

  const onCloseHandle1 = () => {
    setOpenHelp(false);
  };
  const drawerOpen1 = () => {
    setOpenHelp(true);
  };

  const handleChatBot = async () => {
    store.dispatch(setLoading(true));
    const checkUserToNavigate = await server.post(
      '/wallet/open_faq',
      {
        wallet_address: account.address,
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    if (checkUserToNavigate.data.status) {
      let randomString = generateString(15);
      store.dispatch(setLoading(false));
      // window.open(`http://localhost:3000/chat/${account.address}/${randomString}`);
      window.open(
        `https://REDACTED/chat/${account.address}/${randomString}`
        // `http://localhost:3000/faq/${account.address}/${randomString}`
      );
    }
  };

  const data = !account.isWatchOnly
    ? [
        {
          setinglist: 'Currency Preference',
          to: '/currencyPreference',
          ticketcheck: theme == 'darkTheme' ? darkCurrencyIcons : CurrencyIcons,
          RightArow: 'true',
        },
        {
          setinglist: 'Address Book',
          to: '/address-book',
          ticketcheck: theme == 'darkTheme' ? darkAddressBook : AddressBook,
          RightArow: 'RightArow',
        },
        {
          setinglist: 'Transactions History',
          to: '/history',
          ticketcheck: theme == 'darkTheme' ? darkHistoryList : HistoryList,
          RightArow: 'RightArow',
        },
        {
          setinglist: 'Change Password',
          to: '/changePin',
          ticketcheck: theme == 'darkTheme' ? darkChangePin : ChangePin,
          RightArow: 'RightArow',
        },
        {
          setinglist: 'Theme',
          switchToggle: 'switchToggle',
          ticketcheck: theme == 'darkTheme' ? darkThemeIcon : ThemeIcon,
        },
        // {
        //   setinglist: "Lock",
        //   to: "/lock",
        //   ticketcheck: theme == "darkTheme" ? darkChangePin : ChangePin,
        //   RightArow: "RightArow",
        // },
        {
          setinglist: 'Join Community',
          onClick: drawerOpen,
          ticketcheck: theme == 'darkTheme' ? darkJoinCom : JoinCom,
          RightArow: 'RightArow',
        },
        {
          setinglist: 'Help Center',
          // onClick: needHelp,
          onClick: handleChatBot,
          ticketcheck: theme == 'darkTheme' ? HelpDark : HelpLight,
          RightArow: 'RightArow',
        },
        {
          setinglist: 'Terms of Service',
          ticketcheck: theme == 'darkTheme' ? darkterm : Terms,
          RightArow: 'RightArow',
        },
        {
          setinglist: 'Privacy Policy',
          ticketcheck: theme == 'darkTheme' ? darkSecurity : Security,
          RightArow: 'RightArow',
        },
        // {
        //   setinglist: 'Legal',
        //   to: '/legal',
        //   ticketcheck: theme == 'darkTheme' ? darkSecurity : Security,
        //   RightArow: 'RightArow',
        // },
      ]
    : [
        {
          setinglist: 'Currency Preference',
          to: '/currencyPreference',
          ticketcheck: theme == 'darkTheme' ? darkCurrencyIcons : CurrencyIcons,
          RightArow: 'RightArow',
        },
        {
          setinglist: 'Change Password',
          to: '/changePin',
          ticketcheck: theme == 'darkTheme' ? darkChangePin : ChangePin,
          RightArow: 'RightArow',
        },
        {
          setinglist: 'Join Community',
          onClick: drawerOpen,
          ticketcheck: theme == 'darkTheme' ? darkJoinCom : JoinCom,
          RightArow: 'RightArow',
        },
        {
          setinglist: 'Help Center',
          // onClick: drawerOpen1,
          onClick: handleChatBot,
          ticketcheck: theme == 'darkTheme' ? HelpDark : HelpLight,
          RightArow: 'RightArow',
        },
        {
          setinglist: 'Theme',
          switchToggle: 'switchToggle',
          ticketcheck: theme == 'darkTheme' ? darkThemeIcon : ThemeIcon,
        },
        // {
        //   setinglist: "Lock",
        //   to: "/lock",
        //   ticketcheck: theme == "darkTheme" ? darkChangePin : ChangePin,
        //   RightArow: "RightArow",
        // },
        {
          setinglist: 'Terms of Service',
          ticketcheck: theme == 'darkTheme' ? darkterm : Terms,
          RightArow: 'RightArow',
        },
        {
          setinglist: 'Privacy Policy',
          ticketcheck: theme == 'darkTheme' ? darkSecurity : Security,
          RightArow: 'RightArow',
        },
        // {
        //   setinglist: 'Legal',
        //   to: '/legal',
        //   ticketcheck: theme == 'darkTheme' ? darkSecurity : Security,
        //   RightArow: 'RightArow',
        // },
      ];
  return (
    <div>
      {contextHolder}
      {data.map((data) => (
        <SettingList
          setinglist={data.setinglist}
          to={data.to}
          ticketcheck={data.ticketcheck}
          onClick={data.onClick}
          switchToggle={data.switchToggle}
          RightArow={data.RightArow}
        />
      ))}

      <div className='action_exten'>
        {/* {
          setinglist: "Lock",
          to: "/lock",
          ticketcheck: theme == "darkTheme" ? darkChangePin : ChangePin,
          RightArow: "RightArow",
        }, */}
        <button
          className='logout'
          onClick={async () => {
            navigate('/verify', {
              state: {
                lock: true,
              },
            });
            await chrome.storage.session.remove(['accounts', 'password']);
            store.dispatch(setAuth(false));
          }}
        >
          {theme == 'darkTheme' ? (
            <img src={darkChangePin} />
          ) : (
            <img src={ChangePin} />
          )}
          Lock
        </button>

        <button
          className='logout'
          onClick={() => {
            onLogoutClick();
          }}
        >
          {theme == 'darkTheme' ? (
            <img src={DarkLogout} />
          ) : (
            <img src={LogoutIcon} />
          )}
          Reset
        </button>
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

      <Drawer
        title='Join Community'
        placement='bottom'
        onClick={drawerOpen}
        open={open}
        closeIcon={
          theme == 'darkTheme' ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
        onClose={onCloseHandle}
      >
        <div className='socialLink'>
          {socialIcons.map((socialSet) => {
            return (
              <div className='socialLink__innerLink'>
                {socialSet.map((socialIcon) => {
                  return (
                    <Link
                      onClick={(e) => {
                        e.preventDefault();
                        return chrome.tabs.create({
                          url: socialIcon.media_link,
                        });
                      }}
                    >
                      <img
                        src={`${process.env.REACT_APP_IMAGE_BASE_URL}${socialIcon.image_url}`}
                        alt=''
                        style={{
                          height: '40px',
                          width: '40px',
                        }}
                      />
                      {socialIcon.text}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Drawer>

      <Drawer
        title='Help Center'
        placement='bottom'
        onClick={drawerOpen1}
        open={openHelp}
        closeIcon={
          theme == 'darkTheme' ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
        onClose={onCloseHandle1}
        height={260}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            height: '100%',
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 'bold',
                fontSize: '16px',
                marginBottom: '6px',
              }}
            >
              All support will be through the official Qubetics X account
            </p>
            <a
              href='https://REDACTED/'
              onClick={(e) => {
                e.preventDefault();
                return chrome.tabs.create({
                  url: 'https://twitter.com/REDACTED',
                });
              }}
              style={{ color: '#00aeef', fontSize: '16px' }}
            >
              https://twitter.com/REDACTED
            </a>
          </div>
          <div
            style={{
              marginTop: '30px',
            }}
          >
            <p
              style={{
                fontWeight: 'bold',
                fontSize: '16px',
                marginBottom: '6px',
              }}
            >
              Please refer to our FAQ's
            </p>
            <a
              href='https://REDACTED/'
              onClick={(e) => {
                e.preventDefault();
                return chrome.tabs.create({
                  url: 'https://REDACTED/',
                });
              }}
              style={{ color: '#00aeef', fontSize: '16px' }}
            >
              https://REDACTED/
            </a>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default Setting;
