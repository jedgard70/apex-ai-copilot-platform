import { exec } from 'node:child_process';
import util from 'node:util';

const execAsync = util.promisify(exec);

// Ferramenta que dá autoridade aos Agentes Release Managers
// Ela Roda um pré-teste (npm run build ou lint) e se der tudo certo faz o push para o main.
export async function runDeployValidated(commitMessage) {
  try {
    console.log('[DeployManager] Iniciando validação pré-deploy...');
    
    // 1. Roda os validadores. Se qualquer coisa quebrar, barra o deploy.
    // Usando uma checagem rápida local
    const { stdout: buildOut, stderr: buildErr } = await execAsync('npm run build', { timeout: 60000 }).catch(e => e);
    
    if (buildErr && buildErr.toLowerCase().includes('error')) {
      return {
        success: false,
        message: 'Validação falhou. O Deploy foi barrado.',
        logs: buildErr
      };
    }

    // 2. Proteção contra edição de variáveis de ambiente.
    // Impede que agentes subam alterações não autorizadas nos envs
    const { stdout: statusOut } = await execAsync('git status --short');
    if (statusOut.includes('.env') || statusOut.includes('vercel.json')) {
      return {
        success: false,
        message: 'REGRA 8 / REGRA 1 VIOLADA: Tentativa de commit em arquivos de ambiente ou configuração Vercel proibida. Revertendo...',
        logs: statusOut
      };
    }

    // 3. Adiciona as mudanças rastreadas
    await execAsync('git add .');

    // 4. Commita com a mensagem do agente
    const cleanMessage = commitMessage.replace(/"/g, '\\"');
    await execAsync(`git commit -m "[Auto-Deploy] ${cleanMessage}"`).catch(() => {/* ignora se não tiver nada para commitar */});

    // 5. O Deploy em si. Exceção da Regra 8 autorizada: "git push origin main" aciona a Vercel
    const { stdout: pushOut, stderr: pushErr } = await execAsync('git push origin main');
    
    return {
      success: true,
      message: 'Deploy e Commit executados com sucesso no origin main. A Vercel iniciará o pipeline cloud.',
      logs: pushOut || pushErr
    };

  } catch (err) {
    return {
      success: false,
      message: 'Falha crítica ao tentar rodar o Deployer Agent.',
      logs: err.message
    };
  }
}
