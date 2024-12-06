import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './CoinsTable.scss';
import Mercuryo from '../../Assets/Coins/Mercuryo.png';
import Transak from '../../Assets/Coins/Transak.png';
import Simplex from '../../Assets/Simplex.png';
import Alchemy from '../../Assets/Coins/Alchemy.png';
import EDIT from '../../Assets/edit.png';
import Edit from '../../Assets/edit.svg';
import bin from '../../Assets/delete.png';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { WalletHelper } from '../../helpers/wallet.helper';
import ModalCustom from '../ModalCustom/ModalCustom';
import { capitalize } from '../../helpers/conversion.helper';
import DummyEle from './DummyEle';
import { Draggable } from 'react-drag-reorder';

function CoinsTable({ dataArray, showCoinPrice }) {
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const { currency } = useSelector((state) => state);
  const { chain, balanceIn } = useSelector((state) => state);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [positionChange, setPositionChnage] = useState(null);

  console.log(dataArray, "dataArraydataArraydataArraydataArray");

  const handleClick = (ele) => {

    let routes = Object.keys(ele).includes('routeTo');

    if (routes) {
      if (ele.showModal) {
        return ele.showModal(ele.coin);
      }

      if (ele.routeTo === 'no-where') {
        if (ele.sent === true || ele.sent === false) {
          store.dispatch(setLoading(true));
          setDeleteModal(true);
          setSelected(ele.alertId);
          store.dispatch(setLoading(false));
          return;
        } else {
          return;
        }
      }

      if (ele.routeTo === 'enter-price-spritz') {
        return navigate(`/${ele.routeTo}`, {
          state: {
            coin: ele.coin,
            account: ele.account,
          },
        });
      }

      navigate(`/${ele.routeTo}`, {
        state: {
          symbol: ele.coinName,
          image: ele.coinIcon,
          type: ele.type,
          coin: ele.coin,
        },
      });
    } else {
      if (ele.setSelectedCoin) {
        ele.setSelectedCoin(ele.id);
      }
      setOpenModal(ele.openModal());
    }
  };

  return (
    <>
      {dataArray.map((ele, index) => (
        <div
          className='coinsTable1 flex-item'
          style={
            {
              // padding: index !== 0 ? '16px 0' : '0 0 16px 0',
              // paddingTop: index === 0 ? '0px' : '16px',
              // paddingBottom: index === dataArray.length - 1 ? '0px' : '16px',
              // borderBottomWidth: index === dataArray.length - 1 ? '0' : '1px',
              // borderTopWidth: 0,
              // borderLeftWidth: 0,
              // borderRightWidth: 0,
              // borderStyle: 'solid',
            }
          }
          key={index}
          onClick={() => handleClick(ele)}
        >
          <div className='coinsTable1__left'>
            <div className='coinsTable1__left__icon'>
              {ele.coinIcon ? (
                <img src={ele.coinIcon} className='detailIcon' alt='' />
              ) : (
                <div
                  className='randb extra borderDarkLight'
                  style={{
                    height: '30px',
                    width: '30px',
                    background: 'rgb(202, 201, 201)',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid',
                  }}
                >
                  {ele.coinName.split('')[0]}
                </div>
              )}
            </div>
            <div className='coinsTable1__left__textSec'>
              <div
                onClick={() => handleClick(ele)}
                className='coinsTable1__textTop'
                style={{ cursor: 'pointer' }}
              >
                <span className='coinNname'>{ele.coinSubName}</span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#6e737e',
                    marginLeft: '3px',
                  }}
                >
                  {ele?.coin?.coin_family == 9 ? 'PLS' : ele.type}
                </span>
                <div className={`${'coinsTable1__grayText12'} textBold`}></div>
              </div>
              <div className='grayText1 test-class'>
                {ele.routeTo === 'no-where' ? '' : currency.symbol}
                <div
                  dangerouslySetInnerHTML={{ __html: ele.coinPrice }}
                ></div>{' '}
                &nbsp;|
                <div
                  className={`${'coinsTable1__grayText12'} ${ele.coinStatus <= 0 ? 'negitiveText' : 'positiveText'
                    }`}
                  style={{ marginLeft: '3px' }}
                >
                  {ele.coinStatus < 0 ? '' : '+'}
                  {ele.coinStatus}%
                </div>
              </div>

              {ele.provider ? (
                <div
                  className='coinsTable1__grayText12'
                  style={{
                    marginTop: '7px',
                  }}
                ></div>
              ) : null}
            </div>
          </div>


          <div className='coinsTable1__right'>
            <div>
              {showCoinPrice ? (
               <span>{ele.coinName}<span style={{ marginLeft: '4px' }}>{ele.currPriceValue ? ele.currPriceValue.toFixed(2) : 0}</span></span>
              ) : (
                ele.watch ? (
                  ele.isActiveInWatchList ? (
                    <svg
                      version='1.0'
                      style={{
                        cursor: 'pointer',
                      }}
                      onClick={ele.watch}
                      height={21}
                      width={21}
                      id='Layer_1'
                      viewBox='0 0 64 64'
                      enable-background='new 0 0 64 64'
                      fill='#FFD700'
                    >
                      <g id='SVGRepo_bgCarrier' stroke-width='0'></g>
                      <g
                        id='SVGRepo_tracerCarrier'
                        stroke-linecap='round'
                        stroke-linejoin='round'
                      ></g>
                      <g id='SVGRepo_iconCarrier'>
                        <path
                          fill='#FFD700'
                          d='M62.799,23.737c-0.47-1.399-1.681-2.419-3.139-2.642l-16.969-2.593L35.069,2.265 C34.419,0.881,33.03,0,31.504,0c-1.527,0-2.915,0.881-3.565,2.265l-7.623,16.238L3.347,21.096c-1.458,0.223-2.669,1.242-3.138,2.642 c-0.469,1.4-0.115,2.942,0.916,4l12.392,12.707l-2.935,17.977c-0.242,1.488,0.389,2.984,1.62,3.854 c1.23,0.87,2.854,0.958,4.177,0.228l15.126-8.365l15.126,8.365c0.597,0.33,1.254,0.492,1.908,0.492c0.796,0,1.592-0.242,2.269-0.72 c1.231-0.869,1.861-2.365,1.619-3.854l-2.935-17.977l12.393-12.707C62.914,26.68,63.268,25.138,62.799,23.737z'
                        ></path>
                      </g>
                    </svg>
                  ) : (
                    <svg
                      height={21}
                      width={21}
                      viewBox='0 0 24 24'
                      style={{
                        cursor: 'pointer',
                      }}
                      fill='none'
                      onClick={ele.watch}
                    >
                      <g id='SVGRepo_bgCarrier' stroke-width='0'></g>
                      <g
                        id='SVGRepo_tracerCarrier'
                        stroke-linecap='round'
                        stroke-linejoin='round'
                      ></g>
                      <g id='SVGRepo_iconCarrier'>
                        <path
                          d='M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z'
                          stroke='#000000'
                          stroke-width='0.528'
                          stroke-linecap='round'
                          stroke-linejoin='round'
                        ></path>
                      </g>
                    </svg>
                  )
                ) : (
                  <DummyEle ele={ele} />
                )
              )}

              {ele.watch ? null : (
                <div
                  className='coinsTable1__grayText12'
                  style={{ justifyContent: 'flex-end' }}
                >
                  {ele.currDollerBal === 'ABOVE' ||
                    ele.currDollerBal === 'BELOW' ? (
                    `Price ${capitalize(ele.currDollerBal)}`
                  ) : (
                    <>
                      {ele.routeTo === 'no-where'
                        ? ''
                        : balanceIn
                          ? ele.routeTo === 'enter-price-spritz'
                            ? '$'
                            : currency.symbol
                          : ''}
                      {ele.currDollerBal}
                    </>
                  )}
                  {ele.sent === true || ele.sent === false ? (
                    <div
                      className='coinsTable1__grayText12'
                      style={{
                        color: ele.sent ? '#058b56' : '#f6465d',
                      }}
                    >
                      {ele.sent ? 'Completed' : 'Pending'}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {ele.sent === true || ele.sent === false ? (
              <div className='editBtn'>
                <img
                  src={Edit}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/add-alert', {
                      state: {
                        type: ele.currDollerBal.toLowerCase(),
                        id: ele.alertId,
                        price: ele.originalPrice,
                        coinId: ele.coinId,
                        currencyUsed: ele.currencyUsed,
                        currencyUsedSymbol: ele.currencyUsedSymbol,
                      },
                    });
                  }}
                  alt=''
                />
              </div>
            ) : null}
          </div>
        </div>
      ))}

      <ModalCustom
        title={'Price Alerts'}
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
              }}
            >
              Are you sure you want to Delete this Alert?
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
                store.dispatch(setLoading(true));
                await WalletHelper.removeAlert(selected);
                store.dispatch(setLoading(false));
                setDeleteModal(false);
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
                setDeleteModal(false);
              }}
            >
              No
            </div>
          </div>
        </div>
      </ModalCustom>
    </>
  );
}

export default CoinsTable;
