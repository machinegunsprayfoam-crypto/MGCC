/** Raised when a programmatic tool calling request/config is invalid. */
export class ProgrammaticToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProgrammaticToolError";
  }
}
