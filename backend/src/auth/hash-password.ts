import { hashPassword } from './password';

async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY) {
    let input = '';
    for await (const chunk of process.stdin) {
      input += chunk;
    }
    return input.replace(/[\r\n]+$/, '');
  }

  process.stdout.write('Password: ');
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.resume();

  return new Promise((resolve, reject) => {
    let password = '';
    const finish = (error?: Error) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      process.stdout.write('\n');
      if (error) {
        reject(error);
      } else {
        resolve(password);
      }
    };
    const onData = (chunk: string) => {
      if (chunk === '\u0003') {
        finish(new Error('Password input cancelled'));
      } else if (chunk === '\r' || chunk === '\n') {
        finish();
      } else if (chunk === '\u007f' || chunk === '\b') {
        password = password.slice(0, -1);
      } else {
        password += chunk;
      }
    };

    process.stdin.on('data', onData);
  });
}

async function main(): Promise<void> {
  const password = await readPassword();
  if (!password) {
    throw new Error('Password cannot be empty');
  }
  process.stdout.write(`${await hashPassword(password)}\n`);
}

void main();
