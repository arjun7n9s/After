import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Command } from "commander";
import { existsSync } from "node:fs";
import { access } from "node:fs/promises";
import { createServer as createHttpServer, type Server } from "node:http";
import { basename, join, resolve } from "node:path";
import { WebSocketServer } from "ws";

import { CaptureManager, type CaptureEvent } from "@after/core";
import { initProject } from "./cli/init";
import { createBobRouter } from "./routes/bob";

dotenv.config();

type CreateServerOptions = {
  serveDashboard?: boolean;
};

export const createServer = (projectPath?: string, options: CreateServerOptions = {}) => {
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

  if (options.serveDashboard) {
    attachDashboard(app);
  }

  return app;
};

const attachDashboard = (app: express.Express): void => {
  const dashboardPath = findDashboardBuildPath();

  if (!dashboardPath) {
    app.get("/", (_request, response) => {
      response.status(503).send([
        "<!doctype html>",
        "<html><body style=\"font-family: system-ui; max-width: 720px; margin: 48px auto; line-height: 1.5;\">",
        "<h1>After dashboard is not built yet</h1>",
        "<p>Run <code>npm run build</code> inside the After workspace, then run <code>after launch .</code> again.</p>",
        "</body></html>",
      ].join(""));
    });
    return;
  }

  app.use(express.static(dashboardPath));
  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api/") || request.path === "/ws") {
      next();
      return;
    }

    response.sendFile(join(dashboardPath, "index.html"));
  });
};

const findDashboardBuildPath = (): string | null => {
  const candidates = [
    process.env.AFTER_DASHBOARD_DIST,
    resolve(process.cwd(), "apps", "ui", "dist"),
    resolve(__dirname, "..", "..", "..", "apps", "ui", "dist"),
  ].filter((value): value is string => Boolean(value));

  return candidates.find((candidate) => existsSync(join(candidate, "index.html"))) ?? null;
};

const hasProjectBrain = async (projectPath: string): Promise<boolean> => {
  try {
    await access(join(projectPath, "brain", "overview.md"));
    return true;
  } catch {
    return false;
  }
};

const listen = (
  projectPath: string,
  options: { port: string; serveDashboard?: boolean; initialize?: boolean; watch?: boolean },
): Promise<void> => {
  const resolvedProjectPath = resolve(projectPath);
  const app = createServer(resolvedProjectPath, {
    serveDashboard: options.serveDashboard,
  });
  const server = createHttpServer(app);
  const port = Number(options.port);
  const websocketServer = attachWebSocketServer(server);
  let captureManager: CaptureManager | null = null;

  const stopCapture = async () => {
    if (!captureManager) return;
    await captureManager.stop();
    captureManager = null;
  };

  if (options.watch) {
    captureManager = new CaptureManager(resolvedProjectPath);
    captureManager.getEventBus().onAny(async (event) => {
      const dashboardEvent = toDashboardEvent(event);
      if (!dashboardEvent) return;

      const payload = JSON.stringify(dashboardEvent);
      websocketServer.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(payload);
        }
      });
    });
  }

  const shutdown = () => {
    void stopCapture().finally(() => server.close(() => process.exit(0)));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  return new Promise((resolveListen) => {
    server.listen(port, async () => {
      const baseUrl = `http://localhost:${port}`;
      if (captureManager) {
        await captureManager.start({
          gitScannerOptions: { pollInterval: 3000 },
        });
      }

      console.log(`After is running at ${baseUrl}`);
      console.log(`API health: ${baseUrl}/api/health`);
      console.log(`Project: ${resolvedProjectPath}`);
      console.log(`Repository watcher: ${captureManager?.isActive() ? "active" : "off"}`);
      if (options.initialize) {
        console.log("Project Brain: ready");
      }
      resolveListen();
    });
  });
};

const toDashboardEvent = (event: CaptureEvent) => {
  const path = typeof event.data.path === "string" ? event.data.path : undefined;
  const message = typeof event.data.message === "string" ? event.data.message : undefined;
  const author = typeof event.data.author === "string" ? event.data.author : undefined;
  const branch = typeof event.data.branch === "string" ? event.data.branch : undefined;

  if (event.type === "file:added") {
    return {
      id: event.id,
      type: "file:added",
      title: `Added ${path ?? "file"}`,
      summary: "After captured a new file in the connected repository.",
      timestamp: event.timestamp,
      source: path,
    };
  }

  if (event.type === "file:changed") {
    return {
      id: event.id,
      type: "file:changed",
      title: `Changed ${path ?? "file"}`,
      summary: "After captured a file update in the connected repository.",
      timestamp: event.timestamp,
      source: path,
    };
  }

  if (event.type === "file:deleted") {
    return {
      id: event.id,
      type: "file:deleted",
      title: `Deleted ${path ?? "file"}`,
      summary: "After captured a file removal in the connected repository.",
      timestamp: event.timestamp,
      source: path,
    };
  }

  if (event.type === "git:commit") {
    return {
      id: event.id,
      type: "git:commit",
      title: `Commit: ${message ?? "Repository update"}`,
      summary: `${author ?? "A developer"} committed changes${branch ? ` on ${branch}` : ""}.`,
      timestamp: event.timestamp,
      source: typeof event.data.hash === "string" ? event.data.hash : ".git",
    };
  }

  return null;
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
    .option("-p, --port <port>", "API port to use when you start After", process.env.PORT ?? "3000")
    .description("Initialize a local Project Brain")
    .action(async (projectPath: string, options: { name?: string; port: string }) => {
      const resolvedProjectPath = resolve(projectPath);
      const brainPath = await initProject(projectPath, {
        projectName: options.name,
      });
      console.log(`Project Brain initialized at ${brainPath}`);
      console.log(`Connected repository: ${resolvedProjectPath}`);
      console.log(`Start API: after start "${resolvedProjectPath}" -p ${options.port}`);
      console.log("Start dashboard: npm run dev --workspace=@after/ui");
      console.log("Open dashboard: http://localhost:5173");
    });

  program
    .command("start")
    .argument("[projectPath]", "project path", ".")
    .option("-p, --port <port>", "port", process.env.PORT ?? "3000")
    .description("Start the After API server")
    .option("--watch", "watch files and git commits while the API is running")
    .action(async (projectPath: string, options: { port: string; watch?: boolean }) => {
      await listen(projectPath, { port: options.port, watch: Boolean(options.watch) });
    });

  program
    .command("launch")
    .alias("up")
    .argument("[projectPath]", "project path", ".")
    .option("-n, --name <projectName>", "project display name")
    .option("-p, --port <port>", "port", process.env.PORT ?? "3000")
    .description("Initialize the current repo if needed and launch After with API and dashboard")
    .action(async (projectPath: string, options: { name?: string; port: string }) => {
      const resolvedProjectPath = resolve(projectPath);

      if (!(await hasProjectBrain(resolvedProjectPath))) {
        await initProject(resolvedProjectPath, {
          projectName: options.name ?? basename(resolvedProjectPath),
        });
      }

      await listen(resolvedProjectPath, {
        port: options.port,
        serveDashboard: true,
        initialize: true,
        watch: true,
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
