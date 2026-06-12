import * as crypto from 'crypto';

export function nanoid(size = 8): string {
  return crypto.randomBytes(size).toString('hex').slice(0, size);
}
