export const DEFAULT_PDF = '[https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf](https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf)';

export const mockUsers = [
  { id: 1, name: 'Admin Perpus', email: 'admin@lib.com', password: 'admin', role: 'admin', membership: 'premium' },
  { id: 2, name: 'Budi Santoso', email: 'budi@lib.com', password: 'user', role: 'user', membership: 'free' },
  { id: 3, name: 'Siti Aminah', email: 'siti@lib.com', password: 'user', role: 'user', membership: 'premium' }
];

export const mockBooks = [
  { id: 1, title: 'Clean Code: A Handbook', author: 'Robert C. Martin', type: 'digital', category: 'Pemrograman', description: 'Buku panduan utama untuk menulis kode yang bersih, mudah dibaca, dan mudah dipelihara.', cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80 https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80', pdfUrl: DEFAULT_PDF, rating: 4.8, reviews: [{user: 'Siti Aminah', rating: 5, text: 'Sangat direkomendasikan!'}] },
  { id: 2, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', type: 'physical', category: 'Ilmu Komputer', description: 'Buku komprehensif tentang algoritma. Membahas struktur data dasar hingga algoritma tingkat lanjut.', cover: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=300&q=80 https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=300&q=80', stock: 5, rating: 4.9, reviews: [] }, 
  { id: 3, title: 'Design Patterns', author: 'Erich Gamma', type: 'digital', category: 'Rekayasa Perangkat Lunak', description: 'Konsep dasar pola desain berorientasi objek.', cover: 'https://images.unsplash.com/photo-1526379095098-d400fd0bfce8?auto=format&fit=crop&w=300&q=80 https://images.unsplash.com/photo-1526379095098-d400fd0bfce8?auto=format&fit=crop&w=300&q=80', pdfUrl: DEFAULT_PDF, rating: 4.7, reviews: [] },
  { id: 4, title: 'The Pragmatic Programmer', author: 'Andrew Hunt', type: 'physical', category: 'Pemrograman', description: 'Panduan praktis untuk menjadi programmer yang lebih baik dan pragmatis.', cover: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=300&q=80 https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=300&q=80', stock: 0, rating: 4.8, reviews: [] },
  { id: 5, title: 'Jaringan Komputer Top-Down', author: 'Kurose & Ross', type: 'digital', category: 'Jaringan', description: 'Pendekatan top-down dalam mempelajari arsitektur dan protokol jaringan internet.', cover: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=300&q=80 https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=300&q=80', pdfUrl: DEFAULT_PDF, rating: 4.6, reviews: [] }
];
