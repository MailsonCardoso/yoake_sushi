# 🍣 Guia de Implantação Yoake Sushi Back

Este guia explica como colocar o backend Laravel no ar na sua VPS.

## 1. Subir os Arquivos
Suba todo o conteúdo da pasta `yoake_back` para o diretório desejado na sua VPS por FTP/SFTP ou via Git.

## 2. Configurar o Ambiente
Certifique-se de que o arquivo `.env` na VPS tem as credenciais corretas:
```env
DB_CONNECTION=mysql
DB_HOST=162.240.31.101
DB_PORT=3306
DB_DATABASE=platformxcom_yoake
DB_USERNAME=platformxcom_yoake
DB_PASSWORD=@Secur1t1@
```

## 3. Comandos de Inicialização (Via SSH)
Acesse a pasta do projeto na VPS e rode os seguintes comandos:

```bash
# Rodar as migrations para criar as tabelas no banco de dados
php artisan migrate

# Limpar o cache para garantir que as novas rotas e configurações sejam lidas
php artisan config:cache
php artisan route:cache

# (Opcional) Se precisar de uma chave de app nova
php artisan key:generate
```

## 4. Endpoints Disponíveis
A API estará disponível sob o prefixo `/api`. Exemplo:
- `http://seu-dominio.com/api/products`
- `http://seu-dominio.com/api/orders`

## 5. Dica de Segurança
Para produção, lembre-se de alterar o `APP_DEBUG=true` para `false` no seu `.env` quando tudo estiver funcionando.
