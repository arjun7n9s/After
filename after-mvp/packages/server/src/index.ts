import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Command } from "commander";
import { createServer as createHttpServer, type Server } from "node:http";
import { join, resolve } from "node:path";
import { WebSocketServer } from "ws";

import { initProject } from "./cli/init";
import { createBobRouter } from "./routes/bob";

dotenv.config();

export const createServer = (projectPath?: string) => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, service: "@after/server" });
  });

  // Mount Bob routes if project path is provided
  if (projectPath) {
    dotenv.config({ path: join(projectPath, ".env"), override: true });
    app.use("/api/bob", createBobRouter(projectPath));
  }

  return app;
};

export const attachWebSocketServer = (server: Server): WebSocketServer => {
  const websocketServer = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url !== "/ws") {
      socket.destroy();
      return;
    }

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

  websocketServer.on("connection", (websocket) => {
    websocket.send(
      JSON.stringify({
        id: `ws-${Date.now()}`,
        type: "milestone:reached",
        title: "Live connection established",
        summary: "Dashboard is receiving real-time updates from the After API server.",
        timestamp: new Date().toISOString(),
        source: "server:/ws",
      }),
    );
  });

  return websocketServer;
};

export const runCli = async (argv = process.argv): Promise<void> => {
  const program = new Command();

  program
    .name("after")
    .description("After MVP local-first developer journey tooling")
    .version("0.1.0");

  program
    .command("init")
    .argument("[projectPath]", "project path", ".")
    .option("-n, --name <projectName>", "project display name")
    .description("Initialize a local Project Brain")
    .action(async (projectPath: string, options: { name?: string }) => {
      const brainPath = await initProject(projectPath, {
        projectName: options.name,
      });
      console.log(`Project Brain initialized at ${brainPath}`);
    });

  program
    .command("start")
    .argument("[projectPath]", "project path", ".")
    .option("-p, --port <port>", "port", process.env.PORT ?? "3000")
    .description("Start the After API server")
    .action((projectPath: string, options: { port: string }) => {
      const resolvedProjectPath = resolve(projectPath);
      const app = createServer(resolvedProjectPath);
      const server = createHttpServer(app);
      const port = Number(options.port);
      attachWebSocketServer(server);

      server.listen(port, () => {
        console.log(`After API listening on http://localhost:${port}`);
        console.log(`After WebSocket listening on ws://localhost:${port}/ws`);
        console.log(`Project: ${resolvedProjectPath}`);
      });
    });

  await program.parseAsync(argv);
};

if (require.main === module) {
  runCli().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
