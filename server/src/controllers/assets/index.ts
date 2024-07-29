import { Request, Response } from 'express';
import { ResponseCode } from '../../constants';
import {
	ASSET_TYPE,
	AssetDocument,
	BookingStage,
	DealStage,
	PartialUser,
} from '@prisma/client';
import { prisma } from '../../app';
import { uuid } from 'uuidv4';
import { JwtPayload } from 'jsonwebtoken';
import currency from 'currency.js';
import { Contract } from '@hyperledger/fabric-gateway';

const utf8Decoder = new TextDecoder();

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
			const contract = req.app.get('contract') as Contract;

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
						latitude: body.location.latitude,
						longitude: body.location.longitude,
						nearbyLocation: body.location.nearbyLocation,
						locationName: body.location.locationName,
					},
					dimensions: {
						value: +body.areaSize,
						unit: 'square meter',
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

			await contract.submitTransaction(
				'CreateAsset',
				createdAsset.uuid,
				createdAsset.type,
				createdAsset.owner.uuid,
				createdAsset.parcelNumber,
				createdAsset.plotNumber,
				createdAsset.titleNumber
			);

			return res.status(201).json({
				status: 'success',
				data: createdAsset,
			});
		} catch (e) {
			const error = e as Error;
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	static async getWorldState(req: Request, res: Response) {
		try {
			const contract = req.app.get('contract') as Contract;

			const resultBytes = await contract.evaluateTransaction('GetAllAssets');

			const resultJson = utf8Decoder.decode(resultBytes);
			const result = JSON.parse(resultJson);
			console.log('*** Result:', result);

			// result.map(async (res) => {})

			return res.json({ data: result, status: 'success' });
		} catch (e) {
			const error = e as Error;
			return res.status(400).json({
				status: 'error',
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
				status: 'success',
				data: assets,
			});
		} catch (e) {
			const error = e as Error;
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	// Fetch all assets by admin
	static async fetchOwnerAsset(req: Request, res: Response) {
		try {
			// @ts-ignore
			const sessionUser = req?.app.get('user') as JwtPayload;

			const assets = await prisma.asset.findMany({
				where: {
					owner: {
						is: {
							uuid: sessionUser.uuid,
						},
					},
				},
				include: {
					booking: true,
				},
			});

			return res.status(200).json({
				status: 'success',
				data: assets,
			});
		} catch (e) {
			console.error(e);
			const error = e as Error;
			return res.status(400).json({
				status: 'error',
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
				status: 'success',
				data: assets,
			});
		} catch (e) {
			const error = e as Error;
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	// List asset to market-place
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
				status: 'success',
				message: 'Asset successfully listed on the market',
				data: listedAsset,
			});
		} catch (e) {
			const error = e as Error;
			console.error(e);
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	// Fetch all assets in market-place
	static async fetchMarketplace(req: Request, res: Response) {
		try {
			const assets = await prisma.asset.findMany({
				where: {
					isListed: true,
				},
				include: {
					booking: true,
				},
			});

			return res.status(200).json({
				status: 'success',
				data: assets,
			});
		} catch (e) {
			const error = e as Error;
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	static async fetchDeals(req: Request, res: Response) {
		try {
			const sessionUser = req?.app.get('user') as JwtPayload;

			const deals = await prisma.assetBooking.findMany({
				where: {
					OR: [
						{
							buyer: {
								is: {
									uuid: sessionUser.uuid,
								},
							},
						},
						{
							asset: {
								owner: {
									is: {
										uuid: sessionUser.uuid,
									},
								},
							},
						},
					],
				},
				include: {
					asset: true,
				},
			});

			return res.status(200).json({
				status: 'success',
				data: deals,
			});
		} catch (e) {
			const error = e as Error;
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	static async fetchDealsInspection(req: Request, res: Response) {
		try {
			const deals = await prisma.assetBooking.findMany({
				where: {
					stages: {
						some: {
							name: DealStage.LAND_INSPECTOR,
						},
					},
				},
				include: {
					asset: true,
				},
			});

			const filteredBookings = deals.filter((deal) => {
				const lastStage = deal.stages.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
				)[0];
				return lastStage.name === DealStage.LAND_INSPECTOR;
			});

			return res.status(200).json({
				status: 'success',
				data: filteredBookings,
			});
		} catch (e) {
			console.error(e);
			const error = e as Error;
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	// Remove asset from market-place
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
				status: 'success',
				message: 'Asset successfully listed on the market',
				data: listedAsset,
			});
		} catch (e) {
			const error = e as Error;
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	// Remove asset from market-place
	static async bookAsset(req: Request, res: Response) {
		interface Payload {
			assetUUID: string;
			buyer: PartialUser;
			proposedPrice: string;
			paymentType: string;
		}

		try {
			const body = req.body as Payload;

			const bookingStage = {
				name: DealStage.OFFER,
				date: new Date(),
				metadata: {
					proposedPrice: body.proposedPrice,
					paymentType: body.paymentType,
				},
			};

			const booking = await prisma.assetBooking.create({
				data: {
					uuid: uuid(),
					assetUUID: body.assetUUID,
					stages: [bookingStage],
					buyer: body.buyer,
					proposedPrice: body.proposedPrice,
				},
			});

			return res.status(200).json({
				status: 'success',
				message: 'Booking successfully added',
				data: booking,
			});
		} catch (e) {
			const error = e as Error;
			console.error(error);
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	static async addMessage(req: Request, res: Response) {
		interface Payload {
			id: string;
			text: string;
			createdAt: string;
			user: {
				uuid: string;
				fullName: string;
				avatar: string;
			};
		}

		try {
			const body = req.body as Payload[];

			const dealUUID = req.params.dealUUID;

			const booking = await prisma.assetBooking.update({
				where: { uuid: dealUUID },
				data: {
					messages: {
						push: body,
					},
				},
			});

			return res.status(200).json({
				status: 'success',
				message: 'Booking successfully added',
				data: booking,
			});
		} catch (e) {
			const error = e as Error;
			console.error(error);
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	static async updateDeal(req: Request, res: Response) {
		try {
			const body = req.body as BookingStage;

			const dealUUID = req.params.dealUUID;

			const booking = await prisma.assetBooking.update({
				where: { uuid: dealUUID },
				data: {
					stages: {
						push: body,
					},
				},
			});

			return res.status(200).json({
				status: 'success',
				message: 'Booking successfully added',
				data: booking,
			});
		} catch (e) {
			const error = e as Error;
			console.error(error);
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	static async updatePaidAmount(req: Request, res: Response) {
		try {
			const body = req.body as {
				paidAmount: string;
			};
			const dealUUID = req.params.dealUUID;

			const deal = await prisma.assetBooking.findFirst({
				where: {
					uuid: dealUUID,
				},
			});

			const updated = await prisma.assetBooking.update({
				where: {
					uuid: dealUUID,
				},
				data: {
					paidAmount: currency(deal?.paidAmount || 0)
						.add(body.paidAmount)
						.toString(),
				},
			});

			return res.json({
				data: updated,
				status: 'success',
			});
		} catch (e) {
			console.error(e);
			const error = e as Error;
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	static async uploadContract(req: Request, res: Response) {
		try {
			const payload = req.body as {
				signedContract?: string;
				originalContract?: string;
			};

			let data = {} as any;

			if (payload.originalContract)
				data.originalContract = payload.originalContract;
			if (payload.signedContract) data.signedContract = payload.signedContract;

			const dealUUID = req.params.dealUUID;

			const booking = await prisma.assetBooking.update({
				where: { uuid: dealUUID },
				data,
			});

			return res.status(200).json({
				status: 'success',
				message: 'Booking successfully added',
				data: booking,
			});
		} catch (e) {
			const error = e as Error;
			console.error(error);
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}

	static async transferAsset(req: Request, res: Response) {
		try {
			const contract = req.app.get('contract') as Contract;

			const dealUUID = req.params.dealUUID;

			const booking = await prisma.assetBooking.update({
				where: {
					uuid: dealUUID,
				},
				data: {
					stages: {
						push: {
							name: DealStage.COMPLETED,
							date: new Date(),
						},
					},
				},
			});

			const bookingWithAsset = await prisma.assetBooking.findFirst({
				where: {
					uuid: dealUUID,
				},
				include: {
					asset: true,
				},
			});

			const newOwner = booking.buyer;

			// Update asset
			const updatedAsset = await prisma.asset.update({
				where: {
					uuid: bookingWithAsset?.asset?.uuid,
				},
				data: {
					owner: newOwner,
					pastOwners: {
						push: bookingWithAsset?.asset?.owner,
					},
					isListed: false,
				},
			});

			console.log(bookingWithAsset?.asset?.uuid);
			// Update the world state
			await contract.submitTransaction(
				'TransferAsset',
				bookingWithAsset?.asset?.uuid!,
				newOwner.uuid
			);

			return res.status(200).json({
				data: updatedAsset,
				status: 'success',
			});
		} catch (e) {
			console.error(e);
			const error = e as Error;
			return res.status(400).json({
				status: 'error',
				message: error.message,
				code: ResponseCode.INTERNAL_SERVER_ERROR,
			});
		}
	}
}
