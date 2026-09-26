export type QueryIntent =
  | 'profile'
  | 'projects'
  | 'project_detail'
  | 'internships'
  | 'skills'
  | 'education'
  | 'achievements'
  | 'contact'
  | 'general';

export interface RouteResult {
  query: string;
  intent: QueryIntent;
  confidence: number;
  language: 'en' | 'ja';
  entity?: string;
  sourceBoosts: Record<string, number>;
}

export function detectQueryLanguage(query: string): 'ja' | 'en' {
  const jaRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return jaRegex.test(query) ? 'ja' : 'en';
}

export function detectEntity(query: string): string | undefined {
  const q = query.toLowerCase();

  if (q.includes('geosentinel') || q.includes('土砂崩れ')) {
    return 'GeoSentinel';
  }
  if (q.includes('smartq') || q.includes('多言語問題')) {
    return 'SmartQ Generator';
  }
  if (q.includes('flyrank') || q.includes('フライランク')) {
    return 'FlyRank';
  }
  if (q.includes('isiri') || q.includes('ayuslab') || q.includes('アユスラボ')) {
    return 'ISIRI Technologies / AyusLab';
  }
  if (q.includes('ediglobe')) {
    return 'EdiGlobe';
  }
  if (q.includes('wgan') || q.includes('wgan-gp') || q.includes('顔画像')) {
    return 'WGAN-GP';
  }
  if (q.includes('colorectal') || q.includes('polyp') || q.includes('ポリープ')) {
    return 'Colorectal Polyp';
  }
  if (q.includes('yolo') || q.includes('yolov8')) {
    return 'YOLOv8';
  }

  return undefined;
}

// Canonical description strings for intent semantic matching via BGE-M3
const INTENT_DESCRIPTIONS: Record<QueryIntent, string> = {
  profile: "Overview of Sujan K S profile, bio, background, summary, career overview, who is Sujan.",
  projects: "List of projects built, created, developed, or engineered by Sujan, portfolio applications, systems, software repositories.",
  project_detail: "Detailed technical architecture, features, implementation, and code of a specific project system.",
  internships: "Work experience, internships, companies worked at, internship roles, FlyRank, ISIRI Technologies, AyusLab, EdiGlobe.",
  skills: "Technical skills, programming languages, AI ML frameworks, tools, technologies, tech stack Sujan knows.",
  education: "Academic education, B.Tech degree, NMAMIT Nitte, CGPA, school, college background.",
  achievements: "Awards, achievements, Scouts Rajya Puraskar Governor award, certifications, recognitions.",
  contact: "Contact information, email address, phone number, LinkedIn, GitHub, social links.",
  general: "General portfolio query about Sujan K S."
};

export function routeQueryPattern(query: string): { intent: QueryIntent; confidence: number; entity?: string } {
  const q = query.toLowerCase();
  const entity = detectEntity(query);

  // 1. Specific Project Detail Intent
  if (entity && (q.includes('tell me about') || q.includes('what is') || q.includes('how does') || q.includes('explain') || q.includes('detail') || q.includes('about'))) {
    if (['GeoSentinel', 'SmartQ Generator', 'WGAN-GP', 'Colorectal Polyp'].includes(entity)) {
      return { intent: 'project_detail', confidence: 0.95, entity };
    }
  }

  // 2. Projects Intent
  if (
    /\b(how many projects|what projects|projects built|projects created|what has sujan built|what has sujan created|projects sujan|systems built|built|created|developed|portfolio projects|プロジェクト|開発|作品)\b/i.test(q) ||
    (q.includes('project') || q.includes('projects'))
  ) {
    return { intent: 'projects', confidence: 0.90, entity };
  }

  // 3. Internships / Work Experience Intent
  if (
    /\b(intern|internship|internships|experience|work|worked|job|company|companies|flyrank|isiri|ayuslab|ediglobe|インターン|職歴|経験)\b/i.test(q)
  ) {
    return { intent: 'internships', confidence: 0.90, entity };
  }

  // 4. Skills Intent
  if (
    /\b(skill|skills|technical|technology|technologies|tools|framework|frameworks|language|languages|expertise|stack|know|knows|tech stack|能力|スキル|技術)\b/i.test(q)
  ) {
    return { intent: 'skills', confidence: 0.90, entity };
  }

  // 5. Education Intent
  if (
    /\b(education|degree|college|university|school|b\.tech|nmamit|nitte|cgpa|grades|学歴|大学)\b/i.test(q)
  ) {
    return { intent: 'education', confidence: 0.90, entity };
  }

  // 6. Achievements Intent
  if (
    /\b(award|awards|achievement|achievements|scouts|rajya puraskar|governor|certification|certifications|受賞|資格)\b/i.test(q)
  ) {
    return { intent: 'achievements', confidence: 0.90, entity };
  }

  // 7. Contact Intent
  if (
    /\b(contact|email|phone|linkedin|github|hire|reach|mail|連絡先|メール)\b/i.test(q)
  ) {
    return { intent: 'contact', confidence: 0.90, entity };
  }

  // 8. Profile Intent
  if (
    /\b(tell me about sujan|who is sujan|bio|background|summary|about sujan|profile|overview|自己紹介|概要)\b/i.test(q) ||
    q.trim() === 'tell me about sujan' ||
    q.includes('sujan k s') ||
    q.includes('who is')
  ) {
    return { intent: 'profile', confidence: 0.85, entity };
  }

  return { intent: 'general', confidence: 0.40, entity };
}

export function getSourceBoosts(intent: QueryIntent): Record<string, number> {
  switch (intent) {
    case 'projects':
      return { 'projects.md': 0.45, 'about.md': 0.05 };
    case 'project_detail':
      return { 'projects.md': 0.55 };
    case 'internships':
      return { 'experience.md': 0.45, 'about.md': 0.05 };
    case 'skills':
      return { 'skills.md': 0.50, 'about.md': 0.00 };
    case 'profile':
      return { 'about.md': 0.35, 'profiles.md': 0.30, 'education.md': 0.15 };
    case 'education':
      return { 'education.md': 0.45, 'about.md': 0.05 };
    case 'achievements':
      return { 'achievements.md': 0.45, 'about.md': 0.05 };
    case 'contact':
      return { 'profiles.md': 0.45, 'about.md': 0.05 };
    case 'general':
    default:
      return {};
  }
}

export function routeQuery(query: string): RouteResult {
  const language = detectQueryLanguage(query);
  const patternResult = routeQueryPattern(query);
  const sourceBoosts = getSourceBoosts(patternResult.intent);

  return {
    query,
    intent: patternResult.intent,
    confidence: patternResult.confidence,
    language,
    entity: patternResult.entity,
    sourceBoosts
  };
}
