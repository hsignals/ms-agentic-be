// Owns safe runtime errors that cannot include provider requests or credentials.

/** A requested paid capability has not been configured. */
export class RuntimeUnavailableError extends Error {
  /** Creates a public-safe availability error. It has no intentional exception path. */
  constructor(message = 'The requested runtime capability is not configured.') {
    super(message);
    this.name = 'RuntimeUnavailableError';
  }
}

/** Execution failed; native SDK errors remain outside prompts, results, and logs. */
export class RuntimeExecutionError extends Error {
  #nativeCause: unknown;

  /** Preserves the backend cause privately. It has no intentional exception path. */
  constructor(message = 'Runtime execution failed.', opts?: ErrorOptions) {
    super(message);
    this.name = 'RuntimeExecutionError';
    this.#nativeCause = opts?.cause;
  }

  /**
   * Exposes only previously sanitized runtime causes to serializers.
   * Raw SDK failures may contain requests or credentials and remain private.
   * It has no intentional exception path.
   */
  override get cause(): RuntimeExecutionError | RuntimeUnavailableError | undefined {
    if (this.#nativeCause instanceof RuntimeExecutionError || this.#nativeCause instanceof RuntimeUnavailableError) {
      return this.#nativeCause;
    }

    return undefined;
  }
}
