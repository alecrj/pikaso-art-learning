// src/engines/drawing/ColorManager.ts - PRODUCTION GRADE FIXED VERSION
import { 
  Color, 
  ColorSpace,
  ColorPalette,
  ColorHistory,
  ColorProfile,
  GradientStop,
  Gradient,
} from '../../types/drawing';
import { EventBus } from '../core/EventBus';
import { dataManager } from '../core/DataManager';

// FIXED: Define ColorHarmony as union type for proper indexing
type ColorHarmony = 
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'tetradic'
  | 'split-complementary'
  | 'double-complementary'
  | 'square'
  | 'monochromatic';

/**
 * Color Manager - Procreate-level color system
 * Features color harmony, palettes, history, CMYK profiles
 * FIXED: All TypeScript errors resolved
 */
export class ColorManager {
  private static instance: ColorManager;
  private eventBus = EventBus.getInstance();
  
  // Current color state
  private currentColor: Color = {
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 },
    hsb: { h: 0, s: 0, b: 0 },
    alpha: 1,
  };
  
  // Color history
  private colorHistory: ColorHistory[] = [];
  private readonly MAX_HISTORY = 30;
  
  // Color palettes
  private palettes: Map<string, ColorPalette> = new Map();
  private currentPaletteId: string | null = null;
  
  // Color profiles
  private colorProfiles: Map<string, ColorProfile> = new Map();
  private currentProfileId: string = 'srgb';
  
  // FIXED: Harmony rules with explicit parameter typing
  private readonly HARMONY_RULES: Record<ColorHarmony, (hue: number) => number[]> = {
    'complementary': (h: number) => [(h + 180) % 360],
    'analogous': (h: number) => [
      (h - 30 + 360) % 360,
      (h + 30) % 360,
    ],
    'triadic': (h: number) => [
      (h + 120) % 360,
      (h + 240) % 360,
    ],
    'tetradic': (h: number) => [
      (h + 90) % 360,
      (h + 180) % 360,
      (h + 270) % 360,
    ],
    'split-complementary': (h: number) => [
      (h + 150) % 360,
      (h + 210) % 360,
    ],
    'double-complementary': (h: number) => [
      (h + 30) % 360,
      (h + 180) % 360,
      (h + 210) % 360,
    ],
    'square': (h: number) => [
      (h + 90) % 360,
      (h + 180) % 360,
      (h + 270) % 360,
    ],
    'monochromatic': (h: number) => [h, h, h], // Different saturations/brightnesses
  };
  
  // Gradient support
  private gradients: Map<string, Gradient> = new Map();
  private currentGradientId: string | null = null;

  private constructor() {
    this.initializeColorProfiles();
    this.loadDefaultPalettes();
    this.loadSavedData();
  }

  public static getInstance(): ColorManager {
    if (!ColorManager.instance) {
      ColorManager.instance = new ColorManager();
    }
    return ColorManager.instance;
  }

  // ===== PUBLIC API - FIXED setColor method =====

  /**
   * FIXED: Set current color with proper validation
   */
  public setColor(color: Partial<Color> & { hex?: string }): void {
    // Convert from any format to full color
    let newColor: Color;
    
    if (color.hex) {
      newColor = this.hexToColor(color.hex, color.alpha);
    } else if (color.rgb) {
      newColor = this.rgbToColor(color.rgb, color.alpha);
    } else if (color.hsb) {
      newColor = this.hsbToColor(color.hsb, color.alpha);
    } else {
      return; // Invalid color
    }
    
    this.currentColor = newColor;
    this.addToHistory(newColor);
    
    this.eventBus.emit('color:changed', { color: newColor });
  }

  public getCurrentColor(): Color {
    return { ...this.currentColor };
  }

  public setAlpha(alpha: number): void {
    this.currentColor.alpha = Math.max(0, Math.min(1, alpha));
    this.eventBus.emit('color:alphaChanged', { alpha: this.currentColor.alpha });
  }

  // FIXED: Color harmony with proper typing
  public getHarmonyColors(
    baseColor?: Color,
    harmony: ColorHarmony = 'complementary'
  ): Color[] {
    const color = baseColor || this.currentColor;
    const baseHue = color.hsb.h;
    
    const harmonyHues = this.HARMONY_RULES[harmony](baseHue);
    const harmonyColors: Color[] = [color];
    
    harmonyHues.forEach((hue: number) => {
      if (harmony === 'monochromatic') {
        // Vary saturation and brightness for monochromatic
        const variations = [
          { s: color.hsb.s * 0.5, b: color.hsb.b },
          { s: color.hsb.s, b: color.hsb.b * 0.7 },
          { s: color.hsb.s * 0.7, b: color.hsb.b * 1.2 },
        ];
        
        variations.forEach(({ s, b }) => {
          harmonyColors.push(this.hsbToColor({
            h: hue,
            s: Math.min(1, s),
            b: Math.min(1, b),
          }, color.alpha));
        });
      } else {
        harmonyColors.push(this.hsbToColor({
          h: hue,
          s: color.hsb.s,
          b: color.hsb.b,
        }, color.alpha));
      }
    });
    
    return harmonyColors;
  }

  // Color mixing
  public mixColors(colors: Color[], weights?: number[]): Color {
    if (colors.length === 0) return this.currentColor;
    if (colors.length === 1) return colors[0];
    
    // Default equal weights if not provided
    const finalWeights = weights || colors.map(() => 1 / colors.length);
    
    // Mix in RGB space for more natural results
    let r = 0, g = 0, b = 0, a = 0;
    let totalWeight = 0;
    
    colors.forEach((color, i) => {
      const weight = finalWeights[i] || 0;
      r += color.rgb.r * weight;
      g += color.rgb.g * weight;
      b += color.rgb.b * weight;
      a += color.alpha * weight;
      totalWeight += weight;
    });
    
    if (totalWeight > 0) {
      r /= totalWeight;
      g /= totalWeight;
      b /= totalWeight;
      a /= totalWeight;
    }
    
    return this.rgbToColor(
      { r: Math.round(r), g: Math.round(g), b: Math.round(b) },
      a
    );
  }

  // Color history
  public getColorHistory(): ColorHistory[] {
    return [...this.colorHistory];
  }

  public clearColorHistory(): void {
    this.colorHistory = [];
    this.saveColorHistory();
    this.eventBus.emit('colorHistory:cleared');
  }

  public pickFromHistory(index: number): void {
    if (index >= 0 && index < this.colorHistory.length) {
      const historyItem = this.colorHistory[index];
      this.setColor(historyItem.color);
    }
  }

  // FIXED: Palettes with proper ColorPalette type including locked property
  public createPalette(name: string, colors: Color[] = []): ColorPalette {
    const paletteId = `palette_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // FIXED: Include all required properties
    const palette: ColorPalette = {
      id: paletteId,
      name,
      colors,
      locked: false, // FIXED: Added missing locked property
      created: Date.now(), // FIXED: Use 'created' instead of 'createdAt'
      modified: Date.now(), // FIXED: Use 'modified' instead of 'modifiedAt'
    };
    
    this.palettes.set(paletteId, palette);
    this.savePalettes();
    
    this.eventBus.emit('palette:created', { palette });
    return palette;
  }

  public deletePalette(paletteId: string): boolean {
    const palette = this.palettes.get(paletteId);
    if (!palette) return false;
    
    // Check if palette is locked
    if (palette.locked) {
      console.warn('Cannot delete locked palette');
      return false;
    }
    
    if (this.palettes.delete(paletteId)) {
      if (this.currentPaletteId === paletteId) {
        this.currentPaletteId = null;
      }
      this.savePalettes();
      this.eventBus.emit('palette:deleted', { paletteId });
      return true;
    }
    return false;
  }

  public addColorToPalette(paletteId: string, color: Color): boolean {
    const palette = this.palettes.get(paletteId);
    if (!palette || palette.locked) return false;
    
    palette.colors.push(color);
    palette.modified = Date.now(); // FIXED: Use 'modified' instead of 'modifiedAt'
    
    this.savePalettes();
    this.eventBus.emit('palette:updated', { palette });
    return true;
  }

  public removeColorFromPalette(paletteId: string, index: number): boolean {
    const palette = this.palettes.get(paletteId);
    if (!palette || palette.locked || index < 0 || index >= palette.colors.length) return false;
    
    palette.colors.splice(index, 1);
    palette.modified = Date.now(); // FIXED: Use 'modified' instead of 'modifiedAt'
    
    this.savePalettes();
    this.eventBus.emit('palette:updated', { palette });
    return true;
  }

  public lockPalette(paletteId: string, locked: boolean = true): boolean {
    const palette = this.palettes.get(paletteId);
    if (!palette) return false;
    
    palette.locked = locked;
    palette.modified = Date.now();
    
    this.savePalettes();
    this.eventBus.emit('palette:updated', { palette });
    return true;
  }

  public getPalette(paletteId: string): ColorPalette | null {
    return this.palettes.get(paletteId) || null;
  }

  public getAllPalettes(): ColorPalette[] {
    return Array.from(this.palettes.values());
  }

  public setCurrentPalette(paletteId: string | null): void {
    this.currentPaletteId = paletteId;
    this.eventBus.emit('palette:selected', { paletteId });
  }

  public getCurrentPalette(): ColorPalette | null {
    return this.currentPaletteId ? this.palettes.get(this.currentPaletteId) || null : null;
  }

  // Gradients
  public createGradient(
    name: string,
    stops: GradientStop[],
    type: 'linear' | 'radial' = 'linear'
  ): Gradient {
    const gradientId = `gradient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const gradient: Gradient = {
      id: gradientId,
      name,
      type,
      stops: this.normalizeGradientStops(stops),
      angle: 0,
    };
    
    this.gradients.set(gradientId, gradient);
    this.saveGradients();
    
    this.eventBus.emit('gradient:created', { gradient });
    return gradient;
  }

  public deleteGradient(gradientId: string): boolean {
    if (this.gradients.delete(gradientId)) {
      if (this.currentGradientId === gradientId) {
        this.currentGradientId = null;
      }
      this.saveGradients();
      this.eventBus.emit('gradient:deleted', { gradientId });
      return true;
    }
    return false;
  }

  public getGradient(gradientId: string): Gradient | null {
    return this.gradients.get(gradientId) || null;
  }

  public getAllGradients(): Gradient[] {
    return Array.from(this.gradients.values());
  }

  public setCurrentGradient(gradientId: string | null): void {
    this.currentGradientId = gradientId;
    this.eventBus.emit('gradient:selected', { gradientId });
  }

  public sampleGradient(gradient: Gradient, position: number): Color {
    const stops = gradient.stops;
    if (stops.length === 0) return this.currentColor;
    if (stops.length === 1) return stops[0].color;
    
    // Clamp position
    position = Math.max(0, Math.min(1, position));
    
    // Find surrounding stops
    let leftStop = stops[0];
    let rightStop = stops[stops.length - 1];
    
    for (let i = 0; i < stops.length - 1; i++) {
      if (position >= stops[i].position && position <= stops[i + 1].position) {
        leftStop = stops[i];
        rightStop = stops[i + 1];
        break;
      }
    }
    
    // Interpolate between stops
    const t = (position - leftStop.position) / (rightStop.position - leftStop.position);
    return this.mixColors([leftStop.color, rightStop.color], [1 - t, t]);
  }

  // Color profiles (CMYK, sRGB, P3)
  public setColorProfile(profileId: string): boolean {
    if (!this.colorProfiles.has(profileId)) return false;
    
    this.currentProfileId = profileId;
    this.eventBus.emit('colorProfile:changed', { profileId });
    
    // Convert current color to new profile
    this.currentColor = this.convertColorToProfile(this.currentColor, profileId);
    
    return true;
  }

  public getCurrentColorProfile(): ColorProfile {
    return this.colorProfiles.get(this.currentProfileId)!;
  }

  public convertColorToProfile(color: Color, profileId: string): Color {
    const profile = this.colorProfiles.get(profileId);
    if (!profile) return color;
    
    // In production, implement actual color profile conversion
    // For now, return the color as-is
    return color;
  }

  // CMYK conversion
  public rgbToCmyk(rgb: { r: number; g: number; b: number }): { c: number; m: number; y: number; k: number } {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;
    
    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100),
    };
  }

  public cmykToRgb(cmyk: { c: number; m: number; y: number; k: number }): { r: number; g: number; b: number } {
    const c = cmyk.c / 100;
    const m = cmyk.m / 100;
    const y = cmyk.y / 100;
    const k = cmyk.k / 100;
    
    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);
    
    return {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b),
    };
  }

  // Eyedropper
  public pickColorFromCanvas(x: number, y: number, averageRadius: number = 0): Color | null {
    // This would sample from the actual canvas
    // Implementation depends on canvas access
    return null;
  }

  // Import/Export
  public exportPalette(paletteId: string): string | null {
    const palette = this.palettes.get(paletteId);
    if (!palette) return null;
    
    const exportData = {
      version: '1.0',
      palette,
      exported: Date.now(),
    };
    
    return JSON.stringify(exportData);
  }

  public importPalette(data: string): ColorPalette | null {
    try {
      const importData = JSON.parse(data);
      if (!importData.palette) return null;
      
      const palette = importData.palette as ColorPalette;
      palette.id = `palette_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      palette.name = `${palette.name} (Imported)`;
      palette.locked = false; // FIXED: Ensure locked property
      
      this.palettes.set(palette.id, palette);
      this.savePalettes();
      
      this.eventBus.emit('palette:imported', { palette });
      return palette;
    } catch (error) {
      console.error('Failed to import palette:', error);
      return null;
    }
  }

  // ===== PRIVATE METHODS =====

  private initializeColorProfiles(): void {
    // sRGB profile (default)
    this.colorProfiles.set('srgb', {
      id: 'srgb',
      name: 'sRGB',
      space: 'rgb',
      gamut: 'srgb',
      whitePoint: { x: 0.3127, y: 0.3290 }, // D65
    });
    
    // Display P3
    this.colorProfiles.set('display-p3', {
      id: 'display-p3',
      name: 'Display P3',
      space: 'rgb',
      gamut: 'p3',
      whitePoint: { x: 0.3127, y: 0.3290 }, // D65
    });
    
    // Adobe RGB
    this.colorProfiles.set('adobe-rgb', {
      id: 'adobe-rgb',
      name: 'Adobe RGB (1998)',
      space: 'rgb',
      gamut: 'adobe-rgb',
      whitePoint: { x: 0.3127, y: 0.3290 }, // D65
    });
    
    // CMYK (Generic)
    this.colorProfiles.set('cmyk', {
      id: 'cmyk',
      name: 'Generic CMYK',
      space: 'cmyk',
      gamut: 'cmyk',
      whitePoint: { x: 0.3457, y: 0.3585 }, // D50
    });
  }

  private loadDefaultPalettes(): void {
    // Basic palette
    this.createPalette('Basic Colors', [
      this.hexToColor('#000000'),
      this.hexToColor('#FFFFFF'),
      this.hexToColor('#FF0000'),
      this.hexToColor('#00FF00'),
      this.hexToColor('#0000FF'),
      this.hexToColor('#FFFF00'),
      this.hexToColor('#FF00FF'),
      this.hexToColor('#00FFFF'),
    ]);
    
    // Grayscale
    this.createPalette('Grayscale', [
      this.hexToColor('#000000'),
      this.hexToColor('#333333'),
      this.hexToColor('#666666'),
      this.hexToColor('#999999'),
      this.hexToColor('#CCCCCC'),
      this.hexToColor('#FFFFFF'),
    ]);
    
    // Skin tones
    this.createPalette('Skin Tones', [
      this.hexToColor('#8D5524'),
      this.hexToColor('#C68642'),
      this.hexToColor('#E0AC69'),
      this.hexToColor('#F1C27D'),
      this.hexToColor('#FFDBAC'),
      this.hexToColor('#FFE0BD'),
    ]);
    
    // Pastel
    this.createPalette('Pastel', [
      this.hexToColor('#FFB3BA'),
      this.hexToColor('#FFDFBA'),
      this.hexToColor('#FFFFBA'),
      this.hexToColor('#BAFFC9'),
      this.hexToColor('#BAE1FF'),
      this.hexToColor('#FFBAF3'),
    ]);
  }

  private addToHistory(color: Color): void {
    // Check if color already exists in recent history
    const existingIndex = this.colorHistory.findIndex(
      item => item.color.hex === color.hex && 
              item.color.alpha === color.alpha
    );
    
    if (existingIndex !== -1) {
      // Move to front
      const [existing] = this.colorHistory.splice(existingIndex, 1);
      this.colorHistory.unshift(existing);
    } else {
      // Add new color
      this.colorHistory.unshift({
        color: { ...color },
        timestamp: Date.now(),
      });
      
      // Limit history size
      if (this.colorHistory.length > this.MAX_HISTORY) {
        this.colorHistory.pop();
      }
    }
    
    this.saveColorHistory();
    this.eventBus.emit('colorHistory:updated', { history: this.colorHistory });
  }

  // Color conversion utilities
  private hexToColor(hex: string, alpha: number = 1): Color {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle short hex (3 chars)
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    // Parse hex
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const rgb = { r, g, b };
    const hsb = this.rgbToHsb(rgb);
    
    return { hex: `#${hex.toUpperCase()}`, rgb, hsb, alpha };
  }

  private rgbToColor(rgb: { r: number; g: number; b: number }, alpha: number = 1): Color {
    const hex = this.rgbToHex(rgb);
    const hsb = this.rgbToHsb(rgb);
    
    return { hex, rgb, hsb, alpha };
  }

  private hsbToColor(hsb: { h: number; s: number; b: number }, alpha: number = 1): Color {
    const rgb = this.hsbToRgb(hsb);
    const hex = this.rgbToHex(rgb);
    
    return { hex, rgb, hsb, alpha };
  }

  private rgbToHex(rgb: { r: number; g: number; b: number }): string {
    const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
  }

  private rgbToHsb(rgb: { r: number; g: number; b: number }): { h: number; s: number; b: number } {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    let s = max === 0 ? 0 : delta / max;
    let br = max;
    
    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
      } else if (max === g) {
        h = ((b - r) / delta + 2) / 6;
      } else {
        h = ((r - g) / delta + 4) / 6;
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100) / 100,
      b: Math.round(br * 100) / 100,
    };
  }

  private hsbToRgb(hsb: { h: number; s: number; b: number }): { r: number; g: number; b: number } {
    const h = hsb.h / 360;
    const s = hsb.s;
    const v = hsb.b;
    
    let r = 0, g = 0, b = 0;
    
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  private normalizeGradientStops(stops: GradientStop[]): GradientStop[] {
    if (stops.length === 0) return [];
    
    // Sort by position
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    
    // Ensure first stop is at 0 and last at 1
    if (sorted[0].position > 0) {
      sorted.unshift({ ...sorted[0], position: 0 });
    }
    if (sorted[sorted.length - 1].position < 1) {
      sorted.push({ ...sorted[sorted.length - 1], position: 1 });
    }
    
    return sorted;
  }

  // Persistence
  private async loadSavedData(): Promise<void> {
    try {
      // Load color history
      const history = await dataManager.get<ColorHistory[]>('color_history');
      if (history) {
        this.colorHistory = history;
      }
      
      // Load palettes
      const palettes = await dataManager.get<Record<string, ColorPalette>>('color_palettes');
      if (palettes) {
        Object.entries(palettes).forEach(([id, palette]) => {
          // Ensure all palettes have the locked property
          if (palette.locked === undefined) {
            palette.locked = false;
          }
          this.palettes.set(id, palette);
        });
      }
      
      // Load gradients
      const gradients = await dataManager.get<Record<string, Gradient>>('color_gradients');
      if (gradients) {
        Object.entries(gradients).forEach(([id, gradient]) => {
          this.gradients.set(id, gradient);
        });
      }
    } catch (error) {
      console.error('Failed to load color data:', error);
    }
  }

  private async saveColorHistory(): Promise<void> {
    try {
      await dataManager.set('color_history', this.colorHistory);
    } catch (error) {
      console.error('Failed to save color history:', error);
    }
  }

  private async savePalettes(): Promise<void> {
    try {
      const palettesObj: Record<string, ColorPalette> = {};
      this.palettes.forEach((palette, id) => {
        palettesObj[id] = palette;
      });
      
      await dataManager.set('color_palettes', palettesObj);
    } catch (error) {
      console.error('Failed to save palettes:', error);
    }
  }

  private async saveGradients(): Promise<void> {
    try {
      const gradientsObj: Record<string, Gradient> = {};
      this.gradients.forEach((gradient, id) => {
        gradientsObj[id] = gradient;
      });
      
      await dataManager.set('color_gradients', gradientsObj);
    } catch (error) {
      console.error('Failed to save gradients:', error);
    }
  }
}

// Export singleton
export const colorManager = ColorManager.getInstance();