// ═══════════════════════════════════════════════════════════════
//  carrinho.js — Sacola compartilhada entre index.html e produto.html
//  Usa localStorage para persistir os itens entre páginas.
// ═══════════════════════════════════════════════════════════════

const CHAVE_SACOLA = '90mais3_sacola';

// ── Lê a sacola do localStorage ───────────────────────────────
function lerSacola() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_SACOLA)) || [];
    } catch {
        return [];
    }
}

// ── Salva a sacola no localStorage ────────────────────────────
function salvarSacola(itens) {
    localStorage.setItem(CHAVE_SACOLA, JSON.stringify(itens));
}

// ── Verifica se um item está na sacola ────────────────────────
function itemEstaNoCarrinho(idUnico) {
    return lerSacola().some(i => i.id === idUnico);
}

// ── Alterna (adiciona/remove) um item na sacola ───────────────
// Retorna true se foi ADICIONADO, false se foi REMOVIDO.
function alternarItemCarrinho(idUnico, nomeCompleto) {
    const itens = lerSacola();
    const idx = itens.findIndex(i => i.id === idUnico);
    if (idx === -1) {
        itens.push({ id: idUnico, nome: nomeCompleto });
        salvarSacola(itens);
        atualizarContador();
        return true;
    } else {
        itens.splice(idx, 1);
        salvarSacola(itens);
        atualizarContador();
        return false;
    }
}

// ── Wrapper usado pelos botões de coração nos cards ───────────
function alternarFavorito(btn) {
    const idUnico = btn.dataset.id;
    const nome    = btn.dataset.nome;
    const foiAdicionado = alternarItemCarrinho(idUnico, nome);
    btn.classList.toggle('ativo', foiAdicionado);
    btn.setAttribute('aria-pressed', foiAdicionado ? 'true' : 'false');
    atualizarContador();
    sincronizarBotoesFavorito();
}

// ── Atualiza o contador do ícone de sacola flutuante ─────────
function atualizarContador() {
    const el = document.getElementById('contador-fav');
    if (!el) return;
    const qtd = lerSacola().length;
    el.textContent = qtd;
    el.style.display = qtd > 0 ? '' : '';
}

// ── Sincroniza o estado visual (ativo/inativo) de todos
//    os botões de coração da página com a sacola atual ─────────
function sincronizarBotoesFavorito() {
    const sacola = lerSacola();
    document.querySelectorAll('.btn-fav').forEach(btn => {
        const ativo = sacola.some(i => i.id === btn.dataset.id);
        btn.classList.toggle('ativo', ativo);
        btn.setAttribute('aria-pressed', ativo ? 'true' : 'false');
    });
}

// ── Abre o modal da sacola ────────────────────────────────────
function abrirModalFavoritos() {
    const modal = document.getElementById('modal-favoritos');
    if (!modal) return;
    renderizarListaSacola();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modal.setAttribute('aria-hidden', 'false');
}

// ── Fecha o modal da sacola ───────────────────────────────────
function fecharModalFavoritos() {
    const modal = document.getElementById('modal-favoritos');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    modal.setAttribute('aria-hidden', 'true');
}

// ── Fecha o modal ao clicar fora do conteúdo ─────────────────
document.addEventListener('click', function(e) {
    const modal = document.getElementById('modal-favoritos');
    if (!modal) return;
    if (modal.classList.contains('open') && e.target === modal) {
        fecharModalFavoritos();
    }
});

// ── Renderiza a lista de itens dentro do modal ────────────────
function renderizarListaSacola() {
    const lista = document.getElementById('lista-favoritos');
    if (!lista) return;
    const itens = lerSacola();

    if (!itens.length) {
        lista.innerHTML = '<p style="text-align:center;color:var(--text-muted,#888);padding:24px 0;font-family:\'Barlow Condensed\',sans-serif;letter-spacing:.05em">Sua sacola está vazia.</p>';
        return;
    }

    lista.innerHTML = itens.map(item => `
        <div class="item-favorito" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)">
            <span style="font-family:'Barlow Condensed',sans-serif;font-size:.95rem;letter-spacing:.04em;color:var(--text-main,#f0f0f0)">${item.nome}</span>
            <button onclick="removerDaSacola('${item.id.replace(/'/g,"&#39;")}')"
                    style="background:none;border:none;color:var(--text-muted,#888);cursor:pointer;font-size:1.2rem;padding:4px 8px;transition:color .15s"
                    onmouseover="this.style.color='#e55'" onmouseout="this.style.color=''"
                    aria-label="Remover ${item.nome} da sacola">&times;</button>
        </div>
    `).join('');
}

// ── Remove um item específico da sacola ──────────────────────
function removerDaSacola(idUnico) {
    const itens = lerSacola().filter(i => i.id !== idUnico);
    salvarSacola(itens);
    atualizarContador();
    sincronizarBotoesFavorito();
    renderizarListaSacola();

    // Atualiza botão na página de produto (se estiver lá)
    const btnCarrinho = document.getElementById('btn-add-carrinho');
    if (btnCarrinho) {
        const camisaNaPagina = window.camisaAtual;
        if (camisaNaPagina) {
            const idPagina = `${camisaNaPagina.nome}|${camisaNaPagina.temporada}|${camisaNaPagina.modelo}`;
            if (idPagina === idUnico) {
                btnCarrinho.textContent = 'Adicionar à sacola';
                btnCarrinho.classList.remove('no-carrinho');
            }
        }
    }
}

// ── Envia a lista de itens para o WhatsApp ────────────────────
function enviarFavoritosWhats() {
    const itens = lerSacola();
    if (!itens.length) {
        alert('Sua sacola está vazia. Adicione alguma camisa primeiro!');
        return;
    }
    const lista = itens.map((it, i) => `${i + 1}. ${it.nome}`).join('\n');
    const msg = `Olá! Tenho interesse nas seguintes camisas da 90+3:\n\n${lista}\n\nPoderia me passar os detalhes e valor total?`;
    window.open(`https://wa.me/5515991617508?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── Inicializa o contador ao carregar qualquer página ─────────
document.addEventListener('DOMContentLoaded', function () {
    atualizarContador();
    sincronizarBotoesFavorito();
});
