import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

/** Wallet or HDNodeWallet (both have address, privateKey, connect). */
type SignerLike = ethers.Wallet | ethers.HDNodeWallet;

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseWallet: (wallet: SignerLike) => Promise<void>;
}

export function CreateWalletModal({
  isOpen,
  onClose,
  onUseWallet,
}: CreateWalletModalProps) {
  const [wallet, setWallet] = useState<SignerLike | null>(null);
  const [revealPrivateKey, setRevealPrivateKey] = useState(false);
  const [copied, setCopied] = useState<'mnemonic' | 'address' | 'privateKey' | null>(null);

  // Reset wallet state when modal opens
  useEffect(() => {
    if (isOpen) {
      setWallet(null);
      setRevealPrivateKey(false);
      setCopied(null);
    }
  }, [isOpen]);

  const handleGenerate = useCallback(() => {
    // HDNodeWallet gives us mnemonic.phrase; we use it as signer (has address, privateKey, connect)
    const w = ethers.HDNodeWallet.createRandom();
    console.log('Generated new wallet:', w.address);
    setWallet(w);
    setRevealPrivateKey(false);
    setCopied(null);
  }, []);

  const handleCopy = useCallback(async (value: string, kind: 'mnemonic' | 'address' | 'privateKey') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  }, []);

  const handleUseWallet = useCallback(async () => {
    if (wallet) {
      console.log('Using wallet with address:', wallet.address);
      try {
        await onUseWallet(wallet);
        onClose();
      } catch (error) {
        console.error('Failed to use wallet:', error);
        // Don't close modal on error - let user see what happened
      }
    } else {
      console.error('No wallet to use!');
    }
  }, [wallet, onUseWallet, onClose]);

  const handleClose = useCallback(() => {
    setWallet(null);
    setRevealPrivateKey(false);
    setCopied(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const mnemonic =
    wallet && 'mnemonic' in wallet && wallet.mnemonic
      ? wallet.mnemonic.phrase
      : '';

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-[60] animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-dark-card rounded-2xl border border-white/10 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-white/10 bg-white/2 shrink-0">
          <h3 className="text-xl font-semibold text-slate-100">Create new wallet</h3>
          <p className="text-sm text-slate-400 mt-1">
            Generate a new Ethereum wallet. Save your recovery phrase — it’s the only way to restore this wallet.
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {!wallet ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                A new wallet will be generated with a 12-word recovery phrase. You must save it in a safe place;
                we don’t store it and can’t recover it for you.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full py-3.5 bg-linear-to-br from-primary to-accent text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                Generate new wallet
              </button>
            </div>
          ) : (
            <>
              {/* Mnemonic */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Recovery phrase (12 words)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(mnemonic, 'mnemonic')}
                    className="text-xs text-primary hover:underline"
                  >
                    {copied === 'mnemonic' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-200/90 text-sm font-mono break-words">{mnemonic}</p>
                </div>
                <p className="text-xs text-amber-400/90">
                  Never share this phrase. Anyone with it can control your wallet.
                </p>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Address
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(wallet.address, 'address')}
                    className="text-xs text-primary hover:underline"
                  >
                    {copied === 'address' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="p-3 bg-dark-secondary border border-white/10 rounded-xl font-mono text-sm text-slate-300 break-all">
                  {wallet.address}
                </div>
                <p className="text-xs text-slate-500">Use this address to receive funds.</p>
              </div>

              {/* Private key (optional reveal) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Private key
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRevealPrivateKey((r) => !r)}
                      className="text-xs text-slate-400 hover:text-slate-300"
                    >
                      {revealPrivateKey ? 'Hide' : 'Reveal'}
                    </button>
                    {revealPrivateKey && (
                      <button
                        type="button"
                        onClick={() => handleCopy(wallet.privateKey, 'privateKey')}
                        className="text-xs text-primary hover:underline"
                      >
                        {copied === 'privateKey' ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-dark-secondary border border-white/10 rounded-xl font-mono text-sm text-slate-300 break-all">
                  {revealPrivateKey ? wallet.privateKey : '•'.repeat(66)}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleUseWallet}
                  className="w-full py-3.5 bg-linear-to-br from-primary to-accent text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
                >
                  Use this wallet
                </button>
                <p className="text-xs text-slate-500 text-center">
                  Connects for this session only. No private key is stored.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/2 shrink-0">
          <button type="button" onClick={handleClose} className="w-full py-2.5 text-slate-400 hover:text-slate-200 rounded-xl transition-colors">
            {wallet ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
