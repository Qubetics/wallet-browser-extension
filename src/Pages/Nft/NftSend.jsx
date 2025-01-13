import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import SendNFTimg from "../../Assets/SendNFT.png";
import { InputField } from "../../Components/InputField/InputFieldSimple";
import AddressBook from "../../Assets/address-book-svgrepo-com.svg";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { useLocation, useNavigate } from "react-router-dom";
import { Drawer } from "antd";
import varLine from "../../Assets/varLine.svg";
import nftCopy from "../../Assets/nftCopy.svg";

function NftSend() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [nftDetails, setNftDetails] = useState();
  useEffect(() => {
    if (location.state) {
      const nft = location.state;
      setNftDetails(nft?.detail);
      console.log("nftDetails", nft);
    }
  }, [location.state]);

  const handleConfirm = () => {
    // Simulating the data assignment
    const data = { account: "0x1234" };
    setDrawer(true);
    setSelectedAccount(data);
  };

  return (
    <div>
      <MenuRestofHeaders title={"Send NFT"} backTo={"/wallet"} />
      <div className="scrollableCont">
        <div className="flexedContent manageWalletHeight ">
          <div className="nftSend">
            <div className="nftSend_superInfluencers">
              <img src={nftDetails?.image} alt="Send NFT" />
              <div>
                <h3>{nftDetails?.name}</h3>
                <p>
                  <span>Token ID:</span> {nftDetails?.token_id}
                </p>
                <p>
                  <span>Standard:</span> {nftDetails?.token_type}
                </p>
              </div>
            </div>
            <div>
              <InputField
                placeholder="Enter Address"
                label="Address"
                addonAfter={
                  <>
                    <span>
                      <img
                        src={AddressBook}
                        style={{
                          width: "18px",
                          marginRight: "10px",
                          cursor: "pointer",
                        }}
                        alt="Address Book"
                      />
                    </span>
                    <span
                      style={{
                        position: "relative",
                        top: "-5px",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Paste
                    </span>
                  </>
                }
              />
              <div className="nftSend_quantityInput">
                <InputField
                  placeholder="00"
                  label="Quantity"
                  addonAfter={
                    <span
                      style={{
                        position: "relative",
                        top: "-1px",
                        left: "-5px",
                        borderLeft: "0px",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Max
                    </span>
                  }
                />
                <p className="availableNft">
                  <span>Available NFTs:</span> {nftDetails?.amount}
                </p>
                <p>
                  <span>Transaction Fees (Matic):</span> 3.265
                </p>
              </div>
            </div>
          </div>
          <div style={{ marginTop: "15px" }}>
            <ButtonComp
              onClick={handleConfirm}
              text="Confirm"
              maxWidth="100%"
            />
          </div>
        </div>
      </div>
      <Drawer
        // title="Wallet"
        placement="bottom"
        open={drawer}
        onClose={() => setDrawer(false)}
        className="nftSendDrawer"
      >
        <div className="nftSend">
          <div className="nftSend_superInfluencers">
            <img src={SendNFTimg} alt="Send NFT" />
            <div>
              <h3>Super Influencers</h3>
              <p>
                <span>Token ID:</span> #170781515624
              </p>
              <p>
                <span>Standard:</span> ERC-1155
              </p>
            </div>
          </div>
          <div
            className="nftSend_fromTo d-flex"
            style={{ justifyContent: "flex-start" }}
          >
            <img src={varLine} alt="line" />
            <div style={{ width: "100%" }}>
              <div className="d-flex" style={{ marginBottom: "34px" }}>
                <span>From</span>
                <p>
                  0xdfhsfn.....fgds{" "}
                  <span>
                    <img src={nftCopy} alt="copy" />
                  </span>
                </p>
              </div>
              <div className="d-flex">
                <span>TO</span>
                <p>
                  0xdfhsfn.....fgds{" "}
                  <span>
                    <img src={nftCopy} alt="copy" />
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="nftSend_fromTo">
            <div>
              <div style={{ marginBottom: "10px" }} className="d-flex">
                <span>Network Fee</span>
                <p>0.002 XFI ($0.50)</p>
              </div>
              <div className="d-flex">
                <span>Max Total</span>
                <p>$1.00</p>
              </div>
            </div>
          </div>
          <div className="nftSend_btn d-flex">
            <div className="cancelBtn">
              <ButtonComp text="Cancel" maxWidth="100%" />
            </div>
            <ButtonComp text="Continue" maxWidth="100%" />
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default NftSend;
