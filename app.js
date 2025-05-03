<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>말빛 - 공손한 말 변환기</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet" />
  <style>
    body {
      font-family: 'Noto Sans KR', sans-serif;
      background: linear-gradient(135deg, #fce4ec, #f8bbd0);
      padding: 20px;
      color: #4a4a4a;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff0f5;
      padding: 32px;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(160, 90, 140, 0.15);
    }
    h1 {
      text-align: center;
      color: #ad7da0;
    }
    label {
      font-weight: bold;
      margin-top: 10px;
      display: block;
    }
    input, textarea, select {
      width: 100%;
      padding: 12px;
      margin-top: 5px;
      margin-bottom: 20px;
      border-radius: 10px;
      border: 1px solid #d8a4c0;
      background: #fff8fc;
    }
    button {
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      background: #d3929b;
      color: white;
      font-weight: bold;
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
    }
    .result {
      background: #fffafc;
      padding: 16px;
      border-radius: 10px;
      margin-top: 20px;
      border: 1px dashed #e4a3b0;
    }
    .remaining-count {
      color: #d3628a;
      font-weight: bold;
      float: right;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>말빛</h1>
    <label>상황/장소:</label>
    <input type="text" id="situation" value="회사" />

    <label>대상/관계:</label>
    <input type="text" id="target" value="상사" />

    <label>말투 스타일:</label>
    <select id="toneStyle">
      <option value="polite">공손하고 친절</option>
      <option value="business">비즈니스 격식</option>
      <option value="rude">싸가지</option>
      <option value="firm" selected>단호하지만 정중</option>
    </select>

    <label>텍스트:</label>
    <textarea id="inputText" placeholder="예: 내일까지 보고서 줘">내일까지 보고서 줘</textarea>

    <label>고급 변환 (AI 사용): <input type="checkbox" id="useAdvanced" /></label>

    <label>응답 길이:</label>
    <select id="responseLength">
      <option value="50">50자</option>
      <option value="100">100자</option>
      <option value="200" selected>200자</option>
      <option value="500">500자</option>
    </select>

    <div class="remaining-count" id="remainingCount">남은 횟수: 5/5</div>

    <button id="transformButton">예쁜 말 변환</button>

    <div class="result" id="resultBox" style="display:none">
      <h3>변환 결과</h3>
      <p id="resultText"></p>
    </div>
  </div>

  <script>
    const MAX_ADVANCED_USES = 5;
    let remainingUses = MAX_ADVANCED_USES;
    document.getElementById('remainingCount').innerText = `남은 횟수: ${remainingUses}/5`;

    async function callGeminiAPI(prompt, length) {
      const response = await fetch('https://malbit-api.vercel.app/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          maxLength: length,
          style: document.getElementById('toneStyle').value,
          situation: document.getElementById('situation').value,
          target: document.getElementById('target').value
        })
      });
      const data = await response.json();
      return data.result;
    }

    document.getElementById('transformButton').addEventListener('click', async () => {
      const text = document.getElementById('inputText').value.trim();
      const useAI = document.getElementById('useAdvanced').checked;
      const length = parseInt(document.getElementById('responseLength').value);

      if (!text) return alert('문장을 입력해주세요.');

      let output = '';
      if (useAI) {
        if (remainingUses <= 0) return alert('고급 변환 횟수를 모두 사용하셨습니다.');
        try {
          output = await callGeminiAPI(`다음 문장을 정중하게 바꿔줘: ${text}`, length);
          remainingUses--;
          document.getElementById('remainingCount').innerText = `남은 횟수: ${remainingUses}/5`;
        } catch {
          output = '고급 변환 중 오류 발생';
        }
      } else {
        output = text.replace(/줘$/, '주시면 감사하겠습니다');
      }

      document.getElementById('resultText').innerText = output;
      document.getElementById('resultBox').style.display = 'block';
    });
  </script>
</body>
</html>
