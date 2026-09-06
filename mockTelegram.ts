export function initMockTelegram() {
  if (typeof window === 'undefined') return;

  if (process.env.NODE_ENV === 'development' && !(window as any).Telegram?.WebApp?.initData) {
    console.log('[Dev] Initializing Mock Telegram WebApp');

    (window as any).Telegram = {
      WebApp: {
        initData: "mock_init_data",
        initDataUnsafe: {
          user: {
            id: 777000,
            first_name: "Dev",
            last_name: "User",
            username: "devuser",
            language_code: "ru",
          },
        },
        version: "6.0",
        platform: "tdesktop",
        colorScheme: "dark",
        themeParams: {
          bg_color: "#000000",
          text_color: "#ffffff",
        },
        isExpanded: true,
        viewportHeight: window.innerHeight,
        viewportStableHeight: window.innerHeight,
        headerColor: "#000000",
        backgroundColor: "#000000",
        
        ready: () => console.log('[Mock TG] ready() called'),
        expand: () => console.log('[Mock TG] expand() called'),
        close: () => console.log('[Mock TG] close() called'),
        setHeaderColor: (color: string) => console.log('[Mock TG] setHeaderColor:', color),
        setBackgroundColor: (color: string) => console.log('[Mock TG] setBackgroundColor:', color),
        enableClosingConfirmation: () => console.log('[Mock TG] enableClosingConfirmation()'),
        disableClosingConfirmation: () => console.log('[Mock TG] disableClosingConfirmation()'),
        showAlert: (msg: string) => alert(`[Mock TG Alert] ${msg}`),
        showConfirm: (msg: string, cb: (ok: boolean) => void) => cb(confirm(`[Mock TG Confirm] ${msg}`)),
        
        HapticFeedback: {
          impactOccurred: (style: string) => console.log(`[Mock TG Haptic] impactOccurred: ${style}`),
          notificationOccurred: (type: string) => console.log(`[Mock TG Haptic] notificationOccurred: ${type}`),
          selectionChanged: () => console.log('[Mock TG Haptic] selectionChanged'),
        },
      }
    };
  }
}
