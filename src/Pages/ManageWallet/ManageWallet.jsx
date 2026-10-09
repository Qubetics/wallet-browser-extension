/*global chrome*/
import React, { useEffect, useState } from 'react';
import Logo from '../../Assets/logo.png';
import './ManageWallet.scss';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { Checkbox, Drawer, message } from 'antd';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import darkclose from '../../Assets/darkclose.svg';
import BackupMnemonics from '../../Assets/Backup-Mnemonics.png';
import Privatekey from '../../Assets/Backup-Private-Qubetics.png';
import InputFieldSimple, {
  InputFieldOnly,
} from '../../Components/InputField/InputFieldSimple';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import { WalletHelper } from '../../helpers/wallet.helper';
import warning from '../../Assets/PNG/warning.png';
import WalletIBtn from '../../Assets/WalletIBtn.svg';
import DarkArrowRightIcon from '../../Assets/DarkArrowRightIcon.svg';
import { server } from '../../server';
import OpenDark from '../../Assets/open-dark.svg';
import CloseDark from '../../Assets/close-dark.svg';
import { setBalancesIn } from '../../actions/balance-off-out';
import { SecurityHelper } from '../../helpers/security.helper';

function ManageWallet() {
  const [data, setData] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const { theme } = useSelector((state) => state);
  const { account, currency, balanceIn } = useSelector((state) => state);
  const [name, setName] = useState('');
  const [password, setPassword] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [isSecretPhraseModal, setSecretPhraseModal] = useState(false);
  const [mnemonicsModal, setMnemonicsModal] = useState(false);
  const [ischecked1, setIschecked1] = useState(false);
  const [ischecked2, setIschecked2] = useState(false);
  const [totalAmt, setTotalAmt] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isModalOpen3, setIsModalOpen3] = useState(false);
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [accountSelected, setAccountSelected] = useState(null);
  const [isDeletePassModal, setIsDeletePassModal] = useState(false);

  const handleCancel1 = () => {
    setSecretPhraseModal(false);
  };

  const handleCancel4 = () => {
    setMnemonicsModal(false);
  };

  const handleCancel2 = () => {
    setIsModalOpen3(false);
    setIsModalOpen2(false);
  };

  const handleCancel3 = () => {
    setIsModalOpen3(false);
  };

  const init = async () => {
    store.dispatch(setLoading(true));
    let { accounts } = await chrome.storage.session.get('accounts');
    setData(accounts);
    if (state?.from == 'myWallet') {
      let ids = [];
      // console.log('ACCCCCCCCCCCCCCCCCCCCC ', accounts);
      accounts.map((itm) => {
        ids.push(itm.userId);
      });
      getTotalBalance(ids);
    }

    store.dispatch(setLoading(false));
  };

  const getTotalBalance = async (ids) => {
    const response = await server.post(
      `/wallet/allBalances`,
      {
        userIds: ids,
        fiatType: currency.name,
        fetchFrom: 'extension',
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    let total = 0;
    Array.isArray(response.data?.data) &&
      response.data?.data.map((itm) => {
        Array.isArray(itm?.user_wallet_relation) &&
          itm?.user_wallet_relation.map((userBalItem) => {
            total +=
              parseFloat(userBalItem?.balance || 0) *
              parseFloat(userBalItem?.coin?.fiat_price_data?.value || 0);
          });
      });
    setTotalAmt(total);
  };

  useEffect(() => {
    init();
  }, []);

  const onClose = () => {
    setDrawer(false);
  };
  const navigate = useNavigate();
  const { state } = useLocation();

  const setDefaultAccount = async (selectedAccount) => {
    try {
      store.dispatch(setLoading(true));
      const { mnemonics } = await chrome.storage.local.get('mnemonics');
      const decryptedMnemonics = await SecurityHelper.decrypt(
        mnemonics,
        sessionPassword
      );
      const updatesMnemonics = JSON.parse(decryptedMnemonics).map((el) => {
        if (el.address === selectedAccount?.address) {
          el.default = true;
        } else {
          el.default = false;
        }
        return el;
      });
      // console.log("🚀 ~ updatesMnemonics ~ updatesMnemonics:", updatesMnemonics)
      const encryptedMnemonics = await SecurityHelper.encrypt(
        updatesMnemonics,
        sessionPassword
      );
      chrome.storage.local.set({
        mnemonics: encryptedMnemonics,
        registered: true,
      });
      await WalletHelper.setWalletPreference(selectedAccount.id);
      await init();
      messageApi.success('Default account updated successfully!');
    } catch (error) {
      messageApi.error('Failed to update the default account.');
    } finally {
      store.dispatch(setLoading(false));
    }
    setAccountSelected(null);
  };

  const sendDataToInpage = (data) => {
    handleResponse({ type: 'success', data: data });
  };

  const handleResponse = (result, error) => {
    chrome.runtime.sendMessage(
      { method: 'switchAccount', result },
      (response) => {}
    );
  };

  const handleShowPrivateKey = async (password) => {
    // console.log('PASSWORD ENTER TO SHOW PRIVATE KEY :',password)
    const res = await WalletHelper.verifyPassword(password);
    if (!res) {
      return messageApi.error('Invalid Password');
    }

    navigate('/show-private-key', {
      state: {
        account: selectedAccount,
        backTo: '/manage-wallet',
        password: password,
      },
    });
  };

  const changeWallet = async () => {
    if (!sessionPassword) {
      return messageApi.error('Please enter password.');
    }
    const isCorrectPassword = await WalletHelper.verifyPassword(
      sessionPassword
    );
    if (!isCorrectPassword) {
      return messageApi.error('Incorrect password provided.');
    }
    setModalOpen(false);
    setDefaultAccount(accountSelected);
    sendDataToInpage(accountSelected.address)
    navigate('/wallet', {
      state: {
        updatedAccount: accountSelected,
      },
    });
  };

  // console.log('delete modal', deleteModal);
  return (
    <>
      {contextHolder}
      <div
        // style={{height: state?.from == "myWallet" && "calc(100vh - 326px)"}}
        className={
          state?.from == 'myWallet'
            ? `scrollableCont myWallet`
            : `scrollableCont`
        }
      >
        <div className="searchBarFixed">
          <MenuRestofHeaders
            backTo={state?.from == 'myWallet' ? '/wallet' : '/setting'}
            title={state?.from == 'myWallet' ? 'My Wallet' : 'Manage Wallet'}
          />

          {state?.from == 'myWallet' && (
            <div className="myWalletsBalance">
              <div className="myWalletsBalance_value">
                <h4>Total Balance</h4>
                <h1
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    justifyContent: 'space-between',
                  }}
                >
                  <>
                    {/* {currency?.symbol} */}
                    {/* {balanceIn ? totalAmt?.toFixed(2) : '****'} */}
                    {balanceIn
                      ? (() => {
                          const formatted = totalAmt?.toFixed(2); // e.g., "8888087.76"
                          const [intPart, decPart] = formatted.split('.');
                          return (
                            <span>
                              {currency?.symbol} {intPart}
                              <span style={{ fontSize: '0.6em' }}>
                                .{decPart}
                              </span>
                            </span>
                          );
                        })()
                      : '****'}
                  </>

                  {/* <span onClick={() => setShow(!show)}> */}
                  {/* {show ? <img style={{ height: '20px' }}
                    src={OpenDark}
                    alt="" />
                    : <img style={{ height: '30px' }}
                      src={CloseDark}
                      alt="" />} */}
                  {balanceIn ? (
                    <img
                      src={OpenDark}
                      alt=""
                      onClick={async () => {
                        await chrome.storage.local.set({
                          balanceIn: false,
                        });
                        await WalletHelper.updateBalanceInShow(
                          false,
                          account.id,
                          password
                        );
                        store.dispatch(setBalancesIn(false));
                      }}
                      style={{
                        width: '25px',
                        marginLeft: '9px',
                        position: 'relative',
                        top: '-7px',
                      }}
                    />
                  ) : (
                    <img
                      src={CloseDark}
                      alt=""
                      onClick={async () => {
                        await chrome.storage.local.set({
                          balanceIn: true,
                        });
                        await WalletHelper.updateBalanceInShow(
                          true,
                          account.id,
                          password
                        );
                        store.dispatch(setBalancesIn(true));
                      }}
                      style={{
                        width: '25px',
                        marginLeft: '9px',
                        position: 'relative',
                        top: '-7px',
                      }}
                    />
                  )}
                  {/* </span> */}
                </h1>
              </div>
            </div>
          )}
        </div>

        <div
          className={`manageWalletHeight mwheight`}
          style={{ padding: '20px 24px 0' }}
        >
          {Array.isArray(data) &&
            data.map((data, idx) => (
              <div
                className="listItems pdRemove mwheight_inner"
                // onClick={() => !data?.default && sendDataToInpage(data.address)}
              >
                <ul>
                  <li key={idx} className="currency_click">
                    <div
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={(e) => {
                        setSessionPassword(null);
                        e.preventDefault();
                        if (!data?.default) {
                          setAccountSelected(data);
                          setModalOpen(true);
                        }
                      }}
                    >
                      <img src={Logo} alt="" />
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '0',
                        }}
                      >
                        <p className="walletName">
                          {data?.name?.length > 10
                            ? `${data.name.substring(0, 7)}...`
                            : data?.name}{' '}
                          <span style={{ color: '#00aeef', fontSize: 15 }}>
                            {data?.default ? ' (Default)' : ''}
                          </span>
                        </p>
                        <p className="walletAdd">
                          {data.address.substring(0, 7)}.....
                          {data.address.substring(
                            data.address.length - 7,
                            data.address.length
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className="infoICon"
                      onClick={async (e) => {
                        e.preventDefault();
                        setDrawer(true);
                        setSelectedAccount(data);
                        setName(data?.name);
                      }}
                    >
                      {state?.from !== 'myWallet' && (
                        <img src={WalletIBtn} alt="I" />
                      )}
                    </span>
                  </li>
                </ul>
              </div>
            ))}
        </div>
        <div className="bottomBtn">
          <ButtonComp
            onClick={async () => {
              setIsModalOpen3(true);
              // sendDataToInpage();
            }}
            text={'Add Wallet'}
            maxWidth={'352px'}
          />
        </div>
      </div>

      <Drawer
        title="Wallet"
        placement="bottom"
        onClose={onClose}
        open={drawer}
        closeIcon={
          theme == 'darkTheme' ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
      >
        <InputFieldOnly
          placeholder={selectedAccount?.name}
          label="Wallet Name"
          checkForSymbols={true}
          value={name}
          placeholderBaseColor={true}
          getData={(name) => {
            if (name.length <= 25) {
              if (/^\s/.test(name)) {
                setName('');
              } else {
                setName(name);
              }
            } else {
              return;
            }
          }}
        />
        <div className="textInfoBaseColor">
          Max Limit: {name ? name.length : 0}/25
        </div>
        <div className={`flexedContent`}>
          <div className="listItems">
            <ul>
              <li
                className="currencyClick"
                onClick={async () => {
                  setPassword('');
                  setMnemonicsModal(true);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img
                    style={{
                      width: '20px',
                      height: '20px',
                    }}
                    src={BackupMnemonics}
                    alt=""
                  />
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <p>Backup Mnemonics</p>
                  </div>
                </div>
                <img src={DarkArrowRightIcon} alt="Arrow" />
              </li>
              <li
                className="currencyClick"
                onClick={async () => {
                  setPassword('');
                  setIsModalOpen2(true);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img
                    style={{
                      width: '20px',
                      height: '20px',
                    }}
                    src={Privatekey}
                    alt=""
                  />
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <p>Backup Private key</p>
                  </div>
                </div>
                <img src={DarkArrowRightIcon} alt="Arrow" />
              </li>
            </ul>
          </div>

          <ButtonComp
            onClick={async () => {
              if (!name) {
                return messageApi.error(
                  'Please enter a valid name to proceed.'
                );
              }

              if (name.trim().length === 0) {
                return messageApi.error(
                  'Name should have at least 3 characters, not counting spaces.'
                );
              }

              if (name.replace(/\s/g, "").length < 3) {
                return messageApi.error(
                  'Name should have at least 3 characters, not counting spaces.'
                );
              }

              if (name.length > 25) {
                return messageApi.error(
                  'Name should not have more than 25 characters.'
                );
              }
              const nameRegex = /^[A-Za-z0-9 _-]+$/;
              if (!nameRegex.test(name)) {
                return messageApi.error(
                  'Name can contain only letters, numbers, spaces, - and _.'
                );
              }

              const { accounts } = await chrome.storage.session.get('accounts');

              if (accounts) {
                const checkIfExists = accounts.find(
                  (el) => el.name.toLowerCase() === name.trim().toLowerCase()
                );

                if (checkIfExists) {
                  return messageApi.error(
                    'This wallet name already exists. Use a different name.'
                  );
                }
              }
              const updating = await WalletHelper.updateWalletName(
                name.trim(),
                state?.id ? state.id : selectedAccount.id
              );

              // console.log('updating', updating);

              if (!updating) {
                return messageApi.error('Unable to update name at the moment.');
              }

              setDrawer(false);

              init();
            }}
            text={'Update Wallet'}
            maxWidth={'352px'}
            marginBottom={'10px'}
          />

          <ButtonComp
            deletebordered
            onClick={async () => {
              // console.log(account, selectedAccount, 'OPEN DELETE POPUP');
              if (account.id === selectedAccount.id) {
                return messageApi.error('Unable to delete default wallet.');
              }
              setDeleteModal(true);
            }}
            text={'Delete Wallet'}
            maxWidth={'100%'}
          />
          {/* <ButtonComp
            onClick={async () => {
              if (account.id === selectedAccount.id) {
                return messageApi.error("Unable to delete default wallet");
              }

              await WalletHelper.deleteWallet(
                selectedAccount.id,
                account.address
              );
              setDrawer(false);
              init();
            }}
            text={"Delete Wallet"}
            maxWidth={"100%"}
          /> */}
        </div>
      </Drawer>

      <Drawer
        title="Add Account"
        placement="bottom"
        onClose={handleCancel3}
        open={isModalOpen3}
        closeIcon={
          theme == 'darkTheme' ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
      >
        <div className={`flexedContent`}>
          <div className="">
            <ul>
              <li
                style={{
                  backgroundColor: '#040205',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                className="currency_click listItems "
                onClick={async () => {
                  navigate('/add-new-wallet', {
                    state: { type: 'create', addNew: true },
                  });
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <img src={Logo} alt="" />
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <p style={{ color: '#fff' }}>New Account</p>
                  </div>
                </div>
                <p>
                  <svg
                    viewBox="0 0 24 24"
                    height={20}
                    width={20}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
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
                        d="M10 7L15 12L10 17"
                        stroke="#fff"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>{' '}
                    </g>
                  </svg>
                </p>
              </li>
              <li
                style={{
                  backgroundColor: '#040205',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                className="currency_click listItems"
                onClick={async () => {
                  // navigate("/import-wallet-name");
                  navigate('/add-new-wallet', {
                    state: { type: 'import', addNewImport: true },
                  });
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <img src={Logo} alt="" />
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <p style={{ color: '#fff' }}>Existing Account</p>
                  </div>
                </div>
                <p>
                  <svg
                    viewBox="0 0 24 24"
                    height={20}
                    width={20}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
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
                        d="M10 7L15 12L10 17"
                        stroke="#fff"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>{' '}
                    </g>
                  </svg>
                </p>
              </li>
            </ul>
          </div>
        </div>
      </Drawer>

      <ModalCustom
        title={'Delete Address'}
        isModalOpen={deleteModal}
        customClass="customClassModal"
        handleCancel={() => {
          setDeleteModal(false);
        }}
      >
        <div className="viewphrases">
          <div className="viewphrases__iInner">
            <p
              style={{
                fontSize: '20px',

                color: 'white',
              }}
            >
              Are you sure you want to delete this wallet?
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '30px',
              gap: '20px',
            }}
          >
            <ButtonComp
              maxWidth="100%"
              onClick={async () => setIsDeletePassModal(!isDeletePassModal)}
              text="Yes"
            />
            <div className="cancelBtn">
              <ButtonComp
                maxWidth="100%"
                onClick={() => {
                  setDeleteModal(false);
                }}
                text="No"
              />
            </div>
          </div>
        </div>
      </ModalCustom>

      <ModalCustom
        title={'Password'}
        handleCancel={() => {
          setSessionPassword(null);
          setIsDeletePassModal(!isDeletePassModal);
        }}
        isModalOpen={isDeletePassModal}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <InputFieldSimple
            placeholder="Password"
            value={sessionPassword}
            getData={(value) => {
              const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
              if (value.length <= 100 && !hasEmoji) {
                setSessionPassword(value);
              }
            }}
            customFunction={async () => {
              if (!sessionPassword) {
                return messageApi.error('Please enter password.');
              }
              const isCorrectPassword = await WalletHelper.verifyPassword(
                sessionPassword
              );
              if (!isCorrectPassword) {
                return messageApi.error('Incorrect password provided.');
              } else {
                try {
                  store.dispatch(setLoading(true));
                  const result = await WalletHelper.deleteWallet(
                    selectedAccount.id,
                    account.address
                  );
                  // console.log("🚀 ~ customFunction={ ~ result:", result)

                  await WalletHelper.removeMnemonic(
                    selectedAccount.address,
                    sessionPassword
                  );
                  setDrawer(false);
                  init();
                } catch (e) {
                  // console.error('Error deleting wallet:', e);
                } finally {
                  // console.log('AFTER ALL ');
                  setSessionPassword(null);
                  setIsDeletePassModal(false);
                  setDeleteModal(false);
                  store.dispatch(setLoading(false));
                }
              }
            }}
          />
          <div style={{ marginTop: '10px' }}></div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              if (!sessionPassword) {
                return messageApi.error('Please enter password.');
              }
              const isCorrectPassword = await WalletHelper.verifyPassword(
                sessionPassword
              );
              if (!isCorrectPassword) {
                return messageApi.error('Incorrect password provided.');
              } else {
                try {
                  store.dispatch(setLoading(true));
                  const result = await WalletHelper.deleteWallet(
                    selectedAccount.id,
                    account.address
                  );

                  await WalletHelper.removeMnemonic(
                    selectedAccount.address,
                    sessionPassword
                  );
                  setDrawer(false);
                  init();
                } catch (e) {
                  // console.error('Error deleting wallet:', e);
                } finally {
                  //  console.log('AFTER ALL ');
                  setSessionPassword(null);
                  setIsDeletePassModal(false);
                  setDeleteModal(false);
                  store.dispatch(setLoading(false));
                }
              }
            }}
          />
        </div>
      </ModalCustom>

      <ModalCustom
        title={'Show Secret Phrase'}
        handleCancel={handleCancel1}
        isModalOpen={isSecretPhraseModal}
        customClass="customClassModal"
      >
        <div className={'viewphrases'}>
          <InputFieldSimple
            placeholder="Password"
            getData={setPassword}
            value={password}
            customFunction={async () => {
              const response = await WalletHelper.getMnemonicsByPassword(
                selectedAccount.coinFamilyAndAddress[1],
                password
              );
              if (!response) {
                return messageApi.error('Please enter a valid password.');
              }
              navigate('/showSecretPhrase', {
                state: {
                  mnemonics: response,
                  backTo: '/manage-wallet',
                },
              });
            }}
          />
          <div className={'viewphrases__iInner'}>
            <img src={warning} />
            <div>
              <p>Do Not share your secret Phrase!</p>
              <p>These words can be used to steal all your funds.</p>
            </div>
          </div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              const response = await WalletHelper.getMnemonicsByPassword(
                selectedAccount.coinFamilyAndAddress[1],
                password
              );
              if (!response) {
                return messageApi.error('Please enter a valid password.');
              }
              navigate('/showSecretPhrase', {
                state: {
                  mnemonics: response,
                  backTo: '/manage-wallet',
                },
              });
            }}
          />
        </div>
      </ModalCustom>

      <ModalCustom
        title={'Backup Private key'}
        handleCancel={handleCancel2}
        isModalOpen={isModalOpen2}
        customClass="customClassModal"
      >
        <div className={'viewphrases'}>
          <InputFieldSimple
            placeholder="Password"
            getData={setPassword}
            value={password}
            customFunction={async () => handleShowPrivateKey(password)}
          />
          <div className={'viewphrases__iInner'}>
            <img src={warning} />
            <div>
              <p>Do Not share your private key!</p>
              <p>This key can be used to steal all your funds.</p>
            </div>
          </div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => handleShowPrivateKey(password)}
          />
        </div>
      </ModalCustom>

      <Drawer
        title="This secret phrase is the master key to your wallet"
        placement="bottom"
        onClose={handleCancel4}
        open={mnemonicsModal}
        closeIcon={
          theme == 'darkTheme' ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
      >
        <div className={`flexedContent`}>
          <div className="secretMasterKey">
            <p>
              Tap on all checkboxes to confirm you understand the importance of
              your secret phrase
            </p>
            <Checkbox
              checked={ischecked1}
              onChange={(value) => {
                setIschecked1(value.target.checked);
              }}
            >
              <p>If I lose my secret phrase, my funds will be lost forever.</p>
            </Checkbox>
            <Checkbox
              checked={ischecked2}
              onChange={(value) => {
                setIschecked2(value.target.checked);
              }}
            >
              <p>Qubetics Wallet support will NEVER reach out to ask for it.</p>
            </Checkbox>
            <div className="secretMasterKey_btns">
              <div className="cancelBtn">
                <ButtonComp
                  maxWidth="100%"
                  onClick={() => {
                    handleCancel4();
                  }}
                  text="Cancel"
                />
              </div>
              <ButtonComp
                maxWidth="100%"
                onClick={async () => {
                  setSecretPhraseModal(true);
                }}
                disabled={!ischecked1 || !ischecked2}
                text="Continue"
              />
            </div>
          </div>
        </div>
      </Drawer>

      <ModalCustom
        title={'Password'}
        handleCancel={() => setModalOpen(!isModalOpen)}
        isModalOpen={isModalOpen}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <InputFieldSimple
            placeholder="Password"
            value={sessionPassword}
            getData={(value) => {
              const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
              if (value.length <= 100 && !hasEmoji) {
                setSessionPassword(value);
              }
            }}
            customFunction={changeWallet}
          />
          <div style={{ marginTop: '10px' }}></div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={changeWallet}
          />
        </div>
      </ModalCustom>
    </>
  );
}

export default ManageWallet;
