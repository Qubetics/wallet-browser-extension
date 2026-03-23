/* global chrome*/
import './style.scss';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { InputField } from '../../Components/InputField/InputFieldSimple';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import { setCreate } from '../../actions/create';
import { store } from '../..';
import { message } from 'antd';
import { spritzHelper } from '../../helpers/spritz.helper';
import { setLoading } from '../../actions/loading';
import { SecurityHelper } from '../../helpers/security.helper';
import { spritzAccounts, spritzKyc, spritzLogin } from '../../actions/spritz';

function ApiKey() {
  const navigate = useNavigate();
  const [isModalOpen, setOpenmodal] = useState(false);
  const [isModalOpen1, setOpenmodal1] = useState(false);
  const [key, setKey] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [password, setPassword] = useState(null);

  const handleOk = () => {
    // setOpenmodal(false);
  };

  const handleCancel = () => {
    // setOpenmodal(true);
  };

  const handleVerify = async () => {
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

    const encryptedData = await SecurityHelper.encrypt({ ...user, key }, password);

    await chrome.storage.local.set({
      spritzData: encryptedData,
    });

    await chrome.storage.session.set({
      spritzApiKey: key,
    });

    // console.log("User comesss : ", user);
    if (user) {
      store.dispatch(spritzLogin(user));
      store.dispatch(setCreate(true));
      store.dispatch(setLoading(true));
      const verificationData = await spritzHelper.getVerification();
      const bankAccounts = await spritzHelper.getBankAccounts();

      // if (verificationData) {
      //   store.dispatch(spritzKyc(verificationData.identity));
      // }
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
    <div className="" style={{ marginTop: 24 }}>
      {contextHolder}
      <h2 className="cardWhite__title">Verification Code</h2>
      <p className="cardWhite__subTitle" style={{ marginBottom: 24 }}>
        Please enter your verification code to proceed.
      </p>
      <div className="cardWhite__linkOuter">
        <InputField
          placeholder={'Enter verification code'}
          label="Verification Code"
          placeholderBaseColor={true}
          coloredBg={true}
          value={key}
          getData={(key) => {
            setKey(key);
          }}
          addonAfter={
            <>
              <span
                className={'send__pasteText'}
                onClick={async (e) => {
                  const text = await navigator.clipboard.readText();
                  setKey(text);
                }}
              >
                Paste
              </span>
            </>
          }
        />
      </div>
      <div className="create_acc">
        <a onClick={() => navigate('/emailAddress')}>Create an account</a>
      </div>
      <div>
        <ButtonComp
          onClick={async () => {
            setOpenmodal1(!isModalOpen1);
          }}
          marginTop={'24px'}
          text={'Verify'}
        />
      </div>
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
            style={{ textAlign: 'center' }}
          >
            Congratulations! Your Account Is Ready!
          </p>
          <ButtonComp
            text={'Ok'}
            maxWidth={'100%'}
            marginTop={'20px'}
            onClick={async () => {
              store.dispatch(setCreate(true));
              store.dispatch(setLoading(true));
              const verificationData = await spritzHelper.getVerification();
              const bankAccounts = await spritzHelper.getBankAccounts();

              if (verificationData) {
                store.dispatch(spritzKyc(verificationData.identity));

                if (verificationData.identity.status === 'ACTIVE') {
                  //check for bank accounts
                  if (bankAccounts.length === 0) {
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
            }}
          />
        </div>
      </ModalCustom>

      <ModalCustom
        title={'Password'}
        isModalOpen={isModalOpen}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <InputFieldSimple
            placeholder="Password"
            // getData={setPassword}
            getData={(value) => {
              const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
              if (value.length <= 100 && !hasEmoji) {
                setPassword(value);
              }
            }}
            customFunction={async () => {
              const isVerified = await WalletHelper.verifyPassword(password);

              if (!isVerified) {
                return messageApi.error('Incorrect password provided.');
              }

              handleVerify();
            }}
          />
          <div style={{ marginTop: '10px' }}></div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              const isVerified = await WalletHelper.verifyPassword(password);

              if (!isVerified) {
                return messageApi.error('Incorrect password provided.');
              }

              handleVerify();
            }}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default ApiKey;
