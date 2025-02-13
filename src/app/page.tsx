"use client";

import { useState } from "react";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Lütfen bir dosya seçin.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ Başarıyla yüklendi: ${result.filename}`);
      } else {
        setMessage(`❌ Yükleme başarısız: ${result.message}`);
      }
    } catch {
      setMessage("❌ Yükleme sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div>
      <h1>Dosya Yükleme</h1>

      <input type="file" onChange={handleFileChange} />

      <button onClick={handleUpload} disabled={!selectedFile || loading}>
        {loading ? "Yükleniyor..." : "Yükle"}
      </button>

      {message && <p className="mt-2">{message}</p>}
    </div>
  );
}
