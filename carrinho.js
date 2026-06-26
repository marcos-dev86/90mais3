// ══════════════════════════════════════════════════════════════════
//  carrinho.js — Sacola lateral (drawer) cinza/branco elegante
//  - Foto da camisa visível
//  - Tamanho escolhido na página do produto (obrigatório)
//  - Subtotal + Total no rodapé
//  - Envio pelo WhatsApp
// ══════════════════════════════════════════════════════════════════

const CHAVE_SACOLA = '90mais3_sacola';

// ─── Persistência ─────────────────────────────────────────────────
function lerSacola() {
    try { return JSON.parse(localStorage.getItem(CHAVE_SACOLA)) || []; }
    catch { return []; }
}
function salvarSacola(itens) {
    localStorage.setItem(CHAVE_SACOLA, JSON.stringify(itens));
}

// ─── Consulta ────────────────────────────────────────────────────
function itemEstaNoCarrinho(idUnico) {
    return lerSacola().some(i => i.id === idUnico);
}

// ─── Adiciona na sacola (chamado apenas do produto.js, após tamanho confirmado)
function adicionarNaSacola(idUnico, nome, tamanho, preco, foto) {
    if (!tamanho || !tamanho.trim()) return false;
    const itens = lerSacola();
    if (itens.some(i => i.id === idUnico)) return false; // já existe
    itens.push({
        id: idUnico,
        nome,
        tamanho,
        preco: Number(preco) || 0,
        foto: foto || ''
    });
    salvarSacola(itens);
    atualizarContador();
    return true;
}

// ─── Remove por idUnico (chamado do produto.js ao "remover da sacola")
function removerPorId(idUnico) {
    salvarSacola(lerSacola().filter(i => i.id !== idUnico));
    atualizarContador();
    sincronizarBotoesFavorito();
}

// ─── Botão de coração nos cards do catálogo
//     NÃO adiciona direto — mostra popup pedindo para ir à página do produto
function alternarFavorito(btn) {
    const idUnico = btn.dataset.id;
    const jaEsta  = lerSacola().some(i => i.id === idUnico);
    if (jaEsta) {
        // Se já está, remove
        removerPorId(idUnico);
        btn.classList.remove('ativo');
        btn.setAttribute('aria-pressed', 'false');
        renderizarListaSacola();
    } else {
        // Não está — bloqueia e mostra aviso
        const link = btn.closest('article')
            ?.querySelector('a[href*="produto.html"]')?.href || null;
        mostrarPopupTamanho(btn, link);
    }
}

// ─── Popup flutuante "escolha o tamanho antes"
function mostrarPopupTamanho(btn, href) {
    document.querySelectorAll('.popup-tamanho').forEach(el => el.remove());
    const popup = document.createElement('div');
    popup.className = 'popup-tamanho';
    popup.innerHTML = href
        ? `Escolha o tamanho na página da camisa.<br><a href="${href}">Ver detalhes &rarr;</a>`
        : 'Escolha o tamanho antes de adicionar.';
    document.body.appendChild(popup);

    const rect = btn.getBoundingClientRect();
    popup.style.top  = (rect.bottom + window.scrollY + 10) + 'px';
    popup.style.left = Math.max(8, rect.left + window.scrollX - 60) + 'px';
    popup.style.opacity = '1';

    setTimeout(() => {
        popup.style.opacity = '0';
        setTimeout(() => popup.remove(), 300);
    }, 2800);
}

// ─── Contador no ícone da sacola flutuante
function atualizarContador() {
    const el = document.getElementById('contador-fav');
    if (el) el.textContent = lerSacola().length;
}

// ─── Sincroniza estado visual dos botões de coração em toda a página
function sincronizarBotoesFavorito() {
    const sacola = lerSacola();
    document.querySelectorAll('.btn-fav').forEach(btn => {
        const ativo = sacola.some(i => i.id === btn.dataset.id);
        btn.classList.toggle('ativo', ativo);
        btn.setAttribute('aria-pressed', ativo ? 'true' : 'false');
    });
}

// ─── Injeta o HTML do drawer no #modal-favoritos (feito uma vez)
function garantirDrawerDOM() {
    if (document.getElementById('sacola-drawer')) return;
    const modal = document.getElementById('modal-favoritos');
    if (!modal) return;
    modal.innerHTML = `
<div id="sacola-drawer" role="dialog" aria-modal="true" aria-labelledby="sacola-titulo">
    <div class="sd-header">
        <div class="sd-logo-wrap">
            <span class="sd-logo"><span class="sd-logo-accent">90</span><span class="sd-logo-plus">+3</span></span>
            <span class="sd-titulo" id="sacola-titulo">Minha Sacola</span>
        </div>
        <button class="sd-close" onclick="fecharModalFavoritos()" aria-label="Fechar sacola">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    </div>

    <div class="sd-itens" id="lista-favoritos" aria-live="polite"></div>

    <div class="sd-rodape">
        <div class="sd-linha-valores">
            <div class="sd-linha">
                <span class="sd-rotulo">Subtotal</span>
                <span class="sd-valor" id="sacola-subtotal">—</span>
            </div>
            <div class="sd-divisor"></div>
            <div class="sd-linha sd-linha-total">
                <span class="sd-rotulo-total">Total</span>
                <span class="sd-valor-total" id="sacola-total">—</span>
            </div>
        </div>
        <button class="sd-btn-wpp" onclick="enviarFavoritosWhats()">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Pedir pelo WhatsApp
        </button>
        <p class="sd-aviso">Confirme disponibilidade com a loja antes de finalizar</p>
    </div>
</div>`;
}

// ─── Abre o drawer
function abrirModalFavoritos() {
    garantirDrawerDOM();
    renderizarListaSacola();
    const modal = document.getElementById('modal-favoritos');
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Aguarda o display:flex antes de animar
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const drawer = document.getElementById('sacola-drawer');
            if (drawer) drawer.classList.add('aberto');
        });
    });
}

// ─── Fecha o drawer
function fecharModalFavoritos() {
    const drawer = document.getElementById('sacola-drawer');
    const modal  = document.getElementById('modal-favoritos');
    if (drawer) drawer.classList.remove('aberto');
    setTimeout(() => {
        if (modal) modal.classList.remove('open');
        document.body.style.overflow = '';
    }, 320);
}

// ─── Fecha ao clicar no overlay (fora do drawer)
document.addEventListener('click', function (e) {
    const modal = document.getElementById('modal-favoritos');
    if (modal && modal.classList.contains('open') && e.target === modal) {
        fecharModalFavoritos();
    }
});

// ─── Renderiza a lista de itens dentro do drawer
function renderizarListaSacola() {
    const lista  = document.getElementById('lista-favoritos');
    const subEl  = document.getElementById('sacola-subtotal');
    const totEl  = document.getElementById('sacola-total');
    if (!lista) return;

    const itens = lerSacola();

    if (!itens.length) {
        lista.innerHTML = `
            <div class="sd-vazia">
                <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#c0c0c0" stroke-width="1.3">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                <p>Sua sacola está vazia</p>
                <small>Acesse a página de uma camisa, escolha o tamanho e adicione.</small>
            </div>`;
        if (subEl) subEl.textContent = '—';
        if (totEl) totEl.textContent = '—';
        return;
    }

    lista.innerHTML = itens.map((item, idx) => {
        const foto = item.foto
            ? `<img src="${item.foto}" alt="${item.nome}" loading="lazy">`
            : `<div class="sd-foto-placeholder">90+3</div>`;

        const preco = item.preco > 0
            ? `R$${Number(item.preco).toFixed(2).replace('.', ',')}` : '';

        return `
        <div class="sd-item">
            <div class="sd-item-foto">${foto}</div>
            <div class="sd-item-info">
                <p class="sd-item-nome">${item.nome}</p>
                <p class="sd-item-tamanho">Tamanho: <strong>${item.tamanho}</strong></p>
                ${preco ? `<p class="sd-item-preco">${preco}</p>` : ''}
            </div>
            <button class="sd-remover" onclick="removerIdx(${idx})" aria-label="Remover ${item.nome}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>`;
    }).join('');

    const total = itens.reduce((s, i) => s + (Number(i.preco) || 0), 0);
    const fmt   = v => v > 0 ? `R$${v.toFixed(2).replace('.', ',')}` : '—';
    if (subEl) subEl.textContent = fmt(total);
    if (totEl) totEl.textContent = fmt(total);
}

// ─── Remove por índice (chamado pelos botões × dentro do drawer)
function removerIdx(idx) {
    const itens = lerSacola();
    itens.splice(idx, 1);
    salvarSacola(itens);
    atualizarContador();
    sincronizarBotoesFavorito();
    renderizarListaSacola();

    // Se estiver na página do produto, atualiza o botão de adicionar
    const btn = document.getElementById('btn-add-carrinho');
    if (btn && window.camisaAtual) {
        const id = `${window.camisaAtual.nome}|${window.camisaAtual.temporada}|${window.camisaAtual.modelo}`;
        if (!lerSacola().some(i => i.id === id)) {
            btn.textContent = 'Adicionar à sacola';
            btn.classList.remove('no-carrinho');
        }
    }
}

// ─── Envio pelo WhatsApp
function enviarFavoritosWhats() {
    const itens = lerSacola();
    if (!itens.length) { alert('Sua sacola está vazia!'); return; }
    const lista = itens.map((it, i) =>
        `${i + 1}. ${it.nome} — Tam. ${it.tamanho}`
    ).join('\n');
    const msg = `Olá! Gostaria de encomendar as seguintes camisas da 90+3:\n\n${lista}\n\nPoderia confirmar disponibilidade e valor total?`;
    window.open(`https://wa.me/5515991617508?text=${encodeURIComponent(msg)}`, '_blank');
}

// ─── Init
document.addEventListener('DOMContentLoaded', () => {
    garantirDrawerDOM();
    atualizarContador();
    sincronizarBotoesFavorito();
});
