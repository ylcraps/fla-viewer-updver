import { FLAParser } from './fla-parser';
import type { FLADocument, Symbol as FLASymbol } from './types';
import {
  downloadBlob,
  exportSingleFrame,
  exportVideo,
  exportWebM,
} from './video-exporter';

type LibraryItem =
  | { kind: 'symbol'; name: string; detail: string; symbol: FLASymbol }
  | { kind: 'bitmap'; name: string; detail: string; image?: HTMLImageElement }
  | { kind: 'sound'; name: string; detail: string }
  | { kind: 'video'; name: string; detail: string; url?: string };

/** Project library for browsing, playing, and exporting parsed FLA assets. */
export class AssetBrowser {
  private doc: FLADocument | null = null;
  private items: LibraryItem[] = [];
  private selected: LibraryItem | null = null;
  private renderer: FLARenderer | null = null;
  private previewDoc: FLADocument | null = null;
  private canvas: HTMLCanvasElement;
  private panel: HTMLElement;
  private list: HTMLElement;
  private search: HTMLInputElement;
  private details: HTMLElement;
  private status: HTMLElement;
  private currentFrame = 0;
  private animationTimer: number | null = null;

  constructor() {
    this.panel = document.createElement('aside');
    this.panel.className = 'asset-library';
    this.panel.setAttribute('aria-label', 'Библиотека проекта');
    this.panel.innerHTML = `
      <header class="asset-library-header">
        <div><strong>Библиотека проекта</strong><small>MovieClip · символы · ассеты</small></div>
        <button type="button" class="asset-library-close" aria-label="Закрыть библиотеку">×</button>
      </header>
      <label class="asset-library-search-label">Поиск
        <input type="search" class="asset-library-search" placeholder="MovieClip, изображение, звук…">
      </label>
      <div class="asset-library-body">
        <nav class="asset-library-list" aria-label="Ассеты"></nav>
        <section class="asset-library-preview">
          <div class="asset-library-item-title">Загрузите FLA или XFL-файл</div>
          <div class="asset-library-stage-wrap"><canvas class="asset-library-stage"></canvas></div>
          <div class="asset-library-details"></div>
          <div class="asset-library-actions">
            <button type="button" data-action="play" disabled>▶ Воспроизвести</button>
            <button type="button" data-action="png" disabled>Скачать PNG</button>
            <button type="button" data-action="webm" disabled>Экспорт WebM</button>
            <button type="button" data-action="mp4" disabled>Экспорт MP4</button>
          </div>
          <output class="asset-library-status" aria-live="polite">Файлы обрабатываются локально в браузере.</output>
        </section>
      </div>`;
    document.body.appendChild(this.panel);
    this.canvas = this.panel.querySelector('.asset-library-stage')!;
    this.list = this.panel.querySelector('.asset-library-list')!;
    this.search = this.panel.querySelector('.asset-library-search')!;
    this.details = this.panel.querySelector('.asset-library-details')!;
    this.status = this.panel.querySelector('.asset-library-status')!;

    this.installStyles();
    this.installOpenButton();
    this.panel.querySelector('.asset-library-close')!.addEventListener('click', () => this.setOpen(false));
    this.search.addEventListener('input', () => this.renderList());
    this.action('play').addEventListener('click', () => this.togglePlayback());
    this.action('png').addEventListener('click', () => void this.downloadPng());
    this.action('webm').addEventListener('click', () => void this.downloadVideo('webm'));
    this.action('mp4').addEventListener('click', () => void this.downloadVideo('mp4'));
    window.addEventListener('chemycalc:fla-loaded', (event) => {
      this.setDocument((event as CustomEvent<FLADocument>).detail);
    });
  }

  private installOpenButton(): void {
    const header = document.querySelector<HTMLElement>('.fla-header');
    if (!header) return;
    const button = document.createElement('button');
    button.className = 'asset-library-open';
    button.type = 'button';
    button.textContent = 'Библиотека';
    button.addEventListener('click', () => this.setOpen(!this.panel.classList.contains('open')));
    header.appendChild(button);
  }

  private setDocument(doc: FLADocument): void {
    this.stopPlayback();
    this.doc = doc;
    this.items = [
      ...Array.from(doc.symbols.values(), (symbol) => ({
        kind: 'symbol' as const,
        name: symbol.name,
        detail: `${this.symbolLabel(symbol.symbolType)} · ${symbol.timeline.totalFrames} кадров`,
        symbol,
      })),
      ...Array.from(doc.bitmaps.values(), (bitmap) => ({
        kind: 'bitmap' as const,
        name: bitmap.name,
        detail: `Изображение · ${bitmap.width} × ${bitmap.height}`,
        image: bitmap.imageData,
      })),
      ...Array.from(doc.sounds.values(), (sound) => ({
        kind: 'sound' as const,
        name: sound.name,
        detail: sound.format ? `Звук · ${sound.format}` : 'Звук',
      })),
      ...Array.from(doc.videos.values(), (video) => ({
        kind: 'video' as const,
        name: video.name,
        detail: `Видео${video.width ? ` · ${video.width} × ${video.height}` : ''}`,
        url: video.videoUrl,
      })),
    ];
    this.selected = null;
    this.renderer = null;
    this.previewDoc = null;
    this.renderList();
    this.status.textContent = `В библиотеке ${this.items.length} элементов. Выберите MovieClip или ассет.`;
    this.setOpen(true);
  }

  private renderList(): void {
    const query = this.search.value.trim().toLocaleLowerCase();
    const matches = this.items.filter((item) => `${item.name} ${item.detail}`.toLocaleLowerCase().includes(query));
    this.list.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'asset-library-empty';
      empty.textContent = this.doc ? 'Совпадений нет.' : 'Сначала загрузите FLA/XFL-файл.';
      this.list.appendChild(empty);
      return;
    }
    for (const item of matches) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `asset-library-entry${item === this.selected ? ' selected' : ''}`;
      const icon = document.createElement('span');
      icon.className = 'asset-library-icon';
      icon.textContent = ({ symbol: '▶', bitmap: '▧', sound: '♫', video: '▣' })[item.kind];
      const text = document.createElement('span');
      text.className = 'asset-library-entry-text';
      const name = document.createElement('strong');
      name.textContent = item.name;
      const detail = document.createElement('small');
      detail.textContent = item.detail;
      text.append(name, detail);
      button.append(icon, text);
      button.addEventListener('click', () => void this.select(item));
      this.list.appendChild(button);
    }
  }

  private async select(item: LibraryItem): Promise<void> {
    this.stopPlayback();
    this.selected = item;
    this.currentFrame = 0;
    this.renderList();
    this.renderer = null;
    this.previewDoc = null;
    const wrap = this.panel.querySelector<HTMLElement>('.asset-library-stage-wrap')!;
    wrap.replaceChildren(this.canvas);
    this.canvas.width = Math.max(1, this.doc?.width ?? 640);
    this.canvas.height = Math.max(1, this.doc?.height ?? 360);
    this.canvas.getContext('2d')?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.details.textContent = `${item.name} — ${item.detail}`;
    this.setActionState(item);

    if (item.kind === 'symbol' && this.doc) {
      this.previewDoc = { ...this.doc, timelines: [item.symbol.timeline] };
      this.renderer = new FLARenderer(this.canvas);
      await this.renderer.setDocument(this.previewDoc);
      this.renderer.renderFrame(0);
      this.status.textContent = `${item.name}: кадр 1 из ${Math.max(1, item.symbol.timeline.totalFrames)}.`;
      return;
    }
    if (item.kind === 'bitmap' && item.image) {
      this.canvas.width = Math.max(1, item.image.naturalWidth || item.image.width);
      this.canvas.height = Math.max(1, item.image.naturalHeight || item.image.height);
      this.canvas.getContext('2d')?.drawImage(item.image, 0, 0);
      this.status.textContent = 'Изображение готово к сохранению в PNG.';
      return;
    }
    if (item.kind === 'video' && item.url) {
      const video = document.createElement('video');
      video.src = item.url;
      video.controls = true;
      video.playsInline = true;
      video.style.maxWidth = '100%';
      video.style.maxHeight = '100%';
      wrap.replaceChildren(video);
      this.status.textContent = 'Предпросмотр встроенного видео.';
      return;
    }
    this.status.textContent = item.kind === 'sound'
      ? 'Звуковой ассет выбран. Воспроизведение звука через библиотеку пока не поддерживается.'
      : 'Предпросмотр для этого ассета недоступен.';
  }

  private setActionState(item: LibraryItem): void {
    const hasSymbol = item.kind === 'symbol';
    const hasBitmap = item.kind === 'bitmap' && !!item.image;
    this.action('play').disabled = !hasSymbol;
    this.action('png').disabled = !hasBitmap && !hasSymbol;
    this.action('webm').disabled = !hasSymbol;
    this.action('mp4').disabled = !hasSymbol;
  }

  private action(action: string): HTMLButtonElement {
    return this.panel.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!;
  }

  private async downloadPng(): Promise<void> {
    if (!this.selected) return;
    try {
      if (this.selected.kind === 'symbol' && this.previewDoc) {
        const blob = await exportSingleFrame(this.previewDoc, this.currentFrame);
        downloadBlob(blob, `${this.safeName(this.selected.name)}_frame_${String(this.currentFrame + 1).padStart(4, '0')}.png`);
      } else if (this.selected.kind === 'bitmap' && this.selected.image) {
        const bitmapCanvas = document.createElement('canvas');
        bitmapCanvas.width = this.selected.image.naturalWidth || this.selected.image.width;
        bitmapCanvas.height = this.selected.image.naturalHeight || this.selected.image.height;
        bitmapCanvas.getContext('2d')?.drawImage(this.selected.image, 0, 0);
        const blob = await new Promise<Blob>((resolve, reject) => {
          bitmapCanvas.toBlob((result) => result ? resolve(result) : reject(new Error('Не удалось создать PNG')), 'image/png');
        });
        downloadBlob(blob, `${this.safeName(this.selected.name)}.png`);
      }
    } catch (error) {
      this.status.textContent = `Ошибка экспорта PNG: ${(error as Error).message}`;
    }
  }

  private async downloadVideo(format: 'mp4' | 'webm'): Promise<void> {
    if (!this.previewDoc || !this.selected) return;
    this.stopPlayback();
    this.status.textContent = `Создаю ${format.toUpperCase()}…`;
    try {
      const blob = format === 'mp4' ? await exportVideo(this.previewDoc) : await exportWebM(this.previewDoc);
      downloadBlob(blob, `${this.safeName(this.selected.name)}.${format}`);
      this.status.textContent = `${format.toUpperCase()} экспортирован.`;
    } catch (error) {
      this.status.textContent = `Экспорт ${format.toUpperCase()} не удался: ${(error as Error).message}`;
    }
  }

  private togglePlayback(): void {
    if (this.animationTimer !== null) {
      this.stopPlayback();
      return;
    }
    if (!this.selected || this.selected.kind !== 'symbol' || !this.renderer || !this.previewDoc) return;
    const totalFrames = Math.max(1, this.selected.symbol.timeline.totalFrames);
    this.action('play').textContent = 'Ⅱ Пауза';
    this.animationTimer = window.setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % totalFrames;
      this.renderer?.advanceMovieClipPlayheads();
      this.renderer?.renderFrame(this.currentFrame);
      this.status.textContent = `${this.selected?.name}: кадр ${this.currentFrame + 1} из ${totalFrames}.`;
    }, 1000 / Math.max(1, this.previewDoc.frameRate));
  }

  private stopPlayback(): void {
    if (this.animationTimer !== null) window.clearInterval(this.animationTimer);
    this.animationTimer = null;
    this.action('play').textContent = '▶ Воспроизвести';
  }

  private symbolLabel(type: FLASymbol['symbolType']): string {
    return type === 'movieclip' ? 'MovieClip' : type === 'graphic' ? 'Графический символ' : 'Кнопка';
  }

  private safeName(name: string): string {
    return name.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_') || 'asset';
  }

  private setOpen(open: boolean): void {
    this.panel.classList.toggle('open', open);
  }

  private installOpenButton(): void {
    const header = document.querySelector<HTMLElement>('.fla-header');
    if (!header) return;
    const button = document.createElement('button');
    button.className = 'asset-library-open';
    button.type = 'button';
    button.textContent = 'Библиотека';
    button.addEventListener('click', () => this.setOpen(!this.panel.classList.contains('open')));
    header.appendChild(button);
  }

  private installStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .asset-library{position:fixed;z-index:10000;inset:0 0 0 auto;width:min(760px,100vw);background:#111827;color:#e5e7eb;border-left:1px solid #374151;box-shadow:-16px 0 40px #0008;display:none;grid-template-rows:auto auto 1fr;font:14px/1.45 system-ui,sans-serif}
      .asset-library.open{display:grid}.asset-library-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #374151;background:#1f2937}
      .asset-library-header strong,.asset-library-header small{display:block}.asset-library-header strong{font-size:17px}.asset-library-header small{color:#9ca3af;margin-top:3px}.asset-library-close{font-size:25px;color:#d1d5db;background:transparent;border:0;cursor:pointer}
      .asset-library-open{margin-left:auto;background:#2563eb;color:#fff;border:0;border-radius:6px;padding:7px 12px;cursor:pointer}.asset-library-search-label{display:grid;gap:6px;padding:12px 16px;color:#9ca3af}.asset-library-search{padding:10px 12px;border-radius:7px;border:1px solid #4b5563;background:#0b1220;color:#fff}
      .asset-library-body{display:grid;grid-template-columns:minmax(210px,34%) 1fr;min-height:0}.asset-library-list{overflow:auto;padding:8px;border-right:1px solid #374151}.asset-library-entry{width:100%;display:flex;align-items:center;gap:10px;text-align:left;background:transparent;color:#e5e7eb;border:1px solid transparent;border-radius:7px;padding:9px;cursor:pointer}.asset-library-entry:hover,.asset-library-entry.selected{background:#1e293b;border-color:#3b82f6}.asset-library-icon{width:28px;height:28px;display:grid;place-items:center;background:#26344a;border-radius:6px;color:#93c5fd}.asset-library-entry-text{min-width:0}.asset-library-entry-text strong,.asset-library-entry-text small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.asset-library-entry-text small,.asset-library-empty{color:#9ca3af;font-size:12px}
      .asset-library-preview{padding:16px;display:flex;flex-direction:column;gap:12px;min-width:0;overflow:auto}.asset-library-item-title{font-size:16px;font-weight:600}.asset-library-stage-wrap{min-height:180px;flex:1;display:grid;place-items:center;overflow:auto;background-color:#202a38;background-image:linear-gradient(45deg,#ffffff0a 25%,transparent 25%),linear-gradient(-45deg,#ffffff0a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ffffff0a 75%),linear-gradient(-45deg,transparent 75%,#ffffff0a 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0}.asset-library-stage{max-width:100%;max-height:100%;object-fit:contain}.asset-library-details{color:#cbd5e1;overflow-wrap:anywhere}.asset-library-actions{display:flex;flex-wrap:wrap;gap:8px}.asset-library-actions button{background:#263449;color:#f3f4f6;border:1px solid #475569;border-radius:6px;padding:8px 11px;cursor:pointer}.asset-library-actions button:hover:not(:disabled){background:#1d4ed8}.asset-library-actions button:disabled{opacity:.45;cursor:not-allowed}.asset-library-status{min-height:20px;color:#93c5fd;font-size:12px}
      @media(max-width:600px){.asset-library-body{grid-template-columns:1fr;grid-template-rows:minmax(150px,34%) 1fr}.asset-library-list{border-right:0;border-bottom:1px solid #374151}}
    `;
    document.head.appendChild(style);
  }
}
