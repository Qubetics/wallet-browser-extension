/*global chrome*/
import React, { useEffect, useState } from "react";
import StartKyc from "../../Assets/startKyc.svg";
import ProcessKyc from "../../Assets/processKyc.png";
import DeclineKyc from "../../Assets/declineKyc.svg";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import "./Kyc.scss";
import ModalCustom from "../../Components/ModalCustom/ModalCustom";
import { store } from "../..";
import { setCreate } from "../../actions/create";
import { useNavigate } from "react-router-dom";
import UploadAcc from "../../Assets/uploadAcc.svg";
import DarkUploadAcc from "../../Assets/darkuploadImg.svg";
import { useSelector } from "react-redux";
import { setLoading } from "../../actions/loading";
import { spritzHelper } from "../../helpers/spritz.helper";
import {
  spritzAccounts,
  spritzKyc as spritzKycAction,
} from "../../actions/spritz";

function Kyc() {
  const { spritzKyc, spritzBank } = useSelector((state) => state);

  const [count, setCount] = useState(1);
  const [isModalOpen, setOpenmodal] = useState(false);
  const [isModalOpen1, setOpenmodal1] = useState(false);
  const { theme } = useSelector((state) => state);
  const handleOk = () => {
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
  };
  const handleOk1 = () => {
    setOpenmodal1(false);
  };

  const handleCancel1 = () => {
    setOpenmodal1(true);
  };

  const init = async () => {
    // store.dispatch(setLoading(true));
    const verificationData = await spritzHelper.getVerification();
    const bankAccounts = await spritzHelper.getBankAccounts();
    store.dispatch(spritzAccounts(bankAccounts));
    store.dispatch(spritzKycAction(verificationData.identity));
    // store.dispatch(setLoading(false));
  };

  useEffect(() => {
    let intervalId = setInterval(() => {
      init();
      setCount((prevCount) => prevCount + 1);
    }, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const navigate = useNavigate();
  return (
    <div className="kycSec">
      {spritzKyc.status === "INITIALIZED" ? (
        <>
          <img src={StartKyc} alt="" />
          <h3>Start your KYC</h3>
          <ButtonComp
            text={"Start"}
            maxWidth={"100%"}
            marginTop={"20px"}
            onClick={async () => {
              chrome.tabs.create({
                url: spritzKyc.verificationUrl,
              });
            }}
          />
        </>
      ) : spritzKyc.status === "FAILED" ? (
        <>
          <img src={DeclineKyc} alt="" />
          <h3>Start your KYC</h3>
          <ButtonComp
            text={"Start"}
            maxWidth={"100%"}
            marginTop={"20px"}
            onClick={async () => {
              chrome.tabs.create({
                url: spritzKyc.verificationUrl,
              });
            }}
          />
        </>
      ) : (
        <>
          <img src={ProcessKyc} alt="" />
          <h3>KYC process in review</h3>
        </>
      )}

      <ModalCustom
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        customClass="customClassModal"
      >
        <div className="balanceDetails__modal">
          {/* <p className="balanceDetails__modal__title">Success</p> */}
          <p
            className="balanceDetails__modal__title"
            style={{ textAlign: "center" }}
          >
            Congratulations! Your Account Is Ready!
          </p>
          <ButtonComp
            text={"Continue"}
            maxWidth={"100%"}
            marginTop={"20px"}
            onClick={async () => {
              setOpenmodal1(true);
            }}
          />
        </div>
      </ModalCustom>

      {spritzKyc.status === "ACTIVE" && spritzBank.length === 0 ? (
        <ModalCustom
          title={"Create Bank Account"}
          handleCancel={handleCancel1}
          isModalOpen={true}
          closable={false}
          handleOk={handleOk1}
          customClass="customClassModal"
        >
          <div className="accUpload">
            {theme == "darkTheme" ? (
              <img
                src={DarkUploadAcc}
                alt=""
                onClick={() => {
                  store.dispatch(setCreate(true));
                  navigate("/bankAccount");
                }}
              />
            ) : (
              <img
                src={UploadAcc}
                alt=""
                onClick={() => {
                  store.dispatch(setCreate(true));
                  navigate("/bankAccount");
                }}
              />
            )}
          </div>
        </ModalCustom>
      ) : null}
    </div>
  );
}

export default Kyc;
