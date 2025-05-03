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
const feedbackTextArea = document.getElementById('feedbackText');
const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
const addFavoriteBtn = document.getElementById('addFavoriteBtn');
const favoriteCombinations = document.getElementById('favoriteCombinations');
const toneStyleTooltip = document.getElementById('toneStyleTooltip');

const MAX_ADVANCED_USES = 5;
const STORAGE_KEYS = {
  HISTORY: 'malbit_history',
  REMAINING_USES: 'malbit_remaining_uses',
  FAVORITES: 'malbit_favorites',
  USER_PREFERENCES: 'malbit_user_preferences'
};

let history = [];
let remainingAdvancedUses = MAX_ADVANCED_USES;
let favorites = [];
let userPreferences = {};

function init() {
  loadHistory();
  loadRemainingUses();
  loadFavorites();
  loadUserPreferences();
  updateRemainingCount();
  updateModeLabel();
  renderFavorites();
  
  modeSelect.addEventListener('change', updateModeLabel);
  transformButton.addEventListener('click', handleTransform);
  copyButton.addEventListener('click', copyResult);
  clearHistoryButton.addEventListener('click', clearHistory);
  addFavoriteBtn.addEventListener('click', addToFavorites);
  submitFeedbackBtn.addEventListener('click', submitFeedback);
  
  toneStyleSelect.addEventListener('change', updateToneStyleTooltip);
  toneStyleSelect.addEventListener('mouseover', showToneStyleTooltip);
  toneStyleSelect.addEventListener('mouseout', hideToneStyleTooltip);
  
  applyUserPreferences();
  
  voteButtons.forEach(button => {
    button.addEventListener('click', () => handleVote(button.textContent.includes('좋아요')));
  });
  
  updateToneStyleTooltip();
}

function updateModeLabel() {
  const mode = modeSelect.value;
  inputTextLabel.textContent = mode === 'answer' ? '질문:' : (mode === 'refine' ? '답변:' : '텍스트:');
  
  if (mode === 'answer') {
    inputTextArea.placeholder = '예: 회의 일정 조정 가능할까요?';
  } else if (mode === 'refine') {
    inputTextArea.placeholder = '예: 그 일정은 어렵습니다.';
  } else {
    inputTextArea.placeholder = '예: 내일까지 보고서 줘';
  }
  
  userPreferences.lastMode = mode;
  saveUserPreferences();
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
  
  userPreferences.lastMode = mode;
  userPreferences.lastToneStyle = toneStyle;
  saveUserPreferences();
  
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
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
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (useAdvanced) {
        remainingAdvancedUses--;
        saveRemainingUses();
        updateRemainingCount();
      }
      
      resultTextElement.textContent = data.result;
      loadingElement.style.display = 'none';
      resultElement.style.display = 'block';
      
      addToHistory(situation, target, mode, toneStyle, inputText, data.result);
      
      historySection.style.display = 'block';
    })
    .catch(error => {
      console.error('Error:', error);
      alert('변환 중 오류가 발생했습니다.');
      loadingElement.style.display = 'none';
    });
  } else {
    setTimeout(() => {
      const result = generateResponse(situation, target, mode, toneStyle, inputText, useAdvanced, responseLength);
      
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
    }, 1500);
  }
}

function generateResponse(situation, target, mode, toneStyle, inputText, useAdvanced, responseLength) {
  
  let response = '';
  const maxLength = parseInt(responseLength);
  
  if (mode === 'rephrase') {
    switch (toneStyle) {
      case 'polite':
        if (situation === '회사' && target === '상사') {
          response = '내일까지 보고서를 제출해 주시면 감사하겠습니다.';
        } else {
          response = `${inputText}를 정중하고 친절하게 바꾸었습니다.`;
        }
        break;
      case 'business':
        response = `${target}님, ${inputText}에 대해 업무적으로 요청드립니다.`;
        break;
      case 'firm':
        response = `${target}님, 내일까지 보고서 제출 부탁드립니다.`;
        break;
      case 'rude':
        response = `야, 그거 내일까지 줘.`;
        break;
      default:
        response = `${inputText}를 변환했습니다.`;
    }
  } else if (mode === 'answer') {
    switch (toneStyle) {
      case 'polite':
        response = `질문해 주셔서 감사합니다. ${inputText}에 대한 답변은 다음과 같습니다: `;
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
    
    const modeText = item.mode === 'rephrase' ? '변환' : (item.mode === 'answer' ? '답변' : '다듬기');
    const toneText = getToneStyleText(item.toneStyle);
    
    historyItem.innerHTML = `
      <div class="history-item-header">
        <span>${item.timestamp}</span>
        <span>${item.situation} / ${item.target} / ${toneText} / ${modeText}</span>
        <button class="delete-history-btn" data-id="${item.id}">삭제</button>
      </div>
      <div class="history-item-content">${item.inputText}</div>
      <div class="history-item-result">${item.result}</div>
    `;
    
    historyItem.querySelector('.delete-history-btn').addEventListener('click', () => {
      deleteHistoryItem(item.id);
    });
    
    historyList.appendChild(historyItem);
  });
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
  const savedUses = localStorage.getItem(STORAGE_KEYS.REMAINING_USES);
  if (savedUses !== null) {
    remainingAdvancedUses = parseInt(savedUses);
  }
}

function updateRemainingCount() {
  remainingCountElement.textContent = `남은 횟수: ${remainingAdvancedUses}/${MAX_ADVANCED_USES}`;
}

function deleteHistoryItem(id) {
  if (confirm('이 기록을 삭제하시겠습니까?')) {
    history = history.filter(item => item.id != id);
    saveHistory();
    renderHistory();
    historySection.style.display = history.length > 0 ? 'block' : 'none';
  }
}

function updateToneStyleTooltip() {
  const toneStyle = toneStyleSelect.value;
  let tooltipText = '';
  
  switch (toneStyle) {
    case 'polite':
      tooltipText = '부드럽고 정중한 표현으로 말합니다.';
      break;
    case 'business':
      tooltipText = '업무적이고 격식있는 표현을 사용합니다.';
      break;
    case 'firm':
      tooltipText = '단호하지만 예의를 갖춘 표현을 사용합니다.';
      break;
    case 'rude':
      tooltipText = '거칠고 직설적인 표현을 사용합니다.';
      break;
  }
  
  if (toneStyleTooltip) {
    toneStyleTooltip.textContent = tooltipText;
  }
  
  userPreferences.lastToneStyle = toneStyle;
  saveUserPreferences();
}

function showToneStyleTooltip() {
  if (toneStyleTooltip) {
    toneStyleTooltip.style.display = 'block';
  }
}

function hideToneStyleTooltip() {
  if (toneStyleTooltip) {
    toneStyleTooltip.style.display = 'none';
  }
}

function addToFavorites() {
  const situation = situationInput.value.trim();
  const target = targetInput.value.trim();
  
  if (!situation || !target) {
    alert('상황/장소와 대상/관계를 모두 입력해주세요.');
    return;
  }
  
  const combination = {
    id: Date.now(),
    situation,
    target
  };
  
  const exists = favorites.some(fav => 
    fav.situation === situation && fav.target === target
  );
  
  if (exists) {
    alert('이미 즐겨찾기에 추가된 조합입니다.');
    return;
  }
  
  favorites.push(combination);
  saveFavorites();
  renderFavorites();
  
  alert('즐겨찾기에 추가되었습니다.');
}

function renderFavorites() {
  if (!favoriteCombinations) return;
  
  favoriteCombinations.innerHTML = '';
  
  favorites.forEach(fav => {
    const favoriteItem = document.createElement('div');
    favoriteItem.className = 'favorite-item';
    favoriteItem.innerHTML = `
      <span>${fav.situation} / ${fav.target}</span>
      <span class="remove-favorite" data-id="${fav.id}">×</span>
    `;
    
    favoriteItem.addEventListener('click', (e) => {
      if (!e.target.classList.contains('remove-favorite')) {
        applyCombination(fav);
      }
    });
    
    const removeBtn = favoriteItem.querySelector('.remove-favorite');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFavorite(fav.id);
      });
    }
    
    favoriteCombinations.appendChild(favoriteItem);
  });
}

function removeFavorite(id) {
  favorites = favorites.filter(fav => fav.id !== id);
  saveFavorites();
  renderFavorites();
}

function applyCombination(favorite) {
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

function saveUserPreferences() {
  localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(userPreferences));
}

function loadUserPreferences() {
  const savedPreferences = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
  if (savedPreferences) {
    userPreferences = JSON.parse(savedPreferences);
  }
}

function applyUserPreferences() {
  if (userPreferences.lastMode && modeSelect) {
    modeSelect.value = userPreferences.lastMode;
  }
  
  if (userPreferences.lastToneStyle && toneStyleSelect) {
    toneStyleSelect.value = userPreferences.lastToneStyle;
  }
  
  updateModeLabel();
}

function submitFeedback() {
  if (!feedbackTextArea) return;
  
  const feedbackText = feedbackTextArea.value.trim();
  if (!feedbackText) {
    alert('피드백 내용을 입력해주세요.');
    return;
  }
  
  alert('피드백을 보내주셔서 감사합니다. 더 나은 서비스를 위해 노력하겠습니다.');
  feedbackTextArea.value = '';
}

document.addEventListener('DOMContentLoaded', init);
