import { Request, Response } from "express";
import { ResponseCode } from "../../constants";
import { ASSET_TYPE, AssetDocument } from "@prisma/client";
import { prisma } from "../../app";
import { uuid } from "uuidv4";

export default class AssetsController {
  // Create asset
  static async createAsset(req: Request, res: Response) {
    interface IPayload {
      owner: {
        uuid: string;
        fullName: string;
        NIDA: string;
        phoneNumber: string;
      };
      type: ASSET_TYPE;
      location: {
        nearbyLocation: string;
        locationName: string;
        latitude: string;
        longitude: string;
      };
      parcelNumber: string;
      plotNumber: string;
      titleNumber: string;
      valuation: string;
      areaSize: string;
      images: string[];
      description: string;
      documents: AssetDocument[];
    }

    try {
      const body = req.body as IPayload;

      const createdAsset = await prisma.asset.create({
        data: {
          uuid: uuid(),
          type: body.type,
          owner: {
            uuid: body.owner.uuid,
            fullName: body.owner.fullName,
            NIDA: body.owner.NIDA,
            phoneNumber: body.owner.phoneNumber,
          },
          location: {
            latitude: Number(body.location.latitude),
            longitude: Number(body.location.longitude),
            nearbyLocation: body.location.nearbyLocation,
            locationName: body.location.locationName,
          },
          dimensions: {
            value: +body.areaSize,
            unit: "square meter",
          },
          isListed: false,
          images: body.images,
          description: body.description,
          valuation: body.valuation,
          parcelNumber: body.parcelNumber,
          plotNumber: body.plotNumber,
          titleNumber: body.titleNumber,
          documents: body.documents,
          registeredAt: new Date(),
        },
      });

      return res.status(201).json({
        status: "success",
        data: createdAsset,
      });
    } catch (e) {
      const error = e as Error;
      return res.status(400).json({
        status: "error",
        message: error.message,
        code: ResponseCode.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // TODO: Fetch all assets by admin
  static async fetchAssets(req: Request, res: Response) {
    try {
      const assets = await prisma.asset.findMany();

      return res.status(200).json({
        status: "success",
        data: assets,
      });
    } catch (e) {
      const error = e as Error;
      return res.status(400).json({
        status: "error",
        message: error.message,
        code: ResponseCode.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // TODO: Fetch all assets by owner
  // TODO: List asset to market place
  // TODO: Fetch all assets in market place
  // TODO: Remove asset from market place
}
