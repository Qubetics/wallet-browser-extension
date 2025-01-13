/*global chrome*/

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
import { useSelector } from "react-redux";
import { Web3Helper } from "../../helpers/web3.helper";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { BigNumber, ethers } from "ethers";

function NftSend() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [toAddress, setToAddress] = useState(null);
  const [quantity, setQuantity] = useState();
  const [networkFee, setNetworkFee] = useState();

  const { account } = useSelector((state) => state);

  const navigate = useNavigate();
  const location = useLocation();
  const [nftDetails, setNftDetails] = useState();
  const getNetwrokFee = async () => {
    const { chains } = await chrome.storage.local.get("chains");
    const chain = chains.find((chain) => chain.coinFamily == 2);
    console.log("CHAIN", chain);

    const gasData = await Web3Helper.getGasPrice(
      chain.slug,
      toAddress,
      account?.coinFamilyAndAddress[2],
      0,
      nftDetails?.token_address,
      nftDetails?.token_id,
      nftDetails?.token_type,
      nftDetails?.amount
    );

    if (!ethers.utils.isAddress(toAddress)) {
      store.dispatch(setLoading(false));
      return console.error("Please provide a valid address to proceed.");
    }

    let gasEstimate = gasData.estimate;
    const gasPrice = new BigNumber(gasData.price).times(1000000000);

    if (!gasPrice) {
      store.dispatch(setLoading(false));
      return console.error("Unable to fetch gas price at the moment.");
    }

    const gasInEth = gasPrice.times(gasEstimate).div(Math.pow(10, 18));
    // networkFee: gasInEth.toFixed(5),
    setNetworkFee(gasInEth.toFixed(5));
  };
  useEffect(() => {
    if (location.state) {
      const nft = location.state;
      setNftDetails(nft?.detail);
      console.log("nftDetails", nft);
    }
    getNetwrokFee();
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
                getData={setToAddress}
                value={toAddress}
                addonAfter={
                  <>
                    {/* <span>
                      <img
                        src={AddressBook}
                        style={{
                          width: "18px",
                          marginRight: "10px",
                          cursor: "pointer",
                        }}
                        alt="Address Book"
                      />
                    </span> */}
                    <span
                      style={{
                        position: "relative",
                        top: "-5px",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={async () => {
                        const data = await navigator.clipboard.readText();
                        setToAddress(data);
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
                  getData={setQuantity}
                  value={quantity}
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
                      onClick={() => setQuantity(nftDetails?.amount)}
                    >
                      Max
                    </span>
                  }
                />
                <p className="availableNft">
                  <span>Available NFTs:</span> {nftDetails?.amount}
                </p>
                <p>
                  <span>Transaction Fees : {networkFee}</span>
                </p>
              </div>
            </div>
          </div>
          <div style={{ marginTop: "15px" }}>
            <ButtonComp
              onClick={handleConfirm}
              text="Confirm"
              maxWidth="100%"
              disabled={!toAddress || !quantity}
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
          <div
            className="nftSend_fromTo d-flex"
            style={{ justifyContent: "flex-start" }}
          >
            <img src={varLine} alt="line" />
            <div style={{ width: "100%" }}>
              <div className="d-flex" style={{ marginBottom: "34px" }}>
                <span>From</span>
                <p>
                  {account?.coinFamilyAndAddress[2]}
                  <span>
                    <img src={nftCopy} alt="copy" />
                  </span>
                </p>
              </div>
              <div className="d-flex">
                <span>TO</span>
                <p>
                  {toAddress}
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
