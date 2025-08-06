import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import CustomerHome from './components/CustomerHome';
import Config from './components/Config';
import ScanLabel from './components/ScanLabel';
import CustomerNavbar from './components/CustomerNavbar';
import './App.css';

function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [companyContractAddress, setCompanyContractAddress] = useState('');
  const [customerSatisfactionContractAddress, setCustomerSatisfactionContractAddress] = useState('');

  // Load contracts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('contractAddresses');
    if (saved) {
      const { company, customerSatisfaction } = JSON.parse(saved);
      setCompanyContractAddress(company || '');
      setCustomerSatisfactionContractAddress(customerSatisfaction || '');
    }
  }, []);

  // Wallet connection logic (same as before)
  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setCurrentAccount(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  useEffect(() => {
    checkWalletConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setCurrentAccount(accounts[0] || '');
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return (
    <div className="App">
      <CustomerNavbar currentAccount={currentAccount} connectWallet={connectWallet} />
      <Routes>
        <Route
          path="/"
          element={
            <CustomerHome
              currentAccount={currentAccount}
              connectWallet={connectWallet}
              companyContractAddress={companyContractAddress}
              customerSatisfactionContractAddress={customerSatisfactionContractAddress}
            />
          }
        />
        <Route
          path="/config"
          element={
            <Config
              companyContractAddress={companyContractAddress}
              customerSatisfactionContractAddress={customerSatisfactionContractAddress}
              setCompanyContractAddress={setCompanyContractAddress}
              setCustomerSatisfactionContractAddress={setCustomerSatisfactionContractAddress}
            />
          }
        />
        <Route
          path="/scan-label"
          element={
            <ScanLabel
              currentAccount={currentAccount}  // Add this
              connectWallet={connectWallet}    // Add this
              companyContractAddress={companyContractAddress}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;