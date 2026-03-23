import { Input } from 'antd';
import React from 'react';
import EyeOpenIcon from '../../Assets/EyeOpenIcon.svg';
import EyeCloseIcon from '../../Assets/EyeCloseIcon.svg';
import './InputFieldSimple.scss';
import Scanner from '../../Assets/scanner.svg';
import EditIcon from '../../Assets/edit.svg';
import { Link } from 'react-router-dom';

function InputFieldSimple({
  placeholder,
  getData,
  customFunction,
  value,
  label,
}) {
  return (
    <>
      <label className={'password-label'}>{label}</label>
      <Input.Password
        onChange={(e) => {
          getData(e.target.value);
        }}
        onCopy={(e) => {
          e.preventDefault();
          return false;
        }}
        value={value}
        className="inputSimple"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && typeof customFunction === 'function') {
            customFunction();
          }
        }}
        placeholder={placeholder}
        iconRender={(visible) =>
          visible ? (
            <img
              style={{ cursor: 'pointer' }}
              src={EyeOpenIcon}
              width={19}
              height={12}
            />
          ) : (
            <img
              style={{ cursor: 'pointer' }}
              src={EyeCloseIcon}
              width={19}
              height={16}
            />
          )
        }
      />
    </>
  );
}

export default InputFieldSimple;

export const InputField = ({
  placeholder,
  defaultValue,
  label,
  addonAfter,
  inputSelect,
  mb0,
  placeholderBaseColor,
  coloredBg,
  readonly,
  value,
  getData,
  checkForSymbols,
  type,
  addonBefore,
  limit,
  disabled,
  maxLength,
  onKeyDown,
  showEditIcon,
}) => {
  return (
    <div className={`${'boxStyle'} inputField ${mb0 ? 'mb0' : ''}`}>
      <label className={`${'boxStyle__label'}`}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Input
          className={`${'inputField__input'} ${
            inputSelect ? 'inputField__inputSelect' : ''
          }  ${placeholderBaseColor ? 'placeholderBaseColor' : ''} ${
            coloredBg ? 'inputField__coloredBg' : ''
          }`}
          addonAfter={addonAfter}
          addonBefore={addonBefore}
          value={value}
          title=""
          maxLength={maxLength}
          onKeyDown={(e) => {
            if (type === 'number') {
              const allowedKeys = [
                'Backspace',
                'Tab',
                'ArrowLeft',
                'ArrowRight',
                'Delete',
                'Home',
                'End',
              ];

              // Allow control/navigation keys
              if (allowedKeys.includes(e.key)) return;

              if (!/^[0-9.]$/.test(e.key)) {
                e.preventDefault(); // Block everything else (letters, +, -, e, etc.)
              }
            }
          }}
          onChange={(e) => {
            if (!checkForSymbols) {
              return getData(e.target.value);
            }
            getData(e.target.value);
          }}
          type={type || 'text'}
          onWheel={(e) => (type === 'number' ? e.target.blur() : console.log(''))}
          defaultValue={defaultValue}
          placeholder={placeholder}
          readOnly={readonly ? readonly : false}
          disabled={disabled}
        />
        {showEditIcon && (
          <img
            src={EditIcon}
            alt="Edit"
            style={{
              position: 'absolute',
              right: '1px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              // cursor: 'pointer',
              opacity: 0.6,
            }}
          />
        )}
      </div>
    </div>
  );
};

export const InputFieldOnly = ({
  placeholder,
  label,
  minHeight,
  placeholderBaseColor,
  coloredBg,
  getData,
  width,
  readonly,
  value,
  checkForSymbols,
  doCheckForSymbols,
  currencySymbol,
}) => {
  return (
    <div className="boxStyle inputFieldOnly">
      <label className="boxStyle__label">{label}</label>
      <Input
        onChange={(e) => {
          if (!checkForSymbols) {
            return getData(e.target.value);
          }

          if (doCheckForSymbols) {
            if (currencySymbol) {
              const format = new RegExp(`^\\${currencySymbol}?\\d*\\.?\\d*$`);
              if (!format.test(e.target.value)) {
                return;
              }
            } else {
              const format = /^\d*\.?\d*$/;
              if (!format.test(e.target.value)) {
                return;
              }
            }
          }

          getData(e.target.value);
        }}
        className={`${'inputSimple'} ${
          placeholderBaseColor ? 'placeholderBaseColor' : ''
        } ${coloredBg ? 'inputField__coloredBg' : ''}`}
        placeholder={placeholder}
        style={{ minHeight: minHeight, width }}
        readOnly={readonly ? readonly : false}
        value={value}
      />
    </div>
  );
};
