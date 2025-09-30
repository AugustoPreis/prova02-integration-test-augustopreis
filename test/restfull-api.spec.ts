import pactum from 'pactum';
import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import { SimpleReporter } from '../simple-reporter';

beforeAll(() => pactum.reporter.add(SimpleReporter));
afterAll(() => pactum.reporter.end());

describe('Basic integration tests restful-api.dev /objects', () => {
  const baseUrl = 'https://api.restful-api.dev';
  const endpoint = '/objects';

  it('GET /objects — Deve retornar lista', async () => {
    await pactum
      .spec()
      .get(`${baseUrl}${endpoint}`)
      .expectStatus(StatusCodes.OK);
  });

  it('GET /objects/:id — Deve retornar o item', async () => {
    const fakeObj = {
      name: faker.commerce.productName(),
      data: {
        price: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
        color: faker.color.human(),
      },
    };

    const created = await pactum
      .spec()
      .post(`${baseUrl}${endpoint}`)
      .withJson(fakeObj)
      .expectStatus(StatusCodes.OK)
      .toss();

    await pactum
      .spec()
      .get(`${baseUrl}${endpoint}/${created.body.id}`)
      .expectStatus(StatusCodes.OK)
      .expectJsonLike({
        id: created.body.id,
        name: created.body.name,
        data: {
          color: created.body.data.color,
          price: created.body.data.price
        }
      });
  });

  it('GET /objects/:id — deve retornar 404 se não existir', async () => {
    const fakeId = 'non-existent-id-123456';

    await pactum
      .spec()
      .get(`${baseUrl}${endpoint}/${fakeId}`)
      .expectStatus(StatusCodes.NOT_FOUND);
  });

  it('POST /objects — deve criar objeto e receber 200', async () => {
    const fakeObj = {
      name: faker.commerce.productName(),
      data: {
        color: faker.color.human(),
        price: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 })
      }
    };

    await pactum
      .spec()
      .post(`${baseUrl}${endpoint}`)
      .withJson(fakeObj)
      .expectStatus(StatusCodes.OK);
  });

  it('POST /objects — deve ignorar campos desconhecidos no corpo', async () => {
    const fakeObj = {
      name: faker.commerce.productName(),
      data: {
        color: faker.color.human(),
        price: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 })
      },
      owner: faker.person.fullName(), // campo inesperado
      timestamp: new Date().toISOString() // campo inesperado
    };

    const res = await pactum
      .spec()
      .post(`${baseUrl}${endpoint}`)
      .withJson(fakeObj)
      .expectStatus(StatusCodes.OK)
      .toss();

    // Verifica que os campos extras foram ignorados
    expect(res).not.toHaveProperty('owner');
    expect(res).not.toHaveProperty('timestamp');
  });

  it('PUT /objects/:id — deve retornar 404 se o ID não existir', async () => {
    const fakeId = 'non-existent-id-999999';
    const updateObj = {
      name: faker.commerce.productName(),
      data: {
        color: faker.color.human(),
        price: faker.number.float({ min: 100, max: 200, fractionDigits: 2 })
      }
    };

    await pactum
      .spec()
      .put(`${baseUrl}${endpoint}/${fakeId}`)
      .withJson(updateObj)
      .expectStatus(StatusCodes.NOT_FOUND);
  });

  it('PUT /objects/:id — deve permitir atualização parcial apenas de "name"', async () => {
    const initialObj = {
      name: faker.commerce.productName(),
      data: {
        color: faker.color.human(),
        price: faker.number.float({ min: 100, max: 300, fractionDigits: 2 })
      }
    };

    const created = await pactum
      .spec()
      .post(`${baseUrl}${endpoint}`)
      .withJson(initialObj)
      .expectStatus(StatusCodes.OK)
      .toss();

    const newName = faker.commerce.productName();

    await pactum
      .spec()
      .put(`${baseUrl}${endpoint}/${created.body.id}`)
      .withJson({ name: newName }) // apenas o campo "name"
      .expectStatus(StatusCodes.OK);

    // Verifica que o nome foi atualizado e os dados mantidos
    await pactum
      .spec()
      .get(`${baseUrl}${endpoint}/${created.body.id}`)
      .expectStatus(StatusCodes.OK)
      .expectJsonLike({
        id: created.body.id,
        name: newName,
      });
  });

  it('PUT /objects/:id — deve atualizar objeto e receber 200', async () => {
    const fakeObj = {
      name: faker.commerce.productName(),
      data: {
        color: faker.color.human(),
        price: faker.number.float({ min: 10, max: 500, fractionDigits: 2 })
      }
    };

    const created = await pactum
      .spec()
      .post(`${baseUrl}${endpoint}`)
      .withJson(fakeObj)
      .expectStatus(StatusCodes.OK)
      .toss();

    // atualizar
    const updateObj = {
      name: faker.commerce.productName(),
      data: {
        color: faker.color.human(),
        price: faker.number.float({ min: 500, max: 1000, fractionDigits: 2 })
      }
    };

    await pactum
      .spec()
      .put(`${baseUrl}${endpoint}/${created.body.id}`)
      .withJson(updateObj)
      .expectStatus(StatusCodes.OK);

    // GET para validar
    await pactum
      .spec()
      .get(`${baseUrl}${endpoint}/${created.body.id}`)
      .expectStatus(StatusCodes.OK)
      .expectJsonLike({
        id: created.body.id,
        name: updateObj.name,
        data: {
          color: updateObj.data.color,
          price: updateObj.data.price
        }
      });
  });

  it('DELETE /objects/:id — deve deletar objeto e receber 204', async () => {
    const fakeObj = {
      name: faker.commerce.productName(),
      data: {
        color: faker.color.human(),
        price: faker.number.float({ min: 10, max: 500, fractionDigits: 2 })
      }
    };

    // criar objeto
    const created = await pactum
      .spec()
      .post(`${baseUrl}${endpoint}`)
      .withJson(fakeObj)
      .expectStatus(StatusCodes.OK)
      .toss();

    // deletar
    await pactum
      .spec()
      .delete(`${baseUrl}${endpoint}/${created.body.id}`)
      .expectStatus(StatusCodes.OK);
  });

  it('DELETE /objects/:id — deve retornar 404 se o ID não existir', async () => {
    const fakeId = 'non-existent-id-654321';

    await pactum
      .spec()
      .delete(`${baseUrl}${endpoint}/${fakeId}`)
      .expectStatus(StatusCodes.NOT_FOUND);
  });
});