var g=[{id:"solar",name:"Solar",role:"pv",entityLabel:"Power",secondaryLabel:"Today",x:20,y:20},{id:"battery",name:"Battery",role:"battery",entityLabel:"Charge / Discharge",secondaryLabel:"SOC",secondaryUnit:"%",tertiaryLabel:"Today",x:80,y:20},{id:"house",name:"House",role:"house",entityLabel:"Load",secondaryLabel:"Today",x:20,y:80},{id:"grid",name:"Grid",role:"grid",entityLabel:"Import / Export",secondaryLabel:"Today",x:80,y:80}],m=[{from:"solar",to:"house",entity:"sensor.pv_to_house_power"},{from:"solar",to:"battery",entity:"sensor.pv_to_battery_power"},{from:"battery",to:"house",entity:"sensor.battery_to_house_power"},{from:"grid",to:"house",entity:"sensor.grid_to_house_power"}],p=class b extends HTMLElement{_config;_hass;static getConfigElement(){return document.createElement("mergner-pv-card-editor")}static getStubConfig(){return{type:"custom:mergner-pv-card",title:"PV Flow",nodes:g,links:m}}setConfig(e){if(!e||e.type!=="custom:mergner-pv-card")throw new Error("Card type must be custom:mergner-pv-card");this._config=e,this.render()}set hass(e){this._hass=e,this.render()}getCardSize(){return 5}connectedCallback(){this.render()}safeText(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}clampMeterPercent(e){return Number.isNaN(e)?0:Math.max(0,Math.min(100,e))}getEntity(e){if(!(!e||!this._hass?.states?.[e]))return this._hass.states[e]}getState(e){return this.getEntity(e)?.state??"n/a"}getUnit(e){let t=this.getEntity(e)?.attributes?.unit_of_measurement;return typeof t=="string"?t:""}parseNumber(e){let i=this.getState(e),t=Number.parseFloat(i);return Number.isFinite(t)?t:0}getNodeRole(e){return e.role??"custom"}roleLabel(e){switch(e){case"pv":return"PV";case"battery":return"Battery";case"house":return"House";case"grid":return"Grid";default:return"Node"}}defaultMetricLabel(e,i){if(i==="primary")switch(e){case"pv":return"Power";case"battery":return"Charge / Discharge";case"house":return"Load";case"grid":return"Import / Export";default:return"Value"}if(i==="secondary")switch(e){case"battery":return"SOC";case"pv":case"house":case"grid":return"Today";default:return"Detail"}return e==="battery"?"Today":"Extra"}formatMetricValue(e,i){let t=e.trim(),a=i.trim();return a?`${t} ${a}`:t}getNodeMetrics(e){let i=this.getNodeRole(e);return[{entity:e.entity,label:e.entityLabel,unit:e.unit,defaultLabel:this.defaultMetricLabel(i,"primary"),showWhenEmpty:!0},{entity:e.secondaryEntity,label:e.secondaryLabel,unit:e.secondaryUnit,defaultLabel:this.defaultMetricLabel(i,"secondary"),showWhenEmpty:!1},{entity:e.tertiaryEntity,label:e.tertiaryLabel,unit:e.tertiaryUnit,defaultLabel:this.defaultMetricLabel(i,"tertiary"),showWhenEmpty:!1}].filter(a=>a.showWhenEmpty||!!a.entity?.trim()).map(a=>{let n=a.entity?this.getState(a.entity):"n/a",r=a.unit??(a.entity?this.getUnit(a.entity):"");return{label:a.label?.trim()||a.defaultLabel,value:n,numericValue:a.entity?this.parseNumber(a.entity):Number.NaN,unit:r}})}getBatteryLevel(e){let i=e.find(t=>t.unit==="%"||/soc|state of charge|akku|charge|level/i.test(t.label));if(!(!i||Number.isNaN(i.numericValue)))return this.clampMeterPercent(i.numericValue)}getSummaryUnit(e){for(let i of e){let t=i.unit?.trim()||this.getUnit(i.entity);if(t)return t}return""}renderSummary(e){let t=[{role:"pv",label:"Generation",className:"pv"},{role:"house",label:"Load",className:"house"},{role:"battery",label:"Battery",className:"battery"},{role:"grid",label:"Grid",className:"grid"}].map(a=>{let n=e.filter(l=>this.getNodeRole(l)===a.role&&l.entity?.trim());if(n.length===0)return"";let r=n.reduce((l,d)=>l+this.parseNumber(d.entity),0),s=this.getSummaryUnit(n),o=this.formatMetricValue(r.toFixed(Math.abs(r)>=100?0:1),s);return`
          <div class="summary-chip ${a.className}">
            <span>${this.safeText(a.label)}</span>
            <strong>${this.safeText(o)}</strong>
          </div>
        `}).join("");return t.trim()?`<div class="summary-row">${t}</div>`:""}normalizeConfig(e){let i=e.title??"PV Flow";if(e.nodes&&e.nodes.length>0){let a=e.nodes.map(r=>({...r,id:r.id?.trim()||`node_${Math.random().toString(36).slice(2,8)}`,name:r.name?.trim()||"Node",role:r.role??"custom",x:this.clampPercent(Number(r.x)),y:this.clampPercent(Number(r.y))})),n=(e.links??[]).filter(r=>a.some(s=>s.id===r.from)&&a.some(s=>s.id===r.to));return{title:i,nodes:a,links:n}}let t=g.map(a=>({...a,entity:e.entities?.[a.id],image:e.images?.[a.id]}));return{title:i,nodes:t,links:m}}renderNode(e){let i=this.getNodeRole(e),t=this.getNodeMetrics(e),a=t[0],n=t.slice(1),r=i==="battery"?this.getBatteryLevel(t):void 0,s=this.safeText(e.name),o=e.image?.trim(),l=o?`<img src="${this.safeText(o)}" alt="${s}" loading="lazy" />`:`<div class="fallback-icon">${s.slice(0,1)}</div>`,d=i==="battery"&&a&&!Number.isNaN(a.numericValue)?a.numericValue>0?"is-charging":a.numericValue<0?"is-discharging":"is-idle":"",u=n.map(c=>`
          <div class="node-stat">
            <span>${this.safeText(c.label)}</span>
            <strong>${this.safeText(this.formatMetricValue(c.value,c.unit))}</strong>
          </div>
        `).join(""),h=r===void 0?"":`
          <div class="battery-meter" aria-label="Battery level ${r}%">
            <div class="battery-meter-fill" style="width:${r}%;"></div>
          </div>
        `;return`
      <article class="node node-${i} ${d}" style="left:${this.clampPercent(e.x)}%; top:${this.clampPercent(e.y)}%;">
        <div class="node-orb">
          <div class="node-media">${l}</div>
          <div class="node-kicker">${this.safeText(this.roleLabel(i))}</div>
          <div class="node-label">${s}</div>
          <div class="node-value">${this.safeText(this.formatMetricValue(a.value,a.unit))}</div>
          <div class="node-value-label">${this.safeText(a.label)}</div>
          ${h}
        </div>
        ${u?`<div class="node-stats">${u}</div>`:""}
      </article>
    `}resolveLinkDirection(e){if(!e.entity)return"idle";let i=this.parseNumber(e.entity);return e.invert&&(i=-i),i>0?"forward":i<0?"reverse":"idle"}renderLinks(e,i){let t=new Map(e.map(n=>[n.id,n]));return`<svg class="line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${i.map((n,r)=>{let s=t.get(n.from),o=t.get(n.to);if(!s||!o)return"";let l=this.resolveLinkDirection(n),d=n.label?.trim()?`<title>${this.safeText(n.label)}</title>`:"";return`<line class="flow-line ${l}" x1="${s.x}" y1="${s.y}" x2="${o.x}" y2="${o.y}">${d}</line>`}).join("")}</svg>`}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let i=this.normalizeConfig(this._config??b.getStubConfig());e.innerHTML=`
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
        <div class="title">${this.safeText(i.title)}</div>
        ${this.renderSummary(i.nodes)}
        <div class="flow-wrap">
          ${this.renderLinks(i.nodes,i.links)}
          ${i.nodes.map(t=>this.renderNode(t)).join("")}
        </div>
      </ha-card>
    `}},y=class extends HTMLElement{_config;_hass;_dragNodeIndex;_dragEventsBound=!1;_entityIdsSignature="";safeText(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}setConfig(e){this._config={...p.getStubConfig(),...e},this.render()}set hass(e){let i=Object.keys(e?.states??{}).sort((a,n)=>a.localeCompare(n)).join("|"),t=!this._hass||i!==this._entityIdsSignature;this._hass=e,this._entityIdsSignature=i,t&&this.render()}connectedCallback(){this.bindDragEvents(),this.render()}get safeConfig(){return this._config??p.getStubConfig()}emitConfig(e){this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0})),this.render()}updateNode(e,i,t,a){let n=[...e];n[t]={...n[t],...a},this.emitConfig({...this.safeConfig,nodes:n,links:i})}bindDragEvents(){this._dragEventsBound||(window.addEventListener("pointermove",this.handlePointerMove),window.addEventListener("pointerup",this.handlePointerUp),window.addEventListener("pointercancel",this.handlePointerUp),this._dragEventsBound=!0)}disconnectedCallback(){this._dragEventsBound&&(window.removeEventListener("pointermove",this.handlePointerMove),window.removeEventListener("pointerup",this.handlePointerUp),window.removeEventListener("pointercancel",this.handlePointerUp),this._dragEventsBound=!1)}getEntityIds(){return Object.keys(this._hass?.states??{}).sort((e,i)=>e.localeCompare(i))}getEntityUnit(e){let t=this._hass?.states?.[e]?.attributes?.unit_of_measurement;return typeof t=="string"?t:""}getEntityDeviceClass(e){let t=this._hass?.states?.[e]?.attributes?.device_class;return typeof t=="string"?t:""}matchesEntityFilter(e,i){if(i==="any")return!0;let t=this.getEntityUnit(e).toLowerCase(),a=this.getEntityDeviceClass(e).toLowerCase();return i==="power"?/^(w|kw|mw|gw|va|kva)$/.test(t)||["power","apparent_power","reactive_power"].includes(a):i==="energy"?/^(wh|kwh|mwh|gwh)$/.test(t)||a==="energy":t==="%"||a==="battery"}getNodeEntityFilter(e,i){return i==="entity"?"power":i==="secondaryEntity"?e.role==="battery"?"percent":"energy":i==="tertiaryEntity"?"energy":"any"}renderEntitySelect(e,i,t="Select entity",a="any"){let n=this.getEntityIds(),r=i?.trim()??"",s=r&&!n.includes(r)?`<option value="${this.safeText(r)}" selected>${this.safeText(r)}</option>`:"",o=n.filter(c=>this.matchesEntityFilter(c,a)),l=n.filter(c=>!o.includes(c)),d=c=>c.map(f=>{let v=f===r?"selected":"";return`<option value="${this.safeText(f)}" ${v}>${this.safeText(f)}</option>`}).join(""),u=o.length>0?`<optgroup label="Recommended">${d(o)}</optgroup>`:"",h=l.length>0?`<optgroup label="All entities">${d(l)}</optgroup>`:"";return`
      <select data-field="${String(e)}">
        <option value="">${this.safeText(t)}</option>
        ${s}
        ${u}
        ${h}
      </select>
    `}renderLayoutCanvas(e,i){let t=new Map(e.map(r=>[r.id,r])),a=i.map(r=>{let s=t.get(r.from),o=t.get(r.to);return!s||!o?"":`<line x1="${s.x}" y1="${s.y}" x2="${o.x}" y2="${o.y}"></line>`}).join(""),n=e.map((r,s)=>{let o=r.image?.trim(),l=o?`<img src="${this.safeText(o)}" alt="${this.safeText(r.name)}" />`:`<span>${this.safeText(r.name.slice(0,1).toUpperCase())}</span>`;return`
          <button
            class="layout-node"
            data-action="drag-node"
            data-index="${s}"
            type="button"
            style="left:${r.x}%; top:${r.y}%;"
            aria-label="Drag ${this.safeText(r.name)}"
          >
            <div class="layout-node-media">${l}</div>
            <div class="layout-node-label">${this.safeText(r.name)}</div>
          </button>
        `}).join("");return`
      <div class="layout-canvas-wrap">
        <div class="layout-hint">Drag devices in the preview to set X/Y positions.</div>
        <div class="layout-canvas">
          <svg class="layout-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${a}</svg>
          ${n}
        </div>
      </div>
    `}startNodeDrag(e){this._dragNodeIndex=e}handlePointerMove=e=>{if(this._dragNodeIndex===void 0)return;let t=this.shadowRoot?.querySelector(".layout-canvas");if(!t)return;let a=t.getBoundingClientRect();if(a.width===0||a.height===0)return;let n=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:g,r=this.safeConfig.links??m,s=Math.max(4,Math.min(96,(e.clientX-a.left)/a.width*100)),o=Math.max(4,Math.min(96,(e.clientY-a.top)/a.height*100));this.updateNode(n,r,this._dragNodeIndex,{x:Number(s.toFixed(1)),y:Number(o.toFixed(1))})};handlePointerUp=()=>{this._dragNodeIndex=void 0};readFileAsDataUrl(e){return new Promise((i,t)=>{let a=new FileReader;a.addEventListener("load",()=>{if(typeof a.result=="string"){i(a.result);return}t(new Error("Image upload failed"))}),a.addEventListener("error",()=>t(a.error??new Error("Image upload failed"))),a.readAsDataURL(e)})}renderNodeRows(e){let i=["pv","battery","house","grid","custom"];return e.map((t,a)=>`
          <section class="node-card" data-kind="node" data-index="${a}">
            <div class="card-head">
              <strong>Node ${a+1}</strong>
              <button data-action="remove-node" type="button">Remove</button>
            </div>
            <div class="node-grid">
              <label>
                <span>ID</span>
                <input data-field="id" value="${this.safeText(t.id)}" placeholder="battery_1" />
              </label>
              <label>
                <span>Name</span>
                <input data-field="name" value="${this.safeText(t.name)}" placeholder="Battery 1" />
              </label>
              <label>
                <span>Type</span>
                <select data-field="role">
                  ${i.map(n=>`<option value="${n}" ${(t.role??"custom")===n?"selected":""}>${n}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>Image URL</span>
                <input data-field="image" value="${this.safeText(t.image??"")}" placeholder="/local/pv/battery.png" />
              </label>
              <label>
                <span>X</span>
                <input data-field="x" type="number" min="0" max="100" value="${t.x}" />
              </label>
              <label>
                <span>Y</span>
                <input data-field="y" type="number" min="0" max="100" value="${t.y}" />
              </label>
            </div>
            <div class="image-tools">
              <label class="upload-field">
                <span>Upload image</span>
                <input data-action="upload-image" type="file" accept="image/*" />
              </label>
              <button data-action="clear-image" type="button">Clear image</button>
              <div class="image-preview ${t.image?.trim()?"has-image":""}">
                ${t.image?.trim()?`<img src="${this.safeText(t.image)}" alt="${this.safeText(t.name)} preview" />`:"<span>No image</span>"}
              </div>
            </div>
            <div class="metric-grid">
              <label>
                <span>Primary entity</span>
                ${this.renderEntitySelect("entity",t.entity,"Choose primary entity",this.getNodeEntityFilter(t,"entity"))}
              </label>
              <label>
                <span>Primary label</span>
                <input data-field="entityLabel" value="${this.safeText(t.entityLabel??"")}" placeholder="Charge / Discharge" />
              </label>
              <label>
                <span>Primary unit</span>
                <input data-field="unit" value="${this.safeText(t.unit??"")}" placeholder="auto / W" />
              </label>
              <label>
                <span>Secondary entity</span>
                ${this.renderEntitySelect("secondaryEntity",t.secondaryEntity,"Choose secondary entity",this.getNodeEntityFilter(t,"secondaryEntity"))}
              </label>
              <label>
                <span>Secondary label</span>
                <input data-field="secondaryLabel" value="${this.safeText(t.secondaryLabel??"")}" placeholder="SOC" />
              </label>
              <label>
                <span>Secondary unit</span>
                <input data-field="secondaryUnit" value="${this.safeText(t.secondaryUnit??"")}" placeholder="auto / %" />
              </label>
              <label>
                <span>Tertiary entity</span>
                ${this.renderEntitySelect("tertiaryEntity",t.tertiaryEntity,"Choose tertiary entity",this.getNodeEntityFilter(t,"tertiaryEntity"))}
              </label>
              <label>
                <span>Tertiary label</span>
                <input data-field="tertiaryLabel" value="${this.safeText(t.tertiaryLabel??"")}" placeholder="Today" />
              </label>
              <label>
                <span>Tertiary unit</span>
                <input data-field="tertiaryUnit" value="${this.safeText(t.tertiaryUnit??"")}" placeholder="auto / kWh" />
              </label>
            </div>
          </section>
        `).join("")}renderLinkRows(e,i){let t=i.map(a=>`<option value="${this.safeText(a.id)}">${this.safeText(a.name)} (${this.safeText(a.id)})</option>`).join("");return e.map((a,n)=>`
          <div class="row" data-kind="link" data-index="${n}">
            <select data-field="from">${t}</select>
            <select data-field="to">${t}</select>
            ${this.renderEntitySelect("entity",a.entity,"Choose flow entity","power")}
            <input data-field="label" value="${this.safeText(a.label??"")}" placeholder="Label optional" />
            <label class="invert"><input data-field="invert" type="checkbox" ${a.invert?"checked":""} />invert</label>
            <button data-action="remove-link" type="button">X</button>
          </div>
        `).join("")}wireEvents(e,i){let t=this.shadowRoot;t&&(t.querySelectorAll(".node-card[data-kind='node']").forEach((a,n)=>{a.querySelectorAll("input[data-field], select[data-field]").forEach(r=>{r.addEventListener("change",()=>{let s=r.dataset.field,o=r instanceof HTMLInputElement&&r.type==="number"?Number(r.value):r.value;this.updateNode(e,i,n,{[s]:o})})}),a.querySelector("input[data-action='upload-image']")?.addEventListener("change",async r=>{let s=r.currentTarget,o=s.files?.[0];if(o)try{let l=await this.readFileAsDataUrl(o);this.updateNode(e,i,n,{image:l})}catch(l){console.error(l)}finally{s.value=""}}),a.querySelector("button[data-action='clear-image']")?.addEventListener("click",()=>{this.updateNode(e,i,n,{image:""})}),a.querySelector("button[data-action='remove-node']")?.addEventListener("click",()=>{let r=e.filter((l,d)=>d!==n),s=new Set(r.map(l=>l.id)),o=i.filter(l=>s.has(l.from)&&s.has(l.to));this.emitConfig({...this.safeConfig,nodes:r,links:o})})}),t.querySelectorAll("button[data-action='drag-node']").forEach(a=>{a.addEventListener("pointerdown",n=>{if(n.button!==0)return;let r=Number(a.dataset.index);Number.isFinite(r)&&(n.preventDefault(),this.startNodeDrag(r))})}),t.querySelectorAll(".row[data-kind='link']").forEach((a,n)=>{a.querySelectorAll("input[data-field], select[data-field]").forEach(r=>{if(r instanceof HTMLInputElement&&r.type==="checkbox"){r.addEventListener("change",()=>{let s=[...i];s[n]={...s[n],invert:r.checked},this.emitConfig({...this.safeConfig,nodes:e,links:s})});return}r.addEventListener("change",()=>{let s=r.dataset.field,o=[...i];o[n]={...o[n],[s]:r.value},this.emitConfig({...this.safeConfig,nodes:e,links:o})})}),a.querySelector("button[data-action='remove-link']")?.addEventListener("click",()=>{let r=i.filter((s,o)=>o!==n);this.emitConfig({...this.safeConfig,nodes:e,links:r})})}),t.querySelector("button[data-action='add-node']")?.addEventListener("click",()=>{let a=[...e,{id:`node_${e.length+1}`,name:`Node ${e.length+1}`,x:50,y:50}];this.emitConfig({...this.safeConfig,nodes:a,links:i})}),t.querySelector("button[data-action='add-link']")?.addEventListener("click",()=>{if(e.length<2)return;let a=[...i,{from:e[0].id,to:e[1].id,entity:"",invert:!1}];this.emitConfig({...this.safeConfig,nodes:e,links:a})}),t.querySelectorAll(".row[data-kind='link']").forEach((a,n)=>{let r=a.querySelectorAll("select[data-field]"),s=i[n];r[0]&&(r[0].value=s.from),r[1]&&(r[1].value=s.to)}))}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let i=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:g,t=this.safeConfig.links??m;e.innerHTML=`
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
              <input id="title" value="${this.safeText(this.safeConfig.title??"PV Flow")}" placeholder="PV Flow" />
            </label>
          </div>
        </section>

        <section class="panel">
          <h3 class="panel-title">Layout</h3>
          <p class="panel-copy">Place devices visually. The X and Y fields update while you drag.</p>
          ${this.renderLayoutCanvas(i,t)}
        </section>

        <section class="panel">
          <h3 class="panel-title">Devices</h3>
          <p class="panel-copy">Each device can show up to three values, for example power, SOC and daily energy.</p>
          ${this.renderNodeRows(i)}
          <div class="actions"><button data-action="add-node" type="button">Add device</button></div>
        </section>

        <section class="panel">
          <h3 class="panel-title">Flows</h3>
          <p class="panel-copy">Connect devices and assign a power sensor to control arrow direction.</p>
          ${this.renderLinkRows(t,i)}
          <div class="actions"><button data-action="add-link" type="button">Add flow</button></div>
        </section>
      </div>
    `;let a=e.querySelector("#title");a?.addEventListener("change",()=>{this.emitConfig({...this.safeConfig,title:a.value,nodes:i,links:t})}),this.wireEvents(i,t)}};customElements.define("mergner-pv-card",p);customElements.define("mergner-pv-card-editor",y);window.customCards=window.customCards||[];window.customCards.push({type:"mergner-pv-card",name:"Mergner PV Card",description:"Dynamic PV flow card with visual editor",preview:!0});
