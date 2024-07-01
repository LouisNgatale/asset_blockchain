/*
 * SPDX-License-Identifier: Apache-2.0
 */
// Deterministic JSON.stringify()
import {
	Context,
	Contract,
	Info,
	Returns,
	Transaction,
} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';

@Info({
	title: 'AssetTransfer',
	description: 'Smart contract for trading assets',
})
export class AssetTransferContract extends Contract {
	@Transaction()
	public async InitLedger(ctx: Context): Promise<void> {
		// const assets: Asset[] = [
		// 	{
		// 		ID: 'asset1',
		// 		Color: 'blue',
		// 		Size: 5,
		// 		Owner: 'Tomoko',
		// 		AppraisedValue: 300,
		// 	},
		// 	{
		// 		ID: 'asset2',
		// 		Color: 'red',
		// 		Size: 5,
		// 		Owner: 'Brad',
		// 		AppraisedValue: 400,
		// 	},
		// 	{
		// 		ID: 'asset3',
		// 		Color: 'green',
		// 		Size: 10,
		// 		Owner: 'Jin Soo',
		// 		AppraisedValue: 500,
		// 	},
		// 	{
		// 		ID: 'asset4',
		// 		Color: 'yellow',
		// 		Size: 10,
		// 		Owner: 'Max',
		// 		AppraisedValue: 600,
		// 	},
		// 	{
		// 		ID: 'asset5',
		// 		Color: 'black',
		// 		Size: 15,
		// 		Owner: 'Adriana',
		// 		AppraisedValue: 700,
		// 	},
		// 	{
		// 		ID: 'asset6',
		// 		Color: 'white',
		// 		Size: 15,
		// 		Owner: 'Michel',
		// 		AppraisedValue: 800,
		// 	},
		// ];
		// for (const asset of assets) {
		// 	asset.docType = 'asset';
		// 	// example of how to write to world state deterministically
		// 	// use convetion of alphabetic order
		// 	// we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
		// 	// when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
		// 	await ctx.stub.putState(
		// 		asset.ID,
		// 		Buffer.from(stringify(sortKeysRecursive(asset)))
		// 	);
		// 	console.info(`Asset ${asset.ID} initialized`);
		// }
	}

	// CreateAsset issues a new asset to the world state with given details.
	@Transaction()
	public async CreateAsset(
		ctx: Context,
		uuid: string,
		type: string,
		ownerUUID: string,
		parcelNumber: string,
		plotNumber: string,
		titleNumber: string
	): Promise<void> {
		const exists = await this.AssetExists(ctx, uuid);
		if (exists) {
			throw new Error(`The asset ${uuid} already exists`);
		}

		const asset = {
			uuid: uuid,
			type: type,
			ownerUUID: ownerUUID,
			parcelNumber: parcelNumber,
			plotNumber: plotNumber,
			titleNumber: titleNumber,
		};
		// we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
		await ctx.stub.putState(
			uuid,
			Buffer.from(stringify(sortKeysRecursive(asset)))
		);
	}

	// ReadAsset returns the asset stored in the world state with given id.
	@Transaction(false)
	public async ReadAsset(ctx: Context, uuid: string): Promise<string> {
		const assetJSON = await ctx.stub.getState(uuid); // get the asset from chaincode state
		if (!assetJSON || assetJSON.length === 0) {
			throw new Error(`The asset ${uuid} does not exist`);
		}
		return assetJSON.toString();
	}

	// UpdateAsset updates an existing asset in the world state with provided parameters.
	@Transaction()
	public async UpdateAsset(
		ctx: Context,
		uuid: string,
		type: string,
		ownerUUID: string,
		parcelNumber: string,
		plotNumber: string,
		titleNumber: string
	): Promise<void> {
		const exists = await this.AssetExists(ctx, uuid);
		if (!exists) {
			throw new Error(`The asset ${uuid} does not exist`);
		}

		// overwriting original asset with new asset
		const updatedAsset = {
			uuid: uuid,
			type: type,
			ownerUUID: ownerUUID,
			parcelNumber: parcelNumber,
			plotNumber: plotNumber,
			titleNumber: titleNumber,
		};
		// we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
		return ctx.stub.putState(
			uuid,
			Buffer.from(stringify(sortKeysRecursive(updatedAsset)))
		);
	}

	// DeleteAsset deletes an given asset from the world state.
	@Transaction()
	public async DeleteAsset(ctx: Context, uuid: string): Promise<void> {
		const exists = await this.AssetExists(ctx, uuid);
		if (!exists) {
			throw new Error(`The asset ${uuid} does not exist`);
		}
		return ctx.stub.deleteState(uuid);
	}

	// AssetExists returns true when asset with given ID exists in world state.
	@Transaction(false)
	@Returns('boolean')
	public async AssetExists(ctx: Context, uuid: string): Promise<boolean> {
		const assetJSON = await ctx.stub.getState(uuid);
		return assetJSON && assetJSON.length > 0;
	}

	// TransferAsset updates the owner field of asset with given id in the world state, and returns the old owner.
	@Transaction()
	public async TransferAsset(
		ctx: Context,
		uuid: string,
		newOwner: string
	): Promise<string> {
		const assetString = await this.ReadAsset(ctx, uuid);
		const asset = JSON.parse(assetString);
		const oldOwner = asset.ownerUUID;
		asset.ownerUUID = newOwner;
		// we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
		await ctx.stub.putState(
			uuid,
			Buffer.from(stringify(sortKeysRecursive(asset)))
		);
		return oldOwner;
	}

	// GetAllAssets returns all assets found in the world state.
	@Transaction(false)
	@Returns('string')
	public async GetAllAssets(ctx: Context): Promise<string> {
		const allResults = [];
		// range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
		const iterator = await ctx.stub.getStateByRange('', '');
		let result = await iterator.next();
		while (!result.done) {
			const strValue = Buffer.from(result.value.value.toString()).toString(
				'utf8'
			);
			let record;
			try {
				record = JSON.parse(strValue);
			} catch (err) {
				console.log(err);
				record = strValue;
			}
			allResults.push(record);
			result = await iterator.next();
		}
		return JSON.stringify(allResults);
	}
}
