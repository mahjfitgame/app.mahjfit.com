import { OpenAreaRegistry } from './src/app/area/open/registry';
import { FoundationAreaBuilder } from './libs/src/foundation/area/builder';
import { FoundationModulePath } from './libs/src/foundation/module/path';
import { GameRoute } from './src/app/module/business/game/route';
import { FoundationAreaEnum } from './libs/src/foundation/enum';

const build = FoundationAreaBuilder.build(OpenAreaRegistry.modules, FoundationAreaEnum.OPEN);
FoundationModulePath.merge(build.paths);

console.log("GAME Route Path in FoundationModulePath:");
console.log(FoundationModulePath.all().get(GameRoute.registryKey));
console.log("GameRoute.absolutePath result:");
console.log(GameRoute.absolutePath("MY_GAME_KEY"));
