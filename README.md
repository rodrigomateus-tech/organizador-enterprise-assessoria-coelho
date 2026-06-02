<div style="display: inline-block;">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript Badge" />
  <img src="https://img.shields.io/badge/Google_Apps_Script-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Apps Script Badge" />
  <img src="https://img.shields.io/badge/Google_Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white" alt="Google Drive Badge" />
  <img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Gmail Badge" />
</div>

# Organizador Enterprise 4.0 - Assessoria Coelho
Sistema de automação para recebimento, organização e 
protocolização de documentos contábeis de clientes, 
desenvolvido e implantado em ambiente de produção real.

A versão 4.0 adiciona organização por ano, confirmação 
automática de recebimento ao cliente, painel de envios em 
planilha de log e alertas de erro por e-mail ao administrador.

## Problema resolvido
A Assessoria Coelho recebia documentos contábeis de 
múltiplos clientes de forma desorganizada - por e-mail, 
WhatsApp e outros canais - sem padronização de nomenclatura, 
sem confirmação de recebimento e sem rastreabilidade.
O sistema eliminou esse processo manual, automatizando 
100% do fluxo desde o recebimento até a confirmação.

## Como funciona
```
Cliente preenche o formulário
        ↓
Trigger dispara automaticamente (onFormSubmit)
        ↓
Script identifica empresa, mês e ano de referência
        ↓
Cria estrutura de pastas: /EMPRESA/ANO/MÊS/
        ↓
Renomeia arquivos: EMPRESA - MÊS/ANO - nome_original
        ↓
Gera PDF de protocolo com logo e lista de documentos
        ↓
Envia e-mail automático para a equipe com link para o protocolo
        ↓
Confirma o recebimento ao cliente + registra o envio na planilha de log
```

## Funcionalidades
- Formulário com identidade visual corporativa e 
  instruções detalhadas para o cliente
- Planilha-modelo padronizada (preto e dourado da marca) 
  para o cliente preencher as contas pagas
- Organização automática em hierarquia de pastas 
  por empresa, ano e mês de referência
- Renomeação padronizada de arquivos em lote
- Geração de protocolo em PDF com: logo da empresa, 
  data/hora, nome do cliente, mês/ano e lista de documentos
- Notificação por e-mail automática para a equipe 
  com link direto para os arquivos e protocolo
- Confirmação automática de recebimento enviada ao cliente
- Registro de cada envio em planilha de log (painel de acompanhamento)
- Proteção contra pastas duplicadas em envios simultâneos (LockService)
- Normalização do nome da empresa (acentos, maiúsculas e espaços)
- Tratamento de erros com alerta automático por e-mail ao administrador

## Tecnologias
- Google Apps Script (JavaScript)
- Google Forms (coleta de dados e upload)
- Google Drive API (organização de pastas e arquivos)
- Google Sheets API (planilha de log / painel de envios)
- Gmail API (envio de notificações e confirmações)
- HTML/CSS (template do protocolo PDF)
- Utilities.newBlob (conversão HTML → PDF)
- LockService (controle de concorrência)

## Resultado em produção
- Implantado na Assessoria Coelho em abril de 2026
- 5 execuções concluídas com sucesso nos primeiros dias
- Tempo médio de execução: ~8 segundos por envio
- Eliminou processo manual de triagem e organização 
  de documentos de clientes

## Screenshots
### Formulário do cliente
![Formulário](screenshots/formulario.png)
### E-mail automático gerado
![Email](screenshots/email.png)
### Protocolo PDF gerado
![Protocolo](screenshots/protocolo.png)
### Estrutura de pastas no Drive
![Drive](screenshots/drive-pastas.png)
### Log de execuções no Apps Script
![Execuções](screenshots/execucoes.png)

## Como replicar
1. Crie um Google Form com os campos:
   - Nome da Empresa (texto)
   - Mês de Referência (lista)
   - Ano de Referência (lista)
   - Anexar Documentos (upload de arquivo)
2. Abra o Apps Script vinculado ao formulário
   (Extensões → Apps Script)
3. Cole o código de `codigo.gs`
4. No bloco `CONFIG`, substitua os três placeholders pelos seus dados reais:
   - `EMAIL_DESTINO` — e-mail que recebe as notificações
   - `ID_LOGO` — ID do arquivo de logo no Google Drive
   - `ID_PLANILHA_LOG` — ID da planilha de log (opcional)
5. Crie uma planilha em branco e cole o ID dela em 
   `ID_PLANILHA_LOG` para ativar o painel de envios
   (opcional - sem isso o sistema funciona, apenas não registra o log)
6. Configure o trigger:
   - Acionadores → Adicionar acionador
   - Função: `aoEnviarFormulario`
   - Evento: "Ao enviar formulário"
7. Autorize as permissões necessárias e implante

## Autor
Desenvolvido por Rodrigo Mateus Silva  
[linkedin.com/in/rodrigo-mateus-ti](https://linkedin.com/in/rodrigo-mateus-ti)
