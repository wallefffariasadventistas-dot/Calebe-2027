'use strict';

// Função serverless do Vercel: atende todas as rotas /api/* (ver vercel.json).

const { createApi } = require('../lib/api');

const handle = createApi();

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  // O rewrite do vercel.json envia o caminho original em ?path=
  const apiPath = url.searchParams.get('path') ?? url.pathname.replace(/^\/api\/?/, '');
  await handle(req, res, apiPath);
};
