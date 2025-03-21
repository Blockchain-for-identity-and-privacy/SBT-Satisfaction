// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "./utils/ERC721_lite.sol";

/**
 * @title Company
 * @author Andrea Tiddia, Andrea Pinna, Maria Ilaria Lunesu, Roberto Tonelli - University of Cagliari 
 * @dev Smart contract that issues soulbound ERC721 tokens associated with bottles added to the system.
 */
 
contract Company is ERC721_lite {
    /// @notice Address of the contract owner (winery)
    address public company_address;

    /// @notice Token ID counter for minted NFTs
    uint256 public bottleNFTId = 1;

    /// @notice Mapping to track addresses that already have an associated NFT in the system
    mapping(address => uint256) private hasNFT;

    /// @notice Mapping to associate metadata with each token in the system
    mapping(uint256 => TokenMetadata) public tokenMetadata;

    /// @notice Mapping to verify that a bottle address is valid
    mapping(address => bool) public isValidBottle;

    /// @dev Struct used to store NFT metadata
    struct TokenMetadata {
        address address_company; // Address of the winery
        address bottle_owner; // Owner of the bottle NFT
        string name; // Name of the wine
        string description; // Description of the wine
        string capacity; // Capacity of the bottle
    }

    /// @dev Modifier to restrict function access to only the winery (contract owner)
    modifier onlyCompanyAddress() {
        require(msg.sender == company_address, "Only the winery can call this function");
        _;
    }

    /// @dev Modifier to restrict function access to only registered bottle accounts with an associated NFT
    modifier onlyBottleAccount() {
        require(isValidBottle[msg.sender] == true, "Only bottle accounts can call this function");
        require(hasNFT[msg.sender] != 0, "Only bottle accounts with the associated company's SBT can call this function");
        _;
    }

    /**
     * @dev Constructor function that initializes the ERC721 contract.
     * @notice The contract deployer (winery) is set as the contract owner.
     */
    constructor() ERC721_lite("Wine_Company", "WINC_TKN") {
        company_address = msg.sender;
    }

    /// @notice Event emitted when a new bottle account is registered
    event WineBottleRegistered(address wineBottleAddress);

    /// @notice Event emitted when an NFT is minted for a bottle
    /// @param tokenId ID of the associated token
    /// @param company_address Address of the winery that owns the NFT
    event BottleCertificateLog(
        uint256 indexed tokenId,
        address indexed company_address
    );

    /**
     * @dev Registers an externally generated address for a bottle in the system.
     * @param bottleAddress Address of the bottle account.
     * @return The registered bottle address.
     * @notice The address must be unique and cannot be the winery's address.
     */
    function registerBottleAddress(address bottleAddress) public onlyCompanyAddress returns (address) {   
        require(bottleAddress != address(0), "Invalid address");
        require(!isValidBottle[bottleAddress], "Address already in use");
        require(bottleAddress != company_address, "A bottle cannot be associated with the winery's address");
        isValidBottle[bottleAddress] = true;
        return bottleAddress;
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
     * @dev Mints an NFT for a specific bottle account.
     * @param bottleAccount The address representing the bottle.
     * @param description Description of the wine.
     * @param name Name of the wine.
     * @param capacity Capacity of the bottle.
     * @notice The bottle account must be registered before minting.
     */
    function mint(
        address bottleAccount, 
        string memory description, 
        string memory name, 
        string memory capacity
    ) public onlyCompanyAddress {
              
        require(bottleAccount != address(0), "Undefined address.");
        require(hasNFT[bottleAccount] == 0, "Token already assigned");
        require(isValidBottle[bottleAccount], "Unregistered bottle address");
        
        uint256 currentbottleNFTId = bottleNFTId;
        bottleNFTId++;
        hasNFT[bottleAccount] = currentbottleNFTId;

        _mint(bottleAccount, currentbottleNFTId);
        
        tokenMetadata[currentbottleNFTId] = TokenMetadata(
            company_address,
            address(0), // bottle_owner
            name,
            description,
            capacity
        );
        
        emit BottleCertificateLog(
            currentbottleNFTId,          
            company_address 
        );
    }

    /**
     * @dev Assigns ownership of a bottle NFT to a customer.
     * @param customer_address The address of the new bottle owner.
     * @notice Can only be called by the bottle account itself.
     */
    function setAddressOwner(address customer_address) public onlyBottleAccount {
        uint256 NFTID = hasNFT[msg.sender];
        require(tokenMetadata[NFTID].bottle_owner == address(0), "The bottle owner has already been assigned");      
        tokenMetadata[NFTID].bottle_owner = customer_address;
    }

    /**
     * @dev Retrieves metadata for a bottle's NFT.
     * @param bottleAccount The address of the bottle.
     * @return Token metadata associated with the given address.
     * @notice The bottle must have an NFT assigned.
     */
    function getTokenData(address bottleAccount) public view returns (TokenMetadata memory) {
        require(hasNFT[bottleAccount] != 0, "This address does not have an associated token");
        uint256 NFTID = hasNFT[bottleAccount];
        return tokenMetadata[NFTID];
    }

    /**
     * @dev Retrieves the owner of a bottle NFT.
     * @param bottleAddress The address of the bottle.
     * @return The address of the bottle owner.
     */
    function getOwnerOf(address bottleAddress) public view returns (address) {
        return tokenMetadata[hasNFT[bottleAddress]].bottle_owner;
    }

    /**
     * @dev Retrieves the address of the winery.
     * @return The address of the winery (contract owner).
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

