// src/mergner-pv-card.ts
var DEFAULT_NODES = [
  { id: "solar", name: "Solar", role: "pv", entityLabel: "Power", secondaryLabel: "Today", x: 20, y: 20 },
  {
    id: "battery",
    name: "Battery",
    role: "battery",
    entityLabel: "Charge / Discharge",
    secondaryLabel: "SOC",
    secondaryUnit: "%",
    tertiaryLabel: "Today",
    x: 80,
    y: 20
  },
  { id: "house", name: "House", role: "house", entityLabel: "Load", secondaryLabel: "Today", x: 20, y: 80 },
  { id: "grid", name: "Grid", role: "grid", entityLabel: "Import / Export", secondaryLabel: "Today", x: 80, y: 80 }
];
var DEFAULT_LINKS = [
  { from: "solar", to: "house", entity: "sensor.pv_to_house_power" },
  { from: "solar", to: "battery", entity: "sensor.pv_to_battery_power" },
  { from: "battery", to: "house", entity: "sensor.battery_to_house_power" },
  { from: "grid", to: "house", entity: "sensor.grid_to_house_power" }
];
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
  getEntity(entityId) {
    if (!entityId || !this._hass?.states?.[entityId]) {
      return void 0;
    }
    return this._hass.states[entityId];
  }
  getState(entityId) {
    return this.getEntity(entityId)?.state ?? "n/a";
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
        return "Battery";
      case "house":
        return "House";
      case "grid":
        return "Grid";
      default:
        return "Node";
    }
  }
  defaultMetricLabel(role, slot) {
    if (slot === "primary") {
      switch (role) {
        case "pv":
          return "Power";
        case "battery":
          return "Charge / Discharge";
        case "house":
          return "Load";
        case "grid":
          return "Import / Export";
        default:
          return "Value";
      }
    }
    if (slot === "secondary") {
      switch (role) {
        case "battery":
          return "SOC";
        case "pv":
        case "house":
        case "grid":
          return "Today";
        default:
          return "Detail";
      }
    }
    return role === "battery" ? "Today" : "Extra";
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
        showWhenEmpty: true
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
      { role: "pv", label: "Generation", className: "pv" },
      { role: "house", label: "Load", className: "house" },
      { role: "battery", label: "Battery", className: "battery" },
      { role: "grid", label: "Grid", className: "grid" }
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
    if (config.nodes && config.nodes.length > 0) {
      const nodes = config.nodes.map((node) => ({
        ...node,
        id: node.id?.trim() || `node_${Math.random().toString(36).slice(2, 8)}`,
        name: node.name?.trim() || "Node",
        role: node.role ?? "custom",
        x: this.clampPercent(Number(node.x)),
        y: this.clampPercent(Number(node.y))
      }));
      const links = (config.links ?? []).filter(
        (link) => nodes.some((n) => n.id === link.from) && nodes.some((n) => n.id === link.to)
      );
      return { title, nodes, links };
    }
    const legacyNodes = DEFAULT_NODES.map((node) => ({
      ...node,
      entity: config.entities?.[node.id],
      image: config.images?.[node.id]
    }));
    return {
      title,
      nodes: legacyNodes,
      links: DEFAULT_LINKS
    };
  }
  renderNode(node) {
    const role = this.getNodeRole(node);
    const metrics = this.getNodeMetrics(node);
    const primaryMetric = metrics[0];
    const extraMetrics = metrics.slice(1);
    const batteryLevel = role === "battery" ? this.getBatteryLevel(metrics) : void 0;
    const safeName = this.safeText(node.name);
    const image = node.image?.trim();
    const media = image ? `<img src="${this.safeText(image)}" alt="${safeName}" loading="lazy" />` : `<div class="fallback-icon">${safeName.slice(0, 1)}</div>`;
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
      <article class="node node-${role} ${batteryStateClass}" style="left:${this.clampPercent(node.x)}%; top:${this.clampPercent(node.y)}%;">
        <div class="node-orb">
          <div class="node-media">${media}</div>
          <div class="node-kicker">${this.safeText(this.roleLabel(role))}</div>
          <div class="node-label">${safeName}</div>
          <div class="node-value">${this.safeText(this.formatMetricValue(primaryMetric.value, primaryMetric.unit))}</div>
          <div class="node-value-label">${this.safeText(primaryMetric.label)}</div>
          ${batteryMeter}
        </div>
        ${extraMetricMarkup ? `<div class="node-stats">${extraMetricMarkup}</div>` : ""}
      </article>
    `;
  }
  resolveLinkDirection(link) {
    if (!link.entity) {
      return "idle";
    }
    let value = this.parseNumber(link.entity);
    if (link.invert) {
      value = -value;
    }
    if (value > 0) {
      return "forward";
    }
    if (value < 0) {
      return "reverse";
    }
    return "idle";
  }
  renderLinks(nodes, links) {
    const lookup = new Map(nodes.map((node) => [node.id, node]));
    const lines = links.map((link, idx) => {
      const from = lookup.get(link.from);
      const to = lookup.get(link.to);
      if (!from || !to) {
        return "";
      }
      const direction = this.resolveLinkDirection(link);
      const label = link.label?.trim() ? `<title>${this.safeText(link.label)}</title>` : "";
      return `<line class="flow-line ${direction}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}">${label}</line>`;
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
    root.innerHTML = `
      <style>
        :host {
          display: block;
        }

        ha-card {
          --pv-card-bg: linear-gradient(135deg, #07151e 0%, #0f2f3a 45%, #1f4e55 100%);
          --pv-card-text: #e8f6f6;
          --pv-card-muted: #acd2d3;
          --flow-forward: #74e0cb;
          --flow-reverse: #ffb166;
          --flow-idle: #7e8f92;
          --pv-card-node-bg: rgba(255, 255, 255, 0.08);

          background: var(--pv-card-bg);
          color: var(--pv-card-text);
          border-radius: 20px;
          overflow: hidden;
          padding: 14px;
          position: relative;
        }

        .title {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 12px;
          letter-spacing: 0.02em;
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
          min-height: 340px;
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
          stroke-width: 1.2;
          fill: none;
          stroke-dasharray: 4 4;
          animation: flow 1.1s linear infinite;
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
          animation-play-state: paused;
        }

        @keyframes flow {
          to {
            stroke-dashoffset: -16;
          }
        }

        .node {
          width: min(46vw, 168px);
          max-width: 168px;
          position: absolute;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 1;
        }

        .node-orb {
          min-height: 168px;
          aspect-ratio: 1 / 1;
          padding: 12px 12px 10px;
          display: grid;
          align-content: start;
          justify-items: center;
          background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.06));
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 50%;
          backdrop-filter: blur(6px);
          box-shadow: inset 0 0 24px rgba(255, 255, 255, 0.04), 0 10px 24px rgba(0, 0, 0, 0.18);
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

        .node img {
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
            min-height: 420px;
            aspect-ratio: 1 / 1;
          }

          .node {
            width: min(58vw, 176px);
          }

          .node-orb {
            min-height: 176px;
          }
        }
      </style>

      <ha-card>
        <div class="title">${this.safeText(normalized.title)}</div>
        ${this.renderSummary(normalized.nodes)}
        <div class="flow-wrap">
          ${this.renderLinks(normalized.nodes, normalized.links)}
          ${normalized.nodes.map((node) => this.renderNode(node)).join("")}
        </div>
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
  safeText(input) {
    return input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  setConfig(config) {
    this._config = {
      ...MergnerPvCard.getStubConfig(),
      ...config
    };
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
    nextNodes[index] = { ...nextNodes[index], ...patch };
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
    const lines = links.map((link) => {
      const from = lookup.get(link.from);
      const to = lookup.get(link.to);
      if (!from || !to) {
        return "";
      }
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>`;
    }).join("");
    const nodeMarkup = nodes.map((node, index) => {
      const image = node.image?.trim();
      const media = image ? `<img src="${this.safeText(image)}" alt="${this.safeText(node.name)}" />` : `<span>${this.safeText(node.name.slice(0, 1).toUpperCase())}</span>`;
      return `
          <button
            class="layout-node"
            data-action="drag-node"
            data-index="${index}"
            type="button"
            style="left:${node.x}%; top:${node.y}%;"
            aria-label="Drag ${this.safeText(node.name)}"
          >
            <div class="layout-node-media">${media}</div>
            <div class="layout-node-label">${this.safeText(node.name)}</div>
          </button>
        `;
    }).join("");
    return `
      <div class="layout-canvas-wrap">
        <div class="layout-hint">Drag devices in the preview to set X/Y positions.</div>
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
    const x = Math.max(4, Math.min(96, (event.clientX - rect.left) / rect.width * 100));
    const y = Math.max(4, Math.min(96, (event.clientY - rect.top) / rect.height * 100));
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
    const roleOptions = ["pv", "battery", "house", "grid", "custom"];
    return nodes.map(
      (node, idx) => `
          <section class="node-card" data-kind="node" data-index="${idx}">
            <div class="card-head">
              <strong>Node ${idx + 1}</strong>
              <button data-action="remove-node" type="button">Remove</button>
            </div>
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
              <label>
                <span>Primary entity</span>
                ${this.renderEntitySelect(`node-${idx}-entity`, "entity", node.entity, "Choose primary entity", this.getNodeEntityFilter(node, "entity"))}
              </label>
              <label>
                <span>Primary label</span>
                <input data-field="entityLabel" value="${this.safeText(node.entityLabel ?? "")}" placeholder="Charge / Discharge" />
              </label>
              <label>
                <span>Primary unit</span>
                <input data-field="unit" value="${this.safeText(node.unit ?? "")}" placeholder="auto / W" />
              </label>
              <label>
                <span>Secondary entity</span>
                ${this.renderEntitySelect(`node-${idx}-secondary`, "secondaryEntity", node.secondaryEntity, "Choose secondary entity", this.getNodeEntityFilter(node, "secondaryEntity"))}
              </label>
              <label>
                <span>Secondary label</span>
                <input data-field="secondaryLabel" value="${this.safeText(node.secondaryLabel ?? "")}" placeholder="SOC" />
              </label>
              <label>
                <span>Secondary unit</span>
                <input data-field="secondaryUnit" value="${this.safeText(node.secondaryUnit ?? "")}" placeholder="auto / %" />
              </label>
              <label>
                <span>Tertiary entity</span>
                ${this.renderEntitySelect(`node-${idx}-tertiary`, "tertiaryEntity", node.tertiaryEntity, "Choose tertiary entity", this.getNodeEntityFilter(node, "tertiaryEntity"))}
              </label>
              <label>
                <span>Tertiary label</span>
                <input data-field="tertiaryLabel" value="${this.safeText(node.tertiaryLabel ?? "")}" placeholder="Today" />
              </label>
              <label>
                <span>Tertiary unit</span>
                <input data-field="tertiaryUnit" value="${this.safeText(node.tertiaryUnit ?? "")}" placeholder="auto / kWh" />
              </label>
            </div>
          </section>
        `
    ).join("");
  }
  renderLinkRows(links, nodes) {
    const options = nodes.map((node) => `<option value="${this.safeText(node.id)}">${this.safeText(node.name)} (${this.safeText(node.id)})</option>`).join("");
    return links.map(
      (link, idx) => `
          <div class="row" data-kind="link" data-index="${idx}">
            <select data-field="from">${options}</select>
            <select data-field="to">${options}</select>
            ${this.renderEntitySelect(`link-${idx}-entity`, "entity", link.entity, "Choose flow entity", "power")}
            <input data-field="label" value="${this.safeText(link.label ?? "")}" placeholder="Label optional" />
            <label class="invert"><input data-field="invert" type="checkbox" ${link.invert ? "checked" : ""} />invert</label>
            <button data-action="remove-link" type="button">X</button>
          </div>
        `
    ).join("");
  }
  wireEvents(nodes, links) {
    const root = this.shadowRoot;
    if (!root) {
      return;
    }
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

        .layout-hint {
          color: var(--secondary-text-color);
          font-size: 0.82rem;
        }

        .layout-canvas {
          position: relative;
          min-height: 280px;
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
          width: 90px;
          min-height: 90px;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          padding: 10px;
          display: grid;
          gap: 6px;
          place-items: center;
          background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.08));
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 18px rgba(0, 0, 0, 0.2);
          cursor: grab;
          user-select: none;
        }

        .layout-node:active {
          cursor: grabbing;
        }

        .layout-node-media {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
          font-weight: 700;
        }

        .layout-node-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .layout-node-label {
          max-width: 64px;
          font-size: 0.72rem;
          line-height: 1.2;
          text-align: center;
          color: #f5fbfb;
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

        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .card-head strong {
          font-size: 0.95rem;
        }

        .node-grid,
        .metric-grid {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }

        .entity-select-wrap {
          display: grid;
          gap: 6px;
        }

        .image-tools {
          display: grid;
          gap: 8px;
          grid-template-columns: minmax(0, 1fr) auto 84px;
          align-items: end;
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
          grid-template-columns: repeat(6, minmax(0, 1fr)) auto;
          align-items: center;
        }

        .row[data-kind='link'] {
          grid-template-columns: repeat(4, minmax(0, 1fr)) auto auto;
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
