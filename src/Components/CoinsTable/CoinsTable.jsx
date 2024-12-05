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

function CoinsTable({ dataArray }) {
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const { currency } = useSelector((state) => state);
  const { chain, balanceIn } = useSelector((state) => state);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [positionChange, setPositionChnage] = useState(null);
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
                <spanc className='coinNname'>{ele.coinSubName}</spanc>
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
                ></div>{' '}&nbsp;|
                <div
                  className={`${'coinsTable1__grayText12'} ${
                    ele.coinStatus <= 0 ? 'negitiveText' : 'positiveText'
                  }`}
                  style={{ marginLeft: '3px' }}
                >
                  {ele.coinStatus < 0 ? '' : '+'}
                  {ele.coinStatus}%
                </div>
              </div>
              {/* {ele.sent === true || ele.sent === false ? (
                <div className='coinsTable1__grayText12'>
                  Status: {ele.sent ? "Sent" : "Pending"}
                  <img
                    onClick={async () => {
                      store.dispatch(setLoading(true));
                      setDeleteModal(true);
                      setSelected(ele.alertId);
                      store.dispatch(setLoading(false));
                    }}
                    src={bin}
                    style={{
                      height: "16px",
                      width: "16px",
                      marginLeft: "10px",
                    }}
                    alt=''
                  />
                  <img
                    onClick={async () => {

                    }}
                    src={EDIT}
                    style={{
                      height: "16px",
                      width: "16px",
                      marginLeft: "10px",
                    }}
                    alt=''
                  />
                </div>
              ) : null} */}
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
              {/* <div
                className='coinsTable1__textTop'
                ref={(element) => {
                  if (element) {
                    const maxWidth = 153; // Maximum width of the box
                    const textWidth = element.getBoundingClientRect().width;
                    const isTextOverflowing = textWidth > maxWidth;
                    element.style.fontSize = isTextOverflowing
                      ? '11px'
                      : '13px';
                  }
                }}
                style={{
                  maxWidth: '153px',
                  justifyContent:
                    ele.currCryptoBal === 'ABOVE' ||
                    ele.currCryptoBal === 'BELOW'
                      ? 'start'
                      : 'end',
                }}
              >
                {ele.currCryptoBal}
              </div> */}
              <DummyEle ele={ele} />
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
