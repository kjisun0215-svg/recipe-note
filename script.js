
/* ================================================
   나만의 레시피 노트 - script.js
   - 레시피 CRUD (localStorage)
   - AI 레시피 생성 (OpenAI API)
   - URL에서 레시피 자동 추출 (AI 파싱)
   - 카테고리 필터, 즐겨찾기, 검색

// ============================
// 상태 & 설정
// ============================
let recipes = JSON.parse(localStorage.getItem('recipes')) || [];
let editIndex = null;
let currentCategory = '전체';
let tempAIRecipe = null;   // AI 결과 임시 저장
let tempUrlRecipe = null;  // URL 결과 임시 저장

// OpenAI API 설정
const API_BASE = 'https://www.genspark.ai/api/llm_proxy/v1';
const MODEL = 'gpt-5';

function getApiKey() {
  return window.__GENSPARK_API_KEY__ || '';
}

// ============================
// OpenAI API 호출 헬퍼
// ============================
async function callOpenAI(messages, jsonMode = false) {
  const apiKey = getApiKey();
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;

  const body = {
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch(API_BASE + '/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('API 오류 (' + res.status + '): ' + err);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ============================
// 사이드바 토글
// ============================
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

document.getElementById('sidebarClose').addEventListener('click', closeSidebar);

// ============================
// 탭 전환
// ============================
function switchTab(tabName, btnEl) {
  document.querySelectorAll('.tab-pane').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });

  document.getElementById('tab-' + tabName).classList.add('active');
  if (btnEl) {
    btnEl.classList.add('active');
  } else {
    var el = document.querySelector('[data-tab="' + tabName + '"]');
    if (el) el.classList.add('active');
  }

  closeSidebar();
  if (tabName === 'recipes') render();
  if (tabName === 'favorites') renderFavorites();
  if (tabName === 'add') {
    if (editIndex === null) {
      clearForm();
      document.getElementById('formTitle').textContent = '새 레시피 추가';
      document.getElementById('saveLabel').textContent = '💾 저장하기';
    } else {
      document.getElementById('formTitle').textContent = '레시피 수정';
      document.getElementById('saveLabel').textContent = '✏️ 수정하기';
    }
  }
}
=======
let recipes = JSON.parse(localStorage.getItem("recipes")) || []

function saveRecipe(){

const recipe = {

title: document.getElementById("title").value,
category: document.getElementById("category").value,
tags: document.getElementById("tags").value,
time: document.getElementById("time").value,
level: document.getElementById("level").value,
steps: document.getElementById("steps").value,
content: document.getElementById("content").value

}

recipes.push(recipe)

localStorage.setItem("recipes", JSON.stringify(recipes))

renderRecipes()

}

function renderRecipes(){

const list = document.getElementById("recipeList")

list.innerHTML = ""

recipes.forEach((r,i)=>{

const div = document.createElement("div")
div.className="recipe"

div.innerHTML = `
<h3>${r.title}</h3>
<p>카테고리: ${r.category}</p>
<p>태그: ${r.tags}</p>
<p>시간: ${r.time}</p>
<p>난이도: ${r.level}</p>
<p>${r.content}</p>
<pre>${r.steps}</pre>
<button onclick="deleteRecipe(${i})">삭제</button>
`

list.appendChild(div)

})

}

function deleteRecipe(i){

recipes.splice(i,1)

localStorage.setItem("recipes", JSON.stringify(recipes))

renderRecipes()
>>>>>>> main

// ============================
// 카테고리 필터
// ============================
function filterCategory(cat, btnEl) {
  currentCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
  btnEl.classList.add('active');
  render();
}


// ============================
// 레시피 렌더링
// ============================
function render() {
  var list = document.getElementById('recipeList');
  var search = document.getElementById('search').value.trim().toLowerCase();

  var filtered = recipes.filter(function(r) {
    var matchSearch = r.title.toLowerCase().includes(search)
      || (r.content || '').toLowerCase().includes(search)
      || (r.tags || []).some(function(t) { return t.toLowerCase().includes(search); });
    var matchCat = currentCategory === '전체' || r.category === currentCategory;
    return matchSearch && matchCat;
  });

  list.innerHTML = '';

  if (filtered.length === 0) {
    var msg = (search || currentCategory !== '전체') ? '검색 결과가 없어요' : '아직 레시피가 없어요';
    var sub = (search || currentCategory !== '전체') ? '다른 검색어나 카테고리를 시도해보세요' : '새 레시피를 추가하거나 AI로 만들어보세요!';
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🍽️</div><p>' + msg + '</p><small>' + sub + '</small></div>';
    updateCount();
    return;
  }

  filtered.forEach(function(r) {
    var realIdx = recipes.indexOf(r);
    list.appendChild(createCard(r, realIdx));
  });

  updateCount();
}

function renderFavorites() {
  var fav = document.getElementById('favoriteList');
  var favRecipes = recipes.filter(function(r) { return r.favorite; });

  fav.innerHTML = '';
  if (favRecipes.length === 0) {
    fav.innerHTML = '<div class="empty-state"><div class="empty-icon">⭐</div><p>즐겨찾기한 레시피가 없어요</p><small>레시피 카드의 ⭐ 버튼을 눌러 추가하세요</small></div>';
    return;
  }
  favRecipes.forEach(function(r) {
    var realIdx = recipes.indexOf(r);
    fav.appendChild(createCard(r, realIdx));
  });
}

function updateCount() {
  document.getElementById('recipeCount').textContent = '레시피 ' + recipes.length + '개';
}

function getCategoryEmoji(category) {
  var map = { '한식': '🍚', '양식': '🍝', '디저트': '🧁', '기타': '🍽️' };
  return map[category] || '🍽️';
}

function createCard(r, idx) {
  var div = document.createElement('div');
  div.className = 'recipe-card' + (r.favorite ? ' is-favorite' : '');
  div.onclick = function(e) {
    if (!e.target.closest('.icon-btn')) openModal(idx);
  };

  var tagsHtml = (r.tags || []).filter(function(t) { return t.trim(); }).slice(0, 3)
    .map(function(t) { return '<span class="tag">#' + t.trim() + '</span>'; }).join('');

  div.innerHTML =
    (r.image
      ? '<img class="card-image" src="' + r.image + '" alt="' + r.title + '" loading="lazy">'
      : '<div class="card-image-placeholder">' + getCategoryEmoji(r.category) + '</div>') +
    '<div class="card-body">' +
      '<div class="card-meta">' +
        '<span class="card-category">' + (r.category || '기타') + '</span>' +
        '<span class="card-level">' + (r.level || '') + '</span>' +
      '</div>' +
      '<div class="card-title">' + r.title + '</div>' +
      (r.content ? '<div class="card-desc">' + r.content + '</div>' : '') +
      (tagsHtml ? '<div class="card-tags">' + tagsHtml + '</div>' : '') +
      '<div class="card-footer">' +
        '<div class="card-time">' + (r.time ? '⏱ ' + r.time : '') + '</div>' +
        '<div class="card-actions">' +
          '<button class="icon-btn fav-btn ' + (r.favorite ? 'fav-active' : '') + '"' +
            ' title="' + (r.favorite ? '즐겨찾기 해제' : '즐겨찾기 추가') + '"' +
            ' onclick="event.stopPropagation(); toggleFavorite(' + idx + ')">' +
            (r.favorite ? '★' : '☆') +
          '</button>' +
          '<button class="icon-btn edit-btn" title="수정"' +
            ' onclick="event.stopPropagation(); editRecipe(' + idx + ')">✏️</button>' +
          '<button class="icon-btn delete-btn" title="삭제"' +
            ' onclick="event.stopPropagation(); deleteRecipe(' + idx + ')">🗑️</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  return div;
}

// ============================
// 레시피 저장
// ============================
function saveRecipe() {
  var title = document.getElementById('title').value.trim();
  if (!title) {
    showToast('⚠️ 레시피 이름을 입력해주세요');
    document.getElementById('title').focus();
    return;
  }

  var category = document.getElementById('category').value;
  var time = document.getElementById('time').value.trim();
  var level = document.getElementById('level').value;
  var tags = document.getElementById('tags').value.split(',').map(function(t) { return t.trim(); }).filter(Boolean);
  var ingredients = document.getElementById('ingredients').value.trim();
  var steps = document.getElementById('steps').value.trim();
  var content = document.getElementById('content').value.trim();
  var file = document.getElementById('image').files[0];

  function storeRecipe(img) {
    var recipe = {
      title: title, category: category, time: time, level: level,
      tags: tags, ingredients: ingredients, steps: steps, content: content,
      image: img,
      favorite: editIndex !== null ? recipes[editIndex].favorite : false,
      createdAt: editIndex !== null ? recipes[editIndex].createdAt : Date.now(),
    };

    if (editIndex !== null) {
      recipes[editIndex] = recipe;
      showToast('✅ 레시피가 수정됐어요!');
      editIndex = null;
    } else {
      recipes.unshift(recipe);
      showToast('🎉 레시피가 저장됐어요!');
    }

    localStorage.setItem('recipes', JSON.stringify(recipes));
    render();
    clearForm();
    switchTab('recipes');
  }

  if (file) {
    var reader = new FileReader();
    reader.onload = function(e) { storeRecipe(e.target.result); };
    reader.readAsDataURL(file);
  } else {
    var existing = editIndex !== null ? recipes[editIndex].image : null;
    storeRecipe(existing);
  }
}

// ============================
// 레시피 삭제
// ============================
function deleteRecipe(i) {
  if (!confirm('"' + recipes[i].title + '" 레시피를 삭제할까요?')) return;
  recipes.splice(i, 1);
  localStorage.setItem('recipes', JSON.stringify(recipes));
  render();
  renderFavorites();
  showToast('🗑️ 레시피가 삭제됐어요');
}

// ============================
// 즐겨찾기 토글
// ============================
function toggleFavorite(i) {
  recipes[i].favorite = !recipes[i].favorite;
  localStorage.setItem('recipes', JSON.stringify(recipes));
  render();
  renderFavorites();
  showToast(recipes[i].favorite ? '⭐ 즐겨찾기에 추가됐어요' : '즐겨찾기에서 제거됐어요');
}

// ============================
// 레시피 수정
// ============================
function editRecipe(i) {
  var r = recipes[i];
  editIndex = i;

  document.getElementById('title').value = r.title || '';
  document.getElementById('category').value = r.category || '한식';
  document.getElementById('time').value = r.time || '';
  document.getElementById('level').value = r.level || '쉬움';
  document.getElementById('tags').value = (r.tags || []).join(', ');
  document.getElementById('ingredients').value = r.ingredients || '';
  document.getElementById('steps').value = r.steps || '';
  document.getElementById('content').value = r.content || '';

  if (r.image) {
    var preview = document.getElementById('imagePreview');
    var content = document.getElementById('fileUploadContent');
    preview.src = r.image;
    preview.style.display = 'block';
    content.style.display = 'none';
  }

  switchTab('add');
}

// ============================
// 폼 초기화
// ============================
function clearForm() {
  ['title', 'time', 'tags', 'ingredients', 'steps', 'content'].forEach(function(id) {
    document.getElementById(id).value = '';
  });
  document.getElementById('category').value = '한식';
  document.getElementById('level').value = '쉬움';
  document.getElementById('image').value = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('fileUploadContent').style.display = '';
  editIndex = null;
}

// ============================
// 이미지 미리보기
// ============================
function previewImage(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var preview = document.getElementById('imagePreview');
      var content = document.getElementById('fileUploadContent');
      preview.src = e.target.result;
      preview.style.display = 'block';
      content.style.display = 'none';
    };
    reader.readAsDataURL(input.files[0]);
  }
=======
function searchRecipe(){

const keyword = document.getElementById("search").value.toLowerCase()

const filtered = recipes.filter(r =>
r.title.toLowerCase().includes(keyword) ||
r.tags.toLowerCase().includes(keyword)
)

const list = document.getElementById("recipeList")

list.innerHTML=""

filtered.forEach(r=>{

const div=document.createElement("div")

div.className="recipe"

div.innerHTML=`
<h3>${r.title}</h3>
<p>${r.content}</p>
`

list.appendChild(div)

})

}

async function extractRecipe(){

const url=document.getElementById("recipeUrl").value

const proxy="https://api.allorigins.win/raw?url="

try{

const page=await fetch(proxy+encodeURIComponent(url))
const html=await page.text()

const ai=await fetch("https://api.openai.com/v1/chat/completions",{

method:"POST",

headers:{
"Content-Type":"application/json",
"Authorization":"Bearer YOUR_OPENAI_KEY"
},

body:JSON.stringify({

model:"gpt-4o-mini",

messages:[
{
role:"system",
content:"웹페이지에서 요리 레시피를 찾아 재료, 조리순서, 요약으로 정리해줘."
},
{
role:"user",
content:html.substring(0,7000)
>>>>>>> main
}
]


// ============================
// AI 레시피 생성
// ============================
async function generateRecipe() {
  var ingredients = document.getElementById('aiIngredients').value.trim();
  if (!ingredients) {
    showToast('⚠️ 재료를 입력해주세요');
    document.getElementById('aiIngredients').focus();
    return;
  }

  var btn = document.getElementById('aiBtn');
  var resultDiv = document.getElementById('aiResult');

  btn.disabled = true;
  document.getElementById('aiBtnText').textContent = '⏳ 생성 중...';
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<div class="loading-spinner"><div class="spinner purple"></div><p>AI가 레시피를 만들고 있어요...</p></div>';

  try {
    var systemPrompt = '당신은 전문 요리사이자 레시피 작성 전문가입니다.\n사용자가 제공한 재료로 맛있고 실용적인 레시피를 만들어주세요.\n반드시 다음 JSON 형식으로만 응답하세요:\n{\n  "title": "요리 이름",\n  "category": "한식 또는 양식 또는 디저트 또는 기타",\n  "time": "조리 시간 (예: 30분)",\n  "level": "쉬움 또는 보통 또는 어려움",\n  "tags": ["태그1", "태그2"],\n  "ingredients": ["재료1 (분량)", "재료2 (분량)"],\n  "steps": ["1단계 설명", "2단계 설명"],\n  "tip": "요리 팁이나 주의사항"\n}';

    var userPrompt = '재료: ' + ingredients + '\n위 재료를 활용해 만들 수 있는 레시피를 JSON 형식으로 알려주세요.';

    var raw = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], true);

    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      var jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) data = JSON.parse(jsonMatch[0]);
      else throw new Error('JSON 파싱 실패');
    }

    tempAIRecipe = data;
    renderAIResult(data, resultDiv);

  } catch (err) {
    console.error('AI 생성 오류:', err);
    resultDiv.innerHTML = '<div style="text-align:center;padding:24px;color:var(--gray-500)"><div style="font-size:40px;margin-bottom:12px">😓</div><p style="font-weight:600;margin-bottom:6px">레시피 생성에 실패했어요</p><small style="color:var(--gray-400)">' + err.message + '</small></div>';
  } finally {
    btn.disabled = false;
    document.getElementById('aiBtnText').textContent = '✨ 생성하기';
  }
}

function renderAIResult(data, container) {
  var ingredientsHtml = (data.ingredients || []).map(function(i) {
    return '<li><span style="margin-right:8px">•</span>' + i + '</li>';
  }).join('');

  var stepsHtml = (data.steps || []).map(function(s, idx) {
    return '<li><span class="step-number">' + (idx + 1) + '</span><span style="flex:1;font-size:14px;color:var(--gray-700);padding-top:3px">' + s + '</span></li>';
  }).join('');

  var tagsHtml = (data.tags || []).map(function(t) {
    return '<span class="result-badge">#' + t + '</span>';
  }).join('');

  container.innerHTML =
    '<div class="result-header"><div>' +
    '<div class="result-title">' + (data.title || '레시피') + '</div>' +
    '<div class="result-meta">' +
    '<span class="result-badge">' + (data.category || '기타') + '</span>' +
    (data.time ? '<span class="result-badge">⏱ ' + data.time + '</span>' : '') +
    (data.level ? '<span class="result-badge">' + data.level + '</span>' : '') +
    tagsHtml +
    '</div></div></div>' +
    '<div class="result-section"><div class="result-section-title">🥬 재료</div><ul class="result-list">' + ingredientsHtml + '</ul></div>' +
    '<div class="result-section"><div class="result-section-title">👨‍🍳 조리 순서</div><ul class="result-list steps">' + stepsHtml + '</ul></div>' +
    (data.tip ? '<div class="result-section"><div class="result-section-title">💡 요리 팁</div><div class="result-tip">' + data.tip + '</div></div>' : '') +
    '<button class="save-result-btn" onclick="saveAIRecipe()">💾 이 레시피 저장하기</button>';
}

function saveAIRecipe() {
  var data = tempAIRecipe;
  if (!data) return;

  var recipe = {
    title: data.title || '레시피',
    category: data.category || '기타',
    time: data.time || '',
    level: data.level || '보통',
    tags: data.tags || [],
    ingredients: (data.ingredients || []).join('\n'),
    steps: (data.steps || []).join('\n'),
    content: data.tip || '',
    image: null,
    favorite: false,
    createdAt: Date.now(),
  };

  recipes.unshift(recipe);
  localStorage.setItem('recipes', JSON.stringify(recipes));
  showToast('🎉 AI 레시피가 저장됐어요!');
  document.getElementById('aiIngredients').value = '';
  document.getElementById('aiResult').style.display = 'none';
  tempAIRecipe = null;
  switchTab('recipes');
}

// ============================
// URL에서 레시피 가져오기
// ============================
async function importFromUrl() {
  var url = document.getElementById('recipeUrl').value.trim();
  if (!url) {
    showToast('⚠️ URL을 입력해주세요');
    document.getElementById('recipeUrl').focus();
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showToast('⚠️ 올바른 URL을 입력해주세요 (http:// 또는 https://)');
    return;
  }

  var btn = document.getElementById('urlBtn');
  var resultDiv = document.getElementById('urlResult');

  btn.disabled = true;
  document.getElementById('urlBtnText').textContent = '📡 불러오는 중...';
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<div class="loading-spinner"><div class="spinner green"></div><p>페이지에서 레시피를 분석하고 있어요...</p></div>';

  try {
    var pageContent = '';
    var fetchSuccess = false;

    // allorigins 프록시로 페이지 내용 가져오기 시도
    try {
      var proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
      var proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
      if (proxyRes.ok) {
        var proxyData = await proxyRes.json();
        var parser = new DOMParser();
        var doc = parser.parseFromString(proxyData.contents || '', 'text/html');
        ['script','style','nav','header','footer','aside','iframe'].forEach(function(tag) {
          doc.querySelectorAll(tag).forEach(function(el) { el.remove(); });
        });
        pageContent = (doc.body ? doc.body.innerText || doc.body.textContent : '') || '';
        pageContent = pageContent.replace(/\s+/g, ' ').trim().slice(0, 6000);
        if (pageContent.length > 100) fetchSuccess = true;
      }
    } catch (e) {
      console.warn('프록시 실패:', e.message);
    }

    var systemPrompt = '당신은 웹 페이지에서 요리 레시피를 추출하는 전문가입니다.\n주어진 URL이나 페이지 내용에서 레시피 정보를 추출하여 JSON 형식으로 정리해주세요.\n반드시 다음 JSON 형식으로만 응답하세요:\n{\n  "title": "요리 이름",\n  "category": "한식 또는 양식 또는 디저트 또는 기타",\n  "time": "조리 시간",\n  "level": "쉬움 또는 보통 또는 어려움",\n  "tags": ["태그1", "태그2"],\n  "ingredients": ["재료1 (분량)", "재료2 (분량)"],\n  "steps": ["1단계 설명", "2단계 설명"],\n  "tip": "요리 팁"\n}\n페이지 내용이 없거나 레시피를 찾기 어렵다면 URL을 보고 가능한 레시피를 추론하여 만들어주세요.';

    var userPrompt = fetchSuccess
      ? '다음은 "' + url + '" 페이지의 내용입니다. 레시피를 추출해주세요:\n\n' + pageContent
      : 'URL: ' + url + '\n이 URL에서 레시피를 추출해주세요. 페이지 내용 직접 접근이 불가하니, URL을 분석하여 가능한 레시피 정보를 추론해주세요.';

    var raw = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], true);

    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      var jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) data = JSON.parse(jsonMatch[0]);
      else throw new Error('JSON 파싱 실패');
    }

    data.source = url;
    tempUrlRecipe = data;
    renderUrlResult(data, resultDiv, fetchSuccess);

  } catch (err) {
    console.error('URL 임포트 오류:', err);
    resultDiv.innerHTML = '<div style="text-align:center;padding:24px;color:var(--gray-500)"><div style="font-size:40px;margin-bottom:12px">😓</div><p style="font-weight:600;margin-bottom:6px">레시피 가져오기에 실패했어요</p><small style="color:var(--gray-400)">' + err.message + '</small></div>';
  } finally {
    btn.disabled = false;
    document.getElementById('urlBtnText').textContent = '📥 가져오기';
  }
}

function renderUrlResult(data, container, fromPage) {
  var ingredientsHtml = (data.ingredients || []).map(function(i) {
    return '<li><span style="margin-right:8px">•</span>' + i + '</li>';
  }).join('');

  var stepsHtml = (data.steps || []).map(function(s, idx) {
    return '<li><span class="step-number">' + (idx + 1) + '</span><span style="flex:1;font-size:14px;color:var(--gray-700);padding-top:3px">' + s + '</span></li>';
  }).join('');

  var tagsHtml = (data.tags || []).map(function(t) {
    return '<span class="result-badge">#' + t + '</span>';
  }).join('');

  var sourceLabel = fromPage
    ? '<span style="font-size:12px;color:var(--gray-400)">✅ 페이지에서 직접 추출</span>'
    : '<span style="font-size:12px;color:var(--gray-400)">🤖 AI가 URL을 분석해 생성</span>';

  container.innerHTML =
    '<div class="result-header"><div>' +
    '<div class="result-title">' + (data.title || '레시피') + '</div>' +
    '<div class="result-meta">' +
    '<span class="result-badge">' + (data.category || '기타') + '</span>' +
    (data.time ? '<span class="result-badge">⏱ ' + data.time + '</span>' : '') +
    (data.level ? '<span class="result-badge">' + data.level + '</span>' : '') +
    tagsHtml + '</div>' + sourceLabel + '</div></div>' +
    '<div class="result-section"><div class="result-section-title">🥬 재료</div><ul class="result-list">' + ingredientsHtml + '</ul></div>' +
    '<div class="result-section"><div class="result-section-title">👨‍🍳 조리 순서</div><ul class="result-list steps">' + stepsHtml + '</ul></div>' +
    (data.tip ? '<div class="result-section"><div class="result-section-title">💡 요리 팁</div><div class="result-tip">' + data.tip + '</div></div>' : '') +
    '<button class="save-result-btn" onclick="saveUrlRecipe()">💾 이 레시피 저장하기</button>';
}

function saveUrlRecipe() {
  var data = tempUrlRecipe;
  if (!data) return;

  var recipe = {
    title: data.title || '레시피',
    category: data.category || '기타',
    time: data.time || '',
    level: data.level || '보통',
    tags: data.tags || [],
    ingredients: (data.ingredients || []).join('\n'),
    steps: (data.steps || []).join('\n'),
    content: (data.tip || '') + (data.source ? '\n\n📌 출처: ' + data.source : ''),
    image: null,
    favorite: false,
    createdAt: Date.now(),
  };

  recipes.unshift(recipe);
  localStorage.setItem('recipes', JSON.stringify(recipes));
  showToast('🎉 레시피가 저장됐어요!');
  document.getElementById('recipeUrl').value = '';
  document.getElementById('urlResult').style.display = 'none';
  tempUrlRecipe = null;
  switchTab('recipes');
}

// ============================
// 레시피 상세 모달
// ============================
function openModal(i) {
  var r = recipes[i];
  var modal = document.getElementById('modalContent');
  var overlay = document.getElementById('modalOverlay');

  var ingredientsList = r.ingredients
    ? r.ingredients.split('\n').filter(Boolean)
        .map(function(ing) { return '<div class="ingredient-chip">' + ing + '</div>'; }).join('')
    : '';

  var stepsList = r.steps
    ? r.steps.split('\n').filter(Boolean)
        .map(function(s, idx) {
          return '<li><div class="step-num">' + (idx + 1) + '</div><div class="step-text">' + s.replace(/^\d+\.\s*/, '') + '</div></li>';
        }).join('')
    : '';

  modal.innerHTML =
    (r.image ? '<img class="modal-img" src="' + r.image + '" alt="' + r.title + '">' : '') +
    '<div class="modal-category">' + (r.category || '기타') + '</div>' +
    '<h2 class="modal-title">' + r.title + '</h2>' +
    '<div class="modal-info-row">' +
    (r.time ? '<div class="modal-info-item">⏱ ' + r.time + '</div>' : '') +
    (r.level ? '<div class="modal-info-item">📊 ' + r.level + '</div>' : '') +
    (r.tags || []).filter(function(t) { return t.trim(); }).map(function(t) {
      return '<div class="modal-info-item tag">#' + t.trim() + '</div>';
    }).join('') +
    '</div>' +
    (ingredientsList ? '<div class="modal-divider"></div><div class="modal-section-title">🥬 재료</div><div class="modal-ingredients">' + ingredientsList + '</div>' : '') +
    (stepsList ? '<div class="modal-divider"></div><div class="modal-section-title">👨‍🍳 조리 순서</div><ol class="modal-steps">' + stepsList + '</ol>' : '') +
    (r.content ? '<div class="modal-divider"></div><div class="modal-section-title">📝 설명 / 팁</div><div class="modal-desc">' + r.content.replace(/\n/g, '<br>') + '</div>' : '');

  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
=======
})

})

const data=await ai.json()

document.getElementById("urlResult").innerText =
data.choices[0].message.content

}catch(e){

document.getElementById("urlResult").innerText =
"레시피를 가져오지 못했습니다."

>>>>>>> main
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.body.style.overflow = '';
}


// ============================
// 토스트 알림
// ============================
function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2800);
}
renderRecipes()

document.getElementById("search").addEventListener("input",render)
>>>>>>> main

// ============================
// 키보드 단축키
// ============================
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
    closeSidebar();
  }
});

// ============================
// 초기 렌더링
// ============================
render();
updateCount();
