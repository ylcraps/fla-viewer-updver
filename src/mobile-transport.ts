/** Adds an optional phone-friendly playback menu while reusing the viewer's
 * existing playback buttons and seekable timeline (no second player state). */
export class MobileTransportMenu {
  private root: HTMLElement;
  private menu: HTMLElement;
  private openButton: HTMLButtonElement;
  private playMirror: HTMLButtonElement;
  private observer: MutationObserver;
  private timer: number | null = null;

  constructor() {
    const header = document.querySelector<HTMLElement>('.fla-header');
    const viewer = document.getElementById('viewer');
    const timeline = document.getElementById('timeline');
    const frameInfo = document.getElementById('frame-info');
    if (!header || !viewer || !timeline || !frameInfo) return;

    this.root = document.createElement('div');
    this.root.className = 'mobile-transport';
    this.root.innerHTML = `
      <button class="mobile-transport-open" type="button" aria-expanded="false">☰ Файл и воспроизведение</button>
      <section class="mobile-transport-menu" aria-label="Управление анимацией" hidden>
        <header class="mobile-transport-title">
          <strong class="mobile-file-name">Файл не загружен</strong>
          <button class="mobile-transport-close" type="button" aria-label="Закрыть меню">×</button>
        </header>
        <div class="mobile-transport-actions">
          <button type="button" data-control="open-file">Открыть FLA/XFL</button>
          <button type="button" data-control="prev" aria-label="Предыдущий кадр">◀ Кадр</button>
          <button type="button" data-control="play" aria-label="Воспроизвести или поставить на паузу">▶ Старт</button>
          <button type="button" data-control="stop">■ Сначала</button>
          <button type="button" data-control="next" aria-label="Следующий кадр">Кадр ▶</button>
        </div>
        <div class="mobile-transport-seek">
          <span>Кадр</span><div class="mobile-timeline-slot"></div><output class="mobile-frame-info"></output>
        </div>
        <p class="mobile-transport-hint">Перетащите ползунок для перемотки. Повторное нажатие «Старт» ставит анимацию на паузу.</p>
      </section>`;
    header.insertAdjacentElement('afterend', this.root);
    this.menu = this.root.querySelector('.mobile-transport-menu')!;
    this.openButton = this.root.querySelector('.mobile-transport-open')!;
    this.playMirror = this.root.querySelector('[data-control="play"]')!;

    // Move the existing timeline and frame counter so they retain the original
    // viewer's registered pointer handlers and seek/playback state.
    this.root.querySelector('.mobile-timeline-slot')!.appendChild(timeline);
    this.root.querySelector('.mobile-frame-info')!.appendChild(frameInfo);

    this.openButton.addEventListener('click', () => this.setOpen(this.menu.hidden));
    this.root.querySelector('.mobile-transport-close')!.addEventListener('click', () => this.setOpen(false));
    this.root.querySelector('[data-control="open-file"]')!.addEventListener('click', () => {
      document.getElementById<HTMLButtonElement>('open-file-btn')?.click();
      this.setOpen(false);
    });
    this.bind('prev', 'prev-btn');
    this.bind('stop', 'stop-btn');
    this.bind('next', 'next-btn');
    this.root.querySelector('[data-control="play"]')!.addEventListener('click', () => {
      document.getElementById<HTMLButtonElement>('play-btn')?.click();
      window.setTimeout(() => this.syncPlayButton(), 0);
    });

    this.observer = new MutationObserver(() => this.refresh());
    this.observer.observe(viewer, { attributes: true, attributeFilter: ['class'] });
    const info = document.getElementById('info-panel');
    if (info) this.observer.observe(info, { childList: true, subtree: true, characterData: true });
    this.timer = window.setInterval(() => this.refresh(), 300);
    this.installStyles();
    this.refresh();
  }

  private bind(action: string, targetId: string): void {
    this.root.querySelector(`[data-control="${action}"]`)?.addEventListener('click', () => {
      document.getElementById<HTMLButtonElement>(targetId)?.click();
      this.syncPlayButton();
    });
  }

  private setOpen(open: boolean): void {
    this.menu.hidden = !open;
    this.openButton.setAttribute('aria-expanded', String(open));
    this.openButton.textContent = open ? 'Закрыть меню' : '☰ Файл и воспроизведение';
  }

  private refresh(): void {
    const loaded = document.getElementById('viewer')?.classList.contains('active') ?? false;
    this.root.classList.toggle('has-file', loaded);
    this.root.querySelectorAll<HTMLButtonElement>('.mobile-transport-actions button:not([data-control="open-file"])')
      .forEach((button) => { button.disabled = !loaded; });
    this.root.querySelector<HTMLElement>('.mobile-timeline-slot')?.classList.toggle('disabled', !loaded);
    const file = document.querySelector('#info-panel .value');
    if (file?.textContent) this.root.querySelector<HTMLElement>('.mobile-file-name')!.textContent = file.textContent;
    this.syncPlayButton();
  }

  private syncPlayButton(): void {
    const mainPlay = document.getElementById<HTMLButtonElement>('play-btn');
    const playing = mainPlay?.dataset.icon?.includes('pause') ?? false;
    this.playMirror.textContent = playing ? 'Ⅱ Пауза' : '▶ Старт';
  }

  private installStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .mobile-transport{display:none;position:relative;z-index:500;background:#202020;color:#eee;font:14px system-ui,sans-serif}
      .mobile-transport-open{width:100%;min-height:44px;background:#242424;color:#eee;border:0;border-bottom:1px solid #444;font:inherit;text-align:left;padding:8px 14px}
      .mobile-transport-menu{position:fixed;left:0;right:0;bottom:0;z-index:10001;padding:14px max(14px,env(safe-area-inset-right)) calc(14px + env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));background:#15191f;border-top:1px solid #4b5563;box-shadow:0 -8px 30px #0009}
      .mobile-transport-menu[hidden]{display:none}.mobile-transport-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.mobile-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:85%}
      .mobile-transport-close{border:0;background:transparent;color:#eee;font-size:26px;padding:0 8px}.mobile-transport-actions{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}
      .mobile-transport-actions button{min-height:46px;padding:6px 3px;border:1px solid #4b5563;border-radius:8px;background:#263449;color:#f8fafc;font-size:12px}.mobile-transport-actions button:disabled{opacity:.45}
      .mobile-transport-actions [data-control="play"]{background:#2563eb;border-color:#3b82f6}.mobile-transport-seek{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;margin-top:18px}.mobile-transport-seek .timeline{width:100%;margin:0;min-height:8px}.mobile-transport-hint{margin:12px 0 0;color:#9ca3af;font-size:12px}.mobile-timeline-slot.disabled{opacity:.4;pointer-events:none}
      @media(max-width:700px){.mobile-transport{display:block}.fla-header{height:auto!important;min-height:36px}}
    `;
    document.head.appendChild(style);
  }
}

function initMobileTransport(): void {
  if (document.querySelector('.mobile-transport')) return;
  new MobileTransportMenu();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileTransport, { once: true });
} else {
  initMobileTransport();
}
