/*global chrome*/
import React, { useState } from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import { useSelector } from 'react-redux';
import DarkArrowRightIcon from '../../Assets/DarkArrowRightIcon.svg';
import ticketcheck1 from '../../Assets/ArrowRightIcon.svg';
import { Checkbox, message } from 'antd';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { useLocation, useNavigate } from 'react-router-dom';
import { DURATION } from '../../config/message.config';
import useCurrentHeight from '../../CustomHooks/useCurrentHeight';
function Legal() {
  const { theme } = useSelector((state) => state);
  const [terms, setTerms] = useState(false);
  const height = useCurrentHeight();
  const { state } = useLocation();
  // console.log("location::", state);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  const navigate = useNavigate();
  const onChange = (e) => {
    setTerms(e.target.checked);
  };
  // console.log("terms:::::", terms);
  const verifyLegalPolicy = async () => {
    if (!terms) {
      return messageApi.error('Please accept the privacy policy');
    } else {
      if (state?.type === 'watch-list') {
        return navigate('/watch-list');
      } else {
        navigate('/createNewWallet', {
          state: { type: state?.type },
        });
      }
    }
  };
  return (
    <div className='scrollableCont'>
      {contextHolder}
      <MenuRestofHeaders
        backTo={'/'}
        // coin={state?.coin}
        // redirectTo={state?.redirectTo}
        title={'Legal'}
      />
      <div className={`flexedContent`}>
        <div className='legalContent'>
          <div className='legalSec'>
            <p>
              Please review the Qubetics Wallet Privacy Policy
            </p>

            <div className='legalInner'>
              <h2
                onClick={() =>
                  chrome.tabs.create({
                    url: 'https://REDACTED/privacy-policy-2/',
                  })
                }
              >
                Privacy Policy{' '}
                <img
                  src={
                    theme === 'darkTheme' ? DarkArrowRightIcon : ticketcheck1
                  }
                  alt=''
                />
              </h2>
              <h2
                onClick={() =>
                  chrome.tabs.create({
                    url: 'https://REDACTED/terms-of-service-2/',
                  })
                }
              >
                Privacy Policy{' '}
                <img
                  src={
                    theme === 'darkTheme' ? DarkArrowRightIcon : ticketcheck1
                  }
                  alt=''
                />
              </h2>
            </div>
          </div>
          <div
            className={`${'checkBoxSec'} ${
              height <= 600 ? 'checkBoxSecExt' : ''
            }`}
          >
            <div className={'checkboxOuter'}>
              <Checkbox
                onChange={(e) => onChange(e)}
                style={{ paddingLeft: '10px' }}
              >
                I've read and accept the Privacy Policy
              </Checkbox>
            </div>
            <ButtonComp
              text={'Continue'}
              marginTop='30px'
              onClick={() => {
                verifyLegalPolicy();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Legal;
