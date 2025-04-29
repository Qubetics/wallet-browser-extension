/* global chrome */
import React, { useEffect, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { message } from 'antd';
import InputFieldSimple from '../../Components/InputField/InputFieldSimple';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import SecretPhrase from './SecretPhrase';
import ConfirmSecretPhrase from './ConfirmSecretPhrase';
import CongratulationsScreen from './CongratulationsScreen';
import SecretPhrasePaste from './SecretPhrasePaste';
import TickIcon from '../../Assets/TickIcon.svg';
import BorderedRoundIcon from '../../Assets/BorderedRoundIcon.svg';
import { WalletHelper } from '../../helpers/wallet.helper';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { DURATION } from '../../config/message.config';
import './Welcome.scss';


// ----- Utility Functions -----
function validatePassword(password) {
  const errors = {
    length: password.length < 8,
    uppercase: !/[A-Z]/.test(password),
    digit: !/[0-9]/.test(password),
    symbol: !/[!@#$%^&*]/.test(password),
  };

  return {
    valid: !Object.values(errors).some(Boolean),
    errors,
  };
}


// ----- Main Component -----
function SetPasswordScreen() {
  const { state } = useLocation();
  const { layoutHeader } = useOutletContext();
  const { create } = useSelector((state) => state);
  const { type, createWalletMnemonics, createShuffledMnemonics } = state || {};

  const [activeTab, setActiveTab] = useState(
    state?.addNew
      ? 'secretPhrase'
      : state?.addNewImport
        ? 'confirmSecretPhrase'
        : create
          ? type === 'create'
            ? 'secretPhrase'
            : 'confirmSecretPhrase'
          : 'setPassword'
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validation, setValidation] = useState(validatePassword(''));

  const [mnemonics, setMnemonics] = useState(createWalletMnemonics || '');
  const [shuffledMnemonics, setShuffledMnemonics] = useState(createShuffledMnemonics || []);

  const [correct, setCorrect] = useState(false);
  const [terms, setTerms] = useState(false);
  const [getMnemonicsData, setGetMnemonicsData] = useState(null);

  const [isShare, setIsShare] = useState(false);
  const [isSupport, setIsSupport] = useState(false);

  const [messageApi, contextHolder] = message.useMessage({ duration: DURATION });

  // ----- Validations UI -----
  const validations = [
    { text: '8 or more characters', key: 'length' },
    { text: 'At least one upper case character', key: 'uppercase' },
    { text: 'At least one digit', key: 'digit' },
    { text: 'At least one symbol', key: 'symbol' },
  ].map(item => ({
    ...item,
    icon: validation.errors[item.key] ? BorderedRoundIcon : TickIcon,
  }));

  // ----- Effects -----
  useEffect(() => {
    if (activeTab === 'congrats') {
      chrome.storage.local.set({ legalPolicy: false });
    }
  }, [activeTab]);

  // ----- Handlers -----
  const handlePasswordChange = (value) => {
    if (value.length <= 25) {
      setPassword(value);
      setValidation(validatePassword(value));
    }
  };

  const popError = (error) => {
    messageApi.error(error);
  };

  const handleProceed = async () => {
    if (confirmPassword !== password) return popError('Passwords do not match.');
    if (!validation.valid) return popError('Please meet all password criteria.');

    if (type === 'create') {
      if (state?.addNew) {
        setMnemonics(createWalletMnemonics);
        setShuffledMnemonics(
          createWalletMnemonics.split(' ').sort(() => Math.random() - 0.5)
        );
      } else {
        const mnemonics = await WalletHelper.getMnemonicsByPassword(password);
        setMnemonics(mnemonics);
        setShuffledMnemonics(
          mnemonics.split(' ').sort(() => Math.random() - 0.5)
        );
      }
      setActiveTab('secretPhrase');
    } else {
      setActiveTab('confirmSecretPhrase');
    }
  };

  const handleConfirmSecretPhrase = async () => {
    try {
      if (correct) {
        store.dispatch(setLoading(true));
        const { name } = await chrome.storage.session.get('name');

        await WalletHelper.generateAndSetWallet(
          mnemonics,
          name,
          'CREATE',
          password
        );

        store.dispatch(setLoading(false));
        setActiveTab('congrats');
      } else {
        store.dispatch(setLoading(false));
        popError('Please check the phrase order and try again.');
      }
    } catch (error) {
      console.error('Error Confirm Secret Phrase:', error);
      store.dispatch(setLoading(false));
    }
  };

  const handleImportSecretPhrase = async () => {
    console.log('HANDLE IMPORT PHRASE')
    try {
      if (!terms) return popError('Please accept the terms and conditions.');
      if (!getMnemonicsData) return popError('Please enter mnemonics.');

      const isValid = WalletHelper.checkMnemonics(getMnemonicsData.trim());
      const { accounts } = await chrome.storage.session.get('accounts');

      if (accounts && await WalletHelper.isAccountExistWithMnemonics(getMnemonicsData.trim(), password)) {
        return popError('Mnemonics already exist.');
      }

      if (isValid) {
        const { name } = await chrome.storage.session.get('name');
        store.dispatch(setLoading(true));

        await WalletHelper.generateAndSetWallet(
          getMnemonicsData.trim(),
          name,
          'IMPORT',
          password
        );

        messageApi.success('Wallet imported successfully.');
        setActiveTab('congrats');
      } else {
        store.dispatch(setLoading(false));
        popError('Invalid mnemonics. Please try again.');
      }

      store.dispatch(setLoading(false));
    } catch (error) {
      store.dispatch(setLoading(false));
      popError(error || 'An error occurred. Please try again.');
    }
  };

  // ----- UI Rendering -----
  return (
    <div className="cardWhite setPassword">
      {contextHolder}

      {/* Tabs */}
      {activeTab !== 'congrats' && (
        <div className="setPassword__tabs">
          {!create && (
            <div className={`setPassword__tabs__itself ${activeTab === 'setPassword' ? 'setPassword__tabs__itself_active' : ''}`} />
          )}
          {type === 'create' && (
            <div className={`setPassword__tabs__itself ${activeTab === 'secretPhrase' ? 'setPassword__tabs__itself_active' : ''}`} />
          )}
          <div className={`setPassword__tabs__itself ${activeTab === 'confirmSecretPhrase' ? 'setPassword__tabs__itself_active' : ''}`} />
        </div>
      )}

      <div className={activeTab === 'congrats' ? 'congrates-item' : ''}>
        {layoutHeader}
      </div>

      {/* Heading and Description */}
      <h3 className="setPassword__heading">
        {type === 'create' &&
          (activeTab === 'setPassword'
            ? 'Create Password'
            : activeTab === 'secretPhrase'
              ? 'Write Down Your Seed Phrase'
              : activeTab === 'confirmSecretPhrase'
                ? 'Enter Your Seed Phrase'
                : '')}
      </h3>

      <p className="welcomeScreens-text" style={{ marginTop: '10px', textAlign: 'left' }}>
        {type === 'create' &&
          (activeTab === 'setPassword'
            ? ''
            : activeTab === 'secretPhrase'
              ? "This is your seed phrase. Write it down on a paper and keep it in a safe place. You'll be asked to re-enter this phrase (in order) on the next step."
              : activeTab === 'confirmSecretPhrase'
                ? 'Tap the words to put them next to each other in the correct order.'
                : '')}
      </p>

      {/* Content Area */}
      {activeTab === 'setPassword' && (!state?.addNew || !state?.addNewImport) && (
        <div>
          <InputFieldSimple
            placeholder="Enter Password"
            getData={handlePasswordChange}
            value={password}
            label="Password"
          />

          <div className="setPassword__validations">
            {validations.map((item, index) => (
              <p key={index}>
                <img src={item.icon} alt="validation icon" />
                {item.text}
              </p>
            ))}
          </div>

          <InputFieldSimple
            placeholder="Confirm Password"
            getData={(e) => {
              if (e?.length <= 25) setConfirmPassword(e);
            }}
            value={confirmPassword}
            label="Confirm Password"
          />

          <div className="setPassword__footerbuttons">
            <ButtonComp onClick={handleProceed} text="Proceed" maxWidth="100%" />
          </div>
        </div>
      )}

      {activeTab === 'secretPhrase' && (
        <SecretPhrase
          mnemonics={mnemonics}
          termsCheck={setTerms}
          isShare={isShare}
          setIsShare={setIsShare}
          isSupport={isSupport}
          setIsSupport={setIsSupport}
        >
          <div className="setPassword__footerbuttons">
            <ButtonComp
              disabled={!isShare || !isSupport}
              onClick={() => (isShare && isSupport) && setActiveTab('confirmSecretPhrase')}
              text="Continue"
              maxWidth="100%"
            />
          </div>
        </SecretPhrase>
      )}

      {activeTab === 'confirmSecretPhrase' && (
        type === 'create' ? (
          <ConfirmSecretPhrase
            mnemonics={mnemonics}
            shuffledMnemonics={shuffledMnemonics}
            checkIfCorrect={setCorrect}
          >
            <div className="setPassword__footerbuttons">
              <ButtonComp onClick={handleConfirmSecretPhrase} text="Proceed" maxWidth="100%" />
            </div>
          </ConfirmSecretPhrase>
        ) : (
          <SecretPhrasePaste
            termsCheck={setTerms}
            getMnemonics={setGetMnemonicsData}
          >
            <div className="setPassword__footerbuttons">
              <ButtonComp onClick={handleImportSecretPhrase} text="Continue" maxWidth="100%" />
            </div>
          </SecretPhrasePaste>
        )
      )}

      {activeTab === 'congrats' && (
        <CongratulationsScreen />
      )}
    </div>
  );
}

export default SetPasswordScreen;

