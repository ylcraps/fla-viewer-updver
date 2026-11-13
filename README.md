# FLA Viewer (обновлённая версия)

Локальный в браузере просмотрщик Adobe Animate/Flash FLA и XFL, основанный на [lifeart/fla-viewer](https://github.com/lifeart/fla-viewer). Файлы обрабатываются на устройстве пользователя и не отправляются на сервер.

## Возможности форка

- Просмотр сцен и анимаций, воспроизведение, пауза, остановка, покадровая навигация и перемотка таймлайна.
- На мобильных устройствах — компактное меню управления файлами и воспроизведением.
- Библиотека проекта с поиском MovieClip, графических символов, кнопок, bitmap, звуков и встроенного видео.
- Предпросмотр выбранного символа и экспорт его кадра в PNG, всей анимации в WebM/MP4 (если браузер поддерживает кодеки).
- Основное меню экспорта: MP4, WebM, GIF, последовательность PNG, кадр PNG/SVG и sprite sheet.

## Запуск сайта локально

Требуется Node.js 20 или новее.

```bash
git clone https://github.com/ylcraps/fla-viewer-updver.git
cd fla-viewer-updver
npm install
npm run dev
```

Откройте адрес Vite (обычно `http://localhost:3000`), загрузите FLA/XFL и нажмите **Библиотека** в верхней панели, чтобы найти и выбрать MovieClip или ассет.

## Сборка APK на Windows без Android Studio

Нужны Node.js 20+, JDK 17+ и Android SDK Command-line Tools. Установите Android платформу/build-tools и примите лицензии SDK через `sdkmanager --licenses`. В CMD укажите свой путь к SDK:

```bat
set ANDROID_HOME=C:\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
```

Установите Capacitor и создайте Android-проект:

```bat
npm install @capacitor/core @capacitor/android
npm install --save-dev @capacitor/cli
npx cap add android
```

Добавьте в корень проекта `capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.ylcraps.flaviewer',
  appName: 'FLA Viewer',
  webDir: 'dist',
};
export default config;
```

Соберите Android-версию из корня проекта:

```bat
set CAPACITOR_BUILD=1
npm run build
npx cap sync android
cd android
gradlew.bat assembleDebug
```

APK будет в `android\app\build\outputs\apk\debug\app-debug.apk`. Это тестовая debug-сборка. Экспорт MP4/WebM зависит от кодеков Android WebView на конкретном устройстве.

Подробности: [ANDROID_BUILD_WINDOWS.md](ANDROID_BUILD_WINDOWS.md).

## Ограничения

- ActionScript не исполняется; некоторые старые бинарные FLA и эффекты поддерживаются частично.
- Кодеки для видеоэкспорта зависят от браузера/устройства.
- Звуки отображаются в библиотеке, но отдельное воспроизведение выбранного звукового ассета из неё пока не реализовано.

## Тесты

```bash
npx playwright install chromium
npm test
```

## Лицензия

ISC (см. `package.json`). Сохраняйте уведомления об авторских правах и лицензии исходного проекта при распространении.
