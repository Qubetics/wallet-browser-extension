import React from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import ManageWalletImg from "../../Assets/ManageWalletImg.png";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { useNavigate } from "react-router-dom";
function NftManageWallet() {
  const navigate = useNavigate();
  const contactAddresses = [
    { id: 1, label: "Contact Address", address: "0X4e8...57b8fd" },
    { id: 2, label: "Owner Address", address: "0X4e8...57b8fd" },
    { id: 3, label: "Token ID", address: "#170781515624" },
    { id: 2, label: "Token Standard.", address: "ERC-1155" },
    { id: 3, label: "Quantity", address: "01" },
  ];
  return (
    <div>
      <MenuRestofHeaders title={"Manage Wallet"}  backTo={"/wallet"} />
      <div className={`scrollableCont`}>
        <div className={`flexedContent padding-Top`}>
          <div className="nftManage">
            <img src={ManageWalletImg} alt="img" />
            <p className="nftManage_text">
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry's standard dummy{" "}
            </p>
            <div className="nftManage_countryYears">
              <div style={{ textAlign: "left" }}>
                <h5>USA</h5>
                <p>Country</p>
              </div>
              <div>
                <h5>600 CE</h5>
                <p>Years</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h5>Neon</h5>
                <p>Architectural Style</p>
              </div>
            </div>
            <div>
              <div className="nftManage_address">
                {contactAddresses.map((contact) => (
                  <div key={contact.id}>
                    <p>{contact.label}</p>
                    <h5>{contact.address}</h5>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: "15px" }}>
            <ButtonComp
              onClick={() => {
                navigate("/NftSend");
              }}
              text={"Send"}
              maxWidth={"100%"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NftManageWallet;
