import { pickRandomAvatar } from "../config/avatars";
import { Session } from "../types";
import { storage, StorageService } from "./storage";

const MAX_CACHED_SESSIONS = 3;

export class SessionService {
  constructor(private storage: StorageService) {}

  get current(): Session | null {
    const raw = this.storage.get('sessions', 'current') ?? null;
    return raw ? JSON.parse(raw) as Session : null;
  }

  set current(s: Session | null) {
    const raw = s ? JSON.stringify(s) : null;
    if (raw == null) this.storage.del('sessions', 'current');
    else this.storage.set('sessions', 'current', raw);
  }

  find(address: string) {
    const data = this.load();
    return data.find(
      ({  wallet }) => wallet.address.toLowerCase() == address.toLowerCase()
    ) ?? null;
  }

  load(): Array<Session> {
    const raw = this.storage.get('sessions', 'list') ?? '[]';
    return JSON.parse(raw) as Session[];
  }

  save(params: SaveParams): Session {
    console.log('SessionService.save called with address:', params.wallet.address);
    const session: Session = {
      wallet: params.wallet,
      keypair: params.keypair,
      avatar: pickRandomAvatar()
    }

    const data = this.load();
    console.log('Current cached sessions count:', data.length);
    if (data.length >= MAX_CACHED_SESSIONS) {
      const removed = data.pop();
      console.log('Removed oldest session:', removed?.wallet.address);
    }

    const isWalletExists = data.find(
      ({wallet:w}) => w.address.toLowerCase() === params.wallet.address.toLowerCase()
    );
    if (isWalletExists) {
      console.log('Wallet already exists in cache, returning existing session:', isWalletExists.wallet.address);
      return isWalletExists;
    }

    console.log('Saving new session for address:', params.wallet.address);
    const raw = JSON.stringify([session, ...data]);
    this.storage.set('sessions', 'list', raw);
    console.log('Session saved successfully. New session address:', session.wallet.address);

    return session;
  }

  update(session: Session): void {
    const data = this.load();
    const index = data.findIndex(
      (s) => s.wallet.address.toLowerCase() === session.wallet.address.toLowerCase()
    );
    if (index !== -1) {
      data[index] = session;
      const raw = JSON.stringify(data);
      this.storage.set('sessions', 'list', raw);
    }
  }
}

interface SaveParams {
  wallet: { address: string; pk: string };
  keypair: { pk: string; sk: string; }
}

export const sessionService = new SessionService(storage);