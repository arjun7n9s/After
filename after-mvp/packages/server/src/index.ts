import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Command } from "commander";

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
    app.use("/api/bob", createBobRouter(projectPath));
  }

  return app;
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
      const app = createServer(projectPath);
      const port = Number(options.port);

      app.listen(port, () => {
        console.log(`After API listening on http://localhost:${port}`);
        console.log(`Project: ${projectPath}`);
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
