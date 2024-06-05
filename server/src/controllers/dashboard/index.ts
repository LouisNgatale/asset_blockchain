import { Request, Response } from "express";
import { ResponseCode } from "../../constants";
import { prisma } from "../../app";
import { UserRole } from "@prisma/client";

export default class Dashboard {
  // Get dashboard stats
  // Get all citizens
  static async getCitizens(req: Request, res: Response) {
    try {
      const citizens = await prisma.user.findMany({
        where: {
          role: UserRole.CITIZEN,
        },
      });

      const allCitizens = citizens.map((citizen) => {
        const { otp, ...rest } = citizen;

        return rest;
      });

      return res.json({
        success: true,
        data: allCitizens,
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

  // Get all active deals
  // Get all assets
  // Create new user assets
}
