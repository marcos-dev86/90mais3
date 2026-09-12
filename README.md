# 90+3 E-commerce de Camisas de Futebol

**Catálogo digital desenvolvido para uma operação comercial real, com foco em experiência do usuário, conversão e presença digital.**

[![Website](https://img.shields.io/badge/Website-90%2B3-111827?style=for-the-badge&logo=vercel)](https://90mais3.vercel.app)
[![Repositório](https://img.shields.io/badge/GitHub-Repositorio-181717?style=for-the-badge&logo=github)](https://github.com/marcos-dev86/90mais3)

---

## Visão geral

O **90+3** é uma plataforma web de catálogo para uma loja de camisas de futebol premium, desenvolvida para atender clientes de Itapetininga e região.

O projeto foi construído com uma abordagem orientada a produto. Além da apresentação do catálogo, a aplicação conduz o usuário até o contato comercial pelo WhatsApp, combinando interface responsiva, desenvolvimento frontend, SEO técnico, dados estruturados e deploy em produção.

O conceito visual e o naming são inspirados nos minutos de acréscimo do futebol, o momento em que cada lance pode decidir o resultado.

## Funcionalidades

* Catálogo de produtos com fotos organizadas por coleção e lote.
* Página de produto carregada dinamicamente, consumindo dados de uma API externa.
* Sacola de compras persistida no navegador, sem depender de conta ou login.
* Sistema de cupom de desconto, validado contra a API antes de ser aplicado.
* Finalização de pedido integrada ao WhatsApp da loja, com o resumo da compra já preenchido.
* Aviso de cookies e página própria de política de privacidade.
* Suporte a instalação como aplicativo (manifest e ícones para PWA).

## Stack

| Tecnologia     | Aplicação                                     |
| -------------- | ---------------------------------------------- |
| HTML5          | Estrutura semântica das páginas               |
| CSS3           | Layout, responsividade e apresentação visual   |
| JavaScript     | Interatividade, carrinho e integração com a API |
| JSON LD / Schema.org | Dados estruturados e SEO               |
| Git / GitHub   | Versionamento do código                        |
| Vercel         | Deploy, hospedagem e cabeçalhos de segurança   |

Este repositório contém apenas o frontend. Os dados de produto e a validação de cupons são fornecidos por uma API própria, hospedada separadamente, responsável pela regra de negócio e pelo acesso ao banco de dados.

## Segurança do frontend

Mesmo sendo um site estático, o projeto aplica um conjunto de cabeçalhos HTTP de segurança configurados no `vercel.json`:

* Content Security Policy restringindo de onde scripts, estilos e conexões podem ser carregados.
* HTTP Strict Transport Security, forçando HTTPS em todas as requisições.
* Proteção contra clickjacking e contra MIME sniffing.
* Referrer Policy e Permissions Policy restritivos.

Nenhuma credencial, chave de API ou variável sensível é armazenada no cliente. Toda a comunicação com o backend acontece via HTTPS, e a lógica de validação (como regras de cupom) é decidida no servidor, não no navegador.

## SEO e presença digital

O projeto foi estruturado para funcionar não apenas como uma interface visual, mas como uma aplicação preparada para indexação, compartilhamento e aquisição orgânica.

Implementações realizadas:

* Meta title e meta description por página.
* Open Graph e Twitter Cards.
* Dados estruturados `SportingGoodsStore`, `ClothingStore` e `WebSite`.
* Informações estruturadas de localização e área de atendimento.
* Sitemap XML e robots.txt.
* Preconnect para os domínios externos usados pela página.

## Fluxo da aplicação

```
Descoberta
    ↓
Navegação pelo catálogo
    ↓
Visualização do produto
    ↓
Interesse
    ↓
Contato via WhatsApp
    ↓
Atendimento comercial
```

O frontend foi pensado como parte do processo comercial, reduzindo a distância entre a descoberta do produto e o contato com a loja.

## Estrutura do projeto

```
90mais3/
├── Camisas/                      # Imagens dos produtos, organizadas por coleção
├── src/
│   ├── css/                      # Estilos, incluindo versão minificada
│   ├── img/                      # Ícones e logotipo
│   └── js/                       # Lógica do frontend: produto, carrinho e cookies
├── index.html                    # Página principal / catálogo
├── produto.html                  # Página de produto
├── politica-de-privacidade.html  # Política de privacidade
├── site.webmanifest              # Configuração de instalação como app
├── robots.txt                    # Diretivas para mecanismos de busca
├── sitemap.xml                   # URLs para indexação
├── llms.txt                      # Contexto estruturado do projeto
├── vercel.json                   # Deploy e cabeçalhos de segurança
└── README.md
```

## Objetivos do projeto

O desenvolvimento teve como principais objetivos:

* Criar uma presença digital profissional para a marca.
* Disponibilizar um catálogo acessível em dispositivos móveis.
* Estruturar corretamente as páginas para mecanismos de busca.
* Facilitar o contato entre cliente e negócio.
* Aplicar boas práticas de frontend e de segurança em um cenário real.
* Publicar e manter a aplicação em produção, integrada a uma API própria.

## Resultado

O 90+3 está publicado em produção e representa um projeto desenvolvido para um cenário comercial real, com tráfego e vendas reais.

Demonstra aplicação prática de conhecimentos em:

**Frontend · UI/UX · Responsividade · SEO · Performance web · Integração com API · Segurança · Deploy**

## Links

* Website: <https://90mais3.vercel.app>
* Repositório: <https://github.com/marcos-dev86/90mais3>
* Instagram: <https://instagram.com/90mais3.itape>
* WhatsApp: <https://wa.me/5515991617508>

---

**90+3 — Qualidade até o fim.**

Desenvolvido por [Marcos Dev](https://github.com/marcos-dev86)
