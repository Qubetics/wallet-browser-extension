import { useEffect, useRef } from "react";

const DummyEle = ({ ele }) => {
  const textRef = useRef(null);  

  useEffect(() => {
    const maxWidth = 153; // Maximum width of the box
    const fontSize = 13; // Original font size
    const textElement = textRef.current;

    if (textElement) {
      // Create a dummy element to measure the text width
      const dummyElement = document.createElement("div");
      dummyElement.style.visibility = "hidden";
      dummyElement.style.fontSize = `${fontSize}px`;
      dummyElement.style.position = "absolute";
      dummyElement.style.top = "-9999px";
      dummyElement.textContent = ele.currCryptoBal;
      document.body.appendChild(dummyElement);

      // Compare the width of the dummy element with the maximum width
      const isTextOverflowing = dummyElement.offsetWidth > maxWidth;

      // Remove the dummy element from the DOM
      document.body.removeChild(dummyElement);

      // Set the font size based on whether the text overflows
      textElement.style.fontSize = isTextOverflowing ? "11px" : "13px";
    }
  }, [ele.currCryptoBal]);

  return (
    <div
      className="coinsTable__textTop textElipsisStyle"
      ref={textRef}
      style={{
        maxWidth: "153px",
        justifyContent: ele.currCryptoBal === "ABOVE" || ele.currCryptoBal === "BELOW" ? "start" : "end",
      }}
    >
      <span className="overflowEllipsisAmout">{ele.currCryptoBal}</span>

    </div>
  );
};

export default DummyEle;
