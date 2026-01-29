import React, { useState } from "react";
import DownArrowSuffix from "../../Assets/DownArrowSuffix.svg";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Person from "../../Assets/person-button-svgrepo-com.svg";
import "./AddressTable.scss";
import { capitalizeWords } from "../../helpers/common.helper";

function AddressTableSend({ dataArray, setAddress, setContact }) {
  const [viewAddress, setViewAddress] = useState(false);
  const [bookName, setBookName] = useState(null);
  // console.log("AddressTable ", dataArray);
  return (
    <>
      {dataArray.map((ele, index) => (
        <div
          className="coinsTable"
          key={index}
          style={{
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "initial",
          }}
        >
          <div className="adressCard">
            <div className="addressBook">
              <div className="bookAddress">
                <div className="leftSec">
                  <h6> {ele?.name?.charAt(0).toUpperCase()}</h6>
                  <div>
                    <h3>{capitalizeWords(ele?.name)} </h3>
                    {/* <span className="address">
                                            {ele?.address.substring(0, 7)}.....
                                            {ele?.address.substring(
                                                ele?.address.length - 7,
                                                ele?.address.length
                                            )}
                                        </span> */}
                  </div>
                </div>
                <div className="rytSec">
                  <span
                    onClick={() => {
                      setBookName((prevBookName) =>
                        prevBookName === ele?.name ? null : ele?.name
                      );
                      setViewAddress(!viewAddress);
                    }}
                  >
                    <img
                      className={bookName==ele?.name ? "rotateItem" : "noRotate"}
                      style={{ cursor: "pointer" }}
                      src={DownArrowSuffix}
                      alt="DownArrowSuffix"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
          {bookName == ele?.name && (
            <div className="valueAddress adressCard">
              {Array.isArray(ele?.wallet_data) &&
                ele?.wallet_data.map((elem, idx) => (
                  <div
                    key={idx}
                    className="bookAddress"
                    onClick={() => {
                      setAddress(elem?.wallet_address, ele.name);
                    }}
                  >
                    <div className="leftSecBottom">
                      <img
                        style={{ height: 36 }}
                        src={elem?.coin_data?.coin_image}
                      />
                      <div className="addressInner">
                        {/* <h3>{ele?.name}</h3> */}
                        <span className="address">
                          {elem?.wallet_address.substring(0, 12)}.....
                          {elem?.wallet_address.substring(
                            elem?.wallet_address.length - 12,
                            elem?.wallet_address.length
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export default AddressTableSend;
