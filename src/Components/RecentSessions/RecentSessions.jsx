import React from "react";
import "./RecentSessions.scss";
import MenuRestofHeaders from "../BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import USA from "../../Assets/cuntry/usa.svg";
import { ReconnectIcon, UploadedIcon } from "../../Assets/SvgImg";
import useCurrentHeight from "../../CustomHooks/useCurrentHeight";
function RecentSessions() {
  const height = useCurrentHeight();
  return (
    <div className={`scrollableCont`} style={{height:"auto"}}>
      <MenuRestofHeaders title={"Recent Sessions"} backTo={"/dvpn"} />
      <div className={`${'session-wrapper'} ${
      height <= 600 ? 'heightExtSessionWrapper' : ''
    }`}>
        <div className="session-card">
          <div className="session-header">
            <div className="location">
              <span className="flag">
                <img src={USA} alt="USA" />
              </span>
              <div className="location-info">
                <h3>USA – New York</h3>
                <p>May 16, 2025 • 10:25 AM</p>
              </div>
            </div>
            <div className="duration">
              <p> 45m 12s</p>
            </div>
          </div>

          <div className="divider" />

          <div className="speed-section">
            <div className="speed">
              <div className="icon">
                <UploadedIcon/>
              </div>
              <div>
                <div className="value">
                  <h3>29,3 Mb/s</h3>
                </div>
                <div className="label">
                  <p>Downloaded</p>
                </div>
              </div>
            </div>
            <div className="divider-vertical" />
            <div className="speed">
              <div className="icon">
                <UploadedIcon/>
              </div>
              <div>
                <div className="value">
                  <h3>29,3 Mb/s</h3>
                </div>
                <div className="label">
                  <p>Downloaded</p>
                </div>
              </div>
            </div>
          </div>

          <button className="reconnect-btn">
            <ReconnectIcon /> Reconnect
          </button>
        </div>
        <div className="session-card">
          <div className="session-header">
            <div className="location">
              <span className="flag">
                <img src={USA} alt="USA" />
              </span>
              <div className="location-info">
                <h3>USA – New York</h3>
                <p>May 16, 2025 • 10:25 AM</p>
              </div>
            </div>
            <div className="duration">
              <p> 45m 12s</p>
            </div>
          </div>

          <div className="divider" />

          <div className="speed-section">
            <div className="speed">
              <div className="icon">
                <UploadedIcon/>
              </div>
              <div>
                <div className="value">
                  <h3>29,3 Mb/s</h3>
                </div>
                <div className="label">
                  <p>Downloaded</p>
                </div>
              </div>
            </div>
            <div className="divider-vertical" />
            <div className="speed">
              <div className="icon">
                <UploadedIcon/>
              </div>
              <div>
                <div className="value">
                  <h3>29,3 Mb/s</h3>
                </div>
                <div className="label">
                  <p>Downloaded</p>
                </div>
              </div>
            </div>
          </div>

          <button className="reconnect-btn">
            <ReconnectIcon /> Reconnect
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecentSessions;
