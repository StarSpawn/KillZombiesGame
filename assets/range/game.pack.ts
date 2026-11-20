import { definePack, definePackageId } from '@forgeax/engine/pack/source';
import { ok } from '@forgeax/engine/types';

export { voxelRange } from './range.ts';

export default definePack({
  schemaVersion: '2.0.0',
  plugins: true,
  packageId: definePackageId('019fb7ce-3800-7000-8000-000000000000'),
  build: () => ok({
    'plugin/engine': {
      kind: 'plugin',
      module: { specifier: './game.pack.ts', export: 'voxelRange' },
      config: {},
    },
  }),
});
