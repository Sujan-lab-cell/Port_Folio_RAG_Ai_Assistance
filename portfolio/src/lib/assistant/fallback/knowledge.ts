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

export interface FallbackKnowledge {
  facts: BasicFacts;
  pageRoutes: RouteMapping[];
  entityRoutes: EntityRouteMapping[];
}

export const fallbackKnowledge: FallbackKnowledge = {
  facts: {
    name: "Sujan K S",
    role: "AI/ML Engineer",
    location: "Mangalore, Karnataka, India",
    education: {
      degree: "B.Tech in Artificial Intelligence and Machine Learning",
      institution: "N.M.A.M. Institute of Technology",
      years: "2023-2027",
      cgpa: "8.56",
    },
    graduationYear: "2027",
    projectsCount: "10+",
    japaneseLearning: "Actively studying Japanese language, vocabulary, and JLPT communication.",
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
      name: "Colorectal Polyp Temporal Validation",
      path: "/projects/colorectal-polyp-temporal-validation",
      type: "project",
      aliases: ["polyp", "colorectal", "medical ai", "temporal validation"],
    },
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
      name: "AI Human Face Generation",
      path: "/projects/ai-face-generation",
      type: "project",
      aliases: ["wgan", "face generator", "gan"],
    },
    {
      name: "AI-Based Invoice Data to JSON Parser",
      path: "/projects/invoice-data-to-json-parser",
      type: "project",
      aliases: ["invoice parser", "invoice to json", "invoice data"],
    },
    {
      name: "E-Commerce Sales Dashboard",
      path: "/projects/ecommerce-dashboard",
      type: "project",
      aliases: ["power bi", "ecommerce dashboard", "sales dashboard"],
    },
    {
      name: "Car & Pedestrian Detection",
      path: "/projects/car-pedestrian-detection",
      type: "project",
      aliases: ["car detection", "pedestrian detection"],
    },
    {
      name: "Banking Management System",
      path: "/projects/banking-management-system",
      type: "project",
      aliases: ["banking system", "java swing", "dbms"],
    },
    {
      name: "FlyRank Search Performance Prediction",
      path: "/projects/flyrank-search-performance-prediction",
      type: "project",
      aliases: ["flyrank project", "search prediction", "seo ranking"],
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
};
