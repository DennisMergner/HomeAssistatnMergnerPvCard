// src/mergner-pv-card.ts
var CARD_VERSION = __MERGNER_PV_CARD_VERSION__;
var DEFAULT_NODES = [
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
var DEFAULT_LINKS = [
  { from: "solar", to: "house", entity: "sensor.pv_to_house_power" },
  { from: "solar", to: "battery", entity: "sensor.pv_to_battery_power" },
  { from: "battery", to: "house", entity: "sensor.battery_to_house_power" },
  { from: "grid", to: "house", entity: "sensor.grid_to_house_power" }
];
var DEFAULT_FLOW_STYLE = {
  forwardColor: "#74e0cb",
  reverseColor: "#ffb166",
  idleColor: "#7e8f92",
  textColor: "#d8fff6",
  baseThickness: 0.78,
  textSize: 1.7,
  textOutline: 0.28
};
var MergnerPvCard = class _MergnerPvCard extends HTMLElement {
  _config;
  _hass;
  static getConfigElement() {
    return document.createElement("mergner-pv-card-editor");
  }
  static getStubConfig() {
    return {
      type: "custom:mergner-pv-card",
      title: "PV Flow",
      nodes: DEFAULT_NODES,
      links: DEFAULT_LINKS
    };
  }
  setConfig(config) {
    if (!config || config.type !== "custom:mergner-pv-card") {
      throw new Error("Card type must be custom:mergner-pv-card");
    }
    this._config = config;
    this.render();
  }
  set hass(hass) {
    this._hass = hass;
    this.render();
  }
  getCardSize() {
    return 5;
  }
  connectedCallback() {
    this.render();
  }
  safeText(input) {
    return input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  clampPercent(value) {
    if (Number.isNaN(value)) {
      return 50;
    }
    return Math.max(2, Math.min(98, value));
  }
  clampMeterPercent(value) {
    if (Number.isNaN(value)) {
      return 0;
    }
    return Math.max(0, Math.min(100, value));
  }
  clampNodeSize(value) {
    if (Number.isNaN(value)) {
      return 120;
    }
    return Math.max(40, Math.min(320, value));
  }
  sanitizeHexColor(input, fallback) {
    const value = typeof input === "string" ? input.trim() : "";
    if (/^#([0-9a-fA-F]{6})$/.test(value) || /^#([0-9a-fA-F]{3})$/.test(value)) {
      return value;
    }
    return fallback;
  }
  normalizeFlowStyle(style) {
    const source = style ?? {};
    return {
      forwardColor: this.sanitizeHexColor(source.forwardColor, DEFAULT_FLOW_STYLE.forwardColor),
      reverseColor: this.sanitizeHexColor(source.reverseColor, DEFAULT_FLOW_STYLE.reverseColor),
      idleColor: this.sanitizeHexColor(source.idleColor, DEFAULT_FLOW_STYLE.idleColor),
      textColor: this.sanitizeHexColor(source.textColor, DEFAULT_FLOW_STYLE.textColor),
      baseThickness: Math.max(0.4, Math.min(1.6, Number(source.baseThickness ?? DEFAULT_FLOW_STYLE.baseThickness))),
      textSize: Math.max(1.1, Math.min(3.3, Number(source.textSize ?? DEFAULT_FLOW_STYLE.textSize))),
      textOutline: Math.max(0, Math.min(0.8, Number(source.textOutline ?? DEFAULT_FLOW_STYLE.textOutline)))
    };
  }
  getEntity(entityId) {
    if (!entityId || !this._hass?.states?.[entityId]) {
      return void 0;
    }
    return this._hass.states[entityId];
  }
  getState(entityId) {
    return this.getEntity(entityId)?.state ?? "n/a";
  }
  isEmptyState(value) {
    return !value || value === "n/a" || value === "unavailable" || value === "unknown";
  }
  getUnit(entityId) {
    const attributes = this.getEntity(entityId)?.attributes;
    const unit = attributes?.unit_of_measurement;
    return typeof unit === "string" ? unit : "";
  }
  parseNumber(entityId) {
    const raw = this.getState(entityId);
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : 0;
  }
  getNodeRole(node) {
    return node.role ?? "custom";
  }
  roleLabel(role) {
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
  defaultMetricLabel(role, slot) {
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
  formatMetricValue(value, unit) {
    const trimmedValue = value.trim();
    const trimmedUnit = unit.trim();
    return trimmedUnit ? `${trimmedValue} ${trimmedUnit}` : trimmedValue;
  }
  getNodeMetrics(node) {
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
    return slots.filter((slot) => slot.showWhenEmpty || Boolean(slot.entity?.trim())).map((slot) => {
      const value = slot.entity ? this.getState(slot.entity) : "n/a";
      const resolvedUnit = slot.unit ?? (slot.entity ? this.getUnit(slot.entity) : "");
      return {
        label: slot.label?.trim() || slot.defaultLabel,
        value,
        numericValue: slot.entity ? this.parseNumber(slot.entity) : Number.NaN,
        unit: resolvedUnit
      };
    });
  }
  getBatteryLevel(metrics) {
    const levelMetric = metrics.find(
      (metric) => metric.unit === "%" || /soc|state of charge|akku|charge|level/i.test(metric.label)
    );
    if (!levelMetric || Number.isNaN(levelMetric.numericValue)) {
      return void 0;
    }
    return this.clampMeterPercent(levelMetric.numericValue);
  }
  getSummaryUnit(nodes) {
    for (const node of nodes) {
      const unit = node.unit?.trim() || this.getUnit(node.entity);
      if (unit) {
        return unit;
      }
    }
    return "";
  }
  renderSummary(nodes) {
    const groups = [
      { role: "pv", label: "Erzeugung", className: "pv" },
      { role: "house", label: "Verbrauch", className: "house" },
      { role: "battery", label: "Batterie", className: "battery" },
      { role: "grid", label: "Netz", className: "grid" }
    ];
    const items = groups.map((group) => {
      const matchingNodes = nodes.filter((node) => this.getNodeRole(node) === group.role && node.entity?.trim());
      if (matchingNodes.length === 0) {
        return "";
      }
      const total = matchingNodes.reduce((sum, node) => sum + this.parseNumber(node.entity), 0);
      const unit = this.getSummaryUnit(matchingNodes);
      const value = this.formatMetricValue(total.toFixed(Math.abs(total) >= 100 ? 0 : 1), unit);
      return `
          <div class="summary-chip ${group.className}">
            <span>${this.safeText(group.label)}</span>
            <strong>${this.safeText(value)}</strong>
          </div>
        `;
    }).join("");
    if (!items.trim()) {
      return "";
    }
    return `<div class="summary-row">${items}</div>`;
  }
  normalizeConfig(config) {
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
        y: this.clampPercent(Number(node.y))
      }));
      const links = (config.links ?? []).filter(
        (link) => nodes.some((n) => n.id === link.from) && nodes.some((n) => n.id === link.to)
      );
      return { title, nodes, links, flowStyle };
    }
    const legacyNodes = DEFAULT_NODES.map((node) => ({
      ...node,
      entity: config.entities?.[node.id],
      image: config.images?.[node.id]
    }));
    return {
      title,
      nodes: legacyNodes,
      links: DEFAULT_LINKS,
      flowStyle
    };
  }
  toNodeSizePercent(size) {
    const clamped = this.clampNodeSize(size);
    const percent = clamped / 120 * 18;
    return Math.max(8, Math.min(36, percent));
  }
  fitNodesToCard(nodes) {
    const baseNodes = nodes.map((node) => ({
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
  renderNode(node) {
    const role = this.getNodeRole(node);
    const metrics = this.getNodeMetrics(node);
    const primaryMetric = metrics[0];
    const extraMetrics = metrics.slice(1);
    const batteryLevel = role === "battery" ? this.getBatteryLevel(metrics) : void 0;
    const safeName = this.safeText(node.name);
    const nodeSize = Math.max(4, Math.min(40, node.renderSize));
    const image = node.image?.trim();
    const media = `<div class="fallback-icon">${safeName.slice(0, 1)}</div>`;
    const batteryStateClass = role === "battery" && primaryMetric && !Number.isNaN(primaryMetric.numericValue) ? primaryMetric.numericValue > 0 ? "is-charging" : primaryMetric.numericValue < 0 ? "is-discharging" : "is-idle" : "";
    const extraMetricMarkup = extraMetrics.map(
      (metric) => `
          <div class="node-stat">
            <span>${this.safeText(metric.label)}</span>
            <strong>${this.safeText(this.formatMetricValue(metric.value, metric.unit))}</strong>
          </div>
        `
    ).join("");
    const batteryMeter = batteryLevel === void 0 ? "" : `
          <div class="battery-meter" aria-label="Battery level ${batteryLevel}%">
            <div class="battery-meter-fill" style="width:${batteryLevel}%;"></div>
          </div>
        `;
    return `
      <article class="node node-${role} ${batteryStateClass}" style="--node-size:${nodeSize}%; left:${this.clampPercent(node.x)}%; top:${this.clampPercent(node.y)}%;">
        <div class="node-orb ${image ? "has-image" : ""}">
          ${image ? `<img class="node-bg-image" src="${this.safeText(image)}" alt="${safeName}" loading="lazy" />` : ""}
          <div class="node-overlay">
            ${image ? "" : `<div class="node-media">${media}</div>`}
            <div class="node-kicker node-chip">${this.safeText(this.roleLabel(role))}</div>
            <div class="node-label node-chip">${safeName}</div>
            ${primaryMetric && !this.isEmptyState(primaryMetric.value) ? `<div class="node-value node-chip">${this.safeText(this.formatMetricValue(primaryMetric.value, primaryMetric.unit))}</div>` : ""}
            ${primaryMetric && !this.isEmptyState(primaryMetric.value) ? `<div class="node-value-label node-chip">${this.safeText(primaryMetric.label)}</div>` : ""}
            ${batteryMeter}
          </div>
        </div>
        ${extraMetricMarkup ? `<div class="node-stats">${extraMetricMarkup}</div>` : ""}
      </article>
    `;
  }
  getLineAnnotationOffset(position) {
    return position === "bottom" ? 3.6 : -3.6;
  }
  toWatts(value, unit) {
    const trimmed = unit.trim().toLowerCase();
    if (!Number.isFinite(value)) {
      return 0;
    }
    if (trimmed === "kw") {
      return value * 1e3;
    }
    if (trimmed === "mw") {
      return value * 1e6;
    }
    return value;
  }
  getEntityPowerWatts(entityId) {
    if (!entityId?.trim()) {
      return 0;
    }
    const raw = Math.abs(this.parseNumber(entityId));
    return this.toWatts(raw, this.getUnit(entityId));
  }
  getSignedFlowPowerWatts(link) {
    const hasDirectionalEntities = Boolean(link.forwardEntity?.trim() || link.reverseEntity?.trim());
    if (hasDirectionalEntities) {
      const forward = this.getEntityPowerWatts(link.forwardEntity);
      const reverse = this.getEntityPowerWatts(link.reverseEntity);
      let signed2 = 0;
      if (forward > 0 || reverse > 0) {
        if (forward >= reverse) {
          signed2 = forward;
        } else {
          signed2 = -reverse;
        }
      }
      return link.invert ? -signed2 : signed2;
    }
    if (!link.entity?.trim()) {
      return 0;
    }
    const rawValue = this.parseNumber(link.entity);
    const signed = this.toWatts(rawValue, this.getUnit(link.entity));
    return link.invert ? -signed : signed;
  }
  getLinkValue(link) {
    if (link.valueEntity?.trim()) {
      const value = this.getState(link.valueEntity);
      const unit = link.valueUnit ?? this.getUnit(link.valueEntity);
      return this.formatMetricValue(value, unit);
    }
    const signedPower = this.getSignedFlowPowerWatts(link);
    if (signedPower === 0) {
      return "";
    }
    const activeDirectionalEntity = signedPower > 0 ? link.forwardEntity?.trim() || "" : link.reverseEntity?.trim() || "";
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
  resolveLinkDirection(link) {
    const value = this.getSignedFlowPowerWatts(link);
    if (value > 0) {
      return "forward";
    }
    if (value < 0) {
      return "reverse";
    }
    return "idle";
  }
  getLinkDirectionalLabel(link, direction) {
    if (direction === "forward" && link.forwardLabel?.trim()) {
      return link.forwardLabel.trim();
    }
    if (direction === "reverse" && link.reverseLabel?.trim()) {
      return link.reverseLabel.trim();
    }
    return link.label?.trim() ?? "";
  }
  getLinkPowerWatts(link) {
    const absValue = Math.abs(this.getSignedFlowPowerWatts(link));
    if (!Number.isFinite(absValue)) {
      return 0;
    }
    return absValue;
  }
  getFlowStrokeWidth(powerWatts, direction, baseThickness) {
    if (direction === "idle") {
      return Math.max(0.35, 0.56 * baseThickness);
    }
    const normalized = Math.min(1, Math.sqrt(powerWatts / 7e3));
    return (0.56 + normalized * 0.98) * baseThickness;
  }
  getFlowDashLength(powerWatts, direction) {
    if (direction === "idle") {
      return 2.8;
    }
    const normalized = Math.min(1, Math.log10(powerWatts + 1) / 4);
    return 2.8 + normalized * 2.2;
  }
  getFlowDurationSeconds(powerWatts, direction) {
    if (direction === "idle") {
      return 2.6;
    }
    const normalized = Math.min(1, Math.log10(powerWatts + 1) / 4);
    return 2.2 - normalized * 1.65;
  }
  renderLinks(nodes, links, flowStyle) {
    const lookup = new Map(nodes.map((node) => [node.id, node]));
    const lines = links.map((link) => {
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
      const strokeWidth = this.getFlowStrokeWidth(powerWatts, direction, flowStyle.baseThickness);
      const dashLength = this.getFlowDashLength(powerWatts, direction);
      const dashGap = Math.max(2.2, dashLength * 0.85);
      const durationSeconds = this.getFlowDurationSeconds(powerWatts, direction);
      const lineStyle = `--flow-stroke:${strokeWidth.toFixed(2)}; --flow-dash:${dashLength.toFixed(2)}; --flow-gap:${dashGap.toFixed(2)}; --flow-duration:${durationSeconds.toFixed(2)}s;`;
      const title = labelText ? `<title>${this.safeText(labelText)}</title>` : "";
      const labelMarkup = labelText ? `<text class="flow-annotation flow-annotation-label" x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle">${this.safeText(labelText)}</text>` : "";
      const valueMarkup = valueText ? `<text class="flow-annotation flow-annotation-value" x="${valueX}" y="${valueY}" text-anchor="middle" dominant-baseline="middle">${this.safeText(valueText)}</text>` : "";
      return `<g class="flow-edge"><line class="flow-line ${direction}" style="${lineStyle}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}">${title}</line>${labelMarkup}${valueMarkup}</g>`;
    }).join("");
    return `<svg class="line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>`;
  }
  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    const root = this.shadowRoot;
    if (!root) {
      return;
    }
    const normalized = this.normalizeConfig(this._config ?? _MergnerPvCard.getStubConfig());
    const fittedNodes = this.fitNodesToCard(normalized.nodes);
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
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }

        .summary-chip {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 8px 10px;
          display: grid;
          gap: 2px;
          backdrop-filter: blur(4px);
        }

        .summary-chip span {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--pv-card-muted);
        }

        .summary-chip strong {
          font-size: 1rem;
        }

        .summary-chip.pv strong {
          color: #9cf0a5;
        }

        .summary-chip.house strong {
          color: #f5f7fa;
        }

        .summary-chip.battery strong {
          color: #8de0ff;
        }

        .summary-chip.grid strong {
          color: #ffc983;
        }

        .flow-wrap {
          position: relative;
          min-height: clamp(180px, 42vw, 520px);
          aspect-ratio: 4 / 3;
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
          stroke-dasharray: var(--flow-dash, 3.2) var(--flow-gap, 3.2);
          animation: flow var(--flow-duration, 1.5s) linear infinite;
        }

        .flow-line.forward {
          stroke: var(--flow-forward);
        }

        .flow-line.reverse {
          stroke: var(--flow-reverse);
          animation-direction: reverse;
        }

        .flow-line.idle {
          stroke: var(--flow-idle);
          opacity: 0.58;
          animation-play-state: paused;
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
        }

        .node-orb {
          width: 100%;
          height: 100%;
          min-height: 0;
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

        .node-overlay {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: grid;
          align-content: start;
          justify-items: center;
          gap: 4px;
          padding: 10px 10px 8px;
          box-sizing: border-box;
        }

        .node-orb.has-image {
          background: transparent;
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
          font-size: 0.84rem;
          font-weight: 700;
          margin-top: 2px;
          max-width: 100px;
        }

        .node-kicker {
          color: var(--pv-card-muted);
          font-size: 0.64rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .node-value {
          margin-top: 3px;
          font-size: 0.97rem;
          font-weight: 700;
        }

        .node-value-label {
          margin-top: 2px;
          color: var(--pv-card-muted);
          font-size: 0.67rem;
        }

        .node-chip {
          background: rgba(0, 0, 0, 0.52);
          color: #ffffff;
          border-radius: 8px;
          padding: 2px 7px;
          line-height: 1.2;
        }

        .node-stats {
          margin-top: 8px;
          display: grid;
          gap: 4px;
          text-align: left;
          background: rgba(4, 15, 21, 0.48);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 8px 10px;
          backdrop-filter: blur(4px);
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

        .battery-meter {
          width: 100%;
          height: 6px;
          margin-top: 8px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.12);
        }

        .battery-meter-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #6edb7a 0%, #9ff6b0 100%);
        }

        .node-battery.is-charging {
          filter: drop-shadow(0 0 16px rgba(116, 224, 203, 0.18));
        }

        .node-battery.is-discharging {
          filter: drop-shadow(0 0 16px rgba(255, 177, 102, 0.18));
        }

        @media (max-width: 640px) {
          .flow-wrap {
            min-height: 260px;
            aspect-ratio: 1 / 1;
          }

          .node {
            width: min(58vw, var(--node-size));
            aspect-ratio: 1 / 1;
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
};
var MergnerPvCardEditor = class extends HTMLElement {
  _config;
  _hass;
  _dragNodeIndex;
  _dragEventsBound = false;
  _entityIdsSignature = "";
  _layoutZoom = 100;
  _layoutZoomMode = "auto";
  _collapsedSections = /* @__PURE__ */ new Set();
  clampEditorNodeSize(value) {
    if (Number.isNaN(value)) {
      return 120;
    }
    return Math.max(40, Math.min(320, value));
  }
  clampFlowSetting(value, min, max, fallback) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, value));
  }
  sanitizeEditorHexColor(input, fallback) {
    const value = typeof input === "string" ? input.trim() : "";
    if (/^#([0-9a-fA-F]{6})$/.test(value) || /^#([0-9a-fA-F]{3})$/.test(value)) {
      return value;
    }
    return fallback;
  }
  normalizeEditorFlowStyle(style) {
    const source = style ?? {};
    return {
      forwardColor: this.sanitizeEditorHexColor(source.forwardColor, DEFAULT_FLOW_STYLE.forwardColor),
      reverseColor: this.sanitizeEditorHexColor(source.reverseColor, DEFAULT_FLOW_STYLE.reverseColor),
      idleColor: this.sanitizeEditorHexColor(source.idleColor, DEFAULT_FLOW_STYLE.idleColor),
      textColor: this.sanitizeEditorHexColor(source.textColor, DEFAULT_FLOW_STYLE.textColor),
      baseThickness: this.clampFlowSetting(Number(source.baseThickness ?? DEFAULT_FLOW_STYLE.baseThickness), 0.4, 1.6, DEFAULT_FLOW_STYLE.baseThickness),
      textSize: this.clampFlowSetting(Number(source.textSize ?? DEFAULT_FLOW_STYLE.textSize), 1.1, 3.3, DEFAULT_FLOW_STYLE.textSize),
      textOutline: this.clampFlowSetting(Number(source.textOutline ?? DEFAULT_FLOW_STYLE.textOutline), 0, 0.8, DEFAULT_FLOW_STYLE.textOutline)
    };
  }
  safeText(input) {
    const text = typeof input === "string" ? input : String(input ?? "");
    return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  clampEditorPercent(value) {
    if (Number.isNaN(value)) {
      return 50;
    }
    return Math.max(2, Math.min(98, value));
  }
  getNodeRadiusPercent(node) {
    const size = this.clampEditorNodeSize(Number(node.size ?? 120));
    const diameterPercent = Math.max(8, Math.min(36, size / 120 * 18));
    return diameterPercent / 2;
  }
  clampNodePosition(node, x, y) {
    const radius = this.getNodeRadiusPercent(node);
    const min = Math.max(2, radius);
    const max = Math.min(98, 100 - radius);
    return {
      x: Math.max(min, Math.min(max, this.clampEditorPercent(x))),
      y: Math.max(min, Math.min(max, this.clampEditorPercent(y)))
    };
  }
  normalizeEditorConfig(config) {
    const base = MergnerPvCard.getStubConfig();
    const incoming = config ?? {};
    const merged = {
      ...base,
      ...incoming,
      title: (incoming.title ?? base.title ?? "PV Flow").toString(),
      flowStyle: this.normalizeEditorFlowStyle(incoming.flowStyle)
    };
    const rawNodes = Array.isArray(incoming.nodes) && incoming.nodes.length > 0 ? incoming.nodes : base.nodes ?? [];
    const nodes = rawNodes.map((node, index) => {
      const normalizedNode = {
        ...node,
        id: (node.id ?? `node_${index + 1}`).toString().trim() || `node_${index + 1}`,
        name: (node.name ?? `Node ${index + 1}`).toString().trim() || `Node ${index + 1}`,
        role: node.role ?? "custom",
        x: this.clampEditorPercent(Number(node.x)),
        y: this.clampEditorPercent(Number(node.y)),
        size: this.clampEditorNodeSize(Number(node.size ?? 120))
      };
      const clampedPosition = this.clampNodePosition(normalizedNode, normalizedNode.x, normalizedNode.y);
      return {
        ...normalizedNode,
        ...clampedPosition
      };
    });
    const validIds = new Set(nodes.map((node) => node.id));
    const rawLinks = Array.isArray(incoming.links) ? incoming.links : base.links ?? [];
    const links = rawLinks.filter((link) => validIds.has(link.from) && validIds.has(link.to));
    return {
      ...merged,
      nodes,
      links
    };
  }
  setConfig(config) {
    this._config = this.normalizeEditorConfig(config);
    this.render();
  }
  set hass(hass) {
    const nextEntityIdsSignature = Object.keys(hass?.states ?? {}).sort((left, right) => left.localeCompare(right)).join("|");
    const shouldRender = !this._hass || nextEntityIdsSignature !== this._entityIdsSignature;
    this._hass = hass;
    this._entityIdsSignature = nextEntityIdsSignature;
    if (shouldRender) {
      this.render();
    }
  }
  connectedCallback() {
    this.bindDragEvents();
    this.render();
  }
  get safeConfig() {
    return this._config ?? MergnerPvCard.getStubConfig();
  }
  emitConfig(newConfig) {
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
  updateNode(nodes, links, index, patch) {
    const nextNodes = [...nodes];
    const mergedNode = { ...nextNodes[index], ...patch };
    const clampedPosition = this.clampNodePosition(mergedNode, Number(mergedNode.x), Number(mergedNode.y));
    nextNodes[index] = {
      ...mergedNode,
      ...clampedPosition,
      size: this.clampEditorNodeSize(Number(mergedNode.size ?? 120))
    };
    this.emitConfig({ ...this.safeConfig, nodes: nextNodes, links });
  }
  bindDragEvents() {
    if (this._dragEventsBound) {
      return;
    }
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointercancel", this.handlePointerUp);
    this._dragEventsBound = true;
  }
  disconnectedCallback() {
    if (!this._dragEventsBound) {
      return;
    }
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("pointercancel", this.handlePointerUp);
    this._dragEventsBound = false;
  }
  getEntityIds() {
    return Object.keys(this._hass?.states ?? {}).sort((left, right) => left.localeCompare(right));
  }
  getEntityUnit(entityId) {
    const attributes = this._hass?.states?.[entityId]?.attributes;
    const unit = attributes?.unit_of_measurement;
    return typeof unit === "string" ? unit : "";
  }
  getEntityDeviceClass(entityId) {
    const attributes = this._hass?.states?.[entityId]?.attributes;
    const deviceClass = attributes?.device_class;
    return typeof deviceClass === "string" ? deviceClass : "";
  }
  matchesEntityFilter(entityId, filter) {
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
  getNodeEntityFilter(node, field) {
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
  renderEntitySelect(selectorId, field, value, placeholder = "Select entity", filter = "any") {
    const entityIds = this.getEntityIds();
    const selectedValue = value?.trim() ?? "";
    const customOption = selectedValue && !entityIds.includes(selectedValue) ? `<option value="${this.safeText(selectedValue)}" selected>${this.safeText(selectedValue)}</option>` : "";
    const preferredEntityIds = entityIds.filter((entityId) => this.matchesEntityFilter(entityId, filter));
    const remainingEntityIds = entityIds.filter((entityId) => !preferredEntityIds.includes(entityId));
    const renderOptions = (options) => options.map((entityId) => {
      const selected = entityId === selectedValue ? "selected" : "";
      return `<option value="${this.safeText(entityId)}" ${selected}>${this.safeText(entityId)}</option>`;
    }).join("");
    const preferredGroup = preferredEntityIds.length > 0 ? `<optgroup label="Recommended">${renderOptions(preferredEntityIds)}</optgroup>` : "";
    const allGroup = remainingEntityIds.length > 0 ? `<optgroup label="All entities">${renderOptions(remainingEntityIds)}</optgroup>` : "";
    return `
      <div class="entity-select-wrap">
        <input
          type="search"
          data-action="entity-search"
          data-target="${this.safeText(selectorId)}"
          placeholder="Search entities..."
          aria-label="Search entities"
        />
        <select data-field="${String(field)}" data-entity-select-id="${this.safeText(selectorId)}">
          <option value="">${this.safeText(placeholder)}</option>
          ${customOption}
          ${preferredGroup}
          ${allGroup}
        </select>
      </div>
    `;
  }
  renderLayoutCanvas(nodes, links) {
    const lookup = new Map(nodes.map((node) => [node.id, node]));
    const effectiveZoom = this.getEffectiveLayoutZoom(nodes);
    const lines = links.map((link) => {
      const from = lookup.get(link.from);
      const to = lookup.get(link.to);
      if (!from || !to) {
        return "";
      }
      const x1 = this.projectLayoutPosition(from.x, effectiveZoom);
      const y1 = this.projectLayoutPosition(from.y, effectiveZoom);
      const x2 = this.projectLayoutPosition(to.x, effectiveZoom);
      const y2 = this.projectLayoutPosition(to.y, effectiveZoom);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`;
    }).join("");
    const nodeMarkup = nodes.map((node, index) => {
      const image = node.image?.trim();
      const media = `<span>${this.safeText(node.name.slice(0, 1).toUpperCase())}</span>`;
      const zoomFactor = effectiveZoom / 100;
      const layoutSize = Math.max(24, Math.min(220, Math.round((node.size ?? 120) * zoomFactor)));
      const projectedX = this.projectLayoutPosition(node.x, effectiveZoom);
      const projectedY = this.projectLayoutPosition(node.y, effectiveZoom);
      return `
          <button
            class="layout-node ${image ? "has-image" : ""}"
            data-action="drag-node"
            data-index="${index}"
            type="button"
            style="--layout-node-size:${layoutSize}px; left:${projectedX}%; top:${projectedY}%;"
            aria-label="Drag ${this.safeText(node.name)}"
          >
            ${image ? `<img class="layout-node-bg-image" src="${this.safeText(image)}" alt="${this.safeText(node.name)}" />` : ""}
            <div class="layout-node-overlay ${image ? "with-image" : ""}">
              ${image ? "" : `<div class="layout-node-media">${media}</div>`}
              <div class="layout-node-label">${this.safeText(node.name)}</div>
            </div>
          </button>
        `;
    }).join("");
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
        <div class="layout-canvas">
          <svg class="layout-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
          ${nodeMarkup}
        </div>
      </div>
    `;
  }
  startNodeDrag(index) {
    this._dragNodeIndex = index;
  }
  getEffectiveLayoutZoom(nodes) {
    if (this._layoutZoomMode === "manual") {
      return this._layoutZoom;
    }
    const maxNodeSize = Math.max(...nodes.map((node) => this.clampEditorNodeSize(Number(node.size ?? 120))), 120);
    const densityFactor = nodes.length >= 8 ? 0.84 : nodes.length >= 6 ? 0.9 : nodes.length >= 4 ? 0.96 : 1;
    const targetNodePx = 96;
    const autoZoom = Math.round(targetNodePx / maxNodeSize * 100 * densityFactor);
    return Math.max(65, Math.min(160, autoZoom));
  }
  projectLayoutPosition(value, zoom) {
    const factor = zoom / 100;
    const projected = 50 + (value - 50) * factor;
    return Math.max(0, Math.min(100, projected));
  }
  unprojectLayoutPosition(value, zoom) {
    const factor = zoom / 100;
    if (factor <= 0) {
      return value;
    }
    const unprojected = 50 + (value - 50) / factor;
    return this.clampEditorPercent(unprojected);
  }
  handlePointerMove = (event) => {
    if (this._dragNodeIndex === void 0) {
      return;
    }
    const root = this.shadowRoot;
    const canvas = root?.querySelector(".layout-canvas");
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
    const xEdgePadding = layoutSize / 2 / rect.width * 100;
    const yEdgePadding = layoutSize / 2 / rect.height * 100;
    const xInCanvas = Math.max(xEdgePadding, Math.min(100 - xEdgePadding, (event.clientX - rect.left) / rect.width * 100));
    const yInCanvas = Math.max(yEdgePadding, Math.min(100 - yEdgePadding, (event.clientY - rect.top) / rect.height * 100));
    const x = this.unprojectLayoutPosition(xInCanvas, effectiveZoom);
    const y = this.unprojectLayoutPosition(yInCanvas, effectiveZoom);
    this.updateNode(nodes, links, this._dragNodeIndex, { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) });
  };
  handlePointerUp = () => {
    this._dragNodeIndex = void 0;
  };
  readFileAsDataUrl(file) {
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
  renderNodeRows(nodes) {
    const roleOptions = ["pv", "battery", "house", "grid", "inverter", "custom"];
    return nodes.map(
      (node, idx) => {
        const sectionKey = `node-${idx}`;
        const isCollapsed = this._collapsedSections.has(sectionKey);
        return `
          <section class="node-card ${isCollapsed ? "collapsed" : ""}" data-kind="node" data-index="${idx}">
            <div class="card-head">
              <button class="collapse-toggle" data-action="toggle-section" data-section="${sectionKey}" type="button">${isCollapsed ? "\u25B6" : "\u25BC"}</button>
              <strong>${this.safeText(node.name || node.id)}</strong>
              <button data-action="remove-node" type="button">Remove</button>
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
                  ${roleOptions.map(
          (role) => `<option value="${role}" ${(node.role ?? "custom") === role ? "selected" : ""}>${role}</option>`
        ).join("")}
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
          </section>
        `;
      }
    ).join("");
  }
  renderLinkRows(links, nodes) {
    const options = nodes.map((node) => `<option value="${this.safeText(node.id)}">${this.safeText(node.name)} (${this.safeText(node.id)})</option>`).join("");
    return links.map(
      (link, idx) => {
        const sectionKey = `link-${idx}`;
        const isCollapsed = this._collapsedSections.has(sectionKey);
        const fromNodeName = nodes.find((n) => n.id === link.from)?.name || link.from;
        const toNodeName = nodes.find((n) => n.id === link.to)?.name || link.to;
        return `
          <section class="row link-card ${isCollapsed ? "collapsed" : ""}" data-kind="link" data-index="${idx}">
            <div class="card-head">
              <button class="collapse-toggle" data-action="toggle-section" data-section="${sectionKey}" type="button">${isCollapsed ? "\u25B6" : "\u25BC"}</button>
              <strong>${this.safeText(fromNodeName)} \u2192 ${this.safeText(toNodeName)}</strong>
              <button data-action="remove-link" type="button">Remove flow</button>
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
            </div>
            `}
          </section>
        `;
      }
    ).join("");
  }
  wireEvents(nodes, links) {
    const root = this.shadowRoot;
    if (!root) {
      return;
    }
    root.querySelectorAll("button[data-action='toggle-section']").forEach((button) => {
      button.addEventListener("click", () => {
        const section = button.dataset.section;
        if (!section) {
          return;
        }
        if (this._collapsedSections.has(section)) {
          this._collapsedSections.delete(section);
        } else {
          this._collapsedSections.add(section);
        }
        this.render();
      });
    });
    root.querySelectorAll("input[data-action='entity-search']").forEach((searchInput) => {
      searchInput.addEventListener("input", () => {
        const target = searchInput.dataset.target;
        if (!target) {
          return;
        }
        const select = root.querySelector(`select[data-entity-select-id='${target}']`);
        if (!select) {
          return;
        }
        const term = searchInput.value.trim().toLowerCase();
        select.querySelectorAll("option").forEach((option) => {
          if (!option.value) {
            option.hidden = false;
            return;
          }
          const optionText = (option.textContent ?? "").toLowerCase();
          const optionValue = option.value.toLowerCase();
          const isSelected = option.selected;
          option.hidden = term.length > 0 && !isSelected && !optionText.includes(term) && !optionValue.includes(term);
        });
      });
    });
    root.querySelectorAll("input[data-action='layout-zoom']").forEach((input) => {
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
    root.querySelector("select[data-action='layout-zoom-mode']")?.addEventListener("change", (event) => {
      const select = event.currentTarget;
      if (select.value === "auto" || select.value === "manual") {
        this._layoutZoomMode = select.value;
        this.render();
      }
    });
    root.querySelectorAll("input[data-action='flow-style']").forEach((input) => {
      const eventName = input.type === "range" ? "input" : "change";
      input.addEventListener(eventName, () => {
        const field = input.dataset.field;
        if (!field) {
          return;
        }
        const current = this.normalizeEditorFlowStyle(this.safeConfig.flowStyle);
        const next = { ...current };
        if (input.dataset.kind === "color") {
          const colorField = field;
          next[colorField] = input.value;
        } else {
          const numericField = field;
          next[numericField] = Number(input.value);
        }
        this.emitConfig({ ...this.safeConfig, flowStyle: this.normalizeEditorFlowStyle(next), nodes, links });
      });
    });
    root.querySelectorAll(".node-card[data-kind='node']").forEach((row, index) => {
      row.querySelectorAll("input[data-field], select[data-field]").forEach((input) => {
        input.addEventListener("change", () => {
          const field = input.dataset.field;
          const value = input instanceof HTMLInputElement && input.type === "number" ? Number(input.value) : input.value;
          this.updateNode(nodes, links, index, { [field]: value });
        });
      });
      row.querySelector("input[data-action='upload-image']")?.addEventListener("change", async (event) => {
        const target = event.currentTarget;
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
      row.querySelector("button[data-action='clear-image']")?.addEventListener("click", () => {
        this.updateNode(nodes, links, index, { image: "" });
      });
      row.querySelector("button[data-action='remove-node']")?.addEventListener("click", () => {
        const nextNodes = nodes.filter((_, i) => i !== index);
        const validIds = new Set(nextNodes.map((node) => node.id));
        const nextLinks = links.filter((link) => validIds.has(link.from) && validIds.has(link.to));
        this.emitConfig({ ...this.safeConfig, nodes: nextNodes, links: nextLinks });
      });
    });
    root.querySelectorAll("button[data-action='drag-node']").forEach((button) => {
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
    root.querySelectorAll(".row[data-kind='link']").forEach((row, index) => {
      row.querySelectorAll("input[data-field], select[data-field]").forEach((input) => {
        if (input instanceof HTMLInputElement && input.type === "checkbox") {
          input.addEventListener("change", () => {
            const nextLinks = [...links];
            nextLinks[index] = { ...nextLinks[index], invert: input.checked };
            this.emitConfig({ ...this.safeConfig, nodes, links: nextLinks });
          });
          return;
        }
        input.addEventListener("change", () => {
          const field = input.dataset.field;
          const nextLinks = [...links];
          nextLinks[index] = { ...nextLinks[index], [field]: input.value };
          this.emitConfig({ ...this.safeConfig, nodes, links: nextLinks });
        });
      });
      row.querySelector("button[data-action='remove-link']")?.addEventListener("click", () => {
        const nextLinks = links.filter((_, i) => i !== index);
        this.emitConfig({ ...this.safeConfig, nodes, links: nextLinks });
      });
    });
    root.querySelector("button[data-action='add-node']")?.addEventListener("click", () => {
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
    root.querySelector("button[data-action='add-link']")?.addEventListener("click", () => {
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
    root.querySelectorAll(".row[data-kind='link']").forEach((row, index) => {
      const selects = row.querySelectorAll("select[data-field]");
      const link = links[index];
      if (selects[0]) {
        selects[0].value = link.from;
      }
      if (selects[1]) {
        selects[1].value = link.to;
      }
    });
  }
  render() {
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

        .flow-style-row input[type='color'] {
          min-height: 40px;
          padding: 4px;
        }

        .layout-canvas {
          position: relative;
          width: 100%;
          min-height: clamp(180px, 42vw, 520px);
          aspect-ratio: 4 / 3;
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
          width: var(--layout-node-size, 90px);
          min-height: var(--layout-node-size, 90px);
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
        }

        .layout-node.has-image {
          background: transparent;
        }

        .layout-node-bg-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          filter: brightness(0.78) saturate(1.04);
          z-index: 0;
        }

        .layout-node-overlay {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: grid;
          align-content: center;
          justify-items: center;
          gap: 6px;
          padding: 10px 8px;
          box-sizing: border-box;
        }

        .layout-node-overlay.with-image {
          align-content: end;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0) 38%, rgba(0, 0, 0, 0.6) 100%);
        }

        .layout-node:active {
          cursor: grabbing;
        }

        .layout-node-media {
          width: clamp(20px, calc(var(--layout-node-size, 90px) * 0.34), 42px);
          height: clamp(20px, calc(var(--layout-node-size, 90px) * 0.34), 42px);
          border-radius: 50%;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
          font-weight: 700;
        }

        .layout-node-label {
          max-width: 88%;
          font-size: clamp(0.56rem, calc(var(--layout-node-size, 90px) * 0.012), 0.78rem);
          line-height: 1.2;
          text-align: center;
          color: #f5fbfb;
          background: rgba(0, 0, 0, 0.45);
          padding: 2px 7px;
          border-radius: 8px;
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
        }

        .node-card.collapsed {
          gap: 0;
          padding: 8px 12px;
        }

        .node-card.collapsed > :not(.card-head) {
          display: none;
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

        .entity-select-wrap {
          display: grid;
          gap: 6px;
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
        }

        .link-card.collapsed {
          gap: 0;
          padding: 8px 12px;
        }

        .link-card.collapsed > :not(.card-head) {
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

        @media (min-width: 980px) {
          .node-grid,
          .metric-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .metric-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
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
            aspect-ratio: 1 / 1;
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
    const titleInput = root.querySelector("#title");
    titleInput?.addEventListener("change", () => {
      this.emitConfig({ ...this.safeConfig, title: titleInput.value, nodes, links });
    });
    this.wireEvents(nodes, links);
  }
};
customElements.define("mergner-pv-card", MergnerPvCard);
customElements.define("mergner-pv-card-editor", MergnerPvCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "mergner-pv-card",
  name: "Mergner PV Card",
  description: "Dynamic PV flow card with visual editor",
  preview: true
});
//# sourceMappingURL=mergner-pv-card.js.map
