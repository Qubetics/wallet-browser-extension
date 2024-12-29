import { useEffect, useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import AllocationChart from "./AllocationChart";
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";
import PortfolioWatchList from "./PortfolioWatchList";
import { useLocation } from "react-router-dom";

export const Portfolio = () => {
  const [sel, setSel] = useState(0);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.activeTab === 1) {
      const tab = location.state.activeTab;
      setSel(tab);
    }
  }, [location.state]);

  return (
    <div className={`scrollableCont`}>
      <MenuRestofHeaders
        title={"Portfolio"}
        backTo={"/wallet"}
        // portfolio={true}
      />
      <div className={``}>
        <Tabs selectedIndex={sel}>
          <TabList
            className="buysellTabList"
            style={{
              display: "flex",
              justifyContent: "space-evenly",
              listStyle: "none",
              margin: "0 24px",
            }}
          >
            <Tab
              className="buysellTab"
              onClick={() => {
                setSel(0);
              }}
              style={{
                fontSize: "13px",
                flex: 1,
                fontWeight: "700",
              }}
            >
              Wallet Stats
            </Tab>
            <Tab
              className="buysellTab"
              onClick={() => {
                setSel(1);
              }}
              style={{
                fontSize: "13px",
                flex: 1,
                fontWeight: "700",
              }}
            >
              Watchlist
            </Tab>
          </TabList>

          <TabPanel>
            <div className={`flexedContent`}>
              <AllocationChart />
            </div>
          </TabPanel>
          <TabPanel>
            <div className={`flexedContent`}>
              <PortfolioWatchList />
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
};
