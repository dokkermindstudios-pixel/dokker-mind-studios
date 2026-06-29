// ============================================================
// "La Casa" — prototype engine v2
// Silhouette platformer. Light = refuge. Darkness = the entity hunts there.
// Room 2 introduces the "echo" mechanic: record a past action, it freezes
// in place once replayed, letting you weigh a plate while you go pull a lever.
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_W = 960, GAME_H = 540;
canvas.width = GAME_W;
canvas.height = GAME_H;

function resize(){
  const container = document.getElementById('game-container');
  const scale = Math.min(container.clientWidth / GAME_W, container.clientHeight / GAME_H);
  canvas.style.width = (GAME_W * scale) + 'px';
  canvas.style.height = (GAME_H * scale) + 'px';
}
window.addEventListener('resize', resize);
resize();

// ---- input ----
const keys = { left:false, right:false, jump:false, action:false };
let actionPressedEdge = false; // true only on the frame the action key/button goes down

function setAction(v){
  if(v && !keys.action) actionPressedEdge = true;
  keys.action = v;
}

window.addEventListener('keydown', e => {
  if(e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if(e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if(e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.jump = true;
  if(e.code === 'KeyE' || e.code === 'Enter') setAction(true);
});
window.addEventListener('keyup', e => {
  if(e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if(e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  if(e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.jump = false;
  if(e.code === 'KeyE' || e.code === 'Enter') setAction(false);
});

function bindHold(id, onDown, onUp){
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener('touchstart', e => { e.preventDefault(); onDown(); }, {passive:false});
  el.addEventListener('touchend', e => { e.preventDefault(); onUp(); }, {passive:false});
  el.addEventListener('mousedown', onDown);
  el.addEventListener('mouseup', onUp);
  el.addEventListener('mouseleave', onUp);
}
bindHold('btn-left', ()=>keys.left=true, ()=>keys.left=false);
bindHold('btn-right', ()=>keys.right=true, ()=>keys.right=false);
bindHold('btn-jump', ()=>keys.jump=true, ()=>keys.jump=false);
bindHold('btn-action', ()=>setAction(true), ()=>setAction(false));

function rectsOverlap(a,b){
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}
function pointInCircle(px,py,cx,cy,r){
  const dx=px-cx, dy=py-cy; return dx*dx+dy*dy < r*r;
}

// ---- player ----
const player = {
  x:0, y:0, w:22, h:46, vx:0, vy:0,
  speed:4.2, jumpForce:-11.5, gravity:0.55,
  onGround:false, facing:1, alive:true,
};
let resetFlashTimer = 0;
let levelIndex = 0;
let levelMessage = '';
let levelMessageTimer = 0;

function showMessage(msg, frames=140){
  levelMessage = msg; levelMessageTimer = frames;
}

// ============================================================
// LEVEL DEFINITIONS
// ============================================================
const GROUND_Y = GAME_H - 70;

function makeRoom1(){
  return {
    name: 'La sala',
    platforms: [
      { x:0, y:GROUND_Y, w:GAME_W, h:70 },
      { x:380, y:GROUND_Y-110, w:160, h:20 },
    ],
    lights: [
      { x:120, y:GROUND_Y, r:140 },
      { x:840, y:GROUND_Y, r:150 },
    ],
    entities: [
      { x:480, y:GROUND_Y-40, w:30, h:40, minX:300, maxX:700, dir:1, speed:1.2, hunting:false, baseSpeed:1.2, huntSpeed:3.0 }
    ],
    interactables: [],
    decor: [
      { shape:'sofa',  x:110, y:24,  w:160, h:74, flipY:true },          // sofá pegado al techo
      { shape:'frame', x:610, y:70,  w:52,  h:66, rot:0.26 },            // cuadro torcido
      { shape:'frame', x:700, y:120, w:40,  h:50, rot:-0.34 },           // otro cuadro torcido
      { shape:'chair', x:300, y:300, w:48,  h:74, rot:1.45 },            // silla volcada de lado
      { shape:'plant', x:838, y:54,  w:54,  h:84, rot:Math.PI },         // maceta colgando del techo (imposible)
    ],
    goal: { x: 900, y: GROUND_Y-90-46, w: 36, h: 46, requires:null },
    start: { x: 60, y: GROUND_Y-46 },
    intro: 'Algo se mueve en la oscuridad entre las luces. No te quedes ahí parado.'
  };
}

function makeRoom2(){
  // Echo puzzle: a memory marker (where recording starts), a pressure plate, a lever, and a gate.
  return {
    name: 'El pasillo',
    platforms: [
      { x:0, y:GROUND_Y, w:GAME_W, h:70 },
      { x:560, y:GROUND_Y-150, w:180, h:20 }, // platform with the lever
    ],
    lights: [
      { x:80, y:GROUND_Y, r:130 },
      { x:700, y:GROUND_Y-150, r:120 },
    ],
    entities: [
      { x:430, y:GROUND_Y-40, w:30, h:40, minX:250, maxX:600, dir:1, speed:1.0, hunting:false, baseSpeed:1.0, huntSpeed:2.6 }
    ],
    interactables: [
      { type:'marker', x:120, y:GROUND_Y-46, w:24, h:46, id:'m1' },
      { type:'plate',  x:340, y:GROUND_Y-14, w:60, h:14, id:'p1', weighted:false },
      { type:'lever',  x:600, y:GROUND_Y-150-40, w:24, h:40, id:'l1', pulled:false },
      { type:'gate',   x:860, y:GROUND_Y-110, w:24, h:110, id:'g1', open:false, requires:['p1','l1'] },
    ],
    decor: [
      { shape:'plant', x:190, y:150, w:54, h:86, rot:Math.PI/2 },        // maceta creciendo de lado (imposible)
      { shape:'frame', x:300, y:90,  w:46, h:58, rot:-0.22 },            // cuadro torcido
      { shape:'frame', x:780, y:60,  w:50, h:62, rot:0.30 },             // cuadro torcido
      { shape:'chair', x:430, y:28,  w:48, h:66, flipY:true },           // silla pegada al techo
    ],
    goal: { x: 900, y: GROUND_Y-90-46, w: 36, h: 46, requires:'g1' },
    start: { x: 60, y: GROUND_Y-46 },
    intro: 'Graba un eco de ti mismo (E) para que pese la placa, mientras tú vas a la palanca.'
  };
}

const levels = [makeRoom1, makeRoom2];
let room = null;

// ---- echo recording state (room 2 mechanic) ----
let recording = false;
let recordedFrames = [];
let echoes = []; // { frames:[...], playIndex, frozen:false, x, y }

function loadLevel(i){
  room = levels[i]();
  player.x = room.start.x; player.y = room.start.y;
  player.vx = 0; player.vy = 0; player.alive = true;
  recording = false; recordedFrames = []; echoes = [];
  document.getElementById('win-screen').classList.add('hidden');
  if(room.intro) showMessage(room.intro, 220);
}

function nextLevel(){
  levelIndex++;
  if(levelIndex >= levels.length){
    document.getElementById('win-screen').classList.remove('hidden');
    document.querySelector('#win-screen h1').textContent = 'Fin del prototipo';
    document.querySelector('#win-screen p').textContent = 'Llegaste al final de las dos habitaciones de muestra. La historia real y el resto de la casa vienen después.';
  } else {
    loadLevel(levelIndex);
  }
}

function resetPlayer(){
  player.x = room.start.x; player.y = room.start.y;
  player.vx = 0; player.vy = 0; player.alive = true;
  resetFlashTimer = 18;
}

// ============================================================
// UPDATE
// ============================================================
function isInAnyLight(x,y){
  return room.lights.some(l => pointInCircle(x,y,l.x,l.y,l.r));
}

function updatePhysicsBody(body, controlled){
  // shared gravity/collision step for player or an echo "ghost" (when not frozen)
  if(controlled){
    if(keys.left){ body.vx=-body.speed; body.facing=-1; }
    else if(keys.right){ body.vx=body.speed; body.facing=1; }
    else body.vx=0;
    if(keys.jump && body.onGround){ body.vy=body.jumpForce; body.onGround=false; }
  }
  body.vy += body.gravity;
  if(body.vy>14) body.vy=14;
  body.x += body.vx;
  body.x = Math.max(0, Math.min(GAME_W-body.w, body.x));
  body.y += body.vy;
  body.onGround=false;
  for(const p of room.platforms){
    const feet = { x:body.x, y:body.y+body.h-2, w:body.w, h:4 };
    if(body.vy>=0 && rectsOverlap(feet,p)){
      body.y = p.y-body.h; body.vy=0; body.onGround=true;
    }
  }
}

function update(){
  if(!room) return;
  if(levelMessageTimer>0) levelMessageTimer--;

  if(!player.alive) return;

  updatePhysicsBody(player, true);

  // record player's frames if currently recording (room 2 mechanic)
  if(recording){
    recordedFrames.push({ x:player.x, y:player.y, facing:player.facing });
    if(recordedFrames.length > 600) stopRecording(); // safety cap (~10s at 60fps)
  }

  // --- entities (the thing in the shadows) ---
  for(const e of room.entities){
    const eInLight = isInAnyLight(e.x+e.w/2, e.y+e.h);
    const distToPlayer = Math.abs((e.x+e.w/2)-(player.x+player.w/2));
    const playerInLight = isInAnyLight(player.x+player.w/2, player.y+player.h);

    e.hunting = !playerInLight && distToPlayer < 260;
    const sp = e.hunting ? e.huntSpeed : e.baseSpeed;

    if(e.hunting){
      e.dir = (player.x > e.x) ? 1 : -1;
    } else {
      if(e.x>e.maxX) e.dir=-1;
      if(e.x<e.minX) e.dir=1;
    }
    e.x += e.dir*sp;
    e.x = Math.max(e.minX-40, Math.min(e.maxX+40, e.x));

    const eBox = { x:e.x, y:e.y, w:e.w, h:e.h };
    const pBox = { x:player.x, y:player.y, w:player.w, h:player.h };
    if(rectsOverlap(eBox,pBox) && !playerInLight){
      player.alive=false;
      setTimeout(()=>{ resetPlayer(); }, 500);
    }
  }

  // --- interactables (room 2) ---
  if(room.interactables.length){
    const pBox = { x:player.x, y:player.y, w:player.w, h:player.h };

    for(const it of room.interactables){
      if(it.type==='marker'){
        it.near = rectsOverlap(pBox, it);
      }
      if(it.type==='lever'){
        it.near = rectsOverlap(pBox, {x:it.x-10,y:it.y-10,w:it.w+20,h:it.h+20});
        if(it.near && actionPressedEdge) it.pulled = true;
      }
      if(it.type==='plate'){
        let weighted = rectsOverlap(pBox, it);
        for(const ec of echoes){
          if(ec.frozen && rectsOverlap({x:ec.x,y:ec.y,w:player.w,h:player.h}, it)) weighted = true;
        }
        it.weighted = weighted;
      }
      if(it.type==='gate'){
        const reqs = it.requires.map(id => room.interactables.find(x=>x.id===id));
        it.open = reqs.every(r => r.type==='plate' ? r.weighted : r.pulled);
      }
    }

    // marker interaction: start/stop recording
    const marker = room.interactables.find(i=>i.type==='marker');
    if(marker && marker.near && actionPressedEdge && !recording && echoes.length===0){
      startRecording();
    } else if(recording && actionPressedEdge && !(marker && marker.near)){
      stopRecording();
    }
  }

  // play back frozen echoes' "ghost trail ended" — nothing to update, they're frozen by definition.

  if(player.y > GAME_H+100) resetPlayer();

  // goal check
  const gate = room.goal.requires ? room.interactables.find(i=>i.id===room.goal.requires) : null;
  const gateBlocking = gate ? !gate.open : false;
  const pBox2 = { x:player.x, y:player.y, w:player.w, h:player.h };
  if(!gateBlocking && rectsOverlap(pBox2, room.goal)){
    nextLevel();
  }

  if(resetFlashTimer>0) resetFlashTimer--;
  actionPressedEdge = false;
}

function startRecording(){
  recording = true;
  recordedFrames = [];
  showMessage('Grabando un eco... presiona E de nuevo junto al marcador para soltarlo.', 240);
}
function stopRecording(){
  recording = false;
  if(recordedFrames.length > 4){
    echoes.push({ frames: recordedFrames.slice(), playIndex:0, frozen:false, x:player.x, y:player.y });
  }
  recordedFrames = [];
  // snap player back to the marker (they "step out of the memory")
  const marker = room.interactables.find(i=>i.type==='marker');
  if(marker){ player.x = marker.x; player.y = marker.y; player.vx=0; player.vy=0; }
  showMessage('El eco quedó atrapado repitiendo tus pasos. Ve a la palanca.', 200);
}

// advance echo playback (separate from main update so it's clearly isolated)
function advanceEchoes(){
  for(const ec of echoes){
    if(ec.frozen) continue;
    if(ec.playIndex < ec.frames.length){
      const f = ec.frames[ec.playIndex];
      ec.x = f.x; ec.y = f.y; ec.facing = f.facing;
      ec.playIndex++;
    } else {
      ec.frozen = true; // stays forever at the last position
    }
  }
}

// ============================================================
// DRAW
// ============================================================
function drawHills(offsetParallax){
  const layers = [
    { color:'#11131c', y:GAME_H*0.62, amp:26, freq:0.012, speed:0.02 },
    { color:'#181b27', y:GAME_H*0.72, amp:36, freq:0.009, speed:0.05 },
    { color:'#22263a', y:GAME_H*0.82, amp:46, freq:0.006, speed:0.09 },
  ];
  layers.forEach(layer => {
    ctx.beginPath();
    ctx.moveTo(0, GAME_H);
    for(let x=0;x<=GAME_W;x+=10){
      const y = layer.y + Math.sin((x*layer.freq)+offsetParallax*layer.speed)*layer.amp;
      ctx.lineTo(x,y);
    }
    ctx.lineTo(GAME_W,GAME_H); ctx.closePath();
    ctx.fillStyle = layer.color; ctx.fill();
  });
}

let t=0;
const fogParticles = Array.from({length:24}, () => ({
  x:Math.random()*GAME_W, y:Math.random()*GAME_H*0.6+GAME_H*0.2,
  r:18+Math.random()*40, speed:0.06+Math.random()*0.12, alpha:0.02+Math.random()*0.035
}));

function drawSilhouette(x,y,w,h, fillStyle, alpha=1){
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(x+w*0.5,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+h*0.4);
  ctx.lineTo(x+w,y+h);
  ctx.lineTo(x,y+h);
  ctx.lineTo(x,y+h*0.4);
  ctx.quadraticCurveTo(x,y,x+w*0.5,y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle='rgba(200,210,230,0.2)';
  ctx.lineWidth=1; ctx.stroke();
  ctx.restore();
}

// ============================================================
// DECORATIVE PROPS — the distorted house (silhouettes, no collision)
// Each decor item: { shape, x, y, w, h, rot?, flipY?, flipX? }
// x,y is the top-left of the bounding box; rot is in radians.
// ============================================================
function roundRectPath(x,y,w,h,r){
  r = Math.min(r, Math.abs(w)/2, Math.abs(h)/2);
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function propStyle(){
  ctx.fillStyle='#0a0c13';                       // dark furniture body
  ctx.strokeStyle='rgba(162,174,202,0.16)';      // faint rim so it reads in the gloom
  ctx.lineWidth=1.5;
}
function fillStroke(){ ctx.fill(); ctx.stroke(); }

function drawSofa(w,h){
  const hw=w/2, hh=h/2, r=Math.min(w,h)*0.14;
  propStyle();
  ctx.beginPath(); roundRectPath(-hw, -hh, w, h*0.55, r); fillStroke();             // backrest
  ctx.beginPath(); roundRectPath(-hw*0.96, -hh+h*0.42, w*0.96, h*0.5, r*0.7); fillStroke(); // seat
  ctx.beginPath(); roundRectPath(-hw, -hh+h*0.25, w*0.16, h*0.7, r*0.7); fillStroke();      // left arm
  ctx.beginPath(); roundRectPath(hw-w*0.16, -hh+h*0.25, w*0.16, h*0.7, r*0.7); fillStroke();// right arm
  ctx.fillRect(-hw+w*0.14, hh-2, w*0.05, h*0.12);                                   // legs
  ctx.fillRect(hw-w*0.19, hh-2, w*0.05, h*0.12);
}
function drawPlant(w,h){
  const hw=w/2, hh=h/2;
  propStyle();
  const potTop=hh-h*0.34;                                                           // pot (trapezoid)
  ctx.beginPath();
  ctx.moveTo(-w*0.28, potTop); ctx.lineTo(w*0.28, potTop);
  ctx.lineTo(w*0.20, hh); ctx.lineTo(-w*0.20, hh); ctx.closePath(); fillStroke();
  const cy=-hh+h*0.30;                                                              // foliage cluster
  [[0,0,w*0.34,h*0.30],[-w*0.26,h*0.10,w*0.24,h*0.22],[w*0.26,h*0.10,w*0.24,h*0.22],
   [-w*0.12,-h*0.16,w*0.22,h*0.22],[w*0.12,-h*0.16,w*0.22,h*0.22]]
   .forEach(([dx,dy,lw,lh])=>{ ctx.beginPath(); ctx.ellipse(dx, cy+dy, lw, lh, 0, 0, Math.PI*2); fillStroke(); });
}
function drawFrame(w,h){
  const hw=w/2, hh=h/2;
  propStyle();
  ctx.beginPath(); ctx.rect(-hw,-hh,w,h); fillStroke();
  ctx.beginPath(); ctx.rect(-hw+w*0.14,-hh+h*0.14,w*0.72,h*0.72); ctx.stroke();
}
function drawChair(w,h){
  const hw=w/2, hh=h/2, r=Math.min(w,h)*0.08;
  propStyle();
  ctx.beginPath(); roundRectPath(-hw, -hh, w*0.20, h, r); fillStroke();             // backrest
  ctx.beginPath(); roundRectPath(-hw, hh*0.05, w, h*0.20, r*0.6); fillStroke();     // seat
  ctx.fillRect(-hw+2, hh*0.28, w*0.07, h*0.6);                                      // legs
  ctx.fillRect(hw-2-w*0.07, hh*0.28, w*0.07, h*0.6);
}
function drawDecorItem(d){
  ctx.save();
  ctx.translate(d.x + d.w/2, d.y + d.h/2);
  if(d.rot)   ctx.rotate(d.rot);
  if(d.flipY) ctx.scale(1,-1);
  if(d.flipX) ctx.scale(-1,1);
  switch(d.shape){
    case 'sofa':  drawSofa(d.w,d.h);  break;
    case 'plant': drawPlant(d.w,d.h); break;
    case 'frame': drawFrame(d.w,d.h); break;
    case 'chair': drawChair(d.w,d.h); break;
  }
  ctx.restore();
}

function draw(){
  const grad = ctx.createLinearGradient(0,0,0,GAME_H);
  grad.addColorStop(0,'#05060a'); grad.addColorStop(0.55,'#0a0c14'); grad.addColorStop(1,'#000');
  ctx.fillStyle = grad; ctx.fillRect(0,0,GAME_W,GAME_H);

  drawHills(t);

  fogParticles.forEach(f=>{
    f.x += f.speed; if(f.x>GAME_W+f.r) f.x=-f.r;
    ctx.beginPath(); ctx.fillStyle=`rgba(180,190,210,${f.alpha})`;
    ctx.ellipse(f.x,f.y,f.r,f.r*0.4,0,0,Math.PI*2); ctx.fill();
  });

  if(!room){ t++; return; }

  // platforms
  room.platforms.forEach(p=>{
    ctx.fillStyle='#0c0d13'; ctx.fillRect(p.x,p.y,p.w,p.h);
    ctx.fillStyle='rgba(150,160,190,0.18)'; ctx.fillRect(p.x,p.y,p.w,2);
  });

  // decorative props (the distorted house) — drawn under the light pools
  (room.decor || []).forEach(drawDecorItem);

  // lights (safe zones — warm glow pools)
  room.lights.forEach(l=>{
    const g = ctx.createRadialGradient(l.x,l.y,0,l.x,l.y,l.r);
    g.addColorStop(0,'rgba(255,225,180,0.30)');
    g.addColorStop(0.6,'rgba(255,210,150,0.12)');
    g.addColorStop(1,'rgba(255,210,150,0)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(l.x,l.y,l.r,0,Math.PI*2); ctx.fill();
  });

  // interactables
  room.interactables.forEach(it=>{
    if(it.type==='marker'){
      ctx.strokeStyle = it.near ? 'rgba(255,225,180,0.8)' : 'rgba(255,225,180,0.35)';
      ctx.lineWidth=2;
      ctx.strokeRect(it.x,it.y,it.w,it.h);
      ctx.fillStyle='rgba(255,225,180,0.6)';
      ctx.font='10px sans-serif'; ctx.textAlign='center';
      ctx.fillText('E', it.x+it.w/2, it.y-6);
    }
    if(it.type==='plate'){
      ctx.fillStyle = it.weighted ? 'rgba(140,255,180,0.55)' : 'rgba(120,130,150,0.4)';
      ctx.fillRect(it.x,it.y,it.w,it.h);
    }
    if(it.type==='lever'){
      ctx.fillStyle = it.pulled ? 'rgba(140,255,180,0.7)' : (it.near?'rgba(255,225,180,0.7)':'#1a1c26');
      ctx.fillRect(it.x,it.y,it.w,it.h);
      ctx.fillStyle='rgba(255,225,180,0.6)';
      ctx.font='10px sans-serif'; ctx.textAlign='center';
      if(!it.pulled) ctx.fillText('E', it.x+it.w/2, it.y-6);
    }
    if(it.type==='gate'){
      ctx.fillStyle = it.open ? 'rgba(140,255,180,0.18)' : '#15171f';
      if(!it.open) ctx.fillRect(it.x,it.y,it.w,it.h);
      ctx.strokeStyle='rgba(150,160,190,0.3)';
      ctx.strokeRect(it.x,it.y,it.w,it.h);
    }
  });

  // entities (the thing in the dark — slightly red rim when hunting)
  room.entities.forEach(e=>{
    drawSilhouette(e.x,e.y,e.w,e.h, e.hunting ? '#1a0606' : '#000000', 1);
    if(e.hunting){
      ctx.fillStyle='rgba(255,60,60,0.7)';
      ctx.beginPath(); ctx.arc(e.x+e.w*0.3,e.y+e.h*0.25,2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(e.x+e.w*0.7,e.y+e.h*0.25,2,0,Math.PI*2); ctx.fill();
    }
  });

  // echoes (frozen ghosts of the player)
  advanceEchoes();
  echoes.forEach(ec=>{
    drawSilhouette(ec.x,ec.y,player.w,player.h,'#000000', ec.frozen?0.55:0.8);
  });

  // goal
  const gate = room.goal.requires ? room.interactables.find(i=>i.id===room.goal.requires) : null;
  const goalReady = gate ? gate.open : true;
  ctx.save();
  ctx.shadowColor='rgba(255,210,140,0.55)'; ctx.shadowBlur=22;
  ctx.fillStyle = goalReady ? 'rgba(255,210,140,0.9)' : 'rgba(120,120,130,0.35)';
  ctx.fillRect(room.goal.x,room.goal.y,room.goal.w,room.goal.h);
  ctx.restore();

  // player
  drawSilhouette(player.x,player.y,player.w,player.h,'#000000',
    (resetFlashTimer>0 && resetFlashTimer%6<3) ? 0.3 : 1);

  // vignette
  const vg = ctx.createRadialGradient(GAME_W/2,GAME_H/2,GAME_H*0.25,GAME_W/2,GAME_H/2,GAME_H*0.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.55)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,GAME_W,GAME_H);

  // level message banner
  if(levelMessageTimer>0){
    ctx.save();
    ctx.globalAlpha = Math.min(1, levelMessageTimer/30);
    ctx.fillStyle='rgba(0,0,0,0.55)';
    ctx.fillRect(0,18,GAME_W,34);
    ctx.fillStyle='rgba(230,232,238,0.9)';
    ctx.font='14px sans-serif'; ctx.textAlign='center';
    ctx.fillText(levelMessage, GAME_W/2, 40);
    ctx.restore();
  }

  // room name tag
  ctx.fillStyle='rgba(200,200,210,0.35)';
  ctx.font='11px sans-serif'; ctx.textAlign='left';
  ctx.fillText(room.name, 14, GAME_H-12);

  t++;
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }

// ---- UI wiring ----
document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('touch-controls').classList.add('active');
  loadLevel(0);
});
document.getElementById('retry-btn').addEventListener('click', () => {
  levelIndex = 0;
  loadLevel(0);
});

loop();
