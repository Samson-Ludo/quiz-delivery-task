import { Router } from "express";
import type { QuizSession } from "../quiz/session.js";

export const createHealthRouter = (quizSession: QuizSession): Router => {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({
      status: "ok",
      latestSeq: quizSession.getLatestSeq(),
      timestamp: Date.now()
    });
  });

  return router;
};
