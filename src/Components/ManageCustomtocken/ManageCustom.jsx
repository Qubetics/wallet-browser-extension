/*global chrome*/
import React, { useEffect, useState } from 'react';
import './ManageCustom.scss';
import { message, Switch } from 'antd';
import { useSelector } from 'react-redux';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { server } from '../../server';
import { useNavigate } from 'react-router-dom';
import { token_type } from '../../helpers/constant';

function ManageCustom(props) {
  const [messageApi, contextHolder] = message.useMessage();

  const { account } = useSelector((state) => state);
  const {
    key,
    name,
    currency,
    img,
    valuecurrency,
    status,
    id,
    coinFamily,
    walletAddress,
    symbol,
    coin,
    curr,
    init,
  } = props;

  const [newStatus, setStatus] = useState(null);
  const tokenTitle = `${currency}${
    coin?.token_address ? ` (${token_type(coin?.coin_family)})` : ''
  }`;

  let network = '';

  switch (coin.coin_family) {
    case 1:
      network = 'ETH';
      break;
    case 3:
      network = 'BNB';
      break;
    case 7:
      network = 'AVAX';
      break;
    case 6:
      network = 'POL';
      break;
    case 8:
      network = 'CRO';
      break;
    case 4:
      network = 'SOL';
      break;
    case 2:
      network = 'BTC';
      break;
    case 5:
      network = 'ADA';
      break;
    case 9:
      network = 'PLS';
      break;
    default:
      network = 'ethereum';
      break;
  }

  const navigate = useNavigate();
  const onChange = async (checked) => {
    try {
      store.dispatch(setLoading(true));

      const resp = await server.post(
        '/wallet/activeinactive',
        {
          coinId: coin.coin_id,
          walletAddress: walletAddress,
          isActive: checked ? 1 : 0,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      // console.log("RRRRRRRRRRRRRRRR ", resp?.data);

      if (resp?.data) {
        const delay = 3000;
        const startTime = Date.now();
        while (Date.now() - startTime < delay) {}
        message.success(
          `Token ${checked ? 'enabled' : 'disabled'} successfully`
        );
        init();
        store.dispatch(setLoading(false));
        setStatus(checked);
      }
    } catch (error) {
      store.dispatch(setLoading(false));
      return messageApi.error('Something went wrong.');
    }
  };

  useEffect(() => {
    setStatus(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <>
      <div className="manageList" key={key}>
        {contextHolder}
        <div className="manageList__imgcurrency">
          {img ? (
            <img src={img} alt="" />
          ) : (
            <div
              className="randb extra borderDarkLight"
              style={{
                height: '30px',
                width: '30px',
                background: 'rgb(202, 201, 201)',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: '1px solid',
              }}
            >
              {symbol.split('')[0].toUpperCase()}
            </div>
          )}

          <div
            className="manageList__imgcurrency_Name"
            style={{
              textAlign: 'left',
            }}
          >
            <p className="manageList__tokenTitle" title={tokenTitle}>
              {tokenTitle}
            </p>
            <span className="coinNname" style={{}}>
              {/* {name} */}
              {curr?.symbol}{' '}
              {coin?.fiat_price_data == null
                ? '0.00'
                : coin?.fiat_price_data?.value?.toFixed(2)}{' '}
              <span
                style={{
                  color:
                    coin?.fiat_price_data?.price_change_24h < 0
                      ? '#D33535'
                      : 'green',
                }}
              >
                {coin?.fiat_price_data?.price_change_24h?.toFixed(2)}%
              </span>
            </span>
          </div>
        </div>
        <div
          className="manageListSwitch"
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Switch checked={coin?.wallet_data?.status} onChange={onChange} />
          {/* <span
            className='networkNameNew'
            style={{
              marginTop: '3px',
            }}
          >
            {network}
          </span> */}
        </div>
      </div>
    </>
  );
}

export default ManageCustom;
