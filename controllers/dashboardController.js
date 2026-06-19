const pool = require('../db/pool');

// GET /api/dashboard/resumo
// Totais de hoje, semana, mês e por categoria
async function resumo(req, res) {
  try {
    const totalHoje = await pool.query(
      `SELECT COUNT(*) FROM servicos WHERE data_servico = CURRENT_DATE`
    );
    const totalSemana = await pool.query(
      `SELECT COUNT(*) FROM servicos WHERE data_servico >= date_trunc('week', CURRENT_DATE)`
    );
    const totalMes = await pool.query(
      `SELECT COUNT(*) FROM servicos WHERE data_servico >= date_trunc('month', CURRENT_DATE)`
    );
    const porTipo = await pool.query(
      `SELECT tipo, COUNT(*) AS total FROM servicos GROUP BY tipo`
    );

    const totaisPorTipo = { instalacao: 0, manutencao: 0, retencao: 0, retirada: 0, posvenda: 0 };
    porTipo.rows.forEach((r) => { totaisPorTipo[r.tipo] = parseInt(r.total, 10); });

    res.json({
      total_hoje: parseInt(totalHoje.rows[0].count, 10),
      total_semana: parseInt(totalSemana.rows[0].count, 10),
      total_mes: parseInt(totalMes.rows[0].count, 10),
      total_instalacoes: totaisPorTipo.instalacao,
      total_manutencoes: totaisPorTipo.manutencao,
      total_retencoes: totaisPorTipo.retencao,
      total_retiradas: totaisPorTipo.retirada,
      total_posvendas: totaisPorTipo.posvenda,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar resumo do dashboard' });
  }
}

// GET /api/dashboard/produtividade  (ranking de colaboradores)
async function produtividade(req, res) {
  try {
    const { data_inicio, data_fim } = req.query;
    const condicoes = [];
    const params = [];

    if (data_inicio) {
      params.push(data_inicio);
      condicoes.push(`s.data_servico >= $${params.length}`);
    }
    if (data_fim) {
      params.push(data_fim);
      condicoes.push(`s.data_servico <= $${params.length}`);
    }
    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT c.id, c.nome, COUNT(s.id) AS total
       FROM colaboradores c
       LEFT JOIN servicos s ON s.colaborador_id = c.id ${where ? 'AND ' + condicoes.join(' AND ') : ''}
       GROUP BY c.id, c.nome
       ORDER BY total DESC`,
      params
    );

    const totalGeral = rows.reduce((acc, r) => acc + parseInt(r.total, 10), 0);
    const ranking = rows.map((r) => ({
      colaborador_id: r.id,
      nome: r.nome,
      total: parseInt(r.total, 10),
      percentual: totalGeral > 0 ? Math.round((parseInt(r.total, 10) / totalGeral) * 1000) / 10 : 0,
    }));

    res.json(ranking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar ranking de produtividade' });
  }
}

// GET /api/dashboard/distribuicao  (gráfico de pizza/rosca por categoria)
async function distribuicao(req, res) {
  try {
    const { rows } = await pool.query(`SELECT tipo, COUNT(*) AS total FROM servicos GROUP BY tipo`);
    res.json(rows.map((r) => ({ tipo: r.tipo, total: parseInt(r.total, 10) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar distribuição por categoria' });
  }
}

// GET /api/dashboard/evolucao?periodo=diario|semanal|mensal
async function evolucao(req, res) {
  try {
    const periodo = req.query.periodo || 'diario';
    let truncamento = 'day';
    if (periodo === 'semanal') truncamento = 'week';
    if (periodo === 'mensal') truncamento = 'month';

    const { rows } = await pool.query(
      `SELECT date_trunc('${truncamento}', data_servico) AS periodo, COUNT(*) AS total
       FROM servicos
       WHERE data_servico >= CURRENT_DATE - INTERVAL '90 days'
       GROUP BY periodo
       ORDER BY periodo ASC`
    );

    res.json(rows.map((r) => ({ periodo: r.periodo, total: parseInt(r.total, 10) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar gráfico de evolução' });
  }
}

module.exports = { resumo, produtividade, distribuicao, evolucao };
