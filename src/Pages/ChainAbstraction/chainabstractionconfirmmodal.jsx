import { useSelector } from 'react-redux';
import './CrossChain.scss';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import {
  addCommasToNumber,
  getFlooredFixed,
} from '../../helpers/conversion.helper';
import { InputField } from '../../Components/InputField/InputFieldSimple';
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
}) => {
  const { currency } = useSelector((state) => state);

  const handleCancel = () => {
    if (isProcessing) return;
    setIsOpen(!isOpen);
  };

  const handleProceed = () => {
    if (isProcessing) return;
    setIsOpen(!isOpen);
    handleAbstract();
  };

  return (
    <ModalCustom
      title={'Confirm Abstraction'}
      handleCancel={handleCancel}
      isModalOpen={isOpen}
      customClass="customClassModal"
      closable={!isProcessing}
    >
      {/* <div>
        <p>Please review your transaction details</p>
      </div> */}
      <div>
        <div
          style={{ width: '90%', marginRight: 'auto', marginLeft: 'auto' }}
          className="swap "
        >
          <div className="swap_onChain ">
            <div className="swap_onChain_balance">
              <div>
                <input
                  type="number"
                  className="myInput"
                  placeholder="0.000"
                  onWheel={(e) => e.currentTarget.blur()}
                  value={amount}
                  inputMode="decimal"
                  onKeyDown={(e) => {
                    const allowedKeys = [
                      'Backspace',
                      'Tab',
                      'ArrowLeft',
                      'ArrowRight',
                      'Delete',
                      'Home',
                      'End',
                    ];

                    if (allowedKeys.includes(e.key)) return;
                    if (!/^[0-9.]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  disabled={true}
                />
                <p style={{ marginBottom: '8px' }}>
                  {currency.symbol}
                  {addCommasToNumber(
                    getFlooredFixed(
                      parseFloat(amount ? amount : 0) *
                        parseFloat(token1 ? token1.price : 0),
                      2
                    )
                  ) !== 'NaN'
                    ? addCommasToNumber(
                        getFlooredFixed(
                          parseFloat(amount ? amount : 0) *
                            parseFloat(token1 ? token1.price : 0),
                          2
                        )
                      )
                    : '0.00'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="flexedItemSelect" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end',
                  padding: '4px 0'
                }}>
                  {!token1?.image ? (
                    <div
                      style={{
                        alignItems: 'center',
                        backgroundColor: 'rgba(98,126,234,.2)',
                        borderRadius: '49%',
                        display: 'flex',
                        height: '29px',
                        justifyContent: 'center',
                        width: '29px',
                        marginRight: '8px',
                      }}
                    >
                      {token1?.name.split('')[0]}
                    </div>
                  ) : (
                    <img
                      style={{
                        height: '30px',
                        width: '30px',
                        objectFit: 'contain',
                        position: 'relative',
                        borderRadius: '15px',
                        marginRight: '8px',
                      }}
                      alt=""
                      src={token1?.image}
                    />
                  )}
                  <span style={{ fontWeight: 500 }}>{token1?.symbol?.toUpperCase()}</span>
                </div>
                <div className="swap_onChain_pay">
                  <p style={{ textAlign: 'right' }}>
                    Balance{' '}
                    <span>
                      {addCommasToNumber(
                        parseFloat(getFlooredFixed(balance || 0, 6))
                      )}{' '}
                      {token1?.symbol?.toUpperCase()}{' '}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '10px', width: '100%' }}>
            <InputField
              placeholder={'From Address'}
              type={'text'}
              label="From Address"
              value={fromAddress}
            />
          </div>

          {/* <div className="swap__icon">
            {availableTokens?.length !== 0 && (
              <img
                src={SwapVerticalIcon}
                width={44}
                alt=""
                height={44}
                style={
                  loading
                    ? { pointerEvents: 'none' }
                    : { pointerEvents: 'auto' }
                }
              />
            )}
          </div> */}
          <div className="swap_onChain">
            <div className="swap_onChain_balance">
              <div>
                <input
                  type="number"
                  className="myInput"
                  readOnly={true}
                  placeholder="0.000"
                  value={receivedAmount}
                />
                <p style={{ marginBottom: '8px' }}>
                  {currency.symbol}
                  {addCommasToNumber(
                    getFlooredFixed(
                      parseFloat(receivedAmount ? receivedAmount : 0) *
                        parseFloat(token2 ? token2.price : 0),
                      2
                    )
                  )}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="flexedItemSelect" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end',
                  padding: '4px 0'
                }}>
                  {!token2?.image ? (
                    <div
                      style={{
                        alignItems: 'center',
                        backgroundColor: 'rgba(98,126,234,.2)',
                        borderRadius: '49%',
                        display: 'flex',
                        height: '29px',
                        justifyContent: 'center',
                        width: '29px',
                        marginRight: '8px',
                      }}
                    >
                      {token2?.name.split('')[0]}
                    </div>
                  ) : (
                    <img
                      style={{
                        height: '30px',
                        width: '30px',
                        objectFit: 'contain',
                        position: 'relative',
                        borderRadius: '15px',
                        marginRight: '8px',
                      }}
                      alt=""
                      src={token2?.image}
                    />
                  )}
                  <span style={{ fontWeight: 500 }}>{token2?.symbol?.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '10px', width: '100%' }}>
            <InputField
              placeholder={'To Address'}
              type={'text'}
              label="To Address"
              value={toAddress}
            />
          </div>
          <div
            style={{
              marginTop: '10px',
            }}
          >
            <ButtonComp
              onClick={() => {
                handleProceed();
              }}
              text={
                isProcessing
                  ? 'Processing...'
                  : amount === null || amount === 0
                  ? 'Enter Amount'
                  : toAddress === '' || !toAddress
                  ? 'Enter Recipient Address'
                  : 'Abstract'
              }
              maxWidth={'100%'}
              disabled={isProcessing}
            />
          </div>
        </div>
      </div>
    </ModalCustom>
  );
};

export default ConfirmAbstractModal;
