/**
 * ClickAI Backend Server
 * 
 * Express.js server that handles AI chat requests from the ClickAI browser extension.
 * Features include OpenAI GPT integration, rate limiting, security middleware,
 * and conversation context management with token counting.
 * 
 * @author ClickAI Team
 * @version 1.0.0
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const tiktoken = require('tiktoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5010;

// Security middleware - adds various HTTP headers for protection
app.use(helmet());

// CORS configuration to allow extension communication
// Note: In production, consider restricting origins for better security
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-extension-secret'],
}));

// Rate limiting to prevent API abuse and DDoS attacks
// Allows 100 requests per 15-minute window per IP address
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(apiLimiter);

// Parse incoming JSON requests
app.use(express.json());

// Authentication middleware using shared secret
const EXTENSION_SECRET = process.env.EXTENSION_SECRET;
app.use((req, res, next) => {
  const headerSecret = req.headers['x-extension-secret'];
  if (headerSecret !== EXTENSION_SECRET) {
    return res.status(403).json({ error: 'Unauthorized access' });
  }
  next();
});

// Token limits for conversation management
const MAX_TOKENS = 16385;  // Maximum tokens for GPT-4 context window
const RESPONSE_TOKENS = 1000;  // Reserved tokens for AI response

// Store incomplete responses that can be continued
const incompleteResponses = {};

// Initialize tokenizer for GPT-4 model
const encoder = tiktoken.encoding_for_model("gpt-4");

/**
 * Counts the total number of tokens in conversation messages
 * 
 * @param {Array} messages - Array of message objects with role and content
 * @returns {number} Total token count for the conversation
 */
function countTokens(messages) {
  return messages.reduce((total, message) => {
    const messageTokens = encoder.encode(`${message.role}: ${message.content}`).length;
    return total + messageTokens;
  }, 0);
}

/**
 * Trims conversation history to fit within token limits
 * Keeps the system message and removes oldest user/assistant pairs as needed
 * 
 * @param {Array} messages - Full conversation history
 * @returns {Array} Trimmed conversation that fits within token limits
 */
function trimConversation(messages) {
  const availableTokens = MAX_TOKENS - RESPONSE_TOKENS;
  let currentTokens = countTokens(messages);
  
  // If we're already under the limit, return as-is
  if (currentTokens <= availableTokens) {
    return messages;
  }
  
  // Always keep the system message (first message) if it exists
  const systemMessage = messages[0]?.role === 'system' ? [messages[0]] : [];
  let conversationMessages = messages[0]?.role === 'system' ? messages.slice(1) : [...messages];
  
  // Remove pairs of messages (user + assistant) from the beginning
  // until we're under the token limit
  while (conversationMessages.length > 2 && 
         countTokens([...systemMessage, ...conversationMessages]) > availableTokens) {
    // Remove the oldest user-assistant pair
    conversationMessages = conversationMessages.slice(2);
  }
  
  return [...systemMessage, ...conversationMessages];
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Main chat endpoint - handles AI conversation requests
 * 
 * Expected request body:
 * {
 *   messages: Array of {role: string, content: string},
 *   temperature: number (optional, default 0.7),
 *   continueId: string (optional, for continuing incomplete responses)
 * }
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, temperature = 0.7, continueId } = req.body;
    
    // Validate request body
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request: messages array is required and cannot be empty' 
      });
    }

    // Validate each message has required fields
    const invalidMessage = messages.find(msg => !msg.role || !msg.content);
    if (invalidMessage) {
      return res.status(400).json({ 
        error: 'Invalid message format: each message must have role and content' 
      });
    }

    let conversationMessages = [...messages];
    
    // Handle continuation of incomplete responses
    if (continueId && incompleteResponses[continueId]) {
      const incompleteData = incompleteResponses[continueId];
      conversationMessages = [...incompleteData.messages];
      
      // Add a continuation prompt to the last assistant message
      const lastMessage = conversationMessages[conversationMessages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content += '\n\n[Continuing from previous response...]';
      }
      
      // Clean up the stored incomplete response
      delete incompleteResponses[continueId];
    }

    // Trim conversation to fit within token limits
    const trimmedMessages = trimConversation(conversationMessages);

    // Log token usage for monitoring
    const tokenCount = countTokens(trimmedMessages);
    console.log(`Request token count: ${tokenCount}/${MAX_TOKENS - RESPONSE_TOKENS}`);

    // Make request to OpenAI API
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: trimmedMessages,
        temperature: Math.max(0, Math.min(2, temperature)), // Clamp temperature between 0 and 2
        max_tokens: RESPONSE_TOKENS,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const aiMessage = openaiResponse.data.choices[0].message;
    const finishReason = openaiResponse.data.choices[0].finish_reason;
    
    // Check if the response was cut off due to length limits
    const isIncomplete = finishReason === 'length';
    let continueId_new = null;
    
    if (isIncomplete) {
      // Generate a unique ID for this incomplete response
      continueId_new = Math.random().toString(36).substring(2, 15);
      
      // Store the conversation state for potential continuation
      incompleteResponses[continueId_new] = {
        messages: [...trimmedMessages, aiMessage],
        timestamp: Date.now()
      };
      
      // Clean up old incomplete responses (older than 1 hour)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      Object.keys(incompleteResponses).forEach(id => {
        if (incompleteResponses[id].timestamp < oneHourAgo) {
          delete incompleteResponses[id];
        }
      });
    }

    // Log usage statistics
    const usage = openaiResponse.data.usage;
    console.log(`OpenAI usage - Prompt: ${usage.prompt_tokens}, Completion: ${usage.completion_tokens}, Total: ${usage.total_tokens}`);

    // Send successful response
    res.status(200).json({
      message: aiMessage.content,
      isIncomplete,
      continueId: continueId_new,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      }
    });

  } catch (error) {
    console.error('Chat API Error:', error.message);
    
    // Handle specific OpenAI API errors
    if (error.response?.status === 401) {
      return res.status(500).json({ 
        error: 'OpenAI API authentication failed. Please check your API key.' 
      });
    } else if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'OpenAI API rate limit exceeded. Please try again later.' 
      });
    } else if (error.response?.status >= 400 && error.response?.status < 500) {
      return res.status(400).json({ 
        error: `OpenAI API error: ${error.response.data?.error?.message || 'Invalid request'}` 
      });
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        error: 'Request timeout. The AI service is taking too long to respond.' 
      });
    }
    
    // Generic error response for unexpected issues
    res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  }
});

/**
 * Start the server and listen on the configured port
 */
app.listen(port, () => {
  console.log(`🚀 ClickAI server running on port ${port}`);
  console.log(`📊 Health check available at: http://localhost:${port}/health`);
  console.log(`🤖 Chat API endpoint: http://localhost:${port}/api/chat`);
  
  // Validate required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY environment variable is not set');
  }
  if (!process.env.EXTENSION_SECRET) {
    console.warn('⚠️  WARNING: EXTENSION_SECRET environment variable is not set');
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
