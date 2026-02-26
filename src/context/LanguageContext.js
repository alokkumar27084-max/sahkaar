// ─────────────────────────────────────────────
// LanguageContext.js
//
// This is the LANGUAGE SWITCHER brain of the app.
// It stores whether the user chose Hindi or English,
// and provides the t() function to get translated text.
//
// HOW TO USE in any component:
//   import { useLanguage } from '../context/LanguageContext';
//   const { t, lang, setLang } = useLanguage();
//   <p>{t("home.hero_title")}</p>
// ─────────────────────────────────────────────
import React, { createContext, useContext, useState, useCallback } from "react";
import translations from "../utils/translations";

// Create the context (think of it as a "global variable" React can share)
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // Read saved language from browser storage, default to "en"
  const [lang, setLangState] = useState(
    () => localStorage.getItem("thekedaar_lang") || "en"
  );

  // When user changes language, save it to browser storage too
  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    localStorage.setItem("thekedaar_lang", newLang);
  }, []);

  // t("some.key") returns the translated string
  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook — easy access from any component
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
