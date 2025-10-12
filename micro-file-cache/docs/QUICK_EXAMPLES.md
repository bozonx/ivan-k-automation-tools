# Быстрые примеры использования

## Запуск сервиса

```bash
# Установка зависимостей
pnpm install

# Запуск в режиме разработки
pnpm run start:dev

# Или через Docker
docker-compose up -d
```

## Проверка работоспособности

```bash
# Health check (не требует аутентификации)
curl http://localhost:3000/api/v1/health
```

## Загрузка файла

```bash
# Загрузка файла с TTL 1 час
curl -H "Authorization: Bearer your-secret-token" \
  -X POST http://localhost:3000/api/v1/files \
  -F "file=@document.pdf" \
  -F "ttlMinutes=60"
```

## Скачивание файла

```bash
# Скачивание файла по ID
curl -H "Authorization: Bearer your-secret-token" \
  -X GET http://localhost:3000/api/v1/files/FILE_ID/download \
  -O downloaded_file.pdf
```

## JavaScript пример

```javascript
// Загрузка файла
async function uploadFile(file, ttlMinutes = 60) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ttlMinutes', ttlMinutes.toString());

  const response = await fetch('/api/v1/files', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer your-secret-token',
    },
    body: formData,
  });

  return response.json();
}

// Использование
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];
uploadFile(file, 60).then((result) => {
  console.log('File uploaded:', result.data.id);
});
```

## Python пример

```python
import requests

# Загрузка файла
def upload_file(file_path, ttl_minutes=60):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'ttlMinutes': ttl_minutes}
        headers = {'Authorization': 'Bearer your-secret-token'}

        response = requests.post(
            'http://localhost:3000/api/v1/files',
            files=files, data=data, headers=headers
        )
    return response.json()

# Использование
result = upload_file('document.pdf', 60)
print(f"File ID: {result['data']['id']}")
```

## Настройка аутентификации

```bash
# Включить аутентификацию
export AUTH_ENABLED=true
export AUTH_SECRET_KEY=your-secret-key-change-in-production

# Или в .env файле
echo "AUTH_ENABLED=true" >> .env
echo "AUTH_SECRET_KEY=your-secret-key-change-in-production" >> .env
```

## Docker пример

```bash
# Запуск с Docker Compose
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f micro-file-cache
```

## Полные примеры

Для более подробных примеров см. [docs/USAGE_EXAMPLES.md](docs/USAGE_EXAMPLES.md)
