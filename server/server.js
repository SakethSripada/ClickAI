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
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
}));

app.use(express.json());

const incompleteResponses = {};

app.post('/generate', async (req, res) => {
  const { conversationHistory, continueId } = req.body;

  if (!conversationHistory || !Array.isArray(conversationHistory) || conversationHistory.length === 0) {
    return res.status(400).json({ error: "Invalid conversation history. Expected a non-empty array." });
  }

  let formattedHistory = conversationHistory.map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text,
  }));

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
        model: 'gpt-3.5-turbo',
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
