import got, {
  type OptionsOfTextResponseBody,
  type Got,
  type Response,
  type OptionsOfJSONResponseBody,
} from "got";
import { CookieJar } from "tough-cookie";
import { fetchWithRetry } from "./fetch-with-retry.js";
import { config } from "./config.js";
import { SocksProxyAgent } from "socks-proxy-agent";

export let globalApiClientAgent: SocksProxyAgent | undefined;

export function setGlobalApiClientProxy(proxyUrl: string) {
  globalApiClientAgent = new SocksProxyAgent(proxyUrl);
}

export class ApiClient {
  public readonly client: Got;

  constructor(private _baseUrl?: string) {
    const jar = new CookieJar();
    this.client = got.extend({
      cookieJar: jar,
      timeout: { request: config.timeoutMs },
      hooks: {
        beforeRequest: [
          (options) => {
            if (globalApiClientAgent) {
              options.agent = {
                http: globalApiClientAgent,
                https: globalApiClientAgent,
              };
            }
          },
        ],
      },
    });
    if (_baseUrl) this.baseUrl = _baseUrl;
  }

  get baseUrl(): string {
    if (!this._baseUrl) throw new Error("[404]baseUrl");
    return this._baseUrl;
  }

  set baseUrl(v: string) {
    this._baseUrl = new URL(v).origin;
  }

  async req(
    url: string,
    opts: OptionsOfTextResponseBody | OptionsOfJSONResponseBody = {},
  ): Promise<Response> {
    return fetchWithRetry(
      url,
      { ...opts, prefixUrl: this.baseUrl },
      this.client,
    );
  }

  async postJson(
    url: string,
    data: Record<string, unknown>,
  ): Promise<Response> {
    return this.req(url, {
      method: "POST",
      json: data,
    });
  }
}

export const panelClient = new ApiClient();
