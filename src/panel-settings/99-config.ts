import { panelClient } from "../api-client.js";
import type { NovaConfigWithOptionalPath } from "../types.js";

export interface PanelConfigOpts {
  proxyIp: string[];
}

export async function setPanelConfig(opts: PanelConfigOpts) {
  const getDefaultNovaConfig = await panelClient.req(
    `admin/config.json?_t=${Date.now()}`,
    {
      responseType: "json",
    },
  );

  const NovaConfigJson =
    getDefaultNovaConfig.body as NovaConfigWithOptionalPath;

  // change Fingerprint
  NovaConfigJson.Fingerprint = "random";
  // Disable random selection to maintain a clean IP
  NovaConfigJson.优选订阅生成.本地IP库.随机IP = false;
  // for proxy ip
  NovaConfigJson.反代.PROXYIP = opts.proxyIp.join(",");
  delete NovaConfigJson.反代.路径模板;

  await panelClient.postJson("admin/config.json", NovaConfigJson);

  return NovaConfigJson;
}
