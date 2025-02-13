import { NextRequest, NextResponse } from "next/server";

// Geçici olarak memory'de tutacağımız dosyalar için bir Map
const uploadedFiles = new Map();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "Dosya bulunamadı" },
        { status: 400 }
      );
    }

    // Dosya içeriğini Buffer'a çevir
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Benzersiz bir dosya adı oluştur
    const filename = `${Date.now()}-${file.name}`;

    // Dosyayı memory'de sakla
    uploadedFiles.set(filename, {
      buffer,
      type: file.type,
      name: file.name,
    });

    return NextResponse.json(
      {
        message: "Dosya başarıyla yüklendi",
        filename: filename,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Dosya yükleme hatası:", error);
    return NextResponse.json(
      { message: "Dosya yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// İsteğe bağlı olarak dosyayı almak için GET endpoint'i
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
