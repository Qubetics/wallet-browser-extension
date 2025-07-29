import React, { useState, useEffect } from 'react';
import './Model.scss';

const Model = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading time with setTimeout
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleExplorer = () => {
    // Handle explorer view logic here
    console.log('View on Explorer clicked');
  };

  if (isLoading) {
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
            
            <p className="note">This may take a few minutes depending on network congestion</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="model-overlay">
      <div className="model-container">
        <div className="model-content success">
          <div className="success-icon">✓</div>
          <h2>Transaction Successful!</h2>
          <p className="subtitle">Your abstraction has been completed</p>
          
          <div className="transaction-details">
            <div className="transaction-hash">
              <p>Transaction Hash</p>
              <div className="hash-container">
                <span>0x123456789abcdef123456789abcdef12345678</span>
                <button className="copy-btn">📋</button>
              </div>
            </div>
            
            <div className="transaction-info">
              <div className="info-row">
                <span className="label">Status</span>
                <span className="value confirmed">Confirmed</span>
              </div>
              
              <div className="info-row">
                <span className="label">Solver</span>
                <span className="value">UniSwap Protocol V3</span>
              </div>
              
              <div className="info-row">
                <span className="label">Network Fee</span>
                <span className="value">0.0024 ETH</span>
              </div>
              
              <div className="info-row">
                <span className="label">Confirmation Time</span>
                <span className="value">2.3 seconds</span>
              </div>
            </div>
          </div>
          
          <div className="actions">
            <button className="close-btn" onClick={handleClose}>Close</button>
            <button className="explorer-btn" onClick={handleExplorer}>View on Explorer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Model;
