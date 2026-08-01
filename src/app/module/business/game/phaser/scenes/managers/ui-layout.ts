// file: src/app/module/business/game/phaser/scenes/managers/ui-layout.ts
import Phaser from "phaser";
import type { PassDirection } from "../../../model/tile";
import type { TablePhase } from "../../../model/table-phase";
import { COLOR_AVOCADO, COLOR_BLUE, COLOR_FUSHIA, COLOR_GRAY, FONT_FAMILY, ICON_DEADHAND_HOVER, ICON_DEADHAND_NORMAL, ICON_DEADHAND_PRESSED, ICON_HELP_HOVER, ICON_HELP_NORMAL, ICON_HELP_PRESSED, ICON_HINT_HOVER, ICON_HINT_NORMAL, ICON_HINT_PRESSED, ICON_SETTINGS_HOVER, ICON_SETTINGS_NORMAL, ICON_SETTINGS_PRESSED, ICON_SORT_HOVER, ICON_SORT_NORMAL, ICON_SORT_PRESSED } from "../../const";
import { TableLayout } from "../../type";
import { HamburgerMenuActionKey, HudActionKey, HudImageButton, LayoutStaticUiOptions, PassButtonStateOptions, TableSeat, UiLayoutCallbacks } from "../type";


/**
 * Owns Phaser UI objects and responsive UI presentation state.
 * Gameplay actions remain callbacks owned by TableScene.
 */
export class UiLayoutManager {
  hudTextObjects: Phaser.GameObjects.Text[] = [];
  hudActionIconImage: Phaser.GameObjects.Image[] = [];
  instructionText?: Phaser.GameObjects.Text;
  passButton?: Phaser.GameObjects.Container;
  playerLabels: Phaser.GameObjects.Text[] = [];
  usernameText?: Phaser.GameObjects.Text;
  wallTileBox?: Phaser.GameObjects.Container;
  pickSeatSelector?: Phaser.GameObjects.Container;
  pickSeatButtons: Phaser.GameObjects.Text[] = [];
  hudMenuOpen = false;
  hudMenuItems: Phaser.GameObjects.Text[] = [];
  hudBg?: Phaser.GameObjects.Rectangle;



  private hamburgerMenuOpen = false;
  private hamburgerMenuBg?: Phaser.GameObjects.Graphics;
  private hamburgerMenuItems: Phaser.GameObjects.Text[] = [];
  private hamburgerCloseText?: Phaser.GameObjects.Text;
  private hamburgerLogoText?: Phaser.GameObjects.Text;

  private lastLayout?: TableLayout;


  /**
   * Main left hamburger drawer.
   */

  private hamburgerMenuContainer?: Phaser.GameObjects.Container;
  private hamburgerMenuCloseText?: Phaser.GameObjects.Text;
  private hamburgerMenuLogoText?: Phaser.GameObjects.Text;
  private hamburgerMenuLogoImage?: Phaser.GameObjects.Image;


  /**
   * Compact/mobile right action button + drawer.
   */
  private mobileActionMenuContainer?: Phaser.GameObjects.Container;
  private mobileActionMenuBg?: Phaser.GameObjects.Graphics;
  private mobileActionMenuTitleText?: Phaser.GameObjects.Text;
  private mobileActionMenuCloseText?: Phaser.GameObjects.Text;
  private mobileActionButton?: Phaser.GameObjects.Text;
  private mobileActionMenuOpen = false;
  /**
   * Mobile action drawer text labels.
   *
   * The drawer now uses PNG icons + text.
   * Text stays separate from icons so updateTextResolution() can keep working safely.
   */
  private mobileActionMenuItems: Phaser.GameObjects.Text[] = [];

  /**
   * Mobile action drawer PNG icons.
   *
   * These use the same normal/pressed PNG textures as the desktop HUD action buttons.
   */
  private mobileActionMenuIcons: Phaser.GameObjects.Image[] = [];

  

  hamburgerIcon?: Phaser.GameObjects.Text;
  logoText?: Phaser.GameObjects.Text;

  logoImage?: Phaser.GameObjects.Image;

  wallCountText?: Phaser.GameObjects.Text;
  pointsText?: Phaser.GameObjects.Text;

  hudWallIcon?: Phaser.GameObjects.Container;
  hudPointsIcon?: Phaser.GameObjects.Container;
  private mobileHeaderBackground?: Phaser.GameObjects.Graphics;

  hudActionsContainer?: Phaser.GameObjects.Container;

  /**
   * Old text-based HUD icons are no longer used for the desktop action bar.
   * Keep this array only so updateTextResolution() and older code paths remain safe.
   */
  hudActionIconTexts: Phaser.GameObjects.Text[] = [];

  /**
   * PNG-based HUD action buttons.
   * These replace the old text/emoji action icons and support:
   * normal / hover / active(clicked/open) states.
   */
  hudActionButtons: HudImageButton[] = [];

  private activeHudDropdown?: HudActionKey;
  private hudDropdownBg?: Phaser.GameObjects.Graphics;
  private hudDropdownItems: Phaser.GameObjects.Text[] = [];

  /**
   * Sort tooltip state.
   *
   * Default shows "Sort By Suit".
   * Every Sort click toggles the next tooltip label.
   */
  private nextSortTooltip: "Sort By Suit" | "Sort By Rank" = "Sort By Suit";

  /**
   * Mobile drawer submenu state.
   *
   * When user taps Settings in the mobile action drawer,
   * we keep the drawer open and show Settings submenu items.
   */
  private mobileActionSubmenu?: HudActionKey;

  /**
   * Small hover tooltip for desktop/tablet HUD action icons.
   * Mobile does not use hover tooltip because it uses the action drawer.
   */
  private hudActionTooltipBg?: Phaser.GameObjects.Graphics;
  private hudActionTooltipText?: Phaser.GameObjects.Text;
  private hoveredHudAction?: HudActionKey;

  private gtColorBlue: string = "#264089";
  private gtColorFushia: string = "#B92A90";

  private gtnumColorFushia: number = 0xB92A90;
  

  private readonly hudActions = [
    {
      key: "sort" as const,
      icon: "↻",
      label: "Sort",
      tooltip: "Sort Tiles",
      items: ["Sort By Rank", "Sort By Suit"],
    },
    {
      key: "hint" as const,
      icon: "💡",
      label: "Hint",
      tooltip: "Get A Hint",
      items: ["Get A Hint"],
    },
    {
      key: "dead-hand" as const,
      icon: "✋",
      label: "Dead Hand",
      tooltip: "Call Dead Hand",
      items: ["Call Dead Hand"],
    },
    {
      key: "settings" as const,
      icon: "⚙",
      label: "Settings",
      tooltip: "Settings",
      items: [
        "Turn On Microphone",
        "Turn On Game Audio",
        "Change Background",
        "Change Tiles",
        "Restart Game",
        "Quit Game",
      ],
    },
    {
      key: "help" as const,
      icon: "?",
      label: "Help",
      tooltip: "Help",
      items: ["Help"],
    },
  ];

  /**
   * Texture keys for the PNG HUD action buttons.
   *
   * These keys must match the images loaded in TableScene.preload().
   * The action keys match HudActionKey, so the dropdown logic can stay simple.
   */
  private readonly hudActionTextures: Record<
    HudActionKey,
    {
      readonly normal: string;
      readonly hover: string;
      readonly active: string;
    }
  > = {
    sort: {
      normal: ICON_SORT_NORMAL,
      hover: ICON_SORT_HOVER,
      active: ICON_SORT_PRESSED,
    },
    hint: {
      normal: ICON_HINT_NORMAL,
      hover: ICON_HINT_HOVER,
      active: ICON_HINT_PRESSED,
    },
    "dead-hand": {
      normal: ICON_DEADHAND_NORMAL,
      hover: ICON_DEADHAND_HOVER,
      active: ICON_DEADHAND_PRESSED,
    },
    settings: {
      normal: ICON_SETTINGS_NORMAL,
      hover: ICON_SETTINGS_HOVER,
      active: ICON_SETTINGS_PRESSED,
    },
    help: {
      normal: ICON_HELP_NORMAL,
      hover: ICON_HELP_HOVER,
      active: ICON_HELP_PRESSED,
    },
  };
  constructor(private readonly callbacks: UiLayoutCallbacks = {}) {}

  createStaticUi(scene: Phaser.Scene): void {
    /**
     * New explicit PSD HUD.
     * Keep hudTextObjects empty so old array-based HUD cannot duplicate.
     */
    this.hudTextObjects = [];

    this.hamburgerIcon = scene.add
      .text(0, 0, "☰", {
        fontFamily: FONT_FAMILY,
        fontSize: "34px",
        fontStyle: "600",
        //color: "#cb2aa3",
        color: this.gtColorFushia,
      })
      .setOrigin(0.5)
      .setDepth(25)
      .setInteractive({ useHandCursor: true });

    this.mobileHeaderBackground = scene.add.graphics().setDepth(20);

    /* this.hamburgerIcon.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation?.();

      /**
       * Temporary until full hamburger drawer is wired.
       * Do not open settings dropdown here.
       */
      /*this.callbacks.onHudAction?.("settings");
    }); */
    /* this.hamburgerIcon.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation?.();

      /**
       * Mobile portrait:
       * hamburger acts as compact overflow menu for hidden HUD actions.
       *
       * Desktop hamburger drawer can be implemented later as a separate PSD menu.
       */
      /*this.hudMenuOpen = !this.hudMenuOpen;
      this.activeHudDropdown = undefined;

      if (this.lastLayout) {
        this.layoutMobileHud(this.lastLayout);
        this.layoutHudDropdown(this.lastLayout);
      }
    }); */

    this.hamburgerIcon.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation?.();

      this.hamburgerMenuOpen = !this.hamburgerMenuOpen;
      this.mobileActionMenuOpen = false;
      this.activeHudDropdown = undefined;

      if (this.lastLayout) {
        this.layoutHamburgerDrawer(this.lastLayout);
        this.layoutMobileActionDrawer(this.lastLayout);
        this.layoutHudDropdown(this.lastLayout);
      }
    });

    /* this.logoText = scene.add
      .text(0, 0, "MAJHFIT", {
        fontFamily: FONT_FAMILY,
        fontSize: "36px",
        fontStyle: "700",
        color: "#ffffff",
      })
      .setOrigin(0, 0.5); */

      // PNG LOGO
    /* this.logoImage = scene.add
    .image(0, 0, this.callbacks.logoTextureKey ?? "majhfit-logo")
    .setOrigin(0, 0.5)
    .setDepth(25); */


    // SVG LOGO
    /* this.logoImage = scene.add
    .image(0, 0, this.callbacks.logoTextureKey ?? "majhfit-logo")
    .setOrigin(0, 0.5)
    .setDepth(25); */
      

    this.hudWallIcon = this.createHudWallIcon(scene);
    this.wallTileBox = this.hudWallIcon;

    this.wallCountText = scene.add
      .text(0, 0, "93 LEFT", this.hudMetricTextStyle())
      .setOrigin(0, 0.5)
      .setDepth(25);

    this.hudPointsIcon = this.createHudPointsIcon(scene);

    this.pointsText = scene.add
      .text(0, 0, "1,000 POINTS", this.hudMetricTextStyle())
      .setOrigin(0, 0.5)
      .setDepth(25);

    this.hudActionsContainer = this.createHudActions(scene);
    this.hudDropdownBg = scene.add.graphics().setDepth(220).setVisible(false);

    /**
     * Desktop/tablet HUD action tooltip.
     * Created once and only repositioned/redrawn on hover.
     */
    this.createHudActionTooltip(scene);

    /* this.createHamburgerDrawer(scene);
    this.createMobileActionMenu(scene);
    this.createSettingsMenu(scene);
    this.createMobileActionButton(scene); */

    this.createHamburgerDrawer(scene);
    this.createMobileActionButton(scene);
    this.createMobileActionDrawer(scene);


    this.instructionText = scene.add
      .text(0, 0, "", {
        fontFamily: FONT_FAMILY,
        fontSize: "22px",
        fontStyle: "700",
        //color: "#253a78",
        color: "#264089",
        align: "center",
      })
      .setOrigin(0.5);

    this.playerLabels = [
      scene.add.text(0, 0, "PLAYER 1", this.labelStyle()).setOrigin(0.5),
      scene.add.text(0, 0, "PLAYER 2", this.labelStyle()).setOrigin(0.5),
      scene.add.text(0, 0, "PLAYER 3", this.labelStyle()).setOrigin(0.5),
    ];

    this.usernameText = scene.add
      .text(0, 0, "USERNAME", this.labelStyle())
      .setOrigin(0.5);

    this.pickSeatSelector = this.createPickSeatSelector(scene);
    this.passButton = this.createPassButton(scene);
  }

  /** The mobile HUD overlays the table and can be hidden without relayout. */
  setMobileHeaderVisible(visible: boolean): void {
    // When visible, let the normal HUD layout decide which mobile/desktop
    // controls are active. Forcing the desktop action container visible on a
    // phone creates invisible interactive controls above the hamburger.
    if (visible) return;

    this.hamburgerIcon?.setVisible(false);
    this.mobileHeaderBackground?.setVisible(false);
    // The wall indicator lives beside the top exposure, rather than in the
    // collapsible mobile header, so it stays available while that header is closed.
    this.hudPointsIcon?.setVisible(false);
    this.pointsText?.setVisible(false);
    this.hudActionsContainer?.setVisible(false);
    this.mobileActionButton?.setVisible(false);
    this.hudDropdownBg?.setVisible(false);
    this.hudActionTooltipBg?.setVisible(false);
    this.hudActionTooltipText?.setVisible(false);
  }

  private createHudActionTooltip(scene: Phaser.Scene): void {
    /**
     * Tooltip background is drawn with Graphics so it can resize
     * depending on the action text.
     */
    this.hudActionTooltipBg = scene.add
      .graphics()
      .setDepth(240)
      .setVisible(false);

    this.hudActionTooltipText = scene.add
      .text(0, 0, "", {
        fontFamily: FONT_FAMILY,
        fontSize: "13px",
        fontStyle: "600",
        //color: "#27428a",
        color: "#264089",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(241)
      .setVisible(false);
  }
  private tooltipLabelForAction(actionKey: HudActionKey): string {
    /**
     * Sort tooltip is dynamic.
     *
     * It tells the user what the next Sort click will do.
     */
    if (actionKey === "sort") {
      return this.nextSortTooltip;
    }

    const action = this.hudActions.find((item) => item.key === actionKey);

    return action?.tooltip ?? "";
  }

  private toggleSortTooltipState(): void {
    this.nextSortTooltip =
      this.nextSortTooltip === "Sort By Suit"
        ? "Sort By Rank"
        : "Sort By Suit";
  }
  private createHamburgerDrawer(scene: Phaser.Scene): void {
    this.hamburgerMenuBg = scene.add.graphics().setDepth(260);

    this.hamburgerMenuCloseText = scene.add
      .text(0, 0, "✕", {
        fontFamily: FONT_FAMILY,
        fontSize: "28px",
        fontStyle: "700",
        //color: "#cb2aa3",
        color:this.gtColorFushia
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(261);

    /* this.hamburgerMenuLogoText = scene.add
      .text(0, 0, "MAJHFIT", {
        fontFamily: FONT_FAMILY,
        fontSize: "28px",
        fontStyle: "700",
        color: "#27428a",
      })
      .setOrigin(0, 0.5)
      .setDepth(261); */

      const logoTextureKey =
      this.callbacks.logoTextureKey ?? "majhfit-logo";

    this.hamburgerMenuLogoImage = scene.add
      .image(0, 0, logoTextureKey)
      .setOrigin(0, 0.5)
      .setDepth(261);

    this.hamburgerMenuCloseText.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation?.();
      this.hamburgerMenuOpen = false;
      this.hamburgerMenuContainer?.setVisible(false);
    });

    const items: readonly {
      readonly label: string;
      readonly action: HamburgerMenuActionKey;
    }[] = [
      { label: "Gameplay Settings", action: "gameplay-settings" },
      { label: "Your level/play history", action: "play-history" },
      { label: "Account/billing", action: "account-billing" },
      { label: "Restart Game", action: "restart-game" },
      { label: "Quit/exit", action: "quit-exit" },
      { label: "Log out", action: "log-out" },
    ];

    this.hamburgerMenuItems = items.map((item) =>
      scene.add
        .text(0, 0, item.label, {
          fontFamily: FONT_FAMILY,
          fontSize: "18px",
          fontStyle: "500",
          color: COLOR_FUSHIA,
        })
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .setData("action", item.action)
        .setDepth(261),
    );

    this.hamburgerMenuItems.forEach((item) => {
      item.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();

        const action = item.getData("action") as HamburgerMenuActionKey;

        this.hamburgerMenuOpen = false;
        this.hamburgerMenuContainer?.setVisible(false);

        this.callbacks.onHamburgerMenuAction?.(action);
      });
    });

    this.hamburgerMenuContainer = scene.add
      .container(0, 0, [
        this.hamburgerMenuBg,
        this.hamburgerMenuCloseText,
        //this.hamburgerMenuLogoText,
        this.hamburgerMenuLogoImage,
        ...this.hamburgerMenuItems,
      ])
      .setDepth(260)
      .setVisible(false);
  }
  
  
  private hudMetricTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      fontStyle: "500",
      color: "#f8fafc",
    };
  }

  private createHudWallIcon(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const graphics = scene.add.graphics();

    return scene.add
      .container(0, 0, [graphics])
      .setDepth(25);
  }

  createHudPointsIcon(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const graphics = scene.add.graphics();

    return scene.add
      .container(0, 0, [graphics])
      .setDepth(25);
  }

  layoutStaticUi(options: LayoutStaticUiOptions): void {
    const {
      layout,
      renderDpr,
      tablePhase,
      pickTargetSeat,
      passDirection,
      wallTileCount,
    } = options;

    const metrics = layout.metrics;
    this.lastLayout = layout;

    /**
     * New explicit PSD HUD layout.
     * Do not use hudTextObjects here.
     */
    this.layoutPsdHud(layout, wallTileCount);

    this.layoutHamburgerDrawer(layout);
    this.layoutMobileActionButton(layout);
    this.layoutMobileActionDrawer(layout);

    /* this.instructionText
      ?.setPosition(
        layout.instructionBar.x + layout.instructionBar.width / 2,
        layout.instructionBar.y + layout.instructionBar.height * 0.36,
      )
      .setFontSize(Math.round(Phaser.Math.Clamp(layout.hud.height * 0.28, 18, 25)))
      .setFontStyle("600")
      .setColor("#263b7a")
      .setAlign("center"); */
    
    const compact = this.isCompactHud(layout);

    /* this.instructionText
      ?.setPosition(
        layout.instructionBar.x + layout.instructionBar.width / 2,
        layout.instructionBar.y + layout.instructionBar.height * 0.34,
      )
      .setFontSize(
        compact
          ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.19, 8, 12))
          : Math.round(Phaser.Math.Clamp(layout.hud.height * 0.28, 18, 25)),
      )
      .setFontStyle("600")
      .setColor("#263b7a")
      .setAlign("center"); */

    /* const compactLandscape =
    layout.metrics.isMobile && !layout.metrics.isPortrait;

  this.instructionText
    ?.setPosition(
      layout.instructionBar.x + layout.instructionBar.width / 2,
      layout.instructionBar.y + layout.instructionBar.height * 0.34,
    )
    .setFontSize(
      compactLandscape
        ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.145, 8, 11))
        : compact
          ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.19, 11, 15))
          : Math.round(Phaser.Math.Clamp(layout.hud.height * 0.28, 18, 25)),
    )
    .setFontStyle("600")
    .setColor("#263b7a")
    .setAlign("center"); */
    
    const compactLandscape = layout.metrics.isMobile && !layout.metrics.isPortrait;
    const isPassing = tablePhase === "passing";

    const instructionFont = compactLandscape
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.135, 8, 10))
      : compact
        ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 10, 14))
        : isPassing
          ? Math.round(Phaser.Math.Clamp(layout.instructionBar.height * 0.118, 18, 25))
          : Math.round(Phaser.Math.Clamp(layout.instructionBar.height * 0.135, 19, 28));

    this.instructionText
      ?.setPosition(
        layout.instructionBar.x + layout.instructionBar.width / 2,
        layout.instructionBar.y + layout.instructionBar.height * (isPassing ? 0.305 : 0.34),
      )
      .setFontSize(instructionFont)
      .setFontStyle("600")
      .setColor(this.gtColorBlue)
      .setAlign("center")

    this.updateInstruction(tablePhase, pickTargetSeat, passDirection);
    this.updatePlayerNames(layout, renderDpr, options.activeSeat);

    this.layoutPassButton(layout);
    this.updatePassButtonState(options);
    this.layoutPickSeatSelector(layout, tablePhase, pickTargetSeat);
    this.layoutMobileHud(layout);
    this.updateTextResolution(renderDpr);
  }

  private isCompactHud(layout: TableLayout): boolean {
    const width = layout.canvas.width;
    const height = layout.canvas.height;

    const isPhoneLandscape =
      width > height &&
      height <= 520 &&
      width <= 980;

    const isPhonePortrait =
      height >= width &&
      width <= 520;

    return (
      isPhonePortrait ||
      isPhoneLandscape ||
      layout.hud.width < 680
    );
  }

  private createMobileActionButton(scene: Phaser.Scene): void {
    this.mobileActionButton = scene.add
      .text(0, 0, "⋯", {
        fontFamily: FONT_FAMILY,
        fontSize: "26px",
        fontStyle: "700",
        color: this.gtColorFushia,
      })
      .setOrigin(0.5)
      .setDepth(250)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });

    this.mobileActionButton.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation?.();

      this.mobileActionMenuOpen = !this.mobileActionMenuOpen;

      this.hamburgerMenuOpen = false;
      this.activeHudDropdown = undefined;
      this.hudMenuOpen = false;

      this.renderOpenMenusNow();
    });
  }
  private renderOpenMenusNow(): void {
    if (!this.lastLayout) return;

    this.layoutHamburgerDrawer(this.lastLayout);
    this.layoutHudDropdown(this.lastLayout);
    this.layoutMobileActionButton(this.lastLayout);
    this.layoutMobileActionDrawer(this.lastLayout);
  }
  private createMobileActionMenu(scene: Phaser.Scene): Phaser.GameObjects.Text[] {
    const items: readonly {
      readonly label: string;
      readonly action: HudActionKey;
    }[] = [
      { label: "Sort Tiles", action: "sort" },
      { label: "Get A Hint", action: "hint" },
      { label: "Call DEAD Hand", action: "dead-hand" },
      { label: "Settings", action: "settings" },
      { label: "Help", action: "help" },
    ];

    this.mobileActionMenuItems = items.map((item) =>
      scene.add
        .text(0, 0, item.label, {
          fontFamily: FONT_FAMILY,
          fontSize: "15px",
          fontStyle: "500",
          color: this.gtColorFushia,
          backgroundColor: "#ffffff",
          padding: { x: 12, y: 7 },
        })
        .setData("action", item.action)
        .setDepth(230)
        .setVisible(false)
        .setInteractive({ useHandCursor: true }),
    );

    this.mobileActionMenuItems.forEach((text) => {
      text.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();

        const action = text.getData("action") as HudActionKey;

        this.mobileActionMenuOpen = false;
        this.mobileActionMenuItems.forEach((item) => item.setVisible(false));

        this.callbacks.onHudAction?.(action);
      });
    });

    return this.mobileActionMenuItems;
  }

  private createMobileActionDrawer(scene: Phaser.Scene): void {
    /**
     * Mobile HUD action drawer.
     *
     * Important:
     * - Root drawer shows normal HUD actions.
     * - Settings opens a submenu inside the same drawer.
     * - We create enough reusable rows for the largest menu:
     *   Settings submenu = Back + 6 items = 7 rows.
     * - Rows are updated dynamically in layoutMobileActionDrawer().
     */
    this.mobileActionMenuBg = scene.add
      .graphics()
      .setDepth(260)
      .setVisible(false);

    this.mobileActionMenuCloseText = scene.add
      .text(0, 0, "×", {
        fontFamily: FONT_FAMILY,
        fontSize: "26px",
        fontStyle: "600",
        color: COLOR_FUSHIA,
      })
      .setOrigin(0.5)
      .setDepth(262)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });

    this.mobileActionMenuCloseText.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation?.();

      /**
       * Closing the drawer should also exit any submenu.
       */
      this.mobileActionMenuOpen = false;
      this.mobileActionSubmenu = undefined;
      this.renderOpenMenusNow();
    });

    this.mobileActionMenuTitleText = scene.add
      .text(0, 0, "ACTIONS", {
        fontFamily: FONT_FAMILY,
        fontSize: "15px",
        fontStyle: "700",
        color: COLOR_BLUE,
      })
      .setOrigin(0, 0.5)
      .setDepth(262)
      .setVisible(false);

    /**
     * Root drawer has 5 rows.
     * Settings submenu has 7 rows:
     * - Back
     * - Turn On Microphone
     * - Turn On Game Audio
     * - Change Background
     * - Change Tiles
     * - Restart Game
     * - Quit Game
     */
    const maxMobileDrawerRows = Math.max(
      this.hudActions.length,
      7,
    );

    const placeholderRows = Array.from({ length: maxMobileDrawerRows });

    /**
     * PNG icons for drawer rows.
     *
     * They use the same texture system as desktop HUD icons.
     * The actual texture is assigned later in layoutMobileActionDrawer()
     * based on the current root/submenu item.
     */
    this.mobileActionMenuIcons = placeholderRows.map(() =>
      scene.add
        .image(0, 0, this.hudActionTextures.sort.normal)
        .setOrigin(0.5)
        .setDepth(261)
        .setVisible(false)
        .setInteractive({ useHandCursor: true }),
    );

    /**
     * Text labels for drawer rows.
     *
     * Labels are also updated dynamically in layoutMobileActionDrawer().
     */
    this.mobileActionMenuItems = placeholderRows.map(() =>
      scene.add
        .text(0, 0, "", {
          fontFamily: FONT_FAMILY,
          fontSize: "18px",
          fontStyle: "600",
          color: COLOR_FUSHIA,
        })
        .setOrigin(0, 0)
        .setDepth(261)
        .setVisible(false)
        .setInteractive({ useHandCursor: true }),
    );

    /**
     * Shared row interaction.
     *
     * Each row reads latest action/label/submenu data from setData().
     * This is required because the same 7 row objects are reused for:
     * - root menu
     * - settings submenu
     */
    this.mobileActionMenuItems.forEach((label, index) => {
      const icon = this.mobileActionMenuIcons[index];

      const resetRow = (): void => {
        const normalTexture = icon.getData("normalTexture") as string | undefined;

        if (normalTexture) {
          icon.setTexture(normalTexture);
        }

        label.setColor("#cb63b2");
      };

      const pressRow = (): void => {
        const activeTexture = icon.getData("activeTexture") as string | undefined;

        if (activeTexture) {
          icon.setTexture(activeTexture);
        }

        label.setColor("#a91f86");
      };

      const selectRow = (): void => {
        resetRow();

        const action = label.getData("action") as HudActionKey | undefined;
        const rowLabel = label.getData("label") as string | undefined;
        const isSubmenuItem = Boolean(label.getData("isSubmenuItem"));

        if (!action || !rowLabel) return;

        /**
         * Root Settings row opens the Settings submenu.
         * The drawer remains open.
         */
        if (action === "settings" && !isSubmenuItem) {
          this.mobileActionSubmenu = "settings";
          this.renderOpenMenusNow();
          return;
        }

        /**
         * Back row returns from Settings submenu to root drawer.
         */
        if (action === "settings" && isSubmenuItem && rowLabel === "‹ Back") {
          this.mobileActionSubmenu = undefined;
          this.renderOpenMenusNow();
          return;
        }

        /**
         * Sort row toggles dynamic sort tooltip/drawer label.
         */
        if (action === "sort") {
          this.callbacks.onHudAction?.(action);
          this.toggleSortTooltipState();

          this.mobileActionMenuOpen = false;
          this.mobileActionSubmenu = undefined;
          this.renderOpenMenusNow();
          return;
        }

        /**
         * Settings submenu rows currently report the Settings action.
         * Later this can be expanded to send a specific submenu action key
         * when API/game settings are connected.
         */
        this.callbacks.onHudAction?.(action);

        this.mobileActionMenuOpen = false;
        this.mobileActionSubmenu = undefined;
        this.renderOpenMenusNow();
      };

      /**
       * Icon tap handling.
       */
      icon.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();
        pressRow();
      });

      icon.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();
        selectRow();
      });

      icon.on("pointerout", resetRow);
      icon.on("pointerupoutside", resetRow);

      /**
       * Label tap handling.
       */
      label.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();
        pressRow();
      });

      label.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();
        selectRow();
      });

      label.on("pointerout", resetRow);
      label.on("pointerupoutside", resetRow);
    });

    /**
     * Drawer container.
     *
     * Background first, then icons/labels, then title/close on top.
     */
    this.mobileActionMenuContainer = scene.add
      .container(0, 0, [
        this.mobileActionMenuBg,
        ...this.mobileActionMenuIcons,
        ...this.mobileActionMenuItems,
        this.mobileActionMenuCloseText,
        this.mobileActionMenuTitleText,
      ])
      .setDepth(260)
      .setVisible(false);
  }

  private mobileActionDrawerItems(): readonly {
    readonly label: string;
    readonly action: HudActionKey;
    readonly normalTexture: string;
    readonly activeTexture: string;
    readonly isSubmenuItem: boolean;
  }[] {
    /**
     * Settings submenu.
     *
     * These rows intentionally use the Settings PNG icon because they belong
     * to Settings. Later, each row can be mapped to its own API/action id.
     */
    if (this.mobileActionSubmenu === "settings") {
      const settingsTextures = this.hudActionTextures.settings;
      const settingsAction = this.hudActions.find(
        (action) => action.key === "settings",
      );

      return [
        {
          label: "‹ Back",
          action: "settings",
          normalTexture: settingsTextures.normal,
          activeTexture: settingsTextures.active,
          isSubmenuItem: true,
        },
        ...(settingsAction?.items ?? []).map((label) => ({
          label,
          action: "settings" as const,
          normalTexture: settingsTextures.normal,
          activeTexture: settingsTextures.active,
          isSubmenuItem: true,
        })),
      ];
    }

    /**
     * Root mobile action drawer.
     */
    return this.hudActions.map((action) => {
      const textures = this.hudActionTextures[action.key];

      return {
        label: action.key === "sort" ? this.tooltipLabelForAction("sort") : action.label,
        action: action.key,
        normalTexture: textures.normal,
        activeTexture: textures.active,
        isSubmenuItem: false,
      };
    });
  }

  private drawOverlayDrawerBackground(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
  ): void {
    g.clear();

    /**
     * Soft shadow.
     */
    g.fillStyle(0x000000, 0.10);
    g.fillRoundedRect(6, 8, width, height, 26);

    g.fillStyle(0x000000, 0.07);
    g.fillRoundedRect(10, 12, width, height, 26);

    /**
     * White panel.
     */
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, width, height, 26);
  }
  private layoutHamburgerDrawer(layout: TableLayout): void {
    if (
      !this.hamburgerMenuContainer ||
      !this.hamburgerMenuBg ||
      !this.hamburgerMenuCloseText ||
      !this.hamburgerMenuLogoImage
      //!this.hamburgerMenuLogoText
    ) {
      return;
    }

    if (!this.hamburgerMenuOpen) {
      this.hamburgerMenuContainer.setVisible(false);
      return;
    }

    const hud = layout.hud;

    const width = Math.round(
      Phaser.Math.Clamp(layout.canvas.width * 0.46, 250, 360),
    );

    const headerY = 36;
    const rowStartY = 88;
    const rowGap = 16;
    const itemFont = Math.round(
      Phaser.Math.Clamp(hud.height * 0.30, 16, 22),
    );

    this.hamburgerMenuItems.forEach((item) => {
      item.setFontSize(itemFont).setFontStyle("500").setColor("#cb63b2");
    });

    const height =
      rowStartY +
      this.hamburgerMenuItems.length * (itemFont + rowGap) +
      26;

    this.drawOverlayDrawerBackground(this.hamburgerMenuBg, width, height);

    this.hamburgerMenuCloseText
      .setPosition(26, headerY)
      .setFontSize(Math.round(Phaser.Math.Clamp(hud.height * 0.42, 22, 34)))
      .setColor(this.gtColorFushia);
      //.setColor("#cb2aa3");

    /* this.hamburgerMenuLogoText
      .setPosition(72, headerY)
      .setFontSize(Math.round(Phaser.Math.Clamp(hud.height * 0.42, 24, 38)))
      .setColor("#27428a"); */
    
    const logoHeight = Math.round(
      Phaser.Math.Clamp(hud.height * 0.58, 32, 54),
    );

    const source = this.hamburgerMenuLogoImage.texture.getSourceImage() as
      | HTMLImageElement
      | HTMLCanvasElement;

    const sourceWidth = source.width || 1;
    const sourceHeight = source.height || 1;
    const logoWidth = Math.round((sourceWidth / sourceHeight) * logoHeight);

    this.hamburgerMenuLogoImage
      .setPosition(72, headerY)
      .setDisplaySize(logoWidth, logoHeight)
      .setVisible(true);

    this.hamburgerMenuItems.forEach((item, index) => {
      item.setPosition(26, rowStartY + index * (itemFont + rowGap));
    });

    this.hamburgerMenuContainer
      .setPosition(
        Math.round(hud.x + 12),
        Math.round(hud.y + hud.height + 4),
      )
      .setVisible(true);
  }

  private layoutMobileActionDrawer(layout: TableLayout): void {
    if (
      !this.mobileActionMenuContainer ||
      !this.mobileActionMenuBg ||
      !this.mobileActionMenuCloseText ||
      !this.mobileActionMenuTitleText
    ) {
      return;
    }

    
    const compact = this.isCompactHud(layout);
    
    if (!compact || !this.mobileActionMenuOpen) {
      this.mobileActionMenuContainer.setVisible(false);
      this.mobileActionMenuBg.setVisible(false);
      return;
    }

    const hud = layout.hud;
    const isPortrait = layout.canvas.height >= layout.canvas.width;

    /* const width = Math.round(
      Phaser.Math.Clamp(
        isPortrait ? layout.canvas.width * 0.54 : layout.canvas.width * 0.34,
        isPortrait ? 190 : 220,
        isPortrait ? 250 : 300,
      ),
    ); */

    /**
     * Settings submenu has longer labels:
     * - Turn On Microphone
     * - Turn On Game Audio
     * - Change Background
     *
     * Give submenu more width so text stays inside the white drawer.
     */
    const isSettingsSubmenu = this.mobileActionSubmenu === "settings";

    const width = Math.round(
      Phaser.Math.Clamp(
        isSettingsSubmenu
          ? isPortrait
            ? layout.canvas.width * 0.72
            : layout.canvas.width * 0.44
          : isPortrait
            ? layout.canvas.width * 0.54
            : layout.canvas.width * 0.34,
        isSettingsSubmenu
          ? isPortrait
            ? 250
            : 300
          : isPortrait
            ? 190
            : 220,
        isSettingsSubmenu
          ? isPortrait
            ? 340
            : 420
          : isPortrait
            ? 250
            : 300,
      ),
    );

    const headerY = Math.round(
      Phaser.Math.Clamp(hud.height * 0.62, 30, 42),
    );

    const rowStartY = Math.round(
      Phaser.Math.Clamp(hud.height * 1.38, 70, 90),
    );

    const itemFont = Math.round(
      Phaser.Math.Clamp(hud.height * 0.28, 15, 20),
    );

    const rowGap = Math.round(
      Phaser.Math.Clamp(hud.height * 0.24, 10, 16),
    );

    const bottomPadding = Math.round(
      Phaser.Math.Clamp(hud.height * 0.45, 20, 32),
    );


    const drawerItems = this.mobileActionDrawerItems();
    const visibleRowCount = drawerItems.length;

    /* const height =
      rowStartY +
      this.mobileActionMenuItems.length * (itemFont + rowGap) +
      bottomPadding; */

    /**
     * Drawer height must follow the current visible menu:
     * - Root menu: 5 rows
     * - Settings submenu: Back + 6 rows = 7 rows
     *
     * Do not use this.mobileActionMenuItems.length here because that is only
     * the reusable row pool size, not the currently visible menu size.
     */
    const height =
      rowStartY +
      visibleRowCount * itemFont +
      Math.max(0, visibleRowCount - 1) * rowGap +
      bottomPadding;
      
    

      console.log("=============###===============", height, width);
      
    this.drawOverlayDrawerBackground(this.mobileActionMenuBg, width, height);
    this.mobileActionMenuBg.setVisible(true);

    this.mobileActionMenuCloseText
      .setVisible(true)
      .setPosition(24, headerY)
      .setFontSize(Math.round(Phaser.Math.Clamp(hud.height * 0.40, 22, 34)))
      .setFontStyle("700")
      .setColor(this.gtColorFushia);
      //.setColor("#cb2aa3");

    this.mobileActionMenuTitleText
      .setVisible(true)
      .setPosition(72, headerY)
      .setFontSize(Math.round(Phaser.Math.Clamp(hud.height * 0.35, 18, 28)))
      .setFontStyle("700")
      .setColor("#264089");
      //.setColor("#27428a");


    this.mobileActionMenuItems.forEach((label, index) => {
      const icon = this.mobileActionMenuIcons[index];
      const item = drawerItems[index];

      /**
       * Hide unused reusable rows.
       *
       * Root menu uses 5 rows.
       * Settings submenu uses 7 rows.
       */
      if (!item || !icon) {
        label.setVisible(false).setActive(false);
        icon?.setVisible(false).setActive(false);
        return;
      }

      const rowY = rowStartY + index * (itemFont + rowGap);

      const iconSize = Math.round(
        Phaser.Math.Clamp(itemFont * 1.18, 18, 26),
      );

      /**
       * Store latest row data on the icon.
       *
       * createMobileActionDrawer() reads this data during pointer events.
       * This is required because the same row objects are reused for
       * root actions and Settings submenu rows.
       */
      icon
        .setData("action", item.action)
        .setData("label", item.label)
        .setData("isSubmenuItem", item.isSubmenuItem)
        .setData("normalTexture", item.normalTexture)
        .setData("activeTexture", item.activeTexture);

      /**
       * Store latest row data on the label.
       *
       * The pointer handler reads from the label because both icon and label
       * trigger the same row action.
       */
      label
        .setData("action", item.action)
        .setData("label", item.label)
        .setData("isSubmenuItem", item.isSubmenuItem);

      /**
       * Same PNG icon as desktop HUD action bar.
       */
      icon
        .setVisible(true)
        .setActive(true)
        .setTexture(item.normalTexture)
        .setDisplaySize(iconSize, iconSize)
        .setPosition(
          24 + iconSize / 2,
          rowY + itemFont / 2,
        );

      /**
       * Drawer row label.
       */
      /* label
        .setVisible(true)
        .setActive(true)
        .setText(item.label)
        .setFontSize(itemFont)
        .setFontStyle("600")
        .setColor("#cb63b2")
        .setPosition(
          24 + iconSize + 12,
          rowY,
        ); */
        /**
         * Submenu labels can be longer, so use a slightly smaller font
         * while keeping the root drawer unchanged.
         */
        const rowFont = item.isSubmenuItem
          ? Math.round(Math.max(13, itemFont - 2))
          : itemFont;

        label
          .setVisible(true)
          .setActive(true)
          .setText(item.label)
          .setFontSize(rowFont)
          .setFontStyle("600")
          .setColor("#cb63b2")
          .setPosition(
            24 + iconSize + 12,
            rowY,
          );
    });

    this.mobileActionMenuContainer
      .setPosition(
        Math.round(hud.x + hud.width - width - 12),
        Math.round(hud.y + hud.height + 4),
      )
      .setDepth(260)
      .setVisible(true);
  }
  private layoutMobileActionDrawerOLDW(layout: TableLayout): void {
  if (
    !this.mobileActionMenuContainer ||
    !this.mobileActionMenuBg ||
    !this.mobileActionMenuTitleText ||
    !this.mobileActionMenuCloseText
  ) {
    return;
  }

  const compact = this.isCompactHud(layout);

  if (!compact || !this.mobileActionMenuOpen) {
    this.mobileActionMenuContainer.setVisible(false);
    return;
  }

  const hud = layout.hud;

  const width = Math.round(
    Phaser.Math.Clamp(layout.canvas.width * 0.42, 200, 280),
  );

  const headerY = 34;
  const rowStartY = 78;
  const rowGap = 14;
  const itemFont = Math.round(
    Phaser.Math.Clamp(hud.height * 0.28, 15, 20),
  );

  this.mobileActionMenuItems.forEach((item) => {
    item
      .setFontSize(itemFont)
      .setFontStyle("500")
      .setColor("#cb63b2")
      .setVisible(true);
  });

  const height =
    rowStartY +
    this.mobileActionMenuItems.length * (itemFont + rowGap) +
    22;

  this.drawOverlayDrawerBackground(this.mobileActionMenuBg, width, height);

  this.mobileActionMenuTitleText
    .setVisible(true)
    .setPosition(width - 52, headerY)
    .setFontSize(Math.round(Phaser.Math.Clamp(hud.height * 0.34, 18, 28)))
    .setColor("#27428a");

  this.mobileActionMenuCloseText
    .setVisible(true)
    .setPosition(width - 20, headerY)
    .setFontSize(Math.round(Phaser.Math.Clamp(hud.height * 0.38, 20, 30)))
    .setColor(this.gtColorFushia);
    //.setColor("#cb2aa3");

  this.mobileActionMenuItems.forEach((item, index) => {
    item.setPosition(20, rowStartY + index * (itemFont + rowGap));
  });

  this.mobileActionMenuContainer
    .setPosition(
      Math.round(hud.x + hud.width - width - 12),
      Math.round(hud.y + hud.height + 4),
    )
    .setDepth(260)
    .setVisible(true);
}
  private layoutMobileActionDrawerOLD(layout: TableLayout): void {
    if (
      !this.mobileActionMenuContainer ||
      !this.mobileActionMenuBg ||
      !this.mobileActionMenuTitleText ||
      !this.mobileActionMenuCloseText
    ) {
      return;
    }

    const compact = this.isCompactHud(layout);

    if (!compact || !this.mobileActionMenuOpen) {
      this.mobileActionMenuContainer.setVisible(false);
      return;
    }

    const hud = layout.hud;

    const width = Math.round(
      Phaser.Math.Clamp(layout.canvas.width * 0.42, 200, 280),
    );

    const headerY = 34;
    const rowStartY = 78;
    const rowGap = 14;
    const itemFont = Math.round(
      Phaser.Math.Clamp(hud.height * 0.28, 15, 20),
    );

    this.mobileActionMenuItems.forEach((item) => {
      item.setFontSize(itemFont).setFontStyle("500").setColor("#cb63b2");
    });

    const height =
      rowStartY +
      this.mobileActionMenuItems.length * (itemFont + rowGap) +
      22;

    this.drawOverlayDrawerBackground(this.mobileActionMenuBg, width, height);

    this.mobileActionMenuTitleText
      .setPosition(width - 52, headerY)
      .setFontSize(Math.round(Phaser.Math.Clamp(hud.height * 0.34, 18, 28)))
      .setColor("#27428a");

    this.mobileActionMenuCloseText
      .setPosition(width - 20, headerY)
      .setFontSize(Math.round(Phaser.Math.Clamp(hud.height * 0.38, 20, 30)))
      .setColor(this.gtColorFushia);

    this.mobileActionMenuItems.forEach((item, index) => {
      item.setPosition(20, rowStartY + index * (itemFont + rowGap));
    });

    this.mobileActionMenuContainer
      .setPosition(
        Math.round(hud.x + hud.width - width - 12),
        Math.round(hud.y + hud.height + 4),
      )
      .setVisible(true);
  }
  
  private layoutPsdHud(layout: TableLayout, wallTileCount: number): void {
    const hud = layout.hud;
    const compact = this.isCompactHud(layout);

    if (this.mobileHeaderBackground) {
      this.mobileHeaderBackground.clear();
      this.mobileHeaderBackground.setVisible(layout.metrics.isMobile);
      this.mobileHeaderBackground.fillStyle(0x2f4d99, 1);
      this.mobileHeaderBackground.fillRect(hud.x, hud.y, hud.width, hud.height);
    }

    const iconY = Math.round(hud.y + hud.height / 2);

    const metricFont = compact
      ? Math.round(Phaser.Math.Clamp(hud.height * 0.19, 11, 14))
      : Math.round(Phaser.Math.Clamp(hud.height * 0.22, 14, 19));

    const metricGap = compact
      ? Math.round(Phaser.Math.Clamp(hud.height * 0.08, 4, 7))
      : Math.round(Phaser.Math.Clamp(hud.height * 0.14, 8, 13));

    /**
     * Left hamburger.
     */
    this.hamburgerIcon
      ?.setVisible(true)
      .setFontSize(
        compact
          ? Math.round(Phaser.Math.Clamp(hud.height * 0.30, 18, 24))
          : Math.round(Phaser.Math.Clamp(hud.height * 0.38, 26, 34)),
      )
      .setFontStyle("600")
      .setColor(this.gtColorFushia)
      .setPosition(
        Math.round(hud.x + Math.max(14, hud.height * 0.30)),
        iconY,
      );

    /**
     * Logo: visible on mobile too, but smaller.
     */
    /* this.logoText
      ?.setVisible(true)
      .setFontSize(
        compact
          ? Math.round(Phaser.Math.Clamp(hud.height * 0.28, 15, 20))
          : Math.round(Phaser.Math.Clamp(hud.height * 0.43, 28, 38)),
      )
      .setFontStyle("700")
      .setColor("#ffffff")
      .setPosition(
        compactdd 
          ? Math.round(hud.x + Math.max(30, hud.height * 0.58))
          : Math.round(hud.x + Math.max(64, hud.height * 0.94)),
        iconY,
      ); */

      // this.logoImage = scene.add.image(400, 300, 'logoKey')
      /**
     * Logo Image: visible on mobile too, but scaled dynamically.
     */
    /* if (this.logoImage) {
      // 1. Calculate the dynamic scale based on the HUD height
      const targetHeight = compact ? hud.height * 0.28 : hud.height * 0.43;
      const clampedHeight = Phaser.Math.Clamp(targetHeight, compact ? 15 : 28, compact ? 20 : 38);
      const scaleFactor = clampedHeight / this.logoImage.height;

      // 2. Apply transformations matching your original text layouts
      this.logoImage
        .setVisible(true)
        .setScale(scaleFactor)
        .setOrigin(0, 0.5) // Aligns with text-style positioning behavior
        .setPosition(
          compact
            ? Math.round(hud.x + Math.max(30, hud.height * 0.58))
            : Math.round(hud.x + Math.max(64, hud.height * 0.94)),
          iconY
        );
    } */
   /* const logoX = compact
    ? Math.round(hud.x + Math.max(30, hud.height * 0.58))
    : Math.round(hud.x + Math.max(64, hud.height * 0.94));

  const logoHeight = compact
    ? Math.round(Phaser.Math.Clamp(hud.height * 0.34, 16, 24))
    : Math.round(Phaser.Math.Clamp(hud.height * 0.52, 34, 48));

  if (this.logoImage) {
    const source = this.logoImage.texture.getSourceImage() as HTMLImageElement;
    const sourceWidth = source.width || 1;
    const sourceHeight = source.height || 1;

    const logoWidth = Math.round((sourceWidth / sourceHeight) * logoHeight);

    this.logoImage
      .setVisible(true)
      .setOrigin(0, 0.5)
      .setDisplaySize(logoWidth, logoHeight)
      .setPosition(Math.round(logoX), Math.round(iconY));
  } */

      
      


    /**
     * Wall count.
     */
    const wallIconSize = this.hudWallIconSize(layout);
    const wallY = layout.topExposure.y + layout.topExposure.height / 2;

    this.wallCountText
      ?.setVisible(true)
      .setText(`${wallTileCount} LEFT`)
      .setFontSize(metricFont)
      .setFontStyle("500")
      .setColor("#f8fafc");

    // Center the icon-and-count group in the open space between the top
    // exposure and the right table edge. This works for every layout mode.
    const wallGroupLeft = layout.topExposure.x + layout.topExposure.width;
    // Landscape layouts have a right rail beside the top tray, including
    // large iPad Pro viewports classified as desktop. Reserve that lane.
    const wallGroupRight = !layout.metrics.isPortrait
      ? layout.rightExposure.x - 12
      : layout.tableOuter.x + layout.tableOuter.width;
    const wallGroupWidth =
      wallIconSize.width + metricGap + (this.wallCountText?.width ?? 0);
    const wallGroupCenter = (wallGroupLeft + wallGroupRight) / 2;
    const wallIconX = wallGroupCenter - wallGroupWidth / 2 + wallIconSize.width / 2;

    this.hudWallIcon
      ?.setVisible(true)
      .setPosition(Math.round(wallIconX), Math.round(wallY));

    this.drawHudWallIcon(layout);

    this.wallCountText?.setPosition(
      Math.round(wallIconX + wallIconSize.width / 2 + metricGap),
      Math.round(wallY),
    );

    /**
     * Points.
     */
    const pointsIconSize = this.hudPointsIconSize(layout);
    const pointsGroupX = layout.metrics.isTablet && layout.metrics.isPortrait
      // Tablet portrait keeps desktop action icons at the far right.
      // Move points into the free middle lane so the two groups never overlap.
      ? hud.x + hud.width * 0.49
      : compact
        ? hud.x + hud.width * 0.64
        : hud.x + hud.width * 0.675;

    this.hudPointsIcon
      ?.setVisible(true)
      .setPosition(Math.round(pointsGroupX), iconY);

    this.drawHudPointsIcon(layout);

    this.pointsText
      ?.setVisible(true)
      .setText(compact ? "1,000 PTS" : "1,000 POINTS")
      .setFontSize(metricFont)
      .setFontStyle("500")
      .setColor("#f8fafc")
      .setPosition(
        Math.round(pointsGroupX + pointsIconSize.width / 2 + metricGap),
        iconY,
      );

    /**
     * Desktop actions vs mobile action button.
     */
    this.layoutHudActions(layout);
    this.layoutMobileActionButton(layout);
    this.layoutMobileActionMenu(layout);
  }
  private layoutMobileActionButton(layout: TableLayout): void {
    if (!this.mobileActionButton) return;

    const compact = this.isCompactHud(layout);
    const hud = layout.hud;

    if (!compact) {
      this.mobileActionButton.setVisible(false);
      this.mobileActionMenuOpen = false;
      this.mobileActionMenuContainer?.setVisible(false);
      return;
    }

    this.mobileActionButton
      .setVisible(true)
      .setDepth(250)
      .setFontSize(Math.round(Phaser.Math.Clamp(hud.height * 0.34, 20, 28)))
      .setFontStyle("700")
      .setColor(this.gtColorFushia)
      .setPosition(
        Math.round(hud.x + hud.width - Math.max(18, hud.height * 0.34)),
        Math.round(hud.y + hud.height / 2),
      );
  }

  private layoutMobileActionMenu(layout: TableLayout): void {
    if (this.mobileActionMenuItems.length === 0) return;

    const compact = this.isCompactHud(layout);

    if (!compact || !this.mobileActionMenuOpen) {
      this.mobileActionMenuItems.forEach((item) => item.setVisible(false));
      return;
    }

    const hud = layout.hud;

    const fontSize = Math.round(
      Phaser.Math.Clamp(hud.height * 0.22, 12, 16),
    );

    const itemGap = 0;
    const menuWidth = Math.max(
      Math.round(Phaser.Math.Clamp(hud.width * 0.42, 142, 210)),
      ...this.mobileActionMenuItems.map((item) => item.width),
    );

    const x = Math.round(
      Phaser.Math.Clamp(
        hud.x + hud.width - menuWidth - 8,
        hud.x + 8,
        hud.x + hud.width - menuWidth - 8,
      ),
    );

    const y = Math.round(hud.y + hud.height + 6);

    this.mobileActionMenuItems.forEach((item, index) => {
      item
        .setFontSize(fontSize)
        .setFontStyle("500")
        .setColor(this.gtColorFushia)
        .setPosition(
          x,
          y + index * (item.height + itemGap),
        )
        .setVisible(true);
    });
  }
  
  private hudPointsIconSize(layout: TableLayout): {
    readonly width: number;
    readonly height: number;
  } {
    const hudHeight = layout.hud.height;

    const height = Math.round(
      Phaser.Math.Clamp(hudHeight * 0.34, 19, 28),
    );

    return {
      width: Math.round(height * 0.9),
      height,
    };
  }

  private drawHudPointsIcon(layout: TableLayout): void {
    if (!this.hudPointsIcon) return;

    const graphics = this.hudPointsIcon.list[0] as Phaser.GameObjects.Graphics;
    const size = this.hudPointsIconSize(layout);

    const w = size.width;
    const h = size.height;
    const coinH = h * 0.22;
    const coinW = w * 0.86;

    graphics.clear();

    graphics.lineStyle(
      Math.max(2, Math.round(h * 0.07)),
      0xd4d12a,
      1,
    );

    graphics.fillStyle(0xd4d12a, 0.12);

    const rows = 4;
    const startY = -h * 0.32;

    for (let index = 0; index < rows; index += 1) {
      const y = startY + index * coinH * 0.78;

      graphics.fillEllipse(0, y, coinW, coinH);
      graphics.strokeEllipse(0, y, coinW, coinH);
    }

    graphics.lineStyle(
      Math.max(1, Math.round(h * 0.045)),
      0xede85d,
      0.8,
    );

    graphics.lineBetween(-coinW / 2, startY, -coinW / 2, startY + coinH * 2.4);
    graphics.lineBetween(coinW / 2, startY, coinW / 2, startY + coinH * 2.4);
  }

  updateTextResolution(renderDpr: number): void {
    for (const text of [
      ...this.hudTextObjects,
      ...this.hudActionIconTexts,
      ...this.hudDropdownItems,
      ...this.hamburgerMenuItems,
      ...this.mobileActionMenuItems,
      this.hudActionTooltipText,
      this.hamburgerMenuCloseText,
      this.hamburgerMenuLogoText,
      this.mobileActionMenuTitleText,
      this.mobileActionMenuCloseText,
      this.mobileActionButton,
      this.hamburgerIcon,
      this.logoText,
      this.wallCountText,
      this.pointsText,
      this.instructionText,
      ...this.pickSeatButtons,
    ]) {
      text?.setResolution(renderDpr);
    }
  }
  

  updateInstruction(
    phase: TablePhase,
    pickTargetSeat: TableSeat,
    passDirection: PassDirection,
  ): void {
    if (phase === "playing") {
      const seatLabel =
        pickTargetSeat === "bottom" ? "YOUR RACK" :
        pickTargetSeat === "top" ? "TOP SEAT" :
        pickTargetSeat === "left" ? "LEFT SEAT" : "RIGHT SEAT";

      this.instructionText?.setText(`YOUR TURN\nPick a tile to ${seatLabel}`);
      return;
    }

    const label =
      passDirection === "right" ? "YOUR TURN\nSelect 3 tiles to pass\nto the right." :
      passDirection === "left" ? "YOUR TURN\nSelect 3 tiles to pass\nto the left." :
      "YOUR TURN\nSelect 3 tiles to pass\nacross.";

    this.instructionText?.setText(label);
  }
  /**
   * Higher internal texture resolution for small player labels.
   *
   * This does NOT change Phaser canvas DPR scaling.
   * It only renders Phaser.Text sharper so small labels are readable
   * on real Android/iOS devices.
   */
  private readablePlayerLabelResolution(): number {
    const dpr =
      typeof window === "undefined"
        ? 1
        : window.devicePixelRatio || 1;

    return Phaser.Math.Clamp(dpr, 1.5, 2.5);
  }
  updatePlayerNames(
    layout: TableLayout,
    renderDpr: number,
    activeSeat: TableSeat,
  ): void {
    const metrics = layout.metrics;

    const compact = this.isCompactHud(layout);
    const compactLandscape = layout.metrics.isMobile && !layout.metrics.isPortrait;

    const inactiveLabelColor = COLOR_AVOCADO;
    const activeLabelColor = COLOR_BLUE;

    const isMobilePortrait =
      metrics.isMobile &&
      layout.canvas.height >= layout.canvas.width;

    const isMobileLandscape =
      metrics.isMobile &&
      layout.canvas.width > layout.canvas.height;

    // FIX 1: Force resolution to a strict, clean integer (e.g., 2 or 3). 
    // Fractional resolutions (like 2.75) cause severe sub-pixel blur on mobile webviews.
    const labelResolution = Math.ceil(
      Math.max(renderDpr, this.readablePlayerLabelResolution())
    );

    const playerFont = isMobileLandscape
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.28, 11, 13))
      : isMobilePortrait
        ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 9, 12))
        : compact
          ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 9, 12))
          : Math.round(metrics.playerLabelFont);

    const usernameFont = isMobileLandscape
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.28, 11, 13))
      : isMobilePortrait
        ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 9, 12))
        : compact
          ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 9, 12))
          : Math.round(metrics.usernameFont);

    // FIX 2: Compute colors beforehand to apply matching strokes.
    const topColor = activeSeat === "top" ? activeLabelColor : inactiveLabelColor;
    const rightColor = activeSeat === "right" ? activeLabelColor : inactiveLabelColor;
    const leftColor = activeSeat === "left" ? activeLabelColor : inactiveLabelColor;
    const bottomColor = activeSeat === "bottom" ? activeLabelColor : inactiveLabelColor;

    this.playerLabels[0]
      ?.setOrigin(0.5)
      .setPosition(Math.round(layout.topLabel.x), Math.round(layout.topLabel.y))
      .setFontSize(playerFont)
      .setFontStyle(metrics.isMobile ? "600" : compact ? "600" : "700")
      .setColor(topColor)
      // FIX 3: Add explicit 2px padding to stop custom TTF bounds clipping on mobile canvas
      .setPadding(2)
      // FIX 4: Adding a tiny 0.5px stroke forces high-precision antialiasing paths on mobile
      .setStroke(topColor, 0.5)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(40)
      .setAngle(0)
      .setResolution(labelResolution);

    this.playerLabels[1]
      ?.setOrigin(0.5)
      .setPosition(Math.round(layout.rightLabel.x), Math.round(layout.rightLabel.y))
      .setFontSize(playerFont)
      .setFontStyle(metrics.isMobile ? "600" : compact ? "600" : "700")
      .setColor(rightColor)
      .setPadding(2)
      // FIX 5: Crucial for 90-degree rotations. Protects font edge details from pixel bleeding.
      .setStroke(rightColor, 0.5)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(40)
      .setAngle(90)
      .setResolution(labelResolution);

    this.playerLabels[2]
      ?.setOrigin(0.5)
      .setPosition(Math.round(layout.leftLabel.x), Math.round(layout.leftLabel.y))
      .setFontSize(playerFont)
      .setFontStyle(metrics.isMobile ? "600" : compact ? "600" : "700")
      .setColor(leftColor)
      .setPadding(2)
      .setStroke(leftColor, 0.5)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(40)
      .setAngle(-90)
      .setResolution(labelResolution);

    this.usernameText
      ?.setOrigin(0.5)
      .setPosition(Math.round(layout.username.x), Math.round(layout.username.y))
      .setFontSize(usernameFont)
      .setFontStyle(metrics.isMobile ? "600" : compact ? "600" : "700")
      .setColor(bottomColor)
      .setPadding(2)
      .setStroke(bottomColor, 0.5)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(40)
      .setResolution(labelResolution);
  }

  updatePlayerNamesOLDW(
    layout: TableLayout,
    renderDpr: number,
    activeSeat: TableSeat,
  ): void {
    const metrics = layout.metrics;

    const compact = this.isCompactHud(layout);
    const compactLandscape = layout.metrics.isMobile && !layout.metrics.isPortrait;

    const inactiveLabelColor = COLOR_AVOCADO;
    const activeLabelColor = COLOR_BLUE;

    /**
     * Player label font sizes.
     *
     * Real mobile devices cannot read 4px/5px Phaser text clearly.
     * Keep desktop/tablet driven by ResponsiveMetrics, but use a real
     * minimum readable size for mobile portrait/landscape.
     *
     * This only changes text size. It does not change label positions,
     * exposure panel sizes, rack layout, pass area, or discard area.
     */
    const isMobilePortrait =
      metrics.isMobile &&
      layout.canvas.height >= layout.canvas.width;

    const isMobileLandscape =
      metrics.isMobile &&
      layout.canvas.width > layout.canvas.height;
    const labelResolution = Math.max(
      renderDpr,
      this.readablePlayerLabelResolution(),
    );
    const playerFont = isMobileLandscape
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.28, 11, 13))
      : isMobilePortrait
        ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 9, 12))//Math.round(Phaser.Math.Clamp(layout.hud.height * 0.28, 11, 13))
        : compact
          ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 9, 12))
          : Math.round(metrics.playerLabelFont);

    const usernameFont = isMobileLandscape
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.28, 11, 13))
      : isMobilePortrait
        ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 9, 12))
        : compact
          ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 9, 12))
          : Math.round(metrics.usernameFont);

    this.playerLabels[0]
      ?.setOrigin(0.5)
      .setPosition(Math.round(layout.topLabel.x), Math.round(layout.topLabel.y))
      .setFontSize(playerFont)
      .setFontStyle(metrics.isMobile ? "600" : compact ? "600" : "700")
      .setColor(activeSeat === "top" ? activeLabelColor : inactiveLabelColor)
      //.setStroke(activeSeat === "top" ? "#f0eb78" : "#07142f", 1)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(40)
      .setAngle(0)
      .setResolution(labelResolution);

    this.playerLabels[1]
      ?.setOrigin(0.5)
      .setPosition(Math.round(layout.rightLabel.x), Math.round(layout.rightLabel.y))
      .setFontSize(playerFont)
      .setFontStyle(metrics.isMobile ? "600" : compact ? "600" : "700")
      .setColor(activeSeat === "right" ? activeLabelColor : inactiveLabelColor)
      //.setStroke(activeSeat === "right" ? "#f0eb78" : "#07142f", 1)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(40)
      .setAngle(90)
      .setResolution(labelResolution);

    this.playerLabels[2]
      ?.setOrigin(0.5)
      .setPosition(Math.round(layout.leftLabel.x), Math.round(layout.leftLabel.y))
      .setFontSize(playerFont)
      .setFontStyle(metrics.isMobile ? "600" : compact ? "600" : "700")
      .setColor(activeSeat === "left" ? activeLabelColor : inactiveLabelColor)
      //.setStroke(activeSeat === "left" ? "#f0eb78" : "#07142f", 1)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(40)
      .setAngle(-90)
      .setResolution(labelResolution);

    this.usernameText
      ?.setOrigin(0.5)
      .setPosition(Math.round(layout.username.x), Math.round(layout.username.y))
      .setFontSize(usernameFont)
      .setFontStyle(metrics.isMobile ? "600" : compact ? "600" : "700")
      .setColor(activeSeat === "bottom" ? activeLabelColor : inactiveLabelColor)
      //.setStroke(activeSeat === "bottom" ? "#f0eb78" : "#07142f", 1)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(40)
      .setResolution(labelResolution);
  }
  updatePlayerNamesOOLD(
    layout: TableLayout,
    renderDpr: number,
    activeSeat: TableSeat,
  ): void {
    const metrics = layout.metrics;

    const inactiveLabelColor = "#d4d12a";
    const activeLabelColor = "#17336f";

    const compact = this.isCompactHud(layout);
    const compactLandscape = layout.metrics.isMobile && !layout.metrics.isPortrait;

    /* const playerFont = compact
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.135, 7, 10))
      : metrics.playerLabelFont;

    const usernameFont = compact
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.135, 7, 10))
      : metrics.usernameFont; */
    
    /* const playerFont = compact
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.11, 6, 8))
      : metrics.playerLabelFont;

    const usernameFont = compact
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.11, 6, 8))
      : metrics.usernameFont; */

   /* const playerFont = compactLandscape
    ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.095, 5, 7))
    : compact
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.10, 5, 7))
      : metrics.playerLabelFont;

  const usernameFont = compactLandscape
    ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.095, 5, 7))
    : compact
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.10, 5, 7))
      : metrics.usernameFont; */

      /* const playerFont = compactLandscape
        ? 5
        : compact
          ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.10, 5, 7))
          : metrics.playerLabelFont;

      const usernameFont = compactLandscape
        ? 5
        : compact
          ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.10, 5, 7))
          : metrics.usernameFont; */
      /* const playerFont = compactLandscape
        ? 4
        : compact
          ? 4
          : Math.max(10, Math.round(metrics.playerLabelFont * 0.82));

      const usernameFont = compactLandscape
        ? 4
        : compact
          ? 4
          : Math.max(10, Math.round(metrics.usernameFont * 0.82)); */

      const playerFont = compactLandscape
        ? 5
        : compact
          ? 4
          : metrics.playerLabelFont;

      const usernameFont = compactLandscape
        ? 5
        : compact
          ? 4
          : metrics.usernameFont;

    this.playerLabels[0]
      ?.setPosition(layout.topLabel.x, layout.topLabel.y)
      .setFontSize(playerFont)
      .setFontStyle(compact ? "600" : "700")
      .setColor(activeSeat === "top" ? activeLabelColor : inactiveLabelColor)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(40)
      .setAngle(0)
      .setResolution(renderDpr);

    this.playerLabels[1]
      ?.setPosition(layout.rightLabel.x, layout.rightLabel.y)
      .setFontSize(playerFont)
      .setFontStyle(compact ? "600" : "700")
      .setColor(activeSeat === "right" ? activeLabelColor : inactiveLabelColor)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(40)
      .setAngle(90)
      .setResolution(renderDpr);

    this.playerLabels[2]
      ?.setPosition(layout.leftLabel.x, layout.leftLabel.y)
      .setFontSize(playerFont)
      .setFontStyle(compact ? "600" : "700")
      .setColor(activeSeat === "left" ? activeLabelColor : inactiveLabelColor)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(40)
      .setAngle(-90)
      .setResolution(renderDpr);

    this.usernameText
      ?.setPosition(layout.username.x, layout.username.y)
      .setFontSize(usernameFont)
      .setFontStyle(compact ? "600" : "700")
      .setColor(activeSeat === "bottom" ? activeLabelColor : inactiveLabelColor)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(40)
      .setResolution(renderDpr);
  }

  updateWallTiles(wallTileCount: number): void {
    this.wallCountText?.setText(`${wallTileCount} LEFT`);
  }


  private hudWallIconSize(layout: TableLayout): {
  readonly width: number;
  readonly height: number;
} {
  const hudHeight = layout.hud.height;

  const height = Math.round(
    Phaser.Math.Clamp(hudHeight * 0.30, 17, 25),
  );

  return {
    width: Math.round(height * 0.58),
    height,
  };
}

  private drawHudWallIcon(layout: TableLayout): void {
    if (!this.hudWallIcon) return;

    const graphics = this.hudWallIcon.list[0] as Phaser.GameObjects.Graphics;
    const size = this.hudWallIconSize(layout);
    const radius = Math.max(2, Math.round(size.width * 0.22));

    graphics.clear();

    graphics.lineStyle(
      Math.max(2, Math.round(size.height * 0.10)),
      0xd4d12a,
      1,
    );

    graphics.strokeRoundedRect(
      -size.width / 2,
      -size.height / 2,
      size.width,
      size.height,
      radius,
    );
  }
  layoutHudPointsIcon(layout: TableLayout, x: number, y: number): void {
    if (!this.hudPointsIcon) return;

    const hud = layout.hud;
    const size = Math.round(Phaser.Math.Clamp(hud.height * 0.27, 16, 23));

    this.hudPointsIcon.setPosition(Math.round(x), Math.round(y));

    const graphics = this.hudPointsIcon.list[0] as Phaser.GameObjects.Graphics;

    graphics.clear();
    graphics.fillStyle(0xf6c542, 1);
    graphics.fillCircle(0, 0, size * 0.5);

    graphics.lineStyle(Math.max(2, size * 0.08), 0xfff3a3, 1);
    graphics.strokeCircle(0, 0, size * 0.38);

    graphics.fillStyle(0x172447, 1);
    graphics.fillCircle(0, 0, size * 0.13);
  }
  createHudActions(scene: Phaser.Scene): Phaser.GameObjects.Container {
    /**
     * Desktop/tablet HUD action icons.
     *
     * This now creates PNG image buttons instead of text/emoji icons.
     * Each icon supports:
     * - normal texture
     * - hover texture
     * - active/clicked texture
     *
     * Tooltip behavior is preserved.
     */
    this.hudActionIconTexts = [];

    this.hudActionButtons = this.hudActions.map((action) => {
      const textures = this.hudActionTextures[action.key];

      const image = scene.add
        .image(0, 0, textures.normal)
        .setOrigin(0.5)
        .setData("action", action.key)
        .setInteractive({ useHandCursor: true });

      const button: HudImageButton = {
        key: action.key,
        image,
        normalTexture: textures.normal,
        hoverTexture: textures.hover,
        activeTexture: textures.active,
        isPressed: false,
      };

      image.on("pointerover", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();

        /**
         * Show action meaning on hover.
         * Do not override the active icon while its dropdown is open.
         */
        if (this.activeHudDropdown !== action.key) {
          image.setTexture(button.hoverTexture);
        }

        this.showHudActionTooltip(action.key);
      });

      image.on("pointerout", () => {
        /**
         * Hide tooltip when pointer leaves the icon.
         * If dropdown is open, keep active texture.
         */
        button.isPressed = false;

        image.setTexture(
          this.activeHudDropdown === action.key
            ? button.activeTexture
            : button.normalTexture,
        );

        this.hideHudActionTooltip();
      });

      image.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();

        /**
         * Active/clicked state.
         */
        button.isPressed = true;
        image.setTexture(button.activeTexture);

        this.hideHudActionTooltip();
      });

      image.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();

        button.isPressed = false;

        /**
         * Keep existing dropdown behavior.
         */
        this.activeHudDropdown =
          this.activeHudDropdown === action.key ? undefined : action.key;

          this.callbacks.onHudAction?.(action.key);

          /**
           * Sort tooltip toggles after Sort is clicked.
           * This changes the next hover label between:
           * - Sort By Suit
           * - Sort By Rank
           */
          if (action.key === "sort") {
            this.toggleSortTooltipState();
          }

          this.updateHudActionButtonTextures();
          this.layoutHudDropdownFromCurrentVisibility();
      });

      image.on("pointerupoutside", () => {
        button.isPressed = false;
        this.updateHudActionButtonTextures();
        this.hideHudActionTooltip();
      });

      return button;
    });

    this.hudActionsContainer = scene.add
      .container(
        0,
        0,
        this.hudActionButtons.map((button) => button.image),
      )
      .setDepth(25);

    return this.hudActionsContainer;
  }
  private showHudActionTooltip(action: HudActionKey): void {
    this.hoveredHudAction = action;

    /**
     * lastLayout is updated by layoutStaticUi().
     * If layout is not ready yet, keep state but do not draw.
     */
    if (!this.lastLayout) return;

    this.layoutHudActionTooltip(this.lastLayout);
  }

  private hideHudActionTooltip(): void {
    this.hoveredHudAction = undefined;

    this.hudActionTooltipBg?.clear();
    this.hudActionTooltipBg?.setVisible(false);
    this.hudActionTooltipText?.setVisible(false);
  }

  private layoutHudActionTooltip(layout: TableLayout): void {
    if (
      !this.hoveredHudAction ||
      !this.hudActionTooltipBg ||
      !this.hudActionTooltipText ||
      !this.hudActionsContainer
    ) {
      return;
    }

    /**
     * Do not show hover tooltip on compact/mobile HUD.
     * Mobile drawer has icon + text instead.
     */
    if (this.isCompactHud(layout)) {
      this.hideHudActionTooltip();
      return;
    }

    const action = this.hudActions.find(
      (item) => item.key === this.hoveredHudAction,
    );

    /* const icon = this.hudActionIconTexts.find(
      (item) => item.getData("action") === this.hoveredHudAction,
    );

    if (!action || !icon) {
      this.hideHudActionTooltip();
      return;
    }

    const iconWorldX = this.hudActionsContainer.x + icon.x;
    const iconWorldY = this.hudActionsContainer.y + icon.y; */

    const hud = layout.hud;
    const button = this.hudActionButtons.find(
      (item) => item.key === this.hoveredHudAction,
    );

    if (!action || !button) {
      this.hideHudActionTooltip();
      return;
    }

    const iconWorldX = this.hudActionsContainer.x + button.image.x;
    const iconWorldY = this.hudActionsContainer.y + button.image.y;

    const fontSize = Math.round(
      Phaser.Math.Clamp(hud.height * 0.18, 12, 15),
    );

    this.hudActionTooltipText
      .setText(this.tooltipLabelForAction(action.key))
      .setFontSize(fontSize)
      .setFontStyle("600")
      .setColor("#27428a")
      .setVisible(true);

    const paddingX = Math.round(Phaser.Math.Clamp(hud.height * 0.16, 10, 14));
    const paddingY = Math.round(Phaser.Math.Clamp(hud.height * 0.10, 6, 9));

    const tooltipWidth = Math.round(this.hudActionTooltipText.width + paddingX * 2);
    const tooltipHeight = Math.round(this.hudActionTooltipText.height + paddingY * 2);

    /**
     * Tooltip is placed below the HUD icon and clamped inside the HUD width.
     */
    const tooltipX = Math.round(
      Phaser.Math.Clamp(
        iconWorldX - tooltipWidth / 2,
        hud.x + 8,
        hud.x + hud.width - tooltipWidth - 8,
      ),
    );

    const tooltipY = Math.round(iconWorldY + hud.height * 0.45);

    this.hudActionTooltipBg.clear();
    this.hudActionTooltipBg.setVisible(true);
    this.hudActionTooltipBg.setPosition(tooltipX, tooltipY);

    /**
     * Soft tooltip shadow.
     */
    this.hudActionTooltipBg.fillStyle(0x000000, 0.12);
    this.hudActionTooltipBg.fillRoundedRect(
      2,
      3,
      tooltipWidth,
      tooltipHeight,
      8,
    );

    /**
     * Tooltip white body.
     */
    this.hudActionTooltipBg.fillStyle(0xffffff, 1);
    this.hudActionTooltipBg.fillRoundedRect(
      0,
      0,
      tooltipWidth,
      tooltipHeight,
      8,
    );

    this.hudActionTooltipBg.lineStyle(1, 0xe5e7eb, 1);
    this.hudActionTooltipBg.strokeRoundedRect(
      0,
      0,
      tooltipWidth,
      tooltipHeight,
      8,
    );

    this.hudActionTooltipText.setPosition(
      tooltipX + tooltipWidth / 2,
      tooltipY + tooltipHeight / 2,
    );
  }
  layoutHudActions(layout: TableLayout): void {
    if (!this.hudActionsContainer) return;

    const compact = this.isCompactHud(layout);

    /**
     * Compact/mobile HUD uses the right-side action drawer.
     * Desktop/tablet use PNG action icons.
     */
    if (compact) {
      this.hudActionsContainer.setVisible(false);
      this.activeHudDropdown = undefined;
      this.hideHudActionTooltip();
      this.layoutHudDropdown(layout);
      return;
    }

    this.hudActionsContainer.setVisible(true);

    const hud = layout.hud;

    const iconSize = Math.round(
      Phaser.Math.Clamp(hud.height * 0.46, 30, 44),
    );

    const gap = Math.round(
      Phaser.Math.Clamp(hud.height * 0.58, 38, 54),
    );

    let x = 0;

    for (const button of this.hudActionButtons) {
      button.image
        .setVisible(true)
        .setActive(true)
        .setPosition(Math.round(x), 0)
        .setDisplaySize(iconSize, iconSize)
        .setInteractive({ useHandCursor: true });

      x += gap;
    }

    const totalWidth = gap * Math.max(0, this.hudActionButtons.length - 1);

    this.hudActionsContainer.setPosition(
      Math.round(
        hud.x +
          hud.width -
          Math.max(26, hud.height * 0.38) -
          totalWidth,
      ),
      Math.round(hud.y + hud.height / 2),
    );

    this.updateHudActionButtonTextures();
    this.layoutHudDropdown(layout);
    this.layoutHudActionTooltip(layout);
  }

  private updateHudActionButtonTextures(): void {
    /**
     * Keeps PNG icon texture state synchronized with the open dropdown.
     *
     * normal = no interaction
     * hover  = pointer over, handled in pointerover
     * active = dropdown currently open for that action
     */
    for (const button of this.hudActionButtons) {
      button.image.setTexture(
        this.activeHudDropdown === button.key
          ? button.activeTexture
          : button.normalTexture,
      );
    }
  }
  layoutHudDropdown(layout: TableLayout): void {
    if (!this.hudDropdownBg || !this.hudActionsContainer) return;

    for (const item of this.hudDropdownItems) {
      item.destroy();
    }

    this.hudDropdownItems = [];

    if (!this.activeHudDropdown) {
      this.hudDropdownBg.clear();
      this.hudDropdownBg.setVisible(false);
      return;
    }

    const action = this.hudActions.find((item) => item.key === this.activeHudDropdown);
        const button = this.hudActionButtons.find(
      (item) => item.key === this.activeHudDropdown,
    );

    if (!action || !button) return;

    const hud = layout.hud;
    const iconWorldX = this.hudActionsContainer.x + button.image.x;
    const iconWorldY = this.hudActionsContainer.y + button.image.y;

    const fontSize = Math.round(Phaser.Math.Clamp(hud.height * 0.235, 15, 21));
    const itemHeight = Math.round(Phaser.Math.Clamp(hud.height * 0.34, 26, 36));
    const paddingX = 18;
    const paddingY = 10;
    const pointerHeight = 10;

    const width = this.dropdownWidthForAction(action.key, fontSize, paddingX);
    const height = paddingY * 2 + action.items.length * itemHeight;

    const x = Math.round(
      Phaser.Math.Clamp(
        iconWorldX - width * 0.5,
        hud.x + 8,
        hud.x + hud.width - width - 8,
      ),
    );

    const y = Math.round(iconWorldY + hud.height * 0.54);
    const pointerX = Phaser.Math.Clamp(iconWorldX - x, 12, width - 12);

    this.hudDropdownBg.clear();
    this.hudDropdownBg.setVisible(true);
    this.hudDropdownBg.setPosition(x, y);

    this.hudDropdownBg.fillStyle(0xffffff, 1);
    this.hudDropdownBg.fillTriangle(
      pointerX,
      0,
      pointerX - pointerHeight,
      pointerHeight,
      pointerX + pointerHeight,
      pointerHeight,
    );

    this.hudDropdownBg.fillRect(0, pointerHeight, width, height);
    this.hudDropdownBg.lineStyle(1, 0xe5e7eb, 1);
    this.hudDropdownBg.strokeRect(0, pointerHeight, width, height);

    for (let index = 0; index < action.items.length; index += 1) {
      const label = action.items[index];

      const text = this.hudDropdownBg.scene.add
        .text(
          x + paddingX,
          y + pointerHeight + paddingY + index * itemHeight + itemHeight / 2,
          label,
          {
            fontFamily: FONT_FAMILY,
            fontSize: `${fontSize}px`,
            fontStyle: "500",
            color: this.gtColorFushia
          },
        )
        .setOrigin(0, 0.5)
        .setDepth(221)
        .setInteractive({ useHandCursor: true });

      text.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();
        this.activeHudDropdown = undefined;
        this.layoutHudDropdown(layout);
      });

      this.hudDropdownItems.push(text);
    }
  }

  private dropdownWidthForAction(
    action: HudActionKey,
    fontSize: number,
    paddingX: number,
  ): number {
    if (action === "settings") return Math.round(Phaser.Math.Clamp(fontSize * 12.8, 230, 285));
    if (action === "dead-hand") return Math.round(Phaser.Math.Clamp(fontSize * 8.8, 145, 190));
    if (action === "sort") return Math.round(Phaser.Math.Clamp(fontSize * 7.2, 130, 170));
    if (action === "hint") return Math.round(Phaser.Math.Clamp(fontSize * 6.2, 115, 155));
    return Math.round(Phaser.Math.Clamp(fontSize * 4.8 + paddingX * 2, 75, 110));
  }

  private layoutHudDropdownFromCurrentVisibility(): void {
    /**
     * Dropdown and tooltip should not show at the same time.
     */
    if (this.activeHudDropdown) {
      this.hideHudActionTooltip();
    }

    this.hudDropdownBg?.setVisible(Boolean(this.activeHudDropdown));

    for (const item of this.hudDropdownItems) {
      item.setVisible(Boolean(this.activeHudDropdown));
    }
  }

  private layoutHudDropdownFromCurrentAction(): void {
     /**
     * The actual dropdown layout needs TableLayout, so this only toggles visibility.
     * The next layoutStaticUi/updateHUD call will position exactly.
     */
    this.updateHudActionButtonTextures();
    this.hudDropdownBg?.setVisible(Boolean(this.activeHudDropdown));
  }

  createSettingsMenu(scene: Phaser.Scene): Phaser.GameObjects.Text[] {
    const items: readonly {
      readonly label: string;
      readonly action: HudActionKey;
    }[] = [
      { label: "Sort Tiles", action: "sort" },
      { label: "Get A Hint", action: "hint" },
      { label: "Call DEAD Hand", action: "dead-hand" },
      { label: "Settings", action: "settings" },
      { label: "Help", action: "help" },
    ];

    this.hudMenuItems = items.map((item) =>
      scene.add
        .text(0, 0, item.label, {
          fontFamily: FONT_FAMILY,
          fontSize: "18px",
          fontStyle: "500",
          color: this.gtColorFushia,
          backgroundColor: "#ffffff",
          padding: { x: 12, y: 7 },
        })
        .setData("action", item.action)
        .setDepth(220)
        .setVisible(false)
        .setInteractive({ useHandCursor: true }),
    );

    this.hudMenuItems.forEach((text) => {
      text.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();

        const action = text.getData("action") as HudActionKey;

        this.hudMenuOpen = false;
        this.hudMenuItems.forEach((menuItem) => menuItem.setVisible(false));

        this.callbacks.onHudAction?.(action);
      });
    });

    return this.hudMenuItems;
  }

  layoutMobileHud(layout: TableLayout): void {
    if (this.hudMenuItems.length === 0) return;

    const compact = this.isCompactHud(layout);

    if (!compact || !this.hudMenuOpen) {
      this.hudMenuItems.forEach((item) => item.setVisible(false));
      return;
    }

    const hud = layout.hud;
    const itemGap = 0;

    const menuWidth = Math.max(
      Math.round(Phaser.Math.Clamp(hud.width * 0.46, 155, 230)),
      ...this.hudMenuItems.map((item) => item.width),
    );

    const x = Math.round(
      Phaser.Math.Clamp(
        hud.x + Math.max(8, hud.height * 0.18),
        hud.x + 8,
        hud.x + hud.width - menuWidth - 8,
      ),
    );

    const y = Math.round(hud.y + hud.height + 6);

    const fontSize = Math.round(
      Phaser.Math.Clamp(hud.height * 0.24, 13, 17),
    );

    this.hudMenuItems.forEach((item, index) => {
      item
        .setFontSize(fontSize)
        .setFontStyle("500")
        .setColor(this.gtColorFushia)
        .setPosition(x, y + index * (item.height + itemGap))
        .setVisible(true);
    });
  }

  createWallTileBox(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const graphics = scene.add.graphics();

    this.wallTileBox = scene.add
      .container(0, 0, [graphics])
      .setDepth(12);

    return this.wallTileBox;
  }

  layoutWallTileBox(layout: TableLayout, wallTileCount: number): void {
    if (!this.wallTileBox || this.hudTextObjects.length < 3) return;

    const hud = layout.hud;
    const tilesLeft = this.hudTextObjects[2];

    this.updateWallTiles(wallTileCount);

    tilesLeft
      .setOrigin(0, 0.5)
      .setFontSize(Math.round(Phaser.Math.Clamp(hud.height * 0.27, 17, 24)))
      .setFontStyle("600")
      .setColor("#f8fafc");

    const size = this.wallTileBoxSize(layout);
    const gap = Math.max(8, Math.round(size.width * 0.38));
    const groupLeft = hud.x + hud.width * 0.53;

    this.wallTileBox.setPosition(
      Math.round(groupLeft),
      Math.round(hud.y + hud.height / 2),
    );

    tilesLeft.setPosition(
      Math.round(groupLeft + size.width / 2 + gap),
      Math.round(hud.y + hud.height / 2),
    );

    const graphics = this.wallTileBox.list[0] as Phaser.GameObjects.Graphics;
    const radius = Math.max(3, Math.round(Math.min(size.width, size.height) * 0.16));

    graphics.clear();
    graphics.lineStyle(
      Math.max(2, Math.round(size.height * 0.12)),
      0xf6c542,
      1,
    );
    graphics.strokeRoundedRect(
      -size.width / 2,
      -size.height / 2,
      size.width,
      size.height,
      radius,
    );
  }

  wallTileBoxSize(layout: TableLayout): { readonly width: number; readonly height: number } {
    const hudHeight = layout.hud.height;

    const height = Math.round(
      Phaser.Math.Clamp(
        hudHeight * 0.30,
        layout.metrics.isMobile ? 14 : 18,
        layout.metrics.isMobile ? 22 : 26,
      ),
    );

    const width = Math.round(height * 0.68);

    return { width, height };
  }

  wallTileSourcePoint(layout: TableLayout): { readonly x: number; readonly y: number } {
    if (this.hudWallIcon) {
      return {
        x: this.hudWallIcon.x,
        y: this.hudWallIcon.y,
      };
    }

    return {
      x: layout.hud.x + layout.hud.width / 2,
      y: layout.hud.y + layout.hud.height / 2,
    };
  }

  createPassButton(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const bg = scene.add.graphics();

    const text = scene.add
      .text(0, 0, "PICK", {
        fontFamily: FONT_FAMILY,
        fontSize: "13px",
        fontStyle: "700",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.passButton = scene.add
      .container(0, 0, [bg, text])
      .setDepth(20);

    this.passButton.setInteractive(
      new Phaser.Geom.Rectangle(-70, -32, 140, 64),
      Phaser.Geom.Rectangle.Contains,
    );

    this.passButton.on("pointerdown", () => {
      this.callbacks.onPrimaryAction?.();
    });

    return this.passButton;
  }

  layoutPassButton(layout: TableLayout): void {
    if (!this.passButton) return;

    const button = layout.passButton;
    const metrics = layout.metrics;

    const bg = this.passButton.list[0] as Phaser.GameObjects.Graphics;
    const text = this.passButton.list[1] as Phaser.GameObjects.Text;

    const compact = this.isCompactHud(layout);
    const compactLandscape = layout.metrics.isMobile && !layout.metrics.isPortrait;

    this.passButton.setPosition(
      Math.round(button.x + button.width / 2),
      Math.round(button.y + button.height / 2),
    );

    const radius = Math.round(
      Phaser.Math.Clamp(button.height * 0.22, 8, 14),
    );

    bg.clear();

    /**
     * PSD-style button shadow.
     */
    bg.fillStyle(0x000000, 0.22);
    bg.fillRoundedRect(
      -button.width / 2 + Math.max(3, button.width * 0.025),
      -button.height / 2 + Math.max(4, button.height * 0.10),
      button.width,
      button.height,
      radius,
    );

    bg.fillStyle(0x000000, 0.10);
    bg.fillRoundedRect(
      -button.width / 2 + Math.max(6, button.width * 0.045),
      -button.height / 2 + Math.max(7, button.height * 0.16),
      button.width,
      button.height,
      radius,
    );

    /**
     * Magenta button body.
     */
    bg.fillStyle(this.gtnumColorFushia, 1);
    bg.fillRoundedRect(
      -button.width / 2,
      -button.height / 2,
      button.width,
      button.height,
      radius,
    );

    /**
     * Subtle top highlight.
     */
    bg.fillStyle(0xffffff, 0.08);
    bg.fillRoundedRect(
      -button.width / 2 + 2,
      -button.height / 2 + 2,
      button.width - 4,
      Math.max(2, button.height * 0.22),
      Math.max(5, radius - 2),
    );

    text
      .setFontSize(
        compactLandscape
          ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.19, 11, 14))
          : compact
            ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.20, 11, 15))
            : Math.round(Phaser.Math.Clamp(metrics.passFont * 1.15, 18, 31)),
      )
      .setFontStyle("700")
      .setColor("#ffffff")
      .setPosition(0, 0);

    this.passButton.setInteractive(
      new Phaser.Geom.Rectangle(
        -button.width / 2,
        -button.height / 2,
        button.width,
        button.height,
      ),
      Phaser.Geom.Rectangle.Contains,
    );
  }
  layoutPassButtonOLD(layout: TableLayout): void {
    if (!this.passButton) return;

    const button = layout.passButton;
    const metrics = layout.metrics;

    const bg = this.passButton.list[0] as Phaser.GameObjects.Graphics;
    const text = this.passButton.list[1] as Phaser.GameObjects.Text;

    this.passButton.setPosition(
      button.x + button.width / 2,
      button.y + button.height / 2,
    );

    bg.clear();
    bg.fillStyle(this.gtnumColorFushia, 1);
    bg.fillRoundedRect(
      -button.width / 2,
      -button.height / 2,
      button.width,
      button.height,
      Math.min(12, button.height * 0.28),
    );

    /* text
      .setFontSize(metrics.passFont)
      .setFontStyle("700")
      .setColor("#ffffff")
      .setPosition(0, 0); */
    
    const compact = this.isCompactHud(layout);

    text
      .setFontSize(
        compact
          ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 10, 14))
          : metrics.passFont,
      )
      .setFontStyle("700")
      .setColor("#ffffff")
      .setPosition(0, 0);

    this.passButton.setInteractive(
      new Phaser.Geom.Rectangle(
        -button.width / 2,
        -button.height / 2,
        button.width,
        button.height,
      ),
      Phaser.Geom.Rectangle.Contains,
    );
  }

  updatePassButtonState(options: PassButtonStateOptions): void {
    if (!this.passButton) return;

    const {
      layout,
      tablePhase,
      passWaitingCount,
      canSubmitPass,
      isPassAnimating,
      isPickAnimating,
      wallTileCount,
    } = options;

    const bg = this.passButton.list[0] as Phaser.GameObjects.Graphics;
    const text = this.passButton.list[1] as Phaser.GameObjects.Text;
    const button = layout.passButton;

    const enabled =
      tablePhase === "playing"
        ? wallTileCount > 0 && !isPickAnimating
        : canSubmitPass && !isPassAnimating;

    text.setText(tablePhase === "playing" ? "PICK" : enabled ? "PASS" : `${passWaitingCount}/3`);
    this.passButton.setAlpha(enabled ? 1 : 0.65);

   /*  bg.clear();
    bg.fillStyle(enabled ? 0xcb2aa3 : 0x777777, 1);
    bg.fillRoundedRect(
      -button.width / 2,
      -button.height / 2,
      button.width,
      button.height,
      Math.min(12, button.height * 0.28),
    ); */
    const radius = Math.round(
  Phaser.Math.Clamp(button.height * 0.22, 8, 14),
);

bg.clear();

bg.fillStyle(0x000000, enabled ? 0.22 : 0.14);
bg.fillRoundedRect(
  -button.width / 2 + Math.max(3, button.width * 0.025),
  -button.height / 2 + Math.max(4, button.height * 0.10),
  button.width,
  button.height,
  radius,
);

bg.fillStyle(enabled ? this.gtnumColorFushia : 0x777777, 1);
bg.fillRoundedRect(
  -button.width / 2,
  -button.height / 2,
  button.width,
  button.height,
  radius,
);

bg.fillStyle(0xffffff, enabled ? 0.08 : 0.04);
bg.fillRoundedRect(
  -button.width / 2 + 2,
  -button.height / 2 + 2,
  button.width - 4,
  Math.max(2, button.height * 0.22),
  Math.max(5, radius - 2),
);
  }

  createPickSeatSelector(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const labels: readonly { readonly seat: TableSeat; readonly label: string }[] = [
      { seat: "bottom", label: "Bottom" },
      { seat: "left", label: "Left" },
      { seat: "top", label: "Top" },
      { seat: "right", label: "Right" },
    ];

    this.pickSeatButtons = labels.map((item) => {
      const text = scene.add
        .text(0, 0, item.label, {
          fontFamily: FONT_FAMILY,
          fontSize: "11px",
          fontStyle: "700",
          color: "#ffffff",
          backgroundColor: COLOR_GRAY,
          padding: { x: 7, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(22)
        .setInteractive({ useHandCursor: true });

      text.setData("seat", item.seat);

      text.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();
        this.callbacks.onPickSeatChange?.(item.seat);
      });

      return text;
    });

    this.pickSeatSelector = scene.add
      .container(0, 0, this.pickSeatButtons)
      .setDepth(22)
      .setVisible(false);

    return this.pickSeatSelector;
  }

  
  layoutPickSeatSelector(
    layout: TableLayout,
    phase: TablePhase,
    pickTargetSeat: TableSeat,
  ): void {
    if (!this.pickSeatSelector || this.pickSeatButtons.length === 0) return;

    const visible = phase === "playing";

    this.pickSeatSelector.setVisible(visible);

    for (const button of this.pickSeatButtons) {
      button.setVisible(visible);
    }

    if (!visible) return;

    const passButton = layout.passButton;
    //const gap = layout.metrics.isMobile ? 4 : 6;
    const compact = this.isCompactHud(layout);
    const gap = compact ? 3 : layout.metrics.isMobile ? 4 : 6;

    let totalWidth = 0;

    for (const button of this.pickSeatButtons) {
      totalWidth += button.width;
    }

    totalWidth += gap * (this.pickSeatButtons.length - 1);

    let x = -totalWidth / 2;

    for (const button of this.pickSeatButtons) {
      button.setPosition(Math.round(x + button.width / 2), 90);
      x += button.width + gap;
      button.setFontSize(compact ? 9 : 11);
    }

    /* this.pickSeatSelector.setPosition(
      Math.round(passButton.x + passButton.width / 2),
      Math.round(layout.instructionBar.y + layout.instructionBar.height + (compact ? 18 : 24)),
    ); */

    const compactLandscape =
      layout.metrics.isMobile && !layout.metrics.isPortrait;

    this.pickSeatSelector.setPosition(
      Math.round(passButton.x + passButton.width / 2),
      Math.round(
        compactLandscape
          ? layout.instructionBar.y + layout.instructionBar.height + 8
          : layout.instructionBar.y + layout.instructionBar.height + (compact ? 18 : 24),
      ),
    );
    this.updatePickSeatSelectorState(pickTargetSeat);
  }

  updatePickSeatSelectorState(pickTargetSeat: TableSeat): void {
    for (const button of this.pickSeatButtons) {
      const seat = button.getData("seat") as TableSeat;
      const active = seat === pickTargetSeat;

      button.setBackgroundColor(active ? this.gtColorFushia : "#64748b");
      button.setAlpha(active ? 1 : 0.78);
    }
  }

  showHUD(): void {
    this.hamburgerIcon?.setVisible(true);
    this.logoText?.setVisible(true);
    this.hudWallIcon?.setVisible(true);
    this.wallCountText?.setVisible(true);
    this.hudPointsIcon?.setVisible(true);
    this.pointsText?.setVisible(true);
    this.hudActionsContainer?.setVisible(true);
  }

  hideHUD(): void {
    this.hamburgerIcon?.setVisible(false);
    this.logoText?.setVisible(false);
    this.hudWallIcon?.setVisible(false);
    this.wallCountText?.setVisible(false);
    this.hudPointsIcon?.setVisible(false);
    this.pointsText?.setVisible(false);
    this.hudActionsContainer?.setVisible(false);

    this.hudDropdownBg?.setVisible(false);
    this.hudDropdownItems.forEach((item) => item.setVisible(false));
    this.hudMenuItems.forEach((item) => item.setVisible(false));
  }

  showPassButton(): void {
    this.passButton?.setVisible(true);
  }

  hidePassButton(): void {
    this.passButton?.setVisible(false);
  }

  private labelStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      fontStyle: "800",
      color: COLOR_AVOCADO,
    };
  }
}
