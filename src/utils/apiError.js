class apiError extends Error {
  constructor(
    statusCode,
    message = 'Something went wrong',
    errors = [],
    stack,
  ) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    this.stack = stack || new Error().stack
    this.data = null
    this.success = false
  }
}
export { apiError }
