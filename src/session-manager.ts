import { promises as fs } from "node:fs";
import { sessionFile } from "./constant.js";
import type { Sessions, SessionToken } from "./types.js";

export function genSessionToken(
  oAuth: SessionToken["oAuth"],
  account: SessionToken["account"],
): SessionToken {
  return {
    oAuth,
    account,
  };
}

async function loadSessions(): Promise<Sessions> {
  try {
    const content = await fs.readFile(sessionFile, "utf8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveSessions(sessions: Sessions): Promise<void> {
  await fs.writeFile(sessionFile, JSON.stringify(sessions, null, 2));
}

export async function addSession(token: SessionToken) {
  const sessions = await loadSessions();

  sessions[token.account.name.split("@")[0]] = token;
  await saveSessions(sessions);
}

export async function removeSession(email: string) {
  const sessions = await loadSessions();

  delete sessions[email];
  await saveSessions(sessions);
}

export async function selectSession(
  email?: string,
): Promise<SessionToken | undefined> {
  const sessions = await loadSessions();

  if (email) {
    return sessions[email];
  }

  const firstEntry = Object.entries(sessions)[0];
  if (!firstEntry) return;

  return Object.entries(sessions)[0][1];
}
