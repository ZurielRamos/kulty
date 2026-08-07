import { Injectable, Logger } from '@nestjs/common';
import { Category } from './enums/category.enum';
import { Style } from './enums/style.enum';
import { SettingsService } from '../settings/settings.service';

interface ImageAnalysis {
  title: string;
  description: string;
  category: Category;
  style: Style;
  embeddingText: string;
}

@Injectable()
export class ImageAnalysisService {
  private readonly logger = new Logger(ImageAnalysisService.name);

  private readonly categories = Object.values(Category);
  private readonly styles = Object.values(Style);

  constructor(private readonly settings: SettingsService) {}

  async analyze(imageBase64: string): Promise<ImageAnalysis> {
    const prompt = `Clasifica este cuadro decorativo. Responde ÚNICAMENTE con un objeto JSON válido.

CATEGORÍAS PERMITIDAS (escoge exactamente una):
${this.categories.map((c) => `"${c}"`).join(', ')}

ESTILOS PERMITIDOS (escoge exactamente uno):
${this.styles.map((s) => `"${s}"`).join(', ')}

Campos requeridos:
- "title": string, título comercial atractivo en español, máximo 60 caracteres
- "description": string, descripción para tienda online en español, máximo 200 caracteres
- "category": string, SOLO un valor de la lista de CATEGORÍAS PERMITIDAS
- "style": string, SOLO un valor de la lista de ESTILOS PERMITIDOS
- "embeddingText": string, texto largo en español para búsqueda semántica que incluya: título, descripción, categoría, estilo, colores predominantes, emociones que evoca, ambientes ideales (sala, oficina, recámara, consultorio, restaurante, etc), y palabras clave que un comprador usaría para buscar este cuadro

REGLAS:
- category y style DEBEN ser valores EXACTOS de las listas, copiados tal cual, en minúsculas
- No inventes valores fuera de las listas
- Solo JSON, sin markdown, sin explicaciones`;

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.settings.get('OPENROUTER_API_KEY')}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(
        `Error al analizar imagen: ${err?.error?.message || response.statusText}`,
      );
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    let jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();

    if (!jsonStr.endsWith('}')) {
      const lastQuote = jsonStr.lastIndexOf('"');
      if (lastQuote > jsonStr.lastIndexOf(':')) {
        jsonStr = jsonStr.substring(0, lastQuote + 1) + '}';
      } else {
        jsonStr += '"}';
      }
    }

    let result: any;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      this.logger.warn(`JSON parse failed, raw: ${text.substring(0, 200)}`);
      result = {
        title: text.match(/"title"\s*:\s*"([^"]+)"/)?.[1] || 'Sin título',
        description: text.match(/"description"\s*:\s*"([^"]+)"/)?.[1] || '',
        category: text.match(/"category"\s*:\s*"([^"]+)"/)?.[1] || 'abstracto',
        style: text.match(/"style"\s*:\s*"([^"]+)"/)?.[1] || 'realista',
        embeddingText: text.match(/"embeddingText"\s*:\s*"([^"]{20,})"/)?.[1] || '',
      };
    }

    if (!this.categories.includes(result.category)) {
      result.category = Category.ABSTRACTO;
    }
    if (!this.styles.includes(result.style)) {
      result.style = Style.REALISTA;
    }

    if (!result.embeddingText) {
      result.embeddingText = `${result.title}. ${result.description}. categoría: ${result.category}. estilo: ${result.style}`;
    }

    return result;
  }
}
