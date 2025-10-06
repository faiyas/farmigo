import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// --- Helper Components & Icons ---
const LeafIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 4 13V8a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v5a7 7 0 0 1-7 7Zm0 0V8"/>
  </svg>
);

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

// --- Typing Effect Hook ---
function useTypingEffect(text, speed = 30) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      return;
    }

    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayedText;
}

// --- Main Application Component ---
export default function Helpinbot() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayedResponse = useTypingEffect(response, 20); // typing speed

  // Core AI call
  const getAIResponse = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter your question first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse('');

    const apiKey = "AIzaSyCa49RqRobzEXK3TkBVQAQldrQNvDoP_W8";
    const model = 'gemini-2.5-flash-preview-05-20'; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemPrompt = `You are Farmigo, an agricultural growth assistant website for Indian farmers. 
    Your job is to give clear, practical, and sustainable farming advice to help improve productivity and income. 
    Focus on seasonal guidance (September 2025 → end of Kharif, start of Rabi), 
    modern techniques, government schemes, and simple explanations.`; 

    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: prompt }] }],
    };

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(`API Error: ${errorBody.error?.message || 'Something went wrong.'}`);
      }

      const data = await res.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (textResponse) {
        setResponse(textResponse);
      } else {
        throw new Error("Received an empty response from AI.");
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect to AI service. Check connection or API key.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);

  const handleExampleClick = (examplePrompt) => {
    setPrompt(examplePrompt);
  };

  return (
    <div className="bg-gray-50 font-sans min-h-screen relative">
      {/* Fixed Back Button */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b z-50 shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-700 hover:text-green-800"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-2xl pt-16">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-green-100 text-green-700 rounded-full p-3 mb-2">
            <LeafIcon />
          </div>
          <h1 className="text-4xl font-bold text-green-800">Helpinbot</h1>
          <p className="text-gray-600 mt-2">Your AI-powered farming guide for better yields and crop health.</p>
        </header>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Input Section */}
          <div className="mb-4">
            <label htmlFor="prompt-input" className="block text-lg font-semibold text-gray-700 mb-2">
              Ask about farming, crops, or agri growth:
            </label>
            <textarea
              id="prompt-input"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Best soil preparation for Rabi wheat after Kharif paddy?"
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
                Thinking...
              </>
            ) : (
              <>
                <MessageIcon /> <span className="ml-2">Ask Farmigo</span>
              </>
            )}
          </button>
          
          {/* Example Prompts */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-2">Or try these examples:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button onClick={() => handleExampleClick("How do I prepare my Punjab field for Rabi wheat after Kharif rice harvest?")} className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200">Prepare for Wheat Season</button>
              <button onClick={() => handleExampleClick("My Gujarat cotton crop has pink bollworm. What is an organic control method?")} className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200">Control Cotton Pests</button>
              <button onClick={() => handleExampleClick("What are profitable intercropping options with sugarcane in Andhra Pradesh?")} className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200">Sugarcane Intercropping</button>
            </div>
          </div>
        </div>
        
        {/* Response Section */}
{/* Response Section */}
<div className="mt-8">
  {error && (
    <div
      className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
      role="alert"
    >
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{error}</span>
    </div>
  )}

  {displayedResponse && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white border-l-4 border-green-500 rounded-xl shadow-lg p-6"
    >
      <h2 className="text-2xl font-semibold text-green-700 mb-4">
        🌱 Farmigo Suggests:
      </h2>

      {/* Typing text with caret */}
      <div className="relative font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
        {displayedResponse}

        {/* Caret animation while typing */}
        {displayedResponse.length < response.length && (
          <span className="inline-block w-2 h-5 bg-green-600 animate-pulse ml-1 rounded-sm"></span>
        )}
      </div>
    </motion.div>
  )}
</div>

      </div>
      <script src="https://cdn.tailwindcss.com"></script>
    </div>
  );
}
