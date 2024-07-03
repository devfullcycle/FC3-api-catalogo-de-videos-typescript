### Mapeamento dos Campos no Elasticsearch:

O mapeamento dos campos no Elasticsearch é o processo de definir como os documentos são indexados e armazenados. Ele define o tipo de dado de cada campo em um índice, como texto, número, data, etc., e fornece configurações adicionais, como análise de texto, formato de data, entre outros. Aqui estão alguns pontos-chave sobre o mapeamento dos campos:

- **Tipo de Dados**: Define o tipo de dado que o campo pode armazenar, como texto, número, data, booleano, etc.
  
- **Configurações Adicionais**: Fornecem configurações específicas para cada tipo de campo, como análise de texto, formato de data, precisão numérica, etc.
  
- **Dynamic Mapping**: O Elasticsearch pode inferir automaticamente o mapeamento dos campos com base nos dados fornecidos ou você pode definir o mapeamento manualmente.
  
- **Mapeamento Explícito**: Permite que você defina explicitamente o mapeamento dos campos, fornecendo controle total sobre como os dados são indexados e armazenados.

### Diferenças entre Keyword e Text:

No Elasticsearch, existem dois tipos principais de campos para armazenar texto: `text` e `keyword`. Aqui estão as diferenças entre eles:

- **Text**: O tipo `text` é usado para campos que contêm texto livre, como descrições, comentários, etc. Os dados são analisados durante o processo de indexação, o que significa que o texto é dividido em tokens individuais e normalizado, permitindo pesquisa de texto completo e consultas flexíveis.
  
- **Keyword**: O tipo `keyword` é usado para campos que contêm valores que não devem ser analisados, como IDs, nomes de categorias, tags, etc. Os dados são indexados como uma única string, o que os torna ideais para termos exatos e agregações.

Em resumo, `text` é usado para pesquisa de texto completo e consultas flexíveis, enquanto `keyword` é usado para termos exatos e operações de filtro e agregação. Escolher o tipo de campo certo para cada uso é importante para garantir um desempenho e funcionalidade ideais em seu índice Elasticsearch.
