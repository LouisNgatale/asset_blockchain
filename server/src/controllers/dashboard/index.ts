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

      const promises = citizens.map(async (citizen) => {
        const { otp, ...rest } = citizen;

        // Fetch citizen assets
        const assets = await prisma.asset.findMany({
          where: {
            owner: {
              is: {
                NIDA: citizen.NIDA,
              },
            },
          },
        });

        return { ...rest, assets };
      });

      const allCitizens = await Promise.all(promises);

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

  static async getStats(req: Request, res: Response) {
    try {
      /**
       * - All citizens
       * - All assets
       * - Active deals
       * - All admins
       * */
      const citizens = await prisma.user.count({
        where: {
          role: UserRole.CITIZEN,
        },
      });
      const admins = await prisma.user.count({
        where: {
          role: UserRole.ADMIN,
        },
      });
      const listedAssets = await prisma.asset.count({
        where: {
          isListed: true,
        },
      });
      const allAssets = await prisma.asset.count();

      return res.json({
        success: true,
        data: {
          allAssets,
          citizens,
          admins,
          listedAssets,
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

  // Get all active deals
  // Get all assets
  // Create new user assets
}
