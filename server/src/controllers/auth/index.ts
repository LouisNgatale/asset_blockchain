import { Request, Response } from "express";
import { prisma } from "../../app";
import { ResponseCode } from "../../constants";
import { uuid } from "uuidv4";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

export default class AuthController {
  static async login(req: Request, res: Response) {
    interface LoginDto {
      NIDA: string;
      phoneNumber: string;
    }

    try {
      const body = req.body as LoginDto;

      if (!body.NIDA || !body.phoneNumber)
        return res.status(400).json({
          success: false,
          code: ResponseCode.INTERNAL_SERVER_ERROR,
          message: "Provide payload",
        });

      const userExists = await prisma.user.findUnique({
        where: {
          NIDA: body.NIDA,
        },
      });

      if (!userExists)
        return res.status(400).json({
          success: false,
          code: ResponseCode.USER_DOESNT_EXIST,
        });

      const accessToken = jwt.sign(
        {
          uuid: userExists.uuid,
          NIDA: userExists.NIDA,
          fullName: userExists.fullName,
          phoneNumber: userExists.phoneNumber,
        },
        process.env.JWT_SECRET || "secret",
        {
          expiresIn: "1y",
        },
      );

      return res.json({
        success: true,
        data: {
          user: userExists,
          accessToken,
        },
      });
    } catch (e) {
      const error = e as Error;
      return res.status(400).json({
        success: false,
        message: error.message,
        code: ResponseCode.INTERNAL_SERVER_ERROR,
      });
    }
  }

  static async loginStaff(req: Request, res: Response) {
    interface LoginDto {
      NIDA: string;
      phoneNumber: string;
    }

    try {
      const body = req.body as LoginDto;

      if (!body.NIDA || !body.phoneNumber)
        return res.status(400).json({
          success: false,
          code: ResponseCode.INTERNAL_SERVER_ERROR,
          message: "Provide payload",
        });

      const userExists = await prisma.user.findUnique({
        where: {
          NIDA: body.NIDA,
        },
      });

      if (!userExists)
        return res.status(400).json({
          success: false,
          code: ResponseCode.USER_DOESNT_EXIST,
        });

      if (userExists.role !== UserRole.ADMIN)
        return res.status(400).json({
          success: false,
          code: ResponseCode.UNAUTHORIZED,
          message:
            "You're not an authorized dashboard. You can't access this resource",
        });

      const accessToken = jwt.sign(
        {
          uuid: userExists.uuid,
          NIDA: userExists.NIDA,
          fullName: userExists.fullName,
          phoneNumber: userExists.phoneNumber,
        },
        process.env.JWT_SECRET || "secret",
        {
          expiresIn: "1y",
        },
      );

      return res.json({
        success: true,
        data: {
          user: userExists,
          accessToken,
        },
      });
    } catch (e) {
      const error = e as Error;
      return res.status(400).json({
        success: false,
        message: error.message,
        code: ResponseCode.INTERNAL_SERVER_ERROR,
      });
    }
  }

  static async register(req: Request, res: Response) {
    interface RegisterDto {
      NIDA: string;
      phoneNumber: string;
      email: string;
      fullName: string;
      citizenship: string;
      countryCode: string;
    }

    try {
      const body = req.body as RegisterDto;

      const userExists = await prisma.user.findUnique({
        where: {
          NIDA: body.NIDA,
        },
      });

      if (userExists)
        return res.json({
          success: false,
          code: ResponseCode.USER_ALREADY_EXISTS,
        });

      const createdUser = await prisma.user.create({
        data: {
          uuid: uuid(),
          email: body.email,
          phoneNumber: body.phoneNumber,
          fullName: body.fullName,
          NIDA: body.NIDA,
          role: UserRole.CITIZEN,
          createdAt: new Date(),
          countryCode: body.countryCode || "255",
          citizenship: body.citizenship || "Tanzania",
        },
      });

      return res.json({
        success: true,
        data: {
          user: createdUser,
        },
      });
    } catch (e) {
      const error = e as Error;
      return res.json({
        success: false,
        message: error.message,
        code: ResponseCode.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
