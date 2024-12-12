## API do Catálago de Vídeos

### Projeto Nest.js 10.3
### Modelar as entidades/agregados Categoria, Cast Member, Genre e Vídeo usando DDD
### Pirâmide de testes
### Criar repositório integrados com Elastic Search
### Testcontainers (Adquirido pelo Docker)
### Criar os casos de uso de sincronização e de consulta
### Integrar com Kafka Connect/ Debezium MySQL
### Usar o Kafka Streams (Java) para tratar dados mais complexo
### Criar os consumidores do Kafka
### Criar API Rest e GraphQL
### Criar autenticação com Keycloak
### Criar CI/CD (Test containers)

index compartilhado (tabelas)

//Documento de Categoria
{
    "id": "id-da-categoria",
    "nome": "nome-categoria"
}

//Documento de Genero
{
    "id": "id-do-genero",
    "nome": "nome-do-genro",
    "categorias_ids": [{is_delete} , {}]
}

//Documento de pivot
{
    "categoria_id": 1,
    "genre_id": 2,
}

1 - colocando os ids no próprio documento
 - update do nome da categoria
 - excluir uma categoria (operação consistente categoria quanto os relacionados)
    //2 operações
    //acid (transação)
 - consulta - 2 chamadas http

2 - documento separado
 - update do nome da categoria
 - excluir uma categoria (operação consistente categoria quanto os relacionados)
    //no mínimo 2 operações
    //acid (transação)
 - consulta - no mínimo 3 chamadas http

3 - Desnormalização total
    - update - 2 http - update na categoria | update nos subdocumentos
    - exclusão - 2 http - exclui a categoria | update nos relacionados is_deleted=true