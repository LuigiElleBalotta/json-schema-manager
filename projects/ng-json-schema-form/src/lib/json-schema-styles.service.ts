import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { JSM_STYLES } from './jsm-styles.token';

const STYLE_ID = 'jsm-tailwind-styles';

@Injectable({ providedIn: 'root' })
export class JsonSchemaStylesService {
  private injected = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(JSM_STYLES) private css: string,
  ) {}

  /**
   * Injects the bundled Tailwind CSS as an inline <style> tag once.
   * Safe to call multiple times. No-op in SSR.
   */
  inject(): void {
    if (this.injected || !isPlatformBrowser(this.platformId)) return;
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) { this.injected = true; return; }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = this.css;
    document.head.appendChild(style);
    this.injected = true;
  }
}
