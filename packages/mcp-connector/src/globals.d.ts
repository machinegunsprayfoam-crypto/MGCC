/**
 * Minimal ambient declaration for `process`, so the package can read
 * `ANTHROPIC_API_KEY` from the environment without depending on `@types/node`.
 * Guarded at runtime with `typeof process !== "undefined"`.
 */
declare const process:
  | { env?: Record<string, string | undefined> }
  | undefined;
