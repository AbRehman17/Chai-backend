// PROMISES HANDLER
const asyncHandler = (requestHandler) => {
  ;(req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next)
  }
}

/* ASYNC AWAIT HANDLER
const asyncHandler = (fn) => {
  ;async (req, res, next) => {
    try {
      await fn(req, res, next)
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
      })
    }
  }
}
  */
export { asyncHandler }
