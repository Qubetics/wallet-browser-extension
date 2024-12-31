import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./CoinsTable.scss";
import Mercuryo from "../../Assets/Coins/Mercuryo.png";
import Transak from "../../Assets/Coins/Transak.png";
import Simplex from "../../Assets/Simplex.png";
import Alchemy from "../../Assets/Coins/Alchemy.png";
import EDIT from "../../Assets/edit.png";
import Edit from "../../Assets/edit.svg";
import bin from "../../Assets/delete.png";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { WalletHelper } from "../../helpers/wallet.helper";
import ModalCustom from "../ModalCustom/ModalCustom";
import { capitalize } from "../../helpers/conversion.helper";
import DummyEle from "./DummyEle";
import { Draggable } from "react-drag-reorder";
import { server } from "../../server";
import Reorder, {
  reorder,
  reorderImmutable,
  reorderFromTo,
  reorderFromToImmutable,
} from "react-reorder";
import { token_type } from "../../helpers/constant";
function CoinsTableDraggable({ dataArray, refresh }) {
  const navigate = useNavigate();
  const { account } = useSelector((state) => state);

  const [openModal, setOpenModal] = useState(false);
  const { currency } = useSelector((state) => state);
  const { chain, balanceIn } = useSelector((state) => state);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [positionChange, setPositionChnage] = useState(null);

  const [data, setData] = useState(dataArray);
  const [clickedUp, setClickedUp] = useState(false);
  const [clickedDown, setClickedDown] = useState(false);
  useEffect(() => {
    setData(dataArray);
  }, [dataArray, data, setData]);

  const handleClick = (ele) => {
    let routes = Object.keys(ele).includes("routeTo");

    if (routes) {
      if (ele.showModal) {
        return ele.showModal(ele.coin);
      }

      if (ele.routeTo === "no-where") {
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

      if (ele.routeTo === "enter-price-spritz") {
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
      {data.map((ele, index) => (
        <li
          className="coinsTable1 flex-item"
          onClick={() => handleClick(ele)}
          style={{
            cursor: "pointer",
            position: "relative",
          }}
        >
          <div className="coinsTable1__left">
            <div className="coinsTable1__left__icon">
              {ele.coinIcon ? (
                <img
                  src={ele.coinIcon}
                  className="detailIcon currencyIcon"
                  alt=""
                />
              ) : (
                <div
                  className="randb extra borderDarkLight"
                  style={{
                    height: "30px",
                    width: "30px",
                    background: "rgb(202, 201, 201)",
                    borderRadius: "50%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "1px solid",
                  }}
                >
                  {ele.coinName.split("")[0]}
                </div>
              )}
            </div>

            <div className="coinsTable1__left__textSec">
              <div
                onClick={() => handleClick(ele)}
                className="coinsTable1__textTop"
                style={{ cursor: "pointer" }}
              >

                <span className="coinNname">

                  {
                    ele?.coinSubName?.length > 10 && ele?.coin?.coin?.token_address
                      ? `${ele.coinSubName.substring(0, 7)}...`
                      : ele?.coinSubName
                  }

                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#FFFFFF",
                    marginLeft: "3px",
                  }}
                >
                  {ele?.coin?.coin?.token_address ? token_type(ele?.coin?.coin?.coin_family) : ""}
                </span>
                <div className={`${"coinsTable1__grayText12"} textBold`}></div>
              </div>
              <div style={{ color: "#98969B" }} className="grayText1 test-class">
                <span>{ele.routeTo === "no-where" ? "" : currency.symbol}</span>
                <div
                  dangerouslySetInnerHTML={{ __html: ele.coinPrice }}
                ></div>{" "}
                <span>&nbsp;| </span>
                <div
                  className={`${"coinsTable1__grayText12"} ${ele.coinStatus <= 0 ? "negitiveText" : "positiveText"
                    }`}
                  style={{ marginLeft: "3px" }}
                >
                  {ele.coinStatus < 0 ? "" : "+"}
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
                  className="coinsTable1__grayText12"
                  style={{
                    marginTop: "7px",
                  }}
                ></div>
              ) : null}
            </div>
          </div>
          <div
            className="coinsTable1__left__textSec"
            style={{
              position: "absolute",
              // left: '-37px',
              right: "0px",
            }}
          >
            <div
              className="coinsTable1__textTop"
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                // position: 'relative',
                // top: '-7px',
                justifyContent: "space-between",
                height: "44px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="25"
                height="25"
                viewBox="0 0 24 24"
                onClick={async (e) => {
                  e.stopPropagation();
                  setClickedUp(true);
                  setClickedDown(false); // reset other button
                  console.log("index", index);
                  if (index === 0) return;
                  const previousIndex = index;
                  const nextIndex = index - 1;

                  const finalData = reorder(data, previousIndex, nextIndex);
                  await server.post(
                    `/wallet/sort_order_token`,
                    {
                      sort_order_list: finalData.map((item, index) => ({
                        id: item.coin.id,
                        coin_id: item.coin.coin_id,
                        sort_order: index + 1,
                      })),
                      is_watch_only: account?.isWatchOnly ? 1 : 0,
                      wallet_name: account?.name,
                    },
                    { headers: { Authorization: account.jwtToken } }
                  );
                  setClickedUp(false);
                  refresh(new Date());
                }}
                style={{
                  position: "relative",
                }}
                className="hover_only"
              >
                <g
                  id="Group_171587"
                  data-name="Group 171587"
                  transform="translate(-15782 -7374)"
                >
                  <g
                    id="Rectangle_59676"
                    data-name="Rectangle 59676"
                    transform="translate(15782 7374)"
                    fill="#fff"
                    stroke="#223f70"
                    strokeWidth="1"
                    opacity="0"
                  >
                    <rect width="24" height="24" stroke="none" />
                    <rect x="0.5" y="0.5" width="23" height="23" fill="none" />
                  </g>
                  <g
                    id="Layer_2"
                    data-name="Layer 2"
                    transform="translate(15780.268 7375.118)"
                  >
                    <path
                      id="Path_111695"
                      data-name="Path 111695"
                      d="M18.749,9.449a.714.714,0,0,1-.507-.21L13.733,4.73,9.223,9.239A.716.716,0,1,1,8.21,8.226L13.226,3.21a.716.716,0,0,1,1.013,0l5.016,5.016a.717.717,0,0,1-.507,1.223Z"
                      fill={clickedUp ? "#00aeef" : "#bbb"} // Change color on click
                    />
                  </g>
                </g>
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="25"
                height="25"
                viewBox="0 0 24 24"
                className="hover_only"
                onClick={async (e) => {
                  e.stopPropagation();
                  setClickedDown(true);
                  setClickedUp(false); // reset other button
                  console.log("index", index);
                  if (index === data.length - 1) return;
                  const previousIndex = index;
                  const nextIndex = index + 1;

                  const finalData = reorder(data, previousIndex, nextIndex);
                  await server.post(
                    `/wallet/sort_order_token`,
                    {
                      sort_order_list: finalData.map((item, index) => ({
                        id: item.coin.id,
                        coin_id: item.coin.coin_id,
                        sort_order: index + 1,
                      })),
                      is_watch_only: account?.isWatchOnly ? 1 : 0,
                      wallet_name: account?.name,
                    },
                    { headers: { Authorization: account.jwtToken } }
                  );
                  setClickedDown(false);
                  refresh(new Date());
                }}
                style={{
                  marginTop: "-20px",
                  position: "relative",
                }}
              >
                <g
                  id="Group_171587"
                  data-name="Group 171587"
                  transform="translate(-15782 -7374)"
                >
                  <g
                    id="Rectangle_59676"
                    data-name="Rectangle 59676"
                    transform="translate(15782 7374)"
                    fill="#fff"
                    stroke="#223f70"
                    strokeWidth="1"
                    opacity="0"
                  >
                    <rect width="24" height="24" stroke="none" />
                    <rect x="0.5" y="0.5" width="23" height="23" fill="none" />
                  </g>
                  <g
                    id="Layer_2"
                    data-name="Layer 2"
                    transform="translate(15780.268 7375.118)"
                  >
                    <path
                      id="Path_111694"
                      data-name="Path 111694"
                      d="M13.733,26.449a.714.714,0,0,1-.507-.21L8.21,21.224A.716.716,0,1,1,9.223,20.21l4.509,4.509,4.509-4.509a.716.716,0,1,1,1.013,1.013l-5.016,5.015a.714.714,0,0,1-.507.21Z"
                      transform="translate(0 -7.685)"
                      fill={clickedDown ? "#00aeef" : "#bbb"} // Change color on click
                    />
                  </g>
                </g>
              </svg>
            </div>
          </div>
          <div className="coinsTable1__right">
            <div>
              <DummyEle ele={ele} />
              <div
                className="coinsTable1__grayText12 textElipsis"
                style={{ justifyContent: "flex-end" }}
              >
                {ele.currDollerBal === "ABOVE" ||
                  ele.currDollerBal === "BELOW" ? (
                  `Price ${capitalize(ele.currDollerBal)}`
                ) : (
                  <>
                    {ele.routeTo === "no-where"
                      ? ""
                      : balanceIn
                        ? ele.routeTo === "enter-price-spritz"
                          ? "$"
                          : currency.symbol
                        : ""}
                    {ele.currDollerBal}
                  </>
                )}
                {ele.sent === true || ele.sent === false ? (
                  <div
                    className="coinsTable1__grayText12 textElipsis"
                    style={{
                      color: ele.sent ? "#058b56" : "#f6465d",
                      paddingLeft: 0,
                    }}
                  >
                    {ele.sent ? "Completed" : "Pending"}
                  </div>
                ) : null}
              </div>
            </div>
            {ele.sent === true || ele.sent === false ? (
              <div className="editBtn">
                <img
                  src={Edit}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/add-alert", {
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
        </li>
      ))}

      <ModalCustom
        title={"Price Alerts"}
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
                fontSize: "20px",
                color: "white"
              }}
            >
              Are you sure you want to Delete this Alert?
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "30px",
            }}
          >
            <div
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
            </div>
          </div>
        </div>
      </ModalCustom>
    </>
  );
}

export default CoinsTableDraggable;
