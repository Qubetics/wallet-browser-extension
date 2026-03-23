import React from 'react';
import Edit from '../../Assets/edit.svg';
import './BankAccount.scss';

function ListingBank({ imgage, ListingName, onCLick }) {
  return (
    <div className='lisyingAccount' onClick={onCLick}>
      <div className='innerContactListing'>
        <div className='leftSec'>
          {imgage && (
            <img
              src={imgage}
              alt=''
              style={{ height: '40px', width: '40px', objectFit: 'contain' }}
            />
          )}
          {ListingName && <h3>{ListingName}</h3>}
        </div>
      </div>
    </div>
  );
}

export default ListingBank;
