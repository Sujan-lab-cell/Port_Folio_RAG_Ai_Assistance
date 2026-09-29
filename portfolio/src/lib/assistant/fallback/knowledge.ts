export interface BasicFacts {
  name: string;
  role: string;
  location: string;
  education: {
    degree: string;
    institution: string;
    years: string;
    cgpa: string;
  };
  graduationYear: string;
  projectsCount: string;
  japaneseLearning: string;
  majorAreas: string[];
}

export interface RouteMapping {
  key: string;
  label: string;
  path: string;
  aliases: string[];
}

export interface EntityRouteMapping {
  name: string;
  path: string;
  type: "project" | "company";
  aliases: string[];
}

export interface ProjectDetails {
  id: string;
  name: string;
  target: string;
  summaryEN: string;
  summaryJA: string;
  techStackEN: string;
  techStackJA: string;
  aliases: string[];
}

export interface ExperienceDetails {
  id: string;
  company: string;
  role: string;
  target: string;
  summaryEN: string;
  summaryJA: string;
  aliases: string[];
}

export interface FallbackKnowledge {
  facts: BasicFacts;
  pageRoutes: RouteMapping[];
  entityRoutes: EntityRouteMapping[];
  projectDetails: ProjectDetails[];
  experienceDetails: ExperienceDetails[];
}

export const fallbackKnowledge: FallbackKnowledge = {
  facts: {
    name: "Sujan K S",
    role: "AI/ML Engineer & Developer",
    location: "Mangalore, Karnataka, India",
    education: {
      degree: "B.Tech in Artificial Intelligence and Machine Learning",
      institution: "N.M.A.M. Institute of Technology (NMAMIT), Nitte",
      years: "2023-2027",
      cgpa: "8.56",
    },
    graduationYear: "2027",
    projectsCount: "10+",
    japaneseLearning: "Actively studying Japanese vocabulary, communication, and preparing for JLPT N5/N4.",
    majorAreas: ["Computer Vision", "NLP", "Generative AI", "Robotics", "Machine Learning"],
  },
  pageRoutes: [
    {
      key: "about",
      label: "About Me",
      path: "/about",
      aliases: ["about", "bio", "education", "profile", "background", "summary"],
    },
    {
      key: "skills",
      label: "Technical Stack & Skills",
      path: "/skills",
      aliases: ["skills", "tech stack", "technologies", "tools", "frameworks", "libraries"],
    },
    {
      key: "projects",
      label: "Projects Portfolio",
      path: "/projects",
      aliases: ["projects", "portfolio", "work", "apps", "systems", "code"],
    },
    {
      key: "experience",
      label: "Work Experience",
      path: "/experience",
      aliases: ["experience", "internships", "work history", "jobs", "career"],
    },
    {
      key: "achievements",
      label: "Certifications & Achievements",
      path: "/achievements",
      aliases: ["achievements", "certifications", "awards", "certificates", "credentials", "honors"],
    },
    {
      key: "blog",
      label: "Technical Writing & Blog",
      path: "/blog",
      aliases: ["blog", "articles", "writing", "case studies", "research notes"],
    },
    {
      key: "profiles",
      label: "Developer Profiles",
      path: "/profiles",
      aliases: ["profiles", "github", "leetcode", "kaggle", "linkedin"],
    },
    {
      key: "contact",
      label: "Contact Information",
      path: "/contact",
      aliases: ["contact", "email", "phone", "location", "reach out"],
    },
  ],
  entityRoutes: [
    {
      name: "GeoSentinel — AI Landslide Detection System",
      path: "/projects/geosentinel",
      type: "project",
      aliases: ["geosentinel", "landslide", "yolov8 segmentation"],
    },
    {
      name: "SmartQ Generator",
      path: "/projects/smartq-generator",
      type: "project",
      aliases: ["smartq", "question generator", "t5 transformer"],
    },
    {
      name: "RAG-Powered Portfolio AI Assistant",
      path: "/projects/rag-portfolio-ai-assistant",
      type: "project",
      aliases: ["rag portfolio", "portfolio ai assistant", "rag project", "bge-m3", "vector search"],
    },
    {
      name: "AI-Based Invoice Data to JSON Parser",
      path: "/projects/invoice-data-to-json-parser",
      type: "project",
      aliases: ["invoice parser", "invoice to json", "invoice data", "easyocr invoice"],
    },
    {
      name: "Car & Pedestrian Detection",
      path: "/projects/car-pedestrian-detection",
      type: "project",
      aliases: ["car detection", "pedestrian detection", "yolo detection"],
    },
    {
      name: "Banking Management System",
      path: "/projects/banking-management-system",
      type: "project",
      aliases: ["banking system", "bank management", "java swing", "dbms"],
    },
    {
      name: "E-Commerce Sales Dashboard",
      path: "/projects/ecommerce-dashboard",
      type: "project",
      aliases: ["power bi", "ecommerce dashboard", "sales dashboard", "dax"],
    },
    {
      name: "AI Human Face Generation",
      path: "/projects/ai-face-generation",
      type: "project",
      aliases: ["wgan", "face generator", "gan"],
    },
    {
      name: "AI-Based Text Anomaly Detection System",
      path: "/projects/text-anomaly-detection",
      type: "project",
      aliases: ["text anomaly", "langchain", "langgraph"],
    },
    {
      name: "FlyRank AI",
      path: "/experience",
      type: "company",
      aliases: ["flyrank", "flyrank ai", "flyrank.ai"],
    },
    {
      name: "ISIRI Technologies (AyusLab)",
      path: "/experience",
      type: "company",
      aliases: ["isiri", "ayuslab", "ayushcare"],
    },
    {
      name: "EdiGlobe",
      path: "/experience",
      type: "company",
      aliases: ["ediglobe", "zhagaram"],
    },
  ],
  projectDetails: [
    {
      id: "geosentinel",
      name: "GeoSentinel — AI Landslide Detection System",
      target: "geosentinel",
      summaryEN: "GeoSentinel is Sujan's flagship Computer Vision & Deep Learning project. It uses YOLOv8-Seg instance segmentation to detect and segment landslide regions from satellite imagery, aerial photos, and drone video footage with real-time risk scoring and automated emergency alert notifications.",
      summaryJA: "GeoSentinelは、YOLOv8-Segインスタンスセグメンテーションを使用して衛星写真やドローン映像から地すべり領域をリアルタイムで検出・セグメンテーションし、リスク評価と緊急アラート通知を行う主要AIプロジェクトです。",
      techStackEN: "YOLOv8-Seg, PyTorch, OpenCV, Streamlit, Python, GIS Imagery Processing, Alert System",
      techStackJA: "YOLOv8-Seg、PyTorch、OpenCV、Streamlit、Python、GIS画像処理",
      aliases: ["geosentinel", "landslide", "geo sentinel", "ジオセンチネル", "地すべり"],
    },
    {
      id: "smartq-generator",
      name: "SmartQ Generator — Multilingual Question Generator",
      target: "smartq-generator",
      summaryEN: "SmartQ Generator is an NLP project that automatically generates relevant assessment questions from text and speech input using fine-tuned T5 Transformers. It supports speech-to-text with OpenAI Whisper, multi-language translation, and text-to-speech rendering.",
      summaryJA: "SmartQ Generatorは、ファインチューニングされたT5 Transformerを使用してテキストや音声入力から問題（クイズ）を自動生成する多言語自然言語処理（NLP）プロジェクトです。OpenAI Whisperによる音声認識や翻訳、音声合成機能を備えています。",
      techStackEN: "T5 Transformer, OpenAI Whisper, Hugging Face, PyTorch, Python, Streamlit",
      techStackJA: "T5 Transformer、OpenAI Whisper、Hugging Face、PyTorch、Python、Streamlit",
      aliases: ["smartq", "smart q", "question generator", "スマートq", "問題生成", "t5"],
    },
    {
      id: "rag-portfolio-ai-assistant",
      name: "RAG-Powered Portfolio AI Assistant",
      target: "rag-portfolio-ai-assistant",
      summaryEN: "A production-grade bilingual RAG assistant integrated into Sujan's portfolio website. It features 1024-dimensional BAAI/bge-m3 embeddings, Supabase pgvector hybrid search, Groq/qwen LLM generation, conversational pronoun resolution, and 3-tier fallback execution.",
      summaryJA: "スジャンのポートフォリオに統合されたRAG AIアシスタントです。1024次元のBAAI/bge-m3埋め込み、Supabase pgvectorハイブリッド検索、Groq/qwen LLM生成、文脈指示語解決、および3層フォールバック機構を備えています。",
      techStackEN: "BAAI/bge-m3, Supabase pgvector, Groq LLM API, Next.js 14, TypeScript, Tailwind CSS, Python",
      techStackJA: "BAAI/bge-m3、Supabase pgvector、Groq LLM API、Next.js 14、TypeScript、Tailwind CSS、Python",
      aliases: ["rag", "rag-powered", "portfolio ai assistant", "portfolio assistant", "rag project", "bge-m3", "ラグ", "ポートフォリオai"],
    },
    {
      id: "invoice-parser",
      name: "AI-Based Invoice Data to JSON Parser",
      target: "invoice-data-to-json-parser",
      summaryEN: "Built during Sujan's internship at ISIRI Technologies (AyusLab), this production parser extracts structured JSON data from medical invoices and diagnostic reports using EasyOCR, NLP regex validation, Pydantic, LLM fallback, and Dockerized FastAPI microservices.",
      summaryJA: "ISIRI Technologies (AyusLab)でのインターン中に開発された医療請求書パルサーで、EasyOCR、NLP正規表現検証、Pydantic、LLMフォールバック、Docker化FastAPIマイクロサービスを使用して請求書データを自動構造化JSONに変換します。",
      techStackEN: "EasyOCR, Python, FastAPI, Pydantic, Regex NLP, LLM Fallback, Docker",
      techStackJA: "EasyOCR、Python、FastAPI、Pydantic、Regex NLP、LLM Fallback、Docker",
      aliases: ["invoice parser", "invoice to json", "invoice data", "easyocr", "ayuslab invoice", "請求書", "インボイス"],
    },
    {
      id: "car-pedestrian-detection",
      name: "Car & Pedestrian Detection",
      target: "car-pedestrian-detection",
      summaryEN: "A real-time Computer Vision system utilizing YOLOv8 object detection to accurately detect and track vehicles and pedestrians in complex urban traffic and surveillance video feeds.",
      summaryJA: "YOLOv8物体検出モデルを活用し、複雑な交通状況や防犯カメラ映像から車両と歩行者をリアルタイムで高精度に検出・追跡するコンピュータビジョンシステムです。",
      techStackEN: "YOLOv8, OpenCV, PyTorch, Python",
      techStackJA: "YOLOv8、OpenCV、PyTorch、Python",
      aliases: ["car detection", "pedestrian detection", "yolo detection", "car & pedestrian", "歩行者", "車検出"],
    },
    {
      id: "banking-system",
      name: "Banking Management System",
      target: "banking-management-system",
      summaryEN: "A desktop banking DBMS application built using Java Swing GUI and MySQL database. It supports account management, transaction logs, secure customer authentication, and relational SQL operations.",
      summaryJA: "Java Swing GUIとMySQLデータベースを使用して構築されたデスクトップ型銀行管理システムで、口座管理、取引履歴ログ、セキュリティ認証、リレーショナルSQL操作をサポートします。",
      techStackEN: "Java, Java Swing, MySQL, JDBC, Relational Database",
      techStackJA: "Java、Java Swing、MySQL、JDBC、リレーショナルデータベース",
      aliases: ["banking system", "banking management", "bank management", "java swing", "dbms", "銀行"],
    },
    {
      id: "ecommerce-dashboard",
      name: "E-Commerce Sales Dashboard (Power BI)",
      target: "ecommerce-dashboard",
      summaryEN: "An interactive Business Intelligence dashboard created in Power BI with custom DAX measures. It visualizes sales performance metrics, revenue growth, profit margins, and regional customer analytics.",
      summaryJA: "Power BIとカスタムDAX関数を使用して構築された売上分析ダッシュボードです。売上指標、収益成長率、粗利益率、地域ごとの顧客セグメントを直感的に可視化します。",
      techStackEN: "Power BI, DAX, Data Visualization, Business Intelligence, Data Analytics",
      techStackJA: "Power BI、DAX、データ可視化、ビジネスインテリジェンス、データ分析",
      aliases: ["power bi", "ecommerce dashboard", "sales dashboard", "e-commerce", "売上ダッシュボード"],
    },
    {
      id: "ai-face-generation",
      name: "AI Human Face Generation (WGAN-GP)",
      target: "ai-face-generation",
      summaryEN: "A Deep Learning generative model built using Wasserstein GAN with Gradient Penalty (WGAN-GP) in PyTorch to synthesize realistic high-resolution human face images.",
      summaryJA: "PyTorchを用いてWGAN-GP（勾配ペナルティ付きワッサーシュタインGAN）構造を実装し、高精細でリアルな人工顔画像を生成するディープラーニングモデルです。",
      techStackEN: "PyTorch, WGAN-GP, GANs, Computer Vision, Python",
      techStackJA: "PyTorch、WGAN-GP、GANs、コンピュータビジョン、Python",
      aliases: ["wgan", "face generator", "gan", "face generation", "顔生成"],
    },
    {
      id: "text-anomaly-detection",
      name: "AI-Based Text Anomaly Detection System",
      target: "text-anomaly-detection",
      summaryEN: "An intelligent security pipeline developed using LangChain and LangGraph to monitor text streams for prompt injection attacks, anomalous semantic shifts, and unauthorized data leaks.",
      summaryJA: "LangChainとLangGraphを活用し、プロンプトインジェクション攻撃や意味的異常、不正データ流出を自動検出するテキスト異常検知セキュリティパイプラインです。",
      techStackEN: "LangChain, LangGraph, Python, LLM Evaluation",
      techStackJA: "LangChain、LangGraph、Python、LLM評価",
      aliases: ["text anomaly", "langchain", "langgraph", "テキスト異常"],
    },
  ],
  experienceDetails: [
    {
      id: "flyrank",
      company: "FlyRank AI",
      role: "AI/ML Engineer Intern",
      target: "flyrank",
      summaryEN: "Sujan worked as an AI/ML Engineer Intern at FlyRank.ai, where he engineered machine learning models (XGBoost, Scikit-learn) to predict search engine rankings, extract SEO analytics features, and optimize content relevance scores.",
      summaryJA: "FlyRank.aiにてAI/MLエンジニアインターンとして、検索エンジン順位予測モデル（XGBoost, Scikit-learn）の構築、SEOアナリティクス特徴量エンジニアリング、コンテンツ関連性スコア最適化に従事しました。",
      aliases: ["flyrank", "flyrank ai", "flyrank.ai", "フライランク"],
    },
    {
      id: "isiri",
      company: "ISIRI Technologies (AyusLab)",
      role: "AI Software Engineering Intern",
      target: "isiri",
      summaryEN: "Sujan served as an AI Software Engineering Intern at ISIRI Technologies (AyusLab), where he designed and deployed an automated medical invoice & diagnostic report parser using EasyOCR, Regex validation, FastAPI, and LLM fallback.",
      summaryJA: "ISIRI Technologies (AyusLab)にてAIソフトウェアエンジニアインターンとして、EasyOCR、正規表現検証、FastAPI、LLMフォールバックを活用した医療請求書・診断レポート自動パルサーの設計と開発を主導しました。",
      aliases: ["isiri", "ayuslab", "ayushcare", "アイシリ", "アユスラボ"],
    },
    {
      id: "ediglobe",
      company: "EdiGlobe",
      role: "Technical Volunteer & Facilitator",
      target: "ediglobe",
      summaryEN: "Sujan volunteered with EdiGlobe to conduct digital literacy and computer education workshops for government school students, introducing basic software tools and programming concepts.",
      summaryJA: "EdiGlobeにて技術ボランティアとして、政府立学校の生徒向けにデジタルリテラシーや基本的なコンピュータ・プログラミング教育ワークショップを実施しました。",
      aliases: ["ediglobe", "zhagaram", "エディグローブ"],
    },
  ],
};
