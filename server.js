const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/transform', (req, res) => {
  const { situation, target, mode, toneStyle, inputText, useAdvanced, responseLength } = req.body;
  
  if (!situation || !target || !inputText) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
  }
  
  setTimeout(() => {
    let response = '';
    const maxLength = parseInt(responseLength) || 100;
    
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
        default:
          response = `${inputText}에 대한 답변입니다.`;
      }
    }
    
    if (useAdvanced) {
      response += ` ${situation}에서 ${target}과의 관계를 고려한 맞춤형 응답입니다. 이 응답은 AI 기반 고급 변환 기능을 사용하여 생성되었습니다.`;
    }
    
    if (response.length > maxLength) {
      response = response.substring(0, maxLength) + '...';
    }
    
    res.json({ result: response });
  }, 1000);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});
