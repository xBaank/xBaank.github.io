import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "xBaank",
  description:
    "Hi there, I'm Roberto Blazquez, also known as xBaank. I'm 21 years old and I'm a backend developer with a passion for programming and a love for learning new things. I don't have a specific language that I stick to - I've worked with C#, Kotlin, Java, TypeScript, and many more. I enjoy the challenge of working on complex projects and finding solutions to problems.",
  themeConfig: {
    search: {
      provider: "local",
    },

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Blog", link: "/blog" },
      { text: "Projects", link: "/projects" },
    ],
    sidebar: [
      {
        text: "Blogs",
        items: [
          {
            text: "Showing names in SOLOQ",
            link: "/blog/showing-names-in-soloq",
          },
          {
            text: "¿Como funcionan los sistemas del transporte publico?",
            link: "/blog/how-public-transport-system-work",
          },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/xBaank" },
      { icon: "linkedin", link: "https://www.linkedin.com/in/xBaank" },
    ],

    footer: {
      message: "Developed by xBaank",
    },
  },
  lastUpdated: true,
});
