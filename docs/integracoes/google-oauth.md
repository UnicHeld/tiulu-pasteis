# Google OAuth

Criar cliente OAuth do tipo Web. Redirecionamento autorizado deve ser exatamente
`APP_ORIGIN/api/auth/google/callback`. Configurar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
somente no servidor. A interface apenas recebe indicação de que login está habilitado.

1. `GET /api/auth/google` gera state e redireciona ao Google.
2. Callback confere state, troca código no servidor e consulta userinfo.
3. E-mail precisa estar verificado. A identidade é persistida e a sessão é emitida.
4. `ADMIN_EMAILS` define quais novos logins têm permissão de gestor.

Não copiar códigos, tokens ou respostas userinfo para logs, testes ou documentação.
Testes locais não devem executar autenticação real. Homologação manual requer ambiente e conta
de teste autorizados. Cookies e revogação: [autenticação](../arquitetura/autenticacao-do-cliente.md).
