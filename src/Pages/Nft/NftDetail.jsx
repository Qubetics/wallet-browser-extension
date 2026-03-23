import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { store } from "../..";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import "./Nft.scss";
import { useSelector } from "react-redux";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { server } from "../../server";
import { setImage } from "../../actions/image";
import { setNfts } from "../../actions/nfts";
import { setLoading } from "../../actions/loading";

function NftDetail() {
  const navigate = useNavigate();
  const { account, loading } = useSelector((state) => state);
  const { nfts } = useSelector((state) => state);


  const init = async (refresh) => {
    try {
      store.dispatch(setLoading(true)); 
      const walletsList = await server.post(
        // `/wallet/nft/from_moalis`,
        'wallet/nfts',
        {
          address_list: [
            // {
            //   coin_symbol: "bnb",
            //   coin_family: "1",
            //   wallet_address: account.coinFamilyAndAddress[1],
            // },
            {
              coin_symbol: "eth",
              coin_family: "2",
              wallet_address: account?.coinFamilyAndAddress[2],
            },
            {
              coin_symbol: "tics",
              coin_family: "7",
              wallet_address: account?.coinFamilyAndAddress[7],
            },
            // {
            //   coin_symbol: "btc",
            //   coin_family: "3",
            //   wallet_address: account.coinFamilyAndAddress[3],
            // },
            // {
            //   coin_symbol: "pol",
            //   coin_family: "4",
            //   wallet_address: account.coinFamilyAndAddress[4],
            // },
            // {
            //   coin_symbol: "sol",
            //   coin_family: "5",
            //   wallet_address: account.coinFamilyAndAddress[5],
            // },
            // {
            //   coin_symbol: "trx",
            //   coin_family: "6",
            //   wallet_address: account.coinFamilyAndAddress[6],
            // },
          ],
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      ); 
      store.dispatch(setNfts(walletsList.data.data));
      store.dispatch(setLoading(false));
    } catch (error) {
      store.dispatch(setLoading(false));
    }
  };

  //in your component
  // function addDefaultSrc(ev) {
  //   ev.target.src = nft1;
  // }

  useEffect(() => {
    init();
  }, []);

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
      <MenuRestofHeaders title={"NFT’s"} backTo={"/wallet"} />
      <div className={`scrollableCont`}>
        <div className={`flexedContent padding-Top`}>
          <div className="nftDetailList">
            <div className="nftDetail" style={{ color: "#fff"}}>
              {loading ? (
                <p className="emptyNft" 
                style={{ color: "#fff",textAlign:"center",display:"flex",justifyContent:"center",alignItems:"center",height:"455px",width:"100%"}}>Loading...</p>
              ) : nfts.length === 0 ? (
                <div className="emptyNft"
                style={{ color: "#fff",textAlign:"center",display:"flex",justifyContent:"center",alignItems:"center",height:"455px",width:"100%" }}
                >NFT's will appear here</div>
              ) : nfts.map((nft) => (
                  <div
                    className="nftSuper"
                    key={nft?.id}
                    onClick={() => {
                      store.dispatch(setImage(nft.image || null));
                      navigate("/nftManage", {
                        state: {
                          detail: nft,
                        },
                      });
                    }}
                  >
                    <div className="nftSuper_img">
                      <img src={nft?.image} alt="NftImg" />
                    </div>
                    <div className="superInfluencers">
                      <h4>{nft.title}</h4>
                      <div className="superInfluencers_subText">
                        <h4>{nft?.name}</h4>
                        <h4>
                          <span style={{ marginRight: "5px" }}>
                            <img src={nft?.icon} alt="" />
                          </span>
                          {/* {nft?.amount} */}
                        </h4>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div style={{ marginTop: "15px" }}>
            <ButtonComp
              disabled={false}
              onClick={() => {
                navigate("/receive-currency", {
                  state: { nftButton: true, nfts },
                });
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
