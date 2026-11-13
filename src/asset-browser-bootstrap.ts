import { FLAParser } from './fla-parser';
import type { FLADocument } from './types';
import { AssetBrowser } from './asset-browser';

// Capture parsed docs to populate the library without modifying the existing UI/player.
const originalParse = FLAParser.prototype.parse;
FLAParser.prototype.parse = async function (...args: Parameters<typeof originalParse>) {
  const doc = await originalParse.apply(this, args);
  window.dispatchEvent(new CustomEvent<FLADocument>('chemycalc:fla-loaded', { detail: doc }));
  return doc;
};

function initialize(): void {
  if (!document.querySelector('.asset-library')) new AssetBrowser();
  // The main viewer hides the Download button when WebCodecs is unavailable,
  // though PNG, SVG, GIF and PNG-sequence exports can still be useful.
  const viewer = document.getElementById('viewer');
  const download = document.getElementById('download-btn');
  if (viewer && download) {
    const revealExportForLoadedFile = () => {
      if (viewer.classList.contains('active')) download.classList.remove('hidden');
    };
    new MutationObserver(revealExportForLoadedFile).observe(viewer, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}
