var v=[{id:"solar",name:"Solar",role:"pv",entityLabel:"Leistung",secondaryLabel:"Heute",size:120,x:20,y:20},{id:"battery",name:"Batterie",role:"battery",entityLabel:"Laden / Entladen",secondaryLabel:"SOC",secondaryUnit:"%",tertiaryLabel:"Heute",size:120,x:80,y:20},{id:"house",name:"Haus",role:"house",entityLabel:"Verbrauch",secondaryLabel:"Heute",size:120,x:20,y:80},{id:"grid",name:"Netz",role:"grid",entityLabel:"Bezug / Einspeisung",secondaryLabel:"Heute",size:120,x:80,y:80}],x=[{from:"solar",to:"house",entity:"sensor.pv_to_house_power"},{from:"solar",to:"battery",entity:"sensor.pv_to_battery_power"},{from:"battery",to:"house",entity:"sensor.battery_to_house_power"},{from:"grid",to:"house",entity:"sensor.grid_to_house_power"}],f=class N extends HTMLElement{_config;_hass;static getConfigElement(){return document.createElement("mergner-pv-card-editor")}static getStubConfig(){return{type:"custom:mergner-pv-card",title:"PV Flow",nodes:v,links:x}}setConfig(e){if(!e||e.type!=="custom:mergner-pv-card")throw new Error("Card type must be custom:mergner-pv-card");this._config=e,this.render()}set hass(e){this._hass=e,this.render()}getCardSize(){return 5}connectedCallback(){this.render()}safeText(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}clampMeterPercent(e){return Number.isNaN(e)?0:Math.max(0,Math.min(100,e))}clampNodeSize(e){return Number.isNaN(e)?120:Math.max(40,Math.min(320,e))}getEntity(e){if(!(!e||!this._hass?.states?.[e]))return this._hass.states[e]}getState(e){return this.getEntity(e)?.state??"n/a"}getUnit(e){let a=this.getEntity(e)?.attributes?.unit_of_measurement;return typeof a=="string"?a:""}parseNumber(e){let i=this.getState(e),a=Number.parseFloat(i);return Number.isFinite(a)?a:0}getNodeRole(e){return e.role??"custom"}roleLabel(e){switch(e){case"pv":return"PV";case"battery":return"Batterie";case"house":return"Haus";case"grid":return"Netz";case"inverter":return"Wechselrichter";default:return"Knoten"}}defaultMetricLabel(e,i){if(i==="primary")switch(e){case"pv":return"Leistung";case"battery":return"Laden / Entladen";case"house":return"Verbrauch";case"grid":return"Bezug / Einspeisung";case"inverter":return"Leistung";default:return"Wert"}if(i==="secondary")switch(e){case"battery":return"SOC";case"pv":case"house":case"grid":case"inverter":return"Heute";default:return"Detail"}return e==="battery"?"Heute":"Extra"}formatMetricValue(e,i){let a=e.trim(),t=i.trim();return t?`${a} ${t}`:a}getNodeMetrics(e){let i=this.getNodeRole(e);return[{entity:e.entity,label:e.entityLabel,unit:e.unit,defaultLabel:this.defaultMetricLabel(i,"primary"),showWhenEmpty:!0},{entity:e.secondaryEntity,label:e.secondaryLabel,unit:e.secondaryUnit,defaultLabel:this.defaultMetricLabel(i,"secondary"),showWhenEmpty:!1},{entity:e.tertiaryEntity,label:e.tertiaryLabel,unit:e.tertiaryUnit,defaultLabel:this.defaultMetricLabel(i,"tertiary"),showWhenEmpty:!1}].filter(t=>t.showWhenEmpty||!!t.entity?.trim()).map(t=>{let n=t.entity?this.getState(t.entity):"n/a",r=t.unit??(t.entity?this.getUnit(t.entity):"");return{label:t.label?.trim()||t.defaultLabel,value:n,numericValue:t.entity?this.parseNumber(t.entity):Number.NaN,unit:r}})}getBatteryLevel(e){let i=e.find(a=>a.unit==="%"||/soc|state of charge|akku|charge|level/i.test(a.label));if(!(!i||Number.isNaN(i.numericValue)))return this.clampMeterPercent(i.numericValue)}getSummaryUnit(e){for(let i of e){let a=i.unit?.trim()||this.getUnit(i.entity);if(a)return a}return""}renderSummary(e){let a=[{role:"pv",label:"Erzeugung",className:"pv"},{role:"house",label:"Verbrauch",className:"house"},{role:"battery",label:"Batterie",className:"battery"},{role:"grid",label:"Netz",className:"grid"}].map(t=>{let n=e.filter(s=>this.getNodeRole(s)===t.role&&s.entity?.trim());if(n.length===0)return"";let r=n.reduce((s,d)=>s+this.parseNumber(d.entity),0),o=this.getSummaryUnit(n),l=this.formatMetricValue(r.toFixed(Math.abs(r)>=100?0:1),o);return`
          <div class="summary-chip ${t.className}">
            <span>${this.safeText(t.label)}</span>
            <strong>${this.safeText(l)}</strong>
          </div>
        `}).join("");return a.trim()?`<div class="summary-row">${a}</div>`:""}normalizeConfig(e){let i=e.title??"PV Flow";if(e.nodes&&e.nodes.length>0){let t=e.nodes.map(r=>({...r,id:r.id?.trim()||`node_${Math.random().toString(36).slice(2,8)}`,name:r.name?.trim()||"Node",role:r.role??"custom",size:this.clampNodeSize(Number(r.size??120)),x:this.clampPercent(Number(r.x)),y:this.clampPercent(Number(r.y))})),n=(e.links??[]).filter(r=>t.some(o=>o.id===r.from)&&t.some(o=>o.id===r.to));return{title:i,nodes:t,links:n}}let a=v.map(t=>({...t,entity:e.entities?.[t.id],image:e.images?.[t.id]}));return{title:i,nodes:a,links:x}}toNodeSizePercent(e){let a=this.clampNodeSize(e)/120*18;return Math.max(8,Math.min(36,a))}fitNodesToCard(e){let i=e.map(t=>({...t,x:this.clampPercent(Number(t.x)),y:this.clampPercent(Number(t.y)),renderSize:this.toNodeSizePercent(Number(t.size??120))})),a=1;for(let t of i){let n=t.renderSize/2,r=Math.abs(t.x-50),o=Math.abs(t.y-50),l=50/Math.max(1,r+n),s=50/Math.max(1,o+n);a=Math.min(a,l,s)}return a=Math.max(.22,Math.min(1,a)),i.map(t=>({...t,x:50+(t.x-50)*a,y:50+(t.y-50)*a,renderSize:t.renderSize*a}))}renderNode(e){let i=this.getNodeRole(e),a=this.getNodeMetrics(e),t=a[0],n=a.slice(1),r=i==="battery"?this.getBatteryLevel(a):void 0,o=this.safeText(e.name),l=Math.max(4,Math.min(40,e.renderSize)),s=e.image?.trim(),d=`<div class="fallback-icon">${o.slice(0,1)}</div>`,c=i==="battery"&&t&&!Number.isNaN(t.numericValue)?t.numericValue>0?"is-charging":t.numericValue<0?"is-discharging":"is-idle":"",p=n.map(u=>`
          <div class="node-stat">
            <span>${this.safeText(u.label)}</span>
            <strong>${this.safeText(this.formatMetricValue(u.value,u.unit))}</strong>
          </div>
        `).join(""),m=r===void 0?"":`
          <div class="battery-meter" aria-label="Battery level ${r}%">
            <div class="battery-meter-fill" style="width:${r}%;"></div>
          </div>
        `;return`
      <article class="node node-${i} ${c}" style="--node-size:${l}%; left:${this.clampPercent(e.x)}%; top:${this.clampPercent(e.y)}%;">
        <div class="node-orb ${s?"has-image":""}">
          ${s?`<img class="node-bg-image" src="${this.safeText(s)}" alt="${o}" loading="lazy" />`:""}
          <div class="node-overlay">
            ${s?"":`<div class="node-media">${d}</div>`}
            <div class="node-kicker node-chip">${this.safeText(this.roleLabel(i))}</div>
            <div class="node-label node-chip">${o}</div>
            <div class="node-value node-chip">${this.safeText(this.formatMetricValue(t.value,t.unit))}</div>
            <div class="node-value-label node-chip">${this.safeText(t.label)}</div>
            ${m}
          </div>
        </div>
        ${p?`<div class="node-stats">${p}</div>`:""}
      </article>
    `}getLineAnnotationOffset(e){return e==="bottom"?3.6:-3.6}getLinkValue(e){if(!e.valueEntity?.trim())return"";let i=this.getState(e.valueEntity),a=e.valueUnit??this.getUnit(e.valueEntity);return this.formatMetricValue(i,a)}resolveLinkDirection(e){if(!e.entity)return"idle";let i=this.parseNumber(e.entity);return e.invert&&(i=-i),i>0?"forward":i<0?"reverse":"idle"}renderLinks(e,i){let a=new Map(e.map(n=>[n.id,n]));return`<svg class="line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${i.map(n=>{let r=a.get(n.from),o=a.get(n.to);if(!r||!o)return"";let l=(r.x+o.x)/2,s=(r.y+o.y)/2,d=o.x-r.x,c=o.y-r.y,p=Math.hypot(d,c)||1,m=-c/p,u=d/p,g=n.labelPosition??"top",h=n.valuePosition??"bottom",y=n.label?.trim()??"",b=this.getLinkValue(n),$=y&&b&&g===h?1.8:0,k=y&&b&&g===h?-1.8:0,E=this.getLineAnnotationOffset(g)+$,L=this.getLineAnnotationOffset(h)+k,M=l+m*E,C=s+u*E,z=l+m*L,S=s+u*L,T=this.resolveLinkDirection(n),P=y?`<title>${this.safeText(y)}</title>`:"",F=y?`<text class="flow-annotation flow-annotation-label" x="${M}" y="${C}" text-anchor="middle" dominant-baseline="middle">${this.safeText(y)}</text>`:"",_=b?`<text class="flow-annotation flow-annotation-value" x="${z}" y="${S}" text-anchor="middle" dominant-baseline="middle">${this.safeText(b)}</text>`:"";return`<g class="flow-edge"><line class="flow-line ${T}" x1="${r.x}" y1="${r.y}" x2="${o.x}" y2="${o.y}">${P}</line>${F}${_}</g>`}).join("")}</svg>`}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let i=this.normalizeConfig(this._config??N.getStubConfig()),a=this.fitNodesToCard(i.nodes);e.innerHTML=`
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

        .flow-annotation {
          font-size: 2.4px;
          font-weight: 700;
          fill: #f5fbfb;
          paint-order: stroke;
          stroke: rgba(0, 0, 0, 0.72);
          stroke-width: 1.2px;
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
          height: var(--node-size);
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
          overflow: hidden;
        }

        .node-bg-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
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
            height: min(58vw, var(--node-size));
          }
        }
      </style>

      <ha-card>
        <div class="title">${this.safeText(i.title)}</div>
        ${this.renderSummary(i.nodes)}
        <div class="flow-wrap">
          ${this.renderLinks(a,i.links)}
          ${a.map(t=>this.renderNode(t)).join("")}
        </div>
      </ha-card>
    `}},w=class extends HTMLElement{_config;_hass;_dragNodeIndex;_dragEventsBound=!1;_entityIdsSignature="";_layoutZoom=100;_layoutZoomMode="auto";clampEditorNodeSize(e){return Number.isNaN(e)?120:Math.max(40,Math.min(320,e))}safeText(e){return(typeof e=="string"?e:String(e??"")).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampEditorPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}getNodeRadiusPercent(e){let i=this.clampEditorNodeSize(Number(e.size??120));return Math.max(8,Math.min(36,i/120*18))/2}clampNodePosition(e,i,a){let t=this.getNodeRadiusPercent(e),n=Math.max(2,t),r=Math.min(98,100-t);return{x:Math.max(n,Math.min(r,this.clampEditorPercent(i))),y:Math.max(n,Math.min(r,this.clampEditorPercent(a)))}}normalizeEditorConfig(e){let i=f.getStubConfig(),a=e??{},t={...i,...a,title:(a.title??i.title??"PV Flow").toString()},r=(Array.isArray(a.nodes)&&a.nodes.length>0?a.nodes:i.nodes??[]).map((d,c)=>{let p={...d,id:(d.id??`node_${c+1}`).toString().trim()||`node_${c+1}`,name:(d.name??`Node ${c+1}`).toString().trim()||`Node ${c+1}`,role:d.role??"custom",x:this.clampEditorPercent(Number(d.x)),y:this.clampEditorPercent(Number(d.y)),size:this.clampEditorNodeSize(Number(d.size??120))},m=this.clampNodePosition(p,p.x,p.y);return{...p,...m}}),o=new Set(r.map(d=>d.id)),s=(Array.isArray(a.links)?a.links:i.links??[]).filter(d=>o.has(d.from)&&o.has(d.to));return{...t,nodes:r,links:s}}setConfig(e){this._config=this.normalizeEditorConfig(e),this.render()}set hass(e){let i=Object.keys(e?.states??{}).sort((t,n)=>t.localeCompare(n)).join("|"),a=!this._hass||i!==this._entityIdsSignature;this._hass=e,this._entityIdsSignature=i,a&&this.render()}connectedCallback(){this.bindDragEvents(),this.render()}get safeConfig(){return this._config??f.getStubConfig()}emitConfig(e){this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0})),this.render()}updateNode(e,i,a,t){let n=[...e],r={...n[a],...t},o=this.clampNodePosition(r,Number(r.x),Number(r.y));n[a]={...r,...o,size:this.clampEditorNodeSize(Number(r.size??120))},this.emitConfig({...this.safeConfig,nodes:n,links:i})}bindDragEvents(){this._dragEventsBound||(window.addEventListener("pointermove",this.handlePointerMove),window.addEventListener("pointerup",this.handlePointerUp),window.addEventListener("pointercancel",this.handlePointerUp),this._dragEventsBound=!0)}disconnectedCallback(){this._dragEventsBound&&(window.removeEventListener("pointermove",this.handlePointerMove),window.removeEventListener("pointerup",this.handlePointerUp),window.removeEventListener("pointercancel",this.handlePointerUp),this._dragEventsBound=!1)}getEntityIds(){return Object.keys(this._hass?.states??{}).sort((e,i)=>e.localeCompare(i))}getEntityUnit(e){let a=this._hass?.states?.[e]?.attributes?.unit_of_measurement;return typeof a=="string"?a:""}getEntityDeviceClass(e){let a=this._hass?.states?.[e]?.attributes?.device_class;return typeof a=="string"?a:""}matchesEntityFilter(e,i){if(i==="any")return!0;let a=this.getEntityUnit(e).toLowerCase(),t=this.getEntityDeviceClass(e).toLowerCase();return i==="power"?/^(w|kw|mw|gw|va|kva)$/.test(a)||["power","apparent_power","reactive_power"].includes(t):i==="energy"?/^(wh|kwh|mwh|gwh)$/.test(a)||t==="energy":a==="%"||t==="battery"}getNodeEntityFilter(e,i){return i==="entity"?"power":i==="secondaryEntity"?e.role==="battery"?"percent":"energy":i==="tertiaryEntity"?"energy":"any"}renderEntitySelect(e,i,a,t="Select entity",n="any"){let r=this.getEntityIds(),o=a?.trim()??"",l=o&&!r.includes(o)?`<option value="${this.safeText(o)}" selected>${this.safeText(o)}</option>`:"",s=r.filter(u=>this.matchesEntityFilter(u,n)),d=r.filter(u=>!s.includes(u)),c=u=>u.map(g=>{let h=g===o?"selected":"";return`<option value="${this.safeText(g)}" ${h}>${this.safeText(g)}</option>`}).join(""),p=s.length>0?`<optgroup label="Recommended">${c(s)}</optgroup>`:"",m=d.length>0?`<optgroup label="All entities">${c(d)}</optgroup>`:"";return`
      <div class="entity-select-wrap">
        <input
          type="search"
          data-action="entity-search"
          data-target="${this.safeText(e)}"
          placeholder="Search entities..."
          aria-label="Search entities"
        />
        <select data-field="${String(i)}" data-entity-select-id="${this.safeText(e)}">
          <option value="">${this.safeText(t)}</option>
          ${l}
          ${p}
          ${m}
        </select>
      </div>
    `}renderLayoutCanvas(e,i){let a=new Map(e.map(o=>[o.id,o])),t=this.getEffectiveLayoutZoom(e),n=i.map(o=>{let l=a.get(o.from),s=a.get(o.to);if(!l||!s)return"";let d=this.projectLayoutPosition(l.x,t),c=this.projectLayoutPosition(l.y,t),p=this.projectLayoutPosition(s.x,t),m=this.projectLayoutPosition(s.y,t);return`<line x1="${d}" y1="${c}" x2="${p}" y2="${m}"></line>`}).join(""),r=e.map((o,l)=>{let s=o.image?.trim(),d=`<span>${this.safeText(o.name.slice(0,1).toUpperCase())}</span>`,c=t/100,p=Math.max(24,Math.min(220,Math.round((o.size??120)*c))),m=this.projectLayoutPosition(o.x,t),u=this.projectLayoutPosition(o.y,t);return`
          <button
            class="layout-node ${s?"has-image":""}"
            data-action="drag-node"
            data-index="${l}"
            type="button"
            style="--layout-node-size:${p}px; left:${m}%; top:${u}%;"
            aria-label="Drag ${this.safeText(o.name)}"
          >
            ${s?`<img class="layout-node-bg-image" src="${this.safeText(s)}" alt="${this.safeText(o.name)}" />`:""}
            <div class="layout-node-overlay ${s?"with-image":""}">
              ${s?"":`<div class="layout-node-media">${d}</div>`}
              <div class="layout-node-label">${this.safeText(o.name)}</div>
            </div>
          </button>
        `}).join("");return`
      <div class="layout-canvas-wrap">
        <div class="layout-toolbar">
          <label>
            <span>Zoom mode</span>
            <select data-action="layout-zoom-mode">
              <option value="auto" ${this._layoutZoomMode==="auto"?"selected":""}>Auto fit</option>
              <option value="manual" ${this._layoutZoomMode==="manual"?"selected":""}>Manual</option>
            </select>
          </label>
          <label>
            <span>Zoom</span>
            <input type="range" data-action="layout-zoom" min="50" max="160" step="5" value="${t}" ${this._layoutZoomMode==="auto"?"disabled":""} />
          </label>
          <input type="number" data-action="layout-zoom" min="50" max="160" step="5" value="${t}" ${this._layoutZoomMode==="auto"?"disabled":""} />
        </div>
        <div class="layout-hint">Drag devices in the preview to set X/Y positions. Zoom scales both size and spacing.</div>
        <div class="layout-canvas">
          <svg class="layout-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${n}</svg>
          ${r}
        </div>
      </div>
    `}startNodeDrag(e){this._dragNodeIndex=e}getEffectiveLayoutZoom(e){if(this._layoutZoomMode==="manual")return this._layoutZoom;let i=Math.max(...e.map(r=>this.clampEditorNodeSize(Number(r.size??120))),120),a=e.length>=8?.84:e.length>=6?.9:e.length>=4?.96:1,n=Math.round(96/i*100*a);return Math.max(65,Math.min(160,n))}projectLayoutPosition(e,i){let a=i/100,t=50+(e-50)*a;return Math.max(0,Math.min(100,t))}unprojectLayoutPosition(e,i){let a=i/100;if(a<=0)return e;let t=50+(e-50)/a;return this.clampEditorPercent(t)}handlePointerMove=e=>{if(this._dragNodeIndex===void 0)return;let a=this.shadowRoot?.querySelector(".layout-canvas");if(!a)return;let t=a.getBoundingClientRect();if(t.width===0||t.height===0)return;let n=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:v,r=this.safeConfig.links??x,o=this.getEffectiveLayoutZoom(n),l=n[this._dragNodeIndex];if(!l)return;let s=o/100,d=Math.max(24,Math.min(220,Math.round((l.size??120)*s))),c=d/2/t.width*100,p=d/2/t.height*100,m=Math.max(c,Math.min(100-c,(e.clientX-t.left)/t.width*100)),u=Math.max(p,Math.min(100-p,(e.clientY-t.top)/t.height*100)),g=this.unprojectLayoutPosition(m,o),h=this.unprojectLayoutPosition(u,o);this.updateNode(n,r,this._dragNodeIndex,{x:Number(g.toFixed(1)),y:Number(h.toFixed(1))})};handlePointerUp=()=>{this._dragNodeIndex=void 0};readFileAsDataUrl(e){return new Promise((i,a)=>{let t=new FileReader;t.addEventListener("load",()=>{if(typeof t.result=="string"){i(t.result);return}a(new Error("Image upload failed"))}),t.addEventListener("error",()=>a(t.error??new Error("Image upload failed"))),t.readAsDataURL(e)})}renderNodeRows(e){let i=["pv","battery","house","grid","inverter","custom"];return e.map((a,t)=>`
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
                  ${i.map(n=>`<option value="${n}" ${(a.role??"custom")===n?"selected":""}>${n}</option>`).join("")}
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
              <label>
                <span>Size (px)</span>
                <input data-field="size" type="number" min="40" max="320" value="${Math.round(a.size??120)}" />
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
                ${this.renderEntitySelect(`node-${t}-entity`,"entity",a.entity,"Choose primary entity",this.getNodeEntityFilter(a,"entity"))}
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
                ${this.renderEntitySelect(`node-${t}-secondary`,"secondaryEntity",a.secondaryEntity,"Choose secondary entity",this.getNodeEntityFilter(a,"secondaryEntity"))}
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
                ${this.renderEntitySelect(`node-${t}-tertiary`,"tertiaryEntity",a.tertiaryEntity,"Choose tertiary entity",this.getNodeEntityFilter(a,"tertiaryEntity"))}
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
        `).join("")}renderLinkRows(e,i){let a=i.map(t=>`<option value="${this.safeText(t.id)}">${this.safeText(t.name)} (${this.safeText(t.id)})</option>`).join("");return e.map((t,n)=>`
          <div class="row" data-kind="link" data-index="${n}">
            <select data-field="from">${a}</select>
            <select data-field="to">${a}</select>
            ${this.renderEntitySelect(`link-${n}-entity`,"entity",t.entity,"Choose flow entity","power")}
            <input data-field="label" value="${this.safeText(t.label??"")}" placeholder="Label optional" />
            <select data-field="labelPosition">
              <option value="top" ${(t.labelPosition??"top")==="top"?"selected":""}>Label top</option>
              <option value="bottom" ${(t.labelPosition??"top")==="bottom"?"selected":""}>Label bottom</option>
            </select>
            ${this.renderEntitySelect(`link-${n}-value-entity`,"valueEntity",t.valueEntity,"Choose value entity","any")}
            <select data-field="valuePosition">
              <option value="top" ${(t.valuePosition??"bottom")==="top"?"selected":""}>Value top</option>
              <option value="bottom" ${(t.valuePosition??"bottom")==="bottom"?"selected":""}>Value bottom</option>
            </select>
            <label class="invert"><input data-field="invert" type="checkbox" ${t.invert?"checked":""} />invert</label>
            <button data-action="remove-link" type="button">X</button>
          </div>
        `).join("")}wireEvents(e,i){let a=this.shadowRoot;a&&(a.querySelectorAll("input[data-action='entity-search']").forEach(t=>{t.addEventListener("input",()=>{let n=t.dataset.target;if(!n)return;let r=a.querySelector(`select[data-entity-select-id='${n}']`);if(!r)return;let o=t.value.trim().toLowerCase();r.querySelectorAll("option").forEach(l=>{if(!l.value){l.hidden=!1;return}let s=(l.textContent??"").toLowerCase(),d=l.value.toLowerCase(),c=l.selected;l.hidden=o.length>0&&!c&&!s.includes(o)&&!d.includes(o)})})}),a.querySelectorAll("input[data-action='layout-zoom']").forEach(t=>{t.addEventListener("input",()=>{let n=Number(t.value);Number.isFinite(n)&&(this._layoutZoomMode="manual",this._layoutZoom=Math.max(50,Math.min(160,n)),this.render())})}),a.querySelector("select[data-action='layout-zoom-mode']")?.addEventListener("change",t=>{let n=t.currentTarget;(n.value==="auto"||n.value==="manual")&&(this._layoutZoomMode=n.value,this.render())}),a.querySelectorAll(".node-card[data-kind='node']").forEach((t,n)=>{t.querySelectorAll("input[data-field], select[data-field]").forEach(r=>{r.addEventListener("change",()=>{let o=r.dataset.field,l=r instanceof HTMLInputElement&&r.type==="number"?Number(r.value):r.value;this.updateNode(e,i,n,{[o]:l})})}),t.querySelector("input[data-action='upload-image']")?.addEventListener("change",async r=>{let o=r.currentTarget,l=o.files?.[0];if(l)try{let s=await this.readFileAsDataUrl(l);this.updateNode(e,i,n,{image:s})}catch(s){console.error(s)}finally{o.value=""}}),t.querySelector("button[data-action='clear-image']")?.addEventListener("click",()=>{this.updateNode(e,i,n,{image:""})}),t.querySelector("button[data-action='remove-node']")?.addEventListener("click",()=>{let r=e.filter((s,d)=>d!==n),o=new Set(r.map(s=>s.id)),l=i.filter(s=>o.has(s.from)&&o.has(s.to));this.emitConfig({...this.safeConfig,nodes:r,links:l})})}),a.querySelectorAll("button[data-action='drag-node']").forEach(t=>{t.addEventListener("pointerdown",n=>{if(n.button!==0)return;let r=Number(t.dataset.index);Number.isFinite(r)&&(n.preventDefault(),this.startNodeDrag(r))})}),a.querySelectorAll(".row[data-kind='link']").forEach((t,n)=>{t.querySelectorAll("input[data-field], select[data-field]").forEach(r=>{if(r instanceof HTMLInputElement&&r.type==="checkbox"){r.addEventListener("change",()=>{let o=[...i];o[n]={...o[n],invert:r.checked},this.emitConfig({...this.safeConfig,nodes:e,links:o})});return}r.addEventListener("change",()=>{let o=r.dataset.field,l=[...i];l[n]={...l[n],[o]:r.value},this.emitConfig({...this.safeConfig,nodes:e,links:l})})}),t.querySelector("button[data-action='remove-link']")?.addEventListener("click",()=>{let r=i.filter((o,l)=>l!==n);this.emitConfig({...this.safeConfig,nodes:e,links:r})})}),a.querySelector("button[data-action='add-node']")?.addEventListener("click",()=>{let t=[...e,{id:`node_${e.length+1}`,name:`Node ${e.length+1}`,x:50,y:50}];this.emitConfig({...this.safeConfig,nodes:t,links:i})}),a.querySelector("button[data-action='add-link']")?.addEventListener("click",()=>{if(e.length<2)return;let t=[...i,{from:e[0].id,to:e[1].id,entity:"",invert:!1}];this.emitConfig({...this.safeConfig,nodes:e,links:t})}),a.querySelectorAll(".row[data-kind='link']").forEach((t,n)=>{let r=t.querySelectorAll("select[data-field]"),o=i[n];r[0]&&(r[0].value=o.from),r[1]&&(r[1].value=o.to)}))}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let i=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:v,a=this.safeConfig.links??x;e.innerHTML=`
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
          grid-template-columns: 1fr;
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

        @media (min-width: 980px) {
          .node-grid,
          .metric-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .image-tools {
            grid-template-columns: minmax(0, 1fr) auto 84px;
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
          ${this.renderLayoutCanvas(i,a)}
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
          ${this.renderLinkRows(a,i)}
          <div class="actions"><button data-action="add-link" type="button">Add flow</button></div>
        </section>
      </div>
    `;let t=e.querySelector("#title");t?.addEventListener("change",()=>{this.emitConfig({...this.safeConfig,title:t.value,nodes:i,links:a})}),this.wireEvents(i,a)}};customElements.define("mergner-pv-card",f);customElements.define("mergner-pv-card-editor",w);window.customCards=window.customCards||[];window.customCards.push({type:"mergner-pv-card",name:"Mergner PV Card",description:"Dynamic PV flow card with visual editor",preview:!0});
