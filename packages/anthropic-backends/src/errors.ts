/** Raised when a backend is missing required configuration (region, resource…). */
export class BackendConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackendConfigError";
  }
}
