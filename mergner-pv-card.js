var j="0.0.57",_=[{id:"solar",name:"Solar",role:"pv",entityLabel:"Leistung",secondaryLabel:"Heute",size:120,x:20,y:20},{id:"battery",name:"Batterie",role:"battery",entityLabel:"Laden / Entladen",secondaryLabel:"SOC",secondaryUnit:"%",tertiaryLabel:"Heute",size:120,x:80,y:20},{id:"house",name:"Haus",role:"house",entityLabel:"Verbrauch",secondaryLabel:"Heute",size:120,x:20,y:80},{id:"grid",name:"Netz",role:"grid",entityLabel:"Bezug / Einspeisung",secondaryLabel:"Heute",size:120,x:80,y:80}],R=[{from:"solar",to:"house",entity:"sensor.pv_to_house_power"},{from:"solar",to:"battery",entity:"sensor.pv_to_battery_power"},{from:"battery",to:"house",entity:"sensor.battery_to_house_power"},{from:"grid",to:"house",entity:"sensor.grid_to_house_power"}],u={forwardColor:"#74e0cb",reverseColor:"#ffb166",idleColor:"#7e8f92",textColor:"#d8fff6",baseThickness:.78,textSize:1.7,textOutline:.28,linePattern:"dashed",speedCurve:"linear",speedMultiplier:1,maxAnimatedWatts:12e3,dynamicOrbCount:!1,orbCountMultiplier:1},z=class V extends HTMLElement{_config;_hass;static getConfigElement(){return document.createElement("mergner-pv-card-editor")}static getStubConfig(){return{type:"custom:mergner-pv-card",title:"PV Flow",nodes:_,links:R}}setConfig(e){if(!e||e.type!=="custom:mergner-pv-card")throw new Error("Card type must be custom:mergner-pv-card");this._config=e,this.render()}set hass(e){this._hass=e,this.render()}getCardSize(){let e=this.normalizeConfig(this._config??V.getStubConfig()),a=this.fitNodesToCard(e.nodes),r=this.getFlowFrameSettings(a),t=["pv","house","battery","grid","inverter"].map(s=>e.nodes.some(l=>this.getNodeRole(l)===s&&!!l.entity?.trim())).filter(Boolean).length,o=t===0?0:Math.ceil(t/4),n=74+(o*58+(o>0?12:0))+r.minHeight;return Math.max(3,Math.min(14,Math.ceil(n/50)))}connectedCallback(){this.render()}safeText(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}clampMeterPercent(e){return Number.isNaN(e)?0:Math.max(0,Math.min(100,e))}clampNodeSize(e){return Number.isNaN(e)?120:Math.max(40,Math.min(320,e))}clampBatteryRingThickness(e){return Number.isFinite(e)?Math.max(2,Math.min(24,e)):7}clampNodeLabelGap(e){return Number.isFinite(e)?Math.max(-16,Math.min(52,e)):6}clampNodeStatsGap(e){return Number.isFinite(e)?Math.max(-12,Math.min(56,e)):6}clampNodeHeaderFontScale(e){return Number.isFinite(e)?Math.max(.4,Math.min(2.2,e)):1}clampCenterValueOffset(e){return Number.isFinite(e)?Math.max(-80,Math.min(80,e)):0}clampCenterValueScale(e){return Number.isFinite(e)?Math.max(.5,Math.min(2,e)):1}sanitizeHexColor(e,a){let r=typeof e=="string"?e.trim():"";return/^#([0-9a-fA-F]{6})$/.test(r)||/^#([0-9a-fA-F]{3})$/.test(r)?r:a}normalizeFlowStyle(e){let a=e??{};return{forwardColor:this.sanitizeHexColor(a.forwardColor,u.forwardColor),reverseColor:this.sanitizeHexColor(a.reverseColor,u.reverseColor),idleColor:this.sanitizeHexColor(a.idleColor,u.idleColor),textColor:this.sanitizeHexColor(a.textColor,u.textColor),baseThickness:Math.max(.4,Math.min(1.6,Number(a.baseThickness??u.baseThickness))),textSize:Math.max(1.1,Math.min(3.3,Number(a.textSize??u.textSize))),textOutline:Math.max(0,Math.min(.8,Number(a.textOutline??u.textOutline))),linePattern:a.linePattern==="orb"?"orb":"dashed",speedCurve:a.speedCurve==="log"?"log":"linear",speedMultiplier:Math.max(.3,Math.min(3,Number(a.speedMultiplier??u.speedMultiplier))),maxAnimatedWatts:Math.max(1200,Math.min(3e4,Number(a.maxAnimatedWatts??u.maxAnimatedWatts))),dynamicOrbCount:a.dynamicOrbCount===!0,orbCountMultiplier:Math.max(.2,Math.min(6,Number(a.orbCountMultiplier??u.orbCountMultiplier)))}}getEntity(e){if(!(!e||!this._hass?.states?.[e]))return this._hass.states[e]}getState(e){return this.getEntity(e)?.state??"n/a"}isEmptyState(e){return!e||e==="n/a"||e==="unavailable"||e==="unknown"}getUnit(e){let r=this.getEntity(e)?.attributes?.unit_of_measurement;return typeof r=="string"?r:""}parseNumber(e){let a=this.getState(e),r=Number.parseFloat(a);return Number.isFinite(r)?r:0}getNodeRole(e){return e.role??"custom"}roleLabel(e){switch(e){case"pv":return"PV";case"battery":return"Batterie";case"house":return"Haus";case"grid":return"Netz";case"inverter":return"Wechselrichter";default:return"Knoten"}}defaultMetricLabel(e,a){if(a==="primary")switch(e){case"pv":return"Leistung";case"battery":return"Laden / Entladen";case"house":return"Verbrauch";case"grid":return"Bezug / Einspeisung";case"inverter":return"Leistung";default:return"Wert"}if(a==="secondary")switch(e){case"battery":return"SOC";case"pv":case"house":case"grid":case"inverter":return"Heute";default:return"Detail"}return e==="battery"?"Heute":"Extra"}formatMetricValue(e,a){let r=e.trim(),t=a.trim();return t?`${r} ${t}`:r}getNodeMetrics(e){let a=this.getNodeRole(e);return[{entity:e.entity,label:e.entityLabel,unit:e.unit,defaultLabel:this.defaultMetricLabel(a,"primary"),showWhenEmpty:!1},{entity:e.secondaryEntity,label:e.secondaryLabel,unit:e.secondaryUnit,defaultLabel:this.defaultMetricLabel(a,"secondary"),showWhenEmpty:!1},{entity:e.tertiaryEntity,label:e.tertiaryLabel,unit:e.tertiaryUnit,defaultLabel:this.defaultMetricLabel(a,"tertiary"),showWhenEmpty:!1}].filter(t=>t.showWhenEmpty||!!t.entity?.trim()).map(t=>{let o=t.entity?this.getState(t.entity):"n/a",i=t.unit??(t.entity?this.getUnit(t.entity):"");return{label:t.label?.trim()||t.defaultLabel,value:o,numericValue:t.entity?this.parseNumber(t.entity):Number.NaN,unit:i}})}getBatteryLevel(e){let a=e.find(r=>r.unit==="%"||/soc|state of charge|akku|charge|level/i.test(r.label));if(!(!a||Number.isNaN(a.numericValue)))return this.clampMeterPercent(a.numericValue)}lerpColor(e,a,r){let t=e.replace("#",""),o=a.replace("#",""),i=Math.max(0,Math.min(1,r)),n=Number.parseInt(t.slice(0,2),16),s=Number.parseInt(t.slice(2,4),16),l=Number.parseInt(t.slice(4,6),16),d=Number.parseInt(o.slice(0,2),16),c=Number.parseInt(o.slice(2,4),16),p=Number.parseInt(o.slice(4,6),16),m=Math.round(n+(d-n)*i),h=Math.round(s+(c-s)*i),x=Math.round(l+(p-l)*i);return`#${[m,h,x].map(v=>v.toString(16).padStart(2,"0")).join("")}`}getBatteryRingColor(e){let a=[{at:0,color:"#ff1f1f"},{at:20,color:"#ff8a00"},{at:50,color:"#ffd84d"},{at:75,color:"#9eea4d"},{at:100,color:"#2ea043"}],r=Math.max(0,Math.min(100,e));for(let t=0;t<a.length-1;t+=1){let o=a[t],i=a[t+1];if(r>=o.at&&r<=i.at){let n=(r-o.at)/(i.at-o.at||1);return this.lerpColor(o.color,i.color,n)}}return a[a.length-1].color}getSummaryUnit(e){for(let a of e){let r=a.unit?.trim()||this.getUnit(a.entity);if(r)return r}return""}summaryIcon(e){switch(e){case"grid":return`<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 2L8 8H4l2 2-4 8h6l2 4h4l2-4h6l-4-8 2-2h-4L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <line x1="12" y1="8" x2="12" y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="6" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;case"house":return`<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M3 10.5L12 3l9 7.5V21H15v-5h-6v5H3V10.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>`;case"pv":return`<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="2" y="7" width="20" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" stroke-width="1.2"/>
          <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.2"/>
          <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="19" y1="4" x2="17" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="5" y1="4" x2="7" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;case"battery":return`<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="2" y="7" width="18" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M20 10.5v3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <rect x="4" y="9" width="8" height="6" rx="1" fill="currentColor" opacity="0.5"/>
        </svg>`;case"inverter":return`<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M7 15l3-6 2 4 2-4 3 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;default:return`<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>`}}renderSummary(e){let r=[{role:"grid",label:"Netz",className:"grid"},{role:"house",label:"Verbrauch",className:"house"},{role:"pv",label:"Erzeugung",className:"pv"},{role:"battery",label:"Batterie",className:"battery"},{role:"inverter",label:"Wechselrichter",className:"inverter"}].map(t=>{let o=e.filter(l=>this.getNodeRole(l)===t.role&&l.entity?.trim());if(o.length===0)return"";let i=o.reduce((l,d)=>l+this.parseNumber(d.entity),0),n=this.getSummaryUnit(o),s=this.formatMetricValue(i.toFixed(Math.abs(i)>=100?0:1),n);return`
          <div class="summary-chip ${t.className}">
            <div class="summary-icon">${this.summaryIcon(t.role)}</div>
            <div class="summary-text">
              <span>${this.safeText(t.label)}</span>
              <strong>${this.safeText(s)}</strong>
            </div>
          </div>
        `}).join("");return r.trim()?`<div class="summary-row">${r}</div>`:""}normalizeConfig(e){let a=e.title??"PV Flow",r=this.normalizeFlowStyle(e.flowStyle);if(e.nodes&&e.nodes.length>0){let o=e.nodes.map(n=>({...n,id:n.id?.trim()||`node_${Math.random().toString(36).slice(2,8)}`,name:n.name?.trim()||"Node",role:n.role??"custom",size:this.clampNodeSize(Number(n.size??120)),x:this.clampPercent(Number(n.x)),y:this.clampPercent(Number(n.y)),batteryRingThickness:this.clampBatteryRingThickness(Number(n.batteryRingThickness??7)),labelGap:this.clampNodeLabelGap(Number(n.labelGap??6)),statsGap:this.clampNodeStatsGap(Number(n.statsGap??6)),headerFontScale:this.clampNodeHeaderFontScale(Number(n.headerFontScale??1)),showLabelBackground:n.showLabelBackground!==!1,centerValue:n.centerValue??n.role==="battery",centerValueOffsetX:this.clampCenterValueOffset(Number(n.centerValueOffsetX??0)),centerValueOffsetY:this.clampCenterValueOffset(Number(n.centerValueOffsetY??0)),centerValueScale:this.clampCenterValueScale(Number(n.centerValueScale??1))})),i=(e.links??[]).filter(n=>o.some(s=>s.id===n.from)&&o.some(s=>s.id===n.to));return{title:a,nodes:o,links:i,flowStyle:r}}let t=_.map(o=>({...o,entity:e.entities?.[o.id],image:e.images?.[o.id]}));return{title:a,nodes:t,links:R,flowStyle:r}}toNodeSizePercent(e){let r=this.clampNodeSize(e)/120*18;return Math.max(8,Math.min(36,r))}fitNodesToCard(e){let a=e.map(t=>({...t,x:this.clampPercent(Number(t.x)),y:this.clampPercent(Number(t.y)),renderSize:this.toNodeSizePercent(Number(t.size??120))})),r=1;for(let t of a){let o=t.renderSize/2,i=Math.abs(t.x-50),n=Math.abs(t.y-50),s=50/Math.max(1,i+o),l=50/Math.max(1,n+o);r=Math.min(r,s,l)}return r=Math.max(.22,Math.min(1,r)),a.map(t=>({...t,x:50+(t.x-50)*r,y:50+(t.y-50)*r,renderSize:t.renderSize*r}))}getFlowFrameSettings(e){if(e.length===0)return{aspect:1.45,minHeight:240};let a=100,r=0,t=100,o=0,i=8;for(let c of e){let p=c.renderSize/2;a=Math.min(a,c.x-p),r=Math.max(r,c.x+p),t=Math.min(t,c.y-p),o=Math.max(o,c.y+p),i=Math.max(i,c.renderSize)}let n=Math.max(28,r-a+8),s=Math.max(24,o-t+22),l=Math.max(1.05,Math.min(2.8,n/s)),d=Math.max(190,Math.min(460,Math.round(150+i*4+Math.max(0,e.length-5)*10)));return{aspect:l,minHeight:d}}renderNode(e){return this.getNodeArticleHTML(e,this.clampPercent(e.x),this.clampPercent(e.y),!1)}getNodeArticleHTML(e,a,r,t=!1){let o=this.getNodeRole(e),i=this.getNodeMetrics(e),n=i[0],s=i.slice(1),l=o==="battery"?this.getBatteryLevel(i):void 0,d=this.safeText(e.name),c=Math.max(4,Math.min(40,e.renderSize)),p=Math.max(.7,Math.min(1.22,c/18)),m=e.image?.trim(),h=`<div class="fallback-icon">${d.slice(0,1)}</div>`,x=o!=="battery"||l===void 0,v=l===void 0?"#6edb7a":this.getBatteryRingColor(l),y=this.clampBatteryRingThickness(Number(e.batteryRingThickness??7)),N=this.clampNodeLabelGap(Number(e.labelGap??6)),g=this.clampNodeStatsGap(Number(e.statsGap??6)),w=this.clampNodeHeaderFontScale(Number(e.headerFontScale??1)),f=e.showLabelBackground!==!1,k=(e.centerValue??o==="battery")===!0,E=this.clampCenterValueOffset(Number(e.centerValueOffsetX??0)),C=this.clampCenterValueOffset(Number(e.centerValueOffsetY??0)),M=this.clampCenterValueScale(Number(e.centerValueScale??1)),F=l===void 0?` --battery-ring-thickness:${y}px; --node-label-gap:${N}px; --node-stats-gap:${g}px; --node-header-font-scale:${w}; --node-center-offset-x:${E}px; --node-center-offset-y:${C}px; --node-center-scale:${M};`:` --battery-level:${l}; --battery-color:${v}; --battery-ring-thickness:${y}px; --node-label-gap:${N}px; --node-stats-gap:${g}px; --node-header-font-scale:${w}; --node-center-offset-x:${E}px; --node-center-offset-y:${C}px; --node-center-scale:${M};`,H=o==="battery"&&l!==void 0&&l<=10,O=o==="battery"&&l!==void 0?s.filter(b=>!(b.unit==="%"||/soc|state of charge|akku|charge|level/i.test(b.label))):s,A=o==="battery"&&n&&!Number.isNaN(n.numericValue)?n.numericValue>0?"is-charging":n.numericValue<0?"is-discharging":"is-idle":"",S=O.map(b=>`
          <div class="node-stat">
            <span>${this.safeText(b.label)}</span>
            <strong>${this.safeText(this.formatMetricValue(b.value,b.unit))}</strong>
          </div>
        `).join(""),T=l===void 0?"":'<div class="battery-ring" aria-hidden="true"></div>',L=i.find(b=>b.unit==="%"||/soc|state of charge|akku|charge|level/i.test(b.label)),P=o==="battery"&&l!==void 0?`${l}%`:n&&!this.isEmptyState(n.value)?this.formatMetricValue(n.value,n.unit):"",$=o==="battery"&&L?L.label:n?.label??"",B=k&&P?`
          <div class="node-center-metric" aria-label="Center metric">
            <div class="node-center-value">${this.safeText(P)}</div>
            ${$?`<div class="node-center-label">${this.safeText($)}</div>`:""}
          </div>
        `:"";return`
      <article class="node node-${o} ${A} ${H?"battery-low":""} ${f?"":"node-plain-labels"}" style="--node-size:${c}%; --node-text-scale:${p.toFixed(2)}; left:${a}%; top:${r}%;${F}">
        <div class="node-header">
          <div class="node-kicker node-chip">${this.safeText(this.roleLabel(o))}</div>
          <div class="node-label node-chip">${d}</div>
        </div>
        <div class="node-orb ${m?"has-image":""}">
          ${T}
          ${m?`<img class="node-bg-image" src="${this.safeText(m)}" alt="${d}" loading="lazy" />`:""}
          ${B}
          <div class="node-overlay">
            ${m?"":`<div class="node-media">${h}</div>`}
            <div class="node-bottom-info">
              ${x&&!k&&n&&!this.isEmptyState(n.value)?`<div class="node-value node-chip">${this.safeText(this.formatMetricValue(n.value,n.unit))}</div>`:""}
              ${x&&!k&&n&&!this.isEmptyState(n.value)?`<div class="node-value-label node-chip">${this.safeText(n.label)}</div>`:""}
            </div>
          </div>
        </div>
        ${S?`<div class="node-stats">${S}</div>`:""}
      </article>
    `}getLineAnnotationOffset(e){return e==="bottom"?3.6:-3.6}toWatts(e,a){let r=a.trim().toLowerCase();return Number.isFinite(e)?r==="kw"?e*1e3:r==="mw"?e*1e6:e:0}getEntityPowerWatts(e){if(!e?.trim())return 0;let a=Math.abs(this.parseNumber(e));return this.toWatts(a,this.getUnit(e))}getSignedFlowPowerWatts(e){if(!!(e.forwardEntity?.trim()||e.reverseEntity?.trim())){let o=this.getEntityPowerWatts(e.forwardEntity),i=this.getEntityPowerWatts(e.reverseEntity),n=0;return(o>0||i>0)&&(o>=i?n=o:n=-i),e.invert?-n:n}if(!e.entity?.trim())return 0;let r=this.parseNumber(e.entity),t=this.toWatts(r,this.getUnit(e.entity));return e.invert?-t:t}getLinkValue(e){if(e.valueEntity?.trim()){let t=this.getState(e.valueEntity),o=e.valueUnit??this.getUnit(e.valueEntity);return this.formatMetricValue(t,o)}let a=this.getSignedFlowPowerWatts(e);if(a===0)return"";let r=a>0?e.forwardEntity?.trim()||"":e.reverseEntity?.trim()||"";if(r){let t=this.getState(r),o=e.valueUnit??this.getUnit(r);return this.formatMetricValue(t,o)}if(e.entity?.trim()){let t=this.getState(e.entity),o=e.valueUnit??this.getUnit(e.entity);return this.formatMetricValue(t,o)}return""}resolveLinkDirection(e){let a=this.getSignedFlowPowerWatts(e);return a>0?"forward":a<0?"reverse":"idle"}getLinkDirectionalLabel(e,a){return a==="forward"&&e.forwardLabel?.trim()?e.forwardLabel.trim():a==="reverse"&&e.reverseLabel?.trim()?e.reverseLabel.trim():e.label?.trim()??""}getLinkPowerWatts(e){let a=Math.abs(this.getSignedFlowPowerWatts(e));return Number.isFinite(a)?a:0}getFlowPowerNormalized(e,a){let r=Math.max(0,e),t=Math.max(1,a.maxAnimatedWatts);return a.speedCurve==="log"?Math.min(1,Math.log10(r+1)/Math.log10(t+1)):Math.min(1,r/t)}getFlowStrokeWidth(e,a,r,t){return a==="idle"?Math.max(.35,.56*r):(.56+this.getFlowPowerNormalized(e,t)*.98)*r}getFlowDashLength(e,a,r){return a==="idle"?2.8:2.8+this.getFlowPowerNormalized(e,r)*2.2}getFlowDurationSeconds(e,a,r){let t=Math.max(.3,r.speedMultiplier);if(a==="idle")return Math.max(.35,2.6/t);let i=2.2-this.getFlowPowerNormalized(e,r)*1.65;return Math.max(.22,i/t)}getFlowParticleCount(e,a,r){if(a==="idle")return 0;if(!r.dynamicOrbCount)return 1;let t=this.getFlowPowerNormalized(e,r),o=1+Math.round(t*7*r.orbCountMultiplier);return Math.max(1,Math.min(16,o))}renderLinks(e,a,r){let t=new Map(e.map(i=>[i.id,i]));return`<svg class="line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${a.map((i,n)=>{let s=t.get(i.from),l=t.get(i.to);if(!s||!l)return"";let d=(s.x+l.x)/2,c=(s.y+l.y)/2,p=l.x-s.x,m=l.y-s.y,h=Math.hypot(p,m)||1,x=-m/h,v=p/h,y=i.labelPosition??"top",N=i.valuePosition??"bottom",g=this.resolveLinkDirection(i),w=this.getLinkDirectionalLabel(i,g),f=this.getLinkValue(i),k=w&&f&&y===N?1.8:0,E=w&&f&&y===N?-1.8:0,C=this.getLineAnnotationOffset(y)+k,M=this.getLineAnnotationOffset(N)+E,F=d+x*C,H=c+v*C,O=d+x*M,A=c+v*M,S=this.getLinkPowerWatts(i),T=this.getFlowStrokeWidth(S,g,r.baseThickness,r),L=this.getFlowDashLength(S,g,r),P=Math.max(2.2,L*.85),$=this.getFlowDurationSeconds(S,g,r),B=Math.max(.55,Math.min(2.4,T*.9)),b=this.getFlowParticleCount(S,g,r),U=`flow-path-${n}`,D=this.sanitizeHexColor(i.forwardColor,r.forwardColor),I=this.sanitizeHexColor(i.reverseColor,r.reverseColor),G=`--flow-forward:${D}; --flow-reverse:${I};`,Z=`--flow-stroke:${T.toFixed(2)}; --flow-dash:${L.toFixed(2)}; --flow-gap:${P.toFixed(2)}; --flow-duration:${$.toFixed(2)}s;`,X=w?`<title>${this.safeText(w)}</title>`:"",Y=w?`<text class="flow-annotation flow-annotation-label" x="${F}" y="${H}" text-anchor="middle" dominant-baseline="middle">${this.safeText(w)}</text>`:"",K=f?`<text class="flow-annotation flow-annotation-value" x="${O}" y="${A}" text-anchor="middle" dominant-baseline="middle">${this.safeText(f)}</text>`:"",J=r.linePattern==="orb"&&b>0?Array.from({length:b},(te,Q)=>{let q=-($/b*Q),ee=g==="reverse"?'keyPoints="1;0" keyTimes="0;1" calcMode="linear"':'keyPoints="0;1" keyTimes="0;1" calcMode="linear"';return`<circle class="flow-particle ${g}" r="${B.toFixed(2)}">
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="${$.toFixed(2)}s" begin="${q.toFixed(2)}s" repeatCount="indefinite"></animate>
                <animateMotion dur="${$.toFixed(2)}s" begin="${q.toFixed(2)}s" repeatCount="indefinite" ${ee}>
                  <mpath href="#${U}"></mpath>
                </animateMotion>
              </circle>`}).join(""):"";return`<g class="flow-edge" style="${G}"><path id="${U}" class="flow-path-helper" d="M ${s.x} ${s.y} L ${l.x} ${l.y}"></path><line class="flow-line ${g} ${r.linePattern}" style="${Z}" x1="${s.x}" y1="${s.y}" x2="${l.x}" y2="${l.y}">${X}</line>${J}${Y}${K}</g>`}).join("")}</svg>`}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let a=this.normalizeConfig(this._config??V.getStubConfig()),r=this.fitNodesToCard(a.nodes),t=this.getFlowFrameSettings(r);e.innerHTML=`
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
          --flow-frame-min-height: ${t.minHeight}px;
          --flow-frame-aspect: ${t.aspect.toFixed(3)};
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
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }

        .summary-chip {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 8px 10px;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 9px;
          backdrop-filter: blur(4px);
        }

        .summary-icon {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          padding: 4px;
          box-sizing: border-box;
        }

        .summary-icon svg {
          width: 100%;
          height: 100%;
          color: currentColor;
        }

        .summary-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .summary-chip span {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--pv-card-muted);
          white-space: nowrap;
        }

        .summary-chip strong {
          font-size: 1rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .summary-chip.pv {
          border-color: rgba(156, 240, 165, 0.22);
        }
        .summary-chip.pv .summary-icon {
          background: rgba(156, 240, 165, 0.14);
          color: #9cf0a5;
        }
        .summary-chip.pv strong {
          color: #9cf0a5;
        }

        .summary-chip.house {
          border-color: rgba(245, 247, 250, 0.16);
        }
        .summary-chip.house .summary-icon {
          background: rgba(245, 247, 250, 0.1);
          color: #f5f7fa;
        }
        .summary-chip.house strong {
          color: #f5f7fa;
        }

        .summary-chip.battery {
          border-color: rgba(141, 224, 255, 0.2);
        }
        .summary-chip.battery .summary-icon {
          background: rgba(141, 224, 255, 0.12);
          color: #8de0ff;
        }
        .summary-chip.battery strong {
          color: #8de0ff;
        }

        .summary-chip.grid {
          border-color: rgba(255, 201, 131, 0.2);
        }
        .summary-chip.grid .summary-icon {
          background: rgba(255, 201, 131, 0.12);
          color: #ffc983;
        }
        .summary-chip.grid strong {
          color: #ffc983;
        }

        .summary-chip.inverter {
          border-color: rgba(200, 180, 255, 0.2);
        }
        .summary-chip.inverter .summary-icon {
          background: rgba(200, 180, 255, 0.12);
          color: #c8b4ff;
        }
        .summary-chip.inverter strong {
          color: #c8b4ff;
        }

        .flow-wrap {
          position: relative;
          min-height: var(--flow-frame-min-height, 240px);
          aspect-ratio: var(--flow-frame-aspect, 1.45);
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
          container-type: size;
        }

        .node-header {
          position: absolute;
          left: 50%;
          top: calc(var(--node-label-gap, 6px) * -1);
          transform: translate(-50%, -100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          z-index: 6;
          width: max-content;
          max-width: 180cqw;
          pointer-events: none;
        }

        .node-orb {
          width: 100%;
          height: 100%;
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

        .battery-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 2;
          transform: rotate(-90deg);
          background: conic-gradient(var(--battery-color, #6edb7a) calc(var(--battery-level, 0) * 1%), rgba(255, 255, 255, 0.16) 0);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - var(--battery-ring-thickness, 7px)), #000 calc(100% - var(--battery-ring-thickness, 7px)));
          mask: radial-gradient(farthest-side, transparent calc(100% - var(--battery-ring-thickness, 7px)), #000 calc(100% - var(--battery-ring-thickness, 7px)));
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.16));
        }

        @keyframes batteryLowPulseRing {
          0% {
            opacity: 0.88;
            transform: rotate(-90deg) scale(1);
          }
          50% {
            opacity: 0.46;
            transform: rotate(-90deg) scale(1.02);
          }
          100% {
            opacity: 0.88;
            transform: rotate(-90deg) scale(1);
          }
        }

        @keyframes batteryLowPulseCenter {
          0% {
            opacity: 0.95;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.62;
            transform: translate(-50%, -50%) scale(1.03);
          }
          100% {
            opacity: 0.95;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .node-overlay {
          position: relative;
          z-index: 3;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding: 0 6px 8px;
          box-sizing: border-box;
        }

        .node-center-metric {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(calc(-50% + var(--node-center-offset-x, 0px)), calc(-50% + var(--node-center-offset-y, 0px))) scale(var(--node-center-scale, 1));
          z-index: 4;
          padding: 2px 7px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.38);
          border: 1px solid rgba(255, 255, 255, 0.2);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75);
          line-height: 1.1;
          display: grid;
          justify-items: center;
          gap: 2px;
          transform-origin: center;
        }

        .node-center-value {
          font-size: clamp(10px, calc(13.5cqw), 28px);
          font-weight: 700;
          color: #ffffff;
        }

        .node-center-label {
          font-size: clamp(7px, calc(6.2cqw), 16px);
          color: var(--pv-card-muted);
          font-weight: 500;
        }

        .node-battery.battery-low .battery-ring {
          animation: batteryLowPulseRing 2.8s ease-in-out infinite;
        }

        .node-battery.battery-low .node-center-metric {
          animation: batteryLowPulseCenter 2.8s ease-in-out infinite;
        }

        .node-bottom-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          width: 100%;
        }

        .node-orb.has-image {
          background: transparent;
        }

        .node-battery .node-orb {
          border: 2px solid rgba(255, 255, 255, 0.24);
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
          font-size: calc(0.74rem * var(--node-text-scale, 1) * var(--node-header-font-scale, 1));
          font-size: clamp(8px, calc(8.8cqw * var(--node-header-font-scale, 1)), 26px);
          font-weight: 500;
          max-width: 170cqw;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .node-kicker {
          color: var(--pv-card-muted);
          font-size: calc(0.55rem * var(--node-text-scale, 1) * var(--node-header-font-scale, 1));
          font-size: clamp(7px, calc(6.2cqw * var(--node-header-font-scale, 1)), 16px);
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .node-value {
          font-size: calc(0.95rem * var(--node-text-scale, 1));
          font-size: clamp(9px, calc(11.4cqw), 30px);
          font-weight: 600;
        }

        .node-value-label {
          color: var(--pv-card-muted);
          font-size: calc(0.65rem * var(--node-text-scale, 1));
          font-size: clamp(7px, calc(6.5cqw), 18px);
          font-weight: 400;
        }

        .node-chip {
          background: rgba(0, 0, 0, 0.45);
          color: #ffffff;
          border-radius: 8px;
          padding: clamp(1px, 1.3cqw, 4px) clamp(4px, 4.6cqw, 12px);
          line-height: 1.2;
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .node-stats {
          position: absolute;
          left: 50%;
          top: calc(100% + var(--node-stats-gap, 6px));
          transform: translateX(-50%);
          display: grid;
          gap: 4px;
          text-align: left;
          background: rgba(4, 15, 21, 0.48);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 8px 10px;
          backdrop-filter: blur(4px);
        }

        .node.node-plain-labels .node-header .node-chip {
          background: transparent;
          border: none;
          box-shadow: none;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);
          padding: 0;
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

        .node-battery.is-charging {
          filter: drop-shadow(0 0 16px rgba(116, 224, 203, 0.18));
        }

        .node-battery.is-discharging {
          filter: drop-shadow(0 0 16px rgba(255, 177, 102, 0.18));
        }

        @media (max-width: 640px) {
          .flow-wrap {
            min-height: min(72vw, max(200px, var(--flow-frame-min-height, 240px)));
            aspect-ratio: max(1, var(--flow-frame-aspect, 1.15));
          }

          .node {
            width: min(58vw, var(--node-size));
            aspect-ratio: 1 / 1;
          }

          .node-header {
            top: -4px;
            max-width: 180cqw;
          }
        }
      </style>

      <ha-card>
        <div class="title-row">
          <div class="title">${this.safeText(a.title)}</div>
          <div class="title-version">v${this.safeText(j)}</div>
        </div>
        ${this.renderSummary(a.nodes)}
        <div class="flow-wrap">
          ${this.renderLinks(r,a.links,a.flowStyle)}
          ${r.map(o=>this.renderNode(o)).join("")}
        </div>
        <div class="card-version">v${this.safeText(j)}</div>
      </ha-card>
    `}},W=class extends HTMLElement{_config;_hass;_dragNodeIndex;_dragEventsBound=!1;_entityIdsSignature="";_layoutZoom=100;_layoutZoomMode="auto";_layoutGridSize=2.5;_expandedSections=new Set;_openEntityPicker;_entitySearchTerms=new Map;clampEditorNodeSize(e){return Number.isNaN(e)?120:Math.max(40,Math.min(320,e))}clampEditorBatteryRingThickness(e){return Number.isFinite(e)?Math.max(2,Math.min(24,Math.round(e))):7}clampEditorLabelGap(e){return Number.isFinite(e)?Math.max(-16,Math.min(52,Math.round(e))):6}clampEditorStatsGap(e){return Number.isFinite(e)?Math.max(-12,Math.min(56,Math.round(e))):6}clampEditorHeaderFontScale(e){return Number.isFinite(e)?Math.max(.4,Math.min(2.2,Number(e.toFixed(2)))):1}clampEditorCenterValueOffset(e){return Number.isFinite(e)?Math.max(-80,Math.min(80,Math.round(e))):0}clampEditorCenterValueScale(e){return Number.isFinite(e)?Math.max(.5,Math.min(2,Number(e.toFixed(2)))):1}clampFlowSetting(e,a,r,t){return Number.isFinite(e)?Math.max(a,Math.min(r,e)):t}clampEditorGridSize(e){return!Number.isFinite(e)||e<=0?2.5:Math.max(.5,Math.min(25,Number(e.toFixed(1))))}snapToGrid(e,a){return a<=0?e:Math.round(e/a)*a}sanitizeEditorHexColor(e,a){let r=typeof e=="string"?e.trim():"";return/^#([0-9a-fA-F]{6})$/.test(r)||/^#([0-9a-fA-F]{3})$/.test(r)?r:a}normalizeEditorFlowStyle(e){let a=e??{};return{forwardColor:this.sanitizeEditorHexColor(a.forwardColor,u.forwardColor),reverseColor:this.sanitizeEditorHexColor(a.reverseColor,u.reverseColor),idleColor:this.sanitizeEditorHexColor(a.idleColor,u.idleColor),textColor:this.sanitizeEditorHexColor(a.textColor,u.textColor),baseThickness:this.clampFlowSetting(Number(a.baseThickness??u.baseThickness),.4,1.6,u.baseThickness),textSize:this.clampFlowSetting(Number(a.textSize??u.textSize),1.1,3.3,u.textSize),textOutline:this.clampFlowSetting(Number(a.textOutline??u.textOutline),0,.8,u.textOutline),linePattern:a.linePattern==="orb"?"orb":"dashed",speedCurve:a.speedCurve==="log"?"log":"linear",speedMultiplier:this.clampFlowSetting(Number(a.speedMultiplier??u.speedMultiplier),.3,3,u.speedMultiplier),maxAnimatedWatts:this.clampFlowSetting(Number(a.maxAnimatedWatts??u.maxAnimatedWatts),1200,3e4,u.maxAnimatedWatts),dynamicOrbCount:a.dynamicOrbCount===!0,orbCountMultiplier:this.clampFlowSetting(Number(a.orbCountMultiplier??u.orbCountMultiplier),.2,6,u.orbCountMultiplier)}}safeText(e){return(typeof e=="string"?e:String(e??"")).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}clampEditorPercent(e){return Number.isNaN(e)?50:Math.max(2,Math.min(98,e))}getNodeRadiusPercent(e){let a=this.clampEditorNodeSize(Number(e.size??120));return Math.max(8,Math.min(36,a/120*18))/2}getZoomedNodeRadiusPercent(e,a){let r=Math.max(.2,a/100);return this.getNodeRadiusPercent(e)*r}clampNodePositionForZoom(e,a,r,t){let o=this.getZoomedNodeRadiusPercent(e,t),i=Math.max(2,o),n=Math.min(98,100-o);return{x:Math.max(i,Math.min(n,this.clampEditorPercent(a))),y:Math.max(i,Math.min(n,this.clampEditorPercent(r)))}}getProjectedLayoutNode(e,a){let r=Math.max(.2,a/100),t=Math.max(2.5,Math.min(58,this.getNodeRadiusPercent(e)*2*r)),o=t/2,i=this.projectLayoutPosition(e.x,a),n=this.projectLayoutPosition(e.y,a);return{x:Math.max(o,Math.min(100-o,i)),y:Math.max(o,Math.min(100-o,n)),sizePercent:t}}clampNodePosition(e,a,r){let t=this.getNodeRadiusPercent(e),o=Math.max(2,t),i=Math.min(98,100-t);return{x:Math.max(o,Math.min(i,this.clampEditorPercent(a))),y:Math.max(o,Math.min(i,this.clampEditorPercent(r)))}}normalizeEditorConfig(e){let a=z.getStubConfig(),r=e??{},t={...a,...r,title:(r.title??a.title??"PV Flow").toString(),flowStyle:this.normalizeEditorFlowStyle(r.flowStyle)},i=(Array.isArray(r.nodes)&&r.nodes.length>0?r.nodes:a.nodes??[]).map((d,c)=>{let p={...d,id:(d.id??`node_${c+1}`).toString().trim()||`node_${c+1}`,name:(d.name??`Node ${c+1}`).toString().trim()||`Node ${c+1}`,role:d.role??"custom",x:this.clampEditorPercent(Number(d.x)),y:this.clampEditorPercent(Number(d.y)),size:this.clampEditorNodeSize(Number(d.size??120)),batteryRingThickness:this.clampEditorBatteryRingThickness(Number(d.batteryRingThickness??7)),labelGap:this.clampEditorLabelGap(Number(d.labelGap??6)),statsGap:this.clampEditorStatsGap(Number(d.statsGap??6)),headerFontScale:this.clampEditorHeaderFontScale(Number(d.headerFontScale??1)),showLabelBackground:d.showLabelBackground!==!1,centerValue:d.centerValue??d.role==="battery",centerValueOffsetX:this.clampEditorCenterValueOffset(Number(d.centerValueOffsetX??0)),centerValueOffsetY:this.clampEditorCenterValueOffset(Number(d.centerValueOffsetY??0)),centerValueScale:this.clampEditorCenterValueScale(Number(d.centerValueScale??1))},m=this.clampNodePosition(p,p.x,p.y);return{...p,...m}}),n=new Set(i.map(d=>d.id)),l=(Array.isArray(r.links)?r.links:a.links??[]).filter(d=>n.has(d.from)&&n.has(d.to));return{...t,nodes:i,links:l}}setConfig(e){this._config=this.normalizeEditorConfig(e),this.render()}set hass(e){let a=Object.keys(e?.states??{}).sort((t,o)=>t.localeCompare(o)).join("|"),r=!this._hass||a!==this._entityIdsSignature;this._hass=e,this._entityIdsSignature=a,r&&this.render()}connectedCallback(){this.bindDragEvents(),this.render()}get safeConfig(){return this._config??z.getStubConfig()}emitConfig(e){this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0})),this.render()}updateNode(e,a,r,t){let o=[...e],i={...o[r],...t},n=this.clampNodePosition(i,Number(i.x),Number(i.y));o[r]={...i,...n,size:this.clampEditorNodeSize(Number(i.size??120)),batteryRingThickness:this.clampEditorBatteryRingThickness(Number(i.batteryRingThickness??7)),labelGap:this.clampEditorLabelGap(Number(i.labelGap??6)),statsGap:this.clampEditorStatsGap(Number(i.statsGap??6)),headerFontScale:this.clampEditorHeaderFontScale(Number(i.headerFontScale??1)),showLabelBackground:i.showLabelBackground!==!1,centerValue:i.centerValue??i.role==="battery",centerValueOffsetX:this.clampEditorCenterValueOffset(Number(i.centerValueOffsetX??0)),centerValueOffsetY:this.clampEditorCenterValueOffset(Number(i.centerValueOffsetY??0)),centerValueScale:this.clampEditorCenterValueScale(Number(i.centerValueScale??1))},this.emitConfig({...this.safeConfig,nodes:o,links:a})}bindDragEvents(){this._dragEventsBound||(window.addEventListener("pointermove",this.handlePointerMove),window.addEventListener("pointerup",this.handlePointerUp),window.addEventListener("pointercancel",this.handlePointerUp),this._dragEventsBound=!0)}disconnectedCallback(){this._dragEventsBound&&(window.removeEventListener("pointermove",this.handlePointerMove),window.removeEventListener("pointerup",this.handlePointerUp),window.removeEventListener("pointercancel",this.handlePointerUp),this._dragEventsBound=!1)}getEntityIds(){return Object.keys(this._hass?.states??{}).sort((e,a)=>e.localeCompare(a))}getEntityFriendlyName(e){let a=this._hass?.states?.[e]?.attributes?.friendly_name;return typeof a=="string"&&a.trim()?a.trim():""}getEntityUnit(e){let r=this._hass?.states?.[e]?.attributes?.unit_of_measurement;return typeof r=="string"?r:""}getEntityDeviceClass(e){let r=this._hass?.states?.[e]?.attributes?.device_class;return typeof r=="string"?r:""}matchesEntityFilter(e,a){if(a==="any")return!0;let r=this.getEntityUnit(e).toLowerCase(),t=this.getEntityDeviceClass(e).toLowerCase();return a==="power"?/^(w|kw|mw|gw|va|kva)$/.test(r)||["power","apparent_power","reactive_power"].includes(t):a==="energy"?/^(wh|kwh|mwh|gwh)$/.test(r)||t==="energy":r==="%"||t==="battery"}getNodeEntityFilter(e,a){return a==="entity"?"power":a==="secondaryEntity"?e.role==="battery"?"percent":"energy":a==="tertiaryEntity"?"energy":"any"}applyPickerFilter(e,a){let r=a.trim().toLowerCase();e.querySelectorAll(".picker-option").forEach(i=>{if(i.classList.contains("picker-clear")){i.hidden=!1;return}let n=(i.textContent??"").toLowerCase();i.hidden=r.length>0&&!n.includes(r)}),e.querySelectorAll(".picker-group").forEach(i=>{let n=i.querySelectorAll(".picker-option:not([hidden])");i.hidden=n.length===0});let t=e.querySelectorAll(".picker-option:not([hidden])").length>0,o=e.querySelector(".picker-no-results");o&&(o.hidden=t)}renderEntitySelect(e,a,r,t="Select entity",o="any"){let i=this.getEntityIds(),n=r?.trim()??"",s=this._entitySearchTerms.get(e)??"",l=this._openEntityPicker===e,d=n?this.getEntityFriendlyName(n):"",c=n?d||n:t,p=n&&d?`<span class="picker-trigger-id">${this.safeText(n)}</span>`:"",m=i.filter(f=>this.matchesEntityFilter(f,o)),h=i.filter(f=>!m.includes(f)),x=f=>{if(!s)return!0;let k=s.toLowerCase();return f.toLowerCase().includes(k)||this.getEntityFriendlyName(f).toLowerCase().includes(k)},v=(f,k)=>{let E=f.filter(x);return E.length?`
        <div class="picker-group">
          <div class="picker-group-label">${this.safeText(k)}</div>
          ${E.map(C=>{let M=this.getEntityFriendlyName(C),F=C===n;return`
              <div class="picker-option${F?" is-selected":""}" data-value="${this.safeText(C)}" role="option" aria-selected="${F}">
                ${M?`<span class="picker-option-name">${this.safeText(M)}</span>`:""}
                <span class="picker-option-id">${this.safeText(C)}</span>
              </div>`}).join("")}
        </div>`:""},y=n&&!i.includes(n)?`<div class="picker-option is-selected" data-value="${this.safeText(n)}" role="option">
          <span class="picker-option-name">Custom</span>
          <span class="picker-option-id">${this.safeText(n)}</span>
        </div>`:"",N=v(m,"Empfohlen"),g=v(h,"Alle Entit\xE4ten"),w=!!(y||N||g);return`
      <div class="entity-picker" data-picker-id="${this.safeText(e)}" data-field="${String(a)}">
        <button class="picker-trigger ${n?"has-value":""}" type="button" aria-haspopup="listbox" aria-expanded="${l}">
          <span class="picker-trigger-main">
            <span class="picker-trigger-label">${this.safeText(c)}</span>
            ${p}
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
            ${n?'<div class="picker-option picker-clear" data-value="" role="option"><span class="picker-option-name">\u2014 Auswahl l\xF6schen \u2014</span></div>':""}
            ${y}
            ${N}
            ${g}
            ${w?"":'<div class="picker-no-results">Keine Entit\xE4t gefunden</div>'}
          </div>
        </div>
        `:""}
      </div>
    `}renderLayoutCanvas(e,a){let r=this.getEffectiveLayoutZoom(e),t=new Map(e.map(s=>[s.id,this.getProjectedLayoutNode(s,r)])),o=a.map(s=>{let l=t.get(s.from),d=t.get(s.to);return!l||!d?"":`<line x1="${l.x}" y1="${l.y}" x2="${d.x}" y2="${d.y}"></line>`}).join(""),i=e.map((s,l)=>{let d=s.image?.trim(),c=`<span>${this.safeText(s.name.slice(0,1).toUpperCase())}</span>`,p=t.get(s.id);if(!p)return"";let m=s.role??"custom";return`
          <button
            class="layout-editor-node-wrapper"
            data-action="drag-node"
            data-index="${l}"
            type="button"
            style="--layout-node-size:${p.sizePercent.toFixed(2)}%; left:${p.x}%; top:${p.y}%; width: var(--layout-node-size); height: var(--layout-node-size);"
            aria-label="Drag ${this.safeText(s.name)}"
          >
            <div class="layout-editor-node-inner ${d?"has-image":""}">
              ${d?`<img class="layout-editor-node-bg" src="${this.safeText(d)}" alt="${this.safeText(s.name)}" />`:""}
              <div class="layout-editor-node-content">
                ${d?"":`<div class="layout-editor-node-media">${c}</div>`}
                <div class="layout-editor-node-label">${this.safeText(s.name)}</div>
              </div>
            </div>
          </button>
        `}).join(""),n=this.getLayoutFrameSettings(e,r);return`
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
            <input type="range" data-action="layout-zoom" min="50" max="160" step="5" value="${r}" ${this._layoutZoomMode==="auto"?"disabled":""} />
          </label>
          <input type="number" data-action="layout-zoom" min="50" max="160" step="5" value="${r}" ${this._layoutZoomMode==="auto"?"disabled":""} />
        </div>
        <div class="layout-hint">Drag devices in the preview to set X/Y positions. Zoom scales both size and spacing.</div>
        <div class="layout-canvas" style="--layout-frame-min-height:${n.minHeight}px; --layout-frame-aspect:${n.aspect.toFixed(3)};">
          <svg class="layout-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${o}</svg>
          ${i}
        </div>
      </div>
    `}getLayoutFrameSettings(e,a){if(e.length===0)return{aspect:1.45,minHeight:240};let r=100,t=0,o=100,i=0,n=8;for(let p of e){let m=this.getProjectedLayoutNode(p,a),h=m.sizePercent/2;r=Math.min(r,m.x-h),t=Math.max(t,m.x+h),o=Math.min(o,m.y-h),i=Math.max(i,m.y+h),n=Math.max(n,m.sizePercent)}let s=Math.max(30,t-r+8),l=Math.max(24,i-o+22),d=Math.max(1.05,Math.min(2.8,s/l)),c=Math.max(190,Math.min(460,Math.round(140+n*4.5+Math.max(0,e.length-5)*10)));return{aspect:d,minHeight:c}}startNodeDrag(e){this._dragNodeIndex=e}getEffectiveLayoutZoom(e){if(this._layoutZoomMode==="manual")return this._layoutZoom;let a=Math.max(...e.map(i=>this.clampEditorNodeSize(Number(i.size??120))),120),r=e.length>=8?.84:e.length>=6?.9:e.length>=4?.96:1,o=Math.round(96/a*100*r);return Math.max(65,Math.min(160,o))}projectLayoutPosition(e,a){let r=a/100,t=50+(e-50)*r;return Math.max(0,Math.min(100,t))}unprojectLayoutPosition(e,a){let r=a/100;if(r<=0)return e;let t=50+(e-50)/r;return this.clampEditorPercent(t)}handlePointerMove=e=>{if(this._dragNodeIndex===void 0)return;let r=this.shadowRoot?.querySelector(".layout-canvas");if(!r)return;let t=r.getBoundingClientRect();if(t.width===0||t.height===0)return;let o=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:_,i=this.safeConfig.links??R,n=this.getEffectiveLayoutZoom(o),s=o[this._dragNodeIndex];if(!s)return;let l=n/100,d=Math.max(24,Math.min(220,Math.round((s.size??120)*l))),c=d/2/t.width*100,p=d/2/t.height*100,m=Math.max(c,Math.min(100-c,(e.clientX-t.left)/t.width*100)),h=Math.max(p,Math.min(100-p,(e.clientY-t.top)/t.height*100)),x=this.unprojectLayoutPosition(m,n),v=this.unprojectLayoutPosition(h,n),y=this.clampNodePositionForZoom(s,x,v,n);this.updateNode(o,i,this._dragNodeIndex,{x:Number(y.x.toFixed(1)),y:Number(y.y.toFixed(1))})};handlePointerUp=()=>{this._dragNodeIndex=void 0};readFileAsDataUrl(e){return new Promise((a,r)=>{let t=new FileReader;t.addEventListener("load",()=>{if(typeof t.result=="string"){a(t.result);return}r(new Error("Image upload failed"))}),t.addEventListener("error",()=>r(t.error??new Error("Image upload failed"))),t.readAsDataURL(e)})}renderNodeRows(e){let a=["pv","battery","house","grid","inverter","custom"];return e.map((r,t)=>{let o=`node-${t}`,i=!this._expandedSections.has(o);return`
          <section class="node-card ${i?"collapsed":""}" data-kind="node" data-index="${t}">
            <div class="card-head">
              <button class="collapse-toggle" data-action="toggle-section" data-section="${o}" type="button">${i?"\u25B6":"\u25BC"}</button>
              <strong>${this.safeText(r.name||r.id)}</strong>
            </div>
            ${i?"":`
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
                  ${a.map(n=>`<option value="${n}" ${(r.role??"custom")===n?"selected":""}>${n}</option>`).join("")}
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
              ${(r.role??"custom")==="battery"?`
              <label>
                <span>Battery ring thickness</span>
                <input data-field="batteryRingThickness" type="number" min="2" max="24" step="1" value="${this.clampEditorBatteryRingThickness(Number(r.batteryRingThickness??7))}" />
              </label>
              `:""}
              <label>
                <span>Label distance above</span>
                <input data-field="labelGap" type="number" min="-16" max="52" step="1" value="${this.clampEditorLabelGap(Number(r.labelGap??6))}" />
              </label>
              <label>
                <span>Stats distance below</span>
                <input data-field="statsGap" type="number" min="-12" max="56" step="1" value="${this.clampEditorStatsGap(Number(r.statsGap??6))}" />
              </label>
              <label>
                <span>Header font scale</span>
                <input data-field="headerFontScale" type="number" min="0.4" max="2.2" step="0.05" value="${this.clampEditorHeaderFontScale(Number(r.headerFontScale??1)).toFixed(2)}" />
              </label>
              <label class="inline-toggle">
                <span>Center value in orb</span>
                <span class="inline-toggle-row"><input data-field="centerValue" type="checkbox" ${r.centerValue??(r.role??"custom")==="battery"?"checked":""} />Enable center metric</span>
              </label>
              <label>
                <span>Center value offset X</span>
                <input data-field="centerValueOffsetX" type="number" min="-80" max="80" step="1" value="${this.clampEditorCenterValueOffset(Number(r.centerValueOffsetX??0))}" />
              </label>
              <label>
                <span>Center value offset Y</span>
                <input data-field="centerValueOffsetY" type="number" min="-80" max="80" step="1" value="${this.clampEditorCenterValueOffset(Number(r.centerValueOffsetY??0))}" />
              </label>
              <label>
                <span>Center value scale</span>
                <input data-field="centerValueScale" type="number" min="0.5" max="2" step="0.05" value="${this.clampEditorCenterValueScale(Number(r.centerValueScale??1)).toFixed(2)}" />
              </label>
              <label class="inline-toggle">
                <span>Label background</span>
                <span class="inline-toggle-row"><input data-field="showLabelBackground" type="checkbox" ${r.showLabelBackground!==!1?"checked":""} />Show label chips</span>
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
        `}).join("")}renderLinkRows(e,a){let r=a.map(t=>`<option value="${this.safeText(t.id)}">${this.safeText(t.name)} (${this.safeText(t.id)})</option>`).join("");return e.map((t,o)=>{let i=`link-${o}`,n=!this._expandedSections.has(i),s=a.find(d=>d.id===t.from)?.name||t.from,l=a.find(d=>d.id===t.to)?.name||t.to;return`
          <section class="row link-card ${n?"collapsed":""}" data-kind="link" data-index="${o}">
            <div class="card-head">
              <button class="collapse-toggle" data-action="toggle-section" data-section="${i}" type="button">${n?"\u25B6":"\u25BC"}</button>
              <strong>${this.safeText(s)} \u2192 ${this.safeText(l)}</strong>
            </div>
            ${n?"":`
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
              <label>
                <span>Forward flow color</span>
                <div class="color-row">
                  <input data-field="forwardColor" type="color" value="${this.sanitizeEditorHexColor(t.forwardColor,u.forwardColor)}" />
                  ${t.forwardColor?'<button type="button" class="reset-color-btn" data-action="reset-link-color" data-field="forwardColor" title="Reset to global default">\u21BA Reset</button>':'<span class="color-hint">global default</span>'}
                </div>
              </label>
              <label>
                <span>Reverse flow color</span>
                <div class="color-row">
                  <input data-field="reverseColor" type="color" value="${this.sanitizeEditorHexColor(t.reverseColor,u.reverseColor)}" />
                  ${t.reverseColor?'<button type="button" class="reset-color-btn" data-action="reset-link-color" data-field="reverseColor" title="Reset to global default">\u21BA Reset</button>':'<span class="color-hint">global default</span>'}
                </div>
              </label>
            </div>
            `}
            <button data-action="remove-link" type="button" class="remove-button">Remove Flow</button>
          </section>
        `}).join("")}wireEvents(e,a){let r=this.shadowRoot;r&&(r.querySelectorAll("button[data-action='toggle-section']").forEach(t=>{t.addEventListener("click",()=>{let o=t.dataset.section;o&&(this._expandedSections.has(o)?this._expandedSections.delete(o):this._expandedSections.add(o),this.render())})}),r.querySelectorAll(".entity-picker").forEach(t=>{let o=t.closest("[data-kind][data-index]");if(!o)return;let i=o.dataset.kind,n=Number(o.dataset.index),s=t.dataset.field,l=t.dataset.pickerId??"";t.querySelector(".picker-trigger")?.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),this._openEntityPicker=this._openEntityPicker===l?void 0:l,this.render()}),t.querySelector(".picker-dropdown")?.addEventListener("click",c=>{c.stopPropagation()});let d=t.querySelector(".picker-search");if(d){setTimeout(()=>d.focus(),0),this.applyPickerFilter(t,d.value);let c=()=>{let p=d.value;this._entitySearchTerms.set(l,p),this.applyPickerFilter(t,p)};d.addEventListener("input",c),d.addEventListener("search",c),d.addEventListener("keyup",c),d.addEventListener("keydown",p=>{p.key==="Escape"&&(p.preventDefault(),p.stopPropagation(),this._openEntityPicker=void 0,this.render())})}t.querySelectorAll(".picker-option").forEach(c=>{c.addEventListener("mousedown",p=>{p.preventDefault()}),c.addEventListener("click",p=>{p.preventDefault(),p.stopPropagation();let m=c.dataset.value??"";if(this._openEntityPicker=void 0,i==="node")this.updateNode(e,a,n,{[s]:m});else{let h=[...a];h[n]={...h[n],[s]:m},this.emitConfig({...this.safeConfig,nodes:e,links:h})}})})}),r.addEventListener("click",t=>{!t.target?.closest(".entity-picker")&&this._openEntityPicker&&(this._openEntityPicker=void 0,this.render())}),r.querySelectorAll("input[data-action='layout-zoom']").forEach(t=>{t.addEventListener("input",()=>{let o=Number(t.value);Number.isFinite(o)&&(this._layoutZoomMode="manual",this._layoutZoom=Math.max(50,Math.min(160,o)),this.render())})}),r.querySelector("select[data-action='layout-zoom-mode']")?.addEventListener("change",t=>{let o=t.currentTarget;(o.value==="auto"||o.value==="manual")&&(this._layoutZoomMode=o.value,this.render())}),r.querySelectorAll("[data-action='flow-style']").forEach(t=>{let o=t instanceof HTMLInputElement&&t.type==="range"?"input":"change";t.addEventListener(o,()=>{let i=t.dataset.field;if(!i)return;let s={...this.normalizeEditorFlowStyle(this.safeConfig.flowStyle)};if(t.dataset.kind==="color"){let l=i;s[l]=t.value}else if(t.dataset.kind==="select")i==="linePattern"?s.linePattern=t.value==="orb"?"orb":"dashed":i==="speedCurve"&&(s.speedCurve=t.value==="log"?"log":"linear");else if(t.dataset.kind==="bool")t instanceof HTMLInputElement&&i==="dynamicOrbCount"&&(s.dynamicOrbCount=t.checked);else{let l=i;i==="maxAnimatedWatts"?s.maxAnimatedWatts=Number(t.value):i==="speedMultiplier"?s.speedMultiplier=Number(t.value):i==="orbCountMultiplier"?s.orbCountMultiplier=Number(t.value):s[l]=Number(t.value)}this.emitConfig({...this.safeConfig,flowStyle:this.normalizeEditorFlowStyle(s),nodes:e,links:a})})}),r.querySelectorAll(".node-card[data-kind='node']").forEach((t,o)=>{t.querySelectorAll("input[data-field], select[data-field]").forEach(i=>{let n=i instanceof HTMLInputElement&&i.type!=="checkbox"?"input":"change";i.addEventListener(n,()=>{let s=i.dataset.field,l=i instanceof HTMLInputElement?i.type==="number"?Number(i.value):i.type==="checkbox"?i.checked:i.value:i.value;this.updateNode(e,a,o,{[s]:l})})}),t.querySelector("input[data-action='upload-image']")?.addEventListener("change",async i=>{let n=i.currentTarget,s=n.files?.[0];if(s)try{let l=await this.readFileAsDataUrl(s);this.updateNode(e,a,o,{image:l})}catch(l){console.error(l)}finally{n.value=""}}),t.querySelector("button[data-action='clear-image']")?.addEventListener("click",()=>{this.updateNode(e,a,o,{image:""})}),t.querySelector("button[data-action='remove-node']")?.addEventListener("click",()=>{let i=e.filter((l,d)=>d!==o),n=new Set(i.map(l=>l.id)),s=a.filter(l=>n.has(l.from)&&n.has(l.to));this.emitConfig({...this.safeConfig,nodes:i,links:s})})}),r.querySelectorAll("button[data-action='drag-node']").forEach(t=>{t.addEventListener("pointerdown",o=>{if(o.button!==0)return;let i=Number(t.dataset.index);Number.isFinite(i)&&(o.preventDefault(),this.startNodeDrag(i))})}),r.querySelectorAll(".row[data-kind='link']").forEach((t,o)=>{t.querySelectorAll("input[data-field], select[data-field]").forEach(i=>{if(i instanceof HTMLInputElement&&i.type==="checkbox"){i.addEventListener("change",()=>{let n=[...a];n[o]={...n[o],invert:i.checked},this.emitConfig({...this.safeConfig,nodes:e,links:n})});return}i.addEventListener("change",()=>{let n=i.dataset.field,s=[...a];s[o]={...s[o],[n]:i.value},this.emitConfig({...this.safeConfig,nodes:e,links:s})})}),t.querySelectorAll("button[data-action='reset-link-color']").forEach(i=>{i.addEventListener("click",()=>{let n=i.dataset.field,s=[...a],{[n]:l,...d}=s[o];s[o]=d,this.emitConfig({...this.safeConfig,nodes:e,links:s})})}),t.querySelector("button[data-action='remove-link']")?.addEventListener("click",()=>{let i=a.filter((n,s)=>s!==o);this.emitConfig({...this.safeConfig,nodes:e,links:i})})}),r.querySelector("button[data-action='add-node']")?.addEventListener("click",()=>{let t=[...e,{id:`node_${e.length+1}`,name:`Node ${e.length+1}`,x:50,y:50}];this.emitConfig({...this.safeConfig,nodes:t,links:a})}),r.querySelector("button[data-action='add-link']")?.addEventListener("click",()=>{if(e.length<2)return;let t=[...a,{from:e[0].id,to:e[1].id,entity:"",invert:!1}];this.emitConfig({...this.safeConfig,nodes:e,links:t})}),r.querySelectorAll(".row[data-kind='link']").forEach((t,o)=>{let i=t.querySelectorAll("select[data-field]"),n=a[o];i[0]&&(i[0].value=n.from),i[1]&&(i[1].value=n.to)}))}render(){this.shadowRoot||this.attachShadow({mode:"open"});let e=this.shadowRoot;if(!e)return;let a=this.safeConfig.nodes&&this.safeConfig.nodes.length>0?this.safeConfig.nodes:_,r=this.safeConfig.links??R;e.innerHTML=`
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
          min-width: 0;
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

        .flow-style-row.checkbox-row {
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 10px;
        }

        .flow-style-row.checkbox-row input[type='checkbox'] {
          width: auto;
          min-width: 18px;
          min-height: 18px;
          margin: 0;
          padding: 0;
          accent-color: var(--primary-color, #03a9f4);
        }

        .flow-style-row input[type='color'] {
          min-height: 40px;
          padding: 4px;
        }

        .layout-canvas {
          position: relative;
          width: 100%;
          min-height: var(--layout-frame-min-height, 240px);
          aspect-ratio: var(--layout-frame-aspect, 1.45);
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
          width: var(--layout-node-size, 18%);
          min-height: var(--layout-node-size, 18%);
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
          container-type: size;
        }

        .layout-editor-node-wrapper {
          position: absolute;
          padding: 0;
          border: none;
          background: transparent;
          cursor: grab;
          user-select: none;
          display: block;
          overflow: visible;
          z-index: 1;
          transform: translate(-50%, -50%);
          width: var(--layout-node-size, 18%);
          aspect-ratio: 1 / 1;
          container-type: size;
        }

        .layout-editor-node-wrapper:active {
          cursor: grabbing;
        }

        .layout-editor-node-wrapper article {
          pointer-events: none;
        }

        .layout-editor-node-inner {
          width: 100%;
          height: 100%;
          aspect-ratio: 1 / 1;
          position: relative;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.06));
          border: 1px solid rgba(255, 255, 255, 0.16);
          overflow: hidden;
          display: grid;
          place-items: center;
          container-type: size;
        }

        .layout-editor-node-inner.has-image {
          background: transparent;
        }

        .layout-editor-node-bg {
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

        .layout-editor-node-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding: 0 4px 6px;
          box-sizing: border-box;
          z-index: 1;
        }

        .layout-editor-node-media {
          width: clamp(16px, 34cqw, 48px);
          height: clamp(16px, 34cqw, 48px);
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          font-weight: 700;
          font-size: clamp(8px, 12cqw, 14px);
          flex-shrink: 0;
        }

        .layout-editor-node-label {
          max-width: 85%;
          font-size: clamp(6px, 8cqw, 11px);
          line-height: 1;
          text-align: center;
          color: #f5fbfb;
          background: rgba(0, 0, 0, 0.52);
          padding: 1px 4px;
          border-radius: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 0;
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
          min-width: 0;
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
          right: auto;
          width: max(100%, 360px);
          max-width: min(560px, calc(100vw - 48px));
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

        .picker-option[hidden],
        .picker-group[hidden],
        .picker-no-results[hidden] {
          display: none !important;
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

        .picker-no-results {
          padding: 10px 12px;
          font-size: 0.8rem;
          color: var(--secondary-text-color);
          opacity: 0.85;
          border-top: 1px solid var(--divider-color, rgba(128,128,128,0.2));
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
          min-width: 0;
        }

        label > input,
        label > select,
        label > .entity-picker {
          min-width: 0;
          max-width: 100%;
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
          min-width: 0;
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

        .color-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .color-row input[type="color"] {
          width: 44px;
          height: 32px;
          padding: 2px;
          border-radius: 6px;
          cursor: pointer;
        }

        .color-hint {
          font-size: 0.75rem;
          color: var(--secondary-text-color, rgba(128,128,128,0.8));
          font-style: italic;
        }

        .reset-color-btn {
          font-size: 0.75rem;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid var(--divider-color, rgba(128,128,128,0.35));
          background: transparent;
          color: var(--secondary-text-color, rgba(200,200,200,0.8));
          cursor: pointer;
          white-space: nowrap;
        }

        .reset-color-btn:hover {
          background: rgba(255,255,255,0.08);
        }

        @media (min-width: 980px) {
          .node-grid,
          .metric-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .metric-grid {
            grid-template-columns: 1fr;
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
            min-height: min(72vw, max(200px, var(--layout-frame-min-height, 240px)));
            aspect-ratio: max(1, var(--layout-frame-aspect, 1.15));
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
          <div class="editor-version">Build v${this.safeText(j)}</div>
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
          ${this.renderLayoutCanvas(a,r)}
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
              <span>Flow speed multiplier</span>
              <input data-action="flow-style" data-kind="number" data-field="speedMultiplier" type="range" min="0.3" max="3" step="0.1" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).speedMultiplier.toFixed(1)}" />
              <input data-action="flow-style" data-kind="number" data-field="speedMultiplier" type="number" min="0.3" max="3" step="0.1" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).speedMultiplier.toFixed(1)}" />
            </label>
            <label class="flow-style-row range">
              <span>Max watts for full speed/thickness</span>
              <input data-action="flow-style" data-kind="number" data-field="maxAnimatedWatts" type="range" min="1200" max="30000" step="100" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).maxAnimatedWatts.toFixed(0)}" />
              <input data-action="flow-style" data-kind="number" data-field="maxAnimatedWatts" type="number" min="1200" max="30000" step="100" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).maxAnimatedWatts.toFixed(0)}" />
            </label>
            <label class="flow-style-row checkbox-row">
              <span>Dynamic orb count by power (orb mode)</span>
              <input data-action="flow-style" data-kind="bool" data-field="dynamicOrbCount" type="checkbox" ${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).dynamicOrbCount?"checked":""} />
            </label>
            <label class="flow-style-row range">
              <span>Orb count multiplier</span>
              <input data-action="flow-style" data-kind="number" data-field="orbCountMultiplier" type="range" min="0.2" max="6" step="0.1" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).orbCountMultiplier.toFixed(1)}" />
              <input data-action="flow-style" data-kind="number" data-field="orbCountMultiplier" type="number" min="0.2" max="6" step="0.1" value="${this.normalizeEditorFlowStyle(this.safeConfig.flowStyle).orbCountMultiplier.toFixed(1)}" />
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
          ${this.renderLinkRows(r,a)}
          <div class="actions"><button data-action="add-link" type="button">Add flow</button></div>
        </section>
      </div>
    `;let t=e.querySelector("#title");t?.addEventListener("change",()=>{this.emitConfig({...this.safeConfig,title:t.value,nodes:a,links:r})}),this.wireEvents(a,r)}};customElements.define("mergner-pv-card",z);customElements.define("mergner-pv-card-editor",W);window.customCards=window.customCards||[];window.customCards.push({type:"mergner-pv-card",name:"Mergner PV Card",description:"Dynamic PV flow card with visual editor",preview:!0});
