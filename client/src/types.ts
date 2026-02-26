export type Question = {
  seq: number;
  id: string;
  text: string;
  latex?: string;
  createdAt: number;
};

export type ReconcileResponse = {
  clientId: string;
  sinceSeq: number;
  questions: Question[];
};

export type ServerHello = {
  clientId: string;
  latestSeq: number;
  lastAck: number;
};
