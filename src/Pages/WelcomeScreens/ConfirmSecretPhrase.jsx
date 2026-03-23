import React, { useEffect, useState } from 'react';
import './Welcome.scss';
function ConfirmSecretPhrase({
  children,
  mnemonics,
  shuffledMnemonics,
  checkIfCorrect,
  setBlankArray,
  blankArray,
}) {
  // const [blankArray, setBlankArray] = useState([]);
  const [phrases,setPhrases] = useState(shuffledMnemonics);

  const pushData = (ele) => {
    // Add to blankArray only if not already present
    if (!blankArray.includes(ele)) {
      setBlankArray([...blankArray, ele]);

      // Remove from phrases
      const updatedPhrases = phrases.filter((word) => word !== ele);
      setPhrases(updatedPhrases);
    }
  };

  const removePhrase = (ele) => {
    // Remove from blankArray
    const updatedBlankArray = blankArray.filter((item) => item !== ele);
    setBlankArray(updatedBlankArray);
  
    // Add back to phrases (if not already present, just in case)
    if (!phrases.includes(ele)) {
      setPhrases([...phrases, ele]);
    }
  };
  

  useEffect(() => {
    if (blankArray.length === 12) {
      // console.log('blankArray.join(" ") === mnemonics',blankArray.join(" "), mnemonics)
      if (blankArray.join(' ') === mnemonics) {
        checkIfCorrect(true);
      } else {
        checkIfCorrect(false);
      }
    } else {
      checkIfCorrect(false);
    }
  }, [blankArray]);
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
        onClick={() => {
          setBlankArray([])
          setPhrases(shuffledMnemonics);
        }}
        className="setPassword__secretPharse__copyField"
        style={{ margin: '0 auto 24px auto',paddingLeft:"4px" }}
      >
        <span>Clear</span>
      </div>
      <div className="setPassword__secretPhrase__latters latterSpace">
        <div
          className={`${'setPassword__secretPharse__confirmFieldSBgInner'} ${'setPassword__secretPharse__confirmFieldSBgInner'}`}
        >
          {phrases.map((ele, index) => (
            <span
              onClick={() => pushData(ele)}
              key={index}
              className={blankArray.includes(ele) ? 'currentItem' : ''}
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
