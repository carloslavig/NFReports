const PDFDocument = require('pdfkit');

const ROTULOS_TIPO = {
  instalacao: 'Instalação',
  manutencao: 'Manutenção',
  retencao: 'Retenção',
  retirada: 'Retirada de Equipamentos',
  posvenda: 'Pós-venda',
};

function formatarData(data) {
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR');
}

// Gera um PDF a partir de uma lista de serviços (relatório diário/semanal/período)
function gerarPdfServicos(res, { titulo, subtitulo, servicos }) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${titulo.replace(/\s+/g, '_')}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text(titulo, { align: 'left' });
  if (subtitulo) {
    doc.fontSize(11).fillColor('#555').text(subtitulo);
  }
  doc.moveDown(1);
  doc.fillColor('#000');

  servicos.forEach((s) => {
    doc.fontSize(11).font('Helvetica-Bold').text(formatarData(s.data_servico));
    doc.font('Helvetica').fontSize(10);
    doc.text(`Cliente: ${s.cliente_id} - ${s.cliente_nome}`);
    doc.text(`Serviço: ${ROTULOS_TIPO[s.tipo] || s.tipo}`);
    if (s.motivo) doc.text(`Motivo: ${s.motivo}`);
    if (s.observacoes) doc.text(`Observações: ${s.observacoes}`);
    doc.text(`Responsável: ${s.colaborador_nome}`);
    doc.moveDown(0.7);
  });

  if (servicos.length === 0) {
    doc.fontSize(11).fillColor('#888').text('Nenhum serviço encontrado para o período selecionado.');
  }

  doc.end();
}

// Gera um PDF consolidado por colaborador (relatório semanal/mensal)
function gerarPdfConsolidado(res, { titulo, subtitulo, consolidado, ranking }) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${titulo.replace(/\s+/g, '_')}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text(titulo);
  if (subtitulo) doc.fontSize(11).fillColor('#555').text(subtitulo);
  doc.moveDown(1).fillColor('#000');

  consolidado.forEach((c) => {
    doc.fontSize(13).font('Helvetica-Bold').text(c.colaborador_nome);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Instalações: ${c.instalacao}`);
    doc.text(`Manutenções: ${c.manutencao}`);
    doc.text(`Retenções: ${c.retencao}`);
    doc.text(`Retiradas: ${c.retirada}`);
    doc.text(`Pós-vendas: ${c.posvenda}`);
    doc.font('Helvetica-Bold').text(`Total: ${c.total} serviços`);
    doc.moveDown(0.7);
  });

  if (ranking && ranking.length) {
    doc.moveDown(0.5);
    doc.fontSize(13).font('Helvetica-Bold').text('Ranking de Produtividade');
    doc.font('Helvetica').fontSize(10);
    ranking.forEach((r, i) => {
      doc.text(`${i + 1}. ${r.nome} - ${r.total} serviços (${r.percentual}%)`);
    });
  }

  doc.end();
}

module.exports = { gerarPdfServicos, gerarPdfConsolidado, ROTULOS_TIPO };
