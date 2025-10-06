import React, { useState, useCallback } from 'react';

// --- Helper Components & Icons ---
// Using inline SVG for icons to keep it all in one file.
const LeafIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 4 13V8a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v5a7 7 0 0 1-7 7Zm0 0V8"/>
  </svg>
);

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 21l1.9-5.8 5.8-1.9-5.8-1.9L12 3z" />
        <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
);


// --- Main Application Component ---
export default function AgriAIAssistant() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // This is the core function that calls the Gemini API
  const getAIResponse = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a question first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse('');


    const apiKey = "AIzaSyCa49RqRobzEXK3TkBVQAQldrQNvDoP_W8";
    const model = 'gemini-1.5-flash'; // As specified in your .env
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // We give the AI a role to get better, more focused answers.
    const systemPrompt = `You are an expert agricultural assistant for farmers in India.
    Your goal is to provide clear, concise, and actionable advice.
    Base your answers on sustainable and practical farming methods suitable for the Indian subcontinent.
    Always provide the answer in simple, easy-to-understand language.`;

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        parts: [{ text: prompt }]
      }],
    };

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(`API Error: ${errorBody.error?.message || 'Something went wrong.'}`);
      }

      const data = await res.json();
      
      // Extract the text from the API response
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (textResponse) {
        setResponse(textResponse);
      } else {
        throw new Error("Received an empty response from the AI.");
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect to the AI service. Please check your connection and API key setup.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);
  
  const handleExampleClick = (examplePrompt) => {
    setPrompt(examplePrompt);
  };

  return (
    <div className="bg-gray-50 font-sans min-h-screen">
      <div className="container mx-auto p-4 max-w-2xl">
        
        {/* Header */}
        <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-green-100 text-green-700 rounded-full p-3 mb-2">
                <LeafIcon />
            </div>
          <h1 className="text-4xl font-bold text-green-800">AgriGrowth AI Assistant</h1>
          <p className="text-gray-600 mt-2">Your AI-powered guide for healthier crops and better yields in India.</p>
        </header>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
            
          {/* Input Section */}
          <div className="mb-4">
            <label htmlFor="prompt-input" className="block text-lg font-semibold text-gray-700 mb-2">
              Ask your farming question:
            </label>
            <textarea
              id="prompt-input"
              rows="4"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., What is the best organic pesticide for tomato plants?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow duration-200"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={getAIResponse}
            disabled={isLoading}
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Getting Advice...
              </>
            ) : (
                <>
                <SparklesIcon /> <span className="ml-2">Get AI Advice</span>
                </>
            )}
          </button>
          
          {/* Example Prompts */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-2">Or try an example:</p>
            <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={() => handleExampleClick("How to improve soil fertility for rice cultivation in sandy soil?")} className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200">Improve Soil Fertility</button>
                <button onClick={() => handleExampleClick("What are the symptoms of late blight in potato and how to manage it organically?")} className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200">Identify Potato Disease</button>
                <button onClick={() => handleExampleClick("Suggest a good crop rotation plan for a small farm in Maharashtra.")} className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200">Crop Rotation Plan</button>
            </div>
          </div>

        </div>
        
        {/* Response Section */}
        <div className="mt-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {response && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">AI Recommendation:</h2>
              <div className="prose prose-green max-w-none text-gray-700 whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </div>
        
      </div>
      <script src="https://cdn.tailwindcss.com"></script>
    </div>
  );
}