# Autenticação do cliente

| Identidade          | Pode fazer                                                         |
| ------------------- | ------------------------------------------------------------------ |
| Anônimo             | ver cardápio, criar pedido e acompanhar com o código secreto       |
| Cliente autenticado | acesso anterior e histórico dos próprios pedidos autenticados      |
| Gestor              | listar pedidos e itens, operar estados/pagamento e ajustar estoque |

Sessões usam cookie HttpOnly, SameSite=Lax e Secure em produção; a credencial é aleatória, com
hash armazenado no banco e expiração de sete dias. Autorização acontece na API.

Mutações exigem `Origin` igual a `APP_ORIGIN`, inclusive clientes externos da API. OAuth usa
state aleatório e e-mail verificado. Gestores Google são autorizados por `ADMIN_EMAILS`.
Setup: [Google OAuth](../integracoes/google-oauth.md).

`ADMIN_PASSWORD` oferece acesso inicial opcional, com no mínimo 16 caracteres. A comparação usa
hashes de tamanho constante; a senha não é persistida. A rota tem limite de cinco tentativas
a cada 15 minutos por IP. Prefira contas individuais na operação.

O código de acompanhamento é uma credencial de leitura que expõe nome e itens de um pedido.
Não registrar o código, cookies, códigos OAuth ou query strings em logs. Não compartilhar códigos
publicamente. Pedidos anônimos não são associados retroativamente a contas.

Ao revogar gestor, remover suas sessões no banco; mudar `ADMIN_EMAILS` afeta novos logins.
Rate limiting é local ao processo e exige revisão antes de múltiplas réplicas.
