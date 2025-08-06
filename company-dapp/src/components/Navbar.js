// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ currentAccount, connectWallet }) => {
  const shortenedAddress = currentAccount 
    ? `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}` 
    : '';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Company dApp</Link>
      </div>
      <div className="navbar-actions">
        {currentAccount ? (
          <span className="wallet-address">{shortenedAddress}</span>
        ) : (
          <button onClick={connectWallet} className="connect-wallet">
            Connect Wallet
          </button>
        )}
        <Link to="/config" className="config-link">
          Configuration
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
