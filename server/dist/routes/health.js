import { Router } from "express";
export const createHealthRouter = (quizSession) => {
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
