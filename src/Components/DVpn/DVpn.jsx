import React from "react";
import "./DVpn.scss";
import {
  CrownIcon,
  GreenSwitchIcon,
  ReconnectIcon,
  WalletBlueIcon,
} from "../../Assets/SvgImg";
import USA from "../../Assets/cuntry/usa.svg";
import Germany from "../../Assets/cuntry/germany.svg";
import Japan from "../../Assets/cuntry/japan.svg";
import useCurrentHeight from "../../CustomHooks/useCurrentHeight";

function DVpn() {
  const height = useCurrentHeight();
  return (
    <div className={`${'vpn-dashboard'} ${
      height <= 600 ? 'heightExt' : ''
    }`}>
      <div className="header">
        <h2>Qubetics dVPN</h2>
        <span>
          <CrownIcon />
        </span>
      </div>
      <div className="status-bar">
        <button className="status disconnected">Disconnected</button>
        <p className="days-left">
          <WalletBlueIcon /> <span>11</span> Days left!
        </p>
      </div>
      <div className="quick-connect-section">
        <div className="switch">
          <GreenSwitchIcon />
        </div>
        <h3>Quick Connect</h3>
      </div>

      <div className="credit-bar">
        <div className="bar">
          <div className="fill" style={{ width: "35%" }}></div>
        </div>
        <div className="credit-label">
          <span className="right">100 Credit</span>
          <span className="left">35 Credit Left!</span>
        </div>
      </div>

      <div className="country-list">
        <h3>Country List</h3>
        <div className="countryInner">
          <div className="country">
            {" "}
            <img src={USA} alt="usa" />
            USA
          </div>
          <div className="country">
            {" "}
            <img src={Germany} alt="germany" />
            Germany
          </div>
          <div className="country">
            {" "}
            <img src={Japan} alt="japan" />
            Japan
          </div>
        </div>
      </div>
      <div className="recent-sessions">
        <div className="recent-title">
          <h3>Recent Sessions</h3>
          <span className="view-all">View all</span>
        </div>
        <div className="mutliSession">
          <div className="session">
            <div className="session-inner">
              <div className="session-info">
                <div className="flag">
                  <img src={USA} alt="usa" />
                </div>
                <div className="location-time">
                  <h5>USA - New York</h5>
                  <p>May 16, 2025 - 10:25 AM</p>
                </div>
              </div>
              <div className="duration">45m 12s</div>
            </div>
            <button className="reconnect-btn">
              <ReconnectIcon />
              Reconnect
            </button>
          </div>
          <div className="session">
            <div className="session-inner">
              <div className="session-info">
                <div className="flag">
                  <img src={USA} alt="usa" />
                </div>
                <div className="location-time">
                  <h5>USA - New York</h5>
                  <p>May 16, 2025 - 10:25 AM</p>
                </div>
              </div>
              <div className="duration">45m 12s</div>
            </div>
            <button className="reconnect-btn">
              <ReconnectIcon />
              Reconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DVpn;
