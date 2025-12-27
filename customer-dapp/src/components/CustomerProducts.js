/**
 * @author Andrea Pinna <pinna.andrea@unica.it>
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CompanyABI from '../contracts/Company.json';
import CustomerSatisfactionABI from '../contracts/CustomerSatisfaction.json';

const CustomerProducts = ({ currentAccount, companyContractAddress, customerSatisfactionContractAddress }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugLog, setDebugLog] = useState([]);
  const [txStatus, setTxStatus] = useState(null);

  const addDebugLog = (message) => {
    console.log(message);
    setDebugLog(prev => [...prev, message]);
  };

  const mintCertificate = async (productAddress) => {
    try {
      setTxStatus({ status: 'pending', message: 'Preparing transaction...' });
      addDebugLog(`Initiating certificate mint for product ${productAddress}`);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const satisfactionContract = new ethers.Contract(
        customerSatisfactionContractAddress,
        CustomerSatisfactionABI,
        signer
      );

      setTxStatus({ status: 'pending', message: 'Please confirm transaction in MetaMask...' });
      addDebugLog(`Calling mint(${companyContractAddress}, ${productAddress})`);

      const tx = await satisfactionContract.mint(
        companyContractAddress,
        productAddress,
        { gasLimit: 300000 } // Adjust gas limit as needed
      );

      setTxStatus({ status: 'pending', message: 'Transaction sent. Waiting for confirmation...' });
      addDebugLog(`Transaction hash: ${tx.hash}`);

      await tx.wait();

      setTxStatus({ status: 'success', message: 'Certificate minted successfully!' });
      addDebugLog('Certificate mint confirmed');

      // Refresh product data
      fetchProducts();

      // Clear status after 5 seconds
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err) {
      const errMsg = `Minting failed: ${err.message}`;
      setTxStatus({ status: 'error', message: errMsg });
      addDebugLog(`ERROR: ${errMsg}`);
      console.error(err);
    }
  };

  const fetchProducts = async () => {
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

      addDebugLog('Fetching total supply of products...');
      const totalSupply = await companyContract.productNFTId();
      addDebugLog(`Total products found: ${totalSupply}`);

      const customerProducts = [];

      for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
        try {
          addDebugLog(`\nProcessing token #${tokenId}`);
          const metadata = await companyContract.tokenMetadata(tokenId);
          addDebugLog(`Metadata retrieved: ${JSON.stringify(metadata)}`);

          const productAddress = metadata.address_product;
          const ownerAddress = metadata.product_owner;

          if (ownerAddress.toLowerCase() === currentAccount.toLowerCase()) {
            addDebugLog(`Checking certificate for product address: ${productAddress}`);
            const certificateTokenId = await satisfactionContract.mintedSatisfToken(productAddress);
            const hasCertificate = certificateTokenId.gt(0);

            customerProducts.push({
              tokenId,
              name: metadata.name,
              description: metadata.description,
              capacity: metadata.capacity,
              ownerAddress,
              productAddress,
              companyAddress: metadata.address_company,
              hasCertificate
            });
          }
        } catch (err) {
          console.warn(`Error processing token ${tokenId}:`, err);
          continue;
        }
      }

      setProducts(customerProducts);
    } catch (err) {
      const errMsg = `Fatal error: ${err.message}`;
      console.error(errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentAccount, companyContractAddress, customerSatisfactionContractAddress]);

  if (loading) return <div className="loading">Loading your products...</div>;

  if (error) return (
    <div className="error">
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="retry-button">
        Try Again
      </button>
    </div>
  );

return (
    <div className="products-container">
      <h3>My Digital Properties</h3>
      <p className="product-count">Total Product Owned: {products.length}</p>

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

      <div className="products-list">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.tokenId} className="product-card">
              <h4>
                {product.name} (Token #{product.tokenId})
                {product.hasCertificate && (
                  <span className="certificate-badge">✅ CERTIFIED</span>
                )}
              </h4>
              <div className="product-details">
                <p><strong>Description:</strong> {product.description}</p>
                <p><strong>Capacity:</strong> {product.capacity}</p>
                <p><strong>Product Address:</strong> {product.productAddress}</p>
                <p><strong>Company Address:</strong> {product.companyAddress}</p>
                <p><strong>Owner Address:</strong> {product.ownerAddress}</p>
                <p><strong>Certificate of satisfaction:</strong>
                  {product.hasCertificate ? ' ✅ Exists' : ' ❌ Not minted'}
                </p>

                {!product.hasCertificate && (
                  <button
                    onClick={() => mintCertificate(product.productAddress)}
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
          <p>No products found where you are listed as the owner</p>
        )}
      </div>
    </div>
  );
};

export default CustomerProducts;