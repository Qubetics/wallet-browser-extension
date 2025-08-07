import React from "react";
import MenuRestofHeaders from "../../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import "./AccountDetails.scss";
import ButtonComp from "../../ButtonComp/ButtonComp";
function AccountDetails() {
  return (
    <div className={`scrollableCont`} style={{ hight: "auto" }}>
      <div className="searchBarFixed">
        <MenuRestofHeaders title={"Account Details"} backTo={"/dvpnSetting"} />
      </div>
      <div className="credits-panel">
        {/* Credits Box */}
        <div className="credits-box">
          <div className="left">
            <div className="icon">💳</div>
            <div className="text">
              <div className="label"><h3>Your Credits</h3></div>
              <div className="amount"><h2>946.65</h2></div>
            </div>
          </div>
          <div className="refresh">Refresh</div>
        </div>

        {/* Buttons */}
        <div className="buttons bottomBtn">
          <ButtonComp text={"Confirm"} maxWidth={"100%"} />
          <ButtonComp bordered text={"Account Top-Up"} maxWidth={"100%"} />
          <ButtonComp deletebordered text={"Delete My Account"} maxWidth={"100%"} />
        </div>
      </div>
    </div>
  );
}

export default AccountDetails;
