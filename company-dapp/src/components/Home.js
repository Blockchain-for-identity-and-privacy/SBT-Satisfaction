// src/components/Home.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SatisfactionCertificates from './SatisfactionCertificates';

const Home = ({ currentAccount, connectWallet, customerSatisfactionContractAddress }) => {
  const [showCertificates, setShowCertificates] = useState(false);

  return (
    <div className="home">
      <h1>Best Wine Company</h1>
      <div className="wallet-info">
        {currentAccount ? (
          <p>Connected with: {currentAccount}</p>
        ) : (
          <button onClick={connectWallet} className="connect-button">
            Connect MetaMask
          </button>
        )}
      </div>

      <div className="action-buttons">

        <Link to="/label-creation" className="label-creation-button">
          Create New Label
        </Link>
        {currentAccount && (
          <button
            onClick={() => setShowCertificates(!showCertificates)}
            className="view-certificates-button"
          >
            {showCertificates ? 'Hide Certificates' : 'View Satisfaction Certificates'}
          </button>
        )}
      </div>

      {showCertificates && currentAccount && (
        <SatisfactionCertificates
          currentAccount={currentAccount}
          customerSatisfactionContractAddress={customerSatisfactionContractAddress}
        />
      )}
    </div>
  );
};

export default Home;