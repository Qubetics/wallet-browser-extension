import React from "react";
import style from "./style.module.scss";

function ButtonComp({
  text,
  bordered,
  onClick,
  onKeyDown,
  maxWidth,
  marginBottom,
  disabled,
  marginTop,
  alignSelf,
}) {
  return (
    <button
      className={`ButtonStyle ${style.ButtonStyle} ${
        bordered ? style.ButtonStyle__bordered : ""
      } ${disabled ? "disabled" : ""}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={disabled || false}
      style={{
        maxWidth: maxWidth,
        marginBottom,
        marginTop,
        alignSelf: alignSelf,
      }}
    >
      {text}
    </button>
  );
}

export default ButtonComp;
