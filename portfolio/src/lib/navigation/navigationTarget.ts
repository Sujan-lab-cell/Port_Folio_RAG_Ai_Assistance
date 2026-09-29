export interface SectionInfo {
  id: string;
  path: string;
  navKey: string;
  labelEN: string;
  labelJA: string;
}

export const SECTION_SEQUENCE: SectionInfo[] = [
  { id: 'home', path: '/', navKey: 'home', labelEN: 'Home', labelJA: 'ホーム' },
  { id: 'about', path: '/about', navKey: 'about', labelEN: 'About', labelJA: 'アバウト' },
  { id: 'skills', path: '/skills', navKey: 'skills', labelEN: 'Skills', labelJA: 'スキル' },
  { id: 'projects', path: '/projects', navKey: 'projects', labelEN: 'Projects', labelJA: 'プロジェクト' },
  { id: 'experience', path: '/experience', navKey: 'experience', labelEN: 'Experience', labelJA: '経歴' },
  { id: 'achievements', path: '/achievements', navKey: 'achievements', labelEN: 'Achievements', labelJA: '実績' },
  { id: 'blog', path: '/blog', navKey: 'blog', labelEN: 'Blog', labelJA: 'ブログ' },
  { id: 'profiles', path: '/profiles', navKey: 'profiles', labelEN: 'Profiles', labelJA: 'プロファイル' },
  { id: 'contact', path: '/contact', navKey: 'contact', labelEN: 'Contact', labelJA: 'コンタクト' },
];

export interface StructuredNavigation {
  section: string;
  target?: string;
  route: string;
  label: string;
}

interface TargetPattern {
  keywords: string[];
  section: string;
  target?: string;
  labelEN: string;
  labelJA: string;
}

const TARGET_PATTERNS: TargetPattern[] = [
  // Specific Projects
  {
    keywords: ['geosentinel', 'landslide', 'ジオセンチネル', '地すべり'],
    section: 'projects',
    target: 'geosentinel',
    labelEN: 'Open GeoSentinel →',
    labelJA: 'GeoSentinelを開く →',
  },
  {
    keywords: ['smartq', 'smart q', 'question generator', 'スマートq', '問題生成'],
    section: 'projects',
    target: 'smartq-generator',
    labelEN: 'Open SmartQ Generator →',
    labelJA: 'SmartQ Generatorを開く →',
  },
  {
    keywords: ['rag', 'bge-m3', 'portfolio ai', 'chatbot', 'rag-powered', 'vector search', 'ラグ'],
    section: 'projects',
    target: 'rag-portfolio-ai-assistant',
    labelEN: 'Open RAG Portfolio AI →',
    labelJA: 'RAG Portfolio AIを開く →',
  },
  {
    keywords: ['invoice', 'invoice parser', 'easyocr', 'ayuslab invoice', 'pydantic', '請求書', 'インボイス'],
    section: 'projects',
    target: 'invoice-data-to-json-parser',
    labelEN: 'Open Invoice Parser →',
    labelJA: 'Invoice Parserを開く →',
  },
  {
    keywords: ['yolo', 'car detection', 'pedestrian', 'car & pedestrian', '歩行者', '車検出'],
    section: 'projects',
    target: 'car-pedestrian-detection',
    labelEN: 'Open YOLO Detection →',
    labelJA: 'YOLO Detectionを開く →',
  },
  {
    keywords: ['banking', 'bank management', 'swing', 'mysql', 'java project', '銀行'],
    section: 'projects',
    target: 'banking-management-system',
    labelEN: 'Open Banking System →',
    labelJA: 'Banking Systemを開く →',
  },
  {
    keywords: ['power bi', 'ecommerce dashboard', 'sales dashboard', 'dax', 'e-commerce', '売上ダッシュボード'],
    section: 'projects',
    target: 'ecommerce-dashboard',
    labelEN: 'Open E-Commerce Dashboard →',
    labelJA: 'E-Commerce Dashboardを開く →',
  },
  {
    keywords: ['polyp', 'colorectal', 'temporal validation', 'ポリープ'],
    section: 'projects',
    target: 'colorectal-polyp-temporal-validation',
    labelEN: 'Open Polyp Validation →',
    labelJA: 'Polyp Validationを開く →',
  },
  {
    keywords: ['face generation', 'wgan', 'human face', '顔生成'],
    section: 'projects',
    target: 'ai-face-generation',
    labelEN: 'Open Face Generation →',
    labelJA: 'Face Generationを開く →',
  },
  {
    keywords: ['text anomaly', 'langchain', 'langgraph', 'テキスト異常'],
    section: 'projects',
    target: 'text-anomaly-detection',
    labelEN: 'Open Text Anomaly Detection →',
    labelJA: 'Text Anomaly Detectionを開く →',
  },

  // Specific Experience Items
  {
    keywords: ['flyrank', 'フライランク', 'seo performance'],
    section: 'experience',
    target: 'flyrank',
    labelEN: 'Open FlyRank Experience →',
    labelJA: 'FlyRank経歴を開く →',
  },
  {
    keywords: ['isiri', 'ayuslab', 'アイシリ', 'アユスラボ'],
    section: 'experience',
    target: 'isiri',
    labelEN: 'Open ISIRI/AyusLab Experience →',
    labelJA: 'ISIRI/AyusLab経歴を開く →',
  },
  {
    keywords: ['ediglobe', 'エディグローブ'],
    section: 'experience',
    target: 'ediglobe',
    labelEN: 'Open EdiGlobe Experience →',
    labelJA: 'EdiGlobe経歴を開く →',
  },

  // Specific About Section Items
  {
    keywords: ['education', 'degree', 'college', 'university', 'nmit', 'cgpa', '学歴', '大学'],
    section: 'about',
    target: 'education',
    labelEN: 'Open Education →',
    labelJA: '学歴を開く →',
  },

  // General Major Sections
  {
    keywords: ['projects', 'project', 'case study', 'portfolio work', 'プロジェクト', '作品'],
    section: 'projects',
    labelEN: 'Open Projects →',
    labelJA: 'プロジェクトを開く →',
  },
  {
    keywords: ['skills', 'skill', 'tech stack', 'technologies', 'frameworks', 'python', 'pytorch', 'yolov8', 'tensorflow', 'opencv', 'スキル', '技術'],
    section: 'skills',
    labelEN: 'Open Skills →',
    labelJA: 'スキルを開く →',
  },
  {
    keywords: ['experience', 'internship', 'internships', 'work experience', 'job', '経歴', '職歴', 'インターン'],
    section: 'experience',
    labelEN: 'Open Experience →',
    labelJA: '経歴を開く →',
  },
  {
    keywords: ['about', 'bio', 'background', 'who is sujan', '自己紹介', 'アバウト'],
    section: 'about',
    labelEN: 'Open About →',
    labelJA: 'アバウトを開く →',
  },
  {
    keywords: ['achievements', 'achievement', 'award', 'awards', 'certification', 'certifications', '実績', '受賞', '資格'],
    section: 'achievements',
    labelEN: 'Open Achievements →',
    labelJA: '実績・受賞を開く →',
  },
  {
    keywords: ['blog', 'blogs', 'article', 'articles', 'posts', 'ブログ', '記事'],
    section: 'blog',
    labelEN: 'Open Blog →',
    labelJA: 'ブログを開く →',
  },
  {
    keywords: ['profiles', 'profile', 'github', 'linkedin', 'kaggle', 'social', 'プロファイル'],
    section: 'profiles',
    labelEN: 'Open Profiles →',
    labelJA: 'プロファイルを開く →',
  },
  {
    keywords: ['contact', 'reach out', 'hire', 'email', 'phone', 'お問い合わせ', 'コンタクト', '連絡'],
    section: 'contact',
    labelEN: 'Open Contact →',
    labelJA: 'コンタクトを開く →',
  },
  {
    keywords: ['home', 'landing', 'main page', 'ホーム'],
    section: 'home',
    labelEN: 'Open Home →',
    labelJA: 'ホームを開く →',
  },
];

export function detectNavigationTarget(
  query: string,
  lang: string = 'en'
): StructuredNavigation | null {
  const normalized = query.toLowerCase().trim();

  for (const pattern of TARGET_PATTERNS) {
    const matched = pattern.keywords.some((kw) => normalized.includes(kw));
    if (matched) {
      const sectionInfo = SECTION_SEQUENCE.find((s) => s.id === pattern.section);
      const route = sectionInfo ? sectionInfo.path : `/${pattern.section}`;
      const label = lang === 'ja' ? pattern.labelJA : pattern.labelEN;

      return {
        section: pattern.section,
        target: pattern.target,
        route,
        label,
      };
    }
  }

  return null;
}

export interface NavigationMetadata {
  section: string;
  target?: string;
}

export function extractNavigationMetadata(
  query: string,
  lang: string = 'en',
  fallbackRoute?: string
): NavigationMetadata | undefined {
  const structuredNav = detectNavigationTarget(query, lang);
  if (structuredNav) {
    return {
      section: structuredNav.section,
      target: structuredNav.target,
    };
  }

  if (fallbackRoute) {
    const cleanRoute = fallbackRoute.startsWith('/') ? fallbackRoute.slice(1) : fallbackRoute;
    const parts = cleanRoute.split('/');
    const section = parts[0] || 'home';
    const target = parts[1];
    return {
      section: section === '' ? 'home' : section,
      target: target || undefined,
    };
  }

  return undefined;
}
