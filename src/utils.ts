import chalk from "chalk";
import readline from "node:readline";
import { stdin, stdout } from "node:process";
import { randomBytes } from "node:crypto";
import { CHARSET_ALPHANUMERIC } from "./constant.js";

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function banner() {
  console.log(`
If this project saves you time and helps your workflow, consider supporting its development.

Trc20:
TUu3F32YzrpdaVRqD5wKd9NWbXsvpRtzGb

EVM WALLET:
0xB05a8a893B33B827D2be42D1Bd311C9D3da8D238
`);
}

export function genSubLink(baseUrl: string, token: string) {
  const origin = new URL(baseUrl).origin;

  return `${origin}/sub?token=${token}`;
}

export function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function randomString(charset: string, len: number, isDomain = false): string {
  const bytes = randomBytes(len * 2);
  const result: string[] = [];
  let i = 0;
  while (result.length < len) {
    const char = charset[bytes[i++ % bytes.length] % charset.length];
    if (
      isDomain &&
      (result.length === 0 || result.length === len - 1) &&
      char === "-"
    )
      continue;
    result.push(char);
  }
  return result.join("");
}

export function generateJunkCode(): string {
  const count = 50 + Math.floor(Math.random() * 200);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const name = `__var_${randomString(CHARSET_ALPHANUMERIC, 8)}_${i}`;
    parts.push(`let ${name} = ${Math.floor(Math.random() * 100000)};`);
  }
  for (let i = 0; i < count; i++) {
    const name = `__Func_${randomString(CHARSET_ALPHANUMERIC, 8)}_${i}`;
    parts.push(
      `function ${name}() { return ${Math.floor(Math.random() * 1000)}; }`,
    );
  }
  return ` ${parts.join(" ")}`;
}

function log(symbol: string, color: (s: string) => string, msg: string) {
  console.log(`${color(symbol)} ${msg}`);
}
export const ok = (msg: string) => log("✓", chalk.green, msg);
export const info = (msg: string) => log("+", chalk.white, msg);
export const fail = (msg: string) => log("✗", chalk.red, msg);
export const title = (msg: string) => log("●", chalk.cyan, msg);
export const pending = (msg: string) => log("~", chalk.white, msg);
