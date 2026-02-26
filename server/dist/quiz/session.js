import { logInfo } from "../utils/logger.js";
const noopEmitter = () => undefined;
export class QuizSession {
    questions = [];
    nextSeq = 1;
    emitQuestion;
    constructor(emitQuestion = noopEmitter) {
        this.emitQuestion = emitQuestion;
    }
    setEmitter(emitQuestion) {
        this.emitQuestion = emitQuestion;
    }
    appendQuestion(input) {
        const text = input.text.trim();
        if (!text) {
            throw new Error("Question text is required");
        }
        const seq = this.nextSeq;
        this.nextSeq += 1;
        const question = {
            seq,
            id: input.id ? `${input.id}-${seq}` : `q-${seq}`,
            text,
            latex: input.latex?.trim() || undefined,
            createdAt: Date.now()
        };
        this.questions.push(question);
        this.emitQuestion(question);
        logInfo("Question appended and dispatched", { seq: question.seq, id: question.id });
        return question;
    }
    getAfter(seq) {
        return this.questions.filter((question) => question.seq > seq);
    }
    getLatestSeq() {
        return this.nextSeq - 1;
    }
}
