var L="0.0.29",w=[{id:"solar",name:"Solar",role:"pv",entityLabel:"Leistung",secondaryLabel:"Heute",size:120,x:20,y:20},{id:"battery",name:"Batterie",role:"battery",entityLabel:"Laden / Entladen",secondaryLabel:"SOC",secondaryUnit:"%",tertiaryLabel:"Heute",size:120,x:80,y:20},{id:"house",name:"Haus",role:"house",entityLabel:"Verbrauch",secondaryLabel:"Heute",size:120,x:20,y:80},{id:"grid",name:"Netz",role:"grid",entityLabel:"Bezug / Einspeisung",secondaryLabel:"Heute",size:120,x:80,y:80}],E=[{from:"solar",to:"house",entity:"sensor.pv_to_house_power"},{from:"solar",to:"battery",entity:"sensor.pv_to_battery_power"},{from:"battery",to:"house",entity:"sensor.battery_to_house_power"},{from:"grid",to:"house",entity:"sensor.grid_to_house_power"}],u={forwardColor:"#74e0cb",reverseColor:"#ffb166",idleColor:"#7e8f92",textColor:"#d8fff6",baseThickness:.78,textSize:1.7,textOutline:.28},v=class $ extends HTMLElement{_config;_hass;static getConfigElement(){return document.createElement("mergner-pv-card-editor")}static getStubConfig(){return{type:"custom:mergner-pv-card",title:"PV Flow",nodes:w,links:E}}setConfig(e){if(!e||e.type!=="custom:mergner-pv-card")throw new Error("Card type must be custom:mergner-pv-card");this._config=e,this.render()}set hass(e){this._hass=e,this.render()}getCardSize(){return 5}connectedCallback(){this.render()}safeText(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}clampMeterPercent(e){return Number.isNaN(e)?0:Math.max(0,Math.min(100,e))}clampNodeSize(e){return Number.isNaN(e)?120:Math.max(40,Math.min(320,e))}sanitizeHexColor(e,a){let i=typeof e=="string"?e.trim():"";return/^#([0-9a-fA-F]{6})$/.test(i)||/^#([0-9a-fA-F]{3})$/.test(i)?i:a}normalizeFlowStyle(e){let a=e??{};return{forwardColor:this.sanitizeHexColor(a.forwardColor,u.forwardColor),reverseColor:this.sanitizeHexColor(a.reverseColor,u.reverseColor),idleColor:this.sanitizeHexColor(a.idleColor,u.idleColor),textColor:this.sanitizeHexColor(a.textColor,u.textColor),baseThickness:Math.max(.4,Math.min(1.6,Number(a.baseThickness??u.baseThickness))),textSize:Math.max(1.1,Math.min(3.3,Number(a.textSize??u.textSize))),textOutline:Math.max(0,Math.min(.8,Number(a.textOutline??u.textOutline)))}}getEntity(e){if(!(!e||!this._hass?.states?.[e]))return this._hass.states[e]}getState(e){return this.getEntity(e)?.state??"n/a"}getUnit(e){let i=this.getEntity(e)?.attributes?.unit_of_measurement;return typeof i=="string"?i:""}parseNumber(e){let a=this.getState(e),i=Number.parseFloat(a);return Number.isFinite(i)?i:0}getNodeRole(e){return e.role??"custom"}roleLabel(e){switch(e){case"pv":return"PV";case"battery":return"Batterie";case"house":return"Haus";case"grid":return"Netz";case"inverter":return"Wechselrichter";default:return"Knoten"}}defaultMetricLabel(e,a){if(a==="primary")switch(e){case"pv":return"Leistung";case"battery":return"Laden / Entladen";case"house":return"Verbrauch";case"grid":return"Bezug / Einspeisung";case"inverter":return"Leistung";default:return"Wert"}if(a==="secondary")switch(e){case"battery":return"SOC";case"pv":case"house":case"grid":case"inverter":return"Heute";default:return"Detail"}return e==="battery"?"Heute":"Extra"}formatMetricValue(e,a){let i=e.trim(),t=a.trim();return t?`${i} ${t}`:i}getNodeMetrics(e){let a=this.getNodeRole(e);return[{entity:e.entity,label:e.entityLabel,unit:e.unit,defaultLabel:this.defaultMetricLabel(a,"primary"),showWhenEmpty:!0},{entity:e.secondaryEntity,label:e.secondaryLabel,unit:e.secondaryUnit,defaultLabel:this.defaultMetricLabel(a,"secondary"),showWhenEmpty:!1},{entity:e.tertiaryEntity,label:e.tertiaryLabel,unit:e.tertiaryUnit,defaultLabel:this.defaultMetricLabel(a,"tertiary"),showWhenEmpty:!1}].filter(t=>t.showWhenEmpty||!!t.entity?.trim()).map(t=>{let r=t.entity?this.getState(t.entity):"n/a",o=t.unit??(t.entity?this.getUnit(t.entity):"");return{label:t.label?.trim()||t.defaultLabel,value:r,numericValue:t.entity?this.parseNumber(t.entity):Number.NaN,unit:o}})}getBatteryLevel(e){let a=e.find(i=>i.unit==="%"||/soc|state of charge|akku|charge|level/i.test(i.label));if(!(!a||Number.isNaN(a.numericValue)))return this.clampMeterPercent(a.numericValue)}getSummaryUnit(e){for(let a of e){let i=a.unit?.trim()||this.getUnit(a.entity);if(i)return i}return""}renderSummary(e){let i=[{role:"pv",label:"Erzeugung",className:"pv"},{role:"house",label:"Verbrauch",className:"house"},{role:"battery",label:"Batterie",className:"battery"},{role:"grid",label:"Netz",className:"grid"}].map(t=>{let r=e.filter(l=>this.getNodeRole(l)===t.role&&l.entity?.trim());if(r.length===0)return"";let o=r.reduce((l,d)=>l+this.parseNumber(d.entity),0),n=this.getSummaryUnit(r),s=this.formatMetricValue(o.toFixed(Math.abs(o)>=100?0:1),n);return`
          <div class="summary-chip ${t.className}">
            <span>${this.safeText(t.label)}</span>
            <strong>${this.safeText(s)}</strong>
          </div>
        `}).join("");return i.trim()?`<div class="summary-row">${i}</div>`:""}normalizeConfig(e){let a=e.title??"PV Flow",i=this.normalizeFlowStyle(e.flowStyle);if(e.nodes&&e.nodes.length>0){let r=e.nodes.map(n=>({...n,id:n.id?.trim()||`node_${Math.random().toString(36).slice(2,8)}`,name:n.name?.trim()||"Node",role:n.role??"custom",size:this.clampNodeSize(Number(n.size??120)),x:this.clampPercent(Number(n.x)),y:this.clampPercent(Number(n.y))})),o=(e.links??[]).filter(n=>r.some(s=>s.id===n.from)&&r.some(s=>s.id===n.to));return{title:a,nodes:r,links:o,flowStyle:i}}let t=w.map(r=>({...r,entity:e.entities?.[r.id],image:e.images?.[r.id]}));return{title:a,nodes:t,links:E,flowStyle:i}}toNodeSizePercent(e){let i=this.clampNodeSize(e)/120*18;return Math.max(8,Math.min(36,i))}fitNodesToCard(e){let a=e.map(t=>({...t,x:this.clampPercent(Number(t.x)),y:this.clampPercent(Number(t.y)),renderSize:this.toNodeSizePercent(Number(t.size??120))})),i=1;for(let t of a){let r=t.renderSize/2,o=Math.abs(t.x-50),n=Math.abs(t.y-50),s=50/Math.max(1,o+r),l=50/Math.max(1,n+r);i=Math.min(i,s,l)}return i=Math.max(.22,Math.min(1,i)),a.map(t=>({...t,x:50+(t.x-50)*i,y:50+(t.y-50)*i,renderSize:t.renderSize*i}))}renderNode(e){let a=this.getNodeRole(e),i=this.getNodeMetrics(e),t=i[0],r=i.slice(1),o=a==="battery"?this.getBatteryLevel(i):void 0,n=this.safeText(e.name),s=Math.max(4,Math.min(40,e.renderSize)),l=e.image?.trim(),d=`<div class="fallback-icon">${n.slice(0,1)}</div>`,c=a==="battery"&&t&&!Number.isNaN(t.numericValue)?t.numericValue>0?"is-charging":t.numericValue<0?"is-discharging":"is-idle":"",p=r.map(m=>`
          <div class="node-stat">
            <span>${this.safeText(m.label)}</span>
            <strong>${this.safeText(this.formatMetricValue(m.value,m.unit))}</strong>
          </div>
        `).join(""),g=o===void 0?"":`
          <div class="battery-meter" aria-label="Battery level ${o}%">
            <div class="battery-meter-fill" style="width:${o}%;"></div>
          </div>
        `;return`
      <article class="node node-${a} ${c}" style="--node-size:${s}%; left:${this.clampPercent(e.x)}%; top:${this.clampPercent(e.y)}%;">
        <div class="node-orb ${l?"has-image":""}">
          ${l?`<img class="node-bg-image" src="${this.safeText(l)}" alt="${n}" loading="lazy" />`:""}
          <div class="node-overlay">
            ${l?"":`<div class="node-media">${d}</div>`}
            <div class="node-kicker node-chip">${this.safeText(this.roleLabel(a))}</div>
            <div class="node-label node-chip">${n}</div>
            <div class="node-value node-chip">${this.safeText(this.formatMetricValue(t.value,t.unit))}</div>
            <div class="node-value-label node-chip">${this.safeText(t.label)}</div>
            ${g}
          </div>
        </div>
        ${p?`<div class="node-stats">${p}</div>`:""}
      </article>
    `}getLineAnnotationOffset(e){return e==="bottom"?3.6:-3.6}toWatts(e,a){let i=a.trim().toLowerCase();return Number.isFinite(e)?i==="kw"?e*1e3:i==="mw"?e*1e6:e:0}getEntityPowerWatts(e){if(!e?.trim())return 0;let a=Math.abs(this.parseNumber(e));return this.toWatts(a,this.getUnit(e))}getSignedFlowPowerWatts(e){if(!!(e.forwardEntity?.trim()||e.reverseEntity?.trim())){let r=this.getEntityPowerWatts(e.forwardEntity),o=this.getEntityPowerWatts(e.reverseEntity),n=0;return(r>0||o>0)&&(r>=o?n=r:n=-o),e.invert?-n:n}if(!e.entity?.trim())return 0;let i=this.parseNumber(e.entity),t=this.toWatts(i,this.getUnit(e.entity));return e.invert?-t:t}getLinkValue(e){if(e.valueEntity?.trim()){let t=this.getState(e.valueEntity),r=e.valueUnit??this.getUnit(e.valueEntity);return this.formatMetricValue(t,r)}let a=this.getSignedFlowPowerWatts(e);if(a===0)return"";let i=a>0?e.forwardEntity?.trim()||"":e.reverseEntity?.trim()||"";if(i){let t=this.getState(i),r=e.valueUnit??this.getUnit(i);return this.formatMetricValue(t,r)}if(e.entity?.trim()){let t=this.getState(e.entity),r=e.valueUnit??this.getUnit(e.entity);return this.formatMetricValue(t,r)}return""}resolveLinkDirection(e){let a=this.getSignedFlowPowerWatts(e);return a>0?"forward":a<0?"reverse":"idle"}getLinkDirectionalLabel(e,a){return a==="forward"&&e.forwardLabel?.trim()?e.forwardLabel.trim():a==="reverse"&&e.reverseLabel?.trim()?e.reverseLabel.trim():e.label?.trim()??""}getLinkPowerWatts(e){let a=Math.abs(this.getSignedFlowPowerWatts(e));return Number.isFinite(a)?a:0}getFlowStrokeWidth(e,a,i){return a==="idle"?Math.max(.35,.56*i):(.56+Math.min(1,Math.sqrt(e/7e3))*.98)*i}getFlowDashLength(e,a){return a==="idle"?2.8:2.8+Math.min(1,Math.log10(e+1)/4)*2.2}getFlowDurationSeconds(e,a){return a==="idle"?2.6:2.2-Math.min(1,Math.log10(e+1)/4)*1.65}renderLinks(e,a,i){let t=new Map(e.map(o=>[o.id,o]));return`<svg class="line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${a.map(o=>{let n=t.get(o.from),s=t.get(o.to);if(!n||!s)return"";let l=(n.x+s.x)/2,d=(n.y+s.y)/2,c=s.x-n.x,p=s.y-n.y,g=Math.hypot(c,p)||1,m=-p/g,h=c/g,f=o.labelPosition??"top",C=o.valuePosition??"bottom",b=this.resolveLinkDirection(o),y=this.getLinkDirectionalLabel(o,b),x=this.getLinkValue(o),M=y&&x&&f===C?1.8:0,T=y&&x&&f===C?-1.8:0,k=this.getLineAnnotationOffset(f)+M,z=this.getLineAnnotationOffset(C)+T,_=l+m*k,P=d+h*k,R=l+m*z,H=d+h*z,N=this.getLinkPowerWatts(o),A=this.getFlowStrokeWidth(N,b,i.baseThickness),F=this.getFlowDashLength(N,b),U=Math.max(2.2,F*.85),j=this.getFlowDurationSeconds(N,b),V=`--flow-stroke:${A.toFixed(2)}; --flow-dash:${F.toFixed(2)}; --flow-gap:${U.toFixed(2)}; --flow-duration:${j.toFixed(2)}s;`,D=y?`<title>${this.safeText(y)}</title>`:"",O=y?`<text class="flow-annotation flow-annotation-label" x="${_}" y="${P}" text-anchor="middle" dominant-baseline="middle">${this.safeText(y)}</text>`:"",I=x?`<text class="flow-annotation flow-annotation-value" x="${R}" y="${H}" text-anchor="middle" dominant-baseline="middle">${this.safeText(x)}</text>`:"";return`<g class="flow-edge"><line class="flow-line ${b}" style="${V}" x1="${n.x}" y1="${n.y}" x2="${s.x}" y2="${s.y}">${D}</line>${O}${I}</g>`}).join("")}</svg>`}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let a=this.normalizeConfig(this._config??$.getStubConfig()),i=this.fitNodesToCard(a.nodes);e.innerHTML=`
      <style>
        :host {
          display: block;
        }

        ha-card {
          --pv-card-bg: linear-gradient(135deg, #07151e 0%, #0f2f3a 45%, #1f4e55 100%);
          --pv-card-text: #e8f6f6;
          --pv-card-muted: #acd2d3;
          --flow-forward: ${a.flowStyle.forwardColor};
          --flow-reverse: ${a.flowStyle.reverseColor};
          --flow-idle: ${a.flowStyle.idleColor};
          --flow-annotation-color: ${a.flowStyle.textColor};
          --flow-annotation-size: ${a.flowStyle.textSize}px;
          --flow-annotation-stroke: ${a.flowStyle.textOutline}px;
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
          <div class="title">${this.safeText(a.title)}</div>
          <div class="title-version">v${this.safeText(L)}</div>
        </div>
        ${this.renderSummary(a.nodes)}
        <div class="flow-wrap">
          ${this.renderLinks(i,a.links,a.flowStyle)}
          ${i.map(t=>this.renderNode(t)).join("")}
        </div>
        <div class="card-version">v${this.safeText(L)}</div>
      </ha-card>
    `}},S=class extends HTMLElement{_config;_hass;_dragNodeIndex;_dragEventsBound=!1;_entityIdsSignature="";_layoutZoom=100;_layoutZoomMode="auto";clampEditorNodeSize(e){return Number.isNaN(e)?120:Math.max(40,Math.min(320,e))}clampFlowSetting(e,a,i,t){return Number.isFinite(e)?Math.max(a,Math.min(i,e)):t}sanitizeEditorHexColor(e,a){let i=typeof e=="string"?e.trim():"";return/^#([0-9a-fA-F]{6})$/.test(i)||/^#([0-9a-fA-F]{3})$/.test(i)?i:a}normalizeEditorFlowStyle(e){let a=e??{};return{forwardColor:this.sanitizeEditorHexColor(a.forwardColor,u.forwardColor),reverseColor:this.sanitizeEditorHexColor(a.reverseColor,u.reverseColor),idleColor:this.sanitizeEditorHexColor(a.idleColor,u.idleColor),textColor:this.sanitizeEditorHexColor(a.textColor,u.textColor),baseThickness:this.clampFlowSetting(Number(a.baseThickness??u.baseThickness),.4,1.6,u.baseThickness),textSize:this.clampFlowSetting(Number(a.textSize??u.textSize),1.1,3.3,u.textSize),textOutline:this.clampFlowSetting(Number(a.textOutline??u.textOutline),0,.8,u.textOutline)}}safeText(e){return(typeof e=="string"?e:String(e??"")).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampEditorPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}getNodeRadiusPercent(e){let a=this.clampEditorNodeSize(Number(e.size??120));return Math.max(8,Math.min(36,a/120*18))/2}clampNodePosition(e,a,i){let t=this.getNodeRadiusPercent(e),r=Math.max(2,t),o=Math.min(98,100-t);return{x:Math.max(r,Math.min(o,this.clampEditorPercent(a))),y:Math.max(r,Math.min(o,this.clampEditorPercent(i)))}}normalizeEditorConfig(e){let a=v.getStubConfig(),i=e??{},t={...a,...i,title:(i.title??a.title??"PV Flow").toString(),flowStyle:this.normalizeEditorFlowStyle(i.flowStyle)},o=(Array.isArray(i.nodes)&&i.nodes.length>0?i.nodes:a.nodes??[]).map((d,c)=>{let p={...d,id:(d.id??`node_${c+1}`).toString().trim()||`node_${c+1}`,name:(d.name??`Node ${c+1}`).toString().trim()||`Node ${c+1}`,role:d.role??"custom",x:this.clampEditorPercent(Number(d.x)),y:this.clampEditorPercent(Number(d.y)),size:this.clampEditorNodeSize(Number(d.size??120))},g=this.clampNodePosition(p,p.x,p.y);return{...p,...g}}),n=new Set(o.map(d=>d.id)),l=(Array.isArray(i.links)?i.links:a.links??[]).filter(d=>n.has(d.from)&&n.has(d.to));return{...t,nodes:o,links:l}}setConfig(e){this._config=this.normalizeEditorConfig(e),this.render()}set hass(e){let a=Object.keys(e?.states??{}).sort((t,r)=>t.localeCompare(r)).join("|"),i=!this._hass||a!==this._entityIdsSignature;this._hass=e,this._entityIdsSignature=a,i&&this.render()}connectedCallback(){this.bindDragEvents(),this.render()}get safeConfig(){return this._config??v.getStubConfig()}emitConfig(e){this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0})),this.render()}updateNode(e,a,i,t){let r=[...e],o={...r[i],...t},n=this.clampNodePosition(o,Number(o.x),Number(o.y));r[i]={...o,...n,size:this.clampEditorNodeSize(Number(o.size??120))},this.emitConfig({...this.safeConfig,nodes:r,links:a})}bindDragEvents(){this._dragEventsBound||(window.addEventListener("pointermove",this.handlePointerMove),window.addEventListener("pointerup",this.handlePointerUp),window.addEventListener("pointercancel",this.handlePointerUp),this._dragEventsBound=!0)}disconnectedCallback(){this._dragEventsBound&&(window.removeEventListener("pointermove",this.handlePointerMove),window.removeEventListener("pointerup",this.handlePointerUp),window.removeEventListener("pointercancel",this.handlePointerUp),this._dragEventsBound=!1)}getEntityIds(){return Object.keys(this._hass?.states??{}).sort((e,a)=>e.localeCompare(a))}getEntityUnit(e){let i=this._hass?.states?.[e]?.attributes?.unit_of_measurement;return typeof i=="string"?i:""}getEntityDeviceClass(e){let i=this._hass?.states?.[e]?.attributes?.device_class;return typeof i=="string"?i:""}matchesEntityFilter(e,a){if(a==="any")return!0;let i=this.getEntityUnit(e).toLowerCase(),t=this.getEntityDeviceClass(e).toLowerCase();return a==="power"?/^(w|kw|mw|gw|va|kva)$/.test(i)||["power","apparent_power","reactive_power"].includes(t):a==="energy"?/^(wh|kwh|mwh|gwh)$/.test(i)||t==="energy":i==="%"||t==="battery"}getNodeEntityFilter(e,a){return a==="entity"?"power":a==="secondaryEntity"?e.role==="battery"?"percent":"energy":a==="tertiaryEntity"?"energy":"any"}renderEntitySelect(e,a,i,t="Select entity",r="any"){let o=this.getEntityIds(),n=i?.trim()??"",s=n&&!o.includes(n)?`<option value="${this.safeText(n)}" selected>${this.safeText(n)}</option>`:"",l=o.filter(m=>this.matchesEntityFilter(m,r)),d=o.filter(m=>!l.includes(m)),c=m=>m.map(h=>{let f=h===n?"selected":"";return`<option value="${this.safeText(h)}" ${f}>${this.safeText(h)}</option>`}).join(""),p=l.length>0?`<optgroup label="Recommended">${c(l)}</optgroup>`:"",g=d.length>0?`<optgroup label="All entities">${c(d)}</optgroup>`:"";return`
      <div class="entity-select-wrap">
        <input
          type="search"
          data-action="entity-search"
          data-target="${this.safeText(e)}"
          placeholder="Search entities..."
          aria-label="Search entities"
        />
        <select data-field="${String(a)}" data-entity-select-id="${this.safeText(e)}">
          <option value="">${this.safeText(t)}</option>
          ${s}
          ${p}
          ${g}
        </select>
      </div>
    `}renderLayoutCanvas(e,a){let i=new Map(e.map(n=>[n.id,n])),t=this.getEffectiveLayoutZoom(e),r=a.map(n=>{let s=i.get(n.from),l=i.get(n.to);if(!s||!l)return"";let d=this.projectLayoutPosition(s.x,t),c=this.projectLayoutPosition(s.y,t),p=this.projectLayoutPosition(l.x,t),g=this.projectLayoutPosition(l.y,t);return`<line x1="${d}" y1="${c}" x2="${p}" y2="${g}"></line>`}).join(""),o=e.map((n,s)=>{let l=n.image?.trim(),d=`<span>${this.safeText(n.name.slice(0,1).toUpperCase())}</span>`,c=t/100,p=Math.max(24,Math.min(220,Math.round((n.size??120)*c))),g=this.projectLayoutPosition(n.x,t),m=this.projectLayoutPosition(n.y,t);return`
          <button
            class="layout-node ${l?"has-image":""}"
            data-action="drag-node"
            data-index="${s}"
            type="button"
            style="--layout-node-size:${p}px; left:${g}%; top:${m}%;"
            aria-label="Drag ${this.safeText(n.name)}"
          >
            ${l?`<img class="layout-node-bg-image" src="${this.safeText(l)}" alt="${this.safeText(n.name)}" />`:""}
            <div class="layout-node-overlay ${l?"with-image":""}">
              ${l?"":`<div class="layout-node-media">${d}</div>`}
              <div class="layout-node-label">${this.safeText(n.name)}</div>
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
          <svg class="layout-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${r}</svg>
          ${o}
        </div>
      </div>
    `}startNodeDrag(e){this._dragNodeIndex=e}getEffectiveLayoutZoom(e){if(this._layoutZoomMode==="manual")return this._layoutZoom;let a=Math.max(...e.map(o=>this.clampEditorNodeSize(Number(o.size??120))),120),i=e.length>=8?.84:e.length>=6?.9:e.length>=4?.96:1,r=Math.round(96/a*100*i);return Math.max(65,Math.min(160,r))}projectLayoutPosition(e,a){let i=a/100,t=50+(e-50)*i;return Math.max(0,Math.min(100,t))}unprojectLayoutPosition(e,a){let i=a/100;if(i<=0)return e;let t=50+(e-50)/i;return this.clampEditorPercent(t)}handlePointerMove=e=>{if(this._dragNodeIndex===void 0)return;let i=this.shadowRoot?.querySelector(".layout-canvas");if(!i)return;let t=i.getBoundingClientRect();if(t.width===0||t.height===0)return;let r=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:w,o=this.safeConfig.links??E,n=this.getEffectiveLayoutZoom(r),s=r[this._dragNodeIndex];if(!s)return;let l=n/100,d=Math.max(24,Math.min(220,Math.round((s.size??120)*l))),c=d/2/t.width*100,p=d/2/t.height*100,g=Math.max(c,Math.min(100-c,(e.clientX-t.left)/t.width*100)),m=Math.max(p,Math.min(100-p,(e.clientY-t.top)/t.height*100)),h=this.unprojectLayoutPosition(g,n),f=this.unprojectLayoutPosition(m,n);this.updateNode(r,o,this._dragNodeIndex,{x:Number(h.toFixed(1)),y:Number(f.toFixed(1))})};handlePointerUp=()=>{this._dragNodeIndex=void 0};readFileAsDataUrl(e){return new Promise((a,i)=>{let t=new FileReader;t.addEventListener("load",()=>{if(typeof t.result=="string"){a(t.result);return}i(new Error("Image upload failed"))}),t.addEventListener("error",()=>i(t.error??new Error("Image upload failed"))),t.readAsDataURL(e)})}renderNodeRows(e){let a=["pv","battery","house","grid","inverter","custom"];return e.map((i,t)=>`
          <section class="node-card" data-kind="node" data-index="${t}">
            <div class="card-head">
              <strong>Node ${t+1}</strong>
              <button data-action="remove-node" type="button">Remove</button>
            </div>
            <div class="node-grid">
              <label>
                <span>ID</span>
                <input data-field="id" value="${this.safeText(i.id)}" placeholder="battery_1" />
              </label>
              <label>
                <span>Name</span>
                <input data-field="name" value="${this.safeText(i.name)}" placeholder="Battery 1" />
              </label>
              <label>
                <span>Type</span>
                <select data-field="role">
                  ${a.map(r=>`<option value="${r}" ${(i.role??"custom")===r?"selected":""}>${r}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>Image URL</span>
                <input data-field="image" value="${this.safeText(i.image??"")}" placeholder="/local/pv/battery.png" />
              </label>
              <label>
                <span>X</span>
                <input data-field="x" type="number" min="0" max="100" value="${i.x}" />
              </label>
              <label>
                <span>Y</span>
                <input data-field="y" type="number" min="0" max="100" value="${i.y}" />
              </label>
              <label>
                <span>Size (px)</span>
                <input data-field="size" type="number" min="40" max="320" value="${Math.round(i.size??120)}" />
              </label>
            </div>
            <div class="image-tools">
              <label class="upload-field">
                <span>Upload image</span>
                <input data-action="upload-image" type="file" accept="image/*" />
              </label>
              <button data-action="clear-image" type="button">Clear image</button>
              <div class="image-preview ${i.image?.trim()?"has-image":""}">
                ${i.image?.trim()?`<img src="${this.safeText(i.image)}" alt="${this.safeText(i.name)} preview" />`:"<span>No image</span>"}
              </div>
            </div>
            <div class="metric-grid">
              <section class="metric-group">
                <h5>Primary</h5>
                <label>
                  <span>Entity</span>
                  ${this.renderEntitySelect(`node-${t}-entity`,"entity",i.entity,"Choose primary entity",this.getNodeEntityFilter(i,"entity"))}
                </label>
                <label>
                  <span>Label</span>
                  <input data-field="entityLabel" value="${this.safeText(i.entityLabel??"")}" placeholder="Charge / Discharge" />
                </label>
                <label>
                  <span>Unit</span>
                  <input data-field="unit" value="${this.safeText(i.unit??"")}" placeholder="auto / W" />
                </label>
              </section>
              <section class="metric-group">
                <h5>Secondary</h5>
                <label>
                  <span>Entity</span>
                  ${this.renderEntitySelect(`node-${t}-secondary`,"secondaryEntity",i.secondaryEntity,"Choose secondary entity",this.getNodeEntityFilter(i,"secondaryEntity"))}
                </label>
                <label>
                  <span>Label</span>
                  <input data-field="secondaryLabel" value="${this.safeText(i.secondaryLabel??"")}" placeholder="SOC" />
                </label>
                <label>
                  <span>Unit</span>
                  <input data-field="secondaryUnit" value="${this.safeText(i.secondaryUnit??"")}" placeholder="auto / %" />
                </label>
              </section>
              <section class="metric-group">
                <h5>Tertiary</h5>
                <label>
                  <span>Entity</span>
                  ${this.renderEntitySelect(`node-${t}-tertiary`,"tertiaryEntity",i.tertiaryEntity,"Choose tertiary entity",this.getNodeEntityFilter(i,"tertiaryEntity"))}
                </label>
                <label>
                  <span>Label</span>
                  <input data-field="tertiaryLabel" value="${this.safeText(i.tertiaryLabel??"")}" placeholder="Today" />
                </label>
                <label>
                  <span>Unit</span>
                  <input data-field="tertiaryUnit" value="${this.safeText(i.tertiaryUnit??"")}" placeholder="auto / kWh" />
                </label>
              </section>
            </div>
          </section>
        `).join("")}renderLinkRows(e,a){let i=a.map(t=>`<option value="${this.safeText(t.id)}">${this.safeText(t.name)} (${this.safeText(t.id)})</option>`).join("");return e.map((t,r)=>`
          <section class="row link-card" data-kind="link" data-index="${r}">
            <div class="card-head">
              <strong>Flow ${r+1}</strong>
              <button data-action="remove-link" type="button">Remove flow</button>
            </div>
            <p class="link-hint">Configure source/target first. Use either a single signed sensor or separate forward/reverse sensors for bidirectional flows.</p>
            <div class="link-grid">
              <label>
                <span>From device</span>
                <select data-field="from">${i}</select>
              </label>
              <label>
                <span>To device</span>
                <select data-field="to">${i}</select>
              </label>
              <label class="link-wide">
                <span>Flow power entity (single signed sensor)</span>
                ${this.renderEntitySelect(`link-${r}-entity`,"entity",t.entity,"Choose flow entity","power")}
              </label>
              <label class="link-wide">
                <span>Forward amount entity (from -> to)</span>
                ${this.renderEntitySelect(`link-${r}-forward-entity`,"forwardEntity",t.forwardEntity,"Choose forward amount entity","power")}
              </label>
              <label class="link-wide">
                <span>Reverse amount entity (to -> from)</span>
                ${this.renderEntitySelect(`link-${r}-reverse-entity`,"reverseEntity",t.reverseEntity,"Choose reverse amount entity","power")}
              </label>
              <label class="inline-toggle">
                <span>Direction</span>
                <span class="inline-toggle-row"><input data-field="invert" type="checkbox" ${t.invert?"checked":""} />Invert direction</span>
              </label>
              <label>
                <span>Line label text</span>
                <input data-field="label" value="${this.safeText(t.label??"")}" placeholder="Label optional" />
              </label>
              <label>
                <span>Forward label text (from -> to)</span>
                <input data-field="forwardLabel" value="${this.safeText(t.forwardLabel??"")}" placeholder="e.g. Zum Netz" />
              </label>
              <label>
                <span>Reverse label text (to -> from)</span>
                <input data-field="reverseLabel" value="${this.safeText(t.reverseLabel??"")}" placeholder="e.g. Vom Netz" />
              </label>
              <label>
                <span>Line label position</span>
                <select data-field="labelPosition">
                  <option value="top" ${(t.labelPosition??"top")==="top"?"selected":""}>Top</option>
                  <option value="bottom" ${(t.labelPosition??"top")==="bottom"?"selected":""}>Bottom</option>
                </select>
              </label>
              <label class="link-wide">
                <span>Value entity on line</span>
                ${this.renderEntitySelect(`link-${r}-value-entity`,"valueEntity",t.valueEntity,"Choose value entity","any")}
              </label>
              <label>
                <span>Value position</span>
                <select data-field="valuePosition">
                  <option value="top" ${(t.valuePosition??"bottom")==="top"?"selected":""}>Top</option>
                  <option value="bottom" ${(t.valuePosition??"bottom")==="bottom"?"selected":""}>Bottom</option>
                </select>
              </label>
              <label>
                <span>Value unit override</span>
                <input data-field="valueUnit" value="${this.safeText(t.valueUnit??"")}" placeholder="auto / W / kW" />
              </label>
            </div>
          </section>
        `).join("")}wireEvents(e,a){let i=this.shadowRoot;i&&(i.querySelectorAll("input[data-action='entity-search']").forEach(t=>{t.addEventListener("input",()=>{let r=t.dataset.target;if(!r)return;let o=i.querySelector(`select[data-entity-select-id='${r}']`);if(!o)return;let n=t.value.trim().toLowerCase();o.querySelectorAll("option").forEach(s=>{if(!s.value){s.hidden=!1;return}let l=(s.textContent??"").toLowerCase(),d=s.value.toLowerCase(),c=s.selected;s.hidden=n.length>0&&!c&&!l.includes(n)&&!d.includes(n)})})}),i.querySelectorAll("input[data-action='layout-zoom']").forEach(t=>{t.addEventListener("input",()=>{let r=Number(t.value);Number.isFinite(r)&&(this._layoutZoomMode="manual",this._layoutZoom=Math.max(50,Math.min(160,r)),this.render())})}),i.querySelector("select[data-action='layout-zoom-mode']")?.addEventListener("change",t=>{let r=t.currentTarget;(r.value==="auto"||r.value==="manual")&&(this._layoutZoomMode=r.value,this.render())}),i.querySelectorAll("input[data-action='flow-style']").forEach(t=>{let r=t.type==="range"?"input":"change";t.addEventListener(r,()=>{let o=t.dataset.field;if(!o)return;let s={...this.normalizeEditorFlowStyle(this.safeConfig.flowStyle)};if(t.dataset.kind==="color"){let l=o;s[l]=t.value}else{let l=o;s[l]=Number(t.value)}this.emitConfig({...this.safeConfig,flowStyle:this.normalizeEditorFlowStyle(s),nodes:e,links:a})})}),i.querySelectorAll(".node-card[data-kind='node']").forEach((t,r)=>{t.querySelectorAll("input[data-field], select[data-field]").forEach(o=>{o.addEventListener("change",()=>{let n=o.dataset.field,s=o instanceof HTMLInputElement&&o.type==="number"?Number(o.value):o.value;this.updateNode(e,a,r,{[n]:s})})}),t.querySelector("input[data-action='upload-image']")?.addEventListener("change",async o=>{let n=o.currentTarget,s=n.files?.[0];if(s)try{let l=await this.readFileAsDataUrl(s);this.updateNode(e,a,r,{image:l})}catch(l){console.error(l)}finally{n.value=""}}),t.querySelector("button[data-action='clear-image']")?.addEventListener("click",()=>{this.updateNode(e,a,r,{image:""})}),t.querySelector("button[data-action='remove-node']")?.addEventListener("click",()=>{let o=e.filter((l,d)=>d!==r),n=new Set(o.map(l=>l.id)),s=a.filter(l=>n.has(l.from)&&n.has(l.to));this.emitConfig({...this.safeConfig,nodes:o,links:s})})}),i.querySelectorAll("button[data-action='drag-node']").forEach(t=>{t.addEventListener("pointerdown",r=>{if(r.button!==0)return;let o=Number(t.dataset.index);Number.isFinite(o)&&(r.preventDefault(),this.startNodeDrag(o))})}),i.querySelectorAll(".row[data-kind='link']").forEach((t,r)=>{t.querySelectorAll("input[data-field], select[data-field]").forEach(o=>{if(o instanceof HTMLInputElement&&o.type==="checkbox"){o.addEventListener("change",()=>{let n=[...a];n[r]={...n[r],invert:o.checked},this.emitConfig({...this.safeConfig,nodes:e,links:n})});return}o.addEventListener("change",()=>{let n=o.dataset.field,s=[...a];s[r]={...s[r],[n]:o.value},this.emitConfig({...this.safeConfig,nodes:e,links:s})})}),t.querySelector("button[data-action='remove-link']")?.addEventListener("click",()=>{let o=a.filter((n,s)=>s!==r);this.emitConfig({...this.safeConfig,nodes:e,links:o})})}),i.querySelector("button[data-action='add-node']")?.addEventListener("click",()=>{let t=[...e,{id:`node_${e.length+1}`,name:`Node ${e.length+1}`,x:50,y:50}];this.emitConfig({...this.safeConfig,nodes:t,links:a})}),i.querySelector("button[data-action='add-link']")?.addEventListener("click",()=>{if(e.length<2)return;let t=[...a,{from:e[0].id,to:e[1].id,entity:"",invert:!1}];this.emitConfig({...this.safeConfig,nodes:e,links:t})}),i.querySelectorAll(".row[data-kind='link']").forEach((t,r)=>{let o=t.querySelectorAll("select[data-field]"),n=a[r];o[0]&&(o[0].value=n.from),o[1]&&(o[1].value=n.to)}))}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let a=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:w,i=this.safeConfig.links??E;e.innerHTML=`
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
          <div class="editor-version">Build v${this.safeText(L)}</div>
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
          ${this.renderLayoutCanvas(a,i)}
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
          ${this.renderNodeRows(a)}
          <div class="actions"><button data-action="add-node" type="button">Add device</button></div>
        </section>

        <section class="panel">
          <h3 class="panel-title">Flows</h3>
          <p class="panel-copy">Connect devices and assign a power sensor to control arrow direction.</p>
          ${this.renderLinkRows(i,a)}
          <div class="actions"><button data-action="add-link" type="button">Add flow</button></div>
        </section>
      </div>
    `;let t=e.querySelector("#title");t?.addEventListener("change",()=>{this.emitConfig({...this.safeConfig,title:t.value,nodes:a,links:i})}),this.wireEvents(a,i)}};customElements.define("mergner-pv-card",v);customElements.define("mergner-pv-card-editor",S);window.customCards=window.customCards||[];window.customCards.push({type:"mergner-pv-card",name:"Mergner PV Card",description:"Dynamic PV flow card with visual editor",preview:!0});
