const Idea = require('../models/Idea');
const User = require('../models/User');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `Kamu adalah seorang ahli copywriting berbahasa Indonesia yang fokus khusus pada pembuatan konten TikTok yang profesional dan edukatif. Dalam setiap ide konten yang kamu buat, gunakan formula storytelling yang terbukti efektif, seperti:
- Before-After-Bridge
- Problem-Agitate-Solve

KARAKTERISTIK TONE FORMAL:
- Menggunakan bahasa Indonesia yang profesional namun tetap accessible
- Konten edukatif dengan data dan fakta yang kredibel
- Tone yang informatif dan authoritative
- Fokus pada value proposition yang clear dan terukur
- Menggunakan kata-kata seperti: "Berdasarkan riset", "Fakta menunjukkan", "Strategi yang terbukti efektif"

Tujuan utama konten adalah: menarik perhatian, menyampaikan informasi dengan cara yang kredibel, mendorong interaksi, dan cocok dengan karakteristik TikTok.

Gunakan gaya copywriting yang:
- Profesional namun tetap engaging
- Berbasis data dan fakta yang valid
- Ringkas, padat, dan langsung to the point
- Nyambung sama audiens yang mencari konten edukatif/bisnis

Terapkan pendekatan seperti:
- Educational storytelling dengan data
- Authority building
- Social proof dengan statistik
- Value-driven content

🧠 HOOK WAJIB: Singkat, berbasis fakta/statistik, dan langsung grab perhatian dalam 3 detik pertama.

Gunakan elemen penting dalam teks:
- Statistik & data valid: "80% orang tidak tahu bahwa...", "Riset terbaru membuktikan..."
- Angka & daftar: "3 strategi bisnis yang...", "5 fakta mengejutkan tentang..."
- Selalu pakai kata 'kamu', bukan 'anda'

⚠️ Pelajari dan patuhi:
- TikTok Shop Content Guidelines
- TikTok Shop | Tokopedia Restricted & Unsupported Products Guidelines

❌ Jangan buat klaim produk yang berlebihan atau tidak akurat (overclaiming).

🎬 Format Output:
1. Ide Konten TikTok: (Hook edukatif + Isi berbasis data + Penutup + CTA)
2. Caption Profesional: (gunakan hashtag edukatif dan bisnis trending relevan)
3. Storyboard Video Lengkap (Detik-Detik):
   - Hook (0-5 detik)
   - Isi Part 1 (6-10 detik)
   - Isi Part 2 (11-15 detik)
   - Isi Part 3 (16-20 detik)
   - Closing (21-25 detik)
   - CTA (26-30 detik)
   
   Pada setiap bagian Storyboard, sertakan narasi yang sesuai dengan durasi waktu yang sudah ditentukan
   `;

class IdeaController {
  static async index(req, res) {
    try {
      const currentUser = await User.findById(req.session.userId);
      const chats = await Idea.findChatsByUserId(req.session.userId);
      
      res.render('idea', { 
        user: currentUser,
        chats,
        error: null,
        success: null 
      });
    } catch (error) {
      console.error('Error loading idea page:', error);
      res.status(500).send('Server error');
    }
  }

  static async getAllChats(req, res) {
    try {
      const userId = req.session.userId || req.user?.id;
      const chats = await Idea.findChatsByUserId(userId);
      
      res.json({ 
        success: true, 
        data: chats 
      });
    } catch (error) {
      console.error('Error fetching chats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async getChatById(req, res) {
    try {
      const chat = await Idea.findChatById(req.params.id);
      
      if (!chat) {
        return res.status(404).json({ 
          success: false, 
          message: 'Chat not found' 
        });
      }

      const messages = await Idea.findMessagesByChatId(req.params.id);
      
      res.json({ 
        success: true, 
        data: {
          chat,
          messages
        }
      });
    } catch (error) {
      console.error('Error fetching chat:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async createChat(req, res) {
    try {
      const { title } = req.body;
      const userId = req.session.userId || req.user?.id;

      if (!title) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title is required' 
        });
      }

      const chatId = await Idea.createChat(userId, title);
      const newChat = await Idea.findChatById(chatId);

      res.status(201).json({ 
        success: true, 
        message: 'Chat created successfully',
        data: newChat 
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async deleteChat(req, res) {
    try {
      const { id } = req.params;
      const chat = await Idea.findChatById(id);

      if (!chat) {
        return res.status(404).json({ 
          success: false, 
          message: 'Chat not found' 
        });
      }

      await Idea.deleteChat(id);

      res.json({ 
        success: true, 
        message: 'Chat deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  static async streamMessage(req, res) {
    try {
      const { chatId, message, isNewChat } = req.body;

      if (!message) {
        return res.status(400).json({ 
          success: false, 
          message: 'Message is required' 
        });
      }

      let currentChatId = chatId;

      // If new chat, create it automatically with truncated message as title
      if (isNewChat || !chatId) {
        const userId = req.session.userId || req.user?.id;
        const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
        currentChatId = await Idea.createChat(userId, title);
      }

      // Verify chat exists
      const chat = await Idea.findChatById(currentChatId);
      if (!chat) {
        return res.status(404).json({ 
          success: false, 
          message: 'Chat not found' 
        });
      }

      // Save user message
      await Idea.createMessage(currentChatId, 'user', message);

      // Get chat history for context
      const messages = await Idea.findMessagesByChatId(currentChatId);
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Send chat ID first for new chats
      if (isNewChat) {
        res.write(`data: ${JSON.stringify({ type: 'chatId', chatId: currentChatId })}\n\n`);
      }

      let fullResponse = '';

      try {
        // Stream from OpenAI API
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 4096
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            // Send chunk to client
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: content })}\n\n`);
          }
        }

        // Save assistant response to database
        await Idea.createMessage(currentChatId, 'assistant', fullResponse);
        
        // Generate smart title from conversation if it's a new chat
        if (isNewChat) {
          try {
            const titleCompletion = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                { 
                  role: 'system', 
                  content: 'Generate a short, concise title (max 6 words) in Indonesian that summarizes the main topic of this conversation. Only return the title, nothing else.' 
                },
                { role: 'user', content: message },
                { role: 'assistant', content: fullResponse.substring(0, 500) }
              ],
              temperature: 0.5,
              max_tokens: 50
            });

            const smartTitle = titleCompletion.choices[0]?.message?.content?.trim() || title;
            await Idea.updateChatTitle(currentChatId, smartTitle);
            
            res.write(`data: ${JSON.stringify({ type: 'title', title: smartTitle })}\n\n`);
          } catch (titleError) {
            console.error('Error generating title:', titleError);
          }
        }
        
        // Send completion signal
        res.write(`data: ${JSON.stringify({ type: 'done', content: fullResponse })}\n\n`);
        res.end();

      } catch (streamError) {
        console.error('OpenAI stream error:', streamError);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Streaming error occurred' })}\n\n`);
        res.end();
      }

    } catch (error) {
      console.error('Error streaming message:', error);
      
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: error.message || 'Server error' 
        });
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
      }
    }
  }
}

module.exports = IdeaController;