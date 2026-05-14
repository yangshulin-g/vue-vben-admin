import { reactive } from 'vue';

export interface CustomerUserInfo {
  customerId?: number;
  id?: number | string;
  phone?: string;
  userType?: string;
  username?: string;
}

const STORAGE_KEY = 'bizport-h5-session';

export const sessionState = reactive<{
  token: string;
  user: CustomerUserInfo | null;
}>({
  token: '',
  user: null,
});

export function loadSession() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as {
      token?: string;
      user?: CustomerUserInfo | null;
    };
    sessionState.token = parsed.token || '';
    sessionState.user = parsed.user || null;
  } catch {
    clearSession();
  }
}

export function saveSession(token: string, user: CustomerUserInfo | null) {
  sessionState.token = token;
  sessionState.user = user;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token,
      user,
    }),
  );
}

export function clearSession() {
  sessionState.token = '';
  sessionState.user = null;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getCurrentCustomerId() {
  const customerId = sessionState.user?.customerId;
  if (!customerId) {
    throw new Error('未获取到客户信息，请重新登录');
  }
  return Number(customerId);
}

loadSession();
