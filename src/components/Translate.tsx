"use client";

import React, { useState, useEffect, type ReactNode, useRef } from 'react';
import { useLanguage } from '@/lib/language-context';

interface TranslateProps {
  children: ReactNode; // Accepts ReactNode, including strings, numbers, elements, arrays
  sourceLanguage?: string;
}

export const Translate: React.FC<TranslateProps> = ({
  children: originalContent,
  sourceLanguage,
}) => {
  const { translate, currentLanguage } = useLanguage();
  const [translatedHtml, setTranslatedHtml] = useState<string>(''); // Stores the HTML string from translation API
  const [isTranslating, setIsTranslating] = useState(false);
  const hiddenContentRef = useRef<HTMLDivElement>(null); // Ref to a hidden div for HTML extraction

  useEffect(() => {
    // This effect runs whenever originalContent, currentLanguage, or sourceLanguage changes.
    // It captures the HTML from the children and sends it for translation.

    let isMounted = true;
    const fetchAndSetTranslation = async () => {
      // Ensure the hidden ref is rendered and has content to extract
      if (!hiddenContentRef.current) {
        // This might happen on initial render. React will re-run effect when ref is attached.
        return;
      }

      // Extract HTML string from ReactNode children
      // We rely on React rendering originalContent into hiddenContentRef.current
      const textToTranslate = hiddenContentRef.current.innerHTML;

      if (!textToTranslate.trim()) {
        setTranslatedHtml(''); // No content to translate
        return;
      }

      setIsTranslating(true);
      try {
        const result = await translate(textToTranslate, sourceLanguage);
        if (isMounted) {
          setTranslatedHtml(result);
        }
      } catch (error) {
        console.error('Error fetching translation for:', textToTranslate, error);
        if (isMounted) {
          setTranslatedHtml(textToTranslate); // Fallback to original HTML on error
        }
      } finally {
        if (isMounted) {
          setIsTranslating(false);
        }
      }
    };

    fetchAndSetTranslation();

    return () => {
      isMounted = false;
    };
  }, [originalContent, sourceLanguage, translate, currentLanguage]); // Dependency on originalContent is key here

  return (
    <>
      {/* Hidden div: React renders originalContent into this div. 
          Its innerHTML is then captured for the API call in useEffect. */} 
      <div ref={hiddenContentRef} style={{ display: 'none' }} aria-hidden="true">
        {originalContent}
      </div>

      {/* Render the translated content or original content */} 
      {translatedHtml ? (
        <span 
          className={isTranslating ? 'animate-pulse-soft' : ''} 
          dangerouslySetInnerHTML={{ __html: translatedHtml }}
        />
      ) : (
        // Render original content directly if no translated HTML is available yet
        // This covers initial render before translation, and cases where originalContent is empty.
        <span className={isTranslating ? 'animate-pulse-soft' : ''}>
          {originalContent}
        </span>
      )}
    </>
  );
}; 