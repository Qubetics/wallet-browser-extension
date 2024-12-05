import React from "react";
import "./ButtonCompGray.scss";

function ButtonCompGray({
  text,
  bordered,
  onClick,
  maxWidth,
  marginBottom,
  disabled,
}) {
  return (
    <button
      className={`ButtonStyle ${
        "bordered" ? "ButtonStyle__bordered" : ""
      }`}
      onClick={onClick}
      disabled={disabled || false}
      style={{ maxWidth: maxWidth, marginBottom }}
    >
      {text}
    </button>
  );
}

export default ButtonCompGray;
