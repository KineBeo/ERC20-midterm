
import React, { useState } from 'react';
import { 
  WagmiProvider, 
  useAccount, 
  useBalance, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ABI for the MyToken contract (ensure this matches your contract exactly)
const MyTokenABI = [
  {
    "inputs": [],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "newFee", "type": "uint256"}
    ],
    "name": "setFeePercent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feePercent",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address payable", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Configuration for wagmi
const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected()
  ],
  transports: {
    [mainnet.id]: http()
  }
});

// Contract address - replace with your deployed contract address
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const;

const MyTokenInterface: React.FC = () => {
  const [transferAddress, setTransferAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [newFee, setNewFee] = useState('');

  // Account and connection hooks
  const { 
    address, 
    isConnected, 
    connector 
  } = useAccount();

  // Contract read hooks
  const { data: balance } = useBalance({
    address,
    token: CONTRACT_ADDRESS,
  });

  const { data: feePercent } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyTokenABI,
    functionName: 'feePercent',
  });

  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyTokenABI,
    functionName: 'owner',
  });

  // Write contract hooks
  const { 
    writeContract: transferTokens, 
    isPending: isTransferPending 
  } = useWriteContract();

  const { 
    writeContract: claimRewards, 
    isPending: isClaimPending 
  } = useWriteContract();

  const { 
    writeContract: updateFee, 
    isPending: isFeeUpdatePending 
  } = useWriteContract();

  // Handle token transfer
  const handleTransfer = () => {
    if (!transferAddress || !transferAmount) {
      alert('Please enter recipient and amount');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(transferAddress)) {
      alert('Invalid Ethereum address');
      return;
    }

    transferTokens({
      address: CONTRACT_ADDRESS,
      abi: MyTokenABI,
      functionName: 'transfer',
      args: [transferAddress as `0x${string}`, BigInt(transferAmount)]
    });
  };

  // Handle reward claim
  const handleClaimRewards = () => {
    claimRewards({
      address: CONTRACT_ADDRESS,
      abi: MyTokenABI,
      functionName: 'claimReward'
    });
  };

  // Handle fee update (owner only)
  const handleUpdateFee = () => {
    if (!newFee) {
      alert('Please enter new fee percentage');
      return;
    }

    updateFee({
      address: CONTRACT_ADDRESS,
      abi: MyTokenABI,
      functionName: 'setFeePercent',
      args: [BigInt(Number(newFee) * 100)]
    });
  };

  return (
    <WagmiProvider config={config}>
      <div className="p-4 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>MyToken Interface</CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <Button 
                onClick={() => connector?.connect()} 
                className="w-full mb-4"
              >
                Connect Wallet
              </Button>
            ) : (
              <>
                <div className="mb-4">
                  <p>Connected Account: {address}</p>
                  <p>Balance: {balance?.formatted || '0'} MTK</p>
                  <p>Current Fee: {feePercent ? `${Number(feePercent) / 100}%` : 'Loading...'}</p>
                  <p>Contract Owner: {owner}</p>
                </div>

                {/* Transfer Tokens */}
                <div className="mb-4">
                  <Label>Transfer Tokens</Label>
                  <Input 
                    placeholder="Recipient Address" 
                    value={transferAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferAddress(e.target.value)}
                    className="mb-2"
                  />
                  <Input 
                    placeholder="Amount" 
                    value={transferAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferAmount(e.target.value)}
                    className="mb-2"
                  />
                  <Button 
                    onClick={handleTransfer} 
                    disabled={isTransferPending}
                    className="w-full"
                  >
                    {isTransferPending ? 'Transferring...' : 'Transfer'}
                  </Button>
                </div>

                {/* Claim Rewards */}
                <Button 
                  onClick={handleClaimRewards} 
                  disabled={isClaimPending}
                  className="w-full mb-4"
                >
                  {isClaimPending ? 'Claiming...' : 'Claim Rewards'}
                </Button>

                {/* Owner Fee Update */}
                {address?.toLowerCase() === owner?.toLowerCase() && (
                  <div>
                    <Label>Update Fee Percentage (Max 1%)</Label>
                    <Input 
                      placeholder="New Fee %" 
                      value={newFee}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFee(e.target.value)}
                      className="mb-2"
                    />
                    <Button 
                      onClick={handleUpdateFee} 
                      disabled={isFeeUpdatePending}
                      className="w-full"
                    >
                      {isFeeUpdatePending ? 'Updating...' : 'Update Fee'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </WagmiProvider>
  );
};

export default MyTokenInterface;