
const KEY='vmc_agents_v11'; let agents=[]; let filter='TOUS'; let editingId=null;
const today=()=>{let d=new Date(); d.setHours(0,0,0,0); return d};
function parseDate(s){ if(!s) return null; let d=new Date(s); if(isNaN(d)){let m=String(s).match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/); if(m) d=new Date((m[3].length==2?'20':'')+m[3],m[2]-1,m[1]);} return isNaN(d)?null:d; }
function fmt(s){let d=parseDate(s); return d?d.toLocaleDateString('fr-FR'):''}
function daysLeft(a){let d=parseDate(a.prochaineVisite); if(!d) return 99999; return Math.ceil((d-today())/86400000)}
function status(a){ if(String(a.inaptitude||'').toLowerCase()==='oui') return {code:'INAPTE',label:'Inapte',cls:'black',prio:1}; let dl=daysLeft(a); if(dl===99999) return {code:'INCONNU',label:'À vérifier',cls:'bluePill',prio:4}; if(dl<0) return {code:'EXPIRE',label:'Expiré',cls:'late',prio:2}; if(dl<=30) return {code:'BIENTOT',label:'Expire bientôt',cls:'soon',prio:3}; return {code:'AJOUR',label:'À jour',cls:'ok',prio:5}; }
function toast(t){let el=document.getElementById('toast'); el.textContent=t; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'),2500)}
function saveLocal(){localStorage.setItem(KEY, JSON.stringify(agents));}
async function init(){ if(location.search.includes('reset=1')) localStorage.removeItem(KEY); let local=localStorage.getItem(KEY); if(local) agents=JSON.parse(local); else { try{let r=await fetch('agents.json?v=8',{cache:'no-store'}); agents=await r.json();}catch(e){agents=JSON.parse(document.getElementById('defaultAgents').textContent)} saveLocal(); } renderAll(); if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(()=>{}); }
function renderAll(){ renderKPIs(); renderPriorities(); renderAgents(); renderAlerts(); renderInaptitudes(); renderExportPreview(); }
function renderKPIs(){let total=agents.length, spv=agents.filter(a=>a.statut==='SPV').length, spp=agents.filter(a=>a.statut==='SPP').length; let counts={AJOUR:0,BIENTOT:0,EXPIRE:0,INAPTE:0,RESTR:0,BILAN:0}; agents.forEach(a=>{counts[status(a).code]=(counts[status(a).code]||0)+1; if(hasRestriction(a)) counts.RESTR++; if(a.bilanAFaire) counts.BILAN++;}); let data=[['Total',total,'Toutes fiches'],['À jour',counts.AJOUR,'Valide'],['Bientôt',counts.BIENTOT,'≤ 30 jours'],['Expirés',counts.EXPIRE,'Non à jour'],['Inaptes',counts.INAPTE,'À suivre'],['Restrictions',counts.RESTR,'Opérationnel'],['SPV / SPP',spv+' / '+spp,'Effectifs']]; kpis.innerHTML=data.map(x=>`<div class="card kpi"><span>${x[0]}</span><b>${x[1]}</b><span>${x[2]}</span></div>`).join(''); }
function hasRestriction(a){return (a.restriction&&a.restriction.toLowerCase()!=='aucune') || (a.restrictionOperationnelle&&a.restrictionOperationnelle.toLowerCase()!=='non');}
function alphaAgents(list=agents){return [...list].sort((a,b)=>(a.nom||'').localeCompare((b.nom||''),'fr',{sensitivity:'base'}) || (a.prenom||'').localeCompare((b.prenom||''),'fr',{sensitivity:'base'}));}
function sortedAgents(){return [...agents].sort((a,b)=>status(a).prio-status(b).prio || daysLeft(a)-daysLeft(b) || (a.nom||'').localeCompare((b.nom||''),'fr',{sensitivity:'base'}) || (a.prenom||'').localeCompare((b.prenom||''),'fr',{sensitivity:'base'}));}
function renderPriorities(){let list=sortedAgents().filter(a=>status(a).prio<=3 || a.bilanAFaire || a.previsite).slice(0,8); priorityList.innerHTML=list.length?list.map(card).join(''):'<p class="sub">Aucune priorité critique.</p>';}
function setFilter(f){filter=f; renderAgents();}
function renderAgents(){let q=(document.getElementById('q')?.value||'').toLowerCase(); let list=alphaAgents().filter(a=>{let s=status(a); let txt=[a.nom,a.prenom,a.statut,a.matricule,a.aptitude,a.cis].join(' ').toLowerCase(); let ok=!q || txt.includes(q); if(filter==='SPV') ok=ok&&a.statut==='SPV'; if(filter==='SPP') ok=ok&&a.statut==='SPP'; if(filter==='EXPIRE') ok=ok&&s.code==='EXPIRE'; if(filter==='BIENTOT') ok=ok&&s.code==='BIENTOT'; if(filter==='INAPTE') ok=ok&&s.code==='INAPTE'; return ok;}); agentRows.innerHTML=list.map(card).join('') || '<div class="card">Aucune fiche trouvée.</div>';}
function card(a){let s=status(a), box=s.code==='INAPTE'?'inapteBox':s.code==='EXPIRE'?'dangerBox':s.code==='BIENTOT'?'warn':'okBox'; return `<div class="card agentCard ${box}" onclick="openAgent(${a.id})"><div class="row space"><div class="name">${a.nom} ${a.prenom}</div><span class="pill ${s.cls}">${s.label}</span></div><div class="row"><span class="pill bluePill">${a.statut||''}</span>${hasRestriction(a)?'<span class="pill purplePill">Restriction</span>':''}${a.bilanAFaire?'<span class="pill soon">Bilan</span>':''}</div><p class="sub">Prochaine visite : <b>${fmt(a.prochaineVisite)||'non renseignée'}</b> ${daysLeft(a)!==99999?'('+daysLeft(a)+' j)':''}</p><p class="sub">${a.aptitude||''} ${a.typeInaptitude?'— '+a.typeInaptitude:''}</p></div>`}
function renderAlerts(){let groups={'Inaptitudes':[], 'Visites expirées':[], 'Expire bientôt':[], 'Bilans à faire':[], 'Pré-visites':[]}; sortedAgents().forEach(a=>{let s=status(a); if(s.code==='INAPTE') groups['Inaptitudes'].push(a); if(s.code==='EXPIRE') groups['Visites expirées'].push(a); if(s.code==='BIENTOT') groups['Expire bientôt'].push(a); if(a.bilanAFaire) groups['Bilans à faire'].push(a); if(a.previsite) groups['Pré-visites'].push(a);}); alertsFull.innerHTML=Object.entries(groups).map(([g,l])=>`<div class="card"><h3>${g} <span class="pill bluePill">${l.length}</span></h3>${l.length?l.map(card).join(''):'<p class="sub">Aucun agent.</p>'}</div>`).join('');}
function renderInaptitudes(){let list=sortedAgents().filter(a=>status(a).code==='INAPTE'||hasRestriction(a)); inaptitudeList.innerHTML=list.length?list.map(a=>`<div class="card ${status(a).code==='INAPTE'?'inapteBox':'warn'}"><div class="row space"><b>${a.nom} ${a.prenom}</b><button class="btn small" onclick="openAgent(${a.id})">Ouvrir</button></div><p>Inaptitude : <b>${a.inaptitude||'Non'}</b> ${a.typeInaptitude||''}</p><p>Restriction : <b>${a.restriction||a.restrictionOperationnelle||'Aucune'}</b></p><p class="sub">Début : ${fmt(a.dateDebutInaptitude)||'-'} — Fin/révision : ${fmt(a.dateFinInaptitude)||'-'}</p></div>`).join(''):'<div class="card">Aucune inaptitude ou restriction enregistrée.</div>';}
const fields=[['nom','Nom'],['prenom','Prénom'],['matricule','Matricule'],['statut','SPV / SPP','select',['SPV','SPP']],['grade','Grade'],['cis','CIS'],['derniereVisite','Dernière visite','date'],['prochaineVisite','Prochaine visite / validité','date'],['aptitude','Avis médical','select',['Apte sans restriction','Apte avec restrictions','Inapte temporaire','Inapte définitif','Inapte partiel','NON A JOUR','En attente']],['inaptitude','Inaptitude','select',['Non','Oui']],['typeInaptitude','Type inaptitude / restriction','select',['','Temporaire','Définitive','Partielle','SHR non opérationnel','Activité sportive interdite','Conduite interdite','Port de charge interdit','Feu interdit','Autre restriction']],['dateDebutInaptitude','Début inaptitude','date'],['dateFinInaptitude','Fin / date de révision','date'],['restriction','Restriction'],['restrictionOperationnelle','Restriction opérationnelle'],['activitesSportives','Activités sportives'],['bilanAFaire','Bilan à faire','checkbox'],['previsite','Pré-visite à programmer','checkbox'],['document','Document PDF'],['observations','Observations','textarea']];
function openAgent(id){editingId=id; let a=id?agents.find(x=>x.id===id):{id:Date.now(),nom:'',prenom:'',statut:'SPV',cis:'CIS Bouillante',inaptitude:'Non',historique:[]}; modalTitle.textContent=id?`Fiche : ${a.nom} ${a.prenom}`:'Nouvelle fiche agent'; form.innerHTML=fields.map(([k,l,t,opts])=>{let v=a[k]??''; if(t==='textarea') return `<label>${l}<textarea data-k="${k}">${v}</textarea></label>`; if(t==='select') return `<label>${l}<select data-k="${k}">${opts.map(o=>`<option ${String(v)===o?'selected':''}>${o}</option>`).join('')}</select></label>`; if(t==='checkbox') return `<label><input type="checkbox" data-k="${k}" ${v?'checked':''}> ${l}</label>`; return `<label>${l}<input type="${t||'text'}" data-k="${k}" value="${String(v).replaceAll('"','&quot;')}"></label>`;}).join(''); renderHistory(a); modal.classList.remove('hidden'); }
function renderHistory(a){let h=a.historique||[]; historyBox.innerHTML='<h3>Historique</h3>'+(h.length?h.map(x=>`<div class="history"><b>${fmt(x.date)||x.date||''}</b> — ${x.avis||x.typeVisite||''}<br><span class="sub">${x.source||''} ${x.document?'— '+x.document:''}</span><br>${x.restriction||''}</div>`).join(''):'<p class="sub">Aucun historique.</p>');}
function closeModal(){modal.classList.add('hidden'); editingId=null;}
function valuesFromForm(){let a=editingId?{...agents.find(x=>x.id===editingId)}:{id:Date.now(),historique:[]}; form.querySelectorAll('[data-k]').forEach(el=>{a[el.dataset.k]=el.type==='checkbox'?el.checked:el.value;}); if(!a.cis) a.cis='CIS Bouillante'; return a;}
function saveAgent(){let a=valuesFromForm(); a.derniereMaj=new Date().toISOString().slice(0,10); if(!String(a.cis).toUpperCase().includes('BOUILLANTE')) return toast('Refusé : agent non Bouillante'); let i=agents.findIndex(x=>x.id===a.id); if(i>=0) agents[i]=a; else agents.push(a); saveLocal(); closeModal(); renderAll(); toast('Fiche enregistrée');}
function deleteAgent(){if(!editingId) return closeModal(); if(confirm('Supprimer cette fiche ?')){agents=agents.filter(a=>a.id!==editingId); saveLocal(); closeModal(); renderAll();}}
function addHistoryEntry(){let a=valuesFromForm(); a.historique=a.historique||[]; a.historique.unshift({date:new Date().toISOString().slice(0,10),source:'Saisie manuelle',avis:a.aptitude,restriction:a.restriction,prochaineVisite:a.prochaineVisite,document:a.document}); let i=agents.findIndex(x=>x.id===a.id); if(i>=0) agents[i]=a; else agents.push(a); saveLocal(); renderHistory(a); renderAll(); toast('Historique ajouté');}
function quickInaptitude(){showTab('agents'); setFilter('INAPTE'); toast('Ouvre une fiche puis renseigne Inaptitude = Oui');}
function showTab(id){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active')); document.getElementById(id).classList.add('active'); document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id)); renderAll();}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
const CERTIFICATE_UPDATES=[{"fichier": "ABENAQUI Cédric.pdf", "nom": "ABENAQUI", "prenom": "Cédric", "matricule": "22 303", "derniereVisite": "2025-04-10", "prochaineVisite": "2026-04-14", "aptitude": "Apte sans restriction", "restriction": "Aucune", "restrictionOperationnelle": "Non", "activitesSportives": "Autorisées", "inaptitude": "Non", "typeVisite": "Maintien en activité", "source": "PDF aptitude"}, {"fichier": "ASDRUBAL Eric.pdf", "nom": "ASDRUBAL", "prenom": "Eric", "matricule": "21 749", "derniereVisite": "2026-05-21", "prochaineVisite": "2027-05-31", "aptitude": "Apte sans restriction", "restriction": "Aucune", "restrictionOperationnelle": "Non", "activitesSportives": "Autorisées", "inaptitude": "Non", "typeVisite": "Maintien en activité", "source": "PDF aptitude"}, {"fichier": "BALTUS Franck.pdf", "nom": "BALTUS", "prenom": "Franck", "matricule": "22 448", "derniereVisite": "2026-02-23", "prochaineVisite": "2027-02-20", "aptitude": "Apte sans restriction", "restriction": "Aucune", "restrictionOperationnelle": "Non", "activitesSportives": "Autorisées", "inaptitude": "Non", "typeVisite": "Maintien en activité", "source": "PDF aptitude"}, {"fichier": "BALTUS Lidia.pdf", "nom": "BALTUS", "prenom": "Lydia", "matricule": "24 333", "derniereVisite": "2025-02-24", "prochaineVisite": "2026-02-23", "aptitude": "Apte sans restriction", "restriction": "Aucune", "restrictionOperationnelle": "Non", "activitesSportives": "Autorisées", "inaptitude": "Non", "typeVisite": "Maintien en activité", "source": "PDF aptitude ancien"}, {"fichier": "BALTUS Lydia 30.04.27.pdf", "nom": "BALTUS", "prenom": "Lydia", "matricule": "24 333", "derniereVisite": "2026-04-30", "prochaineVisite": "2027-04-30", "aptitude": "Apte sans restriction", "restriction": "Aucune", "restrictionOperationnelle": "Non", "activitesSportives": "Autorisées", "inaptitude": "Non", "typeVisite": "Maintien en activité", "source": "PDF aptitude"}, {"fichier": "BAPTISTE Bruce.pdf", "nom": "BAPTISTE", "prenom": "Bruce", "matricule": "21 842", "derniereVisite": "2026-05-21", "prochaineVisite": "2027-05-27", "aptitude": "Apte avec restriction opérationnelle", "restriction": "Restriction opérationnelle : port ARI", "restrictionOperationnelle": "Oui", "activitesSportives": "Autorisées", "inaptitude": "Non", "typeVisite": "Maintien en activité", "source": "PDF aptitude restriction"}, {"fichier": "BOISDUR Harry ( bouillante).pdf", "nom": "BOISDUR", "prenom": "Harry", "matricule": "23 142", "derniereVisite": "2025-01-13", "prochaineVisite": "2026-08-23", "aptitude": "Apte sans restriction", "restriction": "Aucune", "restrictionOperationnelle": "Non", "activitesSportives": "Autorisées", "inaptitude": "Non", "typeVisite": "Maintien en activité", "source": "PDF aptitude"}, {"fichier": "CLARKE Jean Claude.pdf", "nom": "CLARKE", "prenom": "Jean-claude", "matricule": "22 304", "derniereVisite": "2025-02-20", "prochaineVisite": "2026-02-25", "aptitude": "Apte avec restriction opérationnelle", "restriction": "Conduite engin feu autorisée sous conditions / à préciser", "restrictionOperationnelle": "Oui", "activitesSportives": "Autorisées", "inaptitude": "Non", "typeVisite": "Maintien en activité", "source": "PDF aptitude restriction"}, {"fichier": "DABRIOU Betty Reprise 13.06.2025.pdf", "nom": "DABRIOU", "prenom": "Bethy", "matricule": "24 899", "derniereVisite": "2025-06-13", "prochaineVisite": "2025-08-31", "aptitude": "Apte avec restriction opérationnelle", "restriction": "Restriction opérationnelle", "restrictionOperationnelle": "Oui", "activitesSportives": "Autorisées", "inaptitude": "Non", "typeVisite": "Reprise", "source": "PDF reprise ancien"}, {"fichier": "DABRIOU Betty.pdf", "nom": "DABRIOU", "prenom": "Bethy", "matricule": "24 899", "derniereVisite": "2025-06-15", "prochaineVisite": "2026-09-20", "aptitude": "Apte avec restriction opérationnelle", "restriction": "Restriction opérationnelle", "restrictionOperationnelle": "Oui", "activitesSportives": "Autorisées", "inaptitude": "Non", "typeVisite": "Maintien en activité", "source": "PDF aptitude"}, {"fichier": "DABRIOU Bethy 10.11.2025.pdf", "nom": "DABRIOU", "prenom": "Bethy", "matricule": "24 899", "derniereVisite": "2025-10-28", "prochaineVisite": "2026-09-20", "aptitude": "Apte sans restriction", "restriction": "Aucune", "restrictionOperationnelle": "Non", "activitesSportives": "Autorisées", "inaptitude": "Non", "typeVisite": "Maintien en activité", "source": "PDF aptitude le plus récent"}, {"fichier": "DARLIS Marie-Odile.pdf", "nom": "DARLIS", "prenom": "Marie-Odile", "matricule": "22 641", "derniereVisite": "2025-11-25", "prochaineVisite": "2026-12-04", "aptitude": "Apte avec restriction opérationnelle", "restriction": "Restriction opérationnelle : incendie / SR", "restrictionOperationnelle": "Oui", "activitesSportives": "Autorisées", "inaptitude": "Non", "typeVisite": "Reprise", "source": "PDF aptitude restriction"}];
const CERTIFICATE_EXCLUSIONS=[{"fichier": "ASDRUBAL Cedric.pdf", "raison": "CIS BELOST"}, {"fichier": "ASDRUBAL Emma.pdf", "raison": "CIS BELOST"}, {"fichier": "ASDRUBAL Florian.pdf", "raison": "CIS BELOST"}, {"fichier": "ASDRUBAL Loise.pdf", "raison": "CIS ABYMES"}, {"fichier": "ASDRUBAL Philippe 12.05.26.pdf", "raison": "CIS non confirmé Bouillante"}, {"fichier": "ASDRUBAL Stéphanie.pdf", "raison": "CIS ABYMES"}, {"fichier": "BRUDEY Guillaume.pdf", "raison": "GTO"}, {"fichier": "DELOUMEAUX Laurent.pdf", "raison": "CIS MAE"}];
let pendingFileUpdates=[];
function normName(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
function findKnownUpdate(fileName){let n=normName(fileName); return CERTIFICATE_UPDATES.find(u=>n.includes(normName(u.fichier))||normName(u.fichier).includes(n));}
function findKnownExclusion(fileName){let n=normName(fileName); return CERTIFICATE_EXCLUSIONS.find(u=>n.includes(normName(u.fichier))||normName(u.fichier).includes(n));}
function findAgentFromFile(fileName){let n=normName(fileName); return agents.find(a=>n.includes(normName(a.nom)) && (n.includes(normName(a.prenom.split(' ')[0])) || n.includes(normName(a.prenom.split('-')[0]))));}
function isNewerUpdate(a,b){return String(a.derniereVisite||a.prochaineVisite||'')>String(b.derniereVisite||b.prochaineVisite||'');}
function handleCertificateFiles(e){let files=[...(e.target.files||[])]; if(!files.length) return; let accepted=[], excluded=[], manual=[]; files.forEach(f=>{let ex=findKnownExclusion(f.name); if(ex){excluded.push({fichier:f.name,raison:ex.raison}); return;} let u=findKnownUpdate(f.name); if(u){accepted.push({...u,fichierSelectionne:f.name}); return;} let ag=findAgentFromFile(f.name); if(ag && String(ag.cis||'').toUpperCase().includes('BOUILLANTE')) manual.push({fichier:f.name,agent:ag.nom+' '+ag.prenom,id:ag.id}); else excluded.push({fichier:f.name,raison:'Agent non Bouillante ou non reconnu'}); }); let byAgent={}; accepted.forEach(u=>{let k=normName(u.nom+' '+u.prenom); if(!byAgent[k]||isNewerUpdate(u,byAgent[k])) byAgent[k]=u;}); pendingFileUpdates=Object.values(byAgent); let ignoredOld=accepted.length-pendingFileUpdates.length; fileUpdateResult.innerHTML=renderFileUpdateResult(pendingFileUpdates,excluded,manual,ignoredOld);}
function renderFileUpdateResult(accepted,excluded,manual,ignoredOld){let html=`<div class="card"><h3>Résultat de l’analyse</h3><p><b>${accepted.length}</b> mise(s) à jour Bouillante prête(s). <b>${excluded.length}</b> fichier(s) exclu(s). ${ignoredOld?'<b>'+ignoredOld+'</b> ancien(s) certificat(s) ignoré(s).':''}</p>`; if(accepted.length){html+=`<table><thead><tr><th>Agent</th><th>Dernière visite</th><th>Validité</th><th>Avis</th></tr></thead><tbody>`+accepted.map(u=>`<tr><td>${u.nom} ${u.prenom}</td><td>${frDate(u.derniereVisite)}</td><td>${frDate(u.prochaineVisite)}</td><td>${u.aptitude}</td></tr>`).join('')+`</tbody></table><button class="btn primary" style="margin-top:10px" onclick="applyFileUpdates()">Appliquer les mises à jour retenues</button>`;} if(manual.length){html+=`<h4>À vérifier manuellement</h4><p class="sub">Agent Bouillante reconnu, mais le certificat n’est pas encore dans la table automatique.</p><table><tbody>`+manual.map(m=>`<tr><td>${m.fichier}</td><td>${m.agent}</td><td><button class="btn small" onclick="openAgent(${m.id})">Ouvrir</button></td></tr>`).join('')+`</tbody></table>`;} if(excluded.length){html+=`<h4>Fichiers exclus</h4><table><tbody>`+excluded.map(x=>`<tr><td>${x.fichier}</td><td>${x.raison}</td></tr>`).join('')+`</tbody></table>`;} return html+'</div>';}
function applyFileUpdates(){if(!pendingFileUpdates.length) return toast('Aucune mise à jour à appliquer'); let nb=0; let updated=[]; pendingFileUpdates.forEach(u=>{let a=agents.find(x=>normName(x.nom)===normName(u.nom)&&normName(x.prenom)===normName(u.prenom)); if(!a) return; if(!String(a.cis||'').toUpperCase().includes('BOUILLANTE')) return; Object.assign(a,{matricule:u.matricule||a.matricule,derniereVisite:u.derniereVisite,prochaineVisite:u.prochaineVisite,aptitude:u.aptitude,restriction:u.restriction,restrictionOperationnelle:u.restrictionOperationnelle,activitesSportives:u.activitesSportives,inaptitude:u.inaptitude,typeVisite:u.typeVisite,document:u.fichierSelectionne||u.fichier,source:u.source,derniereMaj:new Date().toISOString().slice(0,10)}); a.historique=a.historique||[]; if(!a.historique.some(h=>h.document===(u.fichierSelectionne||u.fichier))) a.historique.unshift({date:new Date().toISOString().slice(0,10),source:u.source,avis:u.aptitude,restriction:u.restriction,prochaineVisite:u.prochaineVisite,document:u.fichierSelectionne||u.fichier}); nb++; updated.push(a.nom+' '+a.prenom); }); saveLocal(); renderAll(); fileUpdateResult.innerHTML=`<div class="card okBox"><b>${nb} fiche(s) Bouillante mise(s) à jour dans la base locale.</b><p>${updated.join(', ')}</p><p><b>Pour rendre la mise à jour permanente sur GitHub :</b></p><ol><li>Clique sur <b>Télécharger agents.json</b>.</li><li>Va sur GitHub dans ton dépôt <b>visite-medicale-competence</b>.</li><li>Remplace le fichier <b>agents.json</b> par celui téléchargé.</li><li>Recharge le site avec <b>?reset=1&v=12</b>.</li></ol><button class="btn primary" onclick="downloadAgentsBase()">Télécharger agents.json</button><button class="btn blue" onclick="showTab('agents')">Voir les fiches</button></div>`; toast('Mise à jour terminée');}
function clearFileUpdate(){pendingFileUpdates=[]; let input=document.getElementById('certFiles'); if(input) input.value=''; fileUpdateResult.innerHTML='';}
function exportRows(kind){let rows=alphaAgents(); if(kind==='expires') rows=rows.filter(a=>status(a).code==='EXPIRE'); if(kind==='inaptes') rows=rows.filter(a=>status(a).code==='INAPTE'||hasRestriction(a)); return rows;}
function exportCSV(kind){let rows=exportRows(kind); let cols=['nom','prenom','matricule','statut','cis','derniereVisite','prochaineVisite','aptitude','inaptitude','typeInaptitude','restriction','restrictionOperationnelle','bilanAFaire','previsite','observations','document']; let csv=[cols.join(';')].concat(rows.map(a=>cols.map(c=>'"'+String(a[c]??'').replaceAll('"','""')+'"').join(';'))).join('\n'); download('export_'+kind+'_visite_medicale.csv',csv,'text/csv;charset=utf-8');}
function exportJSON(){download('visite_medicale_competence_export.json',JSON.stringify(agents,null,2),'application/json');}
function downloadAgentsBase(){download('agents.json',JSON.stringify(alphaAgents(),null,2),'application/json'); toast('agents.json téléchargé');}
function download(name,content,type){let blob=new Blob([content],{type}), a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href);}
function importJSON(e){let f=e.target.files[0]; if(!f) return; let r=new FileReader(); r.onload=()=>{agents=JSON.parse(r.result).filter(a=>String(a.cis||'').toUpperCase().includes('BOUILLANTE')); saveLocal(); renderAll(); toast('Import terminé');}; r.readAsText(f);}
function resetData(){if(confirm('Effacer la sauvegarde locale ?')){localStorage.removeItem(KEY); location.href=location.pathname+'?reset=1&v=12';}}
function forceReload(){localStorage.removeItem(KEY); location.href=location.pathname+'?reset=1&v=12';}
function renderExportPreview(){let rows=exportRows('expires').slice(0,12); exportPreview.innerHTML='<table><tr><th>Nom</th><th>Statut</th><th>Avis</th><th>Validité</th></tr>'+rows.map(a=>`<tr><td>${a.nom} ${a.prenom}</td><td>${status(a).label}</td><td>${a.aptitude||''}</td><td>${fmt(a.prochaineVisite)||''}</td></tr>`).join('')+'</table>';}

// ======================= V12 OCR / IA locale =======================
// Cette version scanne les PDF/images dans le navigateur avec PDF.js + Tesseract.js.
// Elle n'envoie pas les documents vers un serveur. Pour une IA cloud plus fiable,
// configurer plus tard un webhook Make/OpenAI côté serveur.
pendingFileUpdates=[];
var pendingManualChecks=[];
var pendingExcluded=[];

function setOcrProgress(txt,pct){
  const el=document.getElementById('ocrProgress');
  if(!el) return;
  const w=Math.max(0,Math.min(100,Math.round(pct||0)));
  el.innerHTML=`${txt||''}<div class="progressbar"><i style="width:${w}%"></i></div>`;
}
function cleanOcrText(t){return String(t||'').replace(/\r/g,'\n').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();}
function normTxt(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();}
function onlyDateIso(d){
  if(!d) return '';
  let m=String(d).match(/(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})/);
  if(!m) return '';
  let yy=m[3].length===2 ? '20'+m[3] : m[3];
  let dd=m[1].padStart(2,'0'), mm=m[2].padStart(2,'0');
  return `${yy}-${mm}-${dd}`;
}
function extractDates(text){
  const out=[]; const re=/(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/g; let m;
  while((m=re.exec(text||''))){let iso=onlyDateIso(m[1]); if(iso) out.push(iso);}
  return [...new Set(out)].sort();
}
function findBestAgentFromText(text,fileName){
  const hay=normTxt((text||'')+' '+(fileName||''));
  let best=null, bestScore=0;
  (agents||[]).forEach(a=>{
    let nom=normTxt(a.nom), pre=normTxt(String(a.prenom||'').split(/[\s\-]/)[0]), prenomFull=normTxt(a.prenom||'');
    let score=0;
    if(nom && hay.includes(nom)) score+=3;
    if(pre && hay.includes(pre)) score+=3;
    if(prenomFull && hay.includes(prenomFull)) score+=1;
    if(a.matricule && hay.includes(normTxt(a.matricule))) score+=4;
    if(String(a.cis||'').toUpperCase().includes('BOUILLANTE')) score+=1;
    if(score>bestScore){best=a; bestScore=score;}
  });
  return bestScore>=5 ? {agent:best,score:bestScore} : {agent:null,score:bestScore};
}
function detectBouillante(text,fileName){
  const h=normTxt((text||'')+' '+(fileName||''));
  if(h.includes('BOUILLANTE')) return true;
  if(/CIS\s*BOUILLANTE/i.test(text||'')) return true;
  return false;
}
function detectNonBouillante(text){
  const h=normTxt(text||'');
  const centres=['BELOST','ABYMES','PETIT BOURG','P/BOURG','P BOURG','MAE','GTO','CAPESTERRE','SAINTE ROSE','BAIE MAHAULT','MOULE','SAINT FRANCOIS'];
  return centres.find(c=>h.includes(c)) || '';
}
function parseCertificateTextAI(text,fileName){
  const raw=cleanOcrText(text);
  const h=normTxt(raw);
  const bouillante=detectBouillante(raw,fileName);
  const autreCentre=detectNonBouillante(raw);
  const found=findBestAgentFromText(raw,fileName);
  const dates=extractDates(raw).filter(d=>d>='2020-01-01' && d<='2035-12-31');
  const prochaineVisite=dates.length?dates[dates.length-1]:'';
  const derniereVisite=dates.length>1?dates[dates.length-2]:'';
  let aptitude='À vérifier';
  let inaptitude='Non';
  let typeInaptitude='';
  let restriction='À vérifier';
  let restrictionOperationnelle='À vérifier';
  let activitesSportives='Non renseigné';
  if(/INAPTE\s+TEMPORAIRE|INAPTITUDE\s+TEMPORAIRE/.test(h)){aptitude='Inapte temporaire'; inaptitude='Oui'; typeInaptitude='Temporaire'; restriction='Inaptitude temporaire'; restrictionOperationnelle='Oui';}
  else if(/INAPTE\s+DEFINITIF|INAPTITUDE\s+DEFINITIVE/.test(h)){aptitude='Inapte définitif'; inaptitude='Oui'; typeInaptitude='Définitive'; restriction='Inaptitude définitive'; restrictionOperationnelle='Oui';}
  else if(/INAPTE/.test(h) && !/APTE\s+SANS/.test(h)){aptitude='Inapte'; inaptitude='Oui'; typeInaptitude='À vérifier'; restriction='Inaptitude détectée'; restrictionOperationnelle='Oui';}
  else if(/APTE\s+AVEC|RESTRICTION\s+OPERATIONNELLE|RESTRICTIONS?/.test(h) && !/SANS\s+RESTRICTION/.test(h)){aptitude='Apte avec restriction opérationnelle'; inaptitude='Non'; restriction='Restriction détectée — vérifier la mention exacte sur le PDF'; restrictionOperationnelle='Oui';}
  else if(/APTE\s+SANS\s+RESTRICTION|SANS\s+RESTRICTION|APTE/.test(h)){aptitude='Apte sans restriction'; inaptitude='Non'; restriction='Aucune'; restrictionOperationnelle='Non'; activitesSportives='Autorisées';}
  const typeVisite=/REPRISE/.test(h)?'Reprise':(/MAINTIEN/.test(h)?'Maintien en activité':'Non renseigné');
  const matMatch=raw.match(/(?:matricule|mat\.?)[^0-9]{0,20}([0-9][0-9\s]{3,10})/i) || raw.match(/\b(\d{2}\s?\d{3})\b/);
  const matricule=matMatch?matMatch[1].replace(/\s+/g,' ').trim():'';
  let decision='manual', reason='À vérifier manuellement';
  if(autreCentre && !bouillante){decision='excluded'; reason='Autre centre détecté : '+autreCentre;}
  else if(!bouillante){decision='manual'; reason='CIS Bouillante non lu par OCR';}
  else if(!found.agent){decision='manual'; reason='Bouillante détecté mais agent non reconnu';}
  else if(!prochaineVisite){decision='manual'; reason='Bouillante détecté mais date de validité non reconnue';}
  else {decision='accepted'; reason='Bouillante confirmé par OCR';}
  return {decision,reason,text:raw,agent:found.agent,score:found.score,nom:found.agent?.nom||'',prenom:found.agent?.prenom||'',matricule:matricule||found.agent?.matricule||'',derniereVisite,prochaineVisite,aptitude,restriction,restrictionOperationnelle,activitesSportives,inaptitude,typeInaptitude,typeVisite,document:fileName,source:'OCR IA locale',derniereMaj:new Date().toISOString().slice(0,10)};
}
async function fileToImageDataURLs(file){
  if(/pdf$/i.test(file.name) || file.type==='application/pdf'){
    if(!window.pdfjsLib) throw new Error('PDF.js non chargé. Vérifie la connexion internet.');
    const data=await file.arrayBuffer();
    const pdf=await pdfjsLib.getDocument({data}).promise;
    const pages=[];
    const maxPages=Math.min(pdf.numPages,2);
    for(let p=1;p<=maxPages;p++){
      const page=await pdf.getPage(p);
      const viewport=page.getViewport({scale:2.4});
      const canvas=document.createElement('canvas');
      canvas.width=viewport.width; canvas.height=viewport.height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      await page.render({canvasContext:ctx,viewport}).promise;
      pages.push(canvas.toDataURL('image/png'));
    }
    return pages;
  }
  return [await new Promise((res,rej)=>{const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file);})];
}
async function ocrFile(file,idx,total){
  if(!window.Tesseract) throw new Error('Tesseract OCR non chargé. Vérifie la connexion internet.');
  const imgs=await fileToImageDataURLs(file);
  let full='', confidence=0;
  for(let i=0;i<imgs.length;i++){
    setOcrProgress(`Scan ${idx}/${total} : ${file.name} — page ${i+1}/${imgs.length}`, 5);
    const result=await Tesseract.recognize(imgs[i],'fra',{logger:m=>{
      if(m.status==='recognizing text') setOcrProgress(`Lecture IA/OCR : ${file.name} — ${Math.round((m.progress||0)*100)}%`, 15+Math.round((m.progress||0)*70));
    }});
    full+='\n'+(result.data?.text||'');
    confidence=Math.max(confidence,result.data?.confidence||0);
  }
  return {text:full,confidence};
}
async function handleCertificateFiles(e){
  const files=[...(e.target.files||[])];
  if(!files.length) return;
  pendingFileUpdates=[]; pendingManualChecks=[]; pendingExcluded=[];
  fileUpdateResult.innerHTML='<div class="card"><b>Scan en cours...</b><p class="sub">Ne ferme pas la page pendant la lecture OCR.</p></div>';
  for(let i=0;i<files.length;i++){
    const f=files[i];
    try{
      const {text,confidence}=await ocrFile(f,i+1,files.length);
      const parsed=parseCertificateTextAI(text,f.name);
      parsed.confidence=Math.round(confidence||0);
      if(parsed.decision==='accepted') pendingFileUpdates.push(parsed);
      else if(parsed.decision==='excluded') pendingExcluded.push(parsed);
      else pendingManualChecks.push(parsed);
    }catch(err){
      pendingManualChecks.push({decision:'manual',reason:'Erreur de lecture : '+err.message,document:f.name,text:'',confidence:0});
    }
    fileUpdateResult.innerHTML=renderFileUpdateResult(pendingFileUpdates,pendingExcluded,pendingManualChecks);
  }
  // garder la fiche la plus récente si plusieurs documents pour le même agent
  const byAgent={};
  pendingFileUpdates.forEach(u=>{
    const k=normName(u.nom+' '+u.prenom);
    if(!byAgent[k] || String(u.prochaineVisite)>String(byAgent[k].prochaineVisite)) byAgent[k]=u;
  });
  pendingFileUpdates=Object.values(byAgent);
  setOcrProgress('Scan terminé.',100);
  fileUpdateResult.innerHTML=renderFileUpdateResult(pendingFileUpdates,pendingExcluded,pendingManualChecks);
}
function renderFileUpdateResult(accepted,excluded,manual){
  let html=`<div class="card"><h3>Résultat du scan IA/OCR</h3><p><b>${accepted.length}</b> mise(s) à jour Bouillante prête(s). <b>${manual.length}</b> document(s) à vérifier. <b>${excluded.length}</b> document(s) exclu(s).</p>`;
  if(accepted.length){html+=`<h4>Mises à jour prêtes</h4><table><thead><tr><th>Agent</th><th>Visite</th><th>Validité</th><th>Avis</th><th>OCR</th></tr></thead><tbody>`+accepted.map(u=>`<tr><td>${u.nom} ${u.prenom}</td><td>${frDate(u.derniereVisite)}</td><td>${frDate(u.prochaineVisite)}</td><td>${u.aptitude}</td><td>${u.confidence||0}%</td></tr>`).join('')+`</tbody></table><button class="btn primary" style="margin-top:10px" onclick="applyFileUpdates()">Appliquer à la base locale</button>`;}
  if(manual.length){html+=`<h4>À vérifier manuellement</h4><table><thead><tr><th>Fichier</th><th>Raison</th><th>Agent détecté</th><th>Action</th></tr></thead><tbody>`+manual.map((m,i)=>`<tr><td>${m.document||''}</td><td>${m.reason||''}</td><td>${m.agent?m.agent.nom+' '+m.agent.prenom:''}</td><td>${m.agent?`<button class="btn small" onclick="openAgent(${m.agent.id})">Ouvrir</button>`:''}</td></tr>`).join('')+`</tbody></table><details><summary>Voir le texte OCR à vérifier</summary>`+manual.map(m=>`<p><b>${m.document||''}</b> — ${m.reason||''}</p><div class="ocrText">${escapeHtml(m.text||'')}</div>`).join('')+`</details>`;}
  if(excluded.length){html+=`<h4>Exclus car non Bouillante</h4><table><thead><tr><th>Fichier</th><th>Raison</th></tr></thead><tbody>`+excluded.map(x=>`<tr><td>${x.document||''}</td><td>${x.reason||''}</td></tr>`).join('')+`</tbody></table>`;}
  return html+'</div>';
}
function applyFileUpdates(){
  if(!pendingFileUpdates.length) return toast('Aucune mise à jour à appliquer');
  let nb=0, updated=[];
  pendingFileUpdates.forEach(u=>{
    let a=agents.find(x=>x.id===u.agent?.id) || agents.find(x=>normName(x.nom)===normName(u.nom)&&normName(x.prenom)===normName(u.prenom));
    if(!a) return;
    if(!String(a.cis||'').toUpperCase().includes('BOUILLANTE')) return;
    Object.assign(a,{matricule:u.matricule||a.matricule,derniereVisite:u.derniereVisite||a.derniereVisite,prochaineVisite:u.prochaineVisite||a.prochaineVisite,aptitude:u.aptitude||a.aptitude,restriction:u.restriction||a.restriction,restrictionOperationnelle:u.restrictionOperationnelle||a.restrictionOperationnelle,activitesSportives:u.activitesSportives||a.activitesSportives,inaptitude:u.inaptitude||a.inaptitude,typeInaptitude:u.typeInaptitude||a.typeInaptitude,typeVisite:u.typeVisite||a.typeVisite,document:u.document,source:u.source,derniereMaj:u.derniereMaj});
    a.historique=a.historique||[];
    a.historique.unshift({date:u.derniereMaj,source:u.source,typeVisite:u.typeVisite,avis:u.aptitude,restriction:u.restriction,prochaineVisite:u.prochaineVisite,document:u.document,ocr:'V12'});
    nb++; updated.push(a.nom+' '+a.prenom);
  });
  saveLocal(); renderAll();
  fileUpdateResult.innerHTML=`<div class="card okBox"><b>${nb} fiche(s) mise(s) à jour dans la base locale.</b><p>${updated.join(', ')}</p><p><b>Pour rendre la mise à jour permanente :</b> clique sur <b>Télécharger agents.json</b>, puis remplace le fichier <b>agents.json</b> sur GitHub.</p><button class="btn primary" onclick="downloadAgentsBase()">Télécharger agents.json</button><button class="btn blue" onclick="showTab('agents')">Voir les fiches</button></div>`;
  toast('Mise à jour OCR appliquée');
}
function clearFileUpdate(){
  pendingFileUpdates=[]; pendingManualChecks=[]; pendingExcluded=[];
  const input=document.getElementById('certFiles'); if(input) input.value='';
  const p=document.getElementById('ocrProgress'); if(p) p.innerHTML='';
  const r=document.getElementById('fileUpdateResult'); if(r) r.innerHTML='';
}
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function forceReload(){localStorage.removeItem(KEY); location.href=location.pathname+'?reset=1&v=12';}
function resetData(){if(confirm('Effacer la sauvegarde locale ?')){localStorage.removeItem(KEY); location.href=location.pathname+'?reset=1&v=12';}}
// ======================= Fin V12 OCR =======================

init();
