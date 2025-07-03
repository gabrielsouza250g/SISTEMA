// ==== ARQUIVO: script.js (Correções para Login e Gerenciar Produtos) ====

const API_PREFIX_CLIENT = '/api'; 

let globalUserStatus = { logado: false, nome: null, tipo: null, email: null }; // Adicionado email ao status global
let todasAsCategoriasGlobais = []; 
let todosOsProdutosIndex = []; 
let todosOsProdutosHome = []; 
let todosOsProdutosCardapio = []; 

// --- Funções Auxiliares de Validação (Frontend) ---
function isValidEmailUnifucampClient(email) {
  if (!email || typeof email !== 'string') return false;
  return email.toLowerCase().endsWith('@unifucamp.edu.br');
}

function isStrongPasswordClient(password, errorElementId) {
  const passwordErrorEl = document.getElementById(errorElementId); 
  let errorMessage = '';

  if (!password || password.length < 8) {
    errorMessage = 'A senha deve ter no mínimo 8 caracteres.';
  } else if (!/[a-zA-Z]/.test(password)) {
    errorMessage = 'A senha deve conter pelo menos uma letra.';
  } else if (!/[0-9]/.test(password)) {
    errorMessage = 'A senha deve conter pelo menos um número.';
  }

  if (passwordErrorEl) {
    passwordErrorEl.textContent = errorMessage;
    passwordErrorEl.style.display = errorMessage ? 'block' : 'none';
  } else if (errorMessage && errorElementId) {
    console.warn(`Elemento de erro de senha com ID '${errorElementId}' não encontrado na página atual. Mensagem: ${errorMessage}`);
  }
  return errorMessage === '';
}

// --- Máscara de Telefone ---
function formatPhoneNumber(input) {
  let value = input.value.replace(/\D/g, ''); 
  value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); 
  value = value.replace(/(\d{5})(\d)/, '$1-$2');    
  input.value = value.substring(0, 15); 
}

// --- Lógica de Navegação, UI e Proteção de Páginas ---
function updateUserAuthLinks() {
    const { logado, nome, tipo } = globalUserStatus;
    const mainNav = document.getElementById('mainNav');
    const userAuthLinksIndex = document.getElementById('userAuthLinksIndex');
    const userAuthLinksCardapio = document.getElementById('userAuthLinks'); 

    let targetAuthContainer = null;
    const currentPage = window.location.pathname;

    if (currentPage.endsWith('/') || currentPage.endsWith('index.html')) {
        targetAuthContainer = userAuthLinksIndex;
    } else if (currentPage.includes('cardapio.html')) {
        targetAuthContainer = userAuthLinksCardapio;
    }
    
    // Limpa apenas os itens dinâmicos criados anteriormente
    mainNav?.querySelectorAll('.dynamic-auth-item').forEach(el => el.remove());
    if (userAuthLinksIndex) userAuthLinksIndex.innerHTML = '';
    if (userAuthLinksCardapio) userAuthLinksCardapio.innerHTML = '';

    const loginLinkStatic = mainNav ? mainNav.querySelector('a[href="login.html"]:not(.dynamic-auth-item)') : null;
    const registerLinkStatic = mainNav ? mainNav.querySelector('a[href="register.html"].button-cta:not(.dynamic-auth-item)') : null;
    const sairBtnStatic = mainNav ? mainNav.querySelector('a.sair-btn:not(.dynamic-auth-item)') : null;
    const perfilClienteLinkStatic = mainNav ? mainNav.querySelector('a[href="perfil.html"]:not([href="admin-perfil.html"]):not(.dynamic-auth-item)') : null;
    const perfilAdminLinkStatic = mainNav ? mainNav.querySelector('a[href="admin-perfil.html"]:not(.dynamic-auth-item)') : null;
    const painelAdminLinkStatic = mainNav ? mainNav.querySelector('a[href="administracao.html"].nav-link:not(.dynamic-auth-item)') : null;
    const cardapioClienteLinkStatic = mainNav ? mainNav.querySelector('a[href="home.html"].nav-link.active:not(.dynamic-auth-item)') : null; // Se o link de cardapio na home for para home.html

    if (logado) {
        if(loginLinkStatic) loginLinkStatic.style.display = 'none';
        if(registerLinkStatic) registerLinkStatic.style.display = 'none';
        if(sairBtnStatic) sairBtnStatic.style.display = 'inline-block';

        if (tipo === 'cliente') {
            if(perfilClienteLinkStatic) perfilClienteLinkStatic.style.display = 'inline-block';
            if(painelAdminLinkStatic) painelAdminLinkStatic.style.display = 'none'; // Esconde link de admin para cliente
            if(perfilAdminLinkStatic) perfilAdminLinkStatic.style.display = 'none';
        } else if (tipo === 'funcionario') {
            if(perfilAdminLinkStatic) perfilAdminLinkStatic.style.display = 'inline-block';
            if(painelAdminLinkStatic) painelAdminLinkStatic.style.display = 'inline-block'; // Garante que painel admin seja visível
            if(perfilClienteLinkStatic) perfilClienteLinkStatic.style.display = 'none'; // Esconde perfil de cliente para admin
            if(cardapioClienteLinkStatic) cardapioClienteLinkStatic.style.display = 'none'; // Admin não deve ver "Cardápio" como cliente
        }
        
        if (targetAuthContainer) { // Para index.html e cardapio.html
            targetAuthContainer.innerHTML = `
                <span class="nav-link dynamic-auth-item" style="margin-right: 1rem;">Olá, <strong>${nome}!</strong></span>
                <a href="${tipo === 'funcionario' ? 'administracao.html' : 'home.html'}" class="nav-link dynamic-auth-item">Meu Painel</a>
                <a href="${tipo === 'funcionario' ? 'admin-perfil.html' : 'perfil.html'}" class="nav-link dynamic-auth-item">Meu Perfil</a>
                <a href="#" class="nav-link sair-btn dynamic-auth-item" onclick="logout()">Sair</a>
            `;
        } else if (mainNav) { // Para outras páginas
            const boasVindasEl = document.getElementById('boasVindas');
            const emailUsuarioEl = document.getElementById('emailUsuario');
            if (boasVindasEl) boasVindasEl.innerHTML = `Olá, <strong>${nome}!</strong>`;
            if (emailUsuarioEl) emailUsuarioEl.innerHTML = `Logado como: <strong>${nome}</strong> (${globalUserStatus.email || ''})`;
        }

    } else { // Não logado
        if(loginLinkStatic) loginLinkStatic.style.display = 'inline-block';
        if(registerLinkStatic) registerLinkStatic.style.display = 'inline-block';
        if(sairBtnStatic) sairBtnStatic.style.display = 'none';
        if(perfilClienteLinkStatic) perfilClienteLinkStatic.style.display = 'none';
        if(perfilAdminLinkStatic) perfilAdminLinkStatic.style.display = 'none';
        if(painelAdminLinkStatic) painelAdminLinkStatic.style.display = 'none';
        // Se estiver no index ou cardapio e tiver o span dedicado
        if (targetAuthContainer) {
            targetAuthContainer.innerHTML = `
                <a href="login.html" class="nav-link dynamic-auth-item">Entrar</a>
                <a href="register.html" class="button-cta dynamic-auth-item">Criar Conta</a>
            `;
        }
    }
}


async function checkLoginStatusAndSetupPage() {
    try {
        const response = await fetch(`${API_PREFIX_CLIENT}/status`);
        if (!response.ok) {
            console.warn("Erro na resposta do /status:", response.status, response.statusText);
            globalUserStatus = { logado: false, nome: null, tipo: null, email: null };
        } else {
            globalUserStatus = await response.json();
        }
    } catch (error) {
        console.error("Erro ao verificar status da sessão:", error);
        globalUserStatus = { logado: false, nome: null, tipo: null, email: null };
    }

    updateUserAuthLinks();
    handlePageAccess();   // Chama handlePageAccess sempre para redirecionar se necessário.

    const currentPage = window.location.pathname;
    if (typeof carregarDadosIndex === "function" && (currentPage.endsWith('/') || currentPage.endsWith('index.html'))) {
        await carregarDadosIndex(); 
    } else if (typeof carregarDadosHome === "function" && currentPage.includes('home.html')) {
        if (globalUserStatus.logado && globalUserStatus.tipo === 'cliente') {
            await carregarDadosHome(); 
        }
    } else if (typeof carregarDadosCardapio === "function" && currentPage.includes('cardapio.html')) {
        await carregarDadosCardapio(); 
    }
    
    const nomeUsuarioHeroEl = document.getElementById('nomeUsuarioHero');
    if (nomeUsuarioHeroEl) {
        if (globalUserStatus.logado && (currentPage.includes('home.html') || currentPage.includes('cardapio.html'))) {
            nomeUsuarioHeroEl.textContent = globalUserStatus.nome;
        } else if (currentPage.includes('cardapio.html')) {
            nomeUsuarioHeroEl.textContent = "Visitante";
        } else if (!currentPage.includes('home.html') && !currentPage.includes('index.html')) { // Evita limpar o H1 do index hero
             nomeUsuarioHeroEl.textContent = "";
        }
    }
    return globalUserStatus; 
}

function handlePageAccess() {
    const { logado, tipo } = globalUserStatus;
    const currentPage = window.location.pathname;
    const userSpecificPages = ["/home.html", "/perfil.html"];
    const adminSpecificPages = [
        "/administracao.html", 
        "/cadastrar-funcionario.html", 
        "/gerenciar-categorias.html", 
        "/gerenciar-produtos.html", 
        "/controle-estoque.html",
        "/admin-perfil.html" 
    ];

    if (!logado) {
        if (userSpecificPages.some(p => currentPage.includes(p)) || adminSpecificPages.some(p => currentPage.includes(p))) {
            console.log(`Usuário não logado tentando acessar ${currentPage}. Redirecionando para login.`);
            window.location.href = 'login.html';
        }
    } else { 
        if ((currentPage.includes('login.html') || currentPage.includes('register.html'))) {
            // Redireciona para o painel apropriado após login
            window.location.href = tipo === 'funcionario' ? 'administracao.html' : 'home.html';
        } else if (adminSpecificPages.some(p => currentPage.includes(p)) && tipo !== 'funcionario') {
            console.log(`Cliente (${globalUserStatus.email || ''}) tentando acessar área admin (${currentPage}). Redirecionando para home.`);
            window.location.href = 'home.html';
        } else if (userSpecificPages.some(p => currentPage.includes(p)) && tipo === 'funcionario') {
            console.log(`Admin (${globalUserStatus.email || ''}) tentando acessar área cliente (${currentPage}). Redirecionando para admin.`);
            window.location.href = 'administracao.html';
        }
    }
}

// --- Lógica de Carregamento Dinâmico de Categorias e Produtos ---
async function fetchTodasAsCategorias() {
    if (window.todasAsCategoriasGlobais && window.todasAsCategoriasGlobais.length > 0) {
        return window.todasAsCategoriasGlobais;
    }
    try {
        const response = await fetch(`${API_PREFIX_CLIENT}/categorias`);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({
                message: `Falha ao buscar categorias: ${response.statusText}`
            }));
            throw new Error(errData.message);
        }
        window.todasAsCategoriasGlobais = await response.json();
        return window.todasAsCategoriasGlobais;
    } catch (error) {
        console.error("Erro ao carregar categorias globais:", error);
        return [];
    }
}

function popularFiltrosDeCategoria(filterContainerId, productListId) {
    const categoryFilters = document.getElementById(filterContainerId);
    if (!categoryFilters || !window.todasAsCategoriasGlobais) {
        return;
    }

    const existingFilters = categoryFilters.querySelectorAll('.filter-btn:not([onclick*="todos"])');
    existingFilters.forEach(btn => btn.remove());

    window.todasAsCategoriasGlobais.forEach(cat => {
        const filterButton = document.createElement('button');
        filterButton.classList.add('filter-btn');
        filterButton.textContent = cat.nome;
        filterButton.onclick = () => filterProductsClient(cat.slug, productListId);
        categoryFilters.appendChild(filterButton);
    });
}

function popularCardsDeCategoria(categoryGridId, productListIdForFilter) {
    const categoryGrid = document.getElementById(categoryGridId);
    if (!categoryGrid || !window.todasAsCategoriasGlobais) return;

    categoryGrid.innerHTML = '';
    if (window.todasAsCategoriasGlobais.length === 0) {
        categoryGrid.innerHTML = '<p>Nenhuma categoria encontrada.</p>';
        return;
    }

    window.todasAsCategoriasGlobais.forEach(cat => {
        const categoryLink = document.createElement('a');
        categoryLink.classList.add('category-card');

        // Verifica se está no index, home ou raiz
        if (
            window.location.pathname.endsWith('/') ||
            window.location.pathname.endsWith('index.html') ||
            window.location.pathname.includes('home.html')
        ) {
            categoryLink.href = "#produtos";
            categoryLink.onclick = (event) => {
                event.preventDefault();
                filterProductsClient(cat.slug, productListIdForFilter);
                const produtosSection = document.getElementById('produtos');
                if (produtosSection) produtosSection.scrollIntoView({ behavior: 'smooth' });
            };
        } else {
            categoryLink.href = `cardapio.html#filter-${cat.slug}`;
        }

        const imgCat = cat.imagem_url || `https://placehold.co/250x180/DDDDDD/777777?text=${encodeURIComponent(cat.nome)}&font=Poppins`;

        categoryLink.innerHTML = `
            <img src="${imgCat}" alt="${cat.nome}" onerror="this.onerror=null;this.src='https://placehold.co/250x180/CCCCCC/969696?text=Img Indisponível&font=Poppins';">
            <h3>${cat.nome}</h3>
        `;

        categoryGrid.appendChild(categoryLink);
    });
}

//---------
async function carregarDadosIndex() {
    await fetchTodasAsCategorias();
    popularCardsDeCategoria('categoryGridIndex', 'produtoListaIndex');
    popularFiltrosDeCategoria('categoryFiltersIndex', 'produtoListaIndex');

    const produtoListaDiv = document.getElementById('produtoListaIndex');
    if (produtoListaDiv) {
        produtoListaDiv.innerHTML = '<p class="loading-message">Carregando destaques do cardápio...</p>';
        try {
            const response = await fetch(`${API_PREFIX_CLIENT}/produtos`);
            if (!response.ok) await throwErrorFromResponse(response, 'Erro ao buscar produtos para index');
            window.todosOsProdutosIndex = await response.json();
            renderProducts(window.todosOsProdutosIndex, 'produtoListaIndex', 6, globalUserStatus.logado);
        } catch (error) {
            console.error('Erro ao carregar produtos para Index:', error);
            produtoListaDiv.innerHTML = `<p style="color: red;" class="error-message">${error.message}</p>`;
        }
    }
}

async function carregarDadosHome() {
    await fetchTodasAsCategorias();
    popularFiltrosDeCategoria('categoryFiltersHome', 'produtoListaHome');
    
    const produtoListaDiv = document.getElementById('produtoListaHome');
    if (produtoListaDiv) {
        produtoListaDiv.innerHTML = '<p class="loading-message">Carregando cardápio completo...</p>';
        try {
            const response = await fetch(`${API_PREFIX_CLIENT}/produtos`);
            if (!response.ok) await throwErrorFromResponse(response, 'Erro ao buscar produtos para home');
            window.todosOsProdutosHome = await response.json();
            renderProducts(window.todosOsProdutosHome, 'produtoListaHome', Infinity, globalUserStatus.logado);
        } catch (error) {
            console.error('Erro ao carregar produtos para Home:', error);
            produtoListaDiv.innerHTML = `<p style="color: red;" class="error-message">${error.message}</p>`;
        }
    }
}

async function carregarDadosCardapio() {
    await fetchTodasAsCategorias();
    popularFiltrosDeCategoria('categoryFiltersCardapio', 'produtoListaCardapio');

    const produtoListaDiv = document.getElementById('produtoListaCardapio');
    if (produtoListaDiv) {
        produtoListaDiv.innerHTML = '<p class="loading-message">Carregando cardápio completo...</p>';
        try {
            const response = await fetch(`${API_PREFIX_CLIENT}/produtos`);
            if (!response.ok) await throwErrorFromResponse(response, 'Erro ao buscar produtos para cardápio');
            window.todosOsProdutosCardapio = await response.json();
            renderProducts(window.todosOsProdutosCardapio, 'produtoListaCardapio', Infinity, globalUserStatus.logado);
        } catch (error) {
            console.error('Erro ao carregar produtos para Cardapio:', error);
            produtoListaDiv.innerHTML = `<p style="color: red;" class="error-message">${error.message}</p>`;
        }
    }
}

function renderProducts(products, targetDivId, limit = Infinity, isLoggedIn) {
    const produtoListaDiv = document.getElementById(targetDivId);
    if (!produtoListaDiv) return;
    produtoListaDiv.innerHTML = '';

    const produtosParaExibir = products.slice(0, limit);

    if (produtosParaExibir.length === 0) {
        let noMatchMsg = document.getElementById(`noMatchMessage_${targetDivId}`);
        if (!noMatchMsg) {
            noMatchMsg = document.createElement('p');
            noMatchMsg.id = `noMatchMessage_${targetDivId}`;
            noMatchMsg.style.textAlign = 'center'; noMatchMsg.style.width = '100%'; noMatchMsg.style.padding = '1rem 0';
            produtoListaDiv.appendChild(noMatchMsg);
        }
        const currentFilterButton = document.querySelector(`#${targetDivId.replace('produtoLista', 'categoryFilters')} .filter-btn.active`);
        const categoryName = currentFilterButton && currentFilterButton.textContent !== 'Todos' ? `na categoria "${currentFilterButton.textContent}"` : 'disponível no momento';
        noMatchMsg.textContent = `Nenhum produto encontrado ${categoryName}.`;
        noMatchMsg.style.display = 'block';
        return;
    } else {
        let noMatchMsg = document.getElementById(`noMatchMessage_${targetDivId}`);
        if (noMatchMsg) noMatchMsg.style.display = 'none';
    }

    produtosParaExibir.forEach(produto => {
        const produtoItem = document.createElement('div');
        produtoItem.classList.add('produto-item');
        produtoItem.dataset.category = produto.slug_categoria || 'sem-categoria';
        const imagemProduto = produto.imagem_url || `https://placehold.co/300x200/CCCCCC/969696?text=${encodeURIComponent(produto.nome)}&font=Poppins`;
        
        const acaoBotao = `handleAdicionarAoCarrinhoGenerico(${produto.id}, ${isLoggedIn})`;

        produtoItem.innerHTML = `
            <img src="${imagemProduto}" alt="${produto.nome}" onerror="this.onerror=null;this.src='https://placehold.co/300x200/CCCCCC/969696?text=Img Indisponível&font=Poppins';">
            <div class="produto-info">
                <h3>${produto.nome}</h3>
                <p class="produto-descricao">${produto.descricao_longa || 'Sem descrição.'}</p>
                <div class="produto-preco-rating">
                    <span class="produto-preco">R$${parseFloat(produto.preco_venda).toFixed(2).replace('.', ',')}</span>
                </div>
                <button class="btn-adicionar" onclick="${acaoBotao}"><i class="fas fa-cart-plus"></i> Adicionar</button>
            </div>
        `;
        produtoListaDiv.appendChild(produtoItem);
    });
}

window.handleAdicionarAoCarrinhoGenerico = function(produtoId, isLoggedInParam) {
    const realmenteLogado = window.globalUserStatus ? window.globalUserStatus.logado : isLoggedInParam;

    if (realmenteLogado) {
        alert(`Produto ID ${produtoId} - Adicionar ao carrinho (LOGADO) - Implementar API do carrinho!`);
    } else {
        alert('Você precisa estar logado para adicionar produtos ao carrinho. Redirecionando para login...');
        window.location.href = 'login.html';
    }
};


window.filterProductsClient = function(categorySlug, listaProdutosId) {
    const produtoListaDiv = document.getElementById(listaProdutosId);
    if (!produtoListaDiv) {
        console.warn("Elemento da lista de produtos não encontrado:", listaProdutosId);
        return;
    }

    let allProducts;
    if (listaProdutosId === 'produtoListaIndex') allProducts = window.todosOsProdutosIndex;
    else if (listaProdutosId === 'produtoListaHome') allProducts = window.todosOsProdutosHome;
    else if (listaProdutosId === 'produtoListaCardapio') allProducts = window.todosOsProdutosCardapio;
    
    if (!allProducts) {
        console.warn("Lista de produtos base não carregada para:", listaProdutosId);
        if (listaProdutosId === 'produtoListaIndex' && typeof carregarDadosIndex === 'function') carregarDadosIndex();
        else if (listaProdutosId === 'produtoListaHome' && typeof carregarDadosHome === 'function') carregarDadosHome();
        else if (listaProdutosId === 'produtoListaCardapio' && typeof carregarDadosCardapio === 'function') carregarDadosCardapio();
        return; 
    }

    const buttonsContainerId = listaProdutosId.replace('produtoLista', 'categoryFilters');
    const buttons = document.querySelectorAll(`#${buttonsContainerId} .filter-btn`);
    
    buttons.forEach(button => button.classList.remove('active'));
    const activeButton = Array.from(buttons).find(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        return onclickAttr && onclickAttr.includes(`filterProductsClient('${categorySlug}'`);
    });
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    const produtosFiltrados = categorySlug === 'todos' ?
        allProducts :
        allProducts.filter(p => p.slug_categoria === categorySlug);

    renderProducts(produtosFiltrados, listaProdutosId, listaProdutosId === 'produtoListaIndex' ? 6 : Infinity, window.globalUserStatus.logado);
}

// --- Lógica dos Formulários ---
// Cadastro de Funcionário
const registerEmployeeForm = document.getElementById('registerEmployeeForm');
if (registerEmployeeForm) {
  registerEmployeeForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('nomeFunc').value;
    const email = document.getElementById('emailFunc').value;
    const senha = document.getElementById('senhaFunc').value;
    const celular = document.getElementById('celularFunc').value;
    const cpf = document.getElementById('cpfFunc').value;
const salario = parseFloat(document.getElementById('salarioFunc').value);
const dia_pagamento = parseInt(document.getElementById('diaPagamentoFunc').value);
const cargo = document.getElementById('cargoFunc').value;
const data_nascimento = document.getElementById('dataNascFunc').value;
const chave_pix = document.getElementById('pixFunc').value;
const rua = document.getElementById('ruaFunc').value;
const numero = document.getElementById('numeroFunc').value;
const bairro = document.getElementById('bairroFunc').value;
const cidade = document.getElementById('cidadeFunc').value;

    if (!isValidEmailUnifucampClient(email)) {
      alert('Email de funcionário inválido. Use o formato institucional @unifucamp.edu.br');
      return;
    }
    if (!isStrongPasswordClient(senha, 'passwordError_senhaFunc')) {
      return;
    }

    fetch(`${API_PREFIX_CLIENT}/cadastrar-funcionario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha, celular,
  cpf, salario, dia_pagamento, cargo, data_nascimento,
  chave_pix, rua, numero, bairro, cidade})
    })
    .then(async res => { 
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        return res.json();
      }
      const text = await res.text();
      let errorDetail = text.substring(0, 200) + "...";
      let jsonData = {};
      try { jsonData = JSON.parse(text); } catch(parseErr) { /* não é JSON */ }

      if (res.ok) { 
           throw new Error(`Resposta inesperada do servidor (não é JSON): ${errorDetail}. Verifique o console do servidor.`);
      }
      const serverMessage = jsonData.message || res.statusText;
      throw new Error(`Erro ${res.status}: ${serverMessage}. Resposta: ${errorDetail}. Verifique o console do servidor.`);
    })
    .then(data => {
      alert(data.message);
      if (data.message && data.message.includes('sucesso')) {
        registerEmployeeForm.reset();
        const passwordErrorEl = document.getElementById('passwordError_senhaFunc');
        if (passwordErrorEl) passwordErrorEl.style.display = 'none';
      }
    })
    .catch(error => {
      console.error('Erro ao cadastrar funcionário:', error);
      alert(error.message || 'Ocorreu um erro ao cadastrar o funcionário. Verifique o console.');
    });
  });
}

// Registro de Cliente
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const celular = document.getElementById('celular').value;

    if (!isValidEmailUnifucampClient(email)) {
      alert('Cadastro permitido apenas com email institucional @unifucamp.edu.br.');
      return;
    }
    if (!isStrongPasswordClient(senha, 'passwordError_senha')) {
      return;
    }

    fetch(`${API_PREFIX_CLIENT}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha, celular })
    })
      .then(async res => { 
          if (!res.ok) {
              const errData = await res.json().catch(() => ({ message: `Erro ${res.status} ao registrar.`}));
              throw new Error(errData.message);
          }
          return res.json();
      }) 
      .then(data => {
        alert(data.message);
        if (data.message && data.message.includes('sucesso')) {
          window.location.href = 'login.html';
        }
      })
      .catch(error => {
        console.error('Erro ao registrar cliente:', error);
        alert(error.message || 'Ocorreu um erro ao tentar registrar. Tente novamente.');
      });
  });
}

// Login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form'); // Assumindo que seu formulário tem o id="login-form"

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o recarregamento padrão da página

            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const messageDiv = document.getElementById('message'); // Um div para mostrar mensagens de erro

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, senha })
                });

                const data = await response.json();

                if (data.success) {
                    // **AQUI ESTÁ A LÓGICA DE REDIRECIONAMENTO**
                    if (data.userType === 'cliente') {
                        window.location.href = '/home.html'; // Redireciona para a home do cliente
                    } else if (data.userType === 'funcionario') {
                        window.location.href = '/administracao.html'; // Redireciona para o painel do admin
                    }
                } else {
                    // Mostra a mensagem de erro do servidor
                    if(messageDiv) {
                      messageDiv.textContent = data.message || 'Falha no login.';
                      messageDiv.style.color = 'red';
                    }
                }
            } catch (error) {
                console.error('Erro ao tentar fazer login:', error);
                if(messageDiv) {
                  messageDiv.textContent = 'Ocorreu um erro. Tente novamente.';
                  messageDiv.style.color = 'red';
                }
            }
        });
    }
});

// Logout
async function logout() {
  try {
    const res = await fetch(`${API_PREFIX_CLIENT}/logout`, { method: 'POST' });
    if (!res.ok) {
        console.warn("Logout no servidor pode ter falhado, mas prosseguindo com logout no cliente.");
    }
    const data = await res.json();
    alert(data.message || "Logout realizado.");
  } catch (error) {
    console.error('Erro no fetch de logout:', error);
    alert('Logout realizado. Redirecionando...');
  } finally {
    window.globalUserStatus = { logado: false, nome: null, tipo: null, email: null };
    window.location.href = 'index.html';
  }
}

// Alterar senha do CLIENTE (perfil.html)
const formSenhaCliente = document.getElementById('formSenha');
if (formSenhaCliente) {
  formSenhaCliente.addEventListener('submit', async (e) => {
    e.preventDefault();
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenhaEl = document.getElementById('confirmarNovaSenha');
    const confirmarSenha = confirmarSenhaEl ? confirmarSenhaEl.value : novaSenha;

    if(confirmarSenhaEl && novaSenha !== confirmarSenha){
        alert("As senhas não coincidem!");
        return;
    }
    if (!isStrongPasswordClient(novaSenha, 'passwordError_novaSenha')) {
        return;
    }

    try {
        const res = await fetch(`${API_PREFIX_CLIENT}/alterar-senha`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha: novaSenha })
        });
        const data = await res.json();
        alert(data.message);
        if(res.ok) {
            formSenhaCliente.reset();
            const passwordErrorEl = document.getElementById('passwordError_novaSenha');
            if (passwordErrorEl) passwordErrorEl.style.display = 'none';
            const confirmarPasswordErrorEl = document.getElementById('passwordError_confirmarNovaSenha');
            if (confirmarPasswordErrorEl) confirmarPasswordErrorEl.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao alterar senha do cliente:', error);
        alert('Ocorreu um erro ao tentar alterar a senha.');
    }
  });
}

// Alterar senha do ADMIN (admin-perfil.html)
const formAdminSenha = document.getElementById('formAdminSenha');
if (formAdminSenha) {
  formAdminSenha.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Submit formAdminSenha acionado.');
    const novaSenha = document.getElementById('adminNovaSenha').value;
    const confirmarNovaSenhaEl = document.getElementById('adminConfirmarNovaSenha');
    const confirmarSenha = confirmarNovaSenhaEl ? confirmarNovaSenhaEl.value : novaSenha;

    if (confirmarNovaSenhaEl && novaSenha !== confirmarSenha) {
        alert("As senhas não coincidem!");
        return;
    }
    if (!isStrongPasswordClient(novaSenha, 'passwordError_adminNovaSenha')) {
        console.log("Validação de senha falhou para adminNovaSenha no frontend.");
        return;
    }

    console.log("Enviando para /api/alterar-senha:", { senha: novaSenha });
    try {
        const res = await fetch(`${API_PREFIX_CLIENT}/alterar-senha`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha: novaSenha })
        });
        
        const data = await res.json();
        alert(data.message);

        if(res.ok && data.message.includes('sucesso')) {
            formAdminSenha.reset();
            const passwordErrorEl = document.getElementById('passwordError_adminNovaSenha');
            if (passwordErrorEl) passwordErrorEl.style.display = 'none';
            const confirmarPasswordErrorEl = document.getElementById('passwordError_adminConfirmarNovaSenha');
            if (confirmarPasswordErrorEl) confirmarPasswordErrorEl.style.display = 'none';
            console.log("Senha do admin alterada com sucesso no frontend.");
        } else if (!res.ok) {
             console.error("Erro do servidor ao alterar senha admin:", data.message || res.statusText);
        }
    } catch (error) {
        console.error('Erro no fetch ao alterar senha do admin:', error);
        alert(error.message || 'Ocorreu um erro ao tentar alterar a senha do administrador.');
    }
  });
}


// Resetar senha (Esqueci minha senha)
const resetForm = document.getElementById('resetForm');
if (resetForm) {
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;

    if (!email) {
        alert("Por favor, informe o e-mail.");
        return;
    }
    if (!isValidEmailUnifucampClient(email)) {
        alert("Recuperação de senha permitida apenas para emails institucionais @unifucamp.edu.br.");
        return;
    }

    try {
        const res = await fetch(`${API_PREFIX_CLIENT}/reset-password`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        alert(data.message);
        if (res.ok) {
            resetForm.reset();
        }
    } catch (error) {
        console.error("Erro ao resetar senha:", error);
        alert("Ocorreu um erro ao tentar resetar a senha.");
    }
  });
}

// --- Script específico para gerenciar-produtos.html (Inicio) ---
// Removidas referências a productStockQuantityField e productStockQuantityGroup
// pois esses elementos não existem nesta página.
const productForm = document.getElementById('productForm');
const productIdField = document.getElementById('productId');
const productNameField = document.getElementById('productName');
const productCategoryField = document.getElementById('productCategory');
const productCodeField = document.getElementById('productCode');
const productPurposeField = document.getElementById('productPurpose');
const productUnitField = document.getElementById('productUnit');
const productInternalRefField = document.getElementById('productInternalRef');
const productCostPriceField = document.getElementById('productCostPrice');
const productMarginField = document.getElementById('productMargin');
const productSalePriceField = document.getElementById('productSalePrice');
const productImageUrlField = document.getElementById('productImageUrl');
const productImagePreview = document.getElementById('productImagePreview');
const productDescriptionField = document.getElementById('productDescription');
const productObservationsField = document.getElementById('productObservations');
const productAvailableField = document.getElementById('productAvailable');
const productsTableBody = document.querySelector('#productsTable tbody');
const cancelEditProductBtn = document.getElementById('cancelEditProductBtn');
const formProductTitle = document.getElementById('formProductTitle');

function setFormMode(mode = 'new') { // 'new' or 'edit'
    if (mode === 'edit') {
        formProductTitle.textContent = 'Editar Produto';
        // productStockQuantityGroup não existe mais, então removemos a lógica de display
        cancelEditProductBtn.style.display = 'inline-block';
        productForm.classList.add('editing-mode');
    } else { // new
        formProductTitle.textContent = 'Novo Produto';
        // productStockQuantityGroup não existe mais, então removemos a lógica de display
        productIdField.value = ''; // Limpa ID para garantir que é uma criação
        cancelEditProductBtn.style.display = 'none';
        productForm.classList.remove('editing-mode');
        productForm.reset(); // Limpa o formulário
        productImagePreview.style.display = 'none';
        productImagePreview.src = '#';
    }
}


function calculateSalePrice() {
    const cost = parseFloat(productCostPriceField.value);
    const margin = parseFloat(productMarginField.value);
    if (productSalePriceField.value === '' || document.activeElement === productCostPriceField || document.activeElement === productMarginField) {
        if (!isNaN(cost) && cost > 0 && !isNaN(margin) && margin >= 0) {
            const salePrice = cost * (1 + (margin / 100));
            productSalePriceField.value = salePrice.toFixed(2);
        }
    }
}

if(productCostPriceField) productCostPriceField.addEventListener('input', calculateSalePrice);
if(productMarginField) productMarginField.addEventListener('input', calculateSalePrice);

if(productImageUrlField && productImagePreview) {
    productImageUrlField.addEventListener('input', function() {
        if (this.value && (this.value.startsWith('http://') || this.value.startsWith('https://') || this.value.startsWith('/imagens/'))) {
            productImagePreview.src = this.value;
            productImagePreview.style.display = 'block';
        } else {
            productImagePreview.src = '#';
            productImagePreview.style.display = 'none';
        }
    });
}

async function fetchProductCategoriesForForm() {
    try {
        const response = await fetch(`${API_PREFIX_CLIENT}/categorias`);
        if (!response.ok) {
            let errorMsg = `Falha ao buscar categorias: ${response.status} ${response.statusText}`;
             try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch (e) {}
            throw new Error(errorMsg);
        }
        const categories = await response.json();
        
        productCategoryField.innerHTML = '<option value="">Selecione uma Categoria</option>';
        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nome;
                productCategoryField.appendChild(option);
            });
        } else {
             productCategoryField.innerHTML = '<option value="">Nenhuma categoria cadastrada</option>';
        }
    } catch (error) {
        console.error('Erro ao carregar categorias no formulário de produtos:', error);
        productCategoryField.innerHTML = `<option value="">Erro: ${error.message}</option>`;
    }
}

async function fetchAllProductsForAdminTable() { 
    if (!productsTableBody) return;
    productsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Carregando produtos...</td></tr>';
    try {
        const response = await fetch(`${API_PREFIX_CLIENT}/produtos/admin`);
        if (!response.ok) {
             const errData = await response.json().catch(() => ({message: `Erro HTTP: ${response.status}`}));
             throw new Error(errData.message || 'Falha ao carregar lista de produtos');
        }
        const products = await response.json();
        renderAdminProductsTable(products);
    } catch (error) {
        console.error('Erro ao buscar produtos para admin:', error);
        productsTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">${error.message}</td></tr>`;
    }
}

function renderAdminProductsTable(products) {
    productsTableBody.innerHTML = '';
    if (products.length === 0) {
        productsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
        return;
    }
    products.forEach(product => {
        const row = productsTableBody.insertRow();
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.nome || 'N/A'}</td>
            <td>${product.nome_categoria || 'Sem Categoria'}</td>
            <td>R$${parseFloat(product.preco_venda).toFixed(2).replace('.', ',')}</td>
            <td>${product.disponivel ? '<span style="color:green;">Sim</span>' : '<span style="color:red;">Não</span>'}</td>
            <td>
                <button class="btn-action btn-edit" onclick="editProductHandler(${product.id})"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn-action btn-delete" onclick="deleteProductHandler(${product.id})"><i class="fas fa-trash"></i> Deletar</button>
            </td>
        `;
    });
}

productForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const id = productIdField.value;
    const produtoData = {
        nome: productNameField.value,
        categoria_id: productCategoryField.value,
        codigo_produto: productCodeField.value || null,
        finalidade: productPurposeField.value,
        unidade_medida: productUnitField.value,
        referencia_interna: productInternalRefField.value || null,
        preco_custo: parseFloat(productCostPriceField.value) || 0,
        margem_lucro: productMarginField.value !== '' ? parseFloat(productMarginField.value) : null,
        preco_venda_manual: productSalePriceField.value !== '' ? parseFloat(productSalePriceField.value) : null,
        // Removido quantidade_estoque do envio do formulário, será tratado no backend com valor padrão.
        imagem_url: productImageUrlField.value || null,
        descricao_longa: productDescriptionField.value || null,
        observacoes: productObservationsField.value || null,
        disponivel: productAvailableField.checked
    };
    
    // A quantidade_estoque NÃO é enviada por esta página.
    // O backend definirá um valor padrão (ex: 0) para novos produtos.

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_PREFIX_CLIENT}/produtos/${id}` : `${API_PREFIX_CLIENT}/produtos`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produtoData)
        });
        // Melhor tratamento de erro para respostas não-OK do servidor
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status} ${response.statusText}` }));
            throw new Error(errorData.message || 'Falha ao salvar o produto.');
        }

        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            setFormMode('new'); // Reseta formulário e título
            fetchAllProductsForAdminTable(); 
        }
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        alert(error.message || 'Erro ao salvar produto. Verifique o console.');
    }
});

window.editProductHandler = async function(id) { 
    try {
        // Busca os produtos de admin para encontrar o produto específico para edição.
        // É importante buscar a lista completa para ter todos os dados necessários.
        const response = await fetch(`${API_PREFIX_CLIENT}/produtos/admin`);
        if(!response.ok) {
            const errData = await response.json().catch(() => ({message: `Erro HTTP: ${response.status}`}));
            throw new Error(errData.message || 'Falha ao buscar dados dos produtos para edição');
        }
        const products = await response.json();
        const product = products.find(p => p.id === id);

        if(product){
            setFormMode('edit'); // Configura o formulário para o modo de edição
            productIdField.value = product.id;
            productNameField.value = product.nome;
            productCategoryField.value = product.categoria_id;
            productCodeField.value = product.codigo_produto || '';
            productPurposeField.value = product.finalidade || 'Venda Direta';
            productUnitField.value = product.unidade_medida || 'Unidade';
            productInternalRefField.value = product.referencia_interna || '';
            productCostPriceField.value = product.preco_custo !== null ? parseFloat(product.preco_custo).toFixed(2) : '';
            productMarginField.value = product.margem_lucro !== null ? parseFloat(product.margem_lucro).toFixed(2) : '';
            productSalePriceField.value = product.preco_venda !== null ? parseFloat(product.preco_venda).toFixed(2) : '';
            // Não preenche productStockQuantityField aqui no modo de edição (nem existe mais neste HTML)
            productImageUrlField.value = product.imagem_url || '';
            productDescriptionField.value = product.descricao_longa || '';
            productObservationsField.value = product.observacoes || '';
            productAvailableField.checked = product.disponivel;

            if (product.imagem_url) {
                productImagePreview.src = product.imagem_url;
                productImagePreview.style.display = 'block';
            } else {
                productImagePreview.src = '#';
                productImagePreview.style.display = 'none';
            }
            productNameField.focus();
            window.scrollTo({ top: productForm.offsetTop - 80, behavior: 'smooth' });
        } else {
            alert('Produto não encontrado para edição.');
        }
    } catch (error) {
        console.error('Erro ao preparar edição do produto:', error);
        alert(error.message || 'Não foi possível carregar os dados do produto para edição.');
    }
}

if(cancelEditProductBtn) { 
    cancelEditProductBtn.addEventListener('click', () => {
        setFormMode('new'); // Reseta para o modo de novo produto
    });
}

window.deleteProductHandler = async function(id) { 
    if (!confirm('Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita.')) {
        return;
    }
    try {
        const response = await fetch(`${API_PREFIX_CLIENT}/produtos/${id}`, { method: 'DELETE' });
        // Melhor tratamento de erro para respostas não-OK do servidor
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status} ${response.statusText}` }));
            throw new Error(errorData.message || 'Falha ao deletar o produto.');
        }
        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            fetchAllProductsForAdminTable(); 
        }
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        alert(error.message || 'Erro ao deletar produto.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchProductCategoriesForForm();
    fetchAllProductsForAdminTable();
    setFormMode('new'); // Garante que o formulário comece no modo "Novo Produto"
});

// --- Inicialização Geral (continuação do arquivo script.js) ---
document.addEventListener('DOMContentLoaded', () => {
    // Estas partes já existiam e foram mantidas.
    const celularInputs = document.querySelectorAll('input[type="tel"]');
    celularInputs.forEach(input => {
        if (!input.getAttribute('data-mask-applied')) {
            input.setAttribute('maxlength', '15');
            input.addEventListener('input', function() { formatPhoneNumber(this); });
            input.setAttribute('data-mask-applied', 'true');
        }
    });

    const senhaFieldsSetup = [
        { inputId: 'senha', formId: 'registerForm', errorId: 'passwordError_senha', helpId: 'senhaHelp' },
        { inputId: 'senhaFunc', formId: 'registerEmployeeForm', errorId: 'passwordError_senhaFunc', helpId: 'senhaFuncHelp' },
        { inputId: 'novaSenha', formId: 'formSenha', errorId: 'passwordError_novaSenha', helpId: 'novaSenhaHelp' },
        { inputId: 'confirmarNovaSenha', formId: 'formSenha', errorId: 'passwordError_confirmarNovaSenha', helpId: 'confirmarNovaSenhaHelp'},
        { inputId: 'adminNovaSenha', formId: 'formAdminSenha', errorId: 'passwordError_adminNovaSenha', helpId: 'adminNovaSenhaHelp'},
        { inputId: 'adminConfirmarNovaSenha', formId: 'formAdminSenha', errorId: 'passwordError_adminConfirmarNovaSenha', helpId: 'adminConfirmarNovaSenhaHelp'}
    ];
    senhaFieldsSetup.forEach(setup => {
        const formElement = document.getElementById(setup.formId);
        if(formElement) { // Verifica se o formulário existe na página atual
            const senhaInput = document.getElementById(setup.inputId);
            if (senhaInput && !senhaInput.getAttribute('data-helpers-applied')) {
                 if (!document.getElementById(setup.helpId)) {
                    const helpText = document.createElement('p');
                    helpText.id = setup.helpId;
                    helpText.className = 'password-help-text';
                    helpText.textContent = 'Mínimo 8 caracteres, com letras e números.';
                    // Insere o helpText após o input
                    senhaInput.parentNode.insertBefore(helpText, senhaInput.nextSibling);
                }
                if (!document.getElementById(setup.errorId)) {
                    const errorEl = document.createElement('p');
                    errorEl.id = setup.errorId;
                    errorEl.className = 'password-validation-error';
                    errorEl.style.display = 'none';
                    // Insere o errorEl após o helpText (que foi inserido após o input)
                    const referenceNodeForError = document.getElementById(setup.helpId) || senhaInput;
                    referenceNodeForError.parentNode.insertBefore(errorEl, referenceNodeForError.nextSibling);
                }
                senhaInput.setAttribute('data-helpers-applied', 'true');
            }
        }
    });

    // Menu Mobile
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mainNav = document.getElementById('mainNav');
    if (mobileNavToggle && mainNav && !mainNav.getAttribute('data-toggle-applied')) {
        mobileNavToggle.addEventListener('click', () => {
            const isExpanded = mainNav.classList.toggle('active');
            mobileNavToggle.setAttribute('aria-expanded', isExpanded);
            const icon = mobileNavToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
        mainNav.setAttribute('data-toggle-applied', 'true');
    }
});

// Função utilitária para lançar erro a partir da resposta do fetch
async function throwErrorFromResponse(response, defaultMessage = 'Erro desconhecido') {
    let errorData = { message: defaultMessage };
    try {
        // Tenta primeiro ler como JSON, pois é o esperado em caso de erro da API
        errorData = await response.json();
    } catch (e) {
        // Se não for JSON, lê como texto (pode ser uma página de erro HTML do servidor)
        const text = await response.text().catch(() => "Não foi possível ler a resposta do servidor.");
        // Cria um novo erro com mais detalhes, incluindo o status e parte do texto da resposta
        throw new Error(`${defaultMessage} (Status: ${response.status} ${response.statusText}). Resposta do servidor: ${text.substring(0,200)}...`);
    }
    // Se foi JSON, mas não tem 'message', usa a mensagem padrão com status
    throw new Error(errorData.message || `${defaultMessage} (Status: ${response.status})`);
}


/**
 * Busca vendas do dia e popula a lista em #pdv-sales-list
 */
async function fetchPDVSales() {
  const hoje = new Date().toISOString().slice(0,10);
  try {
    const resp   = await fetch(`/api/pdv/vendas?data=${hoje}`);
    const vendas = await resp.json();
    const ul     = document.getElementById('pdv-sales-list');
    ul.innerHTML = '';
    vendas.forEach(v => {
      const li = document.createElement('li');
      li.style.padding       = '0.5rem';
      li.style.border        = '1px solid #ddd';
      li.style.marginBottom  = '0.5rem';
      li.style.cursor        = 'pointer';
      li.innerHTML = `
        <strong>Ficha #${v.ficha}</strong><br>
        R$ ${v.totalVenda.toFixed(2)} — ${v.metodo.toUpperCase()}
      `;
      li.addEventListener('click', () => {
        alert(`Editar venda ficha ${v.ficha}`);
      });
      ul.appendChild(li);
    });
  } catch (e) {
    console.error('Erro ao carregar vendas PDV:', e);
  }
}

// chama ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  fetchPDVSales();
});
