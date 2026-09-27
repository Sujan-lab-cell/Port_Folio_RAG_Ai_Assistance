export interface NavAction {
  route: string;
  label: string;
}

export interface IntentResult {
  isPureNavigation: boolean;
  hasNavigation: boolean;
  navAction: NavAction | null;
}

interface RouteConfig {
  route: string;
  labelEN: string;
  labelJA: string;
  keywords: string[];
}

const ROUTE_CONFIGS: RouteConfig[] = [
  {
    route: "/projects",
    labelEN: "Open Projects →",
    labelJA: "プロジェクトを開く →",
    keywords: ["projects", "project", "portfolio projects", "case studies", "プロジェクト"],
  },
  {
    route: "/skills",
    labelEN: "Open Skills →",
    labelJA: "スキルを開く →",
    keywords: ["skills", "skill", "tech stack", "technologies", "スキル"],
  },
  {
    route: "/experience",
    labelEN: "Open Experience →",
    labelJA: "経歴を開く →",
    keywords: ["experience", "work experience", "internship", "internships", "jobs", "経歴", "職歴", "インターン"],
  },
  {
    route: "/about",
    labelEN: "Open About →",
    labelJA: "アバウトを開く →",
    keywords: ["about", "bio", "background", "who is sujan", "自己紹介", "アバウト"],
  },
  {
    route: "/achievements",
    labelEN: "Open Achievements →",
    labelJA: "実績・受賞を開く →",
    keywords: ["achievements", "achievement", "awards", "award", "honors", "certifications", "実績", "受賞"],
  },
  {
    route: "/blog",
    labelEN: "Open Blog →",
    labelJA: "ブログを開く →",
    keywords: ["blog", "blogs", "articles", "posts", "publications", "ブログ", "記事"],
  },
  {
    route: "/profiles",
    labelEN: "Open Profiles →",
    labelJA: "プロファイルを開く →",
    keywords: ["profiles", "profile", "socials", "github", "linkedin", "leetcode", "プロファイル"],
  },
  {
    route: "/contact",
    labelEN: "Open Contact →",
    labelJA: "コンタクトを開く →",
    keywords: ["contact", "reach out", "hire", "email", "お問い合わせ", "コンタクト"],
  },
  {
    route: "/",
    labelEN: "Open Home →",
    labelJA: "ホームを開く →",
    keywords: ["home", "landing", "main page", "ホーム"],
  },
];

const NAV_VERB_REGEX = /(take\s+me\s+to|go\s+to|open|show\s+me|navigate\s+to|bring\s+me\s+to|view|redirect|switch\s+to|へ移動|を見せて|を開いて|に行っ|表示して|見せて)/i;
const INFO_QUESTION_REGEX = /(what|how|why|where|tell\s+me\s+about|explain|who|cgpa|details|list|how\s+many|何|どう|教えて|について)/i;

export function detectNavigationIntent(query: string, lang: string = "en"): IntentResult {
  const normalized = query.toLowerCase().trim();

  // Find matching route
  let matchedConfig: RouteConfig | null = null;

  for (const config of ROUTE_CONFIGS) {
    const hasKeyword = config.keywords.some((kw) => normalized.includes(kw));
    if (hasKeyword) {
      // Check if there is explicit navigation phrasing or concise route command
      const hasNavVerb = NAV_VERB_REGEX.test(normalized);
      const isConciseCommand = normalized.length < 35 && (normalized.includes("page") || hasNavVerb || normalized.split(" ").length <= 4);

      if (hasNavVerb || isConciseCommand) {
        matchedConfig = config;
        break;
      }
    }
  }

  if (!matchedConfig) {
    return {
      isPureNavigation: false,
      hasNavigation: false,
      navAction: null,
    };
  }

  const label = lang === "ja" ? matchedConfig.labelJA : matchedConfig.labelEN;
  const navAction: NavAction = {
    route: matchedConfig.route,
    label,
  };

  // Check if query is pure navigation or mixed with info query
  const hasInfoWords = INFO_QUESTION_REGEX.test(normalized);

  // If query starts with "tell me about ..." or contains "what/why/how/cgpa", it's mixed
  // Exception: "show me sujan's projects" has "show me" which is NAV_VERB_REGEX
  const isTellMeAbout = normalized.includes("tell me about") || normalized.includes("explain");
  const isPureNav = !isTellMeAbout && (!hasInfoWords || NAV_VERB_REGEX.test(normalized));

  return {
    isPureNavigation: isPureNav && !isTellMeAbout,
    hasNavigation: true,
    navAction,
  };
}
