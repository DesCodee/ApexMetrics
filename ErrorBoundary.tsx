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
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 text-3xl">
            ⚡
          </div>

          <h1 className="text-xl font-bold mb-2">Произошел сбой экрана</h1>
          
          <p className="text-xs text-neutral-400 max-w-xs mb-4 leading-relaxed">
            {hasActiveWorkout
              ? 'Прогресс твоей текущей тренировки сохранён в защищённом хранилище.'
              : 'Приложение столкнулось с непредвиденной ошибкой.'}
          </p>

          <div className="w-full max-w-xs space-y-2 mb-6">
            <button
              onClick={this.handleReloadAndContinue}
              className="w-full bg-[#D4FF00] hover:bg-[#bce300] text-black font-bold py-3.5 px-4 rounded-xl text-sm shadow-[0_0_20px_rgba(212,255,0,0.25)] active:scale-[0.98] transition-all cursor-pointer"
            >
              Перезагрузить и продолжить
            </button>

            <button
              onClick={this.handleResetCache}
              className="w-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white font-medium py-2.5 px-4 rounded-xl text-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              Сбросить кэш сессии
            </button>
          </div>

          <details className="w-full max-w-sm text-left">
            <summary className="text-xs text-neutral-400 hover:text-white cursor-pointer font-mono mb-2">
              Технические подробности
            </summary>
            <pre className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-neutral-300 overflow-auto max-h-36">
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

