const CONTRACTS_KEY = 'contractAddresses';

export const saveContracts = (contracts) => {
  try {
    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
  } catch (error) {
    console.error('Error saving contracts:', error);
    throw error;
  }
};

export const loadContracts = () => {
  try {
    const data = localStorage.getItem(CONTRACTS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading contracts:', error);
    return {};
  }
};