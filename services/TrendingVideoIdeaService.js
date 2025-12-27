// services/TrendingVideoIdeaService.js
const axios = require('axios');
const OpenAI = require('openai');
const TrendingVideoIdeaModel = require('../models/TrendingVideoIdeaModel');

class TrendingVideoIdeaService {
  constructor(pool) {
    this.model = new TrendingVideoIdeaModel(pool);
    this.assemblyAI = {
      apiKey: process.env.ASSEMBLYAI_API_KEY || '9318cea2e9244442871b57cf0b9d5a33',
      baseURL: 'https://api.assemblyai.com/v2'
    };
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async startGeneration(userId, videoId, videoUrl) {
    try {
      // Create record
      const ideaId = await this.model.create(userId, videoId, videoUrl);

      // Start transcription (don't await - run in background)
      this.processTranscription(ideaId, videoUrl).catch(error => {
        console.error('Background transcription error:', error);
        this.model.updateStatus(ideaId, 'failed', error.message);
      });

      return { ideaId, status: 'transcribing' };
    } catch (error) {
      console.error('Start generation error:', error);
      throw error;
    }
  }

  async processTranscription(ideaId, videoUrl) {
    try {
      // Submit transcription request
      const transcriptResponse = await axios.post(
        `${this.assemblyAI.baseURL}/transcript`,
        {
          audio_url: videoUrl,
          language_detection: true
        },
        {
          headers: {
            'authorization': this.assemblyAI.apiKey,
            'content-type': 'application/json'
          }
        }
      );

      const transcriptId = transcriptResponse.data.id;
      
      // Poll for completion
      const transcript = await this.pollTranscript(transcriptId);
      
      if (transcript.status === 'completed' && transcript.text) {
        // Update with transcript
        await this.model.updateTranscript(ideaId, transcriptId, transcript.text);
        
        // Generate idea
        await this.generateIdea(ideaId, transcript.text);
      } else {
        throw new Error('Transcription failed or no text available');
      }
    } catch (error) {
      console.error('Process transcription error:', error);
      await this.model.updateStatus(ideaId, 'failed', error.message);
      throw error;
    }
  }

  async pollTranscript(transcriptId, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(
          `${this.assemblyAI.baseURL}/transcript/${transcriptId}`,
          {
            headers: {
              'authorization': this.assemblyAI.apiKey
            }
          }
        );

        const { status } = response.data;

        if (status === 'completed' || status === 'error') {
          return response.data;
        }

        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('Poll transcript error:', error);
        if (i === maxAttempts - 1) throw error;
      }
    }

    throw new Error('Transcription timeout');
  }

  async generateIdea(ideaId, transcriptText) {
    try {
      const prompt = `Saya memiliki narasi konten kreator: ${transcriptText}

Tolong transform konten ini dengan kriteria:

🎯 KONTEN STRATEGY:
- Soft marketing approach (80% value, 20% selling)
- Storytelling > Product features
- Problem-solution narrative
- Social proof integrated naturally
- Emotional connection focus

📝 DELIVERABLES:
1. IDE KONTEN UTAMA (konsep angle baru)
2. HIGHLIGHT POINTS (3-5 poin kuat)


✨ TONE GUIDELINES:
- Conversational & authentic
- Vulnerable tapi inspiring
- Educational tanpa preachy
- Persuasive tanpa pushy
- Include personal touch

OUTPUT dalam format:

## IDE KONTEN UTAMA
[...]

## HIGHLIGHT POINTS
- [...]

## SCRIPT NARASI LENGKAP

**HOOK:**
[...]

**VALUE:**
[...]

**CTA:**
[...]

Pastikan semua response anda didalam bahasa indonesia`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content strategist specializing in viral video content creation and soft marketing approaches.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      });

      const generatedIdea = completion.choices[0].message.content;
      await this.model.updateIdea(ideaId, generatedIdea);

      return generatedIdea;
    } catch (error) {
      console.error('Generate idea error:', error);
      await this.model.updateStatus(ideaId, 'failed', error.message);
      throw error;
    }
  }

  async getStatus(ideaId) {
    return await this.model.getById(ideaId);
  }

  async getByVideoId(userId, videoId) {
    return await this.model.getByVideoId(userId, videoId);
  }

  async getUserHistory(userId, limit = 10) {
    return await this.model.getUserHistory(userId, limit);
  }

  // For streaming version
  async *generateIdeaStream(transcriptText) {
    const prompt = `Saya memiliki narasi konten kreator: ${transcriptText}

Tolong transform konten ini dengan kriteria:

🎯 KONTEN STRATEGY:
- Soft marketing approach (80% value, 20% selling)
- Storytelling > Product features
- Problem-solution narrative
- Social proof integrated naturally
- Emotional connection focus

📝 DELIVERABLES:
1. IDE KONTEN UTAMA (konsep angle baru)
2. HIGHLIGHT POINTS (3-5 poin kuat)

✨ TONE GUIDELINES:
- Conversational & authentic
- Vulnerable tapi inspiring
- Educational tanpa preachy
- Persuasive tanpa pushy
- Include personal touch


OUTPUT dalam format:

## IDE KONTEN UTAMA
[...]

## HIGHLIGHT POINTS
- [...]

**HOOK:**
[...]

**VALUE:**
[...]

**CTA:**
[...]

Pastikan semua response anda didalam bahasa indonesia`;

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content strategist specializing in viral video content creation and soft marketing approaches.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
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
}

module.exports = TrendingVideoIdeaService;