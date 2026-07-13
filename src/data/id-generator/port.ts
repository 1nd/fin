// CCA: 2
/**
 * Port for id generation — a platform detail (web `crypto.randomUUID` is not
 * available on React Native's Hermes runtime), so implementations are
 * supplied by the outer wiring layer, never called directly here.
 */
export type IdGenerator = () => string;
