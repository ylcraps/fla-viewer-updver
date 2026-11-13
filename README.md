# FLA Viewer

Браузерный просмотрщик файлов Adobe Animate/Flash FLA и XFL. Разбор, воспроизведение и экспорт выполняются локально в браузере. В мобильной версии доступно меню управления воспроизведением: открыть файл, старт/пауза, стоп, переход по кадрам и перемотка ползунком.

## Возможности

- Просмотр FLA/XFL, сцен, слоёв, MovieClip и символов.
- Воспроизведение, пауза, остановка, переход на предыдущий/следующий кадр и перемотка.
- Экспорт кадров/анимаций в PNG, GIF, SVG, WebM и MP4 (в зависимости от поддержки браузера и устройства).
- Библиотека проекта для выбора MovieClip и ассетов.
- Обработка файлов происходит на устройстве; файл не загружается на сервер.

## Запуск в браузере

Нужен Node.js 20 или новее.

```bash
git clone https://github.com/ylcraps/fla-viewer-updver.git
cd fla-viewer-updver
npm install
npm run dev
```

Откройте локальный адрес Vite, обычно `http://localhost:3000`, затем выберите FLA-файл или папку XFL.

## Сборка Android APK из командной строки Windows

Android Studio не обязательна, но нужны Node.js 20+, JDK 17+ и Android SDK Command-line Tools. Установите SDK Platform Tools, Android Platform и Build Tools; примите лицензии через `sdkmanager --licenses`. Укажите путь к SDK в CMD (замените путь на свой):

```bat
set ANDROID_HOME=C:\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
```

### 1. Установить Capacitor

В корне проекта выполните:

```bat
npm install @capacitor/core @capacitor/android
npm install --save-dev @capacitor/cli
```

Создайте `capacitor.config.ts` в корне проекта:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ylcraps.flaviewer',
  appName: 'FLA Viewer',
  webDir: 'dist',
};

export default config;
```

### 2. Настроить пути Vite

Чтобы ресурсы приложения открывались в Android WebView, настройте `base` в `vite.config.ts` на `./` для Android-сборки, сохранив `/fla-viewer-updver/` для GitHub Pages. Например:

```ts
base: process.env.CAPACITOR_BUILD === '1'
  ? './'
  : process.env.GITHUB_ACTIONS
    ? '/fla-viewer-updver/'
    : '/',
```

### 3. Создать Android-проект и собрать APK

При первом запуске:

```bat
npx cap add android
set CAPACITOR_BUILD=1
npm run build
npx cap sync android
cd android
gradlew.bat assembleDebug
```

При следующих сборках начинайте с `set CAPACITOR_BUILD=1`, затем повторите `npm run build`, `npx cap sync android` и `cd android && gradlew.bat assembleDebug`.

Готовый тестовый APK:

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

Скопируйте APK на телефон и установите. Для публикации в Google Play потребуется отдельная release-сборка и подпись ключом; debug APK предназначен для тестирования.

## Сборка в Termux

Теоретически сборка возможна на некоторых 64-битных устройствах, но Android SDK/Gradle toolchain в Termux поддерживается хуже, чем на Windows/Linux. Могут возникнуть проблемы с архитектурой, SDK build-tools или памятью. Для надёжной сборки используйте Windows/Linux с JDK и Android SDK. APK можно затем перенести на телефон.

## Ограничения

- Поддержка MP4/WebM и кодеков зависит от браузера/Android WebView и конкретного устройства; проверяйте экспорт на телефоне.
- ActionScript не исполняется.
- Некоторые эффекты и старые форматы поддерживаются частично.
- Первая сборка Android скачивает зависимости и требует интернет; последующие могут использовать локальный Gradle-кэш.

## Тесты

```bash
npx playwright install chromium
npm test
```

## Лицензия

ISC. См. `package.json`.

Основано на [lifeart/fla-viewer](https://github.com/lifeart/fla-viewer); сохраняйте лицензионные уведомления исходного проекта.
