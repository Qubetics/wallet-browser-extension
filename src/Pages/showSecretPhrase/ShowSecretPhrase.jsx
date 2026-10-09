import React, {  } from "react";
import CopyIcon from "../../Assets/CopyIconBlue.svg";
import { message } from "antd";
import "./ShowSecretPhrase.scss";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { useLocation } from "react-router-dom";
import { DURATION } from "../../config/message.config";
import { copySecretToClipboard } from "../../helpers/common.helper";

function ShowSecretPhrase() {
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const { state } = useLocation(); 
  const { mnemonics } = state; 
  const phrases = mnemonics.split(" ");
  async function copyToClipboard() {
    const str = phrases.join(",").replaceAll(",", " ");
    await copySecretToClipboard(str);
    messageApi.success("Phrase copied. It will be cleared from the clipboard in 60 seconds.");
  }
  const onChange = (e) => {};
  return (
    <>
      <div className={`scrollableCont`}>
        <MenuRestofHeaders backTo={state.backTo} title={"Secret Phrase"} />
        <div className={`flexedContent`}>
          <div className=''>
            <div className="copyPhrase setPhrase">
              <div className="setPhrase__secretPharse">
                <h2 className="setPhrase__secretPharse__title" style={{color:"#fff"}}>
                  Your Secret Phrase
                </h2>
                {/* <p className="setPhrase__secretPharse__grayText">
                  Write down or copy these words in the right order and save
                  them somewhere safe.
                </p> */}
                <div>
                  <div className="setPhrase__secretPharse__fieldSBg">
                    <div
                      className="setPhrase__secretPharse__fieldSBgInner"
                    >
                      {phrases.map((ele, index) => (
                        <span key={index}>
                          {index + 1}. {ele}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    onClick={copyToClipboard}
                    className="setPhrase__secretPharse__copyField"
                  >
                    {contextHolder}
                    <img src={CopyIcon} width={14} height={16} />
                    <span style={{color:"#fff"}}>Copy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ShowSecretPhrase;
