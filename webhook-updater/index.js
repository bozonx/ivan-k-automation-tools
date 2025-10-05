#!/usr/bin/env node

const http = require("http");
const { exec } = require("child_process");
const { promisify } = require("util");
const url = require("url");

// Промис-версия exec для удобства работы с async/await
const execAsync = promisify(exec);

// Переменная окружения для токена авторизации
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const REPO_BASE_PATH = "/data/repos";
const COMPOSE_BASE_PATH = "/data/compose";

// Порт сервера (можно задать через переменную окружения)
const PORT = process.env.PORT || 80;

// Функция для логирования с временной меткой
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Функция для проверки токена авторизации
function checkAuthToken(requestToken) {
  const envToken = process.env.AUTH_TOKEN;

  // Если AUTH_TOKEN не задан, авторизация не требуется
  if (!envToken) {
    return true;
  }

  // Если токен задан, проверяем совпадение
  return requestToken === envToken;
}

// Функция для выполнения git pull
async function performGitPull(repo, compose = null) {
  const repoPath = `${REPO_BASE_PATH}/${repo}`;

  try {
    log(`Выполняю git pull для репозитория: ${repo}`);

    // Проверяем существование директории
    await execAsync(`test -d "${repoPath}"`);

    // Выполняем git pull
    const { stdout, stderr } = await execAsync(`cd "${repoPath}" && git pull`);

    log(`Git pull выполнен успешно для ${repo}: ${stdout}`);

    const result = { success: true, output: stdout };

    // Если передан параметр compose, перезапускаем docker-compose контейнеры
    if (compose) {
      log(`Перезапускаю docker-compose контейнеры для: ${compose}`);
      const composeResult = await performDockerComposeUpdate(compose);

      if (composeResult.success) {
        result.composeUpdate = {
          success: true,
          compose: compose,
          pullOutput: composeResult.pullOutput,
          restartOutput: composeResult.restartOutput,
        };
        log(`Docker-compose перезапуск выполнен успешно для ${compose}`);
      } else {
        result.composeUpdate = {
          success: false,
          compose: compose,
          error: composeResult.error,
        };
        log(
          `Ошибка при перезапуске docker-compose для ${compose}: ${composeResult.error}`
        );
      }
    }

    return result;
  } catch (error) {
    log(`Ошибка при выполнении git pull для ${repo}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Функция для выполнения docker-compose операций
async function performDockerComposeUpdate(compose) {
  const composePath = `${COMPOSE_BASE_PATH}/${compose}`;

  try {
    log(`Выполняю docker-compose pull и restart для: ${compose}`);

    // Проверяем существование директории
    await execAsync(`test -d "${composePath}"`);

    // Проверяем наличие docker-compose.yml или docker-compose.yaml
    await execAsync(
      `test -f "${composePath}/docker-compose.yml" -o -f "${composePath}/docker-compose.yaml"`
    );

    // Выполняем docker-compose pull
    const pullResult = await execAsync(
      `cd "${composePath}" && docker-compose pull`
    );
    log(`Docker-compose pull выполнен для ${compose}: ${pullResult.stdout}`);

    // Выполняем docker-compose restart
    const restartResult = await execAsync(
      `cd "${composePath}" && docker-compose restart`
    );
    log(
      `Docker-compose restart выполнен для ${compose}: ${restartResult.stdout}`
    );

    return {
      success: true,
      pullOutput: pullResult.stdout,
      restartOutput: restartResult.stdout,
    };
  } catch (error) {
    log(
      `Ошибка при выполнении docker-compose операций для ${compose}: ${error.message}`
    );
    return { success: false, error: error.message };
  }
}

// Функция для отправки HTTP ответа
function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
}

// Основной обработчик запросов
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // Логируем входящий запрос
  log(`Получен ${req.method} запрос на ${pathname}`);

  // Обрабатываем только GET запросы на корневой путь
  if (req.method !== "GET" || pathname !== "/") {
    sendResponse(res, 404, {
      error: "Not Found",
      message: "Только GET запросы на / поддерживаются",
    });
    return;
  }

  // Извлекаем параметры из query string
  const { repo, compose, token } = query;

  // Проверяем токен авторизации если он передан
  if (token && !checkAuthToken(token)) {
    log("Неверный токен авторизации");
    sendResponse(res, 401, {
      error: "Unauthorized",
      message: "Неверный токен авторизации",
    });
    return;
  }

  // Определяем тип операции и выполняем соответствующее действие
  if (repo) {
    const result = await performGitPull(repo, compose);

    if (result.success) {
      const response = {
        success: true,
        operation: "git_pull",
        repo: repo,
        output: result.output,
      };

      // Добавляем информацию о docker-compose обновлении если оно было выполнено
      if (result.composeUpdate) {
        response.composeUpdate = result.composeUpdate;
      }

      sendResponse(res, 200, response);
    } else {
      sendResponse(res, 500, {
        success: false,
        operation: "git_pull",
        repo: repo,
        error: result.error,
      });
    }
  } else if (compose) {
    const result = await performDockerComposeUpdate(compose);

    if (result.success) {
      sendResponse(res, 200, {
        success: true,
        operation: "docker_compose_update",
        compose: compose,
        pullOutput: result.pullOutput,
        restartOutput: result.restartOutput,
      });
    } else {
      sendResponse(res, 500, {
        success: false,
        operation: "docker_compose_update",
        compose: compose,
        error: result.error,
      });
    }
  } else {
    // Если не указаны ни repo, ни compose
    sendResponse(res, 400, {
      error: "Bad Request",
      message: "Необходимо указать параметр repo или compose",
    });
  }
}

// Создаем HTTP сервер
const server = http.createServer(handleRequest);

// Обработчик ошибок сервера
server.on("error", (error) => {
  log(`Ошибка сервера: ${error.message}`);
  process.exit(1);
});

// Запускаем сервер
server.listen(PORT, () => {
  log(`Вебхук сервер запущен на порту ${PORT}`);
  log(`Использование:`);
  log(`  GET /?repo=<repository_name> - выполнить git pull`);
  log(
    `  GET /?repo=<repository_name>&compose=<compose_name> - выполнить git pull и перезапустить docker-compose`
  );
  log(
    `  GET /?compose=<compose_name> - выполнить docker-compose pull и restart`
  );
  log(`  GET /?token=<auth_token> - передать токен авторизации (опционально)`);

  if (process.env.AUTH_TOKEN) {
    log(`Авторизация включена (AUTH_TOKEN задан)`);
  } else {
    log(`Авторизация отключена (AUTH_TOKEN не задан)`);
  }
});

// Обработчик для graceful shutdown
process.on("SIGTERM", () => {
  log("Получен SIGTERM, завершаю работу сервера...");
  server.close(() => {
    log("Сервер остановлен");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  log("Получен SIGINT, завершаю работу сервера...");
  server.close(() => {
    log("Сервер остановлен");
    process.exit(0);
  });
});
