// Popular Lordicon animated icons
// You can get these from https://lordicon.com/icons
export const LORDICONS = {
  // Dashboard & Analytics
  dashboard: 'https://cdn.lordicon.com/msoeawqm.json', // dashboard/chart
  analytics: 'https://cdn.lordicon.com/qhviklyi.json', // analytics/graph
  stats: 'https://cdn.lordicon.com/wloilxuq.json', // statistics
  
  // Finance & Money
  wallet: 'https://cdn.lordicon.com/qhgmphtg.json', // wallet
  money: 'https://cdn.lordicon.com/qhgmphtg.json', // money/coin
  credit_card: 'https://cdn.lordicon.com/qhgmphtg.json', // credit card
  
  // Security & Lock
  lock: 'https://cdn.lordicon.com/kzjebklh.json', // lock/security
  unlock: 'https://cdn.lordicon.com/kzjebklh.json', // unlock
  shield: 'https://cdn.lordicon.com/yqzmiobz.json', // shield/protection
  
  // User & Profile
  user: 'https://cdn.lordicon.com/bhfjfgqf.json', // user/profile
  users: 'https://cdn.lordicon.com/dxjqoygy.json', // users/team
  
  // Actions & States
  loading: 'https://cdn.lordicon.com/msoeawqm.json', // loading spinner
  success: 'https://cdn.lordicon.com/lomfljuq.json', // checkmark/success
  error: 'https://cdn.lordicon.com/akqsdstj.json', // error/warning
  
  // Interface
  settings: 'https://cdn.lordicon.com/hwjcdycb.json', // settings/gear
  home: 'https://cdn.lordicon.com/wmwqvixz.json', // home
  eye: 'https://cdn.lordicon.com/wjyqkiew.json', // eye/view
  
  // Communication
  notification: 'https://cdn.lordicon.com/lznlxwtc.json', // bell/notification
  email: 'https://cdn.lordicon.com/ozlkyfxg.json', // email/message
  
  // Navigation
  arrow_right: 'https://cdn.lordicon.com/zmkotitn.json', // arrow right
  arrow_left: 'https://cdn.lordicon.com/zmkotitn.json', // arrow left
  chevron_down: 'https://cdn.lordicon.com/xcrjfuzb.json', // chevron down
  
  // Data & Content
  download: 'https://cdn.lordicon.com/jkrhkpti.json', // download
  upload: 'https://cdn.lordicon.com/jkrhkpti.json', // upload
  copy: 'https://cdn.lordicon.com/iykgtsbt.json', // copy/duplicate
  
} as const;

// Helper function to get Lordicon URL
export function getLordicon(name: keyof typeof LORDICONS): string {
  return LORDICONS[name];
}

// Color schemes for different themes
export const LORDICON_COLORS = {
  emerald: 'primary:#10b981,secondary:#059669', // matches your emerald theme
  blue: 'primary:#3b82f6,secondary:#2563eb',
  purple: 'primary:#8b5cf6,secondary:#7c3aed',
  orange: 'primary:#f97316,secondary:#ea580c',
  red: 'primary:#ef4444,secondary:#dc2626',
  green: 'primary:#22c55e,secondary:#16a34a',
} as const; 