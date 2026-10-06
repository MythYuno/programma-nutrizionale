/* Shared navigation and keyboard helpers. */
const navPaths={sett:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 11h16',ric:'M4 3v7a3 3 0 0 0 6 0V3 M7 3v19 M19 3c-4 3-4 9 0 10v9 M19 3v10',prep:'M3 7h18l-2 14H5z M8 8V6a4 4 0 0 1 8 0v2',piano:'M6 4h12v18H6z M9 2h6v4H9z M9 11h6 M9 15h6'};
function refreshDays(){
  const nav=document.getElementById('dayNav');
  const monday=new Date();monday.setDate(monday.getDate()-TODAY);
  nav.replaceChildren();
  PLAN.days.forEach((day,i)=>{
    const date=new Date(monday);date.setDate(monday.getDate()+i);
    const b=document.createElement('button');b.type='button';
    b.className='day-button'+(i===TODAY?' is-today':'');
    b.setAttribute('aria-pressed',i===currentDay);
    b.setAttribute('aria-label',day.full+' '+date.getDate()+(i===TODAY?', oggi':''));
    const name=document.createElement('span');name.textContent=day.name.slice(0,3);
    const number=document.createElement('b');number.textContent=date.getDate();
    b.append(name,number);
    if(i===TODAY){const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');b.append(dot);}
    b.addEventListener('click',()=>renderDay(i));nav.append(b);
  });
}
// Keep keyboard focus in an open substitution dialog.
document.addEventListener('keydown',e=>{
  if(e.key!=='Tab'||sheetBg.hidden)return;
  const nodes=[...sheetBg.querySelectorAll('button,a[href],input,[tabindex="0"]')].filter(n=>!n.disabled&&!n.hidden);
  if(!nodes.length)return;
  const first=nodes[0],last=nodes[nodes.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
seg.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  const tabs=[...seg.children],idx=tabs.indexOf(document.activeElement);if(idx<0)return;
  e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(idx+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  tabs[next].click();tabs[next].focus();
});
document.getElementById('goToday').addEventListener('click',()=>{currentDay=TODAY;currentMeal=null;setSection('sett');window.scrollTo({top:0,behavior:'instant'});});
