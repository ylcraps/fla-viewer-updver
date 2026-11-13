# FLA Viewer (обновлённая версия)

Браузерный просмотрщик проектов Adobe Animate/Flash FLA и XFL. Основной интерфейс и таймлайн основаны на [lifeart/fla-viewer](https://github.com/lifeart/fla-viewer). Файлы разбираются на устройстве пользователя и не отправляются на сервер.

## Возможности

- Просмотр FLA/XFL, сцен, слоёв и анимаций.
- Воспроизведение, пауза, остановка, переход по кадрам и перемотка таймлайна.
- Мобильное меню: открыть файл, play/pause, stop, следующий/предыдущий кадр и ползунок перемотки.
- Библиотека проекта: выбор MovieClip, графических символов, кнопок, bitmap, звуков и встроенного видео.
- Предпросмотр выбранного MovieClip и экспорт его кадра в PNG, анимации в WebM/MP4 (если кодеки поддерживаются браузером).
- Экспорт через основное меню: MP4, WebM, GIF, PNG-последовательность, текущий PNG/SVG-кадр и sprite sheet.

## Запуск сайта локально

Требуется Node.js 20 или новее:

```bash
git clone https://github.com/ylcraps/fla-viewer-updver.git
cd fla-viewer-updver
npm install
npm run dev
```

Откройте URL Vite (обычно `http://localhost:3000`), загрузите FLA/XFL, затем нажмите **Библиотека** в верхней панели. В основной панели таймлайна можно ставить анимацию на паузу и перематывать её.

## Сборка Android APK на Windows без Android Studio

Нужны Node.js 20+, JDK 17+ и Android SDK Command-line Tools. Установите SDK-платформу и build-tools, затем примите лицензии через `sdkmanager --licenses`. Укажите путь к SDK в CMD, заменив пример на свой:

```bat
set ANDROID_HOME=C:\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
```

Далее из корня проекта:

```bat
npm install @capacitor/core @capacitor/android
npm install --save-dev @capacitor/cli
npx cap add android
```

Создайте `capacitor.config.ts` в корне:

```ts
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.ylcraps.flaviewer',
  appName: 'FLA Viewer',
  webDir: 'dist',
};
export default config;
```

В `vite.config.ts` задайте `base: './'` для Android-сборки (смотрите условия `CAPACITOR_BUILD` в конфигурации). Затем соберите APK:

```bat
set CAPACITOR_BUILD=1
npm run build
npx cap sync android
cd android
gradlew.bat assembleDebug
```

Файл появится здесь:

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

APK является debug-сборкой для установки и тестирования, не Play Store release. MP4/WebM-экспорт зависит от WebView и кодеков конкретного Android-устройства. Подробный Windows-рецепт: [ANDROID_BUILD_WINDOWS.md](ANDROID_BUILD_WINDOWS.md).

## Ограничения

- ActionScript не исполняется.
- Совместимость с отдельными старыми бинарными FLA и эффектами частичная.
- MP4/WebM требуют подходящего WebCodecs encoder; наличие зависит от браузера/устройства.
- Звук виден в библиотеке, но отдельное воспроизведение выбранного звукового ассета из библиотеки пока не реализовано.

## Тесты

```bash
npx playwright install chromium
npm test
```

## Лицензия

ISC (см. `package.json`). При распространении сохраняйте upstream copyright/licence notices.
