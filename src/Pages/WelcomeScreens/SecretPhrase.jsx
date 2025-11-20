import React, { useEffect } from "react";
import "./Welcome.scss";
import CopyIcon from "../../Assets/CopyIcon.svg";
import { Checkbox, message } from "antd";
import { DURATION } from "../../config/message.config";
function SecretPhrase({ children, mnemonics, termsCheck, isShare, setIsShare, isSupport, setIsSupport }) {
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const phrases = mnemonics.split(" ");
  function copyToClipboard() {
    const str = phrases.join(",").replaceAll(",", " ");
    navigator.clipboard.writeText(str);
    messageApi.success("Phrase Copied");
  }

  useEffect(() => {
    termsCheck(true);
  }, []);

  return (
    <div className="setPassword__secretPharse">
      <div>
        <div className="setPassword__secretPharse__fieldSBg">
          <div className="setPassword__secretPharse__fieldSBgInner">
            {phrases.map((ele, index) => (
              <span key={index} className="InnerFild">
                <span className="innerSub"> {index + 1}.</span> {ele}
              </span>
            ))}
          </div>
        </div>
        <div className="newCreateCopy">
        <div
          onClick={copyToClipboard}
          className="setPassword__secretPharse__copyField"
          style={{paddingLeft:"3px"}}
        >
          {contextHolder}
          <span>Copy</span>
          <div style={{width:'8px'}}></div>
          <img src={CopyIcon} width={16} height={18} />
        </div>
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
        {/* <div className={`${style.mainWarning} importToken phraseToken`}>
          <div className="left" style={{ flex: 1 }}>
            <img src={ErroeImg} alt="" style={{ width: "27px" }} />
          </div> */}
        {/* <div className="right" style={{ flex: 7 }}>
            <h2 style={{ textAlign: "left", marginBottom: "2px" }}>
              Warning:Secure Your Seed Phrase
            </h2>
            <p style={{ textAlign: "left" }}>
              Your seed phrase is the master key to your wallet and funds. Never
              reveal it to anyone; sharing it can lead to theft of your assets.
              Store it in a secure location where only you have access. If your
              seed phrase is lost, you will not be able to retrieve your
              funds—there is no way to reset or recover it. Keep it secret, keep
              it safe.
            </p>
          </div> */}
        <div className="donotShare">
          <div className="donotShare_item checkboxOuter">
            <Checkbox  onChange={()=>{setIsShare(!isShare)}}
               className="checkboxCustom"
              >
              {" "}
              <p>
                {" "}
                DO NOT share your phrase to any as this gives full access to
                your wallet!
              </p>
            </Checkbox>

            {/* <img src={TickImg} alt="" />
            <p>
              DO NOT share your phrase to any as this gives full access to your
              wallet!
            </p> */}
          </div>
          <div className="donotShare_item checkboxOuter">
            <Checkbox onChange={()=>{setIsSupport(!isSupport)}}
              className="checkboxCustom"
            >
              <p>
                Qubetics Extension support will NEVER reach out to ask for it
              </p>
            </Checkbox>
            {/* 
            <img src={TickImg} alt="" />
            <p>Qubetics Extension support will NEVER reach out to ask for it</p> */}
          </div>
        </div>
        {/* </div> */}
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
          className={"checkboxOuter"}
          style={{
            textAlign: "left",
          }}
        >
          {/* <Checkbox onChange={onChange}>
            <p >I understand</p>
          </Checkbox> */}
        </div>
      </div>
      {children}
    </div>
  );
}

export default SecretPhrase;
