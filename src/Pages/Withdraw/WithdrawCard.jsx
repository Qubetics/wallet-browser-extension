import React, { useState } from "react";
import { useSelector } from "react-redux";
import ThreeDot from "../../Assets/threedots.svg";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import DarkThreeDot from "../../Assets/darkThreeDot.svg";
import "./Withdraw.scss";
import { Link, useNavigate } from "react-router-dom";
import DarkArrowRightIcon from "../../Assets/DarkArrowRightIcon.svg";
import ticketcheck1 from "../../Assets/ArrowRightIcon.svg";
import { Dropdown, message } from "antd";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { spritzHelper } from "../../helpers/spritz.helper";
import ButtonCompGray from "../../Components/ButtonCompGray/ButtonCompGray";
import ModalCustom from "../../Components/ModalCustom/ModalCustom";
import BankIcon from "../../Assets/backImg.svg";

function WithdrawCard({
  imgage,
  BankName,
  BankClient,
  Accountnumber,
  Routingnumber,
  account,
  enterPrice,
  init,
  coin,
  amount,
  holderName,
}) {
  const { theme } = useSelector((state) => state);
  const [isModalOpen, setOpenmodal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();

  const handleCancel = () => {
    setOpenmodal(false);
  };

  const handleOk = () => {
    setOpenmodal(false);
  };

  const items = [
    {
      label: (
        <Link
          to="/editWalletName"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate("/editBankAccount", {
              state: {
                account: selected,
              },
            });
          }}
        >
          Rename
        </Link>
      ),
      key: "0",
    },
    {
      type: "divider",
    },
    {
      label: (
        <div
          onClick={async (e) => {
            setOpenmodal(true);
          }}
        >
          <span
            style={{
              marginRight: "35px",
            }}
          >
            Delete
          </span>
        </div>
      ),
      key: "1",
    },
  ];

  return (
    <div className="withdrawCardSec">
      {contextHolder}
      <div
        className="cardInner"
        onClick={() => {
          if (enterPrice) {
            navigate("/bankAccountListing", {
              state: {
                account,
                coin,
                amount,
              },
            });
          }
        }}
        style={enterPrice ? { alignItems: "center" } : {}}
      >
        <div className="bankNameContact">
          {imgage ? (
            <img
              src={imgage}
              style={{
                height: "27px",
                width: "27px",
                objectFit: "contain",
                marginTop: "5px",
              }}
              alt=""
            />
          ) : (
            <img
              src={BankIcon}
              style={{
                height: "27px",
                width: "27px",
                objectFit: "contain",
                marginTop: "5px",
              }}
              alt=""
            />
          )}

          <div className="bankName">
            {BankClient && <h3>{BankClient}</h3>}
            {holderName && <p>{holderName}</p>}
          </div>
        </div>
        {enterPrice ? (
          <div className="threeDot">
            <img
              src={theme === "darkTheme" ? DarkArrowRightIcon : ticketcheck1}
              alt=""
            />
          </div>
        ) : (
          <div className="threeDot">
            <Dropdown
              className="listingDropDown"
              menu={{
                items,
              }}
              trigger={["click"]}
            >
              <Link
                onClick={(e) => {
                  e.preventDefault(); // Prevent the default link behavior
                  e.stopPropagation(); // Stop the event from propagating to the parent div
                  setSelected(account);
                }}
              >
                {theme == "darkTheme" ? (
                  <img src={DarkThreeDot} alt="" />
                ) : (
                  <img src={ThreeDot} alt="" />
                )}
              </Link>
            </Dropdown>
          </div>
        )}
      </div>

      {enterPrice ? null : (
        <div className="accountDetail">
          <div className="accountNum">
            <h3>Account Number :</h3>
            {Accountnumber && <p>{Accountnumber}</p>}
          </div>
          {Routingnumber && (
            <div className="accountNum">
              <h3>Routing Number :</h3>
              {<p>{Routingnumber}</p>}
            </div>
          )}
          <div className="accountNum">
            <h3>Bank Type :</h3>
            <p>{account.bankAccountSubType}</p>
          </div>
          <div className="accountNum">
            <h3>Account Type :</h3>
            <p>
              {account.bankAccountType === "USBankAccount"
                ? "US Bank Account"
                : "Canadian Bank Account"}
            </p>
          </div>
        </div>
      )}

      {enterPrice ? null : (
        <ButtonComp
          text={"Withdraw Crypto"}
          maxWidth={"100%"}
          marginTop={"20px"}
          onClick={() => {
            navigate("/spritz-tokens", {
              state: {
                account,
              },
            });
          }}
        />
      )}

      <ModalCustom
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        customClass="customClassModal"
        closable={false}
        title={"Delete Account"}
      >
        <div className="viewphrases">
          <div className="viewphrases__iInner">
            <p
              style={{
                fontSize: "20px",
                color: theme == "darkTheme" ? "white" : "#f6465d",
              }}
            >
              Are you sure you want to delete this account?
            </p>
          </div> 
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "30px",
              gap: "20px"
            }}
          >
            <ButtonComp
              maxWidth="100%"
              onClick={async () => {
                store.dispatch(setLoading(true));
                const response = await spritzHelper.deleteBankAccount(
                  selected.id
                );
                if (response && response.error) {
                  store.dispatch(setLoading(false));
                  return messageApi.error(response.message);
                }
                store.dispatch(setLoading(false));
                handleCancel();
                init();
              }}
              text="Confirm"
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
          </div>
        </div>
      </ModalCustom>
    </div>
  );
}

export default WithdrawCard;
