/**
 * @author Andrea Pinna <pinna.andrea@unica.it>
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CompanyABI from '../contracts/Company.json';
import CustomerSatisfactionABI from '../contracts/CustomerSatisfaction.json';

const CustomerBottles = ({ currentAccount, companyContractAddress, customerSatisfactionContractAddress }) => {
  const [bottles, setBottles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugLog, setDebugLog] = useState([]);
  const [txStatus, setTxStatus] = useState(null);

  const addDebugLog = (message) => {
    console.log(message);
    setDebugLog(prev => [...prev, message]);
  };

  const mintCertificate = async (bottleAddress) => {
    try {
      setTxStatus({ status: 'pending', message: 'Preparing transaction...' });
      addDebugLog(`Initiating certificate mint for bottle ${bottleAddress}`);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const satisfactionContract = new ethers.Contract(
        customerSatisfactionContractAddress,
        CustomerSatisfactionABI,
        signer
      );

      setTxStatus({ status: 'pending', message: 'Please confirm transaction in MetaMask...' });
      addDebugLog(`Calling mint(${companyContractAddress}, ${bottleAddress})`);

      const tx = await satisfactionContract.mint(
        companyContractAddress,
        bottleAddress,
        { gasLimit: 300000 } // Adjust gas limit as needed
      );

      setTxStatus({ status: 'pending', message: 'Transaction sent. Waiting for confirmation...' });
      addDebugLog(`Transaction hash: ${tx.hash}`);

      await tx.wait();

      setTxStatus({ status: 'success', message: 'Certificate minted successfully!' });
      addDebugLog('Certificate mint confirmed');

      // Refresh bottle data
      fetchBottles();

      // Clear status after 5 seconds
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err) {
      const errMsg = `Minting failed: ${err.message}`;
      setTxStatus({ status: 'error', message: errMsg });
      addDebugLog(`ERROR: ${errMsg}`);
      console.error(err);
    }
  };

  const fetchBottles = async () => {
    if (!currentAccount || !companyContractAddress || !customerSatisfactionContractAddress) {
      const errMsg = 'Missing required props: ' +
        (!currentAccount ? 'currentAccount ' : '') +
        (!companyContractAddress ? 'companyContractAddress ' : '') +
        (!customerSatisfactionContractAddress ? 'customerSatisfactionContractAddress' : '');
      setError(errMsg);
      setLoading(false);
      addDebugLog(`Error: ${errMsg}`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setDebugLog([]);
      addDebugLog('Initializing provider and contracts...');

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const companyContract = new ethers.Contract(
        companyContractAddress,
        CompanyABI,
        provider
      );

      const satisfactionContract = new ethers.Contract(
        customerSatisfactionContractAddress,
        CustomerSatisfactionABI,
        provider
      );

      addDebugLog('Fetching total supply of bottles...');
      const totalSupply = await companyContract.bottleNFTId();
      addDebugLog(`Total bottles found: ${totalSupply}`);

      const customerBottles = [];

      for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
        try {
          addDebugLog(`\nProcessing token #${tokenId}`);
          const metadata = await companyContract.tokenMetadata(tokenId);
          addDebugLog(`Metadata retrieved: ${JSON.stringify(metadata)}`);

          const bottleAddress = metadata.address_bottle;
          const ownerAddress = metadata.bottle_owner;

          if (ownerAddress.toLowerCase() === currentAccount.toLowerCase()) {
            addDebugLog(`Checking certificate for bottle address: ${bottleAddress}`);
            const certificateTokenId = await satisfactionContract.mintedSatisfToken(bottleAddress);
            const hasCertificate = certificateTokenId.gt(0);

            customerBottles.push({
              tokenId,
              name: metadata.name,
              description: metadata.description,
              capacity: metadata.capacity,
              ownerAddress,
              bottleAddress,
              companyAddress: metadata.address_company,
              hasCertificate
            });
          }
        } catch (err) {
          console.warn(`Error processing token ${tokenId}:`, err);
          continue;
        }
      }

      setBottles(customerBottles);
    } catch (err) {
      const errMsg = `Fatal error: ${err.message}`;
      console.error(errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBottles();
  }, [currentAccount, companyContractAddress, customerSatisfactionContractAddress]);

  if (loading) return <div className="loading">Loading your bottles...</div>;

  if (error) return (
    <div className="error">
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="retry-button">
        Try Again
      </button>
    </div>
  );

return (
    <div className="bottles-container">
      <h3>My Digital Properties</h3>
      <p className="bottle-count">Total Product Owned: {bottles.length}</p>

      {/* Transaction status notification */}
      {txStatus && (
        <div className={`tx-status ${txStatus.status}`}>
          {txStatus.message}
          {txStatus.status === 'success' && (
            <span className="tx-success-icon">✓</span>
          )}
        </div>
      )}

      {/* Debug console */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-console">
          {/* ... (keep existing debug console code) */}
        </div>
      )}

      <div className="bottles-list">
        {bottles.length > 0 ? (
          bottles.map((bottle) => (
            <div key={bottle.tokenId} className="bottle-card">
              <h4>
                {bottle.name} (Token #{bottle.tokenId})
                {bottle.hasCertificate && (
                  <span className="certificate-badge">✅ CERTIFIED</span>
                )}
              </h4>
              <div className="bottle-details">
                <p><strong>Description:</strong> {bottle.description}</p>
                <p><strong>Capacity:</strong> {bottle.capacity}</p>
                <p><strong>Bottle Address:</strong> {bottle.bottleAddress}</p>
                <p><strong>Company Address:</strong> {bottle.companyAddress}</p>
                <p><strong>Owner Address:</strong> {bottle.ownerAddress}</p>
                <p><strong>Certificate of satisfaction:</strong>
                  {bottle.hasCertificate ? ' ✅ Exists' : ' ❌ Not minted'}
                </p>

                {!bottle.hasCertificate && (
                  <button
                    onClick={() => mintCertificate(bottle.bottleAddress)}
                    className="mint-certificate-button"
                    disabled={txStatus?.status === 'pending'}
                  >
                    Mint Certificate
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No bottles found where you are listed as the owner</p>
        )}
      </div>
    </div>
  );
};

export default CustomerBottles;