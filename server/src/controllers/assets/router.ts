import { Router } from 'express';
import AssetsController from './index';

const router = Router();

// Create/Record asset
router.post('', AssetsController.createAsset);

// Fetch all assets
router.get('', AssetsController.fetchAssets);
router.get('/world-state', AssetsController.getWorldState);

router.get('/owner', AssetsController.fetchOwnerAsset);
router.post('/book', AssetsController.bookAsset);

// List asset to market
router.post(
	'/market-place/list/:assetUUID',
	AssetsController.listAssetToMarket
);

// De-list asset from marketplace
router.post(
	'/market-place/de-list/:assetUUID',
	AssetsController.deListItemFromMarket
);

// Fetch all assets in the market place
router.get('/market-place', AssetsController.fetchMarketplace);
router.get('/deals', AssetsController.fetchDeals);
router.get('/deals/inspection', AssetsController.fetchDealsInspection);
router.post('/deals/message/:dealUUID', AssetsController.addMessage);
router.put('/deals/:dealUUID', AssetsController.updateDeal);
router.post('/deals/:dealUUID/upload', AssetsController.uploadContract);

// Fetch all assets owned by a user
router.get('/:ownerUUID', AssetsController.fetchUserAssets);

export default router;
