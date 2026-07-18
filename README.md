# Cybersecurity Portfolio - Shafeeq S

A high-performance, visually immersive portfolio designed for a Cybersecurity Analyst/Blue Team professional. This project features advanced animations, physics-based UI elements, and a sleek "Command Center" aesthetic.

## 🚀 Key Features

- **Interactive Cyber Background**: A dynamic radar/shield visualization reflecting cybersecurity themes.
- **Physics-Based "Data Debris"**: Floating geometric shapes that react to scroll inertia and velocity using custom fluid drag physics.
- **Dynamic Typing Interface**: Showcases multiple professional roles (SOC Analyst, Threat Hunter, etc.) with a smooth typing effect.
- **SOC-Focused Highlights**: Dedicated section for Incident Reports, Labs (LetsDefend), and Malware Analysis.
- **Responsive Navigation**: Full support for desktop and mobile devices.
- **Modern Tech Stack**: Built with React 18, Vite, Tailwind CSS, and Framer Motion.

## 🛠️ Tech Stack

- **Framework**: [React 18](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

## 🛠️ How to Update Certificates

To add a new certificate using your GitHub repository:

1. **Upload your image** to your GitHub repository (e.g., `shafeeq.github.io`).
2. **Get the Raw URL**:
   - The pattern is: `https://raw.githubusercontent.com/[Username]/[Repo]/[Branch]/[Filename]`
   - Example: `https://raw.githubusercontent.com/ShafeeqTechkie/shafeeq.github.io/main/My_New_Cert.png`
3. **Edit `src/data.ts`**:
   - Locate the `certificates` array.
   - Update the `image` field with your new Raw URL.

### ⚠️ Common Troubleshooting (If images don't show)
- **Case Sensitivity**: GitHub is case-sensitive. `My_Cert.png` is NOT the same as `my_cert.png` or `My_Cert.PNG`.
- **Extension**: Ensure it matches (`.png`, `.jpg`, `.jpeg`).
- **Spaces**: Use underscores `_` or hyphens `-` instead of spaces in filenames if possible. If you must use spaces, use `%20` in the URL (e.g., `My%20Cert.png`).
- **Raw Domain**: Ensure you use `raw.githubusercontent.com`, not the standard `github.com` URL.
- **Branch Name**: Ensure your default branch is `main` (older repos might use `master`).
