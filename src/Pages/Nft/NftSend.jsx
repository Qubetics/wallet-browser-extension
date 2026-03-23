/*global chrome*/

import React, { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import InputFieldSimple, { InputField } from "../../Components/InputField/InputFieldSimple";
import AddressBook from "../../Assets/address-book-svgrepo-com.svg";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { useLocation, useNavigate } from "react-router-dom";
import { Drawer, message } from "antd";
import varLine from "../../Assets/varLine.svg";
import nftCopy from "../../Assets/nftCopy.svg";
import warning from '../../Assets/PNG/warning.png';
import { useSelector } from "react-redux";
import { Web3Helper } from "../../helpers/web3.helper";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { ethers } from "ethers";
import BigNumber from 'bignumber.js';
import { server } from "../../server";
import { setNfts } from "../../actions/nfts";
import { DURATION } from "../../config/message.config";
import ModalCustom from "../../Components/ModalCustom/ModalCustom";
import { WalletHelper } from "../../helpers/wallet.helper";


function NftSend() {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, currency } = useSelector((state) => state);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [toAddress, setToAddress] = useState(null);
  const [quantity, setQuantity] = useState();
  const [networkFee, setNetworkFee] = useState();
  const [nftGasData, setNftGasData] = useState(null);
  const [totalFeeFiat, setTotalFeeFiat] = useState(0.00);
  const [nftDetails, setNftDetails] = useState();
  const [sessionPassword, setPassword] = useState(null);
  const [isModalOpen, setOpenmodal] = useState(false);

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
 
  const handleCancel = () => {
    setPassword(null);
    setOpenmodal(false);
  };

  const handleOk = () => {
    setOpenmodal(false);
    setPassword(null);
  };

  const getNetwrokFee = async () => {
    const { chains } = await chrome.storage.local.get("chains");
    const chain = chains.find((chain) => chain.coinFamily == nftDetails.coin_family);

    const gasData = await Web3Helper.getGasPriceNft(
      chain.slug,
      toAddress,
      account?.coinFamilyAndAddress[nftDetails.coin_family],
      nftDetails?.token_address,
      nftDetails?.token_id,
      nftDetails?.token_type,
      quantity
    );
    // console.log("🚀 ~ getNetwrokFee ~ gasData:", gasData)

    setNftGasData(gasData)

    if (!ethers.utils.isAddress(toAddress)) {
      store.dispatch(setLoading(false));
      return // console.error("Please provide a valid address to proceed.");
    }

    let gasEstimate = gasData.estimate;
    const gasPrice = new BigNumber(gasData.fast).times(1000000000);

    if (!gasPrice) {
      store.dispatch(setLoading(false));
      return // console.error("Unable to fetch gas price at the moment.");
    }

    const gasInEth = gasPrice.times(gasEstimate).div(Math.pow(10, 18));

    // Convert gasInEth to a floating-point number using parseFloat
    const gasInEthFloat = parseFloat(gasInEth.toString());  // Convert BigNumber to string first
    // console.log("gasInEth as Float: ", gasInEthFloat);


    // networkFee: gasInEth.toFixed(5),
    setNetworkFee(gasInEth.toFixed(5));
  };

  useEffect(() => {
    if (location.state) {
      const nft = location.state;
      setNftDetails(nft?.detail);
    }
  }, [location.state]);


  useEffect(() => {
    if (toAddress && quantity) {
      getNetwrokFee();
    }
  }, [toAddress, quantity])


  const handleConfirm = async () => {

    try{

      if (!ethers.utils.isAddress(toAddress)) {
        messageApi.error("Enter a valid wallet address.");
        return;
      }
  
      if (!quantity || Number(quantity) <= 0) {
        messageApi.error("Please enter a valid quantity.");
        return;
      }
  
      if (Number(quantity) > Number(nftDetails?.amount)) {
        messageApi.error(`Not Sufficent Quantity`);
        return;
      }
      const parentCoin = await server.post(
        '/wallet/nativeCoinFiatPrice',
        {
          coin_family: nftDetails.coin_family,
          fiat_currency: currency.name,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
  
      const fiatPriceFee = parentCoin.data.data.fiatCoinPrice.value * Number(networkFee);
      setTotalFeeFiat(fiatPriceFee)
      // console.log("account", account);
      // const data = { account: "0x1234" };
      setDrawer(true);
      setSelectedAccount(account);
    }catch(error){
      // console.log("error", error);
      messageApi.error(error.message);
      store.dispatch(setLoading(false));
      return;
    }

  };


  const handleTransaction = async () => {
    // console.log("handleTransaction");
    store.dispatch(setLoading(true));
    const { data } = await server.post(
      '/wallet/nativeCoinBalance',
      {
        wallet_address: account?.coinFamilyAndAddress[nftDetails.coin_family],
        coin_family: nftDetails.coin_family, 
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );
    const balance = new BigNumber(data?.data?.wallet_data?.balance);

    const fee = new BigNumber(networkFee);


    if (fee.isGreaterThan(balance)) {
      store.dispatch(setLoading(false));
      return messageApi.error(
        'Insufficient balance to proceed with the transaction. 1'
      );
    }

    if (nftDetails.token_type == 'ERC721') {
      // console.log("nftDetails.token_type == 'ERC721'");
      const response =
        await Web3Helper.generateRawTransactionForNFTAndBroadcast(
          sessionPassword,
          toAddress,
          account?.coinFamilyAndAddress[nftDetails.coin_family],
          1,
          nftDetails?.token_id,
          0,
          currency.name,
          '',
          nftDetails.coin_family == 2 ? 'ethereum' : 'tics',
          nftDetails.coin_family == 2 ? 1 : 9030,
          nftDetails?.token_address,
          nftDetails?.token_type,
          null,
          'WITHDRAW',
          nftDetails?.token_id,
          nftGasData
        );
      // console.log({ response });

      if (!response) {
        store.dispatch(setLoading(false));
        return messageApi.error(
          'Insufficient balance to proceed with transaction.'
        );
      }
    } else {
      // console.log("generateRawTransactionFor1155AndBroadcast");
      const response =
        await Web3Helper.generateRawTransactionFor1155AndBroadcast(
          sessionPassword,
          toAddress,
          account?.coinFamilyAndAddress[nftDetails.coin_family],//fromAddress,
          quantity, //detail.amount,
          nftDetails?.token_id,
          0,
          currency.name,
          '',
          nftDetails.coin_family == 2 ? 'ethereum' : 'qubetics',
          nftDetails.coin_family == 2 ? 1 : 9030,
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
    }

    const walletsList = await server.post(
      // `/wallet/nft/from_moalis`,
      'wallet/nfts',
      {
        address_list: [
          {
            coin_symbol: 'eth',
            coin_family: '1',
            wallet_address: account.coinFamilyAndAddress[1],
          },
          {
            coin_symbol: 'tics',
            coin_family: '7',
            wallet_address: account.coinFamilyAndAddress[7],
          },
        ],
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    store.dispatch(setNfts(walletsList?.data?.data));

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
            <div className="nftSend_superInfluencers" style={{ display: 'flex', gap: 30, flexDirection: 'column' }}>
              <img src={nftDetails?.image} alt="Send NFT" style={{ width: '200px' }} />
              <div style={{ width: '100%' }}>
                <h3>{nftDetails?.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p>
                    <span>Token ID:</span> {nftDetails?.token_id}
                  </p>
                  <p>
                    <span>Standard:</span> {nftDetails?.token_type}
                  </p>
                </div>
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
                    <span
                      style={{
                        position: "relative",
                        top: "0px",
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
                  getData={(val) => {
                    const numericVal = val.replace(/[^0-9]/g, "");
                    setQuantity(numericVal);
                  }}
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
                  <span>Transaction Fees : {networkFee ?? 0} {nftDetails?.coin_family == 2 ? 'ETH' : 'TICS'}</span>
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
            <img src={nftDetails?.image} alt="Send NFT" style={{ width: '70px' }} />
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
                <p>{networkFee} {nftDetails?.coin_family == 2 ? 'ETH' : 'TICS'}{" "}
                  ({currency?.symbol}{totalFeeFiat.toFixed(2)})</p>
              </div>

              {/* {nftDetails?.token_type == "ERC1155" && <div className="d-flex">
                <span>Max Total</span>
                <p>{quantity || 0.00}</p>
              </div>} */}

              <div style={{ marginBottom: "10px" }} className="d-flex">
                <span>Token Id</span>
                <p>{nftDetails?.token_id}</p>
              </div>

              <div className="d-flex">
                <span>Max Total</span>
                <p>{currency?.symbol}{totalFeeFiat.toFixed(2)}</p>
              </div>

            </div>
          </div>
          <div className="nftSend_btn d-flex">
            <div className="cancelBtn">
              <ButtonComp text="Cancel" maxWidth="100%" onClick={() => setDrawer(false)} />
            </div>
            <ButtonComp text="Continue" maxWidth="100%"
              // onClick={() => handleTransaction()} 
              onClick={() => {
                setOpenmodal(true);
              }}
            />
          </div>
        </div>
      </Drawer>

      <ModalCustom
        title={'Enter password'}
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        customClass="customClassModal"
      >
        <div className="viewphrases">
          <div
            style={{
              marginBottom: '36px',
              width: '100%',
            }}
          >
            <InputFieldSimple
              placeholder="Password"
              getData={setPassword}
              value={sessionPassword}
              customFunction={async () => {
                const isCorrectPassword = await WalletHelper.verifyPassword(
                  sessionPassword
                );
                if (!isCorrectPassword) {
                  return messageApi.error('Incorrect password provided.');
                }
                setOpenmodal(false);
                setPassword(null);
              }}
            />
            <div className="viewphrases__iInner">
              <img src={warning} />
              <div>
                <p>Do not share your password with anyone!</p>
                <p>It can be used to steal all your funds.</p>
              </div>
            </div>
          </div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              const isCorrectPassword = await WalletHelper.verifyPassword(
                sessionPassword
              );
              if (!isCorrectPassword) {
                return messageApi.error('Incorrect password provided.');
              }
              setOpenmodal(false);
              // setPassword(null);
              handleTransaction()
            }}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default NftSend;
