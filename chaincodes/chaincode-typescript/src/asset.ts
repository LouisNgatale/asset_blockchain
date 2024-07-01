/*
  SPDX-License-Identifier: Apache-2.0
*/

import {Object, Property} from 'fabric-contract-api';

@Object()
export class Asset {
	@Property()
	public docType?: string;

	@Property()
	public uuid: string;

	@Property()
	public type: string;

	@Property()
	public ownerUUID: string;

	@Property()
	public parcelNumber: string;

	@Property()
	public plotNumber: string;

	@Property()
	public titleNumber: number;
}
