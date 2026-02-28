# 🐾 AWOO - Платформа для поиска домашних животных

Комплексная веб-платформа для помощи в поиске потерянных животных, волонтёрской поддержки и предоставления услуг для домашних питомцев.

## 📋 Описание

AWOO объединяет:
- **Потерял/Нашел** - объявления о потерянных и найденных животных
- **Волонтёры** - помощь в поиске, передержке, транспортировке
- **Услуги** - ветеринары, зоотакси, грумеры, кинологи, передержка
- **Чаты** - общение между пользователями

## 🚀 Быстрый старт

### Предварительные требования

- Node.js (v14 или выше)
- npm или yarn
- Аккаунт Firebase

### 1. Установка зависимостей

```bash
cd awoo-app
npm install
```

### 2. Настройка Firebase

1. Создайте проект в [Firebase Console](https://console.firebase.google.com/)
2. Включите следующие сервисы:
   - Authentication (Email/Password, Google)
   - Firestore Database
   - Storage
3. Получите конфигурацию Firebase (Project Settings → General → Your apps)
4. Откройте `src/services/firebase.js` и замените данные:

```javascript
const firebaseConfig = {
  apiKey: "ВАШ_API_KEY",
  authDomain: "ВАШ_PROJECT_ID.firebaseapp.com",
  projectId: "ВАШ_PROJECT_ID",
  storageBucket: "ВАШ_PROJECT_ID.appspot.com",
  messagingSenderId: "ВАШ_MESSAGING_SENDER_ID",
  appId: "ВАШ_APP_ID"
};
```

### 3. Настройка Firestore Database

Создайте следующие коллекции в Firestore:

- `users` - пользователи
- `posts` - объявления (потерял/нашел)
- `volunteers` - волонтёры
- `services` - услуги (ветеринары, грумеры и т.д.)
- `chats` - чаты
- `messages` - сообщения

### 4. Правила безопасности Firestore

В Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Пользователи могут читать свой профиль и писать в него
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Объявления доступны всем авторизованным
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    // Остальные коллекции аналогично
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Правила безопасности Storage

В Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.resource.size < 5 * 1024 * 1024; // 5MB max
    }
  }
}
```

### 6. Запуск приложения

```bash
npm start
```

Приложение откроется на `http://localhost:3000`

## 📂 Структура проекта

```
awoo-app/
├── public/
│   └── index.html
├── src/
│   ├── components/      # Переиспользуемые компоненты
│   │   ├── BottomNav.js
│   │   ├── Header.js
│   │   └── PostCard.js
│   ├── pages/          # Страницы приложения
│   │   ├── SplashScreen.js
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Home.js
│   │   ├── CreatePost.js
│   │   ├── Profile.js
│   │   └── ...
│   ├── services/       # Сервисы (Firebase и др.)
│   │   └── firebase.js
│   ├── styles/         # CSS файлы
│   │   └── App.css
│   ├── App.js         # Главный компонент
│   └── index.js       # Точка входа
├── package.json
└── README.md
```

## 🎨 Основные функции

### Авторизация
- Регистрация (Email + пароль)
- Вход
- Восстановление пароля
- Профиль пользователя

### Потерял/Нашел
- Создание объявления с фото
- Геолокация (место потери)
- Фильтры (вид животного, район, дата)
- Карта с объявлениями
- Уведомления о совпадениях

### Волонтёры
- Каталог волонтёров
- Доска запросов о помощи
- Система откликов
- Рейтинги и отзывы

### Услуги
- Передержка (платная/бесплатная)
- Ветеринары
- Зоотакси
- Грумеры
- Кинологи

### Чаты
- Личные сообщения
- Уведомления о новых сообщениях
- История переписки

## 🔧 Технологии

- **Frontend:** React 18
- **Routing:** React Router v6
- **Backend:** Firebase
  - Authentication
  - Firestore Database
  - Storage
- **Styling:** CSS (модульный)

## 📱 Адаптивность

Приложение полностью адаптировано под мобильные устройства:
- Оптимизировано для телефонов (iOS/Android)
- Работает на планшетах
- Поддержка десктопов

## 🔐 Безопасность

- Все данные защищены правилами Firebase
- Авторизация обязательна для доступа
- Загрузка файлов ограничена по размеру (5MB)
- Валидация данных на клиенте и сервере

## 🚀 Деплой

### Firebase Hosting

```bash
# Установка Firebase CLI
npm install -g firebase-tools

# Вход в Firebase
firebase login

# Инициализация проекта
firebase init hosting

# Сборка приложения
npm run build

# Деплой
firebase deploy
```

### Другие платформы
- Vercel
- Netlify
- GitHub Pages

## 📝 Roadmap

- [ ] Push-уведомления
- [ ] Интеграция с соцсетями (VK, Telegram)
- [ ] Мобильное приложение (React Native)
- [ ] Платёжная система
- [ ] Расширенная аналитика
- [ ] Multi-city support

## 🤝 Поддержка

Вопросы и предложения: [GitHub Issues]

## 📄 Лицензия

MIT License

---

**Создано с ❤️ для помощи животным**

🐕 🐈 🐾
