# Hooks 설정 가이드

## ClassPilot 적용 사례

- `PostToolUse` 훅으로 파일 저장 후 `npx tsc --noEmit` 자동 실행 — 타입 오류 즉시 감지
- Codex 에이전트가 파일을 수정할 때마다 린트 결과를 피드백으로 제공

---

## 1. Hooks란?

Hooks는 Claude Code의 특정 이벤트에 반응하여 **자동으로 셸 명령어를 실행**하는 시스템입니다.
"Claude가 파일을 저장할 때마다 린트를 실행해줘" 같은 자동화를 구현할 수 있습니다.

> Hooks는 Claude의 프롬프트가 아닌 **settings.json에 설정**하는 시스템 레벨 기능입니다.

---

## 2. 설정 위치

```
~/.claude/settings.json              ← 전역 설정
프로젝트/.claude/settings.json       ← 프로젝트 전용
```

---

## 3. 사용 가능한 Hook 이벤트

| 이벤트 | 발생 시점 |
|--------|----------|
| `PreToolUse` | 도구 실행 **전** |
| `PostToolUse` | 도구 실행 **후** |
| `Notification` | Claude가 사용자에게 알림을 보낼 때 |
| `Stop` | Claude가 응답을 멈출 때 |
| `SubagentStop` | 서브에이전트가 완료될 때 |

---

## 4. Hook 설정 형식

```json
{
  "hooks": {
    "이벤트명": [
      {
        "matcher": "도구명 또는 패턴",
        "hooks": [
          {
            "type": "command",
            "command": "실행할 셸 명령어"
          }
        ]
      }
    ]
  }
}
```

---

## 5. 실전 예시

### 5.1 파일 저장 후 자동 포매팅

파일이 수정될 때마다 Prettier를 실행합니다.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

### 5.2 파일 저장 후 자동 린트

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx eslint --fix \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

### 5.3 위험한 명령어 차단

특정 도구 실행을 사전에 차단합니다.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"$CLAUDE_TOOL_INPUT\" | grep -qE '(rm -rf /|DROP TABLE|git push --force)' && echo 'BLOCK: 위험한 명령어 감지' && exit 1 || exit 0"
          }
        ]
      }
    ]
  }
}
```

### 5.4 커밋 후 알림

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"$CLAUDE_TOOL_INPUT\" | grep -q 'git commit' && osascript -e 'display notification \"커밋이 생성되었습니다\" with title \"Claude Code\"' || true"
          }
        ]
      }
    ]
  }
}
```

### 5.5 프롬프트 제출 시 자동 컨텍스트 추가

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "echo '현재 시간:' $(date '+%Y-%m-%d %H:%M:%S')"
          }
        ]
      }
    ]
  }
}
```

---

## 6. Hook 환경변수

Hook 스크립트에서 사용할 수 있는 환경변수:

| 변수 | 설명 |
|------|------|
| `$CLAUDE_TOOL_NAME` | 실행된 도구 이름 (예: "Edit", "Bash") |
| `$CLAUDE_TOOL_INPUT` | 도구에 전달된 입력 (JSON) |
| `$CLAUDE_FILE_PATH` | 수정된 파일 경로 (Write/Edit 도구) |
| `$CLAUDE_SESSION_ID` | 현재 세션 ID |

---

## 7. Hook 작성 팁

### 에러 처리
```bash
# 실패해도 Claude 작업을 중단하지 않으려면
command || true

# 실패 시 Claude 작업을 중단하려면 (PreToolUse)
command || exit 1
```

### 성능
- Hook은 **동기적으로** 실행되므로 오래 걸리는 작업은 피하기
- 무거운 작업은 백그라운드로 실행: `command &`

### 디버깅
```bash
# Hook이 제대로 실행되는지 로그 남기기
echo "$(date) - Tool: $CLAUDE_TOOL_NAME" >> /tmp/claude-hooks.log
```

### matcher 패턴
- 정규식 지원: `Write|Edit`, `Bash`, `.*` (모든 도구)
- 특정 도구만 매칭: `"matcher": "Bash"`
- 여러 도구 매칭: `"matcher": "Write|Edit|NotebookEdit"`

---

## 8. 주의사항

1. **무한 루프 조심**: Hook이 트리거하는 작업이 다시 Hook을 트리거하지 않도록 주의
2. **보안**: Hook 명령어에 사용자 입력을 직접 넣지 않기 (injection 위험)
3. **성능 영향**: 모든 도구 호출마다 실행되므로 가벼운 작업만
4. **테스트**: 새 Hook은 간단한 echo로 먼저 테스트 후 적용
