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

function filtrarCategoria(categoria, el) {
    document.querySelectorAll(".filtro-pill").forEach(p => {
        p.classList.remove("active");
        p.removeAttribute("aria-current");
    });
    if (el) {
        el.classList.add("active");
        el.setAttribute("aria-current", "true");
    }
    const cards = document.querySelectorAll(".card:not(.promocao)");
    let visiveis = 0;
    cards.forEach(card => {
        const visivel = categoria === "todos" || card.classList.contains(categoria);
        card.style.display = visivel ? "" : "none";
        if (visivel) visiveis++;
    });
    const msg = document.getElementById("msgNenhuma");
    if (msg) msg.style.display = visiveis === 0 ? "block" : "none";
}

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function pesquisarCamisa() {
    const campo = document.getElementById("campoPesquisa");
    if (!campo) return;
    const entrada = campo.value.toLowerCase().trim();
    const cards = document.querySelectorAll(".card:not(.promocao)");
    let visiveis = 0;
    cards.forEach(card => {
        const conteudo = card.innerText.toLowerCase();
        const visivel = conteudo.includes(entrada);
        card.style.display = visivel ? "" : "none";
        if (visivel) visiveis++;
    });
    const msg = document.getElementById("msgNenhuma");
    if (msg) msg.style.display = visiveis === 0 ? "block" : "none";
    document.querySelectorAll(".filtro-pill").forEach(p => {
        p.classList.remove("active");
        p.removeAttribute("aria-current");
    });
    if (entrada === "") {
        const todas = document.querySelector(".filtro-pill");
        if (todas) {
            todas.classList.add("active");
            todas.setAttribute("aria-current", "true");
        }
    }
}

const pesquisarDebounced = debounce(pesquisarCamisa, 220);

let favoritos = [];
try { favoritos = JSON.parse(localStorage.getItem("fav_903")) || []; } catch (e) { favoritos = []; }

function alternarFavorito(botao) {
    const nome = botao.getAttribute("data-nome");
    if (favoritos.includes(nome)) {
        favoritos = favoritos.filter(i => i !== nome);
        botao.classList.remove("ativo");
        botao.setAttribute("aria-pressed", "false");
    } else {
        favoritos.push(nome);
        botao.classList.add("ativo");
        botao.setAttribute("aria-pressed", "true");
    }
    try { localStorage.setItem("fav_903", JSON.stringify(favoritos)); } catch(e) {}
    atualizarContador();
    animarBotaoFav(botao);
}

function animarBotaoFav(botao) {
    botao.style.transform = "scale(1.35)";
    setTimeout(() => { botao.style.transform = ""; }, 200);
}

function atualizarContador() {
    const contador = document.getElementById("contador-fav");
    if (contador) {
        contador.innerText = favoritos.length;
        contador.closest('#vitrine-flutuante')?.setAttribute(
            'aria-label',
            `Abrir sacola de favoritos — ${favoritos.length} ite${favoritos.length === 1 ? 'm' : 'ns'}`
        );
    }
}

function abrirModalFavoritos() {
    const lista = document.getElementById("lista-favoritos");
    const modal = document.getElementById("modal-favoritos");
    if (!lista || !modal) return;
    if (favoritos.length === 0) {
        lista.innerHTML = `<p style="text-align:center; color: var(--text-muted); padding: 20px 0;">Sua sacola está vazia.<br>Marque suas favoritas com ♥</p>`;
    } else {
        lista.innerHTML = favoritos.map(item => `<p>${item}</p>`).join("");
    }
    modal.classList.add("open");
    modal.style.display = "flex";
    setTimeout(() => { modal.querySelector('.modal-close')?.focus(); }, 50);
}

function fecharModalFavoritos() {
    const modal = document.getElementById("modal-favoritos");
    if (modal) { modal.classList.remove("open"); modal.style.display = "none"; }
    document.getElementById('vitrine-flutuante')?.focus();
}

function enviarFavoritosWhats() {
    if (favoritos.length === 0) { alert("Adicione camisas na sua sacola primeiro!"); return; }
    const lista = favoritos.map(f => "  • " + f).join("\n");
    const msg = `Olá! Tenho interesse nessas camisas da 90+3:\n\n${lista}\n\nGostaria de consultar disponibilidade e fechar pedido!`;
    window.open(`https://wa.me/5515991617508?text=${encodeURIComponent(msg)}`, "_blank");
}

document.addEventListener("click", function(e) {
    const modal = document.getElementById("modal-favoritos");
    if (modal && e.target === modal) fecharModalFavoritos();
});
document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        const modal = document.getElementById("modal-favoritos");
        if (modal && modal.classList.contains("open")) fecharModalFavoritos();
    }
});

// ── CATÁLOGO DINÂMICO ──────────────────────────────────────────────────────

const LIGAS_LABEL = { brasileirao: 'Brasileirão', europeus: 'Europeus', selecoes: 'Seleções', retro: 'Retrô' };

const FAV_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

function gerarCardHTML(c) {
    const est = c.estoque || {};
    const nomeDisplay = c.nome;
    const ligaClass = c.liga || '';
    const timeClass = c.time.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
    const preco = parseFloat(c.preco).toFixed(2).replace('.', ',').split(',');
    const precoInt = preco[0];
    const precoCent = preco[1];
    const nomeWA = encodeURIComponent(`Olá, tenho interesse na camisa do ${c.nome} ${c.temporada}`);
    const tamanhos = ['P','M','G','GG'].map(t => {
        const qtd = est[t] ?? 0;
        const cls = qtd > 0 ? 'disponivel' : 'esgotado';
        const label = qtd > 0 ? `Tamanho ${t} disponível` : `Tamanho ${t} esgotado`;
        return `<span class="tamanho-badge ${cls}" aria-label="${label}">${t}</span>`;
    }).join('');

    return `
    <article class="card ${timeClass} ${ligaClass}">
        <button class="btn-fav" data-nome="${nomeDisplay} ${c.temporada}" onclick="alternarFavorito(this)"
            title="Favoritar ${nomeDisplay} ${c.temporada}" aria-label="Adicionar ${nomeDisplay} ${c.temporada} à sacola" aria-pressed="false">
            ${FAV_SVG}
        </button>
        <div class="imagem-container" role="button" tabindex="0" aria-label="Ver costas da camisa ${nomeDisplay}">
            <picture>
                <source srcset="${c.foto_frente}" type="image/webp">
                <img src="${c.foto_frente}" alt="Camisa ${nomeDisplay} ${c.temporada} - frente" class="foto-frente" loading="lazy" width="400" height="270">
            </picture>
            <picture>
                <source srcset="${c.foto_costas}" type="image/webp">
                <img src="${c.foto_costas}" alt="Camisa ${nomeDisplay} ${c.temporada} - costas" class="foto-costas" loading="lazy" width="400" height="270">
            </picture>
        </div>
        <div class="card-info">
            <div class="card-header-row">
                <h3>${nomeDisplay}</h3>
                <span class="preco" aria-label="Preço: R$${precoInt},${precoCent}">R$${precoInt}<small>,${precoCent}</small></span>
            </div>
            <p class="temporada">${c.temporada} · ${c.modelo}</p>
            <div class="tamanhos" aria-label="Tamanhos disponíveis">${tamanhos}</div>
            <a class="comprar" href="https://wa.me/5515991617508?text=${nomeWA}"
                target="_blank" rel="noopener noreferrer" aria-label="Comprar camisa ${nomeDisplay} no WhatsApp">
                Comprar no WhatsApp
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

        grid.innerHTML = camisas.map(gerarCardHTML).join('');
        inicializarCards();
    } catch (err) {
        console.error(err);
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--red);font-family:\'Barlow Condensed\',sans-serif;letter-spacing:.1em;text-transform:uppercase">Erro ao carregar catálogo. Tente recarregar a página.</div>';
    }
}

function inicializarCards() {
    atualizarContador();
    document.querySelectorAll(".btn-fav").forEach(botao => {
        const nome = botao.getAttribute("data-nome");
        if (favoritos.includes(nome)) {
            botao.classList.add("ativo");
            botao.setAttribute("aria-pressed", "true");
        }
    });

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

    document.querySelectorAll(".imagem-container").forEach(container => {
        const pictures = container.querySelectorAll("picture");
        if (pictures.length >= 2) {
            pictures[1].style.display = "none";
            const flip = () => {
                const mostrando = pictures[0].style.display !== "none";
                pictures[0].style.display = mostrando ? "none" : "block";
                pictures[1].style.display = mostrando ? "block" : "none";
                container.setAttribute("aria-label", mostrando ? "Ver frente da camisa" : "Ver costas da camisa");
            };
            container.addEventListener("click", flip);
            container.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
            });
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
}

document.addEventListener("DOMContentLoaded", function () {
    carregarCatalogo();

    const campo = document.getElementById("campoPesquisa");
    if (campo) {
        campo.addEventListener("keypress", e => { if (e.key === "Enter") pesquisarCamisa(); });
        campo.addEventListener("input", pesquisarDebounced);
    }

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
