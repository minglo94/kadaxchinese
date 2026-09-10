import { FORBIDDEN, NOT_FOUND, PROFILE_REQUIRED } from "./types";

/**
 * Client-matchable errors, mirroring `UnauthorizedError`'s contract (the client
 * matches on `error.message`). Kept out of `guards.server.ts` so client modules
 * can import them without dragging `@/lib/db` — and therefore `pg` and the
 * PGLite WASM bundle — into the browser graph.
 */
export class ProfileRequiredError extends Error {
  readonly status = 409;
  constructor() {
    super(PROFILE_REQUIRED);
    this.name = "ProfileRequiredError";
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super(FORBIDDEN);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  readonly status = 404;
  constructor() {
    super(NOT_FOUND);
    this.name = "NotFoundError";
  }
}
