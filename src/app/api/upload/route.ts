import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

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

    // Dosya adını benzersiz yap
    const filename = `${Date.now()}-${file.name}`;

    // Dosyayı public klasörüne kaydet
    const path = join(process.cwd(), "public/uploads", filename);

    // Klasörü oluştur (eğer yoksa)
    await writeFile(path, buffer);

    return NextResponse.json(
      {
        message: "Dosya başarıyla yüklendi",
        filename: filename,
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

export const config = {
  api: {
    bodyParser: false,
  },
};
