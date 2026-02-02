import { shortenAddress } from '../utils/helpers';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Up to 3 latest connected wallet addresses + avatar */
  cachedWallets: { address: string; avatar: string | null }[];
  onReconnectCached: (address: string) => void;
  onOpenCreateWallet: () => void;
  onOpenImportWallet: () => void;
}

export function ConnectModal({
  isOpen,
  onClose,
  cachedWallets,
  onReconnectCached,
  onOpenCreateWallet,
  onOpenImportWallet,
}: ConnectModalProps) {
  if (!isOpen) return null;

  const hasCached = cachedWallets.length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-dark-card rounded-2xl border border-white/10 shadow-2xl max-w-md w-full animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-white/10 bg-white/2">
          <h3 className="text-xl font-semibold text-slate-100">Connect Wallet</h3>
          <p className="text-sm text-slate-400 mt-1">
            {hasCached ? 'Reconnect or use another wallet' : 'Create a new wallet or import an existing one'}
          </p>
        </div>

        <div className="p-6 space-y-3">
          {cachedWallets.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Recent wallets
              </span>
              <div className="space-y-2">
                {cachedWallets.map(({ address, avatar }) => (
                  <button
                    key={address}
                    type="button"
                    onClick={() => {
                      onReconnectCached(address);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-primary/15 hover:bg-primary/25 border border-primary/30 hover:border-primary/50 rounded-xl transition-all text-slate-100 font-medium text-sm"
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30 shrink-0"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-base shrink-0">↻</span>
                    )}
                    {shortenAddress(address)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onOpenCreateWallet}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 rounded-xl transition-all text-slate-100 font-medium text-sm"
            >
              <span className="text-lg">+</span>
              Create
            </button>
            <button
              type="button"
              onClick={onOpenImportWallet}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-xl transition-all text-slate-300 hover:text-slate-100 font-medium text-sm"
            >
              <span className="text-lg">↩</span>
              Import
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/2">
          <button onClick={onClose} className="w-full btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
