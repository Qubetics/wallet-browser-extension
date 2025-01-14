/*global chrome*/

import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import SendNFTimg from "../../Assets/SendNFT.png";
import { InputField } from "../../Components/InputField/InputFieldSimple";
import AddressBook from "../../Assets/address-book-svgrepo-com.svg";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { useLocation, useNavigate } from "react-router-dom";
import { Drawer, message } from "antd";
import varLine from "../../Assets/varLine.svg";
import nftCopy from "../../Assets/nftCopy.svg";
import { useSelector } from "react-redux";
import { Web3Helper } from "../../helpers/web3.helper";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { ethers } from "ethers";
import BigNumber from 'bignumber.js';
import { server } from "../../server";
import { setNfts } from "../../actions/nfts";
import { DURATION } from "../../config/message.config";

function NftSend() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [toAddress, setToAddress] = useState(null);
  const [quantity, setQuantity] = useState();
  const [networkFee, setNetworkFee] = useState();
  const [nftGasData, setNftGasData] = useState(null);

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const { account, currency } = useSelector((state) => state);

  const navigate = useNavigate();
  const location = useLocation();
  const [nftDetails, setNftDetails] = useState();

  const getNetwrokFee = async () => {
    const { chains } = await chrome.storage.local.get("chains");
    const chain = chains.find((chain) => chain.coinFamily == 2);
    console.log("CHAIN", chain);

    const gasData = await Web3Helper.getGasPriceNft(
      chain.slug,
      toAddress,
      account?.coinFamilyAndAddress[2],
      nftDetails?.token_address,
      nftDetails?.token_id,
      nftDetails?.token_type,
      quantity
    );

    console.log("GAS DATA:-----------> ", gasData);
    setNftGasData(gasData)

    if (!ethers.utils.isAddress(toAddress)) {
      store.dispatch(setLoading(false));
      return console.error("Please provide a valid address to proceed.");
    }

    let gasEstimate = gasData.estimate;
    // const gasPrice = new BigNumber(gasData.price).times(1000000000);
    const gasPrice = new BigNumber(gasData.fast).times(1000000000);
    console.log("GASXXXXXXXXXXXXX ", gasPrice);

    if (!gasPrice) {
      store.dispatch(setLoading(false));
      return console.error("Unable to fetch gas price at the moment.");
    }

    const gasInEth = gasPrice.times(gasEstimate).div(Math.pow(10, 18));
    console.log("gasInEth as BigNumber: ", gasInEth.toString());

    // Convert gasInEth to a floating-point number using parseFloat
    const gasInEthFloat = parseFloat(gasInEth.toString());  // Convert BigNumber to string first
    console.log("gasInEth as Float: ", gasInEthFloat);


    // networkFee: gasInEth.toFixed(5),
    setNetworkFee(gasInEth.toFixed(5));
  };
  useEffect(() => {
    if (location.state) {
      const nft = location.state;
      setNftDetails(nft?.detail);
      console.log("nftDetails", nft);
    }

  }, [location.state]);


  useEffect(() => {
    if (toAddress && quantity) {
      getNetwrokFee();
    }
  }, [toAddress, quantity])

  const handleConfirm = () => {
    // Simulating the data assignment
    const data = { account: "0x1234" };
    setDrawer(true);
    setSelectedAccount(data);
  };


  const handleTransaction = async () => {
    store.dispatch(setLoading(true));

    console.log("CCCCCCCCCCUUUUUUUUUUUU ", currency);

    const { data } = await server.post(
      '/wallet/nativeCoinBalance',
      {
        wallet_address: account?.coinFamilyAndAddress[2],
        coin_family: "2", //detail.coin_family,
        // fiat_currency: currency?.name,
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );


    console.log("BALANCEEEEEEEEEE ", data?.data?.wallet_data?.balance, " FFFFF ", networkFee);

    const balance = new BigNumber(data?.data?.wallet_data?.balance);
    const fee = new BigNumber(networkFee);
    console.log("FEEEEEEEE : ", balance, fee);

    if (fee.isGreaterThan(balance)) {
      store.dispatch(setLoading(false));
      // setOpenmodal(false);
      return messageApi.error(
        'Insufficient balance to proceed with the transaction.'
      );
    }

    if (nftDetails.token_type == 'ERC721') {
      const response =
        await Web3Helper.generateRawTransactionForNFTAndBroadcast(
          toAddress,
          account?.coinFamilyAndAddress[2],
          1,
          nftDetails?.token_id,
          0,
          currency.name,
          '',
          'ethereum',//detail.coin_family == 1 ? 'eth' : 'bnb',
          '1',//detail.coin_family == 1 ? 1 : 56,
          nftDetails?.token_address,
          nftDetails?.token_type,
          null,
          'WITHDRAW',
          nftDetails?.token_id,
          nftGasData
        );
      if (!response) {
        store.dispatch(setLoading(false));
        return messageApi.error(
          'Insufficient balance to proceed with transaction.'
        );
      }
    } else {
      const response =
        await Web3Helper.generateRawTransactionFor1155AndBroadcast(
          toAddress,
          account?.coinFamilyAndAddress[2],//fromAddress,
          quantity, //detail.amount,
          nftDetails?.token_id,
          0,
          currency.name,
          '',//toName,
          'ethereum',//detail.coin_family == 1 ? 'eth' : 'bnb',
          '1',//detail.coin_family == 1 ? 1 : 56,
          nftDetails?.token_address,
          nftDetails?.token_type,
          null,
          'WITHDRAW',
          nftDetails?.token_id,
          nftGasData
        );
      console.log("responseresponse===> ", response);

      if (!response) {
        store.dispatch(setLoading(false));
        return messageApi.error(
          'Insufficient balance to proceed with transaction.'
        );
      }
    }

    const walletsList = await server.post(
      `/wallet/nft/from_moalis`,
      {
        address_list: [
          {
            coin_symbol: 'eth',
            coin_family: '1',
            wallet_address: account.coinFamilyAndAddress[1],
          },
          // {
          //   coin_symbol: 'bnb',
          //   coin_family: '3',
          //   wallet_address: account.coinFamilyAndAddress[3],
          // },
        ],
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    store.dispatch(setNfts(walletsList?.data?.data));
    console.log("WALETTTTTTTT ", walletsList);

    store.dispatch(setLoading(false));
    navigate('/history');
  };

  return (
    <div>
      {contextHolder}
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
                  <span>Transaction Fees : {networkFee ?? 0}</span>
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
                  {account?.coinFamilyAndAddress &&
                    <>
                      {account?.coinFamilyAndAddress[2]?.substring(0, 7)}.....
                      {account?.coinFamilyAndAddress[2]?.substring(
                        account?.coinFamilyAndAddress[2]?.length - 7,
                        account?.coinFamilyAndAddress[2]?.length
                      )}
                      <span>
                        <img style={{ cursor: "pointer" }} src={nftCopy} alt="copy" onClick={() => {
                          navigator.clipboard.writeText(account?.coinFamilyAndAddress[2]);
                          messageApi.success("From address copied to clipboard");
                        }} />
                      </span>
                    </>
                  }
                </p>
              </div>
              <div className="d-flex">
                <span>TO</span>
                <p>

                  {toAddress &&
                    <>
                      {toAddress.substring(0, 7)}.....
                      {toAddress.substring(
                        toAddress.length - 7,
                        toAddress.length
                      )}
                      <span>
                        <img style={{ cursor: "pointer" }} src={nftCopy} alt="copy" onClick={() => {
                          navigator.clipboard.writeText(toAddress);
                          messageApi.success("To address copied to clipboard");
                        }} />
                      </span>
                    </>}
                </p>
              </div>
            </div>
          </div>
          <div className="nftSend_fromTo">
            <div>
              <div style={{ marginBottom: "10px" }} className="d-flex">
                <span>Network Fee</span>
                <p>{networkFee} {'ETH'}</p>
              </div>

              {nftDetails?.token_type == "ERC1155" && <div className="d-flex">
                <span>Max Total</span>
                <p>{quantity || 0.00}</p>
              </div>}

              <div className="d-flex">
                <span>Token Id</span>
                <p>{nftDetails?.token_id}</p>
              </div>

            </div>
          </div>
          <div className="nftSend_btn d-flex">
            <div className="cancelBtn">
              <ButtonComp text="Cancel" maxWidth="100%" />
            </div>
            <ButtonComp text="Continue" maxWidth="100%" onClick={() => handleTransaction()} />
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default NftSend;
