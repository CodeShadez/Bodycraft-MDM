import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err); // Log the error for debugging purposes

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    message: message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};
