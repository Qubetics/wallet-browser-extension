import { message, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { store } from '../..';
import { setCreate } from '../../actions/create';
import { setLoading } from '../../actions/loading';
import { updateSpritzAccounts } from '../../actions/spritz';

import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { InputField } from '../../Components/InputField/InputFieldSimple';
import { spritzHelper } from '../../helpers/spritz.helper';
import './BankAccount.scss';

function EditBill() {
  const { state } = useLocation();
  // console.log('🚀 ~ EditBill ~ state:', state);

  const [accountName, setAccountName] = useState(state.bill.name);

  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();

  const handleCreateAccount = async () => {
    // Check if any of the required fields are empty
    if (!accountName) {
      // You can display an error message or take appropriate action here
      messageApi.error('Please fill in all required fields.');
      return; // Stop execution if any field is empty
    }

    // Check if account number and confirm account number match

    store.dispatch(setLoading(true));

    const response = await spritzHelper.editBill(state.bill.id, accountName);

    if (response && response.error) {
      store.dispatch(setLoading(false));
      return messageApi.error(
        response.message || 'Unable to update bill name at the moment'
      );
    }

    store.dispatch(setLoading(false));
    // store.dispatch(updateSpritzAccounts(true));
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
          <InputField
            placeholder={'Enter Here'}
            label={'Bill Name'}
            placeholderBaseColor={true}
            coloredBg={true}
            value={accountName}
            type={'text'}
            getData={(value) => {
              setAccountName(value);
            }}
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

export default EditBill;
