/*global chrome*/
import { message } from 'antd';
import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { DURATION } from '../../config/message.config';
import './HistryList.scss';
import recieveIcon from '../../Assets/ReceiveIcon.svg';
import swapIcon from '../../Assets/SwapIconWhite.svg';
import dAppIcon from '../../Assets/datatransfer.svg';
import { ChainAbstractionHelper } from '../../helpers/chain_abstraction.helper';
import AbstractProcessingModel from '../CustomModelAbstraction/Model';

function HistoryListOuter(props) {
  const [transactionResult, setTransactionResult] = useState({
    hash: '',
    status: '',
    solver: '',
    symbol: '',
  });
  const [showsuccess, setShowSuccess] = useState(false);
  const [isProcessModalOpen, setIsProcessModal] = useState(false);
  const { chain, account, currency } = useSelector((state) => state);
  const ChainAbstractionInstance = useRef(
    new ChainAbstractionHelper(chain.chainId)
  );
  const {
    address,
    valueCurrency,
    addressTo,
    TickIcon,
    status,
    date,
    allData,
    type,
  } = props;

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  const updateExp = async (e) => {
    e.preventDefault();
    let coinFamily = 'ETH';
    let explorer = '';
    let transactionHash = allData?.tx_id;
    let txnType = allData?.type;
    let intentData = allData?.intent_data;
    console.log('type', type);
    if (txnType === 'chain_abstraction') {
      if (intentData !== null) {
        const resposne =
          await ChainAbstractionInstance.current.pollIntentStatus(
            intentData?.tx_hash
          );
        setTransactionResult((prev) => ({
          ...prev,
          hash: resposne?.data?.intent_hash,
          status: resposne?.data?.status,
          solver: resposne?.data?.solver_id,
          fee: intentData?.fees,
          symbol: allData?.coin_data?.coin_symbol?.toUpperCase(),
        }));
        setIsProcessModal(true);
      }
    } else {
      switch (allData?.coin_family) {
        case 1:
          coinFamily = 'BNB';
          explorer = `https://bscscan.com/tx/${transactionHash}`;
          break;
        case 2:
          coinFamily = 'ETH';
          explorer = `https://etherscan.io/tx/${transactionHash}`;
          break;
        case 3:
          coinFamily = 'BTC';
          explorer = `https://www.blockchain.com/explorer/transactions/btc/${transactionHash}`;
          break;
        case 4:
          coinFamily = 'POL';
          explorer = `https://polygonscan.com/tx/${transactionHash}`;
          break;
        case 5:
          coinFamily = 'SOL';
          explorer = `https://explorer.solana.com/tx/${transactionHash}`;
          break;
        case 6:
          coinFamily = 'ADA';
          explorer = `https://cardanoscan.io/transaction/${transactionHash}`;
          break;
        case 7:
          coinFamily = 'TICS';
          explorer = `https://ticsscan.com/tx/${transactionHash}`;
          break;
        case 8:
          coinFamily = 'CRO';
          explorer = `https://cronoscan.com/tx/${transactionHash}`;
          break;
        case 9:
          coinFamily = 'PLS';
          explorer = `https://scan.mypinata.cloud/ipfs/bafybeih3olry3is4e4lzm7rus5l3h6zrphcal5a7ayfkhzm5oivjro2cp4/#/tx/${transactionHash}`;
          break;
        default:
          break;
      }
      if (!allData.tx_id) {
        return messageApi.error('Please wait for transaction hash.');
      }

      chrome.tabs.create({
        url: explorer,
      });
    }
  };

  return (
    <>
      {contextHolder}
      <div className="histryList" onClick={(e) => updateExp(e)}>
        <div className="statusCurrency">
          <div className="Status">
            {type == 'deposit' && <img src={recieveIcon}></img>}
            {type == 'withdraw' && <img src={TickIcon}></img>}
            {type == 'swap' && <img src={swapIcon}></img>}
            {type == 'cross_chain' && <img src={swapIcon}></img>}
            {type == 'dapp' && <img src={dAppIcon}></img>}
            {type == 'approve' && <img src={swapIcon}></img>}
            {/* Default case added  */}
            {![
              'deposit',
              'withdraw',
              'swap',
              'cross_chain',
              'dapp',
              'approve',
            ].includes(type) && <img src={TickIcon} />}

            <div className="send">
              <p className="sendRecieve">
                {/* {sendRecieve} */}
                {type == 'deposit' && <span>Deposit</span>}
                {type == 'withdraw' && <span>Withdraw</span>}
                {type == 'swap' && <span>Swap</span>}
                {type == 'cross_chain' && <span>Cross Chain</span>}
                {type == 'dapp' && <span>Smart Contract</span>}
                {type == 'approve' && <span>Approval</span>}
                {type == 'chain_abstraction' && <span>Chain Abstraction</span>}
                {/* Default case added  */}
                {![
                  'deposit',
                  'withdraw',
                  'swap',
                  'cross_chain',
                  'dapp',
                  'approve',
                  'chain_abstraction',
                ].includes(type) && <span>Withdraw</span>}{' '}
                {type != 'dapp' && valueCurrency}
              </p>
              <div className="histryStatus">
                <p>{date}</p>
              </div>
            </div>
          </div>
          <div className="Currency">
            <p
              className="curncyStatus"
              style={{
                color:
                  status === 'confirmed'
                    ? '#00BE00'
                    : status === 'failed'
                    ? '#FF0D0D'
                    : '#ECB300',
              }}
            >
              {status === 'confirmed'
                ? 'Completed'
                : status === 'failed'
                ? 'Failed'
                : 'Pending'}
            </p>
          </div>
        </div>
        <div>
          <div className="outer-list">
            <p className="toFrom">From:</p>
            <p className="addressList">{address}</p>
          </div>
          <div className="outer-list">
            <p className="toFrom">To:</p>
            <p className="addressList">{addressTo}</p>
          </div>
        </div>
      </div>
      <AbstractProcessingModel
        showProcessing={isProcessModalOpen}
        setShowProcess={setIsProcessModal}
        showSuccess={showsuccess}
        setSuccessModal={setShowSuccess}
        transactionResult={transactionResult}
        setTransactionResult={setTransactionResult}
        loader={false}
      />
    </>
  );
}

export default HistoryListOuter;
