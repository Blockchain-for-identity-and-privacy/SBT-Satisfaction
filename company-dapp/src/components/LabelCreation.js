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
  const [bottleAddress, setBottleAddress] = useState('');
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

  const registerBottleAddress = async () => {
    if (!bottleAddress || !contracts.company) {
      setTxStatus('Please generate or enter a bottle address and ensure Company contract is configured');
      return;
    }

    try {
      setTxStatus('Registering bottle address...');

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

      const tx = await companyContract.registerBottleAddress(bottleAddress);
      setTxStatus('Transaction sent, waiting for confirmation...');

      await tx.wait();
      setTxStatus('Bottle address registered successfully!');

    } catch (error) {
      console.error('Error registering bottle address:', error);
      setTxStatus(`Error: ${error.message}`);
    }
  };

  const mintBottle = async () => {
    if (!bottleAddress || !contracts.company || !name || !description || !capacity) {
      setTxStatus('Please fill all fields and ensure Company contract is configured');
      return;
    }

    try {
      setTxStatus('Minting bottle NFT...');
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
        bottleAddress,
        description,
        name,
        capacity
      );
      setTxStatus('Mint transaction sent, waiting for confirmation...');

      await tx.wait();
      setTxStatus('Bottle NFT minted successfully!');
      setMintSuccess(true);

    } catch (error) {
      console.error('Error minting bottle NFT:', error);
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
      <h3>1. Bottle Address</h3>

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
              setBottleAddress(wallet.address);
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
                  value={bottleAddress}
                  readOnly
                  className="key-input"
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="form-group">
          <label>Existing Bottle Address:</label>
          <input
            type="text"
            value={bottleAddress}
            onChange={(e) => setBottleAddress(e.target.value)}
            placeholder="0x..."
            className="form-input"
          />
        </div>
      )}

      {bottleAddress && contracts.company && (
        <button
          onClick={registerBottleAddress}
          className="action-button mint-button"
          disabled={!bottleAddress || !contracts.company}
        >
          Register Bottle Address
        </button>
      )}
    </div>

    <div className="section">
      <h3>2. Bottle Details</h3>

      <div className="form-group">
        <label>Bottle Name:</label>
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
          placeholder="Detailed description of the bottle"
          className="form-input"
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>Capacity:</label>
        <input
          type="text"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="e.g., 750ml"
          className="form-input"
        />
      </div>

      <button
        onClick={mintBottle}
        className="action-button mint-button"
        disabled={!bottleAddress || !contracts.company || !name || !description || !capacity}
      >
        Mint Bottle NFT
      </button>
    </div>

    {mintSuccess && privateKey && (
      <div className="section">
        <h3>3. Label Generation</h3>
        <div className="qr-container">
          <h4>Bottle Authentication QR Code</h4>
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
            <p><strong>Bottle Address:</strong> {bottleAddress}</p>
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