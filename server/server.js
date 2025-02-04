/*****************************************************
 * server.js
 * 
 * This Express server receives requests from the extension,
 * forwards them to the AI (via the OpenAI API in this case),
 * and sends back the AI-generated responses.
 *
 * The server supports both text-based queries (using conversationHistory)
 * and, if needed in the future, image-based inputs.
 *****************************************************/
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5010;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3004',
];

app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Allow all methods
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allow necessary headers
  credentials: true  // Allow credentials if needed
}));

app.use(express.json());

const incompleteResponses = {};

/**
 * POST /generate
 * 
 * Receives a conversationHistory (or an image, if supported) and sends the prompt to the OpenAI API.
 * If the response is incomplete (due to token limits), it stores the partial response for later continuation.
 */
app.post('/generate', async (req, res) => {
  const { conversationHistory, continueId, image } = req.body;

  let formattedHistory = [];
  if (image) {
    // If image is provided, create a conversation with image input.
    formattedHistory.push({
      role: 'user',
      content: image, // image is a base64 data URL
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

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: formattedHistory,
        max_tokens: 300,
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
