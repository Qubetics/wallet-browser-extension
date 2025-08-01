import React, { useEffect } from 'react';
import './Model.scss';
import { exponential_to_decimal } from '../../helpers/conversion.helper';
import ButtonComp from '../ButtonComp/ButtonComp';
import ModalCustom from '../ModalCustom/ModalCustom';

function convertToDottedString(str, visibleChars = 6) {
  if (!str || typeof str !== 'string') {
    return str;
  }

  if (str.length <= visibleChars * 2) {
    return str;
  }

  const start = str.substring(0, visibleChars);
  const end = str.substring(str.length - visibleChars);
  const dots = str.length > 20 ? '...' : '..'; // More dots for longer strings

  return `${start}${dots}${end}`;
}

const AbstractProcessingModel = ({
  showProcessing,
  showSuccess,
  setShowProcess,
  setSuccessModal,
  transactionResult,
  setTransactionResult = null,
  loader,
}) => {

  const handleExplorer = () => {
    if (transactionResult?.hash) {
      window.open(
        `https://dev-abstraction.qubetics.work/chain-abstraction/${transactionResult.hash}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  useEffect(() => {
    console.log('showProcessing', showProcessing);
    console.log('loader', loader);
    if (showProcessing && loader) {
      const timer = setTimeout(() => {
        setShowProcess(false);
        setSuccessModal(true);
      }, 5000);

      return () => clearTimeout(timer);
    }

    if (showProcessing && !loader) {
      setShowProcess(false);
      setSuccessModal(true);
    }
  }, [showProcessing, loader]);

  if (showProcessing) {
    return (
      <ModalCustom
        title={''}
        isModalOpen={showProcessing}
        customClass="customClassModal"
        closable={false}
      >
        <div className="model-content">
          <div className="spinner"></div>
          <h2>Processing Transaction</h2>
          <p className="subtitle">Transaction under confirmation...</p>
          <div className="steps">
            <div className="step completed">
              <span className="step-status">✓</span>
              <span className="step-text">Validating transaction</span>
            </div>
            <div className="step active">
              <span className="step-status spinner-small"></span>
              <span className="step-text">Broadcasting to network</span>
            </div>
            <div className="step">
              <span className="step-status"></span>
              <span className="step-text">Confirming on blockchain</span>
            </div>
          </div>
          <p className="note">
            This may take a few minutes depending on network congestion
          </p>
        </div>
      </ModalCustom>
    );
  }

  function getStatusText(value) {
    switch (value) {
      case 0:
        return 'Transaction Failed';
      case 1:
        return 'Transaction Successful';
      case 2:
        return 'Transaction Processing';
      default:
        return 'Unknown Status';
    }
  }

  function getStatusValue(value) {
    switch (value) {
      case 0:
        return 'Failed';
      case 1:
        return 'Confirmed';
      case 2:
        return 'Pending';
      default:
        return 'Unknown Status';
    }
  }

  if (showSuccess) {
    return (
      <ModalCustom
        title={''}
        handleCancel={() => setSuccessModal(false)}
        isModalOpen={showSuccess}
        customClass="customClassModal"
        closable={true}
      >
        <div className="model-content success">
          <h2>{getStatusText(transactionResult?.status)}</h2>
          <div className="transaction-details">
            <div className="transaction-hash">
              <p>Transaction Hash</p>
              <div className="hash-container">
                <span>{transactionResult?.hash}</span>
              </div>
            </div>
            <div className="transaction-info">
              <div className="info-row">
                <span className="label">Status</span>
                <span
                  className="value confirmed"
                  style={{
                    color:
                      transactionResult?.status == 0
                        ? 'red'
                        : transactionResult?.status == 2
                        ? 'gold'
                        : transactionResult?.status == 1
                        ? 'green'
                        : 'gray',
                  }}
                >
                  {getStatusValue(transactionResult?.status)}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Solver</span>
                <span className="value">
                  {transactionResult?.solver
                    ? convertToDottedString(transactionResult?.solver)
                    : '-'}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Network Fee</span>
                <span className="value">
                  {exponential_to_decimal(transactionResult?.fee)}{' '}
                  {transactionResult?.symbol}
                </span>
              </div>
            </div>
          </div>
          <ButtonComp
            text={'View on Explorer'}
            maxWidth={'100%'}
            onClick={handleExplorer}
          />
        </div>
      </ModalCustom>
    );
  }

  return null;
};

export default AbstractProcessingModel;
