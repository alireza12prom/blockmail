// Types
export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  cid: string;
  timestamp: Date;
  read: boolean;
  direction: 'sent' | 'received';
}

export interface ToastData {
  message: string;
  type: 'success' | 'error';
}

/** Cached session: wallet + encryption keypair + optional avatar. */
export interface Session {
  wallet: { address: string; pk: string };
  keypair: { pk: string; sk: string };
  avatar?: string;
}

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}
