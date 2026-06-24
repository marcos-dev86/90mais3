const API_URL = 'https://api-90mais3.vercel.app';

function ajustarPaddingTopo() {
    const topo = document.querySelector('.topo-fixo');
    if (topo) document.body.style.paddingTop = topo.offsetHeight + 'px';
}
window.addEventListener('load', ajustarPaddingTopo, { passive: true });
window.addEventListener('resize', ajustarPaddingTopo, { passive: true });

function toggleFiltros() {
    const aba = document.getElementById("abaFiltros");
    const btn = document.getElementById("btnFiltro");
    if (!aba) return;
    const aberto = aba.classList.toggle("visible");
    btn?.classList.toggle("aberto", aberto);
    btn?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

// ── Estado dos filtros (liga / busca / ordenação / tamanho) ───────────────
let categoriaAtiva = "todos";
let ordenacaoAtiva = "relevancia";   // 'relevancia' | 'preco-asc' | 'preco-desc'
let tamanhosAtivos = [];             // ex: ['P','G'] — vazio = todos

function filtrarCategoria(categoria, el) {
    categoriaAtiva = categoria;
    document.querySelectorAll(".filtro-pill").forEach(p => {
        p.classList.remove("active");
        p.removeAttribute("aria-current");
    });
    if (el) {
        el.classList.add("active");
        el.setAttribute("aria-current", "true");
    }
    aplicarTodosFiltros();
}

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function pesquisarCamisa() {
    aplicarTodosFiltros();
}

const pesquisarDebounced = debounce(pesquisarCamisa, 220);

// ── Filtro de ordenação (relevância / preço) ───────────────────────────────
function iniciarFiltroOrdenacao() {
    const select = document.getElementById("filtroOrdenacao");
    if (!select) return;
    select.addEventListener("change", () => {
        ordenacaoAtiva = select.value;
        aplicarTodosFiltros();
    });
}

// ── Filtro de tamanhos (checkboxes P, M, G, GG) ────────────────────────────
function iniciarFiltroTamanho() {
    const checkboxes = document.querySelectorAll(".filtro-tamanho-check");
    if (!checkboxes.length) return;
    checkboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            tamanhosAtivos = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
            aplicarTodosFiltros();
        });
    });
}

// ── Aplica busca + categoria + tamanho sobre os cards já renderizados,
//    e reordena conforme a ordenação ativa. Promoções (.promocao) nunca
//    são afetadas por nenhum desses filtros. ──────────────────────────────
function aplicarTodosFiltros() {
    const campo = document.getElementById("campoPesquisa");
    const termo = campo ? campo.value.toLowerCase().trim() : "";
    const grid  = document.getElementById("catalogo-grid");
    const cards = Array.from(document.querySelectorAll(".card:not(.promocao)"));

    let visiveis = 0;

    cards.forEach(card => {
        const conteudo = card.innerText.toLowerCase();

        const passaCategoria = categoriaAtiva === "todos" || card.classList.contains(categoriaAtiva);
        const passaBusca = termo === "" || conteudo.includes(termo);

        let passaTamanho = true;
        if (tamanhosAtivos.length > 0) {
            const disponiveis = Array.from(card.querySelectorAll(".tamanho-badge.disponivel"))
                .map(b => b.textContent.trim());
            passaTamanho = tamanhosAtivos.some(t => disponiveis.includes(t));
        }

        const visivel = passaCategoria && passaBusca && passaTamanho;
        card.style.display = visivel ? "" : "none";
        if (visivel) visiveis++;
    });

    // Reordena os cards visíveis dentro do grid conforme a ordenação ativa
    if (grid) {
        const ordenados = ordenarCardsNoDOM(cards);
        ordenados.forEach(card => grid.appendChild(card));
    }

    const msg = document.getElementById("msgNenhuma");
    if (msg) msg.style.display = visiveis === 0 ? "block" : "none";

    // Sincroniza o estado visual dos botões de filtro de liga
    if (termo !== "") {
        document.querySelectorAll(".filtro-pill").forEach(p => {
            p.classList.remove("active");
            p.removeAttribute("aria-current");
        });
    }
}

// ── Reordena os elementos <article class="card"> com base no data-preco
//    e data-prioridade (gravados em cada card na hora da renderização). ───
function ordenarCardsNoDOM(cards) {
    const copia = [...cards];

    if (ordenacaoAtiva === "preco-asc") {
        copia.sort((a, b) => Number(a.dataset.preco) - Number(b.dataset.preco));
    } else if (ordenacaoAtiva === "preco-desc") {
        copia.sort((a, b) => Number(b.dataset.preco) - Number(a.dataset.preco));
    } else {
        // relevância — maior prioridade primeiro, desempate por id (ordem de cadastro)
        copia.sort((a, b) => {
            const diff = Number(b.dataset.prioridade) - Number(a.dataset.prioridade);
            return diff !== 0 ? diff : Number(a.dataset.id) - Number(b.dataset.id);
        });
    }

    return copia;
}

// ── CATÁLOGO DINÂMICO ──────────────────────────────────────────────────────
// Nota: as funções de sacola/favoritos (alternarFavorito, abrirModalFavoritos,
// etc.) NÃO estão mais neste arquivo — elas moraram para carrinho.js, que
// é compartilhado entre esta página (index.html) e a produto.html.

const LIGAS_LABEL = { brasileirao: 'Brasileirão', europeus: 'Europeus', selecoes: 'Seleções', retro: 'Retrô' };

const FAV_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

// ── Gera o card de cada camisa no catálogo.
//    O botão e a imagem levam para a página exclusiva da camisa
//    (produto.html?id=X) em vez de abrir o WhatsApp direto. ────────────────
function gerarCardHTML(c) {
    const est = c.estoque || {};
    const nomeDisplay = c.nome;
    const ligaClass = c.liga || '';
    const tagsClass = Array.isArray(c.tags) ? c.tags.join(' ') : '';
    const timeClass = (c.time || c.nome || '').toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
    const preco = parseFloat(c.preco).toFixed(2).replace('.', ',').split(',');
    const precoInt = preco[0];
    const precoCent = preco[1];

    const idUnico = `${c.nome}|${c.temporada}|${c.modelo}`;
    const nomeCompleto = `${nomeDisplay} ${c.temporada} - ${c.modelo}`;

    const tamanhos = ['P','M','G','GG'].map(t => {
        const qtd = est[t] ?? 0;
        const cls = qtd > 0 ? 'disponivel' : 'esgotado';
        const label = qtd > 0 ? `Tamanho ${t} disponível` : `Tamanho ${t} esgotado`;
        return `<span class="tamanho-badge ${cls}" aria-label="${label}">${t}</span>`;
    }).join('');

    return `
    <article class="card ${timeClass} ${ligaClass} ${tagsClass}"
             data-id="${c.id}" data-preco="${c.preco}" data-prioridade="${c.prioridade || 0}">
        <button class="btn-fav" data-id="${idUnico}" data-nome="${nomeCompleto}" onclick="alternarFavorito(this)"
            title="Favoritar ${nomeCompleto}" aria-label="Adicionar ${nomeCompleto} à sacola" aria-pressed="false">
            ${FAV_SVG}
        </button>
        <a href="produto.html?id=${c.id}" class="imagem-container" aria-label="Ver detalhes da camisa ${nomeDisplay}" style="text-decoration:none">
            <picture>
                <img src="${c.foto_frente}" alt="Camisa ${nomeDisplay} ${c.temporada} - frente" class="foto-frente" loading="lazy" width="400" height="270">
            </picture>
            <picture>
                <img src="${c.foto_costas}" alt="Camisa ${nomeDisplay} ${c.temporada} - costas" class="foto-costas" loading="lazy" width="400" height="270">
            </picture>
        </a>
        <div class="card-info">
            <div class="card-header-row">
                <h3>${nomeDisplay}</h3>
                <span class="preco" aria-label="Preço: R$${precoInt},${precoCent}">R$${precoInt}<small>,${precoCent}</small></span>
            </div>
            <p class="temporada">${c.temporada} · ${c.modelo}</p>
            <div class="tamanhos" aria-label="Tamanhos disponíveis">${tamanhos}</div>
            <a class="comprar" href="produto.html?id=${c.id}" aria-label="Ver detalhes da camisa ${nomeCompleto}">
                Ver Detalhes
            </a>
        </div>
    </article>`;
}

async function carregarCatalogo() {
    const grid = document.getElementById('catalogo-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);font-family:\'Barlow Condensed\',sans-serif;letter-spacing:.1em;text-transform:uppercase">Carregando catálogo...</div>';

    try {
        const res = await fetch(`${API_URL}/api/camisas`);
        if (!res.ok) throw new Error('API indisponível');
        const camisas = await res.json();

        if (!camisas.length) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);font-family:\'Barlow Condensed\',sans-serif;letter-spacing:.1em;text-transform:uppercase">Nenhuma camisa disponível no momento.</div>';
            return;
        }

        // Ordena por prioridade (relevância) já na primeira renderização —
        // é o comportamento padrão do site até o usuário trocar a ordenação.
        const ordenadas = [...camisas].sort((a, b) => {
            const diff = (Number(b.prioridade) || 0) - (Number(a.prioridade) || 0);
            return diff !== 0 ? diff : a.id - b.id;
        });

        grid.innerHTML = ordenadas.map(gerarCardHTML).join('');
        inicializarCards();
    } catch (err) {
        console.error(err);
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--red);font-family:\'Barlow Condensed\',sans-serif;letter-spacing:.1em;text-transform:uppercase">Erro ao carregar catálogo. Tente recarregar a página.</div>';
    }
}

// ── Carrega a(s) promoção(ões) ativa(s) do banco e monta a seção ──────────
// liga='promocao' nunca aparece no catálogo normal, só aqui.
async function carregarPromocoes() {
    const container = document.getElementById('promo-container');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/api/camisas?liga=promocao`);
        if (!res.ok) throw new Error('Falha ao buscar promoções');
        const promocoes = await res.json();

        const secao = document.getElementById('secao-promocoes');
        if (!promocoes.length) {
            if (secao) secao.style.display = 'none';
            return;
        }

        container.innerHTML = promocoes.map(gerarCardPromocaoHTML).join('');
    } catch (err) {
        console.error('Erro ao carregar promoções:', err);
        const secao = document.getElementById('secao-promocoes');
        if (secao) secao.style.display = 'none';
    }
}

function gerarCardPromocaoHTML(c) {
    const est = c.estoque || {};
    const preco = Number(c.preco).toFixed(2).split('.');
    const temPrecoOriginal = c.preco_original && Number(c.preco_original) > Number(c.preco);
    const precoOriginalHTML = temPrecoOriginal
        ? `<span class="preco-de">De R$${Number(c.preco_original).toFixed(2).replace('.', ',')}</span>`
        : '';
    const selo = c.selo_promocional || 'OFERTA ESPECIAL';

    const idUnico = `${c.nome}|${c.temporada}|${c.modelo}`;
    const nomeCompleto = `${c.nome} ${c.temporada} - ${c.modelo}`;

    const tamanhosHTML = ['P','M','G','GG'].map(t => {
        const qtd = est[t] ?? 0;
        const cls = qtd > 0 ? 'disponivel' : 'esgotado';
        return `<span class="tamanho-badge ${cls}">${t}</span>`;
    }).join('');

    return `
    <article class="card card-promo promocao">
        <button class="btn-fav" data-id="${idUnico}" data-nome="${nomeCompleto}" onclick="alternarFavorito(this)"
            title="Favoritar ${nomeCompleto}" aria-label="Adicionar ${nomeCompleto} à sacola" aria-pressed="false">
            ${FAV_SVG}
        </button>
        <a href="produto.html?id=${c.id}" class="imagem-unica" style="text-decoration:none">
            <picture>
                <img src="${c.foto_frente}" alt="${c.nome}" loading="lazy" width="400" height="420">
            </picture>
        </a>
        <div class="card-info">
            <div class="promo-badge-tag">${selo}</div>
            <div class="card-header-row">
                <h3>${c.nome}</h3>
            </div>
            <p class="temporada">${c.temporada} · ${c.modelo}</p>
            <div class="tamanhos" aria-label="Tamanhos disponíveis">${tamanhosHTML}</div>
            <div class="preco-promo-block">
                ${precoOriginalHTML}
                <span class="preco preco-por">R$${preco[0]}<small>,${preco[1]}</small></span>
            </div>
            <a class="comprar btn-promo" href="produto.html?id=${c.id}" aria-label="Ver detalhes de ${nomeCompleto}">
                Eu quero essa promoção!
            </a>
        </div>
    </article>`;
}

function inicializarCards() {
    atualizarContador();
    sincronizarBotoesFavorito();

    document.querySelectorAll("img").forEach(img => {
        if (!img.getAttribute("loading")) img.setAttribute("loading", "lazy");
    });

    document.querySelectorAll(".card:not(.promocao)").forEach(card => {
        const texto = card.innerText.toLowerCase();
        if ((texto.includes("26/27") || texto.includes("2026")) && !card.querySelector(".etiqueta-lancamento")) {
            const tag = document.createElement("div");
            tag.className = "etiqueta-lancamento";
            tag.innerText = "LANÇAMENTO";
            tag.setAttribute("aria-label", "Lançamento");
            card.appendChild(tag);
        }
        const maisVendidos = ["flamengo", "corinthians", "palmeiras", "são paulo", "vasco", "milan", "real madrid"];
        if (maisVendidos.some(t => texto.includes(t)) && !card.querySelector(".etiqueta-vendida")) {
            const tag = document.createElement("div");
            tag.className = "etiqueta-vendida";
            tag.innerText = "MAIS VENDIDA";
            tag.setAttribute("aria-label", "Mais vendida");
            card.appendChild(tag);
        }
    });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    document.querySelectorAll(".card").forEach((card, i) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(24px)";
        card.style.transition = `opacity 0.5s ease ${(i % 6) * 0.07}s, transform 0.5s ease ${(i % 6) * 0.07}s`;
        observer.observe(card);
    });

    // Reaplica os filtros/ordenação ativos (útil após recarregar o catálogo)
    aplicarTodosFiltros();
}

document.addEventListener("DOMContentLoaded", function () {
    carregarCatalogo();
    carregarPromocoes();

    const campo = document.getElementById("campoPesquisa");
    if (campo) {
        campo.addEventListener("keypress", e => { if (e.key === "Enter") pesquisarCamisa(); });
        campo.addEventListener("input", pesquisarDebounced);
    }

    iniciarFiltroOrdenacao();
    iniciarFiltroTamanho();

    document.getElementById('vitrine-flutuante')?.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirModalFavoritos(); }
    });
    document.getElementById('ticket-secreto')?.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); resgatarTicket(); }
    });

    setTimeout(() => {
        exibirProvaSocial();
        setInterval(exibirProvaSocial, 270000);
    }, 270000);
});

const nomes = ["Lucas","Marcos","Matheus","Rafael","Felipe","Thiago","Pedro","Gabriel","Mariana","Ana"];
const locais = ["do Bela Vista","da Vila Rio Branco","da Chapadinha","de São Miguel Arcanjo","de Angatuba","de Tatuí"];
const produtos = ["o Kit do Brasil 2026","uma camisa do Flamengo","uma camisa do Real Madrid","uma camisa do Corinthians","uma camisa do Barcelona","uma camisa do Barcelona retro","uma camisa do PSG","o kit Brasil + Palmeiras"];

function exibirProvaSocial() {
    const nome = nomes[Math.floor(Math.random() * nomes.length)];
    const local = locais[Math.floor(Math.random() * locais.length)];
    const produto = produtos[Math.floor(Math.random() * produtos.length)];
    const balao = document.getElementById("balao-prova");
    const texto = document.getElementById("texto-prova");
    if (balao && texto) {
        texto.innerHTML = `<strong>${nome}</strong> ${local} acabou de pedir<br><span style="color:var(--gold); font-weight:700;">${produto}</span>`;
        balao.classList.add("mostrar");
        setTimeout(() => balao.classList.remove("mostrar"), 5000);
    }
}

function resgatarTicket() {
    const ticket = document.getElementById("ticket-secreto");
    if (ticket) ticket.style.display = "none";
    alert("🎟️ VOCÊ ACHOU O TICKET DOURADO!\n\nTire um print desta tela e mande no WhatsApp da 90+3 para ganhar 15% OFF no valor TOTAL das suas camisas!");
    const msg = "Achei o Ticket Dourado no site! Quero meus 15% OFF nas camisas da vitrine 🎟️";
    window.open(`https://wa.me/5515991617508?text=${encodeURIComponent(msg)}`, "_blank");
}
