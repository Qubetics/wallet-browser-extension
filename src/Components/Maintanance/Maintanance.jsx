import React from "react";
import Logo from "../../Assets/logo.png";
import DarkLogo from "../../Assets/DarkLogo.svg";
import ButtonComp from "../ButtonComp/ButtonComp";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function Maintanance({ text }) {
  const { theme } = useSelector((state) => state);
  const navigate = useNavigate();

  return (
    <div className="mainTanceSec">
      {theme === "darkTheme" ? <img src={Logo} /> : <img src={DarkLogo} />}
      <h3>We were under maintenance</h3>
      <p>Back Soon</p>
      <ButtonComp
        text={"Go Back "}
        maxWidth={"100%"}
        marginTop={"100px"}
        onClick={() => navigate(-1)}
      />
    </div>
  );
}
