export interface Tracer {
  startSpan(name: string, context: any): () => void
}
