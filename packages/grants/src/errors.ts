/** Raised when grant finder/getter parameters are invalid. */
export class GrantsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrantsError";
  }
}
