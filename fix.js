const fs = require('fs');
const file = 'src/app/module/business/game/phaser/layout/ui.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /\/\/ Native HTML renders the label; retain this transparent text only\n      text\.on\("pointerdown", \(pointer: Phaser\.Input\.Pointer\) => {\n        pointer\.event\?\.stopPropagation\?\.\(\);\n        const settingsMenuAction = this\.settingsMenuActionForLabel\(label\);\n        this\.activeHudDropdown = undefined;\n        this\.layoutHudDropdown\(layout\);\n          return;\n        }\n        if \(settingsMenuAction\) {\n          this\.callbacks\.onHamburgerMenuAction\?.\(settingsMenuAction\);\n        }\n      }\);/g,
    `// Native HTML renders the label; retain this transparent text only
        // so the established Phaser tap handlers continue to work.
        .setAlpha(0.001)
        .setInteractive({ useHandCursor: true });

      text.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();
        const settingsMenuAction = this.settingsMenuActionForLabel(label);
        this.activeHudDropdown = undefined;
        this.layoutHudDropdown(layout);
        if (settingsMenuAction) {
          this.callbacks.onHamburgerMenuAction?.(settingsMenuAction);
        }
      });`
);
fs.writeFileSync(file, code);
