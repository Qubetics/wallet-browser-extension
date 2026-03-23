/*global chrome */
import 'react-tabs/style/react-tabs.css';
import style from './style.module.scss';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import darkclose from '../../Assets/darkclose.svg';
import { Drawer, message, Radio, Select } from 'antd';
import React, { useState } from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import { InputField } from '../../Components/InputField/InputFieldSimple';
import DownArrowSuffix from '../../Assets/DownArrowSuffix.svg';

import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { useSelector } from 'react-redux';

function TransactionFilter() {
  const { account, chain, loading } = useSelector((state) => state);
  const [messageApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const [coin, setCoin] = useState({
    id: 0,
    symbol: 'All Coins',
  });
  const [status, setStatus] = useState(null);
  const { theme } = useSelector((state) => state);
  const [show, setShow] = useState(true);
  const [keyword, setKeyword] = useState(null);

  const [filteredTokens, setFilteredTokens] = useState(
    account.tokens[chain.chainId]
  );
  const [allToken, setAllTokens] = useState(account.tokens[chain.chainId]);

  const selectAfter = (
    <div className={'addonAfter'}>
      <Select
        suffixIcon={<img src={DownArrowSuffix} alt="" />}
        onClick={() => {
          setOpen(true);
        }}
        value={[
          {
            value: coin?.id,
            label:
              coin?.id != 0 ? (
                <span className="flexedItemSelect">
                  <img
                    style={{
                      height: '30px',
                      width: '30px',
                      objectFit: 'contain',
                      position: 'relative',
                    }}
                    alt=""
                    src={coin?.image}
                  />
                  {coin?.symbol}
                </span>
              ) : (
                <span className="flexedItemSelect">
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
                    A
                  </div>
                  All Coins
                </span>
              ),
          },
        ]}
        defaultValue={[
          {
            value: 0,
            label: (
              <span className="flexedItemSelect">
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
                  A
                </div>
                All Coins
              </span>
            ),
          },
        ]}
        open={false}
        options={allToken.map((token) => {
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
                  alt=""
                  src={token?.image}
                />
                {token?.symbol}
              </span>
            ),
          };
        })}
      />
    </div>
  );

  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={'/history'}
        title={'Transaction History Filter'}
      />
      <div className={`flexedContent`}>
        <div className={style.swap}>
          <InputField
            mb0={true}
            checkForSymbols={true}
            inputSelect={true}
            placeholder={coin.symbol}
            label="Select Coin"
            type={'text'}
            addonAfter={selectAfter}
          />

          <div style={{ marginTop: '50px' }}>
            <ButtonComp text={'Apply Filters'} onClick={() => {}} />
          </div>
        </div>
      </div>

      <Drawer
        title="Select Token"
        placement="bottom"
        onClose={() => {
          setOpen(false);
        }}
        open={open}
        // eslint-disable-next-line jsx-a11y/alt-text
        closeIcon={
          theme == 'darkTheme' ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
        height={500}
      >
        <div
          className="contain"
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {show ? (
            <div className="search" style={{ marginBottom: '30px' }}>
              <InputField
                placeholder={'Search coin'}
                coloredBg={'#eef3f9'}
                value={keyword}
                checkForSymbols={true}
                getData={(value) => {
                  const hasEmoji = /[\p{Extended_Pictographic}]/u.test(value);
                  if (hasEmoji && value.length > 25) {
                    return false;
                  }
                  setKeyword(value);
                  if (value.trim().length === 0) {
                    setFilteredTokens(allToken);
                  } else {
                    const matches = allToken.filter(
                      (el) =>
                        el.symbol
                          .toLowerCase()
                          .indexOf(value.trim().toLowerCase()) > -1 ||
                        el.name
                          .toLowerCase()
                          .indexOf(value.trim().toLowerCase()) > -1
                    );

                    setFilteredTokens(matches);
                  }
                }}
              />
            </div>
          ) : null}

          <div
            className="right"
            style={{
              flex: 1,
              overflow: 'scroll',
            }}
          >
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <div
                  className={style.design}
                  style={{
                    width: '100%',
                  }}
                >
                  <div
                    className="token"
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      marginBottom: '20px',
                      padding: '8px',
                      borderRadius: '30px',
                      marginLeft: '7px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      width: '100%;',
                      backgroundColor: 'transparent',
                      color: '#000',
                    }}
                    onClick={() => {
                      setCoin(token);
                      setFilteredTokens(allToken);
                      setKeyword(null);
                      setOpen(false);
                    }}
                  >
                    {!token.image ? (
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
                        {' '}
                        {token.name.split('')[0]}
                      </div>
                    ) : (
                      <img
                        style={{
                          width: '29px',
                          marginRight: '15px',
                        }}
                        src={token.image}
                        alt=""
                      />
                    )}

                    <p>
                      <span style={{ fontSize: '17px' }} className="noAddress">
                        {token.name}{' '}
                      </span>
                      <span
                        className="noAddress"
                        style={{
                          fontSize: '11px',
                          color: '#6e737e',
                          marginLeft: '5px',
                        }}
                      ></span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p
                className="noAddress"
                style={{
                  marginTop: '50%',
                  fontWeight: 'bold',
                  fontSize: '15px',
                }}
              >
                {loading ? 'Loading...' : 'No assets found'}
              </p>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default TransactionFilter;
