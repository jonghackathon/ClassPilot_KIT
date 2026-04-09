export async function generateFeedback({ apiKey, images, studentName, grade, assignmentTitle, assignmentType }) {
  if (!apiKey) throw new Error("API_KEY_NOT_SET");
  const imagesBase64 = images;

  const prompt = `당신은 초·중등 국어·논술 전문 선생님입니다.
아래 학생의 글쓰기 과제 사진을 보고 상세한 첨삭 피드백을 작성해주세요.

학생 정보: ${studentName} (${grade})
과제 유형: ${assignmentType}
과제 제목: ${assignmentTitle}
${imagesBase64.length > 1 ? `\n사진 ${imagesBase64.length}장이 첨부되었습니다. 모든 사진을 참고해 종합적으로 피드백해주세요.\n` : ""}
다음 형식으로 피드백을 작성해주세요:

## ⭐ 잘한 점
(2~3가지 구체적으로)

## ✏️ 맞춤법 · 문법 교정
(오류 항목별로 원문 → 수정안 형식으로)

## 📝 내용 · 구성 피드백
(글의 구조, 논리성, 표현력 등)

## 📈 이렇게 발전시켜보세요
(다음 글쓰기를 위한 구체적인 조언 2~3가지)

학년 수준에 맞는 친절하고 격려적인 언어로 작성해주세요.`;

  const imageContents = imagesBase64.map((img) => {
    if (img.startsWith("http")) {
      return { type: "image", source: { type: "url", url: img } };
    }
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: img.split(";")[0].split(":")[1],
        data: img.split(",")[1],
      },
    };
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            ...imageContents,
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API 오류 (${response.status})`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function generateGrowthReport({
  apiKey,
  studentName, grade, className,
  assignments, feedbacks, weekNotesText,
  attendanceRate, monthLabel,
}) {
  if (!apiKey) throw new Error("API_KEY_NOT_SET");

  const assignmentList = assignments.length
    ? assignments
        .map((a) => `• [${a.type}] ${a.title} (${a.assignedDate?.slice(5) || ""})${a.feedback ? " - 첨삭완료" : ""}`)
        .join("\n")
    : "과제 없음";

  const feedbackSummary = feedbacks.slice(0, 3)
    .map((fb, i) => `[${i + 1}번째 첨삭]\n${fb.slice(0, 300)}`)
    .join("\n\n---\n\n");

  const prompt = `당신은 국어·논술 학원의 전문 선생님입니다.
아래 정보를 바탕으로 ${monthLabel} ${studentName} 학생(${grade}${className ? ", " + className : ""})의 월간 성장 평가를 작성해주세요.

[이달 수업 진도]
${weekNotesText || "수업 기록 없음"}

[출석 현황]
${attendanceRate}

[이달 과제 현황 (총 ${assignments.length}개)]
${assignmentList}

${feedbackSummary ? `[AI 첨삭 내용 참고]\n${feedbackSummary}` : ""}

위 내용을 바탕으로 학부모님께 전달드리는 이달의 학습 성장 평가를 아래 형식으로 작성해주세요.
따뜻하고 전문적인 어조로, 구체적 사례를 포함하여 작성해주세요.

## 🌱 이달의 성장
(이달 구체적으로 성장한 점 2~3가지를 예시와 함께)

## ⭐ 잘하고 있어요
(강점과 칭찬할 점을 구체적으로)

## 📈 앞으로의 방향
(다음 달 중점적으로 발전시킬 부분 2~3가지를 구체적으로)`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API 오류 (${response.status})`);
  }
  const data = await response.json();
  return data.content[0].text;
}

export async function generateFeedbackFromText({ apiKey, text, studentName, grade, assignmentTitle, assignmentType }) {
  if (!apiKey) throw new Error("API_KEY_NOT_SET");

  const prompt = `당신은 초·중등 국어·논술 전문 선생님입니다.
아래 학생의 글쓰기 과제를 읽고 상세한 첨삭 피드백을 작성해주세요.

학생 정보: ${studentName} (${grade})
과제 유형: ${assignmentType}
과제 제목: ${assignmentTitle}

--- 학생이 쓴 글 ---
${text}
-------------------

다음 형식으로 피드백을 작성해주세요:

## ⭐ 잘한 점
(2~3가지 구체적으로)

## ✏️ 맞춤법 · 문법 교정
(오류 항목별로 원문 → 수정안 형식으로. 없으면 "맞춤법 오류 없음"으로 작성)

## 📝 내용 · 구성 피드백
(글의 구조, 논리성, 표현력 등)

## 📈 이렇게 발전시켜보세요
(다음 글쓰기를 위한 구체적인 조언 2~3가지)

학년 수준에 맞는 친절하고 격려적인 언어로 작성해주세요.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API 오류 (${response.status})`);
  }

  const data = await response.json();
  return data.content[0].text;
}
