"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Terminal,
  Globe,
  Radio,
} from "lucide-react";
import { useLanguage } from "@/src/i18n";

interface IntroScreenProps {
  onEnter: () => void;
}

export function IntroScreen({ onEnter }: IntroScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { lang, setLang, ui, portfolioData } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fast initial progress fill (purely visual animation)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Keyboard listener: Press ENTER to enter portfolio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        onEnter();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onEnter]);

  // 3D Organic Wave & Particle Mesh Canvas
  useEffect(() => {
    if (shouldReduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const cols = Math.min(Math.floor(width / 35), 45);
    const rows = Math.min(Math.floor(height / 35), 30);
    const spacing = 45;
    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const rotX = (mouse.y - height / 2) * 0.0006;
      const rotY = (mouse.x - width / 2) * 0.0006;
      time += 0.02;

      const gridPoints: Array<Array<{ x: number; y: number; z: number; px: number; py: number }>> = [];

      for (let r = 0; r < rows; r++) {
        gridPoints[r] = [];
        for (let c = 0; c < cols; c++) {
          const x0 = (c - cols / 2) * spacing;
          const z0 = (r - rows / 2) * spacing;

          const distFromCenter = Math.sqrt(x0 * x0 + z0 * z0);
          const wave1 = Math.sin(distFromCenter * 0.02 - time * 1.5) * 25;
          const wave2 = Math.cos((x0 + z0) * 0.015 + time) * 15;
          const y0 = wave1 + wave2;

          const x1 = x0 * Math.cos(rotY) + z0 * Math.sin(rotY);
          const z1 = -x0 * Math.sin(rotY) + z0 * Math.cos(rotY);

          const y2 = y0 * Math.cos(rotX) - z1 * Math.sin(rotX);
          const z2 = y0 * Math.sin(rotX) + z1 * Math.cos(rotX);

          const fov = 450;
          const scale = fov / (fov + z2 + 300);
          const px = x1 * scale + width / 2;
          const py = y2 * scale + height / 2;

          gridPoints[r][c] = { x: x1, y: y2, z: z2, px, py };
        }
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = gridPoints[r][c];

          if (c < cols - 1) {
            const rightPt = gridPoints[r][c + 1];
            const alpha = Math.max(0, 0.12 - pt.z * 0.0003);
            ctx.beginPath();
            ctx.moveTo(pt.px, pt.py);
            ctx.lineTo(rightPt.px, rightPt.py);
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }

          if (r < rows - 1) {
            const bottomPt = gridPoints[r + 1][c];
            const alpha = Math.max(0, 0.12 - pt.z * 0.0003);
            ctx.beginPath();
            ctx.moveTo(pt.px, pt.py);
            ctx.lineTo(bottomPt.px, bottomPt.py);
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }

          if ((r + c) % 2 === 0) {
            const nodeRadius = Math.max(1, 2.2 - pt.z * 0.002);
            ctx.beginPath();
            ctx.arc(pt.px, pt.py, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = (r + c) % 4 === 0 ? "#22d3ee" : "#818cf8";
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [shouldReduceMotion]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: shouldReduceMotion ? 1 : 1.05,
        filter: shouldReduceMotion ? "none" : "blur(12px)",
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
      }}
      className="fixed inset-0 z-[100] flex flex-col justify-between overflow-x-hidden overflow-y-auto bg-[#030712] text-white selection:bg-cyan-500/30 selection:text-cyan-200"
    >
      {/* Background Interactive Particle Wave Canvas */}
      {!shouldReduceMotion && (
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
      )}

      {/* Futuristic Ambient Atmosphere & Radial Glows */}
      <div className="absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[170px] pointer-events-none" />

      {/* Top Bar Navigation & Telemetry */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs tracking-[0.25em] text-cyan-400 font-bold uppercase">
            SUJAN.AI // SYSTEM 01
          </span>
          <span className="hidden sm:inline-block h-3 w-px bg-white/20" />
          <span className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
            <Radio size={12} className="text-emerald-400 animate-pulse" />
            {ui.introScreen.liveLab}
          </span>
        </div>

        {/* HUD Metadata Overlay (Desktop) */}
        <div className="hidden lg:flex items-center gap-6 text-[10px] font-mono text-slate-400 tracking-wider">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>NEURAL INTERFACE: <strong className="text-cyan-300">ONLINE</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>RAG CORE: <strong className="text-cyan-300">ACTIVE</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>SYSTEM STATUS: <strong className="text-cyan-300">READY</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 font-mono text-xs text-slate-400">
          <div className="hidden md:flex items-center gap-2">
            <Globe size={13} className="text-cyan-400" />
            <span>MANGALORE 12.91° N</span>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-slate-900/60 p-1">
            <button
              onClick={() => setLang("en")}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                lang === "en"
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("ja")}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                lang === "ja"
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              JA
            </button>
          </div>
        </div>
      </header>

      {/* Main Center Stage */}
      <main className="relative z-10 my-auto flex flex-col items-center justify-center px-4 py-8 text-center">
        {/* Top Neural Badge */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-500/40 bg-cyan-950/40 px-5 py-2 text-xs font-mono tracking-widest text-cyan-300 backdrop-blur-xl shadow-[0_0_25px_rgba(34,211,238,0.2)]"
        >
          <BrainCircuit size={16} className="text-cyan-400 animate-pulse" />
          <span className="uppercase">{ui.introScreen.badge}</span>
        </motion.div>

        {/* Line 1: Name Reveal */}
        <motion.h1
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="max-w-7xl text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-300 drop-shadow-[0_0_45px_rgba(34,211,238,0.3)] uppercase"
        >
          {portfolioData.name}
        </motion.h1>

        {/* Line 2: Title Reveal */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-4 flex items-center justify-center font-mono text-lg sm:text-2xl md:text-3xl font-bold tracking-wider text-cyan-400"
        >
          <Terminal size={22} className="mr-3 text-cyan-400 shrink-0" />
          <span>{portfolioData.title}</span>
        </motion.div>

        {/* Line 3: Specializations Reveal */}
        <motion.p
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-4 max-w-3xl font-mono text-xs sm:text-sm font-semibold tracking-widest text-slate-300 uppercase"
        >
          COMPUTER VISION <span className="text-cyan-400 font-bold mx-2">//</span> NLP <span className="text-cyan-400 font-bold mx-2">//</span> GENERATIVE AI <span className="text-cyan-400 font-bold mx-2">//</span> ROBOTICS
        </motion.p>

        {/* Initialization Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-8 w-full max-w-xs space-y-1.5 font-mono text-[11px] text-cyan-300"
        >
          <div className="flex justify-between items-center text-[10px] text-slate-400 tracking-wider">
            <span>INITIALIZING NEURAL INTERFACE...</span>
            <span className="font-bold text-cyan-300">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-cyan-500/30 p-0.5">
            <div
              style={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
            />
          </div>
        </motion.div>

        {/* Primary CTA: ENTER PORTFOLIO */}
        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <button
            onClick={onEnter}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative inline-flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-300 to-indigo-500 p-[2px] font-mono text-base font-bold tracking-widest uppercase text-white shadow-[0_0_50px_rgba(34,211,238,0.45)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_80px_rgba(34,211,238,0.75)] active:scale-95 cursor-pointer"
            aria-label={ui.introScreen.enterPortfolio}
          >
            <span className="relative flex items-center gap-4 rounded-[14px] bg-slate-950 px-10 py-5 transition-all duration-300 group-hover:bg-opacity-80">
              <Sparkles size={20} className="text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
              <span className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-100">
                {ui.introScreen.enterPortfolio}
              </span>
              <ArrowRight
                size={22}
                className={`text-cyan-300 transition-transform duration-300 ${
                  isHovered ? "translate-x-2 scale-125 text-white" : ""
                }`}
              />
            </span>
          </button>

          <p className="text-xs font-mono text-slate-400 tracking-wider">
            {lang === "en" ? "Press " : ""}
            <kbd className="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-cyan-300 font-bold">ENTER ↵</kbd>
            {lang === "en" ? " to launch" : " キーを押して起動"}
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10 border-t border-white/10 bg-slate-950/50 backdrop-blur-md text-xs font-mono text-slate-400">
        <div className="flex items-center gap-6">
          <span>SUJAN K S © {new Date().getFullYear()}</span>
          <span className="hidden sm:inline-block">•</span>
          <span className="hidden sm:inline-block">{ui.introScreen.portfolioSub}</span>
        </div>

        <button
          onClick={onEnter}
          className="text-cyan-400 hover:text-cyan-300 hover:underline transition cursor-pointer font-bold"
        >
          {ui.introScreen.skipIntro}
        </button>
      </footer>
    </motion.div>
  );
}
