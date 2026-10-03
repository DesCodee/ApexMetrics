import React, { ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  hasActiveWorkout: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      hasActiveWorkout: false
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary captured exception:', error, errorInfo);

    try {
      // 1. Check if there is an active workout session in localStorage
      const activeSession = localStorage.getItem('apex_active_session');
      const sessionData = localStorage.getItem('apex_session_data');
      const sessionStart = localStorage.getItem('apex_session_start_time');

      if (activeSession && sessionData) {
        // Create an emergency snapshot with timestamp
        localStorage.setItem('apex_emergency_backup_session', activeSession);
        localStorage.setItem('apex_emergency_backup_data', sessionData);
        if (sessionStart) {
          localStorage.setItem('apex_emergency_backup_start', sessionStart);
        }
        this.setState({ hasActiveWorkout: true });
      }
    } catch (e) {
      console.warn('Could not write emergency backup', e);
    }
  }

  private handleReloadAndContinue = () => {
    try {
      // Ensure emergency backup is pushed back to active keys if needed
      const backupSession = localStorage.getItem('apex_emergency_backup_session');
      const backupData = localStorage.getItem('apex_emergency_backup_data');
      if (backupSession && backupData) {
        localStorage.setItem('apex_active_session', backupSession);
        localStorage.setItem('apex_session_data', backupData);
      }
    } catch {}
    window.location.reload();
  };

  private handleResetCache = () => {
    if (confirm('Сбросить временный кэш приложения? Данные профиля останутся в безопасности.')) {
      try {
        localStorage.removeItem('apex_active_session');
        localStorage.removeItem('apex_session_data');
        localStorage.removeItem('apex_session_start_time');
        localStorage.removeItem('apex_emergency_backup_session');
        localStorage.removeItem('apex_emergency_backup_data');
        localStorage.removeItem('apex_rest_target_ts');
      } catch {}
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const { hasActiveWorkout } = this.state;

      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4 text-amber-400 text-2xl">
            ⚡
          </div>

          <h1 className="text-xl font-light tracking-tight text-white mb-2 font-sans">Произошел сбой экрана</h1>
          
          <p className="text-xs text-neutral-400 max-w-xs mb-6 leading-relaxed font-normal">
            {hasActiveWorkout
              ? 'Прогресс твоей текущей тренировки сохранён в защищённом хранилище.'
              : 'Приложение столкнулось с непредвиденной ошибкой.'}
          </p>

          <div className="w-full max-w-xs space-y-2.5 mb-6">
            <button
              onClick={this.handleReloadAndContinue}
              className="w-full bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer shadow-none"
            >
              Перезагрузить и продолжить
            </button>

            <button
              onClick={this.handleResetCache}
              className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white font-normal py-3 px-4 rounded-xl text-xs uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer"
            >
              Сбросить кэш сессии
            </button>
          </div>

          <details className="w-full max-w-sm text-left">
            <summary className="text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer mb-2 font-normal">
              Технические подробности
            </summary>
            <pre className="bg-white/[0.02] p-3 rounded-xl text-xs text-neutral-400 overflow-auto max-h-36 font-mono">
              {this.state.error?.message}
              {'\n'}
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}

