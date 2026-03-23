import React from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";

import CrossChain from "../CrossChain/CrossChain";


function OnlyCrossChain() {
  return (
    <div className={`scrollableCont`}>
      <MenuRestofHeaders backTo={"/wallet"} title={"Crosschain Swap"} />
      <div className={`flexedContent`}>
        <CrossChain />
      </div>
    </div>
  );
}

export default OnlyCrossChain;
