/*global chrome*/
import React, { useEffect, useState } from "react";
import "./NetworkPreference.scss";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import { useNavigate } from "react-router-dom";
import ticketcheck1 from "../../Assets/ArrowRightIcon.svg";
import { useSelector } from "react-redux";

function WatchOnlyList() {
  const { account } = useSelector((state) => state);

  const [data, setData] = useState([]);
  const navigate = useNavigate();

  const init = async () => {
    const { chains } = await chrome.storage.local.get("chains");
    setData(
      chains.filter((el) => {
        const checkIfAlreadyMade = account.coinFamilies.find(
          (family) => el.coinFamily == family
        );

        if (!checkIfAlreadyMade) {
          return el;
        }
      })
    );
  };

  useEffect(() => {
    init();
  });

  return (
    <>
      <div className={`scrollableCont`}>
        <MenuRestofHeaders
          backTo={"/wallet"}
          title={"Watch-Only Wallets"}
          watch={true}
        />
        <div className={`flexedContent`}>
          <div className='listItems'>
            <ul>
              {data
                .filter((el) => !el.testnet)
                .map((data) => (
                  <li
                    className='currency_click'
                    onClick={() => {
                      navigate("/new-address-watch-only", {
                        state: {
                          chain: data,
                        },
                      });
                    }}
                  >
                    <div>
                      <img
                        src={data.image}
                        alt=''
                        onClick={() => {
                          navigate("/new-address-watch-only", {
                            state: {
                              chain: data,
                            },
                          });
                        }}
                      />
                      <p
                        onClick={() => {
                          navigate("/new-address-watch-only", {
                            state: {
                              chain: data,
                            },
                          });
                        }}
                      >
                        {data.chainName}
                      </p>
                    </div>{" "}
                    <div>{/* <img src={ticketcheck1} /> */}</div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default WatchOnlyList;
