import { useLanguage } from "@/hooks/useLanguage";
import { type Language } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languageOptions = [
  { value: 'so' as Language, label: '🇸🇴 Soomaali', flag: '🇸🇴' },
  { value: 'en' as Language, label: '🇺🇸 English', flag: '🇺🇸' },
  { value: 'ar' as Language, label: '🇸🇦 العربية', flag: '🇸🇦' },
];

export function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();

  const currentLanguage = languageOptions.find(opt => opt.value === language);

  return (
    <Select value={language} onValueChange={changeLanguage} data-testid="language-selector">
      <SelectTrigger className="w-[140px] bg-secondary text-secondary-foreground border-border">
        <SelectValue>
          {currentLanguage?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languageOptions.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            data-testid={`language-option-${option.value}`}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
