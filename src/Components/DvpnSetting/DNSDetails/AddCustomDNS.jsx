import React, { useState } from "react";
import MenuRestofHeaders from "../../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { InputFieldOnly } from "../../InputField/InputFieldSimple";
import ButtonComp from "../../ButtonComp/ButtonComp";
import "./DNSDetails.scss"

function AddCustomDNS() {
  const [selectedProtocol, setSelectedProtocol] = useState("ipv4");

  return (
    <div className={`scrollableCont`} style={{ hight: "auto" }}>
      <MenuRestofHeaders title={"Add Custom DNS"} backTo={"/dnsDetails"} />
      <div className={`flexedContent`}>
        <div className="rpc-selector">
          <InputFieldOnly
            placeholder={"Enter name here"}
            label="Name of the DNS"
            checkForSymbols={true}
            placeholderBaseColor={true}
          />
          <InputFieldOnly
            placeholder={"Enter IP address here"}
            label="Preferred IP Address"
            checkForSymbols={true}
            placeholderBaseColor={true}
          />
          <InputFieldOnly
            placeholder={"Enter IP address here"}
            label="Alternate IP Address"
            checkForSymbols={true}
            placeholderBaseColor={true}
          />

          {/* Internet Protocol Selection */}
          <div className="protocol-section">
            <h3 className="protocol-title">Internet Protocol</h3>
            <div className="radio-group">
              <div 
                className={`radio-option ${selectedProtocol === 'ipv4' ? 'selected' : ''}`}
                onClick={() => setSelectedProtocol('ipv4')}
              >
                <div className="radio-button">
                  <div className="radio-inner"></div>
                </div>
                <span className="radio-label">IPv4</span>
              </div>
              <div 
                className={`radio-option ${selectedProtocol === 'ipv6' ? 'selected' : ''}`}
                onClick={() => setSelectedProtocol('ipv6')}
              >
                <div className="radio-button">
                  <div className="radio-inner"></div>
                </div>
                <span className="radio-label">IPv6</span>
              </div>
            </div>
          </div>

          
        
        <div className=" bottomBtn">
          <ButtonComp bordered text={"Clear"} maxWidth="100%" />
          <ButtonComp text={"Save"} maxWidth="100%" />
        </div>
        </div>
      </div>
    </div>
  );
}

export default AddCustomDNS;
