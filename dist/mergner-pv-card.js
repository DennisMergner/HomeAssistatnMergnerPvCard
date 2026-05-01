var f=[{id:"solar",name:"Solar",x:20,y:20},{id:"battery",name:"Battery",x:80,y:20},{id:"house",name:"House",x:20,y:80},{id:"grid",name:"Grid",x:80,y:80}],g=[{from:"solar",to:"house",entity:"sensor.pv_to_house_power"},{from:"solar",to:"battery",entity:"sensor.pv_to_battery_power"},{from:"battery",to:"house",entity:"sensor.battery_to_house_power"},{from:"grid",to:"house",entity:"sensor.grid_to_house_power"}],d=class p extends HTMLElement{_config;_hass;static getConfigElement(){return document.createElement("mergner-pv-card-editor")}static getStubConfig(){return{type:"custom:mergner-pv-card",title:"PV Flow",nodes:f,links:g}}setConfig(e){if(!e||e.type!=="custom:mergner-pv-card")throw new Error("Card type must be custom:mergner-pv-card");this._config=e,this.render()}set hass(e){this._hass=e,this.render()}getCardSize(){return 5}connectedCallback(){this.render()}safeText(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}getEntity(e){if(!(!e||!this._hass?.states?.[e]))return this._hass.states[e]}getState(e){return this.getEntity(e)?.state??"n/a"}getUnit(e){let r=this.getEntity(e)?.attributes?.unit_of_measurement;return typeof r=="string"?r:""}parseNumber(e){let t=this.getState(e),r=Number.parseFloat(t);return Number.isFinite(r)?r:0}normalizeConfig(e){let t=e.title??"PV Flow";if(e.nodes&&e.nodes.length>0){let i=e.nodes.map(n=>({...n,id:n.id?.trim()||`node_${Math.random().toString(36).slice(2,8)}`,name:n.name?.trim()||"Node",x:this.clampPercent(Number(n.x)),y:this.clampPercent(Number(n.y))})),a=(e.links??[]).filter(n=>i.some(o=>o.id===n.from)&&i.some(o=>o.id===n.to));return{title:t,nodes:i,links:a}}let r=f.map(i=>({...i,entity:e.entities?.[i.id],image:e.images?.[i.id]}));return{title:t,nodes:r,links:g}}renderNode(e){let t=this.getState(e.entity),r=e.unit??this.getUnit(e.entity),i=this.safeText(e.name),a=e.image?.trim(),n=a?`<img src="${this.safeText(a)}" alt="${i}" loading="lazy" />`:`<div class="fallback-icon">${i.slice(0,1)}</div>`;return`
      <article class="node" style="left:${this.clampPercent(e.x)}%; top:${this.clampPercent(e.y)}%;">
        <div class="node-media">${n}</div>
        <div class="node-label">${i}</div>
        <div class="node-value">${this.safeText(t)} ${this.safeText(r)}</div>
      </article>
    `}resolveLinkDirection(e){if(!e.entity)return"idle";let t=this.parseNumber(e.entity);return e.invert&&(t=-t),t>0?"forward":t<0?"reverse":"idle"}renderLinks(e,t){let r=new Map(e.map(a=>[a.id,a]));return`<svg class="line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${t.map((a,n)=>{let o=r.get(a.from),s=r.get(a.to);if(!o||!s)return"";let l=this.resolveLinkDirection(a),c=a.label?.trim()?`<title>${this.safeText(a.label)}</title>`:"";return`<line class="flow-line ${l}" x1="${o.x}" y1="${o.y}" x2="${s.x}" y2="${s.y}">${c}</line>`}).join("")}</svg>`}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let t=this.normalizeConfig(this._config??p.getStubConfig());e.innerHTML=`
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
        <div class="title">${this.safeText(t.title)}</div>
        <div class="flow-wrap">
          ${this.renderLinks(t.nodes,t.links)}
          ${t.nodes.map(r=>this.renderNode(r)).join("")}
        </div>
      </ha-card>
    `}},m=class extends HTMLElement{_config;setConfig(e){this._config={...d.getStubConfig(),...e},this.render()}connectedCallback(){this.render()}get safeConfig(){return this._config??d.getStubConfig()}emitConfig(e){this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0})),this.render()}renderNodeRows(e){return e.map((t,r)=>`
          <div class="row" data-kind="node" data-index="${r}">
            <input data-field="id" value="${t.id}" placeholder="id" />
            <input data-field="name" value="${t.name}" placeholder="Name" />
            <input data-field="entity" value="${t.entity??""}" placeholder="sensor.xyz" />
            <input data-field="image" value="${t.image??""}" placeholder="/local/pv/icon.png" />
            <input data-field="x" type="number" min="0" max="100" value="${t.x}" />
            <input data-field="y" type="number" min="0" max="100" value="${t.y}" />
            <button data-action="remove-node">X</button>
          </div>
        `).join("")}renderLinkRows(e,t){let r=t.map(i=>`<option value="${i.id}">${i.name} (${i.id})</option>`).join("");return e.map((i,a)=>`
        <div class="row" data-kind="link" data-index="${a}">
          <select data-field="from">${r}</select>
          <select data-field="to">${r}</select>
          <input data-field="entity" value="${i.entity??""}" placeholder="sensor.flow_power" />
          <input data-field="label" value="${i.label??""}" placeholder="Label optional" />
          <label class="invert"><input data-field="invert" type="checkbox" ${i.invert?"checked":""} />invert</label>
          <button data-action="remove-link">X</button>
        </div>
      `).join("")}wireEvents(e,t){let r=this.shadowRoot;r&&(r.querySelectorAll(".row[data-kind='node']").forEach((i,a)=>{i.querySelectorAll("input[data-field]").forEach(n=>{n.addEventListener("change",()=>{let o=n.dataset.field,s=[...e],l=n.type==="number"?Number(n.value):n.value;s[a][o]=l,this.emitConfig({...this.safeConfig,nodes:s,links:t})})}),i.querySelector("button[data-action='remove-node']")?.addEventListener("click",()=>{let n=e.filter((l,c)=>c!==a),o=new Set(n.map(l=>l.id)),s=t.filter(l=>o.has(l.from)&&o.has(l.to));this.emitConfig({...this.safeConfig,nodes:n,links:s})})}),r.querySelectorAll(".row[data-kind='link']").forEach((i,a)=>{i.querySelectorAll("input[data-field], select[data-field]").forEach(n=>{if(n instanceof HTMLInputElement&&n.type==="checkbox"){n.addEventListener("change",()=>{let o=[...t];o[a]={...o[a],invert:n.checked},this.emitConfig({...this.safeConfig,nodes:e,links:o})});return}n.addEventListener("change",()=>{let o=n.dataset.field,s=[...t];s[a]={...s[a],[o]:n.value},this.emitConfig({...this.safeConfig,nodes:e,links:s})})}),i.querySelector("button[data-action='remove-link']")?.addEventListener("click",()=>{let n=t.filter((o,s)=>s!==a);this.emitConfig({...this.safeConfig,nodes:e,links:n})})}),r.querySelector("button[data-action='add-node']")?.addEventListener("click",()=>{let i=[...e,{id:`node_${e.length+1}`,name:`Node ${e.length+1}`,x:50,y:50}];this.emitConfig({...this.safeConfig,nodes:i,links:t})}),r.querySelector("button[data-action='add-link']")?.addEventListener("click",()=>{if(e.length<2)return;let i=[...t,{from:e[0].id,to:e[1].id,entity:"",invert:!1}];this.emitConfig({...this.safeConfig,nodes:e,links:i})}),r.querySelectorAll(".row[data-kind='link']").forEach((i,a)=>{let n=i.querySelectorAll("select[data-field]"),o=t[a];n[0]&&(n[0].value=o.from),n[1]&&(n[1].value=o.to)}))}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let t=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:f,r=this.safeConfig.links??g;e.innerHTML=`
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
          <input id="title" value="${this.safeConfig.title??"PV Flow"}" placeholder="PV Flow" />
        </div>

        <h4>Nodes</h4>
        ${this.renderNodeRows(t)}
        <div class="actions"><button data-action="add-node">Add node</button></div>

        <h4>Links</h4>
        ${this.renderLinkRows(r,t)}
        <div class="actions"><button data-action="add-link">Add link</button></div>
      </div>
    `;let i=e.querySelector("#title");i?.addEventListener("change",()=>{this.emitConfig({...this.safeConfig,title:i.value,nodes:t,links:r})}),this.wireEvents(t,r)}};customElements.define("mergner-pv-card",d);customElements.define("mergner-pv-card-editor",m);window.customCards=window.customCards||[];window.customCards.push({type:"mergner-pv-card",name:"Mergner PV Card",description:"Dynamic PV flow card with visual editor",preview:!0});
