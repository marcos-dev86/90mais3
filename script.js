/* ============================================
   90+3 — SCRIPT.JS  (versão otimizada)
   ============================================ */

// ── 0. AJUSTA PADDING-TOP CONFORME ALTURA DO TOPO FIXO ──
function ajustarPaddingTopo() {
    const topo = document.querySelector('.topo-fixo');
    if (topo) {
        document.body.style.paddingTop = topo.offsetHeight + 'px';
    }
}
// ✅ PERFORMANCE: passive:true em scroll/resize não bloqueia o thread principal
window.addEventListener('load', ajustarPaddingTopo, { passive: true });
window.addEventListener('resize', ajustarPaddingTopo, { passive: true });

// ── 1. TOGGLE FILTROS ──
function toggleFiltros() {
    const aba = document.getElementById("abaFiltros");
    const btn = document.getElementById("btnFiltro");
    if (!aba) return;
    const aberto = aba.classList.toggle("visible");
    btn?.classList.toggle("aberto", aberto);
    // ✅ ACESSIBILIDADE: atualiza aria-expanded
    btn?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

// ── 2. FILTRAR POR CATEGORIA ──
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

// ── 3. PESQUISA POR TEXTO (com debounce) ──
// ✅ PERFORMANCE: debounce evita processar cada tecla individualmente
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

// ── 4. SISTEMA DE FAVORITOS ──
let favoritos = [];
try {
    favoritos = JSON.parse(localStorage.getItem("fav_903")) || [];
} catch (e) {
    favoritos = [];
}

function alternarFavorito(botao) {
    const nome = botao.getAttribute("data-nome");
    if (favoritos.includes(nome)) {
        favoritos = favoritos.filter(i => i !== nome);
        botao.classList.remove("ativo");
        botao.setAttribute("aria-pressed", "false"); // ✅ ACESSIBILIDADE
    } else {
        favoritos.push(nome);
        botao.classList.add("ativo");
        botao.setAttribute("aria-pressed", "true"); // ✅ ACESSIBILIDADE
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
        // ✅ ACESSIBILIDADE: atualiza label acessível
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
        lista.innerHTML = `<p style="text-align:center; color: var(--text-muted); padding: 20px 0;">
            Sua sacola está vazia.<br>Marque suas favoritas com ♥
        </p>`;
    } else {
        lista.innerHTML = favoritos.map(item => `<p>${item}</p>`).join("");
    }

    modal.classList.add("open");
    modal.style.display = "flex";

    // ✅ ACESSIBILIDADE: foca no botão fechar ao abrir modal
    setTimeout(() => {
        modal.querySelector('.modal-close')?.focus();
    }, 50);
}

function fecharModalFavoritos() {
    const modal = document.getElementById("modal-favoritos");
    if (modal) {
        modal.classList.remove("open");
        modal.style.display = "none";
    }
    // ✅ ACESSIBILIDADE: devolve foco à sacola após fechar
    document.getElementById('vitrine-flutuante')?.focus();
}

function enviarFavoritosWhats() {
    if (favoritos.length === 0) {
        alert("Adicione camisas na sua sacola primeiro!");
        return;
    }
    const lista = favoritos.map(f => "  • " + f).join("\n");
    const msg = `Olá! Tenho interesse nessas camisas da 90+3:\n\n${lista}\n\nGostaria de consultar disponibilidade e fechar pedido!`;
    window.open(`https://wa.me/5515991617508?text=${encodeURIComponent(msg)}`, "_blank");
}

// Fechar modal ao clicar fora ou pressionar Escape
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

// ── 5. DOMContentLoaded ──
document.addEventListener("DOMContentLoaded", function () {

    // ── Restaurar favoritos salvos ──
    atualizarContador();
    document.querySelectorAll(".btn-fav").forEach(botao => {
        const nome = botao.getAttribute("data-nome");
        if (favoritos.includes(nome)) {
            botao.classList.add("ativo");
            botao.setAttribute("aria-pressed", "true");
        }
    });

    // ── Lazy loading em todas as imagens (fallback para navegadores antigos) ──
    document.querySelectorAll("img").forEach(img => {
        if (!img.getAttribute("loading")) img.setAttribute("loading", "lazy");
    });

    // ── Campo de pesquisa ──
    const campo = document.getElementById("campoPesquisa");
    if (campo) {
        campo.addEventListener("keypress", e => {
            if (e.key === "Enter") pesquisarCamisa();
        });
        // ✅ PERFORMANCE: debounce na pesquisa em tempo real
        campo.addEventListener("input", pesquisarDebounced);
    }

    // ── Etiquetas automáticas ──
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

    // ── Flip de imagem ao clicar ou pressionar Enter/Espaço ──
    document.querySelectorAll(".imagem-container").forEach(container => {
        const pictures = container.querySelectorAll("picture");
        const imgs = container.querySelectorAll("img");
        if (pictures.length >= 2) {
            // Esconde segunda imagem (costas) inicialmente
            pictures[1].style.display = "none";

            const flip = () => {
                const mostrando = pictures[0].style.display !== "none";
                pictures[0].style.display = mostrando ? "none" : "block";
                pictures[1].style.display = mostrando ? "block" : "none";
                // Atualiza aria-label
                container.setAttribute("aria-label",
                    mostrando ? "Ver frente da camisa" : "Ver costas da camisa"
                );
            };

            container.addEventListener("click", flip);
            // ✅ ACESSIBILIDADE: permite flip por teclado
            container.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    flip();
                }
            });
        }
    });

    // ── Scroll reveal para cards ──
    // ✅ PERFORMANCE: usa IntersectionObserver (não bloqueia scroll)
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target); // Para de observar após revelar
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    document.querySelectorAll(".card").forEach((card, i) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(24px)";
        card.style.transition = `opacity 0.5s ease ${(i % 6) * 0.07}s, transform 0.5s ease ${(i % 6) * 0.07}s`;
        observer.observe(card);
    });

    // ── Sacola: teclas de acessibilidade ──
    // ✅ ACESSIBILIDADE: permite abrir sacola por teclado
    document.getElementById('vitrine-flutuante')?.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            abrirModalFavoritos();
        }
    });
    document.getElementById('ticket-secreto')?.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            resgatarTicket();
        }
    });

    // ── Iniciar prova social após 4min30s ──
    setTimeout(() => {
        exibirProvaSocial();
        setInterval(exibirProvaSocial, 270000);
    }, 270000);
});

// ── 6. PROVA SOCIAL ──
const nomes = ["Lucas", "Marcos", "Matheus", "Rafael", "Felipe", "Thiago", "Pedro", "Gabriel", "Mariana", "Ana"];
const locais = ["do Bela Vista", "da Vila Rio Branco", "da Chapadinha", "de São Miguel Arcanjo", "de Angatuba", "de Tatuí"];
const produtos = [
    "o Kit do Brasil 2026",
    "uma camisa do Flamengo",
    "uma camisa do Real Madrid",
    "uma camisa do Corinthians",
    "uma camisa do Barcelona",
    "uma camisa do Barcelona retro",
    "uma camisa do PSG",
    "o kit Brasil + Palmeiras"
];

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

// ── 7. EASTER EGG — TICKET DOURADO ──
function resgatarTicket() {
    const ticket = document.getElementById("ticket-secreto");
    if (ticket) ticket.style.display = "none";

    alert("🎟️ VOCÊ ACHOU O TICKET DOURADO!\n\nTire um print desta tela e mande no WhatsApp da 90+3 para ganhar 15% OFF no valor TOTAL das suas camisas!");

    const msg = "Achei o Ticket Dourado no site! Quero meus 15% OFF nas camisas da vitrine 🎟️";
    window.open(`https://wa.me/5515991617508?text=${encodeURIComponent(msg)}`, "_blank");
}
