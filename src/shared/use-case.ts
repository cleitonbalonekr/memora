// Minimal contract every backend use case implements: dependencies enter through
// the constructor, runtime input through execute, and the action returns its
// result. `I` may be `void` for use cases that take no runtime input.
export abstract class UseCase<I, O> {
  abstract execute(input: I): Promise<O>;
}
