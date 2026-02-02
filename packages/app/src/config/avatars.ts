/**
 * Avatar images from public folder. Use pickRandomAvatar() for new sessions.
 */
import av1 from '../public/1.png?url';
import av2 from '../public/2.png?url';
import av3 from '../public/3.png?url';
import av4 from '../public/4.png?url';
import av5 from '../public/5.png?url';
import av6 from '../public/6.png?url';

const AVATAR_URLS: string[] = [av1, av2, av3, av4, av5, av6];

export function pickRandomAvatar(): string {
  return AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)] ?? AVATAR_URLS[0]!;
}
