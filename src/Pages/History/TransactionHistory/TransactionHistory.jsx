/*global chrome*/
import { message } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { store } from '../../..';
import { setLoading } from '../../../actions/loading';
import MenuRestofHeaders from '../../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import {
  addCommasToNumber,
  getFlooredFixed,
} from '../../../helpers/conversion.helper';
import { getExplorerUrl } from '../../../helpers/explorer.helper';
import { server } from '../../../server';
import './TransactionHistory.scss';

function TransactionHistory() {
  const {
    state: { allData, coin },
  } = useLocation();
  const [messageApi, contextHolder] = message.useMessage();
  const { currency, account } = useSelector((state) => state);
  const [image, setCoinImage] = useState(null);
  const [gasPrice, setGasPrice] = useState(allData.tx_fee);
  // console.log(
  //   '🚀 ~ file: TransactionHistory.jsx:20 ~ TransactionHistory ~ gasPrice:',
  //   gasPrice
  // );
  const [fiatGasPrice, setFiatGasPrice] = useState(0);
  const [name, setName] = useState(
    `${allData.to_adrs.substring(0, 7)}.....${allData.to_adrs.substring(
      allData.to_adrs.length - 7,
      allData.to_adrs.length
    )}`
  );

  let coinFamily = 'ETH';
  let transactionHash = allData.tx_id;
  
  // Use helper function to get explorer URL based on environment
  const explorer = getExplorerUrl(allData?.coin_family, transactionHash);
  
  // Set coinFamily for display purposes
  switch (allData?.coin_family) {
    case 1:
      coinFamily = 'BNB';
      break;
    case 2:
      coinFamily = 'ETH';
      break;
    case 3:
      coinFamily = 'BTC';
      break;
    case 4:
      coinFamily = 'POL';
      break;
    case 5:
      coinFamily = 'SOL';
      break;
    case 6:
      coinFamily = 'TRON';
      break;
    case 7:
      coinFamily = 'TICS';
      break;
    case 8:
      coinFamily = 'CRO';
      break;
    case 9:
      coinFamily = 'PLS';
      break;
    default:
      break;
  }

  const myCurrency = allData.trxn_fiat_price_detail?.find(
    (el) => el.fiat_currency.toUpperCase() === currency.name
  );

  const init = async () => {
    store.dispatch(setLoading(true));
    const { data } = await server.post(
      `/wallet/transaction/detail`,
      {
        id: allData.id,
        fiat_currency: currency.name,
      },
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );

    if (!allData.tx_fee) {
      const gweiToBnb =
        (data.data.gas_price * data.data.gas_limit) / Math.pow(10, 9);

      setGasPrice(gweiToBnb);
      setFiatGasPrice(
        gweiToBnb *
          (data.data.native_coin_data.coins_market?.current_price || 0)
      );
    }

    if (allData.tx_fee) {
      setFiatGasPrice(
        allData.tx_fee *
          (data.data.native_coin_data.coins_market?.current_price || 0)
      );
    }

    if (data.data.address_book_name) {
      setName(data.data.address_book_name);
    }

    setCoinImage(data.data.coin_data.coin_image);

    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
  }, []);
  const data =
    fiatGasPrice != 0
      ? [
          {
            key: 'Date',
            value: moment(allData.created_at).format('MM/DD/YY'),
          },
          {
            key: 'From',
            value: `${allData.from_adrs.substring(
              0,
              7
            )}.....${allData.from_adrs.substring(
              allData.from_adrs.length - 7,
              allData.from_adrs.length
            )}`,
          },
          {
            key: 'To',
            value: name,
          },
          {
            key: 'Status',
            status: allData.blockchain_status.toUpperCase(),
          },
          {
            key: 'Network Fee',
            value: `${addCommasToNumber(
              getFlooredFixed(gasPrice, 5)
            )} ${coinFamily}/ ${currency.symbol}${addCommasToNumber(
              parseFloat(getFlooredFixed(fiatGasPrice, 2))
            )}`,
          },
        ]
      : [
          {
            key: 'Date',
            value: moment(allData.created_at).format('MM/DD/YY'),
          },
          {
            key: 'From',
            value: `${allData.from_adrs.substring(
              0,
              7
            )}.....${allData.from_adrs.substring(
              allData.from_adrs.length - 7,
              allData.from_adrs.length
            )}`,
          },
          {
            key: 'To',
            value: name,
          },
          {
            key: 'Status',
            status: allData.blockchain_status.toUpperCase(),
          },
        ];
  return (
    <>
      <MenuRestofHeaders
        backTo={'/history'}
        title={'Transaction Detail'}
        coin={coin}
      />
      {contextHolder}
      <div className='transactionHistory'>
        <div
          className='transactionHistory_banner'
          style={{
            display: 'flex',
          }}
        >
          <div
            style={{
              flex: 2,
            }}
          >
            <h3 className='transactionHistory_banner_value'>
              {addCommasToNumber(
                parseFloat(getFlooredFixed(allData.amount, 5))
              )}{' '}
              {allData.coin_data.coin_symbol.toUpperCase()}
            </h3>
            <p className='transactionHistory_banner_subValue'>
              {currency.symbol}
              {addCommasToNumber(
                getFlooredFixed(
                  myCurrency
                    ? (myCurrency?.current_price || 0) * allData.amount
                    : 0,
                  2
                )
              )}
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {image ? (
              <img
                src={`${process.env.REACT_APP_IMAGE_BASE_URL}${image}`}
                alt=''
                style={{
                  width: '50px',
                }}
              />
            ) : null}
          </div>
        </div>
        <div className='transactionHistory_keyValue'>
          {data.map((ele, index) => (
            <div key={index} className='transactionHistory_keyValue_data'>
              {ele.key && (
                <p className='transactionHistory_keyValue_key'>{ele.key}</p>
              )}
              {ele.value && (
                <p className='transactionHistory_keyValue_value'>{ele.value}</p>
              )}
              {ele.status && (
                <p
                  className={
                    ele.status === 'CONFIRMED'
                      ? 'transactionHistory_keyValue_status'
                      : 'transactionHistory_keyValue_status_fail'
                  }
                >
                  {ele.status}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className='transactionHistory_link'>
          <Link
            to={explorer}
            onClick={(e) => {
              e.preventDefault();
              if (!allData.tx_id) {
                return messageApi.error('Please wait for transaction hash.');
              }
              chrome.tabs.create({
                url: explorer,
              });
            }}
          >
            View On Explorer
          </Link>
        </div>
      </div>
    </>
  );
}

export default TransactionHistory;
