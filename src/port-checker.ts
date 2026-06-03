import * as net from "node:net";
import { config } from "./config.js";

function checkPort(ip: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, config.timeoutMs);

    socket
      .once("connect", () => {
        clearTimeout(timer);
        socket.destroy();
        resolve(true);
      })
      .once("error", () => {
        clearTimeout(timer);
        resolve(false);
      })
      .connect(port, ip);
  });
}

export async function socketCheck(
  ip: string,
  ports: number[],
): Promise<number[]> {
  const result: number[] = [];
  for (const port of ports) {
    const isOpen = await checkPort(ip, port);
    if (isOpen) result.push(port);
  }

  return result;
}
