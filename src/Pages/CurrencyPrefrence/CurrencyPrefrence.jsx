import React, { useEffect, useState } from 'react';
import BSC from '../../Assets/Coins/BSC.png';
import Unitedstate from '../../Assets/cuntry/unitedstate.svg';
import './CurrencyPrefrence.scss';
import Newzealand from '../../Assets/cuntry/newzealand.svg';
import Europe from '../../Assets/cuntry/europe.svg';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import { WalletHelper } from '../../helpers/wallet.helper';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { server } from '../../server';
function CurrencyPrefrence() {
  const navigate = useNavigate();
  const { currency, account } = useSelector((state) => state);

  console.log('account::', account);
  const [data, setData] = useState([]);

  const init = async () => {
    store.dispatch(setLoading(true));
    const response = await server.get(
      'https://REDACTED/dev/api/v1/wallet/get_fiat_currencies',
      {
        headers: {
          Authorization: account.jwtToken,
        },
      }
    );
    const data = response.data.data;

    const final = data.map((el) => {
      return {
        img: Unitedstate,
        currency: el.name,
        name: el.short_code,
        symbol: el.symbol,
      };
    });

    // Sort the 'final' array alphabetically by the 'name' property
    const sortedFinal = final.sort((a, b) => a.name.localeCompare(b.name));

    setData(sortedFinal);
    store.dispatch(setLoading(false));
  };

  useEffect(() => {
    init();
  }, []);

  const { state } = useLocation();

  return (
    <>
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={state ? (state.backTo ? '/wallet' : '/setting') : '/setting'}
          title={'Currency Preference'}
        />
        <div className={`flexedContent`}>
          <div className='listItems'>
            <ul>
              {data.map((data) => (
                <li
                  className='currency_click'
                  onClick={async () => {
                    await WalletHelper.setCurrencyPreference({
                      name: data.name,
                      symbol: data.symbol,
                    });
                    navigate('/wallet');
                  }}
                >
                  <div>
                    {/* <div
                      style={{
                        alignItems: "center",
                        backgroundColor: "rgba(98,126,234,.2)",
                        borderRadius: "49%",
                        display: "flex",
                        height: "40px",
                        justifyContent: "center",
                        width: "40px",
                      }}
                      onClick={async () => {
                        await WalletHelper.setCurrencyPreference({
                          name: data.name,
                          symbol: data.symbol,
                        });
                        navigate("/wallet");
                      }}
                    >
                      {" "}
                      {data.name.split("")[0]}
                    </div> */}
                    <p>
                      {data.name} - {data.currency}
                    </p>
                  </div>{' '}
                  <p>{data.name === currency.name ? '(Default)' : ''}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default CurrencyPrefrence;
