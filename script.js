// ── 0. AJUSTA PADDING-TOP CONFORME ALTURA DO TOPO FIXO ──
function ajustarPaddingTopo() {
    const topo = document.querySelector('.topo-fixo');
    if (topo) {
        document.body.style.paddingTop = topo.offsetHeight + 'px';
    }
}
window.addEventListener('load', ajustarPaddingTopo);
window.addEventListener('resize', ajustarPaddingTopo);

/* ============================================
   90+3 — SCRIPT.JS
   Todas as funcionalidades originais mantidas
   + melhorias de UX e performance
   ============================================ */

// ── 1. TOGGLE FILTROS ──
function toggleFiltros() {
    const aba = document.getElementById("abaFiltros");
    const btn = document.getElementById("btnFiltro");
    if (!aba) return;
    const aberto = aba.classList.toggle("visible");
    btn?.classList.toggle("aberto", aberto);
}

// ── 2. FILTRAR POR CATEGORIA ──
function filtrarCategoria(categoria, el) {
    // Atualiza pills
    document.querySelectorAll(".filtro-pill").forEach(p => p.classList.remove("active"));
    if (el) el.classList.add("active");

    // Filtra cards
    let cards = document.querySelectorAll(".card:not(.promocao)");
    let visiveis = 0;
    cards.forEach(card => {
        if (categoria === "todos" || card.classList.contains(categoria)) {
            card.style.display = "";
            visiveis++;
        } else {
            card.style.display = "none";
        }
    });

    // Mostra mensagem se nenhum resultado
    const msg = document.getElementById("msgNenhuma");
    if (msg) msg.style.display = visiveis === 0 ? "block" : "none";
}

// ── 3. PESQUISA POR TEXTO ──
function pesquisarCamisa() {
    const campo = document.getElementById("campoPesquisa");
    if (!campo) return;
    const entrada = campo.value.toLowerCase().trim();
    let cards = document.querySelectorAll(".card:not(.promocao)");
    let visiveis = 0;

    cards.forEach(card => {
        const conteudo = card.innerText.toLowerCase();
        const visivel = conteudo.includes(entrada);
        card.style.display = visivel ? "" : "none";
        if (visivel) visiveis++;
    });

    const msg = document.getElementById("msgNenhuma");
    if (msg) msg.style.display = visiveis === 0 ? "block" : "none";

    // Reseta pills
    document.querySelectorAll(".filtro-pill").forEach(p => p.classList.remove("active"));
    const todas = document.querySelector(".filtro-pill");
    if (todas && entrada === "") todas.classList.add("active");
}

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
    } else {
        favoritos.push(nome);
        botao.classList.add("ativo");
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
    if (contador) contador.innerText = favoritos.length;
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
        lista.innerHTML = favoritos.map(item =>
            `<p>${item}</p>`
        ).join("");
    }

    modal.classList.add("open");
    modal.style.display = "flex";
}

function fecharModalFavoritos() {
    const modal = document.getElementById("modal-favoritos");
    if (modal) {
        modal.classList.remove("open");
        modal.style.display = "none";
    }
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

// Fechar modal ao clicar fora
document.addEventListener("click", function(e) {
    const modal = document.getElementById("modal-favoritos");
    if (modal && e.target === modal) fecharModalFavoritos();
});

// ── 5. DOMContentLoaded ──
document.addEventListener("DOMContentLoaded", function () {

    // ── Restaurar favoritos salvos ──
    atualizarContador();
    document.querySelectorAll(".btn-fav").forEach(botao => {
        const nome = botao.getAttribute("data-nome");
        if (favoritos.includes(nome)) botao.classList.add("ativo");
    });

    // ── Lazy loading em todas as imagens ──
    document.querySelectorAll("img").forEach(img => {
        if (!img.getAttribute("loading")) img.setAttribute("loading", "lazy");
    });

    // ── Pesquisar no Enter ──
    const campo = document.getElementById("campoPesquisa");
    if (campo) {
        campo.addEventListener("keypress", e => {
            if (e.key === "Enter") pesquisarCamisa();
        });
        // Pesquisa em tempo real
        campo.addEventListener("input", pesquisarCamisa);
    }

    // ── Etiquetas automáticas ──
    document.querySelectorAll(".card:not(.promocao)").forEach(card => {
        const texto = card.innerText.toLowerCase();

        // Lançamento
        if ((texto.includes("26/27") || texto.includes("2026")) && !card.querySelector(".etiqueta-lancamento")) {
            const tag = document.createElement("div");
            tag.className = "etiqueta-lancamento";
            tag.innerText = "LANÇAMENTO";
            card.appendChild(tag);
        }

        // Mais vendida
        const maisVendidos = ["flamengo", "corinthians", "palmeiras", "são paulo", "vasco", "milan", "real madrid"];
        if (maisVendidos.some(t => texto.includes(t)) && !card.querySelector(".etiqueta-vendida")) {
            const tag = document.createElement("div");
            tag.className = "etiqueta-vendida";
            tag.innerText = "MAIS VENDIDA";
            card.appendChild(tag);
        }
    });

    // ── Flip de imagem ao clicar ──
    document.querySelectorAll(".imagem-container").forEach(container => {
        const imgs = container.querySelectorAll("img");
        if (imgs.length >= 2) {
            imgs[1].style.display = "none";
            container.addEventListener("click", () => {
                const mostrando = imgs[0].style.display !== "none";
                imgs[0].style.display = mostrando ? "none" : "block";
                imgs[1].style.display = mostrando ? "block" : "none";
            });
        }
    });

    // ── Scroll reveal para cards ──
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

    // ── Iniciar prova social após 12s ──
    setTimeout(() => {
        exibirProvaSocial();
        setInterval(exibirProvaSocial, 22000);
    }, 12000);
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
