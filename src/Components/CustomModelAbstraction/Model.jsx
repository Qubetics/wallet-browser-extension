import React, { useEffect } from 'react';
import './Model.scss';
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
  const dots = str.length > 20 ? '...' : '..';

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
  onClose,
}) => {

  const handleExplorer = () => {
    if (transactionResult?.hash) {
      window.open(
        `${process.env.REACT_APP_CHAIN_ABSTRACTION_WEB_URL}chain-abstraction/${transactionResult.hash}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  const handleModalClose = () => {
    setShowProcess(false);
    setSuccessModal(false);
    setTimeout(() => {
      onClose?.();
    }, 100);
  };

  useEffect(() => {
    // console.log('showProcessing', showProcessing);
    // console.log('loader', loader);
    // Only auto-transition if loader is true (showing processing state)
    // If loader is false, we're showing final result directly - no auto-transition
    if (showProcessing && loader) {
      const timer = setTimeout(() => {
        setShowProcess(false);
        setSuccessModal(true);
      }, 5000);

      return () => clearTimeout(timer);
    }

    // Removed automatic transition when loader is false
    // Modal will show success state directly and only close on user click
  }, [showProcessing, loader]);

  if (showProcessing) {
    return (
      <ModalCustom
        title={''}
        isModalOpen={showProcessing}
        customClass="customClassModal"
        closable={false}
        handleCancel={handleModalClose}
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
        return 'Transaction Processing';
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
        return 'Pending';
    }
  }

  if (showSuccess) {
    // Check if this is a failure with no valid hash (simpler failure modal)
    const isFailureWithNoHash = transactionResult?.status == 0 && 
                                 (!transactionResult?.hash || 
                                  transactionResult?.hash === "N/A" || 
                                  transactionResult?.hash === "");

    // Show simpler failure modal for failed transactions without hash
    if (isFailureWithNoHash) {
      return (
        <ModalCustom
          title={''}
          handleCancel={handleModalClose}
          isModalOpen={showSuccess}
          customClass="customClassModal"
          closable={true}
        >
          <div className="model-content failure">
            <div className="failure-icon">✕</div>
            <h2>Transaction Failed</h2>
            <p>
              Your transaction could not be processed. Please try again later.
            </p>
            <ButtonComp
              text={'Close'}
              maxWidth={'100%'}
              onClick={handleModalClose}
            />
          </div>
        </ModalCustom>
      );
    }

    // Show normal success/pending modal with transaction details
    return (
      <ModalCustom
        title={''}
        handleCancel={handleModalClose}
        isModalOpen={showSuccess}
        customClass="customClassModal"
        closable={true}
      >
        <div className="model-content success">
          <h2>{getStatusText(transactionResult?.status)}</h2>
          <div className="transaction-details">
            <div className="transaction-hash">
              <p>Intent Transaction Hash</p>
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
                <span className="label">Sender</span>
                <span className="value">
                  {transactionResult?.solver
                    ? convertToDottedString(transactionResult?.source_address)
                    : '-'}
                </span>
              </div>
              {/* <div className="info-row">
                <span className="label">Network Fee</span>
                <span className="value">
                  {exponential_to_decimal(transactionResult?.fee)}{' '}
                  {transactionResult?.symbol}
                </span>
              </div> */}
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