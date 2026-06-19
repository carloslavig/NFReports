const pool = require('../db/pool');
const { gerarPdfServicos, gerarPdfConsolidado } = require('../utils/pdfExport');
const { gerarExcelServicos, gerarExcelConsolidado } = require('../utils/excelExport');

const TIPOS = ['instalacao', 'manutencao', 'retencao', 'retirada', 'posvenda'];

function montarFiltro({ colaborador_id, tipo, data_inicio, data_fim }) {
  const condicoes = [];
  const params = [];

  if (colaborador_id) { params.push(colaborador_id); condicoes.push(`s.colaborador_id = $${params.length}`); }
  if (tipo) { params.push(tipo); condicoes.push(`s.tipo = $${params.length}`); }
  if (data_inicio) { params.push(data_inicio); condicoes.push(`s.data_servico >= $${params.length}`); }
  if (data_fim) { params.push(data_fim); condicoes.push(`s.data_servico <= $${params.length}`); }

  return { where: condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '', params };
}

async function buscarServicos(filtros) {
  const { where, params } = montarFiltro(filtros);
  const { rows } = await pool.query(
    `SELECT s.*, c.nome AS colaborador_nome
     FROM servicos s JOIN colaboradores c ON c.id = s.colaborador_id
     ${where}
     ORDER BY s.data_servico ASC, s.id ASC`,
    params
  );
  return rows;
}

async function buscarConsolidadoPorColaborador(filtros) {
  const { where, params } = montarFiltro(filtros);
  const { rows } = await pool.query(
    `SELECT c.id AS colaborador_id, c.nome AS colaborador_nome,
            COUNT(*) FILTER (WHERE s.tipo = 'instalacao') AS instalacao,
            COUNT(*) FILTER (WHERE s.tipo = 'manutencao') AS manutencao,
            COUNT(*) FILTER (WHERE s.tipo = 'retencao') AS retencao,
            COUNT(*) FILTER (WHERE s.tipo = 'retirada') AS retirada,
            COUNT(*) FILTER (WHERE s.tipo = 'posvenda') AS posvenda,
            COUNT(*) AS total
     FROM servicos s JOIN colaboradores c ON c.id = s.colaborador_id
     ${where}
     GROUP BY c.id, c.nome
     ORDER BY total DESC`,
    params
  );
  return rows.map((r) => ({
    colaborador_id: r.colaborador_id,
    colaborador_nome: r.colaborador_nome,
    instalacao: parseInt(r.instalacao, 10),
    manutencao: parseInt(r.manutencao, 10),
    retencao: parseInt(r.retencao, 10),
    retirada: parseInt(r.retirada, 10),
    posvenda: parseInt(r.posvenda, 10),
    total: parseInt(r.total, 10),
  }));
}

async function buscarRanking(filtros) {
  const consolidado = await buscarConsolidadoPorColaborador(filtros);
  const totalGeral = consolidado.reduce((acc, c) => acc + c.total, 0);
  return consolidado.map((c) => ({
    nome: c.colaborador_nome,
    total: c.total,
    percentual: totalGeral > 0 ? Math.round((c.total / totalGeral) * 1000) / 10 : 0,
  }));
}

// GET /api/relatorios/diario?data=YYYY-MM-DD
async function diario(req, res) {
  try {
    const data = req.query.data || new Date().toISOString().slice(0, 10);
    const servicos = await buscarServicos({ data_inicio: data, data_fim: data, ...req.query });
    res.json({ data, total: servicos.length, servicos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar relatório diário' });
  }
}

// GET /api/relatorios/semanal?data_inicio=&data_fim=
async function semanal(req, res) {
  try {
    const consolidado = await buscarConsolidadoPorColaborador(req.query);
    const totalGeral = consolidado.reduce((acc, c) => acc + c.total, 0);
    res.json({ total_geral: totalGeral, consolidado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar relatório semanal' });
  }
}

// GET /api/relatorios/mensal?mes=&ano=
async function mensal(req, res) {
  try {
    const hoje = new Date();
    const ano = parseInt(req.query.ano, 10) || hoje.getFullYear();
    const mes = parseInt(req.query.mes, 10) || hoje.getMonth() + 1;
    const data_inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const dataFimObj = new Date(ano, mes, 0); // último dia do mês
    const data_fim = dataFimObj.toISOString().slice(0, 10);

    const filtros = { ...req.query, data_inicio, data_fim };
    const consolidado = await buscarConsolidadoPorColaborador(filtros);
    const ranking = await buscarRanking(filtros);
    const totalGeral = consolidado.reduce((acc, c) => acc + c.total, 0);

    const totalPorTipo = TIPOS.reduce((acc, tipo) => {
      acc[tipo] = consolidado.reduce((soma, c) => soma + c[tipo], 0);
      return acc;
    }, {});

    res.json({ ano, mes, total_geral: totalGeral, total_por_tipo: totalPorTipo, consolidado, ranking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar relatório mensal' });
  }
}

// GET /api/relatorios/exportar/pdf?formato=diario|semanal|mensal&...filtros
async function exportarPdf(req, res) {
  try {
    const formato = req.query.formato || 'diario';

    if (formato === 'diario') {
      const data = req.query.data || new Date().toISOString().slice(0, 10);
      const servicos = await buscarServicos({ ...req.query, data_inicio: data, data_fim: data });
      return gerarPdfServicos(res, {
        titulo: `Relatorio_Diario_${data}`,
        subtitulo: `Atendimentos do dia ${new Date(data).toLocaleDateString('pt-BR')}`,
        servicos,
      });
    }

    // semanal ou mensal -> consolidado
    const consolidado = await buscarConsolidadoPorColaborador(req.query);
    const ranking = await buscarRanking(req.query);
    return gerarPdfConsolidado(res, {
      titulo: formato === 'mensal' ? 'Relatorio_Mensal' : 'Relatorio_Semanal',
      subtitulo: `Período: ${req.query.data_inicio || '-'} a ${req.query.data_fim || '-'}`,
      consolidado,
      ranking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao exportar PDF' });
  }
}

// GET /api/relatorios/exportar/excel?formato=diario|semanal|mensal&...filtros
async function exportarExcel(req, res) {
  try {
    const formato = req.query.formato || 'diario';

    if (formato === 'diario') {
      const data = req.query.data || new Date().toISOString().slice(0, 10);
      const servicos = await buscarServicos({ ...req.query, data_inicio: data, data_fim: data });
      return gerarExcelServicos(res, { titulo: `Relatorio_Diario_${data}`, servicos });
    }

    const consolidado = await buscarConsolidadoPorColaborador(req.query);
    return gerarExcelConsolidado(res, {
      titulo: formato === 'mensal' ? 'Relatorio_Mensal' : 'Relatorio_Semanal',
      consolidado,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao exportar Excel' });
  }
}

module.exports = { diario, semanal, mensal, exportarPdf, exportarExcel };
