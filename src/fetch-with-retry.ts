import type {
  Got,
  OptionsOfJSONResponseBody,
  OptionsOfTextResponseBody,
  Response,
} from "got";
import { sleep } from "./utils.js";
import { config } from "./config.js";
import got from "got";
import { SocksProxyAgent } from "socks-proxy-agent";

export let localClientAgent: SocksProxyAgent | undefined;

export function setLocalClientProxy(proxyUrl: string) {
  localClientAgent = new SocksProxyAgent(proxyUrl);
}

function shouldRetry(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

export async function fetchWithRetry(
  url: string,
  opts: OptionsOfTextResponseBody | OptionsOfJSONResponseBody = {},
  gotInstance: Got = got,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= config.retries; attempt++) {
    try {
      const response = await gotInstance(url, {
        ...opts,
        timeout: { request: config.timeoutMs },
        hooks: {
          beforeRequest: [
            (options) => {
              if (localClientAgent) {
                options.agent = {
                  http: localClientAgent,
                  https: localClientAgent,
                };
              }
            },
          ],
        },
      });
      if (!shouldRetry(response.statusCode) || attempt === config.retries) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === config.retries) {
        throw error;
      }
    }
    await sleep(500);
  }
  throw lastError ?? new Error("Fetch failed");
}
