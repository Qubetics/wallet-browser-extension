import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { message } from 'antd';
import { QRCode } from 'react-qrcode-logo';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import CopyIcon from '../../Assets/CopyIcon.svg';
import { getStoredMpcAddresses } from '../../helpers/mpc.helper';
import './ExternalReceive.scss';

function ExternalReceive() {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, currency } = useSelector((state) => state);
  const [messageApi, contextHolder] = message.useMessage();
  
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [mpcAddress, setMpcAddress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeExternalReceive = async () => {
      try {
        setLoading(true);
        
        // Get the selected coin from location state
        const coin = location?.state?.selectedCoin;
        if (!coin) {
          messageApi.error('No coin selected');
          navigate('/select-coin');
          return;
        }
        
        setSelectedCoin(coin);
        
        // Get MPC addresses
        const storedMpc = await getStoredMpcAddresses();
        if (!storedMpc) {
          messageApi.error('MPC addresses not available');
          navigate('/select-coin');
          return;
        }
        
        // Determine which MPC address to use based on coin family
        let addressToUse;
        if (coin.coinFamily === 3) {
          // Bitcoin
          addressToUse = storedMpc.btc;
        } else if (coin.coinFamily === 7) {
          // TICS (EVM)
          addressToUse = storedMpc.eth;
        } else {
          // Default to ETH for other EVM chains
          addressToUse = storedMpc.eth;
        }
        
        if (!addressToUse) {
          messageApi.error(`MPC address not available for ${coin.symbol}`);
          navigate('/select-coin');
          return;
        }
        
        setMpcAddress(addressToUse);
        setLoading(false);
      } catch (error) {
        // console.error('Error initializing external receive:', error);
        messageApi.error('Failed to load receive screen');
        navigate('/select-coin');
      }
    };

    initializeExternalReceive();
  }, [location, navigate, messageApi]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mpcAddress);
      messageApi.destroy();
      messageApi.success('Address copied successfully.');
    } catch (error) {
      messageApi.destroy();
      messageApi.error('Failed to copy address.');
    }
  };

  const getAddressLabel = () => {
    if (selectedCoin?.coinFamily === 3) {
      return 'Your Bitcoin Address';
    } else if (selectedCoin?.coinFamily === 7) {
      return 'Your TICS Address';
    }
    return 'Your Wallet Address';
  };

  const getWarningMessage = () => {
    if (selectedCoin?.coinFamily === 3) {
      return 'Send only Bitcoin to this address. Sending any other coins may result in permanent loss.';
    } else if (selectedCoin?.coinFamily === 7) {
      return 'Send only TICS to this address. Sending any other coins may result in permanent loss.';
    }
    return 'Send only the correct coin type to this address. Sending any other coins may result in permanent loss.';
  };

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="externalReceive_skeleton">
      <div className="externalReceive_qrCode">
        <div className="skeletonQRCode"></div>
      </div>
      
      <div className="externalReceive_copy">
        <div>
          <div className="skeletonText skeletonLabel"></div>
          <div className="skeletonText skeletonAddress"></div>
        </div>
        <div className="skeletonButton"></div>
      </div>

      <div className="skeletonText skeletonWarning"></div>
    </div>
  );

  if (loading) {
    return (
      <div className="externalReceive scrollableCont">
        {contextHolder}
        <MenuRestofHeaders backTo="/select-coin" title="External Receive" />
        <div className="externalReceive_content manageWalletHeight">
          <div className="flexedContent padding-Top">
            <SkeletonLoader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="externalReceive scrollableCont">
      {contextHolder}
      <MenuRestofHeaders 
        backTo="/select-coin" 
        title={`Receive ${selectedCoin?.symbol}`} 
      />
      <div className="externalReceive_content manageWalletHeight">
        <div className="flexedContent padding-Top">
          <div className="externalReceive_qrCode">
          <QRCode
              value={mpcAddress}
              size={230}
              qrStyle="dots"
              eyeRadius={8}
              logoImage={selectedCoin?.image}
              logoHeight={35} // smaller logo
              logoWidth={35}
              logoOpacity={0.9} // ensures logo doesn’t fully block QR
              removeQrCodeBehindLogo={true} // cuts out QR dots behind the logo area
              ecLevel="H" // high error correction
              bgColor="#000000" // white background improves contrast
              fgColor="#FFFFFF" // black dots are most readable
            />
          </div>
          
          <div className="externalReceive_copy">
            <div>
              <p>{getAddressLabel()}</p>
              <h5>
                {mpcAddress?.slice(0, 10)}...{mpcAddress?.slice(-8)}
              </h5>
            </div>
            <ButtonComp
              onClick={copyToClipboard}
              text={
                <span className="copyText">
                  Copy <img src={CopyIcon} alt="copy" />
                </span>
              }
              maxWidth={'88px'}
            />
          </div>

          <p className="externalReceive_warning">
            {getWarningMessage()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ExternalReceive;
