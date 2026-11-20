import { definePack, definePackageId } from '@forgeax/engine/pack/source';
import { ok } from '@forgeax/engine/types';

export { hud } from './hud.ts';

export default definePack({
  schemaVersion: '2.0.0',
  plugins: true,
  packageId: definePackageId('019fb7ce-3d00-7000-8000-000000000000'),
  build: () => ok({
    'plugin/host': {
      kind: 'plugin',
      module: { specifier: './hud.pack.ts', export: 'hud' },
      config: {},
    },
  }),
});
