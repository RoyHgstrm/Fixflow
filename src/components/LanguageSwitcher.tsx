"use client";

import React from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage();

  const languageNames: Record<string, string> = {
    "en": "English",
    "sv": "Swedish",
    "fi": "Finnish",
    // Add more language codes and names as needed
  };

  const getDisplayLanguage = (langCode: string) => languageNames[langCode] || langCode;

  // Sort languages alphabetically by their display name
  const sortedLanguages = [...availableLanguages].sort((a, b) => 
    getDisplayLanguage(a.code).localeCompare(getDisplayLanguage(b.code))
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground", className)}>
          <Globe className="w-4 h-4" />
          <span>{getDisplayLanguage(currentLanguage)}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 glass backdrop-blur-xl">
        <DropdownMenuLabel>Select Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => { setLanguage(lang.code); }}
            className="flex items-center justify-between"
          >
            {getDisplayLanguage(lang.code)}
            {currentLanguage === lang.code && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 