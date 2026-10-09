import React, { useEffect, useState } from "react";
import "./Welcome.scss";
import CopyIcon from "../../Assets/CopyIcon.svg";
import { Checkbox, message } from "antd";
import { DURATION } from "../../config/message.config";
import { copySecretToClipboard } from "../../helpers/common.helper";
function SecretPhrase({ children, mnemonics, termsCheck, isShare, setIsShare, isSupport, setIsSupport }) {
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const [revealed, setRevealed] = useState(false);
  const phrases = mnemonics.split(" ");
  async function copyToClipboard() {
    const str = phrases.join(",").replaceAll(",", " ");
    await copySecretToClipboard(str);
    messageApi.success("Phrase copied. It will be cleared from the clipboard in 60 seconds.");
  }

  useEffect(() => {
    termsCheck(true);
  }, []);

  return (
    <div className="setPassword__secretPharse">
      <div>
        <div className="setPassword__secretPharse__fieldSBg">
          {/* hidden until tapped, against shoulder-surfing and screen sharing */}
          <div
            className="setPassword__secretPharse__fieldSBgInner"
            onClick={() => setRevealed(true)}
            style={
              revealed
                ? undefined
                : { filter: "blur(6px)", cursor: "pointer", userSelect: "none" }
            }
          >
            {phrases.map((ele, index) => (
              <span key={index} className="InnerFild">
                <span className="innerSub"> {index + 1}.</span> {ele}
              </span>
            ))}
          </div>
        </div>
        {!revealed ? (
          <p style={{ color: "#fff", textAlign: "center", marginTop: "8px", cursor: "pointer" }} onClick={() => setRevealed(true)}>
            Tap to reveal your seed phrase
          </p>
        ) : null}
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
        <div className="donotShare">
          <div className="donotShare_item checkboxOuter">
            <Checkbox  onChange={()=>{setIsShare(!isShare)}}
               className="checkboxCustom"
              >
              {" "}
              <p>
                {" "}
                DO NOT share your phrase with anyone, as it gives full access to
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
