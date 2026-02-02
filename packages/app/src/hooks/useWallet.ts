import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { Email, Session } from '../types';
import { pickRandomAvatar } from '../config/avatars';
import { CONTRACT_ABI, CONTRACT_ADDRESS, KEY_REGISTRY_ABI, KEY_REGISTRY_ADDRESS, RPC_URL } from '../config/constants';
import { EmailService, KeyRegistryService , storage} from '../services';

const MAX_CACHED_SESSIONS = 3;

function getCachedSessionsList(): Session[] {
  const raw = storage.get('sessions', 'list');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s: unknown): s is Session =>
        s != null &&
        typeof s === 'object' &&
        'wallet' in s &&
        typeof (s as Session).wallet === 'object' &&
        typeof (s as Session).wallet?.address === 'string' &&
        typeof (s as Session).wallet?.pk === 'string' &&
        'keypair' in s &&
        typeof (s as Session).keypair === 'object' &&
        typeof (s as Session).keypair?.pk === 'string' &&
        typeof (s as Session).keypair?.sk === 'string'
    );
  } catch {
    return [];
  }
} 

function writeKeypairFromSession(address: string, session: Session): void {
  try {
    const pk = JSON.parse(session.keypair.pk) as number[];
    const sk = JSON.parse(session.keypair.sk) as number[];
    storage.set('keypair', address, JSON.stringify({ pk, sk }));
  } catch {
    // ignore
  }
}

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
  disconnect: () => void;
  addEmail: (email: Email) => void;
  emailService: EmailService | null;
  keyRegistryService: KeyRegistryService | null;
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
  const [keyRegistryService, setKeyRegistryService] = useState<KeyRegistryService | null>(null);
  const [emailService, setEmailService] = useState<EmailService | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cachedWallets, setCachedWallets] = useState<{ address: string; avatar: string | null }[]>(() => {
    const list = getCachedSessionsList();
    return list.map((s) => ({ address: s.wallet.address, avatar: s.avatar ?? null })).slice(0, MAX_CACHED_SESSIONS);
  });
  const hasRestoredRef = useRef(false);


  const connectWithWallet = useCallback(
    async (wallet: SignerLike) => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = wallet.connect(provider);
        const address = await signer.getAddress();

        // Fund new wallet on local Hardhat so it can pay for setPubKey and other txs
        await fundAddressIfHardhat(provider, address);

        const blockMail = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const keyReg = KEY_REGISTRY_ADDRESS
          ? new ethers.Contract(KEY_REGISTRY_ADDRESS, KEY_REGISTRY_ABI, signer)
          : null;

        setContract(blockMail);
        setKeyRegistry(keyReg);
        setUserAddress(address);
        setNetworkName('Hardhat Local');
        setIsConnected(true);

        const keyRegSvc = keyReg ? new KeyRegistryService(keyReg) : null;
        const emailSvc = keyRegSvc ? new EmailService(blockMail, keyRegSvc) : null;
        setKeyRegistryService(keyRegSvc);
        setEmailService(emailSvc);

        showToast('Wallet connected', 'success');

        if (keyRegSvc) {
          await keyRegSvc.init(address);
        }

        // Cache session (wallet + keypair) under key "sessions"
        try {
          const keypairRaw = storage.get('keypair', address);
          if (keypairRaw) {
            const { pk, sk } = JSON.parse(keypairRaw) as { pk: number[]; sk: number[] };
            let list = getCachedSessionsList();
            const existing = list.find((s) => s.wallet.address.toLowerCase() === address.toLowerCase());
            const session: Session = {
              wallet: { address, pk: wallet.privateKey },
              keypair: { pk: JSON.stringify(pk), sk: JSON.stringify(sk) },
              avatar: existing?.avatar ?? pickRandomAvatar(),
            };
            list = list.filter((s) => s.wallet.address.toLowerCase() !== address.toLowerCase());
            list.unshift(session);
            list = list.slice(0, MAX_CACHED_SESSIONS);
            storage.set('sessions', 'list', JSON.stringify(list));
            setCachedWallets(list.map((s) => ({ address: s.wallet.address, avatar: s.avatar ?? null })));
            setAvatar(session.avatar ?? null);
          }
          storage.del('disconnected', 'key');
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
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    if (storage.get('disconnected', 'key') === 'true') return;

    const list = getCachedSessionsList();
    if (list.length === 0) return;

    const first = list[0];
    if (!first?.wallet?.pk) return;

    writeKeypairFromSession(first.wallet.address, first);
    setIsReconnecting(true);
    const wallet = new ethers.Wallet(first.wallet.pk);
    connectWithWallet(wallet).finally(() => setIsReconnecting(false));
  }, [connectWithWallet]);

  // Reconnect using a cached session by address
  const reconnectCachedWallet = useCallback(
    async (address: string) => {
      const list = getCachedSessionsList();
      const session = list.find((s) => s.wallet.address.toLowerCase() === address.toLowerCase());
      if (!session?.wallet?.pk) return;
      writeKeypairFromSession(session.wallet.address, session);
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
    storage.set('disconnected', 'key', 'true');

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
    disconnect,
    addEmail,
    emailService,
    keyRegistryService,
  };
}
