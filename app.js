document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("transformButton");
  const input = document.getElementById("inputText");
  const output = document.querySelector(".result p");
  const resultBox = document.querySelector(".result");
  const loading = document.querySelector(".loading");

  button.addEventListener("click", async () => {
    const text = input.value.trim();
    const toneStyle = document.getElementById("toneStyle").value;
    const mode = document.getElementById("mode").value;
    const responseLength = document.getElementById("responseLength").value;
    const useAdvanced = document.getElementById("useAdvanced").checked;
    const situation = document.getElementById("situation").value.trim();
    const target = document.getElementById("target").value.trim();

    if (!text) return alert("텍스트를 입력해주세요.");

    loading.style.display = "block";
    resultBox.style.display = "none";

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: text,
          toneStyle,
          mode,
          responseLength,
          useAdvanced,
          situation,
          target,
        }),
      });

      const data = await res.json();
      output.textContent = data.result || "변환 결과가 없습니다.";
      resultBox.style.display = "block";
    } catch (err) {
      alert("서버 오류가 발생했습니다.");
      console.error(err);
    } finally {
      loading.style.display = "none";
    }
  });
});
