document.getElementById("transformButton").addEventListener("click", () => {
  const inputText = document.getElementById("inputText").value.trim();
  const mode = document.getElementById("mode").value;
  const tone = document.getElementById("toneStyle").value;
  const length = parseInt(document.getElementById("responseLength").value);
  const useAdvanced = document.getElementById("useAdvanced").checked;

  if (!inputText) {
    alert("텍스트를 입력해 주세요.");
    return;
  }

  let resultText = "";

  // 예시 응답 텍스트 (내용은 동일, 말투만 변함)
  const responses = {
    short: {
      polite: "내일까지 부탁드릴게요.",
      business: "내일까지 제출 부탁드립니다.",
      rude: "내일까지 안 주면 곤란해.",
      firm: "내일까지 꼭 부탁드립니다."
    },
    medium: {
      polite: "혹시 괜찮으시다면 내일까지 보고서 부탁드려도 될까요?",
      business: "내일까지 보고서 제출 부탁드립니다. 감사합니다.",
      rude: "보고서 내일까지 좀 줘라.",
      firm: "내일까지 보고서 부탁드립니다. 중요한 일정입니다."
    },
    long: {
      polite: "바쁘시겠지만, 혹시 가능하시다면 내일까지 보고서를 부탁드릴 수 있을까요? 항상 감사드립니다.",
      business: "해당 보고서는 중요한 일정에 포함되어 있어, 내일까지 제출해 주시면 감사하겠습니다.",
      rude: "이런 것도 늦게 주면 나중에 책임 못 져.",
      firm: "내일까지 보고서를 꼭 부탁드립니다. 일정상 반드시 필요합니다."
    }
  };

  if (useAdvanced) {
    let lengthCategory = "short";
    if (length > 50 && length <= 200) {
      lengthCategory = "medium";
    } else if (length > 200) {
      lengthCategory = "long";
    }

    resultText = responses[lengthCategory][tone] || "적절한 변환 결과를 찾을 수 없습니다.";
  } else {
    resultText = `"${inputText}" → (일반 변환 결과)`;
  }

  // 결과 표시
  document.querySelector(".result p").innerText = resultText;
  document.querySelector(".result").style.display = "block";
});
