
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract MyToken is ERC20Capped, ERC20Burnable {
    address payable public owner;
    uint256 public blockReward;
    bool public isFrozen;
    uint256 public feePercent; // Phí có thể chỉnh sửa
    uint256 public rewardRate; // Phần trăm tăng mỗi giây (vd: 1e12 = 0.000000000001%)

    mapping(address => uint256) public lastClaimTime;

    constructor(uint256 cap, uint256 reward, uint256 _rewardRate) ERC20("MyToken", "MTK") ERC20Capped(cap * (10 ** decimals())) {
        owner = payable(msg.sender);
        _mint(owner, 5000000 * (10 ** decimals()));
        blockReward = reward * (10 ** decimals());
        isFrozen = false;
        feePercent = 10; // Mặc định 0.1%
        rewardRate = _rewardRate;
    }

    function _mintMinerReward() internal {
        _mint(block.coinbase, blockReward);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function claimReward() public {
        require(!isFrozen, "Contract is frozen and cannot be modified");
        uint256 timeElapsed = block.timestamp - lastClaimTime[msg.sender];
        uint256 reward = (balanceOf(msg.sender) * rewardRate * timeElapsed) / 1e18;
        _mint(msg.sender, reward);
        lastClaimTime[msg.sender] = block.timestamp;
    }

    function _update(address from, address to, uint256 value) internal virtual override(ERC20, ERC20Capped) {
        require(!isFrozen, "Contract is frozen and transfers are disabled");
        
        if (from != address(0) && to != address(0) && from != owner) {
            claimReward(); // Cập nhật phần thưởng trước khi giao dịch
            uint256 fee = (value * feePercent) / 10000;
            uint256 amountAfterFee = value - fee;
            super._update(from, owner, fee); // Chuyển phí cho owner
            super._update(from, to, amountAfterFee);
        } else {
            super._update(from, to, value);
        }
    }

    function setFeePercent(uint256 newFee) public onlyOwner {
        require(!isFrozen, "Contract is frozen and cannot be modified");
        require(newFee <= 100, "Fee cannot exceed 1%"); // Giới hạn tối đa 1%
        feePercent = newFee;
    }

    function setRewardRate(uint256 newRate) public onlyOwner {
        require(!isFrozen, "Contract is frozen and cannot be modified");
        rewardRate = newRate;
    }

    function freezeContract() public onlyOwner {
        isFrozen = true;
    }

    function setBlockReward(uint256 reward) public onlyOwner {
        require(!isFrozen, "Contract is frozen and cannot be modified");
        blockReward = reward * (10 ** decimals());
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }
}
