/*global chrome*/
import { Layout } from 'antd';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import NftFixes from '../Assets/backg.svg';
import useCurrentHeight from '../CustomHooks/useCurrentHeight';
import BackArrowIcon from '../Assets/BackArrowIcon.svg';
import { useSelector } from 'react-redux';

function NftLayout() {
  const { Content } = Layout;
  const height = useCurrentHeight();
  const { image, nftBackData } = useSelector((state) => state);

  const getLocation = useLocation();
  const path = getLocation.pathname.replace('/', '');

  const navigate = useNavigate();

  //in your component
  function addDefaultSrc(ev) {
    ev.target.src = NftFixes;
  }

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
        style={!isSidePanelOpen ? {
          maxHeight: "746px",
          maxWidth: "400px"
        }: {
               maxWidth: "600px"
        }}
      >
        <div className='nftImgFixed'>
          {image ? (
            <img src={image} onError={addDefaultSrc} className='nftImg' />
          ) : (
            <img src={NftFixes} className='nftImg' />
          )}
          <img
            src={BackArrowIcon}
            className='backImg'
            alt='""'
            onClick={() => {
              if (path === 'nftDetail') {
                return navigate('/wallet', {
                  state: {
                    showNftTrue: true,
                  },
                });
              }

              if (path === 'nftAddress') {
                return navigate('/nftDetail', {
                  state: nftBackData,
                });
              }

              if (path === 'nftConfirm') {
                return navigate('/nftAddress', {
                  state: nftBackData,
                });
              }
            }}
          />
        </div>
        <Content className='fixedLayout__content '>
          <Outlet />
        </Content>
      </div>
    </div>
  );
}

export default NftLayout;
