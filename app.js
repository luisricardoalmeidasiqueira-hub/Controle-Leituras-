
const KEY="controle_leituras_luis_ricardo_v1",RASC=KEY+"_rascunho",CALKEY=KEY+"_calendario",FOTOKEY=KEY+"_calendario_foto";
let registros=[];try{registros=JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){}
let etapa=1;
const $=x=>document.getElementById(x);
const p2=n=>String(n).padStart(2,"0");
function hoje(){let d=new Date(),o=d.getTimezoneOffset();return new Date(d-o*60000).toISOString().slice(0,10)}
function fmt(x){let [y,m,d]=x.split("-");return d+"/"+m+"/"+y}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function nomeMes(m){let [y,mo]=m.split("-");let n=new Date(+y,+mo-1,1).toLocaleDateString("pt-BR",{month:"long"});return n+" "+y}
function somaMes(m,d){let [y,mo]=m.split("-").map(Number);let x=new Date(y,mo-1+d,1);return x.getFullYear()+"-"+p2(x.getMonth()+1)}

// ---------- Calendário de leitura (dias de cada etapa 01 a 18, por mês) ----------
const CAL_PADRAO={
"2025-12":[3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,26,27],
"2026-01":[2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27],
"2026-02":[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25],
"2026-03":[4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27],
"2026-04":[1,2,6,7,8,9,10,11,13,14,15,16,17,20,22,23,24,27],
"2026-05":[4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27],
"2026-06":[2,3,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26],
"2026-07":[2,3,6,7,8,10,13,14,15,16,17,20,21,22,23,24,27,28],
"2026-08":[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26],
"2026-09":[2,3,4,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28],
"2026-10":[1,2,5,6,7,8,9,13,14,15,16,19,20,21,22,23,26,27],
"2026-11":[3,4,5,6,7,9,10,11,12,13,16,17,18,19,23,24,25,26],
"2026-12":[2,3,4,7,9,10,11,14,15,16,17,18,21,22,23,24,26,28]};
// cal[mês] = 18 datas "AAAA-MM-DD" (ou "" se não tiver)
let cal={};
Object.entries(CAL_PADRAO).forEach(([m,dias])=>cal[m]=dias.map(d=>m+"-"+p2(d)));
try{Object.assign(cal,JSON.parse(localStorage.getItem(CALKEY)||"{}"))}catch(e){}
const CALDELKEY=KEY+"_calendario_apagado";let calApagados=[];try{calApagados=JSON.parse(localStorage.getItem(CALDELKEY)||"[]")}catch(e){}
calApagados.forEach(m=>delete cal[m]);
function salvarCal(){
  const mud={};Object.keys(cal).forEach(m=>{const pad=CAL_PADRAO[m]?CAL_PADRAO[m].map(d=>m+"-"+p2(d)):null;if(!pad||JSON.stringify(pad)!==JSON.stringify(cal[m]))mud[m]=cal[m]});
  try{localStorage.setItem(CALKEY,JSON.stringify(mud))}catch(e){}
}
// ---------- Férias / folga: períodos em que você não lança ----------
const FERIASKEY=KEY+"_ferias";
// 🚫 Etapa que você não fez (trabalhou, mas em outro serviço): {"2026-09-25":"outro serviço"} pelo dia do calendário
// 🗂️ Livros marcados pra ressequenciar: {"003069":{etapa:4,quando:"2026-10-14",nota:"..."}}
const RESSEQKEY=KEY+"_resseq";let resseq={};try{resseq=JSON.parse(localStorage.getItem(RESSEQKEY)||"{}")||{}}catch(e){}
function salvarResseq(){try{localStorage.setItem(RESSEQKEY,JSON.stringify(resseq))}catch(e){}}
function marcarResseq(id){
  const r=registros.find(x=>String(x.id)===String(id));if(!r)return;const l=r.livro,a=resseq[l];
  if(a){
    if(confirm("🗂️ Livro "+l+" está marcado pra sequenciar (desde "+fmt(a.quando)+")."+(a.nota?"\n📝 "+a.nota:"")+"\n\nOK = já sequenciei (tirar o aviso)\nCancelar = continua marcado")){delete resseq[l];salvarResseq();render()}
    return;
  }
  if(!confirm("🗂️ Sequenciar o livro "+l+" no mês que vem?\n\nNa Etapa "+p2(r.etapa)+" o app avisa."))return;
  resseq[l]={etapa:r.etapa,quando:hoje(),nota:""};salvarResseq();render();
}
// 🗂️ foi sequenciado? fui eu / outra pessoa / ainda não
let resseqHist={};try{resseqHist=JSON.parse(localStorage.getItem(KEY+"_resseq_hist")||"{}")||{}}catch(e){}
function salvarResseqHist(){try{localStorage.setItem(KEY+"_resseq_hist",JSON.stringify(resseqHist))}catch(e){}}
function perguntaSeq(l){
  const f=document.createElement("div");f.className="modal-fundo obs-fundo";
  f.innerHTML=`<div class="modal obs-modal hl-modal"><div class="hl-tit">🗂️ Livro ${esc(l)}<small>· foi sequenciado?</small><button type="button" class="c hl-x" aria-label="Fechar">✕</button></div>
  <div class="seq-ops"><button type="button" data-q="eu">✔ Sim, fui eu que fiz</button><button type="button" data-q="outro">👥 Sim, mas não fui eu<small>outra pessoa fez (ex.: quem fez o prédio)</small></button><button type="button" data-q="nao" class="n">↩ Ainda não<small>o aviso continua nos próximos meses</small></button></div></div>`;
  document.body.appendChild(f);f.querySelector(".c").onclick=()=>f.remove();
  f.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{const q=b.dataset.q;if(q==="nao"){f.remove();return}
    let quem="eu";if(q==="outro"){const n=prompt("Quem fez? (opcional)","");if(n===null)return;quem=n.trim()||"outra pessoa"}
    resseqHist[l]={quem,quando:hoje(),pedido:(resseq[l]||{}).quando||""};salvarResseqHist();delete resseq[l];salvarResseq();f.remove();render()})}
function resseqDoMes(m,n){return Object.entries(resseq).filter(([l,v])=>v.quando.slice(0,7)<m&&(!n||v.etapa===n))}
const NAOFIZKEY=KEY+"_naofiz";let naoFiz={};try{naoFiz=JSON.parse(localStorage.getItem(NAOFIZKEY)||"{}")||{}}catch(e){}
let nfAberto="";
const HORASKEY=KEY+"_horas";let horas={};try{horas=JSON.parse(localStorage.getItem(HORASKEY)||"{}")||{}}catch(e){}
function salvarHoras(){try{localStorage.setItem(HORASKEY,JSON.stringify(horas))}catch(e){}}
function minDe(h){const[a,b]=h.split(":").map(Number);return a*60+b}
function duracao(v){if(v&&v.min&&v.ini&&v.fim)return v.min;if(!v||!v.ini||!v.fim)return 0;let d=minDe(v.fim)-minDe(v.ini);if(d<0)d+=1440;return d}
function fmtDur(d){return Math.floor(d/60)+"h"+String(d%60).padStart(2,"0")}
function leitEtapa(m,n){return registros.filter(r=>r.etapa===n&&r.data.startsWith(m)&&!r.releitura).reduce((t,r)=>t+r.qtd,0)}
function porHora(q,d){return d?Math.round(q/(d/60)):0}
// ⏱️ hora por livro
// ⏱️ cronômetros de livro: dá pra pausar um, começar outro e voltar. Guarda só as horas (não precisa deixar o app aberto)
let cronos=[];try{cronos=JSON.parse(localStorage.getItem(KEY+"_cronos")||"[]")||[]}catch(e){}
try{const old=localStorage.getItem(KEY+"_crono");if(old&&/^\d{1,2}:\d{2}$/.test(old)){const[h,m]=old.split(":").map(Number),d=new Date();d.setHours(h,m,0,0);if(d>Date.now())d.setDate(d.getDate()-1);cronos.push({id:Date.now(),livro:"",segs:[],run:d.getTime()});localStorage.removeItem(KEY+"_crono");localStorage.setItem(KEY+"_cronos",JSON.stringify(cronos))}}catch(e){}
function salvarCrono(){try{localStorage.setItem(KEY+"_cronos",JSON.stringify(cronos))}catch(e){}}
function hmDe(t){const d=new Date(t);return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}
function cronoMin(c){return Math.round((c.segs.reduce((t,s)=>t+s[1]-s[0],0)+(c.run?Date.now()-c.run:0))/60000)}
function cronoIni(c){return c.segs.length?c.segs[0][0]:c.run}
function pausarTodos(){const t=Date.now();cronos.forEach(c=>{if(c.run){c.segs.push([c.run,t]);c.run=0}})}
function cronoDoLivro(l){const cs=cronos.filter(c=>!c.recId);return cs.find(c=>c.livro&&c.livro===l)||cs.find(c=>c.run&&!c.livro)||cs.find(c=>c.run)||(cs.length===1?cs[0]:null)}
function cronoDoRec(id){return cronos.find(c=>c.recId===String(id))}
// ⏱️ cronômetro num livro que JÁ está lançado (ex.: veio da foto do PDA de manhã)
function iniciarCronoRec(id){const r=registros.find(x=>String(x.id)===String(id));if(!r||cronoDoRec(id))return;pausarTodos();
  cronos.push({id:Date.now(),livro:r.livro,recId:String(r.id),segs:[],run:Date.now()});salvarCrono();
  const hk=r.data.slice(0,7)+"|"+r.etapa;if(!horas[hk]||!horas[hk].ini){horas[hk]={...(horas[hk]||{}),ini:agoraHM()};salvarHoras()}render()}
function terminarCrono(x){const r=registros.find(y=>String(y.id)===x.recId);cronos=cronos.filter(y=>y!==x);salvarCrono();if(!r){render();return}
  r.ini=hmDe(cronoIni(x));r.fim=x.run?agoraHM():hmDe(x.segs[x.segs.length-1][1]);delete r.min;delete r.pausa;delete r.trechos;
  if(x.segs.length){r.min=Math.max(1,cronoMin(x));r.pausa=true;r.trechos=x.segs.concat(x.run?[[x.run,Date.now()]]:[]).map(([a,b])=>hmDe(a)+"–"+hmDe(b))}
  if(x.imp&&x.imp.length){r.nl=(r.nl||0)+x.imp.length;r.impLista=(r.impLista||[]).concat(x.imp)}
  const hk=r.data.slice(0,7)+"|"+r.etapa,hv=horas[hk]||{};horas[hk]={ini:hv.ini&&hv.ini<r.ini?hv.ini:r.ini,fim:hv.fim&&hv.fim>r.fim?hv.fim:r.fim};salvarHoras();
  localStorage.setItem(KEY,JSON.stringify(registros));render()}
// 📷 foto da tela do PDA com 002: a IA lê UC, medidor e endereço e soma +1 impedimento no livro
const IA_IMPED='Esta é uma foto da tela de leitura de um PDA de energia, de um cliente lançado com impedimento (código 002). Leia: UC (número depois de "UC:"), MD (medidor, depois de "MD:"), o endereço e TODOS os códigos de mensagem/ocorrência digitados (campos "MSG 1", "MSG 2"..., ex.: "002", "029"). Responda só JSON: {"uc":"000307981404503","md":"B18670249","end":"R JOAO ANTONIO FONSECA, 132, PQ SANTA MARIA","cod":"002","cods":["002"]}. Use null no que não conseguir ler.';
function impFoto(x){const inp=document.createElement("input");inp.type="file";inp.accept="image/*";
  inp.onchange=async()=>{const f=(inp.files||[])[0];if(!f)return;let j=null;
    if(iaChave){try{j=await iaLer(f,IA_IMPED)}catch(err){iaFalhou(err)}}
    const it={h:agoraHM()};if(j){if(j.uc)it.uc=String(j.uc);if(j.md)it.md=String(j.md);if(j.end)it.end=String(j.end).toUpperCase()}
    // ⚠️ código 029 (vestígio de procedimento irregular): separa na lista do 029; só conta impedimento se também tiver 002
    const cods=[].concat(j&&Array.isArray(j.cods)?j.cods:[],j&&j.cod?[j.cod]:[]).map(c=>String(c).replace(/\D/g,"").padStart(3,"0"));
    if(cods.includes("029")){await addIrr(f,j,x);if(!cods.includes("002"))return}
    if(j&&j.cod&&!/002/.test(String(j.cod))&&!cods.includes("002")&&!confirm("A foto parece ter o código "+j.cod+" (não 002).\nContar como impedimento mesmo assim?"))return;
    (x.imp=x.imp||[]).push(it);salvarCrono();desenharCrono()};
  inp.click()}
// ⚠️ lista do código 029 (vestígio de procedimento irregular) pra lançar na outra planilha
let irr=[];try{irr=JSON.parse(localStorage.getItem(KEY+"_irr")||"[]")||[]}catch(e){}
function salvarIrr(){try{localStorage.setItem(KEY+"_irr",JSON.stringify(irr))}catch(e){}desenharIrrFaixa()}
function desenharIrrFaixa(){const c=$("cronoLivro");if(!c)return;let d=$("irrFaixa");if(!d){d=document.createElement("button");d.type="button";d.id="irrFaixa";d.className="imp-aviso irr-aviso";d.onclick=abrirIrr;c.insertAdjacentElement("afterend",d)}
  d.hidden=!irr.length;d.innerHTML="⚠️ Código 029 pra lançar na planilha<small>vestígio de procedimento irregular · toque pra ver</small>"}
async function addIrr(f,j,x){const c=x||cronos.find(y=>y.run)||cronos[0];
  const it={id:Date.now(),data:hoje(),h:agoraHM(),livro:c&&c.livro||"",etapa,cod:"029",uc:j&&j.uc?String(j.uc):"",md:j&&j.md?String(j.md).toUpperCase():"",end:j&&j.end?String(j.end).toUpperCase():""};
  try{await gPut("irr"+it.id,await fotoMini(f,1100,.72));it.foto=true}catch(e){}
  irr.push(it);salvarIrr();toast("⚠️ Código 029 separado"+(it.end?" · "+it.end.split(",").slice(0,2).join(","):"")+(it.livro?" · livro "+it.livro:""))}
function txtIrr(g){return [fmt(g.data).slice(0,5)+" "+(g.h||""),g.livro?"Livro "+g.livro:"",g.uc?"UC "+g.uc:"",g.md?"MD "+g.md:"",g.end||"","029"].filter(Boolean).join(" · ")}
function copiarTxt(t){try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(()=>toast("📋 Copiado"),()=>prompt("Copie:",t));return}}catch(e){}prompt("Copie:",t)}
function abrirIrr(){let f=$("irrFundo");if(!f){f=document.createElement("div");f.id="irrFundo";f.className="modal-fundo obs-fundo";document.body.appendChild(f)}
  f.innerHTML=`<div class="modal obs-modal hl-modal gd-modal"><div class="hl-tit">⚠️ Código 029<small></small><button type="button" class="hl-x" data-i="x" aria-label="Fechar">✕</button></div>
   <div class="hint">Vestígio de procedimento irregular. O app separa sozinho quando a foto do PDA (📷 Foto do cronômetro) tem o código 029. Lance na sua planilha e toque em ✔ Lancei.</div>
   <div class="gd-nova"><button type="button" data-i="foto" class="gd-foto">📷 Foto</button>${irr.length>1?'<button type="button" data-i="todos" class="gd-foto">📋 Copiar todos</button>':""}</div>
   <div class="gd-lst">${irr.map(g=>`<div class="gd-item">${g.foto?`<img alt="foto" data-ver="${g.id}">`:""}<div class="gd-cp irr-cp"><b>${esc(g.end||"sem endereço")}</b><small>${esc([g.livro?"Livro "+g.livro:"",g.md?"MD "+g.md:"",g.uc?"UC "+g.uc:""].filter(Boolean).join(" · "))}</small><small>${fmt(g.data).slice(0,5)} ${g.h||""} · 029</small></div><div class="gd-bt"><button type="button" data-i="ok" data-id="${g.id}">✔ Lancei</button><div class="gd-bt2"><button type="button" data-i="cp" data-id="${g.id}" aria-label="Copiar">📋</button><button type="button" data-i="del" data-id="${g.id}" aria-label="Apagar">🗑️</button></div></div></div>`).join("")||'<div class="hint" style="margin-top:8px">Nada separado. 👍</div>'}</div></div>`;
  f.querySelectorAll("img[data-ver]").forEach(async im=>{const d=await gGet("irr"+im.dataset.ver);if(d)im.src=d;im.onclick=()=>{if(d){const v=document.createElement("div");v.className="modal-fundo obs-fundo gd-zoom";v.innerHTML=`<img src="${d}" alt="foto">`;v.onclick=()=>v.remove();document.body.appendChild(v)}}});
  f.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{const q=b.dataset.i,g=irr.find(x=>String(x.id)===b.dataset.id);
    if(q==="x"){f.remove();return}
    if(q==="todos")return copiarTxt(irr.map(txtIrr).join("\n"));
    if(q==="foto"){const inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.onchange=async()=>{const fl=(inp.files||[])[0];if(!fl)return;b.disabled=true;b.textContent="🤖 Lendo...";let j=null;if(iaChave){try{j=await iaLer(fl,IA_IMPED)}catch(err){iaFalhou(err)}}
      const cs=[].concat(j&&Array.isArray(j.cods)?j.cods:[],j&&j.cod?[j.cod]:[]).map(c=>String(c).replace(/\D/g,"").padStart(3,"0"));if(!cs.includes("029")&&!confirm("Não achei o código 029 nesta foto.\nGuardar na lista do 029 mesmo assim?")){abrirIrr();return}
      await addIrr(fl,j,null);abrirIrr()};inp.click();return}
    if(!g)return;
    if(q==="cp")return copiarTxt(txtIrr(g));
    if(q==="ok"&&!confirm("Já lançou na planilha"+(g.end?" ("+g.end.split(",")[0]+")":"")+"?\nSai da lista e a foto é apagada."))return;
    if(q==="del"&&!confirm("Apagar este 029?"))return;
    irr=irr.filter(x=>x!==g);gDel("irr"+g.id);salvarIrr();abrirIrr()})}
// 🚫 editar os impedimentos do livro que está contando (lançou um a mais? tira aqui)
// ---------- 📸 Leituras guardadas: tira a foto agora (de qualquer etapa) e lança no PDA depois ----------
let guard=[];try{guard=JSON.parse(localStorage.getItem(KEY+"_guard")||"[]")||[]}catch(e){}
function salvarGuard(){try{localStorage.setItem(KEY+"_guard",JSON.stringify(guard))}catch(e){}desenharGuardDot()}
function desenharGuardDot(){const d=$("guardDot");if(d)d.hidden=!guard.length}
let _gdb=null;function gdb(){return _gdb||(_gdb=new Promise((ok,er)=>{const q=indexedDB.open(KEY+"_fotos",1);q.onupgradeneeded=()=>q.result.createObjectStore("f");q.onsuccess=()=>ok(q.result);q.onerror=()=>er(q.error)}))}
async function gPut(k,v){const d=await gdb();return new Promise((ok,er)=>{const t=d.transaction("f","readwrite");t.objectStore("f").put(v,k);t.oncomplete=ok;t.onerror=()=>er(t.error)})}
async function gGet(k){const d=await gdb();return new Promise(ok=>{const q=d.transaction("f").objectStore("f").get(k);q.onsuccess=()=>ok(q.result);q.onerror=()=>ok(null)})}
async function gDel(k){try{const d=await gdb();d.transaction("f","readwrite").objectStore("f").delete(k)}catch(e){}}
// ✂️ recorta do print do WhatsApp só a foto do medidor (caixa 0-1000 que a IA devolve)
function recortarFoto(file,cx,M,qual){return new Promise((ok,er)=>{const im=new Image();im.onload=()=>{
  let[y0,x0,y1,x1]=cx.map(Number);const W=im.width,H=im.height,pad=10;x0=Math.max(0,(x0-pad)/1000*W);y0=Math.max(0,(y0-pad)/1000*H);x1=Math.min(W,(x1+pad)/1000*W);y1=Math.min(H,(y1+pad)/1000*H);
  const w=x1-x0,h=y1-y0,k=Math.min(1,M/Math.max(w,h)),c=document.createElement("canvas");c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext("2d").drawImage(im,x0,y0,w,h,0,0,c.width,c.height);URL.revokeObjectURL(im.src);ok(c.toDataURL("image/jpeg",qual))};im.onerror=er;im.src=URL.createObjectURL(file)})}
function caixaOk(cx){if(!Array.isArray(cx)||cx.length!==4||cx.some(v=>!isFinite(+v)))return false;const[y0,x0,y1,x1]=cx.map(Number),a=(y1-y0)*(x1-x0);return y1>y0&&x1>x0&&a>=15000&&a<=900000}
// 🖼️ foto com uma faixa em cima com o endereço (pra compartilhar)
function fotoComFaixa(d,linhas){return new Promise(ok=>{const im=new Image();im.onload=()=>{const fs=Math.max(18,Math.round(im.width/24)),lh=Math.round(fs*1.35),fh=lh*linhas.length+Math.round(fs*.8),c=document.createElement("canvas");c.width=im.width;c.height=im.height+fh;
  const g=c.getContext("2d");g.fillStyle="#ffffff";g.fillRect(0,0,c.width,fh);g.drawImage(im,0,fh);g.fillStyle="#111827";g.textBaseline="top";
  linhas.forEach((t,i)=>{g.font=(i?"600 ":"800 ")+Math.round(i?fs*.85:fs)+"px -apple-system,Segoe UI,Roboto,sans-serif";let x=t;while(g.measureText(x).width>c.width-fs&&x.length>4)x=x.slice(0,-2);if(x!==t)x+="…";g.fillText(x,Math.round(fs/2),Math.round(fs*.4)+i*lh)});
  ok(c.toDataURL("image/jpeg",.85))};im.onerror=()=>ok(d);im.src=d})}
function fotoMini(file,M,qual){return new Promise((ok,er)=>{const im=new Image();im.onload=()=>{const k=Math.min(1,M/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(im.src);ok(c.toDataURL("image/jpeg",qual))};im.onerror=er;im.src=URL.createObjectURL(file)})}
const IA_GUARDA='Imagem de um agente de leitura de energia. Pode ser: (1) foto do medidor, (2) tela do PDA, ou (3) PRINT DE CONVERSA DO WHATSAPP em que o cliente mandou a foto do medidor. Leia o NÚMERO DO MEDIDOR (série; os prefixos usados são M, B, 3T, 3G, AR, BG, AG, ex.: "B18670249", "B10969040"; costuma estar no código de barras; não é o número da casa nem o número pequeno de fabricação), a LEITURA do visor kWh (só dígitos, da esquerda pra direita; se um rolete estiver virando, use o número menor) e, se aparecer, o endereço, a UC e a etapa. NO PRINT DO WHATSAPP: o NOME DO CONTATO lá em cima é o endereço que o agente salvou (ex.: "Simeao Sobral 32 Eta 13" = endereço "RUA SIMEAO SOBRAL, 32" e etapa 13; "Eta" ou "Et" = etapa; se o nome estiver cortado, use só o que aparece); IGNORE os textos das mensagens, horários e o resto da conversa; leia medidor e leitura da FOTO do medidor que está na conversa. Se for print do WhatsApp, diga também onde está a FOTO do medidor dentro do print: "caixa":[ymin,xmin,ymax,xmax] de 0 a 1000 (só a foto, sem as mensagens). Diga também o tipo da imagem: "whatsapp" (print de conversa), "pda" (tela do PDA) ou "medidor" (foto do medidor tirada na hora). Responda só JSON: {"tipo":"whatsapp","caixa":[450,40,980,700],"medidor":"B18670249","leitura":"13030","end":"RUA ..., 32","uc":"...","etapa":13}. Use null no que não conseguir ler.';
let guardEt=0;
// 🗺️ qual livro/etapa é esta rua: procura nas ruas dos livros já feitos (endereço da Caixa de Entrada + ruas salvas no Mapa)
const RUA_ABR={cel:"coronel",dr:"doutor",dra:"doutora",prof:"professor",profa:"professora",sta:"santa",sto:"santo",s:"sao",n:"nossa",sra:"senhora",cap:"capitao",gal:"general",gen:"general",ver:"vereador",pe:"padre",eng:"engenheiro",mal:"marechal",pres:"presidente",dep:"deputado",ten:"tenente",sgt:"sargento",com:"comendador",cons:"conselheiro",gov:"governador",maj:"major",brig:"brigadeiro",jd:"jardim",vl:"vila"};
const RUA_TIPO=new Set(["r","rua","av","avenida","al","alameda","tv","trav","travessa","pc","pca","praca","estr","estrada","rod","rodovia","viela","lg","largo"]);
function ruaBase(x){let w=normLoc(String(x||"").replace(/,.*$/,"")).replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(Boolean);
  while(w.length>1&&RUA_TIPO.has(w[0]))w.shift();if(w.length>2&&/^\d+$/.test(w[w.length-1]))w.pop();
  return w.map(t=>RUA_ABR[t]||t).filter(t=>!["de","da","do","dos","das","e"].includes(t)).join(" ")}
function livrosDaRua(end){const k=ruaBase(end);if(k.replace(/\s/g,"").length<4)return[];const m=new Map();
  const add=(l,x)=>{if(!l||m.has(l))return;const r=ruaBase(x);if(r&&(r===k||parecido(r,k)>=0.88))m.set(l,1)};
  registros.forEach(g=>{if(!g.releitura&&g.pda&&g.pda.end)add(g.livro,g.pda.end)});Object.entries(rotas).forEach(([l,r])=>(r&&r.ruas||[]).forEach(x=>add(l,x)));
  return [...m.keys()].map(l=>({livro:l,etapa:etapaDoLivroConhecido(l)})).filter(x=>x.etapa>=1&&x.etapa<=18)}
// põe a etapa certa sozinho pela rua (se a etapa não veio escrita no nome do contato)
function etapaPelaRua(it){if(!it.end||it.etFonte==="ia")return;const c=livrosDaRua(it.end);if(!c.length)return;
  const ets=[...new Set(c.map(x=>x.etapa))];
  if(ets.length===1){it.etapa=ets[0];it.livro=c.map(x=>x.livro).join(", ");it.etFonte="rua";toast("📍 "+it.end.replace(/,.*$/,"")+" é do livro "+it.livro+" · Etapa "+p2(ets[0]));return}
  const v=prompt("📍 Essa rua aparece em mais de uma etapa:\n\n"+ets.map(e=>"Etapa "+p2(e)+" · livro "+c.filter(x=>x.etapa===e).map(x=>x.livro).join(", ")).join("\n")+"\n\nQual a etapa desta leitura?",String(ets[0]));
  const n=parseInt(v,10);if(n>=1&&n<=18){it.etapa=n;it.livro=c.filter(x=>x.etapa===n).map(x=>x.livro).join(", ");it.etFonte="rua"}}
// 📍 pega onde o agente está e acha o nome da rua (OpenStreetMap)
function endAqui(){return new Promise((ok,no)=>{if(!navigator.geolocation)return no(new Error("sem GPS"));
  navigator.geolocation.getCurrentPosition(async p=>{const lat=p.coords.latitude,lon=p.coords.longitude;let end="";
    try{const r=await fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=pt-BR&lat="+lat+"&lon="+lon),j=await r.json(),a=(j&&j.address)||{};
      const rua=a.road||a.pedestrian||a.residential||a.footway||"";if(rua)end=(rua+", "+(a.house_number||"")).toUpperCase().replace(/\s+/g," ").trim()}catch(e){}
    ok({end,lat:+lat.toFixed(6),lon:+lon.toFixed(6)})},e=>no(e),{enableHighAccuracy:true,timeout:15000,maximumAge:30000})})}
async function pedirEndGuard(it,msg){
  // print do WhatsApp ou foto antiga: o cliente pode estar em qualquer lugar, então não usa a localização
  if(it.wpp||it.semGps){const v=prompt(msg,it.end||"");if(v===null)return false;it.end=v.trim().toUpperCase().replace(/\s+/g," ");return true}
  toast("📍 Pegando onde você está...");let a=null;try{a=await endAqui()}catch(e){}
  const v=prompt(msg+(a&&a.end?"\n\n📍 Achei pela sua localização. Confira e coloque o número da casa.":a?"\n\n📍 Peguei a sua localização, mas não achei o nome da rua.":"\n\n(Não consegui pegar a localização.)"),a&&a.end?a.end:(it.end||""));
  const d=$("toastMsg");if(d)d.hidden=true;
  if(v===null)return false;it.end=v.trim().toUpperCase().replace(/\s+/g," ").replace(/,\s*$/,"");if(a){it.lat=a.lat;it.lon=a.lon}return true}
function abrirGuard(){let f=$("guardFundo");if(!f){f=document.createElement("div");f.id="guardFundo";f.className="modal-fundo obs-fundo";document.body.appendChild(f)}
  if(!guardEt)guardEt=etapa;
  const ets=[...new Set(guard.map(g=>g.etapa))].sort((a,b)=>a-b);
  f.innerHTML=`<div class="modal obs-modal hl-modal gd-modal"><div class="hl-tit">🎞️ Leituras arquivadas<small></small><button type="button" class="hl-x" data-g="x" aria-label="Fechar">✕</button></div>
   <div class="hint">Passou por uma leitura de outra etapa? Tire a foto, escolha o print do WhatsApp do cliente ou digite. Fica arquivada até você lançar no PDA.</div>
   <div class="gd-nova"><label>Etapa<select id="gdEt">${Array.from({length:18},(_,i)=>`<option value="${i+1}"${i+1===guardEt?" selected":""}>${p2(i+1)}</option>`).join("")}</select></label><button type="button" data-g="foto" data-gal="1" class="gd-foto">📷 Foto</button><button type="button" data-g="dig" class="gd-foto">✏️ Digitar</button></div>
   <div class="gd-lst">${ets.length?ets.map(e=>`<div class="gd-et">Etapa ${p2(e)}${e===etapa?" · <b>é a de agora</b>":""}</div>`+guard.filter(g=>g.etapa===e).map(g=>`<div class="gd-item" data-id="${g.id}">${g.semFoto?"":`<img alt="foto" data-ver="${g.id}">`}<div class="gd-cp"><input data-k="med" data-id="${g.id}" value="${esc(g.med||"")}" placeholder="Medidor" autocomplete="off"><div class="gd-l"><input class="gd-reg" data-k="reg" data-id="${g.id}" value="${esc(g.reg||"")}" placeholder="Registro" autocomplete="off"><input data-k="leit" data-id="${g.id}" value="${esc(g.leit||"")}" placeholder="Leitura" inputmode="numeric" autocomplete="off"></div>${(g.extra||[]).map((x,k)=>`<div class="gd-l"><input class="gd-reg" data-x="${k}" data-xk="reg" data-id="${g.id}" value="${esc(x.reg||"")}" placeholder="Registro" autocomplete="off"><input data-x="${k}" data-xk="leit" data-id="${g.id}" value="${esc(x.leit||"")}" placeholder="Leitura" inputmode="numeric" autocomplete="off"><button type="button" class="gd-xt" data-g="xtira" data-k="${k}" data-id="${g.id}" aria-label="Tirar esta leitura">✕</button></div>`).join("")}<button type="button" class="gd-mais" data-g="mais" data-id="${g.id}">➕ Leitura</button><small class="gd-rod"><span>${fmt(g.quando).slice(0,5)} ${g.h||""}</span><u class="gd-end" data-g="end" data-id="${g.id}">${g.end?"📍 "+esc(g.end)+(g.livro?" · livro "+esc(g.livro):""):"📍 endereço"}</u></small></div><div class="gd-bt"><button type="button" data-g="ok" data-id="${g.id}" title="Já lancei no PDA">✔ Lancei</button><div class="gd-bt2"><button type="button" data-g="share" data-id="${g.id}" aria-label="Compartilhar">📤</button><button type="button" data-g="del" data-id="${g.id}" aria-label="Apagar">🗑️</button></div></div></div>`).join("")).join(""):'<div class="hint" style="margin-top:8px">Nenhuma leitura arquivada.</div>'}</div></div>`;
  $("gdEt").onchange=e=>guardEt=+e.target.value;
  f.querySelectorAll("img[data-ver]").forEach(async im=>{const d=await gGet(im.dataset.ver);if(d)im.src=d;im.onclick=()=>{if(d){const gg=guard.find(x=>String(x.id)===im.dataset.ver)||{},v=document.createElement("div");v.className="modal-fundo obs-fundo gd-zoom";v.innerHTML=(gg.end?`<div class="gd-zcap">📍 ${esc(gg.end)} · Et. ${p2(gg.etapa)}</div>`:"")+`<img src="${d}" alt="foto">`;v.onclick=()=>v.remove();document.body.appendChild(v)}}});
  f.querySelectorAll("input[data-k]").forEach(i=>i.onchange=()=>{const g=guard.find(x=>String(x.id)===i.dataset.id);if(g){g[i.dataset.k]=i.dataset.k==="leit"?i.value.trim():i.value.trim().toUpperCase();salvarGuard()}});
  f.querySelectorAll("input[data-x]").forEach(i=>i.onchange=()=>{const g=guard.find(x=>String(x.id)===i.dataset.id);if(g&&g.extra&&g.extra[+i.dataset.x]){g.extra[+i.dataset.x][i.dataset.xk]=i.dataset.xk==="leit"?i.value.trim():i.value.trim().toUpperCase();salvarGuard()}});
  f.querySelectorAll("[data-g]").forEach(b=>b.onclick=async()=>{const q=b.dataset.g,g=guard.find(x=>String(x.id)===b.dataset.id);
    if(q==="x"){f.remove();render();return}
    if(q==="foto"){const inp=document.createElement("input");inp.type="file";inp.accept="image/*";if(!b.dataset.gal)inp.setAttribute("capture","environment");
      inp.onchange=async()=>{const file=(inp.files||[])[0];if(!file)return;b.disabled=true;b.textContent="⏳ Guardando...";
        const it={id:Date.now(),etapa:guardEt||etapa,quando:hoje(),h:agoraHM(),med:"",leit:""};
        try{await gPut(String(it.id),await fotoMini(file,1100,.72))}catch(e){alert("Não consegui guardar a foto neste celular.");b.disabled=false;b.textContent="📷 Foto";return}
        if(iaChave){b.textContent="🤖 Lendo...";try{const j=await iaLer(file,IA_GUARDA);if(j){if(j.medidor)it.med=String(j.medidor).toUpperCase().replace(/[^A-Z0-9]/g,"");if(j.leitura!=null)it.leit=String(j.leitura).replace(/\D/g,"");if(j.end)it.end=String(j.end).toUpperCase().replace(/\s+/g," ").trim();if(j.uc)it.uc=String(j.uc);const je=parseInt(j.etapa,10);if(je>=1&&je<=18){it.etapa=je;it.etFonte="ia"}if(/whats/i.test(String(j.tipo||""))){it.wpp=true;if(caixaOk(j.caixa)){try{await gPut(String(it.id),await recortarFoto(file,j.caixa,1100,.75));it.recorte=true}catch(e){}}}}}catch(err){iaFalhou(err)}}
        const naHora=!it.wpp&&file.lastModified&&Date.now()-file.lastModified<5*60*1000;if(!naHora)it.semGps=true;
        if(!it.end)await pedirEndGuard(it,"📍 Não achei o endereço"+(it.wpp?" no print":"")+".\nRua e número pra você lembrar depois (pode deixar em branco):");
        etapaPelaRua(it);guard.push(it);salvarGuard();abrirGuard()};
      inp.click();return}
    if(q==="dig"){const it={id:Date.now(),etapa:guardEt||etapa,quando:hoje(),h:agoraHM(),med:"",leit:"",semFoto:true,end:""};if(!await pedirEndGuard(it,"📍 Endereço da leitura (rua e número):\nPode deixar em branco."))return;etapaPelaRua(it);guard.push(it);salvarGuard();abrirGuard();setTimeout(()=>{const i=document.querySelector(`#guardFundo input[data-k="med"][data-id="${it.id}"]`);if(i)i.focus()},80);return}
    if(!g)return;
    if(q==="share"){const ls=[[g.reg,g.leit]].concat((g.extra||[]).map(x=>[x.reg,x.leit])).filter(x=>x[1]);
      const txt="🎞️ Leitura arquivada · Etapa "+p2(g.etapa)+(g.end?"\n📍 "+g.end:"")+(g.med?"\n🔢 Medidor: "+g.med:"")+(ls.length?"\n"+ls.map(x=>"🧾 "+(x[0]?x[0]+": ":"Leitura: ")+x[1]).join("\n"):"")+"\n📅 "+fmt(g.quando).slice(0,5)+(g.h?" "+g.h:"")+(g.lat?"\n🗺️ https://maps.google.com/?q="+g.lat+","+g.lon:"");
      let fl=null;if(!g.semFoto){try{const d=await gGet(String(g.id));if(d){const lin=[(g.end||"Leitura arquivada")+" · Et. "+p2(g.etapa),[g.med?"Medidor "+g.med:"",ls.length?"Leitura "+ls.map(x=>x[1]).join(" / "):""].filter(Boolean).join(" · ")].filter(Boolean);
        fl=new File([dataURLparaBlob(await fotoComFaixa(d,lin))],"leitura-"+(g.med||g.id)+".jpg",{type:"image/jpeg"})}}catch(e){}}
      try{if(fl&&navigator.canShare&&navigator.canShare({files:[fl]})){await navigator.share({files:[fl],text:txt});return}if(navigator.share){await navigator.share({text:txt});return}}catch(e){if(e&&e.name==="AbortError")return}
      location.href="https://wa.me/?text="+encodeURIComponent(txt);return}
    if(q==="end"){if(!g.end){if(await pedirEndGuard(g,"📍 Endereço desta leitura (rua e número):")){etapaPelaRua(g);salvarGuard();abrirGuard()}return}
      const v=prompt("📍 Endereço desta leitura (rua e número):"+(g.wpp||g.semGps?"":"\n\nApague tudo e toque OK pra pegar pela sua localização."),g.end);if(v===null)return;
      if(!v.trim()&&!g.wpp&&!g.semGps){if(await pedirEndGuard(g,"📍 Endereço desta leitura (rua e número):")){etapaPelaRua(g);salvarGuard();abrirGuard()}return}
      g.end=v.trim().toUpperCase().replace(/\s+/g," ");etapaPelaRua(g);salvarGuard();abrirGuard();return}
    if(q==="mais"){(g.extra=g.extra||[]).push({reg:"",leit:""});salvarGuard();abrirGuard();return}
    if(q==="xtira"){(g.extra||[]).splice(+b.dataset.k,1);salvarGuard();abrirGuard();return}
    if(q==="ok"&&!confirm("Já lançou no PDA a leitura"+(g.med?" do medidor "+g.med:"")+"?\nA foto sai da lista."))return;
    if(q==="del"&&!confirm("Apagar esta foto arquivada?"))return;
    guard=guard.filter(x=>x!==g);gDel(String(g.id));salvarGuard();abrirGuard()});
}
function toast(t){let d=$("toastMsg");if(!d){d=document.createElement("div");d.id="toastMsg";d.className="toast-msg";document.body.appendChild(d)}d.textContent=t;d.hidden=false;clearTimeout(d._t);d._t=setTimeout(()=>d.hidden=true,4500);d.onclick=()=>d.hidden=true}
function editarImp(x){const f=document.createElement("div");f.className="modal-fundo obs-fundo";
  const des=()=>{const l=x.imp||[];f.innerHTML=`<div class="modal obs-modal hl-modal"><div class="hl-tit">🚫 Impedimentos${x.livro?" · livro "+esc(x.livro):""}<small></small><button type="button" class="hl-x" data-q="x" aria-label="Fechar">✕</button></div>
    <div class="imp-ed"><button type="button" data-q="menos" aria-label="Tirar um">➖</button><b>${l.length}</b><button type="button" data-q="mais" aria-label="Pôr mais um">➕</button></div>
    <div class="imp-lst">${l.map((i,k)=>`<div>${FLAGX} ${i.h}${i.md?" · MD "+esc(i.md):""}${i.end?"<br><small>"+esc(i.end)+"</small>":""}<button type="button" data-tira="${k}" aria-label="Tirar este">🗑️</button></div>`).join("")||'<div class="hint">Nenhum impedimento neste livro.</div>'}</div>
    <div class="hl-bts"><button type="button" class="o" data-q="x">✔ Pronto</button></div></div>`;
    f.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{const q=b.dataset.q;if(q==="x"){f.remove();salvarCrono();desenharCrono();return}
      if(q==="menos")(x.imp||[]).pop();if(q==="mais")(x.imp=x.imp||[]).push({h:agoraHM()});salvarCrono();des()});
    f.querySelectorAll("[data-tira]").forEach(b=>b.onclick=()=>{(x.imp||[]).splice(+b.dataset.tira,1);salvarCrono();des()})};
  document.body.appendChild(f);des()}
const FLAGX='<span class="flag-x">🚩</span>';
function livroDigitado(){const i=document.querySelector("#livroRows .r-livro");return i?i.value.trim():""}
function agoraHM(){const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}
function baseLivros(){let q=0,d=0,n=0,melhor=0;registros.forEach(r=>{const du=duracao(r);if(!du||r.releitura||!r.qtd)return;q+=r.qtd;d+=du;n++;melhor=Math.max(melhor,porHora(r.qtd,du))});return{media:porHora(q,d),n,melhor}}
function tagHoraLivro(r){const cr=cronoDoRec(r.id);
  if(cr)return ` <span class="hr-tag hr-run${cr.run?"":" p"}" onclick="horaLivro('${r.id}')">${cr.run?"⏱️ contando":"⏸️ pausado"} · desde ${hmDe(cronoIni(cr))} · ${fmtDur(cronoMin(cr))}${(cr.imp||[]).length?" · 🚫 "+cr.imp.length:""}</span>`;
  if(!r.ini&&!r.fim)return"";const du=duracao(r),ph=porHora(r.qtd,du),b=baseLivros();
  let t=`⏱️ ${r.ini||"--:--"} → ${r.fim||"--:--"}`;if(du)t+=` · ${fmtDur(du)}${r.pausa?" ⏸":""}`;if(ph)t+=` · ⚡ <b>${ph}</b>/h`;
  if(ph&&b.n>1&&b.media)t+=ph>b.media?' <span style="color:#15803d">▲</span>':ph<b.media?' <span style="color:#b45309">▼</span>':"";
  const ant=somaMes(r.data.slice(0,7),-1),pa=ph&&registros.find(x=>x.livro===r.livro&&!x.releitura&&x.data.startsWith(ant)&&duracao(x));
  let cmp="";if(pa){const pp=porHora(pa.qtd,duracao(pa));cmp=`<br><span class="hr-cmp">📅 ${nomeMes(ant).slice(0,1).toUpperCase()+nomeMes(ant).slice(1,3)}: ${pp}/h em ${fmtDur(duracao(pa))} · ${ph>pp?'<b style="color:#15803d">▲ mais rápido</b>':ph<pp?'<b style="color:#b45309">▼ mais devagar</b>':"= igual"}</span>`}
  if(r.pausa&&r.trechos&&r.trechos.length)t+=`<br><small class="hr-tr">⏸ ${r.trechos.join(" · ")}</small>`;
  return ` <span class="hr-tag" onclick="horaLivro('${r.id}')">${t}</span>${cmp}`}
// ⏱️ um lugar só pro tempo: só um livro conta de cada vez; trocar de livro pausa o outro sozinho
// 🔄 lista dos livros da etapa: toca no livro e o tempo dele começa (ou continua); o que estava contando pausa sozinho
function ruaDoLivro(l,end){const e=String(end||"")||(()=>{const r=registros.find(x=>x.livro===l&&x.pda&&x.pda.end);return r?r.pda.end:""})()||((rotas[l]&&rotas[l].ruas||[]).find(Boolean)||"");return e.split(",")[0].trim()}
function escolherLivroCrono(){const m=($("data").value||hoje()).slice(0,7),rs=registros.filter(r=>r.etapa===etapa&&r.data.startsWith(m)&&!r.releitura).sort((a,b)=>String(a.livro).localeCompare(String(b.livro)));
  const fila=(typeof pdaFila!=="undefined"?pdaFila:[]).filter(x=>x.etapa===etapa&&!rs.some(r=>r.livro===x.livro));
  const soltos=cronos.filter(x=>!x.recId&&x.livro&&!rs.some(r=>r.livro===x.livro)&&!fila.some(f=>f.livro===x.livro));
  const est=(cr,r)=>cr?(cr.run?"🟢 contando · "+fmtDur(cronoMin(cr)):"⏸️ parado · "+fmtDur(cronoMin(cr))):r&&duracao(r)?"✔ "+fmtDur(duracao(r)):"";
  const f=document.createElement("div");f.className="modal-fundo obs-fundo";
  f.innerHTML=`<div class="modal obs-modal hl-modal"><div class="hl-tit">🔄 Qual livro agora?<small>Etapa ${p2(etapa)}</small><button type="button" class="hl-x" data-q="x" aria-label="Fechar">✕</button></div>
   <div class="hint">O que estiver contando para sozinho.</div><div class="cr2-lst">
   ${rs.map(r=>{const cr=cronoDoRec(r.id)||cronos.find(x=>!x.recId&&x.livro===r.livro);const ru=ruaDoLivro(r.livro,r.pda&&r.pda.end);return `<button type="button" data-r="${r.id}"${cr&&cr.run?" disabled":""}><b>${esc(r.livro)}</b><span>${r.qtd} leituras</span>${ru?`<em class="cr2-rua">${esc(ru)}</em>`:""}<small>${est(cr,r)}</small></button>`}).join("")}
   ${fila.map(x=>{const cr=cronos.find(y=>!y.recId&&y.livro===x.livro);return `<button type="button" data-l="${esc(x.livro)}"${cr&&cr.run?" disabled":""}><b>${esc(x.livro)}</b><span>${x.qtd} · da foto</span>${ruaDoLivro(x.livro,x.end)?`<em class="cr2-rua">${esc(ruaDoLivro(x.livro,x.end))}</em>`:""}<small>${est(cr)}</small></button>`}).join("")}
   ${soltos.map(x=>`<button type="button" data-l="${esc(x.livro)}"${x.run?" disabled":""}><b>${esc(x.livro)}</b><span>ainda não lançado</span><small>${est(x)}</small></button>`).join("")}
   </div><div class="cr2-outro"><input id="cr2Num" inputmode="numeric" placeholder="Outro livro: digite o número" autocomplete="off"><button type="button" data-q="ok">▶</button></div></div>`;
  document.body.appendChild(f);
  const ir=(id,l)=>{f.remove();
    if(id){const r=registros.find(x=>String(x.id)===String(id));const cr=cronoDoRec(id)||cronos.find(x=>!x.recId&&x.livro===r.livro);
      if(cr){pausarTodos();cr.run=Date.now();if(!cr.recId)cr.recId=String(id);salvarCrono();render();return}
      if(r.ini&&r.fim&&typeof hr2Ini==="function")hr2Ini(id);else iniciarCronoRec(id);return}
    l=String(l||"").trim();if(!l)return;const cr=cronos.find(x=>x.livro===l);
    pausarTodos();if(cr)cr.run=Date.now();else cronos.push({id:Date.now(),livro:l,segs:[],run:Date.now()});salvarCrono();
    const hk=($("data").value||hoje()).slice(0,7)+"|"+etapa;if(!horas[hk]||!horas[hk].ini){horas[hk]={...(horas[hk]||{}),ini:agoraHM()};salvarHoras()}render()};
  f.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>ir(b.dataset.r));
  f.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>ir(null,b.dataset.l));
  f.querySelector('[data-q="x"]').onclick=()=>f.remove();
  f.querySelector('[data-q="ok"]').onclick=()=>ir(null,$("cr2Num").value);
}
function bt2(a,id,ic,nm,cls){return `<button type="button" class="cr2${cls?" "+cls:""}" data-cr="${a}" data-id="${id}"><span class="cr2-i">${ic}</span><span class="cr2-n">${nm}</span></button>`}
// 🚫 os impedimentos marcados no cronômetro aparecem também no campo Não lidos (só mostra; entram no livro quando aperta Terminei)
function atualizarImpCr(){const i=$("impQtd");if(!i)return;const x=cronos.find(c=>c.run)||cronos[0],n=x&&x.imp?x.imp.length:0;
  i.placeholder=n?String(n):"0";i.classList.toggle("do-cr",!!n);i.title=n?n+" não lido(s) marcado(s) no cronômetro"+(x.livro?" do livro "+x.livro:"")+". Já entram no livro quando apertar Terminei.":"";
  let t=$("impCr");if(!t){t=document.createElement("small");t.id="impCr";t.className="imp-cr";i.insertAdjacentElement("afterend",t)}t.textContent=n?"no ⏱️":"";t.hidden=!n}
function desenharCrono(){atualizarImpCr();desenharIrrFaixa();const c=$("cronoLivro");if(!c)return;
  const ativo=cronos.find(x=>x.run),fimDe=x=>x.segs.length?x.segs[x.segs.length-1][1]:0,parados=cronos.filter(x=>!x.run).sort((a,b)=>fimDe(b)-fimDe(a));
  const main=ativo||parados[0],outros=parados.filter(x=>x!==main);
  let h="";
  if(main){const on=!!main.run,ni=(main.imp||[]).length;
    h+=`<div class="cr2-card${on?" on":" off"}"><div class="cr2-top"><span class="cr2-st">${on?"🟢 CONTANDO":"⚪ PARADO"}</span><span class="cr2-l">${main.livro?"Livro <b>"+esc(main.livro)+"</b>":"Livro"}</span><span class="cr2-t">${fmtDur(cronoMin(main))}</span></div>
      <div class="cr2-sub">desde ${hmDe(cronoIni(main))}${main.recId?"":" · fecha no ✔"}</div>${txtMeta(main)}
      <div class="cr2-bts">${on?bt2("pausa",main.id,"❚❚","Pausar","pp"):bt2("volta",main.id,"▶","Continuar","go")}${bt2("trocar",main.id,"🔄","Trocar")}${main.recId?bt2("fim",main.id,"⏹","Terminei","fim"):""}${bt2("imp",main.id,FLAGX,"+1")}${bt2("impf",main.id,"📷","Foto")}${ni?bt2("impv",main.id,"🚫"+ni,"Imped.","iv"):""}${bt2("edit",main.id,"✏️","Editar")}${bt2("x",main.id,"✕","Sair")}</div></div>`;
    if(outros.length)h+=`<div class="cr2-par"><span>⏸️ parados:</span>${outros.map(x=>`<button type="button" class="cr2-chip" data-cr="volta" data-id="${x.id}">${x.livro?esc(x.livro):"livro"} · ${fmtDur(cronoMin(x))} ▶</button>`).join("")}</div>`;
  }else h=`<button type="button" class="crono" id="crIni">⏱️ Começar livro</button>`;
  c.innerHTML=h;
  const ci=$("crIni");if(ci)ci.onclick=()=>escolherLivroCrono();

  c.querySelectorAll("[data-cr]").forEach(b=>b.onclick=()=>{const x=cronos.find(y=>String(y.id)===b.dataset.id);if(!x)return;const a=b.dataset.cr;
    if(a==="imp"){(x.imp=x.imp||[]).push({h:agoraHM()})}
    else if(a==="impf"){impFoto(x);return}
    else if(a==="fim"){terminarCrono(x);return}
    else if(a==="impv"){editarImp(x);return}
    else if(a==="trocar"){escolherLivroCrono();return}
    else if(a==="pausa"){pausarTodos()}
    else if(a==="volta"){pausarTodos();x.run=Date.now()}
    else if(a==="x"){if(!confirm("Cancelar o cronômetro"+(x.livro?" do livro "+x.livro:"")+"?"))return;cronos=cronos.filter(y=>y!==x)}
    else if(a==="edit"){
      const v=prompt("Número do livro:",x.livro);if(v===null)return;x.livro=v.trim();
      if(!x.segs.length&&x.run){const h=prompt("Que horas começou? (ex.: 08:00)",hmDe(x.run));if(h&&/^\d{1,2}:\d{2}$/.test(h.trim())){const[hh,mm]=h.trim().split(":").map(Number),d=new Date();d.setHours(hh,mm,0,0);if(d>Date.now())d.setDate(d.getDate()-1);x.run=d.getTime()}}}
    salvarCrono();desenharCrono()})}
setInterval(()=>{if(!document.hidden&&cronos.some(x=>x.run))desenharCrono()},20000);
// voltou pro app (estava em outro app / tela apagada): atualiza o tempo na hora
["visibilitychange","focus","pageshow"].forEach(ev=>(ev==="visibilitychange"?document:window).addEventListener(ev,()=>{if(!document.hidden&&cronos.length){try{desenharCrono();render()}catch(e){}}}));
function horaLivro(id){const r=registros.find(x=>String(x.id)===String(id));if(!r)return;
  const f=document.createElement("div");f.className="modal-fundo obs-fundo";
  f.innerHTML=`<div class="modal obs-modal hl-modal"><div class="hl-tit">⏱️ Livro ${esc(r.livro)} <small>· ${r.qtd} leituras</small><button type="button" class="c hl-x" aria-label="Fechar">✕</button></div>
  ${r.pausa?`<div class="hint">⏸ Teve pausa: conta só <b>${fmtDur(r.min)}</b> trabalhados${r.trechos?" ("+r.trechos.join(" + ")+")":""}. Se mudar as horas, passa a contar pelo horário.</div>`:""}<div class="hl-lb">Começou</div><div class="hl-p"><span>▶</span><input type="time" class="hi" value="${r.ini||""}"><button type="button" class="ag" data-a="hi">Agora</button></div>
  <div class="hl-lb">Terminou</div><div class="hl-p"><span>⏹</span><input type="time" class="hf" value="${r.fim||""}"><button type="button" class="ag" data-a="hf">Agora</button></div>
  <div class="hl-bts">${r.ini||r.fim?'<button type="button" class="d" aria-label="Apagar horas">🗑️</button>':""}<button type="button" class="o">✔ Salvar</button></div></div>`;
  {const cr=cronoDoRec(r.id),box=document.createElement("div");box.className="hl-cr";
   if(cr){box.innerHTML=`<div class="hint">⏱️ Este livro está no cronômetro lá em cima (${cr.run?"contando":"parado"} · ${fmtDur(cronoMin(cr))}). Use os botões de lá.</div>`;f.querySelector(".hl-tit").after(box);f.querySelectorAll(".hl-lb,.hl-p,.hl-bts").forEach(e=>e.hidden=true);document.body.appendChild(f);f.querySelector(".c").onclick=()=>f.remove();return}
   box.innerHTML=cr?`<div class="hl-crt">${cr.run?"⏱️ Contando":"⏸️ Pausado"} desde ${hmDe(cronoIni(cr))} · <b>${fmtDur(cronoMin(cr))}</b></div><div class="hl-crb">${cr.run?'<button type="button" data-k="pausa">❚❚ Pausar</button>':'<button type="button" data-k="volta" class="v">▶ Continuar</button>'}<button type="button" data-k="fim" class="t">⏹ Terminei</button></div>`
     :`<div class="hint">Pra contar o tempo, use o ⏱️ lá em cima. Aqui é só pra corrigir as horas na mão:</div>`;
   const tit=f.querySelector(".hl-tit");tit.after(box);
   if(cr)f.querySelectorAll(".hl-lb,.hl-p,.hl-bts,.hint").forEach(e=>e.hidden=true);
   box.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=b.dataset.k;f.remove();
     if(k==="ini")return iniciarCronoRec(r.id);const c=cronoDoRec(r.id);if(!c)return;
     if(k==="pausa"){pausarTodos();salvarCrono();render()}else if(k==="volta"){pausarTodos();c.run=Date.now();salvarCrono();render()}else if(k==="fim")terminarCrono(c)})}
  document.body.appendChild(f);
  f.querySelectorAll(".ag").forEach(b=>b.onclick=()=>{f.querySelector("."+b.dataset.a).value=agoraHM()});
  const fim=()=>{f.remove();localStorage.setItem(KEY,JSON.stringify(registros));render()};
  f.querySelector(".c").onclick=()=>f.remove();
  const d=f.querySelector(".d");if(d)d.onclick=()=>{delete r.ini;delete r.fim;delete r.min;delete r.pausa;delete r.trechos;fim()};
  f.querySelector(".o").onclick=()=>{const a=f.querySelector(".hi").value,b=f.querySelector(".hf").value;if(a!==(r.ini||"")||b!==(r.fim||"")){delete r.min;delete r.pausa;delete r.trechos}if(a&&!b&&r.data===hoje()&&!cronoDoRec(r.id)){const[hh,mm]=a.split(":").map(Number),d=new Date();d.setHours(hh,mm,0,0);if(d>Date.now()+3*36e5)d.setDate(d.getDate()-1);else if(d>Date.now())d.setTime(Date.now());
    // só o começo, hoje: vira o cronômetro lá em cima, contando desde essa hora
    pausarTodos();cronos.push({id:Date.now(),livro:r.livro,recId:String(r.id),segs:[],run:d.getTime()});salvarCrono();delete r.ini;delete r.fim;f.remove();localStorage.setItem(KEY,JSON.stringify(registros));render();window.scrollTo({top:0,behavior:"smooth"});toast("⏱️ Livro "+r.livro+" contando desde "+a);return}
  if(a)r.ini=a;else delete r.ini;if(b)r.fim=b;else delete r.fim;fim()}}
// 📅 quanto trabalhou no dia: soma o tempo dos livros com ⏱️ (pausa não conta)
function diaTrab(){const d=$("data").value||hoje(),rs=registros.filter(r=>r.data===d&&!r.releitura),t=rs.filter(r=>duracao(r));if(!t.length)return "";
  const min=minutosUniao(t)||t.reduce((a,r)=>a+duracao(r),0),q=t.reduce((a,r)=>a+r.qtd,0),sem=rs.some(r=>!duracao(r));
  return `<div class="hr-res hr-dia" onclick="verDiaTrab()">📅 ${d===hoje()?"Hoje":d.slice(8)+"/"+d.slice(5,7)}: <b>${fmtDur(min)}</b> trabalhadas · ⚡ ${porHora(q,min)}/h${sem?' <small>· tem livro sem horário</small>':""}</div>`}
function verDiaTrab(){const d=$("data").value||hoje(),rs=registros.filter(r=>r.data===d&&!r.releitura).sort((a,b)=>(a.ini||"99").localeCompare(b.ini||"99"));const t=rs.filter(r=>duracao(r)),min=minutosUniao(t)||t.reduce((a,r)=>a+duracao(r),0);
  alert("📅 "+(d===hoje()?"Hoje":d.slice(8)+"/"+d.slice(5,7))+" · "+fmtDur(min)+" trabalhadas\n\n"+rs.map(r=>"• "+r.livro+" — "+r.qtd+" leituras · "+(duracao(r)?(r.trechos&&r.pausa?r.trechos.join(" + "):r.ini+"–"+r.fim)+" ("+fmtDur(duracao(r))+")":"sem horário")).join("\n")+"\n\nSó entra o tempo dos livros com ⏱️ (pausa não conta). Livro sem horário: toque no ⏱️ dele pra colocar.")}
// etapa medida pelos livros com ⏱️: começo = 1º livro, fim = último, tempo = soma dos livros (pausa não conta)
// soma os horários sem contar duas vezes quando dois livros ficaram abertos ao mesmo tempo
function minutosUniao(rs){const iv=[];rs.forEach(r=>{(r.pausa&&r.trechos&&r.trechos.length?r.trechos:[r.ini+"–"+r.fim]).forEach(tr=>{const[a,b]=String(tr).split("–");if(!a||!b)return;let x=minDe(a),y=minDe(b);if(y<x)y+=1440;if(y>x)iv.push([r.data,x,y])})});
  iv.sort((p,q)=>p[0].localeCompare(q[0])||p[1]-q[1]);let tot=0,d="",s0=-1,e0=-1;iv.forEach(([dd,x,y])=>{if(dd!==d||x>e0){if(s0>=0)tot+=e0-s0;d=dd;s0=x;e0=y}else e0=Math.max(e0,y)});if(s0>=0)tot+=e0-s0;return tot}
function etapaLivros(m,e){const t=registros.filter(r=>r.etapa===e&&r.data.startsWith(m)&&!r.releitura&&duracao(r));if(!t.length)return{n:0};
  return{n:t.length,min:minutosUniao(t)||t.reduce((a,r)=>a+duracao(r),0),q:t.reduce((a,r)=>a+r.qtd,0),ini:t.map(r=>r.ini).sort()[0],fim:t.map(r=>r.fim).sort().slice(-1)[0]}}
function baseHoras(){let q=0,d=0,melhor=0,n=0;const ks=new Set(Object.keys(horas));registros.forEach(r=>{if(!r.releitura&&duracao(r))ks.add(r.data.slice(0,7)+"|"+r.etapa)});
  for(const k of ks){const[m,e]=k.split("|"),el=etapaLivros(m,+e);let l,du;if(el.n){l=el.q;du=el.min}else{du=duracao(horas[k]);l=leitEtapa(m,+e)}if(!du||!l)continue;q+=l;d+=du;n++;melhor=Math.max(melhor,porHora(l,du))}return{media:porHora(q,d),melhor,n}}
// 🎯 quanto o mesmo livro levou no mês passado
function metaLivro(livro,m){if(!livro)return 0;const ant=somaMes(m,-1),r=registros.find(x=>x.livro===livro&&!x.releitura&&x.data.startsWith(ant)&&duracao(x));return r?duracao(r):0}
function txtMeta(x){const mt=metaLivro(x.livro,mes());if(!mt)return"";const el=cronoMin(x),fa=mt-el;
  if(fa<0)return `<div class="cr-meta ruim">🔴 passou ${fmtDur(-fa)} do mês passado (${fmtDur(mt)})</div>`;
  return `<div class="cr-meta">🎯 mês passado ${fmtDur(mt)} · ${x.run?"meta até <b>"+hmDe(Date.now()+fa*60000)+"</b>":"faltam "+fmtDur(fa)} 🟢</div>`}
function salvarNaoFiz(){try{localStorage.setItem(NAOFIZKEY,JSON.stringify(naoFiz))}catch(e){}}
let ferias=[];try{ferias=JSON.parse(localStorage.getItem(FERIASKEY)||"[]")}catch(e){}
function salvarFerias(){try{localStorage.setItem(FERIASKEY,JSON.stringify(ferias))}catch(e){}}
function emFerias(d){return d?ferias.find(f=>d>=f.ini&&d<=f.fim):null}
function somaDias(iso,n){const [a,m,d]=iso.split("-").map(Number),x=new Date(a,m-1,d+n);return x.getFullYear()+"-"+p2(x.getMonth()+1)+"-"+p2(x.getDate())}
function etapaDoDia(d){for(const m in cal){const i=cal[m].indexOf(d);if(i>-1)return i+1}return 0}
// Dia sem leitura (domingo, feriado): qual é a próxima etapa do calendário?
function proximaEtapa(d){let melhor=null;for(const m in cal)cal[m].forEach((x,i)=>{if(x&&x>d&&(!melhor||x<melhor.dia))melhor={dia:x,etapa:i+1}});return melhor}

// ---------- Calendário provisório (calculado pelo app até chegar o oficial) ----------
const PROVKEY=KEY+"_calendario_provisorio";
let prov=new Set();try{prov=new Set(JSON.parse(localStorage.getItem(PROVKEY)||"[]"))}catch(e){}
let editados=new Set();try{editados=new Set(JSON.parse(localStorage.getItem(PROVKEY+"_editados")||"[]"))}catch(e){}
function salvarProv(){try{localStorage.setItem(PROVKEY,JSON.stringify([...prov]));localStorage.setItem(PROVKEY+"_editados",JSON.stringify([...editados]))}catch(e){}}
function ehProv(m){return prov.has(m)}
function etapaDoDiaProv(d){const m=d.slice(0,7);return ehProv(m)&&cal[m]&&cal[m].includes(d)}
// Feriados: nacionais, Sexta-feira Santa, Corpus Christi e 9 de julho (SP)
function pascoa(Y){const a=Y%19,b=Math.floor(Y/100),c=Y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;return new Date(Y,Math.floor(n/31)-1,n%31+1)}
const ferCache={};
function feriados(a){
  if(ferCache[a])return ferCache[a];
  const s=new Set(["01-01","04-21","05-01","07-09","09-07","10-12","11-02","11-15","11-20","12-25"].map(x=>a+"-"+x));
  const P=pascoa(a),iso=dt=>dt.getFullYear()+"-"+p2(dt.getMonth()+1)+"-"+p2(dt.getDate());
  s.add(iso(new Date(a,P.getMonth(),P.getDate()-2)));  // Sexta-feira Santa
  s.add(iso(new Date(a,P.getMonth(),P.getDate()+60))); // Corpus Christi
  return ferCache[a]=s;
}
// Nomes dos feriados, para colorir quando tiver leitura nesse dia.
// Os de Tatuí não são pulados no cálculo (o calendário é nacional e tem leitura).
const NOMES_FER={"01-01":"Ano Novo","04-21":"Tiradentes","05-01":"Dia do Trabalho","07-09":"Revolução de 32 (SP)","08-11":"Aniversário de Tatuí","09-07":"Independência","10-12":"N. Sra. Aparecida","11-02":"Finados","11-15":"Proclamação da República","11-20":"Consciência Negra","12-25":"Natal"};
function nomeFeriado(iso){
  if(!iso)return "";
  const a=+iso.slice(0,4),P=pascoa(a),dif=diasEntre(iso,a+"-"+p2(P.getMonth()+1)+"-"+p2(P.getDate()));
  if(dif===-2)return "Sexta-feira Santa";if(dif===60)return "Corpus Christi";if(dif===-47||dif===-48)return "Carnaval";
  return NOMES_FER[iso.slice(5)]||"";
}
function ehSabado(iso){if(!iso)return false;const [a,m,d]=iso.split("-").map(Number);return new Date(a,m-1,d).getDay()===6}
// Classe de cor: "fer" (feriado com leitura) tem prioridade sobre "sab" (sábado)
function corDoDia(iso){return nomeFeriado(iso)?"fer":ehSabado(iso)?"sab":""}
function textoDoDia(iso){const f=nomeFeriado(iso);return f?"🟠 "+f:ehSabado(iso)?"🔴 Sábado":""}
function diaUtil(iso){const [a,m,d]=iso.split("-").map(Number),dt=new Date(a,m-1,d);return dt.getDay()%6!==0&&!feriados(a).has(iso)}
function proximoUtil(iso){let [a,m,d]=iso.split("-").map(Number);do{const dt=new Date(a,m-1,d+1);a=dt.getFullYear();m=dt.getMonth()+1;d=dt.getDate()}while(!diaUtil(a+"-"+p2(m)+"-"+p2(d)));return a+"-"+p2(m)+"-"+p2(d)}
function diasEntre(x,y){const f=s=>{const [a,m,d]=s.split("-").map(Number);return Date.UTC(a,m-1,d)};return Math.round((f(x)-f(y))/864e5)}
// ---------- Ciclo: dias entre a leitura deste mês e a do mês anterior (limite de 27 a 33 dias) ----------
const CICLO_MIN=27,CICLO_MAX=33;
function foraDoLimite(c){return c!=null&&c>CICLO_MAX}
function muitoCedo(c){return c!=null&&c<CICLO_MIN}
// A etapa atrasou no mês anterior? Devolve {dias, lerAte} pra avisar e não repetir
function atrasoMesPassado(m,n){
  const ant=somaMes(m,-1),real=ultimaLeituraReal(ant,n);if(!real)return null;
  const c=cicloReal(real,n);if(!foraDoLimite(c))return null;
  const [a,mo,d]=real.split("-").map(Number),lim=new Date(a,mo-1,d+CICLO_MAX);
  return {dias:c,lido:real,previsto:diaDaEtapa(ant,n),lerAte:lim.getFullYear()+"-"+p2(lim.getMonth()+1)+"-"+p2(lim.getDate())};
}
// Pelo calendário (o mesmo número da coluna "Cic" da foto da empresa)
function cicloPlanejado(m,i){const d=cal[m]&&cal[m][i],a=cal[somaMes(m,-1)],b=a&&a[i];return d&&b?diasEntre(d,b):null}
// Na vida real: conta a partir do dia em que você REALMENTE leu essa etapa no mês passado (se lançou no app);
// se não lançou, usa a data do calendário
// Cada cidade tem sua conta: "Tatui" e "Tatuí" contam como a mesma (sem acento, maiúscula ou espaço)
function normLoc(t){return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
function locAtual(){return normLoc($("localidade").value)}
function mesmaCidade(r,loc){return !loc||normLoc(r.localidade)===loc}
function ultimaLeituraReal(m,n,loc){if(loc===undefined)loc=locAtual();let u="";registros.forEach(r=>{if(r.etapa===n&&r.data.startsWith(m)&&r.data>u&&mesmaCidade(r,loc)&&!r.releitura)u=r.data});return u}
// Cidade principal = onde você mais lança. O calendário do app é dela; cidade de ajuda só tem ciclo com leitura real.
function cidadePrincipal(){const c={};registros.forEach(r=>{if(r.ajuda)return;const k=normLoc(r.localidade);if(k)c[k]=(c[k]||0)+1});let m="",n=0;for(const k in c)if(c[k]>n){n=c[k];m=k}return m}
function cicloReal(data,n,loc){const ant=somaMes(data.slice(0,7),-1),real=ultimaLeituraReal(ant,n,loc),cp=cidadePrincipal();
  if(!real&&loc&&cp&&loc!==cp)return null;
  // Regra da ANEEL: o ciclo conta sempre a partir do dia do CALENDÁRIO do mês passado (atraso do mês passado não conta).
  // Só cidade de ajuda, sem calendário, usa o dia em que foi lida de verdade.
  const base=(!loc||!cp||loc===cp)?(diaDaEtapa(ant,n)||real):(real||diaDaEtapa(ant,n));return base?diasEntre(data,base):null}
// Monta um mês: 18 dias úteis seguidos, com a Etapa 01 uns 30 dias depois da Etapa 01 do mês anterior
function gerarMes(m){
  const ant=cal[somaMes(m,-1)];if(!ant||!ant[0])return null;
  const [a,mo]=m.split("-").map(Number),uteis=[];
  for(let d=1;d<=31;d++){const dt=new Date(a,mo-1,d);if(dt.getMonth()!==mo-1)break;const s=m+"-"+p2(d);if(diaUtil(s))uteis.push(s)}
  if(uteis.length<18)return null;
  let st=0,best=1e9;
  for(let i=0;i+18<=uteis.length;i++){const sc=Math.abs(diasEntre(uteis[i],ant[0])-30.4);if(sc<best){best=sc;st=i}}
  return uteis.slice(st,st+18);
}
// Preenche como provisório os meses que não têm calendário (ano atual e o próximo)
// e recalcula os provisórios que vêm depois de uma correção
function completarProvisorio(aPartirDe){
  const a=+hoje().slice(0,4);let mudou=false;
  for(let m=a+"-01";m<=(a+1)+"-12";m=somaMes(m,1)){
    if(cal[m]&&!ehProv(m))continue;                       // nunca mexe em mês oficial
    if(cal[m]&&!(aPartirDe&&m>aPartirDe))continue;        // provisório já feito: só refaz depois de uma correção
    if(cal[m]&&editados.has(m))break;                     // mês que você já corrigiu à mão não é recalculado (nem os seguintes)
    const g=gerarMes(m);if(g){cal[m]=g;prov.add(m);mudou=true}
  }
  if(mudou){salvarCal();salvarProv()}
}
// Corrigiu a etapa i: as etapas seguintes do mês vão para os próximos dias úteis
function ajustarSeguintes(m,i){
  for(let k=i+1;k<18;k++){if(!cal[m][k-1])break;cal[m][k]=proximoUtil(cal[m][k-1])}
}
function diaDaEtapa(m,n){return cal[m]&&cal[m][n-1]||""}

// ---------- Etapas ----------
for(let i=1;i<=18;i++){const b=document.createElement("button");b.type="button";b.className="etapa";b.onclick=()=>escolherEtapa(i);$("etapas").appendChild(b)}
// Etapa escolhida na mão fica "amarrada" no dia: fechou e abriu o app, volta nela
const ETAPADIAKEY=KEY+"_etapa_do_dia";
function escolherEtapa(n){
  sel(n,false);
  if(ajuda||esqueci)return; // ajuda e "esqueci de lançar" não amarram
  const d=$("data").value||hoje();
  try{localStorage.setItem(ETAPADIAKEY,JSON.stringify({data:d,etapa:n}))}catch(e){}
}
function etapaAmarrada(d){try{const x=JSON.parse(localStorage.getItem(ETAPADIAKEY)||"null");return x&&x.data===d?x.etapa:0}catch(e){return 0}}
function pintarEtapas(){
  const m=($("data").value||hoje()).slice(0,7),h=hoje();
  document.querySelectorAll(".etapa").forEach((b,i)=>{
    const d=diaDaEtapa(m,i+1);
    b.innerHTML=p2(i+1)+(d?"<small>"+d.slice(8)+"/"+d.slice(5,7)+"</small>":"");
    b.classList.toggle("ativa",i+1===etapa);b.classList.toggle("hoje",d===h);
    const c=corDoDia(d);b.classList.toggle("sab",c==="sab");b.classList.toggle("fer",c==="fer");b.title=textoDoDia(d).slice(3);
  });
  montarSelectEtapa();
}
// porData=true: escolheu a etapa na mão → a data vai para o dia dessa etapa no calendário
function sel(n,porData){
  etapa=n;pdaMostrar(n);
  if(porData){const d=diaDaEtapa(($("data").value||hoje()).slice(0,7),n);if(d){$("data").value=d;mesVer=d.slice(0,7)}}
  $("titulo").textContent="ETAPA "+p2(n);$("etapaSelect").value=n;$("etapaMenos").disabled=n<=1;$("etapaMais").disabled=n>=18;if($("etapaLista"))$("etapaLista").textContent=p2(n);$("etapaAtual").textContent=p2(n);
  abrirEtapas(false);render();
}
function abrirEtapas(abrir){$("etapas").classList.toggle("fechado",!abrir);$("etapaSeta").textContent=abrir?"▴":"▾"}
// Lista de etapas com a data de cada uma no calendário do mês
function montarSelectEtapa(){
  const m=($("data").value||hoje()).slice(0,7),sl=$("etapaSelect");sl.innerHTML="";
  for(let i=1;i<=18;i++){const d=diaDaEtapa(m,i),o=document.createElement("option");o.value=i;o.textContent="Etapa "+p2(i)+(d?" — "+d.slice(8)+"/"+d.slice(5,7):"");sl.appendChild(o)}
  sl.value=etapa;
}
$("etapaSelect").onchange=e=>escolherEtapa(+e.target.value);
$("etapaMenos").onclick=()=>{if(etapa>1)escolherEtapa(etapa-1)};$("etapaMais").onclick=()=>{if(etapa<18)escolherEtapa(etapa+1)};
$("etapaToggle").onclick=()=>abrirEtapas($("etapas").classList.contains("fechado"));
// Trocou a data → puxa a etapa do calendário
// Dia sem etapa no calendário: se a próxima etapa é ainda neste mês, vai pra ela (ex.: fim de semana no meio do ciclo).
// Se o ciclo do mês já acabou (a próxima é só no mês que vem), fica na ÚLTIMA etapa feita (ex.: 30/10 → Etapa 18, não Etapa 01/02)
function ultimaEtapaAte(d){let u=null;for(const m in cal)(cal[m]||[]).forEach((x,i)=>{if(x&&x<=d&&(!u||x>u.dia))u={dia:x,etapa:i+1}});return u}
function etapaAutomatica(d){const e=etapaDoDia(d);if(e)return e;const pr=proximaEtapa(d);if(pr&&pr.dia.slice(0,7)===d.slice(0,7))return pr.etapa;const u=ultimaEtapaAte(d);return u?u.etapa:(pr?pr.etapa:0)}
let dataManual=false;
$("data").onchange=()=>{const d=$("data").value;if(!d)return;esqueci=null;dataManual=d!==hoje();mesVer=d.slice(0,7);const e=etapaAmarrada(d)||etapaAutomatica(d);if(e)sel(e,false);else render()};
// Virou o dia com o app aberto: quando você voltar pro app, ele já passa pra data de hoje e a etapa do dia
let diaDoApp=hoje();
// só volta pra hoje quando o DIA realmente virou (não atrapalha quem está olhando outro mês)
function conferirVirada(){if(hoje()===diaDoApp)return;diaDoApp=hoje();if(dataManual||$("data").value===hoje())return;$("data").value=hoje();mesVer=hoje().slice(0,7);const e=etapaAutomatica(hoje());if(e)sel(e,false);else render()}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)conferirVirada()});
window.addEventListener("focus",conferirVirada);
setInterval(conferirVirada,60000);

// ---------- Barrinhas ----------
let contLinha=0;
const SEM_AUTO='autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="next"';
function nomesDaLinha(r){return [...r.querySelectorAll(".r-com")].map(i=>i.value.trim()).filter(Boolean)}
function salvarRascunho(){
  const linhas=[...$("livroRows").children].map(r=>({livro:r.querySelector(".r-livro").value,qtd:r.querySelector(".r-qtd").value,de:r.querySelector(".r-de").value,ate:r.querySelector(".r-ate").value,com:nomesDaLinha(r),part:r.classList.contains("part"),end:r._end||null,rel:r.querySelector(".r-rel").checked})).filter(l=>l.livro||l.qtd||l.de||l.ate);
  try{localStorage.setItem(RASC,JSON.stringify({localidade:ajuda?ajuda.loc:$("localidade").value,prontuario:ajuda?ajuda.pront:$("prontuario").value,linhas}))}catch(e){}
}
$("localidade").addEventListener("input",salvarRascunho);$("prontuario").addEventListener("input",salvarRascunho);
// Cada cidade lembra o seu prontuário: trocou a localidade, o prontuário daquela cidade aparece sozinho
const PRONTKEY=KEY+"_prontuarios";let prontPorCidade={};try{prontPorCidade=JSON.parse(localStorage.getItem(PRONTKEY)||"{}")}catch(e){}
function guardarPront(loc,pr){const k=normLoc(loc);if(!k||!pr)return;prontPorCidade[k]=pr;try{localStorage.setItem(PRONTKEY,JSON.stringify(prontPorCidade))}catch(e){}preencherAntigos(loc,pr)}
// Livros antigos daquela cidade que ficaram sem prontuário recebem o prontuário dela (uma vez só)
function preencherAntigos(loc,pr){
  const k=normLoc(loc);if(!k||!pr)return;let n=0;
  registros.forEach(r=>{if(!r.prontuario&&normLoc(r.localidade)===k){r.prontuario=pr;n++}});
  if(n){localStorage.setItem(KEY,JSON.stringify(registros));render();setTimeout(()=>alert("✅ "+n+" livro(s) antigo(s) de "+loc.trim()+" receberam o prontuário "+pr+"."),300)}
}
function prontDaCidade(loc){const k=normLoc(loc);if(!k)return "";if(prontPorCidade[k])return prontPorCidade[k];let u=null;registros.forEach(r=>{if(r.prontuario&&normLoc(r.localidade)===k&&(!u||r.data>u.data))u=r});return u?u.prontuario:""}
let tPront=null;
$("localidade").addEventListener("input",()=>{clearTimeout(tPront);tPront=setTimeout(()=>{const p=prontDaCidade($("localidade").value);if(p&&p!==$("prontuario").value){$("prontuario").value=p;salvarRascunho()}},500)});
$("prontuario").addEventListener("change",()=>guardarPront($("localidade").value,$("prontuario").value.trim()));
let tLoc=null;$("localidade").addEventListener("input",()=>{clearTimeout(tLoc);tLoc=setTimeout(render,400)});
function linhaPreenchida(r){
  if(!r.querySelector(".r-livro").value.trim())return false;
  if(r.classList.contains("part"))return r.querySelector(".r-de").value!==""&&r.querySelector(".r-ate").value!=="";
  return r.querySelector(".r-qtd").value!=="";
}
function abrirProxima(r){if(r===$("livroRows").lastElementChild&&linhaPreenchida(r))criarLinha(false)}
function camposVisiveis(r){return [...r.querySelectorAll("input:not([type=checkbox])")].filter(i=>i.offsetParent!==null)}
function nlAnterior(livro,data){let u=null;const m=data.slice(0,7);registros.forEach(x=>{if(x.livro===livro&&!x.releitura&&x.nl>0&&x.data.slice(0,7)<m&&(!u||x.data>u.data))u=x});return u}
function rotMesNl(d,data){const a=d.slice(0,7);return a===somaMes(data.slice(0,7),-1)?"mês passado":nomeMes(a)}
function ultimoDoLivro(livro){let u=null;registros.forEach(x=>{if(x.livro===livro&&(!u||x.data>u.data||(x.data===u.data&&x.id>u.id)))u=x});return u}
// Livro já lançado antes: preenche a quantidade (azul). Se você mexer, vira número seu.
function autoPreencher(r){
  const livro=r.querySelector(".r-livro").value.trim(),u=livro?ultimoDoLivro(livro):null;
  {const cx=r.querySelector(".c-livro");let av=cx.querySelector(".nl-aviso");if(!av){av=document.createElement("div");av.className="nl-aviso";cx.appendChild(av)}
   const x=livro?nlAnterior(livro,$("data").value||hoje()):null;const dd=$("data").value||hoje(),y=livro?ina082Ant(livro,dd):null,ya=y&&y.data.slice(0,7)<dd.slice(0,7)?y:null;av.hidden=!x&&!ya;
   av.textContent=(x?"🚫 "+rotMesNl(x.data,dd)+": este livro teve "+x.nl+" não lido"+(x.nl>1?"s":""):"")+(x&&ya?"\n":"")+(ya?"🔌 "+rotMesNl(ya.data,dd)+": "+ya.ina+" inativo"+(ya.ina>1?"s":"")+" (082) · fora das bobinas":"")}
  const q=r.querySelector(".r-qtd"),de=r.querySelector(".r-de"),ate=r.querySelector(".r-ate");
  const podeMexer=i=>i.value===""||i.classList.contains("auto");
  if(!u){[q,de,ate].forEach(i=>{if(i.classList.contains("auto")){i.value="";i.classList.remove("auto")}});return}
  if(u.particionado&&!r.classList.contains("part")&&podeMexer(q)){r.classList.add("part");r.querySelector(".r-part").checked=true}
  if(r.classList.contains("part")&&u.particionado){
    if(podeMexer(de)){de.value=u.de;de.classList.add("auto")}
    if(podeMexer(ate)){ate.value=u.ate;ate.classList.add("auto")}
  }
  if(podeMexer(q)){q.value=u.qtd;q.classList.add("auto")}
}
function criarLinha(foco=true,dados={}){
  const n=++contLinha,ant=$("livroRows").lastElementChild;
  const part=dados.part!==undefined?dados.part:(ant?ant.classList.contains("part"):false);
  const r=document.createElement("div");r.className="livro-row"+(part?" part":"");
  r.innerHTML=`<div class="c-livro"><input class="r-livro" name="livro_${n}" ${SEM_AUTO} type="text" placeholder="Digite o livro"><button type="button" class="r-pred" title="Prédio: não entra na conta das bobinas" aria-label="Prédio" hidden>🏢</button></div>`+
  `<div class="c-de so-part"><div class="mini">DE</div><input class="r-de" name="de_${n}" ${SEM_AUTO} type="number" min="0" inputmode="numeric" placeholder="De"></div>`+
  `<div class="c-ate so-part"><div class="mini">ATÉ</div><input class="r-ate" name="ate_${n}" ${SEM_AUTO} type="number" min="0" inputmode="numeric" placeholder="Até"></div>`+
  `<div class="c-qtd"><div class="mini">QTD</div><input class="r-qtd" name="qtd_${n}" ${SEM_AUTO} type="number" min="0" inputmode="numeric" placeholder="Qtd"></div>`+
  `<div class="c-com so-part"><div class="com-lbl">👥 DIVIDIDO COM</div><div class="com-lista"><span class="com-item"><input class="r-com" ${SEM_AUTO} list="nomesDivididos" type="text" placeholder="Nome"><button type="button" class="com-x" aria-label="Tirar este nome">✕</button></span><button type="button" class="com-mais" aria-label="Mais uma pessoa">＋</button></div></div>`+
  `<label class="part-chk" title="Livro particionado"><input type="checkbox" class="r-part"${part?" checked":""}><span>PART.</span></label>`+
  `<label class="part-chk rel-chk" title="Releitura"><input type="checkbox" class="r-rel"><span>REL.</span></label>`;
  r.querySelector(".r-livro").value=dados.livro||"";r.querySelector(".r-qtd").value=dados.qtd||"";
  r.querySelector(".r-de").value=dados.de||"";r.querySelector(".r-ate").value=dados.ate||"";r.querySelector(".r-rel").checked=!!dados.rel;r.querySelector(".r-rel").addEventListener("change",salvarRascunho);
  // pessoas com quem dividiu o livro (o ＋ abre mais um nome)
  const lista=r.querySelector(".com-lista"),mais=r.querySelector(".com-mais");
  const novoNome=(v,foco)=>{
    const w=document.createElement("span");w.className="com-item";
    w.innerHTML='<input class="r-com" type="text" placeholder="Nome" list="nomesDivididos" autocomplete="off"><button type="button" class="com-x" aria-label="Tirar este nome">✕</button>';
    const i=w.querySelector("input");i.value=v||"";lista.insertBefore(w,mais);if(foco)setTimeout(()=>i.focus(),30);return i};
  // ✕ tira o quadradinho; se for o único, só apaga o nome
  lista.addEventListener("click",e=>{
    const x=e.target.closest(".com-x");if(!x)return;
    const itens=lista.querySelectorAll(".com-item");
    if(itens.length>1)x.parentNode.remove();else x.parentNode.querySelector("input").value="";
    salvarRascunho();
  });
  (dados.com||[]).forEach((n,k)=>{if(k===0)r.querySelector(".r-com").value=n;else novoNome(n)});
  mais.onclick=()=>novoNome("",true);
  $("livroRows").appendChild(r);
  if(dados.end)pdaPin(r,dados.end);
  r.querySelector(".r-part").addEventListener("change",e=>{
    r.classList.toggle("part",e.target.checked);abrirProxima(r);salvarRascunho();
    if(r.querySelector(".r-livro").value.trim())setTimeout(()=>(e.target.checked?r.querySelector(".r-de"):r.querySelector(".r-qtd")).focus(),30);
  });
  r.addEventListener("input",e=>{
    const t=e.target;if(t.type==="checkbox")return;
    if(t.classList.contains("r-livro"))autoPreencher(r);else t.classList.remove("auto");
    if(r.classList.contains("part")&&(t.classList.contains("r-de")||t.classList.contains("r-ate"))){
      const de=r.querySelector(".r-de").value,ate=r.querySelector(".r-ate").value;
      if(de!==""&&ate!==""&&Number(ate)>=Number(de)){const q=r.querySelector(".r-qtd");q.value=Number(ate)-Number(de)+1;q.classList.remove("auto")}
    }
    abrirProxima(r);salvarRascunho();
  });
  r.addEventListener("keydown",e=>{
    if(e.key!=="Enter"||e.target.type==="checkbox")return;e.preventDefault();
    const c=camposVisiveis(r),i=c.indexOf(e.target);
    if(i>-1&&i<c.length-1){c[i+1].focus();return}
    abrirProxima(r);const prox=r.nextElementSibling;if(prox)prox.querySelector(".r-livro").focus();
  });
  if(foco)setTimeout(()=>r.querySelector(".r-livro").focus(),40);
}
function iniciarLinhas(){
  let r=null;try{r=JSON.parse(localStorage.getItem(RASC)||"null")}catch(e){}
  $("livroRows").innerHTML="";
  if(r){if(r.localidade)$("localidade").value=r.localidade;if(r.prontuario)$("prontuario").value=r.prontuario;(r.linhas||[]).forEach(l=>criarLinha(false,l))}
  const u=$("livroRows").lastElementChild;if(!u||linhaPreenchida(u))criarLinha(false);
}
function limparLancamentos(){$("livroRows").innerHTML="";criarLinha(true,{part:false});salvarRascunho()}
function coletarLancamentos(){
  const saida=[];
  for(const r of $("livroRows").children){
    const part=r.classList.contains("part"),livro=r.querySelector(".r-livro").value.trim();
    const tem=livro!==""||(part?r.querySelector(".r-de").value!==""||r.querySelector(".r-ate").value!=="":r.querySelector(".r-qtd").value!=="");
    if(!tem)continue;
    if(!livro)return {erro:"Preencha o livro de cada barrinha utilizada."};
    if(part){
      const de=r.querySelector(".r-de").value,ate=r.querySelector(".r-ate").value,a=Number(de),b=Number(ate);
      if(de===""||ate===""||b<a)return {erro:"Confira os campos DE e ATÉ do livro "+livro+"."};
      const qv=r.querySelector(".r-qtd").value,q=qv===""?b-a+1:Number(qv);
      if(!(q>0))return {erro:"Informe uma quantidade válida para o livro "+livro+"."};
      saida.push({livro,de:a,ate:b,qtd:q,particionado:true,com:nomesDaLinha(r),etapa:(r._end&&r._end.etapa)||0,pda:r._end?{end:r._end.end,lim:r._end.lim,km:r._end.km}:undefined,releitura:r.querySelector(".r-rel").checked||undefined});
    }else{
      const q=Number(r.querySelector(".r-qtd").value);
      if(!(q>0))return {erro:"Informe uma quantidade válida para o livro "+livro+"."};
      saida.push({livro,de:null,ate:null,qtd:q,particionado:false,etapa:(r._end&&r._end.etapa)||0,pda:r._end?{end:r._end.end,lim:r._end.lim,km:r._end.km}:undefined,releitura:r.querySelector(".r-rel").checked||undefined});
    }
  }
  const vistos=new Set(),unicos=[];let repetidos=0;
  for(const x of saida){const k=[x.livro,x.qtd,x.de,x.ate].join("|");if(vistos.has(k)){repetidos++;continue}vistos.add(k);unicos.push(x)}
  return {saida:unicos,repetidos};
}
$("saveAll").onclick=()=>{
  const data=$("data").value,localidade=$("localidade").value.trim();
  if(!data)return alert("Selecione a data.");
  if(!localidade){alert("Digite a localidade.");$("localidade").focus();return}
  const r=coletarLancamentos();if(r.erro)return alert(r.erro);
  const imp=Math.max(0,Math.round(Number($("impQtd").value)||0));
  if(!r.saida.length&&!imp)return alert("Digite pelo menos um livro e a quantidade.");
  // Um livro só + não lidos digitados: o número fica dentro do livro (assim o app avisa no mês que vem)
  let nlColado=false;
  if(imp&&r.saida.length===1&&!r.saida[0].releitura&&imp<=r.saida[0].qtd){r.saida[0].nl=imp;nlColado=true;if(resFeitas&&resFeitas<=r.saida[0].qtd)r.saida[0].feitas=resFeitas}
  else if(imp){impedimentos.push({id:Date.now()+Math.random(),data,etapa,localidade,qtd:imp,...(ajuda?{ajuda:true}:{})});salvarImp();$("impQtd").value=""}
  if(resFeitas&&r.saida.length===1&&!r.saida[0].releitura&&resFeitas<=r.saida[0].qtd)r.saida[0].feitas=resFeitas;resFeitas=0;
  if(resIna&&r.saida.length===1&&!r.saida[0].releitura&&resIna<=r.saida[0].qtd)r.saida[0].ina=resIna;resIna=0;
  if(!r.saida.length){mesVer=data.slice(0,7);render();if(ajuda)setTimeout(sairAjuda,60);if(esqueci)setTimeout(sairDoEsqueci,50);return}
  const ja=r.saida.filter(x=>!x.pda&&registros.some(g=>g.data===data&&g.etapa===(x.etapa||etapa)&&g.livro===x.livro)).map(x=>x.livro);
  if(ja.length&&!confirm("O(s) livro(s) "+ja.join(", ")+" já foi(ram) salvo(s) nesta data e etapa. Salvar de novo?"))return;
  const prontuario=$("prontuario").value.trim();guardarPront(localidade,prontuario);
  const ehAjuda=!!ajuda;
  // Releitura digitada (sem foto): o livro já foi lançado antes? usa a etapa dele
  const relOutra=r.saida.filter(x=>x.releitura&&!x.etapa).map(x=>({x,e:etapaDoLivroConhecido(x.livro)})).filter(o=>o.e&&o.e!==etapa);
  if(relOutra.length&&confirm("📝 Releitura:\n\n"+relOutra.map(o=>"• Livro "+o.x.livro+" é da Etapa "+p2(o.e)).join("\n")+"\n\nLançar na etapa do livro? (Cancelar = fica na Etapa "+p2(etapa)+")"))relOutra.forEach(o=>o.x.etapa=o.e);
  const relSalvos=[],atualizados=[];
  r.saida.forEach(x=>{
    // livro da foto que já foi salvo nesta data e etapa: atualiza o que já existe, não duplica
    const et=x.etapa||etapa,mesL=dataDoLivro(x,et,data).slice(0,7);
    // mesmo livro já lançado neste mês e nesta etapa (ex.: foto do PDA lida de novo): atualiza, não duplica
    let ex=x.pda?registros.find(g=>g.data===dataDoLivro(x,et,data)&&g.etapa===et&&g.livro===x.livro&&normLoc(g.localidade)===normLoc(localidade)):null;
    if(!ex)ex=registros.find(g=>g.releitura&&g.etapa===et&&g.livro===x.livro&&g.data.startsWith(mesL)&&(x.releitura||(x.pda&&x.qtd<=20))&&normLoc(g.localidade)===normLoc(localidade));
    if(!ex&&(x.releitura||(x.pda&&x.qtd<=20)))ex=registros.find(g=>g.releitura&&g.aguarda&&g.livro===x.livro&&normLoc(g.localidade)===normLoc(localidade));
    if(ex&&ex.aguarda){delete ex.aguarda;ex.voltou=hoje();x.releitura=true}
    if(ex&&ex.releitura&&!x.releitura)x.releitura=true;
    if(ex)atualizados.push(x.livro);
    if(ex){if(!ex.releitura&&x.releitura&&ex.data!==dataDoLivro(x,et,data))ex=null}
    if(ex){Object.assign(ex,{qtd:x.qtd,prontuario,...(x.pda?{pda:x.pda}:{}),...(x.nl?{nl:x.nl}:{})});if(x.releitura){ex.releitura=true;relSalvos.push(ex.id)}return}
    const novo={id:Date.now()+Math.random(),data:dataDoLivro(x,et,data),etapa,localidade,prontuario,...x,etapa:et,...(ehAjuda?{ajuda:true}:{})};registros.push(novo);if(x.releitura){relSalvos.push(novo.id);novo.voltou=hoje()}else if(!novo.ini&&cronoDoLivro(novo.livro)){const c=cronoDoLivro(novo.livro);novo.ini=hmDe(cronoIni(c));novo.fim=c.run?agoraHM():hmDe(c.segs[c.segs.length-1][1]);if(c.segs.length){novo.min=Math.max(1,cronoMin(c));novo.pausa=true;novo.trechos=c.segs.concat(c.run?[[c.run,Date.now()]]:[]).map(([a,b])=>hmDe(a)+"–"+hmDe(b))}if(c.imp&&c.imp.length){novo.nl=(novo.nl||0)+c.imp.length;novo.impLista=c.imp}cronos=cronos.filter(y=>y!==c);salvarCrono();const hk=novo.data.slice(0,7)+"|"+novo.etapa,hv=horas[hk]||{};horas[hk]={ini:hv.ini||novo.ini,fim:novo.fim};salvarHoras()}
  });
  localStorage.setItem(KEY,JSON.stringify(registros));guardarDesfazer([]);if(nlColado)$("impQtd").value="";
  if(atualizados.length)setTimeout(()=>toast("♻️ Livro "+[...new Set(atualizados)].join(", ")+" já estava lançado neste mês: atualizei, não repeti"),300);
  mesVer=data.slice(0,7);pdaConcluir();limparLancamentos();render();const pdaAviso=pdaProxima();
  if(ehAjuda)setTimeout(sairAjuda,60); // ajuda salva: volta pra sua cidade
  if(esqueci)setTimeout(sairDoEsqueci,50); // lançou a esquecida: volta pra data de hoje
  if(r.repetidos)alert(r.repetidos+" barrinha(s) repetida(s) foi(ram) ignorada(s).");
  // salvou releitura: já abre a tela das confirmações dela, pronta pras fotos
  if(relSalvos.length)setTimeout(()=>abrirConf(String(relSalvos[0])),250);
};

// Livro da foto do PDA: cada um com a data da SUA etapa
// confirmação (REL.) de etapa que já passou → dia da etapa no calendário; etapa de hoje → hoje; resto → data escolhida
function etapaDoLivroConhecido(livro){const r=registros.filter(g=>g.livro===livro&&!g.releitura).sort((a,b)=>b.data.localeCompare(a.data))[0];return r?r.etapa:(rotas[livro]&&rotas[livro].etapa)||0}
function dataDoLivro(x,et,data){
  if(!x.pda&&!x.releitura)return data;
  const h=hoje(),d=diaDaEtapa(data.slice(0,7),et);
  if(x.releitura&&d&&d<=h)return d;
  if(et===etapaDoDia(h))return h;
  return data;
}
// ---------- Mês, totais e lista ----------
let mesVer=hoje().slice(0,7);
function mes(){return mesVer}
function mudarMes(d){mesVer=somaMes(mesVer,d);render()}
document.querySelectorAll(".tot-toque").forEach(e=>e.onclick=abrirTotalCidades);
$("relBtn").onclick=abrirAbaRel;
$("ajudaBtn").onclick=()=>ajuda?sairAjuda():entrarAjuda();
$("localidade").addEventListener("input",()=>{if(ajuda)atualizarFaixaAjuda()});
$("mesAnt").onclick=()=>mudarMes(-1);$("mesProx").onclick=()=>mudarMes(1);
$("mesPicker").onchange=e=>{if(e.target.value){mesVer=e.target.value;render()}};
$("listaHead").onclick=()=>{const l=$("lista");l.hidden=!l.hidden;$("listaSeta").textContent=l.hidden?"▼":"▲"};
function atualizarNomes(){const set=new Set();registros.forEach(r=>(r.com||[]).forEach(n=>set.add(n)));$("nomesDivididos").innerHTML=[...set].sort().map(n=>`<option value="${esc(n)}">`).join("")}
// ---------- Comparação com o mês passado: por dia, por etapa e mês inteiro ----------
const COMPKEY=KEY+"_comparar";let modoComp="dia";try{modoComp=localStorage.getItem(COMPKEY)||"dia"}catch(e){}
function somaQtd(lista){return lista.reduce((t,r)=>t+r.qtd,0)}
function calcComparacoes(m){
  const ant=somaMes(m,-1),doMes=registros.filter(r=>r.data.startsWith(m)&&!r.releitura),doAnt=registros.filter(r=>r.data.startsWith(ant)&&!r.releitura);
  const emAndamento=m===hoje().slice(0,7),dia=emAndamento?hoje().slice(8):"31";
  const maxEt=doMes.length?Math.max(...doMes.map(r=>r.etapa)):0;
  const pct=(a,b)=>b?Math.round((a-b)/b*100):null;
  const res={ant,
    dia:{rot:emAndamento?"Por dia (até o dia "+dia+")":"Por dia (mês inteiro)",a:somaQtd(doMes.filter(r=>r.data.slice(8)<=dia)),b:somaQtd(doAnt.filter(r=>r.data.slice(8)<=dia))},
    etapa:{rot:maxEt?"Por etapa (Etapas 01 a "+p2(maxEt)+")":"Por etapa",a:somaQtd(doMes.filter(r=>r.etapa<=maxEt)),b:somaQtd(doAnt.filter(r=>r.etapa<=maxEt))},
    mes:{rot:"Mês inteiro",a:somaQtd(doMes),b:somaQtd(doAnt)}};
  ["dia","etapa","mes"].forEach(k=>res[k].p=pct(res[k].a,res[k].b));
  return res;
}
function atualizarComparacao(m,tot){
  const c=calcComparacoes(m),b=$("pctMes"),x=c[modoComp]||c.dia;
  const tem=tot&&x.b;b.hidden=false;
  if(!tem){b.className="pct igual";b.textContent="–%";b.onclick=()=>abrirComparacao(m);return}
  const p=x.p;b.className="pct "+(p>0?"sobe":p<0?"desce":"igual");
  b.textContent=(p>0?"▲ ":p<0?"▼ ":"= ")+Math.abs(p)+"%"+(modoComp==="etapa"?" E":"");
  b.onclick=()=>abrirComparacao(m);
}
function abrirComparacao(m){
  const c=calcComparacoes(m),box=$("cartaoComp");
  const linha=k=>{const x=c[k],p=x.p,dif=x.a-x.b;
    return `<div class="comp-linha${modoComp===k?" sel":""}" data-k="${k}"><div><b>${x.rot}</b><small>${nomeMes(m)}: ${x.a.toLocaleString("pt-BR")} · ${nomeMes(c.ant)}: ${x.b.toLocaleString("pt-BR")}</small></div>`+
      (p==null?`<span class="pct igual">sem dados</span>`:`<span class="pct ${p>0?"sobe":p<0?"desce":"igual"}">${p>0?"▲ ":p<0?"▼ ":"= "}${Math.abs(p)}%<small>${dif>0?"+":""}${dif.toLocaleString("pt-BR")}</small></span>`)+`</div>`};
  box.innerHTML=`<b class="comp-tit">📊 Comparação com ${nomeMes(c.ant)}</b>${linha("dia")}${linha("etapa")}${linha("mes")}
    ${c.mes.b?"":`<div class="comp-dica" style="color:#92400e;font-weight:700">Ainda não tem leituras lançadas em ${nomeMes(c.ant)} pra comparar. A % aparece sozinha no mês que vem.</div>`}<div class="comp-dica">Toque numa linha pra ela aparecer no selinho do total.</div><button type="button" class="comp-rank">🏆 Ranking dos meses</button><button type="button" class="comp-ok">Ok</button>`;
  box.querySelectorAll(".comp-linha").forEach(l=>l.onclick=()=>{modoComp=l.dataset.k;try{localStorage.setItem(COMPKEY,modoComp)}catch(e){}render();abrirComparacao(m)});
  box.querySelector(".comp-ok").onclick=()=>box.hidden=true;
  box.querySelector(".comp-rank").onclick=()=>abrirRanking(m);
  box.hidden=false;
}
// ---------- 🏆 Ranking: mês que mais leu e que menos leu ----------
function abrirRankHora(mAtual,deRanking){
  const box=$("cartaoComp"),q={},d={},n={},top={};
  registros.forEach(r=>{const du=duracao(r);if(!du||r.releitura||!r.qtd)return;const m=r.data.slice(0,7);q[m]=(q[m]||0)+r.qtd;d[m]=(d[m]||0)+du;n[m]=(n[m]||0)+1;const ph=porHora(r.qtd,du);if(!top[m]||ph>top[m].ph)top[m]={ph,l:r.livro}});
  const ph=m=>porHora(q[m],d[m]),ms=Object.keys(q).sort((a,b)=>ph(b)-ph(a)),max=ms.length?ph(ms[0]):1,med=["🥇","🥈","🥉"];
  box.innerHTML=`<b class="comp-tit">⚡ Ranking por hora</b>`+(ms.length?ms.map((m,k)=>{const fim=k===ms.length-1&&ms.length>3;
      return `<div class="rank-l${m===mAtual?" atual":""}"><span class="rk-m">${med[k]||(fim?"🔻":"")}</span><div class="rk-tx"><b>${nomeMes(m).replace(/^./,c=>c.toUpperCase())}${m===mAtual?" · este mês":""}</b><small>${n[m]} livro(s) cronometrado(s) · ${fmtDur(d[m])} · 🏆 livro ${esc(top[m].l)} com ${top[m].ph}/h</small><i style="width:${Math.max(4,Math.round(ph(m)/max*100))}%"></i></div><b class="rk-n">${ph(m)}/h</b></div>`}).join("")+
    `<div class="comp-dica">Leituras por hora de cada mês, só dos livros com ⏱️ começo e fim. No mês que vem o app compara sozinho.</div>`:`<div class="comp-dica">Ainda não tem livro com ⏱️ começo e fim. Toque em "⏱️ Começar livro agora" antes de ler um livro.</div>`)+
    `<button type="button" class="comp-ok">${deRanking?"‹ Voltar":"Ok"}</button>`;
  box.querySelector(".comp-ok").onclick=()=>deRanking?abrirRanking(mAtual):box.hidden=true;
  box.hidden=false;if(!deRanking)box.scrollIntoView({behavior:"smooth",block:"center"});
}

// ---------- ⏳ Horas trabalhadas no mês: soma das etapas (livros com ⏱️; senão ▶/⏹ da etapa) ----------
function horasMes(m){const ets=new Set();Object.keys(horas).forEach(k=>{const[a,e]=k.split("|");if(a===m)ets.add(+e)});registros.forEach(r=>{if(r.data.startsWith(m)&&!r.releitura&&duracao(r))ets.add(r.etapa)});
  const L=[];[...ets].sort((a,b)=>a-b).forEach(e=>{const el=etapaLivros(m,e);let min,q,ini,fim;if(el.n){min=el.min;q=el.q;ini=el.ini;fim=el.fim}else{const v=horas[m+"|"+e]||{};min=duracao(v);q=leitEtapa(m,e);ini=v.ini;fim=v.fim}
    if(min>0)L.push({e,min,q,ini,fim,dia:diaDaEtapa(m,e)})});
  return{L,min:L.reduce((t,x)=>t+x.min,0),q:L.reduce((t,x)=>t+(x.q||0),0)}}
function abrirHorasMes(m){const box=$("cartaoComp"),h=horasMes(m),a=horasMes(somaMes(m,-1)),ph=h.min&&h.q?porHora(h.q,h.min):0;
  const linhas=h.L.map(x=>`<div class="comp-linha" style="cursor:default"><div><b>Etapa ${p2(x.e)}${x.dia?" · "+fmt(x.dia).slice(0,5):""}</b><small>${x.ini&&x.fim?x.ini+" → "+x.fim:""}${x.q?" · "+x.q.toLocaleString("pt-BR")+" leituras · ⚡ "+porHora(x.q,x.min)+"/h":""}</small></div><b>${fmtDur(x.min)}</b></div>`).join("");
  box.innerHTML=`<b class="comp-tit">⏳ Horas trabalhadas de ${nomeMes(m)}</b><div class="comp-linha sel" style="cursor:default"><div><b>Total</b><small>${h.L.length} etapa${h.L.length>1?"s":""} com horário${ph?" · ⚡ "+ph+" leituras/hora":""}${h.L.length?" · média "+fmtDur(Math.round(h.min/h.L.length))+" por etapa":""}</small></div><b>${fmtDur(h.min)}</b></div>${linhas||'<div class="comp-dica">Nenhuma etapa com horário neste mês.</div>'}`+
    `<div class="comp-dica">${a.min?nomeMes(somaMes(m,-1)).replace(/^./,c=>c.toUpperCase())+": <b>"+fmtDur(a.min)+"</b> em "+a.L.length+" etapa"+(a.L.length>1?"s":"")+" · ":""}Conta o tempo dos livros com ⏱️ (pausa não conta); etapa sem livro cronometrado usa ▶ Começou / ⏹ Terminou.</div><button type="button" class="comp-rank" id="hmRk">🕐 Ranking de horário</button><button type="button" class="comp-ok">Ok</button>`;
  box.querySelector(".comp-ok").onclick=()=>box.hidden=true;$("hmRk").onclick=()=>abrirRankHorario(m);
  box.hidden=false;box.scrollIntoView({behavior:"smooth",block:"center"})}
// ---------- 🕐 Ranking de horário: dia que terminou mais cedo e mais tarde ----------
// usa o que o app já guarda: ▶/⏹ da etapa e o ⏱️ dos livros (não precisa lançar nada a mais)
function diasHorario(){const D={},pega=(d,ini,fim,e)=>{if(!d||!fim)return;const x=D[d]=D[d]||{d,ini:"",fim:"",et:new Set()};if(!x.fim||minDe(fim)>minDe(x.fim))x.fim=fim;if(ini&&(!x.ini||minDe(ini)<minDe(x.ini)))x.ini=ini;if(e)x.et.add(e)};
  registros.forEach(r=>{if(!r.releitura&&r.fim&&/^\d{1,2}:\d{2}$/.test(r.fim))pega(r.data,r.ini,r.fim,r.etapa)});
  Object.entries(horas).forEach(([k,v])=>{if(!v||!v.fim)return;const[m,e]=k.split("|");let d=diaDaEtapa(m,+e);
    if(!d){const ds=registros.filter(r=>r.data.startsWith(m)&&r.etapa===+e&&!r.releitura).map(r=>r.data).sort();d=ds[ds.length-1]||""}
    pega(d,v.ini,v.fim,+e)});
  return Object.values(D).filter(x=>x.d<=hoje())}
function rkHorLink(){const L=diasHorario();if(!L.length)return "";const c=L.slice().sort((a,b)=>minDe(a.fim)-minDe(b.fim))[0];
  return `<div class="hr-base hr-rk" onclick="abrirRankHorario(mes())">🕐 Terminou mais cedo: <b>${c.fim}</b> (${fmt(c.d).slice(0,5)}) · <u>ranking de horário</u></div>`}
function abrirRankHorario(mAtual,deRanking){
  const box=$("cartaoComp"),L=diasHorario(),cedo=L.slice().sort((a,b)=>minDe(a.fim)-minDe(b.fim)||a.d.localeCompare(b.d)),tarde=cedo.slice().reverse(),N=5,nC=Math.min(N,Math.ceil(L.length/2)),nT=Math.min(N,L.length-nC);
  const sem=d=>new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","");
  const media=L.length?Math.round(L.reduce((t,x)=>t+minDe(x.fim),0)/L.length):0,hm=v=>p2(Math.floor(v/60))+":"+p2(v%60);
  const lin=(x,k,ic)=>{const et=[...x.et].sort((a,b)=>a-b).map(p2).join(", "),du=x.ini?duracao({ini:x.ini,fim:x.fim}):0;
    return `<div class="rank-l${x.d.startsWith(mAtual)?" atual":""}"><span class="rk-m">${k<3?["🥇","🥈","🥉"][k]:ic}</span><div class="rk-tx"><b>${fmt(x.d)} · ${sem(x.d)}</b><small>${et?"Etapa "+et:""}${x.ini?" · ▶ "+x.ini:""}${du?" · "+fmtDur(du)+" de trabalho":""}</small></div><b class="rk-n">${x.fim}</b></div>`};
  box.innerHTML=`<b class="comp-tit">🕐 Ranking de horário</b>`+(L.length?
    `<div class="comp-dica" style="font-weight:800;color:#15803d;margin:4px 0">🌅 Terminou mais cedo</div>`+cedo.slice(0,nC).map((x,k)=>lin(x,k,"🌅")).join("")+
    (nT>0?`<div class="comp-dica" style="font-weight:800;color:#b45309;margin:10px 0 4px">🌙 Terminou mais tarde</div>`+tarde.slice(0,nT).map((x,k)=>lin(x,k,"🌙")).join(""):"")+
    `<div class="comp-dica">Média de término: <b>${hm(media)}</b> · ${L.length} dia${L.length>1?"s":""} com horário · usa o ⏹ da etapa e o ⏱️ dos livros</div>`
    :`<div class="comp-dica">Ainda não tem dia com horário de término. Use ▶ Começou / ⏹ Terminou da etapa ou o ⏱️ dos livros.</div>`)+
    `<button type="button" class="comp-ok">${deRanking?"‹ Voltar":"Ok"}</button>`;
  box.querySelector(".comp-ok").onclick=()=>deRanking?abrirRanking(mAtual):box.hidden=true;
  box.hidden=false;if(!deRanking)box.scrollIntoView({behavior:"smooth",block:"center"});
}
function abrirRanking(mAtual){
  const box=$("cartaoComp"),tot={},liv={},dias={};
  registros.forEach(r=>{if(r.releitura)return;const m=r.data.slice(0,7);tot[m]=(tot[m]||0)+r.qtd;liv[m]=(liv[m]||0)+1;(dias[m]=dias[m]||new Set()).add(r.data)});
  const ms=Object.keys(tot).sort((a,b)=>tot[b]-tot[a]),max=ms.length?tot[ms[0]]:1,med=["🥇","🥈","🥉"];
  const media=ms.length?Math.round(ms.reduce((t,m)=>t+tot[m],0)/ms.length):0;
  box.innerHTML=`<b class="comp-tit">🏆 Ranking dos meses</b>`+(ms.length?ms.map((m,k)=>{
      const fim=k===ms.length-1&&ms.length>3;
      return `<div class="rank-l${m===mAtual?" atual":""}"><span class="rk-m">${med[k]||(fim?"🔻":"")}</span><div class="rk-tx"><b>${nomeMes(m).replace(/^./,c=>c.toUpperCase())}${m===mAtual?" · este mês":""}</b><small>${liv[m]} livros · ${dias[m].size} dias</small><i style="width:${Math.max(4,Math.round(tot[m]/max*100))}%"></i></div><b class="rk-n">${tot[m].toLocaleString("pt-BR")}</b></div>`}).join("")+
    `<div class="comp-dica">Média: <b>${media.toLocaleString("pt-BR")}</b> leituras por mês · releituras não entram</div>`:`<div class="comp-dica">Ainda não tem leituras lançadas.</div>`)+
    `<button type="button" class="comp-rank" id="rkHora">⚡ Ranking por hora</button><button type="button" class="comp-rank" id="rkHorario">🕐 Ranking de horário</button><button type="button" class="comp-ok">‹ Voltar</button>`;
  box.querySelector(".comp-ok").onclick=()=>abrirComparacao(mAtual);$("rkHora").onclick=()=>abrirRankHora(mAtual,true);$("rkHorario").onclick=()=>abrirRankHorario(mAtual,true);
  box.hidden=false;
}
// ---------- 🚫 Impedimentos (opcional, guardado à parte: não mexe no total de leituras) ----------
const IMPKEY=KEY+"_impedimentos";let impedimentos=[];try{impedimentos=JSON.parse(localStorage.getItem(IMPKEY)||"[]")}catch(e){}
function salvarImp(){try{localStorage.setItem(IMPKEY,JSON.stringify(impedimentos))}catch(e){}}
function impDoMes(m,filtro){return impedimentos.filter(x=>x.data.startsWith(m)&&filtro(x))}
function editImp(id){const x=impedimentos.find(y=>String(y.id)===String(id));if(!x)return;const v=prompt("Quantidade de não lidos (Etapa "+p2(x.etapa)+", "+fmt(x.data)+"):",x.qtd);if(v===null)return;const n=Math.round(Number(v));if(!(n>=0))return alert("Número inválido.");if(n===0){impedimentos=impedimentos.filter(y=>y!==x)}else x.qtd=n;salvarImp();render()}
function delImp(id){if(!confirm("Apagar este lançamento de não lidos?"))return;impedimentos=impedimentos.filter(x=>String(x.id)!==String(id));salvarImp();render()}
// ---------- Botõezinhos de cidade ----------
let filtroCidade="";
function nomeCidade(k,m){const r=registros.find(x=>x.data.startsWith(m)&&normLoc(x.localidade)===k)||registros.find(x=>normLoc(x.localidade)===k);return r?(r.localidade||"Sem localidade").trim():k}
let filtroRel=false;
// Botão 📝 lá em cima: abre (ou fecha) a aba de releituras do mês
// 📝 lá em cima: abre direto a releitura (uma pendente) ou a listinha de todas
let rcVeioDaLista=false;
function abrirAbaRel(){
  const lim=somaDias(hoje(),-45),rels=registros.filter(r=>r.releitura&&r.data>=lim);
  if(!rels.length)return abrirListaRel();
  const pend=rels.filter(r=>confDe(r).some(x=>!x.ok));
  if(pend.length===1){rcVeioDaLista=false;return abrirConf(String(pend[0].id))}
  abrirListaRel();
}
const PRAZO_REL=7;
function prazoRel(r){if(r.aguarda)return{lim:"9999-12-31",falta:99,atr:false,aguarda:true};const base=r.voltou||r.data,lim=somaDias(base,PRAZO_REL),h=hoje();return {lim,falta:diasEntre(lim,h),atr:h>lim}}
function txtPrazoRel(r){if(r.aguarda)return `<span class="pz ag">⏳ aguardando voltar no PDA (999) · prazo ainda não conta <u class="pz-v" onclick="event.stopPropagation();voltouRel('${r.id}')">voltou hoje ✔</u></span>`;const p=prazoRel(r),d=p.lim.slice(8)+"/"+p.lim.slice(5,7),vb=r.voltou||r.data,vt=` <u class="pz-v" onclick="event.stopPropagation();mudarVoltou('${r.id}')">voltou ${vb.slice(8)}/${vb.slice(5,7)} ✏️</u>`;if(p.atr){const n=diasEntre(hoje(),p.lim);return `<span class="pz atr">🔴 releitura atrasada ${n} dia${n>1?"s":""}${vt}</span>`}return `<span class="pz">🟠 ${p.falta===0?"vence hoje":"faltam "+p.falta+" dia"+(p.falta>1?"s":"")} (até ${d})${vt}</span>`}
function mudarVoltou(id){const r=registros.find(x=>String(x.id)===String(id));if(!r)return;const b=r.voltou||r.data;
  const v=prompt("📅 Que dia esta releitura voltou no PDA? (dd/mm)\nO prazo é de 7 dias a partir desse dia.",b.slice(8)+"/"+b.slice(5,7));if(v===null)return;const m=v.trim().match(/^(\d{1,2})\/(\d{1,2})$/);if(!m)return alert("Use o formato dd/mm, ex.: 20/10");
  let a=+hoje().slice(0,4);const d=a+"-"+String(m[2]).padStart(2,"0")+"-"+String(m[1]).padStart(2,"0");r.voltou=d>hoje()?(a-1)+d.slice(4):d;delete r.aguarda;localStorage.setItem(KEY,JSON.stringify(registros));render();if(rcModo==="lista")abrirListaRel();else desenharConf()}
function relAtrasada(){const lim=somaDias(hoje(),-45);return registros.some(r=>r.releitura&&r.data>=lim&&confDe(r).some(x=>!x.ok)&&prazoRel(r).atr)}
// foto da confirmação some do celular quando a confirmação é lançada (✔, 🚩 ou recusada)
function apagaFotoConf(x){if(x&&x.foto&&x.fid){gDel(x.fid);delete x.foto}}
// ⏳ 999: releitura que ainda vai voltar no PDA (prazo não conta até voltar)
function aguardarRel(livro,q,base){const et=base?base.etapa:(etapaDoLivroConhecido(livro)||etapa);
  let r=registros.find(g=>g.releitura&&g.aguarda&&g.livro===livro);
  if(r)r.qtd=q;else{r={id:Date.now()+Math.random(),data:base?base.data:hoje(),etapa:et,livro,qtd:q,localidade:base?base.localidade:$("localidade").value.trim(),prontuario:base?base.prontuario:$("prontuario").value.trim(),releitura:true,aguarda:true,origem:"999"};registros.push(r)}
  localStorage.setItem(KEY,JSON.stringify(registros));render();setTimeout(()=>toast("⏳ Livro "+livro+": "+q+" releitura"+(q>1?"s":"")+" aguardando voltar (999) · Etapa "+p2(et)),4700)}
function voltouRel(id){const r=registros.find(x=>String(x.id)===String(id));if(!r)return;delete r.aguarda;r.voltou=hoje();localStorage.setItem(KEY,JSON.stringify(registros));render();if(rcModo==="lista")abrirListaRel();else desenharConf()}
function novaRel(){
  const l=prompt("➕ Nova releitura\n\nNúmero do livro:","");if(l===null||!l.trim())return;
  const q=parseInt(prompt("Quantas confirmações (releituras)?","1"),10);if(!(q>0))return;
  const e=parseInt(prompt("Etapa do livro (1 a 18):",String(etapaDoLivroConhecido(l.trim())||etapa)),10);if(!(e>=1&&e<=18))return alert("Etapa inválida.");
  const ag=registros.find(g=>g.releitura&&g.aguarda&&g.livro===l.trim());if(ag){delete ag.aguarda;ag.voltou=hoje();ag.qtd=q;ag.etapa=e;localStorage.setItem(KEY,JSON.stringify(registros));render();rcVeioDaLista=true;return abrirConf(String(ag.id))}
  const r={id:Date.now()+Math.random(),data:$("data").value||hoje(),voltou:hoje(),etapa:e,livro:l.trim(),qtd:q,localidade:$("localidade").value.trim(),prontuario:$("prontuario").value.trim(),releitura:true};
  registros.push(r);localStorage.setItem(KEY,JSON.stringify(registros));render();rcVeioDaLista=true;abrirConf(String(r.id))}
function relFaltaLancar(r){return r.releitura&&!r.lancPDA&&confDe(r).every(x=>x.ok)}
function lancarRel(id,sim){const r=registros.find(x=>String(x.id)===String(id));if(!r)return;
  if(sim)r.lancPDA=hoje();else delete r.lancPDA;localStorage.setItem(KEY,JSON.stringify(registros));render();
  if(sim){toast("📲 Lançada no PDA · foi pro livro "+r.livro+" da Etapa "+p2(r.etapa));if(rcVeioDaLista)return abrirListaRel()}desenharConf()}
let relVerLanc=false;
function abrirListaRel(){
  // ordem: pra confirmar · confirmada mas falta lançar no PDA · (lançadas só tocando em "ver")
  const lim=somaDias(hoje(),-45),todas=registros.filter(r=>r.releitura&&r.data>=lim),ord=r=>r.aguarda?1.5:confDe(r).some(x=>!x.ok)?0:r.lancPDA?2:1,
    feitas=todas.filter(r=>ord(r)===2),rels=todas.filter(r=>relVerLanc||ord(r)<2).sort((a,b)=>(ord(a)-ord(b))||b.data.localeCompare(a.data));
  rcModo="lista";$("rcTit").textContent="📝 Releituras";
  $("rcCorpo").innerHTML=`<div class="rc-sub">Toque numa releitura pra abrir as confirmações.</div><button type="button" class="rel-add" onclick="novaRel()">➕ Releitura</button>`+rels.map(r=>{
    const c=confDe(r),f=c.filter(x=>x.ok).length,ok=f===c.length,end=(c.find(x=>x.end)||{}).end||(r.pda&&r.pda.end)||"";
    const lan=ok&&!r.lancPDA;
    return `<button type="button" class="rel-item${ok&&!lan?" ok":""}${lan?" lan":""}" data-id="${r.id}"><span class="et">Et. ${p2(r.etapa)}</span><span class="tx"><b>Livro ${esc(r.livro)}</b> · ${fmt(r.data).slice(0,5)}<small>${esc(end||esc(r.localidade||""))}</small>${ok?(lan?'<span class="pz lan">📲 confirmada · falta lançar no PDA</span>':'<span class="pz ok">📲 lançada no PDA '+fmt(r.lancPDA).slice(0,5)+'</span>'):txtPrazoRel(r)}</span><span class="st">${c.some(x=>confRepetida(r,x))?"🔴 ":""}${r.aguarda?"⏳":ok?(lan?"🔵":"🟢 ✔"):"🟠"}</span></button>`}).join("")+
    (feitas.length?`<button type="button" class="rel-ver" id="relVerLanc">${relVerLanc?"▴ Esconder as lançadas no PDA":"🗂️ Ver as já lançadas no PDA"}</button>`:"")+(!rels.length?'<div class="hint" style="margin-top:8px">Nada pra confirmar nem pra lançar. 👍</div>':"");
  $("rcCorpo").querySelectorAll(".rel-item").forEach(b=>b.onclick=()=>{rcVeioDaLista=true;abrirConf(b.dataset.id)});
  {const v=$("relVerLanc");if(v)v.onclick=()=>{relVerLanc=!relVerLanc;abrirListaRel()}}
  $("rcFundo").hidden=false;
}
function abrirAbaRelAntiga(){
  const m=mes(),tem=registros.some(r=>r.releitura&&r.data.startsWith(m));
  if(!tem&&!filtroRel)return alert("📝 Nenhuma releitura lançada em "+nomeMes(m)+".\n\nPra lançar: digite o livro e a quantidade, marque REL. e toque no ✔.");
  filtroRel=!filtroRel;filtroCidade="";$("lista").hidden=false;$("listaSeta").textContent="▲";render();
  if(filtroRel)$("listaHead").scrollIntoView({behavior:"smooth",block:"start"});
}
function desenharCidades(m){
  const tot={};registros.forEach(r=>{if(!r.data.startsWith(m))return;const k=normLoc(r.localidade);tot[k]=(tot[k]||0)+(r.releitura?0:r.qtd)});
  const ks=Object.keys(tot).sort((a,b)=>tot[b]-tot[a]),box=$("cidades");
  const rels=registros.filter(r=>r.releitura&&r.data.startsWith(m)),pend=rels.filter(r=>!r.aguarda&&confDe(r).some(x=>!x.ok)).length;
  if(!rels.length)filtroRel=false;
  {const rb=$("relBtn"),bd=$("relBadge");if(rb){rb.classList.toggle("ativa",filtroRel);bd.hidden=false;bd.textContent="";const lanc=registros.some(r=>r.data>=somaDias(hoje(),-45)&&relFaltaLancar(r));bd.classList.toggle("ok",!pend&&!lanc);const ra=relAtrasada();bd.classList.toggle("atr",ra);if(ra)bd.classList.remove("ok");rb.title=ra?"Releitura passou da semana":pend?"Tem releitura pra confirmar":lanc?"Tem releitura confirmada pra lançar no PDA":"Releituras: tudo confirmado (toque pra consultar)"}}
  if(filtroCidade&&!tot[filtroCidade])filtroCidade="";
  const mostraCid=ks.length>=2;
  if(!mostraCid&&!rels.length){box.hidden=true;return}
  // 🤝 os botões das cidades foram pro selinho "🤝 Ajuda ▾" lá em cima; aqui só aparece a faixinha pra voltar quando está filtrando
  if(!filtroCidade&&!filtroRel){box.hidden=true;box.innerHTML="";return}
  box.hidden=false;
  box.innerHTML=filtroCidade?`<button type="button" class="cid-volta">📍 <b>${esc(nomeCidade(filtroCidade,m))}</b> <small>${(tot[filtroCidade]||0).toLocaleString("pt-BR")} leituras no mês</small><span>✕ ver todas</span></button>`
    :`<button type="button" class="cid-volta">📝 <b>Releituras</b><span>✕ voltar pra etapa</span></button>`;
  box.querySelector(".cid-volta").onclick=()=>{filtroRel=false;filtroCidade="";render()};
}
// Digitou um livro que tem rota salva: mostra o atalho
document.addEventListener("input",e=>{const i=e.target;if(!i.classList||!i.classList.contains("r-livro"))return;const row=i.closest(".livro-row");if(!row)return;let d=row.querySelector(".rota-dica");const rt=rotas[i.value.trim()];if(rt&&rt.ruas.some(Boolean)){if(!d){d=document.createElement("button");d.type="button";d.className="voltar-lista rota-dica";d.style.gridColumn="1/-1";d.style.background="#eff6ff";d.style.borderColor="#93c5fd";d.style.color="#1e40af";row.appendChild(d)}d.textContent="🗺️ Rota salva deste livro: "+rt.ruas.filter(Boolean).length+" rua(s) — toque pra ver";d.onclick=()=>abrirRota(i.value.trim())}else if(d)d.remove()});
// 🛡️ brasão de Tatuí (pequeno, ~2 KB) no selinho da sua cidade
const BRASAO_TATUI="data:image/png;base64,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";
// 🤝 só as cidades onde você ajudou (sua cidade fica no selinho 📍 ao lado)
// ⏳ quadro de horas da etapa: mostra só o resumo; o resto (base, por livro, rankings) abre na setinha ▾
let hrAberto=false;try{hrAberto=localStorage.getItem(KEY+"_hr_aberto")==="1"}catch(e){}
function recolherHora(hb){const et=hb.querySelector(".hr-et");if(!et)return;const ch=[...et.children];let k=0;
  if(ch[0]&&ch[0].classList.contains("hr-lin"))k=ch[1]&&ch[1].classList.contains("hr-res")?2:1;else if(ch[0]&&ch[0].classList.contains("hr-res"))k=1;else return;
  const resto=ch.slice(k);if(!resto.length)return;const box=document.createElement("div");box.className="hr-mais";box.hidden=!hrAberto;resto.forEach(e=>box.appendChild(e));et.appendChild(box);
  const bt=document.createElement("button");bt.type="button";bt.className="hr-seta";bt.textContent=hrAberto?"▴ menos":"▾ mais";bt.setAttribute("aria-label",hrAberto?"Esconder detalhes das horas":"Ver detalhes das horas");
  bt.onclick=e=>{e.stopPropagation();hrAberto=!hrAberto;try{localStorage.setItem(KEY+"_hr_aberto",hrAberto?"1":"0")}catch(x){}box.hidden=!hrAberto;bt.textContent=hrAberto?"▴ menos":"▾ mais";bt.setAttribute("aria-label",hrAberto?"Esconder detalhes das horas":"Ver detalhes das horas")};
  const alvo=ch[k-1];if(alvo.classList.contains("hr-res")){alvo.appendChild(bt)}else{et.insertBefore(bt,box)}}
function abrirAjudaMes(m){const box=$("cartaoComp"),cp=cidadePrincipal(),tot={},liv={};registros.forEach(r=>{if(r.data.startsWith(m)&&!r.releitura&&r.qtd){const k=normLoc(r.localidade);if(k===cp)return;tot[k]=(tot[k]||0)+r.qtd;liv[k]=(liv[k]||0)+1}});
  const ks=Object.keys(tot).sort((a,b)=>tot[b]-tot[a]),q=ks.reduce((t,k)=>t+tot[k],0);
  box.innerHTML=`<b class="comp-tit" style="color:#9a3412!important">🤝 Ajuda em ${nomeMes(m)}</b>`+ks.map(k=>`<div class="comp-linha" data-cid="${esc(k)}"><div><b>📍 ${esc(nomeCidade(k,m))}</b><small>${liv[k]} livro${liv[k]>1?"s":""} · toque pra ver os livros</small></div><b>${tot[k].toLocaleString("pt-BR")} ›</b></div>`).join("")+
    `<div class="comp-linha sel" style="cursor:default"><div><b>Total da ajuda</b><small>${ks.length} cidade${ks.length>1?"s":""}</small></div><b>${q.toLocaleString("pt-BR")}</b></div>${filtroCidade&&tot[filtroCidade]?'<button type="button" class="comp-rank" id="ajTodas">✕ Ver todas as cidades</button>':""}<button type="button" class="comp-ok">Ok</button>`;
  box.querySelector(".comp-ok").onclick=()=>box.hidden=true;const vt=$("ajTodas");if(vt)vt.onclick=()=>{box.hidden=true;filtroCidade="";render()};
  box.querySelectorAll("[data-cid]").forEach(l=>l.onclick=()=>{box.hidden=true;filtroRel=false;filtroCidade=l.dataset.cid;$("lista").hidden=false;$("listaSeta").textContent="▲";render();$("listaHead").scrollIntoView({behavior:"smooth",block:"start"})});
  box.hidden=false}
function abrirTotalCidades(){
  const m=mes(),tot={};registros.forEach(r=>{if(r.data.startsWith(m)){const k=normLoc(r.localidade);tot[k]=(tot[k]||0)+(r.releitura?0:r.qtd)}});
  const ks=Object.keys(tot).sort((a,b)=>tot[b]-tot[a]),geral=ks.reduce((t,k)=>t+tot[k],0),cp=cidadePrincipal(),box=$("cartaoComp");
  if(!geral)return;
  const ajuda=ks.filter(k=>k!==cp).reduce((t,k)=>t+tot[k],0);
  box.innerHTML=`<b class="comp-tit">📊 Leituras de ${nomeMes(m)}</b>`+ks.map(k=>`<div class="comp-linha" data-cid="${esc(k)}"><div><b>📍 ${esc(nomeCidade(k,m))}</b><small>${k===cp?"sua cidade":"ajuda"} · toque pra ver os livros</small></div><b>${tot[k].toLocaleString("pt-BR")} ›</b></div>`).join("")+
    (()=>{const nlLiv=mm=>registros.filter(r=>r.data.startsWith(mm)).reduce((t,r)=>t+(r.nl||0),0),im=impDoMes(m,()=>true).reduce((t,x)=>t+x.qtd,0)+nlLiv(m),ia=impDoMes(somaMes(m,-1),()=>true).reduce((t,x)=>t+x.qtd,0)+nlLiv(somaMes(m,-1));if(!im&&!ia)return "";
      const pc=geral?(im/geral*100).toFixed(1).replace(".",","):"0",dif=ia?Math.round((im-ia)/ia*100):null;
      return `<div class="comp-linha" data-nl="1" style="border-color:#fecaca;background:#fef2f2"><div><b style="color:#b91c1c">🚫 Não lidos</b><small>${pc}% do total${ia?` · ${nomeMes(somaMes(m,-1))}: ${ia}`:""} · toque pra ver a lista ›</small></div><span style="text-align:right"><b style="color:#b91c1c">${im}</b>${dif!=null?`<small style="display:block;font-size:10px;font-weight:800;color:${dif>0?"#b91c1c":"#15803d"}">${dif>0?"▲ "+dif+"% a mais":dif<0?"▼ "+Math.abs(dif)+"% a menos":"igual"}</small>`:""}</span></div>`})()+
    `<div class="comp-linha sel" style="cursor:default"><div><b>Total geral</b>${ajuda&&cp&&tot[cp]?`<small>${esc(nomeCidade(cp,m))} ${tot[cp].toLocaleString("pt-BR")} + ajuda ${ajuda.toLocaleString("pt-BR")}</small>`:""}</div><b>${geral.toLocaleString("pt-BR")}</b></div><button type="button" class="comp-ok">Ok</button>`;
  box.querySelector(".comp-ok").onclick=()=>box.hidden=true;
  box.querySelectorAll("[data-nl]").forEach(l=>l.onclick=()=>abrirNaoLidosMes(m));
  // tocou numa cidade: fecha e mostra a lista dos livros dela lá embaixo
  box.querySelectorAll("[data-cid]").forEach(l=>l.onclick=()=>{box.hidden=true;filtroCidade=ks.length>1?l.dataset.cid:"";$("lista").hidden=false;$("listaSeta").textContent="▲";render();$("listaHead").scrollIntoView({behavior:"smooth",block:"start"})});
  box.hidden=false;
}
// ---------- 🚫 Lista de todos os não lidos do mês ----------
(function(){const box=$("cartaoComp");if(!box)return;const pX=()=>{if(box.hidden||box.querySelector(":scope>.cc-x"))return;const x=document.createElement("button");x.type="button";x.className="cc-x";x.textContent="✕";x.setAttribute("aria-label","Fechar");x.onclick=()=>{box.hidden=true};box.prepend(x)};
  new MutationObserver(pX).observe(box,{childList:true,attributes:true,attributeFilter:["hidden"]});pX()})();
// 📍 endereço pra mostrar nos não lidos: o dos impedimentos (foto do 002) ou, se não tiver, onde o livro começa
function endDoLivro(l,r){const e=(r&&r.pda&&r.pda.end)||(()=>{const x=registros.filter(y=>y.livro===l&&y.pda&&y.pda.end).sort((a,b)=>b.data.localeCompare(a.data))[0];return x?x.pda.end:""})()||((rotas[l]&&rotas[l].ruas||[]).find(Boolean)||"");return String(e).split(",").slice(0,2).join(",").trim()}
function endsNl(r){return (r&&r.impLista||[]).filter(i=>i&&(i.end||i.md))}
function htmlEndsNl(r){const L=endsNl(r);if(L.length)return L.map(i=>`<small class="nl-end">📍 ${esc(i.end||"sem endereço")}${i.md?" · MD "+esc(i.md):""}</small>`).join("");
  const e=endDoLivro(r.livro,r);return e?`<small class="nl-end">🏠 Livro começa: ${esc(e)}</small>`:""}
function abrirNaoLidosMes(m){
  const box=$("cartaoComp");
  const itens=[];
  impDoMes(m,()=>true).forEach(x=>itens.push({tipo:"dia",id:x.id,data:x.data,etapa:x.etapa,loc:x.localidade||"",liv:"",q:x.qtd}));
  registros.filter(r=>r.data.startsWith(m)&&r.nl>0).forEach(r=>itens.push({tipo:"livro",id:r.id,data:r.data,etapa:r.etapa,loc:r.localidade||"",liv:r.livro||"",q:r.nl,ends:htmlEndsNl(r)}));
  itens.sort((a,b)=>a.etapa-b.etapa||a.data.localeCompare(b.data));
  const tot=itens.reduce((t,x)=>t+x.q,0);
  const linhas=itens.map((x,i)=>`<div class="comp-linha" data-i="${i}" style="border-color:#fecaca"><div><b>Etapa ${p2(x.etapa)} · ${fmt(x.data)}</b><small>${x.tipo==="livro"?"📖 Livro "+esc(x.liv):"🚫 lançado no dia"}${x.loc?" · "+esc(x.loc):""}</small>${x.ends||""}</div><b style="color:#b91c1c">${x.q} ✏️</b></div>`).join("");
  box.innerHTML=`<b class="comp-tit" style="color:#b91c1c!important">🚫 Não lidos de ${nomeMes(m)}</b><div class="comp-linha sel" style="cursor:default"><div><b>Total</b><small>${itens.length} lançamento(s)</small></div><b>${tot}</b></div>${linhas||'<div class="comp-dica">Nenhum não lido neste mês.</div>'}<div class="comp-dica">Toque num item para editar.</div><button type="button" class="comp-volta">‹ Voltar</button><button type="button" class="comp-ok">Ok</button>`;
  box.querySelector(".comp-ok").onclick=()=>box.hidden=true;
  box.querySelector(".comp-volta").onclick=abrirTotalCidades;
  box.querySelectorAll("[data-i]").forEach(l=>l.onclick=()=>{const x=itens[+l.dataset.i];
    if(x.tipo==="dia"){editImp(x.id);abrirNaoLidosMes(m)}else{box.hidden=true;editar(x.id)}});
  box.hidden=false;
}
// ---------- 🤝 Ajuda em outra cidade ----------
let ajuda=null; // {loc,pront,etapa} = o que estava antes, pra voltar depois
function cidadesJaAjudadas(){const set={};registros.forEach(r=>{if(r.ajuda&&r.localidade)set[normLoc(r.localidade)]=r.localidade.trim()});return Object.values(set)}
function entrarAjuda(){
  ajuda={loc:$("localidade").value,pront:$("prontuario").value,etapa};
  $("cardLancar").classList.add("em-ajuda");$("ajudaBtn").textContent="🤝 Ajuda";
  $("cidadesAjuda").innerHTML=cidadesJaAjudadas().map(c=>`<option value="${esc(c)}">`).join("");
  $("localidade").setAttribute("list","cidadesAjuda");$("localidade").value="";$("localidade").placeholder="Qual cidade?";
  atualizarFaixaAjuda();render();setTimeout(()=>$("localidade").focus(),50);
}
function sairAjuda(){
  if(!ajuda)return;const a=ajuda;ajuda=null;
  $("cardLancar").classList.remove("em-ajuda");$("ajudaBtn").textContent="🤝";$("ajudaFaixa").hidden=true;
  $("localidade").removeAttribute("list");$("localidade").placeholder="Digite a localidade";
  $("localidade").value=a.loc;$("prontuario").value=a.pront;salvarRascunho();sel(a.etapa,false);
}
function atualizarFaixaAjuda(){
  if(!ajuda)return;const c=$("localidade").value.trim(),f=$("ajudaFaixa");f.hidden=false;
  f.innerHTML=`<span>🤝 Ajuda${c?" em "+esc(c):""} · escolha a etapa deles lá em cima. Depois de salvar volta pra ${esc(ajuda.loc.trim()||"sua cidade")}.</span><button type="button" id="ajudaCancelar">Cancelar</button>`;
  $("ajudaCancelar").onclick=sairAjuda;
}
function render(){atualizarNomes();
  const m=mes(),tot=registros.filter(r=>r.data.startsWith(m)&&!r.releitura).reduce((s,r)=>s+r.qtd,0);
  $("total").textContent=tot.toLocaleString("pt-BR");
  // 📍 sua cidade e 🤝 ajuda (outras cidades) no mês — só aparecem quando teve ajuda
  {const m=mes(),cp=cidadePrincipal(),tot={};registros.forEach(r=>{if(r.data.startsWith(m)&&!r.releitura&&r.qtd){const k=normLoc(r.localidade);tot[k]=(tot[k]||0)+r.qtd}});
   const ks=Object.keys(tot),aj=ks.filter(k=>k!==cp),qa=aj.reduce((t,k)=>t+tot[k],0),b1=$("cpMesBtn"),b2=$("ajMesBtn"),tem=aj.length>0&&!!tot[cp];
   if(b1){b1.hidden=!tem;if(tem){b1.innerHTML=(/^tatu[ií]/i.test(nomeCidade(cp,m))?`<img class="brasao" src="${BRASAO_TATUI}" alt="Tatuí">`:"📍 "+esc(nomeCidade(cp,m)))+" "+tot[cp].toLocaleString("pt-BR");b1.setAttribute("aria-label",nomeCidade(cp,m)+": "+tot[cp].toLocaleString("pt-BR")+" leituras");b1.classList.toggle("ativa",filtroCidade===cp&&!filtroRel);b1.title="Leituras em "+nomeCidade(cp,m)+" no mês — toque pra ver só os livros daqui";
     b1.onclick=()=>{filtroRel=false;filtroCidade=filtroCidade===cp?"":cp;$("lista").hidden=false;$("listaSeta").textContent="▲";render();if(filtroCidade)$("listaHead").scrollIntoView({behavior:"smooth",block:"start"})}}}
   if(b2){const so=aj.length>0&&(tem||ks.length>=2);b2.hidden=!so;if(so){b2.textContent="🤝 Ajuda ▾";b2.classList.toggle("ativa",!!filtroCidade&&aj.includes(filtroCidade)&&!filtroRel);b2.title="Ajuda em outras cidades: "+qa.toLocaleString("pt-BR")+" leituras — toque pra ver";b2.setAttribute("aria-label",b2.title);b2.onclick=()=>abrirAjudaMes(m)}}}
  // ⏳ total de horas trabalhadas no mês (sempre à vista; toque abre por etapa)
  {const b=$("hrMesBtn"),h=horasMes(mes());if(b){b.hidden=!h.min;if(h.min){b.textContent="⏳ "+fmtDur(h.min);b.title=fmtDur(h.min)+" trabalhadas no mês — toque pra ver por etapa";b.setAttribute("aria-label",b.title);b.onclick=()=>abrirHorasMes(mes())}}}
  // 🚫 total de não lidos do mês (sempre à vista; toque abre a lista)
  {const b=$("nlMesBtn"),m=mes(),nlLiv=mm=>registros.filter(r=>r.data.startsWith(mm)).reduce((t,r)=>t+(r.nl||0),0),soma=mm=>impDoMes(mm,()=>true).reduce((t,x)=>t+x.qtd,0)+nlLiv(mm),
     im=soma(m),ia=soma(somaMes(m,-1)),ger=registros.filter(r=>r.data.startsWith(m)&&!r.releitura).reduce((t,r)=>t+(r.qtd||0),0);
   if(b){b.hidden=!im;if(im){const pc=ger?(im/ger*100).toFixed(1).replace(".",","):"0";
     b.innerHTML=`🚫 ${im.toLocaleString("pt-BR")}`;b.title=im+" não lido"+(im>1?"s":"")+" no mês · "+pc+"% das leituras"+(ia?" · "+nomeMes(somaMes(m,-1)).split(" ")[0]+": "+ia:"")+" — toque pra ver a lista";b.setAttribute("aria-label",b.title);
     b.onclick=()=>abrirNaoLidosMes(m)}}}
  atualizarComparacao(m,tot);$("mesNome").textContent=nomeMes(m).slice(0,3)+"/"+m.slice(2,4);atualizarDesfazer();$("mesLista").textContent=nomeMes(m);$("mesPicker").value=m;
  desenharCidades(m);
  // Cidade escolhida: mostra todos os livros dela no mês (com a etapa de cada um). "Todas": só a etapa atual, como sempre.
  const rs=(filtroRel
    ?registros.filter(r=>r.data.startsWith(m)&&r.releitura).sort((a,b)=>(confDe(a).every(x=>x.ok)-confDe(b).every(x=>x.ok))||a.etapa-b.etapa)
    :filtroCidade
    ?registros.filter(r=>r.data.startsWith(m)&&normLoc(r.localidade)===filtroCidade)
    :registros.filter(r=>r.etapa===etapa&&r.data.startsWith(m))).sort((a,b)=>filtroRel?0:filtroCidade?(a.etapa-b.etapa||a.data.localeCompare(b.data)):(b.data.localeCompare(a.data)||b.id-a.id));
  $("listaTit").innerHTML=filtroRel?"📝 Releituras":filtroCidade?"📍 "+esc(nomeCidade(filtroCidade,m)):'📋 ETAPA <span id="etapaLista">'+p2(etapa)+'</span>';
  const imps=impDoMes(m,x=>filtroRel?false:filtroCidade?normLoc(x.localidade)===filtroCidade:x.etapa===etapa).sort((a,b)=>a.etapa-b.etapa||a.data.localeCompare(b.data));
  const totImp=imps.reduce((t,x)=>t+x.qtd,0)+rs.reduce((t,r)=>t+(r.nl||0),0);
  const qtRel=rs.filter(r=>r.releitura).length,qtLiv=rs.length-qtRel;
  $("nreg").innerHTML=qtLiv+(qtLiv===1?" livro":" livros")+(qtRel?` · <span style="color:#b45309;font-weight:700">${qtRel} ${qtRel===1?"livro":"livros"} de releitura</span>`:"")+(totImp?` · <span class="imp-tag">🚫 ${totImp} não lidos${(q=>pctNL(totImp,q)?" · "+pctNL(totImp,q):"")(rs.filter(r=>!r.releitura).reduce((s,r)=>s+r.qtd,0))}</span>`:"");
  $("totEtapa").textContent=rs.filter(r=>!r.releitura).reduce((s,r)=>s+r.qtd,0).toLocaleString("pt-BR")+" leituras";
  {const q0=rs.filter(r=>!r.releitura&&!predios[r.livro]).reduce((s,r)=>s+qBob(r.livro,r.qtd,r),0),qp=rs.filter(r=>!r.releitura&&predios[r.livro]).reduce((s,r)=>s+r.qtd,0),qi=rs.filter(r=>!r.releitura&&predios[r.livro]).reduce((s,r)=>s+qImp(r.livro,r.qtd),0),q=q0+qi,tb=$("totBob");
   tb.hidden=(!q&&!qp)||filtroRel;tb.textContent=q?"🧾 "+bobinas(q):"🧾 0";tb.title="Cabem "+bobinas(q)*porBobina+" leituras ("+porBobina+" por bobina)"+(qp?" · do prédio só entram as que imprimem":"")+". Toque pra mudar."}
  const nRel=rs.filter(r=>r.releitura).reduce((s,r)=>s+r.qtd,0);$("totRel").hidden=!nRel;$("totRel").textContent=nRel.toLocaleString("pt-BR")+(nRel===1?" releitura":" releituras");
  $("totEtapa").hidden=filtroRel;if(filtroRel){const pend=rs.filter(r=>confDe(r).some(x=>!x.ok)).length;$("nreg").innerHTML=rs.length+" livro"+(rs.length>1?"s":"")+" de releitura"+(pend?` · <span style="color:#b45309;font-weight:700">${pend} pendente${pend>1?"s":""}</span>`:" · tudo confirmado ✔")}
  const itemHtml=r=>(r.releitura&&!filtroRel)?`<div class="item rel-mini"><div>📝 <b>${esc(r.livro)}</b> · ${r.qtd} releitura${r.qtd>1?"s":""}${chipConf(r).replace("<br>","")}</div><div class="item-btns"><button onclick="editar('${r.id}')" aria-label="Editar">✏️</button><button onclick="del('${r.id}')" aria-label="Excluir">🗑️</button></div></div>`:`<div class="item"><div>${r.ajuda?`<span class="ajuda-tag">🤝 ajuda</span> `:""}${filtroCidade||filtroRel?`<span class="et-tag">Etapa ${p2(r.etapa)}</span> `:""}${r.releitura?'<span class="rel-tag">📝 releitura</span> ':""}<b class="num-livro">${esc(r.livro)}</b>${(()=>{const x=r.releitura?null:nlAnterior(r.livro,r.data);return x?`<span class="nl-ant">🚫 ${rotMesNl(x.data,r.data)}: ${x.nl}</span>`:""})()}${r.releitura?"":`<button type="button" class="nl-livro" onclick="nlDoLivro('${r.id}')" title="Foto do Resumo por Mensagem do PDA: o app separa não lidos (002, 009, 041), leituras feitas e 999"><span class="flag-x">🚩</span><small class="f002">RESUMO</small></button>`} · ${esc(r.localidade||"Sem localidade")}${r.prontuario?` · <span class="pront-tag">Pront. ${esc(r.prontuario)}</span>`:""}${r.nl?` · <span class="imp-tag">🚫 ${r.nl} não lidos${pctNL(r.nl,r.qtd)?" · "+pctNL(r.nl,r.qtd):""}</span>`:""}${r.ina?` · <span class="ina-tag" title="082 inativo desligado: não imprime">🔌 ${r.ina} inativos</span>`:""}<br>${(()=>{const c=r.releitura?null:cicloReal(r.data,r.etapa,normLoc(r.localidade));const dt=`<label class="dt-edit" title="Toque pra trocar a data">${fmt(r.data)}<input type="date" value="${r.data}" onchange="mudarDataLivro('${r.id}',this)"></label>`;return foraDoLimite(c)?`<span class="dt-atraso">${dt} · ${c} dias</span>`:dt+(c!=null?` · <span class="dt-ok">${c} dias</span>`:"")})()}${(()=>{const d=diaDaEtapa(r.data.slice(0,7),r.etapa);return d?' · <span class="cal-tag">📅 '+d.slice(8)+'/'+d.slice(5,7)+'</span>':""})()}${livroAtrasoTag(r)} · ${r.particionado?r.de+" até "+r.ate+" · ":""}<span class="qtd-tag"><b>${r.qtd}</b> ${r.releitura?'<span style="color:#b45309;font-weight:700">releituras</span>':"leituras"}</span>${(!r.releitura&&!predios[r.livro]&&r.qtd>0)?` · <span class="bob-livro" title="${porBobina} leituras por bobina">${txtBob(qBob(r.livro,r.qtd,r))}</span>`:""}${r.com&&r.com.length?`<br><span class="com-tag">👥 com ${esc(r.com.join(", "))}</span>`:""}${pdaDetalhe(r)}${r.releitura?chipConf(r):""}${predios[r.livro]&&!r.releitura?`<br><span class="predio-tag">🏢 prédio</span> <button type="button" class="imp-pred${imprimir[r.livro]?"":" vazio"}" onclick="impPredio('${r.id}')">🖨️ ${imprimir[r.livro]?qImp(r.livro,r.qtd)+" pra imprimir · "+txtBob(qImp(r.livro,r.qtd)):"quantas imprimem?"}</button><button type="button" class="imp-cam" onclick="impFotoDireto('${r.id}')" aria-label="Foto da Fila de Impressão" title="Foto da Fila de Impressão">📷 FILA</button>`:""}${resseq[r.livro]?` <span class="resseq-tag"${resseq[r.livro].quando.slice(0,7)<r.data.slice(0,7)?"":` role="button" aria-label="Marcado pra sequenciar no mês que vem" onclick="alert('🗂️ Marcado pra sequenciar no mês que vem.\\n\\nNo mês que vem o app avisa quando você lançar este livro.')"`}>🗂️${resseq[r.livro].quando.slice(0,7)<r.data.slice(0,7)?" sequenciar este livro":""}${resseq[r.livro].nota?" · "+esc(resseq[r.livro].nota):""}</span>`:""}${resseqHist[r.livro]&&resseqHist[r.livro].quando.slice(0,7)===r.data.slice(0,7)?` <span class="resseq-tag">🗂️ sequenciado ${resseqHist[r.livro].quem==="eu"?"por mim":"por "+esc(resseqHist[r.livro].quem)}</span>`:""}${rotas[r.livro]&&rotas[r.livro].ruas.length?` <span class="rota-tag">🗺️ ${rotas[r.livro].ruas.length} rua(s)</span>`:""}${r.releitura?"":tagHoraLivro(r)}</div><div class="item-btns"><button onclick="marcarPredio('${r.id}')" aria-label="Prédio" title="Prédio: não entra na conta das bobinas"${predios[r.livro]?' class="predio-on"':""}><span class="ib-e">🏢</span><span class="ib-n">Prédio</span></button><button onclick="marcarResseq('${r.id}')" aria-label="Sequenciar livro" title="Sequenciar livro: avisar no mês que vem"${resseq[r.livro]?' class="resseq-on"':""}><span class="ib-e">🗂️</span><span class="ib-n">Seq. livro</span></button><button onclick="abrirRota('${esc(r.livro)}')" aria-label="Rota do livro" title="Rota do livro"><span class="ib-e">🗺️</span><span class="ib-n">Mapa</span></button><button onclick="horaLivro('${r.id}')" aria-label="Hora do livro" title="Que horas começou e terminou este livro"${r.ini||r.fim?' class="hr-on"':""}><span class="ib-e">⏱️</span><span class="ib-n">Tempo</span></button><button onclick="editar('${r.id}')" aria-label="Editar"><span class="ib-e">✏️</span><span class="ib-n">Editar</span></button><button onclick="del('${r.id}')" aria-label="Excluir"><span class="ib-e">🗑️</span><span class="ib-n">Lixeira</span></button></div></div>`;
  const cpL=cidadePrincipal(),cidadesDaLista=[...new Set(rs.map(r=>normLoc(r.localidade)))].sort((x,y)=>(y===cpL)-(x===cpL));
  if(rs.length&&!filtroCidade&&cidadesDaLista.length>1){
    // mesma etapa em mais de uma cidade: separa com o subtotal de cada uma
    $("lista").innerHTML=cidadesDaLista.map(k=>{const g=rs.filter(r=>normLoc(r.localidade)===k);return `<div class="grupo-cid">📍 ${esc(nomeCidade(k,m))} <span>${g.reduce((t,r)=>t+r.qtd,0).toLocaleString("pt-BR")} leituras · ${g.length} livro(s)</span></div>`+g.map(itemHtml).join("")}).join("");
  }else $("lista").innerHTML=rs.length?rs.map(itemHtml).join(""):(imps.length?"":"<div style='font-size:13px;color:#6b7280;padding:8px 0'>Nenhum registro desta etapa neste mês.</div>");
  if(imps.length)$("lista").innerHTML+=imps.map(x=>`<div class="imp-item"><span>🚫 ${x.qtd} não lido(s) · ${filtroCidade?"Etapa "+p2(x.etapa)+" · ":""}${fmt(x.data)} · ${esc(x.localidade||"")}${x.ajuda?" 🤝":""}</span><span style="flex:none"><button type="button" onclick="editImp('${x.id}')" aria-label="Corrigir">✏️</button><button type="button" onclick="delImp('${x.id}')" aria-label="Apagar">🗑️</button></span></div>`).join("");
  {const av=$("resseqAviso"),lst=(filtroRel||filtroCidade)?[]:resseqDoMes(m,etapa);
   // 🖨️ prédio que imprimiu no mês passado e ainda não foi lançado neste mês
   const pi=(filtroRel||filtroCidade)?[]:Object.entries(imprimir).filter(([l,v])=>predios[l]&&v.quando<m&&registros.some(r=>r.livro===l&&r.etapa===etapa&&r.data.startsWith(v.quando))&&!registros.some(r=>r.livro===l&&r.data.startsWith(m)));
   const gq=(filtroRel||filtroCidade)?[]:guard.filter(g=>g.etapa===etapa);
   av.hidden=!lst.length&&!pi.length&&!gq.length;
   av.innerHTML=(gq.length?`<button type="button" class="imp-aviso gd-aviso" onclick="guardEt=${etapa};abrirGuard()">🎞️ Tem leitura arquivada desta etapa pra lançar no PDA<small>toque pra ver a foto</small></button>`:"")+pi.map(([l,v])=>`<div class="imp-aviso">🖨️ Prédio · livro <b>${esc(l)}</b>: em ${nomeMes(v.quando)} saíram <b>${v.q}</b> pra imprimir → ${txtBob(v.q)||"🧾 0"}<small>quando lançar, a conta já usa esse número · 📷 no livro pra atualizar</small></div>`).join("")+lst.map(([l,v])=>`<button type="button" class="resseq-aviso" data-l="${esc(l)}">🗂️ Sequenciar o livro <b>${esc(l)}</b>${v.nota?" · "+esc(v.nota):""}<small>marcado em ${fmt(v.quando)} · toque: foi sequenciado? sim ou não</small></button>`).join("");
   av.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>perguntaSeq(b.dataset.l))}
  // ⚫ atalho: etapa do dia (ou que já passou) sem nenhum livro → marcar "não fiz" sem ir no calendário
  {const nb=$("nfRapido"),dE=diaDaEtapa(m,etapa),h0=hoje(),sem=!registros.some(r=>r.etapa===etapa&&r.data.startsWith(m)&&!r.releitura);
   // lançou livro nessa etapa? então foi feita: tira o "não fiz" sozinho
   if(dE&&!sem&&naoFiz[dE]){delete naoFiz[dE];salvarNaoFiz()}
   const mostra=!ajuda&&!filtroRel&&!filtroCidade&&dE&&dE<=h0&&sem;
   nb.hidden=!mostra;
   if(mostra){const o=naoFiz[dE];
     nb.innerHTML=o?`<div class="nf-rap feito"><span>⚫ Etapa ${p2(etapa)} (${dE.slice(8)}/${dE.slice(5,7)}): não fiz<small>📝 ${esc(o==="outro serviço"?"li em outro lugar":o)}</small></span><button type="button" data-nf="obs">✏️</button><button type="button" data-nf="des">↩</button></div>`
       :(nfAberto===dE+etapa?`<div class="nf-rap aberto"><b>Etapa ${p2(etapa)} (${dE.slice(8)}/${dE.slice(5,7)}) sem lançamento:</b><div class="nf-ops"><button type="button" data-nf="esq">🗓️ Esqueci de lançar<small>lançar agora com a data ${dE.slice(8)}/${dE.slice(5,7)}</small></button><button type="button" data-nf="marca" class="pret">⚫ Não fiz<small>outro agente fez / observação</small></button></div><button type="button" data-nf="fecha" class="nf-x">✕</button></div>`
        :`<button type="button" class="nf-rap" data-nf="abre">⚪ Etapa ${p2(etapa)} (${dE.slice(8)}/${dE.slice(5,7)}) sem lançamento <span style="margin-left:auto">▾</span></button>`);
     nb.querySelectorAll("[data-nf]").forEach(b=>b.onclick=async()=>{const a=b.dataset.nf;
       if(a==="abre"){nfAberto=dE+etapa;render();return}
       if(a==="fecha"){nfAberto="";render();return}
       if(a==="esq"){nfAberto="";const h=$("data").value||hoje();if(dE!==h){esqueci={etapa,dia:dE,voltar:h};dataManual=true;$("data").value=dE;mesVer=dE.slice(0,7);sel(etapa,false)}else render();irParaLivro();const l=document.querySelector("#livroRows .r-livro");if(l)l.focus();return}
       nfAberto="";
       if(a==="des"){if(!confirm("Desfazer o \"não fiz\" da Etapa "+p2(etapa)+"?"))return;delete naoFiz[dE]}
       else{const x=await pedirObsNaoFiz(naoFiz[dE]||"");if(x===null)return;naoFiz[dE]=x}
       salvarNaoFiz();render()});
   }}
  // ⏱️ hora que começou / terminou a etapa + leituras por hora
  {const hb=$("horaEtapa"),k=m+"|"+etapa,v=horas[k]||{},q=leitEtapa(m,etapa),dE=diaDaEtapa(m,etapa);
   const mostra=!filtroRel&&!filtroCidade&&(q>0||dE===hoje()||v.ini||v.fim);hb.hidden=!mostra;
   const el=etapaLivros(m,etapa);
   if(mostra){const du=el.n?el.min:duracao(v),ph=el.n?porHora(el.q,el.min):porHora(q,du),b=baseHoras();
     let base="";if(b.media){base=`📊 Sua base: <b>${b.media}</b> leituras/hora`+(b.n>1?` · média de ${b.n} etapas`:"")+(b.melhor>b.media?` · 🏆 melhor ${b.melhor}/h`:"");
       if(ph&&b.n>1)base+=ph>b.media?` · <span style="color:#15803d">▲ acima da base</span>`:ph<b.media?` · <span style="color:#b45309">▼ abaixo da base</span>`:" · = na base"}
     const ea=etapaLivros(somaMes(m,-1),etapa),metaE=ea.n?`<div class="hr-base">🎯 Mês passado esta etapa: <b>${fmtDur(ea.min)}</b> trabalhadas · ${porHora(ea.q,ea.min)}/h${el.n?(el.min<ea.min?' · <span style="color:#15803d">▲ mais rápido</span>':el.min>ea.min?' · <span style="color:#b45309">▼ mais devagar</span>':""):""}</div>`:"";
     if(el.n){hb.innerHTML=`<div class="hr-et"><div class="hr-res">⏳ ${el.ini} → ${el.fim} · <b>${fmtDur(el.min)}</b> trabalhadas · ⚡ <b>${ph}</b> leituras/hora</div><div class="hr-base">pelos livros com ⏱️ · pausa não conta${q>el.q?" · tem livro sem horário":""}</div>`+metaE+(base?`<div class="hr-base">${base}</div>`:"")+diaTrab()+(bl=>bl.media?`<div class="hr-base hr-rk" onclick="abrirRankHora(mes())">📗 Por livro: <b>${bl.media}</b> leituras/hora`+(bl.n>1?` · média de ${bl.n} livros`:"")+(bl.melhor>bl.media?` · 🏆 melhor ${bl.melhor}/h`:"")+` · <u>⚡ ranking</u></div>`:"")(baseLivros())+rkHorLink()+`</div>`}else{
     hb.innerHTML=`<div class="hr-et"><div class="hr-lin"><label>▶ Começou<input type="time" id="hrIni" value="${v.ini||""}"></label><label>⏹ Terminou<input type="time" id="hrFim" value="${v.fim||""}"></label>${!v.ini||!v.fim?`<button type="button" id="hrAgora">⏱️ Agora</button>`:`<button type="button" id="hrLimpa" aria-label="Limpar horas">🗑️</button>`}</div>`
       +(du?`<div class="hr-res">⏳ ${fmtDur(du)} de etapa${ph?` · ⚡ <b>${ph}</b> leituras/hora`:" · lance os livros pra ver as leituras/hora"}</div>`:v.ini?`<div class="hr-res">⏳ Começou às ${v.ini} · toque em ⏱️ Agora quando terminar</div>`:"")
       +(base?`<div class="hr-base">${base}</div>`:"")+diaTrab()+(bl=>bl.media?`<div class="hr-base hr-rk" onclick="abrirRankHora(mes())">📗 Por livro: <b>${bl.media}</b> leituras/hora`+(bl.n>1?` · média de ${bl.n} livros`:"")+(bl.melhor>bl.media?` · 🏆 melhor ${bl.melhor}/h`:"")+` · <u>⚡ ranking</u></div>`:"")(baseLivros())+rkHorLink()+`</div>`;
     }
     recolherHora(hb);
     if($("hrIni")){
     const grava=()=>{const ni=$("hrIni").value,nf=$("hrFim").value;if(ni||nf)horas[k]={ini:ni,fim:nf};else delete horas[k];salvarHoras();render()};
     $("hrIni").onchange=grava;$("hrFim").onchange=grava;
     const ag=$("hrAgora");if(ag)ag.onclick=()=>{const d=new Date(),h=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");if(!$("hrIni").value)$("hrIni").value=h;else $("hrFim").value=h;grava()};
     const lp=$("hrLimpa");if(lp)lp.onclick=()=>{if(confirm("Apagar a hora de começo e fim da Etapa "+p2(etapa)+"?")){delete horas[k];salvarHoras();render()}};
   }}}
  desenharCrono();desenharGuardDot();pintarEtapas();atualizarChip();atualizarPendentes();atualizarBannerCal();
  {const cp=[];/* faixa "Voltar pra confirmar" desligada: o aviso fica só na bolinha laranja do 📝 */$("confFaixa").innerHTML=cp.slice(0,4).map(x=>`<button type="button" class="voltar-lista" onclick="abrirConf('${x.r.id}')">📍 Voltar pra confirmar: livro ${esc(x.r.livro)} · Etapa ${p2(x.r.etapa)}</button>`).join("")}
}
function atualizarChip(){
  // Fala da data escolhida lá em cima (se for hoje, escreve "Hoje")
  const h=$("data").value||hoje(),e=etapaDoDia(h),c=$("calChip");
  const pv=e&&etapaDoDiaProv(h),quando=h===hoje()?"Hoje":h.slice(8)+"/"+h.slice(5,7);
  // A etapa já aparece no botão ao lado: este aviso só aparece quando o dia tem algo diferente
  const info=$("calTexto"),cor=e?corDoDia(h):"";let txt="";
  const [da,dm,dd]=h.split("-").map(Number),dsem=new Date(da,dm-1,dd).getDay();
  c.innerHTML='<span class="mini-cal"><i>'+["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"][dm-1]+'</i><b>'+dd+'</b></span>';
  $("dataTxt").innerHTML=p2(dd)+"/"+p2(dm)+"/"+String(da).slice(2)+"<em>"+["dom","seg","ter","qua","qui","sex","sáb"][dsem]+"</em>";
  if(ajuda){
    $("cicloBadge").hidden=true;$("dataTxt").parentNode.classList.remove("atrasado");
    info.hidden=false;info.className="cal-info ferias";info.style.background="#ffedd5";info.style.color="#9a3412";
    info.textContent="🤝 Ajuda — a etapa é da outra cidade, sem conta de atraso da sua rota.";return;
  }
  info.style.background="";info.style.color="";
  const fe=emFerias(h);
  if(fe){
    $("cicloBadge").hidden=true;$("dataTxt").parentNode.classList.remove("atrasado");
    info.hidden=false;info.className="cal-info ferias"+((fe.tipo||"Férias")==="Férias"?" azul":"");
    info.textContent="🏖️ "+(fe.tipo||"Férias")+" — de "+fe.ini.slice(8)+"/"+fe.ini.slice(5,7)+" até "+fe.fim.slice(8)+"/"+fe.fim.slice(5,7)+". Bom descanso!";
    return;
  }
  if(!e&&cal[h.slice(0,7)]){
    // Domingo, feriado ou dia sem etapa: nada de atraso, só mostra a próxima leitura
    const f=nomeFeriado(h),pr=proximaEtapa(h);
    $("cicloBadge").hidden=true;$("dataTxt").parentNode.classList.remove("atrasado");
    txt="⚪ "+(f||["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][dsem])+" — sem leitura"+(pr?" · próxima: Etapa "+p2(pr.etapa)+" em "+pr.dia.slice(8)+"/"+pr.dia.slice(5,7):"");
    info.hidden=false;info.textContent=txt;info.className="cal-info";
    return;
  }
  // Ciclo: no dia da etapa (ou antes, lançando adiantado) vale o do CALENDÁRIO (igual à coluna "Cic" da empresa);
  // depois do dia (atrasado) conta a partir da data de hoje.
  const diaDaMinha=diaDaEtapa(h.slice(0,7),etapa),noPrazo=diaDaMinha&&h<=diaDaMinha;
  const ciclo=noPrazo?(cicloPlanejado(h.slice(0,7),etapa-1)??cicloReal(diaDaMinha,etapa)):cicloReal(h,etapa),fora=foraDoLimite(ciclo);
  const antM=somaMes(h.slice(0,7),-1),realAnt=ultimaLeituraReal(antM,etapa),calAnt=diaDaEtapa(antM,etapa);
  const notaReal=realAnt&&calAnt&&realAnt!==calAnt?" (mês passado você lançou essa etapa em "+realAnt.slice(8)+"/"+realAnt.slice(5,7)+", e no calendário era "+calAnt.slice(8)+"/"+calAnt.slice(5,7)+")":"";
  const bd=$("cicloBadge");bd.hidden=ciclo==null;bd.textContent=ciclo+"d";bd.title="Ciclo de "+ciclo+" dias (pelo calendário)";bd.className="ciclo-badge"+(fora?" fora":muitoCedo(ciclo)?" cedo":"");
  const txtCiclo=ciclo==null?"":fora?" · 🔴 "+ciclo+" dias, passou do limite de "+CICLO_MAX:muitoCedo(ciclo)?" · "+ciclo+" dias (abaixo de "+CICLO_MIN+")":" · ciclo de "+ciclo+" dias";
  // Data vermelhinha quando passou de 33 dias
  $("dataTxt").parentNode.classList.toggle("atrasado",fora);
  // Etapa que atrasou no mês passado: mostra até quando ler pra não atrasar de novo
  const am=atrasoMesPassado(h.slice(0,7),etapa);
  // Regra da ANEEL: o atraso do mês passado não conta neste mês (o ciclo segue o calendário). Só fica de lembrete, sem amarelo.
  const txtAntes=am?" · ℹ️ Mês passado essa etapa foi lida atrasada ("+am.dias+" dias) — não conta: o ciclo deste mês segue o calendário":"";
  if(e!==etapa&&diaDaMinha){
    // Etapa escolhida na mão, diferente da do calendário: lançando atrasado ou adiantado
    const atras=diaDaMinha<h;
    txt=(atras?"⏰ Etapa "+p2(etapa)+" atrasada":"⏩ Etapa "+p2(etapa)+" adiantada")+" — no calendário era "+diaDaMinha.slice(8)+"/"+diaDaMinha.slice(5,7)+(e?" ("+(h===hoje()?"hoje":"dia "+quando)+" seria a "+p2(e)+")":"");
    info.hidden=false;info.textContent=txt+txtCiclo+txtAntes;info.className="cal-info "+(fora?"fora":"atraso");
  }else{
    if(!e)txt="⚪ "+quando+" não tem leitura no calendário";
    else if(cor||pv)txt=(cor?textoDoDia(h):"🟡 Etapa "+p2(e))+(pv?" · provisório":"");
    if(fora&&e===etapa){txt=(txt?txt+" · ":"")+"🔴 Ciclo de "+ciclo+" dias, passou do limite de "+CICLO_MAX}
    if(am)txt=(txt?txt+" · ":"")+txtAntes.slice(3);
    info.hidden=!txt;info.textContent=txt;info.className="cal-info"+(fora&&e===etapa?" fora":cor?" "+cor:pv?" prov":am?" nota":"");
  }

}
// ---------- Etapas pendentes: já passou a data e não tem nada lançado ----------
let pendFechado="";
function etapasPendentes(h){
  if(ajuda)return [];
  const m=h.slice(0,7),lista=cal[m];if(!lista)return [];
  const loc=locAtual(),doMes=registros.filter(r=>r.data.startsWith(m)&&mesmaCidade(r,loc)&&!r.releitura);
  // Cidade que você só ajudou (não tem nada seu no mês passado nem neste): não mostra pendentes
  const mAnt=somaMes(m,-1);if(!doMes.length&&!registros.some(r=>r.data.startsWith(mAnt)&&mesmaCidade(r,loc)))return [];
  // Só considera a partir da primeira etapa que você já lançou no mês (pra não acusar o que foi antes de usar o app).
  // Se ainda não lançou nada no mês, olha só os últimos 5 dias.
  const minEt=doMes.length?Math.min(...doMes.map(r=>r.etapa)):0;
  const [a,mo,d]=h.split("-").map(Number),lim=new Date(a,mo-1,d-5),limIso=lim.getFullYear()+"-"+p2(lim.getMonth()+1)+"-"+p2(lim.getDate());
  const out=[];
  lista.forEach((dia,i)=>{
    const n=i+1;if(!dia||dia>=h||n===etapa)return;
    if(minEt?n<minEt:dia<limIso)return;
    if(emFerias(dia)||naoFiz[dia])return;
    if(!doMes.some(r=>r.etapa===n))out.push({etapa:n,dia});
  });
  return out;
}
// Tocou numa pendente: escolhe "Lendo agora" (data de hoje, atrasada) ou "Esqueci de lançar" (data do calendário)
let pendEscolha=0,esqueci=null;
function irParaLivro(){const l=document.querySelector("#livroRows .r-livro");if(l)l.scrollIntoView({block:"center",behavior:"smooth"})}
function sairDoEsqueci(){
  if(!esqueci)return;const v=esqueci.voltar;esqueci=null;dataManual=false;
  $("data").value=v;mesVer=v.slice(0,7);const e=etapaAutomatica(v);if(e)sel(e,false);else render();
}
function atualizarPendentes(){
  const box=$("pendentes");
  if(esqueci){
    box.hidden=false;
    box.innerHTML=`<span style="flex:1">🗓️ Lançando a Etapa ${p2(esqueci.etapa)} que você esqueceu, com a data ${esqueci.dia.slice(8)}/${esqueci.dia.slice(5,7)}. Depois de salvar, volta pra hoje.</span><button class="fechar-pend cancelar-esq" type="button">Cancelar</button>`;
    box.querySelector(".fechar-pend").onclick=sairDoEsqueci;return;
  }
  const h=$("data").value||hoje(),pend=etapasPendentes(h);
  box.hidden=!pend.length;if(!pend.length)return;
  const mostra=pend.slice(-6),esc=pend.find(p=>p.etapa===pendEscolha);
  box.innerHTML="⏳ Pendente"+(pend.length>1?"s":"")+":"+mostra.map(p=>`<button class="pend${p.etapa===pendEscolha?" ativa":""}" type="button" data-e="${p.etapa}" title="Etapa ${p2(p.etapa)}, do dia ${p.dia.slice(8)}/${p.dia.slice(5,7)}">Et. ${p2(p.etapa)} <small>${p.dia.slice(8)}/${p.dia.slice(5,7)}</small></button>`).join("")+(pend.length>mostra.length?` <span>+${pend.length-mostra.length}</span>`:"")
    +(esc?`<div class="pend-opcoes"><button type="button" class="op-agora">📖 Lendo agora<small>data de hoje</small></button><button type="button" class="op-esqueci">🗓️ Esqueci de lançar<small>data ${esc.dia.slice(8)}/${esc.dia.slice(5,7)}</small></button><button type="button" class="op-naofiz"><b class="bol-rosa"></b> Não fiz<small>li em outro lugar</small></button></div>`:"");
  box.querySelectorAll(".pend").forEach(b=>b.onclick=()=>{pendEscolha=pendEscolha===+b.dataset.e?0:+b.dataset.e;atualizarPendentes()});
  if(esc){
    box.querySelector(".op-naofiz").onclick=async()=>{if(!confirm("Etapa "+p2(esc.etapa)+" ("+esc.dia.slice(8)+"/"+esc.dia.slice(5,7)+"): você não fez porque leu em outro lugar?\n\nEla sai das pendentes e fica marcada com a bolinha preta no calendário."))return;{const o=await pedirObsNaoFiz("");if(o===null)return;naoFiz[esc.dia]=o};salvarNaoFiz();pendEscolha=0;render()};
    box.querySelector(".op-agora").onclick=()=>{pendEscolha=0;escolherEtapa(esc.etapa);irParaLivro()};
    box.querySelector(".op-esqueci").onclick=()=>{
      pendEscolha=0;esqueci={etapa:esc.etapa,dia:esc.dia,voltar:h};dataManual=true;
      $("data").value=esc.dia;mesVer=esc.dia.slice(0,7);sel(esc.etapa,false);irParaLivro();
    };
  }
}
// ---------- Janela de férias ----------
function fmtCurto(iso){return iso.slice(8)+"/"+iso.slice(5,7)+"/"+iso.slice(2,4)}
function mostrarFimFerias(){const i=$("ferIni").value,n=+$("ferDias").value;$("ferFim").textContent=i&&n>0?"🏖️ "+n+" dias: de "+fmtCurto(i)+" até "+fmtCurto(somaDias(i,n-1)):""}
// Mudou os dias → calcula o "termina em". Mudou o "termina em" → calcula os dias.
function porDias(){const i=$("ferIni").value,n=+$("ferDias").value;if(i&&n>0)$("ferFimData").value=somaDias(i,n-1);mostrarFimFerias()}
function porFim(){const i=$("ferIni").value,f=$("ferFimData").value;if(i&&f){if(f<i){alert("O fim não pode ser antes do começo.");$("ferFimData").value="";return}$("ferDias").value=diasEntre(f,i)+1}mostrarFimFerias()}
function desenharFerias(){
  const l=[...ferias].sort((a,b)=>a.ini.localeCompare(b.ini));
  if(!l.length){$("ferLista").innerHTML='<div class="hint">Nenhuma férias cadastrada.</div>';return}
  const anos={};l.forEach(f=>{(anos[f.ini.slice(0,4)]=anos[f.ini.slice(0,4)]||[]).push(f)});
  $("ferLista").innerHTML=Object.keys(anos).map(a=>{
    const tot=anos[a].reduce((t,f)=>t+diasEntre(f.fim,f.ini)+1,0);
    return `<div class="label" style="margin-top:8px">${a} — ${tot} dias no total</div>`+anos[a].map(f=>`<div class="fer-item"><span>🏖️ <b>${esc(f.tipo||"Férias")}</b> · ${fmtCurto(f.ini)} até ${fmtCurto(f.fim)} (${diasEntre(f.fim,f.ini)+1} dias)</span><button type="button" onclick="apagarFerias('${f.id}')" aria-label="Apagar">🗑️</button></div>`).join("");
  }).join("");
}
function apagarFerias(id){if(!confirm("Apagar este período?"))return;ferias=ferias.filter(f=>String(f.id)!==String(id));salvarFerias();desenharFerias();desenharCal();render()}
$("feriasBtn").onclick=()=>{$("ferIni").value="";$("ferDias").value="";$("ferFimData").value="";mostrarFimFerias();desenharFerias();$("feriasFundo").hidden=false};
$("feriasVoltar").onclick=()=>{$("feriasFundo").hidden=true;desenharCal();render()};
$("ferIni").onchange=()=>{if($("ferDias").value)porDias();else porFim()};$("ferDias").oninput=porDias;$("ferFimData").onchange=porFim;
document.querySelectorAll(".fer-rapido button").forEach(b=>b.onclick=()=>{$("ferDias").value=b.dataset.d;porDias()});
$("ferAdd").onclick=()=>{
  const i=$("ferIni").value,n=+$("ferDias").value;
  if(!i)return alert("Escolha o dia que começa.");if(!(n>0))return alert("Escolha o dia que termina ou quantos dias.");
  ferias.push({id:Date.now(),ini:i,fim:somaDias(i,n-1),tipo:$("ferTipo").value});salvarFerias();
  $("ferIni").value="";$("ferDias").value="";$("ferFimData").value="";mostrarFimFerias();desenharFerias();render();
};
function del(id){if(confirm("Excluir este registro?")){guardarDesfazer(registros.filter(r=>String(r.id)===String(id)));registros=registros.filter(r=>String(r.id)!==String(id));localStorage.setItem(KEY,JSON.stringify(registros));render()}}

// ---------- Editar registro ----------
let editId=null;
for(let i=1;i<=18;i++){const o=document.createElement("option");o.value=i;o.textContent="Etapa "+p2(i);$("edEtapa").appendChild(o)}
function edMostrarPart(){document.querySelectorAll(".ed-part").forEach(d=>d.style.display=$("edPart").checked?"":"none")}
function edCalcQtd(){const de=$("edDe").value,ate=$("edAte").value;if($("edPart").checked&&de!==""&&ate!==""&&Number(ate)>=Number(de))$("edQtd").value=Number(ate)-Number(de)+1}
$("edPart").onchange=()=>{edMostrarPart();edCalcQtd()};$("edDe").oninput=edCalcQtd;$("edAte").oninput=edCalcQtd;
// Trocar a data direto na lista (sem abrir o ✏️)
function mudarDataLivro(id,inp){
  const r=registros.find(x=>String(x.id)===String(id)),nova=inp.value;
  if(!r||!nova||nova===r.data){if(r)inp.value=r.data;return}
  const outroMes=nova.slice(0,7)!==r.data.slice(0,7);
  if(!confirm("Trocar a data do livro "+r.livro+"\nde "+fmt(r.data)+" para "+fmt(nova)+"?"+(outroMes?"\n\nAtenção: é outro mês — ele sai da lista deste mês.":""))){inp.value=r.data;return}
  r.data=nova;localStorage.setItem(KEY,JSON.stringify(registros));render();
}
// ---------- 🗺️ Caderno de rotas por livro ----------
const ROTAKEY=KEY+"_rotas";let rotas={};try{rotas=JSON.parse(localStorage.getItem(ROTAKEY)||"{}")}catch(e){}
function salvarRotas(){try{localStorage.setItem(ROTAKEY,JSON.stringify(rotas))}catch(e){}}
function cidadeDoLivro(livro){const r=registros.filter(x=>x.livro===livro).sort((a,b)=>b.data.localeCompare(a.data))[0];return r&&r.localidade?r.localidade.trim():$("localidade").value.trim()}
function comCidade(end,cid){const e=(end||"").trim();if(!e)return "";return /,\s*SP\b/i.test(e)||(cid&&normLoc(e).includes(normLoc(cid)))?e:e+(cid?", "+cid:"")+", SP"}
function linkMaps(enderecos){
  const l=enderecos.filter(Boolean);if(!l.length)return "";
  const dest=encodeURIComponent(l[l.length-1]),way=l.slice(0,-1).slice(0,9).map(encodeURIComponent).join("%7C");
  return "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination="+dest+(way?"&waypoints="+way:"");
}
function rotaDoLivro(livro){
  if(!rotas[livro]){
    // primeira vez: começa com o endereço que veio da foto do PDA
    const comPda=registros.filter(x=>x.livro===livro&&x.pda&&x.pda.end).sort((a,b)=>b.data.localeCompare(a.data))[0];
    const et=registros.filter(x=>x.livro===livro).sort((a,b)=>b.data.localeCompare(a.data))[0];
    rotas[livro]={ruas:comPda?[comPda.pda.end]:[""],etapa:et?et.etapa:etapa};
  }
  return rotas[livro];
}
let rcModo="",rcChave="";
function abrirRota(livro){rcModo="rota";rcChave=livro;desenharRota();$("rcFundo").hidden=false}
// Rua pro mapa: se não tem "rua, número", tira a sujeira do fim que a foto pega (E210, TE 4, 3K, EE ROR, BRL 0...)
function ruaParaMapa(x){
  x=String(x||"").replace(/\s+/g," ").trim();if(!x||/,\s*\d/.test(x))return x;
  const ok=new Set(["DA","DE","DO","DOS","DAS","E","II","III","IV","VI","XV","XXIII"]),t=x.split(" ");
  while(t.length>2){const w=t[t.length-1];if(/\d/.test(w)||(w.length<=3&&!ok.has(w)))t.pop();else break}
  if(t.length===2&&/^\d/.test(x.split(" ")[1]||""))return t.join(" ");
  while(t.length>2&&/^(DA|DE|DO|DOS|DAS|E)$/.test(t[t.length-1]))t.pop();
  return t.join(" ");
}
// Arruma as ruas lidas da foto: separa duas ruas grudadas, tira a sujeira do fim e junta repetidas seguidas
function parecido(a,b){a=a.replace(/\s/g,"");b=b.replace(/\s/g,"");const m=a.length,n=b.length;if(!m||!n)return 0;let p=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){let q=[i];for(let j=1;j<=n;j++)q[j]=Math.min(p[j]+1,q[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=q}return 1-p[n]/Math.max(m,n)}
const TIPOS_RUA="RUA|R|AVENIDA|AV|ALAMEDA|AL|TRAVESSA|TRAV|TRV|TV|ESTRADA|ESTR|EST|RODOVIA|ROD|PRAÇA|PRACA|PÇA|PCA|PRC|PC|VIELA|VLA|LARGO|LG|VIA|BECO|BC";
const reTipoIni=new RegExp("^("+TIPOS_RUA+")\\.?\\s");
// rua serve se tem o tipo (R, AV...) e um nome, ou um número (RUA 1, R 2)
function ruaValida(p){const t=p.replace(reTipoIni,"").trim();return reTipoIni.test(p)&&(/[A-ZÀ-Ú]{3,}/.test(t)||/^\d{1,4}[A-Z]?\b/.test(t))}
// mesma rua? (ignora a sujeira do fim, acento, "RUA" x "R")
function chaveRua(x){return normLoc(ruaParaMapa(x).replace(/,.*$/,"")).replace(/^rua\s/,"r ").replace(/^avenida\s/,"av ").replace(/\./g,"").replace(/\s+/g," ").trim()}
function ruaRepetida(x,lista,menos){const k=chaveRua(x);if(!k)return false;return lista.some((y,j)=>j!==menos&&String(y||"").trim()&&(chaveRua(y)===k||parecido(chaveRua(y),k)>=0.9))}
function arrumarRuas(lista){
  const partes=[];
  (lista||[]).forEach(x=>{x=String(x||"").replace(/\s+/g," ").trim();if(!x)return;
    x.replace(/\s(\d+[A-Z]?)\sR(?=[A-Z]{3})/g," $1 |R ").replace(new RegExp("\\s(?=(?:"+TIPOS_RUA+")\\.?\\s[A-Z]{3})","g"),"|").split("|").forEach(p=>partes.push(p.trim()))});
  const out=[];
  partes.forEach(p=>{
    p=separarTipo(p).replace(/\s+/g," ").trim();
    if(!/,\s*\d/.test(p)){
      // guarda o número em que a rua começa no livro (ex.: "... TE 4" → começa no 4) no formato "RUA, 4"
      const limpo=ruaParaMapa(p),resto=p.slice(limpo.length).trim().split(" ");
      const n=(resto.map(w=>(w.match(/^[A-Z]?(\d{1,5})[A-Z]?$/)||[])[1]).find(Boolean)||"").replace(/^0+/,"");
      p=limpo;/* número de início/fim não é guardado: não serve pra rota */
    }
    if(!ruaValida(p.replace(/,.*$/,"")))return;
    // rua repetida não entra (em qualquer lugar da lista)
    // repetida: se a que ficou não tem o número de início e esta tem, aproveita o número
    const k=chaveRua(p),ant=out[out.length-1],t1=ant&&ant.split(" ").slice(0,3).join(" "),t2=p.split(" ").slice(0,3).join(" ");
    let j=out.findIndex(y=>chaveRua(y)===k||parecido(chaveRua(y),k)>=0.9);
    if(j>-1){if(p.split(" ").length>out[j].split(" ").length&&p.replace(/\s/g,"").length>=out[j].replace(/\s/g,"").length)out[j]=p;const n=p.match(/,\s*\d+$/);if(n&&!/,\s*\d/.test(out[j]))out[j]+=n[0];return}
    out.push(p);
  });
  return out;
}
function casaDaRota(x){return /,\s*\d/.test(String(x||""))?numeroCasa(x):""}
// ---------- ✍️ Autocompletar nome de rua (internet: mapa gratuito OpenStreetMap + ruas que você já usou) ----------
let ruasNet={};try{ruasNet=JSON.parse(localStorage.getItem(KEY+"_ruas_net")||"{}")||{}}catch(e){}
function salvarRuasNet(){try{localStorage.setItem(KEY+"_ruas_net",JSON.stringify(ruasNet))}catch(e){}}
function formatarRua(n){n=String(n||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/\s+/g," ").trim();
  return n.replace(/^RUA\s/,"R ").replace(/^AVENIDA\s/,"AV ").replace(/^TRAVESSA\s/,"TV ").replace(/^ALAMEDA\s/,"AL ").replace(/^PRACA\s/,"PCA ").replace(/^ESTRADA\s/,"ESTR ").replace(/^RODOVIA\s/,"ROD ").replace(/^LARGO\s/,"LG ")}
function ruasConhecidas(cid){const k=normLoc(cid||""),set=new Set(ruasNet[k]||[]);Object.values(rotas).forEach(r=>(r.ruas||[]).forEach(x=>{if(x&&x.trim())set.add(ruaParaMapa(x).replace(/,.*$/,""))}));return [...set]}
const BBOX_TATUI="-48.02,-23.47,-47.74,-23.27";
async function buscarRuasNet(txt,cid){
  const k=normLoc(cid||""),q=txt.replace(/^(R|RUA|AV|AVENIDA|TV|TRAVESSA|AL|PCA|PRACA|PÇA)\.?\s+/i,"");
  const url="https://photon.komoot.io/api/?limit=10&q="+encodeURIComponent(q+(k==="tatui"?"":" "+(cid||"")))+(k==="tatui"||!k?"&bbox="+BBOX_TATUI:"");
  const r=await fetch(url);if(!r.ok)return [];const j=await r.json();
  const nomes=[...new Set((j.features||[]).filter(f=>f.properties&&(f.properties.osm_key==="highway"||f.properties.type==="street")&&f.properties.name).filter(f=>!k||k==="tatui"||normLoc(f.properties.city||"").includes(k)).map(f=>formatarRua(f.properties.name)))];
  if(nomes.length){ruasNet[k]=[...new Set([...(ruasNet[k]||[]),...nomes])].slice(-800);salvarRuasNet()}
  return nomes;
}
let sugTimer=0;
function ligarAutocompletar(box,cid){
  box.querySelectorAll("textarea[data-i]").forEach(t=>{
    const fechar=()=>{const s=t.closest(".rua").nextElementSibling;if(s&&s.classList.contains("sug-box"))s.remove()};
    const mostrar=lista=>{fechar();if(!lista.length||document.activeElement!==t)return;
      const d=document.createElement("div");d.className="sug-box";
      d.innerHTML=lista.slice(0,6).map(n=>`<button type="button" data-n="${esc(n)}">📍 ${esc(n)}</button>`).join("");
      t.closest(".rua").after(d);
      d.querySelectorAll("button").forEach(b=>b.onpointerdown=e=>{e.preventDefault();t.value=b.dataset.n;fechar();t.dispatchEvent(new Event("change"))});
    };
    t.addEventListener("input",()=>{
      const v=formatarRua(t.value);clearTimeout(sugTimer);
      if(v.replace(/^(R|AV|TV|AL|PCA)\s/,"").length<3){fechar();return}
      const nv=normLoc(v.replace(/^(R|AV|TV|AL|PCA)\s/,"")),locais=ruasConhecidas(cid).filter(n=>normLoc(n).includes(nv)&&n!==v);
      mostrar(locais);
      sugTimer=setTimeout(async()=>{try{const net=await buscarRuasNet(v,cid);const tudo=[...new Set([...locais,...net.filter(n=>normLoc(n).includes(nv.split(" ")[0]))])];if(tudo.length)mostrar(tudo)}catch(e){}},400);
    });
    t.addEventListener("blur",()=>setTimeout(fechar,250));
  });
}
function partesMaps(ends){if(ends.length<=10)return ends.length?[linkMaps(ends)]:[];const out=[];for(let i=0;i<ends.length-1;i+=9)out.push(linkMaps(ends.slice(i,i+10)));return out}
function desenharRota(){
  const livro=rcChave,r=rotaDoLivro(livro),cid=cidadeDoLivro(livro);
  if(!r.arrumada){const a=arrumarRuas(r.ruas);r.ruas=a.length?a:[""];r.arrumada=1;salvarRotas()}
  $("rcTit").textContent="🗺️ Rota do livro "+livro;
  const ends=r.ruas.map(x=>comCidade(ruaParaMapa(x),cid)).filter(Boolean),lk=linkMaps(ends);
  const temRua=r.ruas.some(x=>x.trim());
  $("rcCorpo").innerHTML=`<div class="rc-sub">Etapa ${p2(r.etapa||0)} · ${esc(cid||"")} · ruas na ordem que você faz. Fica salvo pros próximos meses.</div>`+
    `<div class="rota-topo"><span class="rota-links">${(pm=>pm.length>1?pm.map((u,k)=>`<a class="rc-maps" href="${u}" target="_blank" rel="noopener">🗺️ ${k+1}ª parte</a>`).join(""):`<a class="rc-maps${lk?"":" off"}" href="${lk||"#"}" target="_blank" rel="noopener">🗺️ Abrir no Google Maps</a>`)(partesMaps(ends))}</span><button type="button" id="rotaComp" title="Compartilhar a rota" aria-label="Compartilhar a rota"${temRua?"":" disabled"}>📤</button><button type="button" id="rotaLimpa" title="Apagar todas as ruas" aria-label="Apagar todas as ruas"${temRua?"":" disabled"}>🗑️</button></div>`+
    r.ruas.map((x,i)=>`<div class="rua sem-num"><div class="rua-cx"><textarea data-i="${i}" rows="1" class="end-txt" placeholder="Rua e número" autocomplete="off">${esc(x)}</textarea></div><button type="button" data-up="${i}" aria-label="Subir">↑</button>${x.trim()?`<a href="${linkMaps([comCidade(ruaParaMapa(x),cid)])}" target="_blank" rel="noopener" aria-label="Abrir no mapa">📍</a>`:`<span></span>`}<button type="button" data-del="${i}" aria-label="Tirar">✕</button></div>`).join("")+
    `<div class="rota-baixo"><button type="button" class="rc-add">＋ Rua</button><button type="button" id="rotaFotoBtn">📷 Ler ruas da foto</button></div>`+
    `<button type="button" id="rotaColarBtn" class="rota-colar">📋 Colar lista de ruas</button><div id="rotaColarBox" hidden><textarea id="rotaColarTxt" rows="6" placeholder="Cole aqui as ruas, uma por linha"></textarea><button type="button" id="rotaColarOk">✔ Colocar na rota</button></div>`;
  const c=$("rcCorpo");
  ajustarAltura(c);
  ligarAutocompletar(c,cid);
  c.querySelectorAll("textarea[data-i]").forEach(inp=>inp.onchange=()=>{const i=+inp.dataset.i,v=inp.value.replace(/\s+/g," ").trim().toUpperCase();
    if(v&&ruaRepetida(v,r.ruas,i)){alert("🚫 Essa rua já está na rota:\n"+v);inp.value=r.ruas[i];if(!r.ruas[i])r.ruas.splice(i,1);if(!r.ruas.length)r.ruas.push("");salvarRotas();desenharRota();return}
    r.ruas[i]=v;salvarRotas();desenharRota();render()});
  c.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{r.ruas.splice(+b.dataset.del,1);if(!r.ruas.length)r.ruas.push("");salvarRotas();desenharRota();render()});
  c.querySelectorAll("[data-up]").forEach(b=>b.onclick=()=>{const i=+b.dataset.up;if(i>0){[r.ruas[i-1],r.ruas[i]]=[r.ruas[i],r.ruas[i-1]];salvarRotas();desenharRota()}});
  $("rotaFotoBtn").onclick=()=>$("rotaArq").click();
  // 📋 colar várias ruas de uma vez (uma por linha) — limpa, tira repetidas e põe no fim
  $("rotaColarBtn").onclick=()=>{const bx=$("rotaColarBox");bx.hidden=!bx.hidden;if(!bx.hidden)$("rotaColarTxt").focus()};
  $("rotaColarOk").onclick=()=>{
    const linhas=$("rotaColarTxt").value.split(/\n+/).map(x=>formatarRua(x.replace(/^[\s•\-–*·\d.)(]+(?=[A-Za-zÀ-ú])/,""))).filter(Boolean);
    const novas=arrumarRuas(linhas),base=r.ruas.filter(x=>x.trim()),ok=[];
    novas.forEach(x=>{if(!ruaRepetida(x,base)){base.push(x);ok.push(x)}});
    if(!ok.length)return alert("Nenhuma rua nova (vazia ou já estão na rota).");
    r.ruas=base;salvarRotas();desenharRota();render();alert("✔ "+ok.length+" rua(s) colocada(s) na rota.");
  };
  // 🗑️ apaga todas as ruas do livro
  $("rotaLimpa").onclick=()=>{if(!confirm("Apagar todas as ruas da rota do livro "+livro+"?"))return;r.ruas=[""];salvarRotas();desenharRota();render()};
  // 📤 manda a rota pronta pra outra pessoa (WhatsApp etc.)
  $("rotaComp").onclick=async()=>{
    const ruas=r.ruas.filter(x=>x.trim()).map(ruaParaMapa);
    const txt="🗺️ Rota do livro "+livro+" · Etapa "+p2(r.etapa||0)+(cid?" · "+cid:"")+"\n\n"+ruas.map(x=>"• "+x).join("\n")+((pm=>pm.length>1?"\n\n📍 Abrir no Google Maps (o Maps aceita 10 ruas por vez):\n"+pm.map((u,k)=>(k+1)+"ª parte: "+u).join("\n\n"):pm.length?"\n\n📍 Abrir no Google Maps:\n"+pm[0]:"")(partesMaps(r.ruas.filter(x=>x.trim()).map(x=>comCidade(ruaParaMapa(x),cid)))));
    try{if(navigator.share){await navigator.share({title:"Rota do livro "+livro,text:txt});return}}catch(e){if(e&&e.name==="AbortError")return}
    try{await navigator.clipboard.writeText(txt);alert("📋 Rota copiada! Agora é só colar no WhatsApp.")}catch(e){prompt("Copie a rota:",txt)}
  };
  c.querySelector(".rc-add").onclick=()=>{r.ruas.push("");salvarRotas();desenharRota();const l=c.querySelectorAll("textarea[data-i]");l[l.length-1].focus()};
}
// ---------- 📝 Confirmações de leitura (livros marcados REL.) ----------
function confDe(r){
  const n=Math.max(1,Math.min(50,r.qtd||1));
  if(!Array.isArray(r.conf))r.conf=[];
  while(r.conf.length<n)r.conf.push({med:"",leit:"",end:r.conf.length===0&&r.pda&&r.pda.end?r.pda.end:"",ok:false});
  if(r.conf.length>n)r.conf.length=n;
  return r.conf;
}
function chipConf(r){const c=confDe(r),f=c.filter(x=>x.ok).length;return `<br><button type="button" class="conf-chip${f===c.length?" ok":""}" onclick="abrirConf('${r.id}')">📝 Confirmações ${f}/${c.length}${f===c.length?" ✔":""}</button>`}
let confAbertas=new Set();
// 🔴 Mesmo medidor (ou mesmo endereço) que já teve confirmação no mês passado: devolve os meses seguidos
function confRepetida(r,x){
  const med=String(x.med||"").toUpperCase().replace(/\s/g,""),end=String(x.end||"").toUpperCase().replace(/\s+/g," ").trim();if(!med&&!end)return 0;
  const bate=y=>{const m2=String(y.med||"").toUpperCase().replace(/\s/g,"");if(med&&m2)return m2===med;const e2=String(y.end||"").toUpperCase().replace(/\s+/g," ").trim();return !!end&&e2===end};
  let n=0,m=r.data.slice(0,7);
  for(let k=0;k<12;k++){m=somaMes(m,-1);if(registros.some(o=>o!==r&&o.releitura&&o.data.startsWith(m)&&Array.isArray(o.conf)&&o.conf.some(bate)))n++;else break}
  return n;
}
// % de não lidos sobre as leituras (ex.: 4 de 430 = 0,9%)
function pctNL(nl,q){return q>0&&nl>0?(nl/q*100).toLocaleString("pt-BR",{maximumFractionDigits:1,minimumFractionDigits:1})+"%":""}
function atualizarPctNL(){const e=$("impPct");if(!e)return;{const qq=[...$("livroRows").children].reduce((t,r)=>{const l=(r.querySelector(".r-livro")||{}).value,v=+(r.querySelector(".r-qtd")||{}).value||0;return t+(v?qBob(l,v):0)},0),bb=$("bobDig");if(bb){bb.textContent=qq?txtBob(qq):"";bb.hidden=!qq}}const nl=+($("impQtd").value||0),q=[...document.querySelectorAll(".r-qtd")].reduce((t,i)=>t+(+i.value||0),0),p=pctNL(nl,q);e.textContent=p?" "+p:""}
document.addEventListener("input",ev=>{if(ev.target&&(ev.target.id==="impQtd"||ev.target.classList&&ev.target.classList.contains("r-qtd")))atualizarPctNL()});
// 🧾 Bobinas: ~90 leituras por bobina (dá pra mudar tocando no 🧾)
let porBobina=90;try{porBobina=+localStorage.getItem(KEY+"_porbobina")||90}catch(e){}
// 🏢 Livros de prédio: imprime na base, não entra na conta das bobinas (fica marcado pros próximos meses)
let predios={};try{predios=JSON.parse(localStorage.getItem(KEY+"_predios")||"{}")||{}}catch(e){}
function salvarPredios(){try{localStorage.setItem(KEY+"_predios",JSON.stringify(predios))}catch(e){}}
function marcarPredio(id){const r=registros.find(x=>String(x.id)===String(id));if(!r)return;const l=r.livro;
  if(predios[l]){if(confirm("🏢 Livro "+l+" está marcado como PRÉDIO.\n\nOK = desmarcar (volta a contar bobina)"))delete predios[l]}
  else if(confirm("🏢 Livro "+l+" é PRÉDIO / apartamentos?\n\nNão entra na conta das bobinas.\nFica marcado pros próximos meses."))predios[l]=1;
  salvarPredios();render()}
// 🏢 no campo do livro: marca/desmarca prédio na hora de lançar (ou depois da foto do PDA)
function atualizarPredRows(){document.querySelectorAll("#livroRows .livro-row").forEach(r=>{const l=(r.querySelector(".r-livro")||{}).value||"",b=r.querySelector(".r-pred");if(b){b.classList.toggle("on",!!predios[l.trim()]);b.hidden=!l.trim()}})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".r-pred");if(!b)return;e.preventDefault();
  const l=(b.closest(".livro-row").querySelector(".r-livro").value||"").trim();if(!l)return;
  if(predios[l])delete predios[l];else predios[l]=1;salvarPredios();atualizarPredRows();atualizarPctNL();render()});
document.addEventListener("input",e=>{if(e.target&&e.target.classList&&e.target.classList.contains("r-livro")){atualizarPredRows();atualizarPctNL()}});
setInterval(()=>{try{atualizarPredRows();atualizarPctNL()}catch(e){}},1500);
// ---------- 📟 Meus equipamentos (PDA e impressora) ----------
const EQ_CAMPOS={pda:[["Equipamento","PDA Zebra TC27"],["Patrimônio","NEKT10010"],["Modelo","WCMTB"],["P/N","WCMTB-T27B6ABE2-BR"],["Nº de série (SN)","25315524700149"],["IMEI 1","354053753735738"],["IMEI 2","354605336915515"],["Fabricação","11/2025"]],
  imp:[["Equipamento","Impressora Zebra ZQ521"],["Patrimônio","NEKT00213"],["Nº de série (SN)","XXRBN252801819"],["PCC","ZQ52-BUE002L-L3"],["Anatel","13423-20-05041"]]};
let equip=null;try{equip=JSON.parse(localStorage.getItem(KEY+"_equip")||"null")}catch(e){}
if(!equip){equip={};for(const g in EQ_CAMPOS)equip[g]=EQ_CAMPOS[g].map(([k,v])=>({k,v}))}
if(!equip.dono){equip={dono:[{k:"Nome",v:"Luís Ricardo de Almeida Siqueira"},{k:"Função",v:"Agente de faturamento"},{k:"Prontuário",v:"306418"},{k:"Prontuário U",v:"U459310"}],...equip}}
if(equip.pda&&!equip.pda.some(x=>x.k==="Chip"))equip.pda.push({k:"Chip",v:""});
function salvarEquip(){try{localStorage.setItem(KEY+"_equip",JSON.stringify(equip))}catch(e){}}
// 📶 chip do PDA: já vem com o número e a foto que o Luís mandou (uma vez só)
const CHIP_FOTO0="data:image/jpeg;base64,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";
try{if(!localStorage.getItem(KEY+"_fix_chip")&&equip.pda){const c=equip.pda.find(x=>x.k==="Chip");if(c){if(!c.v)c.v="8955102523900060833239 (VIVO)";salvarEquip();
  if(!c.foto)gPut("eq_chip",CHIP_FOTO0).then(()=>{c.foto=true;salvarEquip();localStorage.setItem(KEY+"_fix_chip","1")}).catch(()=>{});else localStorage.setItem(KEY+"_fix_chip","1")}}}catch(e){}
async function compartilharChip(){const c=equip.pda.find(x=>x.k==="Chip")||{},t="📶 Chip do PDA"+(c.v?": "+c.v:"");let fl=null;
  try{const d=await gGet("eq_chip");if(d)fl=new File([dataURLparaBlob(d)],"chip-pda.jpg",{type:"image/jpeg"})}catch(e){}
  try{if(fl&&navigator.canShare&&navigator.canShare({files:[fl]})){await navigator.share({files:[fl],text:t});return}if(navigator.share){await navigator.share({text:t});return}}catch(e){if(e&&e.name==="AbortError")return}
  try{await navigator.clipboard.writeText(t);alert("📋 Número do chip copiado.")}catch(e){prompt("Copie:",t)}}
// 📷 ler a etiqueta do PDA ou da impressora e atualizar os campos
async function lerEtiqueta(g){const tit={pda:"PDA (coletor de leitura)",imp:"impressora portátil"}[g]||g,ks=(equip[g]||[]).filter(x=>x.k!=="Chip").map(x=>x.k);
  const inp=document.createElement("input");inp.type="file";inp.accept="image/*";
  inp.onchange=async()=>{const f=(inp.files||[])[0];if(!f)return;if(!iaChave)return alert("🤖 Precisa da Leitura com IA ligada pra ler a etiqueta.");
    const b=document.querySelector(`[data-ler="${g}"]`);if(b){b.disabled=true;b.textContent="🤖 Lendo..."}
    let j=null;try{j=await iaLer(f,'Foto da etiqueta (ou da caixa/tela de informações) de um equipamento: '+tit+'. Leia os dados que aparecerem e responda só JSON com exatamente estas chaves: '+JSON.stringify(ks)+'. "Equipamento" é marca e modelo comercial (ex.: "PDA Zebra TC27", "Impressora Zebra ZQ521"); "Patrimônio" é a plaqueta/etiqueta de patrimônio da empresa (ex.: "NEKT10010"); "Nº de série (SN)" vem depois de S/N ou SN; IMEI vem depois de IMEI; "Fabricação" no formato mm/aaaa. Use null no que não aparecer na foto. Não invente.')}catch(err){iaFalhou(err)}
    if(b){b.disabled=false;b.textContent="📷 Ler etiqueta"}
    if(!j)return alert("Não consegui ler a etiqueta. Tente outra foto, sem reflexo.");
    const mud=(equip[g]||[]).filter(x=>x.k!=="Chip"&&j[x.k]!=null&&String(j[x.k]).trim()&&String(j[x.k]).trim()!==x.v).map(x=>({x,v:String(j[x.k]).trim()}));
    if(!mud.length)return alert("📷 Li a etiqueta e está tudo igual ao que já está salvo. 👍");
    if(!confirm("📷 Li na etiqueta:\n\n"+mud.map(m=>"• "+m.x.k+": "+(m.x.v||"—")+" → "+m.v).join("\n")+"\n\nAtualizar?"))return;
    mud.forEach(m=>m.x.v=m.v);salvarEquip();desenharEquip();toast("✅ "+(g==="pda"?"PDA":"Impressora")+" atualizado")};
  inp.click()}
// 📶 chip do PDA: foto + número lido pela IA
const IA_CHIP='Foto de um chip de celular (SIM card). Leia o número impresso no chip (ICCID, só dígitos). Ele costuma estar em 2 linhas (uma em cima e outra embaixo do nome da operadora): junte as linhas na ordem, de cima pra baixo, sem espaços. Diga também a operadora (ex.: VIVO, CLARO, TIM). Responda só JSON: {"chip":"8955102523900060833239","operadora":"VIVO"}. Use null no que não conseguir ler.';
async function fotoChip(){const inp=document.createElement("input");inp.type="file";inp.accept="image/*";
  inp.onchange=async()=>{const f=(inp.files||[])[0];if(!f)return;const b=$("eqChipBt");if(b){b.disabled=true;b.textContent="⏳ Guardando..."}
    try{await gPut("eq_chip",await fotoMini(f,1100,.75));equip.pda.find(x=>x.k==="Chip").foto=true}catch(e){alert("Não consegui guardar a foto neste celular.")}
    let n="",op="";if(iaChave){if(b)b.textContent="🤖 Lendo...";try{const j=await iaLer(f,IA_CHIP);if(j){n=String(j.chip||"").replace(/\D/g,"");op=String(j.operadora||"").toUpperCase().trim()}}catch(err){iaFalhou(err)}}
    const c=equip.pda.find(x=>x.k==="Chip"),v=prompt("📶 Número do chip"+(op?" ("+op+")":"")+":\nConfira e toque OK.",n||c.v||"");if(v!==null&&v.trim())c.v=v.replace(/\s+/g,"").trim()+(op&&!/\(/.test(v)?" ("+op+")":"");
    salvarEquip();desenharEquip()};inp.click()}
let eqEdit=false;
function desenharEquip(){
  const tit={dono:"👤 Agente",pda:"📱 PDA",imp:"🖨️ Impressora"};
  $("eqCorpo").innerHTML=Object.keys(equip).map(g=>`<div class="eq-grupo${g==="dono"?" eq-dono":""}"><b>${tit[g]||g}</b>`+equip[g].map((x,i)=>!eqEdit&&!x.v?"":eqEdit?`<label class="eq-l"><span>${esc(x.k)}</span><input data-g="${g}" data-i="${i}" value="${esc(x.v)}" autocomplete="off"></label>`:`<div class="eq-l"><span>${esc(x.k)}</span><b>${esc(x.v)||"—"}</b></div>`).join("")+(g==="pda"||g==="imp"?`<div class="eq-chip"><button type="button" data-ler="${g}" class="eq-chip-bt">📷 Ler etiqueta</button></div>`:"")+(g==="pda"?`<div class="eq-chip">${(equip.pda.find(x=>x.k==="Chip")||{}).foto?'<img id="eqChipImg" alt="foto do chip">':""}<button type="button" id="eqChipBt" class="eq-chip-bt">📷 ${(equip.pda.find(x=>x.k==="Chip")||{}).foto?"Trocar foto":"Foto do chip"}</button><button type="button" id="eqChipSh" class="eq-chip-bt">📤 Chip</button></div>`:"")+`</div>`).join("");
  $("eqCorpo").querySelectorAll("[data-ler]").forEach(x=>x.onclick=()=>lerEtiqueta(x.dataset.ler));{const b=$("eqChipBt");if(b)b.onclick=fotoChip;const sh=$("eqChipSh");if(sh)sh.onclick=compartilharChip;const im=$("eqChipImg");if(im)gGet("eq_chip").then(d=>{if(!d){im.remove();return}im.src=d;im.onclick=()=>{const v=document.createElement("div");v.className="modal-fundo obs-fundo gd-zoom";v.style.zIndex=9999;v.innerHTML=`<img src="${d}" alt="foto">`;v.onclick=()=>v.remove();document.body.appendChild(v)}})}
  $("eqEditar").textContent=eqEdit?"✅ Pronto":"✏️ Editar";
  $("eqCorpo").querySelectorAll("input").forEach(inp=>inp.onchange=()=>{equip[inp.dataset.g][+inp.dataset.i].v=inp.value.trim();salvarEquip()});
}
function textoEquip(qual){const tit={dono:"👤 AGENTE",pda:"📱 PDA",imp:"🖨️ IMPRESSORA"};const nome=((equip.dono||[]).find(x=>x.k==="Nome")||{}).v||"";return "📟 Equipamentos"+(nome?" de "+nome:"")+"\n\n"+Object.keys(equip).map(g=>tit[g]+"\n"+equip[g].filter(x=>x.v&&!(g==="dono"&&((qual==="n"&&x.k==="Prontuário U")||(qual==="u"&&x.k==="Prontuário")))).map(x=>x.k+": "+x.v).join("\n")).join("\n\n")}
$("equipBtn").onclick=()=>{eqEdit=false;$("eqEscolha").hidden=true;desenharEquip();$("eqFundo").hidden=false};
$("eqVoltar").onclick=()=>$("eqFundo").hidden=true;
$("eqEditar").onclick=()=>{eqEdit=!eqEdit;desenharEquip()};
$("eqComp").onclick=()=>{const d=equip.dono||[],tem=k=>(d.find(x=>x.k===k)||{}).v;if(tem("Prontuário")&&tem("Prontuário U")){$("eqEscolha").hidden=!$("eqEscolha").hidden;return}compartilharEquip("2")};
document.querySelectorAll("#eqEscolha [data-p]").forEach(b=>b.onclick=()=>{$("eqEscolha").hidden=true;compartilharEquip(b.dataset.p)});
async function compartilharEquip(qual){const t=textoEquip(qual);try{if(navigator.share){await navigator.share({title:"Meus equipamentos",text:t});return}}catch(e){if(e&&e.name==="AbortError")return}
  try{await navigator.clipboard.writeText(t);alert("📋 Copiado! Agora é só colar no WhatsApp ou e-mail.")}catch(e){prompt("Copie:",t)}};
const IMPRKEY=KEY+"_imprimir";let imprimir={};try{imprimir=JSON.parse(localStorage.getItem(IMPRKEY)||"{}")||{}}catch(e){}
function salvarImprimir(){try{localStorage.setItem(IMPRKEY,JSON.stringify(imprimir))}catch(e){}}
// prédio: só as contas que saem pra imprimir (Fila de Impressão) entram nas bobinas
function qImp(livro,qtd){const v=imprimir[livro];return v?Math.min(+v.q||0,qtd||Infinity):0}
// 🧾 quantas imprimem: o número da Fila de Impressão do PDA (conta por e-mail, casa vaga, impedimento... não imprimem)
// no mês que vem tira do total o que não imprimiu da última vez
// 🔌 082 inativo desligado: está dentro do total do livro mas não imprime. Nunca tira leitura feita (só o que sobra além das feitas e não lidos)
function desc082(x){if(!x||!x.ina||!x.qtd)return 0;return Math.max(0,Math.min(x.ina,x.qtd-(x.feitas||0)-(x.nl||0)))}
function ina082Ant(livro,data){return registros.filter(x=>x.livro===livro&&!x.releitura&&x.ina>0&&x.qtd&&(!data||x.data<data)).sort((a,b)=>b.data.localeCompare(a.data))[0]}
function qBob(livro,qtd,r){if(predios[livro])return qImp(livro,qtd);if(r&&r.impr!=null)return Math.min(r.impr,qtd);
  if(r&&r.ina)return Math.max(0,qtd-desc082(r));
  const ant=registros.filter(x=>x.livro===livro&&!x.releitura&&x.impr!=null&&x.qtd&&(!r||x.data<r.data)).sort((a,b)=>b.data.localeCompare(a.data))[0];
  if(ant)return Math.max(0,qtd-Math.max(0,ant.qtd-ant.impr));
  const a2=ina082Ant(livro,r?r.data:null);return a2?Math.max(0,qtd-desc082(a2)):qtd}
function bobinas(q){return q>0?Math.ceil(q/porBobina):0}
function txtBob(q){const b=bobinas(q);return b?"🧾 "+b+" bobina"+(b>1?"s":""):""}
// ⏰ livro lançado depois do dia da etapa no calendário (e aviso no mês seguinte)
// o calendário da ANEEL é o mesmo em todas as cidades: na ajuda, leu depois do dia da etapa = atraso
function diaPrevLivro(r){return r.diaPrev||(r.ajuda?diaDaEtapa(r.data.slice(0,7),r.etapa):"")}
function diasAtrasoLivro(r){if(r&&!r.releitura&&(r.diaPrev||r.ajuda)){const d=diaPrevLivro(r);return d&&r.data>d?diasEntre(r.data,d):0}if(!r||r.releitura||r.ajuda)return 0;const d=diaDaEtapa(r.data.slice(0,7),r.etapa);if(!d||r.data<=d)return 0;const c=cicloReal(r.data,r.etapa,normLoc(r.localidade));return foraDoLimite(c)?diasEntre(r.data,d):0}
function livroAtrasoTag(r){
  if(r.releitura)return "";const a=diasAtrasoLivro(r);let t="";
  if((r.diaPrev||r.ajuda)&&a){const dp=diaPrevLivro(r);{const msg="⏰ "+a+" dia"+(a>1?"s":"")+" de atraso\n\nPrevisto no calendário: "+fmt(dp).slice(0,5)+"\nLido em: "+fmt(r.data).slice(0,5)+"\n\nPra mudar o dia previsto: ✏️ Editar o livro.";
    t+=` <span class="atr-prev" role="button" aria-label="${a} dia${a>1?"s":""} de atraso, previsto ${fmt(dp).slice(0,5)}" onclick='alert(${JSON.stringify(msg).replace(/'/g,"&#39;")})'>⏰${a}</span>`}}

  const ant=somaMes(r.data.slice(0,7),-1),pa=registros.find(x=>x.livro===r.livro&&x.data.startsWith(ant)&&diasAtrasoLivro(x));
  if(pa){const dc=diaDaEtapa(pa.data.slice(0,7),pa.etapa),msg="❓ Mês passado o livro "+r.livro+" foi lido atrasado.\n\nEtapa "+p2(pa.etapa)+(dc?" · dia do calendário: "+dc.slice(8)+"/"+dc.slice(5,7):"")+"\nLido em: "+pa.data.slice(8)+"/"+pa.data.slice(5,7)+" ("+diasAtrasoLivro(pa)+" dia(s) de atraso)";
    t+=` <button type="button" class="atr-q" title="Mês passado este livro foi lido atrasado" onclick='alert(${JSON.stringify(msg).replace(/'/g,"&#39;")})'>❓</button>`}
  return t;
}
function chaveEnd(x,i){const e=String(x.end||"").toUpperCase().replace(/\s+/g," ").trim();return e||"#"+i}
function abrirConf(id){rcModo="conf";if(rcChave!==String(id))confAbertas=new Set();rcChave=String(id);desenharConf();$("rcFundo").hidden=false}
function desenharConf(){
  const r=registros.find(x=>String(x.id)===rcChave);if(!r)return;
  const c=confDe(r),cid=r.localidade||"",falta=[...new Set(c.filter(x=>!x.ok&&x.end.trim()).map(x=>comCidade(x.end,cid)))],lk=linkMaps(falta);
  $("rcTit").textContent="📝 Confirmações · livro "+r.livro;const _pz=c.some(x=>!x.ok)?txtPrazoRel(r):"";
  $("rcCorpo").innerHTML=`<div class="rc-sub">${_pz?_pz+"<br>":""}Etapa ${p2(r.etapa)} · ${fmt(r.data)} · anote a leitura que você digitou no PDA e toque no ✔ quando confirmar.</div>`+
    `<button type="button" id="confFotoBtn" class="rc-maps" style="background:#0f766e;margin-bottom:10px;border:0;width:100%;font-size:14px;cursor:pointer">📷 Ler foto(s) das confirmações do PDA</button>`+
    (()=>{const nf=c.filter(x=>!x.ok).length;return (nf?"":r.lancPDA?`<div class="rel-lanc ok">📲 Lançada no PDA em ${fmt(r.lancPDA).slice(0,5)} · está no livro ${esc(r.livro)} da Etapa ${p2(r.etapa)}<button type="button" onclick="lancarRel('${r.id}',false)">↩ desfazer</button></div>`:`<button type="button" class="rel-lanc-bt" onclick="lancarRel('${r.id}',true)">📲 Lancei no PDA</button>`)+`<div class="conf-resumo"><span>${nf?`⏳ Tem confirmação pra fazer`:`✔ Tudo confirmado${r.lancPDA?"":" · falta lançar no PDA"}`}</span>${lk&&falta.length>1?`<a class="bt-mapa todos" href="${lk}" target="_blank" rel="noopener" title="Caminho por todos os endereços que faltam" aria-label="Caminho por todos os endereços que faltam">🗺️</a>`:""}</div>`})()+
    // Mesmo endereço = um cartão só, com os medidores/registros dele dentro (sem numeração)
    (()=>{const gs=[],por={};c.forEach((x,i)=>{const k=chaveEnd(x,i);if(!por[k]){por[k]={k,itens:[]};gs.push(por[k])}por[k].itens.push(i)});
      gs.forEach(g=>g.pend=g.itens.some(i=>!c[i].ok));gs.sort((a,b)=>(b.pend-a.pend)||a.itens[0]-b.itens[0]);
      return gs.map(g=>{
        const x0=c[g.itens[0]],nc=numeroCasa(x0.end),falt=g.itens.filter(i=>!c[i].ok).length,todosOutro=g.itens.every(i=>c[i].outro);
        const st=falt?"⏳":todosOutro?"👥":"✔",cls=falt?" pend":todosOutro?" outro":"";
        const meds=[...new Set(g.itens.map(i=>c[i].med).filter(Boolean))].join(", "),regs=g.itens.map(i=>c[i].reg).filter(Boolean).join(", ");
        const rep=Math.max(...g.itens.map(i=>confRepetida(r,c[i]))),repTxt=rep?`<span class="rep-tag">🔴 ${rep>1?"vários meses seguidos":"mês passado também"}</span>`:"";
        if(!confAbertas.has(g.k))return `<button type="button" class="conf-linha${cls}${rep?" repete":""}" data-abre="${esc(g.k)}"><span class="cl-n">${st}</span><span class="cl-tx">${repTxt}${nc?`<b>Nº ${esc(nc)}</b> · `:""}${esc(x0.end||"sem endereço")}<small>${meds?esc(meds)+" · ":""}${regs?esc(regs)+" · ":""}${falt?"a confirmar":todosOutro?"recusada":g.itens.some(i=>c[i].impd)?"🚩 impedimento":"tudo confirmado"}</small></span><span class="cl-ab">▾</span></button>`;
        const linhas=g.itens.map(i=>{const x=c[i],done=x.ok||x.outro||x.impd;return `<div class="reg-lin${x.impd?" impd":x.outro?" outro-fez":x.ok?" feito":""}"><div class="reg-top"><span class="conf-info">${x.foto?`<button type="button" class="cf-ver" data-ver="${esc(x.fid)}" title="Ver a foto salva">🖼️</button> `:""}${x.reg?`<b>${esc(x.reg)}</b>`:"Registro"}${x.uc?` · UC ${esc(x.uc)}`:""}</span><span class="conf-btns">${!x.outro?`<button type="button" data-foto="${i}" title="Foto do visor: lê a leitura" aria-label="Foto do visor do medidor">📷</button><button type="button" data-edita="${i}" title="Corrigir medidor/leitura" aria-label="Corrigir">✏️</button>`:""}${done?`<button type="button" class="bt-fecha" data-volta="${i}">↩ Pendente</button>`:`<button type="button" data-impd="${i}" title="Impedimento (002): não deu pra ler" aria-label="Impedimento"><span class="flag-x">🚩</span></button><button type="button" data-outro="${i}" title="Recusada (outro agente fez)">🙅</button>`}<button type="button" data-tira="${i}" aria-label="Tirar esta">🗑️</button></span></div>
          <div class="reg-campos"><input data-i="${i}" data-k="med" type="text" inputmode="numeric" value="${esc(x.med)}" placeholder="Medidor" aria-label="Medidor" autocomplete="off"${x.ok&&!x.outro?" readonly":""}><input data-i="${i}" data-k="leit"${x.ok&&!x.outro?" readonly":""} type="text" inputmode="numeric" value="${esc(x.leit)}" placeholder="Leitura" aria-label="Leitura" autocomplete="off"><button type="button" class="ok" data-ok="${i}" aria-label="Confirmada">✔</button></div>
          ${x.impd?`<div class="conf-acoes"><span class="conf-impd"><span class="flag-x">🚩</span> Impedimento (002)${x.motivo?": <b>"+esc(x.motivo)+"</b>":""}${x.quando?" · "+fmt(x.quando):""}</span></div>`:x.outro?`<div class="conf-acoes"><span class="conf-outro">👥 Feita por outro agente de faturamento${x.agente?": <b>"+esc(x.agente)+"</b>":""}${x.quando?" · "+fmt(x.quando):""}</span></div>`:x.ok&&x.quando?`<div class="conf-acoes"><span class="conf-feita">✔ ${x.noPDA?"Lançada no PDA (sem leitura aqui)":"Confirmada"} em ${fmt(x.quando)}</span></div>`:""}</div>`}).join("");
        return `<div class="conf grupo"><div class="full conf-top"><span class="conf-info">${falt?"⏳ a confirmar":"✔ feito"}</span>${nc?`<span class="num-casa">🏠 Nº ${esc(nc)}</span>`:""}<span class="conf-btns">${x0.end.trim()?`<a class="bt-mapa" href="${linkMaps([comCidade(x0.end,cid)])}" target="_blank" rel="noopener" title="Abrir no mapa" aria-label="Abrir no mapa">🗺️</a>`:""}<button type="button" class="bt-fecha" data-fecha="${esc(g.k)}" aria-label="Fechar">▲</button></span></div>${rep?`<div class="full rep-aviso">🔴 Atenção: ${rep>1?"já são "+(rep+1)+" meses seguidos":"o mês passado também teve"} confirmação de leitura neste ${g.itens.some(i=>c[i].med)?"medidor":"endereço"}.</div>`:""}<div class="full"><textarea data-g="${g.itens.join(",")}" rows="1" class="end-txt" placeholder="Rua e número" autocomplete="off">${esc(x0.end)}</textarea></div><div class="full">${linhas}<button type="button" class="conf-mais" data-mais="${g.itens.join(",")}" title="Mais uma leitura deste medidor">➕ Leitura</button></div></div>`}).join("")})()+
    "";
  const b=$("rcCorpo");
  ajustarAltura(b);
  // endereço do cartão vale pra todos os registros dele
  b.querySelectorAll("textarea[data-g]").forEach(t=>t.onchange=()=>{const v=t.value.replace(/\s+/g," ").trim(),ids=t.dataset.g.split(",").map(Number);const eraAberto=[...confAbertas].length;ids.forEach(i=>c[i].end=v);confAbertas=new Set([chaveEnd(c[ids[0]],ids[0])]);localStorage.setItem(KEY,JSON.stringify(registros));desenharConf();render()});
  b.querySelectorAll("input[data-i],textarea[data-i]").forEach(inp=>{inp.oninput=()=>{c[+inp.dataset.i][inp.dataset.k]=inp.value.replace(/\s+/g," ").trim()};inp.onchange=()=>{c[+inp.dataset.i][inp.dataset.k]=inp.value.replace(/\s+/g," ").trim();localStorage.setItem(KEY,JSON.stringify(registros));render()}});
  $("confFotoBtn").onclick=()=>$("confArq").click();
  // 👥 Repassada: sai das pendentes sem precisar da leitura (fica anotado)
  b.querySelectorAll("[data-outro]").forEach(bt=>bt.onclick=()=>{const x=c[+bt.dataset.outro];if(x.outro){x.outro=false;x.ok=false;delete x.agente}else{
      // pede o nome do agente que fez (sugere o último usado)
      let ult="";try{ult=localStorage.getItem(KEY+"_ultimo_agente")||""}catch(e){}
      const nome=prompt("🙅 Recusada — feita por outro agente de faturamento.\n\nNome do agente (pode deixar em branco):",ult);
      if(nome===null)return;
      if(!nome.trim()&&!confirm("Marcar como recusada mesmo sem o nome do agente?"))return;
      x.outro=true;x.ok=true;x.quando=hoje();x.agente=nome.trim();apagaFotoConf(x);proxPend(+bt.dataset.outro);
      try{if(x.agente)localStorage.setItem(KEY+"_ultimo_agente",x.agente)}catch(e){}
    }localStorage.setItem(KEY,JSON.stringify(registros));desenharConf();render()});
  // 🗑️ tira a confirmação (ex.: foi cancelada)
  b.querySelectorAll("[data-tira]").forEach(bt=>bt.onclick=()=>{
    const i=+bt.dataset.tira;
    if(c.length===1){if(confirm("Esta é a única confirmação do livro "+r.livro+".\nApagar a releitura inteira?")){registros=registros.filter(x=>x!==r);localStorage.setItem(KEY,JSON.stringify(registros));$("rcFundo").hidden=true;render()}return}
    if(!confirm("Tirar esta confirmação"+(c[i].reg?" "+c[i].reg:"")+(c[i].med?" (medidor "+c[i].med+")":"")+"?\nO livro passa a ter "+(c.length-1)+" releitura(s)."))return;
    c.splice(i,1);r.qtd=c.length;confAbertas=new Set();localStorage.setItem(KEY,JSON.stringify(registros));desenharConf();render()});
  b.querySelectorAll("[data-abre]").forEach(bt=>bt.onclick=()=>{confAbertas=new Set([bt.dataset.abre]);desenharConf();const t=b.querySelector(".conf");if(t)t.scrollIntoView({block:"nearest",behavior:"smooth"})});
  // ↩ volta pra pendente (confirmada ou recusada)
  b.querySelectorAll(".cf-ver").forEach(bt=>bt.onclick=async()=>{const d=await gGet(bt.dataset.ver);if(!d)return alert("A foto não está mais neste celular.");const v=document.createElement("div");v.className="modal-fundo obs-fundo gd-zoom";v.innerHTML=`<img src="${d}" alt="foto">`;v.onclick=()=>v.remove();document.body.appendChild(v)});
  b.querySelectorAll("[data-mais]").forEach(bt=>bt.onclick=()=>{const ids=bt.dataset.mais.split(",").map(Number),x0=c[ids[ids.length-1]];
    const reg=prompt("➕ Mais uma leitura do medidor "+(x0.med||"")+"\n\nRegistro (ex.: GTP-303, ERA-024). Pode deixar em branco:","");if(reg===null)return;
    r.qtd=(r.qtd||c.length)+1;confDe(r);const n=r.conf[r.conf.length-1];Object.assign(n,{med:x0.med||"",end:x0.end||"",uc:x0.uc||"",reg:reg.trim().toUpperCase(),leit:"",ok:false});
    const it=r.conf.splice(r.conf.length-1,1)[0];r.conf.splice(ids[ids.length-1]+1,0,it);
    confAbertas=new Set([chaveEnd(it,ids[0])]);localStorage.setItem(KEY,JSON.stringify(registros));desenharConf();render()});
  b.querySelectorAll("[data-impd]").forEach(bt=>bt.onclick=()=>{const i=+bt.dataset.impd,x=c[i];
    const m=prompt("🚩 Impedimento (002) — não deu pra ler este medidor.\n\nMotivo (opcional): ex.: portão fechado, cachorro, medidor tampado","");if(m===null)return;
    x.impd=true;x.ok=true;x.outro=false;x.quando=hoje();x.motivo=m.trim();apagaFotoConf(x);proxPend(i);localStorage.setItem(KEY,JSON.stringify(registros));desenharConf();render()});
  b.querySelectorAll("[data-volta]").forEach(bt=>bt.onclick=()=>{const x=c[+bt.dataset.volta];x.ok=false;x.outro=false;delete x.impd;delete x.motivo;delete x.agente;delete x.quando;localStorage.setItem(KEY,JSON.stringify(registros));desenharConf();render()});
  // depois de resolver uma, já abre a próxima que falta
  // se o endereço ainda tem registro faltando, fica aberto; senão abre o próximo endereço que falta
  const proxPend=j=>{const kj=chaveEnd(c[j],j);if(c.some((y,n)=>n!==j&&!y.ok&&chaveEnd(y,n)===kj)){confAbertas=new Set([kj]);return}
    confAbertas=new Set();const k=c.findIndex((y,n)=>n!==j&&!y.ok);if(k>=0)confAbertas.add(chaveEnd(c[k],k))};
  // ✏️ destrava os campos da leitura confirmada pra corrigir (continua confirmada)
  // 📷 foto do visor do medidor: lê o número e põe na leitura (você confere antes)
  b.querySelectorAll("[data-foto]").forEach(bt=>bt.onclick=()=>{fotoLeitAlvo=+bt.dataset.foto;$("leitArq").click()});
  b.querySelectorAll("[data-edita]").forEach(bt=>bt.onclick=()=>{const l=bt.closest(".reg-lin");l.querySelectorAll("input").forEach(x=>{x.readOnly=false;x.classList.add("editando")});const f=l.querySelector("input[data-k='leit']");f.focus();f.select&&f.select()});
  b.querySelectorAll("[data-fecha]").forEach(bt=>bt.onclick=()=>{confAbertas.delete(bt.dataset.fecha);desenharConf()});
  b.querySelectorAll("[data-ok]").forEach(bt=>bt.onclick=()=>{const x=c[+bt.dataset.ok];const li=bt.closest(".reg-lin"),vl=li&&li.querySelector("input[data-k=leit]");if(vl&&vl.value.trim()&&!x.leit)x.leit=vl.value.replace(/\s+/g,"").trim();if(!x.ok&&!String(x.leit||"").trim()){if(!confirm("Não tem leitura digitada aqui.\n\nJá lançou essa leitura no PDA?\n\nOK = Sim, já lancei no PDA (confirma assim mesmo)\nCancelar = voltar e digitar a leitura\n\n(Se não deu pra ler: 🚩 impedimento ou 🙅 recusada. Aberta sem querer: 🗑️)"))return;x.noPDA=true}else if(!x.ok)delete x.noPDA;x.ok=!x.ok;if(!x.ok)delete x.noPDA;x.outro=false;if(x.ok){x.quando=hoje();apagaFotoConf(x);proxPend(+bt.dataset.ok)}localStorage.setItem(KEY,JSON.stringify(registros));desenharConf();render()});
}
// Foto da tela de confirmação do PDA: UC, endereço, medidor (MD) e os registros (CON-003, GTP-303...)
// Cada registro vira uma ficha: medidor com 2 registros = 2 confirmações
// Número da casa: o primeiro número depois da rua (ex.: "R JUVENAL DE CAMPOS, 2405, LOT MODENA" → 2405)
function numeroCasa(e){const m=String(e||"").match(/,\s*(?:N[º°O]?\.?\s*)?(\d+[A-Z]?)\b/i)||String(e||"").match(/\s(\d{1,5}[A-Z]?)\b(?!.*\d)/);return m?m[1]:""}
// Caixa do endereço cresce pra mostrar tudo, sem cortar o número
function ajustarAltura(box){box.querySelectorAll("textarea.end-txt").forEach(t=>{const f=()=>{t.style.height="auto";t.style.height=Math.max(38,t.scrollHeight+2)+"px"};f();requestAnimationFrame(f);setTimeout(f,60);t.addEventListener("input",f)})}
const IA_CONFIRMA='Esta é uma foto da tela de leitura de um PDA de energia (confirmação de leitura). Leia: UC (número depois de "UC:"), o endereço (rua, número e bairro), os códigos de registro: são as ABAS no meio da tela, no formato de 3 letras e 3 números (ex.: "CON-003" e "ERA-024"); liste TODAS as abas que aparecem, mesmo a que não está selecionada e o MEDIDOR (depois de "MD:", ex.: "B18670249"). Não confunda o número da casa com o medidor. Responda só JSON: {"uc":"000307981404503","end":"R JOAO ANTONIO FONSECA, 132, PQ SANTA MARIA","registros":["CON-003"],"md":"B18670249"}. Use null no que não conseguir ler.';
function lerConfirmacaoPDA(t){
  const L=t.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const uc=((t.match(/UC\s*[:;]?\s*((?:\d\s?){15})/)||[])[1]||"").replace(/\D/g,"");
  const md=(t.match(/MD\s*[:;.]?\s*([A-Z0-9]{5,12})/)||[])[1]||"";
  const regs=[...new Set([...t.matchAll(/\b([A-Z]{3})\s?-\s?(\d{3})\b/g)].map(m=>m[1]+"-"+m[2]))];
  let end="";const iUC=L.findIndex(l=>/UC\s*[:;]/.test(l));
  for(let i=Math.max(0,iUC);i<L.length;i++){
    const m=L[i].match(/(?:^|[^A-Za-z])((?:R|AV|AL|TV|TRAV|EST|ROD|PC|PCA|RUA|AVENIDA)\s+[A-Z][A-Z0-9 ,.'ºª-]{3,})/);
    if(m){end=m[1].replace(/[\s,]+$/,"").trim();
      if(/\b(LOT|JD|JARDIM|VL|VILA|PQ|PARQUE|CJ|RES|BAIRRO)$/.test(end)&&L[i+1]){const n=L[i+1].match(/\b([A-Z]{3,}(?:\s+[A-Z]{2,})*)\b/);if(n)end+=" "+n[1]}
      break}
  }
  return (regs.length?regs:[""]).map(reg=>({uc,med:md,reg,end}));
}
$("confArq").onchange=async e=>{
  const files=[...(e.target.files||[])];e.target.value="";if(!files.length)return;
  const r=registros.find(x=>String(x.id)===rcChave);if(!r)return;
  const b=$("confFotoBtn"),txt=b.textContent;b.disabled=true;
  try{
    let w=null;const leitor=async()=>{if(!w){b.textContent="⏳ Preparando leitor...";await carregarOCR();w=await Tesseract.createWorker("eng",1,{logger:l=>{if(l.status==="recognizing text")b.textContent="⏳ Lendo... "+Math.round(l.progress*100)+"%"}});await w.setParameters({tessedit_pageseg_mode:"6"})}return w};
    let fichas=[],fi=0;
    for(const f of files){fi++;
      if(iaChave){b.textContent="🤖 "+(files.length>1?"Foto "+fi+"/"+files.length+" · ":"")+"Lendo com IA...";let fs=[];
        try{const j=await iaLer(f,IA_CONFIRMA);if(j&&(j.md||j.end||j.uc)){const regs=(Array.isArray(j.registros)&&j.registros.length?j.registros:[""]).map(x=>String(x||"").toUpperCase().replace(/\s+/g,""));
          fs=regs.map(reg=>({uc:String(j.uc||"").replace(/\D/g,""),med:String(j.md||"").toUpperCase().replace(/\s+/g,""),reg,end:String(j.end||"").toUpperCase().replace(/\s+/g," ").trim()}))}}catch(err){iaFalhou(err)}
        if(fs.length){fichas=fichas.concat(fs);continue}}
      await leitor();
      const img=await new Promise((ok,er)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=er;i.src=URL.createObjectURL(f)});
      const maxL=Math.floor(Math.sqrt(15e6*img.width/img.height));
      const res=await w.recognize(prepararPDA(img,Math.min(2200,maxL)));
      let fs=lerConfirmacaoPDA(res.data.text).filter(x=>x.med||x.end||x.uc);
      if(!fs.length){const r2=await w.recognize(prepararClara(img,Math.min(2200,maxL)));fs=lerConfirmacaoPDA(r2.data.text).filter(x=>x.med||x.end||x.uc)}
      URL.revokeObjectURL(img.src);fichas=fichas.concat(fs);
    }
    if(w)await w.terminate();
    if(!fichas.length)return alert("Não consegui ler as confirmações desta(s) foto(s).\nTente uma foto reta, com boa luz, mostrando a tela do PDA.");
    const c=confDe(r);
    if(fichas.length>c.length&&confirm("Li "+fichas.length+" confirmação(ões), mas o livro está com "+c.length+".\nAumentar o livro pra "+fichas.length+"?")){r.qtd=fichas.length;confDe(r)}
    // preenche as fichas vazias primeiro, sem apagar a leitura que você já digitou
    // 1º) ficha que já tem o mesmo medidor: atualiza (endereço, UC, registro) sem apagar a leitura; 2º) fichas vazias
    const usadas=new Set(),resto=[];
    fichas.forEach(f=>{const m=f.med&&r.conf.find(x=>!usadas.has(x)&&x.med===f.med&&(!x.reg||!f.reg||x.reg===f.reg));
      if(m){usadas.add(m);if(f.reg)m.reg=f.reg;if(f.uc)m.uc=f.uc;if(f.end)m.end=f.end}else resto.push(f)});
    resto.forEach(f=>{const x=r.conf.find(y=>!usadas.has(y)&&!y.med&&!y.ok);if(!x)return;usadas.add(x);x.uc=f.uc;x.reg=f.reg;x.med=f.med;if(f.end)x.end=f.end});
    localStorage.setItem(KEY,JSON.stringify(registros));desenharConf();render();
    alert("📷 Li "+fichas.length+" confirmação(ões):\n\n"+fichas.map(f=>"• "+(f.med||"?")+(f.reg?" · "+f.reg:"")+"\n   "+(f.end||"")).join("\n")+"\n\nAgora é só digitar a leitura de cada uma.");
  }catch(err){alert("Não foi possível ler a foto agora. Confira se tem internet e tente de novo.")}
  finally{b.disabled=false;b.textContent=txt}
};
// Tira os endereços (R, AV, AL, TV...) de qualquer foto: tela do PDA, lista, papel
// Foto clara: o "R" do começo às vezes some. Aceita linha com nome de rua mesmo sem o tipo (põe "R")
function lerRuasTolerante(t){
  const out=lerRuasDaFoto(t);
  t.split(/\n+/).forEach(l=>{
    l=l.toUpperCase().replace(/[^A-ZÀ-Ú0-9 ,]/g," ").replace(/\s+/g," ").trim();
    if(new RegExp("^("+TIPOS_RUA+")\\s").test(l))return;
    const w=l.split(" ");while(w.length&&w[0].length<=2&&!/^\d/.test(w[0]))w.shift();
    const nome=w.join(" ");if((nome.match(/[A-ZÀ-Ú]{4,}/g)||[]).length>=2&&!/LIMITE|ETAPA|LEITURA|ROTA|LIVRO/.test(nome))out.push("R "+nome);
  });
  return out;
}
// Roteiro do PDA: linhas "(222 --) R JOAO ABRAME". O leitor às vezes gruda o R no nome ("RAMALIA") — aqui separa.
// Separa o tipo de rua grudado no nome: "RAMALIA"→"R AMALIA", "AVSAO JOAO"→"AV SAO JOAO", "PCADA MATRIZ"→"PCA DA MATRIZ", "TVANTONIO"→"TV ANTONIO"...
const TIPOS_GRUDA=["RUA","AVENIDA","TRAVESSA","ALAMEDA","PRAÇA","PRACA","ESTRADA","RODOVIA","VIELA","LARGO","BECO","PÇA","PCA","PRC","TRAV","TRV","ESTR","EST","ROD","VLA","AV","TV","AL","LG","BC","R"];
function separarTipo(x){
  x=String(x||"").replace(/^(\S+)\.\s*/,"$1 ").trim();
  if(new RegExp("^("+TIPOS_RUA+")\\s").test(x))return x;
  for(const t of TIPOS_GRUDA){if(x.startsWith(t)){const r=x.slice(t.length);if(/^[A-ZÀ-Ú0-9]{1}/.test(r)&&(/^[A-ZÀ-Ú]{3,}/.test(r)||/^(DA|DE|DO|DOS|DAS)\s/.test(r)||/^\d/.test(r)))return t+" "+r}}
  return x;
}
// Observação do "não fiz" (opcional): ex. "fiz a Etapa 09 atrasada"
function pedirObsNaoFiz(atual){return new Promise(ok=>{
  const v0=atual&&atual!=="li em outro lugar"&&atual!=="outro serviço"?atual:"";
  const f=document.createElement("div");f.className="modal-fundo obs-fundo";
  f.innerHTML=`<div class="modal obs-modal"><h3>📝 Observação</h3><div class="hint">Por que não fez? Pode deixar em branco. Ex.: fiz a Etapa 09 atrasada.</div><textarea rows="5" placeholder="Escreva aqui...">${esc(v0)}</textarea><div class="obs-bts"><button type="button" class="c">Cancelar</button><button type="button" class="o">✔ Salvar</button></div></div>`;
  document.body.appendChild(f);const t=f.querySelector("textarea");setTimeout(()=>{t.focus();t.setSelectionRange(t.value.length,t.value.length)},50);
  const fim=v=>{f.remove();ok(v)};
  f.querySelector(".c").onclick=()=>fim(null);
  f.querySelector(".o").onclick=()=>fim(t.value.replace(/\s+$/,"").trim()||"li em outro lugar");
})}
// 📊 Resumo por Mensagem do PDA: "002 - IMPEDIMENTO DE LEITURA / Quantidade: 1"
function lerResumoPDA(t){
  const L=t.split(/\n+/).map(x=>x.toUpperCase()),out=[];
  L.forEach((l,i)=>{
    const m=l.match(/(\d{2,3})\s*[-–]\s*([A-ZÀ-Ú][A-ZÀ-Ú ]{4,})/)||l.match(/(IMPEDIMENTO[A-ZÀ-Ú ]*|LEITURA NORMA[A-Z]*|LEITURA ACIMA[A-ZÀ-Ú ]*|LEITURA ABAIXO[A-ZÀ-Ú ]*|INATIVO[A-ZÀ-Ú ]*|UC DESLIGADA[A-ZÀ-Ú ]*|VIRADA[A-ZÀ-Ú ]*|C[AÃ]ES SOLTOS[A-ZÀ-Ú ]*|TROCA DE EQUIP[A-ZÀ-Ú ]*|DEVOLU[CÇ][AÃ]O DE LIVRO[A-ZÀ-Ú ]*)/)||l.match(/^\s*(000|002|004|009|011|012|013|041|081|082|999)\s*[-–]/);if(!m)return;
    const nome=(m[2]||(/^\d{3}$/.test(m[1])&&RES_NOMES[m[1]])||m[1]).replace(/\s+/g," ").trim();let q=null;
    for(const y of [l,L[i+1]||"",L[i+2]||""]){const k=y.match(/(?:QUANT|UANT|ANTID|TIDADE|DADE)\D{0,4}(\d{1,4})/);if(k){q=+k[1];break}}
    if(q!=null&&!out.some(o=>o.nome.slice(0,10)===nome.slice(0,10)))out.push({cod:m[2]?m[1]:"",nome,q});
  });
  return out;
}
let nlAlvo="impQtd",nlBtn="nlFotoBtn",resFeitas=0,resIna=0;
$("nlFotoBtn").onclick=()=>{nlAlvo="impQtd";nlBtn="nlFotoBtn";$("nlArq").click()};
function nlDoLivro(id){nlAlvo="rec:"+id;nlBtn="nlFotoBtn";$("nlArq").click()}
$("edNlFoto").onclick=()=>{nlAlvo="edNl";nlBtn="edNlFoto";$("nlArq").click()};
$("nlArq").onchange=async e=>{
  const f=(e.target.files||[])[0];e.target.value="";if(!f)return;const b=$(nlBtn);b.disabled=true;b.textContent="⏳";
  try{
    let itens=[];
    let filaN=null;
    if(iaChave){b.textContent="🤖";try{const jr=await iaLer(f,IA_RESUMO);if(jr&&!Array.isArray(jr)&&+jr.fila>0)filaN=+jr.fila;itens=itensResumoIA(jr).filter(x=>x.cod||x.q);
      // não achou o 002/009? pergunta de novo, mais direto
      if(!filaN&&!itens.some(x=>["002","009","000"].includes(x.cod)||/IMPEDIMENTO|DESLIGADA|NORMAL/.test(x.nome))){const k=itensResumoIA(await iaLer(f,IA_RESUMO2));if(k.length)itens=k}}catch(err){iaFalhou(err)}b.textContent="⏳"}
    // 🖨️ era a foto da Fila de Impressão: guarda as impressas no livro
    if(!itens.length&&filaN){const r=nlAlvo.startsWith("rec:")?registros.find(x=>String(x.id)===nlAlvo.slice(4)):registros.filter(x=>!x.releitura).slice(-1)[0];
      if(!r)return alert("🖨️ Essa foto é da Fila de Impressão, que é só pra prédio.\nPra lançar os não lidos, tire a foto do Resumo por Mensagem.");
      const v=prompt("🖨️ Essa foto é da Fila de Impressão.\nLivro "+r.livro+": "+filaN+" contas impressas → "+bobinas(Math.min(filaN,r.qtd))+" bobina(s).\n\nConfira e toque OK:",filaN);if(v===null)return;const q=parseInt(v,10);if(!(q>=0))return;
      if(predios[r.livro]){imprimir[r.livro]={q,quando:r.data.slice(0,7)};salvarImprimir()}else return alert("🖨️ Essa foto é da Fila de Impressão, que é só pra prédio.\nPra este livro, tire a foto do Resumo por Mensagem.");render();return}
    if(!itens.length){
    await carregarOCR();const img=await new Promise((ok,er)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=er;i.src=URL.createObjectURL(f)});
    const maxL=Math.floor(Math.sqrt(15e6*img.width/img.height)),w=await Tesseract.createWorker("eng",1);await w.setParameters({tessedit_pageseg_mode:"6"});
    itens=lerResumoPDA((await w.recognize(prepararPDA(img,Math.min(2200,maxL)))).data.text);
    lerResumoPDA((await w.recognize(prepararClara(img,Math.min(2200,maxL)))).data.text).forEach(x=>{if(!itens.some(o=>o.nome.slice(0,10)===x.nome.slice(0,10)))itens.push(x)});
    await w.terminate();URL.revokeObjectURL(img.src);}
    if(!itens.length)return alert("Não consegui ler o Resumo por Mensagem nesta foto.\nTente sem reflexo (faça sombra na tela).");
    // não lidos = 002 (impedimento) + 009 (UC desligada em campo) + 041 (cães soltos); 004, 081 e 082 NÃO entram
    // 🔌 082 inativo desligado: não é não lido, mas não imprime conta → guarda no livro pra tirar das bobinas (opcional)
    const e082=itens.filter(x=>x.cod==="082"||/INATIVO DESLIGADO/.test(x.nome)).reduce((t,x)=>t+(+x.q||0),0);
    const e002=itens.filter(x=>/IMPEDIMENTO/.test(x.nome)||x.cod==="002").reduce((t,x)=>t+x.q,0),e009=itens.filter(x=>x.cod==="009"||/UC DESLIGADA|DESLIGADA EM CAMPO/.test(x.nome)).reduce((t,x)=>t+x.q,0),e041=itens.filter(x=>x.cod==="041"||/C[AÃ]ES SOLTOS/.test(x.nome)).reduce((t,x)=>t+x.q,0),nl=e002+e009+e041;
    const feitas=itens.filter(x=>["000","011","012","013","004"].includes(x.cod)||/^LEITURA|VIRADA|TROCA DE EQUIP/.test(x.nome)).reduce((t,x)=>t+x.q,0),recF=nlAlvo.startsWith("rec:")?registros.find(x=>String(x.id)===nlAlvo.slice(4)):null,txtFeitas=feitas?"\n\n✅ Leituras feitas (normal + acima + abaixo + virada + troca): "+feitas+(recF&&recF.qtd?" · livro: "+recF.qtd:""):"";
    // preenche sozinho com o 002 (impedimento); dá pra corrigir no campo depois
    const v=String(nl);toast("🚩 Resumo lido: "+nl+" não lido"+(nl===1?"":"s")+(e009||e041?" (002: "+e002+(e009?" + 009 desligada: "+e009:"")+(e041?" + 041 cães: "+e041:"")+")":" (002)")+(feitas?" · "+feitas+" leituras feitas":"")+(e082?" · 🔌 082: "+e082+" inativos":"")+(recF?" · livro "+recF.livro:""));const n=Math.max(0,parseInt(v,10)||0);const e999=itens.filter(x=>x.cod!=="MED"&&!/MED\s*INCOMPLETO|\bANL\b/.test(x.nome)&&(x.cod==="999"||/DEVOLU/.test(x.nome))).reduce((t,x)=>t+x.q,0);
    if(e999>0){const rr=nlAlvo.startsWith("rec:")?registros.find(x=>String(x.id)===nlAlvo.slice(4)):null,ult=registros.filter(x=>!x.releitura).slice(-1)[0];
      const lv=rr?rr.livro:prompt("📝 999 · devolução de livro incompleto: "+e999+" leitura"+(e999>1?"s":"")+" vão voltar pra confirmação.\n\nDe qual livro? Fica nas releituras como ⏳ aguardando voltar. O prazo de 7 dias só começa quando voltar no PDA.",rr?rr.livro:(livroDigitado()||(ult?ult.livro:"")));
      if(lv&&lv.trim())aguardarRel(lv.trim(),e999,rr||registros.filter(x=>x.livro===lv.trim()&&!x.releitura).slice(-1)[0])}
    resFeitas=feitas;if(nlAlvo.startsWith("rec:")){const r=registros.find(x=>String(x.id)===nlAlvo.slice(4));if(r){r.nl=n||undefined;if(feitas)r.feitas=feitas;if(e082&&e082<=r.qtd)r.ina=e082;localStorage.setItem(KEY,JSON.stringify(registros));render()}}else{
      // Bandeirinha da tela principal usada DEPOIS de salvar o livro: oferece colar no último livro salvo
      const vazias=![...$("livroRows").children].some(linhaPreenchida),ult=registros.filter(x=>!x.releitura).slice(-1)[0];
      if((n>0||e082>0)&&nlAlvo==="impQtd"&&vazias&&ult&&!ult.releitura&&n<=ult.qtd&&e082<=ult.qtd&&Number.isFinite(+ult.id)&&Date.now()-Math.floor(+ult.id)<4*36e5&&confirm("🚫 Colocar "+(n>0?n+" não lido"+(n>1?"s":""):"")+(n>0&&e082?" e ":"")+(e082?"🔌 "+e082+" inativo"+(e082>1?"s":"")+" desligado"+(e082>1?"s":"")+" (082)":"")+" dentro do livro "+ult.livro+" (o último que você salvou)?\n\nOK = no livro (o app avisa no mês que vem)\nCancelar = só no dia")){if(n>0)ult.nl=n;if(e082)ult.ina=e082;if(feitas)ult.feitas=feitas;localStorage.setItem(KEY,JSON.stringify(registros));render();return}
      if(nlAlvo==="edNl"&&e082)$("edIna").value=e082;else if(nlAlvo==="impQtd")resIna=e082;
      $(nlAlvo).value=n;$(nlAlvo).dispatchEvent(new Event("input",{bubbles:true}))}
  }catch(err){alert("Não foi possível ler a foto agora. Confira se tem internet e tente de novo.")}
  finally{b.disabled=false;b.innerHTML='<span class="flag-x">🚩</span><small class="f002">RESUMO</small>'}
};
function lerRoteiroPDA(t){
  const out=[];
  t.split(/\n+/).forEach(l=>{
    const m=l.match(/(?:\(|^|\s)[\dOoIl|]{1,5}\s*[-–—~_.]{1,3}\s*[-–—~_.]?\s*[)\]}|]?\s*(.+)$/)||l.match(/[-–]\s*[)\]}]\s*(.+)$/);if(!m)return;
    let x=m[1].toUpperCase().replace(/[^A-ZÀ-Ú0-9 ()]/g," ").replace(/\(.*$/,"").replace(/\s+/g," ").trim().replace(/^[\d\s]+(?=[A-Z])/,"");
    // tira sujeira do fim (letras soltas, símbolos)
    let w=x.split(" ");while(w.length>2&&(w[w.length-1].length<=2&&!/^(DA|DE|DO|II|E)$/.test(w[w.length-1])))w.pop();x=w.join(" ");
    x=separarTipo(x);
    if(!new RegExp("^("+TIPOS_RUA+")\\s").test(x)){if((x.match(/[A-Z]{3,}/g)||[]).length>=2)x="R "+x;else return}
    if(ruaValida(x))out.push(x);
  });
  return out;
}
function lerRuasDaFoto(t){t=String(t).split(/\n/).map(l=>l.replace(/(^|[)\]|\s])([A-ZÀ-Ú]{4,}(?:\s[A-ZÀ-Ú]+)+)/,(m,a,b)=>a+separarTipo(b))).join("\n");
  // só letras maiúsculas (como no PDA): evita pegar sujeira da foto
  const limpa=x=>x.replace(/\s*[|“"”‘’'`]+.*$/,"").replace(/\b(TATUI|SP)\b.*$/,"").replace(/[\s,.-]+$/,"").trim();
  const L=t.split(/\n+/).map(x=>x.trim()).filter(Boolean),out=[];
  for(let i=0;i<L.length;i++){
    const m=L[i].match(new RegExp("(?:^|[^A-Za-z])((?:"+TIPOS_RUA+")\\.?\\s+[A-ZÀ-Ú0-9][A-ZÀ-Ú0-9 ,.ºª-]{0,})"));
    if(!m)continue;
    let e=limpa(m[1]);
    // continua na linha de baixo? (sem número ainda, ou termina em vírgula / LOT, JD, VILA...)
    const nx=L[i+1]||"";
    if(nx&&!/LIMITE|KM\b|UC\s*:|CON-|MD\s*:|SEQ/i.test(nx)&&!new RegExp("^\\s*("+TIPOS_RUA+")\\.?\\s","i").test(nx)&&(/,$/.test(m[1].trim())||/\b(LOT|JD|JARDIM|VL|VILA|PQ|PARQUE|BAIRRO|RES)$/.test(e))){
      const w=(nx.match(/[A-ZÀ-Ú0-9][A-ZÀ-Ú0-9 ,.ºª-]*/g)||[]).sort((a,b)=>b.length-a.length)[0]||"";
      const n=limpa(w);if(n.length>=3&&n.length<45){e+=(/,$/.test(e)?" ":(/\d/.test(e)?" ":" "))+n;i++}
    }
    e=e.replace(/^R(?=\d)/,"R ").replace(/\s+/g," ").replace(/\s,/g,",");
    if(ruaValida(e.replace(/^(\S+)\.\s/,"$1 ")))out.push(e);
  }
  return out;
}
// 📷 rota com várias fotos: lê uma, toca em ➕ e manda a próxima; no fim coloca tudo de uma vez
let rotaAcum=[],rotaFotos=0;
function rotaResumo(r){
  const f=document.createElement("div");f.className="modal-fundo obs-fundo";
  f.innerHTML=`<div class="modal obs-modal"><h3>📷 Achei ${rotaAcum.length} rua(s)</h3><div class="hint">${rotaFotos>1?rotaFotos+" fotos somadas · ":""}rua repetida entra uma vez só · tem mais tela no PDA? toque em ➕</div>
  <div class="pda-res">${rotaAcum.map(x=>`<div>• ${esc(x)}</div>`).join("")}</div>
  <div class="obs-bts"><button type="button" class="m">➕ Mais uma foto</button><button type="button" class="o">✔ Colocar na rota</button></div><button type="button" class="c hl-canc">Cancelar</button></div>`;
  document.body.appendChild(f);
  f.querySelector(".m").onclick=()=>{f.remove();$("rotaArq").click()};
  f.querySelector(".c").onclick=()=>{f.remove();rotaAcum=[];rotaFotos=0};
  f.querySelector(".o").onclick=()=>{f.remove();r.ruas=r.ruas.filter(Boolean).concat(rotaAcum);rotaAcum=[];rotaFotos=0;salvarRotas();desenharRota();render()};
}
$("rotaArq").onchange=async e=>{
  const files=[...(e.target.files||[])];e.target.value="";if(!files.length)return;
  const r=rotaDoLivro(rcChave),b=$("rotaFotoBtn"),txt=b.textContent;b.disabled=true;
  try{
    let w=null;const leitor=async()=>{if(!w){b.textContent="⏳ Preparando leitor...";await carregarOCR();w=await Tesseract.createWorker("eng",1,{logger:l=>{if(l.status==="recognizing text")b.textContent="⏳ Lendo... "+Math.round(l.progress*100)+"%"}});await w.setParameters({tessedit_pageseg_mode:"6"})}return w};
    let ruas=[];
    for(const f of files){
      if(iaChave){b.textContent="🤖 Lendo com IA...";let ri=[];
        try{const j=await iaLer(f,IA_ROTEIRO);ri=((j&&j.ruas)||[]).map(x=>separarTipo(String(x).toUpperCase().replace(/\([^)]*\)/g," ").replace(/\.{2,}.*$/,"").replace(/[^A-ZÀ-Ú0-9 ]/g," ").replace(/\s+/g," ").trim().replace(/^[\d\s]+(?=[A-Z])/,""))).filter(x=>x&&ruaValida(x))}catch(err){iaFalhou(err)}
        if(ri.length){ruas=ruas.concat(ri);continue}}
      const w=await leitor();
      const img=await new Promise((ok,er)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=er;i.src=URL.createObjectURL(f)});
      const maxL=Math.floor(Math.sqrt(15e6*img.width/img.height));
      const res=await w.recognize(prepararPDA(img,Math.min(2200,maxL)));
      const res2=await w.recognize(prepararClara(img,Math.min(2200,maxL)));URL.revokeObjectURL(img.src);
      {const r1=lerRoteiroPDA(res.data.text);ruas=ruas.concat(r1.length?r1:lerRuasDaFoto(res.data.text));const r2=lerRoteiroPDA(res2.data.text);ruas=ruas.concat(r2.length?r2:(r1.length>=3?lerRuasDaFoto(res2.data.text):lerRuasTolerante(res2.data.text)))}
    }
    if(w)await w.terminate();ruas=arrumarRuas(ruas);
    // não repete rua que já está na rota
    {const base=r.ruas.filter(x=>x.trim()).concat(rotaAcum);ruas=ruas.filter(x=>{if(ruaRepetida(x,base))return false;base.push(x);return true})}
    if(ruas.length)rotaFotos++;rotaAcum=rotaAcum.concat(ruas);
    if(!rotaAcum.length)return alert("Não achei endereço novo nesta(s) foto(s).\nTente uma foto reta, com boa luz, onde dê pra ler as ruas.");
    if(!ruas.length)alert("Nesta foto não tinha rua nova (as ruas já estavam na lista).");
    rotaResumo(r);
  }catch(err){alert("Não foi possível ler a foto agora. Confira se tem internet e tente de novo.")}
  finally{b.disabled=false;b.textContent=txt}
};
$("rcFechar").onclick=()=>{rcVeioDaLista=false;$("rcFundo").hidden=true;render()};
$("rcVoltar").onclick=()=>{if(rcModo==="conf"&&rcVeioDaLista){rcVeioDaLista=false;abrirListaRel();render();return}$("rcFundo").hidden=true;render()};
// Lista "📍 Voltar pra confirmar" (aparece na tela inicial quando tem confirmação pendente)
function confPendentes(){const out=[],lim=somaDias(hoje(),-40);registros.forEach(r=>{if(r.releitura&&!r.aguarda&&Array.isArray(r.conf)&&r.data>=lim){const f=r.conf.filter(x=>!x.ok).length;if(f)out.push({r,f})}});return out}
function editar(id){
  const r=registros.find(x=>String(x.id)===String(id));if(!r)return;editId=String(id);
  $("edData").value=r.data;$("edEtapa").value=r.etapa;$("edLocal").value=r.localidade||"";$("edPront").value=r.prontuario||"";$("edLivro").value=r.livro;
  $("edPart").checked=!!r.particionado;$("edRel").checked=!!r.releitura;$("edDe").value=r.de??"";$("edAte").value=r.ate??"";$("edQtd").value=r.qtd;$("edNl").value=r.nl||"";{const ee=$("edEnds"),h=htmlEndsNl(r);ee.innerHTML=h;ee.hidden=!h}$("edIna").value=r.ina||"";$("edPrev").value=r.diaPrev||"";$("edCom").value=(r.com||[]).join(", ");
  edMostrarPart();$("editFundo").hidden=false;
}
function fecharEdicao(){$("editFundo").hidden=true;editId=null}
$("edCancelar").onclick=fecharEdicao;$("editFundo").onclick=e=>{if(e.target===$("editFundo"))fecharEdicao()};
$("edSalvar").onclick=()=>{
  const r=registros.find(x=>String(x.id)===editId);if(!r)return fecharEdicao();
  const data=$("edData").value,livro=$("edLivro").value.trim(),part=$("edPart").checked,q=Number($("edQtd").value);
  if(!data)return alert("Selecione a data.");if(!livro)return alert("Preencha o livro.");
  let de=null,ate=null;
  if(part){if($("edDe").value===""||$("edAte").value==="")return alert("Preencha DE e ATÉ.");de=Number($("edDe").value);ate=Number($("edAte").value);if(ate<de)return alert("O ATÉ não pode ser menor que o DE.")}
  if(!(q>0))return alert("Informe uma quantidade válida.");
  const nl=Math.max(0,Math.round(Number($("edNl").value)||0));if(nl>q)return alert("Os não lidos não podem passar da quantidade do livro.");
  const ina=Math.max(0,Math.round(Number($("edIna").value)||0));if(ina>q)return alert("Os inativos desligados (082) não podem passar da quantidade do livro.");
  {const dp=$("edPrev").value;if(dp)r.diaPrev=dp;else delete r.diaPrev}
  Object.assign(r,{nl:nl||undefined,ina:ina||undefined,data,etapa:Number($("edEtapa").value),localidade:$("edLocal").value.trim(),prontuario:$("edPront").value.trim(),livro,particionado:part,de,ate,qtd:q,com:part?$("edCom").value.split(",").map(x=>x.trim()).filter(Boolean):[],releitura:$("edRel").checked});
  localStorage.setItem(KEY,JSON.stringify(registros));fecharEdicao();render();
};

// ---------- Janela do calendário ----------
let calVer=hoje().slice(0,7);
// ---------- 📅 Faixa "Lançar calendário do ano" (de novembro até lançar) ----------
function anoFaltando(alvo){for(let i=1;i<=12;i++){const m=alvo+"-"+p2(i);if(!cal[m]||ehProv(m))return true}return false}
function anoParaLancar(){
  // pela data do celular: de novembro em diante, o ano que vem
  const h=hoje(),ano=+h.slice(0,4),mesH=+h.slice(5,7),alvo=mesH>=11?ano+1:ano;
  if(anoFaltando(alvo))return alvo;
  // pela data escolhida no app: se o ano dela ainda está provisório
  const d=$("data").value;if(d){const a=+d.slice(0,4);if(a>=ano&&anoFaltando(a))return a}
  return 0;
}
function atualizarBannerCal(){
  const b=$("bannerCal");if(!b)return;const a=anoParaLancar();
  // de janeiro a outubro só aparece se o ano atual ainda estiver provisório
  b.hidden=!a;if(!a)return;
  b.innerHTML=`📅 Lançar calendário de ${a}<small>toque e escolha a foto do calendário que a empresa mandou</small>`;
  b.onclick=()=>{abrirCal();calVer=a+"-01";desenharCal();setTimeout(()=>$("calFotoArq").click(),50)};
}
// ---------- Mês todo (calendário de parede) com as etapas nos dias ----------
// mês todo aberto por padrão; a lista das 18 etapas só aparece no ✏️ Editar
let calMesAberto=false;
function desenharAtrasosCal(){
  const bx=$("calAtrasos");if(!bx)return;
  if(calMesAberto||calEditando){bx.hidden=true;return}
  const lista=cal[calVer]||[],h=hoje(),ls=[];
  lista.forEach((d,i)=>{if(d&&d>=h&&!ultimaLeituraReal(calVer,i+1)&&atrasoMesPassado(calVer,i+1))ls.push(i+1)});
  if(!ls.length){bx.hidden=true;return}
  bx.innerHTML='<span>❓ Atrasou mês passado:</span>'+ls.map(n=>`<button type="button" onclick="verAtraso(${n})">Et ${p2(n)}</button>`).join("");
  bx.hidden=false;
}
function desenharMesTodo(){
  const box=$("calMesTodo");if(!box)return;box.hidden=!calMesAberto;$("calGrid").hidden=!calEditando;desenharAtrasosCal();if(!calMesAberto)return;
  const [a,mo]=calVer.split("-").map(Number),lista=cal[calVer]||[],h=hoje(),ini=new Date(a,mo-1,1).getDay(),nd=new Date(a,mo,0).getDate();
  let html=["D","S","T","Q","Q","S","S"].map((x,i)=>`<b class="${i===0?"dom":i===6?"sab":""}">${x}</b>`).join("");
  for(let i=0;i<ini;i++)html+="<span></span>";
  const dSel=$("data").value||h,iProxMT=lista.indexOf(dSel)>-1?lista.indexOf(dSel):lista.findIndex((d,i)=>d&&d>=h&&!ultimaLeituraReal(calVer,i+1));
  for(let d=1;d<=nd;d++){
    const iso=calVer+"-"+p2(d),i=lista.indexOf(iso),dw=(ini+d-1)%7,fe=nomeFeriado(iso),fer=emFerias(iso);
    const lida=i>-1&&ultimaLeituraReal(calVer,i+1);
    // Bolinha igual à da tela da frente: 🟢 no dia · 🔴 lançada atrasada neste mês · 🟠 sábado/feriado · 🔵 férias · 🟣 folga · ⚪ já passou e não lançou
    let bol="";
    if(i>-1){
      if(lida)bol=lida>iso?"vermelho":(corDoDia(lida)?"laranja":"verde");
      else if(naoFiz[iso])bol="rosa";
      else if(fer)bol=(fer.tipo||"Férias")==="Férias"?"azul":"roxo";
      else if(iso<h)bol="cinza";
    }
    html+=`<button type="button" data-dia="${iso}" class="md${i>-1?" et":""}${naoFiz[iso]?" naofiz":""}${iso===h?" hj":""}${dw===0?" dom":""}${dw===6?" sab":""}${fe?" fer":""}${fer?" fe":""}${lida?" lida":""}" title="${fe?esc(fe):""}">${bol==="rosa"?`<span class="md-bol rosa"></span>`:bol?`<span class="md-bol ${bol}"></span>`:""}${i>-1&&atrasoMesPassado(calVer,i+1)?`<span class="md-at" data-q="${i+1}" title="Mês passado foi lida atrasada"></span>`:i>-1&&naoFiz[diaDaEtapa(somaMes(calVer,-1),i+1)]?`<span class="md-at rosa" data-nf="${diaDaEtapa(somaMes(calVer,-1),i+1)}" title="Mês passado você não fez esta etapa"></span>`:""}<i>${i>-1?p2(d)+"/"+p2(mo):d}</i>${i>-1?`<em><small>Et</small> ${p2(i+1)}</em>${(c=>c!=null?`<u class="${foraDoLimite(c)?"fora":""}">${c}d</u>`:"")(cicloPlanejado(calVer,i))}`:fer?"<em>🏖️</em>":fe?"<em>🎉</em>":""}</button>`;
  }
  box.innerHTML=`<div class="md-grid">${html}</div>`;
  box.querySelectorAll("[data-nf]").forEach(q=>q.onclick=e=>{e.stopPropagation();const d=q.dataset.nf;alert("⚫ Mês passado ("+d.slice(8)+"/"+d.slice(5,7)+") você não fez esta etapa.\n\n📝 "+(naoFiz[d]==="outro serviço"?"li em outro lugar":naoFiz[d]))});
  box.querySelectorAll("[data-q]").forEach(q=>q.onclick=e=>{e.stopPropagation();verAtraso(+q.dataset.q)});
  box.querySelectorAll("[data-dia]").forEach(b=>b.onclick=()=>{$("calBusca").value=b.dataset.dia;$("calBusca").dispatchEvent(new Event("change"))});
}
function alternarMesTodo(){calMesAberto=!calMesAberto;try{localStorage.setItem(KEY+"_mes_todo2",calMesAberto?"1":"0")}catch(e){}desenharCal()}
function abrirCal(){calMesAberto=false;calEditando=false;calBuscaDia="";$("calBusca").value="";$("calBuscaRes").hidden=true;calVer=($("data").value||hoje()).slice(0,7);desenharCal();mostrarFoto();$("calFundo").hidden=false}
function desenharCal(){
  if($("calApagar")){$("calApagar").title="Apagar calendário de "+calVer.slice(0,4);$("calApagar").setAttribute("aria-label",$("calApagar").title)}
  const pv=ehProv(calVer);
  $("calMes").textContent=(pv?"🟡 ":"")+nomeMes(calVer).charAt(0).toUpperCase()+nomeMes(calVer).slice(1,3)+"/"+calVer.slice(2,4);$("calMes").title=nomeMes(calVer);$("calMes").textContent+=calMesAberto?" ▴":" ▾";desenharMesTodo();
  $("provAviso").hidden=!pv;$("calGrid").classList.toggle("prov",pv);$("calGrid").classList.toggle("editando",calEditando);
  const lista=cal[calVer]||Array(18).fill(""),h=hoje(),sem=["dom","seg","ter","qua","qui","sex","sáb"];
  // ❓ só na próxima etapa que vai ler (hoje ou o próximo dia de leitura), pra não encher a tela
  // ❓ vai no dia escolhido lá na tela principal (ex.: 14/10); se ele não for dia de etapa deste mês, vai na próxima que falta ler
  const dSel=$("data").value||h,iSel=lista.indexOf(dSel);
  const iProx=iSel>-1?iSel:lista.findIndex((d,i)=>d&&d>=h&&!ultimaLeituraReal(calVer,i+1));
  const b=$("calEditar");b.innerHTML=calEditando?'<span class="ico">✅</span><span class="rot">Pronto</span>':'<span class="ico">✏️</span><span class="rot">Editar</span>';b.title=calEditando?"Pronto":"Corrigir as datas das etapas deste mês";b.setAttribute("aria-label",b.title);b.classList.toggle("pronto",calEditando);
  // Fora da edição: datas só pra ver, curtinhas (04/08 qua). Editando: campos de data.
  const campo=(d,i)=>{
    if(calEditando){const pr=diaDaEtapa(somaMes(calVer,1),i+1);return `<input type="date" data-i="${i}" value="${d||""}">${pr?`<small class="ed-prox">📅 mês que vem ${pr.slice(8)}/${pr.slice(5,7)}</small>`:""}`}
    if(!d)return `<span class="cal-dia">—</span>`;
    const [a,mo,di]=d.split("-").map(Number);
    const cc=cicloPlanejado(calVer,i),am=i===iProx&&atrasoMesPassado(calVer,i+1);
    // Mês que já foi lido: se você leu num dia diferente do calendário, mostra o dia real e o ciclo de verdade
    const real=ultimaLeituraReal(calVer,i+1),cr=real?cicloReal(real,i+1):null;
    const linha2=real&&real!==d
      ?`<i class="${foraDoLimite(cr)?"fora":"real"}">lida ${real.slice(8)}/${real.slice(5,7)}${cr!=null?" "+cr+"d":""}</i>`
      :cc!=null?`<i class="${foraDoLimite(cc)?"fora":""}">${cc}d</i>`:"";
    // ❓ = no mês passado esta etapa foi lida atrasada (toque para ver)
    const marca=am?`<button type="button" class="interroga" onclick="verAtraso(${i+1})" aria-label="Ver atraso do mês passado">❓</button>`:"";
    if(emFerias(d)&&!real)return `<span class="cal-dia fer-dia${(emFerias(d).tipo||"Férias")==="Férias"?" fer-azul":""}">${d.slice(8)}/${d.slice(5,7)}<em>${sem[new Date(a,mo-1,di).getDay()]}</em><i class="fer-txt">🏖️ ${(emFerias(d).tipo||"férias").toLowerCase()}</i></span>`;
    return `<span class="cal-dia">${d.slice(8)}/${d.slice(5,7)}<em>${sem[new Date(a,mo-1,di).getDay()]}</em>${marca}${linha2}</span>`;
  };
  $("calGrid").innerHTML=lista.map((d,i)=>{const c=corDoDia(d),t=textoDoDia(d);return `<div class="cal-item${d===h?" hoje":""}${d&&d===calBuscaDia?" busca":""}${c?" "+c:""}"><b>${p2(i+1)}</b>${campo(d,i)}${t?"<small>"+t+"</small>":""}</div>`}).join("");
  $("calGrid").querySelectorAll("input").forEach(inp=>inp.onchange=()=>{
    const m=calVer,i=+inp.dataset.i;
    if(!cal[m])cal[m]=Array(18).fill("");
    cal[m][i]=inp.value;
    if(inp.value&&i<17){
      // Provisório: ajusta as seguintes sozinho. Oficial: pergunta antes.
      if(ehProv(m)||confirm("Ajustar também as etapas seguintes deste mês (próximos dias úteis a partir desta data)?"))ajustarSeguintes(m,i);
    }
    if(ehProv(m)){editados.add(m);completarProvisorio(m)}
    salvarCal();salvarProv();desenharCal();render();
    const e=etapaDoDia($("data").value);if(e&&e!==etapa)sel(e,false);
  });
}
// Consultar um dia qualquer: mostra a etapa e leva o calendário até o mês
let calBuscaDia="";
// Tocou na ❓: vai pro mês passado com a etapa marcada e explica o que aconteceu
function verAtraso(n,mesRef){
  // Mostra ali mesmo, num cartãozinho, sem sair do mês
  const bm=mesRef||calVer,am=atrasoMesPassado(bm,n);if(!am)return;
  const ant=somaMes(bm,-1),c=$("cartaoAtraso");
  c.innerHTML=`<b>❓ Etapa ${p2(n)} — ${nomeMes(ant)}</b>
  <div>📅 No calendário: <b>${am.previsto?am.previsto.slice(8)+"/"+am.previsto.slice(5,7):"—"}</b></div>
  <div>📖 Foi lida em: <b>${am.lido.slice(8)}/${am.lido.slice(5,7)}</b>${am.previsto?" ("+diasEntre(am.lido,am.previsto)+" dia(s) depois)":""}</div>
  <div>🔴 Ciclo: <b>${am.dias} dias</b> (limite ${CICLO_MAX})</div>
  <button type="button" onclick="$('cartaoAtraso').hidden=true">Ok</button>`;
  c.hidden=false;
}
$("calBusca").onchange=()=>{
  const d=$("calBusca").value,r=$("calBuscaRes");calBuscaDia=d;
  if(!d){r.hidden=true;desenharCal();return}
  const [a,mo,di]=d.split("-").map(Number),dia=["domingo","segunda","terça","quarta","quinta","sexta","sábado"][new Date(a,mo-1,di).getDay()];
  const e=etapaDoDia(d),t=textoDoDia(d),pv=ehProv(d.slice(0,7)),txt=d.slice(8)+"/"+d.slice(5,7)+"/"+a+" ("+dia+")";
  r.className="consulta-res"+(e?"":" nao");r.hidden=false;
  const mD=d.slice(0,7),realD=e&&ultimaLeituraReal(mD,e),amD=e&&atrasoMesPassado(mD,e),ccD=e&&cicloPlanejado(mD,e-1);
  const prD=e&&diaDaEtapa(somaMes(mD,1),e),nfAnt=e&&diaDaEtapa(somaMes(mD,-1),e),nfObs=nfAnt&&naoFiz[nfAnt];const extra=e?(ccD!=null?" · ciclo "+ccD+"d":"")+(prD?" · 📅 mês que vem "+prD.slice(8)+"/"+prD.slice(5,7):"")+(nfObs?" · ⚫ mês passado não fez: "+(nfObs==="outro serviço"?"li em outro lugar":nfObs):"")+(realD?(realD===d?" · 🟢 lida no dia":" · lida "+realD.slice(8)+"/"+realD.slice(5,7)+(realD>d?" ("+diasEntre(realD,d)+" dia(s) depois)":"")):"")+(amD?" · 🔴 mês passado lida "+amD.lido.slice(8)+"/"+amD.lido.slice(5,7)+" com "+amD.dias+" dias":""):"";
  r.textContent=(e?(naoFiz[d]?"":"✅ ")+txt+" → Etapa "+p2(e)+(t?" · "+t.slice(3):"")+(pv?" (provisório)":"")+extra:(cal[d.slice(0,7)]?"❌ "+txt+" não tem leitura":"❔ "+txt+": ainda não tem calendário desse mês"));
  if(e&&d<=hoje()&&!realD){r.insertAdjacentHTML("beforeend",naoFiz[d]?`<div class="nf-linha"><b class="bol-rosa"></b> Você não fez esta etapa<br>📝 ${esc(naoFiz[d]==="outro serviço"?"li em outro lugar":naoFiz[d])} <button type="button" id="nfObs">✏️ Observação</button> <button type="button" id="nfDesfaz">↩ Desfazer</button></div>`:`<div class="nf-linha"><button type="button" id="nfMarca"><b class="bol-rosa"></b> Não fiz esta etapa (li em outro lugar)</button></div>`);
    const mk=$("nfMarca"),dz=$("nfDesfaz"),ob=$("nfObs");if(ob)ob.onclick=async()=>{const o=await pedirObsNaoFiz(naoFiz[d]);if(o===null)return;naoFiz[d]=o;salvarNaoFiz();$("calBusca").dispatchEvent(new Event("change"))};
    if(mk)mk.onclick=async()=>{{const o=await pedirObsNaoFiz("");if(o===null)return;naoFiz[d]=o};salvarNaoFiz();render();$("calBusca").dispatchEvent(new Event("change"))};
    if(dz)dz.onclick=()=>{delete naoFiz[d];salvarNaoFiz();render();$("calBusca").dispatchEvent(new Event("change"))};}
  calEditando=false;calVer=d.slice(0,7);desenharCal();
};
// Editar mês: liga/desliga as datas para corrigir
let calEditando=false;
$("calEditar").onclick=()=>{
  if(!calEditando){calEditando=true;desenharCal();return}
  calEditando=false;
  if(ehProv(calVer)&&confirm("Este mês já está igual ao calendário oficial?\n\nOK = fica oficial (sai do amarelo)\nCancelar = continua provisório")){prov.delete(calVer);editados.delete(calVer);salvarProv()}
  desenharCal();render();
};
$("calVoltar").onclick=()=>{$("cartaoAtraso").hidden=true;calEditando=false;$("calFundo").hidden=true};
$("calChip").onclick=abrirCal;
$("calAnt").onclick=()=>{$("cartaoAtraso").hidden=true;calEditando=false;calVer=somaMes(calVer,-1);desenharCal()};
$("calProx").onclick=()=>{$("cartaoAtraso").hidden=true;calEditando=false;calVer=somaMes(calVer,1);desenharCal()};
$("calFechar").onclick=()=>$("calFundo").hidden=true;
$("totBob").onclick=e=>{e.stopPropagation();
  // mostra o que está oculto: as bobinas do prédio (pra ver na base)
  const m=mes(),rs=registros.filter(r=>r.etapa===etapa&&r.data.startsWith(m)&&!r.releitura),q=rs.filter(r=>!predios[r.livro]).reduce((t,r)=>t+r.qtd,0),qp=rs.filter(r=>predios[r.livro]),qpt=qp.reduce((t,r)=>t+r.qtd,0),qpi=qp.reduce((t,r)=>t+qImp(r.livro,r.qtd),0);
  const msg="🧾 Rua: "+q.toLocaleString("pt-BR")+" leituras → "+(bobinas(q)||0)+" bobina(s)"+(qp.length?"\n\n🏢 Prédio: "+qpt.toLocaleString("pt-BR")+" leituras · 🖨️ "+qpi+" pra imprimir → "+bobinas(qpi)+" bobina(s)\n"+qp.map(r=>"   • livro "+r.livro+" — "+r.qtd+(imprimir[r.livro]?" · 🖨️ "+qImp(r.livro,r.qtd):" · 🖨️ ainda não informado")).join("\n"):"")+(qp.length?"\n\n🧾 Total: "+(q+qpi).toLocaleString("pt-BR")+" → "+(bobinas(q+qpi)||0)+" bobina(s)":"")+"\n\n("+porBobina+" leituras por bobina)\n\nOK = mudar as leituras por bobina · Cancelar = fechar";
  if(!confirm(msg))return;
  const v=prompt("🧾 Quantas leituras cabem numa bobina, mais ou menos?",porBobina);if(v===null)return;const n=parseInt(v,10);if(n>0){porBobina=n;try{localStorage.setItem(KEY+"_porbobina",n)}catch(e){}render()}};
$("calMes").onclick=alternarMesTodo;
$("calInfoBtn").onclick=()=>{const i=$("calInfo");i.hidden=!i.hidden;$("calInfoBtn").classList.toggle("ativo",!i.hidden)};
$("calFundo").onclick=e=>{if(e.target===$("calFundo"))$("calFundo").hidden=true};

function dataURLparaBlob(u){const [cab,b64]=u.split(","),tipo=cab.match(/:(.*?);/)[1],bin=atob(b64),arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new Blob([arr],{type:tipo})}
function mostrarImagem(url){$("imgVer").src=url;$("imgFundo").hidden=false}
// O iPhone só deixa compartilhar se for no mesmo instante do toque: por isso a imagem é montada na hora, sem esperar
function compartilharImagem(url,nome,titulo){
  let f=null;try{f=new File([dataURLparaBlob(url)],nome,{type:url.slice(5,url.indexOf(";"))})}catch(e){}
  if(f&&navigator.canShare&&navigator.canShare({files:[f]})){
    navigator.share({files:[f],title:titulo}).catch(e=>{if(!e||e.name!=="AbortError")mostrarImagem(url)});
  }else mostrarImagem(url);
}
// Monta uma imagem só do mês que está aberto (18 etapas, dia da semana e cores)
$("calCompMes").onclick=()=>{
  const m=calVer,lista=cal[m];
  if(!lista||!lista.some(Boolean))return alert("Não há calendário para "+nomeMes(m)+".");
  const pv=ehProv(m),mp=somaMes(m,1),temProx=!!(cal[mp]&&cal[mp].some(Boolean)),W=temProx?560:460,rh=34,top=pv?92:74,H=top+rh*19+20;
  const cv=document.createElement("canvas");cv.width=W*2;cv.height=H*2;const g=cv.getContext("2d");g.scale(2,2);
  g.fillStyle="#fff";g.fillRect(0,0,W,H);
  const titulo=nomeMes(m).replace(/^./,c=>c.toUpperCase());
  g.fillStyle="#1f2937";g.font="bold 20px Arial";g.fillText("Calendário de Leitura",12,30);
  g.font="bold 16px Arial";g.fillStyle="#4b5563";g.fillText(titulo,12,54);
  if(pv){g.font="bold 12px Arial";g.fillStyle="#a16207";g.fillText("PROVISÓRIO — pode mudar quando sair o oficial",12,76)}
  const cols=temProx?[12,72,152,232,288,392]:[12,80,160,240,300];g.fillStyle="#4b5563";g.fillRect(10,top,W-20,rh);
  g.fillStyle="#fff";g.font="bold 13px Arial";g.textBaseline="middle";
  (temProx?["Etapa","Data","Dia","Ciclo","Mês que vem","Obs."]:["Etapa","Data","Dia","Ciclo","Obs."]).forEach((t,i)=>g.fillText(t,cols[i]+6,top+rh/2));
  const sem=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
  lista.forEach((d,i)=>{
    const y=top+rh*(i+1),c=corDoDia(d);
    g.fillStyle=c==="sab"?"#fee2e2":c==="fer"?"#ffedd5":pv?"#fef9c3":i%2?"#f3f4f6":"#fff";g.fillRect(10,y,W-20,rh);
    g.fillStyle=c==="sab"?"#991b1b":c==="fer"?"#9a3412":"#1f2937";
    g.font="bold 13px Arial";g.fillText(p2(i+1),cols[0]+12,y+rh/2);
    if(d){const [a,mo,di]=d.split("-").map(Number);g.fillText(d.slice(8)+"/"+d.slice(5,7)+"/"+d.slice(2,4),cols[1]+6,y+rh/2);
      g.font="13px Arial";g.fillText(sem[new Date(a,mo-1,di).getDay()],cols[2]+6,y+rh/2);
      const cc=cicloPlanejado(m,i),cor0=g.fillStyle;if(cc!=null){g.font="bold 13px Arial";if(foraDoLimite(cc))g.fillStyle="#dc2626";g.fillText(cc+" d",cols[3]+6,y+rh/2);g.fillStyle=cor0}
      if(temProx){const pr=cal[mp][i];g.font="bold 13px Arial";g.fillStyle=ehProv(mp)?"#a16207":"#1d4ed8";if(pr)g.fillText(pr.slice(8)+"/"+pr.slice(5,7)+"/"+pr.slice(2,4)+(ehProv(mp)?" *":""),cols[4]+6,y+rh/2);g.fillStyle=cor0}
      g.font="12px Arial";g.fillText(nomeFeriado(d),cols[temProx?5:4]+4,y+rh/2)}
    else g.fillText("—",cols[1]+6,y+rh/2);
  });
  g.strokeStyle="#d1d5db";g.strokeRect(10,top,W-20,rh*19);
  if(temProx&&ehProv(mp)){g.font="11px Arial";g.fillStyle="#a16207";g.textBaseline="alphabetic";g.fillText("* mês que vem ainda provisório",12,H-4)}
  compartilharImagem(cv.toDataURL("image/png"),"calendario-leitura-"+m+".png","Calendário de Leitura "+titulo);
};
// Monta uma imagem com a tabela do ano inteiro (18 etapas x 12 meses)
$("calCompTabela").onclick=()=>{
  const ano=calVer.slice(0,4),meses=[];for(let i=1;i<=12;i++)if(cal[ano+"-"+p2(i)])meses.push(ano+"-"+p2(i));
  if(!meses.length)return alert("Não há calendário para "+ano+".");
  const cw=78,ew=60,rh=34,top=70,W=ew+cw*meses.length+20,H=top+rh*19+40;
  const cv=document.createElement("canvas");cv.width=W*2;cv.height=H*2;const g=cv.getContext("2d");g.scale(2,2);
  g.fillStyle="#fff";g.fillRect(0,0,W,H);
  g.fillStyle="#1f2937";g.font="bold 20px Arial";g.fillText("Calendário de Leitura "+ano,10,32);
  g.font="12px Arial";g.fillStyle="#6b7280";g.fillText("Vermelho = sábado  ·  Laranja = feriado com leitura"+(meses.some(ehProv)?"  ·  Amarelo = provisório (pode mudar)":""),10,52);
  g.textAlign="center";g.textBaseline="middle";
  const nomes=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  g.fillStyle="#4b5563";g.fillRect(10,top,W-20,rh);g.fillStyle="#fff";g.font="bold 13px Arial";
  g.fillText("Etapa",10+ew/2,top+rh/2);
  meses.forEach((m,j)=>g.fillText(nomes[+m.slice(5)-1]+"/"+ano.slice(2),10+ew+cw*j+cw/2,top+rh/2));
  for(let i=0;i<18;i++){
    const y=top+rh*(i+1);g.fillStyle=i%2?"#f3f4f6":"#fff";g.fillRect(10,y,W-20,rh);
    g.fillStyle="#1f2937";g.font="bold 13px Arial";g.fillText(p2(i+1),10+ew/2,y+rh/2);g.font="13px Arial";
    meses.forEach((m,j)=>{const d=cal[m][i],c=corDoDia(d),fundo=c==="sab"?"#fee2e2":c==="fer"?"#ffedd5":ehProv(m)?"#fef9c3":"";if(fundo){g.fillStyle=fundo;g.fillRect(10+ew+cw*j,y,cw,rh)}g.fillStyle=c==="sab"?"#991b1b":c==="fer"?"#9a3412":"#1f2937";g.fillText(d?d.slice(8)+"/"+d.slice(5,7):"—",10+ew+cw*j+cw/2,y+rh/2)});
  }
  g.strokeStyle="#d1d5db";g.strokeRect(10,top,W-20,rh*19);
  compartilharImagem(cv.toDataURL("image/png"),"calendario-leitura-"+ano+".png","Calendário de Leitura "+ano);
};
// Foto do calendário (a que a empresa manda), guardada reduzida no celular
// Foto que já vem junto com o app (arquivo calendario-2026.jpg ao lado do index.html no GitHub)
let fotoPadrao="";
fetch("calendario-2026.jpg").then(r=>r.ok?r.blob():null).then(b=>{if(!b)return;const rd=new FileReader();rd.onload=()=>{fotoPadrao=rd.result;mostrarFoto()};rd.readAsDataURL(b)}).catch(()=>{});
function fotoAtual(){let f=null;try{f=localStorage.getItem(FOTOKEY)}catch(e){}return f||fotoPadrao}
function mostrarFoto(){const f=fotoAtual();$("fotoPrev").hidden=!f;$("fotoDica").hidden=!f;if(f)$("fotoPrev").src=f}
// Ampliar a foto: começa grande o bastante pra ler, arrasta pros lados e usa − / + para ajustar
let zoom=2.5;
function aplicarZoom(){const a=$("zoomArea");$("zoomImg").style.width=Math.round(a.clientWidth*zoom)+"px"}
$("fotoPrev").onclick=()=>{$("zoomImg").src=fotoAtual();$("zoomFundo").hidden=false;zoom=Math.max(1,Math.min(4,1282/$("zoomArea").clientWidth*0.9));aplicarZoom();$("zoomArea").scrollTo(0,0)};
$("zoomMais").onclick=()=>{zoom=Math.min(6,zoom*1.3);aplicarZoom()};
$("zoomMenos").onclick=()=>{zoom=Math.max(1,zoom/1.3);aplicarZoom()};
$("zoomVoltar").onclick=()=>$("zoomFundo").hidden=true;
$("calFotoBtn").onclick=()=>$("calFotoArq").click();
$("calFotoArq").onchange=e=>{
  const file=e.target.files&&e.target.files[0];if(!file)return;
  const img=new Image();img.onload=async()=>{
    // 1) Guarda a foto (reduzida) para poder enviar depois
    const s=Math.min(1,1600/Math.max(img.width,img.height)),c=document.createElement("canvas");
    c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);
    try{localStorage.setItem(FOTOKEY,c.toDataURL("image/jpeg",.8));mostrarFoto()}catch(err){}
    e.target.value="";
    // 2) Lê as datas da foto e preenche o calendário
    await lerFotoCalendario(img);
    URL.revokeObjectURL(img.src);
  };img.src=URL.createObjectURL(file);
};

// ---------- Leitura automática da foto (OCR) ----------
function carregarOCR(){
  if(window.Tesseract)return Promise.resolve();
  return new Promise((ok,erro)=>{const sc=document.createElement("script");sc.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";sc.onload=ok;sc.onerror=erro;document.head.appendChild(sc)});
}
// Aumenta a foto e deixa em preto e branco: o leitor acerta muito mais as datas
function prepararImagem(img,largura){
  const s=largura/img.width,c=document.createElement("canvas");
  c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
  const g=c.getContext("2d");g.imageSmoothingQuality="high";g.drawImage(img,0,0,c.width,c.height);
  const px=g.getImageData(0,0,c.width,c.height),d=px.data;
  for(let i=0;i<d.length;i+=4){const v=d[i]*.299+d[i+1]*.587+d[i+2]*.114;d[i]=d[i+1]=d[i+2]=v}
  g.putImageData(px,0,0);return c;
}
// Pega todas as datas dd/mm/aa do texto e separa por mês (domingo não conta)
function datasPorMes(texto){
  const g={},re=/(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})/g;let x;
  while((x=re.exec(texto))){
    const d=+x[1],m=+x[2],a=2000+(+x[3].slice(-2));
    if(m<1||m>12||d<1||d>31)continue;
    const dt=new Date(a,m-1,d);if(dt.getMonth()!==m-1||dt.getDay()===0)continue;
    const k=a+"-"+p2(m);(g[k]=g[k]||new Set()).add(d);
  }
  return g;
}
async function lerFotoCalendario(img){
  const b=$("calFotoBtn"),txt=b.textContent;b.disabled=true;
  const st=$("calStatus"),msg=t=>{st.hidden=false;st.textContent=t};b.textContent="⏳";
  try{
    msg("⏳ Preparando leitor...");await carregarOCR();
    const w=await Tesseract.createWorker("eng",1,{logger:l=>{if(l.status==="recognizing text")msg("⏳ Lendo a foto... "+Math.round(l.progress*100)+"%")}});
    await w.setParameters({tessedit_pageseg_mode:"6"});
    const leituras=[];
    for(const larg of [3800,2560]){
      // limite de tamanho do iPhone para imagens (~15 milhões de pontos)
      const maxL=Math.floor(Math.sqrt(15e6*img.width/img.height));
      const r=await w.recognize(prepararImagem(img,Math.min(larg,maxL)));
      leituras.push(datasPorMes(r.data.text));
    }
    await w.terminate();
    const meses=new Set([...Object.keys(leituras[0]),...Object.keys(leituras[1])]);
    const certos={},conferir=[];
    [...meses].sort().forEach(m=>{
      const a=leituras[0][m]||new Set(),b2=leituras[1][m]||new Set(),uniao=new Set([...a,...b2]);
      const ok=[a,b2,uniao].find(s=>s.size===18);
      if(ok)certos[m]=[...ok].sort((x,y)=>x-y).map(d=>m+"-"+p2(d));
      else if(uniao.size>=10&&!(cal[m]&&!ehProv(m)&&cal[m].filter(Boolean).length===18))conferir.push(m); // mês que já está completo no app não precisa conferir
    });
    const ks=Object.keys(certos);
    if(!ks.length){alert("Não consegui ler as datas desta foto.\nTente uma foto mais nítida, reta e com boa luz, mostrando só a tabela.");return}
    const lista=ks.map(m=>"✅ "+nomeMes(m)).join("\n")+(conferir.length?"\n\nPrecisa conferir (não li as 18 datas):\n"+conferir.map(m=>"⚠️ "+nomeMes(m)).join("\n"):"");
    if(!confirm("Li estes meses na foto:\n\n"+lista+"\n\nColocar no calendário do app?"))return;
    ks.forEach(m=>{cal[m]=certos[m];prov.delete(m);editados.delete(m)});salvarCal();salvarProv();
    calVer=conferir[0]||ks[0];desenharCal();render();
    const e=etapaDoDia($("data").value);if(e)sel(e,false);
    alert(ks.length+" mês(es) colocado(s) no calendário."+(conferir.length?"\nConfira e complete à mão: "+conferir.map(nomeMes).join(", ")+".":"\nDá uma conferida rápida nas datas."));
  }catch(err){
    alert("Não foi possível ler a foto agora. Confira se tem internet e tente de novo.");
  }finally{b.disabled=false;b.textContent=txt;$("calStatus").hidden=true}
}
$("calCompFoto").onclick=()=>{
  const f=fotoAtual();
  if(!f)return alert("Ainda não tem foto guardada.\nToque em 📷 Ler foto do calendário e escolha a foto da empresa: ela fica guardada aqui pra enviar depois.");
  compartilharImagem(f,"calendario-leitura.jpg","Calendário de Leitura");
};

// ---------- Exportar, importar, backup, lixeira ----------
$("csv").onclick=()=>{const m=mes(),rs=registros.filter(r=>r.data.startsWith(m)&&(!filtroCidade||normLoc(r.localidade)===filtroCidade));if(!rs.length)return alert("Não há leituras neste mês.");let c="﻿Data;Etapa;Localidade;Livro;De;Até;Quantidade;Dividido com;Prontuário;Tipo;Não lidos\n"+rs.map(r=>`${fmt(r.data)};${r.etapa};"${(r.localidade||"").replaceAll('"','""')}";"${String(r.livro).replaceAll('"','""')}";${r.de??""};${r.ate??""};${r.qtd};"${(r.com||[]).join(", ").replaceAll('"','""')}";${r.prontuario||""};${r.releitura?"Releitura":"Leitura"};${r.nl||""}`).join("\n");let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([c],{type:"text/csv;charset=utf-8"}));const imp0=impDoMes(m,x=>!filtroCidade||normLoc(x.localidade)===filtroCidade);if(imp0.length){c+="\n\nNão lidos\nData;Etapa;Localidade;Quantidade\n"+imp0.map(x=>`${fmt(x.data)};${x.etapa};"${(x.localidade||"").replaceAll('"','""')}";${x.qtd}`).join("\n");a.href=URL.createObjectURL(new Blob([c],{type:"text/csv;charset=utf-8"}))}
  a.download="controle-leituras-"+m+(filtroCidade?"-"+filtroCidade.replace(/[^a-z0-9]+/g,"-"):"")+".csv";a.click()};
$("importar").onclick=()=>$("arquivoImportar").click();
$("arquivoImportar").onchange=e=>{
  const file=e.target.files&&e.target.files[0];if(!file)return;
  const rd=new FileReader();rd.onload=()=>{
    try{
      const dados=JSON.parse(rd.result);
      if(dados&&!Array.isArray(dados)&&dados.tipo==="backup-completo-controle-leituras"){importarBackupCompleto(dados);e.target.value="";return}
      if(!Array.isArray(dados))throw 0;
      const val=dados.filter(r=>r&&r.data&&Number(r.etapa)>=1&&Number(r.etapa)<=18&&r.livro&&Number(r.qtd)>0).map(r=>({...r,id:r.id||Date.now()+Math.random(),etapa:Number(r.etapa),qtd:Number(r.qtd),localidade:r.localidade||""}));
      if(!val.length){alert("O arquivo não contém registros válidos.");return}
      const ex=new Set(registros.map(r=>String(r.id)));let n=0;val.forEach(r=>{if(!ex.has(String(r.id))){registros.push(r);n++}});
      localStorage.setItem(KEY,JSON.stringify(registros));render();alert(n+" registro(s) importado(s).");
    }catch(err){alert("Não foi possível importar este arquivo.")}
    e.target.value="";
  };rd.readAsText(file);
};
// 💾 Backup completo: livros, não lidos, férias, calendário, prontuários e a foto do calendário
$("backup").onclick=()=>{
  let calSalvo={},foto=null;try{calSalvo=JSON.parse(localStorage.getItem(CALKEY)||"{}");foto=localStorage.getItem(FOTOKEY)}catch(e){}
  const tudo={tipo:"backup-completo-controle-leituras",versao:VERSAO_APP,feitoEm:hoje(),registros,impedimentos,ferias,calendario:calSalvo,calApagados,provisorios:[...prov],editados:[...editados],prontuarios:prontPorCidade,fotoCalendario:foto,rotas,naoFiz,resseq,predios,equip,horas,imprimir,resseqHist};
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(tudo)],{type:"application/json;charset=utf-8"}));
  a.download="backup-controle-leituras-"+hoje()+".json";a.click();
};
function importarBackupCompleto(d){
  const soma=(lista,novos)=>{const ex=new Set(lista.map(x=>String(x.id)));let n=0;(novos||[]).forEach(x=>{if(x&&!ex.has(String(x.id))){lista.push(x);n++}});return n};
  const nR=soma(registros,(d.registros||[]).filter(r=>r&&r.data&&r.etapa&&r.qtd>0));
  const nI=soma(impedimentos,d.impedimentos),nF=soma(ferias,d.ferias);
  let nC=0;Object.entries(d.calendario||{}).forEach(([m,v])=>{const oficialNoBackup=!(d.provisorios||[]).includes(m);if(Array.isArray(v)&&(!cal[m]||(prov.has(m)&&oficialNoBackup))){if(oficialNoBackup){prov.delete(m);editados.delete(m)}cal[m]=v;nC++;calApagados=calApagados.filter(x=>x!==m);try{localStorage.setItem(CALDELKEY,JSON.stringify(calApagados))}catch(e){};if((d.provisorios||[]).includes(m))prov.add(m)}});
  Object.entries(d.prontuarios||{}).forEach(([k,v])=>{if(!prontPorCidade[k])prontPorCidade[k]=v});
  Object.entries(d.rotas||{}).forEach(([k,v])=>{if(!rotas[k])rotas[k]=v});salvarRotas();
  Object.entries(d.naoFiz||{}).forEach(([k,v])=>{if(!naoFiz[k])naoFiz[k]=v});salvarNaoFiz();
  Object.entries(d.resseq||{}).forEach(([k,v])=>{if(!resseq[k])resseq[k]=v});salvarResseq();
  Object.entries(d.predios||{}).forEach(([k,v])=>{predios[k]=v});salvarPredios();
  if(d.equip){equip=d.equip;salvarEquip()}
  Object.entries(d.horas||{}).forEach(([k,v])=>{if(!horas[k])horas[k]=v});salvarHoras();
  Object.entries(d.imprimir||{}).forEach(([k,v])=>{if(!imprimir[k])imprimir[k]=v});salvarImprimir();
  Object.entries(d.resseqHist||{}).forEach(([k,v])=>{if(!resseqHist[k])resseqHist[k]=v});salvarResseqHist();
  try{if(d.fotoCalendario&&!localStorage.getItem(FOTOKEY))localStorage.setItem(FOTOKEY,d.fotoCalendario)}catch(e){}
  localStorage.setItem(KEY,JSON.stringify(registros));salvarImp();salvarFerias();salvarCal();salvarProv();
  try{localStorage.setItem(PRONTKEY,JSON.stringify(prontPorCidade))}catch(e){}
  render();
  alert("✅ Backup importado:\n\n📚 "+nR+" livro(s)\n🚫 "+nI+" lançamento(s) de não lidos\n🏖️ "+nF+" férias/folga(s)\n📅 "+nC+" mês(es) de calendário\n\nO que já existia no celular não foi apagado nem repetido.");
}
// 🗑️ Apagar o calendário de um ano que já passou (as leituras continuam)
$("calApagar").onclick=()=>{
  const ano=calVer.slice(0,4),meses=Object.keys(cal).filter(m=>m.startsWith(ano));
  if(!meses.length)return alert("Não há calendário de "+ano+".");
  if(+ano>=+hoje().slice(0,4))return alert("Só dá pra apagar o calendário de anos que já passaram.\n"+ano+" ainda está em uso.");
  if(!confirm("Apagar o calendário de "+ano+"?\n\nAs leituras lançadas NÃO serão apagadas, só as datas das etapas.\n\nDica: faça o 💾 Backup antes."))return;
  if(!confirm("Tem certeza? Isso não dá pra desfazer (só importando um backup)."))return;
  meses.forEach(m=>{delete cal[m];prov.delete(m);editados.delete(m);if(!calApagados.includes(m))calApagados.push(m)});
  try{localStorage.setItem(CALDELKEY,JSON.stringify(calApagados))}catch(e){}
  salvarCal();salvarProv();desenharCal();render();alert("🗑️ Calendário de "+ano+" apagado.");
};
$("zoomComp").onclick=()=>{const f=fotoAtual();if(f)compartilharImagem(f,"calendario-leitura.jpg","Calendário de Leitura")};
// ---------- Bolinha de status do dia ----------
// cinza = sem leitura · verde = no dia · amarelo = atenção · vermelho = atrasado
function atualizarDot(){
  const i=$("calTexto"),d=$("statusDot");if(!i||!d)return;
  const c=i.className,t=(i.textContent||"").trim();let cor="verde";
  if(!i.hidden&&t){
    if(/\bfora\b/.test(c)||t.startsWith("⏰"))cor="vermelho";
    else if(t.startsWith("🤝")||t.startsWith("⚪")||/não tem leitura|sem leitura/.test(t))cor="cinza";
    else if(/\bferias\b/.test(c))cor=/\bazul\b/.test(c)?"azul":"roxo";
    else if(/\b(sab|fer)\b/.test(c))cor="laranja";
    else if(/\bnota\b/.test(c))cor="verde";
    else cor="amarelo";
  }
  d.className="status-dot "+cor;
  d.title=t||"Tudo certo: leitura no dia";
}
new MutationObserver(atualizarDot).observe($("calTexto"),{attributes:true,childList:true,characterData:true,subtree:true});
$("statusDot").addEventListener("click",e=>{
  e.stopPropagation();e.preventDefault();
  const i=$("calTexto"),l=$("dotLegenda"),abrir=l.hidden,tem=!!i.textContent.trim();
  l.hidden=!abrir;i.classList.toggle("aberta",abrir&&tem);
  $("dotMsg").textContent=tem?"":"🟢 Tudo certo: leitura no dia.";
});
// Copiar o endereço (para colar no mapa se ele não achar sozinho)
document.addEventListener("click",async e=>{
  const b=e.target.closest(".pda-copiar");if(!b)return;
  const t=b.dataset.end||"";
  try{await navigator.clipboard.writeText(t);const x=b.textContent;b.textContent="✔ Copiado";setTimeout(()=>{b.textContent=x},1500)}
  catch(err){prompt("Copie o endereço:",t)}
});
// ---------- Desfazer a última exclusão ----------
function lerDesfazer(){try{const a=JSON.parse(localStorage.getItem(KEY+"_desfazer")||"[]");return Array.isArray(a)?a:[]}catch(e){return []}}
function guardarDesfazer(recs){try{localStorage.setItem(KEY+"_desfazer",JSON.stringify(recs))}catch(e){}}
function atualizarDesfazer(){
  const b=$("desfazer");if(!b)return;const a=lerDesfazer();
  $("desfLinha").hidden=!a.length;if(a.length)b.textContent="↩️ Desfazer: "+a.length+(a.length===1?" livro apagado":" livros apagados");
}
$("desfazerX").onclick=()=>{guardarDesfazer([]);atualizarDesfazer()};
$("desfazer").onclick=()=>{
  const a=lerDesfazer();if(!a.length)return;
  const ids=new Set(registros.map(r=>String(r.id)));
  a.forEach(r=>{if(!ids.has(String(r.id)))registros.push(r)});
  localStorage.setItem(KEY,JSON.stringify(registros));guardarDesfazer([]);render();
};
$("lixeira").onclick=()=>{
  // Apaga só o que está na lista: a etapa mostrada (ou a cidade escolhida), não o mês inteiro
  const m=mes(),alvo=r=>r.data.startsWith(m)&&(filtroCidade?normLoc(r.localidade)===filtroCidade:r.etapa===etapa);
  const rs=registros.filter(alvo);
  if(!rs.length)return;
  const quem=filtroCidade?"de "+nomeCidade(filtroCidade,m):"da Etapa "+p2(etapa);
  if(!confirm("Mover "+rs.length+" livro(s) "+quem+" para a lixeira?\n\nOs outros livros do mês não são apagados."))return;
  let antes=[];try{antes=JSON.parse(localStorage.getItem(KEY+"_lixeira")||"[]");if(!Array.isArray(antes))antes=[]}catch(e){}
  guardarDesfazer(rs);
  localStorage.setItem(KEY+"_lixeira",JSON.stringify([...antes,...rs]));
  registros=registros.filter(r=>!alvo(r));
  localStorage.setItem(KEY,JSON.stringify(registros));render();
};

// ---------- Compartilhar e atualizar o app ----------
$("compartilharApp").onclick=async()=>{
  const url=location.origin+location.pathname;
  try{if(navigator.share){await navigator.share({title:"Controle de Leituras",text:"App Controle de Leituras",url});return}}catch(e){if(e&&e.name==="AbortError")return}
  try{await navigator.clipboard.writeText(url);alert("Link copiado:\n"+url)}catch(e){prompt("Copie o link:",url)}
};
$("atualizarApp").onclick=async()=>{
  if(!confirm("Atualizar o aplicativo para a versão mais recente? Seus registros não serão apagados."))return;
  const b=$("atualizarApp");b.disabled=true;b.textContent="⏳";
  try{
    if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}
    if(window.caches){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}
  }catch(e){}
  location.replace(location.pathname+"?v="+Date.now());
};

// ---------- Atualização automática: ao abrir, confere se tem versão nova no GitHub ----------
const VERSAO_APP="16.19";$("verPill").textContent="v"+VERSAO_APP;
function versaoMaior(a,b){const x=a.split(".").map(Number),y=b.split(".").map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)>(y[i]||0)}return false}
async function conferirAtualizacao(){
  if(location.protocol==="file:")return;
  try{
    // cópias antigas guardadas (service worker / cache) atrapalham: limpa
    if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();if(regs.length){await Promise.all(regs.map(r=>r.unregister()));if(window.caches){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}}
    const r=await fetch(location.pathname+"?chk="+Date.now(),{cache:"no-store",headers:{"Cache-Control":"no-cache","Pragma":"no-cache"}});if(!r.ok)return;
    const m=(await r.text()).match(/Versão (\d+(?:\.\d+)*)/);if(!m)return;
    let tentou="";try{tentou=sessionStorage.getItem("atualizando")||""}catch(e){}
    if(versaoMaior(m[1],VERSAO_APP)&&tentou!==m[1]){
      try{sessionStorage.setItem("atualizando",m[1])}catch(e){}
      location.replace(location.pathname+"?v="+Date.now());
    }
  }catch(e){}
}
setTimeout(conferirAtualizacao,800);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)conferirAtualizacao()});
// iPhone guarda a página "congelada" ao voltar pro app: confere de novo; e a cada 5 min com o app aberto
window.addEventListener("pageshow",e=>{if(e.persisted)conferirAtualizacao()});
window.addEventListener("focus",()=>conferirAtualizacao());
setInterval(()=>{if(!document.hidden)conferirAtualizacao()},5*60*1000);

// ---------- 📷 Foto do PDA: lê livro, quantidade e endereço da Caixa de Entrada ----------
function pdaPin(r,e){
  r._end=e;const o=r.querySelector(".pda-end");if(o)o.remove();
  const q=encodeURIComponent(e.end),w=document.createElement("div");w.className="pda-end";
  w.innerHTML='<button type="button" class="pda-pin"><span>📍'+(e.etapa?" Et. "+p2(e.etapa):"")+'</span><span class="pda-seta">▾</span></button>'+
    '<div class="pda-box" hidden><b>'+esc(e.end||"")+'</b><div class="pda-tags">'+(e.etapa?'<span>Etapa '+p2(e.etapa)+'</span>':'')+(e.lim?'<span>Limite '+esc(e.lim)+'</span>':'')+(e.km?'<span>'+esc(e.km)+' km</span>':'')+'</div>'+
    '<button type="button" class="pda-tira">🗑️ Tirar este livro da foto</button><a href="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination='+q+'" target="_blank" rel="noopener">🗺️ Abrir no mapa</a><button type="button" class="pda-copiar" data-end="'+esc(e.end||"")+'">📋 Copiar endereço</button></div>';
  const bt=w.querySelector(".pda-pin"),bx=w.querySelector(".pda-box");
  bt.onclick=()=>{bx.hidden=!bx.hidden;bt.classList.toggle("open",!bx.hidden)};
  w.querySelector(".pda-tira").onclick=()=>{pdaFila=pdaFila.filter(i=>i!==r._it);pdaSalvarFila();r.remove();if(!$("livroRows").children.length)iniciarLinhas();pdaFaixa();if(typeof atualizarPctNL==="function")atualizarPctNL()};
  r.appendChild(w);
}
// Preparo da foto do PDA: pega o menor valor de cor de cada ponto, assim as letras laranja (Limite) e azul (km) ficam escuras como as pretas
// ---------- 📷 Leitura pela foto do visor do medidor ----------
let fotoLeitAlvo=-1;
const IA_MEDIDOR='Esta foto é de um medidor de energia OU da tela de leitura do PDA. Leia: o NÚMERO DO MEDIDOR (série, com letras e números, ex.: "AR0253716" ou "B18670249"; no PDA vem depois de "MD:"; NÃO é o número da casa); a LEITURA do visor do medidor (só dígitos; se for a tela do PDA, use null); o endereço e a UC se aparecerem; e os códigos de registro, que no PDA são as ABAS no meio da tela no formato 3 letras e 3 números (ex.: "CON-003" e "ERA-024") — liste TODAS. Responda só JSON: {"medidor":"AR0253716","leitura":null,"end":"AV JORN JULIO MESQUITA FILHO, 205, BRO GRANDINO","uc":"000107479404502","registros":["CON-003","ERA-024"]}. Use null no que não conseguir ler.';
$("leitArq").onchange=async e=>{
  const f=(e.target.files||[])[0];e.target.value="";if(!f||fotoLeitAlvo<0)return;
  const r=registros.find(x=>String(x.id)===rcChave);if(!r)return;const c=confDe(r),x=c[fotoLeitAlvo];if(!x)return;
  const bt=document.querySelector(`[data-foto="${fotoLeitAlvo}"]`);if(bt){bt.disabled=true;bt.textContent="⏳"}
  try{if(!x.fid)x.fid="cf"+Date.now()+Math.floor(Math.random()*1e4);await gPut(x.fid,await fotoMini(f,1100,.72));x.foto=1;localStorage.setItem(KEY,JSON.stringify(registros))}catch(e){}
  let achou="",mdLido="";
  try{
    if(iaChave){try{const j=await iaLer(f,IA_MEDIDOR);if(j){if(j.leitura!=null)achou=String(j.leitura).replace(/\D/g,"");if(j.medidor)mdLido=String(j.medidor).toUpperCase().replace(/\s+/g,"");
      const regs=(Array.isArray(j.registros)?j.registros:[]).map(v=>String(v||"").toUpperCase().replace(/\s+/g,"")).filter(Boolean),end=j.end?String(j.end).toUpperCase().replace(/\s+/g," ").trim():"",uc=j.uc?String(j.uc).replace(/\D/g,""):"";
      if(regs.length||end){ // foto da tela do PDA: preenche esta ficha e, se tiver mais abas, as próximas fichas vazias
        const alvo=[x];for(let k=1;k<regs.length;k++){let o=c.find(y=>y!==x&&!alvo.includes(y)&&!y.ok&&!y.outro&&(!y.med||y.med===mdLido)&&(!y.reg||y.reg===regs[k]));
          if(!o&&confirm("Este medidor tem "+regs.length+" registros ("+regs.join(", ")+"), mas não sobrou ficha vazia.\nAumentar o livro pra mais uma confirmação?")){r.qtd=(r.qtd||c.length)+1;confDe(r);o=r.conf[r.conf.length-1]}
          if(o)alvo.push(o)}
        alvo.forEach((y,k)=>{if(mdLido)y.med=mdLido;if(regs[k])y.reg=regs[k];if(end)y.end=end;if(uc)y.uc=uc});
        if(!achou){localStorage.setItem(KEY,JSON.stringify(registros));desenharConf();render();if(bt){bt.disabled=false;bt.textContent="📷"}
          alert("📷 Li na tela do PDA:\n\n🔢 Medidor: "+(mdLido||"?")+"\n📍 "+(end||"sem endereço")+"\n🧾 "+(regs.join(" + ")||"registro não lido")+(alvo.length>1?"\n\nPreenchi "+alvo.length+" confirmações (uma pra cada registro).":"")+"\n\nAgora é só digitar a leitura.");return}}}}catch(err){iaFalhou(err)}}
    if(!achou&&!mdLido){
    await carregarOCR();
    const img=await new Promise((ok,er)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=er;i.src=URL.createObjectURL(f)});
    const maxL=Math.floor(Math.sqrt(15e6*img.width/img.height));
    const w=await Tesseract.createWorker("eng",1);
    await w.setParameters({tessedit_char_whitelist:"0123456789",tessedit_pageseg_mode:"11"});
    const res=await w.recognize(prepararPDA(img,Math.min(1600,maxL)));URL.revokeObjectURL(img.src);await w.terminate();
    // número do visor: o de letra MAIOR na foto, com 3 a 8 dígitos (ignora o número do medidor)
    const medNum=String(x.med||"").replace(/\D/g,"");
    const cand=(res.data.words||[]).map(wd=>({t:(wd.text||"").replace(/\D/g,""),h:wd.bbox?wd.bbox.y1-wd.bbox.y0:0})).filter(c=>c.t.length>=3&&c.t.length<=8&&!(medNum&&medNum.includes(c.t)));
    cand.sort((a,b)=>b.h-a.h||b.t.length-a.t.length);achou=cand.length?cand[0].t:"";
    }
  }catch(err){alert("Não foi possível ler a foto agora. Confira se tem internet e tente de novo.");achou=null}
  finally{if(bt){bt.disabled=false;bt.textContent="📷"}}
  if(achou===null)return;
  if(mdLido&&mdLido!==x.med){if(!x.med||confirm("📷 Medidor da foto: "+mdLido+"\nNa ficha está: "+x.med+"\n\nOK = trocar pelo da foto")){x.med=mdLido}}
  const v=prompt((mdLido?"🔢 Medidor: "+mdLido+"\n":"")+(achou?"📷 Li no visor: "+achou+"\n\nConfira com o medidor e corrija se precisar:":"📷 Não consegui ler o número nesta foto.\nDigite a leitura:"),achou||x.leit||"");
  if(v===null)return;
  x.leit=v.replace(/\s+/g,"").trim();localStorage.setItem(KEY,JSON.stringify(registros));desenharConf();render();
};
// Foto muito clara (estourada): estica o contraste e "escurece" as letras fracas (limiar adaptativo)
function prepararClara(img,largura){
  const c=prepararPDA(img,largura),g=c.getContext("2d"),W=c.width,H=c.height,px=g.getImageData(0,0,W,H),d=px.data,n=W*H,v=new Uint8ClampedArray(n);
  for(let i=0;i<n;i++)v[i]=d[i*4];
  // 1) contraste: o 2% mais escuro vira preto, o 2% mais claro vira branco
  const h=new Uint32Array(256);for(let i=0;i<n;i++)h[v[i]]++;let a=0,lo=0,hi=255;for(let k=0;k<256;k++){a+=h[k];if(a>n*0.02){lo=k;break}}a=0;for(let k=255;k>=0;k--){a+=h[k];if(a>n*0.02){hi=k;break}}
  const esc=hi>lo?255/(hi-lo):1;for(let i=0;i<n;i++)v[i]=Math.max(0,Math.min(255,(v[i]-lo)*esc));
  // 2) limiar adaptativo pela média da vizinhança (imagem integral)
  const I=new Float64Array((W+1)*(H+1));for(let y=0;y<H;y++){let sl=0;for(let x=0;x<W;x++){sl+=v[y*W+x];I[(y+1)*(W+1)+x+1]=I[y*(W+1)+x+1]+sl}}
  const r=Math.max(8,Math.round(W/60));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const x0=Math.max(0,x-r),y0=Math.max(0,y-r),x1=Math.min(W,x+r+1),y1=Math.min(H,y+r+1),area=(x1-x0)*(y1-y0);
    const m=(I[y1*(W+1)+x1]-I[y0*(W+1)+x1]-I[y1*(W+1)+x0]+I[y0*(W+1)+x0])/area,o=(y*W+x)*4,val=v[y*W+x]<m*0.88?0:255;d[o]=d[o+1]=d[o+2]=val}
  g.putImageData(px,0,0);return c;
}
function prepararPDA(img,largura){
  const s=largura/img.width,c=document.createElement("canvas");
  c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
  const g=c.getContext("2d");g.imageSmoothingQuality="high";g.drawImage(img,0,0,c.width,c.height);
  const px=g.getImageData(0,0,c.width,c.height),d=px.data;
  for(let i=0;i<d.length;i+=4){const v=Math.min(d[i],d[i+1],d[i+2]);d[i]=d[i+1]=d[i+2]=v}
  g.putImageData(px,0,0);return c;
}
function lerListaPDA(texto){
  const out=[];let cur=null;
  const kmDe=l=>{let k=l.match(/(\d+[,.]\d+)\s*km/i);if(k)return k[1].replace(".",",");k=l.match(/(\d{3,4})\s*km/i);return k?k[1].slice(0,-2)+","+k[1].slice(-2):""};
  texto.split(/\n+/).map(s=>s.trim()).filter(Boolean).forEach(l=>{
    // linha do limite/km fecha o livro
    if(cur&&(/limite/i.test(l)||/\bkm\b/i.test(l))){const d=l.match(/(\d{2}\/\d{2}\/\d{4})/);if(d)cur.lim=d[1];const k=kmDe(l);if(k)cur.km=k;cur=null;return}
    const h=l.match(/(\d{4})\D{1,3}(\d{1,2})\D{1,3}(\d{5,6})\D*?(\d+)\s*[\/|]\s*(\d+)/);
    if(h){cur={livro:h[3],etapa:+h[2],qtd:+h[5],end:"",lim:"",km:""};out.push(cur);return}
    if(cur){const t=l.replace(/^[^A-Za-z0-9]+/,"");if(t.replace(/[^A-Za-z0-9]/g,"").length>=2)cur.end+=(cur.end?" ":"")+t}
  });
  return out.filter(x=>x.qtd>0).map(x=>({...x,end:x.end.replace(/^R(?=\d)/,"R ").replace(/\s+/g," ").trim()}));
}
let pdaFila=[];try{pdaFila=JSON.parse(localStorage.getItem(KEY+"_pda_fila")||"[]")}catch(e){}
function pdaSalvarFila(){try{localStorage.setItem(KEY+"_pda_fila",JSON.stringify(pdaFila))}catch(e){}}
function pdaFaixa(){
  const f=$("pdaFaixa");if(!f)return;
  if(!pdaFila.length){f.hidden=true;return}
  const g={};pdaFila.forEach(x=>g[x.etapa]=(g[x.etapa]||0)+1);
  const txt=Object.keys(g).sort((a,b)=>a-b).map(e=>"Etapa "+p2(+e)+" ("+g[e]+")").join(" · ");
  f.hidden=false;f.innerHTML='<span>📷 Da foto: '+txt+'. Um toque no ✔ salva cada livro na sua etapa.</span><button type="button" id="pdaLimpar">Descartar</button>';
  $("pdaLimpar").onclick=()=>{
    if(!confirm("Descartar os livros lidos da foto que ainda não foram salvos?"))return;
    pdaFila=[];pdaSalvarFila();[...$("livroRows").children].forEach(r=>{if(r._end)r.remove()});
    if(!$("livroRows").children.length)criarLinha(false,{part:false});salvarRascunho();pdaFaixa();
  };
}
// guarda de volta o que você corrigiu nas barrinhas (livro e quantidade) antes de trocar de etapa
function pdaSync(){[...$("livroRows").children].forEach(r=>{const it=r._it;if(!it)return;const l=r.querySelector(".r-livro").value.trim(),q=Number(r.querySelector(".r-qtd").value);if(l)it.livro=l;if(q>0)it.qtd=q;it.rel=r.querySelector(".r-rel").checked})}
// Qualquer mudança nas barrinhas (livro, quantidade, REL.) já vai para a fila guardada: não perde se o app recarregar
["input","change"].forEach(ev=>$("livroRows").addEventListener(ev,()=>{if(pdaFila.length){pdaSync();pdaSalvarFila()}}));
// Mostra no formulário os livros da foto, cada um com a sua etapa
function pdaMostrar(n){
  pdaFaixa();if(!pdaFila.length)return;
  pdaSync();
  [...$("livroRows").children].forEach(r=>{const vazio=!r.querySelector(".r-livro").value.trim()&&r.querySelector(".r-qtd").value==="";if(r._end||vazio)r.remove()});
  pdaFila.forEach(x=>{criarLinha(false,{livro:x.livro,qtd:x.qtd,part:false,rel:x.rel});const r=$("livroRows").lastElementChild;r._it=x;r.querySelector(".r-qtd").classList.add("auto");pdaPin(r,{end:x.end,lim:x.lim,km:x.km,etapa:x.etapa})});
  criarLinha(false,{part:false});salvarRascunho();pdaSalvarFila();
}
// Salvou: tira da fila o que foi salvo
function pdaConcluir(){
  [...$("livroRows").children].forEach(r=>{if(r._it&&r.querySelector(".r-livro").value.trim())pdaFila=pdaFila.filter(x=>x!==r._it)});
  pdaSalvarFila();pdaFaixa();
}
// Ainda tem livro de outra etapa na fila? Vai pra ela e avisa
function pdaProxima(){
  if(!pdaFila.length)return "";
  const e=pdaFila[0].etapa,n=pdaFila.filter(x=>x.etapa===e).length;
  escolherEtapa(e);
  return "\n\n📷 Agora falta a Etapa "+p2(e)+" ("+n+" livro"+(n>1?"s":"")+"), já está na tela.";
}
// Endereço guardado no livro salvo: aparece na lista da etapa
function pdaDetalhe(r){
  if(!r.pda||!r.pda.end)return "";
  const q=encodeURIComponent(r.pda.end);
  const rua=String(r.pda.end).split(",")[0].trim();
  return '<details class="pda-item"><summary>📍 <span class="pda-rua">'+esc(rua)+'</span></summary><div class="pda-box"><b>'+esc(r.pda.end)+'</b><div class="pda-tags">'+(r.pda.lim&&!r.releitura?'<span>Limite '+esc(r.pda.lim)+'</span>':'')+(r.pda.km?'<span>'+esc(r.pda.km)+' km</span>':'')+'</div>'+
    '<a href="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination='+q+'" target="_blank" rel="noopener">🗺️ Abrir no mapa</a><button type="button" class="pda-copiar" data-end="'+esc(r.pda.end)+'">📋 Copiar endereço</button></div></details>';
}
function preencherDoPDA(itens,et){
  pdaFila=itens.map(x=>({...x}));pdaSalvarFila();
  escolherEtapa(pdaFila[0].etapa);
}
$("pdaBtn").onclick=()=>$("pdaArq").click();
// ---------- 🤖 Leitura com IA (Google Gemini). A chave fica SÓ neste celular, não vai no arquivo nem no backup ----------
const IAKEY=KEY+"_ia";let iaChave="",iaModelo="",iaErro="";try{iaChave=localStorage.getItem(IAKEY)||"";iaModelo=localStorage.getItem(IAKEY+"_m")||""}catch(e){}
const IA_MODELOS=["gemini-flash-latest","gemini-2.5-flash","gemini-2.0-flash","gemini-flash-lite-latest","gemini-2.5-flash-lite"];
function iaSalvar(){try{iaChave?localStorage.setItem(IAKEY,iaChave):localStorage.removeItem(IAKEY);iaModelo?localStorage.setItem(IAKEY+"_m",iaModelo):localStorage.removeItem(IAKEY+"_m")}catch(e){}}
function fotoBase64(file){return new Promise((ok,er)=>{const im=new Image();im.onload=()=>{const M=1600,k=Math.min(1,M/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(im.src);ok(c.toDataURL("image/jpeg",.85).split(",")[1])};im.onerror=er;im.src=URL.createObjectURL(file)})}
function iaMotivo(st,t){return st>=500?"o Google está sobrecarregado agora (a chave está certa, é só tentar de novo daqui a pouco)":st===429?"o limite grátis da chave acabou por agora (tente mais tarde)":(st===400||st===401||st===403)&&/key|chave|API_KEY|permission|PERMISSION/i.test(t)?"a chave não foi aceita pelo Google":"erro "+st}
async function iaChamar(parts){
  const ms=iaModelo?[iaModelo,...IA_MODELOS.filter(m=>m!==iaModelo)]:IA_MODELOS;let ult="nenhum modelo respondeu",ocup=null;
  // 503/500 (Google ocupado) ou 429 (limite daquele modelo): tenta o próximo modelo; no fim, espera um pouco e tenta mais uma vez
  for(let volta=0;volta<2;volta++){if(volta){if(!ocup)break;await new Promise(ok=>setTimeout(ok,2500))}
  for(const m of ms){
    const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":iaChave},body:JSON.stringify({contents:[{parts}],generationConfig:{temperature:0,responseMimeType:"application/json"}})});
    if(r.status===404){ult="modelo "+m+" não existe";continue}
    if(r.status===429||r.status>=500){ocup=iaMotivo(r.status,await r.text());continue}
    if(!r.ok){const t=await r.text();throw new Error(iaMotivo(r.status,t))}
    const j=await r.json(),t=((((j.candidates||[])[0]||{}).content||{}).parts||[]).map(x=>x.text||"").join("");
    if(iaModelo!==m){iaModelo=m;iaSalvar()}
    return JSON.parse(t.replace(/^\s*```(?:json)?/,"").replace(/```\s*$/,""));
  }}
  throw new Error(ocup||ult);
}
async function iaLer(file,instr){if(!iaChave||navigator.onLine===false)return null;const b64=await fotoBase64(file);const j=await iaChamar([{text:instr},{inline_data:{mime_type:"image/jpeg",data:b64}}]);iaErro="";desenharIA();return j}
let iaAvisou=false;function iaFalhou(err){iaErro=String(err&&err.message||err);desenharIA();if(!iaAvisou){iaAvisou=true;setTimeout(()=>iaAvisou=false,8000);alert("🤖 A IA não conseguiu ler agora ("+iaErro+").\nVou usar o leitor do celular.")}}
const IA_CAIXA='Esta é uma foto da tela "Caixa de Entrada" de um PDA de leitura de energia. Cada livro tem uma linha como "B, 0200, 11, 001282" (o 3º número é a ETAPA, o último é o LIVRO com 6 dígitos) e à direita "0/232" (o número depois da barra é a QUANTIDADE de leituras). Embaixo vem o endereço, depois "Limite: dd/mm/aaaa" e a distância em Km. Leia TODOS os livros que aparecem inteiros na foto, na ordem. Responda só JSON: {"livros":[{"etapa":11,"livro":"001282","qtd":232,"end":"R DONA MARIA JOAQUINA RODRIGUES, 100, JD PAULISTA, TATUI, SP","lim":"16/10/2026","km":"5,18"}]}. Se não tiver livro, {"livros":[]}.';
const IA_ROTEIRO='Esta é uma foto da aba "Roteiro" de um PDA de leitura de energia. Cada linha é como "( 41 - - ) R DONA MARIA JOAQUINA RODRIG.." . Leia todas as linhas na ordem, de cima pra baixo, e devolva só o nome da rua (com o tipo: R, AV, TV, PC, AL, EST, ROD...), em MAIÚSCULAS, exatamente como está escrito, SEM o número entre parênteses e sem os ".." do final. Ignore linhas cortadas pela metade na borda da tela. Pode repetir rua se ela aparece mais de uma vez. Responda só JSON: {"ruas":["R DONA MARIA JOAQUINA RODRIG","R LIONS CLUB DE TATUI"]}.';
const IA_RESUMO2='Foto (com reflexo) da tela "Resumo por Mensagem" de um PDA de leitura de energia. Procure estas linhas pelo código e leia a "Quantidade:" logo abaixo de cada uma: 000 LEITURA NORMAL, 002 IMPEDIMENTO DE LEITURA, 004 TROCA DE EQUIPAMENTO, 009 UC DESLIGADA EM CAMPO, 011 LEITURA ACIMA DO ESPERADO, 012 LEITURA ABAIXO DO ESPERADO, 013 VIRADA DE MEDIDOR, 041 CAES SOLTOS, 081 INATIVO LIGADO, 082 INATIVO DESLIGADO, 999 DEVOLUCAO DE LIVRO INCOMPLETO (só se a linha começar com 999; "MED - ANL - MED INCOMPLETO" NÃO é 999). Responda só JSON com os números (0 se a linha não existir): {"q000":314,"q002":3,"q004":0,"q009":3,"q011":13,"q012":9,"q013":1,"q041":0,"q081":0,"q082":43,"q999":0}.';
// aceita a resposta da IA mesmo se ela vier com outros nomes de campo
const RES_NOMES={"000":"LEITURA NORMAL","002":"IMPEDIMENTO DE LEITURA","009":"UC DESLIGADA EM CAMPO","011":"LEITURA ACIMA DO ESPERADO","012":"LEITURA ABAIXO DO ESPERADO","013":"VIRADA DE MEDIDOR","082":"INATIVO DESLIGADO","004":"TROCA DE EQUIPAMENTO","041":"CAES SOLTOS","081":"INATIVO LIGADO","999":"DEVOLUCAO DE LIVRO INCOMPLETO"};
function itensResumoIA(j){if(!j)return[];let a=Array.isArray(j)?j:j.itens||j.items||j.mensagens||Object.values(j).find(Array.isArray);
  if(!a){const o=[];Object.keys(j).forEach(k=>{const m=k.match(/^q?_?(\d{3})$/);if(m&&+j[k]>0)o.push({cod:m[1],nome:RES_NOMES[m[1]]||"",q:+j[k]})});return o}
  return a.map(x=>{const cod=String(x.cod??x.codigo??x.code??x.c??"").replace(/\D/g,""),c3=cod?cod.padStart(3,"0"):"";const nome=String(x.nome??x.descricao??x.mensagem??x.name??x.texto??"").toUpperCase().replace(/^\d{2,3}\s*[-–]\s*/,"").trim()||RES_NOMES[c3]||"";
    const q=parseInt(String(x.q??x.quantidade??x.qtd??x.quantity??x.qt??"").replace(/\D/g,""),10)||0;
    if(/MED\s*INCOMPLETO|\bANL\b/.test(nome)||/^MED/i.test(String(x.cod??x.codigo??"")))return{cod:"MED",nome:"MED - ANL - MED INCOMPLETO",q};return{cod:c3,nome,q}}).filter(x=>x.nome||x.cod)}
const IA_RESUMO='Esta é uma foto da tela "Resumo por Mensagem" de um PDA de leitura de energia. Cada mensagem tem um código de 3 dígitos, um nome e uma "Quantidade:" logo abaixo. Os códigos que aparecem são: 000 = LEITURA NORMAL; 002 = IMPEDIMENTO DE LEITURA; 004 = TROCA DE EQUIPAMENTO; 009 = UC DESLIGADA EM CAMPO; 041 = CAES SOLTOS (cães soltos); 011 = LEITURA ACIMA DO ESPERADO; 012 = LEITURA ABAIXO DO ESPERADO; 013 = VIRADA DE MEDIDOR; 081 = INATIVO LIGADO; 082 = INATIVO DESLIGADO; 999 = DEVOLUCAO DE LIVRO INCOMPLETO. ATENÇÃO: "MED - ANL - MED INCOMPLETO" NÃO é 999 (é medidor digitado incompleto); para ela use cod "MED". Só use 999 se a linha começar com o número 999 escrito na tela. Pode ter outros itens; leia também. Se o nome estiver apagado pelo reflexo, reconheça pelo código. A foto é tirada na rua: pode estar torta, com reflexo do sol, riscos na tela e a capa do aparelho; o código e a "Quantidade" ficam do lado esquerdo e quase sempre dá pra ler mesmo se o fim do nome estiver apagado pelo reflexo. Leia TODOS os itens. Use exatamente as chaves cod, nome e q (q é número). Se a foto for da tela "Fila de Impressão" (título tipo "Fila de Impressão - 0/84"), responda {"fila":84,"itens":[]} com o número DEPOIS da barra. Responda só JSON: {"itens":[{"cod":"002","nome":"IMPEDIMENTO DE LEITURA","q":3},{"cod":"009","nome":"UC DESLIGADA EM CAMPO","q":3},{"cod":"082","nome":"INATIVO DESLIGADO","q":43}]}. Se não achar, {"itens":[]}.';
const IA_FILA='Esta é uma foto da tela "Fila de Impressão" de um PDA de leitura de energia. No título aparece algo como "Fila de Impressão - 0/84": o número DEPOIS da barra é o total de contas para imprimir. Responda só JSON: {"total":84}. Se a foto NÃO for da tela Fila de Impressão (ex.: for o Resumo por Mensagem), ou se não achar, responda {"total":null}.';
async function lerFilaImpressao(file){let n=null;
  if(iaChave){try{const j=await iaLer(file,IA_FILA);if(j&&j.total!=null&&!isNaN(+j.total))n=+j.total}catch(err){iaFalhou(err)}}
  if(n==null){await carregarOCR();const img=await lerImg(file),maxL=Math.floor(Math.sqrt(15e6*img.width/img.height)),w=await Tesseract.createWorker("eng",1);
    for(const prep of [prepararPDA,prepararClara]){const t=(await w.recognize(prep(img,Math.min(2200,maxL)))).data.text;const m=t.match(/Impress\S*\s*[-–—]?\s*\d+\s*[\/|]\s*(\d+)/i)||t.match(/Fila[^\n]*?(\d+)\s*[\/|]\s*(\d+)/i);if(m){n=+(m[2]||m[1]);break}}
    await w.terminate();URL.revokeObjectURL(img.src)}
  return n}
// 📷 do lado do 🖨️: tira a foto e já guarda (pergunta só pra conferir)
function impFotoDireto(id){const r=registros.find(x=>String(x.id)===String(id));if(!r)return;
  const inp=document.createElement("input");inp.type="file";inp.accept="image/*";
  inp.onchange=async()=>{const file=(inp.files||[])[0];if(!file)return;let n=null;try{n=await lerFilaImpressao(file)}catch(e){}
    if(n==null){nlAlvo="rec:"+r.id;nlBtn="nlFotoBtn";return $("nlArq").onchange({target:{files:[file],value:""}})}
    const pr=!!predios[r.livro],v=prompt("🖨️ "+(pr?"Prédio · ":"")+"livro "+r.livro+"\n\nLi na Fila de Impressão: "+n+" contas impressas → "+bobinas(Math.min(n,r.qtd))+" bobina(s)."+(pr?"":"\n("+r.qtd+" leituras; as outras foram lidas mas não imprimem)")+"\n\nConfira e toque OK:",n);if(v===null)return;
    const q=parseInt(v,10);if(!(q>=0))return;if(pr){imprimir[r.livro]={q,quando:r.data.slice(0,7)};salvarImprimir()}else{r.impr=Math.min(q,r.qtd);localStorage.setItem(KEY,JSON.stringify(registros))}toast("🖨️ Livro "+r.livro+": "+q+" impressas · "+txtBob(Math.min(q,r.qtd)));render()};
  inp.click()}
function impPredio(id){const r=registros.find(x=>String(x.id)===String(id));if(!r)return;const pr=!!predios[r.livro],v=pr?imprimir[r.livro]:(r.impr!=null?{q:r.impr}:null);
  const f=document.createElement("div");f.className="modal-fundo obs-fundo";
  f.innerHTML=`<div class="modal obs-modal hl-modal"><div class="hl-tit">🖨️ ${pr?"Prédio · ":""}livro ${esc(r.livro)}<small></small><button type="button" class="c hl-x" aria-label="Fechar">✕</button></div>
  <div class="hint">${pr?`${r.qtd} leituras (continuam contando no mês). Quantas saem pra <b>imprimir</b>? Só essas entram nas bobinas. Fica guardado pro mês que vem.`:`${r.qtd} leituras. Quantas contas saíram <b>impressas</b>? (conta por e-mail, casa vaga, impedimento... não imprimem). Tire a foto da <b>Fila de Impressão</b> ou digite. No mês que vem a bobina já vem certa.`}</div>
  <div class="hl-p" style="grid-template-columns:minmax(0,1fr) auto"><input type="number" inputmode="numeric" min="0" class="iq" placeholder="ex.: 84" value="${v?v.q:""}"><button type="button" class="ag fot">📷 Foto</button></div>
  <div class="hint ib" style="margin-top:6px"></div>
  <div class="hl-bts">${v?'<button type="button" class="d" aria-label="Apagar">🗑️</button>':""}<button type="button" class="o">✔ Salvar</button></div><input type="file" accept="image/*" class="ia-f" hidden></div>`;
  document.body.appendChild(f);const iq=f.querySelector(".iq"),ib=f.querySelector(".ib"),fot=f.querySelector(".fot");
  const mostra=()=>{const n=+iq.value||0;ib.innerHTML=n?`🧾 ${n} pra imprimir → <b>${bobinas(Math.min(n,r.qtd))}</b> bobina(s)`:""};iq.oninput=mostra;mostra();
  f.querySelector(".c").onclick=()=>f.remove();
  const grava=n=>{if(pr){if(n!=null)imprimir[r.livro]={q:n,quando:r.data.slice(0,7)};else delete imprimir[r.livro];salvarImprimir()}else{if(n!=null)r.impr=Math.min(n,r.qtd);else delete r.impr;localStorage.setItem(KEY,JSON.stringify(registros))}};
  const d=f.querySelector(".d");if(d)d.onclick=()=>{grava(null);f.remove();render()};
  f.querySelector(".o").onclick=()=>{const n=parseInt(iq.value,10);grava(n>=0&&iq.value!==""?n:null);f.remove();render()};
  fot.onclick=()=>f.querySelector(".ia-f").click();
  f.querySelector(".ia-f").onchange=async e=>{const file=(e.target.files||[])[0];e.target.value="";if(!file)return;fot.disabled=true;fot.textContent="⏳";let n=null;
    try{n=await lerFilaImpressao(file)}catch(err){}
    fot.disabled=false;fot.textContent="📷 Foto";
    if(n==null)return alert("Não consegui achar o número na foto.\nTire a foto mostrando o título \"Fila de Impressão - 0/84\" e tente de novo, ou digite o número.");
    iq.value=n;mostra()};
}
function desenharIA(){const d=$("iaDot");if(!d)return;$("iaBtn").hidden=!!iaChave&&!iaErro;const fb=$("iaRod");if(fb)fb.innerHTML="🤖 Leitura com IA "+(iaChave?(iaErro?"🔴":"🟢"):"⚪");d.style.background=iaChave?(iaErro?"#ef4444":"#22c55e"):"#d1d5db";$("iaBtn").title=iaChave?(iaErro?"Leitura com IA: deu problema ("+iaErro+")":"Leitura com IA: ligada"):"Leitura com IA: desligada (toque pra colocar a chave)"}
async function iaTestar(){try{const j=await iaChamar([{text:'Responda só JSON: {"ok":true}'}]);iaErro="";desenharIA();alert("🟢 Chave funcionando!\n\nAgora o 📷 lê as fotos (Caixa de Entrada, Roteiro e Resumo) com IA.\nSem internet, o app usa o leitor do celular.\n\nModelo: "+iaModelo)}catch(err){iaErro=String(err.message||err);desenharIA();alert("🔴 Não deu certo: "+iaErro+"."+(/sobrecarregado|limite/.test(iaErro)?"":"\n\nConfira se a chave está certa (é a do Google AI Studio)."))}}
function abrirIA(){
  const v=prompt("🤖 Leitura das fotos com IA (Google Gemini)\n\nCole aqui a sua chave do Google AI Studio.\nEla fica guardada SÓ neste celular (não vai no arquivo nem no backup).\n\nDeixe em branco e toque OK para desligar."+(iaErro?"\n\n🔴 Último problema: "+iaErro:""),iaChave);
  if(v===null)return;iaChave=v.trim().replace(/\s+/g,"");iaErro="";if(!iaChave)iaModelo="";iaSalvar();desenharIA();if(iaChave)iaTestar();else alert("⚪ Leitura com IA desligada. O 📷 volta a usar só o leitor do celular.")}
// 📷 várias fotos: lê uma ou mais telas da Caixa de Entrada e soma tudo (livro repetido entra uma vez só)
let pdaAcum=[],pdaFotos=0;
function lerImg(file){return new Promise((ok,er)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=er;im.src=URL.createObjectURL(file)})}
function pdaResumo(){
  if(!pdaAcum.length){pdaFotos=0;return alert("Não achei nenhum livro na foto. Tente outra foto.")}
  const itens=pdaAcum,ets=[...new Set(itens.map(x=>x.etapa))],et=ets.length===1?ets[0]:0;
  const q=itens.reduce((t,x)=>t+qBob(x.livro,+x.qtd||0),0),qp=itens.filter(x=>predios[x.livro]).reduce((t,x)=>t+(+x.qtd||0),0);
  const f=document.createElement("div");f.className="modal-fundo obs-fundo";
  f.innerHTML=`<div class="modal obs-modal"><h3>📷 Li ${itens.length} livro(s)${et?" da Etapa "+p2(et):""}</h3><div class="hint">${pdaFotos>1?pdaFotos+" fotos somadas · ":""}livro repetido entre as fotos entra uma vez só</div>
  <div class="pda-res">${itens.map(x=>`<div>• <b>${esc(x.livro)}</b> — ${x.qtd}${predios[x.livro]?" 🏢":""} <small>(Etapa ${p2(x.etapa)})</small></div>`).join("")}</div>
  ${q||qp?`<div class="pda-tot">Total: <b>${(q+qp).toLocaleString("pt-BR")}</b> leituras · ${q?txtBob(q)+" (cabem "+bobinas(q)*porBobina+")":"🧾 sem bobina"}</div>`:""}
  <div class="obs-bts"><button type="button" class="m">➕ Mais uma foto</button><button type="button" class="o">✔ Preencher</button></div><button type="button" class="c hl-canc">Cancelar</button></div>`;
  document.body.appendChild(f);
  f.querySelector(".m").onclick=()=>{f.remove();$("pdaArq").click()};
  f.querySelector(".c").onclick=()=>{f.remove();pdaAcum=[];pdaFotos=0};
  f.querySelector(".o").onclick=()=>{f.remove();const it=pdaAcum;pdaAcum=[];pdaFotos=0;preencherDoPDA(it,et)};
}
$("pdaArq").onchange=async e=>{
  const files=[...(e.target.files||[])];if(!files.length)return;
  const b=$("pdaBtn"),txt=b.textContent;b.disabled=true;let falhou=0,w=null,fi=0;
  const leitor=async()=>{if(!w){b.textContent="⏳ Preparando leitor...";await carregarOCR();w=await Tesseract.createWorker("eng",1,{logger:l=>{if(l.status==="recognizing text")b.textContent="⏳ "+(files.length>1?"Foto "+(fi+1)+"/"+files.length+" · ":"")+"Lendo... "+Math.round(l.progress*100)+"%"}});await w.setParameters({tessedit_pageseg_mode:"6"})}return w};
  try{
    for(fi=0;fi<files.length;fi++){
      let itens=[];
      if(iaChave){b.textContent="🤖 "+(files.length>1?"Foto "+(fi+1)+"/"+files.length+" · ":"")+"Lendo com IA...";
        try{const j=await iaLer(files[fi],IA_CAIXA);itens=((j&&j.livros)||[]).map(x=>({livro:String(x.livro||"").replace(/\D/g,"").padStart(6,"0"),etapa:+x.etapa,qtd:+x.qtd,end:String(x.end||"").toUpperCase().replace(/\s+/g," ").trim(),lim:String(x.lim||""),km:String(x.km||"").replace(".",",")})).filter(x=>x.qtd>0&&x.etapa>=1&&x.etapa<=18&&/^\d{6}$/.test(x.livro))}catch(err){iaFalhou(err)}}
      if(!itens.length){
        const img=await lerImg(files[fi]),wk=await leitor();
        const maxL=Math.floor(Math.sqrt(15e6*img.width/img.height));
        const r=await wk.recognize(prepararPDA(img,Math.min(2200,maxL)));
        itens=lerListaPDA(r.data.text);
        if(!itens.length){b.textContent="⏳ Foto clara, tentando de novo...";const r2=await wk.recognize(prepararClara(img,Math.min(2200,maxL)));itens=lerListaPDA(r2.data.text)}
        URL.revokeObjectURL(img.src);
      }
      if(!itens.length){falhou++;continue}
      pdaFotos++;
      itens.forEach(x=>{if(!pdaAcum.some(y=>y.livro===x.livro&&y.etapa===x.etapa))pdaAcum.push(x)});
    }
    if(w)await w.terminate();
  }catch(err){alert("Não foi possível ler a foto agora. Confira se tem internet e tente de novo.")}
  finally{b.disabled=false;b.textContent=txt;e.target.value=""}
  if(falhou)alert(falhou===1&&files.length===1&&!pdaAcum.length?"Não consegui ler os livros desta foto.\nTente uma foto reta, com boa luz, mostrando só a Caixa de Entrada do PDA.":"⚠️ "+(falhou===1?"Uma foto":"Algumas fotos")+" não deu pra ler. Tente tirar de novo, reta e com boa luz.");
  if(pdaAcum.length)pdaResumo();
};


// ---------- Botão opcional: usar a data da etapa no calendário ----------
function atualizarUsarData(){
  const box=$("usarDataBox"),h=$("data").value||hoje();
  let d=(!ajuda&&!esqueci)?diaDaEtapa(h.slice(0,7),etapa):"";
  // ciclo do mês terminou (ex.: 30/10 na Etapa 18 de 27/10): não é atraso, então sem ⏰ e sem "usar data"
  if(d&&d<h&&!etapaDoDia(h)){const u=ultimaEtapaAte(h),pr=proximaEtapa(h);if(u&&u.etapa===etapa&&u.dia===d&&(!pr||pr.dia.slice(0,7)!==h.slice(0,7)))d=""}
  if(d&&d!==h){$("usarData").textContent="📅 usar "+d.slice(8)+"/"+d.slice(5,7);box.hidden=false}else box.hidden=true;
  // ⏰ ao lado da bolinha: está lançando uma etapa depois do dia do calendário
  const rel=$("topoRelogio");if(rel){
    const dias=d&&d<h?Math.round((Date.UTC(+h.slice(0,4),+h.slice(5,7)-1,+h.slice(8,10))-Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10)))/864e5):0;
    rel.hidden=!dias;if(dias){rel.textContent="⏰"+dias;rel.dataset.msg="⏰ Etapa "+p2(etapa)+" atrasada "+dias+" dia"+(dias>1?"s":"")+" · era "+d.slice(8)+"/"+d.slice(5,7)}}
}
$("topoRelogio").onclick=e=>{e.stopPropagation();e.preventDefault();alert($("topoRelogio").dataset.msg||"")};
$("usarData").onclick=()=>{
  const d=diaDaEtapa(($("data").value||hoje()).slice(0,7),etapa);if(!d)return;
  $("data").value=d;dataManual=d!==hoje();esqueci=null;mesVer=d.slice(0,7);
  escolherEtapa(etapa);
};
const _atualizarChip=atualizarChip;
atualizarChip=function(){_atualizarChip();atualizarUsarData()};

// ---------- Botão "↩ Hoje": volta pra data e pro mês de hoje ----------
function atualizarVoltarHoje(){const h=hoje();$("voltarHoje").hidden=!(mesVer!==h.slice(0,7)||$("data").value!==h)}
$("voltarHoje").onclick=()=>{
  esqueci=null;$("data").value=hoje();dataManual=false;mesVer=hoje().slice(0,7);
  const e=etapaAutomatica(hoje());if(e)sel(e,false);else render();
};
const _atualizarChip2=atualizarChip;
atualizarChip=function(){_atualizarChip2();atualizarVoltarHoje()};

// ---------- ❓ lá em cima: a etapa atrasou no mês passado (toque mostra os detalhes) ----------
function atualizarTopoInterroga(){
  const q=$("topoInterroga"),h=$("data").value||hoje();
  q.hidden=!(!ajuda&&atrasoMesPassado(h.slice(0,7),etapa));
}
$("topoInterroga").onclick=()=>verAtraso(etapa,($("data").value||hoje()).slice(0,7));
// 📅 data desta etapa no mês que vem (pra responder rápido na rua)
function proxDaEtapa(){const h=$("data").value||hoje(),m=somaMes(h.slice(0,7),1),d=diaDaEtapa(m,etapa);return d?{m,d,c:cicloPlanejado(m,etapa-1),pv:ehProv(m)}:null}
function atualizarTopoProx(){const b=$("topoProx"),p=ajuda?null:proxDaEtapa();b.hidden=!p;if(p){b.textContent="📅 "+p.d.slice(8)+"/"+p.d.slice(5,7);b.classList.toggle("prov",p.pv)}}
$("topoProx").onclick=e=>{e.stopPropagation();const p=proxDaEtapa();if(!p)return;const[a,mo,di]=p.d.split("-").map(Number),sem=["domingo","segunda","terça","quarta","quinta","sexta","sábado"][new Date(a,mo-1,di).getDay()];
  alert("📅 Etapa "+p2(etapa)+" no mês que vem:\n\n"+p.d.slice(8)+"/"+p.d.slice(5,7)+"/"+a+" ("+sem+")"+(p.c!=null?"\nCiclo de "+p.c+" dias":"")+(p.pv?"\n\n🟡 Calendário provisório (pode mudar quando chegar o oficial)":""))};
const _atualizarChip3=atualizarChip;
atualizarChip=function(){_atualizarChip3();atualizarTopoInterroga();atualizarTopoProx()};
// ---------- Início: data de hoje e etapa do calendário ----------
try{if(!localStorage.getItem(KEY+"_fix_015894")){const d=registros.filter(r=>!r.releitura&&r.livro==="015894"&&r.etapa===11&&r.data==="2026-10-20"&&r.qtd<=4&&registros.some(o=>o!==r&&o.livro==="015894"&&o.etapa===11&&o.data.startsWith("2026-10")&&o.qtd>20));
  if(d.length){registros=registros.filter(r=>!d.includes(r));localStorage.setItem(KEY,JSON.stringify(registros))}localStorage.setItem(KEY+"_fix_015894","1")}}catch(e){}
try{if(!localStorage.getItem(KEY+"_fix_012041nl")){const r=registros.find(x=>x.livro==="012041"&&x.data==="2026-10-22"&&!x.releitura);if(r&&!r.nl){r.nl=8;r.feitas=r.feitas||451;localStorage.setItem(KEY,JSON.stringify(registros));try{render()}catch(e){}}localStorage.setItem(KEY+"_fix_012041nl","1")}}catch(e){}
// uma vez: livro 003278 (Cerquilho, ajuda, Etapa 15): feito hoje 23/10, o dia previsto era 22/10 → 1 dia de atraso (horas ficam no dia 23)
try{if(!localStorage.getItem(KEY+"_fix_003278b")){const r=registros.find(x=>x.livro==="003278"&&x.etapa===15&&/cerquilho/i.test(x.localidade||"")&&(x.data==="2026-10-23"||x.data==="2026-10-22")&&!x.releitura);if(r){r.data="2026-10-23";r.diaPrev="2026-10-22";localStorage.setItem(KEY,JSON.stringify(registros));try{render()}catch(e){}}localStorage.setItem(KEY+"_fix_003278b","1")}}catch(e){}
// a de cima procurava "1241"; o livro certo é 012041 (MED incompleto lido como 999)
try{if(!localStorage.getItem(KEY+"_fix_med999b")){const a=registros.length;registros=registros.filter(r=>!(r.releitura&&r.livro==="012041"&&r.data==="2026-10-22"&&(r.aguarda||r.origem==="999"||(r.qtd===1&&!confDe(r).some(x=>x.ok)))));if(registros.length!==a){localStorage.setItem(KEY,JSON.stringify(registros));try{render()}catch(e){}}localStorage.setItem(KEY+"_fix_med999b","1")}}catch(e){}
try{if(!localStorage.getItem(KEY+"_fix_med999")){const a=registros.length;registros=registros.filter(r=>!(r.releitura&&r.aguarda&&r.origem==="999"&&/1241/.test(r.livro)&&!confDe(r).some(x=>x.ok)));if(registros.length!==a){localStorage.setItem(KEY,JSON.stringify(registros));try{render()}catch(e){}}localStorage.setItem(KEY+"_fix_med999","1")}}catch(e){}
try{if(!localStorage.getItem(KEY+"_fix_lanc")){registros.forEach(r=>{if(r.releitura&&!r.lancPDA&&confDe(r).every(x=>x.ok))r.lancPDA=confDe(r).map(x=>x.quando||"").sort().slice(-1)[0]||r.data});localStorage.setItem(KEY,JSON.stringify(registros));localStorage.setItem(KEY+"_fix_lanc","1")}}catch(e){}
try{if(!localStorage.getItem(KEY+"_fix_voltou")){registros.forEach(r=>{if(r.releitura&&!r.voltou&&confDe(r).some(x=>!x.ok))r.voltou=hoje()});localStorage.setItem(KEY,JSON.stringify(registros));localStorage.setItem(KEY+"_fix_voltou","1")}}catch(e){}
// uma vez só: confirmações do livro 005740 (Etapa 11, out/2026) que o Luís mandou por foto — junta releitura repetida e preenche as fichas
try{if(!localStorage.getItem(KEY+"_fix_005740")){
  const F=[{med:"B07423075",reg:"CON-003",uc:"000206561504500",end:"AV JORN JULIO MESQUITA FILHO, 205, ESCRITORIO, BRO GRANDINO"},
    {med:"AR0253716",reg:"CON-003",uc:"000107479404502",end:"AV JORN JULIO MESQUITA FILHO, 205, BRO GRANDINO"},
    {med:"AR0253716",reg:"ERA-024",uc:"000107479404502",end:"AV JORN JULIO MESQUITA FILHO, 205, BRO GRANDINO"},
    {med:"3T5756103",reg:"CON-003",uc:"000372160404515",end:"R ALFONSO GRANDINO, 117, VL DR LAURINDO"}];
  const rs=registros.filter(r=>r.releitura&&r.livro==="005740"&&r.etapa===11&&r.data.startsWith("2026-10")).sort((a,b)=>a.data.localeCompare(b.data));
  let r=rs[0];const velhas=rs.flatMap(x=>x.conf||[]);
  if(!r){r={id:Date.now()+Math.random(),data:"2026-10-16",etapa:11,livro:"005740",qtd:4,localidade:"Tatui",releitura:true};registros.push(r)}
  rs.slice(1).forEach(x=>{registros=registros.filter(y=>y!==x)});
  r.qtd=4;const usad=new Set();r.conf=F.map(f=>{const v=velhas.find(c=>!usad.has(c)&&c.med===f.med&&(!c.reg||c.reg===f.reg)&&(c.leit||c.ok))||{};usad.add(v);return {...f,leit:v.leit||"",ok:!!v.ok,...(v.quando?{quando:v.quando}:{}),...(v.impd?{impd:true,motivo:v.motivo||""}:{}),...(v.outro?{outro:true,agente:v.agente||""}:{})}});
  localStorage.setItem(KEY,JSON.stringify(registros));localStorage.setItem(KEY+"_fix_005740","1");
  setTimeout(()=>toast("📝 Releitura do livro 005740 preenchida: 4 confirmações com medidor e endereço"),1200)}}catch(e){}
$("data").value=hoje();
try{const h=hoje(),ab=registros.filter(r=>r.data===h&&r.ini&&!r.fim&&!cronoDoRec(r.id)).sort((a,b)=>a.ini.localeCompare(b.ini));
  if(ab.length){const ts=hm=>{const[a,b]=hm.split(":").map(Number),d=new Date();d.setHours(a,b,0,0);return d.getTime()};
    pausarTodos();
    ab.forEach((r,i)=>{const ini=ts(r.ini),prox=ab[i+1];cronos.push(prox?{id:Date.now()+i,livro:r.livro,recId:String(r.id),segs:[[ini,ts(prox.ini)]],run:0}:{id:Date.now()+i,livro:r.livro,recId:String(r.id),segs:[],run:ini});delete r.ini});
    salvarCrono();localStorage.setItem(KEY,JSON.stringify(registros))}}catch(e){}
iniciarLinhas();
completarProvisorio();
// Ao abrir: usa o prontuário que já está escrito pra completar os livros antigos daquela cidade
setTimeout(()=>{const l=$("localidade").value,p=$("prontuario").value.trim();if(l&&p)guardarPront(l,p)},400);
// correção 16.09: a etapa que ficou presa hoje (01/02 depois do fim do ciclo) é liberada uma vez, pra abrir na certa
try{if(!localStorage.getItem(KEY+"_fix_gap1609")){const a=etapaAmarrada(hoje()),au=etapaAutomatica(hoje());if(a&&au&&a!==au&&!etapaDoDia(hoje()))localStorage.removeItem(ETAPADIAKEY);localStorage.setItem(KEY+"_fix_gap1609","1")}}catch(e){}
const eHoje=etapaAmarrada(hoje())||etapaAutomatica(hoje());
sel(pdaFila.length?pdaFila[0].etapa:(eHoje||1),false);desenharIA();
