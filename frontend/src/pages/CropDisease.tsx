import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type FileDetails = { mime_type: string | null; data: string | null };

type GeminiPart = { text?: string; inline_data?: { mime_type: string | null; data: string | null } };
type GeminiCandidate = { content?: { parts?: GeminiPart[] } };
type GeminiResponse = { candidates?: GeminiCandidate[] };

export default function VirtualMathsTeacher(): JSX.Element {
  const navigate = useNavigate();
  const [fileDetails, setFileDetails] = useState<FileDetails>({ mime_type: null, data: null });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");

  const Api_url: string =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyB6l_UkvfvwoyoiHf0zkbQaGcfEWGkJbnY";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        const base64data = result.split(",")[1] || "";
        setFileDetails({ mime_type: file.type, data: base64data });
        setImageSrc(`data:${file.type};base64,${base64data}`);
        setOutput("");
      }
    };
    reader.readAsDataURL(file);
  };

  const generateResponse = async (): Promise<void> => {
    if (!fileDetails.data) {
      setOutput("Please upload an image before proceeding.");
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text:
                  "You are an expert in plant pathology. The user uploads an image of a plant part (leaf, crop, stem, tree, or seed). If it is a valid plant part, identify whether it is healthy or diseased. If diseased, give the disease name and a short suggestion for treatment or prevention. If the uploaded image is not a plant part, clearly reply: 'This is not a correct image. Please upload a plant part image.'",
              },
              {
                inline_data: {
                  mime_type: fileDetails.mime_type,
                  data: fileDetails.data,
                },
              },
            ] as GeminiPart[],
          },
        ],
      };

      const response = await fetch(Api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data: GeminiResponse = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const apiResponse = text.replace(/\*\*(.*?)\*\*/g, "$1").trim();

      setOutput(apiResponse || "No leaf found.");
    } catch (err) {
      console.error(err);
      setOutput("Something went wrong. Try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card className="shadow-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary">Crop Disease</CardTitle>
            <Button variant="outline" size="sm" onClick={()=>navigate(-1)}>Back</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <label htmlFor="file-upload" className="text-sm font-medium">Leaf Image</label>
          <input type="file" id="file-upload" accept="image/*" onChange={handleFileChange} />
          <Button onClick={generateResponse} disabled={loading || !fileDetails.data} className="bg-emerald-600 text-white hover:bg-emerald-700">
            {loading ? "Analyzing…" : "Detect"}
          </Button>
          {imageSrc && <img src={imageSrc} alt="Preview" className="w-40 h-40 object-cover rounded border" />}
          {output && (
            <div className="p-3 rounded border bg-white text-black whitespace-pre-wrap text-sm">{output}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}