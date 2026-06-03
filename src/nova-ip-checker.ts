const PORTS = [8443, 2087, 2083, 2053, 443, 2096] as const;

function genName(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

  let result = "nova-";

  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

function extractIPs(text: string): string[] {
  const regex =
    /(?<![0-9])((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?![0-9])/g;

  return [...new Set([...text.matchAll(regex)].map((m) => m[0]))];
}

export async function genNovaIpList(input: string): Promise<string[]> {
  const ips = extractIPs(input);

  const lines: string[] = [];

  for (const ip of ips) {
    for (const port of PORTS) {
      lines.push(`${ip}:${port}#${genName()}`);
    }
  }

  return lines;
}
