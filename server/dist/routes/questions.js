import { Router } from "express";
export const createQuestionsRouter = (quizSession) => {
    const router = Router();
    router.post("/", (req, res) => {
        const body = (req.body ?? {});
        const text = typeof body.text === "string" ? body.text.trim() : "";
        const id = typeof body.id === "string" ? body.id.trim() : undefined;
        const latex = typeof body.latex === "string" ? body.latex.trim() : undefined;
        if (!text) {
            res.status(400).json({ error: "Body must include non-empty text." });
            return;
        }
        const question = quizSession.appendQuestion({ id, text, latex });
        res.status(201).json(question);
    });
    return router;
};
