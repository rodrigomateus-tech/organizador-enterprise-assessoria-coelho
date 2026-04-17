Codigo do Google script para funcionamento do formularios, planilha e envio protocolo automatico como comprovante:
/**
 * ORGANIZADOR ENTERPRISE 3.2 - ASSESSORIA COELHO
 * Desenvolvimento Técnico: Rodrigo Mateus Silva
 * Modo: High Contrast / Enterprise Light (Alto Contraste)
 */

function aoEnviarFormulario(e) {
  try {
    const itemResponses = e.response.getItemResponses();
    const dataHora = new Date().toLocaleString('pt-BR');
    const emailDestino = "xxxxxxxxxxx@bol.com.br";
    
    let nomeEmpresa = "EMPRESA_DESCONHECIDA";
    let mesReferencia = "MES_NAO_INFORMADO";
    let idsArquivos = [];
    let nomesArquivosOriginal = [];

    itemResponses.forEach(response => {
      const questao = response.getItem().getTitle().toUpperCase();
      const resposta = response.getResponse();

      if (questao.includes("NOME DA SUA EMPRESA")) {
        nomeEmpresa = resposta.toString().trim().toUpperCase();
      } else if (questao.includes("MÊS")) {
        mesReferencia = resposta.toString().trim().toUpperCase();
      } else if (response.getItem().getType() == FormApp.ItemType.FILE_UPLOAD) {
        idsArquivos = typeof resposta === 'string' ? [resposta] : resposta;
      }
    });

    if (idsArquivos.length === 0) return;

    const pastaRaizDocs = DriveApp.getFileById(idsArquivos[0]).getParents().next();
    const pastaEmpresa = getOrCreateFolder(pastaRaizDocs, nomeEmpresa);
    const pastaMes = getOrCreateFolder(pastaEmpresa, mesReferencia);

    idsArquivos.forEach(id => {
      const arquivo = DriveApp.getFileById(id);
      nomesArquivosOriginal.push(arquivo.getName());
      const novoNome = `${nomeEmpresa} - ${mesReferencia} - ${arquivo.getName()}`;
      arquivo.setName(novoNome);
      arquivo.moveTo(pastaMes);
    });

    const linkProtocolo = gerarProtocoloPDF(nomeEmpresa, mesReferencia, dataHora, nomesArquivosOriginal, pastaMes);
    enviarEmailNotificacao(emailDestino, nomeEmpresa, mesReferencia, dataHora, linkProtocolo);

  } catch (error) {
    console.error("Falha no processamento: " + error.toString());
  }
}

function gerarProtocoloPDF(empresa, mes, data, arquivos, pastaDestino) {
  const nomeDoc = `PROTOCOLO - ${empresa} - ${mes}.pdf`;

  // 1. PREPARA A LOGO
  const idLogo = "1KwYanSCv76VgMmadNrBLDcOXHuwnmBUX"; 
  let imgDataUrl = "";
  try {
    const imagemBlob = DriveApp.getFileById(idLogo).getBlob();
    const base64 = Utilities.base64Encode(imagemBlob.getBytes());
    imgDataUrl = `data:${imagemBlob.getContentType()};base64,${base64}`;
  } catch(e) {
    console.log("Aviso: Logo não encontrada.");
  }

  // 2. MONTA A LISTA DE ARQUIVOS
  let listaArquivosHtml = "";
  arquivos.forEach(nome => {
    listaArquivosHtml += `<li style="margin-bottom: 8px;">${nome}</li>`;
  });

  // 3. TEMA CLARO CORPORATIVO (Foco total em legibilidade)
  const html = `
    <div style="background-color: #ffffff; color: #000000; font-family: Arial, sans-serif; padding: 40px; min-height: 1000px;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${imgDataUrl}" style="max-width: 550px; height: auto;" />
      </div>

      <h2 style="color: #000000; text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 10px; margin-bottom: 30px; text-transform: uppercase;">
        Protocolo Digital de Recebimento
      </h2>

      <h3 style="color: #000000; margin-bottom: 15px;">Detalhes da Entrega:</h3>
      
      <div style="background-color: #f5f5f5; border-left: 4px solid #d4af37; padding: 15px; margin-bottom: 30px; font-size: 14px; line-height: 1.8;">
        <strong style="color: #000000;">Data/Hora do Envio:</strong> ${data}<br>
        <strong style="color: #000000;">Empresa Cliente:</strong> ${empresa}<br>
        <strong style="color: #000000;">Mês de Referência:</strong> ${mes}
      </div>

      <h3 style="color: #000000; margin-bottom: 15px;">Documentos Anexados:</h3>
      
      <ul style="background-color: #f5f5f5; border: 1px solid #e0e0e0; padding: 20px 40px; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000000;">
        ${listaArquivosHtml}
      </ul>

      <hr style="border: 0; border-top: 1px solid #cccccc; margin-top: 60px; margin-bottom: 20px;">

      <div style="text-align: center;">
        <p style="color: #555555; font-style: italic; font-size: 11px; margin-bottom: 5px;">
          Este é um protocolo gerado automaticamente e serve como comprovante de entrega para a Assessoria Coelho.
        </p>
        <p style="color: #000000; font-weight: bold; font-size: 10px;">
          Desenvolvido por: Rodrigo Mateus Silva 
        </p>
      </div>

    </div>
  `;

  // 4. CONVERTE PARA PDF E SALVA
  const blob = Utilities.newBlob(html, MimeType.HTML).getAs(MimeType.PDF);
  blob.setName(nomeDoc);
  const arquivoPDF = pastaDestino.createFile(blob);
  
  return arquivoPDF.getUrl();
}

function enviarEmailNotificacao(destinatario, empresa, mes, data, link) {
  const assunto = `[SISTEMA] Novo Envio: ${empresa} - ${mes}`;
  const corpo = `Olá, Lúcio e equipe.\n\n` +
                `Um novo pacote de documentos foi recebido e organizado automaticamente.\n\n` +
                `EMPRESA: ${empresa}\n` +
                `REFERÊNCIA: ${mes}\n` +
                `DATA: ${data}\n\n` +
                `Acesse o protocolo e os arquivos aqui: ${link}\n\n` +
                `Sistema Automatizado - Assessoria Coelho\n` +
                `Desenvolvido por: Rodrigo Mateus Silva `;

  MailApp.sendEmail(destinatario, assunto, corpo);
}

function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
}
