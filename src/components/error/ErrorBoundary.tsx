'use client'

import type { ReactNode } from 'react'
import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error) {
    console.error(error)
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-[50vh] max-w-[760px] items-center justify-center px-4 py-16">
          <div className="w-full rounded-[32px] border border-rose-100 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">예상치 못한 오류가 발생했습니다.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              화면을 다시 불러오면 대부분의 문제는 바로 복구됩니다.
            </p>
            {this.state.error?.message ? (
              <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {this.state.error.message}
              </p>
            ) : null}
            <button
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={this.handleReset}
              type="button"
            >
              다시 시도
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
