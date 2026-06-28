export interface MetaPostPayload {
  imageUrl: string;
  caption: string;
  igUserId: string;
  accessToken: string;
}

export class MetaGraphService {
  private static readonly GRAPH_API_URL = 'https://graph.facebook.com/v19.0';

  /**
   * Publica uma imagem no Instagram de forma orgânica.
   * Requer 2 passos: Criar o Container de Mídia e depois Publicar o Container.
   */
  public static async publishInstagramPost(payload: MetaPostPayload): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Passo 1: Criar o Media Container
      const containerResponse = await fetch(`${this.GRAPH_API_URL}/${payload.igUserId}/media?image_url=${encodeURIComponent(payload.imageUrl)}&caption=${encodeURIComponent(payload.caption)}&access_token=${payload.accessToken}`, {
        method: 'POST'
      });
      
      const containerData = await containerResponse.json();
      
      if (containerData.error) {
        throw new Error(`Erro ao criar container: ${containerData.error.message}`);
      }

      const creationId = containerData.id;

      // Passo 2: Publicar o Media Container
      const publishResponse = await fetch(`${this.GRAPH_API_URL}/${payload.igUserId}/media_publish?creation_id=${creationId}&access_token=${payload.accessToken}`, {
        method: 'POST'
      });

      const publishData = await publishResponse.json();

      if (publishData.error) {
        throw new Error(`Erro ao publicar: ${publishData.error.message}`);
      }

      return { success: true, id: publishData.id };
    } catch (error: any) {
      console.error('Meta Graph API Error:', error);
      return { success: false, error: error.message || 'Erro desconhecido ao postar no Instagram' };
    }
  }

  /**
   * Fetch user pages to help find the IG Account ID
   */
  public static async fetchUserPagesAndIGAccounts(accessToken: string) {
    try {
      const response = await fetch(`${this.GRAPH_API_URL}/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      return { error: 'Falha ao recuperar contas conectadas.' };
    }
  }
}
