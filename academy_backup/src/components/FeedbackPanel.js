import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { generateFeedback, generateFeedbackFromText } from "../api/claude";

function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let key = 0;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={key++} className="text-sm font-bold text-gray-800 mt-4 mb-1.5 first:mt-0">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <li key={key++} className="text-sm text-gray-700 ml-4 list-disc leading-relaxed">
          {line.slice(2)}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1" />);
    } else {
      elements.push(
        <p key={key++} className="text-sm text-gray-700 leading-relaxed">{line}</p>
      );
    }
  }
  return elements;
}

const INPUT_TABS = [
  { id: "image", label: "사진 업로드" },
  { id: "text",  label: "텍스트 입력" },
];

export default function FeedbackPanel({ assignment, student }) {
  const { updateAssignment, saveImage, getImage, apiKey, saveApiKey } = useApp();

  const [inputTab, setInputTab]         = useState("image");
  const [images, setImages]             = useState([]);      // https:// URL 배열
  const [textInput, setTextInput]       = useState("");
  const [isDragging, setIsDragging]     = useState(false);
  const [isUploading, setIsUploading]   = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError]               = useState("");
  const [apiKeyInput, setApiKeyInput]   = useState("");
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [lightbox, setLightbox]         = useState(null);
  const [rotation, setRotation]         = useState(0);
  const [isSavingRotation, setIsSavingRotation] = useState(false);
  const fileRef    = useRef();
  const cameraRef  = useRef();

  // 라이트박스 키보드 지원 (화살표, ESC)
  useEffect(() => {
    if (lightbox === null) return;
    const handleKey = (e) => {
      if (e.key === "ArrowLeft")  { setLightbox((l) => (l - 1 + images.length) % images.length); setRotation(0); }
      if (e.key === "ArrowRight") { setLightbox((l) => (l + 1) % images.length); setRotation(0); }
      if (e.key === "Escape")     setLightbox(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, images.length]);

  useEffect(() => {
    if (assignment) {
      setImages(getImage(assignment.id));
      setTextInput(assignment.textInput || "");
      setError("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment?.id]);

  // 파일 → base64 변환 후 Storage 업로드
  const addFiles = async (files) => {
    const fileList = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!fileList.length) return;
    setError("");
    setIsUploading(true);
    try {
      const base64List = await Promise.all(
        fileList.map((file) => {
          if (file.size > 10 * 1024 * 1024) throw new Error("10MB 이하 이미지만 업로드 가능합니다.");
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );
      const newUrls = await saveImage(assignment.id, [...images, ...base64List]);
      setImages(newUrls);
      updateAssignment(assignment.id, { hasImage: newUrls.length > 0 });
    } catch (err) {
      setError(err.message || "업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleFileChange = (e) => addFiles(e.target.files);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleRemoveImage = async (idx) => {
    setIsUploading(true);
    try {
      const next = images.filter((_, i) => i !== idx);
      const result = await saveImage(assignment.id, next);
      setImages(result);
      updateAssignment(assignment.id, { hasImage: result.length > 0 });
    } catch (err) {
      setError("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleSaveRotation = async () => {
    if (rotation === 0 || lightbox === null) return;
    setIsSavingRotation(true);
    setError("");
    try {
      const imgEl = new window.Image();
      imgEl.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        imgEl.onload = resolve;
        imgEl.onerror = reject;
        imgEl.src = images[lightbox];
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const is90or270 = rotation === 90 || rotation === 270;
      canvas.width  = is90or270 ? imgEl.height : imgEl.width;
      canvas.height = is90or270 ? imgEl.width  : imgEl.height;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(imgEl, -imgEl.width / 2, -imgEl.height / 2);

      const base64 = canvas.toDataURL("image/jpeg", 0.92);

      // 현재 인덱스의 이미지를 회전된 버전으로 교체 후 Storage 업로드
      const newImageList = images.map((url, i) => (i === lightbox ? base64 : url));
      const result = await saveImage(assignment.id, newImageList);
      setImages(result);
      updateAssignment(assignment.id, { hasImage: result.length > 0 });
      setRotation(0);
    } catch (err) {
      setError("이미지 회전 저장에 실패했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setIsSavingRotation(false);
    }
  };

  const handleTextChange = (e) => {
    setTextInput(e.target.value);
    updateAssignment(assignment.id, { textInput: e.target.value });
  };

  const canGenerate = inputTab === "image" ? images.length > 0 : textInput.trim().length > 10;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    if (!apiKey) { setError("API 키가 설정되지 않았습니다."); setShowApiKeyForm(true); return; }
    setIsGenerating(true);
    setError("");
    try {
      const feedback =
        inputTab === "image"
          ? await generateFeedback({
              apiKey,
              images,
              studentName: student.name,
              grade: student.grade,
              assignmentTitle: assignment.title,
              assignmentType: assignment.type,
            })
          : await generateFeedbackFromText({
              apiKey,
              text: textInput,
              studentName: student.name,
              grade: student.grade,
              assignmentTitle: assignment.title,
              assignmentType: assignment.type,
            });
      updateAssignment(assignment.id, {
        feedback,
        feedbackAt: new Date().toLocaleString("ko-KR"),
        feedbackSource: inputTab,
      });
    } catch (e) {
      setError(e.message === "API_KEY_NOT_SET" ? "API 키가 설정되지 않았습니다." : e.message);
      if (e.message === "API_KEY_NOT_SET") setShowApiKeyForm(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) return;
    saveApiKey(apiKeyInput.trim());
    setShowApiKeyForm(false);
    setApiKeyInput("");
    setError("");
  };

  if (!assignment) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-[#F5F3F0]">
        <svg className="w-12 h-12 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-base font-medium text-gray-400">과제를 선택하세요</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F3F0]">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* 입력 방식 탭 */}
        <section className="bg-white rounded-2xl border border-[#E3DED8] overflow-hidden shadow-sm">
          <div className="flex border-b border-[#E3DED8]">
            {INPUT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setInputTab(tab.id); setError(""); }}
                className={`flex-1 py-3 text-sm font-medium transition ${
                  inputTab === tab.id
                    ? "text-[#1a8a78] border-b-2 border-[#2BAE9A] bg-[#eef9f7]/40"
                    : "text-gray-500 hover:bg-[#F5F3F0]"
                }`}
              >
                {tab.label}
                {tab.id === "image" && images.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-[#2BAE9A] text-white text-xs rounded-full leading-none">
                    {images.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* ── 사진 업로드 탭 ── */}
            {inputTab === "image" && (
              <div className="space-y-3">

                {/* 업로드 중 오버레이 */}
                {isUploading && (
                  <div className="flex items-center justify-center gap-2 py-3 text-sm text-[#1a8a78]">
                    <div className="w-4 h-4 border-2 border-[#2BAE9A] border-t-transparent rounded-full animate-spin" />
                    업로드 중...
                  </div>
                )}

                {/* 썸네일 그리드 */}
                {!isUploading && images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((src, idx) => (
                      <div key={idx} className="relative group aspect-square">
                        <img
                          src={src}
                          alt={`과제 사진 ${idx + 1}`}
                          onClick={() => setLightbox(idx)}
                          className="w-full h-full object-cover rounded-xl border border-[#E3DED8] cursor-zoom-in"
                        />
                        <button
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/40 text-white px-1.5 py-0.5 rounded-md">
                          {idx + 1}
                        </span>
                      </div>
                    ))}

                    {/* 파일 추가 버튼 */}
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={isUploading}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#E3DED8] hover:border-[#2BAE9A] hover:bg-[#eef9f7]/30 flex flex-col items-center justify-center gap-1 transition text-gray-400 hover:text-[#2BAE9A] disabled:opacity-40"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-[11px] font-medium">추가</span>
                    </button>
                    {/* 카메라 촬영 버튼 */}
                    <button
                      onClick={() => cameraRef.current?.click()}
                      disabled={isUploading}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#E3DED8] hover:border-[#2BAE9A] hover:bg-[#eef9f7]/30 flex flex-col items-center justify-center gap-1 transition text-gray-400 hover:text-[#2BAE9A] disabled:opacity-40"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                      <span className="text-[11px] font-medium">촬영</span>
                    </button>
                  </div>
                )}

                {/* 드래그 업로드 영역 (사진 없을 때) */}
                {!isUploading && images.length === 0 && (
                  <div>
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                        isDragging
                          ? "border-[#2BAE9A] bg-[#eef9f7]"
                          : "border-[#E3DED8] hover:border-[#2BAE9A] hover:bg-[#eef9f7]/30"
                      }`}
                    >
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="text-sm font-medium text-gray-600">클릭하거나 사진을 드래그하세요</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC · 최대 10MB</p>
                    </div>
                    {/* 카메라 버튼 */}
                    <button
                      onClick={() => cameraRef.current?.click()}
                      disabled={isUploading}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E3DED8] bg-white hover:bg-[#eef9f7] hover:border-[#2BAE9A] text-gray-600 hover:text-[#1a8a78] text-sm font-medium transition disabled:opacity-40"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                      카메라로 촬영
                    </button>
                  </div>
                )}

                {/* 드래그 추가 영역 (사진 있을 때) */}
                {!isUploading && images.length > 0 && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`rounded-xl px-4 py-2 text-center text-xs border border-dashed transition ${
                      isDragging
                        ? "border-[#2BAE9A] bg-[#eef9f7] text-[#1a8a78]"
                        : "border-[#E3DED8] text-gray-400"
                    }`}
                  >
                    {images.length}장 · 드래그해서 추가
                  </div>
                )}
              </div>
            )}

            {/* ── 텍스트 입력 탭 ── */}
            {inputTab === "text" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">학생 글을 직접 입력하거나 붙여넣으세요</p>
                  <span className="text-xs text-gray-400">{textInput.length}자</span>
                </div>
                <textarea
                  value={textInput}
                  onChange={handleTextChange}
                  placeholder={`학생이 쓴 글을 여기에 입력하세요.\n사진 인식이 잘 안 되거나 직접 타이핑하고 싶을 때 활용하세요.`}
                  rows={8}
                  className="w-full px-4 py-3 border border-[#E3DED8] rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] resize-none leading-relaxed bg-[#F5F3F0]"
                  autoFocus
                />
                {textInput.trim().length > 0 && textInput.trim().length <= 10 && (
                  <p className="text-xs text-amber-600">10자 이상 입력해야 첨삭이 가능합니다</p>
                )}
              </div>
            )}

            <input ref={fileRef}   type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            {error && (
              <p className="text-red-500 text-xs mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>
        </section>

        {/* AI 첨삭 섹션 */}
        <section className="bg-white rounded-2xl border border-[#E3DED8] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">AI 첨삭 피드백</h3>
            {assignment.feedback && (
              <div className="flex items-center gap-3">
                {assignment.feedbackAt && (
                  <span className="text-xs text-gray-400">{assignment.feedbackAt}</span>
                )}
                <button
                  onClick={() => updateAssignment(assignment.id, { feedback: null, feedbackAt: null })}
                  className="text-xs text-gray-400 hover:text-red-500 transition"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          {!apiKey && !showApiKeyForm && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-amber-800">API 키가 필요합니다</p>
                <p className="text-xs text-amber-600 mt-0.5">Claude API 키를 등록하면 AI 첨삭을 사용할 수 있습니다</p>
              </div>
              <button
                onClick={() => setShowApiKeyForm(true)}
                className="ml-3 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition whitespace-nowrap"
              >
                키 등록
              </button>
            </div>
          )}

          {showApiKeyForm && (
            <div className="bg-[#F5F3F0] rounded-xl p-4 space-y-2 mb-3">
              <p className="text-xs font-medium text-gray-600">Claude API 키 입력</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveApiKey()}
                  placeholder="sk-ant-..."
                  className="flex-1 px-3 py-2 border border-[#E3DED8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-white"
                  autoFocus
                />
                <button onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()}
                  className="px-4 py-2 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white rounded-xl text-sm font-medium transition">
                  저장
                </button>
                <button onClick={() => { setShowApiKeyForm(false); setApiKeyInput(""); }}
                  className="px-3 py-2 border border-[#E3DED8] rounded-xl text-sm text-gray-500 hover:bg-[#EDEAE5] transition">
                  취소
                </button>
              </div>
              <p className="text-xs text-gray-400">키는 이 기기의 브라우저에만 저장됩니다</p>
            </div>
          )}

          {assignment.feedback ? (
            <div className="space-y-3">
              <div className="bg-[#eef9f7] rounded-xl p-4 leading-relaxed">
                {renderMarkdown(assignment.feedback)}
              </div>
              <button onClick={handleGenerate} disabled={!canGenerate || isGenerating}
                className="w-full py-2 rounded-xl text-xs font-medium text-[#1a8a78] hover:bg-[#eef9f7] border border-[#2BAE9A]/30 transition disabled:opacity-40">
                {isGenerating ? "생성 중..." : "다시 생성"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating || !apiKey}
              className="w-full py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-[#F5F3F0] disabled:text-gray-400 disabled:cursor-not-allowed text-white"
            >
              {isGenerating ? "생성 중입니다..." :
               !canGenerate ? (inputTab === "image" ? "사진을 먼저 업로드하세요" : "글을 10자 이상 입력하세요") :
               !apiKey ? "API 키를 먼저 등록하세요" :
               <>AI 첨삭 생성{images.length > 1 ? ` (사진 ${images.length}장)` : ""}</>}
            </button>
          )}
        </section>

        {assignment.teacherNote && (
          <section className="bg-white rounded-2xl border border-[#E3DED8] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">선생님 메모</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{assignment.teacherNote}</p>
          </section>
        )}
      </div>

      {/* 라이트박스 */}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black/85 z-50 flex flex-col items-center justify-center p-4"
          onClick={() => { setLightbox(null); setRotation(0); }}>
          <div className="relative max-w-3xl w-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>

            {/* 이미지 */}
            <div className="flex items-center justify-center w-full" style={{ minHeight: 120 }}>
              <img
                src={images[lightbox]}
                alt={`과제 사진 ${lightbox + 1}`}
                style={{ transform: `rotate(${rotation}deg)`, transition: "transform 0.25s ease" }}
                className="max-w-full max-h-[70vh] object-contain rounded-2xl"
              />
            </div>

            {/* 회전 컨트롤 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRotate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                90° 회전
              </button>
              {rotation !== 0 && (
                <button
                  onClick={handleSaveRotation}
                  disabled={isSavingRotation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
                >
                  {isSavingRotation ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      회전 저장
                    </>
                  )}
                </button>
              )}
              {rotation !== 0 && (
                <button
                  onClick={() => setRotation(0)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg text-sm transition"
                >
                  초기화
                </button>
              )}
            </div>

            {/* 닫기 */}
            <button onClick={() => { setLightbox(null); setRotation(0); }}
              className="absolute top-0 right-0 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-sm transition">
              ✕
            </button>

            {/* 이전/다음 */}
            {images.length > 1 && (
              <>
                <button onClick={() => { setLightbox((lightbox - 1 + images.length) % images.length); setRotation(0); }}
                  className="absolute left-0 top-[35%] -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition text-lg">
                  ‹
                </button>
                <button onClick={() => { setLightbox((lightbox + 1) % images.length); setRotation(0); }}
                  className="absolute right-0 top-[35%] -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition text-lg">
                  ›
                </button>
                <div className="flex gap-1.5 mt-1">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => { setLightbox(i); setRotation(0); }}
                      className={`w-1.5 h-1.5 rounded-full transition ${i === lightbox ? "bg-white" : "bg-white/40"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
