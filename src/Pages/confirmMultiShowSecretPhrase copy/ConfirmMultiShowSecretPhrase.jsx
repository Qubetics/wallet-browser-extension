/*global chrome*/
import React, { useState } from "react";
import { message } from "antd";
import style from "./style.module.scss";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { useLocation, useNavigate } from "react-router-dom";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { WalletHelper } from "../../helpers/wallet.helper";
import closeXicon from "../../Assets/closeXicon.svg";
import { DURATION } from "../../config/message.config";

function ConfirmMultiShowSecretPhrase() {
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const navigate = useNavigate();
  const {
    state: { mnemonics,password },
  } = useLocation();

  const [shuffledMnemonics, setShuffledMnemonics] = useState(
    mnemonics.split(" ").sort(() => Math.random() - 0.5)
  );
  const [correct, setCorrect] = useState(false);

  const [blankArray, setBlankArray] = useState([]);
  const phrases = shuffledMnemonics;
  const pushData = (ele) => {
    let prev = [...blankArray]; // Previous State update
    let pres = prev.findIndex((elem) => elem == ele); // Present state's index gets
    if (pres == -1) {
      prev.push(ele);
      setBlankArray(prev);
    }
  };
  const removePhrase = (ele) => {
    let data = [...blankArray];
    let dataIndex = data.findIndex((elem) => elem == ele);
    data.splice(dataIndex, 1);
    setBlankArray(data);
  };

  // console.log("here here here");

  return (
    <>
      <div className={`scrollableCont`}>
        {contextHolder}
        <MenuRestofHeaders
          backTo={"/multiShowSecretPhrase"}
          mnemonics={mnemonics}
          title={"Secret Phrase"}
        />
        <div className={`flexedContent`}>
          <div className={`${style.setPassword} ${style.cardWhite}`}>
            <div className={style.setPassword__secretPharse}>
              <p className={style.setPassword__secretPharse__grayText}>
                Please select each word in correct to verify you have saved your
                Secret Phrase.
              </p>
              <div className={style.setPassword__secretPharse__confirmFieldSBg}>
                <div
                  className={
                    style.setPassword__secretPharse__confirmFieldSBgInner
                  }
                >
                  {blankArray.map((ele, index) => (
                    <span onClick={() => removePhrase(ele)} key={index}>
                      {ele} <img src={closeXicon} width={7} height={7} />
                    </span>
                  ))}
                </div>
              </div>
              <div className={style.setPassword__secretPhrase__latters}>
                <div
                  className={`${style.setPassword__secretPharse__confirmFieldSBgInner} ${style.setPasswuord__secretPharse__confirmFieldSBgInner__bordered}`}
                >
                  {phrases.map((ele, index) => (
                    <span
                      onClick={() => pushData(ele)}
                      key={index}
                      className={
                        blankArray.includes(ele) ? style.currentItem : ""
                      }
                    >
                      {ele}
                    </span>
                  ))}
                </div>
              </div>
              <div
                onClick={() => setBlankArray([])}
                className={style.setPhrase__secretPharse__copyField}
              >
                {contextHolder}
                <span>Clear</span>
              </div>
              <div className={style.setPassword__footerbuttons}>
                {/* <ButtonComp
                  onClick={() => {
                    navigate("/setting");
                  }}
                  text={"Back"}
                  bordered={true}
                /> */}
                <ButtonComp
                  onClick={async () => {
                    if (blankArray.join(" ") === mnemonics) {
                      store.dispatch(setLoading(true));
                      const checkIfThere =
                        await WalletHelper.isAccountExistWithMnemonics(mnemonics,password);

                      if (checkIfThere) {
                        store.dispatch(setLoading(false));
                        return messageApi.error(
                          "Mnemonics already exist. Please try with a different mnemonic."
                        );
                      }

                      const { name } = await chrome.storage.session.get("name");

                      await WalletHelper.generateAndSetWallet(mnemonics, name);
                      store.dispatch(setLoading(false));
                      navigate("/wallet");
                    } else {
                      store.dispatch(setLoading(false));
                      messageApi.error(
                        "Please check the order of the phrase and try again."
                      );
                    }
                  }}
                  text={"Continue"}
                  maxWidth={"100%"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConfirmMultiShowSecretPhrase;
