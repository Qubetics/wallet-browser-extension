/*global chrome*/

import React, { useEffect, useState } from 'react';
import './WalletListing.scss';
import MyWallet from '../../Assets/myWallet.svg';
import InfoIcon from '../../Assets/info1.png';
import warning from '../../Assets/PNG/warning.png';
import { server } from '../../server';
import { useSelector } from 'react-redux';
import {
  addCommasToNumber,
  getFlooredFixed,
} from '../../helpers/conversion.helper';
import { store } from '../..';
import { setBalance } from '../../actions/balance';
import { setLoading } from '../../actions/loading';
import { WalletHelper } from '../../helpers/wallet.helper';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown, message, Switch } from 'antd';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import InputFieldSimple from '../../Components/InputField/InputFieldSimple';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';

import {
  reorder,
} from 'react-reorder';
function WalletListing() {
  const [data, setData] = useState([]);
  const [overallBalance, setOverallBalance] = useState(0);
  const { account, currency, balanceOut } = useSelector((state) => state);
  const [clickedUp, setClickedUp] = useState(false);
  const [clickedDown, setClickedDown] = useState(false);
  const [selected, setSelected] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: 1,
  });
  const [password, setPassword] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);

  const [isModalOpen1, setIsModalOpen1] = useState(false);

  const handleOk1 = () => {
    setIsModalOpen1(false);
  };
  const handleCancel1 = () => {
    setIsModalOpen1(false);
    setPassword(null);
  };

  const navigate = useNavigate();

  const init = async () => {
    try {
      store.dispatch(setLoading(true));
      const { accounts } = await chrome.storage.session.get('accounts');
      const { defaultHomePage } = await chrome.storage.local.get(
        'defaultHomePage'
      );

      const walletAddresses = [];
      const coinFamilies = [];

      accounts.forEach((account) => {
        account.addressLists.forEach((address) => {
          walletAddresses.push(address);
          account.coinFamilies.forEach((el) => {
            if (!coinFamilies.includes(el)) {
              coinFamilies.push(el);
            }
          });
        });
      });

      const requestBody = accounts.map((account) => {
        return {
          wallet_addresses: account.addressLists,
          coin_family: account.coinFamilies,
          is_watch_only: account.isWatchOnly ? 1 : 0,
          wallet_name: account.name,
        };
      });

      const balances = await server.post(
        '/wallet/all_wallet_balances',
        {
          address_list_array: requestBody,
          fiat_currency: currency.name,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      let overallFinalBalance = 0;

      const finalData = accounts.map((account, index) => {
        let fiatBalance = 0;
        account.coinFamilies.forEach((coinFamily) => {
          const address = account.coinFamilyAndAddress[coinFamily];
          balances.data.data[`${coinFamily}_${address.toLowerCase()}`]
            ? balances.data.data[
              `${coinFamily}_${address.toLowerCase()}`
            ].forEach((token) => {
              // console.log(
              //   account.isWatchOnly &&
              //   token.watch_only_wallet_addresses_data &&
              //   account.name ===
              //   token.watch_only_wallet_addresses_data.wallet_name
              // );
              // console.log(
              //   account.isWatchOnly,
              //   token?.watch_only_wallet_addresses_data,
              //   account.name,
              //   token?.watch_only_wallet_addresses_data?.wallet_name
              // );
              if (
                account.isWatchOnly &&
                token.watch_only_wallet_addresses_data &&
                account.name ===
                token.watch_only_wallet_addresses_data.wallet_name
              ) {
                const fiatValue =
                  token.balance *
                  (token.coin_data.coins_market?.current_price || 0);
                fiatBalance += fiatValue;
              } else if (
                !account.isWatchOnly &&
                !token.watch_only_wallet_addresses_data
              ) {
                const fiatValue =
                  token.balance *
                  (token.coin_data.coins_market?.current_price || 0);
                fiatBalance += fiatValue;
              }
            })
            : (fiatBalance += 0);
        });

        account.fiatValue = addCommasToNumber(getFlooredFixed(fiatBalance, 2));
        overallFinalBalance += account.totalBalanceShow ? fiatBalance : 0;
        account.defaultHomePage = defaultHomePage == account.id;
        account.default = defaultHomePage
          ? defaultHomePage == account.id
            ? true
            : false
          : account.default;
        account.position = index;
        return account;
      });

      store.dispatch(
        setBalance(addCommasToNumber(getFlooredFixed(overallFinalBalance, 2)))
      );

      await WalletHelper.setWalletPreference(
        finalData.find((el) => el.default).id
      );
      setData(finalData);
      store.dispatch(setLoading(false));
    } catch (error) {
      // console.log('Wallet Listing Error : ', error);
      store.dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    init();
  }, []);

  const itemWithWatchOnly = [
    {
      label: (
        <Link
          to='/editWalletName'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate('/editWalletName', {
              state: {
                id: selected.id,
                name: selected.name,
              },
            });
          }}
        >
          Edit
        </Link>
      ),
      key: '0',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <div
          onClick={async (e) => {
            setDeleteModal(true);
          }}
        >
          <span
            style={{
              marginRight: '35px',
            }}
          >
            Delete
          </span>
        </div>
      ),
      key: '2',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <>
          <div
            style={{
              marginRight: '13px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                marginRight: '35px',
              }}
            >
              Default Homepage
            </span>
            <Switch
              checked={selected?.defaultHomePage}
              onChange={async (checked) => {
                store.dispatch(setLoading(true));
                await chrome.storage.local.set({
                  defaultHomePage: checked ? selected.id : null,
                });
                if (checked) {
                  await WalletHelper.setWalletPreference(selected.id);
                }
                await init();
                store.dispatch(setLoading(false));
              }}
            />
          </div>
        </>
      ),
      key: '3',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <>
          <div
            style={{
              marginRight: '13px',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={async (e) => {
              e.preventDefault();
            }}
          >
            <span
              style={{
                marginRight: '15px',
              }}
            >
              Remove From Balance
            </span>
            <Switch
              checked={!selected?.totalBalanceShow}
              onChange={async (status) => {
                store.dispatch(setLoading(true));
                await WalletHelper.updateShowTotalBalance(!status, selected.id);
                await init();
                store.dispatch(setLoading(false));
              }}
            />
          </div>
        </>
      ),
      key: '4',
    },
  ];
  const items = [
    {
      label: (
        <Link
          to='/editWalletName'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate('/editWalletName', {
              state: {
                id: selected.id,
                name: selected.name,
              },
            });
          }}
        >
          Edit
        </Link>
      ),
      key: '0',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <Link
          to='/editWalletName'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsModalOpen1(true);
          }}
        >
          Show Secret Phrase
        </Link>
      ),
      key: '1',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <div
          onClick={async (e) => {
            setDeleteModal(true);
          }}
        >
          <span
            style={{
              marginRight: '35px',
            }}
          >
            Delete
          </span>
        </div>
      ),
      key: '2',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <>
          <div
            style={{
              marginRight: '13px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                marginRight: '35px',
              }}
            >
              Default Homepage
            </span>
            <Switch
              checked={selected?.defaultHomePage}
              onChange={async (checked) => {
                store.dispatch(setLoading(true));
                await chrome.storage.local.set({
                  defaultHomePage: checked ? selected.id : null,
                });
                if (checked) {
                  await WalletHelper.setWalletPreference(selected.id);
                }
                await init();
                store.dispatch(setLoading(false));
              }}
            />
          </div>
        </>
      ),
      key: '3',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <>
          <div
            style={{
              marginRight: '13px',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={async (e) => {
              e.preventDefault();
            }}
          >
            <span
              style={{
                marginRight: '15px',
              }}
            >
              Remove From Balance
            </span>
            <Switch
              checked={!selected?.totalBalanceShow}
              onChange={async (status) => {
                store.dispatch(setLoading(true));
                await WalletHelper.updateShowTotalBalance(!status, selected.id);
                await init();
                store.dispatch(setLoading(false));
              }}
            />
          </div>
        </>
      ),
      key: '4',
    },
  ];

  const handleClick = async (id) => {
    store.dispatch(setLoading(true));
    await WalletHelper.setWalletPreference(id);
    store.dispatch(setLoading(false));
    navigate('/wallet');
  };

  return (
    <div className='walletListing'>
      <div className='walletListing__heading'>
        <h2>Listings</h2>
      </div>
      {data &&
        data.length > 0 &&
        data.map((el, index) => {
          return (
            <div key={index} className='main_list'>
              <div
                className='walletListing__listing flex-item'
                style={{
                  position: 'relative',
                }}
              >
                <div className='walletListing__listing__leftSec'>
                  <img
                    src={MyWallet}
                    onClick={() => handleClick(el.id)}
                    alt=''
                  />
                  <div className='walletListing__listing__nameWallet'>
                    <>
                      {' '}
                      <div className={'balanceDetails__dropdownStyle1'}>
                        <h3
                          style={{
                            maxWidth: '186px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          onClick={() => handleClick(el.id)}
                        >
                          {el.name}
                        </h3>
                        <Dropdown
                          className='listingDropDown'
                          menu={{
                            items: (el.isWatchOnly
                              ? itemWithWatchOnly
                              : items
                            ).filter(
                              (item) => !(item.key === '1' && el.isWatchOnly)
                            ),
                          }}
                          trigger={['click']}
                        >
                          <Link
                            onClick={(e) => {
                              e.preventDefault(); // Prevent the default link behavior
                              e.stopPropagation(); // Stop the event from propagating to the parent div
                              setSelected(el);
                            }}
                          >
                            <img
                              src={InfoIcon}
                              alt=''
                              style={{
                                height: '15px',
                                width: '15px',
                                objectFit: 'contain',
                                position: 'relative',
                                top: '3px',
                              }}
                              onClick={() => {
                                setSelected(el);
                              }}
                            />
                          </Link>
                        </Dropdown>
                      </div>
                    </>
                    <p onClick={() => handleClick(el.id)}>
                      {el.defaultHomePage ? 'Default Homepage' : ''}
                    </p>
                    <p onClick={() => handleClick(el.id)}>
                      {el.isWatchOnly ? 'Watch-Only Wallet' : ''}
                    </p>
                  </div>
                </div>
                <div
                  className='walletListing__listing__leftSec'
                  style={{
                    position: 'absolute',
                    right: '0px',
                  }}
                >
                  <div
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      top: '-4px',
                    }}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='35'
                      height='35'
                      viewBox='0 0 24 24'
                      onClick={async (e) => {
                        e.stopPropagation();
                        setClickedUp(true);
                        if (index === 0) return;
                        const previousIndex = index;
                        const nextIndex = index - 1;

                        setData(reorder(data, previousIndex, nextIndex));
                        const finalData = reorder(
                          data,
                          previousIndex,
                          nextIndex
                        );
                        setClickedUp(false);
                        await WalletHelper.reorderWallet(finalData);
                      }}
                      style={{
                        position: 'relative',
                      }}
                      className='hover_only'
                    >
                      <g
                        id='Group_171587'
                        data-name='Group 171587'
                        transform='translate(-15782 -7374)'
                      >
                        <g
                          id='Rectangle_59676'
                          data-name='Rectangle 59676'
                          transform='translate(15782 7374)'
                          fill='#fff'
                          stroke='#223f70'
                          stroke-width='1'
                          opacity='0'
                        >
                          <rect width='24' height='24' stroke='none' />
                          <rect
                            x='0.5'
                            y='0.5'
                            width='23'
                            height='23'
                            fill='none'
                          />
                        </g>
                        <g
                          id='Layer_2'
                          data-name='Layer 2'
                          transform='translate(15780.268 7375.118)'
                        >
                          <path
                            id='Path_111695'
                            data-name='Path 111695'
                            d='M18.749,9.449a.714.714,0,0,1-.507-.21L13.733,4.73,9.223,9.239A.716.716,0,1,1,8.21,8.226L13.226,3.21a.716.716,0,0,1,1.013,0l5.016,5.016a.717.717,0,0,1-.507,1.223Z'
                            fill={clickedUp ? '#00aeef' : '#bbb'} // Change color on click
                          />
                        </g>
                      </g>
                    </svg>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='35'
                      height='35'
                      viewBox='0 0 24 24'
                      onClick={async (e) => {
                        e.stopPropagation();
                        setClickedDown(true);
                        if (index === data.length - 1) return;
                        const previousIndex = index;
                        const nextIndex = index + 1;

                        setData(reorder(data, previousIndex, nextIndex));
                        const finalData = reorder(
                          data,
                          previousIndex,
                          nextIndex
                        );
                        await WalletHelper.reorderWallet(finalData);
                        setClickedDown(false);
                      }}
                      style={{
                        marginTop: '-23px',
                        position: 'relative',
                        top: '10px',
                      }}
                      className='hover_only'
                    >
                      <g
                        id='Group_171587'
                        data-name='Group 171587'
                        transform='translate(-15782 -7374)'
                      >
                        <g
                          id='Rectangle_59676'
                          data-name='Rectangle 59676'
                          transform='translate(15782 7374)'
                          fill='#fff'
                          stroke='#223f70'
                          stroke-width='1'
                          opacity='0'
                        >
                          <rect width='24' height='24' stroke='none' />
                          <rect
                            x='0.5'
                            y='0.5'
                            width='23'
                            height='23'
                            fill='none'
                          />
                        </g>
                        <g
                          id='Layer_2'
                          data-name='Layer 2'
                          transform='translate(15780.268 7375.118)'
                        >
                          <path
                            id='Path_111694'
                            data-name='Path 111694'
                            d='M13.733,26.449a.714.714,0,0,1-.507-.21L8.21,21.224A.716.716,0,1,1,9.223,20.21l4.509,4.509,4.509-4.509a.716.716,0,1,1,1.013,1.013l-5.016,5.015a.714.714,0,0,1-.507.21Z'
                            transform='translate(0 -7.685)'
                            fill={clickedDown ? '#00aeef' : '#bbb'} // Change color on click
                          />
                        </g>
                      </g>
                    </svg>
                  </div>
                </div>
                <div
                  className='walletListing__listing__rytSec'
                  onClick={() => handleClick(el.id)}
                  style={{
                    display: 'flex',
                    flex: 1,
                    width: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  {balanceOut ? (
                    <h3>
                      {currency.symbol}
                      {el.fiatValue}
                    </h3>
                  ) : (
                    <h3>****</h3>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      {contextHolder}

      <ModalCustom
        title={'Show Secret Phrase'}
        handleCancel={handleCancel1}
        isModalOpen={isModalOpen1}
        handleOk={handleOk1}
        customClass='customClassModal'
      >
        <div className={'viewphrases'}>
          <InputFieldSimple
            placeholder='Password'
            getData={setPassword}
            value={password}
            customFunction={async () => {
              if (!password) {
                return messageApi.error('Please enter a valid password.', 1);
              }
              const response = await WalletHelper.getMnemonicsByPassword(
                selected.coinFamilyAndAddress[1],
                password
              );
              if (!response) {
                return messageApi.error('Please enter a valid password.');
              }
              navigate('/showSecretPhrase', {
                state: {
                  mnemonics: response,
                  backTo: '/wallet',
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
              if (!password) {
                return messageApi.error('Please enter a valid password.');
              }
              const response = await WalletHelper.getMnemonicsByPassword(
                selected.coinFamilyAndAddress[1],
                password
              );
              if (!response) {
                return messageApi.error('Please enter a valid password.');
              }
              navigate('/showSecretPhrase', {
                state: {
                  mnemonics: response,
                  backTo: '/wallet',
                  password:password
                },
              });
            }}
          />
        </div>
      </ModalCustom>

      <ModalCustom
        title={'Delete Wallet'}
        isModalOpen={deleteModal}
        customClass='customClassModal'
        handleCancel={() => {
          setDeleteModal(false);
        }}
      >
        <div className='viewphrases'>
          <div className='viewphrases__iInner'>
            <p
              style={{
                fontSize: '20px',
                color: "white"
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
            }}
          >
            <ButtonComp
              maxWidth="100%"
              onClick={async () => {
                store.dispatch(setLoading(true));

                if (selected.default) {
                  store.dispatch(setLoading(false));
                  return messageApi.error(
                    'You cannot delete the default wallet.'
                  );
                }

                await WalletHelper.deleteWallet(selected.id, selected.address);

                // console.log({
                //   is_watch_only: selected.isWatchOnly ? 1 : 0,
                //   wallet_name: selected.name,
                //   address_list_array: Object.keys(selected.coinFamilyAndAddress)
                //     .map((key) => {
                //       return {
                //         coin_family: key,
                //         wallet_address: selected.coinFamilyAndAddress[key],
                //       };
                //     })
                //     .filter((el) => el.wallet_address),
                // });

                await server.post(
                  `/wallet/delete_wallet`,
                  {
                    is_watch_only: selected.isWatchOnly ? 1 : 0,
                    wallet_name: selected.name,
                    address_list_array: Object.keys(
                      selected.coinFamilyAndAddress
                    )
                      .map((key) => {
                        return {
                          coin_family: key,
                          wallet_address: selected.coinFamilyAndAddress[key],
                        };
                      })
                      .filter((el) => el.wallet_address),
                  },
                  {
                    headers: {
                      Authorization: selected.jwtToken,
                    },
                  }
                );
                await init();
                setDeleteModal(false);
                store.dispatch(setLoading(false));
              }}
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
    </div>
  );
}

export default WalletListing;
