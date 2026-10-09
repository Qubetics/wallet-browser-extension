import React, { useRef, useState } from "react";
import CopyIcon from "../../Assets/CopyIconBlue.svg";
import { Checkbox, message } from "antd";
import style from "./style.module.scss";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DURATION } from "../../config/message.config";
import { copySecretToClipboard } from "../../helpers/common.helper";

function MultiShowSecretPhrase() {
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const { state } = useLocation();
  const { mnemonics,password } = state;
  const navigate = useNavigate();
  const phrases = mnemonics.split(" ");
  async function copyToClipboard() {
    const str = phrases.join(",").replaceAll(",", " ");
    await copySecretToClipboard(str);
    messageApi.success("Phrase copied. It will be cleared from the clipboard in 60 seconds.");
  }

  const [terms, setTerms] = useState(false);

  const onChange = (e) => {
    setTerms(e.target.checked);
  };

  // console.log('password in secret phrase multi : ',password)

  return (
    <>
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={"/new-name"}
          mnemonics={mnemonics}
          title={"Secret Phrase"}
        />
        <div className={`flexedContent`}>
          <div className="">
            <div className={`${style.copyPhrase} ${style.setPhrase}`}>
              <div className={style.setPhrase__secretPharse}>
                <h2 className={style.setPhrase__secretPharse__title}>
                  Your Secret Phrase
                </h2>
                <p className={style.setPhrase__secretPharse__grayText}>
                  Write down or copy these words in the right order and save
                  them somewhere safe.
                </p>
                <div>
                  <div className={style.setPhrase__secretPharse__fieldSBg}>
                    <div
                      className={style.setPhrase__secretPharse__fieldSBgInner}
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
                    className={style.setPhrase__secretPharse__copyField}
                  >
                    {contextHolder}
                    <img src={CopyIcon} width={14} height={16} />
                    <span style={{color:"#fff"}}>Copy</span>
                  </div>

                  <div
                    className={"checkboxOuter checkboxMain"}
                    style={{ marginBottom: "10px" }}
                  >
                    <Checkbox onChange={onChange}>
                      <p style={{ marginLeft: "10px", textAlign: "left" }}>
                      I understand that exposing my Secret Phrase to others
                      can lead to the loss of my funds.
                      </p>
                    </Checkbox>
                  </div>

                  <div>
                    <Link
                      to="/confirmMultiShowSecretPhrase"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!terms) {
                          return messageApi.error(
                            "Please confirm that you understand the risk."
                          );
                        }

                        navigate("/confirmMultiShowSecretPhrase", {
                          state: {
                            mnemonics,
                            password: password || ''
                          },
                        });
                      }}
                    >
                      <ButtonComp
                        text={"Proceed"}
                        maxWidth={"100%"}
                        marginBottom={"40px"}
                      />
                    </Link>
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

export default MultiShowSecretPhrase;
