import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { Email, Session } from '../types';
import { CONTRACT_ABI, CONTRACT_ADDRESS, KEY_REGISTRY_ABI, KEY_REGISTRY_ADDRESS, RPC_URL } from '../config/constants';
import { EmailService, KeyRegistryService} from '../services';
import { sessionService } from '../services/session';

const ONE_ETH = BigInt(1e18);
async function fundAddressIfHardhat(provider: ethers.JsonRpcProvider, address: string): Promise<void> {
  try {
    const balanceHex = '0x' + ONE_ETH.toString(16);
    await provider.send('hardhat_setBalance', [address, balanceHex]);
  } catch {
    // Not Hardhat or RPC doesn't support hardhat_setBalance; ignore
  }
}

/** Wallet or HDNodeWallet (both have address, privateKey, connect(provider)). */
type SignerLike = ethers.Wallet | ethers.HDNodeWallet;

interface UseWalletReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  contract: ethers.Contract | null;
  keyRegistry: ethers.Contract | null;
  userAddress: string;
  networkName: string;
  emails: Email[];
  /** Current session avatar URL (from public folder). */
  avatar: string | null;
  /** Up to 3 latest cached wallet addresses + avatar (for Connect modal). */
  cachedWallets: { address: string; avatar: string | null }[];
  connectWithWallet: (wallet: SignerLike) => Promise<void>;
  /** Reconnect using a cached wallet by address. */
  reconnectCachedWallet: (address: string) => Promise<void>;
  /** Remove a cached wallet (session) by address. */
  removeCachedWallet: (address: string) => void;
  disconnect: () => void;
  addEmail: (email: Email) => void;
  emailService: EmailService | undefined;
  keyRegistryService: KeyRegistryService | undefined;
}

export function useWallet(
  showToast: (message: string, type: 'success' | 'error') => void
): UseWalletReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [keyRegistry, setKeyRegistry] = useState<ethers.Contract | null>(null);
  const [userAddress, setUserAddress] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [keyRegistryService, setKeyRegistryService] = useState<KeyRegistryService>();
  const [emailService, setEmailService] = useState<EmailService>();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cachedWallets, setCachedWallets] = useState<{ address: string; avatar: string | null }[]>(() => {
    const list = sessionService.load();
    return list.map((s) => ({address: s.wallet.address, avatar: s.avatar ?? null }));
  });

  const connectWithWallet = useCallback(
    async (wallet: SignerLike) => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = wallet.connect(provider);
        const address = await signer.getAddress();

        // Fund new wallet on local Hardhat so it can pay for setPubKey and other txs
        await fundAddressIfHardhat(provider, address);

        const blockMail = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const keyReg = new ethers.Contract(KEY_REGISTRY_ADDRESS, KEY_REGISTRY_ABI, signer);
        const keyRegSvc = new KeyRegistryService(keyReg);
        const emailSvc = new EmailService(blockMail, keyRegSvc);
      
        setContract(blockMail);
        setKeyRegistry(keyReg);
        setUserAddress(address);
        setNetworkName('Local');
        setIsConnected(true);
        setKeyRegistryService(keyRegSvc);
        setEmailService(emailSvc);

        showToast('Wallet connected', 'success');
        
        try {
          let session = sessionService.find(address);
          if (!session) {
            const { pk, sk } = await keyRegSvc.init(address);

            session = sessionService.save({
              wallet: { address, pk: wallet.privateKey },
              keypair: { pk, sk },
            });
          }
          
          sessionService.current = session;

          const sessions = sessionService.load();
          setCachedWallets(sessions.map((s) => (
            { address: s.wallet.address, avatar: s.avatar ?? null })
          ));

          setAvatar(session.avatar ?? null);
        } catch {
          // ignore storage errors
        }
      } catch (err) {
        console.error('Connection failed:', err);
        showToast('Failed to connect. Is Hardhat running?', 'error');
      }
    },
    [showToast]
  );

  // Restore cached session on mount only if user did not explicitly disconnect
  useEffect(() => {
    const currentSession = sessionService.current; 
    if (!currentSession) return;

    setIsReconnecting(true);

    const wallet = new ethers.Wallet(currentSession.wallet.pk);
    connectWithWallet(wallet).finally(() => setIsReconnecting(false));
  }, [connectWithWallet]);

  // Reconnect using a cached session by address
  const reconnectCachedWallet = useCallback(
    async (address: string) => {
      const session = sessionService.find(address);
      if (!session) return;

      sessionService.current = session;
      setIsReconnecting(true);
      try {
        const wallet = new ethers.Wallet(session.wallet.pk);
        await connectWithWallet(wallet);
      } finally {
        setIsReconnecting(false);
      }
    },
    [connectWithWallet]
  );

  // Disconnect: clear app state, keep cache for "Reconnect with 0x...", but set flag so reload does not auto-restore
  const disconnect = useCallback(async () => {
    if (contract) {
      contract.removeAllListeners();
    }

    sessionService.current = null;

    setIsConnected(false);
    setContract(null);
    setKeyRegistry(null);
    setUserAddress('');
    setNetworkName('');
    setEmails([]);
    setAvatar(null);
  }, [contract]);

  // Add email
  const addEmail = useCallback((email: Email) => {
    setEmails(prev => [email, ...prev]);
  }, []);

  const removeCachedWallet = useCallback((address: string) => {
    sessionService.remove(address);

    const sessions = sessionService.load();
    setCachedWallets(sessions.map((s) => (
      { address: s.wallet.address, avatar: s.avatar ?? null })
    ));
  }, [])

  return {
    isConnected,
    isReconnecting,
    contract,
    keyRegistry,
    userAddress,
    networkName,
    emails,
    avatar,
    cachedWallets,
    connectWithWallet,
    reconnectCachedWallet,
    removeCachedWallet,
    disconnect,
    addEmail,
    emailService,
    keyRegistryService,
  };
}
