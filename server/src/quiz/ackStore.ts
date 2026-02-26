export class AckStore {
  private readonly highestAckByClient = new Map<string, number>();

  ack(clientId: string, seq: number): number {
    const current = this.highestAckByClient.get(clientId) ?? 0;
    const next = Math.max(current, seq);
    this.highestAckByClient.set(clientId, next);
    return next;
  }

  getAck(clientId: string): number {
    return this.highestAckByClient.get(clientId) ?? 0;
  }
}
