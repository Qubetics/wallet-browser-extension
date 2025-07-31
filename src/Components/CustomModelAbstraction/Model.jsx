import React, { useEffect } from 'react';
import './Model.scss';
import { exponential_to_decimal } from '../../helpers/conversion.helper';

const AbstractProcessingModel = ({
  showProcessing,
  showSuccess,
  setShowProcess,
  setSuccessModal,
  transactionResult,
  setTransactionResult = null,
}) => {
  const handleClose = () => {
    setSuccessModal(false);
    if (setTransactionResult !== null) {
      setTransactionResult(null);
    }
  };

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
    if (showProcessing) {
      setTimeout(() => {
        setShowProcess(false);
        setSuccessModal(true);
      }, 5000);
    }
  }, [showProcessing]);

  if (showProcessing) {
    return (
      <div className="model-overlay">
        <div className="model-container">
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
        </div>
      </div>
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
  if (showSuccess) {
    return (
      <div className="model-overlay">
        <div className="model-container">
          <div className="model-content success">
            <div className="success-icon">✓</div>
            <h2>{getStatusText(transactionResult?.status)}</h2>
            <p className="subtitle">Your abstraction has been completed</p>

            <div className="transaction-details">
              <div className="transaction-hash">
                <p>Transaction Hash</p>
                <div className="hash-container">
                  <span>{transactionResult?.hash}</span>
                  <button className="copy-btn">📋</button>
                </div>
              </div>

              <div className="transaction-info">
                <div className="info-row">
                  <span className="label">Status</span>
                  <span className="value confirmed">
                    {getStatusText(transactionResult?.status)}
                  </span>
                </div>

                <div className="info-row">
                  <span className="label">Solver</span>
                  <span className="value">{transactionResult?.solver}</span>
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
            <div className="actions">
              <button className="close-btn" onClick={handleClose}>
                Close
              </button>
              <button className="explorer-btn" onClick={handleExplorer}>
                View on Explorer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AbstractProcessingModel;
