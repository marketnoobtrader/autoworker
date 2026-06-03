import { createServer, type Server } from "node:http";
import { randomBytes, createHash } from "node:crypto";
import { readFile, mkdir } from "node:fs/promises";
import open from "open";
import chalk from "chalk";
import type { OAuthToken, WorkerConfig } from "./types.js";
import {
  CLIENT_ID,
  REDIRECT_URI,
  AUTH_URL,
  TOKEN_URL,
  CHARSET_SUBDOMAIN,
  CHARSET_TROJAN,
  tmpDir,
  workerPath,
  PROXY_IP_URL,
} from "./constant.js";
import {
  addSession,
  genSessionToken,
  selectSession,
} from "./session-manager.js";
import { loginPanel } from "./panel-settings/00-login.js";
import { setCleanIpPanel } from "./panel-settings/01-cleanIP.js";
import { setPanelConfig } from "./panel-settings/99-config.js";
import { fetchProxyIp } from "./proxyIP-fetcher.js";
import {
  globalApiClientAgent,
  panelClient,
  setGlobalApiClientProxy,
} from "./api-client.js";
import {
  genSubLink,
  info,
  ok,
  pending,
  sleep,
  title,
  ask,
  fail,
  banner,
} from "./utils.js";
import {
  fetchWithRetry,
  localClientAgent,
  setLocalClientProxy,
} from "./fetch-with-retry.js";
import { isSiteAvailable, requestProxyConfig } from "./check-connectivity.js";
import type { OptionsOfTextResponseBody } from "got";

const VERSION = "v1.0.0";

const SCOPES = [
  "account:read",
  "user:read",
  "workers:write",
  "workers_kv:write",
  "workers_routes:write",
  "workers_scripts:write",
  "workers_tail:read",
  "d1:write",
  "zone:read",
  "ssl_certs:write",
  "ai:write",
  "queues:write",
  "pipelines:write",
  "secrets_store:write",
].join(" ");

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

function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

function generateState(): string {
  return randomBytes(16).toString("base64url");
}

async function login(): Promise<OAuthToken> {
  const state = generateState();
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    access_type: "offline",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const authURL = `${AUTH_URL}?${params}`;

  return new Promise((resolve, reject) => {
    let server: Server;

    const handler = async (req: any, res: any) => {
      if (!req.url?.startsWith("/oauth/callback")) return;

      const url = new URL(req.url, "http://localhost:8976");
      if (url.searchParams.get("state") !== state) {
        res.writeHead(400);
        res.end("Invalid state");
        return reject(new Error("Invalid OAuth state"));
      }

      const code = url.searchParams.get("code");
      if (!code) {
        res.writeHead(400);
        res.end("Missing code");
        return reject(new Error("No code returned"));
      }

      try {
        // body: new URLSearchParams({
        //   grant_type: "authorization_code",
        //   client_id: CLIENT_ID,
        //   code,
        //   redirect_uri: REDIRECT_URI,
        //   code_verifier: verifier,
        // }),
        const tokenRes = await fetchWithRetry(TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          form: {
            grant_type: "authorization_code",
            client_id: CLIENT_ID,
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier,
          },
          responseType: "json",
        });

        const token = tokenRes.body as OAuthToken;

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          "<html><body style='font-family:sans-serif;text-align:center;padding:60px'>" +
            "<h2 style='color:#2d7d3a'>Logged in successfully!</h2>" +
            "<p>You can close this tab and return to the terminal.</p></body></html>",
        );

        ok("Cloudflare logged in successfully!");
        server.close();
        resolve(token);
      } catch (e) {
        server.close();
        reject(e);
      }
    };

    server = createServer(handler);
    server.listen(8976, async () => {
      title(`Login ${chalk.yellow("Cloudflare")}...`);
      info(`Opening browser to: ${chalk.cyan(authURL)}`);
      await open(authURL);
    });
  });
}

async function cfFetch(
  token: string,
  path: string,
  options: OptionsOfTextResponseBody = {},
): Promise<any> {
  const res = await fetchWithRetry(
    `https://api.cloudflare.com/client/v4${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
      responseType: "json",
    },
  );
  const json = res.body as any;
  if (json.success === false) {
    const errs =
      json.errors?.map((e: any) => e.message).join(", ") ?? res.statusMessage;
    throw new Error(errs);
  }
  return json.result ?? json;
}

async function getAccount(
  token: string,
): Promise<{ id: string; name: string }> {
  const accounts = await cfFetch(token, "/accounts?per_page=1");
  return accounts[0];
}

async function createKV(
  token: string,
  accountId: string,
  title: string,
): Promise<{ id: string }> {
  return cfFetch(token, `/accounts/${accountId}/storage/kv/namespaces`, {
    method: "POST",
    json: { title },
  });
}

function buildWorkerMetadata(cfg: WorkerConfig) {
  const bindings: any[] = [
    { name: "KV", namespace_id: cfg.kvId, type: "kv_namespace" },
    { name: "ADMIN", text: cfg.password, type: "plain_text" },
  ];
  if (cfg.proxy)
    bindings.push({ name: "PROXY_IP", text: cfg.proxy, type: "plain_text" });
  if (cfg.nat64Prefix)
    bindings.push({
      name: "PREFIX",
      text: cfg.nat64Prefix,
      type: "plain_text",
    });
  if (cfg.fallback)
    bindings.push({ name: "FALLBACK", text: cfg.fallback, type: "plain_text" });

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  return {
    main_module: "worker.js",
    bindings,
    compatibility_date: yesterday,
    compatibility_flags: ["nodejs_compat"],
    observability: { enabled: false },
    placement: {},
    usage_model: "standard",
    tags: [],
    tail_consumers: [],
    logpush: false,
  };
}

async function buildWorkerForm(metadata: object): Promise<FormData> {
  const jsWorker = await readFile(workerPath);

  const form = new FormData();
  form.append("metadata", JSON.stringify(metadata));

  form.append(
    "worker.js",
    // new Blob([`${generateJunkCode()}${jsWorker}`], {
    new Blob([jsWorker], {
      type: "application/javascript+module",
    }),
    "worker.js",
  );
  return form;
}

async function deployWorker(
  token: string,
  accountId: string,
  cfg: WorkerConfig,
): Promise<string> {
  const metadata = buildWorkerMetadata(cfg);
  const form = await buildWorkerForm(metadata);

  await cfFetch(token, `/accounts/${accountId}/workers/scripts/${cfg.name}`, {
    method: "PUT",
    body: form,
    headers: {},
  });

  await cfFetch(
    token,
    `/accounts/${accountId}/workers/scripts/${cfg.name}/subdomain`,
    {
      method: "POST",
      json: { enabled: true, previews_enabled: false },
    },
  );

  if (cfg.customDomain) {
    const zones = await cfFetch(
      token,
      `/zones?account.id=${accountId}&name=${cfg.customDomain}`,
    );
    if (!zones.length)
      throw new Error(`Zone not found for: ${cfg.customDomain}`);
    await cfFetch(token, `/accounts/${accountId}/workers/domains`, {
      method: "PUT",
      json: {
        environment: "production",
        hostname: cfg.customDomain,
        service: cfg.name,
        zone_id: zones[0].id,
      },
    });
    return `https://${cfg.customDomain}/admin`;
  }

  const sub = await cfFetch(token, `/accounts/${accountId}/workers/subdomain`);
  return `https://${cfg.name}.${sub.subdomain}.workers.dev/admin`;
}

async function checkSite(url: string, isApiClient: boolean) {
  if (isApiClient && globalApiClientAgent) return;
  if (!isApiClient && localClientAgent) return;

  const hasSiteAccess = await isSiteAvailable(url);
  if (!hasSiteAccess) {
    const failMSG = "Connection Failed!";
    fail(failMSG);
    const proxyConfig = await requestProxyConfig();
    if (proxyConfig) {
      isApiClient
        ? setGlobalApiClientProxy(proxyConfig)
        : setLocalClientProxy(proxyConfig);
    } else {
      throw new Error(failMSG);
    }
  }
}

export async function run() {
  await mkdir(tmpDir, {
    recursive: true,
  });

  banner();

  title(`Starting ${chalk.green(`autoworker ${VERSION}`)}...`);
  info("Authenticating with Cloudflare...");

  pending("Fetching account info...");
  const session = await selectSession();
  let token: OAuthToken;
  let accessToken: string;
  let account: { id: string; name: string };
  if (process.env.NODE_ENV === "development" && session) {
    token = session.oAuth;
    accessToken = session.oAuth.access_token;
    account = session.account;
  } else {
    token = await login();
    accessToken = token.access_token;
    account = await getAccount(accessToken);

    const sessionToken = genSessionToken(token, account);
    await addSession(sessionToken);
  }
  const projectName = randomString(CHARSET_SUBDOMAIN, 32, true);
  const password = randomString(CHARSET_TROJAN, 12);
  const kvName = `kv-${Date.now()}`;
  info(`Account: ${account.id}`);
  info(`Project name: ${chalk.yellow(projectName)}`);
  info(`pass:  ${chalk.yellow(password)}`);

  title("Creating KV namespace...");
  pending(kvName);
  const kv = await createKV(accessToken, account.id, kvName);
  ok(`KV created: ${kv.id}`);

  const cfg: WorkerConfig = {
    name: projectName,
    password,
    kvId: kv.id,
  };

  title("Deploying Worker...");
  const panelURL = await deployWorker(accessToken, account.id, cfg);
  panelClient.baseUrl = panelURL;
  ok(`Panel is ready → ${chalk.cyan(panelURL)}`);

  title("Setting up the panel...");
  await sleep(5_000);
  await checkSite(panelURL, true);
  pending("Logging in...");
  await loginPanel(password);
  ok("Login successfully!");

  pending("Updating ip list");
  await setCleanIpPanel();
  ok("IP list updated!");

  pending("Fetching proxy ip");
  await checkSite(PROXY_IP_URL, false);
  const proxyIp = await fetchProxyIp();
  ok("proxyIP fetched successfully!");

  pending("Updating nova config");
  const panelConfig = await setPanelConfig({ proxyIp });
  ok("NovaConfig Updated!");

  console.log(
    `\n[*]Sub: ${genSubLink(panelURL, panelConfig.优选订阅生成.TOKEN)}`,
  );

  await open(panelURL);
  await ask("\n\nPress Enter to exit...");
}
