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
    
    res.json({ result: response });
  }, 1000);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});
