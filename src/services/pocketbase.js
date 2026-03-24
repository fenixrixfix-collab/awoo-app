import PocketBase from 'pocketbase';

// PocketBase конфигурация
const POCKETBASE_URL = process.env.REACT_APP_POCKETBASE_URL || 'https://awoo-app-v2.duckdns.org';
const pb = new PocketBase(POCKETBASE_URL);

// Автоматически обновляем токен
pb.autoCancellation(false);

export default pb;

// Хелпер для получения URL изображения
export const getImageUrl = (record, filename) => {
  if (!filename) return null;
  return pb.files.getUrl(record, filename);
};

// Хелпер для получения текущего пользователя
export const getCurrentUser = () => {
  return pb.authStore.model;
};

// Хелпер для проверки авторизации
export const isAuthenticated = () => {
  return pb.authStore.isValid;
};
