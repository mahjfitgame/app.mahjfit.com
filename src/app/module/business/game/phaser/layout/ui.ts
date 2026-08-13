// file: src/app/module/business/game/phaser/scenes/managers/ui-layout.ts
import Phaser from "phaser";
import { COLOR_AVOCADO, COLOR_BLUE, COLOR_BLUE_NUM, COLOR_FUSHIA, COLOR_FUSHIA_NUM, COLOR_GRAY, FONT_FAMILY, ICON_DEADHAND_HOVER, ICON_DEADHAND_NORMAL, ICON_DEADHAND_PRESSED, ICON_HELP_HOVER, ICON_HELP_NORMAL, ICON_HELP_PRESSED, ICON_HINT_HOVER, ICON_HINT_NORMAL, ICON_HINT_PRESSED, ICON_SETTINGS_HOVER, ICON_SETTINGS_NORMAL, ICON_SETTINGS_PRESSED, ICON_SORT_HOVER, ICON_SORT_NORMAL, ICON_SORT_PRESSED } from "../const";
import { PassDirection, TableLayout, TablePhase } from "../type";
import { HamburgerMenuActionKey, HudActionKey, HudImageButton, LayoutStaticUiOptions, PassButtonStateOptions, PlayerLabelOverlayState, PointsOverlayState, TableSeat, UiLayoutCallbacks, WallCountOverlayState } from "../scenes/type";


/**
 * Owns Phaser UI objects and responsive UI presentation state.
 * Gameplay actions remain callbacks owned by TableScene.
 */
export class PhaserLayoutUi {
  hudTextObjects: Phaser.GameObjects.Text[] = [];
  hudActionIconImage: Phaser.GameObjects.Image[] = [];
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
  private wallCountOverlayState?: WallCountOverlayState;
  private pointsOverlayState?: PointsOverlayState;

  /**
   * Instruction panel model.
   *
   * The card, its copy, and its primary button are drawn as native HTML so the
   * text stays sharp on every device. Phaser still owns all geometry, so these
   * fields hold the latest content and the panel is republished whenever the
   * layout, the phase, or the button state changes.
   */
  private instructionMessage = "";
  private instructionPhase: TablePhase = "playing";
  private passButtonLabel = "PICK";
  private passButtonEnabled = true;

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

  private gtColorBlue: string = COLOR_BLUE;
  private gtColorFushia: string = COLOR_FUSHIA;

  private gtnumColorFushia: number = COLOR_FUSHIA_NUM;


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
  constructor(private readonly callbacks: UiLayoutCallbacks = {}) { }

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
      this.notifyMobileDrawerVisibility();

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


    this.playerLabels = [
      scene.add.text(0, 0, "PLAYER 1", this.labelStyle()).setOrigin(0.5),
      scene.add.text(0, 0, "PLAYER 2", this.labelStyle()).setOrigin(0.5),
      scene.add.text(0, 0, "PLAYER 3", this.labelStyle()).setOrigin(0.5),
    ];

    this.usernameText = scene.add
      .text(0, 0, "USERNAME", this.labelStyle())
      .setOrigin(0.5);

    this.pickSeatSelector = this.createPickSeatSelector(scene);
  }

  /** The mobile HUD overlays the table and can be hidden without relayout. */
  setMobileHeaderVisible(visible: boolean): void {
    // When visible, let the normal HUD layout decide which mobile/desktop
    // controls are active. Forcing the desktop action container visible on a
    // phone creates invisible interactive controls above the hamburger.
    if (visible) {
      // The wall icon sits in the table layer. Keep it below the expanded
      // mobile-header background so it cannot draw through that header.
      if (this.lastLayout?.metrics.isMobile) this.hudWallIcon?.setDepth(19);
      return;
    }

    this.hamburgerIcon?.setVisible(false);
    this.mobileHeaderBackground?.setVisible(false);
    // The wall indicator lives beside the top exposure, rather than in the
    // collapsible mobile header, so it stays available while that header is closed.
    this.hudWallIcon?.setDepth(25);
    this.hudPointsIcon?.setVisible(false);
    this.pointsText?.setVisible(false);
    // The native points text is outside Phaser's display list, so explicitly
    // hide it with the rest of the collapsible mobile header controls.
    if (this.pointsOverlayState) {
      this.publishPointsOverlay({ ...this.pointsOverlayState, visible: false });
    }
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
    const action = this.hudActions.find((item) => item.key === actionKey);

    return action?.tooltip ?? "";
  }
  private createHamburgerDrawer(scene: Phaser.Scene): void {
    this.hamburgerMenuBg = scene.add.graphics().setDepth(260);

    this.hamburgerMenuCloseText = scene.add
      .text(0, 0, "✕", {
        fontFamily: FONT_FAMILY,
        fontSize: "28px",
        fontStyle: "700",
        //color: "#cb2aa3",
        color: this.gtColorFushia
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
      this.notifyMobileDrawerVisibility();
      this.callbacks.onMobileDrawerOverlay?.({ visible: false, x: 0, y: 0, width: 0, height: 0, title: "", items: [] });
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
        this.notifyMobileDrawerVisibility();
        this.callbacks.onMobileDrawerOverlay?.({ visible: false, x: 0, y: 0, width: 0, height: 0, title: "", items: [] });

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

    // The instruction card, its copy, and its primary button are native HTML.
    // updateInstruction()/updatePassButtonState() republish that panel below.
    this.updateInstruction(tablePhase, pickTargetSeat, passDirection);
    this.updatePlayerNames(layout, renderDpr, options.activeSeat);

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
      .text(0, 0, "⋮", {
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
      this.notifyMobileDrawerVisibility();

      this.renderOpenMenusNow();
    });
  }
  private renderOpenMenusNow(): void {
    if (!this.lastLayout) return;

    this.layoutHamburgerDrawer(this.lastLayout);
    this.layoutHudDropdown(this.lastLayout);
    this.layoutMobileActionButton(this.lastLayout);
    this.layoutMobileActionDrawer(this.lastLayout);
    this.notifyMobileDrawerVisibility();
  }

  /** Keeps native HTML overlays and the Phaser header toggle below open drawers. */
  private notifyMobileDrawerVisibility(): void {
    this.callbacks.onMobileDrawerVisibilityChanged?.(
      this.hamburgerMenuOpen || this.mobileActionMenuOpen,
    );
  }

  /** Closes either mobile drawer from its native HTML close control. */
  closeMobileDrawers(): void {
    this.hamburgerMenuOpen = false;
    this.mobileActionMenuOpen = false;
    this.mobileActionSubmenu = undefined;
    this.renderOpenMenusNow();
  }

  handleHtmlDrawerItem(label: string): void {
    const actions: Record<string, HamburgerMenuActionKey> = {
      "Gameplay Settings": "gameplay-settings", "Your level/play history": "play-history",
      "Account/billing": "account-billing", "Restart Game": "restart-game",
      "Quit/exit": "quit-exit", "Log out": "log-out",
    };
    const action = actions[label];
    if (action) {
      this.closeMobileDrawers();
      this.callbacks.onHamburgerMenuAction?.(action);
      return;
    }
    if (label === "Sort") {
      this.mobileActionSubmenu = "sort";
      this.renderOpenMenusNow();
      return;
    }
    const immediateAction: Record<string, HudActionKey> = {
      "Hint": "hint",
      "Get A Hint": "hint",
      "Dead Hand": "dead-hand",
      "Call DEAD Hand": "dead-hand",
      "Help": "help",
    };
    const hudAction = immediateAction[label];
    if (hudAction) {
      this.callbacks.onHudAction?.(hudAction);
      this.closeMobileDrawers();
      return;
    }
    const sortMode = label === "Sort By Rank" ? "rank" : label === "Sort By Suit" ? "suit" : undefined;
    if (sortMode) {
      this.activeHudDropdown = undefined;
      if (this.lastLayout) this.layoutHudDropdown(this.lastLayout);
      this.callbacks.onSortRequested?.(sortMode);
      this.closeMobileDrawers();
      return;
    }
    const settingsAction = this.settingsMenuActionForLabel(label);
    this.activeHudDropdown = undefined;
    if (this.lastLayout) this.layoutHudDropdown(this.lastLayout);
    if (settingsAction) this.callbacks.onHamburgerMenuAction?.(settingsAction);
  }

  /**
   * DOM labels are normally sharper on phones. During a Phaser drawer, use
   * their existing Phaser copies so the drawer can cover only the portions it
   * overlaps instead of hiding every label across the entire table.
   */
  setNativeTextFallbackVisible(visible: boolean): void {
    if (!this.lastLayout?.metrics.isMobile) return;

    this.hudWallIcon?.setDepth(visible ? 25 : 19).setVisible(visible);
    this.wallCountText?.setVisible(visible);
    this.hudPointsIcon?.setVisible(visible);
    this.pointsText?.setVisible(visible);
    if (visible) {
      // Mobile normally uses HTML Material icons, so redraw these Phaser
      // graphics only for the brief behind-drawer fallback.
      this.drawHudWallIcon(this.lastLayout);
      this.drawHudPointsIcon(this.lastLayout);
    }
    this.playerLabels.forEach((label) => label.setVisible(visible));
    this.usernameText?.setVisible(visible);
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

        // Sort has its own two-option submenu instead of sorting immediately.
        if (action === "sort" && !isSubmenuItem) {
          this.mobileActionSubmenu = "sort";
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

        if (action === "sort" && isSubmenuItem && rowLabel === "‹ Back") {
          this.mobileActionSubmenu = undefined;
          this.renderOpenMenusNow();
          return;
        }

        const sortMode = rowLabel === "Sort By Rank" ? "rank" : rowLabel === "Sort By Suit" ? "suit" : undefined;
        if (sortMode) {
          this.callbacks.onSortRequested?.(sortMode);
          this.mobileActionMenuOpen = false;
          this.mobileActionSubmenu = undefined;
          this.renderOpenMenusNow();
          return;
        }

        // Settings owns visual/game options, but Restart and Quit are real
        // navigation actions. Send them through the hamburger callback so
        // TableScene can ask Angular to reset or leave the board.
        const settingsMenuAction = this.settingsMenuActionForLabel(rowLabel);
        if (settingsMenuAction) {
          this.callbacks.onHamburgerMenuAction?.(settingsMenuAction);
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

    if (this.mobileActionSubmenu === "sort") {
      const sortTextures = this.hudActionTextures.sort;
      const sortAction = this.hudActions.find((action) => action.key === "sort");
      return [
        {
          label: "‹ Back",
          action: "sort",
          normalTexture: sortTextures.normal,
          activeTexture: sortTextures.active,
          isSubmenuItem: true,
        },
        ...(sortAction?.items ?? []).map((label) => ({
          label,
          action: "sort" as const,
          normalTexture: sortTextures.normal,
          activeTexture: sortTextures.active,
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
        label: action.label,
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
      if (!this.mobileActionMenuOpen) {
        this.callbacks.onMobileDrawerOverlay?.({ visible: false, x: 0, y: 0, width: 0, height: 0, title: "", items: [] });
      }
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
      // Native HTML owns the visual drawer. This transparent container keeps
      // the existing Phaser menu-item interactions without duplicate UI.
      .setAlpha(0.001)
      .setVisible(true);
    this.callbacks.onMobileDrawerOverlay?.({
      visible: true,
      x: Math.round(hud.x + 12),
      y: Math.round(hud.y + hud.height + 4),
      width,
      height,
      title: "",
      items: this.hamburgerMenuItems.map((item) => item.text),
    });
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
      if (!this.hamburgerMenuOpen) this.callbacks.onMobileDrawerOverlay?.({ visible: false, x: 0, y: 0, width: 0, height: 0, title: "", items: [] });
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
    // Settings labels are longer, but reducing them below 15px makes Poppins
    // look soft on high-density phones. The wider Settings drawer has room
    // for this readable row size.
    const drawerRowFont = isSettingsSubmenu
      ? Math.round(Phaser.Math.Clamp(hud.height * 0.31, 16, 21))
      : itemFont;

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
      visibleRowCount * drawerRowFont +
      Math.max(0, visibleRowCount - 1) * rowGap +
      bottomPadding;
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

      const rowY = rowStartY + index * (drawerRowFont + rowGap);

      const iconSize = Math.round(
        Phaser.Math.Clamp(drawerRowFont * 1.18, 18, 26),
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
          rowY + drawerRowFont / 2,
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
      /** Settings rows use the larger readable size calculated above. */
      label
        .setVisible(true)
        .setActive(true)
        .setText(item.label)
        .setFontSize(drawerRowFont)
        .setFontStyle("600")
        .setColor("#cb63b2")
        .setPosition(
          Math.round(24 + iconSize + 12),
          Math.round(rowY),
        );
    });

    this.mobileActionMenuContainer
      .setPosition(
        Math.round(hud.x + hud.width - width - 12),
        Math.round(hud.y + hud.height + 4),
      )
      .setDepth(260)
      .setVisible(true);
    this.callbacks.onMobileDrawerOverlay?.({
      visible: true,
      x: Math.round(hud.x + hud.width - width - 12),
      y: Math.round(hud.y + hud.height + 4),
      width,
      height,
      title: isSettingsSubmenu ? "SETTINGS" : "",
      items: drawerItems.map((item) => item.label),
    });
  }
  private layoutPsdHud(layout: TableLayout, wallTileCount: number): void {
    const hud = layout.hud;
    const compact = this.isCompactHud(layout);

    if (this.mobileHeaderBackground) {
      this.mobileHeaderBackground.clear();
      this.mobileHeaderBackground.setVisible(layout.metrics.isMobile);
      // Phaser Graphics requires the numeric companion of COLOR_BLUE.
      this.mobileHeaderBackground.fillStyle(COLOR_BLUE_NUM, 1);
      this.mobileHeaderBackground.fillRect(hud.x, hud.y, hud.width, hud.height);
    }

    const iconY = Math.round(hud.y + hud.height / 2);
    const mobileHeaderControlY = layout.metrics.isMobile
      // Mirrors the CSS logo centres: 34px portrait logo at top + 4px and
      // 28px landscape logo at top + 4px.
      ? Math.round(hud.y + (layout.metrics.isPortrait ? 21 : 18))
      : iconY;
    const mobileTouchTarget = 44;
    // Keep the full 44px touch target away from the physical screen edge.
    const mobileHeaderEdgePadding = 6;

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
        layout.metrics.isMobile
          ? Math.round(Phaser.Math.Clamp(hud.height * 0.62, 28, 32))
          : compact
            ? Math.round(Phaser.Math.Clamp(hud.height * 0.30, 18, 24))
            : Math.round(Phaser.Math.Clamp(hud.height * 0.38, 26, 34)),
      )
      .setFontStyle("600")
      .setColor(this.gtColorFushia)
      .setPosition(
        Math.round(
          hud.x + (layout.metrics.isMobile
            ? mobileHeaderEdgePadding + mobileTouchTarget / 2
            : Math.max(14, hud.height * 0.30)),
        ),
        mobileHeaderControlY,
      );

    if (layout.metrics.isMobile && this.hamburgerIcon) {
      const hitWidth = Math.max(mobileTouchTarget, this.hamburgerIcon.width);
      const hitHeight = Math.max(mobileTouchTarget, this.hamburgerIcon.height);
      this.hamburgerIcon.setInteractive(
        new Phaser.Geom.Rectangle(
          -(hitWidth - this.hamburgerIcon.width) / 2,
          -(hitHeight - this.hamburgerIcon.height) / 2,
          hitWidth,
          hitHeight,
        ),
        Phaser.Geom.Rectangle.Contains,
      );
    }

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
    // Slightly smaller bump on mobile landscape so it doesn't touch the panels
    const wallMetricFont = layout.metrics.isMobile && !layout.metrics.isPortrait
      ? Math.round(metricFont * 1.1)
      : Math.round(metricFont * 1.25);

    this.wallCountText
      ?.setVisible(true)
      .setText(`${wallTileCount} LEFT`)
      .setFontSize(wallMetricFont)
      .setFontStyle("500")
      .setColor(COLOR_BLUE);

    const wallGroupLeft = layout.topExposure.x + layout.topExposure.width;
    // Landscape layouts have a right rail beside the top tray, including
    // large iPad Pro viewports classified as desktop. Reserve that lane.
    const wallGroupRight = !layout.metrics.isPortrait
      ? layout.rightExposure.x
      : layout.tableOuter.x + layout.tableOuter.width;
    const wallGroupWidth =
      wallIconSize.width + metricGap + (this.wallCountText?.width ?? 0);
    const isMobilePortrait = layout.metrics.isMobile && layout.metrics.isPortrait;
    const placeBelowTopExposure = isMobilePortrait || layout.metrics.isTablet;
    const wallGroupCenter = (wallGroupLeft + wallGroupRight) / 2;
    const wallIconX = placeBelowTopExposure
      // The widened mobile top tray has no reliable right-side lane. Place
      // the counter just below its right edge instead of covering the tray.
      ? layout.topExposure.x + layout.topExposure.width - wallGroupWidth + wallIconSize.width / 2
      : wallGroupCenter - wallGroupWidth / 2 + wallIconSize.width / 2;
    const wallY = placeBelowTopExposure
      ? layout.topExposure.y + layout.topExposure.height + wallIconSize.height / 2 + 8
      : layout.topExposure.y + layout.topExposure.height / 2;

    // Native overlays keep the counter and its icon sharp at every viewport.
    const useHtmlWallCount = true;
    this.hudWallIcon
      ?.setVisible(!useHtmlWallCount)
      .setPosition(Math.round(wallIconX), Math.round(wallY));

    if (!useHtmlWallCount) this.drawHudWallIcon(layout);

    const wallCountX = Math.round(wallIconX + wallIconSize.width / 2 + metricGap);
    const wallCountY = Math.round(wallY);
    this.wallCountText
      ?.setPosition(wallCountX, wallCountY)
      .setVisible(!useHtmlWallCount);
    this.publishWallCountOverlay({
      text: `${wallTileCount} LEFT`,
      x: wallCountX,
      y: wallCountY,
      fontSize: wallMetricFont,
      visible: useHtmlWallCount,
      iconX: Math.round(wallIconX),
      iconY: Math.round(wallY),
      iconSize: wallIconSize.height,
    });

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

    // Native overlays keep the points label and Material icon sharp at every viewport.
    const useHtmlPoints = true;
    this.hudPointsIcon
      ?.setVisible(!useHtmlPoints)
      .setPosition(Math.round(pointsGroupX), iconY);

    if (!useHtmlPoints) this.drawHudPointsIcon(layout);

    const pointsText = compact ? "1,000 PTS" : "1,000 POINTS";
    const pointsTextX = Math.round(pointsGroupX + pointsIconSize.width / 2 + metricGap);
    this.pointsText
      ?.setVisible(!useHtmlPoints)
      .setText(pointsText)
      .setFontSize(metricFont)
      .setFontStyle("500")
      .setColor("#f8fafc")
      .setPosition(pointsTextX, iconY);
    this.publishPointsOverlay({
      text: pointsText,
      x: pointsTextX,
      y: Math.round(iconY),
      fontSize: metricFont,
      visible: useHtmlPoints,
      iconX: Math.round(pointsGroupX),
      iconY: Math.round(iconY),
      iconSize: pointsIconSize.height,
    });

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
    const mobileTouchTarget = 44;
    const mobileHeaderEdgePadding = 6;
    const mobileHeaderControlY = Math.round(
      hud.y + (layout.metrics.isPortrait ? 21 : 18),
    );

    if (!compact) {
      this.mobileActionButton.setVisible(false);
      this.mobileActionMenuOpen = false;
      this.mobileActionMenuContainer?.setVisible(false);
      return;
    }

    this.mobileActionButton
      .setVisible(true)
      .setDepth(250)
      .setFontSize(
        layout.metrics.isMobile
          ? Math.round(Phaser.Math.Clamp(hud.height * 0.68, 28, 34))
          : Math.round(Phaser.Math.Clamp(hud.height * 0.34, 20, 28)),
      )
      .setFontStyle("700")
      .setColor(this.gtColorFushia)
      .setPosition(
        Math.round(
          hud.x + hud.width - (layout.metrics.isMobile
            ? mobileHeaderEdgePadding + mobileTouchTarget / 2
            : Math.max(18, hud.height * 0.34)),
        ),
        layout.metrics.isMobile ? mobileHeaderControlY : Math.round(hud.y + hud.height / 2),
      );

    if (layout.metrics.isMobile) {
      const hitWidth = Math.max(mobileTouchTarget, this.mobileActionButton.width);
      const hitHeight = Math.max(mobileTouchTarget, this.mobileActionButton.height);
      this.mobileActionButton.setInteractive(
        new Phaser.Geom.Rectangle(
          -(hitWidth - this.mobileActionButton.width) / 2,
          -(hitHeight - this.mobileActionButton.height) / 2,
          hitWidth,
          hitHeight,
        ),
        Phaser.Geom.Rectangle.Contains,
      );
    }
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
      this.pointsText,
      ...this.pickSeatButtons,
    ]) {
      text?.setResolution(renderDpr);
    }

    // Crisp-text test: the small wall counter is rendered at the device DPR
    // (up to 3x) rather than the scene-wide 2x cap. It stays at 1x scale and
    // an integer position, so iOS does not resample a low-resolution texture.
    const wallCountResolution = this.lastLayout?.metrics.isMobile
      ? Math.min(3, Math.max(renderDpr, Math.ceil(window.devicePixelRatio || 1)))
      : renderDpr;
    this.wallCountText
      ?.setResolution(wallCountResolution)
      .setScale(1)
      .setAngle(0);
    this.wallCountText?.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }


  updateInstruction(
    phase: TablePhase,
    pickTargetSeat: TableSeat,
    passDirection: PassDirection,
  ): void {
    this.instructionPhase = phase;

    if (phase === "playing" || phase === "discard") {
      const seatLabel =
        pickTargetSeat === "bottom" ? "YOUR RACK" :
          pickTargetSeat === "top" ? "TOP SEAT" :
            pickTargetSeat === "left" ? "LEFT SEAT" : "RIGHT SEAT";

      this.instructionMessage =
        phase === "playing"
          ? `YOUR TURN\nPick a tile to ${seatLabel}`
          : `DISCARD\nDiscard from ${seatLabel}`;

      this.publishInstructionPanel();
      return;
    }

    this.instructionMessage =
      passDirection === "right" ? "YOUR TURN\nSelect 3 tiles to pass\nto the right." :
        passDirection === "left" ? "YOUR TURN\nSelect 3 tiles to pass\nto the left." :
          "YOUR TURN\nSelect 3 tiles to pass\nacross.";

    this.publishInstructionPanel();
  }

  /**
   * Rebuilds the native instruction card from the last resolved layout.
   *
   * Every number here mirrors the geometry the Phaser Graphics card used, so
   * the HTML panel lands on exactly the same pixels as the old drawn card.
   */
  private publishInstructionPanel(): void {
    const layout = this.lastLayout;
    if (!layout) return;

    const card = layout.instructionBar;
    const button = layout.passButton;
    const compact = this.isCompactHud(layout);
    const compactLandscape = layout.metrics.isMobile && !layout.metrics.isPortrait;
    const isPassing = this.instructionPhase === "passing";

    const radius = Math.round(Phaser.Math.Clamp(card.height * 0.22, 16, 34));
    // The reference card carries a heavier olive rim than the old Phaser
    // stroke, held to a sane range so phone-sized cards keep their inner room.
    const borderWidth = Math.round(Phaser.Math.Clamp(card.height * 0.026, 3, 7));

    const bodyFontSize = compactLandscape
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.135, 8, 10))
      : compact
        ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 10, 14))
        : isPassing
          ? Math.round(Phaser.Math.Clamp(card.height * 0.118, 18, 25))
          : Math.round(Phaser.Math.Clamp(card.height * 0.135, 19, 28));

    const buttonRadius = Math.round(Phaser.Math.Clamp(button.height * 0.22, 8, 14));

    const buttonFontSize = compactLandscape
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.19, 11, 14))
      : compact
        ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.20, 11, 15))
        : Math.round(Phaser.Math.Clamp(layout.metrics.passFont * 1.15, 18, 31));

    // The first line is the emphasised heading; the rest is supporting copy.
    const [title, ...bodyLines] = this.instructionMessage.split("\n");
    const body = bodyLines.join("\n");

    const buttonTop = Math.round(button.y - card.y);

    // Short phone cards are barely taller than their button, so they trade
    // breathing room for legible copy; roomier cards keep the fuller insets.
    const tight = card.height < 100;
    const contentTop = Math.round(card.height * (tight ? 0.045 : 0.08));
    const contentBottom = Math.max(
      contentTop,
      buttonTop - Math.round(card.height * (tight ? 0.025 : 0.045)),
    );

    /**
     * Shrink the copy to the band above the button when it would not fit.
     *
     * The multipliers below mirror the CSS line-heights, so the measurement
     * here matches what the browser lays out. Compact phone cards are barely
     * taller than their button, and this keeps the copy inside the card
     * instead of letting it run over the button.
     */
    let titleFontSize = Math.round(bodyFontSize * 1.12);
    let bodyFitted = bodyFontSize;
    let titleGap = body ? Math.max(2, Math.round(bodyFontSize * 0.34)) : 0;

    const band = contentBottom - contentTop;
    const required =
      titleFontSize * 1.2 + titleGap + bodyLines.length * bodyFitted * 1.32;

    if (band > 0 && required > band) {
      // 8px matches the smallest size the compact-landscape clamp already
      // allows, so the copy never shrinks below what the design considers
      // legible; at that floor the heading is distinguished by weight alone.
      const scale = band / required;
      titleFontSize = Math.max(8, Math.floor(titleFontSize * scale));
      bodyFitted = Math.max(8, Math.floor(bodyFitted * scale));
      titleGap = body ? Math.max(1, Math.floor(titleGap * scale)) : 0;
    }

    this.callbacks.onInstructionPanelOverlay?.({
      visible: true,
      x: Math.round(card.x),
      y: Math.round(card.y),
      width: Math.round(card.width),
      height: Math.round(card.height),
      radius,
      borderWidth,
      shadowY: Math.max(6, Math.round(card.height * 0.045)),
      shadowBlur: Math.max(12, Math.round(card.height * 0.10)),
      title: title ?? "",
      titleFontSize,
      body,
      bodyFontSize: bodyFitted,
      // Copy is centred between the top inset and the gap above the button, so
      // it can never collide with the button as the card shrinks.
      contentTop,
      contentBottom,
      titleGap,
      button: {
        label: this.passButtonLabel,
        enabled: this.passButtonEnabled,
        x: Math.round(button.x - card.x),
        y: buttonTop,
        width: Math.round(button.width),
        height: Math.round(button.height),
        radius: buttonRadius,
        fontSize: buttonFontSize,
        shadowY: Math.max(3, Math.round(button.height * 0.10)),
        shadowBlur: Math.max(6, Math.round(button.height * 0.22)),
      },
    });
  }

  /** Routes a tap on the native primary button back through the normal callback. */
  handleHtmlPrimaryAction(): void {
    this.callbacks.onPrimaryAction?.();
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
    // Use native text at every viewport so labels remain sharp on phones,
    // tablets, and desktop displays alike.
    const useHtmlPlayerLabels = true;
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
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.30, 12, 15))
      : isMobilePortrait
        ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.22, 11, 14))
        : compact
          ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 9, 12))
          : Math.round(metrics.playerLabelFont);


    const usernameFont = isMobileLandscape
      ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.30, 12, 15))
      : isMobilePortrait
        ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.22, 11, 14))
        : compact
          ? Math.round(Phaser.Math.Clamp(layout.hud.height * 0.18, 9, 12))
          : Math.round(metrics.usernameFont);


    // Compute each label color once so active-seat styling stays consistent.
    const topColor = activeSeat === "top" ? activeLabelColor : inactiveLabelColor;
    const rightColor = activeSeat === "right" ? activeLabelColor : inactiveLabelColor;
    const leftColor = activeSeat === "left" ? activeLabelColor : inactiveLabelColor;
    const bottomColor = activeSeat === "bottom" ? activeLabelColor : inactiveLabelColor;


    // 2. Clear any prior scale alterations. We must render at a 1:1 scale multiplier.
    this.playerLabels[0]
      ?.setOrigin(0.5)
      // CRITICAL: Round position to perfect boundaries so text never straddles two pixels
      .setPosition(Math.round(layout.topLabel.x), Math.round(layout.topLabel.y))

      // 3. Render at the target size. DO NOT USE .setScale()
      .setFontFamily('"Poppins", sans-serif')
      .setFontSize(`${playerFont}px`)
      .setScale(1)

      // 4. Boost the weight. Poppins needs a thick weight at 11px-15px to avoid looking faded
      .setFontStyle("700")
      .setColor(topColor)

      // 5. Add clean padding & wipe strokes (Strokes ruin small vector fonts)
      .setPadding(4)
      .setStroke(topColor, 0)
      .setAlpha(1)
      .setVisible(!useHtmlPlayerLabels)
      .setDepth(40)
      .setAngle(0)

      // 6. Force the internal high-DPI canvas texture resolution
      .setResolution(labelResolution);

    // 7. Override the main camera rounding exclusively for this scene's text placement
    //this.cameras.main.setRoundPixels(false);

    // 8. Re-verify rendering interpolation filter
    this.playerLabels[0]?.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);



    /* this.playerLabels[0]
      ?.setOrigin(0.5)
      .setPosition(Math.round(layout.topLabel.x), Math.round(layout.topLabel.y))
      .setFontSize(playerFont)
      .setFontStyle(metrics.isMobile ? "400" : compact ? "600" : "700")
      .setColor(topColor)
      // FIX 3: Add explicit 2px padding to stop custom TTF bounds clipping on mobile canvas
      .setPadding(2)
      // A fractional stroke makes small canvas text look soft on phones.
      .setStroke(topColor, 0)
      .setAlpha(1)
      .setVisible(!useHtmlPlayerLabels)
      .setDepth(40)
      .setAngle(0)
      .setResolution(labelResolution); */

    this.playerLabels[1]
      ?.setOrigin(0.5)
      .setPosition(Math.round(layout.rightLabel.x), Math.round(layout.rightLabel.y))
      .setFontSize(playerFont)
      .setFontStyle(metrics.isMobile ? "700" : compact ? "600" : "700")
      .setColor(rightColor)
      .setPadding(2)
      .setStroke(rightColor, 0)
      .setAlpha(1)
      .setVisible(!useHtmlPlayerLabels)
      .setDepth(40)
      .setAngle(90)
      .setResolution(labelResolution);

    this.playerLabels[1]?.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.playerLabels[2]
      ?.setOrigin(0.5)
      .setPosition(Math.round(layout.leftLabel.x), Math.round(layout.leftLabel.y))
      .setFontSize(playerFont)
      .setFontStyle(metrics.isMobile ? "700" : compact ? "600" : "700")
      .setColor(leftColor)
      .setPadding(2)
      .setStroke(leftColor, 0)
      .setAlpha(1)
      .setVisible(!useHtmlPlayerLabels)
      .setDepth(40)
      .setAngle(-90)
      .setResolution(labelResolution);

    this.playerLabels[2]?.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.usernameText
      ?.setOrigin(0.5)
      .setPosition(Math.round(layout.username.x), Math.round(layout.username.y))
      .setFontSize(usernameFont)
      .setFontStyle(metrics.isMobile ? "700" : compact ? "600" : "700")
      .setColor(bottomColor)
      .setPadding(2)
      .setStroke(bottomColor, 0)
      .setAlpha(1)
      // The native overlay below renders this label on phones. Keeping this
      // Phaser text hidden prevents two copies from blending into a blur.
      .setVisible(!useHtmlPlayerLabels)
      .setDepth(40)
      .setResolution(labelResolution);


    this.usernameText?.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.callbacks.onPlayerLabelOverlay?.([
      { key: "top", text: this.playerLabels[0]?.text ?? "PLAYER 1", x: Math.round(layout.topLabel.x), y: Math.round(layout.topLabel.y), fontSize: playerFont, color: topColor, angle: 0, visible: useHtmlPlayerLabels },
      { key: "right", text: this.playerLabels[1]?.text ?? "PLAYER 2", x: Math.round(layout.rightLabel.x), y: Math.round(layout.rightLabel.y), fontSize: playerFont, color: rightColor, angle: 90, visible: useHtmlPlayerLabels },
      { key: "left", text: this.playerLabels[2]?.text ?? "PLAYER 3", x: Math.round(layout.leftLabel.x), y: Math.round(layout.leftLabel.y), fontSize: playerFont, color: leftColor, angle: -90, visible: useHtmlPlayerLabels },
      { key: "bottom", text: this.usernameText?.text ?? "USERNAME", x: Math.round(layout.username.x), y: Math.round(layout.username.y), fontSize: usernameFont, color: bottomColor, angle: 0, visible: useHtmlPlayerLabels },
    ]);
  }

  updateWallTiles(wallTileCount: number): void {
    const text = `${wallTileCount} LEFT`;
    this.wallCountText?.setText(text);
    if (this.wallCountOverlayState) {
      this.publishWallCountOverlay({ ...this.wallCountOverlayState, text });
    }
  }

  /** Sends the one small native-text overlay only when its state changes. */
  private publishWallCountOverlay(state: WallCountOverlayState): void {
    this.wallCountOverlayState = state;
    this.callbacks.onWallCountOverlay?.(state);
  }

  /** Keeps the mobile points text crisp while Phaser continues to own the icon. */
  private publishPointsOverlay(state: PointsOverlayState): void {
    this.pointsOverlayState = state;
    this.callbacks.onPointsOverlay?.(state);
  }


  private hudWallIconSize(layout: TableLayout): {
    readonly width: number;
    readonly height: number;
  } {
    const hudHeight = layout.hud.height;

    const height = Math.round(
      Phaser.Math.Clamp(hudHeight * 0.38, 22, 32),
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
      COLOR_BLUE_NUM,
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
         * Hint, Dead Hand, and Help are immediate actions. Sort is the only
         * non-settings HUD control that opens a mode-selection dropdown.
         */
        const isImmediateAction = action.key === "hint"
          || action.key === "dead-hand"
          || action.key === "help";
        this.activeHudDropdown = isImmediateAction
          ? undefined
          : this.activeHudDropdown === action.key ? undefined : action.key;

        if (action.key !== "sort") {
          this.callbacks.onHudAction?.(action.key);
        }

        this.updateHudActionButtonTextures();

        // A dropdown has to be created and positioned against the current
        // table layout.  Merely changing visibility leaves the background
        // with no menu items, which made the Settings icon appear to do
        // nothing on tablet and desktop.
        if (this.lastLayout) {
          this.layoutHudDropdown(this.lastLayout);
        } else {
          this.layoutHudDropdownFromCurrentVisibility();
        }
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
      .setColor(COLOR_BLUE)
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
      // Do not clear the shared native drawer while hamburger/action UI owns it.
      if (!this.hamburgerMenuOpen && !this.mobileActionMenuOpen) {
        this.callbacks.onMobileDrawerOverlay?.({ visible: false, x: 0, y: 0, width: 0, height: 0, title: "", items: [] });
      }
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
    // Sort always exposes both modes. Keep this explicit so it cannot fall
    // back to the earlier single-item "toggle next sort" behaviour.
    const dropdownItems = action.key === "sort"
      ? ["Sort By Rank", "Sort By Suit"]
      : action.items;
    const height = paddingY * 2 + dropdownItems.length * itemHeight;

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
    // HTML owns the visible dropdown on every device. Phaser keeps this
    // transparent object only as the existing interaction target.
    this.hudDropdownBg.setAlpha(0.001);
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
    // Render the visible dropdown in native HTML on every device. Phaser
    // keeps this invisible copy solely for existing click handling.
    this.callbacks.onMobileDrawerOverlay?.({
      visible: true,
      x,
      y: y + pointerHeight,
      width,
      height,
      title: action.label.toUpperCase(),
      items: dropdownItems,
    });

    for (let index = 0; index < dropdownItems.length; index += 1) {
      const label = dropdownItems[index];

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
        // Native HTML renders the label; retain this transparent text only
        // so the established Phaser tap handlers continue to work.
        .setAlpha(0.001)
        .setInteractive({ useHandCursor: true });

      text.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();
        const sortMode = label === "Sort By Rank" ? "rank" : label === "Sort By Suit" ? "suit" : undefined;
        const settingsMenuAction = this.settingsMenuActionForLabel(label);
        this.activeHudDropdown = undefined;
        this.layoutHudDropdown(layout);
        if (sortMode) {
          this.callbacks.onSortRequested?.(sortMode);
          return;
        }
        if (settingsMenuAction) {
          this.callbacks.onHamburgerMenuAction?.(settingsMenuAction);
        }
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

  /** Maps Settings labels that change the game page to their real menu action. */
  private settingsMenuActionForLabel(label: string): HamburgerMenuActionKey | undefined {
    if (label === "Restart Game") return "restart-game";
    if (label === "Quit Game" || label === "Quit/exit") return "quit-exit";
    return undefined;
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

  /**
   * Resolves the primary button's label and enabled state.
   *
   * The button itself is native HTML, so this only updates the model and
   * republishes the instruction panel.
   */
  updatePassButtonState(options: PassButtonStateOptions): void {
    const {
      tablePhase,
      passWaitingCount,
      canSubmitPass,
      isPassAnimating,
      isPickAnimating,
      wallTileCount,
      canPickFromWall,
    } = options;

    const enabled =
      tablePhase === "discard"
        ? true
        : tablePhase === "playing"
          ? canPickFromWall !== false && wallTileCount > 0 && !isPickAnimating
          : canSubmitPass && !isPassAnimating;

    this.passButtonEnabled = enabled;
    this.passButtonLabel =
      tablePhase === "discard"
        ? "DISCARD"
        : tablePhase === "playing"
          ? "PICK"
          : enabled ? "PASS" : `${passWaitingCount}/3`;

    this.instructionPhase = tablePhase;
    this.publishInstructionPanel();
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

    const visible = phase === "playing" || phase === "discard";

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
    this.pointsText?.setVisible(!this.lastLayout?.metrics.isMobile);
    if (this.pointsOverlayState) {
      this.publishPointsOverlay({
        ...this.pointsOverlayState,
        visible: this.lastLayout?.metrics.isMobile ?? false,
      });
    }
    this.hudActionsContainer?.setVisible(true);
  }

  hideHUD(): void {
    this.hamburgerIcon?.setVisible(false);
    this.logoText?.setVisible(false);
    this.hudWallIcon?.setVisible(false);
    this.wallCountText?.setVisible(false);
    this.hudPointsIcon?.setVisible(false);
    this.pointsText?.setVisible(false);
    if (this.pointsOverlayState) {
      this.publishPointsOverlay({ ...this.pointsOverlayState, visible: false });
    }
    this.hudActionsContainer?.setVisible(false);

    this.hudDropdownBg?.setVisible(false);
    this.hudDropdownItems.forEach((item) => item.setVisible(false));
    this.hudMenuItems.forEach((item) => item.setVisible(false));
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
