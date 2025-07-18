
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, targetLanguage, sourceLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'Missing text or target language' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY;

    if (!apiKey) {
      console.error('GOOGLE_CLOUD_TRANSLATION_API_KEY is not set');
      return NextResponse.json({ error: 'Server configuration error: Translation API key missing' }, { status: 500 });
    }

    const response = await fetch('https://translation.googleapis.com/language/translate/v2?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        source: sourceLanguage || 'en', // Default to English if source not provided
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Translate API error:', errorData);
      return NextResponse.json({ error: errorData.error?.message || 'Translation failed' }, { status: response.status });
    }

    const data = await response.json();
    const translatedText = data.data.translations[0].translatedText;

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Error in translate API route:', error);
    return NextResponse.json({ error: 'Internal server error during translation' }, { status: 500 });
  }
} 