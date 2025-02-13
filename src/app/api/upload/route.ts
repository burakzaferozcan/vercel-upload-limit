import { NextRequest, NextResponse } from "next/server";

// Yüklenen dosyaları tutacağımız Map
const uploadedFiles = new Map<
  string,
  {
    buffer: Buffer;
    type: string;
    name: string;
  }
>();

// Geçici olarak chunk'ları tutacağımız yapı
const chunkStorage = new Map<
  string,
  {
    chunks: Buffer[];
    fileName: string;
    fileType: string;
    totalChunks: number;
    receivedChunks: number;
  }
>();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chunk = formData.get("chunk") as Blob;
    const fileName = formData.get("fileName") as string;
    const fileType = formData.get("fileType") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const uploadId = formData.get("uploadId") as string;

    if (!chunk || !fileName || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json(
        { message: "Geçersiz chunk verisi" },
        { status: 400 }
      );
    }

    // Chunk'ı Buffer'a çevir
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());

    // Yeni bir yükleme başlatılıyorsa
    if (chunkIndex === 0 && !chunkStorage.has(uploadId)) {
      chunkStorage.set(uploadId, {
        chunks: new Array(totalChunks),
        fileName,
        fileType,
        totalChunks,
        receivedChunks: 0,
      });
    }

    const fileUpload = chunkStorage.get(uploadId);
    if (!fileUpload) {
      return NextResponse.json(
        { message: "Yükleme oturumu bulunamadı" },
        { status: 404 }
      );
    }

    // Chunk'ı sakla
    fileUpload.chunks[chunkIndex] = chunkBuffer;
    fileUpload.receivedChunks++;

    // Tüm chunk'lar alındıysa dosyayı birleştir
    if (fileUpload.receivedChunks === totalChunks) {
      const completeFile = Buffer.concat(fileUpload.chunks);

      // Birleştirilmiş dosyayı sakla
      const finalFileName = `${Date.now()}-${fileName}`;
      uploadedFiles.set(finalFileName, {
        buffer: completeFile,
        type: fileType,
        name: fileName,
      });

      // Geçici chunk'ları temizle
      chunkStorage.delete(uploadId);

      return NextResponse.json({
        message: "Dosya başarıyla yüklendi",
        filename: finalFileName,
        complete: true,
      });
    }

    return NextResponse.json({
      message: "Chunk başarıyla alındı",
      currentChunk: chunkIndex,
      remainingChunks: totalChunks - fileUpload.receivedChunks,
    });
  } catch (error) {
    console.error("Chunk yükleme hatası:", error);
    return NextResponse.json(
      { message: "Chunk yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Dosyayı almak için GET endpoint'i
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const filename = url.searchParams.get("filename");

  if (!filename || !uploadedFiles.has(filename)) {
    return NextResponse.json({ message: "Dosya bulunamadı" }, { status: 404 });
  }

  const file = uploadedFiles.get(filename);
  if (file) {
    return new NextResponse(file.buffer, {
      headers: {
        "Content-Type": file.type,
        "Content-Disposition": `attachment; filename="${file.name}"`,
      },
    });
  }
}
