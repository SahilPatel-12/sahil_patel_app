# App Background Setup Guide

This folder contains everything you need to replicate the Mantra Puja background system (Solar System, Stars, Cosmic Nebula, etc.) in a new project.

## 📁 Folder Structure

- `components/`: React components for the backgrounds.
- `theme/`: Color palette and theme tokens.
- `config/`: Tailwind CSS keyframes and animation settings.
- `assets/`: Required images (Zodiac, Bhagwan, etc.).

## 🚀 How to Use

1. **Copy Components**: Move the contents of `components/` to your new project's components folder.
2. **Move Assets**: Copy the contents of `assets/` to your new project's `public/` folder.
   - Keep the folder structure: `public/zodiac/`, `public/bhagwan/`, etc.
3. **Update Tailwind Config**:
   - Open `config/animation-details.ts`.
   - Copy the `keyframes` and `animations` into your `tailwind.config.ts`.
4. **Update Theme**:
   - Open `theme/app-colors.ts`.
   - Add the colors to your `tailwind.config.ts` or `globals.css` variables.

## 🌌 Key Components

- **UnifiedPujaBackground**: The main switcher that handles Light (Solar System) and Dark (Cosmic) modes.
- **CosmicBackground**: Deep space nebula with sacred geometry.
- **EnhancedBackground**: Used for specific pages with floating icons and planetary systems.
- **StarBackground**: Procedural star field.
- **EmberParticles**: Floating fire particles.

## 🎨 Theme Colors
- **Saffron**: #f97316
- **Gold**: #f59e0b
- **Cosmic Navy**: #0f172a
- **Starlight**: #ffffff
