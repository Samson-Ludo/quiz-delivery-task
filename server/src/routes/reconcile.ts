import { Router } from "express";
import type { AckStore } from "../quiz/ackStore.js";
import type { QuizSession } from "../quiz/session.js";
import { parseClientId, parseNonNegativeInt } from "../utils/validate.js";

export const createReconcileRouter = (quizSession: QuizSession, ackStore: AckStore): Router => {
  const router = Router();

  router.get("/", (req, res) => {
    const clientId = parseClientId(req.query.clientId);
    const lastSeq = parseNonNegativeInt(req.query.lastSeq);

    if (!clientId || lastSeq === null) {
      res.status(400).json({
        error: "Invalid query. Expected /reconcile?clientId=XXX&lastSeq=N where N >= 0."
      });
      return;
    }

    const sinceSeq = Math.max(lastSeq, ackStore.getAck(clientId));
    const questions = quizSession.getAfter(sinceSeq);

    res.json({
      clientId,
      sinceSeq,
      questions
    });
  });

  return router;
};
