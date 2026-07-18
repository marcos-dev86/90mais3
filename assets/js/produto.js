const API_URL = 'https://api-90mais3.vercel.app';

window.camisaAtual  = null;
let tamanhoSelecionado = null;
let fotoAtualIdx    = 0;
let fotosDisponiveis = [];

function obterIdDaURL() {
    return new URLSearchParams(window.location.search).get('id');
}

async function carregarProduto() {
    const id   = obterIdDaURL();
    const main = document.getElementById('produto-main');
    if (!id) {
        main.innerHTML = '<div class="produto-erro">Camisa não especificada.<br><a href="index.html" style="color:var(--gold)">Voltar ao catálogo</a></div>';
        return;
    }
    try {
        const res = await fetch(`${API_URL}/api/camisas/${id}`);
        if (res.status === 404) {
            main.innerHTML = '<div class="produto-erro">Camisa não encontrada.<br><a href="index.html" style="color:var(--gold)">Voltar ao catálogo</a></div>';
            return;
        }
        if (!res.ok) throw new Error('Falha');
        const camisa = await res.json();
        window.camisaAtual = camisa;
        renderizarProduto(camisa);
    } catch {
        main.innerHTML = '<div class="produto-erro">Erro ao carregar a camisa. Tente recarregar a página.</div>';
    }
}

function renderizarProduto(c) {
    const main         = document.getElementById('produto-main');
    const est          = c.estoque || {};
    const preco        = Number(c.preco).toFixed(2).split('.');
    const nomeCompleto = `${c.nome} ${c.temporada} - ${c.modelo}`;
    const idUnico      = `${c.nome}|${c.temporada}|${c.modelo}`;

    document.getElementById('pageTitle').textContent = `${nomeCompleto} | 90+3`;
    document.getElementById('pageDescription')
        .setAttribute('content', `Camisa ${c.nome} ${c.temporada}, ${c.modelo}. R$${preco[0]},${preco[1]} na 90+3.`);

    atualizarOpenGraph(c, nomeCompleto, `R$${preco[0]},${preco[1]}`);
    atualizarSchemaOrg(c, nomeCompleto);

    // Fotos disponíveis para o carrossel
    fotosDisponiveis = [];
    if (c.foto_frente) fotosDisponiveis.push({ src: c.foto_frente, label: 'Frente' });
    if (c.foto_costas) fotosDisponiveis.push({ src: c.foto_costas, label: 'Costas' });
    fotoAtualIdx = 0;

    // Bloco de preço
    let precoHTML;
    if (c.preco_original && Number(c.preco_original) > Number(c.preco)) {
        const orig = Number(c.preco_original).toFixed(2).replace('.', ',');
        precoHTML = `<div class="produto-preco-bloco">
            <span class="produto-preco-de">De R$${orig}</span>
            <span class="produto-preco">R$${preco[0]}<small>,${preco[1]}</small></span>
        </div>`;
    } else {
        precoHTML = `<div class="produto-preco-bloco">
            <span class="produto-preco">R$${preco[0]}<small>,${preco[1]}</small></span>
        </div>`;
    }

    const seloHTML = c.selo_promocional
        ? `<span class="produto-selo">${escaparHTML(c.selo_promocional)}</span>` : '';

    // Badges de tamanho
    const tamanhosHTML = ['P', 'M', 'G', 'GG'].map(t => {
        const qtd  = Number(est[t] ?? 0);
        const disp = qtd > 0;
        const cls  = disp ? 'disponivel' : 'esgotado';
        return `<span class="tamanho-badge ${cls}"
                      data-tamanho="${t}" data-disponivel="${disp}"
                      role="button" tabindex="0"
                      aria-label="${disp ? 'Selecionar tamanho ' + t : 'Tamanho ' + t + ' esgotado'}"
                      onclick="selecionarTamanho('${t}', ${disp})"
                      onkeydown="if(event.key==='Enter'||event.key===' ')selecionarTamanho('${t}',${disp})">${t}</span>`;
    }).join('');

    const descHTML = c.descricao && c.descricao.trim()
        ? `<p class="produto-descricao">${escaparHTML(c.descricao)}</p>` : '';

    const jaNC = itemEstaNoCarrinho(idUnico);

    // Thumbnails
    const thumbsHTML = fotosDisponiveis.map((f, i) => `
        <div class="produto-thumb ${i === 0 ? 'ativa' : ''}" id="thumb-${i}" onclick="irParaFoto(${i})" role="button" tabindex="0" aria-label="${f.label}">
            <img src="${f.src}" alt="${f.label}" loading="lazy">
        </div>`).join('');

    // Setas só aparecem se houver 2 fotos
    const setasHTML = fotosDisponiveis.length > 1 ? `
        <button class="foto-seta foto-seta-esq" onclick="navegarFoto(-1)" aria-label="Foto anterior">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="foto-seta foto-seta-dir" onclick="navegarFoto(1)" aria-label="Próxima foto">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>` : '';

    const msgWpp = encodeURIComponent(`Olá, tenho interesse na camisa ${c.nome} ${c.temporada} - ${c.modelo}`);

    main.innerHTML = `
        <a href="index.html#catalogo" class="produto-voltar">&larr; Voltar ao catálogo</a>
        <div class="produto-grid">
            <div class="produto-galeria">
                <div class="produto-imagem-principal" id="img-container">
                    <img id="img-principal" src="${fotosDisponiveis[0]?.src || ''}" alt="${nomeCompleto}">
                    <div id="zoom-overlay" class="zoom-overlay" aria-hidden="true"></div>
                    ${setasHTML}
                </div>
                <div class="produto-thumbs">${thumbsHTML}</div>
            </div>

            <div class="produto-info">
                ${seloHTML}
                <h1>${c.nome}</h1>
                <p class="produto-temporada">${c.temporada} · ${c.modelo}</p>
                ${precoHTML}

                <div class="produto-tamanhos-label">Selecione o tamanho <span class="tam-obrigatorio">*</span></div>
                <div class="produto-tamanhos" id="bloco-tamanhos" aria-label="Tamanhos disponíveis">${tamanhosHTML}</div>
                <p class="produto-tamanho-aviso" id="aviso-tamanho" role="alert"></p>

                ${descHTML}

                <div class="produto-acoes">
                    <button class="produto-add-carrinho ${jaNC ? 'no-carrinho' : ''}" id="btn-add-carrinho"
                            onclick="adicionarAoCarrinho()">
                        ${jaNC ? 'Remover da sacola' : 'Adicionar à sacola'}
                    </button>
                </div>

                <a class="produto-comprar"
                   href="https://wa.me/5515991617508?text=${msgWpp}"
                   target="_blank" rel="noopener noreferrer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Comprar no WhatsApp
                </a>

                <button class="produto-compartilhar" id="btn-compartilhar" onclick="compartilharProduto()" aria-label="Compartilhar essa camisa">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    <span id="btn-compartilhar-texto">Compartilhar</span>
                </button>

                <div class="produto-badges-extra">
                    <span class="produto-badge-extra">5% OFF à vista</span>
                    <span class="produto-badge-extra">3x sem juros</span>
                    <span class="produto-badge-extra">Entrega em até 5 dias</span>
                </div>
            </div>
        </div>
        ${montarRelacionadas(c.relacionadas || [])}`;

    inicializarZoom();
    atualizarContador();
    sincronizarBotoesFavorito();
}

// ── Navega entre fotos (setas) ─────────────────────────────────
function navegarFoto(dir) {
    if (fotosDisponiveis.length < 2) return;
    irParaFoto((fotoAtualIdx + dir + fotosDisponiveis.length) % fotosDisponiveis.length);
}

function irParaFoto(idx) {
    fotoAtualIdx = idx;
    const img     = document.getElementById('img-principal');
    const overlay = document.getElementById('zoom-overlay');
    if (img && fotosDisponiveis[idx]) {
        img.src = fotosDisponiveis[idx].src;
        if (overlay) overlay.style.backgroundImage = `url('${fotosDisponiveis[idx].src}')`;
    }
    document.querySelectorAll('.produto-thumb').forEach((th, i) =>
        th.classList.toggle('ativa', i === idx));
}

// ── Zoom ao passar o mouse ─────────────────────────────────────
function inicializarZoom() {
    const container = document.getElementById('img-container');
    const img       = document.getElementById('img-principal');
    const overlay   = document.getElementById('zoom-overlay');
    if (!container || !img || !overlay) return;

    overlay.style.backgroundImage  = `url('${img.src}')`;
    overlay.style.backgroundSize   = '260%';
    overlay.style.backgroundRepeat = 'no-repeat';

    container.addEventListener('mouseenter', () => { overlay.style.opacity = '1'; });
    container.addEventListener('mouseleave', () => { overlay.style.opacity = '0'; });
    container.addEventListener('mousemove',  e => {
        const r = container.getBoundingClientRect();
        const x = ((e.clientX - r.left)  / r.width)  * 100;
        const y = ((e.clientY - r.top)   / r.height) * 100;
        overlay.style.backgroundPosition = `${x}% ${y}%`;
    });

    img.addEventListener('load', () => {
        overlay.style.backgroundImage = `url('${img.src}')`;
    });
}

// ── Seleciona tamanho ─────────────────────────────────────────
function selecionarTamanho(tam, disponivel) {
    const aviso = document.getElementById('aviso-tamanho');
    if (!disponivel) {
        if (aviso) { aviso.textContent = `Tamanho ${tam} está esgotado no momento.`; aviso.className = 'produto-tamanho-aviso aviso-erro'; }
        return;
    }
    tamanhoSelecionado = tam;
    if (aviso) { aviso.textContent = ''; aviso.className = 'produto-tamanho-aviso'; }
    document.querySelectorAll('.produto-tamanhos .tamanho-badge').forEach(el =>
        el.classList.toggle('selecionado', el.dataset.tamanho === tam));
}

// ── Adiciona à sacola — OBRIGATÓRIO ter tamanho selecionado ───
function adicionarAoCarrinho() {
    const c = window.camisaAtual;
    if (!c) return;

    const idUnico = `${c.nome}|${c.temporada}|${c.modelo}`;
    const btn     = document.getElementById('btn-add-carrinho');
    const aviso   = document.getElementById('aviso-tamanho');

    // Se já está na sacola → remove
    if (itemEstaNoCarrinho(idUnico)) {
        removerPorId(idUnico);
        if (btn) { btn.textContent = 'Adicionar à sacola'; btn.classList.remove('no-carrinho'); }
        if (aviso) { aviso.textContent = ''; aviso.className = 'produto-tamanho-aviso'; }
        return;
    }

    // Sem tamanho → bloqueia com mensagem e animação
    if (!tamanhoSelecionado) {
        if (aviso) {
            aviso.textContent = 'Selecione um tamanho antes de adicionar à sacola.';
            aviso.className   = 'produto-tamanho-aviso aviso-erro aviso-shake';
            setTimeout(() => aviso.classList.remove('aviso-shake'), 500);
        }
        const bloco = document.getElementById('bloco-tamanhos');
        if (bloco) {
            bloco.classList.add('shake');
            setTimeout(() => bloco.classList.remove('shake'), 500);
        }
        return;
    }

    // Tudo certo — adiciona
    const nomeFull = `${c.nome} ${c.temporada} - ${c.modelo} (Tam. ${tamanhoSelecionado})`;
    adicionarNaSacola(idUnico, nomeFull, tamanhoSelecionado, c.preco, c.foto_frente);
    if (btn) { btn.textContent = 'Remover da sacola'; btn.classList.add('no-carrinho'); }
    if (aviso) { aviso.textContent = ''; aviso.className = 'produto-tamanho-aviso'; }
    setTimeout(() => abrirModalFavoritos(), 150);
}

function montarRelacionadas(lista) {
    if (!lista.length) return '';
    const cards = lista.map(c => {
        const preco = Number(c.preco).toFixed(2).split('.');
        return `<a href="produto.html?id=${c.id}" class="card" style="text-decoration:none;color:inherit;display:block">
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
    return `<section class="relacionadas-section">
        <h2 class="relacionadas-titulo">Você também pode gostar</h2>
        <div class="relacionadas-grid">${cards}</div>
    </section>`;
}

function escaparHTML(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

// ─── Open Graph — atualiza os valores pra quem SIM executa JS (o próprio
// Google, por exemplo). WhatsApp/Instagram/Facebook geralmente não executam
// JS ao montar a prévia do link, então eles continuam vendo os valores
// estáticos que já estão no <head> do produto.html. ────────────────────
function atualizarOpenGraph(c, nomeCompleto, precoFormatado) {
    const titulo   = `${nomeCompleto} | 90+3`;
    const desc     = `Camisa ${nomeCompleto}, ${precoFormatado} na 90+3 — camisas tailandesas com qualidade até o fim.`;
    const imagem   = c.foto_frente || 'https://90mais3.vercel.app/assets/img/logo.webp';
    const url      = window.location.href;

    const set = (id, valor) => { const el = document.getElementById(id); if (el) el.setAttribute('content', valor); };
    set('ogTitle', titulo);
    set('ogDescription', desc);
    set('ogImage', imagem);
    set('ogUrl', url);
    set('twitterTitle', titulo);
    set('twitterDescription', desc);
    set('twitterImage', imagem);
}

// ─── Schema.org (dados estruturados) — informa preço, disponibilidade e
// imagem num formato que o Google entende, pra tentar exibir resultado
// rico (preço/estoque) direto na busca. O Google executa JS ao indexar,
// então isso funciona mesmo sendo montado aqui. ────────────────────────
function atualizarSchemaOrg(c, nomeCompleto) {
    let script = document.getElementById('schema-produto');
    if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'schema-produto';
        document.head.appendChild(script);
    }

    const disponivel = Object.values(c.estoque || {}).some(q => Number(q) > 0);

    const dados = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: nomeCompleto,
        image: [c.foto_frente, c.foto_costas].filter(Boolean),
        description: `Camisa ${nomeCompleto}, tailandesa premium.`,
        brand: { '@type': 'Brand', name: '90+3 Camisas Tailandesas' },
        offers: {
            '@type': 'Offer',
            url: window.location.href,
            priceCurrency: 'BRL',
            price: Number(c.preco).toFixed(2),
            availability: disponivel ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition'
        }
    };

    script.textContent = JSON.stringify(dados);
}

// ─── Compartilhar — usa o menu nativo do celular quando existe; no
// desktop (ou navegador sem suporte) copia o link pra área de transferência. ──
function compartilharProduto() {
    const c = window.camisaAtual;
    if (!c) return;

    const nomeCompleto = `${c.nome} ${c.temporada} - ${c.modelo}`;
    const url   = window.location.href;
    const texto = `Olha essa ${nomeCompleto} que achei na 90+3! 🔥`;

    if (navigator.share) {
        navigator.share({ title: `${nomeCompleto} | 90+3`, text: texto, url }).catch(() => {});
        return;
    }

    if (navigator.clipboard) {
        navigator.clipboard.writeText(url)
            .then(mostrarFeedbackCompartilhar)
            .catch(() => window.open(`https://wa.me/?text=${encodeURIComponent(texto + ' ' + url)}`, '_blank'));
        return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(texto + ' ' + url)}`, '_blank');
}

function mostrarFeedbackCompartilhar() {
    const texto = document.getElementById('btn-compartilhar-texto');
    if (!texto) return;
    const original = texto.textContent;
    texto.textContent = '✓ Link copiado!';
    setTimeout(() => { texto.textContent = original; }, 2000);
}

document.addEventListener('DOMContentLoaded', carregarProduto);
