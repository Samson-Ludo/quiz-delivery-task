import type { Server, Socket } from "socket.io";
import type { AckStore } from "../quiz/ackStore.js";
import type { QuizSession } from "../quiz/session.js";
import type { AckPayload, ServerHello } from "../quiz/types.js";
import { logInfo, logWarn } from "../utils/logger.js";
import { parseClientId, parseNonNegativeInt } from "../utils/validate.js";

const safeClientIdFromHandshake = (socket: Socket): string | null => {
  const raw = socket.handshake.query.clientId;
  if (Array.isArray(raw)) {
    return parseClientId(raw[0]);
  }
  return parseClientId(raw);
};

const isValidAck = (payload: unknown): payload is AckPayload => {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const maybe = payload as Partial<AckPayload>;
  return !!parseClientId(maybe.clientId) && parseNonNegativeInt(maybe.seq) !== null;
};

export const setupSocket = (io: Server, quizSession: QuizSession, ackStore: AckStore): void => {
  io.use((socket, next) => {
    const clientId = safeClientIdFromHandshake(socket);
    if (!clientId) {
      next(new Error("Missing or invalid clientId query parameter"));
      return;
    }
    socket.data.clientId = clientId;
    next();
  });

  io.on("connection", (socket) => {
    const clientId = parseClientId(socket.data.clientId);
    if (!clientId) {
      socket.disconnect(true);
      return;
    }

    const helloPayload: ServerHello = {
      clientId,
      latestSeq: quizSession.getLatestSeq(),
      lastAck: ackStore.getAck(clientId)
    };

    socket.emit("server:hello", helloPayload);
    logInfo("Socket connected", { socketId: socket.id, clientId });

    socket.on("client:ack", (payload: unknown) => {
      if (!isValidAck(payload)) {
        logWarn("Ignored malformed ACK payload", { socketId: socket.id });
        return;
      }

      const ackClientId = parseClientId(payload.clientId);
      const ackSeq = parseNonNegativeInt(payload.seq);
      if (!ackClientId || ackSeq === null || ackSeq === 0) {
        logWarn("Ignored ACK with invalid values", { socketId: socket.id, payload });
        return;
      }

      if (ackClientId !== clientId) {
        logWarn("Ignored ACK with mismatched clientId", {
          socketId: socket.id,
          expectedClientId: clientId,
          providedClientId: ackClientId
        });
        return;
      }

      const highestAck = ackStore.ack(clientId, ackSeq);
      logInfo("ACK recorded", { clientId, ackSeq, highestAck });
    });

    socket.on("disconnect", (reason) => {
      logInfo("Socket disconnected", { socketId: socket.id, clientId, reason });
    });
  });
};
