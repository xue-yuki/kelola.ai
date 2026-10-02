// Character and prop sprites. One char = one art-pixel, keys map to the
// palette in gfx.js; '.' is transparent.

// Kelo, 16 wide. Eyes and arms are drawn in code so expressions stay
// consistent without duplicating the body.
export const KELO = [
  '........m.......',
  '........k.......',
  '...kkkkkkkkkk...',
  '..kOOOOOOOOOOk..',
  '..kOoooooooook..',
  '..kooooooooook..',
  '..kooooooooook..',
  '..kooooooooook..',
  '..kooooooooook..',
  '..kooooooooook..',
  '..kddddddddddk..',
  '...kkkkkkkkkk...',
  '.....kk..kk.....',
];

// Bu Sari, 12 wide. Rows 4-7 hold the face so expressions swap rows.
export const SARI = [
  '....kkkk....',
  '...kttttk...',
  '..kttttttk..',
  '..ktsssstk..',
  '..ktkssktk..',
  '..ktsssstk..',
  '..ktsSSstk..',
  '..kttssttk..',
  '.kttttttttk.',
  'kttttttttttk',
  'ktmmmmmmmmtk',
  'kTmmmmmmmmTk',
  'kTmmmmmmmmTk',
  'kTmmMMMMmmTk',
  'kTmmmmmmmmTk',
  'ksmmmmmmmmsk',
  '.kmmmmmmmmk.',
  '.kmmmmmmmmk.',
  '.kWWWWWWWWk.',
  '.kWWk..kWWk.',
  '.kkkk..kkkk.',
];

export const SARI_FACE = {
  normal: ['..ktkssktk..', '..ktsssstk..', '..ktsSSstk..', '..kttssttk..'],
  smile: ['..ktkssktk..', '..ktsssstk..', '..ktSssStk..', '..kttSSttk..'],
  sad: ['..ktsssstk..', '..ktkssktk..', '..ktsssstk..', '..kttSSttk..'],
  blink: ['..ktSssStk..', '..ktsssstk..', '..ktsSSstk..', '..kttssttk..'],
};

// Customer, 10 wide; 'x' is swapped for a shirt color. Legs drawn in code.
export const CUSTOMER = [
  '...kkkk...',
  '..kWWWWk..',
  '..kWWssk..',
  '..kWsksk..',
  '..kssssk..',
  '...kssk...',
  '..kxxxxk..',
  '.kxxxxxxk.',
  '.kxxxxxxk.',
  '.kxxxxxxk.',
  '.ksxxxxsk.',
  '..kxxxxk..',
  '..kNNNNk..',
];

export const ICON = {
  esteh: [
    'kkkkkkkk',
    'kcccccck',
    'kMcMMcMk',
    'kMMMMMMk',
    '.kMMMMk.',
    '.kMMMMk.',
    '.kkkkkk.',
  ],
  kopi: [
    '........',
    '.kkkkk..',
    '.kWWWkk.',
    '.kccckck',
    '.kccckk.',
    '.kccck..',
    'kkkkkkk.',
  ],
  gorengan: [
    '........',
    '...kk...',
    '..kmmk..',
    '.kmMmmk.',
    'kmmmMmmk',
    'kMmmmmMk',
    '.kkkkkk.',
  ],
  nasi: [
    '...kk...',
    '..kttk..',
    '.kttttk.',
    'kTttttTk',
    'kttTTttk',
    'kttttttk',
    '.kkkkkk.',
  ],
  check2: ['......t..t', '.....t..t.', 't..t..tt..', '.tt..tt...', '..t..t....'],
  heart: ['.oo.oo.', 'ooooooo', 'ooooooo', '.ooooo.', '..ooo..', '...o...'],
  sun: ['..m..', 'mmmmm', '.mmm.', 'mmmmm', '..m..'],
  moon: ['.ccc.', 'cc...', 'c....', 'cc...', '.ccc.'],
  bag: ['..kk..', '.k..k.', 'kkkkkk', 'kCCCCk', 'kCCCCk', 'kCCCCk', 'kkkkkk'],
};

export const PRODUCTS = ['esteh', 'kopi', 'gorengan', 'nasi'];
