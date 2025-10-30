import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { requestWalletChallenge, verifyWalletSignature, getSignature, getWallet, getUserContract } from "../services/authService";

export default function Login() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("");
  const [wallet, setWallet] = useState("");
  const [userAccounts, setUserAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const walletCallMade = useRef(false);

  const client_id = params.get("client_id");
  const redirect_uri = params.get("redirect_uri");

  const state = params.get("state");
  // response_type and scope are implicit in our demo and not needed client-side here
  const code_challenge = params.get("code_challenge") || "";
  const code_challenge_method = params.get("code_challenge_method") || "S256";


  useEffect(() => {
    
    const getWalletDetails = async () => {
      // Prevent multiple calls using ref
      if (walletCallMade.current || isLoading === false) {
        console.log("Wallet call already made or not loading, skipping...");
        return;
      }
      
      walletCallMade.current = true;
      console.log("Making wallet call...");
      
      const wallet = await getWallet();
      
      if (wallet?.accountAddress) {
        console.log("Wallet found, getting contract...");
        const contract = getUserContract();
        console.log("Contract:", contract);
        
        try {
          console.log("Calling getUserDetailsForWallet with wallet:", wallet);
          const getUserDetailsForWallet = await contract.methods.getUserDetailsForWallet(wallet?.accountAddress).call();
          console.log("getUserDetailsForWallet >>>>>>>>>>", getUserDetailsForWallet);
                    
          const accounts = getUserDetailsForWallet.map((user, index) => ({
            id: index,
            userId: user.userId.toString(),
            userName: user.userName,
            domain: user.domain,
            name: user.name,
            email: user.userName, // userName is the email
            status: user.status,
            creationDate: user.creationDate.toString()
          })).filter(account => account.status); // Only show active accounts
          
          setUserAccounts(accounts);
          setWallet(wallet);
          setIsLoading(false);
        } catch (error) {
          console.error("Error calling getUserDetailsForWallet:", error);
        }
      } else {
        console.log("No wallet found");
      }
    }
    
    getWalletDetails();
  }, []); 


  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
  };

  const handleLogin = async () => {
    if (!selectedAccount) {
      setStatus("Please select an account to continue.");
      return;
    }

    setStatus("Preparing authentication...");
    
    try {

      setStatus("Requesting challenge...");
     
      const { challenge } = await requestWalletChallenge({
        client_id,
        redirect_uri,
        state,
        code_challenge,
        code_challenge_method
      });

      setStatus("Waiting for wallet signature...");
      const signature = await getSignature(challenge);
      if (!signature) {
        setStatus("Signature rejected or wallet unavailable.");
        return;
      }

      setStatus("Verifying...");
      console.log("walletAccountDetails >>>>>>>>>>", wallet?.publicKey);
      console.log("wallet?.publicKey >>>>>>>>>>", wallet);
      const { code } = await verifyWalletSignature({
        walletAddress: wallet?.accountAddress,
        publicKey: wallet?.publicKey,
        signature,
        client_id,
        redirect_uri,
        state,
      });

      setStatus("Redirecting...");
      window.location.href = `${redirect_uri}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`;
    } catch (error) {
      console.error("Login error:", error);
      setStatus("Authentication failed. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gray-50">
        <div className="bg-white p-8 shadow-lg rounded-lg w-96 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your accounts...</p>
        </div>
      </div>
    );
  }

  if (userAccounts.length === 0) {
    return (
      <div className="h-screen flex justify-center items-center bg-gray-50">
        <div className="bg-white p-8 shadow-lg rounded-lg w-96 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Accounts Found</h2>
          <p className="text-gray-600 mb-4">No active accounts found for this wallet address.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex justify-center items-center bg-gray-50">
      <div className="bg-white p-8 shadow-lg rounded-lg w-[30rem] max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Choose an Account</h1>
          <p className="text-gray-600">Select the account you want to use to sign in</p>
        </div>

        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {userAccounts.map((account) => (
            <div
              key={account.id}
              onClick={() => handleAccountSelect(account)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedAccount?.id === account.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedAccount?.id === account.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedAccount?.id === account.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{account.name}</p>
                      <p className="text-sm text-gray-500 truncate">{account.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={!selectedAccount}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            selectedAccount
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selectedAccount ? 'Continue with Selected Account' : 'Select an Account to Continue'}
        </button>

        {status && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 text-center">{status}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to the terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}
