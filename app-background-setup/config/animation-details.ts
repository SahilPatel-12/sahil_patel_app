/**
 * Tailwind CSS Animation Configuration
 * 
 * Copy these into your tailwind.config.ts under theme.extend
 */

export const animationConfig = {
  keyframes: {
    "drift-1": { "0%, 100%": { transform: "translate(0, 0)" }, "50%": { transform: "translate(100px, -100px)" } },
    "drift-2": { "0%, 100%": { transform: "translate(0, 0)" }, "50%": { transform: "translate(-100px, -100px)" } },
    "drift-3": { "0%, 100%": { transform: "translate(0, 0)" }, "50%": { transform: "translate(100px, 100px)" } },
    "drift-4": { "0%, 100%": { transform: "translate(0, 0)" }, "50%": { transform: "translate(-100px, 100px)" } },
    "spin-slow": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
    "nebula-pulse": { "0%, 100%": { opacity: "0.5" }, "50%": { opacity: "1" } },
    "float-up": {
      "0%": { transform: "translateY(10vh) scale(0)", opacity: "0" },
      "20%": { opacity: "0.8" },
      "80%": { opacity: "0.4" },
      "100%": { transform: "translateY(-100vh) scale(1.5)", opacity: "0" }
    },
    "float-particle": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-20px)" } },
    "wander-1": {
      "0%, 100%": { transform: "translate(0, 0)" },
      "25%": { transform: "translate(20vw, 20vh)" },
      "50%": { transform: "translate(40vw, -10vh)" },
      "75%": { transform: "translate(10vw, 40vh)" },
    },
    // Add other wander-2 through wander-8 similarly if needed
  },
  animations: {
    "spin-slow": "spin-slow 4s linear infinite",
    "drift-1": "drift-1 20s ease-in-out infinite",
    "drift-2": "drift-2 25s ease-in-out infinite",
    "drift-3": "drift-3 30s ease-in-out infinite",
    "drift-4": "drift-4 35s ease-in-out infinite",
    "nebula-pulse": "nebula-pulse 10s ease-in-out infinite",
    "float-up": "float-up 5s linear infinite",
    "float-particle": "float-particle 5s ease-in-out infinite",
    "wander-1": "wander-1 120s ease-in-out infinite",
    // ...
  }
};
