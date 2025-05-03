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

const MAX_ADVANCED_USES = 5;
const STORAGE_KEYS = {
  HISTORY: 'malbit_history',
  REMAINING_USES: 'malbit_remaining_uses'
};

let history = [];
let remainingAdvancedUses = MAX_ADVANCED_USES;

function init() {
  loadHistory();
  loadRemainingUses();
  updateRemainingCount();
  updateModeLabel();
  
  modeSelect.addEventListener('change', updateModeLabel);
  transformButton.addEventListener('click', handleTransform);
  copyButton.addEventListener('click', copyResult);
  clearHistoryButton.addEventListener('click', clearHistory);
  
  voteButtons.forEach(button => {
    button.addEventListener('click', () => handleVote(button.textContent.includes('좋아요')));
  });
}

function updateModeLabel() {
  inputTextLabel.textContent = modeSelect.value === 'rephrase' ? '텍스트:' : '질문:';
  inputTextArea.placeholder = modeSelect.value === 'rephrase' 
    ? '예: 내일까지 보고서 줘' 
    : '예: 이번 프로젝트 언제까지 마무리해야 하나요?';
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
    }
  } else { // reply mode
    switch (toneStyle) {
      case 'polite':
        response = `질문해 주셔서 감사합니다. ${inputText}에 대한 답변은 다음과 같습니다...`;
        break;
      case 'business':
        response = `${target}님의 ${inputText}에 대한 질문에 답변드립니다.`;
        break;
      case 'firm':
        response = `${inputText}에 대한 답변은 명확합니다.`;
        break;
      case 'rude':
        response = `그런 질문도 하냐? 답은 이거야.`;
        break;
    }
  }
  
  if (useAdvanced) {
    response += ` ${situation}에서 ${target}과의 관계를 고려한 맞춤형 응답입니다. 이 응답은 AI 기반 고급 변환 기능을 사용하여 생성되었습니다.`;
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
    
    const modeText = item.mode === 'rephrase' ? '변환' : '답변';
    const toneText = getToneStyleText(item.toneStyle);
    
    historyItem.innerHTML = `
      <div class="history-item-header">
        <span>${item.timestamp}</span>
        <span>${item.situation} / ${item.target} / ${toneText} / ${modeText}</span>
      </div>
      <div class="history-item-content">${item.inputText}</div>
      <div class="history-item-result">${item.result}</div>
    `;
    
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

document.addEventListener('DOMContentLoaded', init);
