export type ApiResponse = { success: boolean; message: string };

export interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
}

export interface SessionToken {
  oAuth: OAuthToken;
  account: { id: string; name: string };
}

export type Sessions = Record<string, SessionToken>;

export interface WorkerConfig {
  name: string;
  password: string;
  proxy?: string;
  nat64Prefix?: string;
  fallback?: string;
  kvId: string;
  customDomain?: string;
}

export interface ProxyIpResult {
  success: boolean;
  message?: string;
  proxyIP: string;
  portRemote: number;
  colo?: string;
  loc?: string;
  city?: string;
  ip?: string;
  type?: string;
  responseTime: number;
  timestamp?: number;
}

export interface AxiosProxy {
  protocol: "http";
  host: string;
  port: number;
}

export type NovaConfig = typeof novaConfigSample;

export type NovaConfigWithOptionalPath = Omit<NovaConfig, "反代"> & {
  反代: Omit<NovaConfig["反代"], "路径模板"> & {
    路径模板?: NovaConfig["反代"]["路径模板"];
  };
};

const novaConfigSample = {
  TIME: "2026-05-30T22:43:08.111Z",
  HOST: "6op8iugcl9hwvzkhc1.workers.dev",
  HOSTS: ["6op8iugcl9hwvzkhc1.workers.dev"],
  UUID: "310de2e7-9a8b-4ad3-8684-de4d1d3d2bef",
  PATH: "/",
  协议类型: "vless",
  传输协议: "ws",
  gRPC模式: "gun",
  gRPCUserAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  跳过证书验证: false,
  启用0RTT: false,
  TLS分片: null,
  随机路径: false,
  ECH: false,
  ECHConfig: {
    DNS: "https://dns.alidns.com/dns-query",
    SNI: "cloudflare-ech.com",
  },
  SS: {
    加密方式: "aes-128-gcm",
    TLS: true,
  },
  Fingerprint: "random",
  优选订阅生成: {
    local: true,
    本地IP库: {
      随机IP: true,
      随机数量: 16,
      指定端口: -1,
    },
    SUB: null,
    SUBNAME: "Nova Proxy",
    SUBUpdateTime: 3,
    TOKEN: "c8bd64c7f59be87fcbba5a871416f",
  },
  订阅转换配置: {
    SUBAPI: "https://SUBAPI.cmliussss.net",
    SUBCONFIG:
      "https://raw.githubusercontent.com/cmliu/ACL4SSR/refs/heads/main/Clash/config/ACL4SSR_Online_Mini_MultiMode_CF.ini",
    SUBEMOJI: false,
  },
  反代: {
    PROXYIP: "auto",
    SOCKS5: {
      启用: null,
      全局: false,
      账号: "",
      白名单: [
        "*tapecontent.net",
        "*cloudatacdn.com",
        "*loadshare.org",
        "*cdn-centaurus.com",
        "scholar.google.com",
      ],
    },
    路径模板: {
      PROXYIP: "proxyip={{IP:PORT}}",
      SOCKS5: {
        全局: "socks5://{{IP:PORT}}",
        标准: "socks5={{IP:PORT}}",
      },
      HTTP: {
        全局: "http://{{IP:PORT}}",
        标准: "http={{IP:PORT}}",
      },
      HTTPS: {
        全局: "https://{{IP:PORT}}",
        标准: "https={{IP:PORT}}",
      },
      TURN: {
        全局: "turn://{{IP:PORT}}",
        标准: "turn={{IP:PORT}}",
      },
      SSTP: {
        全局: "sstp://{{IP:PORT}}",
        标准: "sstp={{IP:PORT}}",
      },
    },
  },
  TG: {
    启用: false,
    BotToken: null,
    ChatID: null,
  },
  CF: {
    Email: null,
    GlobalAPIKey: null,
    AccountID: null,
    APIToken: null,
    UsageAPI: null,
    Usage: {
      success: false,
      pages: 0,
      workers: 0,
      total: 0,
      max: 100000,
    },
  },
  完整节点路径: "/",
  LINK: "vless://310de2e7-9a8b-4ad3-8684-de4d1d3d2bef@6op8iugcl9hwvzkhc1.workers.dev:443?security=tls&type=ws&host=6op8iugcl9hwvzkhc1.workers.dev&fp=random&sni=6op8iugcl9hwvzkhc1.workers.dev&path=%2F&encryption=none#Nova%20Proxy",
  加载时间: "126.00ms",
};
