const API_URL = 'https://api-90mais3.vercel.app';

let camisaAtual = null;
let tamanhoSelecionado = null;

// ── Lê o ID da camisa a partir da URL (?id=15) ────────────────
function obterIdDaURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ── Carrega os dados da camisa e monta a página ───────────────
async function carregarProduto() {
    const id = obterIdDaURL();
    const main = document.getElementById('produto-main');

    if (!id) {
        main.innerHTML = '<div class="produto-erro">Camisa não especificada.<br><a href="index.html" style="color:var(--gold)">Voltar ao catálogo</a></div>';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/camisas/${id}`);
        if (res.status === 404) {
            main.innerHTML = '<div class="produto-erro">Esta camisa não foi encontrada ou não está mais disponível.<br><a href="index.html" style="color:var(--gold)">Voltar ao catálogo</a></div>';
            return;
        }
        if (!res.ok) throw new Error('Falha ao buscar camisa');

        const camisa = await res.json();
        camisaAtual = camisa;
        renderizarProduto(camisa);
    } catch (err) {
        console.error(err);
        main.innerHTML = '<div class="produto-erro">Erro ao carregar a camisa. Tente recarregar a página.</div>';
    }
}

// ── Monta o HTML completo da página a partir dos dados ────────
function renderizarProduto(c) {
    const main = document.getElementById('produto-main');
    const est = c.estoque || {};
    const preco = Number(c.preco).toFixed(2).split('.');
    const nomeCompleto = `${c.nome} ${c.temporada} - ${c.modelo}`;
    const idUnico = `${c.nome}|${c.temporada}|${c.modelo}`;

    // Atualiza título e meta description da aba/SEO
    document.getElementById('pageTitle').textContent = `${nomeCompleto} | 90+3`;
    document.getElementById('pageDescription').setAttribute('content',
        `Camisa ${c.nome} ${c.temporada}, ${c.modelo}. Camisa tailandesa premium por R$${preco[0]},${preco[1]} na 90+3.`);

    // Bloco de preço — mostra "de/por" se houver preco_original (promoção)
    let precoHTML;
    if (c.preco_original && Number(c.preco_original) > Number(c.preco)) {
        const precoOriginal = Number(c.preco_original).toFixed(2).replace('.', ',');
        precoHTML = `
            <div class="produto-preco-bloco">
                <span class="produto-preco-de">De R$${precoOriginal}</span>
                <span class="produto-preco">R$${preco[0]}<small>,${preco[1]}</small></span>
            </div>`;
    } else {
        precoHTML = `
            <div class="produto-preco-bloco">
                <span class="produto-preco">R$${preco[0]}<small>,${preco[1]}</small></span>
            </div>`;
    }

    const seloHTML = c.selo_promocional
        ? `<span class="produto-selo">${escaparHTML(c.selo_promocional)}</span>`
        : '';

    const tamanhosHTML = ['P', 'M', 'G', 'GG'].map(t => {
        const qtd = Number(est[t] ?? 0);
        const cls = qtd > 0 ? 'disponivel' : 'esgotado';
        const label = qtd > 0 ? `Selecionar tamanho ${t}` : `Tamanho ${t} esgotado`;
        return `<span class="tamanho-badge ${cls}" data-tamanho="${t}" data-disponivel="${qtd > 0}"
                      role="button" tabindex="0" aria-label="${label}" onclick="selecionarTamanho('${t}', ${qtd > 0})">${t}</span>`;
    }).join('');

    const msgWpp = encodeURIComponent(`Olá, tenho interesse na camisa do ${c.nome} ${c.temporada} - ${c.modelo}`);

    const temDescricao = c.descricao && c.descricao.trim().length > 0;
    const descricaoHTML = temDescricao
        ? `<p class="produto-descricao">${escaparHTML(c.descricao)}</p>`
        : '';

    const jaNoCarrinho = itemEstaNoCarrinho(idUnico);
    const relacionadasHTML = montarRelacionadas(c.relacionadas || []);

    main.innerHTML = `
        <a href="index.html#catalogo" class="produto-voltar">&larr; Voltar ao catálogo</a>

        <div class="produto-grid">
            <div class="produto-galeria">
                <div class="produto-imagem-principal">
                    <img id="img-frente" src="${c.foto_frente}" alt="Camisa ${nomeCompleto} - frente">
                    <img id="img-costas" src="${c.foto_costas}" alt="Camisa ${nomeCompleto} - costas" class="escondida">
                </div>
                <div class="produto-thumbs">
                    <div class="produto-thumb ativa" id="thumb-frente" onclick="mostrarFoto('frente')">
                        <img src="${c.foto_frente}" alt="Frente">
                    </div>
                    <div class="produto-thumb" id="thumb-costas" onclick="mostrarFoto('costas')">
                        <img src="${c.foto_costas}" alt="Costas">
                    </div>
                </div>
            </div>

            <div class="produto-info">
                ${seloHTML}
                <h1>${c.nome}</h1>
                <p class="produto-temporada">${c.temporada} · ${c.modelo}</p>
                ${precoHTML}

                <div class="produto-tamanhos-label">Selecione o tamanho</div>
                <div class="produto-tamanhos" aria-label="Tamanhos disponíveis">${tamanhosHTML}</div>
                <p class="produto-tamanho-aviso" id="aviso-tamanho"></p>

                ${descricaoHTML}

                <div class="produto-acoes">
                    <button class="produto-add-carrinho ${jaNoCarrinho ? 'no-carrinho' : ''}" id="btn-add-carrinho"
                            onclick="adicionarAoCarrinho()">
                        ${jaNoCarrinho ? 'Remover da sacola' : 'Adicionar à sacola'}
                    </button>
                </div>

                <a class="produto-comprar"
                   href="https://wa.me/5515991617508?text=${msgWpp}"
                   target="_blank" rel="noopener noreferrer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Comprar no WhatsApp
                </a>

                <div class="produto-badges-extra">
                    <span class="produto-badge-extra">5% OFF à vista</span>
                    <span class="produto-badge-extra">3x sem juros</span>
                    <span class="produto-badge-extra">Entrega em até 5 dias</span>
                </div>
            </div>
        </div>

        ${relacionadasHTML}
    `;

    atualizarContador();
}

// ── Alterna entre foto de frente e costas ──────────────────────
function mostrarFoto(qual) {
    const imgFrente = document.getElementById('img-frente');
    const imgCostas = document.getElementById('img-costas');
    const thumbFrente = document.getElementById('thumb-frente');
    const thumbCostas = document.getElementById('thumb-costas');

    if (qual === 'frente') {
        imgFrente.classList.remove('escondida');
        imgCostas.classList.add('escondida');
        thumbFrente.classList.add('ativa');
        thumbCostas.classList.remove('ativa');
    } else {
        imgFrente.classList.add('escondida');
        imgCostas.classList.remove('escondida');
        thumbFrente.classList.remove('ativa');
        thumbCostas.classList.add('ativa');
    }
}

// ── Seleciona um tamanho (visual) ───────────────────────────────
function selecionarTamanho(tamanho, disponivel) {
    const aviso = document.getElementById('aviso-tamanho');

    if (!disponivel) {
        aviso.textContent = `Tamanho ${tamanho} está esgotado no momento.`;
        return;
    }

    tamanhoSelecionado = tamanho;
    aviso.textContent = '';

    document.querySelectorAll('.produto-tamanhos .tamanho-badge').forEach(el => {
        el.classList.toggle('selecionado', el.dataset.tamanho === tamanho);
    });
}

// ── Adiciona ou remove a camisa atual da sacola ─────────────────
function adicionarAoCarrinho() {
    if (!camisaAtual) return;

    const idUnico = `${camisaAtual.nome}|${camisaAtual.temporada}|${camisaAtual.modelo}`;
    const tamanhoTexto = tamanhoSelecionado ? ` (Tam. ${tamanhoSelecionado})` : '';
    const nomeCompleto = `${camisaAtual.nome} ${camisaAtual.temporada} - ${camisaAtual.modelo}${tamanhoTexto}`;

    const acabouDeAdicionar = alternarItemCarrinho(idUnico, nomeCompleto);

    const btn = document.getElementById('btn-add-carrinho');
    if (acabouDeAdicionar) {
        btn.textContent = 'Remover da sacola';
        btn.classList.add('no-carrinho');
    } else {
        btn.textContent = 'Adicionar à sacola';
        btn.classList.remove('no-carrinho');
    }
}

// ── Monta a seção de camisas relacionadas ──────────────────────
function montarRelacionadas(lista) {
    if (!lista.length) return '';

    const cards = lista.map(c => {
        const preco = Number(c.preco).toFixed(2).split('.');
        return `
            <a href="produto.html?id=${c.id}" class="card" style="text-decoration:none;color:inherit;display:block">
                <div class="imagem-container" style="pointer-events:none">
                    <picture><img src="${c.foto_frente}" alt="${c.nome}" class="foto-frente" loading="lazy" width="400" height="270"></picture>
                </div>
                <div class="card-info">
                    <div class="card-header-row">
                        <h3>${c.nome}</h3>
                        <span class="preco">R$${preco[0]}<small>,${preco[1]}</small></span>
                    </div>
                    <p class="temporada">${c.temporada} · ${c.modelo}</p>
                </div>
            </a>`;
    }).join('');

    return `
        <section class="relacionadas-section">
            <h2 class="relacionadas-titulo">Você também pode gostar</h2>
            <div class="relacionadas-grid">${cards}</div>
        </section>`;
}

// ── Evita que a descrição quebre o HTML se tiver caracteres especiais ──
function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', carregarProduto);
