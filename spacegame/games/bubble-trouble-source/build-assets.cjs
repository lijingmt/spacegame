const { AssetPack } = require('@assetpack/core');
const config = require('./.assetpack.js').default;

const assetpack = new AssetPack(config);
assetpack.run().catch(e => {
    console.error('Asset build failed:', e.message);
    process.exit(1);
});
