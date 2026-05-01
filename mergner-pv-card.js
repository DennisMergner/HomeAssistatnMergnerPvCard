var u=[{id:"solar",name:"Solar",role:"pv",entityLabel:"Power",secondaryLabel:"Today",x:20,y:20},{id:"battery",name:"Battery",role:"battery",entityLabel:"Charge / Discharge",secondaryLabel:"SOC",secondaryUnit:"%",tertiaryLabel:"Today",x:80,y:20},{id:"house",name:"House",role:"house",entityLabel:"Load",secondaryLabel:"Today",x:20,y:80},{id:"grid",name:"Grid",role:"grid",entityLabel:"Import / Export",secondaryLabel:"Today",x:80,y:80}],g=[{from:"solar",to:"house",entity:"sensor.pv_to_house_power"},{from:"solar",to:"battery",entity:"sensor.pv_to_battery_power"},{from:"battery",to:"house",entity:"sensor.battery_to_house_power"},{from:"grid",to:"house",entity:"sensor.grid_to_house_power"}],c=class f extends HTMLElement{_config;_hass;static getConfigElement(){return document.createElement("mergner-pv-card-editor")}static getStubConfig(){return{type:"custom:mergner-pv-card",title:"PV Flow",nodes:u,links:g}}setConfig(e){if(!e||e.type!=="custom:mergner-pv-card")throw new Error("Card type must be custom:mergner-pv-card");this._config=e,this.render()}set hass(e){this._hass=e,this.render()}getCardSize(){return 5}connectedCallback(){this.render()}safeText(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}clampMeterPercent(e){return Number.isNaN(e)?0:Math.max(0,Math.min(100,e))}getEntity(e){if(!(!e||!this._hass?.states?.[e]))return this._hass.states[e]}getState(e){return this.getEntity(e)?.state??"n/a"}getUnit(e){let a=this.getEntity(e)?.attributes?.unit_of_measurement;return typeof a=="string"?a:""}parseNumber(e){let r=this.getState(e),a=Number.parseFloat(r);return Number.isFinite(a)?a:0}getNodeRole(e){return e.role??"custom"}roleLabel(e){switch(e){case"pv":return"PV";case"battery":return"Battery";case"house":return"House";case"grid":return"Grid";default:return"Node"}}defaultMetricLabel(e,r){if(r==="primary")switch(e){case"pv":return"Power";case"battery":return"Charge / Discharge";case"house":return"Load";case"grid":return"Import / Export";default:return"Value"}if(r==="secondary")switch(e){case"battery":return"SOC";case"pv":case"house":case"grid":return"Today";default:return"Detail"}return e==="battery"?"Today":"Extra"}formatMetricValue(e,r){let a=e.trim(),t=r.trim();return t?`${a} ${t}`:a}getNodeMetrics(e){let r=this.getNodeRole(e);return[{entity:e.entity,label:e.entityLabel,unit:e.unit,defaultLabel:this.defaultMetricLabel(r,"primary"),showWhenEmpty:!0},{entity:e.secondaryEntity,label:e.secondaryLabel,unit:e.secondaryUnit,defaultLabel:this.defaultMetricLabel(r,"secondary"),showWhenEmpty:!1},{entity:e.tertiaryEntity,label:e.tertiaryLabel,unit:e.tertiaryUnit,defaultLabel:this.defaultMetricLabel(r,"tertiary"),showWhenEmpty:!1}].filter(t=>t.showWhenEmpty||!!t.entity?.trim()).map(t=>{let n=t.entity?this.getState(t.entity):"n/a",i=t.unit??(t.entity?this.getUnit(t.entity):"");return{label:t.label?.trim()||t.defaultLabel,value:n,numericValue:t.entity?this.parseNumber(t.entity):Number.NaN,unit:i}})}getBatteryLevel(e){let r=e.find(a=>a.unit==="%"||/soc|state of charge|akku|charge|level/i.test(a.label));if(!(!r||Number.isNaN(r.numericValue)))return this.clampMeterPercent(r.numericValue)}getSummaryUnit(e){for(let r of e){let a=r.unit?.trim()||this.getUnit(r.entity);if(a)return a}return""}renderSummary(e){let a=[{role:"pv",label:"Generation",className:"pv"},{role:"house",label:"Load",className:"house"},{role:"battery",label:"Battery",className:"battery"},{role:"grid",label:"Grid",className:"grid"}].map(t=>{let n=e.filter(l=>this.getNodeRole(l)===t.role&&l.entity?.trim());if(n.length===0)return"";let i=n.reduce((l,d)=>l+this.parseNumber(d.entity),0),s=this.getSummaryUnit(n),o=this.formatMetricValue(i.toFixed(Math.abs(i)>=100?0:1),s);return`
          <div class="summary-chip ${t.className}">
            <span>${this.safeText(t.label)}</span>
            <strong>${this.safeText(o)}</strong>
          </div>
        `}).join("");return a.trim()?`<div class="summary-row">${a}</div>`:""}normalizeConfig(e){let r=e.title??"PV Flow";if(e.nodes&&e.nodes.length>0){let t=e.nodes.map(i=>({...i,id:i.id?.trim()||`node_${Math.random().toString(36).slice(2,8)}`,name:i.name?.trim()||"Node",role:i.role??"custom",x:this.clampPercent(Number(i.x)),y:this.clampPercent(Number(i.y))})),n=(e.links??[]).filter(i=>t.some(s=>s.id===i.from)&&t.some(s=>s.id===i.to));return{title:r,nodes:t,links:n}}let a=u.map(t=>({...t,entity:e.entities?.[t.id],image:e.images?.[t.id]}));return{title:r,nodes:a,links:g}}renderNode(e){let r=this.getNodeRole(e),a=this.getNodeMetrics(e),t=a[0],n=a.slice(1),i=r==="battery"?this.getBatteryLevel(a):void 0,s=this.safeText(e.name),o=e.image?.trim(),l=o?`<img src="${this.safeText(o)}" alt="${s}" loading="lazy" />`:`<div class="fallback-icon">${s.slice(0,1)}</div>`,d=r==="battery"&&t&&!Number.isNaN(t.numericValue)?t.numericValue>0?"is-charging":t.numericValue<0?"is-discharging":"is-idle":"",h=n.map(p=>`
          <div class="node-stat">
            <span>${this.safeText(p.label)}</span>
            <strong>${this.safeText(this.formatMetricValue(p.value,p.unit))}</strong>
          </div>
        `).join(""),b=i===void 0?"":`
          <div class="battery-meter" aria-label="Battery level ${i}%">
            <div class="battery-meter-fill" style="width:${i}%;"></div>
          </div>
        `;return`
      <article class="node node-${r} ${d}" style="left:${this.clampPercent(e.x)}%; top:${this.clampPercent(e.y)}%;">
        <div class="node-orb">
          <div class="node-media">${l}</div>
          <div class="node-kicker">${this.safeText(this.roleLabel(r))}</div>
          <div class="node-label">${s}</div>
          <div class="node-value">${this.safeText(this.formatMetricValue(t.value,t.unit))}</div>
          <div class="node-value-label">${this.safeText(t.label)}</div>
          ${b}
        </div>
        ${h?`<div class="node-stats">${h}</div>`:""}
      </article>
    `}resolveLinkDirection(e){if(!e.entity)return"idle";let r=this.parseNumber(e.entity);return e.invert&&(r=-r),r>0?"forward":r<0?"reverse":"idle"}renderLinks(e,r){let a=new Map(e.map(n=>[n.id,n]));return`<svg class="line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${r.map((n,i)=>{let s=a.get(n.from),o=a.get(n.to);if(!s||!o)return"";let l=this.resolveLinkDirection(n),d=n.label?.trim()?`<title>${this.safeText(n.label)}</title>`:"";return`<line class="flow-line ${l}" x1="${s.x}" y1="${s.y}" x2="${o.x}" y2="${o.y}">${d}</line>`}).join("")}</svg>`}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let r=this.normalizeConfig(this._config??f.getStubConfig());e.innerHTML=`
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
            min-height: 520px;
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
        <div class="title">${this.safeText(r.title)}</div>
        ${this.renderSummary(r.nodes)}
        <div class="flow-wrap">
          ${this.renderLinks(r.nodes,r.links)}
          ${r.nodes.map(a=>this.renderNode(a)).join("")}
        </div>
      </ha-card>
    `}},m=class extends HTMLElement{_config;_hass;safeText(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}setConfig(e){this._config={...c.getStubConfig(),...e},this.render()}set hass(e){this._hass=e,this.render()}connectedCallback(){this.render()}get safeConfig(){return this._config??c.getStubConfig()}emitConfig(e){this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0})),this.render()}updateNode(e,r,a,t){let n=[...e];n[a]={...n[a],...t},this.emitConfig({...this.safeConfig,nodes:n,links:r})}getEntityIds(){return Object.keys(this._hass?.states??{}).sort((e,r)=>e.localeCompare(r))}renderEntitySelect(e,r,a="Select entity"){let t=this.getEntityIds(),n=r?.trim()??"",i=n&&!t.includes(n)?`<option value="${this.safeText(n)}" selected>${this.safeText(n)}</option>`:"",s=t.map(o=>{let l=o===n?"selected":"";return`<option value="${this.safeText(o)}" ${l}>${this.safeText(o)}</option>`}).join("");return`
      <select data-field="${String(e)}">
        <option value="">${this.safeText(a)}</option>
        ${i}
        ${s}
      </select>
    `}readFileAsDataUrl(e){return new Promise((r,a)=>{let t=new FileReader;t.addEventListener("load",()=>{if(typeof t.result=="string"){r(t.result);return}a(new Error("Image upload failed"))}),t.addEventListener("error",()=>a(t.error??new Error("Image upload failed"))),t.readAsDataURL(e)})}renderNodeRows(e){let r=["pv","battery","house","grid","custom"];return e.map((a,t)=>`
          <section class="node-card" data-kind="node" data-index="${t}">
            <div class="card-head">
              <strong>Node ${t+1}</strong>
              <button data-action="remove-node" type="button">Remove</button>
            </div>
            <div class="node-grid">
              <label>
                <span>ID</span>
                <input data-field="id" value="${this.safeText(a.id)}" placeholder="battery_1" />
              </label>
              <label>
                <span>Name</span>
                <input data-field="name" value="${this.safeText(a.name)}" placeholder="Battery 1" />
              </label>
              <label>
                <span>Type</span>
                <select data-field="role">
                  ${r.map(n=>`<option value="${n}" ${(a.role??"custom")===n?"selected":""}>${n}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>Image URL</span>
                <input data-field="image" value="${this.safeText(a.image??"")}" placeholder="/local/pv/battery.png" />
              </label>
              <label>
                <span>X</span>
                <input data-field="x" type="number" min="0" max="100" value="${a.x}" />
              </label>
              <label>
                <span>Y</span>
                <input data-field="y" type="number" min="0" max="100" value="${a.y}" />
              </label>
            </div>
            <div class="image-tools">
              <label class="upload-field">
                <span>Upload image</span>
                <input data-action="upload-image" type="file" accept="image/*" />
              </label>
              <button data-action="clear-image" type="button">Clear image</button>
              <div class="image-preview ${a.image?.trim()?"has-image":""}">
                ${a.image?.trim()?`<img src="${this.safeText(a.image)}" alt="${this.safeText(a.name)} preview" />`:"<span>No image</span>"}
              </div>
            </div>
            <div class="metric-grid">
              <label>
                <span>Primary entity</span>
                ${this.renderEntitySelect("entity",a.entity,"Choose primary entity")}
              </label>
              <label>
                <span>Primary label</span>
                <input data-field="entityLabel" value="${this.safeText(a.entityLabel??"")}" placeholder="Charge / Discharge" />
              </label>
              <label>
                <span>Primary unit</span>
                <input data-field="unit" value="${this.safeText(a.unit??"")}" placeholder="auto / W" />
              </label>
              <label>
                <span>Secondary entity</span>
                ${this.renderEntitySelect("secondaryEntity",a.secondaryEntity,"Choose secondary entity")}
              </label>
              <label>
                <span>Secondary label</span>
                <input data-field="secondaryLabel" value="${this.safeText(a.secondaryLabel??"")}" placeholder="SOC" />
              </label>
              <label>
                <span>Secondary unit</span>
                <input data-field="secondaryUnit" value="${this.safeText(a.secondaryUnit??"")}" placeholder="auto / %" />
              </label>
              <label>
                <span>Tertiary entity</span>
                ${this.renderEntitySelect("tertiaryEntity",a.tertiaryEntity,"Choose tertiary entity")}
              </label>
              <label>
                <span>Tertiary label</span>
                <input data-field="tertiaryLabel" value="${this.safeText(a.tertiaryLabel??"")}" placeholder="Today" />
              </label>
              <label>
                <span>Tertiary unit</span>
                <input data-field="tertiaryUnit" value="${this.safeText(a.tertiaryUnit??"")}" placeholder="auto / kWh" />
              </label>
            </div>
          </section>
        `).join("")}renderLinkRows(e,r){let a=r.map(t=>`<option value="${this.safeText(t.id)}">${this.safeText(t.name)} (${this.safeText(t.id)})</option>`).join("");return e.map((t,n)=>`
          <div class="row" data-kind="link" data-index="${n}">
            <select data-field="from">${a}</select>
            <select data-field="to">${a}</select>
            ${this.renderEntitySelect("entity",t.entity,"Choose flow entity")}
            <input data-field="label" value="${this.safeText(t.label??"")}" placeholder="Label optional" />
            <label class="invert"><input data-field="invert" type="checkbox" ${t.invert?"checked":""} />invert</label>
            <button data-action="remove-link" type="button">X</button>
          </div>
        `).join("")}wireEvents(e,r){let a=this.shadowRoot;a&&(a.querySelectorAll(".node-card[data-kind='node']").forEach((t,n)=>{t.querySelectorAll("input[data-field], select[data-field]").forEach(i=>{i.addEventListener("change",()=>{let s=i.dataset.field,o=i instanceof HTMLInputElement&&i.type==="number"?Number(i.value):i.value;this.updateNode(e,r,n,{[s]:o})})}),t.querySelector("input[data-action='upload-image']")?.addEventListener("change",async i=>{let s=i.currentTarget,o=s.files?.[0];if(o)try{let l=await this.readFileAsDataUrl(o);this.updateNode(e,r,n,{image:l})}catch(l){console.error(l)}finally{s.value=""}}),t.querySelector("button[data-action='clear-image']")?.addEventListener("click",()=>{this.updateNode(e,r,n,{image:""})}),t.querySelector("button[data-action='remove-node']")?.addEventListener("click",()=>{let i=e.filter((l,d)=>d!==n),s=new Set(i.map(l=>l.id)),o=r.filter(l=>s.has(l.from)&&s.has(l.to));this.emitConfig({...this.safeConfig,nodes:i,links:o})})}),a.querySelectorAll(".row[data-kind='link']").forEach((t,n)=>{t.querySelectorAll("input[data-field], select[data-field]").forEach(i=>{if(i instanceof HTMLInputElement&&i.type==="checkbox"){i.addEventListener("change",()=>{let s=[...r];s[n]={...s[n],invert:i.checked},this.emitConfig({...this.safeConfig,nodes:e,links:s})});return}i.addEventListener("change",()=>{let s=i.dataset.field,o=[...r];o[n]={...o[n],[s]:i.value},this.emitConfig({...this.safeConfig,nodes:e,links:o})})}),t.querySelector("button[data-action='remove-link']")?.addEventListener("click",()=>{let i=r.filter((s,o)=>o!==n);this.emitConfig({...this.safeConfig,nodes:e,links:i})})}),a.querySelector("button[data-action='add-node']")?.addEventListener("click",()=>{let t=[...e,{id:`node_${e.length+1}`,name:`Node ${e.length+1}`,x:50,y:50}];this.emitConfig({...this.safeConfig,nodes:t,links:r})}),a.querySelector("button[data-action='add-link']")?.addEventListener("click",()=>{if(e.length<2)return;let t=[...r,{from:e[0].id,to:e[1].id,entity:"",invert:!1}];this.emitConfig({...this.safeConfig,nodes:e,links:t})}),a.querySelectorAll(".row[data-kind='link']").forEach((t,n)=>{let i=t.querySelectorAll("select[data-field]"),s=r[n];i[0]&&(i[0].value=s.from),i[1]&&(i[1].value=s.to)}))}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let r=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:u,a=this.safeConfig.links??g;e.innerHTML=`
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
          <h3 class="panel-title">Devices</h3>
          <p class="panel-copy">Each device can show up to three values, for example power, SOC and daily energy.</p>
          ${this.renderNodeRows(r)}
          <div class="actions"><button data-action="add-node" type="button">Add device</button></div>
        </section>

        <section class="panel">
          <h3 class="panel-title">Flows</h3>
          <p class="panel-copy">Connect devices and assign a power sensor to control arrow direction.</p>
          ${this.renderLinkRows(a,r)}
          <div class="actions"><button data-action="add-link" type="button">Add flow</button></div>
        </section>
      </div>
    `;let t=e.querySelector("#title");t?.addEventListener("change",()=>{this.emitConfig({...this.safeConfig,title:t.value,nodes:r,links:a})}),this.wireEvents(r,a)}};customElements.define("mergner-pv-card",c);customElements.define("mergner-pv-card-editor",m);window.customCards=window.customCards||[];window.customCards.push({type:"mergner-pv-card",name:"Mergner PV Card",description:"Dynamic PV flow card with visual editor",preview:!0});
