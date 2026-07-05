/** Raised when a Skills request configuration is invalid. */
export class SkillsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillsConfigError";
  }
}
