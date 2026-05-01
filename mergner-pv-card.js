var $="0.0.36",L=[{id:"solar",name:"Solar",role:"pv",entityLabel:"Leistung",secondaryLabel:"Heute",size:120,x:20,y:20},{id:"battery",name:"Batterie",role:"battery",entityLabel:"Laden / Entladen",secondaryLabel:"SOC",secondaryUnit:"%",tertiaryLabel:"Heute",size:120,x:80,y:20},{id:"house",name:"Haus",role:"house",entityLabel:"Verbrauch",secondaryLabel:"Heute",size:120,x:20,y:80},{id:"grid",name:"Netz",role:"grid",entityLabel:"Bezug / Einspeisung",secondaryLabel:"Heute",size:120,x:80,y:80}],S=[{from:"solar",to:"house",entity:"sensor.pv_to_house_power"},{from:"solar",to:"battery",entity:"sensor.pv_to_battery_power"},{from:"battery",to:"house",entity:"sensor.battery_to_house_power"},{from:"grid",to:"house",entity:"sensor.grid_to_house_power"}],m={forwardColor:"#74e0cb",reverseColor:"#ffb166",idleColor:"#7e8f92",textColor:"#d8fff6",baseThickness:.78,textSize:1.7,textOutline:.28},E=class F extends HTMLElement{_config;_hass;static getConfigElement(){return document.createElement("mergner-pv-card-editor")}static getStubConfig(){return{type:"custom:mergner-pv-card",title:"PV Flow",nodes:L,links:S}}setConfig(e){if(!e||e.type!=="custom:mergner-pv-card")throw new Error("Card type must be custom:mergner-pv-card");this._config=e,this.render()}set hass(e){this._hass=e,this.render()}getCardSize(){return 5}connectedCallback(){this.render()}safeText(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}clampMeterPercent(e){return Number.isNaN(e)?0:Math.max(0,Math.min(100,e))}clampNodeSize(e){return Number.isNaN(e)?120:Math.max(40,Math.min(320,e))}sanitizeHexColor(e,i){let r=typeof e=="string"?e.trim():"";return/^#([0-9a-fA-F]{6})$/.test(r)||/^#([0-9a-fA-F]{3})$/.test(r)?r:i}normalizeFlowStyle(e){let i=e??{};return{forwardColor:this.sanitizeHexColor(i.forwardColor,m.forwardColor),reverseColor:this.sanitizeHexColor(i.reverseColor,m.reverseColor),idleColor:this.sanitizeHexColor(i.idleColor,m.idleColor),textColor:this.sanitizeHexColor(i.textColor,m.textColor),baseThickness:Math.max(.4,Math.min(1.6,Number(i.baseThickness??m.baseThickness))),textSize:Math.max(1.1,Math.min(3.3,Number(i.textSize??m.textSize))),textOutline:Math.max(0,Math.min(.8,Number(i.textOutline??m.textOutline)))}}getEntity(e){if(!(!e||!this._hass?.states?.[e]))return this._hass.states[e]}getState(e){return this.getEntity(e)?.state??"n/a"}isEmptyState(e){return!e||e==="n/a"||e==="unavailable"||e==="unknown"}getUnit(e){let r=this.getEntity(e)?.attributes?.unit_of_measurement;return typeof r=="string"?r:""}parseNumber(e){let i=this.getState(e),r=Number.parseFloat(i);return Number.isFinite(r)?r:0}getNodeRole(e){return e.role??"custom"}roleLabel(e){switch(e){case"pv":return"PV";case"battery":return"Batterie";case"house":return"Haus";case"grid":return"Netz";case"inverter":return"Wechselrichter";default:return"Knoten"}}defaultMetricLabel(e,i){if(i==="primary")switch(e){case"pv":return"Leistung";case"battery":return"Laden / Entladen";case"house":return"Verbrauch";case"grid":return"Bezug / Einspeisung";case"inverter":return"Leistung";default:return"Wert"}if(i==="secondary")switch(e){case"battery":return"SOC";case"pv":case"house":case"grid":case"inverter":return"Heute";default:return"Detail"}return e==="battery"?"Heute":"Extra"}formatMetricValue(e,i){let r=e.trim(),t=i.trim();return t?`${r} ${t}`:r}getNodeMetrics(e){let i=this.getNodeRole(e);return[{entity:e.entity,label:e.entityLabel,unit:e.unit,defaultLabel:this.defaultMetricLabel(i,"primary"),showWhenEmpty:!1},{entity:e.secondaryEntity,label:e.secondaryLabel,unit:e.secondaryUnit,defaultLabel:this.defaultMetricLabel(i,"secondary"),showWhenEmpty:!1},{entity:e.tertiaryEntity,label:e.tertiaryLabel,unit:e.tertiaryUnit,defaultLabel:this.defaultMetricLabel(i,"tertiary"),showWhenEmpty:!1}].filter(t=>t.showWhenEmpty||!!t.entity?.trim()).map(t=>{let o=t.entity?this.getState(t.entity):"n/a",n=t.unit??(t.entity?this.getUnit(t.entity):"");return{label:t.label?.trim()||t.defaultLabel,value:o,numericValue:t.entity?this.parseNumber(t.entity):Number.NaN,unit:n}})}getBatteryLevel(e){let i=e.find(r=>r.unit==="%"||/soc|state of charge|akku|charge|level/i.test(r.label));if(!(!i||Number.isNaN(i.numericValue)))return this.clampMeterPercent(i.numericValue)}getSummaryUnit(e){for(let i of e){let r=i.unit?.trim()||this.getUnit(i.entity);if(r)return r}return""}renderSummary(e){let r=[{role:"pv",label:"Erzeugung",className:"pv"},{role:"house",label:"Verbrauch",className:"house"},{role:"battery",label:"Batterie",className:"battery"},{role:"grid",label:"Netz",className:"grid"}].map(t=>{let o=e.filter(l=>this.getNodeRole(l)===t.role&&l.entity?.trim());if(o.length===0)return"";let n=o.reduce((l,d)=>l+this.parseNumber(d.entity),0),a=this.getSummaryUnit(o),s=this.formatMetricValue(n.toFixed(Math.abs(n)>=100?0:1),a);return`
          <div class="summary-chip ${t.className}">
            <span>${this.safeText(t.label)}</span>
            <strong>${this.safeText(s)}</strong>
          </div>
        `}).join("");return r.trim()?`<div class="summary-row">${r}</div>`:""}normalizeConfig(e){let i=e.title??"PV Flow",r=this.normalizeFlowStyle(e.flowStyle);if(e.nodes&&e.nodes.length>0){let o=e.nodes.map(a=>({...a,id:a.id?.trim()||`node_${Math.random().toString(36).slice(2,8)}`,name:a.name?.trim()||"Node",role:a.role??"custom",size:this.clampNodeSize(Number(a.size??120)),x:this.clampPercent(Number(a.x)),y:this.clampPercent(Number(a.y))})),n=(e.links??[]).filter(a=>o.some(s=>s.id===a.from)&&o.some(s=>s.id===a.to));return{title:i,nodes:o,links:n,flowStyle:r}}let t=L.map(o=>({...o,entity:e.entities?.[o.id],image:e.images?.[o.id]}));return{title:i,nodes:t,links:S,flowStyle:r}}toNodeSizePercent(e){let r=this.clampNodeSize(e)/120*18;return Math.max(8,Math.min(36,r))}fitNodesToCard(e){let i=e.map(t=>({...t,x:this.clampPercent(Number(t.x)),y:this.clampPercent(Number(t.y)),renderSize:this.toNodeSizePercent(Number(t.size??120))})),r=1;for(let t of i){let o=t.renderSize/2,n=Math.abs(t.x-50),a=Math.abs(t.y-50),s=50/Math.max(1,n+o),l=50/Math.max(1,a+o);r=Math.min(r,s,l)}return r=Math.max(.22,Math.min(1,r)),i.map(t=>({...t,x:50+(t.x-50)*r,y:50+(t.y-50)*r,renderSize:t.renderSize*r}))}renderNode(e){let i=this.getNodeRole(e),r=this.getNodeMetrics(e),t=r[0],o=r.slice(1),n=i==="battery"?this.getBatteryLevel(r):void 0,a=this.safeText(e.name),s=Math.max(4,Math.min(40,e.renderSize)),l=e.image?.trim(),d=`<div class="fallback-icon">${a.slice(0,1)}</div>`,p=i==="battery"&&t&&!Number.isNaN(t.numericValue)?t.numericValue>0?"is-charging":t.numericValue<0?"is-discharging":"is-idle":"",u=o.map(g=>`
          <div class="node-stat">
            <span>${this.safeText(g.label)}</span>
            <strong>${this.safeText(this.formatMetricValue(g.value,g.unit))}</strong>
          </div>
        `).join(""),c=n===void 0?"":`
          <div class="battery-meter" aria-label="Battery level ${n}%">
            <div class="battery-meter-fill" style="width:${n}%;"></div>
          </div>
        `;return`
      <article class="node node-${i} ${p}" style="--node-size:${s}%; left:${this.clampPercent(e.x)}%; top:${this.clampPercent(e.y)}%;">
        <div class="node-orb ${l?"has-image":""}">
          ${l?`<img class="node-bg-image" src="${this.safeText(l)}" alt="${a}" loading="lazy" />`:""}
          <div class="node-overlay">
            ${l?"":`<div class="node-media">${d}</div>`}
            <div class="node-kicker node-chip">${this.safeText(this.roleLabel(i))}</div>
            <div class="node-label node-chip">${a}</div>
            ${t&&!this.isEmptyState(t.value)?`<div class="node-value node-chip">${this.safeText(this.formatMetricValue(t.value,t.unit))}</div>`:""}
            ${t&&!this.isEmptyState(t.value)?`<div class="node-value-label node-chip">${this.safeText(t.label)}</div>`:""}
            ${c}
          </div>
        </div>
        ${u?`<div class="node-stats">${u}</div>`:""}
      </article>
    `}getLineAnnotationOffset(e){return e==="bottom"?3.6:-3.6}toWatts(e,i){let r=i.trim().toLowerCase();return Number.isFinite(e)?r==="kw"?e*1e3:r==="mw"?e*1e6:e:0}getEntityPowerWatts(e){if(!e?.trim())return 0;let i=Math.abs(this.parseNumber(e));return this.toWatts(i,this.getUnit(e))}getSignedFlowPowerWatts(e){if(!!(e.forwardEntity?.trim()||e.reverseEntity?.trim())){let o=this.getEntityPowerWatts(e.forwardEntity),n=this.getEntityPowerWatts(e.reverseEntity),a=0;return(o>0||n>0)&&(o>=n?a=o:a=-n),e.invert?-a:a}if(!e.entity?.trim())return 0;let r=this.parseNumber(e.entity),t=this.toWatts(r,this.getUnit(e.entity));return e.invert?-t:t}getLinkValue(e){if(e.valueEntity?.trim()){let t=this.getState(e.valueEntity),o=e.valueUnit??this.getUnit(e.valueEntity);return this.formatMetricValue(t,o)}let i=this.getSignedFlowPowerWatts(e);if(i===0)return"";let r=i>0?e.forwardEntity?.trim()||"":e.reverseEntity?.trim()||"";if(r){let t=this.getState(r),o=e.valueUnit??this.getUnit(r);return this.formatMetricValue(t,o)}if(e.entity?.trim()){let t=this.getState(e.entity),o=e.valueUnit??this.getUnit(e.entity);return this.formatMetricValue(t,o)}return""}resolveLinkDirection(e){let i=this.getSignedFlowPowerWatts(e);return i>0?"forward":i<0?"reverse":"idle"}getLinkDirectionalLabel(e,i){return i==="forward"&&e.forwardLabel?.trim()?e.forwardLabel.trim():i==="reverse"&&e.reverseLabel?.trim()?e.reverseLabel.trim():e.label?.trim()??""}getLinkPowerWatts(e){let i=Math.abs(this.getSignedFlowPowerWatts(e));return Number.isFinite(i)?i:0}getFlowStrokeWidth(e,i,r){return i==="idle"?Math.max(.35,.56*r):(.56+Math.min(1,Math.sqrt(e/7e3))*.98)*r}getFlowDashLength(e,i){return i==="idle"?2.8:2.8+Math.min(1,Math.log10(e+1)/4)*2.2}getFlowDurationSeconds(e,i){return i==="idle"?2.6:2.2-Math.min(1,Math.log10(e+1)/4)*1.65}renderLinks(e,i,r){let t=new Map(e.map(n=>[n.id,n]));return`<svg class="line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${i.map(n=>{let a=t.get(n.from),s=t.get(n.to);if(!a||!s)return"";let l=(a.x+s.x)/2,d=(a.y+s.y)/2,p=s.x-a.x,u=s.y-a.y,c=Math.hypot(p,u)||1,g=-u/c,y=p/c,b=n.labelPosition??"top",w=n.valuePosition??"bottom",h=this.resolveLinkDirection(n),f=this.getLinkDirectionalLabel(n,h),v=this.getLinkValue(n),x=f&&v&&b===w?1.8:0,C=f&&v&&b===w?-1.8:0,k=this.getLineAnnotationOffset(b)+x,M=this.getLineAnnotationOffset(w)+C,_=l+g*k,P=d+y*k,H=l+g*M,A=d+y*M,N=this.getLinkPowerWatts(n),R=this.getFlowStrokeWidth(N,h,r.baseThickness),T=this.getFlowDashLength(N,h),U=Math.max(2.2,T*.85),j=this.getFlowDurationSeconds(N,h),V=`--flow-stroke:${R.toFixed(2)}; --flow-dash:${T.toFixed(2)}; --flow-gap:${U.toFixed(2)}; --flow-duration:${j.toFixed(2)}s;`,D=f?`<title>${this.safeText(f)}</title>`:"",O=f?`<text class="flow-annotation flow-annotation-label" x="${_}" y="${P}" text-anchor="middle" dominant-baseline="middle">${this.safeText(f)}</text>`:"",q=v?`<text class="flow-annotation flow-annotation-value" x="${H}" y="${A}" text-anchor="middle" dominant-baseline="middle">${this.safeText(v)}</text>`:"";return`<g class="flow-edge"><line class="flow-line ${h}" style="${V}" x1="${a.x}" y1="${a.y}" x2="${s.x}" y2="${s.y}">${D}</line>${O}${q}</g>`}).join("")}</svg>`}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let i=this.normalizeConfig(this._config??F.getStubConfig()),r=this.fitNodesToCard(i.nodes);e.innerHTML=`
      <style>
        :host {
          display: block;
        }

        ha-card {
          --pv-card-bg: linear-gradient(135deg, #07151e 0%, #0f2f3a 45%, #1f4e55 100%);
          --pv-card-text: #e8f6f6;
          --pv-card-muted: #acd2d3;
          --flow-forward: ${i.flowStyle.forwardColor};
          --flow-reverse: ${i.flowStyle.reverseColor};
          --flow-idle: ${i.flowStyle.idleColor};
          --flow-annotation-color: ${i.flowStyle.textColor};
          --flow-annotation-size: ${i.flowStyle.textSize}px;
          --flow-annotation-stroke: ${i.flowStyle.textOutline}px;
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
          <div class="title">${this.safeText(i.title)}</div>
          <div class="title-version">v${this.safeText($)}</div>
        </div>
        ${this.renderSummary(i.nodes)}
        <div class="flow-wrap">
          ${this.renderLinks(r,i.links,i.flowStyle)}
          ${r.map(t=>this.renderNode(t)).join("")}
        </div>
        <div class="card-version">v${this.safeText($)}</div>
      </ha-card>
    `}},z=class extends HTMLElement{_config;_hass;_dragNodeIndex;_dragEventsBound=!1;_entityIdsSignature="";_layoutZoom=100;_layoutZoomMode="auto";_expandedSections=new Set;_openEntityPicker;_entitySearchTerms=new Map;clampEditorNodeSize(e){return Number.isNaN(e)?120:Math.max(40,Math.min(320,e))}clampFlowSetting(e,i,r,t){return Number.isFinite(e)?Math.max(i,Math.min(r,e)):t}sanitizeEditorHexColor(e,i){let r=typeof e=="string"?e.trim():"";return/^#([0-9a-fA-F]{6})$/.test(r)||/^#([0-9a-fA-F]{3})$/.test(r)?r:i}normalizeEditorFlowStyle(e){let i=e??{};return{forwardColor:this.sanitizeEditorHexColor(i.forwardColor,m.forwardColor),reverseColor:this.sanitizeEditorHexColor(i.reverseColor,m.reverseColor),idleColor:this.sanitizeEditorHexColor(i.idleColor,m.idleColor),textColor:this.sanitizeEditorHexColor(i.textColor,m.textColor),baseThickness:this.clampFlowSetting(Number(i.baseThickness??m.baseThickness),.4,1.6,m.baseThickness),textSize:this.clampFlowSetting(Number(i.textSize??m.textSize),1.1,3.3,m.textSize),textOutline:this.clampFlowSetting(Number(i.textOutline??m.textOutline),0,.8,m.textOutline)}}safeText(e){return(typeof e=="string"?e:String(e??"")).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampEditorPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}getNodeRadiusPercent(e){let i=this.clampEditorNodeSize(Number(e.size??120));return Math.max(8,Math.min(36,i/120*18))/2}clampNodePosition(e,i,r){let t=this.getNodeRadiusPercent(e),o=Math.max(2,t),n=Math.min(98,100-t);return{x:Math.max(o,Math.min(n,this.clampEditorPercent(i))),y:Math.max(o,Math.min(n,this.clampEditorPercent(r)))}}normalizeEditorConfig(e){let i=E.getStubConfig(),r=e??{},t={...i,...r,title:(r.title??i.title??"PV Flow").toString(),flowStyle:this.normalizeEditorFlowStyle(r.flowStyle)},n=(Array.isArray(r.nodes)&&r.nodes.length>0?r.nodes:i.nodes??[]).map((d,p)=>{let u={...d,id:(d.id??`node_${p+1}`).toString().trim()||`node_${p+1}`,name:(d.name??`Node ${p+1}`).toString().trim()||`Node ${p+1}`,role:d.role??"custom",x:this.clampEditorPercent(Number(d.x)),y:this.clampEditorPercent(Number(d.y)),size:this.clampEditorNodeSize(Number(d.size??120))},c=this.clampNodePosition(u,u.x,u.y);return{...u,...c}}),a=new Set(n.map(d=>d.id)),l=(Array.isArray(r.links)?r.links:i.links??[]).filter(d=>a.has(d.from)&&a.has(d.to));return{...t,nodes:n,links:l}}setConfig(e){this._config=this.normalizeEditorConfig(e),this.render()}set hass(e){let i=Object.keys(e?.states??{}).sort((t,o)=>t.localeCompare(o)).join("|"),r=!this._hass||i!==this._entityIdsSignature;this._hass=e,this._entityIdsSignature=i,r&&this.render()}connectedCallback(){this.bindDragEvents(),this.render()}get safeConfig(){return this._config??E.getStubConfig()}emitConfig(e){this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0})),this.render()}updateNode(e,i,r,t){let o=[...e],n={...o[r],...t},a=this.clampNodePosition(n,Number(n.x),Number(n.y));o[r]={...n,...a,size:this.clampEditorNodeSize(Number(n.size??120))},this.emitConfig({...this.safeConfig,nodes:o,links:i})}bindDragEvents(){this._dragEventsBound||(window.addEventListener("pointermove",this.handlePointerMove),window.addEventListener("pointerup",this.handlePointerUp),window.addEventListener("pointercancel",this.handlePointerUp),this._dragEventsBound=!0)}disconnectedCallback(){this._dragEventsBound&&(window.removeEventListener("pointermove",this.handlePointerMove),window.removeEventListener("pointerup",this.handlePointerUp),window.removeEventListener("pointercancel",this.handlePointerUp),this._dragEventsBound=!1)}getEntityIds(){return Object.keys(this._hass?.states??{}).sort((e,i)=>e.localeCompare(i))}getEntityFriendlyName(e){let i=this._hass?.states?.[e]?.attributes?.friendly_name;return typeof i=="string"&&i.trim()?i.trim():""}getEntityUnit(e){let r=this._hass?.states?.[e]?.attributes?.unit_of_measurement;return typeof r=="string"?r:""}getEntityDeviceClass(e){let r=this._hass?.states?.[e]?.attributes?.device_class;return typeof r=="string"?r:""}matchesEntityFilter(e,i){if(i==="any")return!0;let r=this.getEntityUnit(e).toLowerCase(),t=this.getEntityDeviceClass(e).toLowerCase();return i==="power"?/^(w|kw|mw|gw|va|kva)$/.test(r)||["power","apparent_power","reactive_power"].includes(t):i==="energy"?/^(wh|kwh|mwh|gwh)$/.test(r)||t==="energy":r==="%"||t==="battery"}getNodeEntityFilter(e,i){return i==="entity"?"power":i==="secondaryEntity"?e.role==="battery"?"percent":"energy":i==="tertiaryEntity"?"energy":"any"}renderEntitySelect(e,i,r,t="Select entity",o="any"){let n=this.getEntityIds(),a=r?.trim()??"",s=this._entitySearchTerms.get(e)??"",l=this._openEntityPicker===e,d=a?this.getEntityFriendlyName(a):"",p=a?d||a:t,u=a&&d?`<span class="picker-trigger-id">${this.safeText(a)}</span>`:"",c=n.filter(h=>this.matchesEntityFilter(h,o)),g=n.filter(h=>!c.includes(h)),y=h=>{if(!s)return!0;let f=s.toLowerCase();return h.toLowerCase().includes(f)||this.getEntityFriendlyName(h).toLowerCase().includes(f)},b=(h,f)=>{let v=h.filter(y);return v.length?`
        <div class="picker-group">
          <div class="picker-group-label">${this.safeText(f)}</div>
          ${v.map(x=>{let C=this.getEntityFriendlyName(x),k=x===a;return`
              <div class="picker-option${k?" is-selected":""}" data-value="${this.safeText(x)}" role="option" aria-selected="${k}">
                ${C?`<span class="picker-option-name">${this.safeText(C)}</span>`:""}
                <span class="picker-option-id">${this.safeText(x)}</span>
              </div>`}).join("")}
        </div>`:""},w=a&&!n.includes(a)?`<div class="picker-option is-selected" data-value="${this.safeText(a)}" role="option">
          <span class="picker-option-name">Custom</span>
          <span class="picker-option-id">${this.safeText(a)}</span>
        </div>`:"";return`
      <div class="entity-picker" data-picker-id="${this.safeText(e)}" data-field="${String(i)}">
        <button class="picker-trigger ${a?"has-value":""}" type="button" aria-haspopup="listbox" aria-expanded="${l}">
          <span class="picker-trigger-main">
            <span class="picker-trigger-label">${this.safeText(p)}</span>
            ${u}
          </span>
          <span class="picker-trigger-arrow" aria-hidden="true">${l?"\u25B2":"\u25BC"}</span>
        </button>
        ${l?`
        <div class="picker-dropdown" role="listbox">
          <input
            type="search"
            class="picker-search"
            placeholder="Name oder ID suchen\u2026"
            value="${this.safeText(s)}"
            aria-label="Search entities"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="picker-options">
            ${a?'<div class="picker-option picker-clear" data-value="" role="option"><span class="picker-option-name">\u2014 Auswahl l\xF6schen \u2014</span></div>':""}
            ${w}
            ${b(c,"Empfohlen")}
            ${b(g,"Alle Entit\xE4ten")}
          </div>
        </div>
        `:""}
      </div>
    `}renderLayoutCanvas(e,i){let r=new Map(e.map(a=>[a.id,a])),t=this.getEffectiveLayoutZoom(e),o=i.map(a=>{let s=r.get(a.from),l=r.get(a.to);if(!s||!l)return"";let d=this.projectLayoutPosition(s.x,t),p=this.projectLayoutPosition(s.y,t),u=this.projectLayoutPosition(l.x,t),c=this.projectLayoutPosition(l.y,t);return`<line x1="${d}" y1="${p}" x2="${u}" y2="${c}"></line>`}).join(""),n=e.map((a,s)=>{let l=a.image?.trim(),d=`<span>${this.safeText(a.name.slice(0,1).toUpperCase())}</span>`,p=t/100,u=Math.max(24,Math.min(220,Math.round((a.size??120)*p))),c=this.projectLayoutPosition(a.x,t),g=this.projectLayoutPosition(a.y,t);return`
          <button
            class="layout-node ${l?"has-image":""}"
            data-action="drag-node"
            data-index="${s}"
            type="button"
            style="--layout-node-size:${u}px; left:${c}%; top:${g}%;"
            aria-label="Drag ${this.safeText(a.name)}"
          >
            ${l?`<img class="layout-node-bg-image" src="${this.safeText(l)}" alt="${this.safeText(a.name)}" />`:""}
            <div class="layout-node-overlay ${l?"with-image":""}">
              ${l?"":`<div class="layout-node-media">${d}</div>`}
              <div class="layout-node-label">${this.safeText(a.name)}</div>
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
          <svg class="layout-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${o}</svg>
          ${n}
        </div>
      </div>
    `}startNodeDrag(e){this._dragNodeIndex=e}getEffectiveLayoutZoom(e){if(this._layoutZoomMode==="manual")return this._layoutZoom;let i=Math.max(...e.map(n=>this.clampEditorNodeSize(Number(n.size??120))),120),r=e.length>=8?.84:e.length>=6?.9:e.length>=4?.96:1,o=Math.round(96/i*100*r);return Math.max(65,Math.min(160,o))}projectLayoutPosition(e,i){let r=i/100,t=50+(e-50)*r;return Math.max(0,Math.min(100,t))}unprojectLayoutPosition(e,i){let r=i/100;if(r<=0)return e;let t=50+(e-50)/r;return this.clampEditorPercent(t)}handlePointerMove=e=>{if(this._dragNodeIndex===void 0)return;let r=this.shadowRoot?.querySelector(".layout-canvas");if(!r)return;let t=r.getBoundingClientRect();if(t.width===0||t.height===0)return;let o=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:L,n=this.safeConfig.links??S,a=this.getEffectiveLayoutZoom(o),s=o[this._dragNodeIndex];if(!s)return;let l=a/100,d=Math.max(24,Math.min(220,Math.round((s.size??120)*l))),p=d/2/t.width*100,u=d/2/t.height*100,c=Math.max(p,Math.min(100-p,(e.clientX-t.left)/t.width*100)),g=Math.max(u,Math.min(100-u,(e.clientY-t.top)/t.height*100)),y=this.unprojectLayoutPosition(c,a),b=this.unprojectLayoutPosition(g,a);this.updateNode(o,n,this._dragNodeIndex,{x:Number(y.toFixed(1)),y:Number(b.toFixed(1))})};handlePointerUp=()=>{this._dragNodeIndex=void 0};readFileAsDataUrl(e){return new Promise((i,r)=>{let t=new FileReader;t.addEventListener("load",()=>{if(typeof t.result=="string"){i(t.result);return}r(new Error("Image upload failed"))}),t.addEventListener("error",()=>r(t.error??new Error("Image upload failed"))),t.readAsDataURL(e)})}renderNodeRows(e){let i=["pv","battery","house","grid","inverter","custom"];return e.map((r,t)=>{let o=`node-${t}`,n=!this._expandedSections.has(o);return`
          <section class="node-card ${n?"collapsed":""}" data-kind="node" data-index="${t}">
            <div class="card-head">
              <button class="collapse-toggle" data-action="toggle-section" data-section="${o}" type="button">${n?"\u25B6":"\u25BC"}</button>
              <strong>${this.safeText(r.name||r.id)}</strong>
            </div>
            ${n?"":`
            <div class="node-grid">
              <label>
                <span>ID</span>
                <input data-field="id" value="${this.safeText(r.id)}" placeholder="battery_1" />
              </label>
              <label>
                <span>Name</span>
                <input data-field="name" value="${this.safeText(r.name)}" placeholder="Battery 1" />
              </label>
              <label>
                <span>Type</span>
                <select data-field="role">
                  ${i.map(a=>`<option value="${a}" ${(r.role??"custom")===a?"selected":""}>${a}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>Image URL</span>
                <input data-field="image" value="${this.safeText(r.image??"")}" placeholder="/local/pv/battery.png" />
              </label>
              <label>
                <span>X</span>
                <input data-field="x" type="number" min="0" max="100" value="${r.x}" />
              </label>
              <label>
                <span>Y</span>
                <input data-field="y" type="number" min="0" max="100" value="${r.y}" />
              </label>
              <label>
                <span>Size (px)</span>
                <input data-field="size" type="number" min="40" max="320" value="${Math.round(r.size??120)}" />
              </label>
            </div>
            <div class="image-tools">
              <label class="upload-field">
                <span>Upload image</span>
                <input data-action="upload-image" type="file" accept="image/*" />
              </label>
              <button data-action="clear-image" type="button">Clear image</button>
              <div class="image-preview ${r.image?.trim()?"has-image":""}">
                ${r.image?.trim()?`<img src="${this.safeText(r.image)}" alt="${this.safeText(r.name)} preview" />`:"<span>No image</span>"}
              </div>
            </div>
            <div class="metric-grid">
              <section class="metric-group">
                <h5>Primary</h5>
                <label>
                  <span>Entity</span>
                  ${this.renderEntitySelect(`node-${t}-entity`,"entity",r.entity,"Choose primary entity",this.getNodeEntityFilter(r,"entity"))}
                </label>
                <label>
                  <span>Label</span>
                  <input data-field="entityLabel" value="${this.safeText(r.entityLabel??"")}" placeholder="Charge / Discharge" />
                </label>
                <label>
                  <span>Unit</span>
                  <input data-field="unit" value="${this.safeText(r.unit??"")}" placeholder="auto / W" />
                </label>
              </section>
              <section class="metric-group">
                <h5>Secondary</h5>
                <label>
                  <span>Entity</span>
                  ${this.renderEntitySelect(`node-${t}-secondary`,"secondaryEntity",r.secondaryEntity,"Choose secondary entity",this.getNodeEntityFilter(r,"secondaryEntity"))}
                </label>
                <label>
                  <span>Label</span>
                  <input data-field="secondaryLabel" value="${this.safeText(r.secondaryLabel??"")}" placeholder="SOC" />
                </label>
                <label>
                  <span>Unit</span>
                  <input data-field="secondaryUnit" value="${this.safeText(r.secondaryUnit??"")}" placeholder="auto / %" />
                </label>
              </section>
              <section class="metric-group">
                <h5>Tertiary</h5>
                <label>
                  <span>Entity</span>
                  ${this.renderEntitySelect(`node-${t}-tertiary`,"tertiaryEntity",r.tertiaryEntity,"Choose tertiary entity",this.getNodeEntityFilter(r,"tertiaryEntity"))}
                </label>
                <label>
                  <span>Label</span>
                  <input data-field="tertiaryLabel" value="${this.safeText(r.tertiaryLabel??"")}" placeholder="Today" />
                </label>
                <label>
                  <span>Unit</span>
                  <input data-field="tertiaryUnit" value="${this.safeText(r.tertiaryUnit??"")}" placeholder="auto / kWh" />
                </label>
              </section>
            </div>
            `}
            <button data-action="remove-node" type="button" class="remove-button">Remove Device</button>
          </section>
        `}).join("")}renderLinkRows(e,i){let r=i.map(t=>`<option value="${this.safeText(t.id)}">${this.safeText(t.name)} (${this.safeText(t.id)})</option>`).join("");return e.map((t,o)=>{let n=`link-${o}`,a=!this._expandedSections.has(n),s=i.find(d=>d.id===t.from)?.name||t.from,l=i.find(d=>d.id===t.to)?.name||t.to;return`
          <section class="row link-card ${a?"collapsed":""}" data-kind="link" data-index="${o}">
            <div class="card-head">
              <button class="collapse-toggle" data-action="toggle-section" data-section="${n}" type="button">${a?"\u25B6":"\u25BC"}</button>
              <strong>${this.safeText(s)} \u2192 ${this.safeText(l)}</strong>
            </div>
            ${a?"":`
            <p class="link-hint">Configure source/target first. Use either a single signed sensor or separate forward/reverse sensors for bidirectional flows.</p>
            <div class="link-grid">
              <label>
                <span>From device</span>
                <select data-field="from">${r}</select>
              </label>
              <label>
                <span>To device</span>
                <select data-field="to">${r}</select>
              </label>
              <label class="link-wide">
                <span>Flow power entity (single signed sensor)</span>
                ${this.renderEntitySelect(`link-${o}-entity`,"entity",t.entity,"Choose flow entity","power")}
              </label>
              <label class="link-wide">
                <span>Forward amount entity (from -> to)</span>
                ${this.renderEntitySelect(`link-${o}-forward-entity`,"forwardEntity",t.forwardEntity,"Choose forward amount entity","power")}
              </label>
              <label class="link-wide">
                <span>Reverse amount entity (to -> from)</span>
                ${this.renderEntitySelect(`link-${o}-reverse-entity`,"reverseEntity",t.reverseEntity,"Choose reverse amount entity","power")}
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
                ${this.renderEntitySelect(`link-${o}-value-entity`,"valueEntity",t.valueEntity,"Choose value entity","any")}
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
            `}
            <button data-action="remove-link" type="button" class="remove-button">Remove Flow</button>
          </section>
        `}).join("")}wireEvents(e,i){let r=this.shadowRoot;r&&(r.querySelectorAll("button[data-action='toggle-section']").forEach(t=>{t.addEventListener("click",()=>{let o=t.dataset.section;o&&(this._expandedSections.has(o)?this._expandedSections.delete(o):this._expandedSections.add(o),this.render())})}),r.querySelectorAll(".entity-picker").forEach(t=>{let o=t.closest("[data-kind][data-index]");if(!o)return;let n=o.dataset.kind,a=Number(o.dataset.index),s=t.dataset.field,l=t.dataset.pickerId??"";t.querySelector(".picker-trigger")?.addEventListener("click",()=>{this._openEntityPicker=this._openEntityPicker===l?void 0:l,this.render()});let d=t.querySelector(".picker-search");d&&(setTimeout(()=>d.focus(),0),d.addEventListener("input",()=>{let p=d.value;this._entitySearchTerms.set(l,p);let u=p.trim().toLowerCase();t.querySelectorAll(".picker-option").forEach(c=>{if(c.classList.contains("picker-clear")){c.hidden=!1;return}let g=(c.querySelector(".picker-option-name")?.textContent??"").toLowerCase(),y=(c.dataset.value??"").toLowerCase();c.hidden=u.length>0&&!g.includes(u)&&!y.includes(u)}),t.querySelectorAll(".picker-group").forEach(c=>{let g=c.querySelectorAll(".picker-option:not([hidden])");c.hidden=g.length===0})})),t.querySelectorAll(".picker-option").forEach(p=>{p.addEventListener("click",()=>{let u=p.dataset.value??"";if(this._openEntityPicker=void 0,n==="node")this.updateNode(e,i,a,{[s]:u});else{let c=[...i];c[a]={...c[a],[s]:u},this.emitConfig({...this.safeConfig,nodes:e,links:c})}})})}),r.querySelectorAll("input[data-action='entity-search']").forEach(t=>{t.addEventListener("input",()=>{let o=t.dataset.target;if(!o)return;let n=r.querySelector(`select[data-entity-select-id='${o}']`);if(!n)return;let a=t.value.trim().toLowerCase();n.querySelectorAll("option").forEach(s=>{if(!s.value){s.hidden=!1;return}let l=(s.textContent??"").toLowerCase(),d=s.value.toLowerCase(),p=s.selected;s.hidden=a.length>0&&!p&&!l.includes(a)&&!d.includes(a)})})}),r.querySelectorAll("input[data-action='layout-zoom']").forEach(t=>{t.addEventListener("input",()=>{let o=Number(t.value);Number.isFinite(o)&&(this._layoutZoomMode="manual",this._layoutZoom=Math.max(50,Math.min(160,o)),this.render())})}),r.querySelector("select[data-action='layout-zoom-mode']")?.addEventListener("change",t=>{let o=t.currentTarget;(o.value==="auto"||o.value==="manual")&&(this._layoutZoomMode=o.value,this.render())}),r.querySelectorAll("input[data-action='flow-style']").forEach(t=>{let o=t.type==="range"?"input":"change";t.addEventListener(o,()=>{let n=t.dataset.field;if(!n)return;let s={...this.normalizeEditorFlowStyle(this.safeConfig.flowStyle)};if(t.dataset.kind==="color"){let l=n;s[l]=t.value}else{let l=n;s[l]=Number(t.value)}this.emitConfig({...this.safeConfig,flowStyle:this.normalizeEditorFlowStyle(s),nodes:e,links:i})})}),r.querySelectorAll(".node-card[data-kind='node']").forEach((t,o)=>{t.querySelectorAll("input[data-field], select[data-field]").forEach(n=>{n.addEventListener("change",()=>{let a=n.dataset.field,s=n instanceof HTMLInputElement&&n.type==="number"?Number(n.value):n.value;this.updateNode(e,i,o,{[a]:s})})}),t.querySelector("input[data-action='upload-image']")?.addEventListener("change",async n=>{let a=n.currentTarget,s=a.files?.[0];if(s)try{let l=await this.readFileAsDataUrl(s);this.updateNode(e,i,o,{image:l})}catch(l){console.error(l)}finally{a.value=""}}),t.querySelector("button[data-action='clear-image']")?.addEventListener("click",()=>{this.updateNode(e,i,o,{image:""})}),t.querySelector("button[data-action='remove-node']")?.addEventListener("click",()=>{let n=e.filter((l,d)=>d!==o),a=new Set(n.map(l=>l.id)),s=i.filter(l=>a.has(l.from)&&a.has(l.to));this.emitConfig({...this.safeConfig,nodes:n,links:s})})}),r.querySelectorAll("button[data-action='drag-node']").forEach(t=>{t.addEventListener("pointerdown",o=>{if(o.button!==0)return;let n=Number(t.dataset.index);Number.isFinite(n)&&(o.preventDefault(),this.startNodeDrag(n))})}),r.querySelectorAll(".row[data-kind='link']").forEach((t,o)=>{t.querySelectorAll("input[data-field], select[data-field]").forEach(n=>{if(n instanceof HTMLInputElement&&n.type==="checkbox"){n.addEventListener("change",()=>{let a=[...i];a[o]={...a[o],invert:n.checked},this.emitConfig({...this.safeConfig,nodes:e,links:a})});return}n.addEventListener("change",()=>{let a=n.dataset.field,s=[...i];s[o]={...s[o],[a]:n.value},this.emitConfig({...this.safeConfig,nodes:e,links:s})})}),t.querySelector("button[data-action='remove-link']")?.addEventListener("click",()=>{let n=i.filter((a,s)=>s!==o);this.emitConfig({...this.safeConfig,nodes:e,links:n})})}),r.querySelector("button[data-action='add-node']")?.addEventListener("click",()=>{let t=[...e,{id:`node_${e.length+1}`,name:`Node ${e.length+1}`,x:50,y:50}];this.emitConfig({...this.safeConfig,nodes:t,links:i})}),r.querySelector("button[data-action='add-link']")?.addEventListener("click",()=>{if(e.length<2)return;let t=[...i,{from:e[0].id,to:e[1].id,entity:"",invert:!1}];this.emitConfig({...this.safeConfig,nodes:e,links:t})}),r.querySelectorAll(".row[data-kind='link']").forEach((t,o)=>{let n=t.querySelectorAll("select[data-field]"),a=i[o];n[0]&&(n[0].value=a.from),n[1]&&(n[1].value=a.to)}))}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let i=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:L,r=this.safeConfig.links??S;e.innerHTML=`
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
          right: 0;
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
          <div class="editor-version">Build v${this.safeText($)}</div>
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
          ${this.renderLayoutCanvas(i,r)}
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
          ${this.renderNodeRows(i)}
          <div class="actions"><button data-action="add-node" type="button">Add device</button></div>
        </section>

        <section class="panel">
          <h3 class="panel-title">Flows</h3>
          <p class="panel-copy">Connect devices and assign a power sensor to control arrow direction.</p>
          ${this.renderLinkRows(r,i)}
          <div class="actions"><button data-action="add-link" type="button">Add flow</button></div>
        </section>
      </div>
    `;let t=e.querySelector("#title");t?.addEventListener("change",()=>{this.emitConfig({...this.safeConfig,title:t.value,nodes:i,links:r})}),this.wireEvents(i,r)}};customElements.define("mergner-pv-card",E);customElements.define("mergner-pv-card-editor",z);window.customCards=window.customCards||[];window.customCards.push({type:"mergner-pv-card",name:"Mergner PV Card",description:"Dynamic PV flow card with visual editor",preview:!0});
