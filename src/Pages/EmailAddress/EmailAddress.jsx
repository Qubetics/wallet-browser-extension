/*global chrome*/
import React, { useEffect, useLayoutEffect, useState } from "react";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { InputField } from "../../Components/InputField/InputFieldSimple";
import ModalCustom from "../../Components/ModalCustom/ModalCustom";
import { setCreate } from "../../actions/create";
import { store } from "../..";
import ErrorImg from "../../Assets/ErroeImg.svg";
import CheckImg from "../../Assets/checkImg.svg";
import { SpritzApiClient, Environment } from "@spritz-finance/api-client";
import { message } from "antd";
import { spritzHelper } from "../../helpers/spritz.helper";
import { setLoading } from "../../actions/loading";
import Copy from "../../Assets/CopyIconBlue.svg";
import ButtonCompGray from "../../Components/ButtonCompGray/ButtonCompGray";
import TokenDrawer from "./TokenDrawer";
import { SecurityHelper } from "../../helpers/security.helper";
import { spritzAccounts, spritzKyc, spritzLogin } from "../../actions/spritz";
import { useSelector } from "react-redux";

function EmailAddress() {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [isModalOpen, setOpenmodal] = useState(false);
  const [isModalOpen1, setOpenmodal1] = useState(false);
  const [email, setEmail] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [user, setUser] = useState(null);
  const [sessionPassword,setSessionPassword]=useState('');
  const [isPasswordModal,SetPasswordModal]=useState(false);

  const navigate = useNavigate();
  const { account, loading } = useSelector((state) => state);
  const checkOtp = async () => {
    const { otp_sent } = await chrome.storage.session.get("otp_sent");

    const { filledEmail } = await chrome.storage.session.get("filledEmail");

    if (otp_sent) {
      const current_time = moment(new Date());

      const sent_time = moment(new Date(otp_sent));

      const time_diff = current_time.diff(sent_time, "minutes");

      if (time_diff < 5) {
        setEmail(filledEmail || "");
        setOpenDrawer(true);
      }
    }
  };

  const init = async () => {
    const { spritzAccepted } = await chrome.storage.local.get("spritzAccepted");
    await checkOtp();
    setOpenmodal1(spritzAccepted ? false : true);
  };

  useEffect(() => {
    init();
  }, []);

  const handleOk = () => {
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(true);
  };
  const handleOk1 = () => {
    setOpenmodal1(false);
  };

  const handleCancel1 = () => {
    setOpenmodal1(true);
  };
  const sendVerificationCode = async () => {
    await spritzHelper.sendOtp(email);

    setOpenDrawer(true);

    await chrome.storage.session.set({
      filledEmail: email,
    });

    await chrome.storage.session.set({
      otp_sent: new Date().toString(),
    });

    store.dispatch(setLoading(false));
    return messageApi.success(
      "Verification code submitted to your registered email."
    );
  };
  const generateUser = async () => {
    try {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return messageApi.error("Please enter a valid email address.");
      }
      store.dispatch(setLoading(true));
      const user = await spritzHelper.generateUser(email);

      if (user?.message == "Request failed with status code 400") {
        message.error("Request failed");
      }
      if (user.error) {
        await sendVerificationCode();
        store.dispatch(setLoading(false));
      }

      if (user && !user.error) {
        await handleVerify(user?.apiKey);
        setUser(user);
      }
      store.dispatch(setLoading(false));
    } catch (error) {
      message.error(error?.message);
      store.dispatch(setLoading(false));
    }
  };

  const handleVerify = async (key) => {
    if (!key) {
      return messageApi.error("Verification code required.");
    }
    store.dispatch(setLoading(true));
    await spritzHelper.setApiKey(key);
    const user = await spritzHelper.getUser();

    if (!user) {
      store.dispatch(setLoading(false));
      return messageApi.error("Verification code is invalid.");
    }

    const password  = sessionPassword ; 
    const encryptedData = await SecurityHelper.encrypt({ ...user, key }, password);

    await chrome.storage.local.set({
      spritzData: encryptedData,
    });

    await chrome.storage.session.set({
      spritzApiKey: key,
    });

    if (user) {
      store.dispatch(spritzLogin(user));
      store.dispatch(setCreate(true));
      store.dispatch(setLoading(true));
      const verificationData = await spritzHelper.getVerification();
      const bankAccounts = await spritzHelper.getBankAccounts();

      if (bankAccounts) {
        store.dispatch(spritzAccounts(bankAccounts));
      }
      if (verificationData) {
        store.dispatch(spritzKyc(verificationData?.identity));

        if (verificationData?.identity?.status === "ACTIVE") {
          //check for bank accounts
          if (bankAccounts?.length == 0) {
            store.dispatch(setLoading(false));
            return navigate("/kyc");
          } else {
            store.dispatch(setLoading(false));
            return navigate("/withdraw");
          }
        } else {
          navigate("/kyc");
        }
        store.dispatch(setLoading(false));
      } else {
        store.dispatch(setLoading(false));
      }
    }

    // setOpenmodal(true);
    store.dispatch(setLoading(false));
  };

  return (
    <div className="" style={{ marginTop: 24 }}>
      {contextHolder}
      <h2 className="cardWhite__title" style={{ marginBottom: 0 }}>
        Email Address
      </h2>
      <p className="cardWhite__subTitle" style={{ marginBottom: 24 }}>
        Enter Your Email Address"
      </p>
      <div className="cardWhite__linkOuter">
        <InputField
          placeholder={"example@email.com"}
          label="Enter Email Address"
          placeholderBaseColor={true}
          coloredBg={true}
          value={email}
          getData={(email) => {
            setEmail(email);
          }}
        />
      </div>
      <div>
        <ButtonComp
          onClick={async () => {
            SetPasswordModal(true);
          }}
          marginTop={"24px"}
          text={"Submit"}
        />
      </div>

      <ModalCustom
        title={"Qubetics Banking"}
        handleCancel={handleCancel1}
        isModalOpen={isModalOpen1}
        handleOk={handleOk1}
        customClass="spritzBankingModal"
        closable={false}
      >
        <div className="bankingModalSec">
          {!account.isWatchOnly ? (
            <>
              <div className="innerContact">
                <p>
                  {" "}
                  <img src={CheckImg} /> Withdraw crypto straight to your bank
                  account!
                </p>
                <p>
                  {" "}
                  <img src={CheckImg} />
                  Pay your regular bills with crypto, including student loan,
                  mortgage, credit cards, utilities & more!
                </p>
                <p>
                  {" "}
                  <img src={CheckImg} />
                  Your first $100 of Withdrawals & Bill Pay is FREE every month!
                </p>
                <p>
                  {" "}
                  <img src={ErrorImg} />
                  Qubetics Banking is currently only available in the US & Canada.
                </p>
                <h2>Would you like to SIGN UP or SIGN IN to Qubetics Banking?</h2>
              </div>
              <div className="spritzBtn">
                <ButtonCompGray
                  text={"No"}
                  onClick={() => {
                    navigate("/wallet");
                  }}
                />
                <ButtonComp
                  text={"Yes"}
                  onClick={async () => {
                    await chrome.storage.local.set({
                      spritzAccepted: true,
                    });
                    setOpenmodal1(false);
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <p>
                Please switch to normal wallet to access tha banking module.
              </p>
              <div
                className="spritzBtn"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "25px",
                }}
              >
                <ButtonCompGray
                  text={"OK"}
                  onClick={() => {
                    navigate("/wallet");
                  }}
                />
              </div>
            </>
          )}
        </div>
      </ModalCustom>


      <ModalCustom
          title={"Password"}
          handleCancel={()=> {
            SetPasswordModal(fasle);
          }}
          isModalOpen={isPasswordModal}
          handleOk={()=> {
            if(sessionPassword === ''){
              return messageApi.error('Please enter your password')
            }
            else{
              generateUser();
            }
          }}
          customClass="customClassModal"
        >
          <div className="viewphrases">
            <InputFieldSimple
              placeholder="Password"
              getData={(value) => {
                const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
                if (value.length <= 100 && !hasEmoji) {
                  setSessionPassword(value);
                }
              }}
              customFunction={async () => {
                if(sessionPassword === ''){
                  return messageApi.error('Please enter your password')
                }
                else{
                  generateUser();
                }

              }}
            />
            <div style={{ marginTop: "10px" }}></div>
            <ButtonComp
              text={"Proceed"}
              maxWidth={"100%"}
              onClick={async () => {
                if(sessionPassword === ''){
                  return messageApi.error('Please enter your password')
                }
                else{
                  generateUser();
                }
              }}
            />
          </div>
        </ModalCustom>

      {email && (
        <TokenDrawer
          openDrawer={openDrawer}
          setOpenDrawer={setOpenDrawer}
          email={email}
          setLoading={setLoading}
          sendVerificationCode={sendVerificationCode}
          loading={loading}
        />
      )}
    </div>
  );
}

export default EmailAddress;
