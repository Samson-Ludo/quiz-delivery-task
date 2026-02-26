export type Question = {
  seq: number;
  id: string;
  text: string;
  latex?: string;
  createdAt: number;
};

export type AppendQuestionInput = {
  id?: string;
  text: string;
  latex?: string;
};

export type AckPayload = {
  clientId: string;
  seq: number;
};

export type ServerHello = {
  clientId: string;
  latestSeq: number;
  lastAck: number;
};
