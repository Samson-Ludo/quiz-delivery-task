import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { CLIENT_ORIGIN, DISPATCH_INTERVAL_MS, SERVER_PORT } from "./config.js";
import { setupSocket } from "./realtime/socket.js";
import { AckStore } from "./quiz/ackStore.js";
import { questionBank } from "./quiz/questionBank.js";
import { QuizSession } from "./quiz/session.js";
import { createHealthRouter } from "./routes/health.js";
import { createQuestionsRouter } from "./routes/questions.js";
import { createReconcileRouter } from "./routes/reconcile.js";
import { logInfo, logWarn } from "./utils/logger.js";

const app = express();
app.use(express.json());
app.use(cors({ origin: CLIENT_ORIGIN }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN
  }
});

const ackStore = new AckStore();
const quizSession = new QuizSession((question) => {
  io.emit("server:question", question);
});
setupSocket(io, quizSession, ackStore);

app.use("/health", createHealthRouter(quizSession));
app.use("/reconcile", createReconcileRouter(quizSession, ackStore));
app.use("/questions", createQuestionsRouter(quizSession));

app.get("/", (_req, res) => {
  res.json({
    name: "quiz-delivery-server",
    latestSeq: quizSession.getLatestSeq(),
    endpoints: ["/health", "/reconcile", "/questions"]
  });
});

let questionBankIndex = 0;
const dispatchFromBank = (): void => {
  const template = questionBank[questionBankIndex % questionBank.length];
  questionBankIndex += 1;
  try {
    quizSession.appendQuestion(template);
  } catch (error) {
    logWarn("Auto dispatch failed", { error: String(error) });
  }
};

let initialDispatchTimer: NodeJS.Timeout | undefined;
let intervalId: NodeJS.Timeout | undefined;

const startDispatchLoop = (): void => {
  initialDispatchTimer = setTimeout(dispatchFromBank, 1200);
  intervalId = setInterval(dispatchFromBank, DISPATCH_INTERVAL_MS);
};

httpServer.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    logWarn("Port already in use", {
      serverPort: SERVER_PORT,
      hint: "Stop the process using this port or set a different PORT environment variable."
    });
  } else {
    logWarn("HTTP server failed to start", { error: String(error) });
  }
  process.exit(1);
});

httpServer.listen(SERVER_PORT, () => {
  startDispatchLoop();
  logInfo("Server started", {
    serverPort: SERVER_PORT,
    clientOrigin: CLIENT_ORIGIN,
    dispatchIntervalMs: DISPATCH_INTERVAL_MS
  });
});

const shutdown = (signal: string): void => {
  if (initialDispatchTimer) {
    clearTimeout(initialDispatchTimer);
  }
  if (intervalId) {
    clearInterval(intervalId);
  }
  logInfo("Shutting down server", { signal });
  io.close(() => {
    httpServer.close(() => process.exit(0));
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
