import React, { Component, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2">Критическая ошибка</h1>
          <p className="text-sm text-neutral-400 max-w-sm mb-4">{this.state.error?.message}</p>
          <pre className="text-left bg-neutral-900 p-4 rounded-xl text-[10px] text-neutral-500 overflow-auto max-w-full">
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}
