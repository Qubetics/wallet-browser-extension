import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './CoinsTable.scss';
import Edit from '../../Assets/edit.svg';
import bin from '../../Assets/DeleteIcon.svg';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { WalletHelper } from '../../helpers/wallet.helper';
import ModalCustom from '../ModalCustom/ModalCustom';
import { capitalize } from '../../helpers/conversion.helper';
import DummyEle from './DummyEle';
import blackStar from '../../Assets/blackStar.svg';
import blueStar from '../../Assets/blueStar.svg';
import { token_type } from '../../helpers/constant';
import ButtonComp from '../ButtonComp/ButtonComp';
import { Tooltip } from 'antd';

function CoinsTable({ dataArray, showCoinPrice, name }) {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const { currency } = useSelector((state) => state);
  const { chain, balanceIn } = useSelector((state) => state);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);

  const handleClick = (ele) => {
    // console.log('crypto element clicked:', ele);

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

  const showDeleteModal = (coin) => {
    setSelectedCoin(coin);
    setIsModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCoin && selectedCoin.watch) {
      selectedCoin.watch();
    }
    setIsModalVisible(false);
  };

  return (
    <>
      {dataArray.map((ele, index) => (
        <div
          className="coinsTable1 flex-item"
          key={index}
          onClick={() => handleClick(ele)}
        >
          <div className="coinsTable1__left">
            <div className="coinsTable1__left__icon">
              {ele.coinIcon ? (
                <img src={ele.coinIcon} className="detailIcon" alt="" />
              ) : (
                <div
                  className="randb extra borderDarkLight"
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
            <div className="coinsTable1__left__textSec">
              <div
                onClick={() => handleClick(ele)}
                className="coinsTable1__textTop"
                style={{ cursor: 'pointer' }}
              >
                <span className="coinNname">
                  <Tooltip title={`${ele?.coinSubName}`}>
                    {ele?.coinSubName?.length > 10 &&
                    ele?.coin?.coin?.token_address
                      ? `${ele.coinSubName.substring(0, 15)}`
                      : `${ele.coinSubName.substring(0, 15)}`}
                  </Tooltip>
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    color: '#FFFFFF',
                    marginLeft: '3px',
                  }}
                >
                  {/* {ele?.coin?.coin_family == 9 ? "PLS" : ele.type} */}
                  {ele?.coin?.coin?.token_address
                    ? `(${token_type(ele?.coin?.coin?.coin_family)})`
                    : `${ele.type ? '(' + ele.type + ')' : ''}`}
                </span>
                <div className={`${'coinsTable1__grayText12'} textBold`}></div>
              </div>
              <div
                style={{ color: '#98969B' }}
                className="grayText1 test-class"
              >
                {ele.routeTo === 'no-where' ? '' : currency.symbol}
                <div
                  dangerouslySetInnerHTML={{ __html: ele.coinPrice }}
                ></div>{' '}
                {/* &nbsp;| */}
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

              {ele.provider ? (
                <div
                  className="coinsTable1__grayText12"
                  style={{
                    marginTop: '7px',
                  }}
                ></div>
              ) : null}
            </div>
          </div>

          <div className="coinsTable1__right">
            <div>
              {showCoinPrice ? (
                <span
                  style={{
                    color: '#98969B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {/* <span style={{ color: "#98969B" }}>
                    {currency.symbol}{" "}
                    {ele.currPriceValue ? ele.currPriceValue.toFixed(2) : 0}
                  </span> */}
                  {name == 'portfolio' && (
                    <img
                      style={{ marginLeft: 15, cursor: 'pointer' }}
                      onClick={() => showDeleteModal(ele)}
                      src={bin}
                    />
                  )}
                </span>
              ) : ele.watch ? (
                ele.isActiveInWatchList ? (
                  <img
                    onClick={() => ele.watch()}
                    style={{ cursor: 'pointer' }}
                    src={blueStar}
                    alt="star"
                  />
                ) : (
                  <img
                    onClick={() => ele.watch()}
                    style={{ cursor: 'pointer' }}
                    src={blackStar}
                    alt="star"
                  />
                )
              ) : (
                <DummyEle ele={ele} />
              )}

              {ele.watch ? null : (
                <div
                  className="coinsTable1__grayText12"
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
                      className="coinsTable1__grayText12"
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
              <div className="editBtn">
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
                  alt=""
                />
              </div>
            ) : null}
          </div>
        </div>
      ))}

      <ModalCustom
        title={'Price Alerts'}
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
              Are you sure you want to Delete this Alert?
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
              onClick={async () => {
                store.dispatch(setLoading(true));
                await WalletHelper.removeAlert(selected);
                store.dispatch(setLoading(false));
                setDeleteModal(false);
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
            {/* <div
              className="green"
              style={{
                padding: "12px 53px",
                backgroundColor: "green",
                color: "white",
                fontSize: "18px",
                borderRadius: "7px",
                marginRight: "20px",
                cursor: "pointer",
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
              className="red"
              style={{
                padding: "12px 53px",
                backgroundColor: "red",
                color: "white",
                fontSize: "18px",
                borderRadius: "7px",
                marginLeft: "20px",
                cursor: "pointer",
              }}
              onClick={() => {
                setDeleteModal(false);
              }}
            >
              No
            </div> */}
          </div>
        </div>
      </ModalCustom>

      <ModalCustom
        title={'Confirm Delete'}
        isModalOpen={isModalVisible}
        customClass="customClassModal"
        handleCancel={() => {
          setIsModalVisible(false);
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
              Are you sure you want to delete this asset from the watchlist ?
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
              onClick={handleConfirmDelete}
              text="Yes"
            />
            <div className="cancelBtn">
              <ButtonComp
                maxWidth="100%"
                onClick={() => {
                  setIsModalVisible(false);
                }}
                text="No"
              />
            </div>
            {/* <div
              className="green"
              style={{
                padding: "12px 53px",
                backgroundColor: "rgb(56 101 109)",
                color: "white",
                fontSize: "18px",
                borderRadius: "7px",
                marginRight: "20px",
                cursor: "pointer",
              }}
              onClick={handleConfirmDelete}
            >
              Yes
            </div> */}
            {/* <div
              className="red"
              style={{
                padding: "12px 53px",
                backgroundColor: "red",
                color: "white",
                fontSize: "18px",
                borderRadius: "7px",
                marginLeft: "20px",
                cursor: "pointer",
              }}
              onClick={() => {
                setIsModalVisible(false);
              }}
            >
              No
            </div> */}
          </div>
        </div>
      </ModalCustom>
    </>
  );
}

export default CoinsTable;
