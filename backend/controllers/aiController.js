const asyncHandler = require('express-async-handler');
const { GoogleGenAI } = require('@google/genai');

const suggestPrice = asyncHandler(async (req, res) => {
  const { title, description, category } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Please provide at least a title to analyze');
  }

  const promptText = `
    You are an expert auction appraiser. Please suggest a starting base price in Indian Rupees (INR) for the following item.
    Title: "${title}"
    Description: "${description || 'No description provided'}"
    Category: "${category || 'General'}"

    Only reply with a valid JSON format having two properties: "suggestedPrice" (a number, without formatting like commas) and "reasoning" (a short 1-2 sentence explanation). Do not wrap the JSON in markdown blocks.
  `;

  // Fallback heuristic function if no API key or API fails
  const mockAI = () => {
    let base = 500;
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('iphone') || lowerTitle.includes('laptop') || lowerTitle.includes('macbook')) base += 45000;
    if (lowerTitle.includes('vintage') || lowerTitle.includes('antique')) base += 10000;
    if (lowerTitle.includes('watch') || lowerTitle.includes('rolex')) base += 15000;
    if (lowerTitle.includes('car') || lowerTitle.includes('bike')) base += 100000;
    if (category === 'Electronics') base += 5000;
    if (category === 'Art') base += 8000;

    const randomVariation = Math.floor(Math.random() * 2000) - 1000;
    const finalPrice = Math.max(100, Math.floor((base + randomVariation) / 100) * 100);

    return {
      suggestedPrice: finalPrice,
      reasoning: "Generative AI API key is missing. This is a heuristically calculated mock price based on your keywords and category.",
      isMock: true
    };
  };

  if (!process.env.GEMINI_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return res.json({ success: true, data: mockAI() });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: promptText,
    });

    // In @google/genai v1.x, response.text is a property (string)
    let rawText = typeof response.text === 'function' ? response.text() : response.text;

    // Strip markdown code fences if present
    rawText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const aiResult = JSON.parse(rawText);

    res.json({
      success: true,
      data: {
        suggestedPrice: typeof aiResult.suggestedPrice === 'string'
          ? parseFloat(aiResult.suggestedPrice)
          : aiResult.suggestedPrice,
        reasoning: aiResult.reasoning,
        isMock: false
      }
    });

  } catch (err) {
    console.error('Gemini API Error:', err.message || err);
    const mockData = mockAI();
    mockData.reasoning = "AI Service temporarily unavailable. Falling back to heuristic estimation.";
    res.json({
      success: true,
      data: mockData
    });
  }
});

module.exports = { suggestPrice };
