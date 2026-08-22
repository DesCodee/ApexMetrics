import WebApp from '@twa-dev/sdk';
import { useEffect, useState, useCallback } from 'react';
import type { UserProfile } from '../types';

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      WebApp.ready();
      WebApp.expand();
      
      // Prevent closing on swipe down in some clients
      WebApp.enableClosingConfirmation();
      
      // Set header and background color to match our theme
      WebApp.setHeaderColor('#09090b');
      WebApp.setBackgroundColor('#09090b');

      if (WebApp.initDataUnsafe?.user) {
        setUser({
          id: WebApp.initDataUnsafe.user.id,
          firstName: WebApp.initDataUnsafe.user.first_name,
          lastName: WebApp.initDataUnsafe.user.last_name,
          username: WebApp.initDataUnsafe.user.username,
          languageCode: WebApp.initDataUnsafe.user.language_code,
        });
      } else {
        // Mock user for local development outside Telegram
        setUser({
          id: 123456789,
          firstName: 'Илья',
          username: 'ilya_apex',
          languageCode: 'ru'
        });
      }
      setIsReady(true);
    }
  }, []);

  const showMainButton = useCallback((text: string, onClick: () => void) => {
    if (WebApp.MainButton) {
      WebApp.MainButton.setText(text);
      WebApp.MainButton.setParams({
        color: '#4ade80', // neon green
        text_color: '#000000',
        is_active: true,
        is_visible: true
      });
      WebApp.MainButton.onClick(onClick);
      WebApp.MainButton.show();
    }
  }, []);

  const hideMainButton = useCallback(() => {
    if (WebApp.MainButton) {
      WebApp.MainButton.hide();
      WebApp.MainButton.offClick(() => {});
    }
  }, []);

  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    if (WebApp.HapticFeedback) {
      WebApp.HapticFeedback.impactOccurred(style);
    }
  }, []);

  return {
    isReady,
    user,
    webApp: WebApp,
    showMainButton,
    hideMainButton,
    triggerHaptic
  };
}
