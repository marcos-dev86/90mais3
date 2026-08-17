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

// ── Estado dos filtros ────────────────────────────────────────────
let categoriaAtiva = "todos";
let ordenacaoAtiva = "relevancia";
let tamanhosAtivos = [];

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
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function pesquisarCamisa() { aplicarTodosFiltros(); }
const pesquisarDebounced = debounce(pesquisarCamisa, 220);

function iniciarFiltroOrdenacao() {
    const select = document.getElementById("filtroOrdenacao");
    if (!select) return;
    select.addEventListener("change", () => {
        ordenacaoAtiva = select.value;
        aplicarTodosFiltros();
    });
}

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

function aplicarTodosFiltros() {
    const campo = document.getElementById("campoPesquisa");
    const termo = campo ? campo.value.toLowerCase().trim() : "";
    const grid  = document.getElementById("catalogo-grid");
    const cards = Array.from(document.querySelectorAll(".card:not(.promocao)"));

    let visiveis = 0;
    cards.forEach(card => {
        const conteudo = card.innerText.toLowerCase();
        const passaCategoria = categoriaAtiva === "todos" || card.classList.contains(categoriaAtiva);
        const passaBusca     = termo === "" || conteudo.includes(termo);
        let passaTamanho = true;
        if (tamanhosAtivos.length > 0) {
            const disponiveis = Array.from(card.querySelectorAll(".tamanho-badge.disponivel"))
                .map(b => b.textContent.trim());
            const ehInfantil = card.classList.contains("infantil");
            passaTamanho = tamanhosAtivos.some(t => t === "INFANTIL" ? ehInfantil : disponiveis.includes(t));
        }
        const visivel = passaCategoria && passaBusca && passaTamanho;
        card.style.display = visivel ? "" : "none";
        if (visivel) visiveis++;
    });

    if (grid) {
        const ordenados = ordenarCardsNoDOM(cards);
        ordenados.forEach(card => grid.appendChild(card));
    }

    const msg = document.getElementById("msgNenhuma");
    if (msg) msg.style.display = visiveis === 0 ? "block" : "none";

    if (termo !== "") {
        document.querySelectorAll(".filtro-pill").forEach(p => {
            p.classList.remove("active");
            p.removeAttribute("aria-current");
        });
    }
}

function ordenarCardsNoDOM(cards) {
    const copia = [...cards];
    if (ordenacaoAtiva === "preco-asc") {
        copia.sort((a, b) => Number(a.dataset.preco) - Number(b.dataset.preco));
    } else if (ordenacaoAtiva === "preco-desc") {
        copia.sort((a, b) => Number(b.dataset.preco) - Number(a.dataset.preco));
    } else {
        copia.sort((a, b) => {
            const diff = Number(b.dataset.prioridade) - Number(a.dataset.prioridade);
            return diff !== 0 ? diff : Number(a.dataset.id) - Number(b.dataset.id);
        });
    }
    return copia;
}

// ── SVGs ──────────────────────────────────────────────────────────
const LIGAS_LABEL = { brasileirao: 'Brasileirão', europeus: 'Europeus', selecoes: 'Seleções', retro: 'Retrô' };
const FAV_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

// ── Card do catálogo — inclui data-foto e data-preco no btn-fav ──
function gerarCardHTML(c) {
    const est          = c.estoque || {};
    const nomeDisplay  = c.nome;
    const ligaClass    = c.liga || '';
    const tagsClass    = Array.isArray(c.tags) ? c.tags.join(' ') : '';
    const timeClass    = (c.time || c.nome || '').toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
    const preco        = parseFloat(c.preco).toFixed(2).replace('.', ',').split(',');
    const idUnico      = `${c.nome}|${c.temporada}|${c.modelo}`;
    const nomeCompleto = `${nomeDisplay} ${c.temporada} - ${c.modelo}`;

    // Infantil usa numeração 4 a 14, adulto usa P/M/G/GG
    const tamanhosDisponiveis = c.infantil ? ['4', '6', '8', '10', '12', '14'] : ['P', 'M', 'G', 'GG'];
    const tamanhos = tamanhosDisponiveis.map(t => {
        const qtd = est[t] ?? 0;
        const cls = qtd > 0 ? 'disponivel' : 'esgotado';
        return `<span class="tamanho-badge ${cls}" aria-label="Tamanho ${t} ${qtd > 0 ? 'disponível' : 'esgotado'}">${t}</span>`;
    }).join('');

    const infantilClass = c.infantil ? 'infantil' : '';
    const infantilTagHTML = c.infantil ? '<div class="etiqueta-infantil">INFANTIL</div>' : '';

    return `
    <article class="card ${timeClass} ${ligaClass} ${tagsClass} ${infantilClass}"
             data-id="${c.id}" data-preco="${c.preco}" data-prioridade="${c.prioridade || 0}">
        ${infantilTagHTML}
        <button class="btn-fav"
                data-id="${idUnico}"
                data-nome="${nomeCompleto}"
                data-preco="${c.preco}"
                data-foto="${c.foto_frente}"
                onclick="alternarFavorito(this)"
                title="Favoritar ${nomeCompleto}"
                aria-label="Adicionar ${nomeCompleto} à sacola"
                aria-pressed="false">
            ${FAV_SVG}
        </button>
        <a href="produto.html?id=${c.id}" class="imagem-container" aria-label="Ver detalhes de ${nomeDisplay}" style="text-decoration:none">
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
                <span class="preco" aria-label="Preço: R$${preco[0]},${preco[1]}">R$${preco[0]}<small>,${preco[1]}</small></span>
            </div>
            <p class="temporada">${c.temporada} · ${c.modelo}</p>
            <div class="tamanhos" aria-label="Tamanhos disponíveis">${tamanhos}</div>
            <a class="comprar" href="produto.html?id=${c.id}" aria-label="Ver detalhes de ${nomeCompleto}">
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

async function carregarPromocoes() {
    const container = document.getElementById('promo-container');
    if (!container) return;
    try {
        const res = await fetch(`${API_URL}/api/camisas?liga=promocao`);
        if (!res.ok) throw new Error('Falha');
        const promocoes = await res.json();
        const secao = document.getElementById('secao-promocoes');
        if (!promocoes.length) { if (secao) secao.style.display = 'none'; return; }
        container.innerHTML = promocoes.map(gerarCardPromocaoHTML).join('');
    } catch {
        const secao = document.getElementById('secao-promocoes');
        if (secao) secao.style.display = 'none';
    }
}

function gerarCardPromocaoHTML(c) {
    const est  = c.estoque || {};
    const preco = Number(c.preco).toFixed(2).split('.');
    const temOriginal = c.preco_original && Number(c.preco_original) > Number(c.preco);
    const precoOriginalHTML = temOriginal
        ? `<span class="preco-de">De R$${Number(c.preco_original).toFixed(2).replace('.', ',')}</span>` : '';
    const selo = c.selo_promocional || 'OFERTA ESPECIAL';
    const idUnico      = `${c.nome}|${c.temporada}|${c.modelo}`;
    const nomeCompleto = `${c.nome} ${c.temporada} - ${c.modelo}`;
    const tamanhosDisponiveisPromo = c.infantil ? ['4', '6', '8', '10', '12', '14'] : ['P', 'M', 'G', 'GG'];
    const tamanhosHTML = tamanhosDisponiveisPromo.map(t => {
        const qtd = est[t] ?? 0;
        return `<span class="tamanho-badge ${qtd > 0 ? 'disponivel' : 'esgotado'}">${t}</span>`;
    }).join('');

    return `
    <article class="card card-promo promocao">
        <button class="btn-fav"
                data-id="${idUnico}"
                data-nome="${nomeCompleto}"
                data-preco="${c.preco}"
                data-foto="${c.foto_frente}"
                onclick="alternarFavorito(this)"
                title="Favoritar ${nomeCompleto}"
                aria-label="Adicionar ${nomeCompleto} à sacola"
                aria-pressed="false">
            ${FAV_SVG}
        </button>
        <a href="produto.html?id=${c.id}" class="imagem-unica" style="text-decoration:none">
            <picture>
                <img src="${c.foto_frente}" alt="${c.nome}" loading="lazy" width="400" height="420">
            </picture>
        </a>
        <div class="card-info">
            <div class="promo-badge-tag">${selo}</div>
            <div class="card-header-row"><h3>${c.nome}</h3></div>
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
            card.appendChild(tag);
        }
        const maisVendidos = ["flamengo", "corinthians", "palmeiras", "são paulo", "vasco", "milan", "real madrid"];
        if (maisVendidos.some(t => texto.includes(t)) && !card.querySelector(".etiqueta-vendida")) {
            const tag = document.createElement("div");
            tag.className = "etiqueta-vendida";
            tag.innerText = "MAIS VENDIDA";
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

const nomes    = ["Lucas","Marcos","Matheus","Rafael","Felipe","Thiago","Pedro","Gabriel","Mariana","Ana"];
const locais   = ["do Bela Vista","da Vila Rio Branco","da Chapadinha","de São Miguel Arcanjo","de Angatuba","de Tatuí"];
const produtos = ["o Kit do Brasil 2026","uma camisa do Flamengo","uma camisa do Real Madrid","uma camisa do Corinthians","uma camisa do Barcelona","uma camisa do Barcelona retro","uma camisa do PSG","o kit Brasil + Palmeiras"];

function exibirProvaSocial() {
    const nome    = nomes[Math.floor(Math.random() * nomes.length)];
    const local   = locais[Math.floor(Math.random() * locais.length)];
    const produto = produtos[Math.floor(Math.random() * produtos.length)];
    const balao   = document.getElementById("balao-prova");
    const texto   = document.getElementById("texto-prova");
    if (balao && texto) {
        texto.innerHTML = `<strong>${nome}</strong> ${local} acabou de pedir<br><span style="color:var(--gold);font-weight:700">${produto}</span>`;
        balao.classList.add("mostrar");
        setTimeout(() => balao.classList.remove("mostrar"), 5000);
    }
}

// Código do cupom do Ticket Dourado. A validade de verdade (ativo/inativo)
// é sempre checada na hora de aplicar, direto no banco — então se esse
// cupom for desativado no admin, o easter egg continua aparecendo, mas
// avisa corretamente que expirou (mesma checagem do campo normal de cupom).
const CODIGO_TICKET_DOURADO = "CUPOM15";

function resgatarTicket() {
    const ticket = document.getElementById("ticket-secreto");
    if (ticket) ticket.style.display = "none";
    abrirModalTicket();
}

function abrirModalTicket() {
    const modal = document.getElementById("modal-ticket");
    if (!modal) {
        console.warn('[ticket-dourado] elemento #modal-ticket não encontrado no HTML — confira se o index.html publicado tem esse bloco.');
        return;
    }
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
}

function fecharModalTicket() {
    const modal = document.getElementById("modal-ticket");
    if (modal) modal.classList.remove("open");
    document.body.style.overflow = "";
}

function copiarCupomTicket() {
    navigator.clipboard?.writeText(CODIGO_TICKET_DOURADO).then(() => {
        const msg = document.getElementById("ticket-copiado");
        if (msg) {
            msg.hidden = false;
            setTimeout(() => { msg.hidden = true; }, 2000);
        }
    });
}

// Fecha o cupom de fora do card e aplica direto na sacola
function usarCupomTicket() {
    fecharModalTicket();
    if (typeof abrirModalFavoritos === "function") abrirModalFavoritos();
    if (typeof aplicarCupomPorCodigo === "function") aplicarCupomPorCodigo(CODIGO_TICKET_DOURADO);
}

// Fecha o modal do ticket ao clicar fora do card (mesmo padrão da sacola)
document.addEventListener("click", function (e) {
    const modal = document.getElementById("modal-ticket");
    if (modal && modal.classList.contains("open") && e.target === modal) {
        fecharModalTicket();
    }
});
