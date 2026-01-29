import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Person from "../../Assets/address-book-svgrepo-com.svg";
import "./AddressTable.scss";

function AddressTable({ dataArray, setAddress, setContact }) {
  // console.log("AddressTable ", dataArray);
  return (
    <>
      {dataArray.map((ele, index) => (
        <div
          className="coinsTable"
          key={index}
          style={{
            cursor: "pointer",
          }}
          onClick={() => {
            setAddress(ele.address, ele.name);
          }}
        >
          <div className="coinsTable__left">
            <div className="coinsTable__left__icon">
              <img src={Person} className="detailIcon" />
            </div>
            <div className="coinsTable__left__textSec">
              <div
                onClick={() => {}}
                className="coinsTable__textTop"
                style={{ cursor: "pointer" }}
              >
                {ele.name}
              </div>
            </div>
          </div>
          <div className="coinsTable__right">
            <div className="coinsTable__textTop">{ele.currCryptoBal}</div>
            <div
              className="coinsTable__grayText12"
              style={{ justifyContent: "flex-end" }}
            >
              {`${ele.address.substring(0, 5)}.....
                  ${ele.address.substring(
                    ele.address.length - 5,
                    ele.address.length
                  )}`}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default AddressTable;
