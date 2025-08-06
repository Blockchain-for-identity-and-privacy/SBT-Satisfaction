import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CustomerSatisfactionABI from '../contracts/CustomerSatisfaction.json';

const SatisfactionCertificates = ({ currentAccount, customerSatisfactionContractAddress }) => {
  const [certificates, setCertificates] = useState([]);
  const [tokenCount, setTokenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!currentAccount || !customerSatisfactionContractAddress) {
        setError('Wallet not connected or contract address missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          customerSatisfactionContractAddress,
          CustomerSatisfactionABI,
          provider
        );

        // Get token balance
        const balance = await contract.balanceOf(currentAccount);
        setTokenCount(balance.toNumber());

        // Get all token IDs for this company
        const tokenIds = await contract.getCertificatesByCompany(currentAccount);

        // Fetch metadata for each token
        const certs = await Promise.all(
          tokenIds.map(async (tokenId) => {
            const metadata = await contract.tokenMetadata(tokenId);
            return {
              tokenId: tokenId.toNumber(),
              bottleOwner: metadata.bottle_owner,
              companyAddress: metadata.company_Address,
              bottleAddress: metadata.bottle_address
            };
          })
        );

        setCertificates(certs);
      } catch (err) {
        console.error("Error fetching certificates:", err);
        setError(`Failed to load certificates: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [currentAccount, customerSatisfactionContractAddress]);

  if (loading) return (
    <div className="loading">
      <p>Loading certificates...</p>
    </div>
  );

  if (error) return (
    <div className="error">
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="retry-button">
        Try Again
      </button>
    </div>
  );

  return (
    <div className="certificates-container">
      <h3>Satisfaction Certificates</h3>
      <p className="certificate-count">
        Total Certificates Owned: {tokenCount}
      </p>
      <p className="certificate-count">
        Total Certificates Found: {certificates.length}
      </p>

      <div className="certificates-list">
        {certificates.length > 0 ? (
          certificates.map((cert) => (
            <div key={cert.tokenId} className="certificate-card">
              <h4>Certificate #{cert.tokenId}</h4>
              <div className="certificate-details">
                <strong>Bottle Owner:</strong>
                <p>{cert.bottleOwner}</p>

                <strong>Company Address:</strong>
                <p>{cert.companyAddress}</p>

                <strong>Bottle Address:</strong>
                <p>{cert.bottleAddress}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No satisfaction certificates found for your address</p>
        )}
      </div>
    </div>
  );
};

export default SatisfactionCertificates;