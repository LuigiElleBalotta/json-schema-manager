import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { JSM_CSS } from './jsm-styles.generated';

const STYLE_ID = 'jsm-tailwind-styles';

@Injectable({ providedIn: 'root' })
export class JsonSchemaStylesService {
  private injected = false;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  inject(): void {
    if (this.injected || !isPlatformBrowser(this.platformId)) return;
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) { this.injected = true; return; }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = JSM_CSS;
    document.head.appendChild(style);
    this.injected = true;
  }
}
