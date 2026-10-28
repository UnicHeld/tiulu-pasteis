# Implantação e recuperação

Requer Docker Compose, domínio com HTTPS e proxy reverso (Caddy ou Nginx). Nenhum deploy é feito automaticamente pelo projeto.

1. Copie `.env.example` para `.env`. Configure `POSTGRES_PASSWORD` forte (use hex para evitar caracteres especiais em URI), `APP_ORIGIN=https://seu-dominio`, Google e/ou senha de gestão com 16+ caracteres.
2. Execute `docker compose up -d --build`. O banco é privado na rede Docker; a aplicação só escuta no loopback da VPS. O serviço migrate aplica a migração antes da aplicação iniciar.
3. Configure proxy TLS para `127.0.0.1:3000`. Preserve Host e Origin. Desative logs de acesso em `/api/orders/track/*` para não gravar tokens. Não exponha a porta 5432.
4. Configure redirecionamento Google conforme [Google OAuth](../integracoes/google-oauth.md). Teste login, permissões de gestor, pedido e retirada em HTTPS.
5. Confira `docker compose logs app` e `/api/health`. Teste instalação PWA no Android/iOS; no iOS use “Adicionar à Tela de Início”. A página offline não deve permitir novos pedidos.

Exemplo de Caddyfile (substitua domínio):

```caddy
pasteis.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Caddy deve ser instalado/configurado na VPS e as portas 80/443 liberadas. Senhas e OAuth não devem ser enviados a Git nem incluídos em imagens.

## Backup e restauração

Use `pg_dump` diário em formato custom, com armazenamento criptografado fora da VPS e retenção definida. Teste restauração em banco isolado. O volume `postgres_data` persiste reinícios; não execute `docker compose down -v` em produção. Atualizações devem ter backup e revisão de migrações; esta versão possui apenas migração inicial idempotente. Restauração de pedidos interfere em estoque e pagamentos: reconcile antes de reabrir.

## Checklist de homologação

- Substituir cardápio, preços e horários de exemplo; conferir catálogo e estoque.
- Criar gestor; validar que aluno/anônimo não altera pedidos.
- Pedido anônimo, agendado e autenticado; acompanhar estados em dois aparelhos.
- Confirmar Pix/cartão apenas após verificar recebimento real; não aceitar Verocard enquanto bloqueado.
- Validar concorrência e limites de estoque, comunicação de falha de rede e códigos perdidos.
- Definir regras de resgate de fidelidade e revisar preços promocionais antes de anunciá-las, política de privacidade e retenção de nomes/histórico.
- Recuperação de backup e testes de navegador em dispositivos reais antes de operação comercial.
