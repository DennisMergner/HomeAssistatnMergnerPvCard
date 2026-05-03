type EntityState = {
  state: string;
  attributes?: Record<string, unknown>;
};

declare const __MERGNER_PV_CARD_VERSION__: string;
const CARD_VERSION = __MERGNER_PV_CARD_VERSION__;

type HomeAssistant = {
  states: Record<string, EntityState>;
};

type LegacyConfig = {
  entities?: {
    solar?: string;
    battery?: string;
    house?: string;
    grid?: string;
  };
  images?: {
    solar?: string;
    battery?: string;
    house?: string;
    grid?: string;
  };
};

type NodeRole = "pv" | "battery" | "house" | "grid" | "inverter" | "custom";

type FlowNode = {
  id: string;
  name: string;
  role?: NodeRole;
  entity?: string;
  entityLabel?: string;
  image?: string;
  size?: number;
  x: number;
  y: number;
  unit?: string;
  secondaryEntity?: string;
  secondaryLabel?: string;
  secondaryUnit?: string;
  tertiaryEntity?: string;
  tertiaryLabel?: string;
  tertiaryUnit?: string;
  batteryRingThickness?: number;
  labelGap?: number;
  statsGap?: number;
  headerFontScale?: number;
  showLabelBackground?: boolean;
  centerValue?: boolean;
  centerValueOffsetX?: number;
  centerValueOffsetY?: number;
  centerValueScale?: number;
};

type FlowLink = {
  from: string;
  to: string;
  entity?: string;
  forwardEntity?: string;
  reverseEntity?: string;
  forwardColor?: string;
  reverseColor?: string;
  invert?: boolean;
  label?: string;
  forwardLabel?: string;
  reverseLabel?: string;
  labelPosition?: "top" | "bottom";
  valueEntity?: string;
  valuePosition?: "top" | "bottom";
  valueUnit?: string;
};

type FlowStyleConfig = {
  forwardColor?: string;
  reverseColor?: string;
  idleColor?: string;
  textColor?: string;
  baseThickness?: number;
  textSize?: number;
  textOutline?: number;
  linePattern?: "dashed" | "orb";
  speedCurve?: "linear" | "log";
  speedMultiplier?: number;
  maxAnimatedWatts?: number;
  dynamicOrbCount?: boolean;
  orbCountMultiplier?: number;
};

type CardConfig = LegacyConfig & {
  type: string;
  title?: string;
  nodes?: FlowNode[];
  links?: FlowLink[];
  flowStyle?: FlowStyleConfig;
};

type NodeMetric = {
  label: string;
  value: string;
  numericValue: number;
  unit: string;
};

type RenderFlowNode = FlowNode & {
  renderSize: number;
};

type ResolvedFlowStyle = {
  forwardColor: string;
  reverseColor: string;
  idleColor: string;
  textColor: string;
  baseThickness: number;
  textSize: number;
  textOutline: number;
  linePattern: "dashed" | "orb";
  speedCurve: "linear" | "log";
  speedMultiplier: number;
  maxAnimatedWatts: number;
  dynamicOrbCount: boolean;
  orbCountMultiplier: number;
};

type NormalizedCardConfig = {
  title: string;
  nodes: FlowNode[];
  links: FlowLink[];
  flowStyle: ResolvedFlowStyle;
};

type EntityFilterKind = "power" | "energy" | "percent" | "any";

const DEFAULT_NODES: FlowNode[] = [
  { id: "solar", name: "Solar", role: "pv", entityLabel: "Leistung", secondaryLabel: "Heute", size: 120, x: 20, y: 20 },
  {
    id: "battery",
    name: "Batterie",
    role: "battery",
    entityLabel: "Laden / Entladen",
    secondaryLabel: "SOC",
    secondaryUnit: "%",
    tertiaryLabel: "Heute",
    size: 120,
    x: 80,
    y: 20
  },
  { id: "house", name: "Haus", role: "house", entityLabel: "Verbrauch", secondaryLabel: "Heute", size: 120, x: 20, y: 80 },
  { id: "grid", name: "Netz", role: "grid", entityLabel: "Bezug / Einspeisung", secondaryLabel: "Heute", size: 120, x: 80, y: 80 }
];

const DEFAULT_LINKS: FlowLink[] = [
  { from: "solar", to: "house", entity: "sensor.pv_to_house_power" },
  { from: "solar", to: "battery", entity: "sensor.pv_to_battery_power" },
  { from: "battery", to: "house", entity: "sensor.battery_to_house_power" },
  { from: "grid", to: "house", entity: "sensor.grid_to_house_power" }
];

const DEFAULT_FLOW_STYLE: ResolvedFlowStyle = {
  forwardColor: "#74e0cb",
  reverseColor: "#ffb166",
  idleColor: "#7e8f92",
  textColor: "#d8fff6",
  baseThickness: 0.78,
  textSize: 1.7,
  textOutline: 0.28,
  linePattern: "dashed",
  speedCurve: "linear",
  speedMultiplier: 1,
  maxAnimatedWatts: 12000,
  dynamicOrbCount: false,
  orbCountMultiplier: 1
};

class MergnerPvCard extends HTMLElement {
  private _config?: CardConfig;
  private _hass?: HomeAssistant;

  static getConfigElement(): HTMLElement {
    return document.createElement("mergner-pv-card-editor");
  }

  static getStubConfig(): CardConfig {
    return {
      type: "custom:mergner-pv-card",
      title: "PV Flow",
      nodes: DEFAULT_NODES,
      links: DEFAULT_LINKS
    };
  }

  setConfig(config: CardConfig): void {
    if (!config || config.type !== "custom:mergner-pv-card") {
      throw new Error("Card type must be custom:mergner-pv-card");
    }
    this._config = config;
    this.render();
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this.render();
  }

  getCardSize(): number {
    const normalized = this.normalizeConfig(this._config ?? MergnerPvCard.getStubConfig());
    const fittedNodes = this.fitNodesToCard(normalized.nodes);
    const frame = this.getFlowFrameSettings(fittedNodes);
    const summaryCount = ["pv", "house", "battery", "grid", "inverter"]
      .map((role) => normalized.nodes.some((node) => this.getNodeRole(node) === role && Boolean(node.entity?.trim())))
      .filter(Boolean).length;
    const summaryRows = summaryCount === 0 ? 0 : Math.ceil(summaryCount / 4);
    const summaryHeight = summaryRows * 58 + (summaryRows > 0 ? 12 : 0);
    const estimatedPx = 74 + summaryHeight + frame.minHeight;
    return Math.max(3, Math.min(14, Math.ceil(estimatedPx / 50)));
  }

  connectedCallback(): void {
    this.render();
  }

  private safeText(input: string): string {
    return input
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  private clampPercent(value: number): number {
    if (Number.isNaN(value)) {
      return 50;
    }
    return Math.max(2, Math.min(98, value));
  }

  private clampMeterPercent(value: number): number {
    if (Number.isNaN(value)) {
      return 0;
    }
    return Math.max(0, Math.min(100, value));
  }

  private clampNodeSize(value: number): number {
    if (Number.isNaN(value)) {
      return 120;
    }
    return Math.max(40, Math.min(320, value));
  }

  private clampBatteryRingThickness(value: number): number {
    if (!Number.isFinite(value)) {
      return 7;
    }
    return Math.max(2, Math.min(24, value));
  }

  private clampNodeLabelGap(value: number): number {
    if (!Number.isFinite(value)) {
      return 6;
    }
    return Math.max(-16, Math.min(52, value));
  }

  private clampNodeStatsGap(value: number): number {
    if (!Number.isFinite(value)) {
      return 6;
    }
    return Math.max(-12, Math.min(56, value));
  }

  private clampNodeHeaderFontScale(value: number): number {
    if (!Number.isFinite(value)) {
      return 1;
    }
    return Math.max(0.4, Math.min(2.2, value));
  }

  private clampCenterValueOffset(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.max(-80, Math.min(80, value));
  }

  private clampCenterValueScale(value: number): number {
    if (!Number.isFinite(value)) {
      return 1;
    }
    return Math.max(0.5, Math.min(2, value));
  }

  private sanitizeHexColor(input: unknown, fallback: string): string {
    const value = typeof input === "string" ? input.trim() : "";
    if (/^#([0-9a-fA-F]{6})$/.test(value) || /^#([0-9a-fA-F]{3})$/.test(value)) {
      return value;
    }
    return fallback;
  }

  private normalizeFlowStyle(style?: FlowStyleConfig): ResolvedFlowStyle {
    const source = style ?? {};
    return {
      forwardColor: this.sanitizeHexColor(source.forwardColor, DEFAULT_FLOW_STYLE.forwardColor),
      reverseColor: this.sanitizeHexColor(source.reverseColor, DEFAULT_FLOW_STYLE.reverseColor),
      idleColor: this.sanitizeHexColor(source.idleColor, DEFAULT_FLOW_STYLE.idleColor),
      textColor: this.sanitizeHexColor(source.textColor, DEFAULT_FLOW_STYLE.textColor),
      baseThickness: Math.max(0.4, Math.min(1.6, Number(source.baseThickness ?? DEFAULT_FLOW_STYLE.baseThickness))),
      textSize: Math.max(1.1, Math.min(3.3, Number(source.textSize ?? DEFAULT_FLOW_STYLE.textSize))),
      textOutline: Math.max(0, Math.min(0.8, Number(source.textOutline ?? DEFAULT_FLOW_STYLE.textOutline))),
      linePattern: source.linePattern === "orb" ? "orb" : "dashed",
      speedCurve: source.speedCurve === "log" ? "log" : "linear",
      speedMultiplier: Math.max(0.3, Math.min(3, Number(source.speedMultiplier ?? DEFAULT_FLOW_STYLE.speedMultiplier))),
      maxAnimatedWatts: Math.max(1200, Math.min(30000, Number(source.maxAnimatedWatts ?? DEFAULT_FLOW_STYLE.maxAnimatedWatts))),
      dynamicOrbCount: source.dynamicOrbCount === true,
      orbCountMultiplier: Math.max(0.2, Math.min(6, Number(source.orbCountMultiplier ?? DEFAULT_FLOW_STYLE.orbCountMultiplier)))
    };
  }

  private getEntity(entityId?: string): EntityState | undefined {
    if (!entityId || !this._hass?.states?.[entityId]) {
      return undefined;
    }
    return this._hass.states[entityId];
  }

  private getState(entityId?: string): string {
    return this.getEntity(entityId)?.state ?? "n/a";
  }

  private isEmptyState(value: string): boolean {
    return !value || value === "n/a" || value === "unavailable" || value === "unknown";
  }

  private getUnit(entityId?: string): string {
    const attributes = this.getEntity(entityId)?.attributes;
    const unit = attributes?.unit_of_measurement;
    return typeof unit === "string" ? unit : "";
  }

  private parseNumber(entityId?: string): number {
    const raw = this.getState(entityId);
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : 0;
  }

  private getNodeRole(node: FlowNode): NodeRole {
    return node.role ?? "custom";
  }

  private roleLabel(role: NodeRole): string {
    switch (role) {
      case "pv":
        return "PV";
      case "battery":
        return "Batterie";
      case "house":
        return "Haus";
      case "grid":
        return "Netz";
      case "inverter":
        return "Wechselrichter";
      default:
        return "Knoten";
    }
  }

  private defaultMetricLabel(role: NodeRole, slot: "primary" | "secondary" | "tertiary"): string {
    if (slot === "primary") {
      switch (role) {
        case "pv":
          return "Leistung";
        case "battery":
          return "Laden / Entladen";
        case "house":
          return "Verbrauch";
        case "grid":
          return "Bezug / Einspeisung";
        case "inverter":
          return "Leistung";
        default:
          return "Wert";
      }
    }

    if (slot === "secondary") {
      switch (role) {
        case "battery":
          return "SOC";
        case "pv":
        case "house":
        case "grid":
        case "inverter":
          return "Heute";
        default:
          return "Detail";
      }
    }

    return role === "battery" ? "Heute" : "Extra";
  }

  private formatMetricValue(value: string, unit: string): string {
    const trimmedValue = value.trim();
    const trimmedUnit = unit.trim();
    return trimmedUnit ? `${trimmedValue} ${trimmedUnit}` : trimmedValue;
  }

  private getNodeMetrics(node: FlowNode): NodeMetric[] {
    const role = this.getNodeRole(node);
    const slots = [
      {
        entity: node.entity,
        label: node.entityLabel,
        unit: node.unit,
        defaultLabel: this.defaultMetricLabel(role, "primary"),
        showWhenEmpty: false
      },
      {
        entity: node.secondaryEntity,
        label: node.secondaryLabel,
        unit: node.secondaryUnit,
        defaultLabel: this.defaultMetricLabel(role, "secondary"),
        showWhenEmpty: false
      },
      {
        entity: node.tertiaryEntity,
        label: node.tertiaryLabel,
        unit: node.tertiaryUnit,
        defaultLabel: this.defaultMetricLabel(role, "tertiary"),
        showWhenEmpty: false
      }
    ];

    return slots
      .filter((slot) => slot.showWhenEmpty || Boolean(slot.entity?.trim()))
      .map((slot) => {
        const value = slot.entity ? this.getState(slot.entity) : "n/a";
        const resolvedUnit = slot.unit ?? (slot.entity ? this.getUnit(slot.entity) : "");
        return {
          label: slot.label?.trim() || slot.defaultLabel,
          value,
          numericValue: slot.entity ? this.parseNumber(slot.entity) : Number.NaN,
          unit: resolvedUnit
        } satisfies NodeMetric;
      });
  }

  private getBatteryLevel(metrics: NodeMetric[]): number | undefined {
    const levelMetric = metrics.find(
      (metric) => metric.unit === "%" || /soc|state of charge|akku|charge|level/i.test(metric.label)
    );

    if (!levelMetric || Number.isNaN(levelMetric.numericValue)) {
      return undefined;
    }

    return this.clampMeterPercent(levelMetric.numericValue);
  }

  private lerpColor(fromHex: string, toHex: string, t: number): string {
    const from = fromHex.replace("#", "");
    const to = toHex.replace("#", "");
    const clamped = Math.max(0, Math.min(1, t));

    const fromR = Number.parseInt(from.slice(0, 2), 16);
    const fromG = Number.parseInt(from.slice(2, 4), 16);
    const fromB = Number.parseInt(from.slice(4, 6), 16);

    const toR = Number.parseInt(to.slice(0, 2), 16);
    const toG = Number.parseInt(to.slice(2, 4), 16);
    const toB = Number.parseInt(to.slice(4, 6), 16);

    const r = Math.round(fromR + (toR - fromR) * clamped);
    const g = Math.round(fromG + (toG - fromG) * clamped);
    const b = Math.round(fromB + (toB - fromB) * clamped);

    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  }

  private getBatteryRingColor(level: number): string {
    const stops = [
      { at: 0, color: "#ff1f1f" },
      { at: 20, color: "#ff8a00" },
      { at: 50, color: "#ffd84d" },
      { at: 75, color: "#9eea4d" },
      { at: 100, color: "#2ea043" }
    ];

    const clampedLevel = Math.max(0, Math.min(100, level));
    for (let index = 0; index < stops.length - 1; index += 1) {
      const current = stops[index];
      const next = stops[index + 1];
      if (clampedLevel >= current.at && clampedLevel <= next.at) {
        const ratio = (clampedLevel - current.at) / (next.at - current.at || 1);
        return this.lerpColor(current.color, next.color, ratio);
      }
    }

    return stops[stops.length - 1].color;
  }

  private getSummaryUnit(nodes: FlowNode[]): string {
    for (const node of nodes) {
      const unit = node.unit?.trim() || this.getUnit(node.entity);
      if (unit) {
        return unit;
      }
    }
    return "";
  }

  private summaryIcon(role: NodeRole): string {
    switch (role) {
      case "grid":
        // Power pole / transmission tower
        return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 2L8 8H4l2 2-4 8h6l2 4h4l2-4h6l-4-8 2-2h-4L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <line x1="12" y1="8" x2="12" y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="6" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
      case "house":
        // House / consumption
        return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M3 10.5L12 3l9 7.5V21H15v-5h-6v5H3V10.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>`;
      case "pv":
        // Solar panel
        return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="2" y="7" width="20" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" stroke-width="1.2"/>
          <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.2"/>
          <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="19" y1="4" x2="17" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="5" y1="4" x2="7" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
      case "battery":
        // Battery
        return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="2" y="7" width="18" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M20 10.5v3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <rect x="4" y="9" width="8" height="6" rx="1" fill="currentColor" opacity="0.5"/>
        </svg>`;
      case "inverter":
        // Inverter / converter symbol
        return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M7 15l3-6 2 4 2-4 3 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      default:
        // Generic lightning bolt for custom
        return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>`;
    }
  }

  private renderSummary(nodes: FlowNode[]): string {
    const groups: Array<{ role: NodeRole; label: string; className: string }> = [
      { role: "grid", label: "Netz", className: "grid" },
      { role: "house", label: "Verbrauch", className: "house" },
      { role: "pv", label: "Erzeugung", className: "pv" },
      { role: "battery", label: "Batterie", className: "battery" },
      { role: "inverter", label: "Wechselrichter", className: "inverter" }
    ];

    const items = groups
      .map((group) => {
        const matchingNodes = nodes.filter((node) => this.getNodeRole(node) === group.role && node.entity?.trim());
        if (matchingNodes.length === 0) {
          return "";
        }

        const total = matchingNodes.reduce((sum, node) => sum + this.parseNumber(node.entity), 0);
        const unit = this.getSummaryUnit(matchingNodes);
        const value = this.formatMetricValue(total.toFixed(Math.abs(total) >= 100 ? 0 : 1), unit);

        return `
          <div class="summary-chip ${group.className}">
            <div class="summary-icon">${this.summaryIcon(group.role)}</div>
            <div class="summary-text">
              <span>${this.safeText(group.label)}</span>
              <strong>${this.safeText(value)}</strong>
            </div>
          </div>
        `;
      })
      .join("");

    if (!items.trim()) {
      return "";
    }

    return `<div class="summary-row">${items}</div>`;
  }

  private normalizeConfig(config: CardConfig): NormalizedCardConfig {
    const title = config.title ?? "PV Flow";
    const flowStyle = this.normalizeFlowStyle(config.flowStyle);

    if (config.nodes && config.nodes.length > 0) {
      const nodes = config.nodes.map((node) => ({
        ...node,
        id: node.id?.trim() || `node_${Math.random().toString(36).slice(2, 8)}`,
        name: node.name?.trim() || "Node",
        role: node.role ?? "custom",
        size: this.clampNodeSize(Number(node.size ?? 120)),
        x: this.clampPercent(Number(node.x)),
        y: this.clampPercent(Number(node.y)),
        batteryRingThickness: this.clampBatteryRingThickness(Number(node.batteryRingThickness ?? 7)),
        labelGap: this.clampNodeLabelGap(Number(node.labelGap ?? 6)),
        statsGap: this.clampNodeStatsGap(Number(node.statsGap ?? 6)),
        headerFontScale: this.clampNodeHeaderFontScale(Number(node.headerFontScale ?? 1)),
        showLabelBackground: node.showLabelBackground !== false,
        centerValue: node.centerValue ?? node.role === "battery",
        centerValueOffsetX: this.clampCenterValueOffset(Number(node.centerValueOffsetX ?? 0)),
        centerValueOffsetY: this.clampCenterValueOffset(Number(node.centerValueOffsetY ?? 0)),
        centerValueScale: this.clampCenterValueScale(Number(node.centerValueScale ?? 1))
      }));

      const links = (config.links ?? []).filter((link) =>
        nodes.some((n) => n.id === link.from) && nodes.some((n) => n.id === link.to)
      );

      return { title, nodes, links, flowStyle };
    }

    const legacyNodes = DEFAULT_NODES.map((node) => ({
      ...node,
      entity: config.entities?.[node.id as keyof NonNullable<LegacyConfig["entities"]>],
      image: config.images?.[node.id as keyof NonNullable<LegacyConfig["images"]>]
    }));

    return {
      title,
      nodes: legacyNodes,
      links: DEFAULT_LINKS,
      flowStyle
    };
  }

  private toNodeSizePercent(size: number): number {
    const clamped = this.clampNodeSize(size);
    const percent = (clamped / 120) * 18;
    return Math.max(8, Math.min(36, percent));
  }

  private fitNodesToCard(nodes: FlowNode[]): RenderFlowNode[] {
    const baseNodes: RenderFlowNode[] = nodes.map((node) => ({
      ...node,
      x: this.clampPercent(Number(node.x)),
      y: this.clampPercent(Number(node.y)),
      renderSize: this.toNodeSizePercent(Number(node.size ?? 120))
    }));

    let fitZoom = 1;
    for (const node of baseNodes) {
      const radius = node.renderSize / 2;
      const dx = Math.abs(node.x - 50);
      const dy = Math.abs(node.y - 50);
      const xLimit = 50 / Math.max(1, dx + radius);
      const yLimit = 50 / Math.max(1, dy + radius);
      fitZoom = Math.min(fitZoom, xLimit, yLimit);
    }
    fitZoom = Math.max(0.22, Math.min(1, fitZoom));

    return baseNodes.map((node) => ({
      ...node,
      x: 50 + (node.x - 50) * fitZoom,
      y: 50 + (node.y - 50) * fitZoom,
      renderSize: node.renderSize * fitZoom
    }));
  }

  private getFlowFrameSettings(nodes: RenderFlowNode[]): { aspect: number; minHeight: number } {
    if (nodes.length === 0) {
      return { aspect: 1.45, minHeight: 240 };
    }

    let left = 100;
    let right = 0;
    let top = 100;
    let bottom = 0;
    let maxSize = 8;

    for (const node of nodes) {
      const radius = node.renderSize / 2;
      left = Math.min(left, node.x - radius);
      right = Math.max(right, node.x + radius);
      top = Math.min(top, node.y - radius);
      bottom = Math.max(bottom, node.y + radius);
      maxSize = Math.max(maxSize, node.renderSize);
    }

    const contentWidth = Math.max(28, (right - left) + 8);
    const contentHeight = Math.max(24, (bottom - top) + 22);
    const aspect = Math.max(1.05, Math.min(2.8, contentWidth / contentHeight));
    const minHeight = Math.max(190, Math.min(460, Math.round(150 + maxSize * 4 + Math.max(0, nodes.length - 5) * 10)));

    return { aspect, minHeight };
  }

  private renderNode(node: RenderFlowNode): string {
    return this.getNodeArticleHTML(node, this.clampPercent(node.x), this.clampPercent(node.y), false);
  }

  private getNodeArticleHTML(node: RenderFlowNode, posX: string, posY: string, isEditorContext: boolean = false): string {
    const role = this.getNodeRole(node);
    const metrics = this.getNodeMetrics(node);
    const primaryMetric = metrics[0];
    const extraMetrics = metrics.slice(1);
    const batteryLevel = role === "battery" ? this.getBatteryLevel(metrics) : undefined;
    const safeName = this.safeText(node.name);
    const nodeSize = Math.max(4, Math.min(40, node.renderSize));
    const nodeTextScale = Math.max(0.7, Math.min(1.22, nodeSize / 18));
    const image = node.image?.trim();
    const media = `<div class="fallback-icon">${safeName.slice(0, 1)}</div>`;
    const showPrimaryInBottom = role !== "battery" || batteryLevel === undefined;
    const batteryColor = batteryLevel === undefined ? "#6edb7a" : this.getBatteryRingColor(batteryLevel);
    const batteryRingThickness = this.clampBatteryRingThickness(Number(node.batteryRingThickness ?? 7));
    const labelGap = this.clampNodeLabelGap(Number(node.labelGap ?? 6));
    const statsGap = this.clampNodeStatsGap(Number(node.statsGap ?? 6));
    const headerFontScale = this.clampNodeHeaderFontScale(Number(node.headerFontScale ?? 1));
    const showLabelBackground = node.showLabelBackground !== false;
    const centerValueEnabled = (node.centerValue ?? role === "battery") === true;
    const centerValueOffsetX = this.clampCenterValueOffset(Number(node.centerValueOffsetX ?? 0));
    const centerValueOffsetY = this.clampCenterValueOffset(Number(node.centerValueOffsetY ?? 0));
    const centerValueScale = this.clampCenterValueScale(Number(node.centerValueScale ?? 1));
    const batteryStyle = batteryLevel === undefined
      ? ` --battery-ring-thickness:${batteryRingThickness}px; --node-label-gap:${labelGap}cqw; --node-stats-gap:${statsGap}cqw; --node-header-font-scale:${headerFontScale}; --node-center-offset-x:${centerValueOffsetX}cqw; --node-center-offset-y:${centerValueOffsetY}cqw; --node-center-scale:${centerValueScale};`
      : ` --battery-level:${batteryLevel}; --battery-color:${batteryColor}; --battery-ring-thickness:${batteryRingThickness}px; --node-label-gap:${labelGap}cqw; --node-stats-gap:${statsGap}cqw; --node-header-font-scale:${headerFontScale}; --node-center-offset-x:${centerValueOffsetX}cqw; --node-center-offset-y:${centerValueOffsetY}cqw; --node-center-scale:${centerValueScale};`;
    const isLowBattery = role === "battery" && batteryLevel !== undefined && batteryLevel <= 10;
    const filteredExtraMetrics =
      role === "battery" && batteryLevel !== undefined
        ? extraMetrics.filter((metric) => !(metric.unit === "%" || /soc|state of charge|akku|charge|level/i.test(metric.label)))
        : extraMetrics;
    const batteryStateClass =
      role === "battery" && primaryMetric && !Number.isNaN(primaryMetric.numericValue)
        ? primaryMetric.numericValue > 0
          ? "is-charging"
          : primaryMetric.numericValue < 0
            ? "is-discharging"
            : "is-idle"
        : "";
    const extraMetricMarkup = filteredExtraMetrics
      .map(
        (metric) => `
          <div class="node-stat">
            <span>${this.safeText(metric.label)}</span>
            <strong>${this.safeText(this.formatMetricValue(metric.value, metric.unit))}</strong>
          </div>
        `
      )
      .join("");
    const batteryRingMarkup = batteryLevel === undefined ? "" : `<div class="battery-ring" aria-hidden="true"></div>`;
    const socMetric = metrics.find(
      (metric) => metric.unit === "%" || /soc|state of charge|akku|charge|level/i.test(metric.label)
    );
    const centerMetricValue =
      role === "battery" && batteryLevel !== undefined
        ? `${batteryLevel}%`
        : primaryMetric && !this.isEmptyState(primaryMetric.value)
          ? this.formatMetricValue(primaryMetric.value, primaryMetric.unit)
          : "";
    const centerMetricLabel =
      role === "battery" && socMetric
        ? socMetric.label
        : primaryMetric?.label ?? "";
    const centerMetricMarkup =
      centerValueEnabled && centerMetricValue
        ? `
          <div class="node-center-metric" aria-label="Center metric">
            <div class="node-center-value">${this.safeText(centerMetricValue)}</div>
            ${centerMetricLabel ? `<div class="node-center-label">${this.safeText(centerMetricLabel)}</div>` : ""}
          </div>
        `
        : "";

    return `
      <article class="node node-${role} ${batteryStateClass} ${isLowBattery ? "battery-low" : ""} ${showLabelBackground ? "" : "node-plain-labels"}" style="--node-size:${nodeSize}%; --node-text-scale:${nodeTextScale.toFixed(2)}; left:${posX}%; top:${posY}%;${batteryStyle}">
        <div class="node-header">
          <div class="node-kicker node-chip">${this.safeText(this.roleLabel(role))}</div>
          <div class="node-label node-chip">${safeName}</div>
        </div>
        <div class="node-orb ${image ? "has-image" : ""}">
          ${batteryRingMarkup}
          ${image ? `<img class="node-bg-image" src="${this.safeText(image)}" alt="${safeName}" loading="lazy" />` : ""}
          ${centerMetricMarkup}
          <div class="node-overlay">
            ${image ? "" : `<div class="node-media">${media}</div>`}
            <div class="node-bottom-info">
              ${showPrimaryInBottom && !centerValueEnabled && primaryMetric && !this.isEmptyState(primaryMetric.value) ? `<div class="node-value node-chip">${this.safeText(this.formatMetricValue(primaryMetric.value, primaryMetric.unit))}</div>` : ""}
              ${showPrimaryInBottom && !centerValueEnabled && primaryMetric && !this.isEmptyState(primaryMetric.value) ? `<div class="node-value-label node-chip">${this.safeText(primaryMetric.label)}</div>` : ""}
            </div>
          </div>
        </div>
        ${extraMetricMarkup ? `<div class="node-stats">${extraMetricMarkup}</div>` : ""}
      </article>
    `;
  }

  private getLineAnnotationOffset(position: "top" | "bottom"): number {
    return position === "bottom" ? 3.6 : -3.6;
  }

  private toWatts(value: number, unit: string): number {
    const trimmed = unit.trim().toLowerCase();
    if (!Number.isFinite(value)) {
      return 0;
    }
    if (trimmed === "kw") {
      return value * 1000;
    }
    if (trimmed === "mw") {
      return value * 1_000_000;
    }
    return value;
  }

  private getEntityPowerWatts(entityId?: string): number {
    if (!entityId?.trim()) {
      return 0;
    }
    const raw = Math.abs(this.parseNumber(entityId));
    return this.toWatts(raw, this.getUnit(entityId));
  }

  private getSignedFlowPowerWatts(link: FlowLink): number {
    const hasDirectionalEntities = Boolean(link.forwardEntity?.trim() || link.reverseEntity?.trim());

    if (hasDirectionalEntities) {
      const forward = this.getEntityPowerWatts(link.forwardEntity);
      const reverse = this.getEntityPowerWatts(link.reverseEntity);

      let signed = 0;
      if (forward > 0 || reverse > 0) {
        if (forward >= reverse) {
          signed = forward;
        } else {
          signed = -reverse;
        }
      }

      return link.invert ? -signed : signed;
    }

    if (!link.entity?.trim()) {
      return 0;
    }

    const rawValue = this.parseNumber(link.entity);
    const signed = this.toWatts(rawValue, this.getUnit(link.entity));
    return link.invert ? -signed : signed;
  }

  private getLinkValue(link: FlowLink): string {
    if (link.valueEntity?.trim()) {
      const value = this.getState(link.valueEntity);
      const unit = link.valueUnit ?? this.getUnit(link.valueEntity);
      return this.formatMetricValue(value, unit);
    }

    const signedPower = this.getSignedFlowPowerWatts(link);
    if (signedPower === 0) {
      return "";
    }

    const activeDirectionalEntity =
      signedPower > 0 ? (link.forwardEntity?.trim() || "") : (link.reverseEntity?.trim() || "");

    if (activeDirectionalEntity) {
      const value = this.getState(activeDirectionalEntity);
      const unit = link.valueUnit ?? this.getUnit(activeDirectionalEntity);
      return this.formatMetricValue(value, unit);
    }

    if (link.entity?.trim()) {
      const value = this.getState(link.entity);
      const unit = link.valueUnit ?? this.getUnit(link.entity);
      return this.formatMetricValue(value, unit);
    }

    return "";
  }

  private resolveLinkDirection(link: FlowLink): "forward" | "reverse" | "idle" {
    const value = this.getSignedFlowPowerWatts(link);
    if (value > 0) {
      return "forward";
    }
    if (value < 0) {
      return "reverse";
    }
    return "idle";
  }

  private getLinkDirectionalLabel(link: FlowLink, direction: "forward" | "reverse" | "idle"): string {
    if (direction === "forward" && link.forwardLabel?.trim()) {
      return link.forwardLabel.trim();
    }
    if (direction === "reverse" && link.reverseLabel?.trim()) {
      return link.reverseLabel.trim();
    }
    return link.label?.trim() ?? "";
  }

  private getLinkPowerWatts(link: FlowLink): number {
    const absValue = Math.abs(this.getSignedFlowPowerWatts(link));
    if (!Number.isFinite(absValue)) {
      return 0;
    }
    return absValue;
  }

  private getFlowPowerNormalized(powerWatts: number, flowStyle: ResolvedFlowStyle): number {
    const safePower = Math.max(0, powerWatts);
    const maxWatts = Math.max(1, flowStyle.maxAnimatedWatts);
    if (flowStyle.speedCurve === "log") {
      return Math.min(1, Math.log10(safePower + 1) / Math.log10(maxWatts + 1));
    }
    return Math.min(1, safePower / maxWatts);
  }

  private getFlowStrokeWidth(
    powerWatts: number,
    direction: "forward" | "reverse" | "idle",
    baseThickness: number,
    flowStyle: ResolvedFlowStyle
  ): number {
    if (direction === "idle") {
      return Math.max(0.35, 0.56 * baseThickness);
    }
    const normalized = this.getFlowPowerNormalized(powerWatts, flowStyle);
    return (0.56 + normalized * 0.98) * baseThickness;
  }

  private getFlowDashLength(
    powerWatts: number,
    direction: "forward" | "reverse" | "idle",
    flowStyle: ResolvedFlowStyle
  ): number {
    if (direction === "idle") {
      return 2.8;
    }
    const normalized = this.getFlowPowerNormalized(powerWatts, flowStyle);
    return 2.8 + normalized * 2.2;
  }

  private getFlowDurationSeconds(
    powerWatts: number,
    direction: "forward" | "reverse" | "idle",
    flowStyle: ResolvedFlowStyle
  ): number {
    const speedMultiplier = Math.max(0.3, flowStyle.speedMultiplier);
    if (direction === "idle") {
      return Math.max(0.35, 2.6 / speedMultiplier);
    }
    const normalized = this.getFlowPowerNormalized(powerWatts, flowStyle);
    const baseDuration = 2.2 - normalized * 1.65;
    return Math.max(0.22, baseDuration / speedMultiplier);
  }

  private getFlowParticleCount(powerWatts: number, direction: "forward" | "reverse" | "idle", flowStyle: ResolvedFlowStyle): number {
    if (direction === "idle") {
      return 0;
    }
    if (!flowStyle.dynamicOrbCount) {
      return 1;
    }

    const normalized = this.getFlowPowerNormalized(powerWatts, flowStyle);
    const count = 1 + Math.round(normalized * 7 * flowStyle.orbCountMultiplier);
    return Math.max(1, Math.min(16, count));
  }

  private renderLinks(nodes: RenderFlowNode[], links: FlowLink[], flowStyle: ResolvedFlowStyle): string {
    const lookup = new Map(nodes.map((node) => [node.id, node]));

    const lines = links
      .map((link, idx) => {
        const from = lookup.get(link.from);
        const to = lookup.get(link.to);
        if (!from || !to) {
          return "";
        }

        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.hypot(dx, dy) || 1;
        const normalX = -dy / length;
        const normalY = dx / length;

        const labelPosition = link.labelPosition ?? "top";
        const valuePosition = link.valuePosition ?? "bottom";
        const direction = this.resolveLinkDirection(link);
        const labelText = this.getLinkDirectionalLabel(link, direction);
        const valueText = this.getLinkValue(link);
        const labelCollisionOffset = labelText && valueText && labelPosition === valuePosition ? 1.8 : 0;
        const valueCollisionOffset = labelText && valueText && labelPosition === valuePosition ? -1.8 : 0;

        const labelDistance = this.getLineAnnotationOffset(labelPosition) + labelCollisionOffset;
        const valueDistance = this.getLineAnnotationOffset(valuePosition) + valueCollisionOffset;

        const labelX = midX + normalX * labelDistance;
        const labelY = midY + normalY * labelDistance;
        const valueX = midX + normalX * valueDistance;
        const valueY = midY + normalY * valueDistance;

        const powerWatts = this.getLinkPowerWatts(link);
        const strokeWidth = this.getFlowStrokeWidth(powerWatts, direction, flowStyle.baseThickness, flowStyle);
        const dashLength = this.getFlowDashLength(powerWatts, direction, flowStyle);
        const dashGap = Math.max(2.2, dashLength * 0.85);
        const durationSeconds = this.getFlowDurationSeconds(powerWatts, direction, flowStyle);
        const particleRadius = Math.max(0.55, Math.min(2.4, strokeWidth * 0.9));
        const particleCount = this.getFlowParticleCount(powerWatts, direction, flowStyle);
        const pathId = `flow-path-${idx}`;
        const linkForwardColor = this.sanitizeHexColor(link.forwardColor, flowStyle.forwardColor);
        const linkReverseColor = this.sanitizeHexColor(link.reverseColor, flowStyle.reverseColor);
        const edgeStyle = `--flow-forward:${linkForwardColor}; --flow-reverse:${linkReverseColor};`;
        const lineStyle = `--flow-stroke:${strokeWidth.toFixed(2)}; --flow-dash:${dashLength.toFixed(2)}; --flow-gap:${dashGap.toFixed(2)}; --flow-duration:${durationSeconds.toFixed(2)}s;`;
        const title = labelText ? `<title>${this.safeText(labelText)}</title>` : "";
        const labelMarkup = labelText
          ? `<text class="flow-annotation flow-annotation-label" x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle">${this.safeText(labelText)}</text>`
          : "";
        const valueMarkup = valueText
          ? `<text class="flow-annotation flow-annotation-value" x="${valueX}" y="${valueY}" text-anchor="middle" dominant-baseline="middle">${this.safeText(valueText)}</text>`
          : "";

        const particleMarkup =
          flowStyle.linePattern === "orb" && particleCount > 0
            ? Array.from({ length: particleCount }, (_, particleIndex) => {
              const staggerSeconds = -((durationSeconds / particleCount) * particleIndex);
              const motionAttrs = direction === "reverse"
                ? 'keyPoints="1;0" keyTimes="0;1" calcMode="linear"'
                : 'keyPoints="0;1" keyTimes="0;1" calcMode="linear"';
              return `<circle class="flow-particle ${direction}" r="${particleRadius.toFixed(2)}">
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="${durationSeconds.toFixed(2)}s" begin="${staggerSeconds.toFixed(2)}s" repeatCount="indefinite"></animate>
                <animateMotion dur="${durationSeconds.toFixed(2)}s" begin="${staggerSeconds.toFixed(2)}s" repeatCount="indefinite" ${motionAttrs}>
                  <mpath href="#${pathId}"></mpath>
                </animateMotion>
              </circle>`;
            }).join("")
            : "";

        return `<g class="flow-edge" style="${edgeStyle}"><path id="${pathId}" class="flow-path-helper" d="M ${from.x} ${from.y} L ${to.x} ${to.y}"></path><line class="flow-line ${direction} ${flowStyle.linePattern}" style="${lineStyle}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}">${title}</line>${particleMarkup}${labelMarkup}${valueMarkup}</g>`;
      })
      .join("");

    return `<svg class="line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>`;
  }

  private render(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    const root = this.shadowRoot;
    if (!root) {
      return;
    }

    const normalized = this.normalizeConfig(this._config ?? MergnerPvCard.getStubConfig());
    const fittedNodes = this.fitNodesToCard(normalized.nodes);
    const frame = this.getFlowFrameSettings(fittedNodes);

    root.innerHTML = `
      <style>
        :host {
          display: block;
        }

        ha-card {
          --pv-card-bg: linear-gradient(135deg, #07151e 0%, #0f2f3a 45%, #1f4e55 100%);
          --pv-card-text: #e8f6f6;
          --pv-card-muted: #acd2d3;
          --flow-forward: ${normalized.flowStyle.forwardColor};
          --flow-reverse: ${normalized.flowStyle.reverseColor};
          --flow-idle: ${normalized.flowStyle.idleColor};
          --flow-annotation-color: ${normalized.flowStyle.textColor};
          --flow-annotation-size: ${normalized.flowStyle.textSize}px;
          --flow-annotation-stroke: ${normalized.flowStyle.textOutline}px;
          --flow-frame-min-height: ${frame.minHeight}px;
          --flow-frame-aspect: ${frame.aspect.toFixed(3)};
          --pv-card-node-bg: rgba(255, 255, 255, 0.08);

          background: var(--pv-card-bg);
          color: var(--pv-card-text);
          border-radius: 20px;
          overflow: hidden;
          padding: 14px;
          position: relative;
        }

        .title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;
        }

        .title {
          font-size: 1.05rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: 0.02em;
        }

        .title-version {
          font-size: 0.72rem;
          letter-spacing: 0.04em;
          color: #daf6f6;
          background: rgba(0, 0, 0, 0.34);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          padding: 3px 9px;
          line-height: 1;
          flex-shrink: 0;
        }

        .card-version {
          position: absolute;
          right: 10px;
          bottom: 8px;
          font-size: 0.66rem;
          letter-spacing: 0.04em;
          color: rgba(224, 248, 248, 0.64);
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          padding: 2px 8px;
          line-height: 1;
          z-index: 3;
        }

        .summary-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }

        .summary-chip {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 8px 10px;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 9px;
          backdrop-filter: blur(4px);
        }

        .summary-icon {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          padding: 4px;
          box-sizing: border-box;
        }

        .summary-icon svg {
          width: 100%;
          height: 100%;
          color: currentColor;
        }

        .summary-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .summary-chip span {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--pv-card-muted);
          white-space: nowrap;
        }

        .summary-chip strong {
          font-size: 1rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .summary-chip.pv {
          border-color: rgba(156, 240, 165, 0.22);
        }
        .summary-chip.pv .summary-icon {
          background: rgba(156, 240, 165, 0.14);
          color: #9cf0a5;
        }
        .summary-chip.pv strong {
          color: #9cf0a5;
        }

        .summary-chip.house {
          border-color: rgba(245, 247, 250, 0.16);
        }
        .summary-chip.house .summary-icon {
          background: rgba(245, 247, 250, 0.1);
          color: #f5f7fa;
        }
        .summary-chip.house strong {
          color: #f5f7fa;
        }

        .summary-chip.battery {
          border-color: rgba(141, 224, 255, 0.2);
        }
        .summary-chip.battery .summary-icon {
          background: rgba(141, 224, 255, 0.12);
          color: #8de0ff;
        }
        .summary-chip.battery strong {
          color: #8de0ff;
        }

        .summary-chip.grid {
          border-color: rgba(255, 201, 131, 0.2);
        }
        .summary-chip.grid .summary-icon {
          background: rgba(255, 201, 131, 0.12);
          color: #ffc983;
        }
        .summary-chip.grid strong {
          color: #ffc983;
        }

        .summary-chip.inverter {
          border-color: rgba(200, 180, 255, 0.2);
        }
        .summary-chip.inverter .summary-icon {
          background: rgba(200, 180, 255, 0.12);
          color: #c8b4ff;
        }
        .summary-chip.inverter strong {
          color: #c8b4ff;
        }

        .flow-wrap {
          position: relative;
          min-height: var(--flow-frame-min-height, 240px);
          aspect-ratio: var(--flow-frame-aspect, 1.45);
          border-radius: 14px;
          background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.12), transparent 45%);
        }

        .line-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .flow-line {
          stroke-width: var(--flow-stroke, 0.86);
          fill: none;
          stroke-linecap: round;
        }

        .flow-line.dashed {
          stroke-dasharray: var(--flow-dash, 3.2) var(--flow-gap, 3.2);
          animation: flow var(--flow-duration, 1.5s) linear infinite;
        }

        .flow-line.orb {
          stroke-dasharray: none;
          animation: none;
          opacity: 0.9;
        }

        .flow-line.forward {
          stroke: var(--flow-forward);
        }

        .flow-line.reverse.dashed {
          stroke: var(--flow-reverse);
          animation-direction: reverse;
        }

        .flow-line.reverse.orb {
          stroke: var(--flow-reverse);
        }

        .flow-line.idle {
          stroke: var(--flow-idle);
          opacity: 0.58;
          animation-play-state: paused;
        }

        .flow-path-helper {
          fill: none;
          stroke: none;
          pointer-events: none;
        }

        .flow-particle {
          fill: var(--flow-forward);
          filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.55));
          pointer-events: none;
        }

        .flow-particle.reverse {
          fill: var(--flow-reverse);
        }

        .flow-annotation {
          font-size: var(--flow-annotation-size, 1.7px);
          font-weight: 700;
          fill: var(--flow-annotation-color, #d8fff6);
          paint-order: stroke;
          stroke: rgba(0, 0, 0, 0.72);
          stroke-width: var(--flow-annotation-stroke, 0.28px);
          stroke-linejoin: round;
        }

        .flow-annotation-value {
          fill: #9deecf;
        }

        @keyframes flow {
          to {
            stroke-dashoffset: -16;
          }
        }

        .node {
          width: var(--node-size);
          aspect-ratio: 1 / 1;
          max-width: none;
          position: absolute;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 1;
          container-type: size;
        }

        .node-header {
          position: absolute;
          left: 50%;
          top: calc(var(--node-label-gap, 6cqw) * -1);
          transform: translate(-50%, -100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          z-index: 6;
          width: max-content;
          max-width: 180cqw;
          pointer-events: none;
        }

        .node-orb {
          width: 100%;
          height: 100%;
          aspect-ratio: 1 / 1;
          padding: 0;
          display: grid;
          align-content: start;
          justify-items: center;
          background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.06));
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 50%;
          backdrop-filter: blur(6px);
          box-shadow: inset 0 0 24px rgba(255, 255, 255, 0.04), 0 10px 24px rgba(0, 0, 0, 0.18);
          position: relative;
          overflow: visible;
        }

        .node-bg-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          border-radius: 50%;
          filter: brightness(0.72) saturate(1.05);
          z-index: 0;
        }

        .battery-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 2;
          transform: rotate(-90deg);
          background: conic-gradient(var(--battery-color, #6edb7a) calc(var(--battery-level, 0) * 1%), rgba(255, 255, 255, 0.16) 0);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - var(--battery-ring-thickness, 7px)), #000 calc(100% - var(--battery-ring-thickness, 7px)));
          mask: radial-gradient(farthest-side, transparent calc(100% - var(--battery-ring-thickness, 7px)), #000 calc(100% - var(--battery-ring-thickness, 7px)));
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.16));
        }

        @keyframes batteryLowPulseRing {
          0% {
            opacity: 0.88;
            transform: rotate(-90deg) scale(1);
          }
          50% {
            opacity: 0.46;
            transform: rotate(-90deg) scale(1.02);
          }
          100% {
            opacity: 0.88;
            transform: rotate(-90deg) scale(1);
          }
        }

        @keyframes batteryLowPulseCenter {
          0% {
            opacity: 0.95;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.62;
            transform: translate(-50%, -50%) scale(1.03);
          }
          100% {
            opacity: 0.95;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .node-overlay {
          position: relative;
          z-index: 3;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding: 0 clamp(2px, 6cqw, 10px) clamp(2px, 7cqw, 12px);
          box-sizing: border-box;
        }

        .node-center-metric {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(calc(-50% + var(--node-center-offset-x, 0cqw)), calc(-50% + var(--node-center-offset-y, 0cqw))) scale(var(--node-center-scale, 1));
          z-index: 4;
          padding: clamp(1px, 1.8cqw, 4px) clamp(3px, 5cqw, 10px);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.38);
          border: 1px solid rgba(255, 255, 255, 0.2);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75);
          line-height: 1.1;
          display: grid;
          justify-items: center;
          gap: clamp(1px, 1.2cqw, 3px);
          transform-origin: center;
        }

        .node-center-value {
          font-size: clamp(10px, calc(13.5cqw), 28px);
          font-weight: 700;
          color: #ffffff;
        }

        .node-center-label {
          font-size: clamp(7px, calc(6.2cqw), 16px);
          color: var(--pv-card-muted);
          font-weight: 500;
        }

        .node-battery.battery-low .battery-ring {
          animation: batteryLowPulseRing 2.8s ease-in-out infinite;
        }

        .node-battery.battery-low .node-center-metric {
          animation: batteryLowPulseCenter 2.8s ease-in-out infinite;
        }

        .node-bottom-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          width: 100%;
        }

        .node-orb.has-image {
          background: transparent;
        }

        .node-battery .node-orb {
          border: 2px solid rgba(255, 255, 255, 0.24);
        }

        .node-media {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 58px;
          height: 58px;
          margin-bottom: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
        }

        .node-media img {
          width: 42px;
          height: 42px;
          object-fit: cover;
          border-radius: 50%;
        }

        .fallback-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-weight: 700;
          color: #fff;
          background: rgba(255, 255, 255, 0.16);
        }

        .node-label {
          font-size: calc(0.74rem * var(--node-text-scale, 1) * var(--node-header-font-scale, 1));
          font-size: clamp(8px, calc(8.8cqw * var(--node-header-font-scale, 1)), 26px);
          font-weight: 500;
          max-width: 170cqw;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .node-kicker {
          color: var(--pv-card-muted);
          font-size: calc(0.55rem * var(--node-text-scale, 1) * var(--node-header-font-scale, 1));
          font-size: clamp(7px, calc(6.2cqw * var(--node-header-font-scale, 1)), 16px);
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .node-value {
          font-size: calc(0.95rem * var(--node-text-scale, 1));
          font-size: clamp(9px, calc(11.4cqw), 30px);
          font-weight: 600;
        }

        .node-value-label {
          color: var(--pv-card-muted);
          font-size: calc(0.65rem * var(--node-text-scale, 1));
          font-size: clamp(7px, calc(6.5cqw), 18px);
          font-weight: 400;
        }

        .node-chip {
          background: rgba(0, 0, 0, 0.45);
          color: #ffffff;
          border-radius: 8px;
          padding: clamp(1px, 1.3cqw, 4px) clamp(4px, 4.6cqw, 12px);
          line-height: 1.2;
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .node-stats {
          position: absolute;
          left: 50%;
          top: calc(100% + var(--node-stats-gap, 6cqw));
          transform: translateX(-50%);
          display: grid;
          gap: 4px;
          text-align: left;
          background: rgba(4, 15, 21, 0.48);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 8px 10px;
          backdrop-filter: blur(4px);
        }

        .node.node-plain-labels .node-header .node-chip {
          background: transparent;
          border: none;
          box-shadow: none;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);
          padding: 0;
        }

        .node-stat {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.7rem;
        }

        .node-stat span {
          color: var(--pv-card-muted);
        }

        .node-battery.is-charging {
          filter: drop-shadow(0 0 16px rgba(116, 224, 203, 0.18));
        }

        .node-battery.is-discharging {
          filter: drop-shadow(0 0 16px rgba(255, 177, 102, 0.18));
        }

        @media (max-width: 640px) {
          .flow-wrap {
            min-height: min(72vw, max(200px, var(--flow-frame-min-height, 240px)));
            aspect-ratio: max(1, var(--flow-frame-aspect, 1.15));
          }

          .node {
            width: min(58vw, var(--node-size));
            aspect-ratio: 1 / 1;
          }

          .node-header {
            top: -4px;
            max-width: 180cqw;
          }
        }
      </style>

      <ha-card>
        <div class="title-row">
          <div class="title">${this.safeText(normalized.title)}</div>
          <div class="title-version">v${this.safeText(CARD_VERSION)}</div>
        </div>
        ${this.renderSummary(normalized.nodes)}
        <div class="flow-wrap">
          ${this.renderLinks(fittedNodes, normalized.links, normalized.flowStyle)}
          ${fittedNodes.map((node) => this.renderNode(node)).join("")}
        </div>
        <div class="card-version">v${this.safeText(CARD_VERSION)}</div>
      </ha-card>
    `;
  }
}

class MergnerPvCardEditor extends HTMLElement {
  private _config?: CardConfig;
  private _hass?: HomeAssistant;
  private _dragNodeIndex?: number;
  private _dragEventsBound = false;
  private _entityIdsSignature = "";
  private _layoutZoom = 100;
  private _layoutZoomMode: "auto" | "manual" = "auto";
  private _layoutGridSize = 2.5; // Grid snap in percentage
  private _expandedSections = new Set<string>();
  private _openEntityPicker?: string;
  private _entitySearchTerms = new Map<string, string>();

  private clampEditorNodeSize(value: number): number {
    if (Number.isNaN(value)) {
      return 120;
    }
    return Math.max(40, Math.min(320, value));
  }

  private clampEditorBatteryRingThickness(value: number): number {
    if (!Number.isFinite(value)) {
      return 7;
    }
    return Math.max(2, Math.min(24, Math.round(value)));
  }

  private clampEditorLabelGap(value: number): number {
    if (!Number.isFinite(value)) {
      return 6;
    }
    return Math.max(-16, Math.min(52, Math.round(value)));
  }

  private clampEditorStatsGap(value: number): number {
    if (!Number.isFinite(value)) {
      return 6;
    }
    return Math.max(-12, Math.min(56, Math.round(value)));
  }

  private clampEditorHeaderFontScale(value: number): number {
    if (!Number.isFinite(value)) {
      return 1;
    }
    return Math.max(0.4, Math.min(2.2, Number(value.toFixed(2))));
  }

  private clampEditorCenterValueOffset(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.max(-80, Math.min(80, Math.round(value)));
  }

  private clampEditorCenterValueScale(value: number): number {
    if (!Number.isFinite(value)) {
      return 1;
    }
    return Math.max(0.5, Math.min(2, Number(value.toFixed(2))));
  }

  private clampFlowSetting(value: number, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, value));
  }

  private clampEditorGridSize(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
      return 2.5;
    }
    return Math.max(0.5, Math.min(25, Number(value.toFixed(1))));
  }

  private snapToGrid(value: number, gridSize: number): number {
    if (gridSize <= 0) {
      return value;
    }
    return Math.round(value / gridSize) * gridSize;
  }

  private sanitizeEditorHexColor(input: unknown, fallback: string): string {
    const value = typeof input === "string" ? input.trim() : "";
    if (/^#([0-9a-fA-F]{6})$/.test(value) || /^#([0-9a-fA-F]{3})$/.test(value)) {
      return value;
    }
    return fallback;
  }

  private normalizeEditorFlowStyle(style?: FlowStyleConfig): ResolvedFlowStyle {
    const source = style ?? {};
    return {
      forwardColor: this.sanitizeEditorHexColor(source.forwardColor, DEFAULT_FLOW_STYLE.forwardColor),
      reverseColor: this.sanitizeEditorHexColor(source.reverseColor, DEFAULT_FLOW_STYLE.reverseColor),
      idleColor: this.sanitizeEditorHexColor(source.idleColor, DEFAULT_FLOW_STYLE.idleColor),
      textColor: this.sanitizeEditorHexColor(source.textColor, DEFAULT_FLOW_STYLE.textColor),
      baseThickness: this.clampFlowSetting(Number(source.baseThickness ?? DEFAULT_FLOW_STYLE.baseThickness), 0.4, 1.6, DEFAULT_FLOW_STYLE.baseThickness),
      textSize: this.clampFlowSetting(Number(source.textSize ?? DEFAULT_FLOW_STYLE.textSize), 1.1, 3.3, DEFAULT_FLOW_STYLE.textSize),
      textOutline: this.clampFlowSetting(Number(source.textOutline ?? DEFAULT_FLOW_STYLE.textOutline), 0, 0.8, DEFAULT_FLOW_STYLE.textOutline),
      linePattern: source.linePattern === "orb" ? "orb" : "dashed",
      speedCurve: source.speedCurve === "log" ? "log" : "linear",
      speedMultiplier: this.clampFlowSetting(Number(source.speedMultiplier ?? DEFAULT_FLOW_STYLE.speedMultiplier), 0.3, 3, DEFAULT_FLOW_STYLE.speedMultiplier),
      maxAnimatedWatts: this.clampFlowSetting(Number(source.maxAnimatedWatts ?? DEFAULT_FLOW_STYLE.maxAnimatedWatts), 1200, 30000, DEFAULT_FLOW_STYLE.maxAnimatedWatts),
      dynamicOrbCount: source.dynamicOrbCount === true,
      orbCountMultiplier: this.clampFlowSetting(Number(source.orbCountMultiplier ?? DEFAULT_FLOW_STYLE.orbCountMultiplier), 0.2, 6, DEFAULT_FLOW_STYLE.orbCountMultiplier)
    };
  }

  private safeText(input: unknown): string {
    const text = typeof input === "string" ? input : String(input ?? "");
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  private clampEditorPercent(value: number): number {
    if (Number.isNaN(value)) {
      return 50;
    }
    return Math.max(2, Math.min(98, value));
  }

  private getNodeRadiusPercent(node: FlowNode): number {
    const size = this.clampEditorNodeSize(Number(node.size ?? 120));
    const diameterPercent = Math.max(8, Math.min(36, (size / 120) * 18));
    return diameterPercent / 2;
  }

  private getZoomedNodeRadiusPercent(node: FlowNode, zoom: number): number {
    const zoomFactor = Math.max(0.2, zoom / 100);
    return this.getNodeRadiusPercent(node) * zoomFactor;
  }

  private clampNodePositionForZoom(node: FlowNode, x: number, y: number, zoom: number): Pick<FlowNode, "x" | "y"> {
    const radius = this.getZoomedNodeRadiusPercent(node, zoom);
    const min = Math.max(2, radius);
    const max = Math.min(98, 100 - radius);
    return {
      x: Math.max(min, Math.min(max, this.clampEditorPercent(x))),
      y: Math.max(min, Math.min(max, this.clampEditorPercent(y)))
    };
  }

  private getProjectedLayoutNode(node: FlowNode, zoom: number): { x: number; y: number; sizePercent: number } {
    const zoomFactor = Math.max(0.2, zoom / 100);
    const sizePercent = Math.max(2.5, Math.min(58, this.getNodeRadiusPercent(node) * 2 * zoomFactor));
    const radius = sizePercent / 2;
    const projectedX = this.projectLayoutPosition(node.x, zoom);
    const projectedY = this.projectLayoutPosition(node.y, zoom);
    return {
      x: Math.max(radius, Math.min(100 - radius, projectedX)),
      y: Math.max(radius, Math.min(100 - radius, projectedY)),
      sizePercent
    };
  }

  private clampNodePosition(node: FlowNode, x: number, y: number): Pick<FlowNode, "x" | "y"> {
    const radius = this.getNodeRadiusPercent(node);
    const min = Math.max(2, radius);
    const max = Math.min(98, 100 - radius);
    return {
      x: Math.max(min, Math.min(max, this.clampEditorPercent(x))),
      y: Math.max(min, Math.min(max, this.clampEditorPercent(y)))
    };
  }

  private normalizeEditorConfig(config?: Partial<CardConfig>): CardConfig {
    const base = MergnerPvCard.getStubConfig();
    const incoming = config ?? {};
    const merged: CardConfig = {
      ...base,
      ...incoming,
      title: (incoming.title ?? base.title ?? "PV Flow").toString(),
      flowStyle: this.normalizeEditorFlowStyle(incoming.flowStyle)
    };

    const rawNodes = Array.isArray(incoming.nodes) && incoming.nodes.length > 0 ? incoming.nodes : (base.nodes ?? []);
    const nodes = rawNodes.map((node, index) => {
      const normalizedNode: FlowNode = {
      ...node,
      id: (node.id ?? `node_${index + 1}`).toString().trim() || `node_${index + 1}`,
      name: (node.name ?? `Node ${index + 1}`).toString().trim() || `Node ${index + 1}`,
      role: node.role ?? "custom",
      x: this.clampEditorPercent(Number(node.x)),
      y: this.clampEditorPercent(Number(node.y)),
      size: this.clampEditorNodeSize(Number(node.size ?? 120)),
      batteryRingThickness: this.clampEditorBatteryRingThickness(Number(node.batteryRingThickness ?? 7)),
      labelGap: this.clampEditorLabelGap(Number(node.labelGap ?? 6)),
      statsGap: this.clampEditorStatsGap(Number(node.statsGap ?? 6)),
      headerFontScale: this.clampEditorHeaderFontScale(Number(node.headerFontScale ?? 1)),
      showLabelBackground: node.showLabelBackground !== false,
      centerValue: node.centerValue ?? (node.role === "battery"),
      centerValueOffsetX: this.clampEditorCenterValueOffset(Number(node.centerValueOffsetX ?? 0)),
      centerValueOffsetY: this.clampEditorCenterValueOffset(Number(node.centerValueOffsetY ?? 0)),
      centerValueScale: this.clampEditorCenterValueScale(Number(node.centerValueScale ?? 1))
      };
      const clampedPosition = this.clampNodePosition(normalizedNode, normalizedNode.x, normalizedNode.y);
      return {
        ...normalizedNode,
        ...clampedPosition
      };
    });

    const validIds = new Set(nodes.map((node) => node.id));
  const rawLinks = Array.isArray(incoming.links) ? incoming.links : (base.links ?? []);
    const links = rawLinks.filter((link) => validIds.has(link.from) && validIds.has(link.to));

    return {
      ...merged,
      nodes,
      links
    };
  }

  setConfig(config?: CardConfig): void {
    this._config = this.normalizeEditorConfig(config);
    this.render();
  }

  set hass(hass: HomeAssistant) {
    const nextEntityIdsSignature = Object.keys(hass?.states ?? {})
      .sort((left, right) => left.localeCompare(right))
      .join("|");
    const shouldRender = !this._hass || nextEntityIdsSignature !== this._entityIdsSignature;

    this._hass = hass;
    this._entityIdsSignature = nextEntityIdsSignature;

    if (shouldRender) {
      this.render();
    }
  }

  connectedCallback(): void {
    this.bindDragEvents();
    this.render();
  }

  private get safeConfig(): CardConfig {
    return this._config ?? MergnerPvCard.getStubConfig();
  }

  private emitConfig(newConfig: CardConfig): void {
    this._config = newConfig;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true
      })
    );
    this.render();
  }

  private updateNode(nodes: FlowNode[], links: FlowLink[], index: number, patch: Partial<FlowNode>): void {
    const nextNodes = [...nodes];
    const mergedNode = { ...nextNodes[index], ...patch };
    const clampedPosition = this.clampNodePosition(mergedNode, Number(mergedNode.x), Number(mergedNode.y));
    nextNodes[index] = {
      ...mergedNode,
      ...clampedPosition,
      size: this.clampEditorNodeSize(Number(mergedNode.size ?? 120)),
      batteryRingThickness: this.clampEditorBatteryRingThickness(Number(mergedNode.batteryRingThickness ?? 7)),
      labelGap: this.clampEditorLabelGap(Number(mergedNode.labelGap ?? 6)),
      statsGap: this.clampEditorStatsGap(Number(mergedNode.statsGap ?? 6)),
      headerFontScale: this.clampEditorHeaderFontScale(Number(mergedNode.headerFontScale ?? 1)),
      showLabelBackground: mergedNode.showLabelBackground !== false,
      centerValue: mergedNode.centerValue ?? (mergedNode.role === "battery"),
      centerValueOffsetX: this.clampEditorCenterValueOffset(Number(mergedNode.centerValueOffsetX ?? 0)),
      centerValueOffsetY: this.clampEditorCenterValueOffset(Number(mergedNode.centerValueOffsetY ?? 0)),
      centerValueScale: this.clampEditorCenterValueScale(Number(mergedNode.centerValueScale ?? 1))
    };
    this.emitConfig({ ...this.safeConfig, nodes: nextNodes, links });
  }

  private bindDragEvents(): void {
    if (this._dragEventsBound) {
      return;
    }

    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointercancel", this.handlePointerUp);
    this._dragEventsBound = true;
  }

  disconnectedCallback(): void {
    if (!this._dragEventsBound) {
      return;
    }

    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("pointercancel", this.handlePointerUp);
    this._dragEventsBound = false;
  }

  private getEntityIds(): string[] {
    return Object.keys(this._hass?.states ?? {}).sort((left, right) => left.localeCompare(right));
  }

  private getEntityFriendlyName(entityId: string): string {
    const name = this._hass?.states?.[entityId]?.attributes?.friendly_name;
    return typeof name === "string" && name.trim() ? name.trim() : "";
  }

  private getEntityUnit(entityId: string): string {
    const attributes = this._hass?.states?.[entityId]?.attributes;
    const unit = attributes?.unit_of_measurement;
    return typeof unit === "string" ? unit : "";
  }

  private getEntityDeviceClass(entityId: string): string {
    const attributes = this._hass?.states?.[entityId]?.attributes;
    const deviceClass = attributes?.device_class;
    return typeof deviceClass === "string" ? deviceClass : "";
  }

  private matchesEntityFilter(entityId: string, filter: EntityFilterKind): boolean {
    if (filter === "any") {
      return true;
    }

    const unit = this.getEntityUnit(entityId).toLowerCase();
    const deviceClass = this.getEntityDeviceClass(entityId).toLowerCase();

    if (filter === "power") {
      return /^(w|kw|mw|gw|va|kva)$/.test(unit) || ["power", "apparent_power", "reactive_power"].includes(deviceClass);
    }

    if (filter === "energy") {
      return /^(wh|kwh|mwh|gwh)$/.test(unit) || deviceClass === "energy";
    }

    return unit === "%" || deviceClass === "battery";
  }

  private getNodeEntityFilter(node: FlowNode, field: keyof FlowNode): EntityFilterKind {
    if (field === "entity") {
      return "power";
    }

    if (field === "secondaryEntity") {
      return node.role === "battery" ? "percent" : "energy";
    }

    if (field === "tertiaryEntity") {
      return "energy";
    }

    return "any";
  }

  private applyPickerFilter(picker: HTMLElement, termRaw: string): void {
    const lower = termRaw.trim().toLowerCase();
    picker.querySelectorAll<HTMLElement>(".picker-option").forEach((opt) => {
      if (opt.classList.contains("picker-clear")) {
        opt.hidden = false;
        return;
      }
      const text = (opt.textContent ?? "").toLowerCase();
      opt.hidden = lower.length > 0 && !text.includes(lower);
    });

    picker.querySelectorAll<HTMLElement>(".picker-group").forEach((group) => {
      const visible = group.querySelectorAll<HTMLElement>(".picker-option:not([hidden])");
      group.hidden = visible.length === 0;
    });

    const hasVisibleOptions = picker.querySelectorAll<HTMLElement>(".picker-option:not([hidden])").length > 0;
    const noResults = picker.querySelector<HTMLElement>(".picker-no-results");
    if (noResults) {
      noResults.hidden = hasVisibleOptions;
    }
  }

  private renderEntitySelect(
    selectorId: string,
    field: keyof FlowNode | keyof FlowLink,
    value?: string,
    placeholder = "Select entity",
    filter: EntityFilterKind = "any"
  ): string {
    const entityIds = this.getEntityIds();
    const selectedValue = value?.trim() ?? "";
    const searchTerm = this._entitySearchTerms.get(selectorId) ?? "";
    const isOpen = this._openEntityPicker === selectorId;

    const friendly = selectedValue ? this.getEntityFriendlyName(selectedValue) : "";
    const triggerLabel = selectedValue ? (friendly || selectedValue) : placeholder;
    const triggerSub = selectedValue && friendly
      ? `<span class="picker-trigger-id">${this.safeText(selectedValue)}</span>`
      : "";

    const preferred = entityIds.filter((id) => this.matchesEntityFilter(id, filter));
    const rest = entityIds.filter((id) => !preferred.includes(id));

    const matchesTerm = (id: string): boolean => {
      if (!searchTerm) {
        return true;
      }
      const lower = searchTerm.toLowerCase();
      return id.toLowerCase().includes(lower) || this.getEntityFriendlyName(id).toLowerCase().includes(lower);
    };

    const renderGroup = (ids: string[], groupLabel: string): string => {
      const filtered = ids.filter(matchesTerm);
      if (!filtered.length) {
        return "";
      }
      return `
        <div class="picker-group">
          <div class="picker-group-label">${this.safeText(groupLabel)}</div>
          ${filtered.map((id) => {
            const fname = this.getEntityFriendlyName(id);
            const isSel = id === selectedValue;
            return `
              <div class="picker-option${isSel ? " is-selected" : ""}" data-value="${this.safeText(id)}" role="option" aria-selected="${isSel}">
                ${fname ? `<span class="picker-option-name">${this.safeText(fname)}</span>` : ""}
                <span class="picker-option-id">${this.safeText(id)}</span>
              </div>`;
          }).join("")}
        </div>`;
    };

    const customOption = selectedValue && !entityIds.includes(selectedValue)
      ? `<div class="picker-option is-selected" data-value="${this.safeText(selectedValue)}" role="option">
          <span class="picker-option-name">Custom</span>
          <span class="picker-option-id">${this.safeText(selectedValue)}</span>
        </div>`
      : "";

    const renderedPreferred = renderGroup(preferred, "Empfohlen");
    const renderedRest = renderGroup(rest, "Alle Entitäten");
    const hasResults = Boolean(customOption || renderedPreferred || renderedRest);

    return `
      <div class="entity-picker" data-picker-id="${this.safeText(selectorId)}" data-field="${String(field)}">
        <button class="picker-trigger ${selectedValue ? "has-value" : ""}" type="button" aria-haspopup="listbox" aria-expanded="${isOpen}">
          <span class="picker-trigger-main">
            <span class="picker-trigger-label">${this.safeText(triggerLabel)}</span>
            ${triggerSub}
          </span>
          <span class="picker-trigger-arrow" aria-hidden="true">${isOpen ? "▲" : "▼"}</span>
        </button>
        ${isOpen ? `
        <div class="picker-dropdown" role="listbox">
          <input
            type="search"
            class="picker-search"
            placeholder="Name oder ID suchen…"
            value="${this.safeText(searchTerm)}"
            aria-label="Search entities"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="picker-options">
            ${selectedValue ? `<div class="picker-option picker-clear" data-value="" role="option"><span class="picker-option-name">— Auswahl löschen —</span></div>` : ""}
            ${customOption}
            ${renderedPreferred}
            ${renderedRest}
            ${hasResults ? "" : `<div class="picker-no-results">Keine Entität gefunden</div>`}
          </div>
        </div>
        ` : ""}
      </div>
    `;
  }

  private renderLayoutCanvas(nodes: FlowNode[], links: FlowLink[]): string {
    const effectiveZoom = this.getEffectiveLayoutZoom(nodes);
    const projectedNodeMap = new Map<string, { x: number; y: number; sizePercent: number }>(
      nodes.map((node) => [node.id, this.getProjectedLayoutNode(node, effectiveZoom)])
    );
    const lines = links
      .map((link) => {
        const from = projectedNodeMap.get(link.from);
        const to = projectedNodeMap.get(link.to);
        if (!from || !to) {
          return "";
        }
        return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>`;
      })
      .join("");

    const nodeMarkup = nodes
      .map((node, index) => {
        const image = node.image?.trim();
        const media = `<span>${this.safeText(node.name.slice(0, 1).toUpperCase())}</span>`;
        const projected = projectedNodeMap.get(node.id);
        if (!projected) {
          return "";
        }
        const role = node.role ?? "custom";

        return `
          <button
            class="layout-editor-node-wrapper"
            data-action="drag-node"
            data-index="${index}"
            type="button"
            style="--layout-node-size:${projected.sizePercent.toFixed(2)}%; left:${projected.x}%; top:${projected.y}%; width: var(--layout-node-size); height: var(--layout-node-size);"
            aria-label="Drag ${this.safeText(node.name)}"
          >
            <div class="layout-editor-node-inner ${image ? "has-image" : ""}">
              ${image ? `<img class="layout-editor-node-bg" src="${this.safeText(image)}" alt="${this.safeText(node.name)}" />` : ""}
              <div class="layout-editor-node-content">
                ${image ? "" : `<div class="layout-editor-node-media">${media}</div>`}
                <div class="layout-editor-node-label">${this.safeText(node.name)}</div>
              </div>
            </div>
          </button>
        `;
      })
      .join("");

    const frame = this.getLayoutFrameSettings(nodes, effectiveZoom);

    return `
      <div class="layout-canvas-wrap">
        <div class="layout-toolbar">
          <label>
            <span>Zoom mode</span>
            <select data-action="layout-zoom-mode">
              <option value="auto" ${this._layoutZoomMode === "auto" ? "selected" : ""}>Auto fit</option>
              <option value="manual" ${this._layoutZoomMode === "manual" ? "selected" : ""}>Manual</option>
            </select>
          </label>
          <label>
            <span>Zoom</span>
            <input type="range" data-action="layout-zoom" min="50" max="160" step="5" value="${effectiveZoom}" ${this._layoutZoomMode === "auto" ? "disabled" : ""} />
          </label>
          <input type="number" data-action="layout-zoom" min="50" max="160" step="5" value="${effectiveZoom}" ${this._layoutZoomMode === "auto" ? "disabled" : ""} />
        </div>
        <div class="layout-hint">Drag devices in the preview to set X/Y positions. Zoom scales both size and spacing.</div>
        <div class="layout-canvas" style="--layout-frame-min-height:${frame.minHeight}px; --layout-frame-aspect:${frame.aspect.toFixed(3)};">
          <svg class="layout-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
          ${nodeMarkup}
        </div>
      </div>
    `;
  }

  private getLayoutFrameSettings(nodes: FlowNode[], zoom: number): { aspect: number; minHeight: number } {
    if (nodes.length === 0) {
      return { aspect: 1.45, minHeight: 240 };
    }

    let left = 100;
    let right = 0;
    let top = 100;
    let bottom = 0;
    let maxSizePct = 8;

    for (const node of nodes) {
      const projected = this.getProjectedLayoutNode(node, zoom);
      const radius = projected.sizePercent / 2;
      left = Math.min(left, projected.x - radius);
      right = Math.max(right, projected.x + radius);
      top = Math.min(top, projected.y - radius);
      bottom = Math.max(bottom, projected.y + radius);
      maxSizePct = Math.max(maxSizePct, projected.sizePercent);
    }

    const contentWidth = Math.max(30, (right - left) + 8);
    const contentHeight = Math.max(24, (bottom - top) + 22);
    const aspect = Math.max(1.05, Math.min(2.8, contentWidth / contentHeight));
    const minHeight = Math.max(190, Math.min(460, Math.round(140 + maxSizePct * 4.5 + Math.max(0, nodes.length - 5) * 10)));

    return { aspect, minHeight };
  }

  private startNodeDrag(index: number): void {
    this._dragNodeIndex = index;
  }

  private getEffectiveLayoutZoom(nodes: FlowNode[]): number {
    if (this._layoutZoomMode === "manual") {
      return this._layoutZoom;
    }

    const maxNodeSize = Math.max(...nodes.map((node) => this.clampEditorNodeSize(Number(node.size ?? 120))), 120);
    const densityFactor = nodes.length >= 8 ? 0.84 : nodes.length >= 6 ? 0.9 : nodes.length >= 4 ? 0.96 : 1;
    const targetNodePx = 96;
    const autoZoom = Math.round((targetNodePx / maxNodeSize) * 100 * densityFactor);
    return Math.max(65, Math.min(160, autoZoom));
  }

  private projectLayoutPosition(value: number, zoom: number): number {
    const factor = zoom / 100;
    const projected = 50 + (value - 50) * factor;
    return Math.max(0, Math.min(100, projected));
  }

  private unprojectLayoutPosition(value: number, zoom: number): number {
    const factor = zoom / 100;
    if (factor <= 0) {
      return value;
    }
    const unprojected = 50 + (value - 50) / factor;
    return this.clampEditorPercent(unprojected);
  }

  private handlePointerMove = (event: PointerEvent): void => {
    if (this._dragNodeIndex === undefined) {
      return;
    }

    const root = this.shadowRoot;
    const canvas = root?.querySelector<HTMLElement>(".layout-canvas");
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const nodes = this.safeConfig.nodes && this.safeConfig.nodes.length > 0 ? this.safeConfig.nodes : DEFAULT_NODES;
    const links = this.safeConfig.links ?? DEFAULT_LINKS;
    const effectiveZoom = this.getEffectiveLayoutZoom(nodes);
    const activeNode = nodes[this._dragNodeIndex];
    if (!activeNode) {
      return;
    }

    const zoomFactor = effectiveZoom / 100;
    const layoutSize = Math.max(24, Math.min(220, Math.round((activeNode.size ?? 120) * zoomFactor)));
    const xEdgePadding = (layoutSize / 2 / rect.width) * 100;
    const yEdgePadding = (layoutSize / 2 / rect.height) * 100;
    const xInCanvas = Math.max(xEdgePadding, Math.min(100 - xEdgePadding, ((event.clientX - rect.left) / rect.width) * 100));
    const yInCanvas = Math.max(yEdgePadding, Math.min(100 - yEdgePadding, ((event.clientY - rect.top) / rect.height) * 100));
    const x = this.unprojectLayoutPosition(xInCanvas, effectiveZoom);
    const y = this.unprojectLayoutPosition(yInCanvas, effectiveZoom);
    const clamped = this.clampNodePositionForZoom(activeNode, x, y, effectiveZoom);
    this.updateNode(nodes, links, this._dragNodeIndex, { x: Number(clamped.x.toFixed(1)), y: Number(clamped.y.toFixed(1)) });
  };

  private handlePointerUp = (): void => {
    this._dragNodeIndex = undefined;
  };

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Image upload failed"));
      });
      reader.addEventListener("error", () => reject(reader.error ?? new Error("Image upload failed")));
      reader.readAsDataURL(file);
    });
  }

  private renderNodeRows(nodes: FlowNode[]): string {
    const roleOptions: NodeRole[] = ["pv", "battery", "house", "grid", "inverter", "custom"];

    return nodes
      .map(
        (node, idx) => {
          const sectionKey = `node-${idx}`;
          const isCollapsed = !this._expandedSections.has(sectionKey);
          return `
          <section class="node-card ${isCollapsed ? "collapsed" : ""}" data-kind="node" data-index="${idx}">
            <div class="card-head">
              <button class="collapse-toggle" data-action="toggle-section" data-section="${sectionKey}" type="button">${isCollapsed ? "▶" : "▼"}</button>
              <strong>${this.safeText(node.name || node.id)}</strong>
            </div>
            ${isCollapsed ? "" : `
            <div class="node-grid">
              <label>
                <span>ID</span>
                <input data-field="id" value="${this.safeText(node.id)}" placeholder="battery_1" />
              </label>
              <label>
                <span>Name</span>
                <input data-field="name" value="${this.safeText(node.name)}" placeholder="Battery 1" />
              </label>
              <label>
                <span>Type</span>
                <select data-field="role">
                  ${roleOptions
                    .map(
                      (role) =>
                        `<option value="${role}" ${((node.role ?? "custom") === role) ? "selected" : ""}>${role}</option>`
                    )
                    .join("")}
                </select>
              </label>
              <label>
                <span>Image URL</span>
                <input data-field="image" value="${this.safeText(node.image ?? "")}" placeholder="/local/pv/battery.png" />
              </label>
              <label>
                <span>X</span>
                <input data-field="x" type="number" min="0" max="100" value="${node.x}" />
              </label>
              <label>
                <span>Y</span>
                <input data-field="y" type="number" min="0" max="100" value="${node.y}" />
              </label>
              <label>
                <span>Size (px)</span>
                <input data-field="size" type="number" min="40" max="320" value="${Math.round(node.size ?? 120)}" />
              </label>
              ${(node.role ?? "custom") === "battery" ? `
              <label>
                <span>Battery ring thickness</span>
                <input data-field="batteryRingThickness" type="number" min="2" max="24" step="1" value="${this.clampEditorBatteryRingThickness(Number(node.batteryRingThickness ?? 7))}" />
              </label>
              ` : ""}
              <label>
                <span>Label distance above (rel.)</span>
                <input data-field="labelGap" type="number" min="-16" max="52" step="1" value="${this.clampEditorLabelGap(Number(node.labelGap ?? 6))}" />
              </label>
              <label>
                <span>Stats distance below (rel.)</span>
                <input data-field="statsGap" type="number" min="-12" max="56" step="1" value="${this.clampEditorStatsGap(Number(node.statsGap ?? 6))}" />
              </label>
              <label>
                <span>Header font scale</span>
                <input data-field="headerFontScale" type="number" min="0.4" max="2.2" step="0.05" value="${this.clampEditorHeaderFontScale(Number(node.headerFontScale ?? 1)).toFixed(2)}" />
              </label>
              <label class="inline-toggle">
                <span>Center value in orb</span>
                <span class="inline-toggle-row"><input data-field="centerValue" type="checkbox" ${(node.centerValue ?? ((node.role ?? "custom") === "battery")) ? "checked" : ""} />Enable center metric</span>
              </label>
              <label>
                <span>Center value offset X (rel.)</span>
                <input data-field="centerValueOffsetX" type="number" min="-80" max="80" step="1" value="${this.clampEditorCenterValueOffset(Number(node.centerValueOffsetX ?? 0))}" />
              </label>
              <label>
                <span>Center value offset Y (rel.)</span>
                <input data-field="centerValueOffsetY" type="number" min="-80" max="80" step="1" value="${this.clampEditorCenterValueOffset(Number(node.centerValueOffsetY ?? 0))}" />
              </label>
              <label>
                <span>Center value scale</span>
                <input data-field="centerValueScale" type="number" min="0.5" max="2" step="0.05" value="${this.clampEditorCenterValueScale(Number(node.centerValueScale ?? 1)).toFixed(2)}" />
              </label>
              <label class="inline-toggle">
                <span>Label background</span>
                <span class="inline-toggle-row"><input data-field="showLabelBackground" type="checkbox" ${node.showLabelBackground !== false ? "checked" : ""} />Show label chips</span>
              </label>
            </div>
            <div class="image-tools">
              <label class="upload-field">
                <span>Upload image</span>
                <input data-action="upload-image" type="file" accept="image/*" />
              </label>
              <button data-action="clear-image" type="button">Clear image</button>
              <div class="image-preview ${node.image?.trim() ? "has-image" : ""}">
                ${node.image?.trim() ? `<img src="${this.safeText(node.image)}" alt="${this.safeText(node.name)} preview" />` : "<span>No image</span>"}
              </div>
            </div>
            <div class="metric-grid">
              <section class="metric-group">
                <h5>Primary</h5>
                <label>
                  <span>Entity</span>
                  ${this.renderEntitySelect(`node-${idx}-entity`, "entity", node.entity, "Choose primary entity", this.getNodeEntityFilter(node, "entity"))}
                </label>
                <label>
                  <span>Label</span>
                  <input data-field="entityLabel" value="${this.safeText(node.entityLabel ?? "")}" placeholder="Charge / Discharge" />
                </label>
                <label>
                  <span>Unit</span>
                  <input data-field="unit" value="${this.safeText(node.unit ?? "")}" placeholder="auto / W" />
                </label>
              </section>
              <section class="metric-group">
                <h5>Secondary</h5>
                <label>
                  <span>Entity</span>
                  ${this.renderEntitySelect(`node-${idx}-secondary`, "secondaryEntity", node.secondaryEntity, "Choose secondary entity", this.getNodeEntityFilter(node, "secondaryEntity"))}
                </label>
                <label>
                  <span>Label</span>
                  <input data-field="secondaryLabel" value="${this.safeText(node.secondaryLabel ?? "")}" placeholder="SOC" />
                </label>
                <label>
                  <span>Unit</span>
                  <input data-field="secondaryUnit" value="${this.safeText(node.secondaryUnit ?? "")}" placeholder="auto / %" />
                </label>
              </section>
              <section class="metric-group">
                <h5>Tertiary</h5>
                <label>
                  <span>Entity</span>
                  ${this.renderEntitySelect(`node-${idx}-tertiary`, "tertiaryEntity", node.tertiaryEntity, "Choose tertiary entity", this.getNodeEntityFilter(node, "tertiaryEntity"))}
                </label>
                <label>
                  <span>Label</span>
                  <input data-field="tertiaryLabel" value="${this.safeText(node.tertiaryLabel ?? "")}" placeholder="Today" />
                </label>
                <label>
                  <span>Unit</span>
                  <input data-field="tertiaryUnit" value="${this.safeText(node.tertiaryUnit ?? "")}" placeholder="auto / kWh" />
                </label>
              </section>
            </div>
            `}
            <button data-action="remove-node" type="button" class="remove-button">Remove Device</button>
          </section>
        `;
        }
      )
      .join("");
  }

  private renderLinkRows(links: FlowLink[], nodes: FlowNode[]): string {
    const options = nodes
      .map((node) => `<option value="${this.safeText(node.id)}">${this.safeText(node.name)} (${this.safeText(node.id)})</option>`)
      .join("");

    return links
      .map(
        (link, idx) => {
          const sectionKey = `link-${idx}`;
          const isCollapsed = !this._expandedSections.has(sectionKey);
          const fromNodeName = nodes.find((n) => n.id === link.from)?.name || link.from;
          const toNodeName = nodes.find((n) => n.id === link.to)?.name || link.to;
          return `
          <section class="row link-card ${isCollapsed ? "collapsed" : ""}" data-kind="link" data-index="${idx}">
            <div class="card-head">
              <button class="collapse-toggle" data-action="toggle-section" data-section="${sectionKey}" type="button">${isCollapsed ? "▶" : "▼"}</button>
              <strong>${this.safeText(fromNodeName)} → ${this.safeText(toNodeName)}</strong>
            </div>
            ${isCollapsed ? "" : `
            <p class="link-hint">Configure source/target first. Use either a single signed sensor or separate forward/reverse sensors for bidirectional flows.</p>
            <div class="link-grid">
              <label>
                <span>From device</span>
                <select data-field="from">${options}</select>
              </label>
              <label>
                <span>To device</span>
                <select data-field="to">${options}</select>
              </label>
              <label class="link-wide">
                <span>Flow power entity (single signed sensor)</span>
                ${this.renderEntitySelect(`link-${idx}-entity`, "entity", link.entity, "Choose flow entity", "power")}
              </label>
              <label class="link-wide">
                <span>Forward amount entity (from -> to)</span>
                ${this.renderEntitySelect(`link-${idx}-forward-entity`, "forwardEntity", link.forwardEntity, "Choose forward amount entity", "power")}
              </label>
              <label class="link-wide">
                <span>Reverse amount entity (to -> from)</span>
                ${this.renderEntitySelect(`link-${idx}-reverse-entity`, "reverseEntity", link.reverseEntity, "Choose reverse amount entity", "power")}
              </label>
              <label class="inline-toggle">
                <span>Direction</span>
                <span class="inline-toggle-row"><input data-field="invert" type="checkbox" ${link.invert ? "checked" : ""} />Invert direction</span>
              </label>
              <label>
                <span>Line label text</span>
                <input data-field="label" value="${this.safeText(link.label ?? "")}" placeholder="Label optional" />
              </label>
              <label>
                <span>Forward label text (from -> to)</span>
                <input data-field="forwardLabel" value="${this.safeText(link.forwardLabel ?? "")}" placeholder="e.g. Zum Netz" />
              </label>
              <label>
                <span>Reverse label text (to -> from)</span>
                <input data-field="reverseLabel" value="${this.safeText(link.reverseLabel ?? "")}" placeholder="e.g. Vom Netz" />
              </label>
              <label>
                <span>Line label position</span>
                <select data-field="labelPosition">
                  <option value="top" ${(link.labelPosition ?? "top") === "top" ? "selected" : ""}>Top</option>
                  <option value="bottom" ${(link.labelPosition ?? "top") === "bottom" ? "selected" : ""}>Bottom</option>
                </select>
              </label>
              <label class="link-wide">
                <span>Value entity on line</span>
                ${this.renderEntitySelect(`link-${idx}-value-entity`, "valueEntity", link.valueEntity, "Choose value entity", "any")}
              </label>
              <label>
                <span>Value position</span>
                <select data-field="valuePosition">
                  <option value="top" ${(link.valuePosition ?? "bottom") === "top" ? "selected" : ""}>Top</option>
                  <option value="bottom" ${(link.valuePosition ?? "bottom") === "bottom" ? "selected" : ""}>Bottom</option>
                </select>
              </label>
              <label>
                <span>Value unit override</span>
                <input data-field="valueUnit" value="${this.safeText(link.valueUnit ?? "")}" placeholder="auto / W / kW" />
              </label>
              <label>
                <span>Forward flow color</span>
                <div class="color-row">
                  <input data-field="forwardColor" type="color" value="${this.sanitizeEditorHexColor(link.forwardColor, DEFAULT_FLOW_STYLE.forwardColor)}" />
                  ${link.forwardColor
                    ? `<button type="button" class="reset-color-btn" data-action="reset-link-color" data-field="forwardColor" title="Reset to global default">↺ Reset</button>`
                    : `<span class="color-hint">global default</span>`
                  }
                </div>
              </label>
              <label>
                <span>Reverse flow color</span>
                <div class="color-row">
                  <input data-field="reverseColor" type="color" value="${this.sanitizeEditorHexColor(link.reverseColor, DEFAULT_FLOW_STYLE.reverseColor)}" />
                  ${link.reverseColor
                    ? `<button type="button" class="reset-color-btn" data-action="reset-link-color" data-field="reverseColor" title="Reset to global default">↺ Reset</button>`
                    : `<span class="color-hint">global default</span>`
                  }
                </div>
              </label>
            </div>
            `}
            <button data-action="remove-link" type="button" class="remove-button">Remove Flow</button>
          </section>
        `;
        }
      )
      .join("");
  }

  private wireEvents(nodes: FlowNode[], links: FlowLink[]): void {
    const root = this.shadowRoot;
    if (!root) {
      return;
    }

    root.querySelectorAll<HTMLButtonElement>("button[data-action='toggle-section']").forEach((button) => {
      button.addEventListener("click", () => {
        const section = button.dataset.section;
        if (!section) {
          return;
        }

        if (this._expandedSections.has(section)) {
          this._expandedSections.delete(section);
        } else {
          this._expandedSections.add(section);
        }

        this.render();
      });
    });

    root.querySelectorAll<HTMLElement>(".entity-picker").forEach((picker) => {
      const pickerParentCard = picker.closest("[data-kind][data-index]") as HTMLElement | null;
      if (!pickerParentCard) {
        return;
      }
      const kind = pickerParentCard.dataset.kind as "node" | "link";
      const index = Number(pickerParentCard.dataset.index);
      const field = picker.dataset.field as keyof FlowNode | keyof FlowLink;
      const pickerId = picker.dataset.pickerId ?? "";

      picker.querySelector<HTMLButtonElement>(".picker-trigger")?.addEventListener("click", (event) => {
        // Prevent label click behavior around the custom picker to avoid open/close glitches.
        event.preventDefault();
        event.stopPropagation();
        this._openEntityPicker = this._openEntityPicker === pickerId ? undefined : pickerId;
        this.render();
      });

      picker.querySelector<HTMLElement>(".picker-dropdown")?.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      const searchInput = picker.querySelector<HTMLInputElement>(".picker-search");
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 0);
        this.applyPickerFilter(picker, searchInput.value);
        const onSearchUpdate = () => {
          const term = searchInput.value;
          this._entitySearchTerms.set(pickerId, term);
          this.applyPickerFilter(picker, term);
        };
        searchInput.addEventListener("input", onSearchUpdate);
        searchInput.addEventListener("search", onSearchUpdate);
        searchInput.addEventListener("keyup", onSearchUpdate);

        searchInput.addEventListener("keydown", (event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            this._openEntityPicker = undefined;
            this.render();
          }
        });
      }

      picker.querySelectorAll<HTMLElement>(".picker-option").forEach((opt) => {
        opt.addEventListener("mousedown", (event) => {
          event.preventDefault();
        });

        opt.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const newValue = opt.dataset.value ?? "";
          this._openEntityPicker = undefined;
          if (kind === "node") {
            this.updateNode(nodes, links, index, { [field]: newValue } as Partial<FlowNode>);
          } else {
            const nextLinks = [...links];
            nextLinks[index] = { ...nextLinks[index], [field]: newValue };
            this.emitConfig({ ...this.safeConfig, nodes, links: nextLinks });
          }
        });
      });
    });

    root.addEventListener("click", (event) => {
      const target = event.target as Element | null;
      if (!target?.closest(".entity-picker") && this._openEntityPicker) {
        this._openEntityPicker = undefined;
        this.render();
      }
    });

    root.querySelectorAll<HTMLInputElement>("input[data-action='layout-zoom']").forEach((input) => {
      input.addEventListener("input", () => {
        const next = Number(input.value);
        if (!Number.isFinite(next)) {
          return;
        }

        this._layoutZoomMode = "manual";
        this._layoutZoom = Math.max(50, Math.min(160, next));
        this.render();
      });
    });

    root.querySelector<HTMLSelectElement>("select[data-action='layout-zoom-mode']")?.addEventListener("change", (event) => {
      const select = event.currentTarget as HTMLSelectElement;
      if (select.value === "auto" || select.value === "manual") {
        this._layoutZoomMode = select.value;
        this.render();
      }
    });

    root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-action='flow-style']").forEach((control) => {
      const eventName = control instanceof HTMLInputElement && control.type === "range" ? "input" : "change";
      control.addEventListener(eventName, () => {
        const field = control.dataset.field as keyof ResolvedFlowStyle | undefined;
        if (!field) {
          return;
        }

        const current = this.normalizeEditorFlowStyle(this.safeConfig.flowStyle);
        const next: ResolvedFlowStyle = { ...current };
        if (control.dataset.kind === "color") {
          const colorField = field as "forwardColor" | "reverseColor" | "idleColor" | "textColor";
          next[colorField] = control.value;
        } else if (control.dataset.kind === "select") {
          if (field === "linePattern") {
            next.linePattern = control.value === "orb" ? "orb" : "dashed";
          } else if (field === "speedCurve") {
            next.speedCurve = control.value === "log" ? "log" : "linear";
          }
        } else if (control.dataset.kind === "bool") {
          if (control instanceof HTMLInputElement && field === "dynamicOrbCount") {
            next.dynamicOrbCount = control.checked;
          }
        } else {
          const numericField = field as "baseThickness" | "textSize" | "textOutline";
          if (field === "maxAnimatedWatts") {
            next.maxAnimatedWatts = Number(control.value);
          } else if (field === "speedMultiplier") {
            next.speedMultiplier = Number(control.value);
          } else if (field === "orbCountMultiplier") {
            next.orbCountMultiplier = Number(control.value);
          } else {
            next[numericField] = Number(control.value);
          }
        }

        this.emitConfig({ ...this.safeConfig, flowStyle: this.normalizeEditorFlowStyle(next), nodes, links });
      });
    });

    root.querySelectorAll<HTMLElement>(".node-card[data-kind='node']").forEach((row, index) => {
      row.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[data-field], select[data-field]").forEach((input) => {
        const eventName = input instanceof HTMLInputElement && input.type !== "checkbox" ? "input" : "change";
        input.addEventListener(eventName, () => {
          const field = input.dataset.field as keyof FlowNode;
          const value = input instanceof HTMLInputElement
            ? (input.type === "number"
              ? Number(input.value)
              : input.type === "checkbox"
                ? input.checked
                : input.value)
            : input.value;
          this.updateNode(nodes, links, index, { [field]: value } as Partial<FlowNode>);
        });
      });

      row.querySelector<HTMLInputElement>("input[data-action='upload-image']")?.addEventListener("change", async (event) => {
        const target = event.currentTarget as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) {
          return;
        }

        try {
          const image = await this.readFileAsDataUrl(file);
          this.updateNode(nodes, links, index, { image });
        } catch (error) {
          console.error(error);
        } finally {
          target.value = "";
        }
      });

      row.querySelector<HTMLButtonElement>("button[data-action='clear-image']")?.addEventListener("click", () => {
        this.updateNode(nodes, links, index, { image: "" });
      });

      row.querySelector<HTMLButtonElement>("button[data-action='remove-node']")?.addEventListener("click", () => {
        const nextNodes = nodes.filter((_, i) => i !== index);
        const validIds = new Set(nextNodes.map((node) => node.id));
        const nextLinks = links.filter((link) => validIds.has(link.from) && validIds.has(link.to));
        this.emitConfig({ ...this.safeConfig, nodes: nextNodes, links: nextLinks });
      });
    });

    root.querySelectorAll<HTMLButtonElement>("button[data-action='drag-node']").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) {
          return;
        }

        const index = Number(button.dataset.index);
        if (!Number.isFinite(index)) {
          return;
        }

        event.preventDefault();
        this.startNodeDrag(index);
      });
    });

    root.querySelectorAll<HTMLElement>(".row[data-kind='link']").forEach((row, index) => {
      row.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[data-field], select[data-field]").forEach((input) => {
        if (input instanceof HTMLInputElement && input.type === "checkbox") {
          input.addEventListener("change", () => {
            const nextLinks = [...links];
            nextLinks[index] = { ...nextLinks[index], invert: input.checked };
            this.emitConfig({ ...this.safeConfig, nodes, links: nextLinks });
          });
          return;
        }

        input.addEventListener("change", () => {
          const field = input.dataset.field as keyof FlowLink;
          const nextLinks = [...links];
          nextLinks[index] = { ...nextLinks[index], [field]: input.value };
          this.emitConfig({ ...this.safeConfig, nodes, links: nextLinks });
        });
      });

      row.querySelectorAll<HTMLButtonElement>("button[data-action='reset-link-color']").forEach((btn) => {
        btn.addEventListener("click", () => {
          const field = btn.dataset.field as "forwardColor" | "reverseColor";
          const nextLinks = [...links];
          const { [field]: _removed, ...rest } = nextLinks[index] as FlowLink & Record<string, unknown>;
          nextLinks[index] = rest as FlowLink;
          this.emitConfig({ ...this.safeConfig, nodes, links: nextLinks });
        });
      });

      row.querySelector<HTMLButtonElement>("button[data-action='remove-link']")?.addEventListener("click", () => {
        const nextLinks = links.filter((_, i) => i !== index);
        this.emitConfig({ ...this.safeConfig, nodes, links: nextLinks });
      });
    });

    root.querySelector<HTMLButtonElement>("button[data-action='add-node']")?.addEventListener("click", () => {
      const nextNodes = [
        ...nodes,
        {
          id: `node_${nodes.length + 1}`,
          name: `Node ${nodes.length + 1}`,
          x: 50,
          y: 50
        }
      ];
      this.emitConfig({ ...this.safeConfig, nodes: nextNodes, links });
    });

    root.querySelector<HTMLButtonElement>("button[data-action='add-link']")?.addEventListener("click", () => {
      if (nodes.length < 2) {
        return;
      }
      const nextLinks = [
        ...links,
        {
          from: nodes[0].id,
          to: nodes[1].id,
          entity: "",
          invert: false
        }
      ];
      this.emitConfig({ ...this.safeConfig, nodes, links: nextLinks });
    });

    root.querySelectorAll<HTMLElement>(".row[data-kind='link']").forEach((row, index) => {
      const selects = row.querySelectorAll<HTMLSelectElement>("select[data-field]");
      const link = links[index];
      if (selects[0]) {
        selects[0].value = link.from;
      }
      if (selects[1]) {
        selects[1].value = link.to;
      }
    });
  }

  private render(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    const root = this.shadowRoot;
    if (!root) {
      return;
    }

    const nodes = this.safeConfig.nodes && this.safeConfig.nodes.length > 0 ? this.safeConfig.nodes : DEFAULT_NODES;
    const links = this.safeConfig.links ?? DEFAULT_LINKS;

    root.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 8px 0;
          color: var(--primary-text-color);
          font-family: var(--paper-font-body1_-_font-family, sans-serif);
        }

        .editor {
          display: grid;
          gap: 14px;
        }

        .panel {
          display: grid;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--divider-color, rgba(128, 128, 128, 0.3));
          border-radius: 16px;
          background: var(--card-background-color, rgba(127, 127, 127, 0.06));
          min-width: 0;
        }

        .panel-title {
          margin: 0;
          font-size: 0.98rem;
          font-weight: 700;
        }

        .panel-copy {
          margin: -6px 0 0;
          color: var(--secondary-text-color);
          font-size: 0.84rem;
        }

        .layout-canvas-wrap {
          display: grid;
          gap: 10px;
        }

        .layout-toolbar {
          display: grid;
          grid-template-columns: minmax(120px, 0.8fr) 1fr 92px;
          gap: 8px;
          align-items: end;
        }

        .layout-toolbar input[type='range'] {
          padding: 0;
        }

        .layout-hint {
          color: var(--secondary-text-color);
          font-size: 0.82rem;
        }

        .flow-style-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .flow-style-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
        }

        .flow-style-row.checkbox-row {
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 10px;
        }

        .flow-style-row.checkbox-row input[type='checkbox'] {
          width: auto;
          min-width: 18px;
          min-height: 18px;
          margin: 0;
          padding: 0;
          accent-color: var(--primary-color, #03a9f4);
        }

        .flow-style-row input[type='color'] {
          min-height: 40px;
          padding: 4px;
        }

        .layout-canvas {
          position: relative;
          width: 100%;
          min-height: var(--layout-frame-min-height, 240px);
          aspect-ratio: var(--layout-frame-aspect, 1.45);
          border-radius: 18px;
          overflow: hidden;
          background:
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            radial-gradient(circle at 20% 20%, rgba(116, 224, 203, 0.18), transparent 40%),
            #0f2f3a;
          background-size: 28px 28px, 28px 28px, auto, auto;
          border: 1px solid rgba(255, 255, 255, 0.08);
          touch-action: none;
        }

        .layout-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .layout-lines line {
          stroke: rgba(255, 255, 255, 0.42);
          stroke-width: 1.2;
          stroke-dasharray: 4 4;
        }

        .layout-node {
          position: absolute;
          transform: translate(-50%, -50%);
          width: var(--layout-node-size, 18%);
          min-height: var(--layout-node-size, 18%);
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          padding: 0;
          display: grid;
          place-items: stretch;
          background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.08));
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 18px rgba(0, 0, 0, 0.2);
          cursor: grab;
          user-select: none;
          overflow: hidden;
          container-type: size;
        }

        .layout-editor-node-wrapper {
          position: absolute;
          padding: 0;
          border: none;
          background: transparent;
          cursor: grab;
          user-select: none;
          display: block;
          overflow: visible;
          z-index: 1;
          transform: translate(-50%, -50%);
          width: var(--layout-node-size, 18%);
          aspect-ratio: 1 / 1;
          container-type: size;
        }

        .layout-editor-node-wrapper:active {
          cursor: grabbing;
        }

        .layout-editor-node-wrapper article {
          pointer-events: none;
        }

        .layout-editor-node-inner {
          width: 100%;
          height: 100%;
          aspect-ratio: 1 / 1;
          position: relative;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.06));
          border: 1px solid rgba(255, 255, 255, 0.16);
          overflow: hidden;
          display: grid;
          place-items: center;
          container-type: size;
        }

        .layout-editor-node-inner.has-image {
          background: transparent;
        }

        .layout-editor-node-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          border-radius: 50%;
          filter: brightness(0.72) saturate(1.05);
          z-index: 0;
        }

        .layout-editor-node-content {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .layout-editor-node-media {
          position: absolute;
          left: 50%;
          top: calc(50% - clamp(16px, 34cqw, 48px) / 2 - 2px);
          transform: translateX(-50%);
          width: clamp(16px, 34cqw, 48px);
          height: clamp(16px, 34cqw, 48px);
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          font-weight: 700;
          font-size: clamp(8px, 12cqw, 14px);
          flex-shrink: 0;
        }

        .layout-editor-node-label {
          position: absolute;
          left: 50%;
          bottom: clamp(2px, 3cqw, 6px);
          transform: translateX(-50%);
          max-width: calc(100% - 8px);
          font-size: clamp(6px, 8cqw, 11px);
          line-height: 1;
          text-align: center;
          color: #f5fbfb;
          background: rgba(0, 0, 0, 0.52);
          padding: clamp(1px, 1.5cqw, 3px) clamp(2px, 3cqw, 4px);
          border-radius: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 0;
        }

        h4 {
          margin: 6px 0 2px;
        }

        .node-card {
          display: grid;
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid var(--divider-color, rgba(128, 128, 128, 0.3));
          background: color-mix(in srgb, var(--card-background-color, #1c1c1c) 82%, transparent);
          grid-template-columns: 1fr;
        }

        .node-card.collapsed {
          gap: 8px;
          padding: 8px 12px;
        }

        .node-card.collapsed > :not(.card-head):not(.remove-button) {
          display: none;
        }

        .remove-button {
          align-self: end;
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid rgba(220, 53, 69, 0.5);
          color: #dc3545;
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .remove-button:hover {
          background: rgba(220, 53, 69, 0.2);
          border-color: #dc3545;
        }

        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .collapse-toggle {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          padding: 0;
          border: none;
          background: transparent;
          color: currentColor;
          cursor: pointer;
          font-size: 12px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        .collapse-toggle:hover {
          opacity: 0.8;
        }

        .card-head strong {
          font-size: 0.95rem;
          flex: 1;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .node-grid,
        .metric-grid {
          display: grid;
          gap: 8px;
          grid-template-columns: 1fr;
          min-width: 0;
        }

        .metric-group {
          display: grid;
          gap: 8px;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid var(--divider-color, rgba(128, 128, 128, 0.3));
          background: color-mix(in srgb, var(--secondary-background-color, rgba(127, 127, 127, 0.08)) 78%, transparent);
        }

        .metric-group h5 {
          margin: 0;
          font-size: 0.8rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--secondary-text-color);
        }

        .entity-picker {
          position: relative;
        }

        .picker-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid var(--divider-color, rgba(128,128,128,0.35));
          background: var(--secondary-background-color, rgba(127,127,127,0.08));
          color: var(--secondary-text-color);
          cursor: pointer;
          font-size: 0.82rem;
          text-align: left;
          min-height: 40px;
        }

        .picker-trigger.has-value {
          color: var(--primary-text-color);
        }

        .picker-trigger:hover {
          border-color: var(--primary-color, #03a9f4);
        }

        .picker-trigger-main {
          display: flex;
          flex-direction: column;
          gap: 1px;
          overflow: hidden;
          flex: 1;
        }

        .picker-trigger-label {
          font-size: 0.85rem;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .picker-trigger-id {
          font-size: 0.72rem;
          opacity: 0.6;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .picker-trigger-arrow {
          flex-shrink: 0;
          font-size: 10px;
          opacity: 0.6;
        }

        .picker-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: auto;
          width: max(100%, 360px);
          max-width: min(560px, calc(100vw - 48px));
          z-index: 999;
          background: var(--card-background-color, #1c1c1c);
          border: 1px solid var(--primary-color, #03a9f4);
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          max-height: 300px;
          overflow: hidden;
        }

        .picker-search {
          flex-shrink: 0;
          border: none;
          border-bottom: 1px solid var(--divider-color, rgba(128,128,128,0.3));
          background: transparent;
          color: var(--primary-text-color);
          padding: 10px 12px;
          font-size: 0.85rem;
          outline: none;
          border-radius: 10px 10px 0 0;
        }

        .picker-options {
          overflow-y: auto;
          flex: 1;
        }

        .picker-group {
          display: flex;
          flex-direction: column;
        }

        .picker-group-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--secondary-text-color);
          padding: 6px 12px 4px;
          opacity: 0.7;
        }

        .picker-option {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 12px;
          cursor: pointer;
          transition: background 0.1s;
        }

        .picker-option[hidden],
        .picker-group[hidden],
        .picker-no-results[hidden] {
          display: none !important;
        }

        .picker-option:hover {
          background: rgba(255,255,255,0.06);
        }

        .picker-option.is-selected {
          background: rgba(3, 169, 244, 0.12);
        }

        .picker-option.picker-clear {
          border-bottom: 1px solid var(--divider-color, rgba(128,128,128,0.2));
          opacity: 0.65;
        }

        .picker-option-name {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--primary-text-color);
        }

        .picker-option-id {
          font-size: 0.72rem;
          color: var(--secondary-text-color);
          opacity: 0.75;
        }

        .picker-option.picker-clear .picker-option-name {
          font-style: italic;
        }

        .picker-no-results {
          padding: 10px 12px;
          font-size: 0.8rem;
          color: var(--secondary-text-color);
          opacity: 0.85;
          border-top: 1px solid var(--divider-color, rgba(128,128,128,0.2));
        }

        .image-tools {
          display: grid;
          gap: 8px;
          grid-template-columns: 1fr;
          align-items: start;
        }

        .upload-field input[type='file'] {
          background: transparent;
          padding: 8px 0 0;
          border: 0;
        }

        .image-preview {
          width: 84px;
          height: 84px;
          border-radius: 18px;
          overflow: hidden;
          border: 1px dashed rgba(128, 128, 128, 0.4);
          display: grid;
          place-items: center;
          background: var(--secondary-background-color, rgba(127, 127, 127, 0.08));
          color: var(--secondary-text-color);
          font-size: 0.74rem;
          text-align: center;
        }

        .image-preview.has-image {
          border-style: solid;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        label {
          display: grid;
          gap: 4px;
          font-size: 0.82rem;
          min-width: 0;
        }

        label > input,
        label > select,
        label > .entity-picker {
          min-width: 0;
          max-width: 100%;
        }

        label span {
          color: var(--secondary-text-color);
          font-weight: 600;
        }

        .row {
          display: grid;
          gap: 6px;
          grid-template-columns: 1fr;
          align-items: center;
        }

        .row[data-kind='link'] {
          grid-template-columns: 1fr;
        }

        .link-card {
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid var(--divider-color, rgba(128, 128, 128, 0.3));
          background: color-mix(in srgb, var(--card-background-color, #1c1c1c) 82%, transparent);
          display: grid;
          grid-template-columns: 1fr;
        }

        .link-card.collapsed {
          gap: 8px;
          padding: 8px 12px;
        }

        .link-card.collapsed > :not(.card-head):not(.remove-button) {
          display: none;
        }

        .link-hint {
          margin: 0;
          color: var(--secondary-text-color);
          font-size: 0.78rem;
        }

        .link-grid {
          display: grid;
          gap: 8px;
          grid-template-columns: 1fr;
          min-width: 0;
        }

        .link-wide {
          grid-column: 1 / -1;
        }

        .inline-toggle-row {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
        }

        .inline-toggle-row input {
          width: auto;
          margin: 0;
        }

        .color-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .color-row input[type="color"] {
          width: 44px;
          height: 32px;
          padding: 2px;
          border-radius: 6px;
          cursor: pointer;
        }

        .color-hint {
          font-size: 0.75rem;
          color: var(--secondary-text-color, rgba(128,128,128,0.8));
          font-style: italic;
        }

        .reset-color-btn {
          font-size: 0.75rem;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid var(--divider-color, rgba(128,128,128,0.35));
          background: transparent;
          color: var(--secondary-text-color, rgba(200,200,200,0.8));
          cursor: pointer;
          white-space: nowrap;
        }

        .reset-color-btn:hover {
          background: rgba(255,255,255,0.08);
        }

        @media (min-width: 980px) {
          .node-grid,
          .metric-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .metric-grid {
            grid-template-columns: 1fr;
          }

          .image-tools {
            grid-template-columns: minmax(0, 1fr) auto 84px;
            align-items: end;
          }

          .link-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .flow-style-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .flow-style-row.range {
            grid-template-columns: 1fr 92px;
            align-items: end;
          }
        }

        input,
        select,
        button {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--divider-color, rgba(128, 128, 128, 0.45));
          font-size: 0.86rem;
          background: var(--secondary-background-color, rgba(127, 127, 127, 0.08));
          color: var(--primary-text-color);
          box-sizing: border-box;
          width: 100%;
        }

        input:focus,
        select:focus,
        button:focus {
          outline: 2px solid var(--primary-color);
          outline-offset: 1px;
        }

        button {
          cursor: pointer;
          background: var(--primary-color);
          color: var(--text-primary-color, #fff);
          border-color: transparent;
          font-weight: 600;
        }

        button:hover {
          filter: brightness(1.05);
        }

        button[data-action='remove-node'],
        button[data-action='remove-link'],
        button[data-action='clear-image'] {
          background: var(--secondary-background-color, rgba(127, 127, 127, 0.08));
          color: var(--primary-text-color);
          border-color: var(--divider-color, rgba(128, 128, 128, 0.45));
        }

        .topline {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
        }

        .editor-version {
          justify-self: start;
          margin-top: 2px;
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--primary-text-color);
          background: color-mix(in srgb, var(--primary-color) 20%, transparent);
          border: 1px solid color-mix(in srgb, var(--primary-color) 48%, var(--divider-color, rgba(128, 128, 128, 0.35)));
          border-radius: 999px;
          padding: 4px 12px;
          line-height: 1;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .invert {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          padding: 0 4px;
        }

        .invert input {
          width: auto;
        }

        @media (max-width: 720px) {
          .image-tools,
          .row,
          .row[data-kind='link'] {
            grid-template-columns: 1fr;
          }

          .layout-toolbar {
            grid-template-columns: 1fr;
          }

          .layout-canvas {
            min-height: min(72vw, max(200px, var(--layout-frame-min-height, 240px)));
            aspect-ratio: max(1, var(--layout-frame-aspect, 1.15));
          }

          .layout-node {
            width: 82px;
            min-height: 82px;
          }

          .card-head {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      </style>

      <div class="editor">
        <section class="panel">
          <h3 class="panel-title">General</h3>
          <p class="panel-copy">Set the card title first. Then add devices and connect their flows below.</p>
          <div class="editor-version">Build v${this.safeText(CARD_VERSION)}</div>
          <div class="topline">
            <label>
              <span>Title</span>
              <input id="title" value="${this.safeText(this.safeConfig.title ?? "PV Flow")}" placeholder="PV Flow" />
            </label>
          </div>
        </section>

        <section class="panel">
          <h3 class="panel-title">Layout</h3>
          <p class="panel-copy">Place devices visually. The X and Y fields update while you drag.</p>
          ${this.renderLayoutCanvas(nodes, links)}
          <h4>Flow style</h4>
          <div class="flow-style-grid">
            <label class="flow-style-row">
              <span>Flow color (forward)</span>
              <input data-action="flow-style" data-kind="color" data-field="forwardColor" type="color" value="${this.safeText(this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).forwardColor)}" />
            </label>
            <label class="flow-style-row">
              <span>Flow color (reverse)</span>
              <input data-action="flow-style" data-kind="color" data-field="reverseColor" type="color" value="${this.safeText(this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).reverseColor)}" />
            </label>
            <label class="flow-style-row">
              <span>Flow color (idle)</span>
              <input data-action="flow-style" data-kind="color" data-field="idleColor" type="color" value="${this.safeText(this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).idleColor)}" />
            </label>
            <label class="flow-style-row">
              <span>Flow text color</span>
              <input data-action="flow-style" data-kind="color" data-field="textColor" type="color" value="${this.safeText(this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).textColor)}" />
            </label>
            <label class="flow-style-row range">
              <span>Line thickness</span>
              <input data-action="flow-style" data-kind="number" data-field="baseThickness" type="range" min="0.4" max="1.6" step="0.05" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).baseThickness.toFixed(2)}" />
              <input data-action="flow-style" data-kind="number" data-field="baseThickness" type="number" min="0.4" max="1.6" step="0.05" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).baseThickness.toFixed(2)}" />
            </label>
            <label class="flow-style-row">
              <span>Line pattern</span>
              <select data-action="flow-style" data-kind="select" data-field="linePattern">
                <option value="dashed" ${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).linePattern === "dashed" ? "selected" : ""}>Dashed animated</option>
                <option value="orb" ${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).linePattern === "orb" ? "selected" : ""}>Solid + moving orb</option>
              </select>
            </label>
            <label class="flow-style-row">
              <span>Speed curve</span>
              <select data-action="flow-style" data-kind="select" data-field="speedCurve">
                <option value="linear" ${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).speedCurve === "linear" ? "selected" : ""}>Linear (0 to max W)</option>
                <option value="log" ${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).speedCurve === "log" ? "selected" : ""}>Logarithmic</option>
              </select>
            </label>
            <label class="flow-style-row range">
              <span>Flow speed multiplier</span>
              <input data-action="flow-style" data-kind="number" data-field="speedMultiplier" type="range" min="0.3" max="3" step="0.1" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).speedMultiplier.toFixed(1)}" />
              <input data-action="flow-style" data-kind="number" data-field="speedMultiplier" type="number" min="0.3" max="3" step="0.1" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).speedMultiplier.toFixed(1)}" />
            </label>
            <label class="flow-style-row range">
              <span>Max watts for full speed/thickness</span>
              <input data-action="flow-style" data-kind="number" data-field="maxAnimatedWatts" type="range" min="1200" max="30000" step="100" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).maxAnimatedWatts.toFixed(0)}" />
              <input data-action="flow-style" data-kind="number" data-field="maxAnimatedWatts" type="number" min="1200" max="30000" step="100" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).maxAnimatedWatts.toFixed(0)}" />
            </label>
            <label class="flow-style-row checkbox-row">
              <span>Dynamic orb count by power (orb mode)</span>
              <input data-action="flow-style" data-kind="bool" data-field="dynamicOrbCount" type="checkbox" ${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).dynamicOrbCount ? "checked" : ""} />
            </label>
            <label class="flow-style-row range">
              <span>Orb count multiplier</span>
              <input data-action="flow-style" data-kind="number" data-field="orbCountMultiplier" type="range" min="0.2" max="6" step="0.1" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).orbCountMultiplier.toFixed(1)}" />
              <input data-action="flow-style" data-kind="number" data-field="orbCountMultiplier" type="number" min="0.2" max="6" step="0.1" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).orbCountMultiplier.toFixed(1)}" />
            </label>
            <label class="flow-style-row range">
              <span>Flow text size</span>
              <input data-action="flow-style" data-kind="number" data-field="textSize" type="range" min="1.1" max="3.3" step="0.1" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).textSize.toFixed(1)}" />
              <input data-action="flow-style" data-kind="number" data-field="textSize" type="number" min="1.1" max="3.3" step="0.1" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).textSize.toFixed(1)}" />
            </label>
            <label class="flow-style-row range">
              <span>Text border strength</span>
              <input data-action="flow-style" data-kind="number" data-field="textOutline" type="range" min="0" max="0.8" step="0.05" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).textOutline.toFixed(2)}" />
              <input data-action="flow-style" data-kind="number" data-field="textOutline" type="number" min="0" max="0.8" step="0.05" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).textOutline.toFixed(2)}" />
            </label>
          </div>
        </section>

        <section class="panel">
          <h3 class="panel-title">Devices</h3>
          <p class="panel-copy">Each device can show up to three values, for example power, SOC and daily energy.</p>
          ${this.renderNodeRows(nodes)}
          <div class="actions"><button data-action="add-node" type="button">Add device</button></div>
        </section>

        <section class="panel">
          <h3 class="panel-title">Flows</h3>
          <p class="panel-copy">Connect devices and assign a power sensor to control arrow direction.</p>
          ${this.renderLinkRows(links, nodes)}
          <div class="actions"><button data-action="add-link" type="button">Add flow</button></div>
        </section>
      </div>
    `;

    const titleInput = root.querySelector<HTMLInputElement>("#title");
    titleInput?.addEventListener("change", () => {
      this.emitConfig({ ...this.safeConfig, title: titleInput.value, nodes, links });
    });

    this.wireEvents(nodes, links);
  }
}

customElements.define("mergner-pv-card", MergnerPvCard);
customElements.define("mergner-pv-card-editor", MergnerPvCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "mergner-pv-card",
  name: "Mergner PV Card",
  description: "Dynamic PV flow card with visual editor",
  preview: true
});

declare global {
  interface Window {
    customCards: Array<{
      type: string;
      name: string;
      description: string;
      preview?: boolean;
    }>;
  }
}

export {};
