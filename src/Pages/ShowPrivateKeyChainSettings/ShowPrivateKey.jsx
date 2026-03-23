/*global chrome*/
import React, { useEffect, useState } from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import './NewAddress.scss';
import { useLocation } from 'react-router-dom';
import { message } from 'antd';
import { DURATION } from '../../config/message.config';
import CopyIcon from '../../Assets/CopyIconBlue.svg';
import { WalletHelper } from '../../helpers/wallet.helper';
import bs58 from 'bs58';
import { setLoading } from "../../actions/loading"
import { useDispatch, useSelector } from 'react-redux';
import { Loader } from '../../Components/Loader/Loader';

function ShowPrivateKey() {
  const [address, setAddress] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });
  const {
    state: { account, password },
  } = useLocation();
  const dispatch = useDispatch();
  const { loading  } = useSelector((state)=> state?.loading);

  const init = async () => {

    // console.log('account, password',account, password)
    const { privateKey } = await WalletHelper.getPrivateKeyWithPassword(account,password);
    setAddress(privateKey || '');
  };

  useEffect(() => {
    init();
  }, []);

  function copyToClipboard(address) {
    navigator.clipboard.writeText(address);
    messageApi.success('Private key copied to clipboard');
  }

  const coin = {
    1: 'BNB',
    2: 'ETH',
    3: 'BTC',
    4: 'POL',
    5: 'SOL',
    6: 'TRX',
    // 7: 'TICS',
  };

  const [solKey, setSolKey] = useState(null);
  const [btcKey, setBtcKey] = useState(null);

  const get_privateKey = async () => {
    if (account?.coinFamilyAndAddress) {
      dispatch(setLoading(true))
      const evmAddress = account.coinFamilyAndAddress['1'];
      // const btcAddress = account.coinFamilyAndAddress["3"];
      // const solAddress = account.coinFamilyAndAddress["5"];

      const btcK = await WalletHelper.getBitcoinPrivateKeyWithAddress(
        evmAddress,
        password
      );
      setBtcKey(btcK);
      const solPrivateKeyData =
        await WalletHelper.getSolanaPrivateKeyWithAddress(evmAddress, password);
      const privateKey = bs58.encode(solPrivateKeyData);
      setSolKey(privateKey);
      dispatch(setLoading(false))
    } else {
      dispatch(setLoading(false))
      // console.error('coinFamilyAndAddress data is missing');
    }
  };

  useEffect(() => {
    get_privateKey();
  }, []);

  if(loading) return <Loader text={"Hello"} />

  return (
    <div>
      {contextHolder}
      <div className={`scrollableCont`}>
        <MenuRestofHeaders backTo={'/manage-wallet'} title={'Private key'} />
        <div className={`flexedContent`}>
          <div className="editWallet privateWallet">
            <h2 style={{ color: '#fff', marginBottom: 25 }}>
              Keep your private key safe!
            </h2>
            {account &&
              address &&
              account?.coinFamilies.map((data, idx) => {
                let displayAddress;
                if (coin[`${data}`] === 'BTC') {
                  displayAddress = btcKey;
                } else if (coin[`${data}`] === 'SOL') {
                  displayAddress = solKey;
                } else {
                  displayAddress = address;
                }

                return (
                  <div
                    className="editWallet__linkOuter"
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#295a72',
                      borderRadius: 25,
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      padding: '15px 24px',
                    }}
                  >
                    <span style={{ color: 'white' }}>
                      {displayAddress?.slice(0, 15)}...
                    </span>
                    <div className="secretkeyss">
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span style={{ color: 'white' }}>
                          {coin[`${data}`]}
                        </span>
                        <img
                          src={CopyIcon}
                          width={14}
                          height={16}
                          onClick={() => copyToClipboard(displayAddress)}
                        />
                      </span>
                    </div>
                  </div>
                );
              }).slice(0,5)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShowPrivateKey;
