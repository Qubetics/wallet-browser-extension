/* global chrome */
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Welcome.scss";
import PrivacyPolicy from "../../Assets/PrivacyPolicy.svg";
import TermsOfService from "../../Assets/TermsOfService.svg";
import rightImg from "../../Assets/rightImg.svg";
import { useOutletContext } from "react-router-dom";
import Checkbox from "antd/es/checkbox/Checkbox";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { message } from "antd";
function TermsPolicy() {
  const { state } = useLocation(); 
  const [accr, setAccr] = useState(false);
  const [flowType, setFlowType] = useState(state?.type);
  const { layoutHeader } = useOutletContext();
  const navigate = useNavigate();

  useEffect(() => {
    const getFlowType = async () => {
      const { walletFlowType } = await chrome.storage.session.get("walletFlowType");
      if (walletFlowType) {
        setFlowType(walletFlowType);
      }
    };
    if (!state?.type) {
      getFlowType();
    }
  }, [state]);
  const termsData = [
    {
      id: 1,
      image: PrivacyPolicy,
      title: "Privacy Policy",
      rightImage: rightImg,
    },
    // {
    //   id: 2,
    //   image: TermsOfService,
    //   title: "Terms of Service",
    //   rightImage: rightImg,
    // },
  ];

  const [messageApi, contextHolder] = message.useMessage();

  return (
    <div className="cardWhite termsPolicy">

      <div>
        {contextHolder}
        {layoutHeader}
        <div className="termsPolicy_contect">
          {termsData?.map((item) => (
            <div className="termsPolicy_contect_card" key={item.id} onClick={()=> window.open('https://privacy-policy.qubetics.work/','_blank')}>
              <div className="termsPolicy_contect_card_left">
                <img src={item.image} alt={`${item.title} Icon`} />
                <h4>{item.title}</h4>
              </div>
              <span className="termsPolicy_contect_card_right">
                <img src={item.rightImage} alt="Right Arrow" />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className={"checkboxOuter"} style={{ marginBottom: "20px" }}>
          <Checkbox onChange={(e) => setAccr(e.target.checked)}>
            <p>
              I accepted the <Link to={''} onClick={()=> window.open('https://privacy-policy.qubetics.work/','_blank')}> Privacy Policy</Link>
            </p>
          </Checkbox>
        </div>
        <ButtonComp
          onClick={(e) => {
            e.preventDefault();
            if (accr) {
              navigate("/createNewWallet", {
                state: { type: flowType },
              });
            }else{
              messageApi.error('Please accept the privacy policy.')
            }
          }}
          text={"Continue"}
          maxWidth={"100%"}
        />
      </div>
    </div>
  );
}

export default TermsPolicy;
