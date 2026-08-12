import { GameTableConfig } from "./type";

export const ICON_SORT_NORMAL = "icon_sort_normal";
export const ICON_SORT_HOVER = "icon_sort_hover";
export const ICON_SORT_PRESSED = "icon_sort_pressed";

export const ICON_HINT_NORMAL = "icon_hint_normal";
export const ICON_HINT_HOVER = "icon_hint_hover";
export const ICON_HINT_PRESSED = "icon_hint_pressed";

export const ICON_DEADHAND_NORMAL = "icon_deadhand_normal";
export const ICON_DEADHAND_HOVER = "icon_deadhand_hover";
export const ICON_DEADHAND_PRESSED = "icon_deadhand_pressed";

export const ICON_SETTINGS_NORMAL = "icon_settings_normal";
export const ICON_SETTINGS_HOVER = "icon_settings_hover";
export const ICON_SETTINGS_PRESSED = "icon_settings_pressed";

export const ICON_HELP_NORMAL = "icon_help_normal";
export const ICON_HELP_HOVER = "icon_help_hover";
export const ICON_HELP_PRESSED = "icon_help_pressed";

export const COLOR_BLUE = "#264089";
export const COLOR_BLUE_NUM = 0x264089;

export const COLOR_FUSHIA = "#B92A90";
export const COLOR_FUSHIA_NUM = 0xB92A90;

export const COLOR_PINK = "#EFACBF";
export const COLOR_PINK_NUM = 0xEFACBF;

export const COLOR_LAVENDER = "#DAB6D6";
export const COLOR_LAVENDER_NUM = 0xDAB6D6;

export const COLOR_GRAY = "#9EB5C1";
export const COLOR_GRAY_NUM = 0x9EB5C1;

export const COLOR_AVOCADO = "#C7C22E";
export const COLOR_AVOCADO_NUM = 0xC7C22E;

export const COLOR_RED = "#F04846";
export const COLOR_RED_NUM = 0xF04846;

export const COLOR_GREEN = "#11B364";
export const COLOR_GREEN_NUM = 0x11B364;

export const FONT_FAMILY = "Poppins, Arial";

export const ANIMATION_SPEED = 900;

export const BOT_PASS_WAITING_PAUSE_MS = 320;
export const BOT_PASS_MOVE_DURATION_MS = 620;
export const BOT_PASS_COMMIT_DURATION_MS = 520;

export const GAME_TABLE_CONFIG: GameTableConfig = {
    colors: {
        page: 0x2f4d99,
        exposure: 0x6675ac,
        discard: 0x324f9a,
        panel: 0x2f4592,
        accent: 0xcb2aa3,
        lime: "#e4f22c",
        white: "#ffffff",
    },
    rack: {
        tileAspect: 1.43,
        maxTileWidthDesktop: 76,
        maxTileWidthTablet: 58,
        maxTileWidthMobile: 34,
        minTileWidth: 22,
        gapRatio: 0.0045,
    },
    animation: {
        passDurationMs: 420,
        dragReturnMs: 180,
    },
};