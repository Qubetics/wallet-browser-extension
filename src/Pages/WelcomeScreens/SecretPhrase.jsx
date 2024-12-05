import React, { useRef, useState } from 'react';
import './Welcome.scss';
import CopyIcon from '../../Assets/CopyIconBlue.svg';
import { Checkbox, message } from 'antd';
import { DURATION } from '../../config/message.config';
import ErroeImg from '../../Assets/ErroeImg.svg';
import style from './Welcome.scss';
function SecretPhrase({ children, mnemonics, termsCheck }) {
  console.log("🚀 ~ SecretPhrase ~ mnemonics:", mnemonics)
  console.log("🚀 ~ SecretPhrase ~ termsCheck:", termsCheck)
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const phrases = mnemonics.split(' ');
  function copyToClipboard() {
    const str = phrases.join(',').replaceAll(',', ' ');
    navigator.clipboard.writeText(str);
    messageApi.success('Phrase Copied');
  }
  const onChange = (e) => {
    termsCheck(e.target.checked);
  };
  return (
    <div className='setPassword__secretPharse'>
      <p className='setPassword__secretPharse__grayText'>
        Write down or copy these words in the right order and save them
        somewhere safe.
      </p>
      <div>
        <div className='setPassword__secretPharse__fieldSBg'>
          <div className='setPassword__secretPharse__fieldSBgInner'>
            {phrases.map((ele, index) => (
              <span key={index}>
                {index + 1}. {ele}
              </span>
            ))}
          </div>
        </div>
        <div
          onClick={copyToClipboard}
          className='setPassword__secretPharse__copyField'
        >
          {contextHolder}
          <img src={CopyIcon} width={14} height={16} />
          <span>Copy</span>
        </div>
        {/* <div>
          <p className='setPassword__secretPharse__grayText'>
          <img
              src={warning}
              alt=''
              style={{ width: '30px', padding: '4px' }}
            /> Warning: Secure Your Seed Phrase
          </p>
          Your seed phrase is the master key to your wallet and funds. Never
          reveal it to anyone; sharing it can lead to theft of your assets.
          Store it in a secure location where only you have access. If your seed
          phrase is lost, you will not be able to retrieve your funds—there is
          no way to reset or recover it. Keep it secret, keep it safe.
        </div> */}
        <div
          className={`${style.mainWarning} importToken phraseToken`}
          
        >
          <div className='left' style={{ flex: 1 }}>
            <img src={ErroeImg} alt='' style={{ width: '27px' }} />
          </div>
          <div className='right' style={{ flex: 7 }}>
            <h2 style={{textAlign:"left" , marginBottom:"2px"}}>Warning:Secure Your Seed Phrase</h2>
            <p style={{textAlign:"left"}}>
              Your seed phrase is the master key to your wallet and funds. Never
              reveal it to anyone; sharing it can lead to theft of your assets.
              Store it in a secure location where only you have access. If your
              seed phrase is lost, you will not be able to retrieve your
              funds—there is no way to reset or recover it. Keep it secret, keep
              it safe.
            </p>
          </div>
        </div>
        {/* <div className={'checkboxOuter'}>
          <Checkbox onChange={onChange}>
            <span
              style={{
                transform: 'translateX(-14px)',
              }}
            >
              I understand.
            </span>
          </Checkbox>
        </div> */}
        <div
          className={'checkboxOuter'}
          style={{
            marginBottom: '15px',
            textAlign:"left"
          }}
        >
          <Checkbox onChange={onChange}>
            <p style={{ marginLeft: '15px' }}>I understand</p>
          </Checkbox>
        </div>
      </div>
      {children}
    </div>
  );
}

export default SecretPhrase;
