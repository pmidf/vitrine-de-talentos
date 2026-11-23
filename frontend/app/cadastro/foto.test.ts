// @vitest-environment jsdom

import { afterEach, expect, it, vi } from "vitest";
import { recortarFoto } from "./foto";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("recorta o centro de uma foto retangular e devolve um JPEG quadrado", async () => {
  const imagem = {
    src: "",
    naturalWidth: 1600,
    naturalHeight: 1000,
    decode: vi.fn().mockResolvedValue(undefined),
  };
  vi.stubGlobal("Image", vi.fn(function () { return imagem; }));

  const revogar = vi.fn();
  vi.stubGlobal("URL", { createObjectURL: () => "blob:original", revokeObjectURL: revogar });

  const contexto = { fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn() };
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
  getContext.mockReturnValue(contexto as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    callback,
    tipo,
  ) {
    expect([this.width, this.height]).toEqual([800, 800]);
    callback(new Blob(["foto quadrada"], { type: tipo }));
  });

  const foto = await recortarFoto(new File(["original"], "foto.png", { type: "image/png" }));
  expect(foto.type).toBe("image/jpeg");
  expect(contexto.drawImage).toHaveBeenCalledWith(imagem, 300, 0, 1000, 1000, 0, 0, 800, 800);
  expect(revogar).toHaveBeenCalledWith("blob:original");
});

it("recusa formatos fora da regra, como GIF", async () => {
  const gif = new File(["gif"], "animacao.gif", { type: "image/gif" });
  await expect(recortarFoto(gif)).rejects.toThrow("Selecione uma foto em JPEG, PNG ou WebP.");
});

it("recusa fotos acima de 5 MB", async () => {
  // 5 MB + 1 byte, só com zeros
  const grande = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "grande.jpg", { type: "image/jpeg" });
  await expect(recortarFoto(grande)).rejects.toThrow("Selecione uma foto de até 5 MB.");
});