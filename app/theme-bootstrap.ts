// Restore the saved choice before either root layout paints. ThemeProvider
// remains responsible for changes after hydration and system-mode selection.
export const themeBootstrapScript = `(() => {
  try {
    const theme = window.localStorage.getItem("zeron-design.theme");
    if (theme === "light" || theme === "dark") {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
    }
  } catch {}
})();`;
