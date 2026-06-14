import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUSES = [
  "Analyzing case facts...",
  "Structuring legal arguments...",
  "Reviewing precedents...",
  "Drafting document...",
  "Refining language...",
];

export const Component = ({ size = 180, text = "Generating" }) => {
  const letters = text.split("");
  const [statusIndex, setStatusIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUSES.length);
    }, 4000); // Slower interval
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-12 mt-8">
      <div className="relative flex items-center justify-center">
        {/* Core Loader only, no outer rings or ambient glow */}
        <div
          className="relative flex items-center justify-center font-inter select-none"
          style={{ width: size, height: size }}
        >
          {letters.map((letter, index) => (
            <span
              key={index}
              className="inline-block text-white opacity-40 animate-loaderLetter font-medium tracking-wider"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {letter}
            </span>
          ))}

          <div className="absolute inset-0 rounded-full animate-loaderCircle"></div>
        </div>
      </div>

      {/* Progress Status Text */}
      <div className="h-6 relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={statusIndex}
            initial={{ opacity: 0, y: 5, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -5, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-blue-300/80 text-sm font-medium tracking-wide uppercase text-center"
            style={{ textShadow: "0 0 15px rgba(96,165,250,0.3)" }}
          >
            {STATUSES[statusIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <style jsx>{`
        @keyframes loaderCircle {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 6px 12px 0 #38bdf8 inset,
              0 12px 18px 0 #005dff inset,
              0 36px 36px 0 #1e40af inset,
              0 0 3px 1.2px rgba(56, 189, 248, 0.3),
              0 0 6px 1.8px rgba(0, 93, 255, 0.2);
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 6px 12px 0 #60a5fa inset,
              0 12px 6px 0 #0284c7 inset,
              0 24px 36px 0 #005dff inset,
              0 0 3px 1.2px rgba(56, 189, 248, 0.3),
              0 0 6px 1.8px rgba(0, 93, 255, 0.2);
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 6px 12px 0 #4dc8fd inset,
              0 12px 18px 0 #005dff inset,
              0 36px 36px 0 #1e40af inset,
              0 0 3px 1.2px rgba(56, 189, 248, 0.3),
              0 0 6px 1.8px rgba(0, 93, 255, 0.2);
          }
        }

        @keyframes loaderLetter {
          0%,
          100% {
            opacity: 0.4;
            transform: translateY(0);
            text-shadow: none;
          }
          20% {
            opacity: 1;
            transform: scale(1.15);
            text-shadow:
              0 0 12px rgba(96, 165, 250, 0.9),
              0 0 24px rgba(59, 130, 246, 0.5);
            color: #eff6ff;
          }
          40% {
            opacity: 0.7;
            transform: translateY(0);
            text-shadow: 0 0 6px rgba(96, 165, 250, 0.3);
          }
        }

        .animate-loaderCircle {
          animation: loaderCircle 5s linear infinite;
        }

        .animate-loaderLetter {
          animation: loaderLetter 3s infinite;
        }
      `}</style>
    </div>
  );
};
