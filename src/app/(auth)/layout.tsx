import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '로그인',
  description: 'ClassPilot에 로그인하여 역할별 워크스페이스를 시작하세요.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.38),_transparent_30%),radial-gradient(circle_at_75%_25%,_rgba(14,165,233,0.24),_transparent_26%),linear-gradient(135deg,_#0f172a_0%,_#111827_42%,_#1e1b4b_100%)]" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1440px] items-center gap-12 px-6 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-10">
        <section className="hidden lg:block">
          <div className="max-w-xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-indigo-100 backdrop-blur">
              AI 운영 도구와 학습 경험을 한곳에
            </div>

            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.32em] text-sky-200/80">
                ClassPilot Workspace
              </p>
              <h1 className="text-5xl font-semibold leading-tight text-white">
                운영은 더 선명하게,
                <br />
                수업은 더 자연스럽게
              </h1>
              <p className="max-w-lg text-lg leading-8 text-slate-300">
                운영자는 흐름을 보고, 강사는 수업에 집중하고, 수강생은 오늘
                해야 할 일을 바로 이해할 수 있도록 역할별 경험을 분리했습니다.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/12 bg-white/8 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">원장</p>
                <p className="mt-3 text-sm font-medium text-white leading-6">
                  미납, 이탈 위험을 한눈에 파악
                </p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/8 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">강사</p>
                <p className="mt-3 text-sm font-medium text-white leading-6">
                  출결과 AI 코파일럿을 수업 흐름에서
                </p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/8 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">수강생</p>
                <p className="mt-3 text-sm font-medium text-white leading-6">
                  과제와 복습을 오늘 바로 확인
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-full items-center justify-center">
          {children}
        </section>
      </div>
    </div>
  )
}
