
"use client";
import { useState, useEffect } from "react";
import { BrowserProvider, Contract, parseUnits, formatUnits, ethers, Wallet } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function setFeePercent(uint256) external",
  "function feePercent() view returns (uint256)",
  "function owner() view returns (address)",
  "function transfer(address, uint256) external returns (bool)",
  "function transferOwnership(address) external",
];

export default function TokenDashboard() {
  // State management
  const [balance, setBalance] = useState<string>("0");
  const [fee, setFee] = useState<number>(0);
  const [newFee, setNewFee] = useState<number>(0);
  const [account, setAccount] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [owner, setOwner] = useState<string | null>(null);
  const [transferAddress, setTransferAddress] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");

  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Address copied to clipboard!");
    setTimeout(() => setSuccess(null), 2000);
  };

  useEffect(() => {
    // Check if ethereum is available
    if (!window.ethereum) {
      setError("Please install MetaMask!");
      return;
    }

    // Function to handle account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        fetchBalance(accounts[0], new BrowserProvider(window.ethereum));
      } else {
        setAccount(null);
        setBalance("0");
      }
    };

    // Function to fetch and set accounts
    const fetchAccounts = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accountList = await provider.send("eth_accounts", []);
        console.log(accountList);
        setAccounts(accountList);
        
        if (accountList.length > 0) {
          setAccount(accountList[0]);
          await Promise.all([
            fetchBalance(accountList[0], provider),
            fetchFee(provider),
            fetchOwner(provider),
          ]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch accounts");
      }
    };

    // Initial fetch of accounts
    fetchAccounts();

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    // Cleanup listener
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const switchAccount = async (selectedAccount: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      setAccount(selectedAccount);
      await Promise.all([
        fetchBalance(selectedAccount, provider),
        fetchFee(provider),
        fetchOwner(provider),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch account");
    } finally {
      setIsLoading(false);
    }
  };


  async function fetchBalance(userAddress: string, provider: BrowserProvider) {
    const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
    const balance = await contract.balanceOf(userAddress);
    console.log("Balance",balance);
    setBalance(ethers.formatUnits(balance, 18));
  }

  async function fetchFee(provider: BrowserProvider) {
    const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
    const currentFee = await contract.feePercent();
    setFee(Number(currentFee));
  }

  async function fetchOwner(provider: BrowserProvider) {
    const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
    const contractOwner = await contract.owner();
    setOwner(contractOwner);
  }

  async function updateFee() {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!window.ethereum) throw new Error("Wallet not connected");
      if (newFee > 100) throw new Error("Fee cannot exceed 1%");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = await contract.setFeePercent(newFee);
      await tx.wait();

      await fetchFee(provider);
      setSuccess("Fee updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fee update failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function transferTokens() {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!window.ethereum) throw new Error("Wallet not connected");
      if (!transferAddress) throw new Error("Recipient address is required");
      if (!transferAmount) throw new Error("Transfer amount is required");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

      const parsedAmount = parseUnits(transferAmount, 18);
      const tx = await contract.transfer(transferAddress, parsedAmount);
      await tx.wait();

      await fetchBalance(account!, provider);
      setSuccess(`Transferred ${transferAmount} tokens successfully!`);
      setTransferAddress("");
      setTransferAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Token transfer failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function transferOwnership() {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!window.ethereum) throw new Error("Wallet not connected");
      if (!transferAddress) throw new Error("New owner address is required");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = await contract.transferOwnership(transferAddress);
      await tx.wait();

      await fetchOwner(provider);
      setSuccess("Ownership transferred successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ownership transfer failed"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          {/* Account Sidebar */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center">
                {/* <Wallet className="mr-2 h-5 w-5" />  */}
                Metamask Accounts
              </CardTitle>
              <CardDescription>Select or switch accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  <p>No accounts connected</p>
                  <Button variant="outline" className="mt-2">
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((acc) => (
                    <Tooltip key={acc}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={account === acc ? "default" : "outline"}
                          className="w-full justify-between"
                          onClick={() => switchAccount(acc)}
                        >
                          <span>
                            {acc.substring(0, 6)}...{acc.substring(acc.length - 4)}
                          </span>
                          {account === acc && (
                            <span className="text-xs opacity-70">Current</span>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{acc}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Dashboard */}
          <div className="space-y-6">
            {/* Alerts */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Dashboard Card */}
            <Card>
              <CardHeader>
                <CardTitle>MyToken Dashboard</CardTitle>
                <CardDescription>Manage your tokens and settings</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Account Info */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Connected Wallet</h3>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => account && copyToClipboard(account)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy Address</TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-muted-foreground">
                      {account
                        ? `${account.substring(0, 6)}...${account.substring(
                            account.length - 4
                          )}`
                        : "Not connected"}
                    </p>

                    <Separator />

                    <div>
                      <h3 className="font-semibold mb-2">Token Details</h3>
                      <p>Balance: {balance} MTK</p>
                      <p>Current Fee: {fee / 100}%</p>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Contract Owner</h3>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => owner && copyToClipboard(owner)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy Owner Address</TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-muted-foreground">
                        {owner
                          ? `${owner.substring(0, 6)}...${owner.substring(
                              owner.length - 4
                            )}`
                          : "Loading..."}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-4">
                    {/* Fee Update Section */}
                    <Card className="bg-secondary/30">
                      <CardHeader>
                        <CardTitle>Update Fee</CardTitle>
                        <CardDescription>Set new transaction fee</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Input
                            type="number"
                            value={newFee}
                            onChange={(e) => setNewFee(Number(e.target.value))}
                            placeholder="Set new fee (max 1%)"
                            disabled={
                              isLoading || account?.toLowerCase() !== owner?.toLowerCase()
                            }
                            className="w-full"
                          />
                          <Button
                            onClick={updateFee}
                            className="w-full"
                            disabled={
                              isLoading || account?.toLowerCase() !== owner?.toLowerCase()
                            }
                          >
                            {isLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              "Set Fee"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Token Transfer Section */}
                    <Card className="bg-secondary/30">
                      <CardHeader>
                        <CardTitle>Transfer Tokens</CardTitle>
                        <CardDescription>Send tokens to another address</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Input
                            type="text"
                            value={transferAddress}
                            onChange={(e) => setTransferAddress(e.target.value)}
                            placeholder="Recipient Address"
                            disabled={isLoading}
                            className="w-full"
                          />
                          <Input
                            type="number"
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            placeholder="Amount to Transfer"
                            disabled={isLoading}
                            className="w-full"
                          />
                          <Button
                            onClick={transferTokens}
                            className="w-full"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              "Transfer Tokens"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ownership Transfer Section */}
                    {account?.toLowerCase() === owner?.toLowerCase() && (
                      <Card className="bg-destructive/10">
                        <CardHeader>
                          <CardTitle className="text-destructive">Transfer Ownership</CardTitle>
                          <CardDescription>
                            Caution: This will transfer contract ownership
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={transferOwnership}
                            variant="destructive"
                            className="w-full"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              "Transfer Ownership"
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

