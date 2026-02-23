import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                primary: "var(--font-primary)",
                secondary: "var(--font-secondary)",
                tertiary: "var(--font-tertiary)",
                special: "var(--font-special)",
            },
        },
    },
    plugins: [],
};

export default config;