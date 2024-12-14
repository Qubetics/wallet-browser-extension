import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Welcome.scss";
import PrivacyPolicy from "../../Assets/PrivacyPolicy.svg";
import TermsOfService from "../../Assets/TermsOfService.svg";
import rightImg from "../../Assets/rightImg.svg";
import { useOutletContext } from "react-router-dom";
import Checkbox from "antd/es/checkbox/Checkbox";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
function TermsPolicy() {
  const { layoutHeader } = useOutletContext();
  const navigate = useNavigate();
  const termsData = [
    {
      id: 1,
      image: PrivacyPolicy,
      title: "Privacy Policy",
      rightImage: rightImg,
    },
    {
      id: 2,
      image: TermsOfService,
      title: "Terms of Service",
      rightImage: rightImg,
    },
  ];

  return (
    <div className="cardWhite termsPolicy">
      <div>
        {layoutHeader}
        <div className="termsPolicy_contect">
          {termsData.map((item) => (
            <div className="termsPolicy_contect_card" key={item.id}>
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
          <Checkbox>
            <p style={{ marginLeft: "22px" }}>
              I accepted the <Link>Terms of Service</Link> &
              <Link> Privacy Policy</Link>
            </p>
          </Checkbox>
        </div>
        <ButtonComp
          onClick={(e) => {
            e.preventDefault();
            navigate("/createNewWallet", {
              state: { type: "create" },
            });
          }}
          text={"Continue"}
          maxWidth={"100%"}
        />
      </div>
    </div>
  );
}

export default TermsPolicy;
