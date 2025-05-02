/*global chrome*/
import React, { useState } from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import InputFieldSimple from '../../Components/InputField/InputFieldSimple';
import AppLogo from '../../Assets/appLogo.svg';
import DarkAppLogo from '../../Assets/darkAppLogo.svg';
import './Lock.scss';
import { useSelector } from 'react-redux';
import { message } from 'antd';
import { store } from '../..';
import { setAuth } from '../../actions/auth';
import { useNavigate } from 'react-router-dom';
import { WalletHelper } from '../../helpers/wallet.helper';
function Lock() {
  const { theme } = useSelector((state) => state);

  const [sessionPassword, setPassword] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();

  return (
    <div className='lockSecTop'>
      {contextHolder}
      <MenuRestofHeaders backTo={'/setting'} title={'Lock'} />
      <div className={'lockSec'}>
        <div className='logoImg'>
          <div className='logo'>
            {theme === 'darkTheme' ? (
              <img src={DarkAppLogo} />
            ) : (
              <img src={AppLogo} />
            )}
          </div>

          <InputFieldSimple
            placeholder='Password'
            value={sessionPassword}
            getData={setPassword}
          />
        </div>
        <ButtonComp
          text={'Lock'}
          maxWidth={'100%'}
          onClick={async () => {
            const isVerified = await WalletHelper.verifyPassword(sessionPassword);
            if (isVerified) {
              await chrome.storage.session.remove(['accounts', 'password']);
              store.dispatch(setAuth(false));
              navigate('/verify', {
                state: {
                  lock: true,
                },
              });
            } else {
              return messageApi.error('Invalid credentials provided.');
            }
          }}
        />
      </div>
    </div>
  );
}

export default Lock;
