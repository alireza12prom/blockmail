import { ComposeForm } from './ComposeForm';
import type { EmailService } from '../services';
import type { Email } from '../types';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  userAddress: string;
  emailService: EmailService;
  onMessageSent: (email: Email) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  initialRecipient?: string;
}

export function ComposeModal({
  isOpen,
  onClose,
  isConnected,
  userAddress,
  emailService,
  onMessageSent,
  onError,
  onSuccess,
  initialRecipient = '',
}: ComposeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-dark-card rounded-2xl border border-white/10 shadow-2xl w-full max-w-[420px] flex flex-col max-h-[90vh] animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/10 bg-white/2 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-1 h-5 bg-linear-to-b from-primary to-accent rounded-full" />
            Compose
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
            title="Close"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ComposeForm
            hideHeader
            isConnected={isConnected}
            userAddress={userAddress}
            emailService={emailService}
            onMessageSent={(email) => {
              onMessageSent(email);
              onClose();
            }}
            onError={onError}
            onSuccess={onSuccess}
            initialRecipient={initialRecipient}
          />
        </div>
      </div>
    </div>
  );
}
