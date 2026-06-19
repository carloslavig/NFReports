const ExcelJS = require('exceljs');

const ROTULOS_TIPO = {
  instalacao: 'Instalação',
  manutencao: 'Manutenção',
  retencao: 'Retenção',
  retirada: 'Retirada de Equipamentos',
  posvenda: 'Pós-venda',
};

// Gera um Excel a partir de uma lista de serviços (relatório diário/período)
async function gerarExcelServicos(res, { titulo, servicos }) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Serviços');

  sheet.columns = [
    { header: 'Data', key: 'data_servico', width: 14 },
    { header: 'ID Cliente', key: 'cliente_id', width: 14 },
    { header: 'Nome do Cliente', key: 'cliente_nome', width: 28 },
    { header: 'Tipo de Serviço', key: 'tipo', width: 22 },
    { header: 'Motivo / Observações', key: 'motivo', width: 32 },
    { header: 'Responsável', key: 'colaborador_nome', width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  servicos.forEach((s) => {
    sheet.addRow({
      data_servico: new Date(s.data_servico).toLocaleDateString('pt-BR'),
      cliente_id: s.cliente_id,
      cliente_nome: s.cliente_nome,
      tipo: ROTULOS_TIPO[s.tipo] || s.tipo,
      motivo: s.motivo || s.observacoes || '',
      colaborador_nome: s.colaborador_nome,
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${titulo.replace(/\s+/g, '_')}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

// Gera um Excel consolidado por colaborador (relatório semanal/mensal)
async function gerarExcelConsolidado(res, { titulo, consolidado }) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Consolidado');

  sheet.columns = [
    { header: 'Colaborador', key: 'colaborador_nome', width: 22 },
    { header: 'Instalações', key: 'instalacao', width: 14 },
    { header: 'Manutenções', key: 'manutencao', width: 14 },
    { header: 'Retenções', key: 'retencao', width: 14 },
    { header: 'Retiradas', key: 'retirada', width: 14 },
    { header: 'Pós-vendas', key: 'posvenda', width: 14 },
    { header: 'Total', key: 'total', width: 12 },
  ];
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };

  consolidado.forEach((c) => sheet.addRow(c));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${titulo.replace(/\s+/g, '_')}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { gerarExcelServicos, gerarExcelConsolidado };
