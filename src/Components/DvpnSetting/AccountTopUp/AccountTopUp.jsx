import React, { useState } from "react";
import "./AccountTopUp.scss";
import MenuRestofHeaders from "../../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import SmallLogo from "../../../Assets/DarkLogo.svg";
import ButtonComp from "../../ButtonComp/ButtonComp";
import ModalCustom from "../../ModalCustom/ModalCustom";
import { useNavigate } from "react-router-dom";
import { Drawer } from "antd";
import ModalCloseIcon from "../../../Assets/ModalCloseIcon.svg";
function AccountTopUp() {
  const [selectedPackage, setSelectedPackage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const creditPackages = [
    {
      id: 1,
      credits: 5000,
      price: 1400,
    },
    {
      id: 2,
      credits: 10000,
      price: 2900,
    },
    {
      id: 3,
      credits: 15000,
      price: 4900,
    },
  ];

  const handlePackageSelect = (packageId) => {
    setSelectedPackage(packageId);
  };

  const handleBuyNow = () => {
    if (selectedPackage) {
      const selected = creditPackages.find((pkg) => pkg.id === selectedPackage);
      console.log("Purchasing package:", selected);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleGoToHome = () => {
    setIsModalOpen(false);
    navigate("/");
  };

  return (
    <div className={`scrollableCont`} style={{ hight: "auto" }}>
      <div className="searchBarFixed">
        <MenuRestofHeaders title={"Account Top-Up"} backTo={"/dvpnSetting"} />
      </div>
      <div className="account-topup">
        <div className="topup-header">
          <h2>Get Some Credits</h2>
          <p>
            Purchase Credits and spend them on fast, secure & decentralized VPN
            service within Sentinel Blockchain.
          </p>
        </div>

        <div className="credit-packages">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`credit-package ${
                selectedPackage === pkg.id ? "selected" : ""
              } `}
              onClick={() => handlePackageSelect(pkg.id)}
            >
              <div className="package-icon">
                <div className="coin-icon">
                  <img src={SmallLogo} alt="" />
                </div>
              </div>

              <div className="package-details">
                <div className="credits-amount">
                  <h4>{pkg.credits.toLocaleString()} Credits</h4>
                </div>
                <div className="price">
                  <h2>{pkg.price.toLocaleString()}</h2>
                  <span className="currency"> tics</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ButtonComp
          text={"Buy Now"}
          maxWidth={"100%"}
          onClick={handleBuyNow}
          disabled={!selectedPackage}
          className={`buy-now-btn ${selectedPackage ? "enabled" : "disabled"}`}
        />

        <div className="purchase-info">
          <p>
            {selectedPackage && (
              <span>
                You're purchasing{" "}
                {creditPackages
                  .find((pkg) => pkg.id === selectedPackage)
                  ?.credits.toLocaleString()}{" "}
                credits for{" "}
                {creditPackages
                  .find((pkg) => pkg.id === selectedPackage)
                  ?.price.toLocaleString()}
              </span>
            )}
          </p>
          <p>
            Payment will be charged to your iTunes Account. This credits are for
            decentralized VPN services only. By proceeding, you accept our{" "}
            <button
              type="button"
              className="link"
              onClick={() => console.log("Open Terms of Service")}
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              className="link"
              onClick={() => console.log("Open Privacy Policy")}
            >
              Privacy Policy
            </button>
            .
          </p>
        </div>
      </div>

      <Drawer
        // title="Select Token"
        placement="bottom"
        onClose={() => {
          setIsModalOpen(false);
        }}
        open={isModalOpen}
        closeIcon={<img src={ModalCloseIcon} alt="Close" />}
        height={460}
      >
        <div className="purchase-success-content">
          <div className="success-icon">
          <img
            src={require("../../../Assets/GreenCheck.gif")}
            style={{
              width: "200px",
            }}
            alt=""
          />
          </div>

          <h2>Purchase Successful!</h2>

          <div className="credit-info">
            <p className="credit-plan">
              <strong>Credit Plan:</strong> Premium{" "}
              {
                creditPackages.find((pkg) => pkg.id === selectedPackage)
                  ?.credits
              }{" "}
              Credits
            </p>
            <p className="purchase-details">
              You have successfully purchased{" "}
              {
                creditPackages.find((pkg) => pkg.id === selectedPackage)
                  ?.credits
              }{" "}
              credits for{" "}
              {creditPackages.find((pkg) => pkg.id === selectedPackage)?.price}{" "}
              tics. Enjoy your premium features!
            </p>
          </div>

          <ButtonComp
            text="Go to Home"
            maxWidth="100%"
          />
        </div>
      </Drawer>
    </div>
  );
}

export default AccountTopUp;
