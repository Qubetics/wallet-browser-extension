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
            placeholder={"tendermint.qubetics.com"}
            label="Host"
            checkForSymbols={true}
            placeholderBaseColor={true}
            value={"tendermint.qubetics.com"}
            readonly={true}
          />
        </div>
      </div>
    </div>
  );
}

export default RPCDetails;
