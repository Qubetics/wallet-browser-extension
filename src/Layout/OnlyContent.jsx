/*global chrome*/
import { Layout } from 'antd';
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import useCurrentHeight from '../CustomHooks/useCurrentHeight';
// import style from "./style.module.scss";

function OnlyContent() {
  const { Content } = Layout;
  const height = useCurrentHeight();

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const getSidePanelStatus = async () => {
    const isSidePanelOpen = await chrome.storage.local.get('openSidePanel');
    setIsSidePanelOpen(isSidePanelOpen.openSidePanel);
  };

  useEffect(() => {
    getSidePanelStatus();
  }, [isSidePanelOpen]);

  return (
    <div className='fixedLayout'>
      <div
        className={`${'fixedLayout__inner'} ${
          height <= 600 ? 'fixedLayout__heightExt' : ''
        }`}
        style={
          !isSidePanelOpen
            ? {
                maxHeight: '746px',
                maxWidth: '400px',
              }
            : {
                maxWidth: '600px',
              }
        }
      >
        <Content className='fixedLayout__content fixedLayout__content__paddingX'>
          <Outlet />
        </Content>
      </div>
    </div>
  );
}

export default OnlyContent;
