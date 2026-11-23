import { LIMITE_FOTO_RECORTADA } from "./validacao";

export const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];

export async function recortarFoto(arquivo: File): Promise<File> {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    throw new Error("Selecione uma foto em JPEG, PNG ou WebP.");
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    throw new Error("Selecione uma foto de até 5 MB.");
  }

  const url = URL.createObjectURL(arquivo);
  try {
    const imagem = new Image();
    imagem.src = url;
    await imagem.decode();

    const lado = Math.min(imagem.naturalWidth, imagem.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.min(lado, 800);
    const contexto = canvas.getContext("2d");

    if (!contexto || !lado) {
      throw new Error();
    }

    contexto.fillStyle = "#fff";
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.drawImage(
      imagem,
      (imagem.naturalWidth - lado) / 2,
      (imagem.naturalHeight - lado) / 2,
      lado,
      lado,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.85);
    });

    if (!blob || blob.type !== "image/jpeg" || blob.size > LIMITE_FOTO_RECORTADA) {
      throw new Error();
    }

    return new File([blob], "foto-perfil.jpg", { type: blob.type });
  } catch {
    throw new Error("Não foi possível recortar a foto. Selecione outra imagem.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
