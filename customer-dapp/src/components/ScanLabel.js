/**
 * @author Andrea Pinna <pinna.andrea@unica.it>
 */

import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import QrScanner from 'qr-scanner';
import CompanyABI from '../contracts/Company.json';
import CustomerSatisfactionABI from '../contracts/CustomerSatisfaction.json';

const ScanLabel = ({ currentAccount, connectWallet }) => {
  const videoRef = useRef(null);
  const [scanResult, setScanResult] = useState('');
  const [scanner, setScanner] = useState(null);
  const [bottleWallet, setBottleWallet] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [contracts, setContracts] = useState({
    company: '',
    customerSatisfaction: ''
  });

  // Load contract addresses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('contractAddresses');
    if (saved) {
      const { company, customerSatisfaction } = JSON.parse(saved);
      setContracts({
        company,
        customerSatisfaction
      });
    }
  }, []);

  // Debugging effect to log connection status
  useEffect(() => {
    console.log('Current account prop:', currentAccount);
    setIsConnected(!!currentAccount);
  }, [currentAccount]);

  // Format address display
  const displayAddress = isConnected
    ? `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`
    : 'Not connected';

  const startScanner = async () => {
    try {
      // Double-check connection
      if (!currentAccount) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
        } else {
          setError('Please connect your wallet first');
          if (connectWallet) await connectWallet();
          return;
        }
      }

      if (videoRef.current && !scanner) {
        const qrScanner = new QrScanner(
          videoRef.current,
          result => {
            qrScanner.stop();
            setScanResult(result.data);
            verifyBottle(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        await qrScanner.start();
        setScanner(qrScanner);
      }
    } catch (err) {
      console.error('Scanner error:', err);
      setError(err.message);
    }
  };

  const verifyBottle = async (privateKey) => {
    try {
      setLoading(true);
      setError('');
      setTokenData(null);
      setTxStatus('');

      if (!privateKey) throw new Error('No private key provided');
      if (!currentAccount) throw new Error('Wallet not connected');

      // Validate private key format
      const formattedPk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      if (!formattedPk.match(/^0x[0-9a-fA-F]{64}$/)) {
        throw new Error('Invalid private key format');
      }

      // Create wallet from private key
      const wallet = new ethers.Wallet(formattedPk);
      setBottleWallet(wallet);
      const bottleAddress = wallet.address;

      // Validate contract addresses
      if (!contracts.company) throw new Error('Company contract address not configured');

      // Setup provider and contracts
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const companyContract = new ethers.Contract(
        contracts.company,
        CompanyABI,
        provider
      );

      // Get token metadata
      const metadata = await companyContract.getTokenData(bottleAddress);
      setTokenData({
        ...metadata,
        bottleAddress
      });

    } catch (err) {
      setError(err.message);
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const setBottleOwner = async () => {
    try {
      setLoading(true);
      setError('');
      setTxStatus('Preparing ownership transfer...');

      if (!bottleWallet || !currentAccount || !contracts.company) {
        throw new Error('Missing required data for ownership transfer');
      }

      // Setup provider using MetaMask
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Create signer with bottle's private key
      const bottleSigner = new ethers.Wallet(
        bottleWallet.privateKey,
        provider
      );

      // Create Company contract instance connected to bottle signer
      const companyContract = new ethers.Contract(
        contracts.company,
        CompanyABI,
        bottleSigner
      );

      setTxStatus('Sending ownership transfer transaction...');

      // Call setAddressOwner function
      const tx = await companyContract.setAddressOwner(
        currentAccount,  // New owner address
        {
          gasLimit: 300000 // Adjust based on your contract's requirements
        }
      );

      setTxStatus('Transaction sent, waiting for confirmation...');
      await tx.wait();

      setTxStatus('Ownership transferred successfully!');

      // Refresh token data to show updated owner
      await verifyBottle(bottleWallet.privateKey);
    } catch (err) {
      setError(`Ownership transfer failed: ${err.message}`);
      console.error('Transfer error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clean up scanner
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.stop();
        scanner.destroy();
      }
    };
  }, [scanner]);

  return (
    <div className="scan-container">
      <div className="connection-status">
        <h2>Scan Bottle Label</h2>
        <div className={`wallet-display ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? (
            <>
              <span className="wallet-address">{displayAddress}</span>
              <span className="connection-indicator connected"></span>
            </>
          ) : (
            <button
              onClick={connectWallet}
              className="connect-button"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {!isConnected ? (
        <div className="connection-prompt">
          <p>Please connect your wallet to scan bottles</p>
        </div>
      ) : !scanResult ? (
        <div className="scanner-section">
          <video
            ref={videoRef}
            className="scanner-video"
            playsInline
          />
          <button onClick={startScanner} className="scan-button">
            Start Scanner
          </button>
        </div>
      ) : (
        <div className="verification-section">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <div className="error-message">
              <p>Error: {error}</p>
              <button onClick={() => setScanResult('')} className="retry-button">
                Scan Again
              </button>
            </div>
          ) : tokenData ? (
            <div className="bottle-details">
              <h3>Bottle Details</h3>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <strong>Name:</strong> {tokenData.name || 'N/A'}
                </div>
                <div className="metadata-item">
                  <strong>Description:</strong> {tokenData.description || 'N/A'}
                </div>
                <div className="metadata-item">
                  <strong>Capacity:</strong> {tokenData.capacity || 'N/A'}
                </div>
                <div className="metadata-item">
                  <strong>Bottle Address:</strong> {tokenData.bottleAddress}
                </div>
                <div className="metadata-item">
                  <strong>Current Owner:</strong> {tokenData.bottle_owner}
                </div>
                <div className="metadata-item">
                  <strong>Company Address:</strong> {tokenData.address_company}
                </div>
              </div>

              {tokenData.bottle_owner !== currentAccount.toLowerCase() && (
                <button
                  onClick={setBottleOwner}
                  disabled={loading}
                  className="transfer-button"
                >
                  {loading ? 'Processing...' : 'Set Me As Bottle Owner'}
                </button>
              )}

              {txStatus && (
                <div className={`tx-status ${txStatus.includes('successfully') ? 'success' : 'pending'}`}>
                  {txStatus}
                </div>
              )}

              <button
                onClick={() => setScanResult('')}
                className="scan-again-button"
              >
                Scan Another Bottle
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ScanLabel;