import { panelClient } from "../api-client.js";
import { ipListPath } from "../constant.js";
import { genNovaIpList } from "../nova-ip-checker.js";
import { readFile } from "node:fs/promises";

export async function setCleanIpPanel() {
  const content = await readFile(ipListPath, "utf-8");
  const novaIpList = await genNovaIpList(content);

  await panelClient.req("admin/ADD.txt", {
    body: novaIpList.join("\n"),
    method: "POST",
  });
}
