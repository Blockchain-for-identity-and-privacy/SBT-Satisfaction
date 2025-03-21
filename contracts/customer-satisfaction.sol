// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "./utils/ERC721_lite.sol";
import "./Company.sol"; // Update to the correct path if necessary

/**
 * @title Customer Satisfaction
 * @dev Smart contract for issuing soulbound ERC721 tokens to certify customer satisfaction.
 * @author Andrea Tiddia, Andrea Pinna, Maria Ilaria Lunesu, Roberto Tonelli - University of Cagliari 
 * @notice This contract allows customers to issue a satisfaction certificate to a winery after purchasing a bottle.
 */
 
contract Customer_Satisfaction is ERC721_lite {

    uint256 satisfNFTId = 1; // Token ID counter for the contract

    mapping(address => uint256) public mintedSatisfToken; // Tracks if a bottle already has a satisfaction token
    mapping(uint256 => TokenMetadata) public tokenMetadata; // Maps metadata to each token in the system
    mapping(address => uint256) public companyCertificateCount; // Tracks the number of tokens minted for each company

    /**
     * @dev Emitted when a satisfaction certificate is issued.
     * @param tokenId The ID of the issued token.
     * @param company_address The address of the company receiving the certificate.
     * @param certificateIssuer The customer who issued the certificate.
     */
    event SatisfactionCertificateLog(
        uint256 indexed tokenId,
        address indexed company_address,
        address certificateIssuer
    );

    /**
     * @dev Struct representing the metadata associated with a satisfaction token.
     * @param bottle_owner The address of the customer who owns the bottle.
     * @param company_Address The address of the wine company that issued the bottle.
     * @param bottle_address The address of the bottle associated with the certificate.
     */
    struct TokenMetadata {
        address bottle_owner;
        address company_Address;
        address bottle_address;
    }

    /**
     * @dev Constructor initializing the ERC721 token with a name and symbol.
     * Token Name: "Customer Satisfaction"
     * Token Symbol: "STF"
     */
    constructor() ERC721_lite("Customer_satisfaction", "STF") {}

    /**
     * @dev Internal function to associate metadata with a given token ID.
     * @param tokenID The ID of the token.
     * @param metadata The metadata struct containing relevant information.
     */
    function setTokenURI(uint256 tokenID, TokenMetadata memory metadata) internal {
        tokenMetadata[tokenID] = metadata;
    }

    /**
     * @notice Issues a satisfaction NFT to the company associated with the bottle.
     * @dev A customer can mint a satisfaction NFT only if they are the bottle's owner.
     * @param companyContract The address of the company's smart contract.
     * @param bottleAddress The address of the bottle for which the certificate is issued.
     */
    function mint(address companyContract, address bottleAddress) public {
        require(mintedSatisfToken[bottleAddress] == 0, "Token already issued for this bottle");

        Company cc = Company(companyContract);
        require(cc.getOwnerOf(bottleAddress) == msg.sender, "You are not the owner of this bottle");

        address companyAddress = cc.getCompanyAddress();

        uint256 currentSatisfNFTId = satisfNFTId;
        satisfNFTId++;
        mintedSatisfToken[bottleAddress] = currentSatisfNFTId;

        _mint(companyAddress, currentSatisfNFTId); // Assign a new token to the company

        tokenMetadata[currentSatisfNFTId] = TokenMetadata(
            msg.sender,     // Customer (bottle owner)
            companyAddress, // Wine company
            bottleAddress   // Product (bottle)
        );

        emit SatisfactionCertificateLog(
            currentSatisfNFTId,
            companyAddress,
            msg.sender
        );
    }

    /**
     * @notice Retrieves the next available token ID.
     * @return The next token ID to be assigned.
     */
    function getNextTokenID() public view returns (uint256) {
        return satisfNFTId;
    }

    /**
     * @notice Retrieves the number of satisfaction certificates issued for a given company.
     * @param companyAddress The address of the company.
     * @return The number of certificates associated with the company.
     */
    function getNumberOfCertificatesByCompany(address companyAddress) public view returns (uint256) {
        return companyCertificateCount[companyAddress];
    }

    /**
     * @notice Retrieves the metadata associated with a specific certificate.
     * @dev Function is currently not returning data; should be updated to return `TokenMetadata`.
     * @param tokenID The ID of the certificate token.
     */
    function getCertificatesMetadata(uint256 tokenID) public view {
        // return tokenMetadata[tokenID]; // Uncomment to enable metadata retrieval
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
