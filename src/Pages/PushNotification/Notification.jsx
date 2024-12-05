import { Switch } from "antd";
import React from "react";
import "./Notification.scss";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";

function Notification() {
  const onChange = (checked) => {
    console.log(`switch to ${checked}`);
  };
  return (
    <div className={`scrollableCont`}>
      <MenuRestofHeaders backTo={true} title={"Push Notification"} />
      <div className={`flexedContent`}>
        <div className="pushNotification">
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
        </div>
      </div>
    </div>
  );
}

export default Notification;
