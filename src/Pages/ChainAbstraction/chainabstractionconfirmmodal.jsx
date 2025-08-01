import { useSelector } from 'react-redux';
import './CrossChain.scss';
import SwapVerticalIcon from '../../Assets/SwapVerticalIcon.svg';
import { useState } from 'react';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import {
  addCommasToNumber,
  getFlooredFixed,
} from '../../helpers/conversion.helper';
import { Select } from 'antd';
import DownArrowSuffix from '../../Assets/DownArrowSuffix.svg';
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
  const { chain, account, currency } = useSelector((state) => state);
  const [loading, setCompentLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectDrawer, setTokenDrawer] = useState(false);

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
                <Select
                  suffixIcon={<img src={DownArrowSuffix} />}
                  style={{
                    width: 100,
                  }}
                  disabled={!token1 || !token2 || loading}
                  onClick={() => {
                    if (!token1 || !token2 || loading) return;
                    setSelected(1);
                    setTokenDrawer(true);
                  }}
                  open={false}
                  value={[
                    {
                      value: token1?.id,
                      label: (
                        <span className="flexedItemSelect">
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
                                marginRight: '15px',
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
                              }}
                              alt=""
                              src={token1?.image}
                            />
                          )}
                          {token1?.symbol}
                        </span>
                      ),
                    },
                  ]}
                  options={availableTokens
                    .filter((token) => token.id !== token1?.id)
                    .map((token) => {
                      return {
                        value: token?.id,
                        label: (
                          <span className="flexedItemSelect">
                            <img
                              style={{
                                height: '20px',
                                width: '20px',
                                objectFit: 'contain',
                                marginLeft: '20px',
                                marginRight: '20px',
                              }}
                              src={token?.image}
                            />
                            {token?.symbol}
                          </span>
                        ),
                      };
                    })}
                />
                <div className="swap_onChain_pay">
                  <p style={{ textAlign: 'right' }}>
                    Balance{' '}
                    <span>
                      {addCommasToNumber(
                        parseFloat(getFlooredFixed(balance || 0, 6))
                      )}{' '}
                      {token1?.symbol}{' '}
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

          <div className="swap__icon">
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
          </div>
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
                <Select
                  suffixIcon={<img src={DownArrowSuffix} />}
                  style={{
                    width: 100,
                  }}
                  disabled={!token1 || !token2 || loading}
                  onClick={() => {
                    if (!token1 || !token2 || loading) return;
                    setSelected(2);
                    setTokenDrawer(true);
                  }}
                  open={false}
                  value={[
                    {
                      value: token2?.id,
                      label: (
                        <span className="flexedItemSelect">
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
                                marginRight: '15px',
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
                              }}
                              alt=""
                              src={token2?.image}
                            />
                          )}
                          {token2?.symbol}
                        </span>
                      ),
                    },
                  ]}
                  aria-disabled={true}
                  options={availableTokens
                    .filter((token) => token.id !== token1?.id)
                    .map((token) => {
                      return {
                        value: token?.id,
                        label: (
                          <span className="flexedItemSelect">
                            <img
                              style={{
                                height: '20px',
                                width: '20px',
                                objectFit: 'contain',
                                marginLeft: '20px',
                                marginRight: '20px',
                              }}
                              src={token?.image}
                            />
                            {token?.symbol}
                          </span>
                        ),
                      };
                    })}
                />
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
