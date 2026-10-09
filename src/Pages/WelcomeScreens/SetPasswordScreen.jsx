/* global chrome */
import React, { useEffect, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { message } from 'antd';

// Components
import InputFieldSimple from '../../Components/InputField/InputFieldSimple';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import SecretPhrase from './SecretPhrase';
import ConfirmSecretPhrase from './ConfirmSecretPhrase';
import CongratulationsScreen from './CongratulationsScreen';
import SecretPhrasePaste from './SecretPhrasePaste';

// Assets
import TickIcon from '../../Assets/TickIcon.svg';
import BorderedRoundIcon from '../../Assets/BorderedRoundIcon.svg';

// Helpers
import { WalletHelper } from '../../helpers/wallet.helper';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import { DURATION } from '../../config/message.config';

// Styles
import './Welcome.scss';

// Utility
const validatePassword = (password) => {
  const errors = {
    length: password.length < 8,
    uppercase: !/[A-Z]/.test(password),
    lowercase: !/[a-z]/.test(password),
    digit: !/[0-9]/.test(password),
    symbol: !/[!@#$%^&*]/.test(password),
  };

  return {
    valid: !Object.values(errors).some(Boolean),
    errors,
  };
};

// Main Component
function SetPasswordScreen() {
  const { state } = useLocation();
  const { layoutHeader } = useOutletContext();
  const { create } = useSelector((state) => state);
  const { type: stateType, createWalletMnemonics, createShuffledMnemonics } = state || {};

  // ---------------- State ----------------
  const [activeTab, setActiveTab] = useState(null);
  const [type, setType] = useState(stateType);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validation, setValidation] = useState(validatePassword(''));

  const [mnemonics, setMnemonics] = useState(createWalletMnemonics || '');
  const [shuffledMnemonics, setShuffledMnemonics] = useState(
    createShuffledMnemonics || []
  );
  const [blankArray, setBlankArray] = useState([]);
  const [correct, setCorrect] = useState(false);
  const [terms, setTerms] = useState(false);
  const [getMnemonicsData, setGetMnemonicsData] = useState(null);
  const [isShare, setIsShare] = useState(false);
  const [isSupport, setIsSupport] = useState(false);

  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
  });

  // ---------------- Validations ----------------
  const validations = [
    { text: '8 or more characters', key: 'length' },
    { text: 'At least one upper case character', key: 'uppercase' },
    { text: 'At least one lower case character', key: 'lowercase' },
    { text: 'At least one digit', key: 'digit' },
    { text: 'At least one symbol', key: 'symbol' },
  ].map((item) => ({
    ...item,
    icon: validation.errors[item.key] ? BorderedRoundIcon : TickIcon,
  }));

  // ---------------- Effects ----------------
  useEffect(() => {
    if (activeTab === 'congrats') {
      chrome.storage.local.set({ legalPolicy: false });
    }
  }, [activeTab]);

  useEffect(() => {
    (async () => {
      const { accounts } = await chrome.storage.session.get('accounts');
      
      // Get flow type from session storage if not in state
      let flowType = type;
      if (!flowType) {
        const { walletFlowType } = await chrome.storage.session.get('walletFlowType');
        if (walletFlowType) {
          flowType = walletFlowType;
          setType(walletFlowType);
        }
      }

      if (state?.addNew) {
        setActiveTab('secretPhrase');
      } else if (state?.addNewImport) {
        setActiveTab('confirmSecretPhrase');
      } else if (create) {
        setActiveTab(
          flowType === 'create' ? 'secretPhrase' : 'confirmSecretPhrase'
        );
      } else if (accounts?.length > 0) {
        setActiveTab('verifyPassword');
      } else {
        setActiveTab('setPassword');
      }
    })();
  }, []);

  // ---------------- Handlers ----------------
  const handlePasswordChange = (value) => {
    if (value.length <= 25) {
      setPassword(value);
      setValidation(validatePassword(value));
    }
  };

  const popError = (error) => messageApi.error(error);

  const handleProceed = async () => {
    if (confirmPassword !== password)
      return popError('Passwords do not match.');
    if (!validation.valid)
      return popError('Please meet all password criteria.');

    if (type === 'create') {
      if (state?.addNew) {
        setMnemonics(createWalletMnemonics);
        setShuffledMnemonics(
          createWalletMnemonics.split(' ').sort(() => Math.random() - 0.5)
        );
      } else {
        const mnemonics = await WalletHelper.generateNewMnemonics();
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

  const handleVerifyPassword = async () => {
    if (!password) return popError('Please enter password');

    const isVerified = await WalletHelper.verifyPassword(password);
    if (!isVerified) {
      popError('Incorrect password entered');
    } else {
      if (type === 'create') {
        setMnemonics(createWalletMnemonics);
        setShuffledMnemonics(
          createWalletMnemonics.split(' ').sort(() => Math.random() - 0.5)
        );
        setActiveTab('secretPhrase');
      } else {
        setActiveTab('confirmSecretPhrase');
      }
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
        setActiveTab('congrats');
      } else if (blankArray.length === 0) {
        popError('Please enter seed phrase.');
      } else {
        popError('Please check the phrase order and try again.');
      }
    } catch (error) {
      // console.error('Confirm Secret Phrase Error:', error);
      popError('Unable to create the wallet. Please check your connection and try again.');
    } finally {
      store.dispatch(setLoading(false));
    }
  };

  const handleImportSecretPhrase = async () => {
    try {
      const phrase = WalletHelper.normalizeMnemonics(getMnemonicsData);

      if (!phrase) return popError('Please enter Secret Phrase.');
      if (!terms) return popError('Please confirm that you understand the risk.');

      const isValid = WalletHelper.checkMnemonics(phrase);
      const { accounts } = await chrome.storage.session.get('accounts');

      const alreadyExists =
        accounts &&
        (await WalletHelper.isAccountExistWithMnemonics(phrase, password));

      if (alreadyExists) return popError('Mnemonics already exist.');

      if (isValid) {
        const { name } = await chrome.storage.session.get('name');
        store.dispatch(setLoading(true));
        await WalletHelper.generateAndSetWallet(
          phrase,
          name,
          'IMPORT',
          password
        );
        setActiveTab('congrats');
      } else {
        popError('Invalid mnemonics. Please try again.');
      }
    } catch (error) {
      popError(
        (typeof error === 'string' ? error : error?.message) ||
          'An error occurred. Please try again.'
      );
    } finally {
      store.dispatch(setLoading(false));
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="cardWhite setPassword">
      {contextHolder}

      {/* Tabs */}
      {activeTab !== 'congrats' && (
        <div className="setPassword__tabs">
          {!create && (
            <div
              className={`setPassword__tabs__itself ${
                activeTab === 'setPassword'
                  ? 'setPassword__tabs__itself_active'
                  : ''
              }`}
            />
          )}
          {type === 'create' && (
            <div
              className={`setPassword__tabs__itself ${
                activeTab === 'secretPhrase'
                  ? 'setPassword__tabs__itself_active'
                  : ''
              }`}
            />
          )}
          <div
            className={`setPassword__tabs__itself ${
              activeTab === 'confirmSecretPhrase'
                ? 'setPassword__tabs__itself_active'
                : ''
            }`}
          />
        </div>
      )}

      <div className={activeTab === 'congrats' ? 'congrates-item' : ''}>
        {layoutHeader}
      </div>

      {/* Headings */}
      <h3 className="setPassword__heading">
        {type === 'create'
          ? activeTab === 'setPassword'
            ? 'Create Password'
            : activeTab === 'verifyPassword'
            ? 'Verify Password'
            : activeTab === 'secretPhrase'
            ? 'Write Down Your Seed Phrase'
            : activeTab === 'confirmSecretPhrase'
            ? 'Enter Your Seed Phrase'
            : ''
          : activeTab === 'verifyPassword' && 'Verify Password'}
      </h3>

      <p
        className="welcomeScreens-text"
        style={{ marginTop: '10px', textAlign: 'left' }}
      >
        {type === 'create' &&
          (activeTab === 'secretPhrase'
            ? "This is your seed phrase. Write it down on paper and store it safely. You'll be asked to re-enter it in the next step."
            : activeTab === 'confirmSecretPhrase'
            ? 'Tap the words to reorder them correctly.'
            : '')}
      </p>

      {/* Screens */}
      {activeTab === 'setPassword' &&
        !state?.addNew &&
        !state?.addNewImport && (
          <>
            <InputFieldSimple
              placeholder="Enter Password"
              getData={handlePasswordChange}
              value={password}
              label="New Password"
            />
            <div className="setPassword__validations">
              {validations.map((item, i) => (
                <p key={i}>
                  <img src={item.icon} alt="validation icon" />
                  {item.text}
                </p>
              ))}
            </div>
            <InputFieldSimple
              placeholder="Enter Confirm Password"
              getData={(e) => e?.length <= 25 && setConfirmPassword(e)}
              value={confirmPassword}
              label="Confirm Password"
            />
            <div className="setPassword__footerbuttons bottomBtn">
              <ButtonComp
                onClick={handleProceed}
                text="Proceed"
                maxWidth="100%"
              />
            </div>
          </>
        )}

      {activeTab === 'verifyPassword' && (
        <div className="verifyPasswordNew2">
          <div>
            <InputFieldSimple
              placeholder="Enter Password"
              getData={handlePasswordChange}
              value={password}
              label="Password"
            />
          </div>
          <div className="setPassword__footerbuttons">
            <ButtonComp
              onClick={handleVerifyPassword}
              text="Confirm"
              maxWidth="100%"
            />
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
              onClick={() =>
                isShare && isSupport && setActiveTab('confirmSecretPhrase')
              }
              text="Continue"
              maxWidth="100%"
            />
          </div>
        </SecretPhrase>
      )}

      {activeTab === 'confirmSecretPhrase' &&
        (type === 'create' ? (
          <ConfirmSecretPhrase
            mnemonics={mnemonics}
            shuffledMnemonics={shuffledMnemonics}
            checkIfCorrect={setCorrect}
            setBlankArray={setBlankArray}
            blankArray={blankArray}
          >
            <div className="setPassword__footerbuttons">
              <ButtonComp
                onClick={handleConfirmSecretPhrase}
                text="Continue"
                maxWidth="100%"
              />
            </div>
          </ConfirmSecretPhrase>
        ) : (
          <SecretPhrasePaste
            termsCheck={setTerms}
            getMnemonics={setGetMnemonicsData}
          >
            <div className="setPassword__footerbuttons bottomBtn">
              <ButtonComp
                onClick={handleImportSecretPhrase}
                text="Continue"
                maxWidth="100%"
              />
            </div>
          </SecretPhrasePaste>
        ))}

      {activeTab === 'congrats' && <CongratulationsScreen type={type} />}
    </div>
  );
}

export default SetPasswordScreen;
