import React, { useState } from "react";
import "./Welcome.scss";
function ConfirmSecretPhrase({
  children,
  mnemonics,
  shuffledMnemonics,
  checkIfCorrect,
}) {
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

  if (blankArray.length === 12) {
    if (blankArray.join(" ") === mnemonics) {
      checkIfCorrect(true);
    } else {
      checkIfCorrect(false);
    }
  }
  return (
    <div className="setPassword__secretPharse">
      <div className="setPassword__secretPharse__confirmFieldSBg">
        <div className="setPassword__secretPharse__confirmFieldSBgInner">
          {blankArray.map((ele, index) => (
            <span onClick={() => removePhrase(ele)} key={index}>
              {ele}
              {/* <img src={closeXicon} width={7} height={7} /> */}
            </span>
          ))}
        </div>
      </div>
      <div
        onClick={() => setBlankArray([])}
        className="setPassword__secretPharse__copyField"
        style={{ margin: "0 auto 24px auto" }}
      >
        <span style={{ marginLeft: "0px" }}>Clear</span>
      </div>
      <div className="setPassword__secretPhrase__latters">
        <div
          className={`${"setPassword__secretPharse__confirmFieldSBgInner"} ${"setPassword__secretPharse__confirmFieldSBgInner"}`}
        >
          {phrases.map((ele, index) => (
            <span
              onClick={() => pushData(ele)}
              key={index}
              className={blankArray.includes(ele) ? "currentItem" : ""}
            >
              {ele}
            </span>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

export default ConfirmSecretPhrase;
