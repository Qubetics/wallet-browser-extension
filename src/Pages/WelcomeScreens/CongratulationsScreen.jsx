import React from 'react';
import './Welcome.scss';
import Lottie from 'react-lottie-player';
import TickAnimation from '../../Assets/JsonFiles/TickAnimation.json';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { useNavigate } from 'react-router-dom';
function CongratulationsScreen() {
  const navigate = useNavigate();
  return (
    <div className="setPassword__secretPharse walletReady">
      <Lottie
        loop={false}
        animationData={TickAnimation}
        play
        style={{ height: 308 }}
      />
      <ButtonComp
        text={'Continue'}
        maxWidth={'100%'}
        onClick={() => {
          navigate('/wallet');
        }}
      />
    </div>
  );
}

export default CongratulationsScreen;
