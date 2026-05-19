export const DEFAULT_PDF = '[https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf](https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf)';

export const mockUsers = [
  { id: 1, name: 'Admin Perpus', username: 'admin', role: 'admin', membership: 'premium' },
  { id: 2, name: 'Pengguna Gratis', username: 'gratis', role: 'user', membership: 'free' },
  { id: 3, name: 'Pengguna Berbayar', username: 'berbayar', role: 'user', membership: 'premium' }
];

export const mockBooks = [
  { id: 1, title: 'Clean Code: A Handbook', author: 'Robert C. Martin', type: 'digital', category: 'Pemrograman', description: 'Buku panduan utama untuk menulis kode yang bersih, mudah dibaca, dan mudah dipelihara.', cover: '[https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80](https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80)', pdfUrl: DEFAULT_PDF, rating: 4.8, reviews: [{user: 'Siti Aminah', rating: 5, text: 'Sangat direkomendasikan!'}] },
  { id: 2, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', type: 'physical', category: 'Ilmu Komputer', description: 'Buku komprehensif tentang algoritma.', cover: '[https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=300&q=80](https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=300&q=80)', stock: 5, rating: 4.9, reviews: [] }
];