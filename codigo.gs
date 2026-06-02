/**
 * ORGANIZADOR ENTERPRISE 4.0 - ASSESSORIA COELHO
 * Desenvolvimento Técnico: Rodrigo Mateus Silva
 *
 * MELHORIAS DESTA VERSÃO:
 * - Estrutura de pastas com ANO (Empresa / Ano / Mês)
 * - Normalização do nome da empresa (acentos, maiúsculas, espaços duplos)
 * - LockService (evita criar pastas duplicadas em envios simultâneos)
 * - Registro em planilha de log
 * - E-mail de confirmação para o cliente
 * - Alerta automático por e-mail caso ocorra erro
 * - Configurações centralizadas no bloco CONFIG (mais fácil de manter)
 */


// =====================================================================
//  CONFIGURAÇÃO  -  AJUSTE ESTES VALORES ANTES DE USAR
// =====================================================================
const CONFIG = {
  // E-mail do escritório que recebe a notificação de cada envio
  EMAIL_DESTINO: "seuemail@dominio.com",

  // ID da imagem da logo
  ID_LOGO: "COLOQUE_O_ID_DA_LOGO_AQUI",

  // ID da planilha que servirá de log/painel de envios
  // (crie uma planilha em branco e cole o ID dela aqui)
  ID_PLANILHA_LOG: "COLOQUE_O_ID_DA_PLANILHA_DE_LOG_AQUI",

  // Nome da aba dentro da planilha de log (deixe assim se não tiver preferência)
  NOME_ABA_LOG: "Registros",

  // Fuso horário usado nas datas
  FUSO_HORARIO: "America/Sao_Paulo"
};


// =====================================================================
//  FUNÇÃO PRINCIPAL (acionada pelo gatilho "ao enviar formulário")
// =====================================================================
function aoEnviarFormulario(e) {
  const lock = LockService.getScriptLock();

  try {
    // Garante que dois envios simultâneos não criem pastas duplicadas
    lock.waitLock(30000);

    const itemResponses = e.response.getItemResponses();
    const dataHora = Utilities.formatDate(new Date(), CONFIG.FUSO_HORARIO, "dd/MM/yyyy 'às' HH:mm:ss");

    let nomeEmpresa = "EMPRESA_DESCONHECIDA";
    let mesReferencia = "MES_NAO_INFORMADO";
    let anoReferencia = String(new Date().getFullYear());
    let emailCliente = "";
    let idsArquivos = [];
    let nomesArquivosOriginal = [];

    // ---- Lê todas as respostas do formulário ----
    itemResponses.forEach(response => {
      const item = response.getItem();
      const questao = item.getTitle().toUpperCase();
      const resposta = response.getResponse();

      if (questao.includes("NOME DA SUA EMPRESA")) {
        nomeEmpresa = normalizar(resposta);
      } else if (questao.includes("ANO")) {
        anoReferencia = resposta.toString().trim();
      } else if (questao.includes("MÊS") || questao.includes("MES")) {
        mesReferencia = normalizar(resposta);
      } else if (questao.includes("E-MAIL") || questao.includes("EMAIL")) {
        emailCliente = resposta.toString().trim();
      } else if (item.getType() == FormApp.ItemType.FILE_UPLOAD) {
        idsArquivos = (typeof resposta === 'string') ? [resposta] : resposta;
      }
    });

    // Se não veio arquivo, não há o que processar
    if (idsArquivos.length === 0) return;

    // ---- Cria a estrutura de pastas: Raiz / Empresa / Ano / Mês ----
    const pastaRaizDocs = DriveApp.getFileById(idsArquivos[0]).getParents().next();
    const pastaEmpresa = getOrCreateFolder(pastaRaizDocs, nomeEmpresa);
    const pastaAno = getOrCreateFolder(pastaEmpresa, anoReferencia);
    const pastaMes = getOrCreateFolder(pastaAno, mesReferencia);

    // ---- Renomeia e move cada arquivo ----
    idsArquivos.forEach(id => {
      const arquivo = DriveApp.getFileById(id);
      nomesArquivosOriginal.push(arquivo.getName());
      const novoNome = `${nomeEmpresa} - ${mesReferencia}/${anoReferencia} - ${arquivo.getName()}`;
      arquivo.setName(novoNome);
      arquivo.moveTo(pastaMes);
    });

    // ---- Gera protocolo em PDF ----
    const linkProtocolo = gerarProtocoloPDF(nomeEmpresa, mesReferencia, anoReferencia, dataHora, nomesArquivosOriginal, pastaMes);

    // ---- Notifica o escritório ----
    enviarEmailNotificacao(CONFIG.EMAIL_DESTINO, nomeEmpresa, mesReferencia, anoReferencia, dataHora, linkProtocolo);

    // ---- Confirma para o cliente (se ele informou o e-mail) ----
    if (emailCliente) {
      enviarConfirmacaoCliente(emailCliente, nomeEmpresa, mesReferencia, anoReferencia, dataHora);
    }

    // ---- Registra no painel/log ----
    registrarLog(nomeEmpresa, mesReferencia, anoReferencia, nomesArquivosOriginal.length, "OK", linkProtocolo);

  } catch (error) {
    console.error("Falha no processamento: " + error.toString());

    // Avisa você por e-mail em vez de a falha passar despercebida
    try {
      MailApp.sendEmail(
        CONFIG.EMAIL_DESTINO,
        "[ERRO] Portal de Documentos - Assessoria Coelho",
        "Houve uma falha ao processar um envio recebido no portal.\n\n" +
        "Detalhe técnico do erro:\n" + error.toString() + "\n\n" +
        "Verifique o envio manualmente no Google Drive."
      );
    } catch (e2) {
      console.error("Falha também ao enviar o alerta de erro: " + e2.toString());
    }

  } finally {
    lock.releaseLock();
  }
}


// =====================================================================
//  GERA O PROTOCOLO EM PDF
// =====================================================================
function gerarProtocoloPDF(empresa, mes, ano, data, arquivos, pastaDestino) {
  const nomeDoc = `PROTOCOLO - ${empresa} - ${mes} ${ano}.pdf`;

  // 1. Prepara a logo
  let imgDataUrl = "";
  try {
    const imagemBlob = DriveApp.getFileById(CONFIG.ID_LOGO).getBlob();
    const base64 = Utilities.base64Encode(imagemBlob.getBytes());
    imgDataUrl = `data:${imagemBlob.getContentType()};base64,${base64}`;
  } catch (e) {
    console.log("Aviso: Logo não encontrada. " + e.toString());
  }

  // 2. Monta a lista de arquivos
  let listaArquivosHtml = "";
  arquivos.forEach(nome => {
    listaArquivosHtml += `<li style="margin-bottom: 8px;">${nome}</li>`;
  });

  // 3. Tema claro corporativo (foco em legibilidade)
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
        <strong style="color: #000000;">Mês de Referência:</strong> ${mes}<br>
        <strong style="color: #000000;">Ano de Referência:</strong> ${ano}
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

  // 4. Converte para PDF e salva
  const blob = Utilities.newBlob(html, MimeType.HTML).getAs(MimeType.PDF);
  blob.setName(nomeDoc);
  const arquivoPDF = pastaDestino.createFile(blob);

  return arquivoPDF.getUrl();
}


// =====================================================================
//  E-MAIL PARA O ESCRITÓRIO
// =====================================================================
function enviarEmailNotificacao(destinatario, empresa, mes, ano, data, link) {
  const assunto = `[SISTEMA] Novo Envio: ${empresa} - ${mes}/${ano}`;
  const corpo = `Olá, Lúcio e equipe.\n\n` +
                `Um novo pacote de documentos foi recebido e organizado automaticamente.\n\n` +
                `EMPRESA: ${empresa}\n` +
                `REFERÊNCIA: ${mes}/${ano}\n` +
                `DATA: ${data}\n\n` +
                `Acesse o protocolo e os arquivos aqui: ${link}\n\n` +
                `Sistema Automatizado - Assessoria Coelho\n` +
                `Desenvolvido por: Rodrigo Mateus Silva`;

  MailApp.sendEmail(destinatario, assunto, corpo);
}


// =====================================================================
//  E-MAIL DE CONFIRMAÇÃO PARA O CLIENTE
// =====================================================================
function enviarConfirmacaoCliente(emailCliente, empresa, mes, ano, data) {
  const assunto = `Confirmação de recebimento - ${mes}/${ano}`;
  const corpo = `Olá!\n\n` +
                `Confirmamos o recebimento dos seus documentos referentes a ${mes}/${ano}.\n\n` +
                `EMPRESA: ${empresa}\n` +
                `DATA DO ENVIO: ${data}\n\n` +
                `Seus arquivos foram recebidos e organizados com sucesso. ` +
                `Caso precise de algo, é só responder a este e-mail.\n\n` +
                `Atenciosamente,\n` +
                `Assessoria Coelho`;

  GmailApp.sendEmail(emailCliente, assunto, corpo, { name: "Assessoria Coelho" });
}


// =====================================================================
//  REGISTRA O ENVIO NA PLANILHA DE LOG
// =====================================================================
function registrarLog(empresa, mes, ano, qtdArquivos, status, link) {
  // Se o ID da planilha não foi configurado, apenas avisa e não trava o sistema
  if (!CONFIG.ID_PLANILHA_LOG || CONFIG.ID_PLANILHA_LOG.indexOf("COLOQUE") !== -1) {
    console.log("Aviso: ID da planilha de log não configurado. Registro ignorado.");
    return;
  }

  try {
    const planilha = SpreadsheetApp.openById(CONFIG.ID_PLANILHA_LOG);
    let aba = planilha.getSheetByName(CONFIG.NOME_ABA_LOG);

    // Cria a aba se ela não existir
    if (!aba) {
      aba = planilha.insertSheet(CONFIG.NOME_ABA_LOG);
    }

    // Cria o cabeçalho se a planilha estiver vazia
    if (aba.getLastRow() === 0) {
      aba.appendRow(["Data/Hora", "Empresa", "Mês", "Ano", "Qtd. Arquivos", "Status", "Link do Protocolo"]);
    }

    const dataHora = Utilities.formatDate(new Date(), CONFIG.FUSO_HORARIO, "dd/MM/yyyy HH:mm:ss");
    aba.appendRow([dataHora, empresa, mes, ano, qtdArquivos, status, link]);

  } catch (e) {
    console.error("Falha ao registrar log: " + e.toString());
  }
}


// =====================================================================
//  FUNÇÕES AUXILIARES
// =====================================================================

// Cria a pasta se não existir, ou devolve a já existente
function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
}

// Padroniza o texto: maiúsculas, sem acento, sem espaços duplicados
function normalizar(texto) {
  return texto.toString()
    .trim()
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, ' ');                            // junta espaços múltiplos em um só
}
