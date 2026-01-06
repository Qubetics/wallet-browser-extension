import { useSelector } from 'react-redux';
import { message } from 'antd';
import './CrossChain.scss';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import {
  addCommasToNumber,
  getFlooredFixed,
} from '../../helpers/conversion.helper';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';

const ConfirmAbstractModal = ({
  availableTokens,
  token1,
  token2,
  receivedAmount,
  amount,
  isOpen,
  setIsOpen,
  balance,
  toAddress,
  fromAddress,
  handleAbstract,
  isProcessing,
  platformFee = 1.5,
  solverFee = 1.5,
  networkFee = 0,
}) => {
  const { currency } = useSelector((state) => state);
  const [messageApi, contextHolder] = message.useMessage();

  const handleCancel = () => {
    if (isProcessing) return;
    setIsOpen(!isOpen);
  };

  const handleProceed = () => {
    if (isProcessing) return;
    setIsOpen(!isOpen);
    handleAbstract();
  };

  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    if (address.length <= 20) return address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    messageApi.success(`${label} copied to clipboard`);
  };

  // Remove trailing zeros from decimal numbers (only after decimal point)
  const removeTrailingZeros = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const str = String(value);
    // Only remove trailing zeros after the decimal point, preserve integer part
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  return (
    <>
      {contextHolder}
      <ModalCustom
        title={'Confirm Abstraction'}
        handleCancel={handleCancel}
        isModalOpen={isOpen}
        customClass="customClassModal"
        closable={!isProcessing}
      >
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: '#999', margin: 0, textAlign: 'center' }}>
          Please review your transaction details
        </p>
      </div>
      <div>
        <div
          style={{ width: '90%', marginRight: 'auto', marginLeft: 'auto' }}
          className="swap "
        >
          {/* From Section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              {!token1?.image ? (
                <div style={{
                  alignItems: 'center',
                  backgroundColor: 'rgba(98,126,234,.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  height: '40px',
                  justifyContent: 'center',
                  width: '40px',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>{token1?.name?.split('')[0]}</span>
                </div>
              ) : (
                <img
                  style={{
                    height: '40px',
                    width: '40px',
                    objectFit: 'contain',
                    borderRadius: '20px',
                    flexShrink: 0,
                  }}
                  alt=""
                  src={token1?.image}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px', color: '#fff' }}>
                  {token1?.name || 'Token'}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {token1?.symbol?.toUpperCase()}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                {addCommasToNumber(removeTrailingZeros(getFlooredFixed(parseFloat(amount || 0), 8)))}
              </div>
            </div>
          </div>

          {/* Downward Arrow Separator */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
            <span style={{ fontSize: '20px', color: '#999' }}>↓</span>
          </div>

          {/* To Section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginTop: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              {!token2?.image ? (
                <div style={{
                  alignItems: 'center',
                  backgroundColor: 'rgba(98,126,234,.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  height: '40px',
                  justifyContent: 'center',
                  width: '40px',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>{token2?.name?.split('')[0]}</span>
                </div>
              ) : (
                <img
                  style={{
                    height: '40px',
                    width: '40px',
                    objectFit: 'contain',
                    borderRadius: '20px',
                    flexShrink: 0,
                  }}
                  alt=""
                  src={token2?.image}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px', color: '#fff' }}>
                  {token2?.name || 'Token'}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {token2?.symbol?.toUpperCase()}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                {addCommasToNumber(removeTrailingZeros(getFlooredFixed(parseFloat(receivedAmount || 0), 8)))}
              </div>
            </div>
          </div>

          {/* Fees Section */}
          <div style={{ 
            marginTop: '20px', 
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#999' }}>Platform Fee ({platformFee}%)</span>
              <span style={{ fontSize: '13px', fontWeight: 500 , color: '#fff'}}>
                {addCommasToNumber(removeTrailingZeros(getFlooredFixed(parseFloat(amount || 0) * (platformFee / 100), 8)))} {token1?.symbol?.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#999' }}>Solver Fee ({solverFee}%)</span>
              <span style={{ fontSize: '13px', fontWeight: 500 , color: '#fff'}}>
                {addCommasToNumber(removeTrailingZeros(getFlooredFixed(parseFloat(amount || 0) * (solverFee / 100), 8)))} {token1?.symbol?.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#999' }}>Transaction Fee</span>
              <span style={{ fontSize: '13px', fontWeight: 500 , color: '#fff'}}>
                {(() => {
                  const fee = parseFloat(networkFee || 0);
                  const formattedFee = fee > 0 
                    ? addCommasToNumber(removeTrailingZeros(getFlooredFixed(fee, 8)))
                    : '0';
                  const fiatValue = fee > 0 && token1?.price
                    ? fee * parseFloat(token1.price)
                    : 0;
                  return (
                    <>
                      {formattedFee} {token1?.symbol?.toUpperCase()}{' '}
                      {fiatValue > 0 && (
                        <span style={{ color: '#999', fontSize: '12px' }}>
                          (~{currency.symbol}{addCommasToNumber(getFlooredFixed(fiatValue, 2))})
                        </span>
                      )}
                    </>
                  );
                })()}
              </span>
            </div>
          </div>
          
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1 }}>
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#666',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Cancel
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: '44px' }}>
                <ButtonComp
                  onClick={() => {
                    handleProceed();
                  }}
                  text={
                    isProcessing
                      ? 'Processing...'
                      : 'Confirm'
                  }
                  maxWidth={'100%'}
                  height={'44px'}
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalCustom>
    </>
  );
};

export default ConfirmAbstractModal;
