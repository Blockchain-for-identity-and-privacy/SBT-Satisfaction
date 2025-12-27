// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "./utils/ERC721_lite.sol";

/**
 * @title Company
 * @author Andrea Pinna, Maria Ilaria Lunesu, Roberto Tonelli, Andrea Tiddia, - University of Cagliari
 * @dev Smart contract that issues soulbound ERC721 tokens to a product account added to the system.
 */
 
contract Company is ERC721_lite {
    /// @notice Address of the contract owner (manufacturing company)
    address public company_address;

    /// @notice Token ID counter for minted NFTs
    uint256 public productNFTId = 1;

    /// @notice Mapping to track addresses that already have an associated NFT in the system
    mapping(address => uint256) private hasNFT;

    /// @notice Mapping to associate metadata with each token in the system
    mapping(uint256 => TokenMetadata) public tokenMetadata;

    /// @notice Mapping to verify that a product address is valid
    mapping(address => bool) public isValidProduct;

    /// @dev Struct used to store NFT metadata
    struct TokenMetadata {
        address address_product; // Product account address
        address address_company; // Address of the Manufacturing Company
        address product_owner; // Phisical owner of the product
        string name; // Name of the product
        string description; // Description of the product
        string capacity; // Capacity of the product
    }

    /// @dev Modifier to restrict function access to only the manufacturing company (contract owner)
    modifier onlyCompanyAddress() {
        require(msg.sender == company_address, "Only the manufacturing company can call this function");
        _;
    }

    /// @dev Modifier to restrict function access to only registered product accounts with an associated NFT
    modifier onlyProductAccount() {
        require(isValidProduct[msg.sender] == true, "Only product accounts can call this function");
        require(hasNFT[msg.sender] != 0, "Only product accounts with the associated company's SBT can call this function");
        _;
    }

    /**
     * @dev Constructor function that initializes the ERC721 contract.
     * @notice The contract deployer is set as the contract owner.
     */
    constructor() ERC721_lite("A_Manufacturing_Company", "MC_TKN") {
        company_address = msg.sender;
    }

    /// @notice Event emitted when a new product account is registered
    event ProductUnitRegistered(address ProductUnitAddress);

    /// @notice Event emitted when an NFT is minted for a product unit
    /// @param tokenId ID of the associated token
    /// @param company_address Address of the manufacturing company that owns the NFT
    event ProductCertificateLog(
        uint256 indexed tokenId,
        address indexed company_address
    );

    /**
     * @dev Registers an externally generated address for a product in the system.
     * @param productAddress Address of the product account.
     * @return The registered product address.
     * @notice The address must be unique and cannot be the company address.
     */
    function registerProductAddress(address productAddress) public onlyCompanyAddress returns (address) {
        require(productAddress != address(0), "Invalid address");
        require(!isValidProduct[productAddress], "Address already in use");
        require(productAddress != company_address, "A product cannot be associated with the address of the company");
        isValidProduct[productAddress] = true;
        return productAddress;
    }

    /**
     * @dev Internal function to associate metadata with a token.
     * @param tokenId The ID of the NFT.
     * @param metadata The metadata struct for the NFT.
     */
    function setTokenURI(uint256 tokenId, TokenMetadata memory metadata) internal {
        tokenMetadata[tokenId] = metadata;
    }

    /**
     * @dev Mints an NFT for a specific product account.
     * @param productAccount The address representing the product.
     * @param description Description of the product.
     * @param name Commercial name of the product.
     * @param capacity Features of the product.
     * @notice The product account must be registered before minting.
     */
    function mint(
        address productAccount,
        string memory description,
        string memory name,
        string memory capacity
    ) public onlyCompanyAddress {

        require(productAccount != address(0), "Undefined address.");
        require(hasNFT[productAccount] == 0, "Token already assigned");
        require(isValidProduct[productAccount], "Unregistered product address");

        uint256 currentProductNFTId = productNFTId;
        productNFTId++;
        hasNFT[productAccount] = currentProductNFTId;

        _mint(productAccount, currentProductNFTId);

        tokenMetadata[currentProductNFTId] = TokenMetadata(
            productAccount,
            company_address,
            address(0), // product_owner
            name,
            description,
            capacity
        );
        
        emit ProductCertificateLog(
            currentProductNFTId,          
            company_address 
        );
    }

    /**
     * @dev Assigns ownership of a Product NFT to a customer.
     * @param customer_address The address of the new Product owner.
     * @notice Can only be called by the product account itself.
     */
    function setAddressOwner(address customer_address) public onlyProductAccount {
        uint256 NFTID = hasNFT[msg.sender];
        require(tokenMetadata[NFTID].product_owner == address(0), "The product owner has already been assigned");      
        tokenMetadata[NFTID].product_owner = customer_address;
    }

    /**
     * @dev Retrieves metadata for a product's NFT.
     * @param productAccount The address of the product.
     * @return Token metadata associated with the given address.
     * @notice The product must have an NFT assigned.
     */
    function getTokenData(address productAccount) public view returns (TokenMetadata memory) {
        require(hasNFT[productAccount] != 0, "This address does not have an associated token");
        uint256 NFTID = hasNFT[productAccount];
        return tokenMetadata[NFTID];
    }

    /**
     * @dev Retrieves the owner of a product NFT.
     * @param productAddress The address of the product.
     * @return The address of the product owner.
     */
    function getOwnerOf(address productAddress) public view returns (address) {
        return tokenMetadata[hasNFT[productAddress]].product_owner;
    }

    /**
     * @dev Retrieves the address of the manufacturing company.
     * @return The address of the manufacturing company (contract owner).
     */
    function getCompanyAddress() public view returns (address) {
        return company_address;
    }

    /**
     * @dev Ensures the token remains soulbound (non-transferable).
     * @param from The address attempting to transfer the token.
     * @notice The token can only be burned but not transferred.
     */
    function _beforeTokenTransfer(address from) internal pure {
        require(from == address(0), "Token is not transferable, can only be burned");
    }

    /**
     * @dev Overrides the `safeTransferFrom` function to prevent token transfers.
     * @param from The sender's address.
     * @param to The recipient's address.
     * @param tokenID The ID of the token to transfer.
     * @param data Additional data (if any).
     * @notice Transfers are disabled, making the token soulbound.
     */
    function safeTransferFrom(address from, address to, uint256 tokenID, bytes memory data) public override {
        _beforeTokenTransfer(from);
        super.safeTransferFrom(from, to, tokenID, data);
    }
}


