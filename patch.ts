import * as fs from 'fs';

const filePath = '/Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com/src/app/module/business/game/phaser/scenes/scene.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `            if (runtime.zone === "discard") {`,
  `            if (!this.exposureBuildAsset && runtime.vm && runtime.vm.tile_id) {
              this.exposureBuildAsset = this.gameService.assetBaseName(this.allTiles[runtime.vm.tile_id]);
            }
            if (runtime.zone === "discard") {`
);

fs.writeFileSync(filePath, content);
