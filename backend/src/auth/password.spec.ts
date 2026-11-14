import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('verifies a password without storing it in plain text', async () => {
    const password = 'correct horse battery staple';
    const encodedHash = await hashPassword(password);

    expect(encodedHash).not.toContain(password);
    await expect(verifyPassword(password, encodedHash)).resolves.toBe(true);
    await expect(verifyPassword('wrong password', encodedHash)).resolves.toBe(
      false,
    );
  });

  it('rejects hashes with an unsupported or malformed format', async () => {
    await expect(verifyPassword('password', 'bcrypt$broken')).resolves.toBe(
      false,
    );
  });
});
