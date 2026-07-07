/**
 * Operational error class. Distinguishes expected, handled errors (bad
 * input, not found, unauthorized) from programming errors/bugs, so the
 * global error handler can respond appropriately to each.
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
