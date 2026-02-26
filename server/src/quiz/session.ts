import { logInfo } from "../utils/logger.js";
import type { AppendQuestionInput, Question } from "./types.js";

type QuestionEmitter = (question: Question) => void;

const noopEmitter: QuestionEmitter = () => undefined;

export class QuizSession {
  private readonly questions: Question[] = [];
  private nextSeq = 1;
  private emitQuestion: QuestionEmitter;

  constructor(emitQuestion: QuestionEmitter = noopEmitter) {
    this.emitQuestion = emitQuestion;
  }

  setEmitter(emitQuestion: QuestionEmitter): void {
    this.emitQuestion = emitQuestion;
  }

  appendQuestion(input: AppendQuestionInput): Question {
    const text = input.text.trim();
    if (!text) {
      throw new Error("Question text is required");
    }

    const seq = this.nextSeq;
    this.nextSeq += 1;

    const question: Question = {
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

  getAfter(seq: number): Question[] {
    return this.questions.filter((question) => question.seq > seq);
  }

  getLatestSeq(): number {
    return this.nextSeq - 1;
  }
}
