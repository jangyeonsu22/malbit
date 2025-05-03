const situationInput = document.getElementById('situation');
const targetInput = document.getElementById('target');
const modeSelect = document.getElementById('mode');
const toneStyleSelect = document.getElementById('toneStyle');
const inputTextArea = document.getElementById('inputText');
const inputTextLabel = document.getElementById('inputTextLabel');
const useAdvancedCheckbox = document.getElementById('useAdvanced');
const responseLengthSelect = document.getElementById('responseLength');
const remainingCountElement = document.getElementById('remainingCount');
const transformButton = document.getElementById('transformButton');
const loadingElement = document.querySelector('.loading');
const resultElement = document.querySelector('.result');
const resultTextElement = document.querySelector('.result p');
const copyButton = document.querySelector('.copy-btn');
const voteButtons = document.querySelectorAll('.vote-btn');
const historySection = document.querySelector('.history-section');
const historyList = document.getElementById('historyList');
const clearHistoryButton = document.getElementById('clearHistory');
const addFavoriteBtn = document.getElementById('addFavoriteBtn');
const favoriteCombinations = document.getElementById('favoriteCombinations');
const toneStyleTooltip = document.getElementById('toneStyleTooltip');
const feedbackText = document.getElementById('feedbackText');
const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');

const MAX_ADVANCED_USES = 5;
const STORAGE_KEYS = {
  HISTORY: 'malbit_history',
  REMAINING_USES: 'malbit_remaining_uses',
  FAVORITES: 'malbit_favorites',
  PREFERENCES: 'malbit_preferences'
};

let history = [];
let favorites = [];
let remainingAdvancedUses = MAX_ADVANCED_USES;

function init() {
  loadHistory();
  loadRemainingUses();
  loadFavorites();
  loadPreferences();
  updateRemainingCount();
  updateModeLabel();
  renderFavorites();
  setupTooltips();
  
  modeSelect.addEventListener('change', () => {
    updateModeLabel();
    savePreferences();
  });
  
  toneStyleSelect.addEventListener('change', savePreferences);
  transformButton.addEventListener('click', handleTransform);
  copyButton.addEventListener('click', copyResult);
  clearHistoryButton.addEventListener('click', clearHistory);
  addFavoriteBtn.addEventListener('click', addFavorite);
  submitFeedbackBtn.addEventListener('click', submitFeedback);
  
  voteButtons.forEach(button => {
    button.addEventListener('click', () => handleVote(button.textContent.includes('좋아요')));
  });
}

function setupTooltips() {
  const options = toneStyleSelect.querySelectorAll('option');
  
  toneStyleSelect.addEventListener('mouseover', (e) => {
    const selectedOption = toneStyleSelect.options[toneStyleSelect.selectedIndex];
    const tooltip = selectedOption.getAttribute('data-tooltip');
    
    if (tooltip) {
      toneStyleTooltip.textContent = tooltip;
      toneStyleTooltip.style.display = 'block';
    }
  });
  
  toneStyleSelect.addEventListener('mouseout', () => {
    toneStyleTooltip.style.display = 'none';
  });
}

function updateModeLabel() {
  if (modeSelect.value === 'answer') {
    inputTextLabel.textContent = '질문:';
    inputTextArea.placeholder = '예: 이번 프로젝트 언제까지 마무리해야 하나요?';
  } else if (modeSelect.value === 'refine') {
    inputTextLabel.textContent = '답변:';
    inputTextArea.placeholder = '예: 지금은 어렵습니다. 다음에 다시 요청해주세요.';
  }
}

function addFavorite() {
  const situation = situationInput.value.trim();
  const target = targetInput.value.trim();
  
  if (!situation || !target) {
    alert('상황/장소와 대상/관계를 모두 입력해주세요.');
    return;
  }
  
  const exists = favorites.some(fav => 
    fav.situation === situation && fav.target === target
  );
  
  if (exists) {
    alert('이미 즐겨찾기에 추가된 조합입니다.');
    return;
  }
  
  favorites.push({ situation, target });
  saveFavorites();
  renderFavorites();
}

function renderFavorites() {
  favoriteCombinations.innerHTML = '';
  
  favorites.forEach((fav, index) => {
    const favoriteItem = document.createElement('div');
    favoriteItem.className = 'favorite-item';
    favoriteItem.innerHTML = `
      ${fav.situation} / ${fav.target}
      <span class="remove-favorite" data-index="${index}">×</span>
    `;
    
    favoriteItem.querySelector('.remove-favorite').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFavorite(index);
    });
    
    favoriteItem.addEventListener('click', () => {
      applyFavorite(fav);
    });
    
    favoriteCombinations.appendChild(favoriteItem);
  });
}

function removeFavorite(index) {
  favorites.splice(index, 1);
  saveFavorites();
  renderFavorites();
}

function applyFavorite(favorite) {
  situationInput.value = favorite.situation;
  targetInput.value = favorite.target;
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
}

function loadFavorites() {
  const savedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
  if (savedFavorites) {
    favorites = JSON.parse(savedFavorites);
  }
}

function savePreferences() {
  const preferences = {
    mode: modeSelect.value,
    toneStyle: toneStyleSelect.value
  };
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
}

function loadPreferences() {
  const savedPreferences = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
  if (savedPreferences) {
    const preferences = JSON.parse(savedPreferences);
    modeSelect.value = preferences.mode || 'answer';
    toneStyleSelect.value = preferences.toneStyle || 'firm';
  }
}

function submitFeedback() {
  const feedback = feedbackText.value.trim();
  if (feedback) {
    alert('피드백을 보내주셔서 감사합니다. 더 나은 서비스를 위해 노력하겠습니다.');
    feedbackText.value = '';
  } else {
    alert('피드백 내용을 입력해주세요.');
  }
}

function handleTransform() {
  const situation = situationInput.value.trim();
  const target = targetInput.value.trim();
  const mode = modeSelect.value;
  const toneStyle = toneStyleSelect.value;
  const inputText = inputTextArea.value.trim();
  const useAdvanced = useAdvancedCheckbox.checked;
  const responseLength = responseLengthSelect.value;
  
  if (!situation || !target || !inputText) {
    alert('모든 필드를 입력해주세요.');
    return;
  }
  
  if (useAdvanced && remainingAdvancedUses <= 0) {
    alert('고급 변환 무료 사용 횟수를 모두 소진하셨습니다.');
    useAdvancedCheckbox.checked = false;
    return;
  }
  
  loadingElement.style.display = 'block';
  resultElement.style.display = 'none';
  
  fetch('/api/transform', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      situation,
      target,
      mode,
      toneStyle,
      inputText,
      useAdvanced,
      responseLength
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('서버 응답 오류');
    }
    return response.json();
  })
  .then(data => {
    processResult(data.result, situation, target, mode, toneStyle, inputText, useAdvanced);
  })
  .catch(error => {
    console.error('API 호출 실패:', error);
    setTimeout(() => {
      const result = generateResponse(situation, target, mode, toneStyle, inputText, useAdvanced, responseLength);
      processResult(result, situation, target, mode, toneStyle, inputText, useAdvanced);
    }, 1000);
  });
}

function processResult(result, situation, target, mode, toneStyle, inputText, useAdvanced) {
  if (useAdvanced) {
    remainingAdvancedUses--;
    saveRemainingUses();
    updateRemainingCount();
  }
  
  resultTextElement.textContent = result;
  loadingElement.style.display = 'none';
  resultElement.style.display = 'block';
  
  addToHistory(situation, target, mode, toneStyle, inputText, result);
  
  historySection.style.display = 'block';
}

function generateResponse(situation, target, mode, toneStyle, inputText, useAdvanced, responseLength) {
  let response = '';
  const maxLength = parseInt(responseLength);
  
  if (mode === 'answer') {
    switch (toneStyle) {
      case 'polite':
        response = `질문해 주셔서 감사합니다. ${inputText}에 대한 답변을 드리자면, `;
        if (situation === '회사' && target === '상사') {
          response += '가능한 일정을 확인하여 조율해 보겠습니다.';
        } else {
          response += '세부 사항을 고려하여 답변 드리겠습니다.';
        }
        break;
      case 'business':
        response = `${target}님의 "${inputText}" 질문에 답변드립니다. `;
        response += '해당 사항은 확인 후 진행하겠습니다.';
        break;
      case 'firm':
        response = `${inputText}에 대해 말씀드리자면, `;
        response += '가능한 빠른 시일 내에 처리하겠습니다.';
        break;
      case 'rude':
        response = `그런 질문도 하냐? ${inputText}? `;
        response += '알아서 처리할게.';
        break;
      default:
        response = `${inputText}에 대한 답변입니다.`;
    }
  } else if (mode === 'refine') {
    switch (toneStyle) {
      case 'polite':
        response = inputText.replace(/어렵습니다|안됩니다|불가능합니다/g, '현재로서는 조율이 필요할 것 같습니다');
        response = response.replace(/싫어요|싫습니다|안해요/g, '다른 방안을 고려해보는 것이 좋을 것 같습니다');
        break;
      case 'business':
        response = `검토 결과, ${inputText.toLowerCase().replace(/\.$/, '')}라는 결론에 도달했습니다.`;
        break;
      case 'firm':
        response = `${target}님, ${inputText.toLowerCase().replace(/\.$/, '')}는 점 양해 부탁드립니다.`;
        break;
      case 'rude':
        response = `그냥 ${inputText.toLowerCase().replace(/\.$/, '')}니까 더 묻지마.`;
        break;
      default:
        response = `${inputText}를 다듬었습니다.`;
    }
  }
  
  if (useAdvanced) {
    response = response.replace('AI 기반 고급 변환 기능을 사용하여 생성되었습니다.', '');
    response += ` ${situation}에서 ${target}과의 관계를 고려했습니다.`;
  }
  
  if (response.length > maxLength) {
    response = response.substring(0, maxLength) + '...';
  }
  
  return response;
}

function copyResult() {
  const textToCopy = resultTextElement.textContent;
  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      const originalText = copyButton.textContent;
      copyButton.textContent = '복사 완료!';
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 2000);
    })
    .catch(err => {
      console.error('클립보드 복사 실패:', err);
      alert('클립보드 복사에 실패했습니다.');
    });
}

function handleVote(isPositive) {
  feedbackText.style.display = 'block';
  submitFeedbackBtn.style.display = 'block';
  alert(isPositive ? '피드백 감사합니다! 더 좋은 서비스로 보답하겠습니다.' : '불편을 드려 죄송합니다. 더 나은 서비스가 되도록 노력하겠습니다.');
}

function addToHistory(situation, target, mode, toneStyle, inputText, result) {
  const timestamp = new Date().toLocaleString('ko-KR');
  const historyItem = {
    id: Date.now(),
    timestamp,
    situation,
    target,
    mode,
    toneStyle,
    inputText,
    result
  };
  
  history.unshift(historyItem); // Add to beginning
  
  if (history.length > 10) {
    history = history.slice(0, 10);
  }
  
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';
  
  history.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    let modeText;
    if (item.mode === 'answer') {
      modeText = '질문 답변';
    } else if (item.mode === 'refine') {
      modeText = '답변 다듬기';
    } else {
      modeText = '변환';
    }
    
    const toneText = getToneStyleText(item.toneStyle);
    
    historyItem.innerHTML = `
      <div class="history-item-header">
        <span>${item.timestamp}</span>
        <div>
          <span>${item.situation} / ${item.target} / ${toneText} / ${modeText}</span>
          <button class="delete-history-btn" data-id="${item.id}">삭제</button>
        </div>
      </div>
      <div class="history-item-content">${item.inputText}</div>
      <div class="history-item-result">${item.result}</div>
    `;
    
    historyList.appendChild(historyItem);
  });
  
  document.querySelectorAll('.delete-history-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteHistoryItem(button.getAttribute('data-id'));
    });
  });
}

function deleteHistoryItem(id) {
  id = parseInt(id);
  history = history.filter(item => item.id !== id);
  saveHistory();
  renderHistory();
  
  if (history.length === 0) {
    historySection.style.display = 'none';
  }
}

function getToneStyleText(toneStyle) {
  switch (toneStyle) {
    case 'polite': return '공손하고 친절';
    case 'business': return '비즈니스 격식';
    case 'firm': return '단호하지만 정중';
    case 'rude': return '싸가지';
    default: return toneStyle;
  }
}

function clearHistory() {
  if (confirm('정말 모든 기록을 삭제하시겠습니까?')) {
    history = [];
    saveHistory();
    renderHistory();
    historySection.style.display = 'none';
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
}

function loadHistory() {
  const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
  if (savedHistory) {
    history = JSON.parse(savedHistory);
    renderHistory();
    historySection.style.display = history.length > 0 ? 'block' : 'none';
  }
}

function saveRemainingUses() {
  localStorage.setItem(STORAGE_KEYS.REMAINING_USES, remainingAdvancedUses.toString());
}

function loadRemainingUses() {
  remainingAdvancedUses = MAX_ADVANCED_USES;
  // localStorage에서 기존 값 제거
  localStorage.removeItem(STORAGE_KEYS.REMAINING_USES);
}

function updateRemainingCount() {
  remainingCountElement.textContent = `남은 횟수: ${remainingAdvancedUses}/${MAX_ADVANCED_USES}`;
}

document.addEventListener('DOMContentLoaded', init);
