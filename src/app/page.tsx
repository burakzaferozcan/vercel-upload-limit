"use client";
import { useState } from "react";

const CHUNK_SIZE = 4 * 1024 * 1024; // 1MB chunk size

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setMessage(null);
      setProgress(0);
    }
  };

  const uploadChunk = async (
    chunk: Blob,
    index: number,
    totalChunks: number,
    uploadId: string,
    fileName: string,
    fileType: string
  ) => {
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("fileName", fileName);
    formData.append("fileType", fileType);
    formData.append("chunkIndex", index.toString());
    formData.append("totalChunks", totalChunks.toString());
    formData.append("uploadId", uploadId);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Chunk ${index} yükleme hatası`);
    }

    return response.json();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Lütfen bir dosya seçin.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setProgress(0);

    try {
      const fileSize = selectedFile.size;
      const chunks = Math.ceil(fileSize / CHUNK_SIZE);
      const uploadId = Date.now().toString(); // Basit bir uploadId oluşturma

      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        const chunk = selectedFile.slice(start, end);

        const result = await uploadChunk(
          chunk,
          i,
          chunks,
          uploadId,
          selectedFile.name,
          selectedFile.type
        );

        // İlerleme durumunu güncelle
        const currentProgress = Math.round(((i + 1) / chunks) * 100);
        setProgress(currentProgress);

        if (result.complete) {
          setMessage(`✅ Başarıyla yüklendi: ${result.filename}`);
          break;
        }
      }
    } catch (error) {
      setMessage(`❌ Yükleme sırasında bir hata oluştu: ${error}`);
    } finally {
      setLoading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dosya Yükleme</h1>
      <div className="space-y-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="w-full border p-2 rounded"
          disabled={loading}
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          className={`w-full p-2 rounded ${
            loading || !selectedFile
              ? "bg-gray-300"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {loading ? "Yükleniyor..." : "Yükle"}
        </button>

        {loading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {message && (
          <p
            className={`mt-2 ${
              message.includes("❌") ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
