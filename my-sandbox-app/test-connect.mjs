import { getToken, startAuthorization, UserAuthorizationRequiredError } from '@vercel/connect';

const connector = 'github/apex-ai-copilot-platform';
const params = {
  subject: { type: "user", id: "usr_123" },
};

async function test() {
  try {
    console.log("Tentando obter token do Vercel Connect...");
    const token = await getToken(connector, params);
    console.log("Token obtido com sucesso:", token);
  } catch (err) {
    if (err instanceof UserAuthorizationRequiredError || err.code === 'user_authorization_required') {
      console.log("\n⚠️ Autorização do usuário é necessária!");
      console.log("Iniciando fluxo de autorização...");
      try {
        const authResponse = await startAuthorization(connector, params);
        console.log("\n👉 Por favor, abra o link a seguir no seu navegador para autorizar a conexão:");
        console.log(authResponse.url);
        console.log("\nApós autorizar no navegador, execute este script novamente para obter o token.");
      } catch (authErr) {
        console.error("Falha ao iniciar autorização:", authErr);
      }
    } else {
      console.error("Erro inesperado ao obter token:", err);
    }
  }
}

test();
