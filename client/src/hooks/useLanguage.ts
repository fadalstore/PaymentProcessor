import { useState, useEffect } from "react";
import { type Language } from "@/lib/i18n";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    // Check URL path for language
    const path = window.location.pathname;
    if (path.startsWith('/en')) return 'en';
    if (path.startsWith('/ar')) return 'ar';
    
    // Check localStorage
    const saved = localStorage.getItem('language') as Language;
    if (saved && ['so', 'en', 'ar'].includes(saved)) {
      return saved;
    }
    
    // Default to Somali
    return 'so';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    
    // Update URL if needed
    const currentPath = window.location.pathname;
    let newPath = currentPath;
    
    // Remove existing language prefix
    newPath = newPath.replace(/^\/(so|en|ar)/, '');
    
    // Add new language prefix (except for Somali which is default)
    if (newLanguage !== 'so') {
      newPath = `/${newLanguage}${newPath}`;
    }
    
    if (newPath !== currentPath) {
      window.history.pushState({}, '', newPath || '/');
    }
  };

  return { language, changeLanguage };
}
