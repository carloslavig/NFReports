const pool = require('../db/pool');

const TIPOS_VALIDOS = ['instalacao', 'manutencao', 'retencao', 'retirada', 'posvenda'];

// GET /api/servicos  (filtros: tipo, colaborador_id, data_inicio, data_fim, cliente_id)
async function listar(req, res) {
  try {
    const { tipo, colaborador_id, data_inicio, data_fim, cliente_id } = req.query;
    const condicoes = [];
    const params = [];

    if (tipo) {
      params.push(tipo);
      condicoes.push(`s.tipo = $${params.length}`);
    }
    if (colaborador_id) {
      params.push(colaborador_id);
      condicoes.push(`s.colaborador_id = $${params.length}`);
    }
    if (cliente_id) {
      params.push(cliente_id);
      condicoes.push(`s.cliente_id = $${params.length}`);
    }
    if (data_inicio) {
      params.push(data_inicio);
      condicoes.push(`s.data_servico >= $${params.length}`);
    }
    if (data_fim) {
      params.push(data_fim);
      condicoes.push(`s.data_servico <= $${params.length}`);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const query = `
      SELECT s.*, c.nome AS colaborador_nome
      FROM servicos s
      JOIN colaboradores c ON c.id = s.colaborador_id
      ${where}
      ORDER BY s.data_servico DESC, s.id DESC
    `;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar serviços' });
  }
}

// GET /api/servicos/:id
async function buscarPorId(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, c.nome AS colaborador_nome
       FROM servicos s JOIN colaboradores c ON c.id = s.colaborador_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Serviço não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar serviço' });
  }
}

// POST /api/servicos
async function criar(req, res) {
  try {
    const { tipo, cliente_id, cliente_nome, motivo, observacoes, data_servico, colaborador_id } = req.body;

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ erro: `Tipo inválido. Use um de: ${TIPOS_VALIDOS.join(', ')}` });
    }
    if (!cliente_id || !cliente_nome || !data_servico || !colaborador_id) {
      return res.status(400).json({ erro: 'cliente_id, cliente_nome, data_servico e colaborador_id são obrigatórios' });
    }

    const { rows } = await pool.query(
      `INSERT INTO servicos (tipo, cliente_id, cliente_nome, motivo, observacoes, data_servico, colaborador_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tipo, cliente_id, cliente_nome, motivo || null, observacoes || null, data_servico, colaborador_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registrar serviço' });
  }
}

// PUT /api/servicos/:id
async function atualizar(req, res) {
  try {
    const { tipo, cliente_id, cliente_nome, motivo, observacoes, data_servico, colaborador_id } = req.body;

    if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ erro: `Tipo inválido. Use um de: ${TIPOS_VALIDOS.join(', ')}` });
    }

    const { rows } = await pool.query(
      `UPDATE servicos SET
         tipo = COALESCE($1, tipo),
         cliente_id = COALESCE($2, cliente_id),
         cliente_nome = COALESCE($3, cliente_nome),
         motivo = $4,
         observacoes = $5,
         data_servico = COALESCE($6, data_servico),
         colaborador_id = COALESCE($7, colaborador_id)
       WHERE id = $8
       RETURNING *`,
      [tipo, cliente_id, cliente_nome, motivo || null, observacoes || null, data_servico, colaborador_id, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Serviço não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar serviço' });
  }
}

// DELETE /api/servicos/:id
async function remover(req, res) {
  try {
    const { rows } = await pool.query('DELETE FROM servicos WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ erro: 'Serviço não encontrado' });
    res.json({ mensagem: 'Serviço removido com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao remover serviço' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover, TIPOS_VALIDOS };
