import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import "./CoinsTable.scss";
import Edit from "../../Assets/edit.svg";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { WalletHelper } from "../../helpers/wallet.helper";
import ModalCustom from "../ModalCustom/ModalCustom";
import { capitalize } from "../../helpers/conversion.helper";
import DummyEle from "./DummyEle";
import { token_type } from "../../helpers/constant";
import ButtonComp from "../ButtonComp/ButtonComp";

function CoinsTableDraggable({ dataArray, refresh }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { account, currency, chain, balanceIn } = useSelector((state) => state);
  const [openModal, setOpenModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(dataArray);


  useEffect(() => {
    setData(dataArray);
  }, [dataArray, data, setData]);

  const handleClick = (ele) => {
    const hasRoute = Object.keys(ele).includes("routeTo");

    if (hasRoute) {
      if (ele.showModal) return ele.showModal(ele.coin);

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
          coin: ele.coin
        },
      });
    } else {
      if (ele.setSelectedCoin) ele.setSelectedCoin(ele.id);
      setOpenModal(ele.openModal());
    }
  };

  return (
    <>
      {data.map((ele, index) => (
        <li
          key={index}
          className="coinsTable1 flex-item"
          onClick={() => handleClick(ele)}
          style={{ cursor: "pointer", position: "relative" }}
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
                  {ele?.coinSubName?.length > 10 && ele?.coin?.coin?.token_address
                    ? `${ele.coinSubName.substring(0, 7)}...`
                    : ele?.coinSubName}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#FFFFFF",
                    marginLeft: "3px",
                    fontWeight: "normal",
                  }}
                >
                  {ele?.coin?.coin?.token_address
                    ? `(${token_type(ele?.coin?.coin?.coin_family)})`
                    : ""}

                </span>
              </div>

              <div className="grayText1 test-class" style={{ color: "#98969B" }}>
                <span>{ele.routeTo === "no-where" ? "" : currency.symbol}</span>
                <div dangerouslySetInnerHTML={{ __html: ele.coinPrice }}></div>
                <span>&nbsp;| </span>
                <div
                  className={`coinsTable1__grayText12 ${ele.coinStatus <= 0 ? "negitiveText" : "positiveText"}`}
                  style={{ marginLeft: "3px" }}
                >
                  {ele.coinStatus < 0 ? "" : "+"}
                  {ele.coinStatus}%
                </div>
              </div>

              {ele.provider && (
                <div
                  className="coinsTable1__grayText12"
                  style={{ marginTop: "7px" }}
                ></div>
              )}
            </div>
          </div>

          <div
            className="coinsTable1__left__textSec"
            style={{ position: "absolute", right: "0px" }}
          >
            <div
              className="coinsTable1__textTop"
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "44px",
              }}
            >
              {/* Reorder Up/Down Buttons - currently commented */}
            </div>
          </div>

          <div className="coinsTable1__right">
            <div>
              <DummyEle ele={ele} />
              <div
                className="coinsTable1__grayText12 textElipsis"
                style={{ justifyContent: "flex-end" }}
              >
                {ele.currDollerBal === "ABOVE" || ele.currDollerBal === "BELOW" ? (
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

                {ele.sent === true || ele.sent === false && (
                  <div
                    className="coinsTable1__grayText12 textElipsis"
                    style={{
                      color: ele.sent ? "#058b56" : "#f6465d",
                      paddingLeft: 0,
                    }}
                  >
                    {ele.sent ? "Completed" : "Pending"}
                  </div>
                )}
              </div>
            </div>

            {ele.sent === true || ele.sent === false && (
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
            )}
          </div>
        </li>
      ))}

      {/* Modal for Deleting an Alert */}
      <ModalCustom
        title={"Price Alerts"}
        isModalOpen={deleteModal}
        customClass="customClassModal"
        handleCancel={() => setDeleteModal(false)}
      >
        <div className="viewphrases">
          <div className="viewphrases__iInner">
            <p style={{ fontSize: "20px", color: "white" }}>
              Are you sure you want to Delete this Alert?
            </p>
          </div>

          <div className="modalActions">
            <ButtonComp
              maxWidth="100%"
              text="Yes"
              onClick={async () => {
                store.dispatch(setLoading(true));
                await WalletHelper.removeAlert(selected);
                store.dispatch(setLoading(false));
                setDeleteModal(false);
              }}
            />
            <div className="cancelBtn">
              <ButtonComp
                maxWidth="100%"
                text="No"
                onClick={() => setDeleteModal(false)}
              />
            </div>
          </div>
        </div>
      </ModalCustom>
    </>
  );
}

export default CoinsTableDraggable;
