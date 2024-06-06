import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const jwtAuthentication = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bearerToken = req.header("Authorization");

    // TODO: Change message to translated
    if (!bearerToken)
      return res.status(401).json({
        status: "error",
        message:
          "Protected resource, use Authorization header with a valid JWT Token to get access",
      });

    const [_, token] = bearerToken.split(" ");

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    req.app.set("user", decoded);

    return next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message:
        "Protected resource, use Authorization header with a valid JWT Token to get access",
    });
  }
};
