"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "./translations";

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const saved = localStorage.getItem("primegen_lang");
    if (saved && translations[saved]) {
      setLang(saved);
    }
  }, []);

  const switchLang = (newLang) => {
    if (translations[newLang]) {
      setLang(newLang);
      localStorage.setItem("primegen_lang", newLang);
    }
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
