/**
 * @author Andrea Pinna <pinna.andrea@unica.it>
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import CompanyABI from '../contracts/Company.json';
import CustomerSatisfactionABI from '../contracts/CustomerSatisfaction.json';


const LabelCreation = () => {
  // Contract addresses state
  const [contracts, setContracts] = useState({
    company: null,
    customerSatisfaction: null
  });

  // Key management state
  const [privateKey, setPrivateKey] = useState('');
  const [productAddress, setProductAddress] = useState('');
  const [useExistingAddress, setUseExistingAddress] = useState(false);

  // Mint form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Label qr-code state
  const [mintSuccess, setMintSuccess] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);


  // Load contracts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('contractAddresses');
    if (saved) {
      const { company, customerSatisfaction } = JSON.parse(saved);
      setContracts({
        company,
        customerSatisfaction
      });
    }
    setLoading(false);
  }, []);

  const displayAddress = (address) => {
    if (!address) return 'Not Configured';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const registerProductAddress = async () => {
    if (!productAddress || !contracts.company) {
      setTxStatus('Please generate or enter a product address and ensure Company contract is configured');
      return;
    }

    try {
      setTxStatus('Registering product address...');

      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        throw new Error('Please connect your wallet first');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const companyContract = new ethers.Contract(contracts.company, CompanyABI, signer);

      const tx = await companyContract.registerProductAddress(productAddress);
      setTxStatus('Transaction sent, waiting for confirmation...');

      await tx.wait();
      setTxStatus('Product address registered successfully!');

    } catch (error) {
      console.error('Error registering product address:', error);
      setTxStatus(`Error: ${error.message}`);
    }
  };

  const mintProduct = async () => {
    if (!productAddress || !contracts.company || !name || !description || !capacity) {
      setTxStatus('Please fill all fields and ensure Company contract is configured');
      return;
    }

    try {
      setTxStatus('Minting product NFT...');
      setMintSuccess(false);

      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        throw new Error('Please connect your wallet first');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const companyContract = new ethers.Contract(contracts.company, CompanyABI, signer);

      const tx = await companyContract.mint(
        productAddress,
        description,
        name,
        capacity
      );
      setTxStatus('Mint transaction sent, waiting for confirmation...');

      await tx.wait();
      setTxStatus('Product NFT minted successfully!');
      setMintSuccess(true);

    } catch (error) {
      console.error('Error minting product NFT:', error);
      setTxStatus(`Error: ${error.message}`);
      setMintSuccess(false);
    }
  };

  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  if (loading) return <div>Loading...</div>;

  return (
  <div className="label-creation">
    <h2>Label Creation</h2>

    <div className="contract-status">
      <p><strong>Company Contract:</strong> {displayAddress(contracts.company)}</p>
      <p><strong>Customer Satisfaction Contract:</strong> {displayAddress(contracts.customerSatisfaction)}</p>
    </div>

    <div className="section">
      <h3>1. Product Address</h3>

      <div className="toggle-group">
        <button
          className={`toggle-button ${!useExistingAddress ? 'active' : ''}`}
          onClick={() => setUseExistingAddress(false)}
        >
          Generate New
        </button>
        <button
          className={`toggle-button ${useExistingAddress ? 'active' : ''}`}
          onClick={() => setUseExistingAddress(true)}
        >
          Use Existing
        </button>
      </div>

      {!useExistingAddress ? (
        <>
          <button
            onClick={() => {
              const wallet = ethers.Wallet.createRandom();
              setPrivateKey(wallet.privateKey);
              setProductAddress(wallet.address);
            }}
            className="generate-button"
          >
            Generate New Key Pair
          </button>
          {privateKey && (
            <div className="key-display">
              <div className="key-field">
                <label>Private Key:</label>
                <input
                  type="text"
                  value={privateKey}
                  readOnly
                  className="key-input"
                />
              </div>
              <div className="key-field">
                <label>Public Address:</label>
                <input
                  type="text"
                  value={productAddress}
                  readOnly
                  className="key-input"
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="form-group">
          <label>Existing Product Address:</label>
          <input
            type="text"
            value={productAddress}
            onChange={(e) => setProductAddress(e.target.value)}
            placeholder="0x..."
            className="form-input"
          />
        </div>
      )}

      {productAddress && contracts.company && (
        <button
          onClick={registerProductAddress}
          className="action-button mint-button"
          disabled={!productAddress || !contracts.company}
        >
          Register Product Address
        </button>
      )}
    </div>

    <div className="section">
      <h3>2. Product Details</h3>

      <div className="form-group">
        <label>Product Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Vintage Reserve 2020"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed description of the product"
          className="form-input"
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>Dimension (Size or Capacity):</label>
        <input
          type="text"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="e.g., 750ml"
          className="form-input"
        />
      </div>

      <button
        onClick={mintProduct}
        className="action-button mint-button"
        disabled={!productAddress || !contracts.company || !name || !description || !capacity}
      >
        Mint Product NFT
      </button>
    </div>

    {mintSuccess && privateKey && (
      <div className="section">
        <h3>3. Label Generation</h3>
        <div className="qr-container">
          <h4>Product Authentication QR Code</h4>
          <div className="qr-code">
            <QRCodeSVG
              value={privateKey}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="qr-note">This QR code contains the private key for authentication</p>
          <button onClick={handlePrint} className="action-button print-button">
            Print Label
          </button>
        </div>

        {/* Hidden print content */}
        <div id="print-content" style={{ display: 'none' }}>
          <div className="print-label">
            <h2>{name}</h2>
            <p><strong>Description:</strong> {description}</p>
            <p><strong>Capacity:</strong> {capacity}</p>
            <p><strong>Product Address:</strong> {productAddress}</p>
            <div className="print-qr">
              <QRCodeSVG
                value={privateKey}
                size={150}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="print-footer">Authentic Product - Do Not Duplicate</p>
          </div>
        </div>
      </div>
    )}

    {txStatus && (
      <div className={`tx-status ${txStatus.includes('Error') ? 'error-status' : txStatus.includes('successfully') ? 'success-status' : 'pending-status'}`}>
        <p>{txStatus}</p>
      </div>
    )}
  </div>
);
};

export default LabelCreation;