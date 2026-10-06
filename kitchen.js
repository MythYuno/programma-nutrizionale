/* Cooking-first experience. The prescribed quantities and stored plan stay intact. */
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const QUICK_LUNCHES=[
 {title:'Pasta caprese, pomodorini e basilico',time:'15 min',active:'8 min attivi',prepTime:'5 min con la base pronta',steps:['Metti a bollire l’acqua. Taglia i 100 g di pomodori e i 100 g di mozzarella; lascia scolare quest’ultima mentre prepari il resto.','Cuoci i 110 g di pasta per il tempo indicato sulla confezione. Mescola pomodori, basilico e i 5 g di olio in una ciotola.','Scola la pasta e uniscila ai pomodori. Aggiungi la mozzarella fuori dal fuoco: deve ammorbidirsi, non diventare gommosa. Finisci con origano e pepe.'],tip:'Dal meal prep: lunedì usa la pasta refrigerata della domenica. Aggiungi mozzarella e pomodori solo al momento. Se prepari sabato, congela la pasta e scongelala in frigo da domenica.'},
 {title:'Orzo al limone, tonno e zucchine',time:'25–35 min',active:'10 min attivi',prepTime:'5 min con la base pronta',steps:['Cuoci i 100 g di orzo secondo la confezione: il tempo indicato qui vale per orzo perlato a cottura rapida. Se usi quello integrale, calcola il tempo riportato sul pacco.','Taglia i 200 g di verdure a cubetti; con le zucchine bastano 8–10 minuti in padella antiaderente, con un goccio d’acqua e il coperchio.','Mescola orzo e verdure con i 50 g di tonno sgocciolato, i 5 g di olio, scorza e succo di limone. Niente sale aggiunto, come previsto dal piano.'],tip:'Con il meal prep congeli solo orzo e verdure. Lunedì sera sposta la porzione in frigo; martedì aggiungi il tonno appena aperto. Mantieni il pranzo refrigerato fino al consumo.'},
 {title:'Farro cremoso con lenticchie e rosmarino',time:'25–35 min',active:'10 min attivi',prepTime:'5–8 min con la base pronta',steps:['Cuoci i 100 g di farro secondo la confezione. Nel frattempo taglia i 150 g di verdure a pezzetti e cuocile in padella coperta con poca acqua.','Sciacqua le lenticchie in scatola nella quantità del piano, 250 g. Schiacciane qualche cucchiaio con una forchetta e poca acqua per creare una crema.','Unisci farro, lenticchie e verdure; scalda con rosmarino e pepe. Completa con i 5 g di olio fuori dal fuoco.'],tip:'Puoi congelare l’intero piatto senza l’olio finale. Martedì sera passalo in frigo; mercoledì scaldalo con un cucchiaio d’acqua, mescolando fino a renderlo fumante anche al centro.'},
 {title:'Riso alla paprika, feta e verdure',time:'20 min',active:'10 min attivi',prepTime:'5–8 min con la base pronta',steps:['Cuoci i 110 g di riso secondo la confezione. Taglia i 100 g di verdure a dadini e cuocile in padella con un goccio d’acqua, fino a quando sono tenere.','Mescola i 5 g di olio con paprika e poche gocce di limone. Sbriciola i 60 g di feta e tienili da parte.','Unisci riso e verdure. Condisci, poi aggiungi la feta fuori dal fuoco. Non aggiungere sale: è già presente nella feta.'],tip:'Per giovedì congela riso e verdure nel weekend, raffreddando e congelando il riso entro un’ora. Scongela in frigo da mercoledì sera, riscalda bene una sola volta e aggiungi feta e olio al momento.'},
 {title:'Pasta e ceci cremosa al rosmarino',time:'15 min',active:'10 min attivi',prepTime:'5–8 min con la base pronta',steps:['Porta a bollore l’acqua per i 100 g di pasta. Sciacqua i 140 g di ceci e schiacciane metà con una forchetta e 2–3 cucchiai d’acqua.','Scalda i 5 g di olio con aglio e rosmarino senza far bruciare l’aglio. Aggiungi ceci interi e crema; allunga con poca acqua di cottura.','Scola la pasta un minuto prima del tempo indicato e finiscila nella crema. Mescola finché il sugo la avvolge; pepe alla fine.'],tip:'Nel weekend prepara e congela pasta e ceci insieme, tenendo l’olio per il giorno del consumo. Scongela in frigo da giovedì sera; scalda con poca acqua fino a rendere fumante tutto il piatto.'},
 {title:'Pasta al pesto, pronta in una pentola',time:'12–15 min',active:'5 min attivi',prepTime:null,steps:['Cuoci i 100 g di pasta previsti dall’opzione pasta del piano. Tieni da parte una tazzina d’acqua di cottura.','Stempera i 40 g di pesto in una ciotola con un cucchiaio dell’acqua della pasta. Non metterlo direttamente sul fuoco.','Unisci pasta e pesto, mescola e completa con i 10 g di grana. Servi i 150 g di frutta a parte.'],tip:'Questo pranzo conviene farlo al momento: devi solo lessare la pasta. Segui l’etichetta del pesto per conservazione e scadenza dopo l’apertura.'},
 {title:'Pasta all’uovo con ragù espresso',time:'20 min',active:'12 min attivi',prepTime:null,steps:['Rosola i 100 g di manzo tritato in padella antiaderente, senza olio aggiuntivo, sgranandolo con un cucchiaio.','Aggiungi passata, aglio e rosmarino come condimenti del piano; fai sobbollire per 10–12 minuti. Il macinato deve essere ben cotto: almeno 71 °C al cuore, verificati con un termometro.','Cuoci i 130 g di pasta all’uovo secondo la confezione e condiscila con il ragù. Completa con i 10 g di grana e servi i 150 g di frutta a parte.'],tip:'Prepara il ragù mentre bolle l’acqua. La pasta all’uovo va cotta al momento, così non perde consistenza.'}
];
const QUICK_DINNERS=[
 {title:'Bocconcini di pollo alla paprika',time:'20 min',active:'12 min attivi',steps:['Taglia i 250 g di pollo in bocconcini uniformi. Condisci con paprika, limone e metà dei 10 g di olio.','Cuoci in padella antiaderente, girando i pezzi. Il tempo dipende dalla dimensione: verifica 74 °C al cuore, non solo il colore.','Cuoci i 150 g di verdure in una seconda padella con poca acqua. Completa con il resto dell’olio e servi con i 100 g di pane.'],tip:'Tagliare il pollo a bocconcini evita i tempi lunghi di un pezzo intero. Lava utensili e piano di lavoro dopo il contatto con il pollo crudo.'},
 {title:'Frittata morbida alle erbe e insalata',time:'12–15 min',active:'8 min attivi',steps:['Sbatti le 3 uova (150 g) con pepe ed erbe aromatiche. Scalda una padella piccola con metà dei 10 g di olio.','Versa le uova, abbassa il fuoco e copri. Gira con un piatto se necessario e termina la cottura: l’uovo deve essere rappreso anche al centro.','Condisci i 150 g di verdure crude con il resto dell’olio e limone. Servi con i 130 g di pane.'],tip:'Tieni l’insalata separata fino al momento di mangiare. Una padella piccola fa una frittata più spessa e facile da girare.'},
 {title:'Straccetti di manzo al rosmarino',time:'15 min',active:'12 min attivi',steps:['Asciuga i 220 g di manzo e tagliali a strisce regolari. Prepara i 150 g di verdure: crude oppure tagliate sottili per una cottura rapida.','Scalda bene la padella e cuoci la carne con parte dei 10 g di olio, senza ammassarla. Per tagli interi raggiungi almeno 63 °C e lascia riposare 3 minuti.','Condisci le verdure con l’olio rimasto. Servi con i 130 g di pane e i 150 g di frutta.'],tip:'Usa due piccole tornate se la padella è stretta: la carne rosola meglio e non rilascia tutta l’acqua insieme.'},
 {title:'Merluzzo al limone con cous cous',time:'20 min',active:'10 min attivi',steps:['Metti i 300 g di merluzzo già scongelato in padella con limone, aglio e poca acqua. Copri e cuoci: verifica almeno 63 °C al cuore. I tempi aumentano con filetti spessi.','Copri i 100 g di cous cous con l’acqua bollente nella proporzione indicata sulla confezione. Lascia riposare e sgrana con una forchetta.','Cuoci i 150 g di verdure a pezzetti. Dividi i 10 g di olio tra cous cous, pesce e verdure; completa con prezzemolo.'],tip:'Sposta il pesce dal freezer al frigo la sera prima. I 20 minuti si riferiscono a filetti scongelati, non ancora congelati.'},
 {title:'Salmone e patate in teglia',time:'35–40 min',active:'10 min attivi',steps:['Scalda il forno a 200 °C. Taglia i 400 g di patate a cubetti piccoli e uniformi; condisci con parte dei 10 g di olio e inforna per circa 20 minuti.','Aggiungi i 140 g di salmone e i 150 g di verdure tagliate sottili. Continua per circa 12–15 minuti: patate tenere e pesce ad almeno 63 °C al cuore.','Completa con limone e l’olio rimasto. Servi i 150 g di frutta a parte.'],tip:'È una cena con poca preparazione, ma richiede tempo in forno: avviala prima di fare altro. Non è una ricetta da 10 minuti totali.'},
 {title:'Pollo al limone e insalata croccante',time:'18–20 min',active:'12 min attivi',steps:['Taglia i 250 g di petto di pollo a fettine sottili. Scalda una padella antiaderente con metà dei 10 g di olio.','Cuoci le fettine con scorza di limone e paprika, girandole; verifica 74 °C al cuore. Se il fondo asciuga, aggiungi poca acqua.','Condisci i 150 g di verdure crude con l’olio rimasto. Servi insieme ai 120 g di pane.'],tip:'Fettine di spessore uniforme cuociono in modo più regolare. Non aggiungere panatura o altro olio per questa versione.'},
 {title:'Uova strapazzate e verdure in padella',time:'15 min',active:'10 min attivi',steps:['Taglia i 200 g di verdure a pezzetti piccoli e cuocile in padella con poca acqua e il coperchio.','Sbatti le 3 uova (150 g). Scalda parte dei 10 g di olio in un’altra padella, versa le uova e mescola dolcemente finché sono completamente rapprese.','Dividi l’olio rimasto tra verdure e uova, aggiungi pepe e servi con i 70 g di pane integrale.'],tip:'Inizia dalle verdure: mentre finiscono di cuocere puoi preparare le uova, che richiedono pochi minuti.'}
];

Object.assign(QUICK_LUNCHES[0],{time:'15 min + raffreddamento',active:'8 min attivi',prepTime:'3–5 min con la base fredda',steps:['Cuoci i 110 g di pasta al dente. Taglia i 100 g di pomodori e scola i 100 g di mozzarella.','Per portarla via: distribuisci la pasta in un contenitore basso, raffredda e riponi in frigo entro 1–2 ore. Mantieni pomodori e mozzarella separati fino al mattino.','Unisci alla pasta fredda pomodori, mozzarella, basilico e i 5 g di olio. Mescola e richiudi: resta refrigerata fino a pranzo.'],tip:'Domenica prepara solo la pasta. Se cucini sabato, scegli il pomeriggio e consuma lunedì entro 48 ore dalla cottura; altrimenti cuocila domenica.'});
Object.assign(QUICK_LUNCHES[1],{time:'25–35 min + raffreddamento',prepTime:'3–5 min con la base fredda',steps:['Cuoci i 100 g di orzo secondo la confezione. Taglia i 200 g di verdure: con le zucchine a dadini bastano circa 8–10 minuti in padella coperta con poca acqua.','Distribuisci orzo e verdure in un contenitore basso. Raffredda e metti in frigo entro 1–2 ore; usa la base entro 48 ore dalla cottura.','Al mattino aggiungi i 50 g di tonno appena aperto e sgocciolato, i 5 g di olio, limone e pepe. Niente sale aggiunto. Mantieni refrigerato fino al pranzo.'],tip:'Prepara la base domenica pomeriggio per martedì, solo se la consumi entro 48 ore. Se fai meal prep sabato, prepara orzo e verdure lunedì sera: non occupano altro freezer.'});
Object.assign(QUICK_LUNCHES[2],{title:'Insalata di farro, lenticchie e verdure',time:'25–35 min + raffreddamento',prepTime:'3–5 min con la base scongelata',steps:['Cuoci i 100 g di farro secondo la confezione e i 150 g di verdure a dadini. Distribuisci in un contenitore basso, raffredda e riponi al freddo entro 1–2 ore.','Per il meal prep congela soltanto farro e verdure. Scongela completamente in frigo da martedì sera, senza lasciare il sacchetto sul piano.','Mercoledì apri le lenticchie in scatola, sciacquale e usa i 250 g del piano. Uniscile alla base fredda con i 5 g di olio, limone e prezzemolo. Tieni refrigerato e consuma entro 24 ore dal completo scongelamento.'],tip:'Una base compatta in freezer; le lenticchie si aggiungono il giorno stesso. Se non entra, cuoci farro e verdure martedì sera e mettili in frigo.'});
Object.assign(QUICK_LUNCHES[3],{title:'Riso freddo con feta e verdure alla paprika',time:'20 min + raffreddamento',prepTime:'3–5 min con la base del mercoledì',steps:['Mercoledì sera cuoci i 110 g di riso secondo la confezione e i 100 g di verdure a dadini.','Trasferisci in un contenitore basso e raffredda rapidamente, anche con un bagno esterno di acqua fredda. Metti il riso in frigo entro 1 ora dalla cottura.','Giovedì aggiungi i 60 g di feta, i 5 g di olio, paprika e limone. Non aggiungere sale. Mantieni refrigerato e mangia freddo entro 24 ore dalla cottura.'],tip:'Questa è la piccola preparazione di metà settimana: il riso non si prepara nel weekend e non occupa spazio in freezer.'});
Object.assign(QUICK_LUNCHES[4],{title:'Pasta fredda con ceci, limone e rosmarino',time:'15 min + raffreddamento',prepTime:'3–5 min con la pasta scongelata',steps:['Cuoci i 100 g di pasta al dente, distribuiscila in un contenitore basso e raffredda. Per venerdì, congela la base entro 1–2 ore dalla cottura.','Giovedì sera trasferiscila in frigo fino al completo scongelamento. Venerdì apri i ceci in scatola e usa i 140 g del piano, sciacquati.','Mescola i 5 g di olio con limone, pepe e poco rosmarino tritato. Unisci pasta e ceci e condisci. Mantieni refrigerato fino al pranzo e consuma entro 24 ore dal completo scongelamento.'],tip:'La pasta fredda deve restare al dente: non congelarla troppo cotta. Se non hai spazio in freezer, lessala giovedì sera e conservala in frigo per venerdì.'});

function matchesPlan(i,kind){return JSON.stringify(PLAN.days[i][kind].ing)===JSON.stringify(DEFAULT_PLAN.days[i][kind].ing);}
function kitchenMeal(i,kind){
  const meal=PLAN.days[i][kind],recipe=kind==='pranzo'?QUICK_LUNCHES[i]:QUICK_DINNERS[i];
  return Object.assign({},meal,matchesPlan(i,kind)?recipe:{},{kick:kind==='pranzo'?'Pranzo':'Cena'});
}
function mealCard(i,kind,idx){
  const m=kitchenMeal(i,kind);
  let html=renderMeal(m,idx,kind==='pranzo'?'var(--c3)':'var(--c5)',null);
  html=html.replace('<details class="prep-steps">','<details class="prep-steps" open>');
  if(m.active)html=html.replace('<ul class="ing">','<div class="recipe-meta">'+m.active+(m.prepTime?' <span>· '+m.prepTime+'</span>':'')+'</div><ul class="ing">');
  return html;
}

// No meal logging, progress score, compensation or outside-food catalogue in this UI.
renderRecap=function(){document.getElementById('recap').replaceChildren();};
paintGrid=function(){};
const kitchenIcons={sett:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 11h16',ric:navPaths.ric,prep:'M3 9h18v12H3z M5 9V5h14v4 M8 13v4 M16 13v4',shop:navPaths.prep,piano:navPaths.piano};
SEZIONI.splice(0,SEZIONI.length,['sett','Oggi'],['ric','Ricette'],['prep','Meal prep'],['shop','Spesa'],['piano','Piano']);
buildRail=function(){
  seg.replaceChildren();
  SEZIONI.forEach(([id,label])=>{
    const b=document.createElement('button');b.type='button';b.dataset.s=id;b.setAttribute('role','tab');b.setAttribute('aria-controls','content');b.setAttribute('aria-selected',id===currentSection);
    b.innerHTML='<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+kitchenIcons[id]+'"/></svg><span>'+label+'</span>';
    b.onclick=()=>{setSection(id);window.scrollTo({top:0,behavior:'instant'});};seg.append(b);
  });
};
function dayAside(){
  refreshDays();
  let info=document.getElementById('kitchenAside');
  if(!info){info=document.createElement('div');info.id='kitchenAside';document.getElementById('dayNav').after(info);}
  info.innerHTML='<p class="aside-label">IN CUCINA</p><button class="aside-meal" data-jump="lunch"><span>PRANZO</span><b>'+escapeHtml(kitchenMeal(currentDay,'pranzo').title)+'</b><small>'+escapeHtml(kitchenMeal(currentDay,'pranzo').time||'Vedi ricetta')+' ↗</small></button><button class="aside-meal" data-jump="dinner"><span>CENA</span><b>'+escapeHtml(kitchenMeal(currentDay,'cena').title)+'</b><small>'+escapeHtml(kitchenMeal(currentDay,'cena').time||'Vedi ricetta')+' ↗</small></button><button class="prep-link" type="button">Meal prep della settimana <span>→</span></button>';
  info.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.jump)?.scrollIntoView({behavior:'instant',block:'start'}));
  info.querySelector('.prep-link').onclick=()=>setSection('prep');
}
renderDay=function(i){
  currentDay=i;currentMeal=null;heroDay.textContent=PLAN.days[i].full;
  document.getElementById('heroSubtitle').textContent='Due ricette, dosi chiare. Il resto è già organizzato.';
  CURRENT_SEQ=[kitchenMeal(i,'pranzo'),kitchenMeal(i,'cena'),PLAN.colazione,PLAN.spMattino,PLAN.spPomeriggio];
  content.innerHTML='<div class="content-heading"><h2>'+escapeHtml(PLAN.days[i].full)+' a tavola</h2><span>Per 1 persona</span></div><section id="lunch">'+mealCard(i,'pranzo',0)+'</section><section id="dinner">'+mealCard(i,'cena',1)+'</section><details class="daily-basics"><summary>Colazione e spuntini <span>Uguali ogni giorno</span></summary>'+CURRENT_SEQ.slice(2).map((m,j)=>renderMeal(m,j+2,'var(--ink-2)',null)).join('')+'</details>';
  dayAside();fade();
};
renderPasto=function(i){renderDay(i);};
const recipeState={kind:'pranzo',query:''};
renderRicette=function(){
  heroDay.textContent='Ricette';
  document.getElementById('heroSubtitle').textContent='14 ricette per la tua settimana. Tempi reali, passaggi concreti.';
  CURRENT_SEQ=PLAN.days.map((_,i)=>kitchenMeal(i,recipeState.kind));
  content.innerHTML='<div class="recipe-tools"><div class="choice" aria-label="Tipo di ricetta"><button type="button" data-kind="pranzo" aria-pressed="'+(recipeState.kind==='pranzo')+'">Pranzi <span>7</span></button><button type="button" data-kind="cena" aria-pressed="'+(recipeState.kind==='cena')+'">Cene <span>7</span></button></div><label class="search-box">Cerca una ricetta o un ingrediente<input type="search" placeholder="Es. ceci, pollo, pasta" value="'+escapeHtml(recipeState.query)+'"></label></div><p class="search-results" role="status" id="recipeCount"></p>'+PLAN.days.map((day,i)=>'<section class="recipe-result" data-recipe="'+i+'"><div class="recipe-day">'+escapeHtml(day.full)+'</div>'+mealCard(i,recipeState.kind,i)+'</section>').join('');
  content.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{recipeState.kind=b.dataset.kind;renderRicette();});
  const input=content.querySelector('input[type=search]');
  const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  function filter(){recipeState.query=input.value;let n=0;content.querySelectorAll('[data-recipe]').forEach(el=>{const r=CURRENT_SEQ[+el.dataset.recipe];el.hidden=!normalize(r.title+' '+r.ing.flat().join(' ')).includes(normalize(input.value.trim()));if(!el.hidden)n++;});document.getElementById('recipeCount').textContent=n?n+(n===1?' ricetta':' ricette'):'Nessuna ricetta trovata. Prova un altro ingrediente.';}
  input.oninput=filter;filter();fade();
};

let prepDay='dom';
try{prepDay=localStorage.getItem('piano11-prep-day')==='sab'?'sab':'dom';}catch(e){}
const PREP_SOURCES='<a href="https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely" target="_blank" rel="noopener">FSA · conservazione</a><a href="https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker#rice" target="_blank" rel="noopener">FSA · riso</a><a href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety" target="_blank" rel="noopener">USDA · conservazione</a>';
function storageGuide(){return '<details class="storage-guide"><summary>Conservazione <span>Temperature e tempi</span></summary><div class="storage-grid"><div><h3>Raffredda e metti al freddo</h3><p>Usa contenitori bassi e riponi le basi entro 1–2 ore. Per il riso raffredda e metti in frigo entro 1 ora; consumalo entro 24 ore dalla cottura.</p></div><div><h3>Conta le ore, non solo i giorni</h3><p>Frigo a 0–5 °C: per queste basi usa un limite di 48 ore. Se lo superi, cucina più tardi. Il riso ha il limite più breve indicato sopra. Rispetta anche scadenze e indicazioni in etichetta.</p></div><div><h3>Due basi, poco freezer</h3><p>Congela farro con verdure e pasta a circa −18 °C, in confezioni alimentari sottili e chiuse. Scongela completamente in frigo dalla sera prima, mai sul piano. Consuma entro 24 ore dal completo scongelamento.</p></div><div><h3>Freddo fino a pranzo</h3><p>Usa una borsa termica con ghiaccio e metti il contenitore in frigo se disponibile. Si mangia freddo solo se cottura, raffreddamento e conservazione sono corretti. Senza un modo per mantenerlo refrigerato, questo programma non è adatto.</p></div></div><p class="storage-footnote">Le verdure surgelate vanno cotte secondo la confezione prima di usarle in insalata. Il riso del giovedì si prepara mercoledì sera: non resta cotto in frigo dal weekend.</p><div class="source-links">'+PREP_SOURCES+'</div></details>';}
renderPrep=function(){
  heroDay.textContent='Meal prep';
  if(![0,1,2,3,4].every(i=>matchesPlan(i,'pranzo'))){
    content.innerHTML='<div class="card"><h2>Piano modificato</h2><p class="liberi">Le dosi sono cambiate. Il meal prep va adattato al piano salvato.</p></div>'+storageGuide();return;
  }
  const sat=prepDay==='sab',day=sat?'sabato':'domenica';
  const portions=[
    {label:'LUNEDÌ',food:'Pasta',qty:'110 g',where:'fridge'},
    ...(!sat?[{label:'MARTEDÌ',food:'Orzo + verdure',qty:'100 g + 200 g',where:'fridge'}]:[]),
    {label:'MERCOLEDÌ',food:'Farro + verdure',qty:'100 g + 150 g',where:'freezer'},
    {label:'VENERDÌ',food:'Pasta',qty:'100 g',where:'freezer'}
  ];
  const mornings=[
    ['Lunedì','Prendi la pasta dal frigo.','Aggiungi mozzarella 100 g + pomodori 100 g + olio 5 g.'],
    ['Martedì','Prendi orzo e verdure dal frigo.','Aggiungi tonno sgocciolato 50 g + olio 5 g.'],
    ['Mercoledì','Prendi farro e verdure, scongelati in frigo.','Aggiungi lenticchie in scatola 250 g + olio 5 g.'],
    ['Giovedì','Prendi riso e verdure dal frigo.','Aggiungi feta 60 g + olio 5 g.'],
    ['Venerdì','Prendi la pasta, scongelata in frigo.','Aggiungi ceci in scatola 140 g + olio 5 g.']
  ];
  const evenings=[
    ...(sat?[['Lunedì sera','CUOCI','Orzo 100 g + verdure 200 g.','Raffredda e metti in frigo per martedì.']]:[]),
    ['Martedì sera','SPOSTA','Farro + verdure: dal freezer al frigo.','Lascia scongelare completamente per mercoledì.'],
    ['Mercoledì sera','CUOCI','Riso 110 g + verdure 100 g.','Raffredda il riso e mettilo in frigo entro 1 ora. Mangialo giovedì entro 24 ore dalla cottura.'],
    ['Giovedì sera','SPOSTA','Pasta di venerdì: dal freezer al frigo.','Lascia scongelare completamente per venerdì.']
  ];
  const sectionHead=(n,title,note)=>'<div class="prep-step-title"><span>'+n+'</span><div><h2>'+title+'</h2>'+(note?'<p>'+note+'</p>':'')+'</div></div>';
  content.innerHTML=`
    <div class="prep-toolbar"><div class="prep-day-picker"><span>Cucino nel weekend:</span><div class="choice"><button type="button" data-prep-day="sab" aria-pressed="${sat}">Sabato</button><button type="button" data-prep-day="dom" aria-pressed="${!sat}">Domenica</button></div></div><button type="button" class="btn" id="copyPrep">Copia istruzioni</button></div>
    <p id="prepCopyStatus" role="status" class="search-results"></p>
    <p class="simple-prep-intro" role="status">Per 1 persona. Pranzi freddi. <b>Solo 2 porzioni in freezer.</b></p>
    <div class="prep-day-note">${sat?'Se scegli sabato, prepari l’orzo lunedì sera.':'Se scegli domenica, prepari anche l’orzo per martedì.'} Il riso si cucina sempre mercoledì sera.</div>

    <section class="prep-step">
      ${sectionHead('1','Nel weekend: cuoci queste porzioni','Pesa tutto prima di cuocere. Tieni separate le porzioni.')}
      <div class="cook-portions">${portions.map(p=>`<div class="cook-portion"><span>${p.label}</span><strong>${p.food}</strong><b>${p.qty}</b></div>`).join('')}</div>
      <ol class="simple-cook-steps">
        <li><b>Pasta:</b> pesa 110 g per lunedì e 100 g per venerdì. Cuoci le due porzioni separatamente, al dente.</li>
        <li><b>Farro${sat?'':' e orzo'}:</b> cuoci secondo la confezione${sat?'':', in pentole separate'}.</li>
        <li><b>Verdure:</b> taglia a cubetti. Cuoci in padella coperta con poca acqua, finché sono tenere. Tieni separati i 150 g per mercoledì${sat?'.':' e i 200 g per martedì.'}</li>
      </ol>
      <p class="prep-small">Non aggiungere ora olio, formaggi, tonno o legumi. Li metti al mattino. Per i legumi usa il criterio di peso del tuo piano.</p>
    </section>

    <section class="prep-step">
      ${sectionHead('2','Dividi e metti via','Scrivi il giorno del pranzo e la data di cottura su ogni contenitore.')}
      <div class="storage-lanes">
        <div class="storage-lane"><h3><span aria-hidden="true">▤</span> FRIGO <small>0–5 °C</small></h3>${portions.filter(p=>p.where==='fridge').map(p=>`<div class="storage-portion"><b>${p.label}</b><span>${p.food}</span></div>`).join('')}<p>Consuma entro 48 ore dalla cottura.${sat?' Per lunedì, cucina sabato pomeriggio; se superi le 48 ore, cuoci la pasta domenica.':' Per martedì, cucina domenica pomeriggio; se superi le 48 ore, cuoci l’orzo lunedì sera.'}</p></div>
        <div class="storage-lane frozen"><h3><span aria-hidden="true">❄</span> FREEZER <small>−18 °C</small></h3>${portions.filter(p=>p.where==='freezer').map(p=>`<div class="storage-portion"><b>${p.label}</b><span>${p.food}</span></div>`).join('')}<p>Due sacchetti alimentari piatti o contenitori bassi. Dentro solo queste basi: niente formaggi o legumi.</p></div>
      </div>
      <div class="prep-rule"><b>Appena finisci di cuocere:</b> distribuisci in contenitori bassi, fai raffreddare rapidamente e riponi in frigo o freezer entro 1–2 ore. Non lasciare la pentola sul piano per tutto il pomeriggio.</div>
    </section>

    <section class="prep-step">
      ${sectionHead('3','Durante la settimana','La sera prepara la base. Al mattino aggiungi gli altri ingredienti.')}
      <h3 class="schedule-heading">LA SERA</h3>
      <div class="evening-tasks">${evenings.map(e=>`<div class="evening-task"><div><b>${e[0]}</b><span class="action-tag ${e[1]==='CUOCI'?'cook':''}">${e[1]}</span></div><p>${e[2]}</p><small>${e[3]}</small></div>`).join('')}</div>
      <h3 class="schedule-heading">AL MATTINO · 3–5 MINUTI</h3>
      <div class="morning-tasks">${mornings.map(m=>`<div class="morning-task"><b>${m[0]}</b><div><span>${m[1]}</span><p>${m[2]}</p></div></div>`).join('')}</div>
      <div class="prep-rule"><b>Porta via il pranzo freddo:</b> borsa termica con ghiaccio, poi frigo se disponibile. Mantienilo refrigerato fino a pranzo. Consuma le basi scongelate entro 24 ore dal completo scongelamento.</div>
    </section>
    <div class="prep-bottom"><button class="btn" type="button" id="prepShopping">Apri la lista della spesa</button><details><summary>Se non entrano le due porzioni in freezer</summary><p>Cuoci farro e verdure martedì sera; cuoci la pasta di venerdì giovedì sera. Raffredda e metti in frigo. Non conservarli in frigo dal weekend.</p></details></div>
    ${storageGuide()}`;
  content.querySelectorAll('[data-prep-day]').forEach(b=>b.onclick=()=>{prepDay=b.dataset.prepDay;try{localStorage.setItem('piano11-prep-day',prepDay);}catch(e){}renderPrep();});
  document.getElementById('prepShopping').onclick=()=>setSection('shop');
  document.getElementById('copyPrep').onclick=async()=>{
    const status=document.getElementById('prepCopyStatus');status.textContent='Copia in corso…';
    const text='MEAL PREP DI '+day.toUpperCase()+' · 1 persona · pranzi freddi\n\n1. CUOCI NEL WEEKEND (pesi prima della cottura)\n'+portions.map(p=>p.label+': '+p.food+' '+p.qty+' → '+(p.where==='fridge'?'FRIGO':'FREEZER')).join('\n')+'\nCuoci le due porzioni di pasta separatamente. Farro e orzo: tempi della confezione. Verdure: a cubetti, in padella coperta con poca acqua.\n\n2. RIPONI\nRaffredda rapidamente in contenitori bassi. Al freddo entro 1–2 ore. Frigo 0–5 °C: consuma entro 48 ore. Freezer −18 °C: soltanto farro con verdure e pasta di venerdì.\n\n3. LA SERA\n'+evenings.map(e=>e[0]+': '+e[2]+' '+e[3]).join('\n')+'\n\nAL MATTINO\n'+mornings.map(m=>m[0]+': '+m[1]+' '+m[2]).join('\n')+'\n\nBorsa termica con ghiaccio: mantieni refrigerato fino al pranzo. Scongela completamente in frigo e consuma entro 24 ore. '+(sat?'Pasta di lunedì: cuoci sabato pomeriggio, oppure domenica se superi 48 ore.':'Orzo di martedì: cuoci domenica pomeriggio, oppure lunedì sera se superi 48 ore.');
    const ok=await copiaTesto(text);if(status.isConnected)status.textContent=ok?'Istruzioni copiate.':'Copia non riuscita.';
  };fade();
};

function renderShopping(){
  heroDay.textContent='Spesa';document.getElementById('heroSubtitle').textContent='Tutto il piano, in una lista. Le spunte qui servono solo per gli acquisti.';
  const cats=buildSpesa(),checked=loadChecked();
  content.innerHTML='<div class="content-heading"><h2>Una settimana · una persona</h2><span>Quantità di acquisto arrotondate</span></div><div class="shop-actions"><button class="btn primary" id="copyShopping">Copia ciò che manca</button><button class="btn" id="resetShopping">Azzera le spunte</button><span id="shopStatus" role="status"></span></div><div class="shopping-grid">'+Object.entries(cats).filter(([,items])=>items.length).map(([cat,items])=>'<section class="card"><h2>'+escapeHtml(cat)+'</h2><ul class="shop">'+items.map(it=>'<li class="'+(checked.has(it.nome)?'on':'')+'" role="checkbox" tabindex="0" aria-checked="'+checked.has(it.nome)+'" data-ing="'+escapeHtml(it.nome)+'"><span class="box" aria-hidden="true"></span><span class="sname">'+escapeHtml(it.nome)+'</span><span class="sqty">'+fmtGrams(roundPractical(it.qty))+'</span></li>').join('')+'</ul></section>').join('')+'</div><p class="liberi">La lista comprende colazioni, spuntini, pranzi e cene del piano salvato. Le quantità sono arrotondate per comprare; per cucinare usa le dosi esatte delle ricette. Spezie e condimenti senza quantità non sono conteggiati.</p>';
  const update=()=>{document.getElementById('shopStatus').textContent=content.querySelectorAll('.shop li.on').length+' di '+content.querySelectorAll('.shop li').length+' acquistati';};
  content.querySelectorAll('.shop li').forEach(li=>{li.onclick=()=>{const set=loadChecked(),on=!li.classList.contains('on');li.classList.toggle('on',on);li.setAttribute('aria-checked',on);on?set.add(li.dataset.ing):set.delete(li.dataset.ing);saveChecked(set);update();};li.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();li.click();}};});
  document.getElementById('resetShopping').onclick=()=>{saveChecked(new Set());renderShopping();};
  document.getElementById('copyShopping').onclick=async()=>{const rows=[...content.querySelectorAll('.shop li:not(.on)')];document.getElementById('shopStatus').textContent=rows.length?(await copiaTesto('Spesa settimanale\n'+rows.map(li=>li.querySelector('.sname').textContent+' — '+li.querySelector('.sqty').textContent).join('\n'))?'Lista copiata.':'Copia non riuscita.'):'Hai già acquistato tutto.';};update();fade();
}
setSection=function(s){
  currentSection=s;gridWrap.hidden=s!=='sett';
  seg.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-selected',b.dataset.s===s);b.tabIndex=b.dataset.s===s?0:-1;});
  document.body.dataset.section=s;
  if(s==='sett')renderDay(currentDay);else if(s==='ric')renderRicette();else if(s==='prep')renderPrep();else if(s==='shop')renderShopping();else{renderPiano();document.getElementById('heroSubtitle').textContent='Gestisci e salva il piano del tuo nutrizionista.';}
};
document.querySelector('.week-details').hidden=true;
document.querySelector('.side-note').hidden=true;
document.getElementById('recap').replaceChildren();
document.querySelector('footer').innerHTML='<div class="footer-brand">Programma nutrizionale</div><p>Ingredienti e quantità dal piano del Dott. Salvatore Occhino. Le calorie mostrate sono stime, non obiettivi da registrare.</p>';
buildRail();setSection('sett');
