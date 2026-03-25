const fileInput = document.getElementById("csv-file");
const fileNameDisplay = document.getElementById("file-name");
const content = document.querySelector(".tabela-body");
const container = document.querySelector(".bloco-container");
const btnSave = document.querySelector(".btn-save");
const btnUpdate = document.querySelector(".btn-update");
const btnEditarVistas = document.getElementById("btn-editar-vistas");
const btnLimpar = document.getElementById("btn-limpar-tabela");

fileInput.addEventListener("change", function (e) {
  if (this.files && this.files.length > 0) {
    fileNameDisplay.textContent = this.files[0].name;
  } else {
    fileNameDisplay.textContent = "Nenhum arquivo selecionado";
  }

  const arquivo = e.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = function (e) {
    const texto = e.target.result;
    const json = csvToJson(texto);

    const dadosJson = json;

    let linhasHtml = "";

    dadosJson.forEach((item) => {
      let localOriginal = (item.Espaco || item.Local || "").trim();
      let numeroBloco = "";

      const blocos = {
        10: [
          "Laboratório de Informática 15",
          "Laboratório de Informática 16",
          "Laboratório de Informática 17",
          "Laboratório de Informática 18",
          "Laboratório de Informática 19",
          "Laboratório de Informática 20",
          "Laboratório de Informática 21",
          "Laboratório de Informática 22",
          "Laboratório de Desenho V",
          "Laboratório de Desenho IV",
          "Laboratório de Desenho I e II",
          "Auditório Carlos Alexandre",
          "(Bloco 10)",
        ],
        8: [
          "Laboratório de Informática 23",
          "Laboratório de Informática 24",
          "Laboratório de Informática 25",
          "(Bloco 8)",
        ],
        7: [
          "Cozinha Fria",
          "Sala Invertida",
          "Sala Apollo 11",
          "Sala Chuva de Meteoros",
          "Sala Nicolau Copérnico",
          "Sala Via Láctea",
          "Laboratório de Informática 7",
          "Laboratório de Informática 8",
          "Laboratório de Informática 9",
          "Laboratório de Informática 10",
          "Laboratório de Informática 11",
          "Laboratório de Informática 12",
          "Laboratório de Informática 13",
          "Laboratório de Informática 14",
          "Auditório Dorival Moreschi",
          "Auditório Dona Etelvina",
          "Sala Stephen Hawking",
          "(Bloco 7)",
        ],
        6: [
          "Tutoria",
          "Auditório Professor Joaquim Lauer",
          "Auditório de Medicina",
          "Auditório de Odontologia",
          "(Bloco 6)",
        ],
      };

      for (const [numero, salas] of Object.entries(blocos)) {
        if (salas.some((sala) => localOriginal.includes(sala))) {
          numeroBloco = numero;
          break;
        }
      }

      let localLimpo = localOriginal.replace(/\s*\(.*?\)\s*/g, " ").trim();

      if (localLimpo.includes("Laboratório de Desenho V")) {
        localLimpo = "Sala 5";
      } else if (localLimpo.includes("Laboratório de Desenho IV")) {
        localLimpo = "Sala 4";
      } else if (localLimpo.includes("Laboratório de Desenho I e II")) {
        localLimpo = "Sala 1/2";
      }

      linhasHtml += `
        <tr>
          <td>${item.Data}</td>
          <td style="text-align: center; font-weight: bold;">${numeroBloco}</td> 
          <td>${item.HorarioInicial} - ${item.HorarioFinal}</td>
          <td>${localLimpo}</td> 
          <td><input class="searchInput" type="text" placeholder="Observação"/></td>
          <td><input class="searchInput" type="text" placeholder="Insumos"/></td>
          <td><button class="btn-delete" title="Excluir">Excluir</button></td>
        </tr>
      `;
    });

    content.innerHTML = linhasHtml;
  };
  leitor.readAsText(arquivo);
});

container.addEventListener("click", function (event) {
  const btnDelete = event.target.closest(".btn-delete");

  if (btnDelete) {
    const linha = btnDelete.closest("tr");
    if (confirm("Deseja excluir?")) {
      linha.remove();
    }
  }
});

btnSave.addEventListener("click", function () {
  const dadosParaSalvar = [];
  const linhas = document.querySelectorAll(".tabela-body tr");

  const pegarValor = (celula) => {
    const input = celula.querySelector("input");
    return input ? input.value : celula.innerText.trim();
  };

  linhas.forEach((linha) => {
    const colunas = linha.querySelectorAll("td");
    if (colunas.length >= 6) {
      const reserva = {
        data: pegarValor(colunas[0]),
        bloco: pegarValor(colunas[1]),
        horario: pegarValor(colunas[2]),
        local: pegarValor(colunas[3]),
        observacao: pegarValor(colunas[4]),
        insumos: pegarValor(colunas[5]),
      };
      if (reserva.data || reserva.local) {
        dadosParaSalvar.push(reserva);
      }
    }
  });

  if (dadosParaSalvar.length === 0) {
    alert("⚠️ Nenhuma reserva encontrada para salvar.");
    return;
  }

  if (typeof window.salvarNoFirebase === "function") {
    // Chamamos a função do Firebase
    window.salvarNoFirebase(dadosParaSalvar).then(() => {
      // --- AS LINHAS QUE VOCÊ PRECISA ADICIONAR ESTÃO AQUI ---
      content.innerHTML = ""; // Limpa as linhas da tabela no HTML
      fileInput.value = ""; // Reseta o campo de upload de arquivo
      fileNameDisplay.textContent = "Nenhum arquivo selecionado"; // Reseta o texto
      console.log("Tabela limpa após salvamento.");
      // -------------------------------------------------------
    });
  } else {
    alert("❌ Erro crítico: Função do Firebase não carregada.");
  }
});

// Função única para capturar e formatar os valores da tabela
function capturarDadosDaTabela() {
  const dadosParaSalvar = [];
  const linhas = document.querySelectorAll(".tabela-body tr");

  const pegarValorFormatado = (celula) => {
    const input = celula.querySelector("input");
    if (!input) return celula.innerText.trim();

    let valor = input.value;

    // SE FOR INPUT DE DATA: Inverte de AAAA-MM-DD para DD/MM/AAAA
    if (input.type === "date" && valor.includes("-")) {
      const partes = valor.split("-");
      if (partes[0].length === 4) {
        // Se o primeiro bloco for o ano
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }
    return valor;
  };

  linhas.forEach((linha) => {
    const colunas = linha.querySelectorAll("td");
    if (colunas.length >= 6) {
      const reserva = {
        data: pegarValorFormatado(colunas[0]),
        bloco: pegarValorFormatado(colunas[1]),
        horario: pegarValorFormatado(colunas[2]),
        local: pegarValorFormatado(colunas[3]),
        observacao: pegarValorFormatado(colunas[4]),
        insumos: pegarValorFormatado(colunas[5]),
      };

      if (reserva.data || reserva.local) {
        dadosParaSalvar.push(reserva);
      }
    }
  });
  return dadosParaSalvar;
}

btnUpdate.addEventListener("click", function () {
  const dados = capturarDadosDaTabela();

  if (dados.length === 0) {
    alert("⚠️ Nenhuma reserva para adicionar.");
    return;
  }

  if (typeof window.atualizarNoFirebase === "function") {
    window.atualizarNoFirebase(dados).then(() => {
      // Limpa após atualizar
      content.innerHTML = "";
      fileInput.value = "";
      fileNameDisplay.textContent = "Nenhum arquivo selecionado";
    });
  } else {
    alert("❌ Erro: Função de atualização não encontrada.");
  }
});

btnLimpar.addEventListener("click", function () {
  // 1. Pedir confirmação ao usuário
  const confirmar = confirm(
    "Tem certeza que deseja limpar toda a tabela? Os dados não salvos serão perdidos.",
  );

  if (confirmar) {
    // 2. Limpar o corpo da tabela
    const content = document.querySelector(".tabela-body");
    if (content) {
      content.innerHTML = "";
    }

    // 3. Resetar o campo de arquivo (upload)
    const fileInput = document.getElementById("csv-file");
    const fileNameDisplay = document.getElementById("file-name");

    if (fileInput) fileInput.value = "";
    if (fileNameDisplay)
      fileNameDisplay.textContent = "Nenhum arquivo selecionado";

    console.log("Tabela esvaziada pelo usuário.");
  }
});

function filtrarTabela(criterio) {
  const linhas = document.querySelectorAll(".tabela-body tr");

  linhas.forEach((linha) => {
    const colunas = linha.querySelectorAll("td");
    if (colunas.length < 4) return;

    const valorBloco = colunas[1].innerText.trim();
    // Pegamos o texto do Local ou o valor do input caso seja uma linha nova
    const inputLocal = colunas[3].querySelector("input");
    const valorLocal = inputLocal
      ? inputLocal.value.toLowerCase()
      : colunas[3].innerText.toLowerCase();

    if (criterio === "todos") {
      linha.style.display = "";
    }
    // Novo filtro: Verifica se a palavra 'auditorio' existe no texto do local
    else if (criterio === "auditorio") {
      if (
        valorLocal.includes("auditorio") ||
        valorLocal.includes("auditório")
      ) {
        linha.style.display = "";
      } else {
        linha.style.display = "none";
      }
    }
    // Filtro por número do bloco
    else if (valorBloco === criterio) {
      linha.style.display = "";
    } else {
      linha.style.display = "none";
    }
  });
}

function csvToJson(csv) {
  const linhas = csv
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");

  const camposParaRemover = [
    "IDdaReserva",
    "Email",
    "Situacao",
    "Check-in",
    "Nome",
    "TipodeUsuario",
  ];

  const cabecalhos = linhas[0].split(";").map((c) => c.trim());
  const cabecalhosLimpos = cabecalhos.map((header) => {
    return header
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
  });

  return linhas.slice(1).map((linha) => {
    const valores = linha.split(";");
    const objeto = {};

    cabecalhosLimpos.forEach((chave, i) => {
      if (!camposParaRemover.includes(chave)) {
        objeto[chave] = valores[i] ? valores[i].trim() : "";
      }
    });

    objeto["Observacao"] = "";
    objeto["Insumos"] = "";
    console.log(objeto);

    return objeto;
  });
}

const btnAdicionar = document.getElementById("btn-adicionar");

btnAdicionar.addEventListener("click", () => {
  const novaLinha = document.createElement("tr");

  novaLinha.innerHTML = `
    <td><input type="date" class="searchInput"></td>
    <td><input type="text" placeholder="Bloco" class="searchInput"></td>
    <td><input type="text" placeholder="00:00 - 00:00" class="searchInput"></td>
    <td><input type="text" placeholder="Local" class="searchInput"></td>
    <td><input type="text" placeholder="Observação" class="searchInput"></td>
    <td><input type="text" placeholder="Insumos" class="searchInput"></td>
    <td><button class="btn-delete" title="Excluir">Excluir</button></td>
  `;

  // Adiciona a nova linha no topo da tabela
  content.prepend(novaLinha);
});

btnEditarVistas.addEventListener("click", async () => {
  const dados = await window.buscarReservasFirebase();
  if (dados && dados.length > 0) {
    renderizarModoEdicao(dados);
  }
});

function renderizarModoEdicao(dados) {
  // 1. Esconder elementos que não pertencem à edição
  const uploadContainer = document.querySelector(".upload-container");
  const buttonGroup = document.querySelector(".button-group");
  const h1Principal = document.querySelector("h1"); // O "TODAS RESERVAS"

  if (uploadContainer) uploadContainer.style.display = "none";
  if (buttonGroup) buttonGroup.style.display = "none";
  if (h1Principal) h1Principal.style.display = "none";

  // 2. Preparar o container principal
  const containerBlocos = document.querySelector(".bloco-container");

  // Filtro de blocos (sua lógica atual)
  const blocosPermitidos = ["6", "7", "8", "10", "06", "07", "08"];
  const blocosUnicos = [
    ...new Set(
      dados
        .map((item) => String(item.bloco || ""))
        .filter((b) => blocosPermitidos.includes(b)),
    ),
  ].sort((a, b) => parseInt(a) - parseInt(b));

  // 3. Criar o cabeçalho de Edição com os botões específicos
  let htmlContent = `
        <div class="header-edicao-fixo">
            <h2>Modo de Edição</h2>
            <div class="acoes-edicao">
                <button type="button" class="btn-save-edit" id="btn-salvar-geral">
                    <i class="fas fa-save"></i> Salvar Alterações
                </button>
                <button type="button" class="btn-back" onclick="window.location.reload()">
                    <i class="fas fa-times"></i> Sair
                </button>
            </div>
        </div>
    `;

  // 4. Gerar os blocos (sua lógica de TRs com Inputs)
  blocosUnicos.forEach((bloco) => {
    const dadosFiltrados = dados.filter((item) => String(item.bloco) === bloco);
    const linhas = dadosFiltrados
      .map(
        (item) => `
            <tr>
                <td><input type="text" class="searchInput" value="${item.data || ""}"></td>
                <td><input type="text" class="searchInput" style="width:50px" value="${item.bloco || ""}"></td>
                <td><input type="text" class="searchInput" value="${item.horario || ""}"></td>
                <td><input type="text" class="searchInput" value="${item.local || ""}"></td>
                <td><input type="text" class="searchInput" value="${item.observacao || ""}"></td>
                <td><input type="text" class="searchInput" value="${item.insumos || ""}"></td>
                <td><button class="btn-delete">Excluir</button></td>
            </tr>
        `,
      )
      .join("");

    htmlContent += `
        <div class="bloco-container-edit">
            <div class="bloco-header">Bloco ${bloco}</div>
            <div class="content" style="max-height: 0px; overflow: hidden;">
                <div class="table-scroll-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th><th>Bl</th><th>Horário</th><th>Local</th><th>Obs</th><th>Insumos</th><th>Ações</th>
                            </tr>
                        </thead>
                        <tbody class="tabela-body">${linhas}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
  });

  containerBlocos.innerHTML = htmlContent;

  // 5. Reatribuir o evento de salvar ao novo botão criado
  document
    .getElementById("btn-salvar-geral")
    .addEventListener("click", function () {
      const novosDados = capturarDadosDaTabela(); // Sua função que varre os inputs
      if (window.salvarNoFirebase) {
        window.salvarNoFirebase(novosDados);
      }
    });

  setupAccordionEdicao();
}
function setupAccordionEdicao() {
  const headers = document.querySelectorAll(".bloco-header");
  headers.forEach((header) => {
    header.addEventListener("click", function () {
      this.classList.toggle("active");
      const content = this.nextElementSibling;
      if (content.style.maxHeight !== "0px") {
        content.style.maxHeight = "0px";
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });
}
