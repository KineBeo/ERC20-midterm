# ERC20 Midterm Project

This project is an implementation of an ERC20 token on the Ethereum blockchain. It is designed as part of a midterm assignment to demonstrate understanding of blockchain concepts and smart contract development.

## Features

- **ERC20 Standard Compliance**: Implements the standard ERC20 functions and events.
- **Custom Token**: Includes a custom token name, symbol, and initial supply.
- **Minting and Burning**: Allows minting and burning of tokens (if applicable).
- **Secure and Tested**: Follows best practices for security and includes unit tests.
- **Reward System**: Automatically rewards token holders over time.
- **Transaction Fee**: Includes a configurable transaction fee.

## Prerequisites
√
- Node.js and npm installed
- Hardhat for smart contract development
- MetaMask wallet for interaction

---

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-repo/ERC20-midterm.git
    cd ERC20-midterm
    ```

2. Install dependencies for both smart contract and frontend:
    ```bash
    # Install dependencies for smart contract
    cd ERC20
    npm install

    # Install dependencies for frontend
    cd ../fe/frontend-my-token
    npm install
    ```

3. Compile the smart contracts:
    ```bash
    cd ../ERC20
    npx hardhat compile
    ```

---

## Usage

### Deploy the Smart Contract
1. Run the Hardhat local network: 
    ```bash
    npx hardhat node
    ```

2. Deploy the contract to a local blockchain:
    ```bash
    npx hardhat run scripts/deploy.js --network localhost
    ```
3. Then terminal will show 20 accounts with 10000 ETH
---

### Run the Frontend

1. Start the development server:
    ```bash
    cd fe/frontend-my-token
    npm run dev
    ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the application.

---

## Testing

### Run Smart Contract Tests
Run the test suite to ensure the contract behaves as expected:
```bash
cd ERC20
npx hardhat test