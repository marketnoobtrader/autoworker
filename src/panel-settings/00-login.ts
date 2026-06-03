import { panelClient } from "../api-client.js";

export async function loginPanel(password: string) {
  await panelClient.req(
    "login",
    {
    body: `password=${password}`,
    method: "POST",
  });
}
