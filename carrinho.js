// ════════════════════════════════════════════════════════════════
//  carrinho.js — Sacola compartilhada entre index.html e produto.html
//  Modal elegante com seleção de tamanho por item, tom cinza/branco.
// ════════════════════════════════════════════════════════════════

const CHAVE_SACOLA = '90mais3_sacola';

// ── Estrutura de cada item: { id, nome, tamanho, preco, foto, quantidade }

function lerSacola() {
    try { return JSON.parse(localStorage.getItem(CHAVE_SACOLA)) || []; }
    catch { return []; }
}
function salvarSacola(itens) {
    localStorage.setItem(CHAVE_SACOLA, JSON.stringify(itens));
}

// ── Verifica se camisa (por id+tamanho) está na sacola
function itemEstaNoCarrinho(idUnico, tamanho) {
    return lerSacola().some(i => i.id === idUnico && i.tamanho === (tamanho || ''));
}

// ── Adiciona ou remove da sacola — retorna true se adicionou
function alternarItemCarrinho(idUnico, nomeCompleto, tamanho, preco, foto) {
    const itens = lerSacola();
    const tam = tamanho || '';
    const idx = itens.findIndex(i => i.id === idUnico && i.tamanho === tam);
    if (idx === -1) {
        itens.push({ id: idUnico, nome: nomeCompleto, tamanho: tam, preco: preco || 0, foto: foto || '', quantidade: 1 });
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

// ── Botão de coração nos cards do catálogo
function alternarFavorito(btn) {
    const idUnico = btn.dataset.id;
    const nome    = btn.dataset.nome;
    const preco   = btn.dataset.preco || 0;
    const foto    = btn.dataset.foto  || '';
    // No catálogo, tamanho ainda não escolhido: abre sacola para o usuário
    const jaEsta  = lerSacola().some(i => i.id === idUnico);
    if (jaEsta) {
        // remove todos os tamanhos desse item
        const novos = lerSacola().filter(i => i.id !== idUnico);
        salvarSacola(novos);
        btn.classList.remove('ativo');
        btn.setAttribute('aria-pressed', 'false');
        atualizarContador();
        sincronizarBotoesFavorito();
    } else {
        // Adiciona sem tamanho definido (usuário pode editar na sacola)
        alternarItemCarrinho(idUnico, nome, '', preco, foto);
        btn.classList.add('ativo');
        btn.setAttribute('aria-pressed', 'true');
        sincronizarBotoesFavorito();
        // Abre modal para o usuário escolher tamanho
        setTimeout(() => abrirModalFavoritos(), 150);
    }
}

// ── Contador no ícone de sacola
function atualizarContador() {
    const el = document.getElementById('contador-fav');
    if (!el) return;
    const qtd = lerSacola().length;
    el.textContent = qtd;
    el.style.display = '';
}

function sincronizarBotoesFavorito() {
    const sacola = lerSacola();
    document.querySelectorAll('.btn-fav').forEach(btn => {
        const ativo = sacola.some(i => i.id === btn.dataset.id);
        btn.classList.toggle('ativo', ativo);
        btn.setAttribute('aria-pressed', ativo ? 'true' : 'false');
    });
}

// ── Abre/fecha o modal lateral (drawer)
function abrirModalFavoritos() {
    garantirModalDOM();
    renderizarListaSacola();
    const modal = document.getElementById('modal-favoritos');
    const drawer = document.getElementById('sacola-drawer');
    if (!modal || !drawer) return;
    modal.classList.add('open');
    drawer.classList.add('aberto');
    document.body.style.overflow = 'hidden';
}

function fecharModalFavoritos() {
    const modal = document.getElementById('modal-favoritos');
    const drawer = document.getElementById('sacola-drawer');
    if (!modal || !drawer) return;
    drawer.classList.remove('aberto');
    setTimeout(() => {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }, 320);
}

// ── Garante que o HTML do modal/drawer exista no DOM
function garantirModalDOM() {
    if (document.getElementById('sacola-drawer')) return;

    // Cria o overlay + drawer do lado direito
    const modal = document.getElementById('modal-favoritos');
    if (!modal) return;

    modal.innerHTML = `
        <div id="sacola-drawer" role="dialog" aria-modal="true" aria-labelledby="sacola-titulo">
            <div class="sacola-header">
                <div class="sacola-logo"><span class="logo-accent">90</span><span class="logo-plus">+3</span></div>
                <h3 id="sacola-titulo">Minha Sacola</h3>
                <button class="sacola-close" onclick="fecharModalFavoritos()" aria-label="Fechar sacola">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div class="sacola-itens" id="lista-favoritos" aria-live="polite"></div>
            <div class="sacola-footer">
                <div class="sacola-total-row">
                    <span class="sacola-total-label">Total estimado</span>
                    <span class="sacola-total-valor" id="sacola-total">R$0,00</span>
                </div>
                <button class="sacola-btn-wpp" onclick="enviarFavoritosWhats()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Pedir pelo WhatsApp
                </button>
                <p class="sacola-aviso">Confirme disponibilidade de tamanhos com a loja</p>
            </div>
        </div>
    `;
}

// ── Renderiza a lista de itens no drawer
function renderizarListaSacola() {
    const lista = document.getElementById('lista-favoritos');
    const totalEl = document.getElementById('sacola-total');
    if (!lista) return;

    const itens = lerSacola();

    if (!itens.length) {
        lista.innerHTML = `
            <div class="sacola-vazia">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                <p>Sua sacola está vazia.</p>
                <small>Clique no ❤ de uma camisa para adicionar.</small>
            </div>`;
        if (totalEl) totalEl.textContent = 'R$0,00';
        return;
    }

    const TAMANHOS = ['P', 'M', 'G', 'GG'];

    lista.innerHTML = itens.map((item, idx) => {
        const fotoHTML = item.foto
            ? `<img src="${item.foto}" alt="${item.nome}" loading="lazy">`
            : `<div class="sacola-item-sem-foto">90+3</div>`;

        const tamBtns = TAMANHOS.map(t => `
            <button class="sacola-tam-btn ${item.tamanho === t ? 'ativo' : ''}"
                    onclick="alterarTamanhoItem(${idx}, '${t}')"
                    aria-label="Tamanho ${t}" aria-pressed="${item.tamanho === t}">${t}</button>
        `).join('');

        const precoFmt = item.preco > 0
            ? `R$${Number(item.preco).toFixed(2).replace('.', ',')}`
            : '';

        return `
        <div class="sacola-item" data-idx="${idx}">
            <div class="sacola-item-foto">${fotoHTML}</div>
            <div class="sacola-item-info">
                <p class="sacola-item-nome">${item.nome}</p>
                <div class="sacola-item-tamanhos" aria-label="Escolher tamanho">${tamBtns}</div>
                ${item.tamanho ? '' : '<small class="sacola-tam-aviso">Escolha um tamanho</small>'}
                ${precoFmt ? `<p class="sacola-item-preco">${precoFmt}</p>` : ''}
            </div>
            <button class="sacola-item-remover" onclick="removerDaSacola(${idx})" aria-label="Remover ${item.nome}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>`;
    }).join('');

    // Total
    const total = itens.reduce((acc, i) => acc + (Number(i.preco) || 0) * (i.quantidade || 1), 0);
    if (totalEl) totalEl.textContent = total > 0 ? `R$${total.toFixed(2).replace('.', ',')}` : '—';
}

// ── Altera tamanho de um item na sacola (por índice)
function alterarTamanhoItem(idx, novoTamanho) {
    const itens = lerSacola();
    if (!itens[idx]) return;
    itens[idx].tamanho = novoTamanho;
    salvarSacola(itens);
    renderizarListaSacola();
}

// ── Remove item da sacola (por índice)
function removerDaSacola(idx) {
    const itens = lerSacola();
    itens.splice(idx, 1);
    salvarSacola(itens);
    atualizarContador();
    sincronizarBotoesFavorito();
    renderizarListaSacola();

    // Atualiza botão na página de produto, se estiver lá
    const btnCarrinho = document.getElementById('btn-add-carrinho');
    if (btnCarrinho && window.camisaAtual) {
        const idPagina = `${window.camisaAtual.nome}|${window.camisaAtual.temporada}|${window.camisaAtual.modelo}`;
        if (!lerSacola().some(i => i.id === idPagina)) {
            btnCarrinho.textContent = 'Adicionar à sacola';
            btnCarrinho.classList.remove('no-carrinho');
        }
    }
}

// ── Fecha ao clicar no overlay
document.addEventListener('click', function(e) {
    const modal = document.getElementById('modal-favoritos');
    if (modal && modal.classList.contains('open') && e.target === modal) {
        fecharModalFavoritos();
    }
});

// ── Envia lista para WhatsApp
function enviarFavoritosWhats() {
    const itens = lerSacola();
    if (!itens.length) {
        alert('Sua sacola está vazia. Adicione alguma camisa primeiro!');
        return;
    }
    const lista = itens.map((it, i) => {
        const tam = it.tamanho ? ` - Tam. ${it.tamanho}` : ' - (tamanho a definir)';
        return `${i + 1}. ${it.nome}${tam}`;
    }).join('\n');
    const msg = `Olá! Tenho interesse nas seguintes camisas da 90+3:\n\n${lista}\n\nPoderia me passar os detalhes e valor total?`;
    window.open(`https://wa.me/5515991617508?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── Init ao carregar
document.addEventListener('DOMContentLoaded', function () {
    garantirModalDOM();
    atualizarContador();
    sincronizarBotoesFavorito();
});
