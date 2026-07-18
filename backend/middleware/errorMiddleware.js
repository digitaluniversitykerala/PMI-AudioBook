// middleware/errorMiddleware.js — global error handler.
// Verbose in dev, tight in prod (no stack/body leakage).
const isProd = process.env.NODE_ENV === "production";

export const errorHandler = (err, req, res, _next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  if (!isProd) {
    console.error("--- ERROR ---");
    console.error(`${req.method} ${req.originalUrl}`);
    console.error(err.stack);
  } else if (statusCode >= 500) {
    // In prod, only log server errors (client errors are noise).
    console.error(`[5xx] ${req.method} ${req.originalUrl}: ${err.message}`);
  }

  res.status(statusCode).json({
    error: statusCode >= 500 && isProd ? "Internal server error" : err.message || "Server error",
    ...(isProd ? {} : { stack: err.stack }),
  });
};
