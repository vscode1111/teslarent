// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CarBarContract is
    Initializable,
    ERC1155Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    function initialize(address usdtTokenAddress) public initializer {
        __ERC1155_init("");
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _usdtToken = IERC20(usdtTokenAddress);
    }

    IERC20 private _usdtToken;

    uint8 public constant TOKEN_UNIT = 1;
    uint32 public constant TIME_GAP = 72 * 3600;

    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _collectionCounter;

    mapping(uint32 => CollectionItem) private _collectionItems;
    mapping(uint32 => CountersUpgradeable.Counter) private _collectionCounters;
    mapping(uint32 => mapping(uint32 => TokenItem)) private _tokenItems;

    struct CollectionItem {
        uint32 collectionId;
        string name;
        string url;
        uint32 tokenCount;
        uint256 price;
        uint32 expiryDate;
    }

    struct TokenItem {
        uint32 tokenId;
        address owner;
        uint32 expiryDate;
        bool sold;
    }

    event CollectionItemCreated(
        uint32 indexed tokenId,
        string name,
        string url,
        uint32 tokenCount,
        uint256 price,
        uint256 expiryDate
    );

    event TokenSold(
        uint32 indexed collectionId,
        uint32 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        uint32 timestamp
    );

    modifier onlyActualCollection(uint32 collectionId) {
        CollectionItem memory collection = fetchCollection(collectionId);
        require(
            block.timestamp <= collection.expiryDate,
            "Collection expiration must be greater than the current time"
        );
        _;
    }

    modifier onlyActualToken(
        uint32 collectionId,
        uint32 tokenId,
        uint32 timeOffset
    ) {
        TokenItem memory token = fetchToken(collectionId, tokenId);
        require(
            token.expiryDate == 0 || block.timestamp <= token.expiryDate - timeOffset,
            "Token expiration must be more than a certain period from the current time"
        );
        _;
    }

    modifier onlyTokenOnwer(
        address owner,
        uint32 collectionId,
        uint32 tokenId
    ) {
        TokenItem memory token = fetchToken(collectionId, tokenId);
        require(token.owner == owner, "You must be owner of this token");
        _;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    function getUSDTaddress() external view returns (address) {
        return address(_usdtToken);
    }

    function createCollection(
        string memory name,
        string memory url,
        uint32 tokenCount,
        uint256 price,
        uint32 expiryDate
    ) external onlyOwner returns (uint32) {
        uint32 collectionId = uint32(_collectionCounter.current());
        _mint(_msgSender(), collectionId, tokenCount * TOKEN_UNIT, "");
        createCollectionItem(collectionId, name, url, tokenCount, price, expiryDate);
        _createItemTokens(collectionId, tokenCount);
        _collectionCounter.increment();
        return collectionId;
    }

    function updateCollection(
        uint32 collectionId,
        string memory name,
        string memory url
    ) external onlyOwner returns (CollectionItem memory) {
        CollectionItem memory collection = fetchCollection(collectionId);
        collection.name = name;
        collection.url = url;
        return
            createCollectionItem(
                collection.collectionId,
                collection.name,
                collection.url,
                collection.tokenCount,
                collection.price,
                collection.expiryDate
            );
    }

    function createCollectionItem(
        uint32 collectionId,
        string memory name,
        string memory url,
        uint32 tokenCount,
        uint256 price,
        uint32 expiryDate
    ) private returns (CollectionItem memory) {
        require(price > 0, "Price must be at least 1");
        _collectionItems[collectionId] = CollectionItem(collectionId, name, url, tokenCount, price, expiryDate);
        emit CollectionItemCreated(collectionId, name, url, tokenCount, price, expiryDate);
        return _collectionItems[collectionId];
    }

    function getCollectionCount() public view returns (uint32) {
        return uint32(_collectionCounter.current());
    }

    function _createItemTokens(uint32 collectionId, uint32 tokenCount) private {
        address owner = _msgSender();
        uint32 expiryDate = 0;
        bool sold = false;
        for (uint32 i = 0; i < tokenCount; i++) {
            createTokenItem(collectionId, i, owner, expiryDate, sold);
        }
    }

    function createTokenItem(
        uint32 collectionId,
        uint32 tokenId,
        address owner,
        uint32 expiryDate,
        bool sold
    ) private returns (TokenItem memory) {
        TokenItem memory token = TokenItem(tokenId, owner, expiryDate, sold);
        _tokenItems[collectionId][tokenId] = token;
        return token;
    }

    function updateToken(
        uint32 collectionId,
        uint32 tokenId,
        uint32 expiryDate
    ) external onlyOwner returns (TokenItem memory) {
        TokenItem storage token = _tokenItems[collectionId][tokenId];
        token.expiryDate = expiryDate;
        return token;
    }

    function buyToken(uint32 collectionId) external nonReentrant onlyActualCollection(collectionId) {
        CollectionItem memory collection = fetchCollection(collectionId);
        uint256 amount = collection.price;
        address owner = address(owner());
        address sender = _msgSender();

        require(_usdtToken.allowance(sender, address(this)) >= amount, "User must allow to use of funds");
        require(_usdtToken.balanceOf(sender) >= amount, "User must have funds");
        require(balanceOf(owner, collectionId) >= 1, "The collection must have at least 1 available token");

        CountersUpgradeable.Counter storage counter = _collectionCounters[collectionId];

        uint32 tokenId = uint32(counter.current());
        TokenItem storage token = _tokenItems[collectionId][tokenId];

        _transferToken(token.owner, sender, collectionId, tokenId);

        counter.increment();

        _usdtToken.transferFrom(sender, address(this), amount);

        emit TokenSold(collectionId, tokenId, owner, sender, amount, uint32(block.timestamp));
    }

    function _transferToken(
        address from,
        address to,
        uint32 collectionId,
        uint32 tokenId
    ) private returns (TokenItem memory) {
        TokenItem storage token = _tokenItems[collectionId][tokenId];
        token.owner = to;
        token.sold = true;
        _safeTransferFrom(from, to, collectionId, TOKEN_UNIT, "");
        return token;
    }

    function transferToken(
        address from,
        address to,
        uint32 collectionId,
        uint32 tokenId
    )
        public
        onlyTokenOnwer(from, collectionId, tokenId)
        onlyActualCollection(collectionId)
        onlyActualToken(collectionId, tokenId, TIME_GAP)
        returns (TokenItem memory)
    {
        return _transferToken(from, to, collectionId, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) public override {
        require(amount == TOKEN_UNIT, "Amount must be 1");
        transferToken(from, to, uint32(id), uint32(bytes4(data)));
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        require(
            ids.length == amounts.length && data.length == amounts.length * 4,
            "Length of ids, amounts and data should be the correct"
        );
        for (uint32 i = 0; i < ids.length; i++) {
            uint32 offset = i * 4;
            bytes memory _data = bytes.concat(data[0 + offset], data[1 + offset], data[2 + offset], data[3 + offset]);
            safeTransferFrom(from, to, ids[i], amounts[i], _data);
        }
    }

    function withdraw(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "Incorrect address");
        require(_usdtToken.balanceOf(address(this)) >= amount, "Contract must have sufficient funds");

        _usdtToken.transfer(to, amount);
    }

    function fetchCollection(uint32 collectionId) public view returns (CollectionItem memory) {
        CollectionItem memory collection = _collectionItems[collectionId];
        return collection;
    }

    function fetchCollections() external view returns (CollectionItem[] memory) {
        uint32 collectionItemCount = uint32(_collectionCounter.current());
        CollectionItem[] memory collections = new CollectionItem[](collectionItemCount);
        for (uint32 i = 0; i < collectionItemCount; i++) {
            collections[i] = _collectionItems[i];
        }
        return collections;
    }

    function fetchTokens(uint32 collectionId) external view returns (TokenItem[] memory) {
        CollectionItem memory collection = fetchCollection(collectionId);
        uint32 tokenItemCount = collection.tokenCount;
        TokenItem[] memory tokens = new TokenItem[](tokenItemCount);
        for (uint32 i = 0; i < tokenItemCount; i++) {
            tokens[i] = _tokenItems[collectionId][i];
        }
        return tokens;
    }

    function fetchToken(uint32 collectionId, uint32 tokenId) public view returns (TokenItem memory) {
        return _tokenItems[collectionId][tokenId];
    }
}
