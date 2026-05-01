var N="0.0.37",S=[{id:"solar",name:"Solar",role:"pv",entityLabel:"Leistung",secondaryLabel:"Heute",size:120,x:20,y:20},{id:"battery",name:"Batterie",role:"battery",entityLabel:"Laden / Entladen",secondaryLabel:"SOC",secondaryUnit:"%",tertiaryLabel:"Heute",size:120,x:80,y:20},{id:"house",name:"Haus",role:"house",entityLabel:"Verbrauch",secondaryLabel:"Heute",size:120,x:20,y:80},{id:"grid",name:"Netz",role:"grid",entityLabel:"Bezug / Einspeisung",secondaryLabel:"Heute",size:120,x:80,y:80}],$=[{from:"solar",to:"house",entity:"sensor.pv_to_house_power"},{from:"solar",to:"battery",entity:"sensor.pv_to_battery_power"},{from:"battery",to:"house",entity:"sensor.battery_to_house_power"},{from:"grid",to:"house",entity:"sensor.grid_to_house_power"}],m={forwardColor:"#74e0cb",reverseColor:"#ffb166",idleColor:"#7e8f92",textColor:"#d8fff6",baseThickness:.78,textSize:1.7,textOutline:.28,linePattern:"dashed",speedCurve:"linear",maxAnimatedWatts:12e3},k=class F extends HTMLElement{_config;_hass;static getConfigElement(){return document.createElement("mergner-pv-card-editor")}static getStubConfig(){return{type:"custom:mergner-pv-card",title:"PV Flow",nodes:S,links:$}}setConfig(e){if(!e||e.type!=="custom:mergner-pv-card")throw new Error("Card type must be custom:mergner-pv-card");this._config=e,this.render()}set hass(e){this._hass=e,this.render()}getCardSize(){return 5}connectedCallback(){this.render()}safeText(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}clampMeterPercent(e){return Number.isNaN(e)?0:Math.max(0,Math.min(100,e))}clampNodeSize(e){return Number.isNaN(e)?120:Math.max(40,Math.min(320,e))}sanitizeHexColor(e,i){let a=typeof e=="string"?e.trim():"";return/^#([0-9a-fA-F]{6})$/.test(a)||/^#([0-9a-fA-F]{3})$/.test(a)?a:i}normalizeFlowStyle(e){let i=e??{};return{forwardColor:this.sanitizeHexColor(i.forwardColor,m.forwardColor),reverseColor:this.sanitizeHexColor(i.reverseColor,m.reverseColor),idleColor:this.sanitizeHexColor(i.idleColor,m.idleColor),textColor:this.sanitizeHexColor(i.textColor,m.textColor),baseThickness:Math.max(.4,Math.min(1.6,Number(i.baseThickness??m.baseThickness))),textSize:Math.max(1.1,Math.min(3.3,Number(i.textSize??m.textSize))),textOutline:Math.max(0,Math.min(.8,Number(i.textOutline??m.textOutline))),linePattern:i.linePattern==="orb"?"orb":"dashed",speedCurve:i.speedCurve==="log"?"log":"linear",maxAnimatedWatts:Math.max(1200,Math.min(3e4,Number(i.maxAnimatedWatts??m.maxAnimatedWatts)))}}getEntity(e){if(!(!e||!this._hass?.states?.[e]))return this._hass.states[e]}getState(e){return this.getEntity(e)?.state??"n/a"}isEmptyState(e){return!e||e==="n/a"||e==="unavailable"||e==="unknown"}getUnit(e){let a=this.getEntity(e)?.attributes?.unit_of_measurement;return typeof a=="string"?a:""}parseNumber(e){let i=this.getState(e),a=Number.parseFloat(i);return Number.isFinite(a)?a:0}getNodeRole(e){return e.role??"custom"}roleLabel(e){switch(e){case"pv":return"PV";case"battery":return"Batterie";case"house":return"Haus";case"grid":return"Netz";case"inverter":return"Wechselrichter";default:return"Knoten"}}defaultMetricLabel(e,i){if(i==="primary")switch(e){case"pv":return"Leistung";case"battery":return"Laden / Entladen";case"house":return"Verbrauch";case"grid":return"Bezug / Einspeisung";case"inverter":return"Leistung";default:return"Wert"}if(i==="secondary")switch(e){case"battery":return"SOC";case"pv":case"house":case"grid":case"inverter":return"Heute";default:return"Detail"}return e==="battery"?"Heute":"Extra"}formatMetricValue(e,i){let a=e.trim(),t=i.trim();return t?`${a} ${t}`:a}getNodeMetrics(e){let i=this.getNodeRole(e);return[{entity:e.entity,label:e.entityLabel,unit:e.unit,defaultLabel:this.defaultMetricLabel(i,"primary"),showWhenEmpty:!1},{entity:e.secondaryEntity,label:e.secondaryLabel,unit:e.secondaryUnit,defaultLabel:this.defaultMetricLabel(i,"secondary"),showWhenEmpty:!1},{entity:e.tertiaryEntity,label:e.tertiaryLabel,unit:e.tertiaryUnit,defaultLabel:this.defaultMetricLabel(i,"tertiary"),showWhenEmpty:!1}].filter(t=>t.showWhenEmpty||!!t.entity?.trim()).map(t=>{let n=t.entity?this.getState(t.entity):"n/a",r=t.unit??(t.entity?this.getUnit(t.entity):"");return{label:t.label?.trim()||t.defaultLabel,value:n,numericValue:t.entity?this.parseNumber(t.entity):Number.NaN,unit:r}})}getBatteryLevel(e){let i=e.find(a=>a.unit==="%"||/soc|state of charge|akku|charge|level/i.test(a.label));if(!(!i||Number.isNaN(i.numericValue)))return this.clampMeterPercent(i.numericValue)}getSummaryUnit(e){for(let i of e){let a=i.unit?.trim()||this.getUnit(i.entity);if(a)return a}return""}renderSummary(e){let a=[{role:"pv",label:"Erzeugung",className:"pv"},{role:"house",label:"Verbrauch",className:"house"},{role:"battery",label:"Batterie",className:"battery"},{role:"grid",label:"Netz",className:"grid"}].map(t=>{let n=e.filter(l=>this.getNodeRole(l)===t.role&&l.entity?.trim());if(n.length===0)return"";let r=n.reduce((l,d)=>l+this.parseNumber(d.entity),0),o=this.getSummaryUnit(n),s=this.formatMetricValue(r.toFixed(Math.abs(r)>=100?0:1),o);return`
          <div class="summary-chip ${t.className}">
            <span>${this.safeText(t.label)}</span>
            <strong>${this.safeText(s)}</strong>
          </div>
        `}).join("");return a.trim()?`<div class="summary-row">${a}</div>`:""}normalizeConfig(e){let i=e.title??"PV Flow",a=this.normalizeFlowStyle(e.flowStyle);if(e.nodes&&e.nodes.length>0){let n=e.nodes.map(o=>({...o,id:o.id?.trim()||`node_${Math.random().toString(36).slice(2,8)}`,name:o.name?.trim()||"Node",role:o.role??"custom",size:this.clampNodeSize(Number(o.size??120)),x:this.clampPercent(Number(o.x)),y:this.clampPercent(Number(o.y))})),r=(e.links??[]).filter(o=>n.some(s=>s.id===o.from)&&n.some(s=>s.id===o.to));return{title:i,nodes:n,links:r,flowStyle:a}}let t=S.map(n=>({...n,entity:e.entities?.[n.id],image:e.images?.[n.id]}));return{title:i,nodes:t,links:$,flowStyle:a}}toNodeSizePercent(e){let a=this.clampNodeSize(e)/120*18;return Math.max(8,Math.min(36,a))}fitNodesToCard(e){let i=e.map(t=>({...t,x:this.clampPercent(Number(t.x)),y:this.clampPercent(Number(t.y)),renderSize:this.toNodeSizePercent(Number(t.size??120))})),a=1;for(let t of i){let n=t.renderSize/2,r=Math.abs(t.x-50),o=Math.abs(t.y-50),s=50/Math.max(1,r+n),l=50/Math.max(1,o+n);a=Math.min(a,s,l)}return a=Math.max(.22,Math.min(1,a)),i.map(t=>({...t,x:50+(t.x-50)*a,y:50+(t.y-50)*a,renderSize:t.renderSize*a}))}renderNode(e){let i=this.getNodeRole(e),a=this.getNodeMetrics(e),t=a[0],n=a.slice(1),r=i==="battery"?this.getBatteryLevel(a):void 0,o=this.safeText(e.name),s=Math.max(4,Math.min(40,e.renderSize)),l=e.image?.trim(),d=`<div class="fallback-icon">${o.slice(0,1)}</div>`,p=i==="battery"&&t&&!Number.isNaN(t.numericValue)?t.numericValue>0?"is-charging":t.numericValue<0?"is-discharging":"is-idle":"",u=n.map(g=>`
          <div class="node-stat">
            <span>${this.safeText(g.label)}</span>
            <strong>${this.safeText(this.formatMetricValue(g.value,g.unit))}</strong>
          </div>
        `).join(""),c=r===void 0?"":`
          <div class="battery-meter" aria-label="Battery level ${r}%">
            <div class="battery-meter-fill" style="width:${r}%;"></div>
          </div>
        `;return`
      <article class="node node-${i} ${p}" style="--node-size:${s}%; left:${this.clampPercent(e.x)}%; top:${this.clampPercent(e.y)}%;">
        <div class="node-orb ${l?"has-image":""}">
          ${l?`<img class="node-bg-image" src="${this.safeText(l)}" alt="${o}" loading="lazy" />`:""}
          <div class="node-overlay">
            ${l?"":`<div class="node-media">${d}</div>`}
            <div class="node-kicker node-chip">${this.safeText(this.roleLabel(i))}</div>
            <div class="node-label node-chip">${o}</div>
            ${t&&!this.isEmptyState(t.value)?`<div class="node-value node-chip">${this.safeText(this.formatMetricValue(t.value,t.unit))}</div>`:""}
            ${t&&!this.isEmptyState(t.value)?`<div class="node-value-label node-chip">${this.safeText(t.label)}</div>`:""}
            ${c}
          </div>
        </div>
        ${u?`<div class="node-stats">${u}</div>`:""}
      </article>
    `}getLineAnnotationOffset(e){return e==="bottom"?3.6:-3.6}toWatts(e,i){let a=i.trim().toLowerCase();return Number.isFinite(e)?a==="kw"?e*1e3:a==="mw"?e*1e6:e:0}getEntityPowerWatts(e){if(!e?.trim())return 0;let i=Math.abs(this.parseNumber(e));return this.toWatts(i,this.getUnit(e))}getSignedFlowPowerWatts(e){if(!!(e.forwardEntity?.trim()||e.reverseEntity?.trim())){let n=this.getEntityPowerWatts(e.forwardEntity),r=this.getEntityPowerWatts(e.reverseEntity),o=0;return(n>0||r>0)&&(n>=r?o=n:o=-r),e.invert?-o:o}if(!e.entity?.trim())return 0;let a=this.parseNumber(e.entity),t=this.toWatts(a,this.getUnit(e.entity));return e.invert?-t:t}getLinkValue(e){if(e.valueEntity?.trim()){let t=this.getState(e.valueEntity),n=e.valueUnit??this.getUnit(e.valueEntity);return this.formatMetricValue(t,n)}let i=this.getSignedFlowPowerWatts(e);if(i===0)return"";let a=i>0?e.forwardEntity?.trim()||"":e.reverseEntity?.trim()||"";if(a){let t=this.getState(a),n=e.valueUnit??this.getUnit(a);return this.formatMetricValue(t,n)}if(e.entity?.trim()){let t=this.getState(e.entity),n=e.valueUnit??this.getUnit(e.entity);return this.formatMetricValue(t,n)}return""}resolveLinkDirection(e){let i=this.getSignedFlowPowerWatts(e);return i>0?"forward":i<0?"reverse":"idle"}getLinkDirectionalLabel(e,i){return i==="forward"&&e.forwardLabel?.trim()?e.forwardLabel.trim():i==="reverse"&&e.reverseLabel?.trim()?e.reverseLabel.trim():e.label?.trim()??""}getLinkPowerWatts(e){let i=Math.abs(this.getSignedFlowPowerWatts(e));return Number.isFinite(i)?i:0}getFlowPowerNormalized(e,i){let a=Math.max(0,e),t=Math.max(1,i.maxAnimatedWatts);return i.speedCurve==="log"?Math.min(1,Math.log10(a+1)/Math.log10(t+1)):Math.min(1,a/t)}getFlowStrokeWidth(e,i,a,t){return i==="idle"?Math.max(.35,.56*a):(.56+this.getFlowPowerNormalized(e,t)*.98)*a}getFlowDashLength(e,i,a){return i==="idle"?2.8:2.8+this.getFlowPowerNormalized(e,a)*2.2}getFlowDurationSeconds(e,i,a){return i==="idle"?2.6:2.2-this.getFlowPowerNormalized(e,a)*1.65}renderLinks(e,i,a){let t=new Map(e.map(r=>[r.id,r]));return`<svg class="line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${i.map((r,o)=>{let s=t.get(r.from),l=t.get(r.to);if(!s||!l)return"";let d=(s.x+l.x)/2,p=(s.y+l.y)/2,u=l.x-s.x,c=l.y-s.y,g=Math.hypot(u,c)||1,v=-c/g,x=u/g,w=r.labelPosition??"top",f=r.valuePosition??"bottom",h=this.resolveLinkDirection(r),b=this.getLinkDirectionalLabel(r,h),y=this.getLinkValue(r),E=b&&y&&w===f?1.8:0,C=b&&y&&w===f?-1.8:0,M=this.getLineAnnotationOffset(w)+E,T=this.getLineAnnotationOffset(f)+C,R=d+v*M,U=p+x*M,W=d+v*T,j=p+x*T,L=this.getLinkPowerWatts(r),P=this.getFlowStrokeWidth(L,h,a.baseThickness,a),_=this.getFlowDashLength(L,h,a),V=Math.max(2.2,_*.85),A=this.getFlowDurationSeconds(L,h,a),D=Math.max(.55,Math.min(2.4,P*.9)),H=`flow-path-${o}`,O=`--flow-stroke:${P.toFixed(2)}; --flow-dash:${_.toFixed(2)}; --flow-gap:${V.toFixed(2)}; --flow-duration:${A.toFixed(2)}s;`,I=b?`<title>${this.safeText(b)}</title>`:"",q=b?`<text class="flow-annotation flow-annotation-label" x="${R}" y="${U}" text-anchor="middle" dominant-baseline="middle">${this.safeText(b)}</text>`:"",B=y?`<text class="flow-annotation flow-annotation-value" x="${W}" y="${j}" text-anchor="middle" dominant-baseline="middle">${this.safeText(y)}</text>`:"",Z=a.linePattern==="orb"&&h!=="idle"?`<circle class="flow-particle ${h}" r="${D.toFixed(2)}">
                <animateMotion dur="${A.toFixed(2)}s" repeatCount="indefinite" ${h==="reverse"?'keyPoints="1;0" keyTimes="0;1" calcMode="linear"':""}>
                  <mpath href="#${H}"></mpath>
                </animateMotion>
              </circle>`:"";return`<g class="flow-edge"><path id="${H}" class="flow-path-helper" d="M ${s.x} ${s.y} L ${l.x} ${l.y}"></path><line class="flow-line ${h} ${a.linePattern}" style="${O}" x1="${s.x}" y1="${s.y}" x2="${l.x}" y2="${l.y}">${I}</line>${Z}${q}${B}</g>`}).join("")}</svg>`}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let i=this.normalizeConfig(this._config??F.getStubConfig()),a=this.fitNodesToCard(i.nodes);e.innerHTML=`
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
          <div class="title-version">v${this.safeText(N)}</div>
        </div>
        ${this.renderSummary(i.nodes)}
        <div class="flow-wrap">
          ${this.renderLinks(a,i.links,i.flowStyle)}
          ${a.map(t=>this.renderNode(t)).join("")}
        </div>
        <div class="card-version">v${this.safeText(N)}</div>
      </ha-card>
    `}},z=class extends HTMLElement{_config;_hass;_dragNodeIndex;_dragEventsBound=!1;_entityIdsSignature="";_layoutZoom=100;_layoutZoomMode="auto";_expandedSections=new Set;_openEntityPicker;_entitySearchTerms=new Map;clampEditorNodeSize(e){return Number.isNaN(e)?120:Math.max(40,Math.min(320,e))}clampFlowSetting(e,i,a,t){return Number.isFinite(e)?Math.max(i,Math.min(a,e)):t}sanitizeEditorHexColor(e,i){let a=typeof e=="string"?e.trim():"";return/^#([0-9a-fA-F]{6})$/.test(a)||/^#([0-9a-fA-F]{3})$/.test(a)?a:i}normalizeEditorFlowStyle(e){let i=e??{};return{forwardColor:this.sanitizeEditorHexColor(i.forwardColor,m.forwardColor),reverseColor:this.sanitizeEditorHexColor(i.reverseColor,m.reverseColor),idleColor:this.sanitizeEditorHexColor(i.idleColor,m.idleColor),textColor:this.sanitizeEditorHexColor(i.textColor,m.textColor),baseThickness:this.clampFlowSetting(Number(i.baseThickness??m.baseThickness),.4,1.6,m.baseThickness),textSize:this.clampFlowSetting(Number(i.textSize??m.textSize),1.1,3.3,m.textSize),textOutline:this.clampFlowSetting(Number(i.textOutline??m.textOutline),0,.8,m.textOutline),linePattern:i.linePattern==="orb"?"orb":"dashed",speedCurve:i.speedCurve==="log"?"log":"linear",maxAnimatedWatts:this.clampFlowSetting(Number(i.maxAnimatedWatts??m.maxAnimatedWatts),1200,3e4,m.maxAnimatedWatts)}}safeText(e){return(typeof e=="string"?e:String(e??"")).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampEditorPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}getNodeRadiusPercent(e){let i=this.clampEditorNodeSize(Number(e.size??120));return Math.max(8,Math.min(36,i/120*18))/2}clampNodePosition(e,i,a){let t=this.getNodeRadiusPercent(e),n=Math.max(2,t),r=Math.min(98,100-t);return{x:Math.max(n,Math.min(r,this.clampEditorPercent(i))),y:Math.max(n,Math.min(r,this.clampEditorPercent(a)))}}normalizeEditorConfig(e){let i=k.getStubConfig(),a=e??{},t={...i,...a,title:(a.title??i.title??"PV Flow").toString(),flowStyle:this.normalizeEditorFlowStyle(a.flowStyle)},r=(Array.isArray(a.nodes)&&a.nodes.length>0?a.nodes:i.nodes??[]).map((d,p)=>{let u={...d,id:(d.id??`node_${p+1}`).toString().trim()||`node_${p+1}`,name:(d.name??`Node ${p+1}`).toString().trim()||`Node ${p+1}`,role:d.role??"custom",x:this.clampEditorPercent(Number(d.x)),y:this.clampEditorPercent(Number(d.y)),size:this.clampEditorNodeSize(Number(d.size??120))},c=this.clampNodePosition(u,u.x,u.y);return{...u,...c}}),o=new Set(r.map(d=>d.id)),l=(Array.isArray(a.links)?a.links:i.links??[]).filter(d=>o.has(d.from)&&o.has(d.to));return{...t,nodes:r,links:l}}setConfig(e){this._config=this.normalizeEditorConfig(e),this.render()}set hass(e){let i=Object.keys(e?.states??{}).sort((t,n)=>t.localeCompare(n)).join("|"),a=!this._hass||i!==this._entityIdsSignature;this._hass=e,this._entityIdsSignature=i,a&&this.render()}connectedCallback(){this.bindDragEvents(),this.render()}get safeConfig(){return this._config??k.getStubConfig()}emitConfig(e){this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0})),this.render()}updateNode(e,i,a,t){let n=[...e],r={...n[a],...t},o=this.clampNodePosition(r,Number(r.x),Number(r.y));n[a]={...r,...o,size:this.clampEditorNodeSize(Number(r.size??120))},this.emitConfig({...this.safeConfig,nodes:n,links:i})}bindDragEvents(){this._dragEventsBound||(window.addEventListener("pointermove",this.handlePointerMove),window.addEventListener("pointerup",this.handlePointerUp),window.addEventListener("pointercancel",this.handlePointerUp),this._dragEventsBound=!0)}disconnectedCallback(){this._dragEventsBound&&(window.removeEventListener("pointermove",this.handlePointerMove),window.removeEventListener("pointerup",this.handlePointerUp),window.removeEventListener("pointercancel",this.handlePointerUp),this._dragEventsBound=!1)}getEntityIds(){return Object.keys(this._hass?.states??{}).sort((e,i)=>e.localeCompare(i))}getEntityFriendlyName(e){let i=this._hass?.states?.[e]?.attributes?.friendly_name;return typeof i=="string"&&i.trim()?i.trim():""}getEntityUnit(e){let a=this._hass?.states?.[e]?.attributes?.unit_of_measurement;return typeof a=="string"?a:""}getEntityDeviceClass(e){let a=this._hass?.states?.[e]?.attributes?.device_class;return typeof a=="string"?a:""}matchesEntityFilter(e,i){if(i==="any")return!0;let a=this.getEntityUnit(e).toLowerCase(),t=this.getEntityDeviceClass(e).toLowerCase();return i==="power"?/^(w|kw|mw|gw|va|kva)$/.test(a)||["power","apparent_power","reactive_power"].includes(t):i==="energy"?/^(wh|kwh|mwh|gwh)$/.test(a)||t==="energy":a==="%"||t==="battery"}getNodeEntityFilter(e,i){return i==="entity"?"power":i==="secondaryEntity"?e.role==="battery"?"percent":"energy":i==="tertiaryEntity"?"energy":"any"}renderEntitySelect(e,i,a,t="Select entity",n="any"){let r=this.getEntityIds(),o=a?.trim()??"",s=this._entitySearchTerms.get(e)??"",l=this._openEntityPicker===e,d=o?this.getEntityFriendlyName(o):"",p=o?d||o:t,u=o&&d?`<span class="picker-trigger-id">${this.safeText(o)}</span>`:"",c=r.filter(f=>this.matchesEntityFilter(f,n)),g=r.filter(f=>!c.includes(f)),v=f=>{if(!s)return!0;let h=s.toLowerCase();return f.toLowerCase().includes(h)||this.getEntityFriendlyName(f).toLowerCase().includes(h)},x=(f,h)=>{let b=f.filter(v);return b.length?`
        <div class="picker-group">
          <div class="picker-group-label">${this.safeText(h)}</div>
          ${b.map(y=>{let E=this.getEntityFriendlyName(y),C=y===o;return`
              <div class="picker-option${C?" is-selected":""}" data-value="${this.safeText(y)}" role="option" aria-selected="${C}">
                ${E?`<span class="picker-option-name">${this.safeText(E)}</span>`:""}
                <span class="picker-option-id">${this.safeText(y)}</span>
              </div>`}).join("")}
        </div>`:""},w=o&&!r.includes(o)?`<div class="picker-option is-selected" data-value="${this.safeText(o)}" role="option">
          <span class="picker-option-name">Custom</span>
          <span class="picker-option-id">${this.safeText(o)}</span>
        </div>`:"";return`
      <div class="entity-picker" data-picker-id="${this.safeText(e)}" data-field="${String(i)}">
        <button class="picker-trigger ${o?"has-value":""}" type="button" aria-haspopup="listbox" aria-expanded="${l}">
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
            ${o?'<div class="picker-option picker-clear" data-value="" role="option"><span class="picker-option-name">\u2014 Auswahl l\xF6schen \u2014</span></div>':""}
            ${w}
            ${x(c,"Empfohlen")}
            ${x(g,"Alle Entit\xE4ten")}
          </div>
        </div>
        `:""}
      </div>
    `}renderLayoutCanvas(e,i){let a=new Map(e.map(o=>[o.id,o])),t=this.getEffectiveLayoutZoom(e),n=i.map(o=>{let s=a.get(o.from),l=a.get(o.to);if(!s||!l)return"";let d=this.projectLayoutPosition(s.x,t),p=this.projectLayoutPosition(s.y,t),u=this.projectLayoutPosition(l.x,t),c=this.projectLayoutPosition(l.y,t);return`<line x1="${d}" y1="${p}" x2="${u}" y2="${c}"></line>`}).join(""),r=e.map((o,s)=>{let l=o.image?.trim(),d=`<span>${this.safeText(o.name.slice(0,1).toUpperCase())}</span>`,p=t/100,u=Math.max(24,Math.min(220,Math.round((o.size??120)*p))),c=this.projectLayoutPosition(o.x,t),g=this.projectLayoutPosition(o.y,t);return`
          <button
            class="layout-node ${l?"has-image":""}"
            data-action="drag-node"
            data-index="${s}"
            type="button"
            style="--layout-node-size:${u}px; left:${c}%; top:${g}%;"
            aria-label="Drag ${this.safeText(o.name)}"
          >
            ${l?`<img class="layout-node-bg-image" src="${this.safeText(l)}" alt="${this.safeText(o.name)}" />`:""}
            <div class="layout-node-overlay ${l?"with-image":""}">
              ${l?"":`<div class="layout-node-media">${d}</div>`}
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
    `}startNodeDrag(e){this._dragNodeIndex=e}getEffectiveLayoutZoom(e){if(this._layoutZoomMode==="manual")return this._layoutZoom;let i=Math.max(...e.map(r=>this.clampEditorNodeSize(Number(r.size??120))),120),a=e.length>=8?.84:e.length>=6?.9:e.length>=4?.96:1,n=Math.round(96/i*100*a);return Math.max(65,Math.min(160,n))}projectLayoutPosition(e,i){let a=i/100,t=50+(e-50)*a;return Math.max(0,Math.min(100,t))}unprojectLayoutPosition(e,i){let a=i/100;if(a<=0)return e;let t=50+(e-50)/a;return this.clampEditorPercent(t)}handlePointerMove=e=>{if(this._dragNodeIndex===void 0)return;let a=this.shadowRoot?.querySelector(".layout-canvas");if(!a)return;let t=a.getBoundingClientRect();if(t.width===0||t.height===0)return;let n=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:S,r=this.safeConfig.links??$,o=this.getEffectiveLayoutZoom(n),s=n[this._dragNodeIndex];if(!s)return;let l=o/100,d=Math.max(24,Math.min(220,Math.round((s.size??120)*l))),p=d/2/t.width*100,u=d/2/t.height*100,c=Math.max(p,Math.min(100-p,(e.clientX-t.left)/t.width*100)),g=Math.max(u,Math.min(100-u,(e.clientY-t.top)/t.height*100)),v=this.unprojectLayoutPosition(c,o),x=this.unprojectLayoutPosition(g,o);this.updateNode(n,r,this._dragNodeIndex,{x:Number(v.toFixed(1)),y:Number(x.toFixed(1))})};handlePointerUp=()=>{this._dragNodeIndex=void 0};readFileAsDataUrl(e){return new Promise((i,a)=>{let t=new FileReader;t.addEventListener("load",()=>{if(typeof t.result=="string"){i(t.result);return}a(new Error("Image upload failed"))}),t.addEventListener("error",()=>a(t.error??new Error("Image upload failed"))),t.readAsDataURL(e)})}renderNodeRows(e){let i=["pv","battery","house","grid","inverter","custom"];return e.map((a,t)=>{let n=`node-${t}`,r=!this._expandedSections.has(n);return`
          <section class="node-card ${r?"collapsed":""}" data-kind="node" data-index="${t}">
            <div class="card-head">
              <button class="collapse-toggle" data-action="toggle-section" data-section="${n}" type="button">${r?"\u25B6":"\u25BC"}</button>
              <strong>${this.safeText(a.name||a.id)}</strong>
            </div>
            ${r?"":`
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
                  ${i.map(o=>`<option value="${o}" ${(a.role??"custom")===o?"selected":""}>${o}</option>`).join("")}
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
              <section class="metric-group">
                <h5>Primary</h5>
                <label>
                  <span>Entity</span>
                  ${this.renderEntitySelect(`node-${t}-entity`,"entity",a.entity,"Choose primary entity",this.getNodeEntityFilter(a,"entity"))}
                </label>
                <label>
                  <span>Label</span>
                  <input data-field="entityLabel" value="${this.safeText(a.entityLabel??"")}" placeholder="Charge / Discharge" />
                </label>
                <label>
                  <span>Unit</span>
                  <input data-field="unit" value="${this.safeText(a.unit??"")}" placeholder="auto / W" />
                </label>
              </section>
              <section class="metric-group">
                <h5>Secondary</h5>
                <label>
                  <span>Entity</span>
                  ${this.renderEntitySelect(`node-${t}-secondary`,"secondaryEntity",a.secondaryEntity,"Choose secondary entity",this.getNodeEntityFilter(a,"secondaryEntity"))}
                </label>
                <label>
                  <span>Label</span>
                  <input data-field="secondaryLabel" value="${this.safeText(a.secondaryLabel??"")}" placeholder="SOC" />
                </label>
                <label>
                  <span>Unit</span>
                  <input data-field="secondaryUnit" value="${this.safeText(a.secondaryUnit??"")}" placeholder="auto / %" />
                </label>
              </section>
              <section class="metric-group">
                <h5>Tertiary</h5>
                <label>
                  <span>Entity</span>
                  ${this.renderEntitySelect(`node-${t}-tertiary`,"tertiaryEntity",a.tertiaryEntity,"Choose tertiary entity",this.getNodeEntityFilter(a,"tertiaryEntity"))}
                </label>
                <label>
                  <span>Label</span>
                  <input data-field="tertiaryLabel" value="${this.safeText(a.tertiaryLabel??"")}" placeholder="Today" />
                </label>
                <label>
                  <span>Unit</span>
                  <input data-field="tertiaryUnit" value="${this.safeText(a.tertiaryUnit??"")}" placeholder="auto / kWh" />
                </label>
              </section>
            </div>
            `}
            <button data-action="remove-node" type="button" class="remove-button">Remove Device</button>
          </section>
        `}).join("")}renderLinkRows(e,i){let a=i.map(t=>`<option value="${this.safeText(t.id)}">${this.safeText(t.name)} (${this.safeText(t.id)})</option>`).join("");return e.map((t,n)=>{let r=`link-${n}`,o=!this._expandedSections.has(r),s=i.find(d=>d.id===t.from)?.name||t.from,l=i.find(d=>d.id===t.to)?.name||t.to;return`
          <section class="row link-card ${o?"collapsed":""}" data-kind="link" data-index="${n}">
            <div class="card-head">
              <button class="collapse-toggle" data-action="toggle-section" data-section="${r}" type="button">${o?"\u25B6":"\u25BC"}</button>
              <strong>${this.safeText(s)} \u2192 ${this.safeText(l)}</strong>
            </div>
            ${o?"":`
            <p class="link-hint">Configure source/target first. Use either a single signed sensor or separate forward/reverse sensors for bidirectional flows.</p>
            <div class="link-grid">
              <label>
                <span>From device</span>
                <select data-field="from">${a}</select>
              </label>
              <label>
                <span>To device</span>
                <select data-field="to">${a}</select>
              </label>
              <label class="link-wide">
                <span>Flow power entity (single signed sensor)</span>
                ${this.renderEntitySelect(`link-${n}-entity`,"entity",t.entity,"Choose flow entity","power")}
              </label>
              <label class="link-wide">
                <span>Forward amount entity (from -> to)</span>
                ${this.renderEntitySelect(`link-${n}-forward-entity`,"forwardEntity",t.forwardEntity,"Choose forward amount entity","power")}
              </label>
              <label class="link-wide">
                <span>Reverse amount entity (to -> from)</span>
                ${this.renderEntitySelect(`link-${n}-reverse-entity`,"reverseEntity",t.reverseEntity,"Choose reverse amount entity","power")}
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
                ${this.renderEntitySelect(`link-${n}-value-entity`,"valueEntity",t.valueEntity,"Choose value entity","any")}
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
        `}).join("")}wireEvents(e,i){let a=this.shadowRoot;a&&(a.querySelectorAll("button[data-action='toggle-section']").forEach(t=>{t.addEventListener("click",()=>{let n=t.dataset.section;n&&(this._expandedSections.has(n)?this._expandedSections.delete(n):this._expandedSections.add(n),this.render())})}),a.querySelectorAll(".entity-picker").forEach(t=>{let n=t.closest("[data-kind][data-index]");if(!n)return;let r=n.dataset.kind,o=Number(n.dataset.index),s=t.dataset.field,l=t.dataset.pickerId??"";t.querySelector(".picker-trigger")?.addEventListener("click",()=>{this._openEntityPicker=this._openEntityPicker===l?void 0:l,this.render()});let d=t.querySelector(".picker-search");d&&(setTimeout(()=>d.focus(),0),d.addEventListener("input",()=>{let p=d.value;this._entitySearchTerms.set(l,p);let u=p.trim().toLowerCase();t.querySelectorAll(".picker-option").forEach(c=>{if(c.classList.contains("picker-clear")){c.hidden=!1;return}let g=(c.querySelector(".picker-option-name")?.textContent??"").toLowerCase(),v=(c.dataset.value??"").toLowerCase();c.hidden=u.length>0&&!g.includes(u)&&!v.includes(u)}),t.querySelectorAll(".picker-group").forEach(c=>{let g=c.querySelectorAll(".picker-option:not([hidden])");c.hidden=g.length===0})})),t.querySelectorAll(".picker-option").forEach(p=>{p.addEventListener("click",()=>{let u=p.dataset.value??"";if(this._openEntityPicker=void 0,r==="node")this.updateNode(e,i,o,{[s]:u});else{let c=[...i];c[o]={...c[o],[s]:u},this.emitConfig({...this.safeConfig,nodes:e,links:c})}})})}),a.querySelectorAll("input[data-action='entity-search']").forEach(t=>{t.addEventListener("input",()=>{let n=t.dataset.target;if(!n)return;let r=a.querySelector(`select[data-entity-select-id='${n}']`);if(!r)return;let o=t.value.trim().toLowerCase();r.querySelectorAll("option").forEach(s=>{if(!s.value){s.hidden=!1;return}let l=(s.textContent??"").toLowerCase(),d=s.value.toLowerCase(),p=s.selected;s.hidden=o.length>0&&!p&&!l.includes(o)&&!d.includes(o)})})}),a.querySelectorAll("input[data-action='layout-zoom']").forEach(t=>{t.addEventListener("input",()=>{let n=Number(t.value);Number.isFinite(n)&&(this._layoutZoomMode="manual",this._layoutZoom=Math.max(50,Math.min(160,n)),this.render())})}),a.querySelector("select[data-action='layout-zoom-mode']")?.addEventListener("change",t=>{let n=t.currentTarget;(n.value==="auto"||n.value==="manual")&&(this._layoutZoomMode=n.value,this.render())}),a.querySelectorAll("[data-action='flow-style']").forEach(t=>{let n=t instanceof HTMLInputElement&&t.type==="range"?"input":"change";t.addEventListener(n,()=>{let r=t.dataset.field;if(!r)return;let s={...this.normalizeEditorFlowStyle(this.safeConfig.flowStyle)};if(t.dataset.kind==="color"){let l=r;s[l]=t.value}else if(t.dataset.kind==="select")r==="linePattern"?s.linePattern=t.value==="orb"?"orb":"dashed":r==="speedCurve"&&(s.speedCurve=t.value==="log"?"log":"linear");else{let l=r;r==="maxAnimatedWatts"?s.maxAnimatedWatts=Number(t.value):s[l]=Number(t.value)}this.emitConfig({...this.safeConfig,flowStyle:this.normalizeEditorFlowStyle(s),nodes:e,links:i})})}),a.querySelectorAll(".node-card[data-kind='node']").forEach((t,n)=>{t.querySelectorAll("input[data-field], select[data-field]").forEach(r=>{r.addEventListener("change",()=>{let o=r.dataset.field,s=r instanceof HTMLInputElement&&r.type==="number"?Number(r.value):r.value;this.updateNode(e,i,n,{[o]:s})})}),t.querySelector("input[data-action='upload-image']")?.addEventListener("change",async r=>{let o=r.currentTarget,s=o.files?.[0];if(s)try{let l=await this.readFileAsDataUrl(s);this.updateNode(e,i,n,{image:l})}catch(l){console.error(l)}finally{o.value=""}}),t.querySelector("button[data-action='clear-image']")?.addEventListener("click",()=>{this.updateNode(e,i,n,{image:""})}),t.querySelector("button[data-action='remove-node']")?.addEventListener("click",()=>{let r=e.filter((l,d)=>d!==n),o=new Set(r.map(l=>l.id)),s=i.filter(l=>o.has(l.from)&&o.has(l.to));this.emitConfig({...this.safeConfig,nodes:r,links:s})})}),a.querySelectorAll("button[data-action='drag-node']").forEach(t=>{t.addEventListener("pointerdown",n=>{if(n.button!==0)return;let r=Number(t.dataset.index);Number.isFinite(r)&&(n.preventDefault(),this.startNodeDrag(r))})}),a.querySelectorAll(".row[data-kind='link']").forEach((t,n)=>{t.querySelectorAll("input[data-field], select[data-field]").forEach(r=>{if(r instanceof HTMLInputElement&&r.type==="checkbox"){r.addEventListener("change",()=>{let o=[...i];o[n]={...o[n],invert:r.checked},this.emitConfig({...this.safeConfig,nodes:e,links:o})});return}r.addEventListener("change",()=>{let o=r.dataset.field,s=[...i];s[n]={...s[n],[o]:r.value},this.emitConfig({...this.safeConfig,nodes:e,links:s})})}),t.querySelector("button[data-action='remove-link']")?.addEventListener("click",()=>{let r=i.filter((o,s)=>s!==n);this.emitConfig({...this.safeConfig,nodes:e,links:r})})}),a.querySelector("button[data-action='add-node']")?.addEventListener("click",()=>{let t=[...e,{id:`node_${e.length+1}`,name:`Node ${e.length+1}`,x:50,y:50}];this.emitConfig({...this.safeConfig,nodes:t,links:i})}),a.querySelector("button[data-action='add-link']")?.addEventListener("click",()=>{if(e.length<2)return;let t=[...i,{from:e[0].id,to:e[1].id,entity:"",invert:!1}];this.emitConfig({...this.safeConfig,nodes:e,links:t})}),a.querySelectorAll(".row[data-kind='link']").forEach((t,n)=>{let r=t.querySelectorAll("select[data-field]"),o=i[n];r[0]&&(r[0].value=o.from),r[1]&&(r[1].value=o.to)}))}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let i=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:S,a=this.safeConfig.links??$;e.innerHTML=`
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
          <div class="editor-version">Build v${this.safeText(N)}</div>
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
                <option value="dashed" ${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).linePattern==="dashed"?"selected":""}>Dashed animated</option>
                <option value="orb" ${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).linePattern==="orb"?"selected":""}>Solid + moving orb</option>
              </select>
            </label>
            <label class="flow-style-row">
              <span>Speed curve</span>
              <select data-action="flow-style" data-kind="select" data-field="speedCurve">
                <option value="linear" ${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).speedCurve==="linear"?"selected":""}>Linear (0 to max W)</option>
                <option value="log" ${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).speedCurve==="log"?"selected":""}>Logarithmic</option>
              </select>
            </label>
            <label class="flow-style-row range">
              <span>Max watts for full speed/thickness</span>
              <input data-action="flow-style" data-kind="number" data-field="maxAnimatedWatts" type="range" min="1200" max="30000" step="100" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).maxAnimatedWatts.toFixed(0)}" />
              <input data-action="flow-style" data-kind="number" data-field="maxAnimatedWatts" type="number" min="1200" max="30000" step="100" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).maxAnimatedWatts.toFixed(0)}" />
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
          ${this.renderLinkRows(a,i)}
          <div class="actions"><button data-action="add-link" type="button">Add flow</button></div>
        </section>
      </div>
    `;let t=e.querySelector("#title");t?.addEventListener("change",()=>{this.emitConfig({...this.safeConfig,title:t.value,nodes:i,links:a})}),this.wireEvents(i,a)}};customElements.define("mergner-pv-card",k);customElements.define("mergner-pv-card-editor",z);window.customCards=window.customCards||[];window.customCards.push({type:"mergner-pv-card",name:"Mergner PV Card",description:"Dynamic PV flow card with visual editor",preview:!0});
