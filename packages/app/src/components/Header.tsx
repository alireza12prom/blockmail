import { shortenAddress } from '../utils/helpers';

interface HeaderProps {
  isConnected: boolean;
  userAddress: string;
  networkName: string;
  /** Current session avatar URL (from public folder). */
  avatar?: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Header({
  isConnected,
  userAddress,
  networkName,
  avatar,
  onConnect,
  onDisconnect
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-dark-card/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">BlockMail</h1>
        </div>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              {/* Network Badge */}
              <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium">
                {networkName}
              </div>

              {/* Connected Status */}
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <div className="flex items-center gap-2">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30"
                    />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 glow-success animate-pulse" />
                  )}
                  <span className="address">{shortenAddress(userAddress)}</span>
                </div>
                <button
                  onClick={onDisconnect}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onConnect}
              className="flex items-center gap-2 bg-linear-to-br from-primary to-accent px-5 py-2.5 rounded-xl text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
