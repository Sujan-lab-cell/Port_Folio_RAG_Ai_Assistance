import { fallbackKnowledge, ProjectDetails, ExperienceDetails } from "./knowledge";
import { extractNavigationMetadata } from "@/src/lib/navigation/navigationTarget";

export type FallbackResult =
  | {
      type: "answer";
      answer: string;
    }
  | {
      type: "navigation";
      answer: string;
      route: string;
      label: string;
    }
  | {
      type: "unsupported";
      answer: string;
      route?: string;
      label?: string;
    };

export interface CloudFallbackResponse {
  answer: string;
  navigation?: {
    section: string;
    target?: string;
  };
  isFallback: true;
  provider: "cloud";
}

/**
 * Serverless Cloud LLM fallback resolver (Tier 2).
 * Uses Groq API (or xAI API) with native fetch() to generate grounded portfolio answers
 * when local RAG microservices are unavailable (e.g. on Vercel deployment).
 */
export async function resolveCloudFallbackQuery(
  query: string,
  language: string = "en",
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<CloudFallbackResponse | null> {
  const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    // Missing API key: controlled return null to allow Tier 3 rule fallback to run
    return null;
  }

  const facts = fallbackKnowledge.facts;
  const entitySummary = fallbackKnowledge.entityRoutes
    .map((e) => `- ${e.name} (${e.type}, Path: ${e.path}, Aliases: ${e.aliases.join(", ")})`)
    .join("\n");

  const systemPrompt = `You are Sujan K S's Portfolio AI Assistant.
Answer user questions accurately, concisely, and naturally using ONLY the portfolio knowledge provided below.

PORTFOLIO KNOWLEDGE:
- Name: ${facts.name}
- Role: ${facts.role}
- Location: ${facts.location}
- Education: ${facts.education.degree} at ${facts.education.institution} (${facts.education.years}), CGPA: ${facts.education.cgpa}
- Expected Graduation: ${facts.graduationYear}
- Total Projects Built: ${facts.projectsCount} (${facts.majorAreas.join(", ")})
- Japanese Language Learning: ${facts.japaneseLearning}

KEY PROJECTS & EXPERIENCE CASE STUDIES:
${entitySummary}

STRICT INSTRUCTIONS:
1. Rely strictly on the portfolio knowledge provided above. Never invent, hallucinate, or assume facts, projects, internships, metrics, dates, or achievements not present.
2. If the user's question cannot be answered using the provided knowledge, clearly state: "I don't have that specific information in my portfolio knowledge."
3. Respond in the user's requested language (${language === "ja" ? "Japanese" : "English"}).
4. Keep answers concise, factual, and direct for a web portfolio chatbot.`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  if (Array.isArray(history)) {
    for (const item of history.slice(-6)) {
      if (item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string") {
        messages.push({ role: item.role, content: item.content });
      }
    }
  }

  messages.push({ role: "user", content: query });

  try {
    const isGroq = apiKey.startsWith("gsk_");
    const endpoint = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.x.ai/v1/chat/completions";
    const model = isGroq ? "qwen/qwen3.8-27b" : "grok-2-latest";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.warn(`Groq/Cloud LLM API returned non-200 status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return null;
    }

    const navigation = extractNavigationMetadata(query, language);

    return {
      answer,
      navigation,
      isFallback: true,
      provider: "cloud",
    };
  } catch (err) {
    console.warn("Cloud LLM fallback execution failed:", err);
    return null;
  }
}

/**
 * Helper to detect Japanese characters in input string.
 */
function isJapaneseText(str: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(str);
}

/**
 * Extract target entity from short-term conversation history for follow-up resolution.
 */
function extractEntityFromHistory(
  history?: Array<{ role: "user" | "assistant"; content: string }>
): { project?: ProjectDetails; experience?: ExperienceDetails } | null {
  if (!history || history.length === 0) return null;

  // Search reverse history for recent entity matches
  for (let i = history.length - 1; i >= 0; i--) {
    const text = history[i].content.toLowerCase();
    for (const proj of fallbackKnowledge.projectDetails) {
      if (proj.aliases.some((alias) => text.includes(alias.toLowerCase()))) {
        return { project: proj };
      }
    }
    for (const exp of fallbackKnowledge.experienceDetails) {
      if (exp.aliases.some((alias) => text.includes(alias.toLowerCase()))) {
        return { experience: exp };
      }
    }
  }

  return null;
}

/**
 * Expanded, rich serverless knowledge fallback resolver (Tier 3).
 * Provides useful, grounded portfolio answers directly from fallbackKnowledge without requiring RAG.
 */
export function resolveFallbackQuery(
  query: string,
  language: string = "en",
  history?: Array<{ role: "user" | "assistant"; content: string }>
): FallbackResult {
  const normalized = query.trim().toLowerCase();
  const isJA = language === "ja" || isJapaneseText(query);

  if (!normalized) {
    return {
      type: "unsupported",
      answer: isJA
        ? "スジャンのプロジェクト、経歴、スキル、または学歴について質問してください。"
        : "Please ask a question about Sujan's projects, experience, skills, or education.",
      route: "/about",
      label: isJA ? "アバウト" : "About Me",
    };
  }

  // 1. Follow-up pronoun resolution using conversation history
  const isFollowUp =
    normalized.includes("technology") ||
    normalized.includes("technologies") ||
    normalized.includes("tech stack") ||
    normalized.includes("used in it") ||
    normalized.includes("made with") ||
    normalized.includes("built with") ||
    normalized.includes("what did he do there") ||
    normalized.includes("使用技術") ||
    normalized.includes("使われている技術") ||
    normalized.includes("そこで");

  if (isFollowUp && history && history.length > 0) {
    const activeEntity = extractEntityFromHistory(history);
    if (activeEntity?.project) {
      const proj = activeEntity.project;
      const answer = isJA
        ? `${proj.name}では以下の技術が使用されています:\n${proj.techStackJA}。\n\n${proj.summaryJA}`
        : `${proj.name} was built using:\n${proj.techStackEN}.\n\n${proj.summaryEN}`;
      return {
        type: "navigation",
        answer,
        route: `/projects/${proj.target}`,
        label: proj.name,
      };
    }
    if (activeEntity?.experience) {
      const exp = activeEntity.experience;
      const answer = isJA
        ? `${exp.company} (${exp.role})での実務内容:\n${exp.summaryJA}`
        : `At ${exp.company} (${exp.role}):\n${exp.summaryEN}`;
      return {
        type: "navigation",
        answer,
        route: `/experience`,
        label: exp.company,
      };
    }
  }

  // 2. Specific Project Matching
  for (const proj of fallbackKnowledge.projectDetails) {
    const matched = proj.aliases.some((alias) => normalized.includes(alias.toLowerCase()));
    if (matched) {
      const isTechQuery =
        normalized.includes("tech") ||
        normalized.includes("stack") ||
        normalized.includes("technology") ||
        normalized.includes("technologies") ||
        normalized.includes("language") ||
        normalized.includes("framework") ||
        normalized.includes("技術") ||
        normalized.includes("言語") ||
        normalized.includes("ツール");

      let answer = isJA ? proj.summaryJA : proj.summaryEN;
      if (isTechQuery) {
        answer += isJA
          ? `\n\n**使用技術:** ${proj.techStackJA}`
          : `\n\n**Key Technologies:** ${proj.techStackEN}`;
      } else {
        answer += isJA
          ? `\n\n**主なスタック:** ${proj.techStackJA}`
          : `\n\n**Technologies Used:** ${proj.techStackEN}`;
      }

      return {
        type: "navigation",
        answer,
        route: `/projects/${proj.target}`,
        label: proj.name,
      };
    }
  }

  // 3. Specific Experience / Company Matching
  for (const exp of fallbackKnowledge.experienceDetails) {
    const matched = exp.aliases.some((alias) => normalized.includes(alias.toLowerCase()));
    if (matched) {
      const answer = isJA
        ? `**${exp.company}** (${exp.role}):\n${exp.summaryJA}`
        : `**${exp.company}** (${exp.role}):\n${exp.summaryEN}`;

      return {
        type: "navigation",
        answer,
        route: `/experience`,
        label: exp.company,
      };
    }
  }

  // 4. General Projects Matching (Handles fuzzy queries like "how my projects did sujan do", "projects sujan made", "sujan projects")
  const isGeneralProjectQuery =
    normalized.includes("project") ||
    normalized.includes("projects") ||
    normalized.includes("work done") ||
    normalized.includes("built") ||
    normalized.includes("developed") ||
    normalized.includes("made") ||
    normalized.includes("プロジェクト") ||
    normalized.includes("作品");

  if (isGeneralProjectQuery) {
    const answer = isJA
      ? `スジャンは10以上のAI/MLおよびソフトウェア開発プロジェクトを構築しています。主な主要プロジェクト:\n\n` +
        `• **GeoSentinel:** YOLOv8-Segを用いたリアルタイム地すべり検知・監視システム\n` +
        `• **RAGポートフォリオAIアシスタント:** BGE-M3とSupabase pgvector、Groq LLMによる双方向RAGシステム\n` +
        `• **AI請求書パルサー:** EasyOCRとFastAPI、LLMフォールバックによる医療請求書自動構造化\n` +
        `• **SmartQ Generator:** T5 TransformerとWhisperによる多言語問題自動生成システム\n\n` +
        `その他のプロジェクト: 銀行管理システム(Java/MySQL)、Eコマース売上ダッシュボード(Power BI)、車・歩行者検出(YOLOv8)など。`
      : `Sujan has worked on over 10 AI/ML and software engineering projects. His primary projects include:\n\n` +
        `• **GeoSentinel:** AI-powered real-time landslide detection and monitoring system using YOLOv8-Seg.\n` +
        `• **RAG-Powered Portfolio AI Assistant:** Production-grade bilingual RAG assistant built with BGE-M3 embeddings, Supabase pgvector, and Groq LLM.\n` +
        `• **AI-Based Invoice Data to JSON Parser:** Medical invoice & diagnostic report parser built using EasyOCR, FastAPI, and LLM fallback.\n` +
        `• **SmartQ Generator:** Multilingual question generation pipeline using fine-tuned T5 Transformers and OpenAI Whisper.\n\n` +
        `Secondary & Supporting Projects: Banking Management System (Java/MySQL), E-Commerce Sales Dashboard (Power BI), Car & Pedestrian Detection (YOLOv8), WGAN Human Face Generator, and Text Anomaly Detection.`;

    return {
      type: "navigation",
      answer,
      route: "/projects",
      label: isJA ? "プロジェクト一覧" : "Projects Portfolio",
    };
  }

  // 5. General Experience & Internship Matching
  const isGeneralExperienceQuery =
    normalized.includes("intern") ||
    normalized.includes("internship") ||
    normalized.includes("internships") ||
    normalized.includes("experience") ||
    normalized.includes("work history") ||
    normalized.includes("job") ||
    normalized.includes("jobs") ||
    normalized.includes("インターン") ||
    normalized.includes("経歴") ||
    normalized.includes("職歴");

  if (isGeneralExperienceQuery) {
    const answer = isJA
      ? `スジャンの主なインターンシップおよび実務経験:\n\n` +
        `• **FlyRank AI (AI/MLエンジニアインターン):** XGBoostおよびScikit-learnを用いた検索エンジンランキング予測モデルの開発とSEO特徴量抽出。\n` +
        `• **ISIRI Technologies / AyusLab (AIソフトウェアエンジニアインターン):** EasyOCR、FastAPI、LLMフォールバックを用いた医療請求書自動パルサーの開発。\n` +
        `• **EdiGlobe (技術ボランティア):** 政府立学校児童向けデジタルリテラシー教育ワークショップ主導。`
      : `Sujan has gained hands-on industry experience through key AI/ML engineering internships:\n\n` +
        `• **FlyRank AI (AI/ML Engineer Intern):** Engineered search performance prediction models using XGBoost and Scikit-learn for SEO ranking analytics.\n` +
        `• **ISIRI Technologies / AyusLab (AI Software Engineering Intern):** Developed automated medical invoice & diagnostic report parsing pipelines using EasyOCR, FastAPI, regex NLP, and LLM fallback.\n` +
        `• **EdiGlobe (Technical Volunteer):** Facilitated digital literacy & tech awareness workshops for government school students.`;

    return {
      type: "navigation",
      answer,
      route: "/experience",
      label: isJA ? "経歴" : "Work Experience",
    };
  }

  // 6. Skills Matching
  const isSkillsQuery =
    normalized.includes("skill") ||
    normalized.includes("skills") ||
    normalized.includes("tech stack") ||
    normalized.includes("technology") ||
    normalized.includes("technologies") ||
    normalized.includes("language") ||
    normalized.includes("languages") ||
    normalized.includes("programming") ||
    normalized.includes("tool") ||
    normalized.includes("tools") ||
    normalized.includes("framework") ||
    normalized.includes("frameworks") ||
    normalized.includes("スキル") ||
    normalized.includes("技術");

  if (isSkillsQuery) {
    const answer = isJA
      ? `スジャンの主な技術スタック:\n\n` +
        `• **AI・機械学習:** コンピュータビジョン (YOLOv8, OpenCV)、ディープラーニング (PyTorch, TensorFlow)、NLP/LLM (BAAI/bge-m3, LangChain, Transformers, T5)、RAGシステム、音声AI (OpenAI Whisper)\n` +
        `• **プログラミング言語:** Python, TypeScript, JavaScript, Java, C, SQL\n` +
        `• **ウェブ・データベース:** Next.js, React, FastAPI, Streamlit, Supabase (pgvector), MySQL, Docker, Git`
      : `Sujan's core technical skills and tech stack include:\n\n` +
        `• **AI & Machine Learning:** Computer Vision (YOLOv8, OpenCV), Deep Learning (PyTorch, TensorFlow), NLP & LLMs (BAAI/bge-m3, LangChain, Transformers, T5), RAG Systems, Speech AI (OpenAI Whisper).\n` +
        `• **Programming Languages:** Python, TypeScript, JavaScript, Java, C, SQL.\n` +
        `• **Web Frameworks & Databases:** Next.js, React, FastAPI, Streamlit, Supabase (pgvector), MySQL, Docker, Git.`;

    return {
      type: "navigation",
      answer,
      route: "/skills",
      label: isJA ? "スキル" : "Technical Stack & Skills",
    };
  }

  // 7. Education / CGPA / University Matching
  const isEducationQuery =
    normalized.includes("cgpa") ||
    normalized.includes("gpa") ||
    normalized.includes("grade") ||
    normalized.includes("study") ||
    normalized.includes("studied") ||
    normalized.includes("education") ||
    normalized.includes("university") ||
    normalized.includes("college") ||
    normalized.includes("degree") ||
    normalized.includes("nmamit") ||
    normalized.includes("nitte") ||
    normalized.includes("学歴") ||
    normalized.includes("大学") ||
    normalized.includes("成績");

  if (isEducationQuery) {
    const facts = fallbackKnowledge.facts;
    const answer = isJA
      ? `スジャンは${facts.education.institution}にて${facts.education.degree}を専攻中（${facts.education.years}年）で、現在のCGPAは${facts.education.cgpa}です。`
      : `Sujan is pursuing a ${facts.education.degree} at ${facts.education.institution} (${facts.education.years}) with a current CGPA of ${facts.education.cgpa}.`;

    return {
      type: "navigation",
      answer,
      route: "/about",
      label: isJA ? "学歴" : "Education Overview",
    };
  }

  // 8. Achievements / Certifications / Awards Matching
  const isAchievementsQuery =
    normalized.includes("achievement") ||
    normalized.includes("achievements") ||
    normalized.includes("award") ||
    normalized.includes("awards") ||
    normalized.includes("certification") ||
    normalized.includes("certifications") ||
    normalized.includes("certificate") ||
    normalized.includes("certificates") ||
    normalized.includes("credential") ||
    normalized.includes("credentials") ||
    normalized.includes("rajya puraskar") ||
    normalized.includes("governor award") ||
    normalized.includes("実績") ||
    normalized.includes("受賞") ||
    normalized.includes("資格");

  if (isAchievementsQuery) {
    const answer = isJA
      ? `スジャンの主な実績・受賞歴:\n\n` +
        `• **スカウトRajya Puraskar賞（州知事賞）:** Bharat Scouts & Guidesより授与された州知事表彰\n` +
        `• **15以上の認定資格:** AI、ディープラーニング、クラウド、ソフトウェア開発に関する資格を取得\n` +
        `• **社会貢献:** 政府立学校児童向けデジタル教育・プログラミング基礎ワークショップ主導`
      : `Sujan's key achievements and credentials include:\n\n` +
        `• **Scouts Rajya Puraskar Award:** State Governor Award from Bharat Scouts & Guides.\n` +
        `• **15+ Certifications & Credentials:** Completed courses in AI, Deep Learning, Cloud Computing, and Software Engineering.\n` +
        `• **Community Leadership:** Facilitated digital literacy & tech awareness workshops for government school students.`;

    return {
      type: "navigation",
      answer,
      route: "/achievements",
      label: isJA ? "実績・受賞" : "Certifications & Achievements",
    };
  }

  // 9. Profiles & Developer Links Matching
  const isProfilesQuery =
    normalized.includes("github") ||
    normalized.includes("linkedin") ||
    normalized.includes("kaggle") ||
    normalized.includes("profile") ||
    normalized.includes("profiles") ||
    normalized.includes("social") ||
    normalized.includes("link") ||
    normalized.includes("links") ||
    normalized.includes("プロファイル") ||
    normalized.includes("ギットハブ");

  if (isProfilesQuery) {
    const answer = isJA
      ? `スジャンの公開プロファイル一覧:\n\n` +
        `• **GitHub:** https://github.com/Sujan-lab-cell\n` +
        `• **LinkedIn:** https://www.linkedin.com/in/sujan-k-s-a41261321/\n` +
        `• **Kaggle:** https://www.kaggle.com/sujanksgowdas`
      : `You can explore Sujan's work across developer profiles:\n\n` +
        `• **GitHub:** https://github.com/Sujan-lab-cell\n` +
        `• **LinkedIn:** https://www.linkedin.com/in/sujan-k-s-a41261321/\n` +
        `• **Kaggle:** https://www.kaggle.com/sujanksgowdas`;

    return {
      type: "navigation",
      answer,
      route: "/profiles",
      label: isJA ? "プロファイル" : "Developer Profiles",
    };
  }

  // 10. Contact Info Matching
  const isContactQuery =
    normalized.includes("contact") ||
    normalized.includes("email") ||
    normalized.includes("phone") ||
    normalized.includes("location") ||
    normalized.includes("address") ||
    normalized.includes("reach out") ||
    normalized.includes("hire") ||
    normalized.includes("コンタクト") ||
    normalized.includes("連絡") ||
    normalized.includes("メール");

  if (isContactQuery) {
    const answer = isJA
      ? `スジャンへのお問い合わせ窓口:\n\n` +
        `• **メール:** sujankswork@gmail.com\n` +
        `• **電話:** +91-9108262847\n` +
        `• **所在地:** インド・カルナータカ州マンガロール\n` +
        `• **LinkedIn:** https://www.linkedin.com/in/sujan-k-s-a41261321/`
      : `Sujan K S can be contacted at:\n\n` +
        `• **Email:** sujankswork@gmail.com\n` +
        `• **Phone:** +91-9108262847\n` +
        `• **Location:** Mangalore, Karnataka, India\n` +
        `• **LinkedIn:** https://www.linkedin.com/in/sujan-k-s-a41261321/`;

    return {
      type: "navigation",
      answer,
      route: "/contact",
      label: isJA ? "コンタクト" : "Contact Information",
    };
  }

  // 11. General About / Summary Matching
  const isAboutQuery =
    normalized.includes("about") ||
    normalized.includes("bio") ||
    normalized.includes("who is sujan") ||
    normalized.includes("tell me about sujan") ||
    normalized.includes("summary") ||
    normalized.includes("background") ||
    normalized.includes("自己紹介") ||
    normalized.includes("アバウト");

  if (isAboutQuery) {
    const answer = isJA
      ? `スジャン（Sujan K S）は、インド・マンガロール在住のAI/機械学習エンジニアです。NMAMITにてAI/ML専攻のB.Tech（CGPA 8.56、2027年卒業予定）を履修中で、コンピュータビジョン、NLP、生成AI、RAGシステム開発を中心に10以上のプロジェクトを構築しています。`
      : `Sujan K S is an AI & Machine Learning Developer based in Mangalore, India. He is pursuing a B.Tech in AI & ML at NMAMIT (CGPA 8.56, expected 2027) and specializes in Computer Vision, NLP, Generative AI, RAG systems, and Intelligent Software Engineering.`;

    return {
      type: "navigation",
      answer,
      route: "/about",
      label: isJA ? "アバウト" : "About Me",
    };
  }

  // 12. Unsupported / Out-of-Domain Query Fallback
  return {
    type: "unsupported",
    answer: isJA
      ? "申し訳ありませんが、その特定の情報はポートフォリオ知識ベースに含まれていません。スジャンのプロジェクト、経歴、スキルページをご覧ください。"
      : "I don't have that specific information in my portfolio knowledge. You can explore Sujan's projects, experience, or skills pages for more details.",
    route: "/about",
    label: isJA ? "アバウト" : "About Me",
  };
}
