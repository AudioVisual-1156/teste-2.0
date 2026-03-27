const container = document.querySelector(".container");

// 1. Mantenha os Event Listeners fora da função de busca para evitar duplicidade
function setupListeners() {
  const searchInput = document.getElementById("inputBusca");

  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const filter = searchInput.value.toLowerCase();
      const containers = document.querySelectorAll(".bloco-container");

      containers.forEach((blockContainer) => {
        let hasVisibleRows = false;
        const rows = blockContainer.querySelectorAll("tbody tr");
        const header = blockContainer.querySelector(".bloco-header");
        const content = blockContainer.querySelector(".content");

        rows.forEach((row) => {
          const text = row.textContent.toLowerCase();
          if (text.includes(filter)) {
            row.style.display = "";
            hasVisibleRows = true;
          } else {
            row.style.display = "none";
          }
        });

        // Lógica de exibição do bloco
        if (filter !== "") {
          if (hasVisibleRows) {
            blockContainer.style.display = "";
            header.classList.add("active");
            content.classList.add("show");
            content.style.maxHeight = "none"; // Abre para mostrar os resultados
          } else {
            blockContainer.style.display = "none";
          }
        } else {
          // Reset quando a busca está vazia
          blockContainer.style.display = "";
          header.classList.remove("active");
          content.classList.remove("show");
          content.style.maxHeight = "0px";
        }
      });
    });
  }

  // Listener de Clique (Accordion)
  container.addEventListener("click", function (e) {
    const header = e.target.closest(".bloco-header");
    if (!header) return;

    const content = header.nextElementSibling;
    header.classList.toggle("active");

    if (content.classList.contains("show")) {
      content.style.maxHeight = content.scrollHeight + "px";
      content.offsetHeight; // force repaint
      content.classList.remove("show");
      content.style.maxHeight = "0px";
    } else {
      content.classList.add("show");
      content.style.maxHeight = content.scrollHeight + "px";
      setTimeout(() => {
        if (content.classList.contains("show"))
          content.style.maxHeight = "none";
      }, 400);
    }
  });
}

async function searchData() {
  const FIREBASE_URL =
    "https://sistema-reservas-5647c-default-rtdb.firebaseio.com/.json";

  try {
    const busca = await fetch(FIREBASE_URL);
    let dadosRaw = await busca.json();

    if (!dadosRaw) return;

    // Achatando e tratando possíveis diferenças de nomes de chaves (Normalização)
    const dados = (
      Array.isArray(dadosRaw) ? dadosRaw.flat() : Object.values(dadosRaw).flat()
    ).map((item) => ({
      // Aqui garantimos que o código entenda tanto "bloco" quanto "Bloco"
      bloco: String(item.bloco || item.Bloco || ""),
      horario: item.horario || item.HorárioInicial || "",
      local: item.local || item.Local || item.Espaço || "",
      data: item.data || item.Data || "",
      observacao: item.observacao || item.Observação || "",
      insumos: item.insumos || item.Insumos || "",
    }));

    const dataExibicao = dados[0]?.data || "";

    // Ordenação por horário e depois local
     dados.sort((a, b) => {
      const inicioA = a.horario.split("-")[0].trim();
      const inicioB = b.horario.split("-")[0].trim();

      const compHora = inicioA.localeCompare(inicioB);

      if (compHora !== 0) {
        return compHora;
      }

      return a.local.localeCompare(b.local, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    // Filtro de blocos (Normalizando para comparar números como strings)
    const blocosPermitidos = ["6", "7", "8", "10", "06", "07", "08"];
    const blocosUnicos = [
      ...new Set(
        dados
          .map((item) => item.bloco)
          .filter((b) => blocosPermitidos.includes(b)),
      ),
    ].sort((a, b) => parseInt(a) - parseInt(b));

    let htmlContent = `<h1>Reservas - DIA ${dataExibicao}</h1>`;

    blocosUnicos.forEach((bloco) => {
      const dadosFiltrados = dados.filter((item) => item.bloco === bloco);
      const linhas = dadosFiltrados
        .map(
          (item) => `
        <tr>
          <td>${item.horario}</td>
          <td>${item.local}</td> 
          <td>${item.observacao}</td>
          <td>${item.insumos}</td>
        </tr>
      `,
        )
        .join("");

      htmlContent += `
        <div class="bloco-container">
          <div class="bloco-header">Bloco ${bloco}</div>
          <div class="content">
            <div class="table-scroll-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Horário</th>
                    <th>Local</th>
                    <th>Observação</th>
                    <th>Insumos</th>
                  </tr>
                </thead>
                <tbody>${linhas}</tbody>
              </table>
            </div>
          </div>
        </div>`;
    });

    container.innerHTML = htmlContent;
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    container.innerHTML = "<h2>Erro ao carregar as reservas.</h2>";
  }
}

// Inicialização
setupListeners();
searchData();
