"use strict";

const gap_carrossel = 16;
let favoritos = JSON.parse(localStorage.getItem('favoritos')) || []; 

/* ==========================================================================
   1. FUNÇÕES UTILITÁRIAS, FAVORITOS E HISTÓRICO
   ========================================================================== */

/**
 * Remove acentos e caracteres especiais de uma string para facilitar buscas.
 * Exemplo: "Café" vira "Cafe".
 */
function removeracentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

/**
 * Salva um estabelecimento clicado no histórico de busca do LocalStorage.
 * Evita duplicatas mantendo o item mais recente no início (máximo 5 itens).
 */
function salvarnohistorico(item) {
    let historico = JSON.parse(localStorage.getItem('historico')) || [];
    historico = historico.filter(h => h.id !== item.id);
    historico.unshift(item);
    if (historico.length > 5) {
        historico.pop();
    }
    localStorage.setItem('historico', JSON.stringify(historico));
}

/**
 * Adiciona ou remove o ID de um estabelecimento do array de favoritos.
 * Atualiza os dados persistidos no LocalStorage.
 */
function alternarFavorito(idDoEstabelecimento) {
    const idString = String(idDoEstabelecimento);
    const index = favoritos.indexOf(idString);
    
    if (index === -1) {
        favoritos.push(idString);
    } else {
        favoritos.splice(index, 1);
    }
    
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

/**
 * Percorre todos os botões de favorito na tela e aplica a classe 'favoritado'
 * caso o item correspondente esteja salvo no LocalStorage.
 */
function sincronizarfavoritos() {
    const botoes = document.querySelectorAll('.btn-favorito');
    botoes.forEach(botao => {
        const idBotao = botao.dataset.id || botao.id;
        if (favoritos.includes(String(idBotao))) {
            botao.classList.add('favoritado');
        }
    });
}

/**
 * Exibe a lista de histórico de buscas em TODAS as caixas .container-historico da página
 * (atendendo simultaneamente aos formulários de PC e Celular) e oculta os resultados.
 */
function exibirhistorico() {
    const containerResultados = document.querySelectorAll('.container-resultado');
    const containerHistorico = document.querySelectorAll('.container-historico');

    containerResultados.forEach(container => {
        container.style.display = 'none';
    });

    const listaHistorico = JSON.parse(localStorage.getItem('historico')) || [];

    containerHistorico.forEach(container => {
        container.style.display = 'block';
        renderizar(listaHistorico, container);
    }); 
}

/**
 * Renderiza uma lista de estabelecimentos (histórico ou sugestões) dentro do container especificado.
 * Aceita tanto uma string seletora (ex: '.container-resultado') quanto o próprio elemento HTML.
 */
function renderizar(lista, elementoOuSeletor) {
    const container = typeof elementoOuSeletor === 'string' 
        ? document.querySelector(elementoOuSeletor) 
        : elementoOuSeletor;

    if (!container) return;
    container.innerHTML = '';
    
    lista.forEach(item => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = item.link;
        link.textContent = item.nome;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        
        // Salva no histórico quando o usuário clica no item sugerido
        link.addEventListener('click', () => salvarnohistorico(item));
        
        li.appendChild(link);
        container.appendChild(li);
    });
}

/**
 * Gera dinamicamente os SVGs das estrelas de avaliação (cheias, meias e vazias)
 * criando gradientes únicos para evitar conflitos na renderização.
 */
function criarestrelas(nota, idRestaurante) {
    let estrelashtml = '';
    const idGradiente = `metade-gradiente-${idRestaurante || Math.random().toString(36).substring(2, 7)}`;

    const estrela = `<svg viewBox="0 0 24 24" width="14" height="14" fill="#D4A017"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;

    const meia_estrela = `<svg viewBox="0 0 24 24" width="14" height="14">
    <defs>
      <linearGradient id="${idGradiente}">
        <stop offset="50%" stop-color="#D4A017"/>
        <stop offset="50%" stop-color="#E0E0E0"/>
      </linearGradient>
    </defs>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="url(#${idGradiente})"/>
    </svg>`;

    const estrela_vazia = `<svg viewBox="0 0 24 24" width="14" height="14" fill="#E0E0E0"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;

    for(let i = 1; i <= 5; i++) {
        if ((i <= nota) || (nota >= (i - 0.2))) {
            estrelashtml += estrela;
        } 
        else if (nota >= (i - 0.7) && nota <= (i - 0.3)) {
            estrelashtml += meia_estrela;
        } 
        else {
            estrelashtml += estrela_vazia;
        }
    }

    return estrelashtml;
}

/**
 * Alterna a visibilidade do menu lateral responsivo e da camada de sobreposição (overlay).
 */
function toggleMenu() {
    const menu = document.querySelector('.menu-lateral');
    const overlay = document.querySelector('.menu-overlay');

    if (menu && overlay) {
        menu.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

/* ==========================================================================
   2. CARROSSEL E NAVEGAÇÃO
   ========================================================================== */

/**
 * Realiza o rolamento suave do carrossel para a esquerda (-1) ou direita (1).
 */
function mover(idDoCarrosel, sentido) {
    const carrossel = document.querySelector("#" + idDoCarrosel);
    if (!carrossel) return;
    const largura_card = carrossel.querySelector(".card").offsetWidth; 

    carrossel.scrollBy({
        left: (largura_card + gap_carrossel) * sentido,
        behavior: "smooth"
    });
}

/**
 * Atualiza a visibilidade das setas direcionais do carrossel dependendo da posição da barra de rolagem.
 */
function atualizarBotoes(carrossel) {
    const wrapper = carrossel.closest(".carrossel-wrapper");
    if (!wrapper) return;

    const btnEsquerda = wrapper.querySelector(".esquerda");
    const btnDireita = wrapper.querySelector(".direita");

    const noInicio = carrossel.scrollLeft <= 10;
    const scrollMaximo = carrossel.scrollWidth - carrossel.clientWidth;
    const noFinal = carrossel.scrollLeft >= (scrollMaximo - 10);

    if (btnEsquerda) btnEsquerda.style.visibility = noInicio ? "hidden" : "visible";
    if (btnDireita) btnDireita.style.visibility = noFinal ? "hidden" : "visible";
}

/* ==========================================================================
   3. FILTROS E RENDERIZAÇÃO DE CARDS NA PÁGINA
   ========================================================================== */

/**
 * Monta e exibe a grade de cards de estabelecimentos após a aplicação dos filtros select.
 */
function renderizarfiltrados(lista) {
    const container = document.querySelector('#container-cards-filtrados');
    if (!container) return;
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<p class="sem-resultado">Nenhum resultado foi encontrado</p>';
        return;
    }
    // Cria o fragmento em memória
    const fragmento = document.createDocumentFragment();

    lista.forEach(restaurante => {
        const eFavorito = favoritos.includes(String(restaurante.id));
        
        // Cria o elemento article na memória
        const article = document.createElement('article');
        article.className = 'card';
        
        // Define o HTML interno do card
        article.innerHTML = `
          
        <figure>
            <img src="${restaurante.img || 'img/default.png'}" alt="${restaurante.nome}" class="cafesimg">  
          </figure>
          <div class="card-content">
            <h3><a href="${restaurante.link}">${restaurante.nome}</a></h3>      
            <span class="nota">${Number(restaurante.nota)?.toLocaleString('pt-BR') || '4,5'}</span>
            <span class="estrelas">${criarestrelas(restaurante.nota || 4.5)}</span>
            <span class="fonte">(Google)</span>
            
            <button class="btn-favorito ${eFavorito ? 'favoritado' : ''}" aria-label="Adicionar aos favoritos" data-id="${restaurante.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icone-coracao">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>
      `;
      fragmento.appendChild(article);
    });
    container.appendChild(fragmento);
}

/**
 * Lê os seletores dropdown (Especialidade, Horário e Modalidade) e filtra a base
 * de dados cruzando as 3 condições.
 */
function aplicarFiltro() {
    const valEsp = document.querySelector('#filtroespecialidade')?.value || 'Todos';
    const valHor = document.querySelector('#filtrohorario')?.value || 'Todos';
    const valMod = document.querySelector('#filtromodalidade')?.value || 'Todos';

    const termoEsp = removeracentos(valEsp.toLowerCase().trim());
    const termoHor = removeracentos(valHor.toLowerCase().trim());
    const termoMod = removeracentos(valMod.toLowerCase().trim());

    const resultados = estabelecimentos.filter(item => {
        const espItem = removeracentos((item.especialidades || '').toLowerCase().trim());
        const horItem = (Array.isArray(item.horarios) ? item.horarios : [item.horarios || ''])
            .map(h => removeracentos(String(h).toLowerCase().trim()));
        const modItem = (Array.isArray(item.modalidades) ? item.modalidades : [item.modalidades || ''])
            .map(m => removeracentos(String(m).toLowerCase().trim()));

        const bateEspecialidade = (termoEsp === 'todos') || (espItem === termoEsp);
        const bateHorario = (termoHor === 'todos') || horItem.includes('todos') || horItem.includes(termoHor);
        const bateModalidade = (termoMod === 'todos') || modItem.includes('todos') || modItem.includes(termoMod);

        return bateEspecialidade && bateHorario && bateModalidade;
    });

    renderizarfiltrados(resultados);

    const secaoHome = document.querySelector('#secao-home');
    const secaoFiltrados = document.querySelector('#secao-filtrados');

    if (secaoHome) secaoHome.style.display = 'none';
    if (secaoFiltrados) secaoFiltrados.style.display = 'block';
}

/* ==========================================================================
   4. BASE DE DADOS DOS ESTABELECIMENTOS
   ========================================================================== */
const estabelecimentos = [
    {id: 1, nome: 'CafePontoCom', link: 'CafePontoCom.html', nota: '4.7', especialidades: 'Cafeteria', horarios: 'Todos', modalidades: 'Todos', img: 'img/cafe.com.jpg'}, 
    {id: 2, nome: 'Versa Café', link: 'versa.cafe.html', nota: '4.8', especialidades: 'Cafeteria', horarios: 'Todos', modalidades: 'Todos', img: 'img/versa.jpg'},
    {id: 3, nome: 'Diade café', link: 'diade.cafe.html', nota: '4.7', especialidades: 'Cafeteria', horarios: ['Café', 'Almoço'], modalidades: 'Todos', img: 'img/diade.jpg'},
    {id: 4, nome: 'Meio café', link: 'meio.cafe.html', nota: '4.0', especialidades: 'Cafeteria', horarios: 'Todos', modalidades: 'Presencial', img: 'img/meio.jpg'}, 
    {id: 5, nome: 'Krause café', link: 'krause.cafe.html', nota: '4.3', especialidades: 'Cafeteria', horarios: ['Café', 'Almoço'], modalidades: 'Todos', img: 'img/krause.jpg'},
    {id: 6, nome: 'Nonno chiesa', link: 'nonno.chiesa.html', nota: '4.8', especialidades: 'Cafeteria', horarios: 'Todos', modalidades: 'Todos', img: 'img/nona.jpg'},
    {id: 7, nome: 'mc café', link: 'mc.cafe.html', nota: '3.8', especialidades: 'Cafeteria', horarios: 'Todos', modalidades: 'Todos', img: 'img/mccafe.jpg'}, 
    {id: 8, nome: 'nook café', link: 'nook.cafe.html', nota: '4.8', especialidades: 'Cafeteria', horarios: ['Café', 'Almoço'], modalidades: 'Todos', img: 'img/nookcafe.jpg'},
    {id: 9, nome: 'café da flóris', link: 'café da floris.html', nota: '4.7', especialidades: 'Cafeteria', horarios: ['Café', 'Almoço'], modalidades: 'Todos', img: 'img/cafedafloris.jpg'},
    {id: 10, nome: 'leve café', link: 'leve.cafe.html', nota: '4.8', especialidades:'Cafeteria', horarios: ['Café', 'Almoço'], modalidades: 'Todos', img: 'img/levecafe.jpg'},
    {id: 11, nome: 'Madre Mia', link:'madre.mia.html', nota: '4.7', especialidades: 'Buffet/kilo', horarios: ['Almoço', 'Jantar'], modalidades: 'Todos', img: 'img/madremia.jpg'},
    {id: 12, nome: 'Estancia 21', link: 'estancia.21.html', nota: '4.8', especialidades: 'Buffet/kilo', horarios: ['Almoço', 'Jantar'], modalidades: 'Todos', img: 'img/estancia21.jpg'},
    {id: 13, nome: 'Antonio Brasa e Buffet', link: 'antonio.brasa.e.buffet.html', nota: '4.7', especialidades: 'Buffet/kilo', horarios: ['Almoço', 'Jantar'], modalidades: 'Todos', img: 'img/antoniobrasa.jpg'},
    {id: 14, nome: 'Polo Norte', link: 'polo.norte.html', nota: '4.7', especialidades: 'Buffet/kilo', horarios: 'Almoço', modalidades: 'Todos', img: 'img/polonorte.jpg'}, 
    {id: 15, nome: 'Alles Blau', link: 'alles.blau.html', nota: '4.7', especialidades: 'Buffet/kilo', horarios: ['Almoço', 'Jantar'], modalidades: 'Presencial', img: 'img/alesblau.jpg'},
    {id: 16, nome: "D'Gustus", link: "dgustus.html", nota: '4.6', especialidades: 'Buffet/kilo', horarios: 'Almoço', modalidades: 'Todos', img: 'img/dgustus.jpg'}, 
    {id: 17, nome: 'Canto', link: 'canto.html', nota: '4.6', especialidades: 'Buffet/kilo', horarios: ['Almoço', 'Jantar'], modalidades: 'Presencial', img: 'img/canto.jpg'}, 
    {id: 18, nome: 'Restaurante do Alemao', link: 'restaurante.do.alemao.html', nota: '4.8', especialidades: 'Buffet/kilo', horarios: 'Almoço', modalidades: ['Presencial', 'Retirada'], img: 'img/alemao.jpg'},
    {id: 19, nome: 'Cidadela', link: 'cidadela.html', nota: '4.6', especialidades: 'Buffet/kilo', horarios: 'Almoço', modalidades: 'Todos', img: 'img/cidadela.jpg'},
    {id: 20, nome: 'Agibe', link: 'agibe.html', nota: '4.4', especialidades: 'Buffet/kilo', horarios: ['Almoço','Jantar'], modalidades: 'Todos', img: 'img/agibe.jpg'},
    {id: 21, nome: 'Celeiro', link: 'Celeiro.html', nota: '4.2', especialidades: 'Pizzaria', horarios: 'Jantar', modalidades: 'Todos', img: 'img/celeiro(1).jpg'},
    {id: 22, nome: 'Gatronomia', link: 'Gatronomia.html', nota: '4.8', especialidades: 'Pizzaria', horarios: 'Jantar', modalidades: 'Todos', img: 'img/gastronomia(1).jpg'},
    {id: 23, nome: 'Nella Pietra', link: 'Nella.Pietra.html', nota: '4.5', especialidades: 'Pizzaria', horarios: 'Jantar', modalidades: 'Todos', img: 'img/nellapietra.jpg'},
    {id: 24, nome: 'Pizzaria Premium', link: 'Pizzaria.Premium.html', nota: '4.7', especialidades: 'Pizzaria', horarios: 'Jantar', modalidades: 'Todos', img: 'img/premium(1).jpg'},
    {id: 25, nome: 'Pizzaria Master', link: 'Pizzaria.Master.html', nota: '4.6', especialidades: 'Pizzaria', horarios: 'Jantar', modalidades: 'Todos', img: 'img/master(1).jpg'},
    {id: 26, nome: 'Pizza Prime', link: 'Pizza.Prime.html', nota: '4.2', especialidades: 'Pizzaria', horarios: 'Jantar', modalidades: 'Todos', img: 'img/prime(1).png'},
    {id: 27, nome: 'Sabores Do Sul', link: 'Sabores.Do.Sul.html', nota: '4.4', especialidades: 'Pizzaria', horarios: 'Jantar', modalidades: 'Todos', img: 'img/saboresdosul.jpg'},
    {id: 28, nome: 'Sanata Pizzaria', link: 'Sanata.Pizzaria.html', nota: '4.4', especialidades: 'Pizzaria', horarios: 'Jantar', modalidades: 'Todos', img: 'img/sanata(1).jpg'},
    {id: 29, nome: 'Universo da Pizza', link: 'Universo.da.Pizza.html', nota: '4.6', especialidades: 'Pizzaria', horarios: 'Jantar', modalidades: 'Todos', img: 'img/universo(1).jpg'},
    {id: 30, nome: 'Ice-Hot', link: 'Ice.Hot.html', nota: '4.3', especialidades: 'Pizzaria', horarios: 'Jantar', modalidades: 'Todos', img: 'img/icehot.jpg'},
    {id: 31, nome: 'CIA 09', link: 'CIA 09.html', nota: '4.7', especialidades: 'Hamburguer', horarios: 'Jantar', modalidades: 'Todos', img: 'img/cia09.jpg'},
    {id: 32, nome: 'Johnnie Jack', link: 'Johnnie.Jack.html', nota: '4.7', especialidades: 'Hamburguer', horarios: 'Jantar', modalidades: 'Todos', img: 'img/JJ.jpg'},
    {id: 33, nome: 'Infinity Burgers', link: 'Infinity.Burgers.html', nota: '4.7', especialidades: 'Hamburguer', horarios: 'Jantar', modalidades: 'Todos', img: 'img/infinityB.jpg'},
    {id: 34, nome: 'Leña burguer y parrilla', link:'Lena.burguer.y.parrilla.html', nota: '5.0', especialidades: 'Hamburguer', horarios: 'Jantar', modalidades: 'Todos', img: 'img/lenaB.jpg'},
    {id: 35, nome: 'Petiskão Lanches', link: 'Petiskao.Lanches.html', nota: '4.8', especialidades: 'Hamburguer', horarios: 'Jantar', modalidades: 'Todos', img: 'img/petiskao.jpg'},
    {id: 36, nome: 'Heisenburger', link: 'Heisenburger.html', nota: '4.5', especialidades: 'Hamburguer', horarios: 'Jantar', modalidades: 'Todos', img: 'img/heisenburg.jpg'},
    {id: 37, nome: 'Los Chapas', link: 'Los Chapas.html', nota: '4.7', especialidades: 'Hamburguer', horarios: 'Jantar', modalidades: 'Todos', img: 'img/loschapas.jpg'},
    {id: 38, nome: 'Circulus Lanches', link: 'Circulus.Lanches.html', nota: '4.7', especialidades: 'Hamburguer', horarios: 'Jantar', modalidades: 'Todos', img: 'img/circulus.jpg'},
    {id: 39, nome: 'Mac Donalds', link: 'MacDonalds.html', nota: '4.4', especialidades: 'Hamburguer', horarios: 'Todos', modalidades: 'Todos', img: 'img/MC.jpg'},
    {id: 40, nome: 'Severo Garage', link: 'Severo.Garage.html', nota: '4.6', especialidades: 'Hamburguer', horarios: 'Jantar', modalidades: 'Todos', img: 'img/severo.jpg'}
];

/* ==========================================================================
   5. ESCUCHADORES DE EVENTOS (EVENT LISTENERS)
   ========================================================================== */

// Evento disparado quando o documento HTML termina de ser carregado
document.addEventListener("DOMContentLoaded", () => { 
    const campobusca = document.querySelectorAll('.buscajs');

    // Previne o recarregamento (F5) ao submeter qualquer formulário da página (teclado do celular)
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => e.preventDefault());
    });

    // Registra os ouvintes de scroll em cada carrossel da página
    document.querySelectorAll(".carrossel").forEach(carrossel => {
        atualizarBotoes(carrossel);
        carrossel.addEventListener("scroll", () => atualizarBotoes(carrossel));
    });

    // Marca os corações favoritados ao carregar a página
    sincronizarfavoritos();

    // Event Delegation: Ouvinte global de cliques para gerenciar os botões de favoritos
    document.addEventListener('click', (event) => {
        const botao = event.target.closest('.btn-favorito');
        if (botao) {
            event.stopPropagation();
            const idBotao = botao.dataset.id || botao.id;
            alternarFavorito(idBotao);
            
            // Atualiza visualmente todos os botões com este ID na página
            document.querySelectorAll(`.btn-favorito[data-id="${idBotao}"], .btn-favorito[id="${idBotao}"]`).forEach(btn => {
                btn.classList.toggle('favoritado');
            });
        }
    });

    // Mapeia individualmente cada campo de busca (PC e Celular)
    campobusca.forEach(input => {
        // Localiza os elementos de resposta dentro do formulário atual
        const formPai = input.closest('form');
        const resContainer = formPai ? formPai.querySelector('.container-resultado') : null;
        const histContainer = formPai ? formPai.querySelector('.container-historico') : null;

        // Evento FOCUS: Abre o histórico quando o usuário clica num campo vazio
        input.addEventListener('focus', () => {
            if (input.value.trim() === '') {
                exibirhistorico();
            }
        });

        // Evento BLUR: Fecha os dropdowns com um leve atraso após o campo perder o foco
        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (histContainer) histContainer.style.display = 'none';
                if (resContainer) resContainer.style.display = 'none';
            }, 10);
        });

        // Evento INPUT: Disparado em tempo real ao digitar (compatível com teclados touch)
        input.addEventListener('input', (e) => {    
            const valordigitado = removeracentos(e.target.value.trim().toLowerCase());
            
            if (valordigitado === '') {
                exibirhistorico();
                return;
            }

            // Filtra os estabelecimentos combinando partes do nome
            const estabelecimentosFiltrados = estabelecimentos
                .filter(est => removeracentos(est.nome.toLowerCase()).includes(valordigitado))
                .sort((a, b) => {
                    const nomeA = removeracentos(a.nome.toLowerCase());
                    const nomeB = removeracentos(b.nome.toLowerCase());
                    const acomeca = nomeA.startsWith(valordigitado);
                    const bcomeca = nomeB.startsWith(valordigitado);    

                    if (acomeca && !bcomeca) return -1;
                    if (!acomeca && bcomeca) return 1;
                    return a.nome.localeCompare(b.nome);   
                })
                .slice(0, 5); 

            // Altera a visibilidade dos containers do formulário atual
            if (resContainer) resContainer.style.display = 'block';
            if (histContainer) histContainer.style.display = 'none';
            
            if (resContainer) {
                renderizar(estabelecimentosFiltrados, resContainer);
            }
        });

        // Evento KEYDOWN: Executa a navegação ao pressionar a tecla Enter
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const primeiroLink = resContainer ? resContainer.querySelector('li a') : null;
                if (primeiroLink) primeiroLink.click();
            }
        });

        // Evento MOUSEDOWN: Evita que o evento de blur feche o menu antes de processar o clique
        if (histContainer) {
            histContainer.addEventListener('mousedown', (e) => e.preventDefault());
        }
        if (resContainer) {
            resContainer.addEventListener('mousedown', (e) => e.preventDefault());
        }
    });

    // Evento de clique para retornar à visualização principal
    const btnVoltarhome = document.querySelector('#btn-voltar-home');
    if (btnVoltarhome) {
        btnVoltarhome.addEventListener('click', () => {
            location.reload();
        });
    }

    // Reseta o valor dos filtros caso a página passe por um reload manual
    const selectEspecialidades = document.querySelector('#filtroespecialidade');
    const selecthorario = document.querySelector('#filtrohorario');
    const selectmodalidade = document.querySelector('#filtromodalidade');

    const [navegacao] = performance.getEntriesByType('navigation');
    if (navegacao && navegacao.type === 'reload') {
        if (selectEspecialidades) selectEspecialidades.value = 'Todos';
        if (selecthorario) selecthorario.value = 'Todos'; 
        if (selectmodalidade) selectmodalidade.value = 'Todos';
    }

    // Ouvintes de mudança nos seletores para re-aplicar os filtros automaticamente
    if (selectEspecialidades) selectEspecialidades.addEventListener('change', aplicarFiltro);
    if (selecthorario) selecthorario.addEventListener('change', aplicarFiltro);
    if (selectmodalidade) selectmodalidade.addEventListener('change', aplicarFiltro);
});

// Reseta o scroll inicial de todos os carrosséis
document.querySelectorAll('.carrossel').forEach(c => c.scrollLeft = 0);
