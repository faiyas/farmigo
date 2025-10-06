// CropSuggestion.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// --- Type Definitions ---
type Recommendation = {
  crop: string;
  manure: string;
  reason: string;
};

type WeatherData = {
  temperature: number;
  rainfall: number;
  place: string;
};

const CropSuggestion: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [selectedSoil, setSelectedSoil] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [status, setStatus] = useState<string>("Detecting location...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const navigate = useNavigate();

  // --- Data Fetching Logic (Unchanged) ---
  const fetchWeatherAndLocation = useCallback(async (position: GeolocationPosition) => {
    setIsLoading(true);
    setStatus("Fetching weather data...");
    const { latitude: lat, longitude: lon } = position.coords;

    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const geoData = await geoRes.json();
      const place = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.state || "Unknown Place";

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation`);
      const weatherData = await weatherRes.json();

      setWeatherData({
        temperature: weatherData.current_weather.temperature,
        rainfall: weatherData.hourly.precipitation[0],
        place: place,
      });
      setStatus(`📍 Location: ${place}`);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setStatus("⚠️ Could not fetch location or weather data.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleGeolocationError = (error: GeolocationPositionError) => {
    const errorMessages: { [key: number]: string } = { 1: "Geolocation permission denied.", 2: "Position unavailable.", 3: "Request timed out." };
    setStatus(`Error: ${errorMessages[error.code] || "An unknown error occurred."}`);
    setIsLoading(false);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(fetchWeatherAndLocation, handleGeolocationError);
    } else {
      setStatus("Geolocation is not supported by this browser.");
      setIsLoading(false);
    }
  }, [fetchWeatherAndLocation]);


  // --- AI-Powered Suggestion Logic ---
  const getCropSuggestion = async () => {
    if (!selectedSoil || !weatherData) return;

    setIsSuggesting(true);
    setRecommendations([]);

    try {
      // Step 1: Send the collected data to your backend API.
      const response = await fetch("/api/crop-suggestion", { // This is your new backend endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soilType: selectedSoil,
          weather: weatherData,
        }),
      });

      if (!response.ok) {
        throw new Error("API response was not ok.");
      }

      // Step 2: Receive the AI-generated recommendations and display them.
      const aiRecommendations: Recommendation[] = await response.json();
      setRecommendations(aiRecommendations);

    } catch (error) {
      console.error("Failed to get AI suggestion:", error);
      setRecommendations([{ crop: "Error", manure: "Could not fetch suggestions.", reason: "The backend API might be down or an error occurred." }]);
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary">AI Crop Suggestion</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground min-h-[20px]">{status}</div>
          
          {weatherData && !isLoading && (
            <div className="p-3 rounded-lg border bg-slate-50">
              <div className="flex justify-between items-center mb-2">
                <div>🌡️ Temp: <span className="font-bold">{weatherData.temperature}°C</span></div>
                <div>💧 Rainfall: <span className="font-bold">{weatherData.rainfall} mm</span></div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="soil" className="text-sm font-medium">1. Select Soil Type</label>
            <select id="soil" value={selectedSoil} onChange={(e) => setSelectedSoil(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2 bg-white" disabled={isLoading}>
              <option value="">-- Select Soil --</option>
              <option value="loamy">Loamy</option>
              <option value="sandy">Sandy</option>
              <option value="clay">Clay</option>
              <option value="black">Black</option>
              <option value="alluvial">Alluvial</option>
              <option value="red">Red</option>
            </select>
          </div>

          <Button onClick={getCropSuggestion} className="w-full bg-primary text-white hover:bg-primary/90" disabled={!selectedSoil || isLoading || isSuggesting}>
            {isSuggesting ? "🤖 Analyzing with AI..." : "2. Get AI Suggestion"}
          </Button>

          {recommendations.length > 0 && !isSuggesting && (
            <div className="space-y-3 pt-2">
              <h3 className="font-semibold">🧠 AI Recommendations:</h3>
              {recommendations.map((r, idx) => (
                <div key={idx} className="p-3 rounded-lg border bg-white animate-in fade-in-50">
                  <p className="font-semibold text-lg text-primary">{idx + 1}. {r.crop}</p>
                  <p className="text-sm mt-1"><span className="font-semibold">Manure:</span> {r.manure}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CropSuggestion;