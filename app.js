const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const sections=Array.from({length:15},(_,i)=>$('#stop-'+i)),workspace=$('.map-workspace'),viewport=$('#map-viewport'),world=$('#map-world');
const groups={intro:[0],map:[1],lands:[2,3,4,5],civilization:[6,7,8,9,10,11,12],crisis:[13,14]};
let current=0,zoom=1,panX=0,panY=0,drag=null,transitionTimer;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function renderMap(){world.style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`}
function limitPan(){const x=viewport.clientWidth*(zoom-1)/2,y=Math.max(0,(world.offsetHeight*zoom-viewport.clientHeight)/2);panX=Math.max(-x,Math.min(x,panX));panY=Math.max(-y,Math.min(y,panY))}
function resetMap(){zoom=1;panX=panY=0;renderMap()}
function route(hash,write=true){if(write&&location.hash!==hash)history.pushState(null,'',hash)}
function showLanding(anchor='territory-map',write=true){if(anchor!=='home'&&!document.getElementById(anchor))anchor='home';clearTimeout(transitionTimer);$('#exhibit').classList.remove('content-leaving');document.body.classList.remove('state-view');workspace.classList.remove('show-information');resetMap();route('#'+anchor,write);requestAnimationFrame(()=>$(anchor==='home'?'.portal-intro':'#'+anchor)?.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'}))}
function selectStop(index,write=true){
 if(index<2||index>5){showLanding(index>=6&&index<=12?'pillars':index===13?'warning':'home',write);return}
 current=index;activeTopic=0;
 sections.forEach((section,i)=>{if(section)section.hidden=i!==current});
 $('#subnav').replaceChildren();[2,3,4,5].forEach(i=>{const b=document.createElement('button');b.textContent=sections[i].querySelector('h2').textContent;b.className=i===current?'active':'';b.setAttribute('aria-pressed',String(i===current));b.onclick=()=>changeState(i);$('#subnav').append(b)});
 document.body.classList.add('state-view');workspace.classList.add('show-information');route('#stop-'+current,write);
 $('#exhibit').classList.remove('content-leaving','content-arriving');void $('#exhibit').offsetWidth;$('#exhibit').classList.add('content-arriving');window.scrollTo({top:0,behavior:'instant'});
 profileButtons().forEach((b,i)=>b.setAttribute('aria-pressed',String(i===0)));
}
function changeState(index){clearTimeout(transitionTimer);$('#exhibit').classList.add('content-leaving');transitionTimer=setTimeout(()=>selectStop(index),reduced()?0:140)}
$$('[data-room]').forEach(b=>b.onclick=()=>b.dataset.room==='map'?showLanding():changeState(groups[b.dataset.room][0]));
$$('[data-stop]').forEach(b=>b.onclick=()=>changeState(Number(b.dataset.stop)));
$('#home-link').onclick=e=>{e.preventDefault();showLanding('home')};$('#return-atlas').onclick=()=>showLanding();
$$('[data-home-anchor]').forEach(a=>a.onclick=e=>{e.preventDefault();showLanding(a.dataset.homeAnchor)});$('#map-overview').onclick=()=>showLanding('pillars');
$$('.region-target').forEach(p=>{function enter(){clearTimeout(transitionTimer);window.getSelection()?.removeAllRanges();$$('.region-target').forEach(x=>x.classList.toggle('chosen',x===p));world.style.transform='scale(1.08)';transitionTimer=setTimeout(()=>{Number(p.dataset.region)===6?showLanding('pillars'):selectStop(Number(p.dataset.region));resetMap()},reduced()?0:350)}p.onpointerdown=e=>e.preventDefault();p.onclick=enter;p.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();enter()}}});
function changeZoom(value){zoom=Math.max(1,Math.min(3.5,value));limitPan();renderMap()}
$('#zoom-in').onclick=()=>changeZoom(zoom+.35);$('#zoom-out').onclick=()=>changeZoom(zoom-.35);$('#reset-map').onclick=resetMap;
viewport.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();changeZoom(zoom-e.deltaY*.005)}},{passive:false});
viewport.onpointerdown=e=>{if(e.target.closest('.region-target,button')||zoom===1)return;drag={x:e.clientX,y:e.clientY,px:panX,py:panY};viewport.setPointerCapture(e.pointerId);world.classList.add('dragging')};viewport.onpointermove=e=>{if(!drag)return;panX=drag.px+e.clientX-drag.x;panY=drag.py+e.clientY-drag.y;limitPan();renderMap()};viewport.onpointerup=viewport.onpointercancel=()=>{drag=null;world.classList.remove('dragging')};addEventListener('resize',()=>{limitPan();renderMap()});
const dialog=$('#map-dialog');if($('#open-map'))$('#open-map').onclick=()=>dialog.showModal();$('#close-map').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close()};
$$('.profile-content').forEach(p=>{p.hidden=false;p.classList.add('scroll-chapter')});
function profileButtons(){return $$('#stop-'+current+' [data-profile]')}
function goTopic(button){if(!button)return;const target=$('#profile-'+button.dataset.profile);target?.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});profileButtons().forEach(b=>b.setAttribute('aria-pressed',String(b===button)))}
$$('[data-profile]').forEach(b=>b.onclick=()=>goTopic(b));
let activeTopic=0;
const topicObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting&&!e.target.closest('.stop').hidden){const buttons=profileButtons();activeTopic=buttons.findIndex(b=>'profile-'+b.dataset.profile===e.target.id);buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===activeTopic)))}})},{rootMargin:'-15% 0px -60% 0px'});$$('.profile-content').forEach(p=>topicObserver.observe(p));
addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.target.closest('input,textarea,select,[contenteditable],dialog'))return;if(!document.body.classList.contains('state-view'))return;if(e.key==='Escape'){e.preventDefault();showLanding();return}if(current<2||current>5)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();activeTopic=0;changeState(2+((current-2+(e.key==='ArrowRight'?1:-1)+4)%4))}if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();const buttons=profileButtons();activeTopic=Math.max(0,Math.min(buttons.length-1,activeTopic+(e.key==='ArrowDown'?1:-1)));goTopic(buttons[activeTopic])}});
const hint=document.createElement('p');hint.className='navigation-hint';hint.textContent='← → Change territory · ↑ ↓ Explore topics · Esc Return to map';$('.exhibit-toolbar').after(hint);
function restore(){const m=location.hash.match(/^#stop-(\d+)$/);if(m)selectStop(Number(m[1]),false);else showLanding(location.hash.slice(1)||'home',false)}addEventListener('popstate',restore);restore();
if(!reduced()){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target)}}),{threshold:.05});$$('.portal-intro,.map-heading,.pillar,.warning,.scroll-chapter').forEach(el=>{el.classList.add('scroll-reveal');observer.observe(el)})}
