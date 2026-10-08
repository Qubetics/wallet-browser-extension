/*global chrome*/
import React, { useState } from "react";
import "./MenuRestofHeaders.scss";
import BackArrowIcon from "../../../Assets/BackArrowIcon.svg";
import DarkBackArrowIcon from "../../../Assets/DarkBackArrowIcon.svg";
import SearchIcon from "../../../Assets/SearchIcon.svg";
import DarkPlusBordredIcon from "../../../Assets/DarkPlusBordredIcon.svg";
import DarkChartIcon from "../../../Assets/DarkChartIcon.svg";
import DarkFilterIcon from "../../../Assets/DarkFilterIcon.svg";
import DarkSettignIcon from "../../../Assets/DarkSettignIcon.svg";
import DarkSearchIcon from "../../../Assets/DarkSearchIcon.svg";
import DarkLogout from "../../../Assets/settings/darkLogout.svg";
import LogoutIcon from "../../../Assets/settings/logout.svg";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SettignIcon from "../../../Assets/SettignIcon.svg";
import blackStar from "../../../Assets/blackStar.svg";
import blueStar from "../../../Assets/blueStar.svg";
import Filtericon from "../../../Assets/Filtericon.svg";
import ChartIcon from "../../../Assets/ChartIcon.svg";
import Add from "../../../Assets/PlusBordredIcon2.svg";
import { useSelector } from "react-redux";
import Manage from "../../../Assets/twoLine.svg";
import LightManage from "../../../Assets/light-manage.svg";
import UploadAcc from "../../../Assets/uploadAcc.svg";
import darkclose from "../../../Assets/darkclose.svg";
import ModalCloseIcon from "../../../Assets/ModalCloseIcon.svg";
import BackImg from "../../../Assets/backImg.svg";
import Bell from "../../../Assets/Bell.svg";
import { Drawer } from "antd";
import ButtonCompGray from "../../ButtonCompGray/ButtonCompGray";
import { store } from "../../..";
import { setCreate } from "../../../actions/create";
import {
  spritzAccounts,
  spritzKyc,
  spritzLogin,
} from "../../../actions/spritz";
import ModalCustom from "../../ModalCustom/ModalCustom";
import ReorderManage from "../../../Assets/ReorderManage.svg";
import manageStart from "../../../Assets/manageStart.svg";
import ButtonComp from "../../ButtonComp/ButtonComp";

function MenuRestofHeaders({
  title,
  searchTo,
  backTo,
  settingTo,
  FilterIcon,
  chartIcon,
  pairExist,
  addIcon,
  showFun,
  mnemonics,
  coin,
  watch,
  manage,
  redirectTo,
  amount,
  address,
  logout,
  AddAccount,
  mySpritzAccount,
  account,
  backAmount,
  billItem,
  name,
  stared,
  portfolio,
  manageTo,
  isStared,
  path,
  chainAbstractionIcon,
  isProcessing
}) {
  const { theme, spritzFilter, billPayFilter, spritzTab } = useSelector(
    (state) => state
  );

  const {state} = useLocation();
  const { filter, swapDetail } = useSelector((state) => state);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isModalOpen, setOpenmodal] = useState(false);

  const onClose = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
  };

  const handleOk = () => {
    setOpenmodal(false);
  };

  return (
    <div className=" restOfHeaders stickyHeader">
      <div className="add_stiky">
        {backTo && (
          <Link
            to={backTo}
            style={{
              cursor: isProcessing ? "not-allowed" : "pointer",
              opacity: isProcessing ? 0.5 : 1,
              pointerEvents: isProcessing ? "none" : "auto"
            }}
            onClick={async (e) => {
              e.preventDefault();
              if (isProcessing) return;
              if (backTo === "/portfolio") {
                return navigate("/portfolio", {
                  state: {
                    activeTab: 1,
                  },
                });
              }
              if (backTo === "/import-wallet-name") {
                return navigate("/import-wallet-name", {
                  state: {
                    name,
                  },
                });
              }

              if (backTo === "/spritz-tokens") {
                return navigate("/spritz-tokens", {
                  state: {
                    account: mySpritzAccount,
                  },
                });
              }

              if (backTo === "/wallet") {
                if (redirectTo) {
                  return navigate("/wallet", {
                    state: {
                      showNftTrue: true,
                    },
                  });
                } else {
                  return navigate("/wallet");
                }
              }

              if (backTo === "/currencyDetails") {
                if (coin) {
                  return navigate("/currencyDetails", {
                    state: {
                      coin,
                      image: coin.image,
                      symbol: coin.symbol,
                      type: "",
                    },
                  });
                }
              }

              if (backTo === "/address-book") {
                if (coin) {
                  if (redirectTo === "/nftAddress") {
                    return navigate("/nftAddress", {
                      state: {
                        detail: coin,
                      },
                    });
                  } else {
                    return navigate("/sendCurrency", {
                      state: {
                        coin,
                      },
                    });
                  }
                } else {
                  return navigate("/address-book");
                }
              }

              if (backTo === "/new-name") {
                if (!mnemonics) {
                  if (watch) {
                    return navigate("/new-name", {
                      state: {
                        mnemonics,
                        goTo: "/watch-only-list",
                      },
                    });
                  } else {
                    return navigate("/new-name", {
                      state: {
                        mnemonics,
                        goTo: "/import-phrase",
                      },
                    });
                  }
                } else {
                  return navigate("/new-name", {
                    state: {
                      mnemonics,
                      goTo: "/multiShowSecretPhrase",
                    },
                  });
                }
              }

              if (backTo === "/multiShowSecretPhrase") {
                return navigate("/multiShowSecretPhrase", {
                  state: {
                    mnemonics,
                  },
                });
              }

              if (backTo === "/sendCurrency") {
                return navigate(backTo, {
                  state: {
                    coin,
                    redirectTo,
                    backAddress: address,
                    backAmount: amount,
                    backFromConfirm:true,
                    chainSelected:state?.selectChain
                  },
                });
              }

              if (backTo === "/enter-price-spritz") {
                return navigate("/enter-price-spritz", {
                  state: {
                    coin,
                    account: account,
                    backAmount: backAmount,
                  },
                });
              }

              if (backTo === "/creditBillPay") {
                return navigate("/creditBillPay", {
                  state: {
                    billAmount: billItem,
                    backAmount: backAmount,
                  },
                });
              }

              if (backTo === "/confirmCurrencySpritz") {
                return navigate("/confirmCurrencySpritz", {
                  state: {
                    coin,
                    account: account,
                    backAmount: backAmount,
                  },
                });
              }

              if (backTo === "/history") {
                if (coin) {
                  return navigate("/currencyDetails", {
                    state: {
                      coin,
                      image: coin.image,
                      symbol: coin.symbol,
                      type: "",
                      ...filter,
                    },
                  });
                } else {
                  return navigate(backTo, {
                    state: { ...filter, coinId: filter.coinId.value, path },
                  });
                }
              }

              if (backTo === "/history-spritz") {
                return navigate(backTo, {
                  state: {
                    filterValue: spritzFilter,
                  },
                });
              }

              // chnage***********

              if (backTo === "/billPay-history-spritz") {
                return navigate(backTo, {
                  state: {
                    filterValue: billPayFilter,
                  },
                });
              }

              //  Change**********

              if (
                backTo == "/bankAccountListing" ||
                backTo == "bankAccountListing"
              ) {
                return navigate(backTo, {
                  state: {
                    fromBillPay: true,
                  },
                });
              }

              return navigate(backTo, { state: { path: path ?? "" } });
            }}
          >
            {theme == "darkTheme" ? (
              <img src={DarkBackArrowIcon} />
            ) : (
              <img src={BackArrowIcon} />
            )}
          </Link>
        )}
        {AddAccount && spritzTab == "withdraw" && (
          <span
            style={{ cursor: "pointer" }}
            to={void 0}
            onClick={() => {
              store.dispatch(setCreate(true));
              navigate("/bankAccount");
            }}
            className="addAccountHeader"
          >
            {theme == "darkTheme" ? <img src={Add} /> : <img src={Add} />}
            Bank
          </span>
        )}
      </div>
      <h4>{title}</h4>
      <div className="loggOut">
        {searchTo && (
          <Link
            to={searchTo}
            onClick={(e) => {
              e.preventDefault();
              showFun();
            }}
          >
            {theme == "darkTheme" ? (
              <img src={DarkSearchIcon} />
            ) : (
              <img src={SearchIcon} />
            )}
          </Link>
        )}
        {settingTo && (
          <Link to={settingTo}>
            {theme == "darkTheme" ? (
              <img src={DarkSettignIcon} />
            ) : (
              <img src={SettignIcon} />
            )}
          </Link>
        )}
        {FilterIcon && (
          <Link
            onClick={(e) => {
              e.preventDefault();
              navigate(FilterIcon, { state: { path: state?.path ?? '' } })
            }}
          >
            {theme == "darkTheme" ? (
              <img src={DarkFilterIcon} />
            ) : (
              <img src={Filtericon} />
            )}
          </Link>
        )}
        {chartIcon && pairExist && (
          <span style={{ cursor: "pointer" }} to={void 0} onClick={chartIcon}>
            {theme == "darkTheme" ? (
              <img src={DarkChartIcon} />
            ) : (
              <img src={ChartIcon} />
            )}
          </span>
        )}

        {stared && (
          <span
            style={{ cursor: "pointer", marginLeft: "7px" }}
            to={void 0}
            onClick={stared}
          >

            {isStared ? (
              <img
                src={blueStar}
                alt='StarIconFilled'
                style={{ marginLeft: '8px', width: "24px" }}
              />
            ) : (
              <img src={blackStar} alt="Start" />
            )}


          </span>
        )}
        {addIcon && (
          <span
            style={{ cursor: "pointer" }}
            to={void 0}
            onClick={() => {
              if (addIcon == "/billbankaccount") {
                navigate(addIcon, {
                  state: { fromBankList: true, fromBillPay: true },
                });
              } else {
                navigate(addIcon);
              }
            }}
          >
            {theme == "darkTheme" ? (
              <img src={DarkPlusBordredIcon} />
            ) : (
              <img src={Add} />
            )}
          </span>
        )}
        {logout && (
          <span
            style={{ cursor: "pointer" }}
            to={void 0}
            onClick={async () => {
              setOpenmodal(true);
            }}
          >
            {theme == "darkTheme" ? (
              <img src={DarkLogout} />
            ) : (
              <img src={LogoutIcon} />
            )}
          </span>
        )}
        {manage && (
          <span
            style={{ cursor: "pointer" }}
            to={void 0}
            onClick={() => {
              navigate(manage);
            }}
          >
            {theme == "darkTheme" ? (
              <img src={LightManage} />
            ) : (
              <img src={Manage} />
            )}
          </span>
        )}
        {portfolio && (
          <span
            style={{ cursor: "pointer" }}
            to={void 0}
          // onClick={() => {
          //   navigate(manage);
          // }}
          >
            {theme == "darkTheme" ? <img src={Bell} /> : <img src={Bell} />}
          </span>
        )}
        {manageTo && (
          <span className="manageTo" style={{ cursor: "pointer" }}>
            {/* <img src={ReorderManage} alt="img" /> */}
            <img onClick={() => navigate('/add-watch-list')} src={manageStart} alt="img" />
          </span>
        )}
        {chainAbstractionIcon && (
          <span
            style={{ 
              cursor: isProcessing ? "not-allowed" : "pointer",
              opacity: isProcessing ? 0.5 : 1
            }}
            onClick={() => {
              if (isProcessing) return;
              navigate("/select-coin", {
                state: { path: "/select-coin" },
              });
            }}
          >
            <img src={chainAbstractionIcon} alt="Select Coin" style={{ width: "24px", height: "24px" }} />
          </span>
        )}

        <div className="inner_modal_pp">
          <Drawer
            title="Create Bank Account"
            placement="bottom"
            onClose={onClose}
            open={open}
            closeIcon={
              theme == "darkTheme" ? (
                <img src={darkclose} />
              ) : (
                <img src={ModalCloseIcon} />
              )
            }
          >
            <div className="multiBankDrawer">
              <div className="innerLink">
                <img
                  src={UploadAcc}
                // onClick={() => {
                //   store.dispatch(setCreate(true));
                //   navigate("/bankAccount");
                // }}
                />
                <div className="multibankAccount">
                  <img src={BackImg} />
                  <h4>Bank Account</h4>
                  <p>3 Accounts</p>
                </div>
              </div>
              <ButtonCompGray
                text={"Skip"}
                marginTop={"20px"}
              // onClick={() => {
              //   store.dispatch(setCreate(true));
              //   navigate("/withdraw");
              // }}
              />
            </div>
          </Drawer>

          <ModalCustom
            handleCancel={handleCancel}
            isModalOpen={isModalOpen}
            handleOk={handleOk}
            customClass="customClassModal"
            closable={false}
          >
            <div className="balanceDetails__modal">
              <p
                className="balanceDetails__modal__title"
                style={{ textAlign: "center" }}
              >
                Are you sure you want to logout?
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "30px",
                }}
              >
                <ButtonComp
                  maxWidth="100%"
                  onClick={async () => {
                    await chrome.storage.local.remove(["spritzData"]);
                    await chrome.storage.session.remove(["spritzApiKey"]);
                    store.dispatch(spritzKyc(null));
                    store.dispatch(spritzAccounts([]));
                    store.dispatch(spritzLogin(null));
                    navigate("/emailAddress");
                  }}
                  text="Yes"
                />
                <div className="cancelBtn">
                  <ButtonComp
                    maxWidth="100%"
                    onClick={() => {
                      handleCancel();
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
                    await chrome.storage.local.remove(["spritzData"]);
                    await chrome.storage.session.remove(["spritzApiKey"]);
                    store.dispatch(spritzKyc(null));
                    store.dispatch(spritzAccounts([]));
                    store.dispatch(spritzLogin(null));
                    navigate("/emailAddress");
                  }}
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
                      handleCancel();
                    }}
                  >
                    No
                  </div> */}
              </div>
            </div>
          </ModalCustom>
        </div>
      </div>
    </div>
  );
}

export default MenuRestofHeaders;
