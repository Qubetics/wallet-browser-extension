import { Checkbox, Collapse } from "antd";
import React, { useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import BillImg from "../../Assets/billImg.svg";
import BarclaysLogo from "../../Assets/Barclays-Logo.png";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";

function MyBills() {
  const defaultOpenPanelKey = "1";
  const [activeKey, setActiveKey] = useState([defaultOpenPanelKey]);

  const onChange = (keys) => {
    setActiveKey(keys);
  };
  const onChange1 = (e) => {
    // console.log(`checked = ${e.target.checked}`);
  };
  const { Panel } = Collapse;

  return (
    <div>
      <MenuRestofHeaders backTo={"/withdraw"} title={"My Bills"} />
      <div className={`flexedContent`}>
        <div className="billBankInput">
          <div className="topMyBill">
            <p>
              Select the accounts you would like to connect with Qubetics Wallet.
            </p>
          </div>
          <div className="billsHeading">
            <h2>Bills</h2>
            <div className={"checkboxOuter"}>
              <Checkbox onChange={onChange1} />
              <h2>All</h2>
            </div>
          </div>
          <div className="acordionBillPay">
            <Collapse activeKey={activeKey} onChange={onChange}>
              <Panel header="Mortgages" key="1">
                <div className="acordinInnerSec">
                  <div className="leftSec">
                    <Checkbox onChange={onChange1} />
                    <div className="leftInner">
                      <h2>Chase Mortgages</h2>
                      <p> $131,514.00</p>
                    </div>
                  </div>
                  <div className="rytSec">
                    <img src={BillImg} alt="billimg" />
                    <p>***4215</p>
                  </div>
                </div>
                <div className="acordinInnerSec">
                  <div className="leftSec">
                    <Checkbox onChange={onChange1} />
                    <div className="leftInner">
                      <h2>Chase Mortgages</h2>
                      <p> $131,514.00</p>
                    </div>
                  </div>
                  <div className="rytSec">
                    <img src={BillImg} alt="billimg" />
                    <p>***4215</p>
                  </div>
                </div>
              </Panel>
              <Panel header="Credit Card" key="2">
                <div className="acordinInnerSec">
                  <div className="leftSec">
                    <Checkbox onChange={onChange1} />
                    <div className="leftInner">
                      <h2>Barclaycard World Elite Master</h2>
                      <p> $131,514.00</p>
                    </div>
                  </div>
                  <div className="rytSec">
                    <img src={BarclaysLogo} alt="billimg" />
                    <p>***4215</p>
                  </div>
                </div>
                <div className="acordinInnerSec">
                  <div className="leftSec">
                    <Checkbox onChange={onChange1} />
                    <div className="leftInner">
                      <h2>Barclaycard World Elite Master</h2>
                      <p> $131,514.00</p>
                    </div>
                  </div>
                  <div className="rytSec">
                    <img src={BarclaysLogo} alt="billimg" />
                    <p>***4215</p>
                  </div>
                </div>
              </Panel>
            </Collapse>
            <ButtonComp
              text={"Continue"}
              maxWidth={"100%"}
              marginTop={"20px"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyBills;
