/*global chrome */
import React, { useEffect, useState } from 'react';
import '../Withdraw/Withdraw.scss';
import DarkArrowRightIcon from '../../Assets/DarkArrowRightIcon.svg';
import DarkBank from '../../Assets/darkBank.svg';
import LightBank from '../../Assets/lightBank.svg';
import DarkBill from '../../Assets/darkBill.svg';
import LightBill from '../../Assets/lightBill.svg';
import DarkCrediCard from '../../Assets/DarkCrediCard.svg';
import LightCrediCard from '../../Assets/LightCrediCard.svg';
import DarkCardPayments from '../../Assets/DarkCardPayments.svg';
import LightCardPayments from '../../Assets/LightCardPayments.svg';
import DarkMortgage from '../../Assets/DarkMortgage.svg';
import LightMortgage from '../../Assets/LightMortgage.svg';
import DarkUtilities from '../../Assets/DarkUtilities.svg';
import LightUtilities from '../../Assets/LightUtilities.svg';
import DarkSeeAll from '../../Assets/DarkSeeAll.svg';
import LightSeeAll from '../../Assets/LightSeeAll.svg';
import DarkStudentLoan from '../../Assets/DarkStudentLoan.svg';
import LightStudentLoan from '../../Assets/LightStudentLoan.svg';
import Add from '../../Assets/PlusBordredIcon2.svg';
import darkHistoryList from '../../Assets/settings/DarkTransaction.svg';
import HistoryList from '../../Assets/his.svg';
import Search from '../../Assets/SearchIcon.svg';
import DarkPlusBordredIcon from '../../Assets/DarkPlusBordredIcon.svg';
import LightLinkBill from '../../Assets/linkBill.svg';
import DarkLinkBill from '../../Assets/darkLinkBill.svg';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { spritzHelper } from '../../helpers/spritz.helper';
import { Drawer } from 'antd';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import darkclose from '../../Assets/darkclose.svg';
import { InputField } from '../../Components/InputField/InputFieldSimple';
import { server } from '../../server';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { setCreate } from '../../actions/create';
import { setBillListAction } from '../../actions/billList';
import { setBillPaySpritzFilter } from '../../actions/filter';

function BillPay() {
  const navigate = useNavigate();
  const { theme, account } = useSelector((state) => state);
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState(null);
  const [allToken, setAllTokens] = useState([]);
  const [billList, setBillList] = useState([]);
  const [token, setToken] = useState(null);
  const [category, setCategory] = useState([]);
  const [openLinkBill, setOpenLinkBill] = useState(false);
  const [selectedLinkBill, setSelectedLinkBill] = useState(null);
  const init = async () => {
    try {
      store.dispatch(setLoading(true));
      const walletsList = await server.post(
        `/wallet/tokens`,
        {
          address_list: [
            account.coinFamilyAndAddress[6],
            account.coinFamilyAndAddress[3],
            account.coinFamilyAndAddress[7],
            account.coinFamilyAndAddress[1],
          ],
          coin_family: [6, 3, 7, 1],
          fiat_currency: 'USD',
          per_page: 5000,
          page: 1,
          search: keyword ? keyword.trim() : undefined,
          is_watch_only: account.isWatchOnly ? 1 : 0,
          wallet_name: account.name,
          address_list_array: [
            {
              coin_family: 4,
              address: account.coinFamilyAndAddress[6],
            },
            {
              coin_family: 3,
              address: account.coinFamilyAndAddress[3],
            },
            {
              coin_family: 7,
              address: account.coinFamilyAndAddress[7],
            },
            {
              coin_family: 1,
              address: account.coinFamilyAndAddress[1],
            },
          ],
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      setAllTokens(walletsList.data.data);
      const { billPaytoken } = await chrome.storage.local.get('billPaytoken');

      if (billPaytoken) {
        const findToken = walletsList.data.data.find(
          (el) => el.id == billPaytoken.id
        );
        await chrome.storage.local.set({
          billPaytoken: findToken ? findToken : walletsList.data.data[0],
        });
        setToken(findToken ? findToken : walletsList.data.data[0]);
      } else {
        await chrome.storage.local.set({
          billPaytoken: walletsList.data.data[0],
        });
        setToken(walletsList.data.data[0]);
      }

      store.dispatch(setLoading(false));
    } catch (error) {
      store.dispatch(setLoading(false));
      // console.log('error:::', error);
    }
  };

  useEffect(() => {
    let debounceTimer;

    const handleDebouncedSearch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        init();
      }, 2000);
    };

    if (keyword) {
      handleDebouncedSearch();
    } else {
      init();
    }

    return () => clearTimeout(debounceTimer);
  }, [keyword]);

  const getBillListFn = async () => {
    let bill = await spritzHelper.getBillList();
    setBillList(bill);
  };

  useEffect(() => {
    getBillListFn();
    store.dispatch(setBillPaySpritzFilter(null));
  }, []);

  const groupedData = billList?.reduce((acc, account) => {
    const type = account.billType;

    if (!acc[type]) {
      acc[type] = {
        type,
        data: [],
      };
    }

    const liabilityData = account;

    acc[type].data.push({
      liabilityData,
    });

    return acc;
  }, {});

  const result = Object.values(groupedData);
  // setCategory(result);

  return (
    <div className='billpaySec'>
      <div className='topHeadingPay'>
        {!token?.coin_data?.coin_image ? (
          <div
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(98,126,234,.2)',
              borderRadius: '49%',
              display: 'flex',
              height: '20px',
              justifyContent: 'center',
              width: '20px',
              marginRight: '0px',
              marginTop: '20px',
            }}
          >
            {' '}
            {token?.coin_data?.coin_name.split('')[0]}
          </div>
        ) : (
          <img
            style={{
              width: '20px',
              // marginRight: "15px",
              marginTop: '20px',
            }}
            src={`${process.env.REACT_APP_IMAGE_BASE_URL}${token?.coin_data?.coin_image}`}
            alt=''
          />
        )}
        <h2 onClick={() => setOpen(true)}>
          {token?.coin_data?.coin_name} <img src={DarkArrowRightIcon} />
        </h2>
        <p>
          {' '}
          {token?.address &&
            `${token?.address.substring(0, 7)}.....${token?.address.substring(
              token?.address.length - 7,
              token?.address.length
            )}`}
        </p>
      </div>
      <div className='billpayScrool'>
        {/* <div
          style={{
            justifyContent: "end",
            marginTop: "20px",
            marginRight: "15px",
          }}
          className="withdrawHeading"
        >
          <div
            style={{
              display: "flex",
              cursor: "pointer",
              alignItems: "center",
            }}
            onClick={() => {
              store.dispatch(setCreate(true));
              store.dispatch(setBillListAction(billList));
              navigate("/billPay-history-spritz", {
                state: {
                  billId: billList[0]?.id,
                  billList: billList,
                },
              });
            }}
          >
            <img
              src={theme == "darkTheme" ? darkHistoryList : HistoryList}
              alt=""
              style={{ marginRight: "2px" }}
            />
            <h4>History</h4>
          </div>
        </div> */}
        <div className='clickCard'>
          <div
            className='cardSec'
            onClick={() =>
              navigate('/bankAccountListing', {
                state: {
                  fromBillPay: true,
                },
              })
            }
          >
            {theme == 'darkTheme' ? (
              <img src={DarkBank} />
            ) : (
              <img src={LightBank} />
            )}
            <h3>Bank Account</h3>
          </div>
          <div
            className='cardSec'
            onClick={() => {
              store.dispatch(setCreate(true));
              store.dispatch(setBillListAction(billList));
              navigate('/billPay-history-spritz', {
                state: {
                  billId: billList[0]?.id,
                  billList: billList,
                },
              });
            }}
          >
            {theme == 'darkTheme' ? (
              <img src={DarkBill} />
            ) : (
              <img src={LightBill} />
            )}
            <h3>My Bills</h3>
          </div>
        </div>

        {/*    ******************************** Categories ****************************** */}
        <div className='payheading'>
          <h3>Bill Payments</h3>
        </div>
        <div className='payCreadCard'>
          <div className='cardPay'>
            {result.length > 0 &&
              result?.map((list) => {
                return (
                  <div
                    className='innerCardSec'
                    onClick={() =>
                      navigate('/billAddToken', {
                        state: {
                          billType: list?.type,
                        },
                      })
                    }
                  >
                    {theme == 'darkTheme' ? (
                      <img src={DarkCrediCard} />
                    ) : (
                      <img src={LightCrediCard} />
                    )}
                    <h3>{list?.type}</h3>
                  </div>
                );
              })}
          </div>
          <div className='addBillBtn'>
            <Link to='/billAddToken'>
              {theme == 'darkTheme' ? (
                <img src={DarkPlusBordredIcon} />
              ) : (
                <img src={Add} />
              )}
              <span>Add Bill</span>
            </Link>
          </div>
        </div>

        <div className='payheading'>
          <h3> Linked Bills</h3>
        </div>
        <div className='linkedBill'>
          {billList.length > 0 ? (
            billList?.map((item) => {
              return (
                <div className='innerContact'>
                  <div
                    className='left'
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setOpenLinkBill(true);
                      setSelectedLinkBill(item);
                    }}
                  >
                    {theme == 'darkTheme' ? (
                      <img
                        style={{
                          height: '40px',
                          width: '40px',
                        }}
                        src={item?.institution?.logo}
                      />
                    ) : (
                      <img
                        style={{
                          height: '40px',
                          width: '40px',
                        }}
                        src={item?.institution?.logo}
                      />
                    )}
                    <div className='leftInner'>
                      <h2 style={{ width: '160px' }}>
                        {item?.institution?.name}
                      </h2>
                      <p style={{ width: '160px' }} className='whiteblack'>
                        {item?.name}
                      </p>
                      <p>
                        {item?.billAccountDetails?.amountDue
                          ? item?.billAccountDetails?.amountDue
                          : '$0'}
                      </p>
                    </div>
                  </div>
                  <div className='right'>
                    <button
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        navigate('/creditBillPay', {
                          state: {
                            billAmount: item,
                          },
                        })
                      }
                    >
                      Pay
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p
              style={{ marginTop: '20px', fontSize: 16 }}
              className={
                theme == 'darkTheme' ? 'darkThemeText' : 'lightThemeText'
              }
            >
              No linked Bills
            </p>
          )}
        </div>
      </div>

      <Drawer
        title='Select Token'
        placement='bottom'
        onClose={() => {
          setOpen(false);
          setKeyword(null);
        }}
        open={open}
        closeIcon={
          theme == 'darkTheme' ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
        height={500}
        // addonBefore={
        //   <span>
        //     <img
        //       src={Search}
        //       style={{
        //         width: "17px",
        //       }}
        //       alt=""
        //     />
        //   </span>
        // }
      >
        <div
          className='contain'
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* <div className="search" style={{ marginBottom: "30px" }}>
            <InputField
              placeholder={"Search"}
              coloredBg={"#eef3f9"}
              value={keyword}
              checkForSymbols={true}
              getData={(value) => {
                setKeyword(value);
              }}
            />
          </div> */}

          <div className='search' style={{ marginBottom: '30px' }}>
            <InputField
              placeholder={'Search'}
              coloredBg={'#eef3f9'}
              value={keyword}
              checkForSymbols={true}
              getData={(value) => {
                const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
                if (hasEmoji && value.length > 25) {
                  return false;
                }
                setKeyword(value);
              }}
              addonBefore={
                <span>
                  <img
                    src={Search}
                    style={{
                      width: '17px',
                    }}
                    alt=''
                  />
                </span>
              }
            />
          </div>

          <div
            className='right'
            style={{
              flex: 1,
              overflow: 'scroll',
            }}
          >
            {allToken.length > 0 ? (
              allToken.map((token) => (
                <div
                  className='design'
                  style={{
                    width: '100%',
                  }}
                  onClick={async () => {
                    await chrome.storage.local.set({
                      billPaytoken: token,
                    });
                    setToken(token);
                    setOpen(false);
                  }}
                >
                  <div
                    className='token'
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      marginBottom: '20px',
                      padding: '8px',
                      borderRadius: '30px',
                      marginLeft: '7px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      width: '100%;',
                    }}
                    onClick={async () => {
                      await chrome.storage.local.set({
                        billPaytoken: token,
                      });
                      setToken(token);
                      setOpen(false);
                    }}
                  >
                    {!token.coin_data.coin_image ? (
                      <div
                        style={{
                          alignItems: 'center',
                          backgroundColor: 'rgba(98,126,234,.2)',
                          borderRadius: '49%',
                          display: 'flex',
                          height: '29px',
                          justifyContent: 'center',
                          width: '29px',
                          marginRight: '15px',
                        }}
                      >
                        {' '}
                        {token?.coin_data?.coin_name.split('')[0]}
                      </div>
                    ) : (
                      <img
                        style={{
                          width: '29px',
                          marginRight: '15px',
                        }}
                        src={`${process.env.REACT_APP_IMAGE_BASE_URL}${token.coin_data.coin_image}`}
                        alt=''
                      />
                    )}

                    <p>
                      <span style={{ fontSize: '17px' }} className='noAddress'>
                        {token.coin_data.coin_name}{' '}
                      </span>
                      <span
                        className='noAddress'
                        style={{
                          fontSize: '11px',
                          marginLeft: '5px',
                        }}
                      >
                        {token.coin_data.token_type
                          ? `/ ${token.coin_data.token_type}`
                          : null}
                      </span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: 'center',
                }}
              >
                <p
                  className='noAddress'
                  style={{
                    marginTop: '4%',
                    marginBottom: '15px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                  }}
                >
                  Asset not found
                </p>
              </div>
            )}
          </div>
        </div>
      </Drawer>

      <Drawer
        title='Linked Bills'
        placement='bottom'
        onClose={() => {
          setOpenLinkBill(false);
          setSelectedLinkBill(null);
        }}
        height={280}
        open={openLinkBill}
        closeIcon={
          theme == 'darkTheme' ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
      >
        <div
          className='design'
          style={{
            width: '100%',
          }}
          onClick={async () => {}}
        >
          <div
            className='token'
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '8px',
              borderRadius: '30px',
              marginLeft: '7px',
              fontSize: '11px',
              cursor: 'pointer',
              width: '100%;',
            }}
            onClick={async () => {
              navigate('/editBill', {
                state: {
                  bill: selectedLinkBill,
                },
              });
            }}
          >
            <p>
              <span style={{ fontSize: '17px' }} className='noAddress'>
                Rename
              </span>
            </p>
          </div>
        </div>
        <div
          className='design'
          style={{
            width: '100%',
          }}
          onClick={async () => {}}
        >
          <div
            className='token'
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '8px',
              borderRadius: '30px',
              marginLeft: '7px',
              fontSize: '11px',
              cursor: 'pointer',
              width: '100%;',
            }}
            onClick={async () => {
              // console.log('selectedLinkBill', selectedLinkBill);
              await spritzHelper.deleteBill(selectedLinkBill.id);
              getBillListFn();
              setOpenLinkBill(false);
              setSelectedLinkBill(null);
            }}
          >
            <p>
              <span style={{ fontSize: '17px' }} className='noAddress'>
                Delete
              </span>
            </p>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default BillPay;
