export const errorHandler = (err, req, res, next) => {
  console.error("--- ERROR START ---");
  console.error(`Method: ${req.method} | URL: ${req.originalUrl}`);
  console.error(`Body: ${JSON.stringify(req.body)}`);
  console.error(err.stack);
  console.error("--- ERROR END ---");
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message || "Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
