//replicar tudo que está em es.http, porém aqui com typescript

import { Client } from '@elastic/elasticsearch';

const client = new Client({ node: 'http://elasticsearch:9200' });

const indexName = 'aula';

export async function deleteIndex() {
  try {
    const result = await client.indices.delete({
      index: indexName,
    });
    console.log(result);
    console.log('Index deleted');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

//criar um índice
export async function createIndex() {
  try {
    await client.indices.create({
      index: indexName,
    });
    console.log('Index created');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

export async function insertDocument() {
  try {
    const result = await client.index({
      index: indexName,
      refresh: true,
      body: {
        name: 'Luiz',
        age: 25,
      },
    });
    console.log(result);
    return result;
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

export async function updateDocument(id) {
  try {
    const result = await client.update({
      index: indexName,
      id: id,
      refresh: true,
      body: {
        doc: {
          age: 26,
        },
      },
    });
    console.log(result);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

export async function deleteDocument(id) {
  try {
    const result = await client.delete({
      index: indexName,
      refresh: true,
      id,
    });
    console.log(result);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

export async function search() {
  try {
    const result = await client.search({
      index: indexName,
      body: {
        query: {
          match: {
            name: 'Luiz',
          },
        },
      },
    });
    console.dir(result, { depth: null });
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function bootstrap() {
  await deleteIndex();
  await createIndex();
  //@ts-expect-error - ignorar erro de tipo
  const { _id } = await insertDocument();
  await updateDocument(_id);
  await search();
  await deleteDocument(_id);
}

bootstrap();
