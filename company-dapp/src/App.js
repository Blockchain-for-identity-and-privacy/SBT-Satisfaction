import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'; // Removed BrowserRouter import
import Home from './components/Home';
import Config from './components/Config';
import LabelCreation from './components/LabelCreation';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [companyContractAddress, setCompanyContractAddress] = useState('');
  const [customerSatisfactionContractAddress, setCustomerSatisfactionContractAddress] = useState('');

  // Load contracts from localStorage
  useEffect(() => {
    const loadContracts = () => {
      const saved = localStorage.getItem('contractAddresses');
      if (saved) {
        const { company, customerSatisfaction } = JSON.parse(saved);
        console.log('Loaded from localStorage:', { company, customerSatisfaction });
        setCompanyContractAddress(company || '');
        setCustomerSatisfactionContractAddress(customerSatisfaction || '');
      }
    };
    loadContracts();
  }, []);


  // Wallet connection logic
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

  // Listen for account changes
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
      <Navbar currentAccount={currentAccount} connectWallet={connectWallet} />
      <Routes>
        {/* Single, consolidated route for home */}
        <Route
          path="/"
          element={
            <Home
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
        <Route path="/label-creation" element={<LabelCreation />} />
      </Routes>
    </div>
  );
}

export default App;
