/* PKI Nutrition Calculator - dependency-free static frontend. */
'use strict';

const foodDatabase = typeof foods !== 'undefined' ? foods : [];
const $ = id => document.getElementById(id);
const number = value => Number(value);
const fmt = (value,digits=0) => new Intl.NumberFormat('id-ID',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
let sex = 'male';
let selectedFood = foodDatabase.find(f => f.code === 'AP001') || foodDatabase[0] || null;
let lastFoodResult = null;
const POPULAR_CODES = ['AP001', 'HR002', 'FR005', 'CP077', 'CP061', 'ER074'];

const MICRO_ORDER = ['vitA','vitD','vitE','vitK','b1','b2','b3','b5','b6','folat','b12','biotin','vitC','ca','p','mag','kalium','fe','iodium','zn','se'];
const AKG_AGE_LABELS = ['16–18','19–29','30–49','50–64','65–80','80+'];
const AKG_MALE = [
  [600,15,15,55,1.3,1.6,15,5,1.3,400,2.4,30,90,1200,1200,250,4700,15,150,17,30],
  [600,15,15,65,1.4,1.6,15,5,1.3,400,2.4,30,90,1100,700,350,4700,13,150,13,30],
  [600,15,15,65,1.3,1.6,15,5,1.3,400,2.4,30,90,1000,700,350,4700,13,150,13,30],
  [600,15,15,65,1.2,1.4,13,5,1.7,400,2.4,30,90,1000,700,350,4700,13,150,13,30],
  [600,20,15,65,1.0,1.1,10,5,1.7,400,2.4,30,90,1000,700,350,4700,13,150,13,30],
  [600,20,15,65,0.8,0.9,8,5,1.7,400,2.4,30,90,1000,700,350,4700,13,150,13,30]
];
const AKG_FEMALE = [
  [600,15,15,55,1.1,1.3,12,5,1.2,400,2.4,30,75,1200,1200,220,4700,26,150,14,30],
  [500,15,15,55,1.1,1.4,12,5,1.3,400,2.4,30,75,1100,700,310,4700,26,150,10,30],
  [500,15,15,55,1.1,1.3,12,5,1.3,400,2.4,30,75,1000,700,320,4700,26,150,10,30],
  [500,15,15,55,1.0,1.1,10,5,1.5,400,2.4,30,75,1000,700,320,4700,12,150,10,30],
  [500,20,15,55,0.8,0.9,9,5,1.5,400,2.4,30,75,1000,700,320,4700,12,150,10,30],
  [500,20,15,55,0.7,0.9,8,5,1.5,400,2.4,30,75,1000,700,320,4700,12,150,10,30]
];

const MICRO_LAYOUT = [
  {title:'Vitamin',rows:[['vitA','Vitamin A','µg',0],['vitC','Vitamin C','mg',0],['vitD','Vitamin D','µg',0],['vitE','Vitamin E','mg',0],['vitK','Vitamin K','µg',0]]},
  {title:'Vitamin B kompleks',rows:[['b1','Vitamin B1 (tiamin)','mg',1],['b2','Vitamin B2 (riboflavin)','mg',1],['b3','Vitamin B3 (niasin)','mg',0],['b5','Vitamin B5 (pantotenat)','mg',1],['b6','Vitamin B6','mg',1],['folat','Folat','µg',0],['b12','Vitamin B12','µg',1],['biotin','Biotin','µg',0]]},
  {title:'Mineral',rows:[['ca','Kalsium','mg',0],['mag','Magnesium','mg',0],['fe','Zat besi','mg',0],['zn','Seng','mg',0],['kalium','Kalium','mg',0],['iodium','Iodium','µg',0],['p','Fosfor','mg',0],['se','Selenium','µg',0]]}
];
function akgAgeIndex(age) { return age<=18?0 : age<=29?1 : age<=49?2 : age<=64?3 : age<=80?4 : 5; }
function renderMicros(p) {
  const g = akgAgeIndex(p.age);
  const base = (p.sex === 'male' ? AKG_MALE : AKG_FEMALE)[g];
  const v = {};
  MICRO_ORDER.forEach((key,i)=>{ v[key] = base[i]; });
  $('microSubtitle').textContent = `AKG ${p.sex==='male'?'pria':'wanita'} usia ${AKG_AGE_LABELS[g]} tahun`;
  $('microList').innerHTML = MICRO_LAYOUT.map(group=>`<div class="micro-group"><h4>${group.title}</h4>${group.rows.map(r=>`<div class="micro-row"><span>${r[1]}</span><b>${fmt(v[r[0]],r[3])} <small>${r[2]}</small></b></div>`).join('')}</div>`).join('');
  $('microList').scrollTop = 0;
}


function calculateProfile(p) {
  const h = p.height / 100;
  const bmi = p.weight / (h*h);
  const category = bmi < 18 ? 'Berat badan kurang' : bmi < 25 ? 'Rentang normal' : bmi < 30 ? 'Berat badan berlebih' : 'Obesitas';
  const bmr = p.sex === 'male' ? 10*p.weight + 6.25*p.height - 5*p.age + 5 : 10*p.weight + 6.25*p.height - 5*p.age - 161;
  const tdee = bmr * p.activity;
  const target = Math.max(1200, p.goal === 'lose' ? tdee - (0.1 * tdee) : p.goal === 'gain' ? tdee + (0.1 * tdee) : tdee);
  return {bmi,category,idealMin:18*h*h,idealMax:24.9*h*h,bmr,tdee,target,carbs:target*.5/4,protein:target*.2/4,fat:target*.3/9};
}
function recommendations(category,goal) {
  let items = category === 'Berat badan kurang'
    ? ['Tambahkan sumber energi dan protein pada waktu makan utama.','Pilih camilan padat gizi seperti kacang, telur, atau produk kedelai.','Usahakan pola makan teratur dan variasi kelompok pangan.']
    : ['Utamakan sayur, buah utuh, dan sumber protein pada setiap waktu makan.','Perhatikan ukuran porsi dan batasi minuman berpemanis.','Pilih metode memasak panggang, rebus, atau kukus lebih sering.'];
  if (goal === 'lose') items.push('Untuk tujuan penurunan berat badan, utamakan perubahan bertahap dan berkelanjutan.');
  if (goal === 'gain') items.push('Untuk tujuan peningkatan berat badan, tambahkan porsi secara bertahap dengan pangan padat gizi.');
  return items;
}
function showError(message) { $('profileError').textContent = message; $('profileError').hidden = false; }
function renderBmiWarning(category, bmi) {
  const el = $('bmiWarning');
  if (!el) return;
  if (category === 'Obesitas') {
    el.className = 'warning-notice danger';
    el.innerHTML = `<div class="notice-icon">⚠️</div><div class="warning-content"><b>Peringatan: Kategori Obesitas (BMI ${fmt(bmi,1)} kg/m²)</b><p>Indeks Massa Tubuh Anda tergolong obesitas. Penurunan berat badan disarankan dilakukan secara bertahap dan terencana. Konsultasikan dengan dokter atau ahli gizi untuk program penurunan berat badan dan evaluasi kesehatan yang aman.</p></div>`;
    el.hidden = false;
  } else if (category === 'Berat badan kurang') {
    el.className = 'warning-notice';
    el.innerHTML = `<div class="notice-icon">⚠️</div><div class="warning-content"><b>Perhatian: Kategori Berat Badan Kurang (BMI ${fmt(bmi,1)} kg/m²)</b><p>Indeks Massa Tubuh Anda berada di bawah rentang normal. Kondisi berat badan kurang berisiko terhadap penurunan imunitas dan defisiensi zat gizi. Prioritaskan asupan makanan padat gizi secara bertahap dan konsultasikan dengan tenaga kesehatan jika diperlukan.</p></div>`;
    el.hidden = false;
  } else {
    el.hidden = true;
    el.innerHTML = '';
  }
}
function setMetric(id,value,unit) { $(id).innerHTML = `${value} <small>${unit}</small>`; }
$('profileForm').addEventListener('submit',event=>{
  event.preventDefault(); $('profileError').hidden = true;
  const p = {sex,age:number($('age').value),height:number($('height').value),weight:number($('weight').value),activity:number($('activity').value),goal:$('goal').value};
  if (!Number.isFinite(p.age)||p.age<18||p.age>100) return showError('Kalkulator ini ditujukan untuk orang dewasa usia 18–100 tahun.');
  if (!Number.isFinite(p.height)||p.height<120||p.height>230) return showError('Masukkan tinggi badan antara 120–230 cm.');
  if (!Number.isFinite(p.weight)||p.weight<25||p.weight>300) return showError('Masukkan berat badan antara 25–300 kg.');
  const r = calculateProfile(p);
  renderMicros(p);
  renderBmiWarning(r.category, r.bmi);
  setMetric('bmiValue',fmt(r.bmi,1),'kg/m²'); $('bmiCategory').textContent=r.category;
  setMetric('idealValue',`${fmt(r.idealMin,1)}–${fmt(r.idealMax,1)}`,'kg');
  setMetric('bmrValue',fmt(r.bmr),'kkal/hari'); setMetric('tdeeValue',fmt(r.tdee),'kkal/hari');
  $('calorieValue').innerHTML=`${fmt(r.target)} <small>kkal / hari</small>`; $('calorieDescription').textContent='Disesuaikan dengan tujuan berat badan yang dipilih.'; $('calorieRingValue').textContent='100%';
  $('carbValue').textContent=`${fmt(r.carbs,1)} g`; $('proteinValue').textContent=`${fmt(r.protein,1)} g`; $('fatValue').textContent=`${fmt(r.fat,1)} g`;
  $('resultStatus').textContent='Hasil diperbarui';
  $('recommendations').innerHTML = `<ul class="recommend-list">${recommendations(r.category,p.goal).map(x=>`<li><span style="color:#22a45d;font-weight:800">✓</span>${x}</li>`).join('')}</ul>`;
});

document.querySelectorAll('[data-sex]').forEach(button=>button.addEventListener('click',()=>{sex=button.dataset.sex;document.querySelectorAll('[data-sex]').forEach(b=>b.classList.toggle('selected',b===button));}));

function selectPage(page) {
  const personal = page === 'personal';
  $('personalPage').hidden=!personal; $('foodPage').hidden=personal;
  document.querySelectorAll('[data-page]').forEach(button=>button.classList.toggle('active',button.dataset.page===page));
  $('heroTitle').innerHTML=personal?'Pahami kebutuhan gizi.<br><em>Jalani hidup lebih baik.</em>':'Kenali nutrisi di setiap<br><em>porsi makananmu.</em>';
  $('heroDescription').textContent=personal?'Hitung estimasi kebutuhan energi harian berdasarkan profil tubuh dan aktivitasmu.':'Cari bahan pangan, masukkan beratnya, lalu lihat estimasi kandungan gizinya.';
  $('navLinks').classList.remove('open');
}
document.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>selectPage(button.dataset.page)));
$('brandHome').addEventListener('click',()=>selectPage('personal'));
$('mobileToggle').addEventListener('click',()=>$('navLinks').classList.toggle('open'));
$('helpButton').addEventListener('click',()=>$('formulaNotice').hidden=!$('formulaNotice').hidden);
$('closeNotice').addEventListener('click',()=>$('formulaNotice').hidden=true);

function selectFood(food) {
  selectedFood=food;
  $('selectedFoodName').textContent=food.name;
  $('selectedFoodMeta').textContent=`${food.code} · ${food.category} · Basis per 100 gram`;
  document.querySelectorAll('[data-food-id]').forEach(button=>button.classList.toggle('selected',button.dataset.foodId===food.id));
  $('searchResults').hidden=true;
  $('foodSearch').value=food.name;
}
function renderSuggestions() {
  const q=$('foodSearch').value.trim().toLocaleLowerCase('id');
  const chipsList = q
    ? foodDatabase.filter(f=>f.name.toLocaleLowerCase('id').includes(q)||f.category.toLocaleLowerCase('id').includes(q)||f.code.toLocaleLowerCase('id').includes(q)).slice(0,6)
    : foodDatabase.filter(f=>POPULAR_CODES.includes(f.code));
  $('foodSuggestions').innerHTML='<span>Pilihan cepat:</span>'+chipsList.map(f=>`<button type="button" class="chip ${selectedFood?.id===f.id?'selected':''}" data-food-id="${f.id}">${f.name}</button>`).join('');
  $('searchResults').hidden=!q;
  if (q) {
    const matches=foodDatabase.filter(f=>f.name.toLocaleLowerCase('id').includes(q)||f.category.toLocaleLowerCase('id').includes(q)||f.code.toLocaleLowerCase('id').includes(q));
    $('searchResults').innerHTML=matches.length?matches.slice(0,30).map(f=>`<button type="button" class="search-result" data-search-id="${f.id}"><b>${f.name}</b><small>${f.code} · ${f.category}</small></button>`).join(''):'<p class="no-results">Makanan tidak ditemukan dalam dataset TKPI 2020.</p>';
  }
  document.querySelectorAll('[data-food-id]').forEach(b=>b.addEventListener('click',()=>selectFood(foodDatabase.find(f=>f.id===b.dataset.foodId))));
  document.querySelectorAll('[data-search-id]').forEach(b=>b.addEventListener('click',()=>selectFood(foodDatabase.find(f=>f.id===b.dataset.searchId))));
}
$('foodSearch').addEventListener('input',renderSuggestions);
$('clearFood').addEventListener('click',()=>{selectedFood=null;$('selectedFoodName').textContent='Pilih makanan';$('selectedFoodMeta').textContent='Pilih salah satu pangan dari hasil pencarian';$('foodSearch').value='';$('searchResults').hidden=true;renderSuggestions();});
function calculatePortion(food,grams) { const out={};Object.entries(food.n).forEach(([key,value])=>out[key]=Math.round(value*grams/100*10)/10);return out; }
const nutrientRows=[['Energi','energy','kkal'],['Protein','protein','g'],['Lemak','fat','g'],['Karbohidrat','carbs','g'],['Serat pangan','fiber','g'],['Natrium','sodium','mg'],['Kalsium','calcium','mg'],['Zat besi','iron','mg'],['Vitamin A','vitA','µg'],['Vitamin C','vitC','mg']];
function renderFoodResult(r,grams) {
  const cards=[['Energi',r.energy,'kkal','♨'],['Protein',r.protein,'g','●'],['Karbohidrat',r.carbs,'g','❋'],['Lemak',r.fat,'g','◆']];
  $('foodOutput').innerHTML=`<div class="nutrition-highlight-grid">${cards.map(c=>`<div class="nutrition-highlight"><div class="highlight-icon">${c[3]}</div><span>${c[0]}</span><b>${fmt(c[1],1)} <small>${c[2]}</small></b></div>`).join('')}</div><div class="panel nutrition-table-panel"><div class="table-header"><div><h3>Detail zat gizi</h3><p>Estimasi kandungan untuk ${fmt(grams)} gram ${selectedFood.name.toLowerCase()} (${selectedFood.code})</p></div><span class="source-tag">TKPI 2020</span></div><div class="table-wrap"><table><thead><tr><th>Komponen gizi</th><th>Jumlah</th><th>Satuan</th><th>Sumber</th></tr></thead><tbody>${nutrientRows.map(row=>`<tr><td>${row[0]}</td><td class="numeric">${fmt(r[row[1]],1)}</td><td>${row[2]}</td><td><span class="source-tag">TKPI 2020</span></td></tr>`).join('')}</tbody></table></div><div class="table-note">♧ Komposisi gizi per ${fmt(grams)} gram mengacu pada Tabel Komposisi Pangan Indonesia (TKPI 2020).</div></div>`;
}
$('foodForm').addEventListener('submit',event=>{
  event.preventDefault(); const grams=number($('foodGrams').value); const query=$('foodSearch').value.trim().toLocaleLowerCase('id');
  if (query) { const exact=foodDatabase.find(f=>f.name.toLocaleLowerCase('id')===query||f.code.toLocaleLowerCase('id')===query); if (exact) selectFood(exact); else if (!selectedFood) { $('foodOutput').innerHTML='<div class="error-message">Pilih salah satu hasil pencarian yang tersedia sebelum menghitung.</div>'; return; } }
  if (!selectedFood) { $('foodOutput').innerHTML='<div class="panel empty-food"><h3>Pilih makanan terlebih dahulu</h3><p>Pilih salah satu pangan yang tersedia dalam daftar.</p></div>';return; }
  if (!Number.isFinite(grams)||grams<=0||grams>5000) { $('foodOutput').innerHTML='<div class="error-message">Berat makanan harus lebih dari 0 dan maksimal 5.000 gram.</div>';return; }
  lastFoodResult=calculatePortion(selectedFood,grams);$('portionLabel').textContent=`Porsi: ${fmt(grams)} gram`;renderFoodResult(lastFoodResult,grams);
});
renderSuggestions();
