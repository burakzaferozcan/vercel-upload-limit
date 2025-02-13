import { NextRequest, NextResponse } from "next/server";

// Geçici olarak memory'de tutacağımız dosyalar için bir Map
const uploadedFiles = new Map();

// bodyParser'ı devre dışı bırak
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    // Stream olarak veriyi al
    const chunks: Uint8Array[] = [];
    const reader = request.body!.getReader();
    let totalSize = 0;

    // Chunk'ları topla
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.length;

      // İsteğe bağlı: Belirli bir boyut limitini kontrol et
      if (totalSize > 100 * 1024 * 1024) {
        // Örneğin 100MB limit
        return NextResponse.json(
          { message: "Dosya boyutu çok büyük" },
          { status: 413 }
        );
      }
    }

    // Tüm chunk'ları birleştir
    const buffer = Buffer.concat(chunks);

    // Content-Type ve dosya adını header'lardan al
    const contentType =
      request.headers.get("content-type") || "application/octet-stream";
    const filename = `${Date.now()}-file`; // Veya header'dan dosya adını alabilirsiniz

    // Dosyayı memory'de sakla
    uploadedFiles.set(filename, {
      buffer,
      type: contentType,
      name: filename,
    });

    return NextResponse.json(
      {
        message: "Dosya başarıyla yüklendi",
        filename: filename,
        size: buffer.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Dosya yükleme hatası:", error);
    return NextResponse.json(
      { message: "Dosya yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// GET endpoint'i aynı kalabilir
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const filename = url.searchParams.get("filename");

  if (!filename || !uploadedFiles.has(filename)) {
    return NextResponse.json({ message: "Dosya bulunamadı" }, { status: 404 });
  }

  const file = uploadedFiles.get(filename);
  return new NextResponse(file.buffer, {
    headers: {
      "Content-Type": file.type,
      "Content-Disposition": `attachment; filename="${file.name}"`,
    },
  });
}
