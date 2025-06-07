// index.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

console.log("Hugging Face API Key loaded:", !!process.env.HF_API_KEY);

app.post('/generate-code', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await axios({
      method: 'post',
     
      url: 'https://api-inference.huggingface.co/models/gpt2',

      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        inputs: `# Generate functional code for: ${prompt}\n\n`,
        options: { wait_for_model: true },
        parameters: {
          max_new_tokens: 100,
          temperature: 0.2,
        },
      },
    });

    console.log('HuggingFace response:', response.data);

    // Parse response
    const generatedText = response.data[0]?.generated_text || '// No code generated.';

    res.json({ code: generatedText });
  } catch (error) {
    console.error('HuggingFace API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
