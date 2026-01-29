import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import ManageWalletImg from "../../Assets/ManageWalletImg.png";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function NftManageWallet() {
  const navigate = useNavigate();
  const location = useLocation();
  const [nftDetails, setNftDetails] = useState();
  const { account } = useSelector((state) => state);
  
  // console.log("🚀 ~ NftManageWallet ~ account:", account)


  useEffect(() => {
    if (location.state) {
      const nft = location.state;
      setNftDetails(nft?.detail); 
    }
  }, [location.state]);


  const contactAddresses = [
    {
      id: 1,
      label: "Contract Address",
      address: nftDetails?.token_address
        ? `${nftDetails.token_address.slice(0, 15)}...${nftDetails.token_address.slice(-5)}`
        : "N/A",
    },
    {
      id: 2,
      label: "Owner Address",
      address: nftDetails?.owner_of
        ? `${nftDetails.owner_of.slice(0, 15)}...${nftDetails.owner_of.slice(-5)}`
        : `${account.address.slice(0, 15)}...${account.address.slice(-5)}`
    },
    { id: 3, label: "Token ID", address: nftDetails?.token_id || "N/A" },
    { id: 4, label: "Token Standard", address: nftDetails?.token_type || "N/A" },
    { id: 5, label: "Quantity", address: nftDetails?.amount || "N/A" },
    { id: 6, label: "Network", address: nftDetails?.coin_family === "7" ? 'Qubetics' :'Ethereum' },

  ];
  
  return (
    <div>
      <MenuRestofHeaders title={"Manage Wallet"} backTo={"/nftDetail"} />
      <div className={`scrollableCont`}>
        <div className={`flexedContent manageWalletHeight`}>
          <div className="nftManage">
            <img src={nftDetails?.image} alt="img" style={{width:"200px"}}/>
            <p className="nftManage_text">{nftDetails?.description}</p>
            {/* <div className="nftManage_countryYears">
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
            </div> */}
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
                navigate("/NftSend", {
                  state: {
                    detail: nftDetails,
                  },
                });
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
