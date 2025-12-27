// services/ProductIdeaService.js
const OpenAI = require('openai');
const ProductIdeaModel = require('../models/ProductIdeaModel');

class ProductIdeaService {
  constructor(pool) {
    this.model = new ProductIdeaModel(pool);
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async startGeneration(userId, formData) {
    try {
      // Create record
      const ideaId = await this.model.create(userId, formData);

      // Start generation in background
      this.processGeneration(ideaId, formData).catch(error => {
        console.error('Background generation error:', error);
        this.model.updateStatus(ideaId, 'failed', error.message);
      });

      return { ideaId, status: 'processing' };
    } catch (error) {
      console.error('Start generation error:', error);
      throw error;
    }
  }

  async processGeneration(ideaId, formData) {
    try {
      const prompt = this.buildPrompt(formData);
      const generatedIdea = await this.generateIdea(prompt);
      
      // Parse the generated content
      const parsedIdea = this.parseGeneratedContent(generatedIdea);
      
      await this.model.updateIdea(ideaId, parsedIdea);
    } catch (error) {
      console.error('Process generation error:', error);
      await this.model.updateStatus(ideaId, 'failed', error.message);
      throw error;
    }
  }

  buildPrompt(formData) {
    const { productName, productDescription, productUrl, productImage } = formData;
    
    return `Saya ingin membuat konten promosi untuk produk berikut:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 INFORMASI PRODUK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NAMA PRODUK: ${productName}

DESKRIPSI PRODUK:
${productDescription}

URL PRODUK: ${productUrl || 'N/A'}

${productImage ? `GAMBAR PRODUK: ${productImage}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TUGAS ANDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: RESEARCH PRODUK
Lakukan riset mendalam tentang produk ini. Cari informasi detail seperti:
- Fitur dan spesifikasi utama
- Keunggulan dibanding kompetitor
- Target audience dan use case
- Pain points yang diselesaikan
- Benefit nyata untuk customer
- Social proof atau testimoni (jika ada)
- Price range dan value proposition

PENTING: Pastikan informasi yang Anda berikan AKURAT dan VALID. Jangan membuat informasi yang tidak ada. Jika informasi tertentu tidak tersedia, fokus pada yang pasti dari deskripsi yang diberikan.

STEP 2: GENERATE KONTEN KREATIF
Berdasarkan riset di atas, buatkan konten promosi yang UNIK, MENARIK, dan PERSUASIF dengan format:

1. IDE KONTEN UTAMA
   - Jelaskan konsep angle konten yang fresh dan menarik
   - Fokus pada emotional connection dan storytelling
   - 2-3 kalimat yang powerful

2. HIGHLIGHT POINTS (4-5 poin)
   - Poin-poin kunci yang wajib disampaikan
   - Mix antara features dan benefits
   - Setiap poin maksimal 1 kalimat yang padat

3. HOOK (0-5 detik)
   - Kalimat pembuka yang langsung grab attention
   - Relatable dengan target audience
   - Maksimal 2 kalimat pendek dalam Bahasa Indonesia
   - Harus bikin penasaran atau "wow moment"

4. VALUE (5-25 detik)
   - Isi konten yang detail dan informatif
   - Include problem-solution narrative
   - Show benefit dengan concrete example
   - Bahasa conversational dan engaging
   - 4-6 kalimat dalam Bahasa Indonesia

5. CTA (25-30 detik)
   - Soft selling approach
   - Clear next step untuk audience
   - Include URL produk jika ada
   - Persuasif tapi tidak pushy
   - 2-3 kalimat dalam Bahasa Indonesia

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ CREATIVITY GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Buat konten yang BERBEDA dari konten produk serupa
- Use storytelling dan emotional appeal
- Bahasa natural dan conversational (bukan formal/kaku)
- Include specific details yang bikin kredibel
- Hindari klaim berlebihan atau tidak realistis
- Fokus pada transformation dan hasil nyata

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 REQUIRED OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IDE_KONTEN_UTAMA:
[Tulis ide konten utama di sini]

HIGHLIGHT_POINTS:
1. [Point 1]
2. [Point 2]
3. [Point 3]
4. [Point 4]
5. [Point 5 - jika ada]

HOOK:
[Tulis hook dalam Bahasa Indonesia]

VALUE:
[Tulis value proposition lengkap dalam Bahasa Indonesia]

CTA:
[Tulis call to action dalam Bahasa Indonesia]

Generate sekarang dengan konten yang KREATIF, UNIK, dan PERSUASIF!`;
  }

  async generateIdea(prompt) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content strategist and copywriter specializing in product marketing and viral content creation. You create unique, engaging, and conversion-focused content that resonates with the target audience. You always provide accurate information and never hallucinate facts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9, // Higher for more creativity
        max_tokens: 2000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Generate idea error:', error);
      throw error;
    }
  }

  parseGeneratedContent(content) {
    try {
      // Extract sections using regex
      const ideKontenMatch = content.match(/IDE_KONTEN_UTAMA:\s*([\s\S]*?)(?=HIGHLIGHT_POINTS:|$)/i);
      const highlightPointsMatch = content.match(/HIGHLIGHT_POINTS:\s*([\s\S]*?)(?=HOOK:|$)/i);
      const hookMatch = content.match(/HOOK:\s*([\s\S]*?)(?=VALUE:|$)/i);
      const valueMatch = content.match(/VALUE:\s*([\s\S]*?)(?=CTA:|$)/i);
      const ctaMatch = content.match(/CTA:\s*([\s\S]*?)$/i);

      // Extract and clean IDE KONTEN UTAMA
      const ideKonten = ideKontenMatch 
        ? ideKontenMatch[1].trim().replace(/\[.*?\]/g, '').trim()
        : '';

      // Extract and parse HIGHLIGHT POINTS
      let highlightPoints = [];
      if (highlightPointsMatch) {
        const pointsText = highlightPointsMatch[1].trim();
        const pointMatches = pointsText.match(/\d+\.\s*(.+?)(?=\n\d+\.|$)/gs);
        if (pointMatches) {
          highlightPoints = pointMatches.map(point => 
            point.replace(/^\d+\.\s*/, '').trim().replace(/\[.*?\]/g, '').trim()
          ).filter(p => p.length > 0);
        }
      }

      // Extract and clean HOOK
      const hook = hookMatch 
        ? hookMatch[1].trim().replace(/\[.*?\]/g, '').trim()
        : '';

      // Extract and clean VALUE
      const value = valueMatch 
        ? valueMatch[1].trim().replace(/\[.*?\]/g, '').trim()
        : '';

      // Extract and clean CTA
      const cta = ctaMatch 
        ? ctaMatch[1].trim().replace(/\[.*?\]/g, '').trim()
        : '';

      return {
        ideKonten,
        highlightPoints,
        hook,
        value,
        cta
      };
    } catch (error) {
      console.error('Parse content error:', error);
      throw new Error('Failed to parse generated content');
    }
  }

  async *generateIdeaStream(prompt) {
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content strategist and copywriter specializing in product marketing and viral content creation. You create unique, engaging, and conversion-focused content that resonates with the target audience. You always provide accurate information and never hallucinate facts.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 2000,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  }

  async getStatus(ideaId) {
    return await this.model.getById(ideaId);
  }

  async getUserHistory(userId, limit = 20) {
    return await this.model.getUserHistory(userId, limit);
  }
}

module.exports = ProductIdeaService;