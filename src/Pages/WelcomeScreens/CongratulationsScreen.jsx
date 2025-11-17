/* global chrome */
import React from 'react';
import './Welcome.scss';
import Lottie from 'react-lottie-player';
import TickAnimation from '../../Assets/JsonFiles/TickAnimation.json';
import CongratulationsImport from '../../Assets/JsonFiles/Congratulations_import.json';

import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { useNavigate } from 'react-router-dom';
function CongratulationsScreen({ type }) {
  const navigate = useNavigate();
  return (
    <div className="setPassword__secretPharse walletReady">
      <Lottie
        loop={false}
        animationData={
          type === 'import' ? CongratulationsImport : TickAnimation
        }
        play
      />
      <ButtonComp
        text={'Continue'}
        maxWidth={'100%'}
        onClick={async () => {
          // Clean up the flow type from session storage
          await chrome.storage.session.remove('walletFlowType');
          navigate('/wallet');
        }}
      />
    </div>
  );
}

export default CongratulationsScreen;
