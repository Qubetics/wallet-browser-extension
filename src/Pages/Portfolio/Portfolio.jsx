import { useState } from "react";
import MenuRestofHeaders from "../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders";
import AllocationChart from "./AllocationChart"
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import PortfolioWatchList from "./PortfolioWatchList";


export const Portfolio = () => {
    const [sel, setSel] = useState(0);

    return (
        <div className={`scrollableCont`}>
          
            <MenuRestofHeaders title={'Swap'} />
            <div className={`flexedContent`}>
                <Tabs selectedIndex={sel}>
                    <TabList
                        className='swapTabList'
                        style={{
                            border: 'none',
                            borderRadius: '30px',
                            display: 'flex',
                            justifyContent: 'space-evenly',
                            listStyle: 'none',
                        }}
                    >
                        <Tab
                            className='swapTab'
                            onClick={() => { 
                                setSel(0);
                            }}
                            style={{
                                backgroundColor: sel === 0 ? '#4096ff' : 'transparent',
                                // color: sel === 0 ? "#fff" : "#fff",
                                borderRadius: '30px',
                                padding: '16px 30px',
                                fontSize: '13px',
                                flex: 1,
                                borderColor: '#4096ff',
                                fontWeight: '700',
                            }}
                        >
                            Wallet Stats
                        </Tab>
                        <Tab
                            className='swapTab' 
                            onClick={() => {
                                setSel(1);
                            }}
                            style={{
                                backgroundColor: sel === 1 ? '#4096ff' : 'transparent',
                                // color: sel === 1 ? "#fff" : "#fff",
                                borderRadius: '30px',
                                padding: '16px 30px',
                                fontSize: '13px',
                                flex: 1,
                                borderColor: '#4096ff',
                                fontWeight: '700',
                            }}
                        >
                            Watchlist
                        </Tab>
                    </TabList>

                    <TabPanel>
                        <AllocationChart />
                    </TabPanel>
                    <TabPanel>
                         <div><PortfolioWatchList /></div>
                    </TabPanel>
                </Tabs>
            </div>
        </div>
    )
}