import React from "react";
import ResetPassword from "../../Assets/settings/ResetPassword.svg";
import RightIcon from "../../Assets/DarkArrowRightIcon.svg";
import "../CurrencyPrefrence/CurrencyPrefrence.scss";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { Link, useNavigate } from "react-router-dom";
function SecuritySetting() {
  const navigate = useNavigate();
  return (
    <div className={`scrollableCont`}>
      <MenuRestofHeaders backTo={"/setting"} title={"Security"} />
      <div className={`flexedContent`}>
        <Link
          style={{ textDecoration: "none" }}
          to="/changePin"
          onClick={() => {
            navigate("/changePin");
          }}
        >
          <div
            className="listItems"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "13px",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
              <img src={ResetPassword} alt="img" />
              <span className="Currencyname">Reset Password</span>
            </div>
            <img src={RightIcon} alt="RightIcon" />
          </div>
        </Link>
      </div>
    </div>
  );
}

export default SecuritySetting;
