import { tmpdir } from "node:os";
import { join } from "node:path";

export const PROXY_IP_URL =
  "https://gist.githubusercontent.com/marketnoobtrader/a83aa4cf20165896afdf7a3923c99d0b/raw/7d253e413425ecaef0e8a7b4ea953d4982ffb505/proxyIP.json";
export const CLIENT_ID = "54d11594-84e4-41aa-b438-e81b8fa78ee7";
export const REDIRECT_URI = "http://localhost:8976/oauth/callback";
export const AUTH_URL = "https://dash.cloudflare.com/oauth2/auth";
export const TOKEN_URL = "https://dash.cloudflare.com/oauth2/token";
export const CHARSET_ALPHANUMERIC =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const CHARSET_SPECIAL = "!@#$%^&*()_+[]{}|;:',.<>?";
export const CHARSET_TROJAN = CHARSET_ALPHANUMERIC + CHARSET_SPECIAL;
export const CHARSET_SUBDOMAIN = "abcdefghijklmnopqrstuvwxyz0123456789-";

export const workerPath = join("assets", "worker.js");
export const ipListPath = join("assets", "ipList.txt");
export const tmpDir = join(tmpdir(), ".autoworker");
export const sessionFile = join(tmpDir, "sessions.json");
