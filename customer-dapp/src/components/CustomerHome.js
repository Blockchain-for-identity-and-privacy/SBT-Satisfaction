/**
 * @author Andrea Pinna <pinna.andrea@unica.it>
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerBottles from './CustomerBottles';

const CustomerHome = ({
  currentAccount,
  connectWallet,
  companyContractAddress,
  customerSatisfactionContractAddress
}) => {
  const [showBottles, setShowBottles] = useState(false);

  return (
    <div className="home">
      <h1>Customer Digital Properties</h1>
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
        <Link to="/scan-label" className="scan-button">
          Scan Label
        </Link>
        {currentAccount && (
          <button
            onClick={() => setShowBottles(!showBottles)}
            className="scan-button"
          >
            {showBottles ? 'Hide My Bottles' : 'My Digital Properties'}
          </button>
        )}
      </div>

      {showBottles && currentAccount && (
        <CustomerBottles
          currentAccount={currentAccount}
          companyContractAddress={companyContractAddress}
          customerSatisfactionContractAddress={customerSatisfactionContractAddress}
        />
      )}
    </div>
  );
};

export default CustomerHome;