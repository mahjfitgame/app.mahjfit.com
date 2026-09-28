const fs = require('fs');
const file = 'src/app/module/business/game/phaser/layout/ui.ts';
let code = fs.readFileSync(file, 'utf8');

// Remove mobile submenu sort logic
code = code.replace(
    /        \/\/ Sort has its own two-option submenu instead of sorting immediately\.\n        if \(action === "sort" && !isSubmenuItem\) {\n          this\.mobileActionSubmenu = "sort";\n          this\.renderOpenMenusNow\(\);\n          return;\n        }/g,
    ''
);

code = code.replace(
    /        if \(action === "sort" && isSubmenuItem && rowLabel === "‹ Back"\) {\n          this\.mobileActionSubmenu = undefined;\n          this\.renderOpenMenusNow\(\);\n          return;\n        }/g,
    ''
);

code = code.replace(
    /        const sortMode = rowLabel === "Sort By Rank" \? "rank" : rowLabel === "Sort By Suit" \? "suit" : undefined;\n        if \(sortMode\) {\n          this\.callbacks\.onSortRequested\?.\(sortMode\);\n          this\.mobileActionMenuOpen = false;\n          this\.mobileActionSubmenu = undefined;\n          this\.renderOpenMenusNow\(\);\n          return;\n        }/g,
    ''
);

fs.writeFileSync(file, code);
console.log("Cleaned");
