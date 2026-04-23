/* ================================================
   나만의 레시피 노트 - script.js
   - 레시피 CRUD (클라우드 스토리지 - 공유 저장소)
   - AI 레시피 생성 (Anthropic Claude API)
   - URL에서 레시피 자동 추출 (유튜브 / 블로그)
   - 카테고리 필터, 즐겨찾기, 검색
================================================ */

// ============================
// 상태
// ============================
let recipes = JSON.parse(localStorage.getItem('recipes')) || [];
let editIndex = null;
let currentCategory = '전체';
let tempAIRecipe = null;
let tempUrlRecipe = null;

// ============================
// localStorage 저장
// ============================
function saveToStorage() {
  localStorage.setItem('recipes', JSON.stringify(recipes));
}

// ============================
// AI API 호출 (OpenRouter - CORS 허용)
// ============================
const OR_KEY = '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';
const OR_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callClaude(messages, systemPrompt) {
  const response = await fetch(OR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + OR_KEY,
      'HTTP-Referer': 'https://kjisun0215-svg.github.io/recipe-note/',
      'X-Title': 'Recipe Note',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-8b-instruct:free',
      temperature: 0.7,
      max_tokens: 2000,
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('API 오류 (' + response.status + '): ' + err);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================
// 유튜브 URL 감지 & 임베드 ID 추출
// ============================
function getYoutubeId(url) {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isYoutubeUrl(url) {
  return /youtu\.be|youtube\.com/.test(url);
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
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById('tab-' + tabName).classList.add('active');
  if (btnEl) {
    btnEl.classList.add('active');
  } else {
    const el = document.querySelector('[data-tab="' + tabName + '"]');
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

// ============================
// 카테고리 필터
// ============================
function filterCategory(cat, btnEl) {
  currentCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
  render();
}

// ============================
// 레시피 렌더링
// ============================
function render() {
  const list = document.getElementById('recipeList');
  const search = document.getElementById('search').value.trim().toLowerCase();

  const filtered = recipes.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search)
      || (r.content || '').toLowerCase().includes(search)
      || (r.tags || []).some(t => t.toLowerCase().includes(search));
    const matchCat = currentCategory === '전체' || r.category === currentCategory;
    return matchSearch && matchCat;
  });

  list.innerHTML = '';

  if (filtered.length === 0) {
    const msg = (search || currentCategory !== '전체') ? '검색 결과가 없어요' : '아직 레시피가 없어요';
    const sub = (search || currentCategory !== '전체') ? '다른 검색어나 카테고리를 시도해보세요' : '새 레시피를 추가하거나 AI로 만들어보세요!';
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🍽️</div><p>' + msg + '</p><small>' + sub + '</small></div>';
    updateCount();
    return;
  }

  filtered.forEach(r => {
    const realIdx = recipes.indexOf(r);
    list.appendChild(createCard(r, realIdx));
  });

  updateCount();
}

function renderFavorites() {
  const fav = document.getElementById('favoriteList');
  const favRecipes = recipes.filter(r => r.favorite);

  fav.innerHTML = '';
  if (favRecipes.length === 0) {
    fav.innerHTML = '<div class="empty-state"><div class="empty-icon">⭐</div><p>즐겨찾기한 레시피가 없어요</p><small>레시피 카드의 ⭐ 버튼을 눌러 추가하세요</small></div>';
    return;
  }
  favRecipes.forEach(r => {
    const realIdx = recipes.indexOf(r);
    fav.appendChild(createCard(r, realIdx));
  });
}

function updateCount() {
  document.getElementById('recipeCount').textContent = '레시피 ' + recipes.length + '개';
}

function getCategoryEmoji(category) {
  const map = { '한식': '🍚', '양식': '🍝', '디저트': '🧁', '기타': '🍽️' };
  return map[category] || '🍽️';
}

function createCard(r, idx) {
  const div = document.createElement('div');
  div.className = 'recipe-card' + (r.favorite ? ' is-favorite' : '');
  div.onclick = e => { if (!e.target.closest('.icon-btn')) openModal(idx); };

  const tagsHtml = (r.tags || []).filter(t => t.trim()).slice(0, 3)
    .map(t => '<span class="tag">#' + t.trim() + '</span>').join('');

  // URL 뱃지 표시
  const urlBadge = r.sourceUrl
    ? '<span class="card-url-badge">' + (isYoutubeUrl(r.sourceUrl) ? '▶ 유튜브' : '🔗 링크') + '</span>'
    : '';

  div.innerHTML =
    (r.image
      ? '<img class="card-image" src="' + r.image + '" alt="' + r.title + '" loading="lazy">'
      : '<div class="card-image-placeholder">' + getCategoryEmoji(r.category) + '</div>') +
    '<div class="card-body">' +
      '<div class="card-meta">' +
        '<span class="card-category">' + (r.category || '기타') + '</span>' +
        '<span class="card-level">' + (r.level || '') + '</span>' +
        urlBadge +
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
  const title = document.getElementById('title').value.trim();
  if (!title) {
    showToast('⚠️ 레시피 이름을 입력해주세요');
    document.getElementById('title').focus();
    return;
  }

  const category = document.getElementById('category').value;
  const time = document.getElementById('time').value.trim();
  const level = document.getElementById('level').value;
  const tags = document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const ingredients = document.getElementById('ingredients').value.trim();
  const steps = document.getElementById('steps').value.trim();
  const content = document.getElementById('content').value.trim();
  const sourceUrl = document.getElementById('sourceUrl').value.trim();
  const file = document.getElementById('image').files[0];

  function storeRecipe(img) {
    const recipe = {
      title, category, time, level, tags, ingredients, steps, content,
      sourceUrl: sourceUrl || null,
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

    saveToStorage();
    render();
    clearForm();
    switchTab('recipes');
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = e => storeRecipe(e.target.result);
    reader.readAsDataURL(file);
  } else {
    const existing = editIndex !== null ? recipes[editIndex].image : null;
    storeRecipe(existing);
  }
}

// ============================
// 레시피 삭제
// ============================
function deleteRecipe(i) {
  if (!confirm('"' + recipes[i].title + '" 레시피를 삭제할까요?')) return;
  recipes.splice(i, 1);
  saveToStorage();
  render();
  renderFavorites();
  showToast('🗑️ 레시피가 삭제됐어요');
}

// ============================
// 즐겨찾기 토글
// ============================
function toggleFavorite(i) {
  recipes[i].favorite = !recipes[i].favorite;
  saveToStorage();
  render();
  renderFavorites();
  showToast(recipes[i].favorite ? '⭐ 즐겨찾기에 추가됐어요' : '즐겨찾기에서 제거됐어요');
}

// ============================
// 레시피 수정
// ============================
function editRecipe(i) {
  const r = recipes[i];
  editIndex = i;

  document.getElementById('title').value = r.title || '';
  document.getElementById('category').value = r.category || '한식';
  document.getElementById('time').value = r.time || '';
  document.getElementById('level').value = r.level || '쉬움';
  document.getElementById('tags').value = (r.tags || []).join(', ');
  document.getElementById('ingredients').value = r.ingredients || '';
  document.getElementById('steps').value = r.steps || '';
  document.getElementById('content').value = r.content || '';
  document.getElementById('sourceUrl').value = r.sourceUrl || '';

  if (r.image) {
    const preview = document.getElementById('imagePreview');
    const uploadContent = document.getElementById('fileUploadContent');
    preview.src = r.image;
    preview.style.display = 'block';
    uploadContent.style.display = 'none';
  }

  switchTab('add');
}

// ============================
// 폼 초기화
// ============================
function clearForm() {
  ['title', 'time', 'tags', 'ingredients', 'steps', 'content', 'sourceUrl'].forEach(id => {
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
    const reader = new FileReader();
    reader.onload = e => {
      const preview = document.getElementById('imagePreview');
      const uploadContent = document.getElementById('fileUploadContent');
      preview.src = e.target.result;
      preview.style.display = 'block';
      uploadContent.style.display = 'none';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// ============================
// AI 레시피 생성 (Anthropic API)
// ============================
async function generateRecipe() {
  const ingredients = document.getElementById('aiIngredients').value.trim();
  if (!ingredients) {
    showToast('⚠️ 재료를 입력해주세요');
    document.getElementById('aiIngredients').focus();
    return;
  }

  const btn = document.getElementById('aiBtn');
  const resultDiv = document.getElementById('aiResult');

  btn.disabled = true;
  document.getElementById('aiBtnText').textContent = '⏳ 생성 중...';
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<div class="loading-spinner"><div class="spinner purple"></div><p>AI가 레시피를 만들고 있어요...</p></div>';

  try {
    const systemPrompt = `당신은 전문 요리사이자 레시피 작성 전문가입니다.
사용자가 제공한 재료로 맛있고 실용적인 레시피를 만들어주세요.
반드시 다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "title": "요리 이름",
  "category": "한식 또는 양식 또는 디저트 또는 기타",
  "time": "조리 시간 (예: 30분)",
  "level": "쉬움 또는 보통 또는 어려움",
  "tags": ["태그1", "태그2"],
  "ingredients": ["재료1 (분량)", "재료2 (분량)"],
  "steps": ["1단계 설명", "2단계 설명"],
  "tip": "요리 팁이나 주의사항"
}`;

    const raw = await callClaude(
      [{ role: 'user', content: '재료: ' + ingredients + '\n위 재료를 활용해 만들 수 있는 레시피를 JSON 형식으로 알려주세요.' }],
      systemPrompt
    );

    let data;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      data = JSON.parse(clean);
    } catch (e) {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) data = JSON.parse(jsonMatch[0]);
      else throw new Error('응답 파싱 실패');
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
  const ingredientsHtml = (data.ingredients || []).map(i =>
    '<li><span style="margin-right:8px">•</span>' + i + '</li>'
  ).join('');

  const stepsHtml = (data.steps || []).map((s, idx) =>
    '<li><span class="step-number">' + (idx + 1) + '</span><span style="flex:1;font-size:14px;color:var(--gray-700);padding-top:3px">' + s + '</span></li>'
  ).join('');

  const tagsHtml = (data.tags || []).map(t =>
    '<span class="result-badge">#' + t + '</span>'
  ).join('');

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
  const data = tempAIRecipe;
  if (!data) return;

  const recipe = {
    title: data.title || '레시피',
    category: data.category || '기타',
    time: data.time || '',
    level: data.level || '보통',
    tags: data.tags || [],
    ingredients: (data.ingredients || []).join('\n'),
    steps: (data.steps || []).join('\n'),
    content: data.tip || '',
    sourceUrl: null,
    image: null,
    favorite: false,
    createdAt: Date.now(),
  };

  recipes.unshift(recipe);
  saveToStorage();
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
  const url = document.getElementById('recipeUrl').value.trim();
  if (!url) {
    showToast('⚠️ URL을 입력해주세요');
    document.getElementById('recipeUrl').focus();
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showToast('⚠️ 올바른 URL을 입력해주세요 (http:// 또는 https://)');
    return;
  }

  const btn = document.getElementById('urlBtn');
  const resultDiv = document.getElementById('urlResult');
  const isYoutube = isYoutubeUrl(url);

  btn.disabled = true;
  document.getElementById('urlBtnText').textContent = '📡 분석 중...';
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<div class="loading-spinner"><div class="spinner green"></div><p>' +
    (isYoutube ? '유튜브 영상을 분석하고 있어요...' : '페이지에서 레시피를 분석하고 있어요...') +
    '</p></div>';

  try {
    let pageContent = '';
    let fetchSuccess = false;

    if (!isYoutube) {
      // 블로그/사이트: allorigins 프록시로 내용 가져오기
      try {
        const proxyRes = await fetch(
          'https://api.allorigins.win/get?url=' + encodeURIComponent(url),
          { signal: AbortSignal.timeout(12000) }
        );
        if (proxyRes.ok) {
          const proxyData = await proxyRes.json();
          const parser = new DOMParser();
          const doc = parser.parseFromString(proxyData.contents || '', 'text/html');
          ['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe'].forEach(tag => {
            doc.querySelectorAll(tag).forEach(el => el.remove());
          });
          pageContent = (doc.body ? doc.body.innerText || doc.body.textContent : '') || '';
          pageContent = pageContent.replace(/\s+/g, ' ').trim().slice(0, 5000);
          if (pageContent.length > 100) fetchSuccess = true;
        }
      } catch (e) {
        console.warn('페이지 fetch 실패:', e.message);
      }
    }

    const systemPrompt = `당신은 요리 레시피를 추출하는 전문가입니다.
주어진 URL 또는 페이지 내용에서 레시피를 추출해 JSON으로 정리해주세요.
반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "title": "요리 이름",
  "category": "한식 또는 양식 또는 디저트 또는 기타",
  "time": "조리 시간",
  "level": "쉬움 또는 보통 또는 어려움",
  "tags": ["태그1", "태그2"],
  "ingredients": ["재료1 (분량)", "재료2 (분량)"],
  "steps": ["1단계 설명", "2단계 설명"],
  "tip": "요리 팁"
}
레시피를 찾기 어렵다면 URL을 분석해 합리적으로 추론해 주세요.`;

    let userPrompt;
    if (isYoutube) {
      userPrompt = '유튜브 URL: ' + url + '\n이 유튜브 영상의 제목/URL을 보고 해당 요리 레시피를 추론해 JSON으로 작성해주세요.';
    } else if (fetchSuccess) {
      userPrompt = '"' + url + '" 페이지 내용입니다. 레시피를 추출해주세요:\n\n' + pageContent;
    } else {
      userPrompt = 'URL: ' + url + '\n이 URL에서 레시피를 추출해주세요. 직접 접근이 불가하니 URL을 분석해 추론해주세요.';
    }

    const raw = await callClaude([{ role: 'user', content: userPrompt }], systemPrompt);

    let data;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      data = JSON.parse(clean);
    } catch (e) {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) data = JSON.parse(jsonMatch[0]);
      else throw new Error('응답 파싱 실패');
    }

    data.sourceUrl = url;
    data.isYoutube = isYoutube;
    data.youtubeId = isYoutube ? getYoutubeId(url) : null;
    tempUrlRecipe = data;
    renderUrlResult(data, resultDiv, fetchSuccess || isYoutube);

  } catch (err) {
    console.error('URL 임포트 오류:', err);
    resultDiv.innerHTML = '<div style="text-align:center;padding:24px;color:var(--gray-500)"><div style="font-size:40px;margin-bottom:12px">😓</div><p style="font-weight:600;margin-bottom:6px">레시피 가져오기에 실패했어요</p><small style="color:var(--gray-400)">' + err.message + '</small></div>';
  } finally {
    btn.disabled = false;
    document.getElementById('urlBtnText').textContent = '📥 가져오기';
  }
}

function renderUrlResult(data, container, fromPage) {
  const ingredientsHtml = (data.ingredients || []).map(i =>
    '<li><span style="margin-right:8px">•</span>' + i + '</li>'
  ).join('');

  const stepsHtml = (data.steps || []).map((s, idx) =>
    '<li><span class="step-number">' + (idx + 1) + '</span><span style="flex:1;font-size:14px;color:var(--gray-700);padding-top:3px">' + s + '</span></li>'
  ).join('');

  const tagsHtml = (data.tags || []).map(t =>
    '<span class="result-badge">#' + t + '</span>'
  ).join('');

  // 유튜브 임베드
  const youtubeEmbed = data.youtubeId
    ? '<div class="youtube-embed-wrap"><iframe src="https://www.youtube.com/embed/' + data.youtubeId +
      '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
    : '';

  // 출처 링크
  const sourceLink = data.sourceUrl
    ? '<a class="source-link" href="' + data.sourceUrl + '" target="_blank" rel="noopener">' +
      (data.isYoutube ? '▶ 유튜브에서 보기' : '🔗 원문 보러가기') + '</a>'
    : '';

  const statusLabel = data.isYoutube
    ? '<span class="extract-label youtube-label">▶ 유튜브 영상</span>'
    : fromPage
      ? '<span class="extract-label">✅ 페이지에서 직접 추출</span>'
      : '<span class="extract-label">🤖 AI가 URL 분석해 생성</span>';

  container.innerHTML =
    youtubeEmbed +
    '<div class="result-header"><div>' +
    '<div class="result-title">' + (data.title || '레시피') + '</div>' +
    '<div class="result-meta">' +
    '<span class="result-badge">' + (data.category || '기타') + '</span>' +
    (data.time ? '<span class="result-badge">⏱ ' + data.time + '</span>' : '') +
    (data.level ? '<span class="result-badge">' + data.level + '</span>' : '') +
    tagsHtml + '</div>' +
    statusLabel +
    (sourceLink ? '<div style="margin-top:8px">' + sourceLink + '</div>' : '') +
    '</div></div>' +
    '<div class="result-section"><div class="result-section-title">🥬 재료</div><ul class="result-list">' + ingredientsHtml + '</ul></div>' +
    '<div class="result-section"><div class="result-section-title">👨‍🍳 조리 순서</div><ul class="result-list steps">' + stepsHtml + '</ul></div>' +
    (data.tip ? '<div class="result-section"><div class="result-section-title">💡 요리 팁</div><div class="result-tip">' + data.tip + '</div></div>' : '') +
    '<button class="save-result-btn" onclick="saveUrlRecipe()">💾 이 레시피 저장하기</button>';
}

function saveUrlRecipe() {
  const data = tempUrlRecipe;
  if (!data) return;

  const recipe = {
    title: data.title || '레시피',
    category: data.category || '기타',
    time: data.time || '',
    level: data.level || '보통',
    tags: data.tags || [],
    ingredients: (data.ingredients || []).join('\n'),
    steps: (data.steps || []).join('\n'),
    content: data.tip || '',
    sourceUrl: data.sourceUrl || null,
    image: null,
    favorite: false,
    createdAt: Date.now(),
  };

  recipes.unshift(recipe);
  saveToStorage();
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
  const r = recipes[i];
  const modal = document.getElementById('modalContent');
  const overlay = document.getElementById('modalOverlay');

  const ingredientsList = r.ingredients
    ? r.ingredients.split('\n').filter(Boolean)
        .map(ing => '<div class="ingredient-chip">' + ing + '</div>').join('')
    : '';

  const stepsList = r.steps
    ? r.steps.split('\n').filter(Boolean)
        .map((s, idx) =>
          '<li><div class="step-num">' + (idx + 1) + '</div><div class="step-text">' + s.replace(/^\d+\.\s*/, '') + '</div></li>'
        ).join('')
    : '';

  // 유튜브 임베드 or 블로그 링크
  let mediaSection = '';
  if (r.sourceUrl) {
    const ytId = isYoutubeUrl(r.sourceUrl) ? getYoutubeId(r.sourceUrl) : null;
    if (ytId) {
      mediaSection = '<div class="modal-divider"></div><div class="modal-section-title">▶ 참고 영상</div>' +
        '<div class="youtube-embed-wrap"><iframe src="https://www.youtube.com/embed/' + ytId +
        '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
    } else {
      mediaSection = '<div class="modal-divider"></div>' +
        '<a class="source-link modal-source-link" href="' + r.sourceUrl + '" target="_blank" rel="noopener">🔗 원문 링크 보러가기</a>';
    }
  }

  modal.innerHTML =
    (r.image ? '<img class="modal-img" src="' + r.image + '" alt="' + r.title + '">' : '') +
    '<div class="modal-category">' + (r.category || '기타') + '</div>' +
    '<h2 class="modal-title">' + r.title + '</h2>' +
    '<div class="modal-info-row">' +
    (r.time ? '<div class="modal-info-item">⏱ ' + r.time + '</div>' : '') +
    (r.level ? '<div class="modal-info-item">📊 ' + r.level + '</div>' : '') +
    (r.tags || []).filter(t => t.trim()).map(t =>
      '<div class="modal-info-item tag">#' + t.trim() + '</div>'
    ).join('') +
    '</div>' +
    (ingredientsList ? '<div class="modal-divider"></div><div class="modal-section-title">🥬 재료</div><div class="modal-ingredients">' + ingredientsList + '</div>' : '') +
    (stepsList ? '<div class="modal-divider"></div><div class="modal-section-title">👨‍🍳 조리 순서</div><ol class="modal-steps">' + stepsList + '</ol>' : '') +
    (r.content ? '<div class="modal-divider"></div><div class="modal-section-title">📝 설명 / 팁</div><div class="modal-desc">' + r.content.replace(/\n/g, '<br>') + '</div>' : '') +
    mediaSection;

  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

// ============================
// 토스트 알림
// ============================
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ============================
// 키보드 단축키
// ============================
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeSidebar(); }
});

// ============================
// 초기 렌더링
// ============================
render();
updateCount();
