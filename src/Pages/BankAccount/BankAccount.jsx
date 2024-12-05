import {
  BankAccountSubType,
  BankAccountType,
} from '@spritz-finance/api-client';
import { message, Select } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../..';
import { setCreate } from '../../actions/create';
import { setLoading } from '../../actions/loading';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import {
  InputField,
  InputFieldOnly,
} from '../../Components/InputField/InputFieldSimple';
import { spritzHelper } from '../../helpers/spritz.helper';
import './BankAccount.scss';
import { spritzAccounts } from '../../actions/spritz';

function BankAccount() {
  // Create state variables for each input field
  const [fullName, setFullName] = useState(null);
  const [accountName, setAccountName] = useState('My Bank Account');
  const [accountHolder, setAccountHolder] = useState(null);
  const [anotherAccount, setAnotherAccount] = useState(false);
  const [accountNumber, setAccountNumber] = useState(null);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(null);
  const [routingNumber, setRoutingNumber] = useState(null);
  const [transitNumber, setTransitNumber] = useState(null);
  const [institutionNumber, setInstitutionNumber] = useState(null);
  const [accountType, setAccountType] = useState(BankAccountType.USBankAccount); // Default value
  const [accountSubType, setAccountSubType] = useState(
    BankAccountSubType.Savings
  ); // Default value

  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();

  const handleCreateAccount = async () => {
    // Check if any of the required fields are empty
    if (!fullName || !accountNumber || !confirmAccountNumber || !accountType) {
      // You can display an error message or take appropriate action here
      messageApi.error('Please fill in all required fields.');
      return; // Stop execution if any field is empty
    }

    // Check if account number and confirm account number match
    if (accountNumber !== confirmAccountNumber) {
      // You can display an error message or take appropriate action here
      messageApi.error('Account numbers do not match.');
      return; // Stop execution if account numbers don't match
    }
    store.dispatch(setLoading(true));

    let response = null;

    let accName = accountName.includes('Belongs to Friends')
      ? accountHolder
      : accountName;
    if (accountType === BankAccountType.USBankAccount) {
      response = await spritzHelper.createUSBankAccount(
        accountType,
        accountNumber,
        routingNumber,
        fullName,
        accName,
        accountSubType,
        anotherAccount
      );
    } else {
      response = await spritzHelper.createCABankAccount(
        accountType,
        accountNumber,
        transitNumber,
        fullName,
        accName,
        accountSubType,
        institutionNumber,
        anotherAccount
      );
    }

    if (response && response.error) {
      store.dispatch(setLoading(false));
      return messageApi.error(
        response.message || 'Unable to create an account at the moment.'
      );
    }

    store.dispatch(setLoading(false));
    const accounts = await spritzHelper.getBankAccounts();
    store.dispatch(spritzAccounts(accounts));
    navigate('/withdraw');
  };

  return (
    <div
      style={{
        marginTop: '28px',
        paddingBottom: '30px',
      }}
    >
      {contextHolder}
      <div className='backAccount'>
        <div className='cardWhite__linkOuter'>
          <label>Bank Account Location</label>
          <Select
            defaultValue={BankAccountType.USBankAccount}
            className='selctCmn'
            onChange={(value) => {
              setAccountType(value);
            }}
            value={accountType}
            options={[
              {
                value: BankAccountType.USBankAccount,
                label: 'US Bank Account',
              },
              {
                value: BankAccountType.CABankAccount,
                label: 'Canadian Bank Account',
              },
            ]}
          />
        </div>

        {/* <div className="cardWhite__linkOuter">
          <InputField
            placeholder={"Enter here"}
            label="Account Name"
            placeholderBaseColor={true}
            coloredBg={true}
            value={accountName}
            getData={setAccountName}
          />
        </div> */}

        <div className='cardWhite__linkOuter'>
          <label>Account Owner</label>
          <Select
            // defaultValue={"My Own Bank Account"}
            className='selctCmn'
            onChange={(value) => {
              setAccountName(value);
              if (value == 'Belongs to Friends, Family or Others') {
                setAnotherAccount(true);
              } else {
                setAnotherAccount(false);
              }
            }}
            value={accountName}
            options={[
              {
                value: 'My Bank Account',
                label: 'My Bank Account',
              },
              {
                value: 'Friend/Family/Other’s Account',
                label: 'Friend/Family/Other’s Account',
              },
            ]}
          />
        </div>

        {anotherAccount && (
          <div className='cardWhite__linkOuter'>
            <InputFieldOnly
              placeholder={'Enter Holder Name'}
              label='Holder Name'
              placeholderBaseColor={true}
              coloredBg={true}
              value={accountHolder}
              getData={(value) => {
                const alphanumericRegex = /^[a-zA-Z ]*$/; // Allow spaces in the input
                if (alphanumericRegex.test(value) && value.length < 20) {
                  setAccountHolder(value);
                }
              }}
            />
          </div>
        )}

        <div className='cardWhite__linkOuter'>
          <InputFieldOnly
            placeholder={'Enter Account Nickname'}
            label='Account Nickname'
            placeholderBaseColor={true}
            coloredBg={true}
            value={fullName}
            getData={(value) => {
              const alphanumericRegex = /^[a-zA-Z ]*$/; // Allow spaces in the input
              if (alphanumericRegex.test(value) && value.length < 20) {
                setFullName(value);
              }
            }}
          />
        </div>
        <div className='cardWhite__linkOuter'>
          <InputField
            placeholder={'Enter Account Number'}
            label='Account Number'
            placeholderBaseColor={true}
            coloredBg={true}
            value={accountNumber}
            getData={(value) => {
              if (value.length < 18) {
                setAccountNumber(value);
              }
            }}
            type={'number'}
            limit={18}
          />
        </div>
        <div className='cardWhite__linkOuter'>
          <InputField
            placeholder={'Confirm Account Number'}
            label='Confirm Account Number'
            placeholderBaseColor={true}
            coloredBg={true}
            value={confirmAccountNumber}
            getData={(value) => {
              if (value.length < 18) {
                setConfirmAccountNumber(value);
              }
            }}
            type={'number'}
          />
        </div>
        {accountType === BankAccountType.CABankAccount ? (
          <>
            <div className='cardWhite__linkOuter'>
              <InputField
                placeholder={'Enter Transit Number'}
                label='Transit Number'
                placeholderBaseColor={true}
                coloredBg={true}
                value={transitNumber}
                getData={(value) => {
                  if (value.length < 20) {
                    setTransitNumber(value);
                  }
                }}
                type={'number'}
              />
            </div>
            <div className='cardWhite__linkOuter'>
              <InputField
                placeholder={'Enter Institution Number'}
                label='Institution Number'
                placeholderBaseColor={true}
                coloredBg={true}
                value={institutionNumber}
                getData={(value) => {
                  if (value.length < 50) {
                    setInstitutionNumber(value);
                  }
                }}
                type={'number'}
              />
            </div>
          </>
        ) : (
          <div className='cardWhite__linkOuter'>
            <InputField
              placeholder={'Enter Routing Number'}
              label='Routing Number'
              placeholderBaseColor={true}
              coloredBg={true}
              value={routingNumber}
              getData={(value) => {
                if (value.length < 50) {
                  setRoutingNumber(value);
                }
              }}
              type={'number'}
            />
          </div>
        )}

        <div className='cardWhite__linkOuter'>
          <label>Account Type</label>
          <Select
            defaultValue={BankAccountSubType.Savings}
            className='selctCmn'
            onChange={(value) => {
              setAccountSubType(value);
            }}
            value={accountSubType}
            options={[
              {
                value: BankAccountSubType.Savings,
                label: BankAccountSubType.Savings,
              },
              {
                value: BankAccountSubType.Checking,
                label: BankAccountSubType.Checking,
              },
              {
                value: BankAccountSubType.Business,
                label: BankAccountSubType.Business,
              },
            ]}
          />
        </div>

        <ButtonComp
          text={'Submit'}
          maxWidth={'100%'}
          marginTop={'20px'}
          onClick={() => {
            handleCreateAccount();
          }}
        />
      </div>
    </div>
  );
}

export default BankAccount;
