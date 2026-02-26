export class AckStore {
    highestAckByClient = new Map();
    ack(clientId, seq) {
        const current = this.highestAckByClient.get(clientId) ?? 0;
        const next = Math.max(current, seq);
        this.highestAckByClient.set(clientId, next);
        return next;
    }
    getAck(clientId) {
        return this.highestAckByClient.get(clientId) ?? 0;
    }
}
