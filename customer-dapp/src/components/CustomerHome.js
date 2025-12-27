/**
 * @author Andrea Pinna <pinna.andrea@unica.it>
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerProducts from './CustomerProducts';

const CustomerHome = ({
  currentAccount,
  connectWallet,
  companyContractAddress,
  customerSatisfactionContractAddress
}) => {
  const [showProducts, setShowProducts] = useState(false);

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
            onClick={() => setShowProducts(!showProducts)}
            className="scan-button"
          >
            {showProducts ? 'Hide My Products' : 'My Digital Properties'}
          </button>
        )}
      </div>

      {showProducts && currentAccount && (
        <CustomerProducts
          currentAccount={currentAccount}
          companyContractAddress={companyContractAddress}
          customerSatisfactionContractAddress={customerSatisfactionContractAddress}
        />
      )}
    </div>
  );
};

export default CustomerHome;