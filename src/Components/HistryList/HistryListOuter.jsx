/*global chrome*/
import { message } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DURATION } from '../../config/message.config';
import { capitalize } from '../../helpers/conversion.helper';
import './HistryList.scss';
// import TickIcon from "../../Assets/TickIcon.svg"
function HistoryListOuter(props) {
  const { chain, account, currency } = useSelector((state) => state);

  const {
    sendRecieve,
    coinname,
    address,
    valueCurrency,
    dollercurrency,
    addressTo,
    TickIcon,
    status,
    date,
    hash,
    def,
    allData,
    coin,
    spritz,
    type,
  } = props;

  const navigate = useNavigate();

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  return (
    <>
      {contextHolder}
      <div className='histryList'>
        <div className='Status'>
          <img src={TickIcon}></img>
          <div className='histryList_Status__Send'>
            <p>
              {sendRecieve}
              {valueCurrency}
            </p>
            <div className='histryStatus'>
              <p>{date}</p>
            </div>
          </div>
        </div>
        <div className='Currency'>
          <p className='curncyStatus'>
            {status === 'confirmed'
              ? 'Completed'
              : status === 'failed'
              ? 'Failed'
              : 'Pending'}
          </p>
        </div>
      </div>
      <div className='outer-list'>
        <p>From:</p>
        <p>{address}</p>
      </div>
      <div className='outer-list'>
        <p>To:</p>
        <p>{addressTo}</p>
      </div>
    </>
  );
}

export default HistoryListOuter;
