# MCP 서버 활용 가이드

## 1. MCP란?

**Model Context Protocol (MCP)** 는 AI 모델이 외부 도구 및 데이터 소스에 접근할 수 있게 하는 개방형 프로토콜입니다.

```
┌─────────────┐     MCP Protocol     ┌─────────────┐
│  Claude Code │ ◄──────────────────► │  MCP Server  │
│  (Client)    │    JSON-RPC/stdio    │  (도구 제공) │
└─────────────┘                       └─────────────┘
```

### MCP의 핵심 개념

- **Server**: 특정 기능(도구)을 제공하는 프로세스
- **Client**: MCP 서버에 연결하여 도구를 사용하는 AI (Claude Code)
- **Tools**: 서버가 제공하는 개별 기능 (함수)
- **Resources**: 서버가 제공하는 데이터 (파일, DB 결과 등)

---

## 2. MCP 서버 설정 방법

### 설정 파일 위치

| 위치 | 범위 |
|------|------|
| `~/.claude/settings.json` | 전역 (모든 프로젝트) |
| `프로젝트/.claude/settings.json` | 프로젝트 전용 |

### 기본 설정 형식

```json
{
  "mcpServers": {
    "서버이름": {
      "command": "실행할 명령어",
      "args": ["인자1", "인자2"],
      "env": {
        "환경변수": "값"
      }
    }
  }
}
```

### 설정 명령어

```bash
# CLI에서 MCP 서버 추가
claude mcp add 서버이름 -- command arg1 arg2

# MCP 서버 목록 확인
claude mcp list

# MCP 서버 제거
claude mcp remove 서버이름
```

---

## 3. 주요 MCP 서버 목록

### 3.1 Filesystem MCP

로컬 파일시스템 접근을 제공합니다.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/허용할/경로"
      ]
    }
  }
}
```

**주요 도구**: `read_file`, `write_file`, `list_directory`, `search_files`

### 3.2 GitHub MCP

GitHub API와 연동하여 이슈, PR, 리포지토리를 관리합니다.

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    }
  }
}
```

**주요 도구**: `create_issue`, `list_issues`, `create_pull_request`, `search_repositories`, `get_file_contents`

### 3.3 PostgreSQL MCP

PostgreSQL 데이터베이스에 직접 쿼리를 실행합니다.

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:pass@localhost:5432/dbname"
      ]
    }
  }
}
```

**주요 도구**: `query` (SELECT 쿼리 실행)

### 3.4 Chrome DevTools MCP

브라우저를 원격 조작하여 웹 테스트, 스크린샷, 디버깅을 수행합니다.

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/chrome-devtools-mcp"]
    }
  }
}
```

**주요 도구**:
| 도구 | 설명 |
|------|------|
| `navigate_page` | URL로 이동 |
| `take_screenshot` | 스크린샷 캡처 |
| `click` | 요소 클릭 |
| `fill` | 입력 필드에 텍스트 입력 |
| `evaluate_script` | JavaScript 실행 |
| `list_network_requests` | 네트워크 요청 모니터링 |
| `lighthouse_audit` | Lighthouse 성능 감사 |

### 3.5 Figma MCP (claude.ai 제공)

Figma 디자인을 읽고 코드로 변환합니다.

```
# claude.ai에서 자동 제공 (별도 설정 불필요)
# Figma URL을 붙여넣으면 자동으로 디자인 분석
```

**주요 도구**:
| 도구 | 설명 |
|------|------|
| `get_design_context` | Figma 디자인을 코드로 변환 |
| `get_screenshot` | 디자인 스크린샷 |
| `get_metadata` | 파일 메타데이터 |
| `generate_diagram` | FigJam 다이어그램 생성 |

### 3.6 Slack MCP

Slack 채널 메시지 읽기/쓰기를 지원합니다.

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-xxxxxxxxxxxx"
      }
    }
  }
}
```

### 3.7 Linear MCP

Linear 이슈 트래커와 연동합니다.

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "mcp-linear"],
      "env": {
        "LINEAR_API_KEY": "lin_api_xxxxxxxxxxxx"
      }
    }
  }
}
```

### 3.8 Notion MCP

```
# claude.ai에서 OAuth로 자동 연동
# 별도 설정 없이 Notion 페이지 접근 가능
```

### 3.9 기타 유용한 MCP 서버

| 서버 | 패키지 | 설명 |
|------|--------|------|
| **Memory** | `@modelcontextprotocol/server-memory` | 영속적 메모리 (knowledge graph) |
| **Brave Search** | `@modelcontextprotocol/server-brave-search` | 웹 검색 |
| **Puppeteer** | `@modelcontextprotocol/server-puppeteer` | 브라우저 자동화 |
| **SQLite** | `@modelcontextprotocol/server-sqlite` | SQLite DB 접근 |
| **Google Maps** | `@modelcontextprotocol/server-google-maps` | 지도/장소 검색 |
| **Sentry** | `@modelcontextprotocol/server-sentry` | 에러 모니터링 |
| **Fetch** | `@modelcontextprotocol/server-fetch` | HTTP 요청 |

---

## 4. 현재 프로젝트 MCP 설정

이 프로젝트에서 현재 사용 가능한 MCP 서버:

| 서버 | 용도 |
|------|------|
| **Chrome DevTools** | 브라우저 테스트, 스크린샷, 네트워크 모니터링 |
| **Figma** | 디자인 → 코드 변환 |
| **Gmail** | 이메일 연동 |
| **Google Calendar** | 캘린더 연동 |
| **Notion** | 노션 문서 연동 |

---

## 5. 커스텀 MCP 서버 만들기

### TypeScript로 간단한 MCP 서버

```typescript
// my-mcp-server/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-tools",
  version: "1.0.0",
});

// 도구 등록
server.tool(
  "hello",
  "인사말을 반환합니다",
  { name: z.string().describe("이름") },
  async ({ name }) => ({
    content: [{ type: "text", text: `안녕하세요, ${name}님!` }],
  })
);

// 서버 시작
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 등록

```json
{
  "mcpServers": {
    "my-tools": {
      "command": "npx",
      "args": ["tsx", "./my-mcp-server/index.ts"]
    }
  }
}
```

---

## 6. MCP 활용 팁

### 보안 주의사항
- API 키는 환경변수로 관리 (`.env` 파일 사용)
- 데이터베이스 MCP는 읽기 전용 계정 사용 권장
- 프로덕션 환경에서는 MCP 서버 접근 범위 최소화

### 디버깅
```bash
# MCP 서버 로그 확인
claude mcp list          # 서버 상태 확인

# 서버 연결 테스트
claude mcp add test-server -- npx -y @modelcontextprotocol/server-filesystem /tmp
```

### 성능 최적화
- 자주 사용하지 않는 MCP 서버는 프로젝트 레벨에서만 설정
- 무거운 서버 (Puppeteer 등)는 필요할 때만 활성화
- `env` 설정으로 서버 동작 범위 제한
