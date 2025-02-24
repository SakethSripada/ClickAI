const express = require('express');
const axios = require('axios');
const cors = require('cors');
const tiktoken = require('tiktoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5010;

// Set security-related HTTP headers
app.use(helmet());

// Enable CORS with strict settings for production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting middleware to prevent abuse (e.g. DDOS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.'
});
app.use(apiLimiter);

app.use(express.json());

const MAX_TOKENS = 16385; 
const RESPONSE_TOKENS = 1000;  
const incompleteResponses = {};

const encoder = tiktoken.encoding_for_model("gpt-4");

/**
 * Counts the total tokens in the conversation messages.
 *
 * @param {Array} messages - Array of message objects.
 * @returns {number} Total token count.
 */
const countTokens = (messages) => {
  return messages.reduce((total, msg) => total + encoder.encode(msg.content).length, 0);
};

/**
 * Trims conversation history to keep token count within limits.
 *
 * @param {Array} history - Array of conversation messages.
 * @param {number} maxTokens - Maximum allowed tokens.
 * @returns {Array} Trimmed conversation history.
 */
const trimHistory = (history, maxTokens) => {
  while (countTokens(history) > maxTokens && history.length > 1) {
    history.shift(); 
  }
  return history;
};

app.post('/generate', async (req, res) => {
  const { conversationHistory, continueId, image } = req.body;
  let formattedHistory = [];

  // Validate input before proceeding to avoid unnecessary API calls
  if (image) {
    formattedHistory.push({
      role: 'user',
      content: image,
    });
  } else if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    formattedHistory = conversationHistory.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));
  } else {
    return res.status(400).json({ error: "Invalid input. Expected conversation history or image." });
  }

  if (continueId && incompleteResponses[continueId]) {
    formattedHistory = [
      ...formattedHistory,
      ...incompleteResponses[continueId].map((msg) => ({
        role: 'assistant',
        content: msg,
      })),
    ];
  }

  // Trim history to avoid exceeding token limits
  formattedHistory = trimHistory(formattedHistory, MAX_TOKENS - RESPONSE_TOKENS);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: formattedHistory,
        max_tokens: RESPONSE_TOKENS,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const responseContent = response.data.choices[0].message.content;
    const responseId = response.data.id;
    const isContinued = response.data.choices[0].finish_reason === 'length';

    if (isContinued) {
      incompleteResponses[responseId] = (incompleteResponses[continueId] || []).concat(responseContent);
    }

    res.json({ response: responseContent, id: responseId, isContinued });
  } catch (error) {
    console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error generating response' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
