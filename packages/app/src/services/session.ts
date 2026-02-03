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

  remove(address: string): void {
    const data = this.load().filter(
      ({ wallet }) => wallet.address.toLowerCase() !== address.toLowerCase()
    );
    this.storage.set('sessions', 'list', JSON.stringify(data));
    const cur = this.current;
    if (cur && cur.wallet.address.toLowerCase() === address.toLowerCase()) {
      this.current = null;
    }
  }

  load(): Array<Session> {
    const raw = this.storage.get('sessions', 'list') ?? '[]';
    return JSON.parse(raw) as Session[];
  }

  save(params: SaveParams): Session {
    const session: Session = {
      wallet: params.wallet,
      keypair: params.keypair,
      avatar: pickRandomAvatar()
    }

    const data = this.load();
    if (data.length >= MAX_CACHED_SESSIONS) {
      data.pop();
    }

    const isWalletExists = data.find(
      ({wallet:w}) => w.address.toLocaleLowerCase() == params.wallet.address.toLocaleLowerCase()
    );
    if (isWalletExists) return isWalletExists;

    const raw = JSON.stringify([session, ...data]);
    this.storage.set('sessions', 'list', raw);

    return session;
  }
}

interface SaveParams {
  wallet: { address: string; pk: string };
  keypair: { pk: string; sk: string; }
}

export const sessionService = new SessionService(storage);