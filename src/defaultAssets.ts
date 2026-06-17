// Adorable preloaded / default custom vector assets for Cozy Little Corner study desk

export interface Asset {
  id: string;
  type: 'character' | 'clothing' | 'decal';
  name: string;
  url: string;
  characterId?: string; // For clothing items compatibility
  category?: string;     // For optional categorization
}

// 1. Cozy Character Bases
export const DEFAULT_CHARACTERS: Asset[] = [
  {
    id: 'default_char_bunny',
    type: 'character',
    name: 'Cozy Bunny',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 38,30 C 32,8 24,8 30,22 C 34,30 38,34 38,34" fill="%23FFEFEA" stroke="%237A5244" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 36,25 C 32,12 28,12 32,22 C 34,26 36,28 36,28" fill="%23FFC9C9" />
      <path d="M 62,30 C 68,8 76,8 70,22 C 66,30 62,34 62,34" fill="%23FFEFEA" stroke="%237A5244" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 64,25 C 68,12 72,12 68,22 C 66,26 64,28 64,28" fill="%23FFC9C9" />
      <circle cx="36" cy="88" r="7" fill="%23FDF3EE" stroke="%237A5244" stroke-width="2.5"/>
      <circle cx="64" cy="88" r="7" fill="%23FDF3EE" stroke="%237A5244" stroke-width="2.5"/>
      <path d="M 32,75 Q 32,55 50,55 Q 68,55 68,75 Q 68,90 50,90 Q 32,90 32,75 Z" fill="%23FFEFEA" stroke="%237A5244" stroke-width="2.5" stroke-linejoin="round" />
      <ellipse cx="50" cy="76" rx="10" ry="8" fill="%23FFFBF9" />
      <circle cx="50" cy="42" r="20" fill="%23FFEFEA" stroke="%237A5244" stroke-width="2.5" />
      <circle cx="37" cy="48" r="3" fill="%23FFA3A3" opacity="0.6" />
      <circle cx="63" cy="48" r="3" fill="%23FFA3A3" opacity="0.6" />
      <circle cx="43" cy="42" r="2" fill="%234B3020" />
      <circle cx="57" cy="42" r="2" fill="%234B3020" />
      <path d="M 43,39 Q 44,38 45,39" stroke="%234B3020" stroke-width="1" fill="none" stroke-linecap="round" />
      <path d="M 57,39 Q 56,38 55,39" stroke="%234B3020" stroke-width="1" fill="none" stroke-linecap="round" />
      <path d="M 48,46 Q 50,44 52,46" stroke="%234B3020" stroke-width="1" fill="none" stroke-linecap="round" />
      <path d="M 48,46 C 48,48 50,49 50,49 C 50,49 52,48 52,46" stroke="%234B3020" stroke-width="1" fill="none" stroke-linecap="round" />
      <polygon points="49,44 51,44 50,45.5" fill="%23FFA3A3" />
      <circle cx="30" cy="64" r="5" fill="%23FFEFEA" stroke="%237A5244" stroke-width="2.5" />
      <circle cx="70" cy="64" r="5" fill="%23FFEFEA" stroke="%237A5244" stroke-width="2.5" />
    </svg>`
  },
  {
    id: 'default_char_teddy',
    type: 'character',
    name: 'Cozy Teddy',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="33" cy="28" r="8" fill="%23C19A6B" stroke="%237A5244" stroke-width="2.5" />
      <circle cx="33" cy="28" r="5" fill="%23E8C39E" />
      <circle cx="67" cy="28" r="8" fill="%23C19A6B" stroke="%237A5244" stroke-width="2.5" />
      <circle cx="67" cy="28" r="5" fill="%23E8C39E" />
      <circle cx="33" cy="88" r="8" fill="%23C19A6B" stroke="%237A5244" stroke-width="2.5"/>
      <ellipse cx="33" cy="88" rx="5" ry="4" fill="%23E8C39E" />
      <circle cx="67" cy="88" r="8" fill="%23C19A6B" stroke="%237A5244" stroke-width="2.5"/>
      <ellipse cx="67" cy="88" rx="5" ry="4" fill="%23E8C39E" />
      <path d="M 30,75 Q 30,55 50,55 Q 70,55 70,75 Q 70,90 50,90 Q 30,90 30,75 Z" fill="%23C19A6B" stroke="%237A5244" stroke-width="2.5" stroke-linejoin="round" />
      <ellipse cx="50" cy="76" rx="12" ry="9" fill="%23E8C39E" />
      <circle cx="50" cy="44" r="20" fill="%23C19A6B" stroke="%237A5244" stroke-width="2.5" />
      <ellipse cx="50" cy="48" rx="7" ry="5" fill="%23E8C39E" stroke="%237A5244" stroke-width="1.5" />
      <polygon points="48,46 52,46 50,48" fill="%234B3020" />
      <path d="M 50,48 L 50,51 Q 48,52 47,51 M 50,51 Q 52,52 53,51" stroke="%234B3020" stroke-width="1.2" fill="none" stroke-linecap="round" />
      <circle cx="42" cy="40" r="2.2" fill="%234B3020" />
      <circle cx="42.5" cy="39.5" r="0.6" fill="%23FFF" />
      <circle cx="58" cy="40" r="2.2" fill="%234B3020" />
      <circle cx="58.5" cy="39.5" r="0.6" fill="%23FFF" />
      <circle cx="35" cy="46" r="3.5" fill="%23FFA3A3" opacity="0.6" />
      <circle cx="65" cy="46" r="3.5" fill="%23FFA3A3" opacity="0.6" />
      <circle cx="28" cy="64" r="6" fill="%23C19A6B" stroke="%237A5244" stroke-width="2.5" />
      <circle cx="72" cy="64" r="6" fill="%23C19A6B" stroke="%237A5244" stroke-width="2.5" />
    </svg>`
  }
];

// 2. Wardrobe Clothing Items
export const DEFAULT_CLOTHING: Asset[] = [
  // Bunny Outfits
  {
    id: 'default_cloth_bunny_sweater',
    type: 'clothing',
    name: 'Mustard Sweater',
    characterId: 'default_char_bunny',
    category: 'Outerwear',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 32,73 Q 32,54 50,54 Q 68,54 68,73 Q 68,88 50,88 Q 32,88 32,73 Z" fill="%23FFDB58" stroke="%237A5244" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 40,55 Q 50,58 60,55" stroke="%237A5244" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M 50,68 C 50,68 46,64 46,61 C 46,59 48,57 50,59 C 52,57 54,59 54,61 C 54,64 50,68 50,68 Z" fill="%23E2583E" />
    </svg>`
  },
  {
    id: 'default_cloth_bunny_crown',
    type: 'clothing',
    name: 'Golden Crown',
    characterId: 'default_char_bunny',
    category: 'Hat',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 38,25 L 34,11 L 44,17 L 50,8 L 56,17 L 66,11 L 62,25 Z" fill="%23FFD700" stroke="%237A5244" stroke-width="2.2" stroke-linejoin="round" />
      <circle cx="34" cy="11" r="1.5" fill="%23FF4500" />
      <circle cx="50" cy="8" r="1.5" fill="%23FF4500" />
      <circle cx="66" cy="11" r="1.5" fill="%23FF4500" />
      <ellipse cx="50" cy="23" rx="8" ry="2" fill="%23B8860B" opacity="0.3" />
    </svg>`
  },
  {
    id: 'default_cloth_bunny_specs',
    type: 'clothing',
    name: 'Nerd Specs',
    characterId: 'default_char_bunny',
    category: 'Accessory',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="43" cy="42" r="7" fill="none" stroke="%23FF69B4" stroke-width="2.5" />
      <circle cx="57" cy="42" r="7" fill="none" stroke="%23FF69B4" stroke-width="2.5" />
      <path d="M 47,40 Q 50,38 53,40" stroke="%23FF69B4" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M 36,42 Q 33,40 31,44" stroke="%23FF69B4" stroke-width="2" fill="none" stroke-linecap="round" />
      <path d="M 64,42 Q 67,40 69,44" stroke="%23FF69B4" stroke-width="2" fill="none" stroke-linecap="round" />
    </svg>`
  },

  // Teddy Bear Outfits
  {
    id: 'default_cloth_teddy_beanie',
    type: 'clothing',
    name: 'Warm Beanie',
    characterId: 'default_char_teddy',
    category: 'Hat',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 30,34 C 28,19 40,8 50,8 C 60,8 72,19 70,34 Z" fill="%234682B4" stroke="%237A5244" stroke-width="2.5" stroke-linejoin="round" />
      <rect x="26" y="28" width="48" height="8" rx="4" fill="%235F9EA0" stroke="%237A5244" stroke-width="2.5" />
      <circle cx="50" cy="5" r="5" fill="%23F0F8FF" stroke="%237A5244" stroke-width="2" />
    </svg>`
  },
  {
    id: 'default_cloth_teddy_bowtie',
    type: 'clothing',
    name: 'Red Bowtie',
    characterId: 'default_char_teddy',
    category: 'Accessory',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 50,60 L 38,52 Q 35,59 40,66 L 50,62 Z" fill="%23E2583E" stroke="%237A5244" stroke-width="2.2" stroke-linejoin="round" />
      <path d="M 50,60 L 62,52 Q 65,59 60,66 L 50,62 Z" fill="%23E2583E" stroke="%237A5244" stroke-width="2.2" stroke-linejoin="round" />
      <rect x="47" y="57" width="6" height="6" rx="2" fill="%23C0392B" stroke="%237A5244" stroke-width="2.2" />
    </svg>`
  }
];

// 3. Cozy Room Stickers (Decals)
export const DEFAULT_STICKERS: Asset[] = [
  {
    id: 'default_sticker_succulent',
    type: 'decal',
    name: 'Succulent',
    category: 'Plants',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 32,55 L 36,88 C 36,91 42,93 50,93 C 58,93 64,91 64,88 L 68,55 Z" fill="%23E07A5F" stroke="%233D3A45" stroke-width="3" stroke-linejoin="round" />
      <ellipse cx="50" cy="55" rx="18" ry="4" fill="%23C35232" stroke="%233D3A45" stroke-width="3" />
      <ellipse cx="50" cy="55" rx="16" ry="3.5" fill="%235C3D2E" />
      <path d="M 50,55 Q 36,35 30,42 Q 40,50 50,55" fill="%2381B29A" stroke="%233D3A45" stroke-width="2.5" />
      <path d="M 50,55 Q 64,35 70,42 Q 60,50 50,55" fill="%2381B29A" stroke="%233D3A45" stroke-width="2.5" />
      <path d="M 50,55 Q 50,22 47,20 Q 42,24 50,55" fill="%2398C1D9" stroke="%233D3A45" stroke-width="2.5" />
      <path d="M 50,55 Q 50,22 53,20 Q 58,24 50,55" fill="%233D5A80" stroke="%233D3A45" stroke-width="2.5" />
      <path d="M 50,55 Q 42,38 50,28 Q 54,34 50,55" fill="%23A8DADC" stroke="%233D3A45" stroke-width="3" />
      <path d="M 50,55 Q 34,48 40,40 Q 46,46 50,55" fill="%2381B29A" stroke="%233D3A45" stroke-width="3" />
      <path d="M 50,55 Q 66,48 60,40 Q 54,46 50,55" fill="%2381B29A" stroke="%233D3A45" stroke-width="3" />
    </svg>`
  },
  {
    id: 'default_sticker_cat',
    type: 'decal',
    name: 'Sleeping Cat',
    category: 'Pets',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 80,68 C 92,68 94,52 82,48 C 76,46 72,48 70,52" fill="none" stroke="%23E76F51" stroke-width="8" stroke-linecap="round" />
      <ellipse cx="50" cy="60" rx="28" ry="19" fill="%23FFF" stroke="%23264653" stroke-width="3.5" />
      <path d="M 32,50 C 35,45 45,46 48,52 C 42,58 35,58 32,50 Z" fill="%23264653" />
      <path d="M 62,50 C 66,44 74,44 76,52 C 72,58 66,58 62,50 Z" fill="%23E76F51" />
      <circle cx="34" cy="46" r="14" fill="%23FFF" stroke="%23264653" stroke-width="3.5" />
      <path d="M 28,40 C 26,38 24,30 24,30 L 32,34 Z" fill="%23E76F51" stroke="%23264653" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 40,40 C 42,38 44,30 44,30 L 36,34 Z" fill="%23264653" stroke="%23264653" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 25,48 Q 28,51 31,48" fill="none" stroke="%23264653" stroke-width="2" stroke-linecap="round" />
      <path d="M 37,48 Q 40,51 43,48" fill="none" stroke="%23264653" stroke-width="2" stroke-linecap="round" />
      <polygon points="33,52 35,52 34,53" fill="%23E76F51" />
    </svg>`
  },
  {
    id: 'default_sticker_mug',
    type: 'decal',
    name: 'Steamy Cocoa',
    category: 'Cozy Drinks',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 64,35 C 78,35 78,65 64,65" fill="none" stroke="%23F4A261" stroke-width="7" stroke-linecap="round"/>
      <path d="M 64,35 C 78,35 78,65 64,65" fill="none" stroke="%23E76F51" stroke-width="3" stroke-linecap="round"/>
      <path d="M 28,25 L 32,75 Q 33,83 50,83 Q 67,83 68,75 L 72,25 Z" fill="%23F4A261" stroke="%23264653" stroke-width="3.5" stroke-linejoin="round" />
      <ellipse cx="50" cy="25" rx="22" ry="4.5" fill="%23E76F51" stroke="%23264653" stroke-width="3.5" />
      <ellipse cx="50" cy="25" rx="19.5" ry="3.5" fill="%2351361A" />
      <path d="M 50,60 C 50,60 42,50 42,44 C 42,40 46,38 50,42 C 54,38 58,40 58,44 C 58,50 50,60 50,60 Z" fill="%23E76F51" stroke="%23264653" stroke-width="1.5" />
      <path d="M 40,15 Q 36,10 40,5" fill="none" stroke="%23E76F51" stroke-width="2" stroke-linecap="round" opacity="0.75" />
      <path d="M 50,16 Q 54,11 50,4" fill="none" stroke="%23E76F51" stroke-width="2" stroke-linecap="round" opacity="0.75" />
    </svg>`
  },
  {
    id: 'default_sticker_sprout',
    type: 'decal',
    name: 'Tiny Sprout',
    category: 'Plants',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 25,82 C 25,72 75,72 75,82 Z" fill="%235C3D2E" stroke="%23264653" stroke-width="3" stroke-linejoin="round" />
      <path d="M 50,80 Q 48,55 52,38" fill="none" stroke="%23264653" stroke-width="4.5" stroke-linecap="round" />
      <path d="M 50,80 Q 48,55 52,38" fill="none" stroke="%23A7C957" stroke-width="1.8" stroke-linecap="round" />
      <path d="M 49,48 Q 28,34 33,26 C 38,24 50,38 49,48 Z" fill="%236A994E" stroke="%23264653" stroke-width="3" stroke-linejoin="round" />
      <path d="M 51,44 Q 72,28 75,36 C 75,44 58,48 51,44 Z" fill="%23A7C957" stroke="%23264653" stroke-width="3" stroke-linejoin="round" />
    </svg>`
  }
];
