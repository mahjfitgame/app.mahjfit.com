import * as fs from 'fs';

const filePath = '/Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com/src/app/module/business/game/phaser/scenes/scene.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `    this.game.events.on("table:turn_stage", (stage: any) => {
      this.turnStage = stage;
      this.processPendingClaimTile();
    }, this);`,
  `    this.game.events.on("table:turn_stage", (stage: any) => {
      this.turnStage = stage;
      setTimeout(() => this.processPendingClaimTile(), 50);
    }, this);`
);

fs.writeFileSync(filePath, content);
