import { io, type Socket } from "socket.io-client";
import { fetchReconcile } from "./api";
import { getLastSeqSeen, getOrCreateClientId, setLastSeqSeen } from "./storage";
import type { Question, ServerHello } from "./types";

declare global {
  interface Window {
    katex?: {
      render: (expression: string, element: HTMLElement, options?: { throwOnError?: boolean }) => void;
    };
  }
}

const clientId = getOrCreateClientId();
const state = {
  lastSeqSeen: getLastSeqSeen(clientId),
  renderedSeqs: new Set<number>()
};

const clientIdEl = document.querySelector<HTMLSpanElement>("#client-id");
const connectionStatusEl = document.querySelector<HTMLSpanElement>("#connection-status");
const lastSeqSeenEl = document.querySelector<HTMLElement>("#last-seq-seen");
const gapAlertsEl = document.querySelector<HTMLElement>("#gap-alerts");
const questionListEl = document.querySelector<HTMLElement>("#question-list");

if (!clientIdEl || !connectionStatusEl || !lastSeqSeenEl || !gapAlertsEl || !questionListEl) {
  throw new Error("Required UI elements are missing.");
}

clientIdEl.textContent = clientId;
lastSeqSeenEl.textContent = String(state.lastSeqSeen);

const setConnectionStatus = (connected: boolean): void => {
  connectionStatusEl.textContent = connected ? "Connected" : "Disconnected";
  connectionStatusEl.classList.toggle("connected", connected);
  connectionStatusEl.classList.toggle("disconnected", !connected);
};

const persistLastSeqSeen = (nextSeq: number): void => {
  state.lastSeqSeen = Math.max(state.lastSeqSeen, nextSeq);
  setLastSeqSeen(clientId, state.lastSeqSeen);
  lastSeqSeenEl.textContent = String(state.lastSeqSeen);
};

const appendGapWarning = (message: string): void => {
  const alert = document.createElement("div");
  alert.className = "gap-alert";
  alert.textContent = message;
  gapAlertsEl.prepend(alert);
  setTimeout(() => alert.remove(), 6000);
};

const renderLatex = (container: HTMLElement, latex: string): void => {
  try {
    if (window.katex?.render) {
      window.katex.render(latex, container, { throwOnError: false });
      return;
    }
  } catch {
    // Fall through to plain text fallback.
  }
  container.textContent = latex;
};

const renderQuestion = (question: Question, recovered: boolean): void => {
  if (state.renderedSeqs.has(question.seq)) {
    return;
  }
  state.renderedSeqs.add(question.seq);

  const card = document.createElement("article");
  card.className = "question-card";

  const top = document.createElement("div");
  top.className = "question-top";

  const seqEl = document.createElement("span");
  seqEl.className = "question-seq";
  seqEl.textContent = `seq ${question.seq}`;

  top.append(seqEl);

  if (recovered) {
    const badge = document.createElement("span");
    badge.className = "recovered-badge";
    badge.textContent = "Recovered";
    top.append(badge);
    setTimeout(() => badge.remove(), 4500);
  }

  const textEl = document.createElement("p");
  textEl.className = "question-text";
  textEl.textContent = question.text;

  card.append(top, textEl);

  if (question.latex) {
    const latexEl = document.createElement("div");
    latexEl.className = "question-latex";
    renderLatex(latexEl, question.latex);
    card.append(latexEl);
  }

  questionListEl.append(card);
};

const emitAck = (socket: Socket, seq: number): void => {
  socket.emit("client:ack", { clientId, seq });
};

const recoverQuestions = async (socket: Socket): Promise<void> => {
  const reconcilePayload = await fetchReconcile(clientId, state.lastSeqSeen);
  const recovered = reconcilePayload.questions.sort((a, b) => a.seq - b.seq);

  for (const question of recovered) {
    renderQuestion(question, true);
    emitAck(socket, question.seq);
    persistLastSeqSeen(question.seq);
  }
};

const socket = io("http://localhost:3001", {
  query: { clientId }
});

socket.on("connect", async () => {
  setConnectionStatus(true);
  try {
    await recoverQuestions(socket);
  } catch (error) {
    appendGapWarning(`Reconcile failed: ${String(error)}`);
  }
});

socket.on("disconnect", () => {
  setConnectionStatus(false);
});

socket.on("server:hello", (payload: ServerHello) => {
  if (payload.clientId !== clientId) {
    appendGapWarning("Server returned a mismatched clientId during hello.");
  }
});

socket.on("server:question", (question: Question) => {
  const expected = state.lastSeqSeen + 1;
  if (question.seq > expected) {
    const message = `WARNING: Gap detected - expected seq ${expected}, received seq ${question.seq}`;
    console.warn(message);
    appendGapWarning(message);
  }

  renderQuestion(question, false);
  emitAck(socket, question.seq);
  persistLastSeqSeen(question.seq);
});
