// src/mergner-pv-card.ts
var DEFAULT_NODES = [
  { id: "solar", name: "Solar", x: 20, y: 20 },
  { id: "battery", name: "Battery", x: 80, y: 20 },
  { id: "house", name: "House", x: 20, y: 80 },
  { id: "grid", name: "Grid", x: 80, y: 80 }
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
  normalizeConfig(config) {
    const title = config.title ?? "PV Flow";
    if (config.nodes && config.nodes.length > 0) {
      const nodes = config.nodes.map((node) => ({
        ...node,
        id: node.id?.trim() || `node_${Math.random().toString(36).slice(2, 8)}`,
        name: node.name?.trim() || "Node",
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
    const value = this.getState(node.entity);
    const unit = node.unit ?? this.getUnit(node.entity);
    const safeName = this.safeText(node.name);
    const image = node.image?.trim();
    const media = image ? `<img src="${this.safeText(image)}" alt="${safeName}" loading="lazy" />` : `<div class="fallback-icon">${safeName.slice(0, 1)}</div>`;
    return `
      <article class="node" style="left:${this.clampPercent(node.x)}%; top:${this.clampPercent(node.y)}%;">
        <div class="node-media">${media}</div>
        <div class="node-label">${safeName}</div>
        <div class="node-value">${this.safeText(value)} ${this.safeText(unit)}</div>
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

        .flow-wrap {
          position: relative;
          min-height: 340px;
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
          width: min(42vw, 150px);
          max-width: 150px;
          min-height: 86px;
          position: absolute;
          transform: translate(-50%, -50%);
          background: var(--pv-card-node-bg);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          padding: 8px;
          text-align: center;
          backdrop-filter: blur(4px);
          z-index: 1;
        }

        .node-media {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 6px;
        }

        .node img {
          width: 42px;
          height: 42px;
          object-fit: contain;
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
          color: var(--pv-card-muted);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .node-value {
          margin-top: 3px;
          font-size: 0.97rem;
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .flow-wrap {
            min-height: 420px;
          }
        }
      </style>

      <ha-card>
        <div class="title">${this.safeText(normalized.title)}</div>
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
  setConfig(config) {
    this._config = {
      ...MergnerPvCard.getStubConfig(),
      ...config
    };
    this.render();
  }
  connectedCallback() {
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
  renderNodeRows(nodes) {
    return nodes.map(
      (node, idx) => `
          <div class="row" data-kind="node" data-index="${idx}">
            <input data-field="id" value="${node.id}" placeholder="id" />
            <input data-field="name" value="${node.name}" placeholder="Name" />
            <input data-field="entity" value="${node.entity ?? ""}" placeholder="sensor.xyz" />
            <input data-field="image" value="${node.image ?? ""}" placeholder="/local/pv/icon.png" />
            <input data-field="x" type="number" min="0" max="100" value="${node.x}" />
            <input data-field="y" type="number" min="0" max="100" value="${node.y}" />
            <button data-action="remove-node">X</button>
          </div>
        `
    ).join("");
  }
  renderLinkRows(links, nodes) {
    const options = nodes.map((node) => `<option value="${node.id}">${node.name} (${node.id})</option>`).join("");
    return links.map((link, idx) => `
        <div class="row" data-kind="link" data-index="${idx}">
          <select data-field="from">${options}</select>
          <select data-field="to">${options}</select>
          <input data-field="entity" value="${link.entity ?? ""}" placeholder="sensor.flow_power" />
          <input data-field="label" value="${link.label ?? ""}" placeholder="Label optional" />
          <label class="invert"><input data-field="invert" type="checkbox" ${link.invert ? "checked" : ""} />invert</label>
          <button data-action="remove-link">X</button>
        </div>
      `).join("");
  }
  wireEvents(nodes, links) {
    const root = this.shadowRoot;
    if (!root) {
      return;
    }
    root.querySelectorAll(".row[data-kind='node']").forEach((row, index) => {
      row.querySelectorAll("input[data-field]").forEach((input) => {
        input.addEventListener("change", () => {
          const field = input.dataset.field;
          const nextNodes = [...nodes];
          const value = input.type === "number" ? Number(input.value) : input.value;
          nextNodes[index][field] = value;
          this.emitConfig({ ...this.safeConfig, nodes: nextNodes, links });
        });
      });
      row.querySelector("button[data-action='remove-node']")?.addEventListener("click", () => {
        const nextNodes = nodes.filter((_, i) => i !== index);
        const validIds = new Set(nextNodes.map((node) => node.id));
        const nextLinks = links.filter((link) => validIds.has(link.from) && validIds.has(link.to));
        this.emitConfig({ ...this.safeConfig, nodes: nextNodes, links: nextLinks });
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
          color: var(--primary-text-color, #111);
          font-family: var(--paper-font-body1_-_font-family, sans-serif);
        }

        .editor {
          display: grid;
          gap: 10px;
        }

        h4 {
          margin: 6px 0 2px;
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
          padding: 6px;
          border-radius: 8px;
          border: 1px solid rgba(128, 128, 128, 0.45);
          font-size: 0.86rem;
          background: rgba(255, 255, 255, 0.95);
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
        }
      </style>

      <div class="editor">
        <div class="topline">
          <label>Title</label>
          <input id="title" value="${this.safeConfig.title ?? "PV Flow"}" placeholder="PV Flow" />
        </div>

        <h4>Nodes</h4>
        ${this.renderNodeRows(nodes)}
        <div class="actions"><button data-action="add-node">Add node</button></div>

        <h4>Links</h4>
        ${this.renderLinkRows(links, nodes)}
        <div class="actions"><button data-action="add-link">Add link</button></div>
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
