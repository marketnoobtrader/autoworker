import { config } from "./config.js";
import { fetchWithRetry } from "./fetch-with-retry.js";
import { ask, info } from "./utils.js";

export async function requestProxyConfig(): Promise<string | null> {
  if (config.socksProxy) return config.socksProxy;

  const useProxy = (
    await ask("\n[!]Do you want to use a SOCKS5 proxy? (y/N): ")
  ).toLowerCase();

  if (!["y", "yes"].includes(useProxy)) {
    return null;
  }

  let proxy = await ask("ip:port(default: 127.0.0.1:2080): ");
  proxy ||= "127.0.0.1:2080";
  const [host, port] = proxy.split(":");

  const proxyUrl = `socks5://${host}:${port}`;
  config.socksProxy = proxyUrl;
  info(`proxyUrl: ${proxyUrl}`);

  return proxyUrl;
}

export async function isSiteAvailable(url: string): Promise<boolean> {
  try {
    await fetchWithRetry(url);
    return true;
  } catch (_err) {
    return false;
  }
}
