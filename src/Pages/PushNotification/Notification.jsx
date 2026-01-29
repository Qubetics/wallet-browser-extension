import { Switch } from "antd";
import React from "react";
import "./Notification.scss";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import sendhistry from "../../Assets/sendhistry.svg";
import ReceiveIcon from "../../Assets/ReceiveIcon.svg"
function Notification() {
  const onChange = (checked) => {
    // console.log(`switch to ${checked}`);
  };
  const notifications = [
    {
      id: 1,
      image: sendhistry,
      title: "Deposit of 0.01 ETH has been confirmed",
      date: "Mar 04 2024 | 06:02 PM",
    },
    {
      id: 2,
      image: ReceiveIcon,
      title: "Withdraw of 0.01 ETH  has been confirmed",
      date: "Mar 03 2024 | 04:15 PM",
    },
    // Add more notifications here
  ];
  return (
    <div className={`scrollableCont`}>
      <MenuRestofHeaders backTo={true} title={"Notifications"} />
      <div className={`flexedContent`}>
        {/* <div className="pushNotification">
          <div className="pushNotification__notificationSec">
            <div className="pushNotification__innerNotificationSec">
              <h3>Push Notifications</h3>
              <p>Be the first to learn about our newest features</p>
            </div>
            <Switch defaultChecked onChange={onChange} />
          </div>
          <div className="pushNotification__notificationSec">
            <div className="pushNotification__innerNotificationSec">
              <h3>Sent & Receive</h3>
              <p>You will be notified for sent & received transactions</p>
            </div>
            <Switch defaultChecked onChange={onChange} />
          </div>
          <div className="pushNotification__notificationSec">
            <div className="pushNotification__innerNotificationSec">
              <h3>Product Annoucements</h3>
              <p>Be the first to know about new features</p>
            </div>
            <Switch defaultChecked onChange={onChange} />
          </div>
        </div> */}
        <div className="notifications">
          {notifications.map((notification) => (
            <div key={notification.id} className="notifications_card">
              <div className="notifications_card_inner">
                <img src={notification.image} alt="notification" />
                <div>
                  <h4>{notification.title}</h4>
                  <p>{notification.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Notification;
