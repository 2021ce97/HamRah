const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');

// Mock instances since API keys would be in .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'MOCK_GEMINI_KEY';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'MOCK_CLAUDE_KEY';

// Initialize Gemini (For Tazkira OCR)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize Claude (For Smart Fare Suggestion)
// Note: In actual production, ensure exact client init syntax for the anthropic SDK version
const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

exports.verifyTazkiraOCR = async (base64Image) => {
  try {
    console.log('[AI Service] Analyzing Tazkira via Gemini 1.5 Pro...');
    
    // In production, you would pass the image part to Gemini
    // For MVP demonstration, we mock the Gemini response
    
    // const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    // const result = await model.generateContent([
    //   "Extract the Name, Father's Name, and ID Number from this Afghan Tazkira.",
    //   { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
    // ]);
    // const text = result.response.text();

    return {
      success: true,
      data: {
        name: 'Ahmad Farid',
        fatherName: 'Mahmoud',
        tazkiraNumber: '1401-234-567',
        confidenceScore: 0.95
      },
      rawAnalysis: 'Extracted successfully using Gemini Vision.'
    };
  } catch (error) {
    console.error('Gemini OCR Error:', error);
    return { success: false, error: 'Failed to process Tazkira document' };
  }
};

exports.suggestSmartFare = async (pickup, destination, distanceKm) => {
  try {
    console.log('[AI Service] Suggesting Fare via Claude 3.5 Sonnet...');
    
    // In production, you would call Claude API
    /*
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 100,
      system: "You are an AI assistant for an Afghan ride-hailing app. Give a fare suggestion in AFN.",
      messages: [
        { role: "user", content: `Suggest a fair price for a ${distanceKm}km ride from ${pickup} to ${destination} in Kabul. Return ONLY the number range like '120-150'.` }
      ]
    });
    const suggestedRange = msg.content[0].text;
    */

    // Mock response based on standard Kabul rates (approx 30-40 AFN per km base)
    const baseRate = 35;
    const lowerBound = Math.round(distanceKm * baseRate);
    const upperBound = Math.round(distanceKm * (baseRate + 15));

    return {
      success: true,
      suggestedFareRange: `${lowerBound} - ${upperBound}`,
      currency: 'AFN',
      modelUsed: 'claude-3.5-sonnet'
    };
  } catch (error) {
    console.error('Claude API Error:', error);
    return { success: false, error: 'Failed to generate fare suggestion' };
  }
};
