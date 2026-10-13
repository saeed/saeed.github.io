const stories={
  "hardware": [
    "<blockquote>“Choose hardware for every device slot and one system for each role”</blockquote><h4>One pod, two racks, one shared spine</h4><table class=\"mini-table\"><thead><tr><th>SLOTS TO FILL</th><th>CONNECTIONS</th></tr></thead><tbody><tr><td>Rack A: 7 compute</td><td>7 dedicated links to leaf A</td></tr><tr><td>Rack B: 7 compute</td><td>7 dedicated links to leaf B</td></tr><tr><td>2 leaf routers + 1 spine</td><td>1 link from each leaf to the spine</td></tr></tbody></table><p><strong>Workload:</strong> ML_Training, on Rack A only.<br><strong>Properties:</strong> dc_flows, long_flows, ml_training.</p><h4>Requested answer</h4><ol><li>One system for each of six roles.</li><li>All 14 compute, 3 router, and 16 link assignments.</li><li>Total hardware cost.</li><li>A justification per role, including the deciding objective and any conditional ordering.</li></ol>",
    "<table class=\"mini-table\"><thead><tr><th>ROLE</th><th>CHOOSE EXACTLY ONE</th></tr></thead><tbody><tr><td>CPU scheduler</td><td>ZygOS, Shenango, Snap, Demikernel, Linux, NetChannel</td></tr><tr><td>Congestion control</td><td>DCQCN, BFC, TIMELY, DCTCP, BBR, CUBIC, LEDBAT</td></tr><tr><td>Virtual switch</td><td>Andromeda, VFP, Nitro</td></tr><tr><td>Transport</td><td>TCP, RDMA, Pony, SRD</td></tr><tr><td>Load balancer</td><td>CONGA, PacketSpray, PLB, ECMP</td></tr><tr><td>Monitor</td><td>PingMesh, Simon</td></tr></tbody></table><h4>Hardware and objective order</h4><p><strong>Link catalog:</strong> 25G (cost 5), 40G (cost 10), 80G (cost 40). Also 13 compute and 8 router profiles.</p><p><strong>Priority:</strong> latency, ease of deployment, monitoring, throughput, cost efficiency—in that strict order.</p><div class=\"message\"><strong>Latency preferences supplied in this prompt:</strong><br>BFC &gt; DCQCN &gt; TIMELY<br>RDMA = SRD &gt; Pony &gt; TCP<br>PacketSpray &gt; CONGA = PLB &gt; ECMP</div><p class=\"source-note\">These rankings capture the architect’s experience from using and experimenting with the systems. The full prompt below includes the remaining orderings and hardware profiles.</p>",
    "<table class=\"mini-table\"><thead><tr><th>ROLE</th><th>AI’S CHOICE</th></tr></thead><tbody><tr><td>CPU scheduler</td><td>Demikernel</td></tr><tr><td>Congestion control</td><td><mark>BFC</mark></td></tr><tr><td>Virtual switch</td><td>Andromeda</td></tr><tr><td>Transport</td><td><mark>RDMA</mark></td></tr><tr><td>Load balancer</td><td><mark>PacketSpray</mark></td></tr><tr><td>Monitor</td><td>Simon</td></tr></tbody></table><h4>Hardware assignments</h4><table class=\"mini-table\"><thead><tr><th>SLOT(S)</th><th>HARDWARE / LINK</th></tr></thead><tbody><tr><td>A1–A7 (all 7)</td><td>16Cores_highFPGA / 80GLink</td></tr><tr><td>B1–B7 (all 7)</td><td>4Cores / 25GLink</td></tr><tr><td>Rack A leaf</td><td>TofinoV2Router</td></tr><tr><td>Rack B leaf</td><td>router_2qos_5memory</td></tr><tr><td>Spine</td><td>TofinoV2Router</td></tr><tr><td>Leaf A to spine</td><td>80GLink</td></tr><tr><td>Leaf B to spine</td><td>25GLink</td></tr></tbody></table><p class=\"source-note\">Identical hardware assignments are grouped without omitting any slots.</p>",
    "<h3>Does faster feedback justify the switch cost?</h3><div class=\"mechanism\"><strong>Bandwidth-delay product = link rate × round-trip time</strong><p>It measures how much data can be sent before end-to-end feedback returns.</p></div><p>When most messages are much smaller than the BDP, many can finish before the sender reacts. BFC responds locally, hop by hop, but needs switch queues, state, and control logic.</p><div class=\"verdict bad-verdict\"><div><strong>The AI never establishes that need.</strong><small>“Long flows” and an 80G link do not establish the message-size distribution, RTT, or burst behavior needed to justify BFC’s switch investment.</small></div></div><p><strong>A better answer:</strong> establish those conditions and compare the benefit with the switch cost before choosing BFC.</p><details class=\"model-detail\"><summary>How the recorded Archie model represents this</summary><p>For workloads without short_flows or incast, this model requires bandwidth ≥ 100. Its catalog stops at 80, so BFC is rejected. This is an encoded policy, not a physical minimum speed for BFC.</p></details><p class=\"source-note\"><a href=\"https://www.usenix.org/system/files/nsdi22-paper-goyal.pdf\" target=\"_blank\" rel=\"noopener\">BFC paper, §§1–2: feedback delay and switch requirements</a></p>",
    "<h3>Where do out-of-order packets wait?</h3><ol class=\"mechanism-steps\"><li><strong>Spray across paths.</strong> Different path and queue delays let later packets arrive first.</li><li><strong>Restore order.</strong> A buffering receiver holds those packets until the missing earlier ones arrive.</li><li><strong>Provision the NIC.</strong> High rates and large delay differences can demand substantial reorder memory.</li></ol><div class=\"verdict bad-verdict\"><div><strong>The AI does not budget for reordering.</strong><small>It selects RDMA + PacketSpray without checking receiver support or deriving the needed capacity.</small></div></div><p><strong>A better answer:</strong> verify usable parallel paths, estimate reordering under load, and check the NIC’s buffering or out-of-order placement support.</p><details class=\"model-detail\"><summary>Catalog conflict and implementation assumptions</summary><p>The case-study policy requires NIC_Reorder_Buffer &gt; 20. The selected RDMA profile has 20; all RDMA-capable options have 10 or 20. The option with 50 lacks RDMA, so the encoded combination is infeasible.</p><p>The catalog gives no buffer units or path-delay bound. That prevents a physical capacity calculation. Some RDMA NIC designs place out-of-order payload directly in host memory, reducing on-NIC buffering; their support must be modeled separately.</p></details><p class=\"source-note\"><a href=\"https://arxiv.org/html/1806.08159\" target=\"_blank\" rel=\"noopener\">IRN paper, §5.3: buffering costs and direct placement</a></p>",
    "<table class=\"mini-table comparison-table\"><thead><tr><th>ROLE</th><th>AI RESPONSE</th><th>ARCHIE RESULT</th></tr></thead><tbody><tr><td>CPU scheduler</td><td>Demikernel</td><td>NetChannel</td></tr><tr><td>Congestion control</td><td><mark>BFC</mark></td><td><strong>DCQCN</strong></td></tr><tr><td>Virtual switch</td><td>Andromeda</td><td>Andromeda</td></tr><tr><td>Transport</td><td>RDMA</td><td>RDMA</td></tr><tr><td>Load balancer</td><td><mark>PacketSpray</mark></td><td><strong>PLB</strong></td></tr><tr><td>Monitor</td><td>Simon</td><td>Simon</td></tr></tbody></table><div class=\"verdict\"><div><strong>Select alternatives within the reviewed model.</strong><small>DCQCN avoids the encoded BFC bandwidth conflict. PLB avoids the PacketSpray/RDMA conflict.</small></div></div><p><strong>Reported hardware cost:</strong> 11,760 catalog units.</p><p class=\"source-note\">Precomputed result, not a live solver run. The cost is a catalog score, not a market price. NetChannel is selected by applying the architect’s experience-based rankings, objective priorities, and feasibility constraints.</p>"
  ],
  "priority": [
    "<p><strong>Application:</strong> DeathStarBench Hotel Reservation.<br><strong>Cluster:</strong> 10 c220g1/c220g2 CloudLab nodes.<br><strong>Load:</strong> low to medium; uneven across services.</p><table class=\"mini-table\"><thead><tr><th>ROLE / PURPOSE</th><th>ALLOWED CANDIDATES</th></tr></thead><tbody><tr><td>Container runtime<small>Runs application containers</small></td><td>Docker / CRI-O / containerd</td></tr><tr><td>Orchestrator<small>Deployment, scheduling, lifecycle, scaling</small></td><td>Kubernetes / Knative / Docker Swarm</td></tr><tr><td>RPC<small>Request/response communication</small></td><td>gRPC / Thrift</td></tr><tr><td>Service mesh<small>Traffic policy, security, observability</small></td><td>Istio / Linkerd</td></tr><tr><td>Autoscaler<small>Capacity adjustment with demand</small></td><td>Kubernetes HPA / KEDA</td></tr></tbody></table><h4>Objectives, in order</h4><ol><li><strong>Ease of deployment:</strong> documented, quick to configure, minimal documentation hops, no configuration feedback loops, simple debugging.</li><li><strong>Latency:</strong> minimize end-to-end latency without sacrificing successful throughput.</li></ol><p class=\"source-note\">The user permits web search and asks for configuration and deployment guidance for a non-expert.</p>",
    "<table class=\"mini-table\"><thead><tr><th>CHOICE</th><th>AI’S EXPLANATION (CONDENSED)</th></tr></thead><tbody><tr><td>containerd</td><td>Direct Kubernetes integration; Docker needs the cri-dockerd adapter. CRI-O is also valid. This is about setup, not an inherent request-latency advantage.</td></tr><tr><td>Kubernetes</td><td>Both candidate autoscalers operate on Kubernetes workloads. Swarm lacks a straightforward compatible stack; Knative adds components not initially needed.</td></tr><tr><td>gRPC</td><td>Hotel Reservation already uses gRPC. Thrift would add development and debugging work.</td></tr><tr><td>Linkerd</td><td>Documented installation/proxy checks and gRPC-aware diagnostics. Add Viz for success rates, traffic, and latency.</td></tr><tr><td>Kubernetes HPA</td><td>CPU scaling needs Metrics Server and an HPA for each Deployment. KEDA’s event-source machinery is unnecessary here.</td></tr></tbody></table><p class=\"source-note\">This baseline matches the paper’s ease-first configuration.</p>",
    "<blockquote>“Ok, what if I flip the objectives: have the secondary objective be the primary and the primary be the secondary. Again, keep in mind that we ideally want both but it is ok to sacrifice the secondary objective only in the case where the primary is affected.”</blockquote><h4>The revised objective order</h4><ol><li><strong>Minimum end-to-end latency</strong>, preserving successful throughput.</li><li><strong>Ease of deployment and debugging</strong>, where consistent with the first objective.</li></ol><p>The application, hardware inventory, and five candidate lists are unchanged.</p>",
    "<p class=\"transcript-quote\">With latency and successful throughput first, <mark>I would initially keep the same five systems</mark>—but change how capacity, placement, and performance are configured and validated. Reversing priorities does not automatically make a different product faster.\n</p><p class=\"transcript-quote\">The mesh deserves particular care. “Ambient has no sidecars” does not establish that it delivers lower end-to-end latency. Istio ambient still processes traffic through node-level ztunnel proxies, with an additional waypoint when Layer 7 features are enabled. A Linkerd-published benchmark favored Linkerd over ambient with a waypoint. However, it used Emojivoto on GKE, and discarded the two worst of five runs—not sufficient evidence to declare a winner for your workload. Meanwhile, Istio’s headline performance comparison measures TCP bandwidth using iperf, which also does not establish Hotel Reservation latency.\n</p><p class=\"transcript-quote\">Istio ambient with only its L4 layer is worth testing, because it avoids HTTP/gRPC processing in the mesh. But it also gives up mesh-provided gRPC request metrics and Layer 7 policies. Following your instruction, I would accept that loss of debugging convenience only if it produces a repeatable latency improvement while preserving successful throughput</p><p class=\"source-note\">Complete AI follow-up, with the retained-choice statement highlighted.</p>",
    "<table class=\"mini-table\"><thead><tr><th>ROLE</th><th>LATENCY-FIRST CHOICE</th></tr></thead><tbody><tr><td>Container runtime</td><td>containerd</td></tr><tr><td>Orchestrator</td><td>Kubernetes</td></tr><tr><td>RPC</td><td>gRPC</td></tr><tr><td>Service mesh</td><td><strong>Istio in ambient mode</strong></td></tr><tr><td>Autoscaler</td><td>Kubernetes HPA</td></tr></tbody></table><img class=\"evaluation\" src=\"assets/latency-evaluation.png\" alt=\"Paper comparison of median and p90 Hotel Reservation latency across Linkerd, Istio sidecar, and Istio ambient\"><p class=\"eval-caption\">At 90 RPS on ten c220g1 nodes, ambient improves median latency over Linkerd with comparable tail latency.</p><p class=\"source-note\">The architect’s experience informs the latency ordering; the paper’s Hotel Reservation experiment provides quantitative support. The chat specifies mixed c220g1/c220g2 nodes; the experiment uses c220g1 nodes.</p>"
  ]
};
const stageMeta={
  "hardware": [
    [
      "prompt",
      "User prompt",
      "Deployment, workload, and required output"
    ],
    [
      "prompt",
      "User prompt",
      "Candidate systems and objective priorities"
    ],
    [
      "ai",
      "AI response",
      "The system and hardware choices proposed by the LLM"
    ],
    [
      "analysis",
      "Analysis",
      "Checking feedback delay and the need for BFC"
    ],
    [
      "analysis",
      "Analysis",
      "Checking packet reordering and receiver resources"
    ],
    [
      "archie",
      "Archie result vs. AI response",
      "Both outputs shown: AI in the middle column; Archie on the right"
    ]
  ],
  "priority": [
    [
      "prompt",
      "User prompt",
      "Application, candidate systems, and initial priorities"
    ],
    [
      "ai",
      "AI response",
      "The LLM’s initial deployment recommendation"
    ],
    [
      "prompt",
      "User follow-up",
      "The user reverses the objective priorities"
    ],
    [
      "ai",
      "AI response",
      "The LLM’s answer to the changed requirements"
    ],
    [
      "archie",
      "Archie result",
      "Latency-first configuration and the paper’s evaluation"
    ]
  ]
};
for(const story of document.querySelectorAll('.story')){
 const key=story.dataset.case, body=document.querySelector(`#${key}-body`),count=document.querySelector(`#${key}-count`),steps=[...story.querySelectorAll('.story-step')],dots=story.querySelector('.step-dots'),prev=story.querySelector('.prev'),next=story.querySelector('.next');let active=-1;
 const setStep=n=>{n=Math.max(0,Math.min(steps.length-1,n));if(n===active)return;active=n;const [kind,title,detail]=stageMeta[key][n];story.dataset.speaker=kind;story.querySelector(".replay").dataset.speaker=kind;document.querySelector(`#${key}-speaker`).textContent=title;document.querySelector(`#${key}-speaker-detail`).textContent=detail;body.innerHTML=stories[key][n];body.scrollTop=0;body.classList.remove('enter');void body.offsetWidth;body.classList.add('enter');count.textContent=`${n+1} / ${steps.length}`;dots.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-current',i===n?'true':'false'));prev.disabled=n===0;next.disabled=n===steps.length-1;story.dataset.activeStep=n;};
 const jump=n=>{setStep(n);const mobile=matchMedia('(max-width:760px)').matches;const offset=mobile?story.querySelector('.sticky-panel').offsetHeight+20:innerHeight*.28;window.scrollTo({top:Math.max(0,steps[n].getBoundingClientRect().top+scrollY-offset),behavior:'instant'});};
 steps.forEach((s,i)=>{s.dataset.speaker=stageMeta[key][i][0];const b=document.createElement('button');b.textContent=String(i+1);b.setAttribute('aria-label',`Step ${i+1}: ${s.querySelector('h3').textContent}`);b.addEventListener('click',()=>jump(i));dots.append(b);});prev.addEventListener('click',()=>jump(active-1));next.addEventListener('click',()=>jump(active+1));setStep(0);
 let ticking=false;const update=()=>{const mobile=matchMedia('(max-width:760px)').matches;const anchor=mobile?story.querySelector('.sticky-panel').offsetHeight+65:innerHeight*.48;let selected=0;steps.forEach((s,i)=>{if(s.getBoundingClientRect().top<=anchor)selected=i;});setStep(selected);ticking=false;};window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});window.addEventListener('resize',update);update();
}
const tabs=[...document.querySelectorAll('[data-role]')];const chooseTab=b=>{tabs.forEach(t=>{const selected=t===b;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;document.querySelector(`#${t.dataset.role}-guide`).hidden=!selected;document.querySelector(`#${t.dataset.role}-implementation`).hidden=!selected;});};tabs.forEach((b,i)=>{b.addEventListener('click',()=>chooseTab(b));b.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();chooseTab(tabs[n]);tabs[n].focus();}});});
