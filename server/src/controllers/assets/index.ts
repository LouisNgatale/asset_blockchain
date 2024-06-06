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

  // Fetch all assets by admin
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

  // Fetch all assets by owner
  static async fetchUserAssets(req: Request, res: Response) {
    try {
      const ownerUUID = req.params.ownerUUID;

      const assets = await prisma.asset.findMany({
        where: {
          owner: {
            is: {
              uuid: ownerUUID,
            },
          },
        },
      });

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

  // List asset to market place
  static async listAssetToMarket(req: Request, res: Response) {
    interface IPayload {
      listingPrice: string;
    }

    try {
      const assetUUID = req.params.assetUUID;
      const payload = req.body as IPayload;

      const listedAsset = await prisma.asset.update({
        where: {
          uuid: assetUUID,
        },
        data: {
          isListed: true,
          listedOn: new Date(),
          listingPrice: payload.listingPrice,
        },
      });

      return res.status(200).json({
        status: "success",
        message: "Asset successfully listed on the market",
        data: listedAsset,
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

  // Fetch all assets in market place
  static async fetchMarketplace(req: Request, res: Response) {
    try {
      const assets = await prisma.asset.findMany({
        where: {
          isListed: true,
        },
      });

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

  // Remove asset from market place
  static async deListItemFromMarket(req: Request, res: Response) {
    try {
      const assetUUID = req.params.assetUUID;

      const listedAsset = await prisma.asset.update({
        where: {
          uuid: assetUUID,
        },
        data: {
          isListed: false,
        },
      });

      return res.status(200).json({
        status: "success",
        message: "Asset successfully listed on the market",
        data: listedAsset,
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
}
