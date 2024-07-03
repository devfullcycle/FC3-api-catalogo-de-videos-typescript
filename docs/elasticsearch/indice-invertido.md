## Como funciona o Índice Invertido?

#### 1. Tokenização e Análise:
   - Quando um documento é indexado, o texto é primeiro dividido em unidades menores chamadas tokens. 
   - Em seguida, esses tokens passam por um processo de análise, onde são normalizados e processados para criar termos de índice.

#### 2. Construção do Índice Invertido:
   - Para cada termo de índice (token), o índice invertido mantém uma lista de documentos que contêm esse termo.
   - Cada entrada na lista de documentos geralmente contém informações adicionais, como frequência do termo no documento, posição do termo no documento, etc.

#### 3. Consulta:
   - Quando uma consulta de pesquisa é realizada, ela é processada de maneira semelhante.
   - A consulta é tokenizada e analisada para criar termos de consulta.
   - Em seguida, o sistema de busca procura esses termos de consulta no índice invertido.
   - Com base na presença desses termos nos documentos, um conjunto de resultados é retornado, geralmente classificado por relevância.

#### 4. Vantagens do Índice Invertido:
   - **Rápida Recuperação**: Como os termos são indexados em uma estrutura de pesquisa otimizada, a recuperação de documentos relevantes é rápida.
   - **Eficiência de Espaço**: A estrutura compacta do índice invertido permite uma alta eficiência de armazenamento em comparação com outras formas de indexação.

#### 5. Exemplo:
   - Suponha que temos os seguintes documentos indexados: 
     1. Documento 1: "O gato preto está dormindo."
     2. Documento 2: "O cão marrom está latindo."
   - O índice invertido para esses documentos pode parecer algo assim:
     ```
     Termo       Documentos
     ------------------------
     gato       | 1
     preto      | 1
     dormindo   | 1
     cão        | 2
     marrom     | 2
     latindo    | 2
     está       | 1, 2
     O          | 1, 2
     ```
   - Ao procurar por "gato", o índice invertido nos diz que o termo "gato" está presente no Documento 1.

O índice invertido é uma estrutura de dados poderosa e eficiente para permitir pesquisas rápidas e precisas em grandes conjuntos de documentos. Ele forma a base de muitos sistemas modernos de busca, incluindo o Elasticsearch.

## Índice invertido vs índices em bancos de dados SQL

### Índices em Bancos de Dados SQL:

- **Estruturação**: Nos bancos de dados SQL tradicionais, os índices geralmente são árvores B ou B+ que mapeiam valores de colunas para linhas em uma tabela.
  
- **Chaves Primárias e Únicas**: Os índices em bancos de dados SQL são frequentemente usados para acelerar a busca por chaves primárias e únicas, bem como para otimizar consultas que envolvem cláusulas WHERE.

- **Consulta Direta**: Os índices em bancos de dados SQL permitem uma busca eficiente através de uma estrutura de dados ordenada, geralmente resultando em acesso direto aos registros correspondentes.

### Índice Invertido no Elasticsearch:

- **Estrutura de Dados**: O índice invertido no Elasticsearch é uma estrutura de dados que mapeia termos de texto para os documentos que os contêm, em vez de mapear valores de colunas para linhas.

- **Pesquisa Textual Eficiente**: Ele é especialmente projetado para facilitar pesquisas de texto completo, permitindo que os usuários pesquisem por palavras-chave em grandes volumes de texto de maneira rápida e eficiente.

- **Tokenização e Análise**: Antes de indexar os dados, o Elasticsearch realiza tokenização e análise para normalizar e processar o texto, o que melhora a precisão das pesquisas.

- **Consulta Flexível**: Além de pesquisas exatas, o Elasticsearch suporta consultas flexíveis, como correspondência parcial, pesquisa por prefixo, pesquisa por sinônimos, etc.

### Principais Diferenças:

1. **Tipo de Dados Indexados**: Enquanto os índices em bancos de dados SQL indexam valores de colunas, o índice invertido no Elasticsearch indexa termos de texto.

2. **Finalidade**: Os índices em bancos de dados SQL são principalmente para otimização de consultas e busca rápida de registros específicos, enquanto o índice invertido no Elasticsearch é para facilitar pesquisas de texto completo e análise de texto.

3. **Consulta**: Os índices em bancos de dados SQL são otimizados para consultas estruturadas e exatas, enquanto o índice invertido no Elasticsearch suporta uma variedade de consultas flexíveis em texto não estruturado.

Essas diferenças refletem as necessidades e objetivos distintos de otimização e pesquisa em sistemas de banco de dados SQL versus sistemas de busca como o Elasticsearch.
