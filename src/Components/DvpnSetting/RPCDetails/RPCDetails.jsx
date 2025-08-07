import React from "react";
import MenuRestofHeaders from "../../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { InputFieldOnly } from "../../InputField/InputFieldSimple";
import ButtonComp from "../../ButtonComp/ButtonComp";
import "./RPCDetails.scss"

function RPCDetails() {
  return (
    <div className={`scrollableCont`} style={{ hight: "auto" }}>
      <MenuRestofHeaders title={"RPC Details"} backTo={"/dvpnSetting"} />
      <div className={`flexedContent`}>
        <div className="rpc-selector">
          <InputFieldOnly
            placeholder={"rpc.qubetics.co"}
            label="Host"
            checkForSymbols={true}
            placeholderBaseColor={true}
          />
          <InputFieldOnly
            placeholder={"9090"}
            label="Post"
            checkForSymbols={true}
            placeholderBaseColor={true}
          />
        
        <div className=" bottomBtn">
          <ButtonComp bordered text={"Reset"} maxWidth="100%" />
          <ButtonComp text={"Save"} maxWidth="100%" />
        </div>
        </div>
      </div>
    </div>
  );
}

export default RPCDetails;
