import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { store } from "../..";
import { setNFTbackData } from "../../actions/setNFTBackData";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import "./Nft.scss";
import Copy from "../../Assets/CopyIconBlue.svg";
import { message } from "antd";
import { useSelector } from "react-redux";
import SuperInfluencers1 from "../../Assets/SuperInfluencers1.png";
import SuperInfluencers2 from "../../Assets/SuperInfluencers2.png";
import SuperInfluencers3 from "../../Assets/SuperInfluencers3.png";
import SuperInfluencers4 from "../../Assets/SuperInfluencers4.png";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import EthIcon from "../../Assets/EthIcon.svg";

function NftDetail() {
  const navigate = useNavigate();
  const { account } = useSelector((state) => state);
  const {
    state: { detail },
  } = useLocation();

  const [messageApi, contextHolder] = message.useMessage();

  const nftData = [
    {
      id: 1,
      imgSrc: SuperInfluencers1,
      title: "Super Influencers",
      subText: "#1260",
      price: 6.5,
      icon: EthIcon,
    },
    {
      id: 2,
      imgSrc: SuperInfluencers2,
      title: "Super Influencers",
      subText: "#1261",
      price: 5.75,
      icon: EthIcon,
    },
    {
      id: 3,
      imgSrc: SuperInfluencers3,
      title: "Super Influencers",
      subText: "#1260",
      price: 6.5,
      icon: EthIcon,
    },
    {
      id: 4,
      imgSrc: SuperInfluencers4,
      title: "Super Influencers",
      subText: "#1261",
      price: 5.75,
      icon: EthIcon,
    },
    {
      id: 5,
      imgSrc: SuperInfluencers1,
      title: "Super Influencers",
      subText: "#1260",
      price: 6.5,
      icon: EthIcon,
    },
    {
      id: 6,
      imgSrc: SuperInfluencers2,
      title: "Super Influencers",
      subText: "#1261",
      price: 5.75,
      icon: EthIcon,
    },
    {
      id: 7,
      imgSrc: SuperInfluencers3,
      title: "Super Influencers",
      subText: "#1260",
      price: 6.5,
      icon: EthIcon,
    },
    {
      id: 8,
      imgSrc: SuperInfluencers4,
      title: "Super Influencers",
      subText: "#1261",
      price: 5.75,
      icon: EthIcon,
    },
  ];
  return (
    // <div className='nfDetail'>
    //   {contextHolder}
    //   <div className='tokenNft'>
    //     <h2 style={{ textAlign: 'left' }}>{detail?.nft_coin_data?.coin_name}</h2>
    //     <h3>Token</h3>
    //     <div className='card_name'>
    //       <table>
    //         <tr>
    //           <td className='left'>Coin Symbol</td>
    //           <td className='right'>
    //             {detail?.nft_coin_data?.coin_symbol?.toUpperCase()}
    //           </td>
    //         </tr>
    //         <tr>
    //           <td className='left'>Contract Address</td>
    //           <td
    //             className='right'
    //             style={{
    //               display: 'flex',
    //               justifyContent: 'flex-end',
    //             }}
    //           >
    //             <div>
    //               {detail?.token_address?.substring(0, 7)}.....
    //               {detail?.token_address?.substring(
    //                 detail?.token_address?.length - 7,
    //                 detail?.token_address?.length
    //               )}
    //             </div>
    //             <img
    //               src={Copy}
    //               alt=''
    //               width={15}
    //               height={16}
    //               style={{ marginLeft: '8px' }}
    //               onClick={async () => {
    //                 await navigator.clipboard.writeText(detail?.token_address);
    //                 messageApi.success('Contract address copied.');
    //               }}
    //             />
    //           </td>
    //         </tr>
    //         <tr>
    //           <td className='left'>Token Id</td>
    //           <td className='right'>{detail?.token_id}</td>
    //         </tr>
    //         <tr>
    //           <td className='left'> Standard</td>
    //           <td className='right'>{detail?.token_type}</td>
    //         </tr>
    //         <tr>
    //           <td className='left'> Network</td>
    //           <td className='right'>
    //             {detail?.coin_family == 1 ? 'Ethereum' : 'BNB Smart Chain'}
    //           </td>
    //         </tr>
    //       </table>
    //     </div>
    //   </div>
    //   {account.isWatchOnly ? null : (
    //     <ButtonComp
    //       onClick={() => {
    //         store.dispatch(setNFTbackData({ detail }));
    //         navigate('/nftAddress', {
    //           state: {
    //             detail,
    //           },
    //         });
    //       }}
    //       text={'Send'}
    //       maxWidth={'100%'}
    //       marginTop={'10px'}
    //     />
    //   )}
    // </div>
    <div className="">
      <MenuRestofHeaders title={"NFT’s"} backTo={"/wallet"} portfolio={true} />
      <div className={`scrollableCont`}>
        <div className={`flexedContent padding-Top`}>
          <div className="nftDetailList">
            <div className="nftDetail">
              {nftData.map((nft) => (
                <div
                  className="nftSuper"
                  key={nft.id}
                  onClick={() => {
                    navigate("/nftManage");
                  }}
                >
                  <div className="nftSuper_img">
                    <img src={nft.imgSrc} alt="NftImg" />
                  </div>
                  <div className="superInfluencers">
                    <h4>{nft.title}</h4>
                    <div className="superInfluencers_subText">
                      <h4>{nft.subText}</h4>
                      <h4>
                        <span style={{ marginRight: "5px" }}>
                          <img src={nft.icon} alt="" />
                        </span>
                        {nft.price}
                      </h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: "15px" }}>
            <ButtonComp
              onClick={() => {
                navigate("/receive-currency", { state: { nftButton: true } });
              }}
              text={"Receive"}
              maxWidth={"100%"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NftDetail;
