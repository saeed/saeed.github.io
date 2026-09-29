(() => {
 'use strict';
 const ns='http://www.w3.org/2000/svg';
 const atlas=window.STATE_ATLAS;
 const layer=document.querySelector('#map-layer');
 const selectedStates=new Set(['27','36','46','48','51']);
 const stateNodes=new Map();
 const labels=new Map();
 const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const cases=[...document.querySelectorAll('.case')];
 let active=-1,frame=0,camera=[0,0,1],cameraRequest=0;
 function svg(tag,attrs){const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;}
 // Decode the bundled TopoJSON arcs. US Atlas supplies Census-derived boundaries
 // already projected to the 975 x 610 Albers USA coordinate space.
 const arcs=atlas.arcs.map(arc=>{let x=0,y=0;return arc.map(p=>{x+=p[0];y+=p[1];return [x*atlas.transform.scale[0]+atlas.transform.translate[0],y*atlas.transform.scale[1]+atlas.transform.translate[1]];});});
 function ring(indices){const points=[];indices.forEach(i=>{const pts=i<0?[...arcs[~i]].reverse():arcs[i];points.push(...pts.slice(points.length?1:0));});return points;}
 const stateFeatures=atlas.objects.states.geometries;
 stateFeatures.forEach(g=>{
  const polygons=g.type==='Polygon'?[g.arcs]:g.arcs;
  const d=polygons.map(poly=>poly.map(r=>ring(r).map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(2)).join(',')).join('')+'Z').join('')).join('');
  const id=String(g.id).padStart(2,'0');
  const p=svg('path',{d,'class':'state'+(selectedStates.has(id)?' study':''),'data-state':id});
  const title=svg('title',{});title.textContent=g.properties.name;p.append(title);layer.append(p);stateNodes.set(id,p);
 });
 // Add labels above the geography so zoomed state names remain legible.
 const names={'27':'MN','36':'NY','46':'SD','48':'TX','51':'VA'};
 Object.entries(names).forEach(([id,name])=>{const box=stateNodes.get(id).getBBox();const label=svg('text',{x:box.x+box.width/2,y:box.y+box.height/2,'class':'map-state-label','text-anchor':'middle'});label.textContent=name;layer.append(label);labels.set(id,label);});
 function setTransform(v){camera=v;layer.setAttribute('transform','translate('+v[0]+' '+v[1]+') scale('+v[2]+')');labels.forEach(n=>n.style.fontSize=13/v[2]+'px');}
 function fly(ids){
  cancelAnimationFrame(cameraRequest);
  let target=[0,0,1];
  if(ids.length){let x=Infinity,y=Infinity,x2=-Infinity,y2=-Infinity;ids.forEach(id=>{const b=stateNodes.get(id).getBBox();x=Math.min(x,b.x);y=Math.min(y,b.y);x2=Math.max(x2,b.x+b.width);y2=Math.max(y2,b.y+b.height);});const scale=Math.min(2.65,800/(x2-x+110),470/(y2-y+100));target=[487.5-(x+x2)/2*scale,305-(y+y2)/2*scale,scale];}
  if(reduceMotion.matches){setTransform(target);return;}
  const from=[...camera],start=performance.now();
  function animate(now){const t=Math.min((now-start)/800,1),u=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;setTransform(from.map((v,i)=>v+(target[i]-v)*u));if(t<1)cameraRequest=requestAnimationFrame(animate);}
  cameraRequest=requestAnimationFrame(animate);
 }
 function activate(index){
  if(index===active)return;active=index;
  const c=cases[index],ids=c.dataset.states.split(',');
  stateNodes.forEach((p,id)=>{p.classList.toggle('current',id===ids[0]);p.classList.toggle('companion',ids.slice(1).includes(id));});
  document.querySelector('#map-criterion').textContent=c.dataset.criterion;
  document.querySelector('#map-name').textContent=c.dataset.title;
  document.querySelector('#map-explanation').textContent=c.dataset.summary;
  document.querySelector('#case-count').textContent=(index+1)+' of '+cases.length;
  document.querySelector('#previous-case').disabled=index===0;
  document.querySelector('#next-case').disabled=index===cases.length-1;
  fly(ids);
 }
 function updateScroll(){
  frame=0;
  const height=document.documentElement.scrollHeight-innerHeight;
  document.querySelector('#reading-progress').style.width=(height>0?scrollY/height*100:0)+'%';
  const target=innerWidth<=900?Math.min(innerHeight-40,document.querySelector('.map-panel').getBoundingClientRect().bottom+65):innerHeight*.42;
  let index=0;cases.forEach((c,i)=>{if(c.getBoundingClientRect().top<=target)index=i;});
  activate(index);
 }
 addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(updateScroll);},{passive:true});
 addEventListener('resize',()=>{active=-1;updateScroll();});
 document.querySelector('#map-reset').addEventListener('click',()=>fly([]));
 document.querySelector('#previous-case').addEventListener('click',()=>{const i=Math.max(0,active-1);location.hash=cases[i].id;activate(i);});
 document.querySelector('#next-case').addEventListener('click',()=>{const i=Math.min(cases.length-1,active+1);location.hash=cases[i].id;activate(i);});
 document.querySelectorAll('.criteria-list a').forEach(a=>a.addEventListener('click',()=>{const i=cases.findIndex(c=>'#'+c.id===a.hash);if(i>=0)activate(i);}));
 const input=document.querySelector('#facility-size');
 function updateThreshold(){
  const value=Number(input.value),passed=[];
  document.querySelector('#facility-value').textContent=value+' MW';
  document.querySelectorAll('.threshold-row').forEach(r=>{const above=value>Number(r.dataset.threshold);r.classList.toggle('passed',above);if(above)passed.push(r.firstElementChild.textContent);});
  document.querySelector('#threshold-result').textContent=passed.length?'This illustrative size is above the displayed principal trigger in '+passed.join(', ')+'. Exact legal coverage depends on the provision.':'This illustrative size is at or below every displayed principal trigger. Exact legal coverage depends on the provision.';
 }
 input.addEventListener('input',updateThreshold);updateThreshold();
 const rows=[
 ['Grid & interconnection','Leading','Moderate','Moderate','Emerging','Strong'],
 ['Flexibility','Leading','Moderate','Limited','Emerging','Strong'],
 ['Costs & transparency','Strong','Strong','Strong','Emerging','Leading'],
 ['Clean energy','Limited','Leading','Limited','Emerging','Moderate'],
 ['Water','Limited','Leading','Strong','Emerging','Strong'],
 ['Community review','Limited','Strong','Moderate','Leading / interim','Strong']
 ];
 const tbody=document.querySelector('#matrix tbody');
 rows.forEach(row=>{const tr=document.createElement('tr');row.forEach((value,i)=>{const cell=document.createElement(i?'td':'th');if(!i){cell.scope='row';cell.textContent=value;}else{const span=document.createElement('span');span.className='rating '+value.toLowerCase().split(' ')[0];span.textContent=value;cell.append(span);}tr.append(cell);});tbody.append(tr);});
 updateScroll();
})();
