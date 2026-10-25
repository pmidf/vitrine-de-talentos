export const INVALID_CREDENTIALS = "E-mail ou senha incorretos.";
export const CONNECTION_ERROR =
  "Não foi possível conectar. Verifique sua conexão e tente novamente.";

export function loginErrorMessage(error: { name?: string; status?: number }) {
  if (
    error.name === "AuthRetryableFetchError" ||
    error.status === 0 ||
    (error.status !== undefined && error.status >= 500)
  ) return CONNECTION_ERROR;

  // Não expor mensagens do provedor, inclusive para contas bloqueadas/inativas.
  return INVALID_CREDENTIALS;
}
