import { FLAParser } from './fla-parser';
import type { FLADocument } from './types';
import { AssetBrowser } from './asset-browser';

// Capture the parsed document without changing the existing viewer/player.
const parseFla = FLAParser.prototype.parse;
FLAParser.prototype.parse = async function (...args: Parameters<typeof parseFla>) {
  const doc = await parseFla.apply(this, args);
  window.dispatchEvent(new CustomEvent<FLADocument>('chemycalc:fla-loaded', { detail: doc }));
  return doc;
};

function initLibrary(): void {
  if (!document.querySelector('.asset-library')) new AssetBrowser();
  const download = document.getElementById('download-btn');
  // Keep the existing export dialog accessible for PNG/GIF/SVG even when this
  // browser cannot encode MP4/WebM; those dialog options already feature-detect.
  download?.classList.remove('hidden');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLibrary, { once: true });
} else {
  initLibrary();
}
