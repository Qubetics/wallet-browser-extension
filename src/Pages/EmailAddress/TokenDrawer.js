/* global chrome*/
import React, { useState } from 'react';
import OtpInput from 'react-otp-input';
import { Drawer } from 'antd';
import { spritzHelper } from '../../helpers/spritz.helper';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import darkclose from '../../Assets/darkclose.svg';
import { useSelector } from 'react-redux';
import { message } from 'antd';
import { store } from '../..';
import { spritzAccounts, spritzKyc, spritzLogin } from '../../actions/spritz';
import { setCreate } from '../../actions/create';
import { useNavigate } from 'react-router-dom';
import { SecurityHelper } from '../../helpers/security.helper';

export default function TokenDrawer({
  openDrawer,
  setOpenDrawer,
  email,
  setLoading,
  sendVerificationCode,
}) {
  const { theme } = useSelector((state) => state);
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();

  const maskEmail = (fullMail) => {
    const [username, domain] = fullMail.split('@');
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 1);
    const maskedEmail = `${maskedUsername}@${domain}`;
    return maskedEmail;
  };

  const verifyOtp = async () => {
    try {
      store.dispatch(setLoading(true));
      let payload = { email, otp };
      let data = await spritzHelper.verifyOtp(payload);
      if (data) {
        handleVerify(data?.apiKey);
      } else {
        store.dispatch(setLoading(false));
        return messageApi.error('Invalid verification code.');
      }
      // setOpenDrawer(false)
    } catch (error) {
      store.dispatch(setLoading(false));
      return messageApi.error('Invalid verification code.');
    }
  };

  const handleVerify = async (key) => {
    if (!key) {
      return messageApi.error('Verification code required.');
    }
    store.dispatch(setLoading(true));
    await spritzHelper.setApiKey(key);
    const user = await spritzHelper.getUser();
    // console.log('🚀 ~ file: ApiKey.jsx:36 ~ handleVerify ~ user:', user);

    if (!user) {
      store.dispatch(setLoading(false));
      return messageApi.error('Verification code is invalid.');
    }

    const { password } = await chrome.storage.session.get('password');
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

      await chrome.storage.session.set({
        filledEmail: null,
      });

      await chrome.storage.session.set({
        otp_sent: null,
      });

      if (bankAccounts) {
        store.dispatch(spritzAccounts(bankAccounts));
      }
      if (verificationData) {
        store.dispatch(spritzKyc(verificationData?.identity));

        if (verificationData?.identity?.status === 'ACTIVE') {
          //check for bank accounts
          if (bankAccounts?.length === 0) {
            store.dispatch(setLoading(false));
            return navigate('/kyc');
          } else {
            store.dispatch(setLoading(false));
            return navigate('/withdraw');
          }
        } else {
          navigate('/kyc');
        }
        store.dispatch(setLoading(false));
      } else {
        store.dispatch(setLoading(false));
      }

      // remove modal and direct on kyc or withdraw page

      // const verificationData = await spritzHelper.getVerification();
      // const bankAccounts = await spritzHelper.getBankAccounts();
    }

    // setOpenmodal(true);
    store.dispatch(setLoading(false));
  };
  return (
    <div className='balanceDetails__modal'>
      {contextHolder}
      {/* <p className="balanceDetails__modal__title">Verification code </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <p>Verification code submitted to your registered email.</p>
      </div> */}

      <Drawer
        className='otpDrawer'
        placement='bottom'
        maskClosable={false}
        title='Enter Your Verification Code'
        onClose={async () => {
          await chrome.storage.session.set({
            filledEmail: null,
          });

          await chrome.storage.session.set({
            otp_sent: null,
          });

          setOpenDrawer(false);
        }}
        height={350}
        open={openDrawer}
        closeIcon={
          theme == 'darkTheme' ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
      >
        <div className='otpHeading'>
          <p>Verification Code Has Been Sent To {email} </p>
        </div>
        <OtpInput
          className='emailOtp'
          value={otp}
          onChange={setOtp}
          numInputs={6}
          renderSeparator={<span>-</span>}
          renderInput={(props) => <input {...props} className='emailOtp' />}
        />
        <p className='expiry'>Verification Code Will Expire After 5 Minutes</p>
        <p className='expiry'>
          Verification Code Not Received? Please Check Spam or:
        </p>
        <p
          onClick={sendVerificationCode}
          style={{
            cursor: 'pointer',
            textAlign: 'center',
            color: '#00aeef',
            width: '100%',
          }}
        >
          Re-send verification code
        </p>
        <ButtonComp
          onClick={async () => {
            verifyOtp();
          }}
          text={'Verify'}
        />
      </Drawer>
      {/* <ButtonComp
            text={"Ok"}
            maxWidth={"100%"}
            marginTop={"20px"}
            onClick={() => {
              store.dispatch(setCreate(true));
              navigate("/apiKey");
            }}
          /> */}
    </div>
  );
}
