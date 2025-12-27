// services/VideoPromptingService.js
const OpenAI = require('openai');
const VideoPromptingModel = require('../models/VideoPromptingModel');

class VideoPromptingService {
  constructor(pool) {
    this.model = new VideoPromptingModel(pool);
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async startGeneration(userId, formData) {
    try {
      // Create record
      const promptingId = await this.model.create(userId, formData);

      // Start generation in background
      this.processGeneration(promptingId, formData).catch(error => {
        console.error('Background generation error:', error);
        this.model.updateStatus(promptingId, 'failed', error.message);
      });

      return { promptingId, status: 'processing' };
    } catch (error) {
      console.error('Start generation error:', error);
      throw error;
    }
  }

  async processGeneration(promptingId, formData) {
    try {
      const prompt = this.buildPrompt(formData);
      const generatedPrompt = await this.generatePrompt(prompt);
      await this.model.updatePrompt(promptingId, generatedPrompt);
    } catch (error) {
      console.error('Process generation error:', error);
      await this.model.updateStatus(promptingId, 'failed', error.message);
      throw error;
    }
  }

  buildPrompt(formData) {
    const { ideKonten, highlightPoints, urlProducts, hook, value, cta } = formData;
    
    let highlightPointsText = '';
    if (Array.isArray(highlightPoints)) {
      highlightPointsText = highlightPoints.map((point, index) => `${index + 1}. ${point}`).join('\n');
    }

    return `Saya ingin membuat video product review 30 detik (6 scenes x 5 detik) menggunakan Veo AI IMAGE-TO-VIDEO dengan karakter dari gambar berbicara Bahasa Indonesia. Berikut detail konten saya:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INFORMASI KONTEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IDE KONTEN UTAMA:
${ideKonten}

HIGHLIGHT POINTS:
${highlightPointsText}

URL PRODUCTS:
${urlProducts || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 SCRIPT NARASI (Exact Indonesian Text)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOOK (0-5 detik):
"${hook}"

VALUE (5-25 detik):
"${value}"

CTA (25-30 detik):
"${cta}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖼️ IMAGE TO VIDEO MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CATATAN: Saya akan menggunakan IMAGE sebagai starting point untuk karakter.
Gambar akan di-upload untuk Scene 1, dan karakter dari gambar tersebut akan digunakan konsisten di semua 6 scenes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 GENERATION REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tolong buatkan 6 COMPLETE SINGLE-PROMPT untuk setiap scene (total 6 prompts) untuk Veo AI IMAGE-TO-VIDEO dengan requirements:

✅ SINGLE-PROMPT FORMAT (CRITICAL):
- Setiap scene hanya OUTPUT 1 PROMPT yang complete
- Prompt harus include: character reference, action, Indonesian narration text, camera movement, facial expression, lighting, dan technical specs
- Format: 1 paragraph panjang yang siap copy-paste ke Veo field
- NO multiple fields - semua info dalam 1 prompt

✅ IMAGE-TO-VIDEO REQUIREMENTS:
- Scene 1: Reference "the character in the image" untuk establish karakter
- Scene 2-6: Reference "same character from the image" untuk maintain consistency
- Maintain exact appearance, outfit, hairstyle, and setting dari image

✅ CONSISTENCY REQUIREMENTS:
- Karakter IDENTIK di semua 6 scenes (dari image reference)
- Lighting style KONSISTEN dengan image
- Background SAMA di semua scenes (sesuai image)
- Outfit TIDAK BERUBAH sama sekali (sesuai image)

✅ INDONESIAN NARRATION REQUIREMENTS:
- Include exact Indonesian text dalam prompt dengan format: speaking in Indonesian saying: "[exact text]"
- Natural Indonesian pronunciation dan intonasi
- Clear lip-sync specification
- Mouth movements sync dengan kata-kata Indonesia

✅ SCENE BREAKDOWN STRUCTURE:
- Scene 1 (0-5s): HOOK - Attention grabbing opening (IMAGE-TO-VIDEO)
- Scene 2 (5-10s): PROBLEM/CONTEXT - Setup the need
- Scene 3 (10-15s): SOLUTION INTRO - Introduce product/idea
- Scene 4 (15-20s): VALUE PROOF - Detail explanation
- Scene 5 (20-25s): BENEFIT HIGHLIGHT - Show results/benefits
- Scene 6 (25-30s): SOFT CTA - Call to action with URL mention

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 REQUIRED OUTPUT FORMAT (SINGLE PROMPT PER SCENE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCENE 1 (0-5s) - HOOK
═══════════════════════════════════════════════════════════════════
[Single complete prompt paragraph with all elements: character reference, action, Indonesian narration in quotes, camera movement, expression, lighting, specs - READY TO COPY-PASTE]
═══════════════════════════════════════════════════════════════════

SCENE 2 (5-10s) - PROBLEM/CONTEXT
═══════════════════════════════════════════════════════════════════
[Single complete prompt paragraph - READY TO COPY-PASTE]
═══════════════════════════════════════════════════════════════════

SCENE 3 (10-15s) - SOLUTION INTRO
═══════════════════════════════════════════════════════════════════
[Single complete prompt paragraph - READY TO COPY-PASTE]
═══════════════════════════════════════════════════════════════════

SCENE 4 (15-20s) - VALUE PROOF
═══════════════════════════════════════════════════════════════════
[Single complete prompt paragraph - READY TO COPY-PASTE]
═══════════════════════════════════════════════════════════════════

SCENE 5 (20-25s) - BENEFIT HIGHLIGHT
═══════════════════════════════════════════════════════════════════
[Single complete prompt paragraph - READY TO COPY-PASTE]
═══════════════════════════════════════════════════════════════════

SCENE 6 (25-30s) - SOFT CTA
═══════════════════════════════════════════════════════════════════
[Single complete prompt paragraph - READY TO COPY-PASTE]
═══════════════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ADDITIONAL REQUIREMENTS:
- Bagi VALUE narasi menjadi 4 bagian (untuk scene 2-5) secara merata
- Setiap prompt harus self-contained dan complete
- Include transition cues di akhir prompt (kecuali scene 6)
- Pastikan word count per scene seimbang (2.5-3.5 words/second ideal)

CRITICAL: Output harus SINGLE PROMPT per scene yang bisa langsung copy-paste ke Veo prompt field tanpa editing!

Generate complete 6 single-prompt scenes sekarang.`;
  }

  async generatePrompt(prompt) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert video production specialist and Veo AI prompt engineer. You create detailed, consistent, and production-ready video prompts for AI video generation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Generate prompt error:', error);
      throw error;
    }
  }

  async *generatePromptStream(prompt) {
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert video production specialist and Veo AI prompt engineer. You create detailed, consistent, and production-ready video prompts for AI video generation.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  }

  async getStatus(promptingId) {
    return await this.model.getById(promptingId);
  }

  async getUserHistory(userId, limit = 20) {
    return await this.model.getUserHistory(userId, limit);
  }
}

module.exports = VideoPromptingService;