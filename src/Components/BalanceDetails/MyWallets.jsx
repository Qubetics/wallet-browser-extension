import React from "react";
import Logo from "../../Assets/logo.png";
import ButtonComp from "../ButtonComp/ButtonComp";
import MenuRestofHeaders from "./MenuRestofHeaders/MenuRestofHeaders";
function MyWallets() {
  return (
    <div className={`scrollableCont myWallets`}>
      <div className="searchBarFixed">
        <MenuRestofHeaders backTo={"/wallet"} title={"MyWallets"} />
        <div className="myWalletsBalance">
          <div className="myWalletsBalance_value">
            <h4>Total Balance</h4>
            <h1>$8,973.26</h1>
          </div>
          <div></div>
        </div>
      </div>
      <div className={`flexedContent manageWalletHeight`}>
        <div className="listItems">
          <ul>
            <li className="currency_click">
              <div style={{ display: "flex", alignItems: "center" }}>
                <img src={Logo} alt="Logo" />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0",
                  }}
                >
                  <p className="walletName">Wallet 1</p>
                  <p className="walletAdd">Default</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <ButtonComp text={"Add Wallet"} maxWidth={"100%"} />
      </div>
    </div>
  );
}

export default MyWallets;
