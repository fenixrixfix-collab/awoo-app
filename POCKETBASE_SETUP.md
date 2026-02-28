# ⚡ Быстрый старт с PocketBase

## 🚀 Шаг 1: Скачай и запусти PocketBase

1. Открой https://pocketbase.io/docs/
2. Скачай файл для своей ОС:
   - Windows: `pocketbase_windows_amd64.zip`
   - Mac: `pocketbase_darwin_amd64.zip`
3. Распакуй в папку, например `C:\pocketbase\`
4. Открой терминал в этой папке и запусти:

**Windows:**
```bash
pocketbase.exe serve
```

**Mac / Linux:**
```bash
./pocketbase serve
```

5. Увидишь:
```
Server started at http://127.0.0.1:8090
 ↳ REST API: http://127.0.0.1:8090/api/
 ↳ Admin UI: http://127.0.0.1:8090/_/
```

---

## 🔧 Шаг 2: Настрой AdminUI

1. Открой http://127.0.0.1:8090/_/
2. Создай admin аккаунт:
   - Email: любой (например `admin@awoo.ru`)
   - Password: любой (запомни!)
3. Нажми **"Create and login"**

---

## 🗄️ Шаг 3: Создай коллекции

### Коллекция `users` (уже создана автоматически!)

PocketBase автоматически создаёт коллекцию `users`. Нужно только добавить поля:

1. В AdminUI → **Collections** → **users** → **Edit collection**
2. Нажми **"New field"** и добавь:

| Field name | Type   |
|-----------|--------|
| name      | Text   |
| phone     | Text   |
| userType  | Text   |
| postsCount| Number |
| helpCount | Number |

3. Нажми **"Save"**

---

### Коллекция `posts`

1. Collections → **"New collection"**
2. Name: `posts`
3. Type: **Base collection**
4. Добавь поля:

| Field name  | Type   | Required |
|------------|--------|----------|
| type       | Text   | ✅       |
| petName    | Text   | ✅       |
| petType    | Text   |          |
| breed      | Text   |          |
| color      | Text   |          |
| description| Text   |          |
| location   | Text   | ✅       |
| date       | Text   |          |
| reward     | Text   |          |
| image      | File   |          |
| userId     | Text   |          |
| userName   | Text   |          |
| status     | Text   |          |
| views      | Number |          |
| responses  | Number |          |

5. Нажми **"Create"**

---

## 🔐 Шаг 4: Настрой права доступа (API Rules)

### Для коллекции `posts`:

1. Collections → `posts` → **API Rules**
2. Установи:

| Rule      | Value |
|-----------|-------|
| List/Search | `@request.auth.id != ""` |
| View      | `@request.auth.id != ""` |
| Create    | `@request.auth.id != ""` |
| Update    | `@request.auth.id = userId` |
| Delete    | `@request.auth.id = userId` |

3. Нажми **"Save rules"**

---

## 📦 Шаг 5: Установи и запусти React приложение

Открой **отдельный** терминал в папке `awoo-app`:

```bash
npm install
npm start
```

Приложение откроется на http://localhost:3000

---

## ✅ Готово! Два окна терминала:

```
Терминал 1: pocketbase.exe serve  ← база данных
Терминал 2: npm start              ← React приложение
```

**Сначала запускай PocketBase, потом React!**

---

## 🧪 Тестирование:

1. Открой http://localhost:3000
2. Нажми **"Зарегистрироваться"**
3. Заполни форму и создай аккаунт
4. Нажми **"Опубликовать объявление"** (➕ внизу справа)
5. Заполни форму, добавь фото
6. Нажми **"Опубликовать"**
7. Объявление появится в ленте!
8. В AdminUI на http://127.0.0.1:8090/_/ можешь видеть все данные

---

## 🐛 Проблемы?

**"Failed to fetch"**
→ PocketBase не запущен. Запусти `pocketbase.exe serve`

**Ошибка при регистрации**
→ Проверь что коллекция `users` настроена с нужными полями

**Фото не загружается**
→ Проверь что поле `image` типа `File` добавлено в коллекцию `posts`

---

**🐾 Удачи!**
