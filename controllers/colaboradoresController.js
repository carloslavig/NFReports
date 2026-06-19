const pool = require('../db/pool');

// GET /api/colaboradores
async function listar(req, res) {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM colaboradores';
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE status = $${params.length}`;
    }
    query += ' ORDER BY nome ASC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar colaboradores' });
  }
}

// GET /api/colaboradores/:id
async function buscarPorId(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM colaboradores WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ erro: 'Colaborador não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar colaborador' });
  }
}

// POST /api/colaboradores
async function criar(req, res) {
  try {
    const { nome, cargo, status } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });

    const { rows } = await pool.query(
      `INSERT INTO colaboradores (nome, cargo, status)
       VALUES ($1, $2, COALESCE($3, 'Ativo'))
       RETURNING *`,
      [nome, cargo || null, status || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar colaborador' });
  }
}

// PUT /api/colaboradores/:id
async function atualizar(req, res) {
  try {
    const { nome, cargo, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE colaboradores
       SET nome = COALESCE($1, nome),
           cargo = COALESCE($2, cargo),
           status = COALESCE($3, status)
       WHERE id = $4
       RETURNING *`,
      [nome, cargo, status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Colaborador não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar colaborador' });
  }
}

// DELETE /api/colaboradores/:id
async function remover(req, res) {
  try {
    const { rows } = await pool.query('DELETE FROM colaboradores WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ erro: 'Colaborador não encontrado' });
    res.json({ mensagem: 'Colaborador removido com sucesso' });
  } catch (err) {
    console.error(err);
    if (err.code === '23503') {
      return res.status(409).json({ erro: 'Não é possível remover: existem serviços vinculados a este colaborador. Marque como Inativo.' });
    }
    res.status(500).json({ erro: 'Erro ao remover colaborador' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
