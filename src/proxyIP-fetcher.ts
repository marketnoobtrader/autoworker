import { PROXY_IP_URL } from "./constant.js";
import { fetchWithRetry } from "./fetch-with-retry.js";
import type { ProxyIpResult } from "./types.js";
import { info } from "./utils.js";

export async function fetchProxyIp(): Promise<string[]> {
  const response = await fetchWithRetry(PROXY_IP_URL, { responseType: "json" });
  const proxyIpResultList = response.body as ProxyIpResult[];
  const mapped: string[] = proxyIpResultList.map((x) => x.proxyIP);
  info(`Total ProxyIP: ${mapped.length}`);

  return mapped;
}
