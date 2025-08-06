/**
 * @author Andrea Pinna <pinna.andrea@unica.it>
 */

import React, { useState } from 'react';

const Config = ({
  companyContractAddress,
  customerSatisfactionContractAddress,
  setCompanyContractAddress,
  setCustomerSatisfactionContractAddress
}) => {
  const [newCompanyAddress, setNewCompanyAddress] = useState(companyContractAddress);
  const [newCustomerAddress, setNewCustomerAddress] = useState(customerSatisfactionContractAddress);

  const saveToLocalStorage = (company, customerSatisfaction) => {
    localStorage.setItem('contractAddresses', JSON.stringify({
      company,
      customerSatisfaction
    }));
  };

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    if (newCompanyAddress) {
      setCompanyContractAddress(newCompanyAddress);
      saveToLocalStorage(newCompanyAddress, customerSatisfactionContractAddress);
      alert('Company contract address saved!');
    }
  };

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    if (newCustomerAddress) {
      setCustomerSatisfactionContractAddress(newCustomerAddress);
      saveToLocalStorage(companyContractAddress, newCustomerAddress);
      alert('Customer Satisfaction contract address saved!');
    }
  };

  return (
    <div className="config">
      <h2>Configuration</h2>

      <div className="contract-info">
        <h3>Current Contract Addresses</h3>
        <p><strong>Company Contract:</strong> {companyContractAddress || 'Not set'}</p>
        <p><strong>Customer Satisfaction Contract:</strong> {customerSatisfactionContractAddress || 'Not set'}</p>
      </div>

      <div className="forms">
        <form onSubmit={handleCompanySubmit} className="address-form">
          <h3>Set Company Contract Address</h3>
          <input
            type="text"
            value={newCompanyAddress}
            onChange={(e) => setNewCompanyAddress(e.target.value)}
            placeholder="Enter Company contract address"
            required
          />
          <button type="submit">Save</button>
        </form>

        <form onSubmit={handleCustomerSubmit} className="address-form">
          <h3>Set Customer Satisfaction Contract Address</h3>
          <input
            type="text"
            value={newCustomerAddress}
            onChange={(e) => setNewCustomerAddress(e.target.value)}
            placeholder="Enter Customer Satisfaction contract address"
            required
          />
          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  );
};

export default Config;
