// ==== ARQUIVO: server.js ====

const express    = require('express');
const session    = require('express-session');
const cors       = require('cors');
const bodyParser = require('body-parser');
const mysql      = require('mysql2');
const path       = require('path');
const nodemailer = require('nodemailer');
const bcrypt     = require('bcryptjs');

const app = express();

// --- Middlewares ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));

// === Conexão MySQL ===
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'unilanches'
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    process.exit(1);
  }
  console.log('✅ Conectado ao MySQL!');
});

// === Sessão ===
app.use(session({
  secret: 'cH4v3_S3cr3t4_Muit0_L0ng4_3_C0mpl3x4_P4r4_Unil4nch3s!',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true }
}));

// === Helpers ===
function isValidEmailUnifucamp(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith('@unifucamp.edu.br');
}
function isStrongPassword(password) {
  return typeof password === 'string' && password.length >= 8
    && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.tipo === 'funcionario') return next();
  res.setHeader('Content-Type','application/json');
  return res.status(403).json({ message:'Acesso negado. Somente administradores.' });
}
const API = '/api';

// === Rota fake pagamento teste ===
app.post(`${API}/pagamento/test`, (req, res) => {
  console.log('Pagamento simulado:', req.body);
  res.json({ success:true, message:'Pagamento simulado com sucesso!' });
});

// === Autenticação ===
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ success:false, message:'E-mail e senha são obrigatórios.' });
  db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ success:false, message:'Erro interno.' });
    if (results.length === 0) return res.status(401).json({ success:false, message:'E-mail ou senha inválidos.' });
    const user = results[0];
    const valid = await bcrypt.compare(senha, user.senha);
    if (!valid) return res.status(401).json({ success:false, message:'E-mail ou senha inválidos.' });
    req.session.user = { id:user.id, nome:user.nome, email:user.email, tipo:user.tipo };
    res.json({ success:true, userType:user.tipo, message:'Login realizado com sucesso.' });
  });
});
app.get(`${API}/status`, (req, res) => {
  if (req.session && req.session.user) {
    const { nome, email, tipo } = req.session.user;
    return res.json({ logado:true, nome, email, tipo });
  }
  res.json({ logado:false });
});
app.post(`${API}/logout`, (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message:'Erro ao fazer logout.' });
    res.clearCookie('connect.sid');
    res.json({ message:'Logout realizado com sucesso!' });
  });
});

// === Cadastro de cliente e funcionário ===
app.post(`${API}/register`, async (req, res) => {
  const { nome, email, senha, celular } = req.body;
  if (!isValidEmailUnifucamp(email)) return res.status(400).json({ message:'Email institucional obrigatório.' });
  if (!isStrongPassword(senha)) return res.status(400).json({ message:'Senha fraca.' });
  const hash = await bcrypt.hash(senha, 10);
  db.query('INSERT INTO usuarios (nome,email,senha,celular,tipo) VALUES (?,?,?,?,?)',
    [nome,email,hash,celular,'cliente'],
    (err) => {
      if (err && err.code==='ER_DUP_ENTRY') return res.status(409).json({ message:'E-mail já cadastrado.' });
      if (err) return res.status(500).json({ message:'Erro ao cadastrar.' });
      res.status(201).json({ message:'Cadastro realizado com sucesso! Faça login.' });
    }
  );
});
app.post(`${API}/cadastrar-funcionario`, isAdmin, async (req, res) => {
  const { nome, email, senha, celular } = req.body;
  if (!nome||!email||!senha) return res.status(400).json({ message:'Campos obrigatórios.' });
  if (!isValidEmailUnifucamp(email)) return res.status(400).json({ message:'Email institucional obrigatório.' });
  if (!isStrongPassword(senha)) return res.status(400).json({ message:'Senha fraca.' });
  const hash = await bcrypt.hash(senha, 10);
  db.query('INSERT INTO usuarios (nome,email,senha,celular,tipo) VALUES (?,?,?,?,?)',
    [nome,email,hash,celular,'funcionario'],
    (err) => {
      if (err && err.code==='ER_DUP_ENTRY') return res.status(409).json({ message:'E-mail já cadastrado.' });
      if (err) return res.status(500).json({ message:'Erro ao cadastrar funcionário.' });
      res.status(201).json({ message:'Funcionário cadastrado com sucesso!' });
    }
  );
});

// === Gerenciamento de Categorias ===

// === Gerenciamento de Categorias ===
app.get(`${API}/categorias`, (req, res) => {
  db.query(
    'SELECT id, nome, slug, imagem_url, descricao FROM categorias_produto ORDER BY nome ASC',
    (err, rows) => {
      if (err) {
        console.error('Erro ao buscar categorias:', err);
        return res.status(500).json({ message: 'Erro ao buscar categorias.' });
      }
      res.json(rows);
    }
  );
});
app.put(`${API}/categorias/:id`, isAdmin,(req,res)=>{
  const { id } = req.params;
  const { nome, slug, imagem_url, descricao } = req.body;
  if (!nome||!slug) return res.status(400).json({ message:'Nome e slug obrigatórios.' });
  db.query('UPDATE categorias_produto SET nome=?,slug=?,imagem_url=?,descricao=? WHERE id=?',
    [nome,slug,imagem_url,descricao,id],
    (err,result) => {
      if (err && err.code==='ER_DUP_ENTRY') return res.status(409).json({ message:'Categoria duplicada.' });
      if (err) return res.status(500).json({ message:'Erro ao atualizar categoria.' });
      if (!result.affectedRows) return res.status(404).json({ message:'Categoria não encontrada.' });
      res.json({ message:'Categoria atualizada com sucesso!' });
    }
  );
});
app.delete(`${API}/categorias/:id`, isAdmin,(req,res)=>{
  const { id } = req.params;
  db.query('DELETE FROM categorias_produto WHERE id=?',[id],(err,result)=>{
    if (err && err.code==='ER_ROW_IS_REFERENCED_2') return res.status(400).json({ message:'Categoria em uso.' });
    if (err) return res.status(500).json({ message:'Erro ao deletar categoria.' });
    if (!result.affectedRows) return res.status(404).json({ message:'Categoria não encontrada.' });
    res.json({ message:'Categoria deletada com sucesso!' });
  });
});

// === Gerenciamento de Produtos ===
app.get(`${API}/produtos`, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const query = `
    SELECT
      p.id, p.nome, p.categoria_id, p.codigo_produto,
      p.preco_venda, p.imagem_url, p.descricao_longa,
      p.disponivel, p.quantidade_estoque,
      c.nome AS nome_categoria,
      c.slug AS slug_categoria
    FROM produtos p
    LEFT JOIN categorias_produto c ON p.categoria_id = c.id
    WHERE p.disponivel = TRUE AND p.quantidade_estoque > 0
    ORDER BY c.nome ASC, p.nome ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('[GET /api/produtos] Erro ao buscar produtos:', err);
      return res.status(500).json({ message: 'Erro ao buscar produtos.' });
    }
    res.json(results);
  });
});
app.get(`${API}/produtos/admin`, isAdmin,(req,res)=>{
  db.query(
    `SELECT p.*,c.nome AS nome_categoria,c.slug AS slug_categoria
       FROM produtos p
  LEFT JOIN categorias_produto c ON p.categoria_id=c.id
      ORDER BY p.id DESC`,
    (err,rows)=>{
      if(err) return res.status(500).json({ message:'Erro ao buscar produtos administração.' });
      res.json(rows);
    }
  );
});
app.get(`${API}/produtos/estoque`, isAdmin,(req,res)=>{
  db.query(
    `SELECT p.id,p.nome,p.codigo_produto,p.preco_venda,p.quantidade_estoque,p.disponivel,c.nome AS nome_categoria
       FROM produtos p
  LEFT JOIN categorias_produto c ON p.categoria_id=c.id
      ORDER BY p.nome ASC`,
    (err,rows)=>{
      if(err) return res.status(500).json({ message:'Erro ao buscar estoque.' });
      res.json(rows);
    }
  );
});
app.post(`${API}/produtos`, isAdmin,(req,res)=>{
  const { nome,categoria_id,codigo_produto,finalidade,unidade_medida,referencia_interna,preco_custo,margem_lucro,preco_venda_manual,imagem_url,descricao_longa,observacoes,disponivel } = req.body;
  if(!nome||!categoria_id) return res.status(400).json({ message:'Nome e categoria obrigatórios.' });
  const custo = parseFloat(preco_custo)||0;
  const margem = parseFloat(margem_lucro);
  let precoVenda = parseFloat(preco_venda_manual)||0;
  if(!precoVenda&&custo>0&&!isNaN(margem)) precoVenda = custo*(1+margem/100);
  precoVenda = parseFloat(precoVenda.toFixed(2));
  db.query(
    `INSERT INTO produtos (nome,categoria_id,codigo_produto,finalidade,unidade_medida,referencia_interna,preco_custo,margem_lucro,preco_venda,quantidade_estoque,imagem_url,descricao_longa,observacoes,disponivel)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [nome,categoria_id,codigo_produto||null,finalidade,unidade_medida,referencia_interna||null,custo,isNaN(margem)?null:margem,precoVenda,0,imagem_url||null,descricao_longa||null,observacoes||null,disponivel===false?false:true],
    (err,result)=>{
      if(err&&err.code==='ER_DUP_ENTRY') return res.status(409).json({ message:'Código do produto duplicado.' });
      if(err) return res.status(500).json({ message:'Erro ao criar produto.' });
      res.status(201).json({ message:'Produto criado com sucesso!', id: result.insertId });
    }
  );
});
app.put(`${API}/produtos/:id`, isAdmin,(req,res)=>{
  const { id } = req.params;
  const { nome,categoria_id,codigo_produto,finalidade,unidade_medida,referencia_interna,preco_custo,margem_lucro,preco_venda_manual,imagem_url,descricao_longa,observacoes,disponivel } = req.body;
  if(!nome||!categoria_id) return res.status(400).json({ message:'Nome e categoria obrigatórios.' });
  const custo = parseFloat(preco_custo)||0;
  const margem = parseFloat(margem_lucro);
  let precoVenda = parseFloat(preco_venda_manual)||0;
  if(!precoVenda&&custo>0&&!isNaN(margem)) precoVenda = custo*(1+margem/100);
  precoVenda = parseFloat(precoVenda.toFixed(2));
  db.query(
    `UPDATE produtos SET nome=?,categoria_id=?,codigo_produto=?,finalidade=?,unidade_medida=?,referencia_interna=?,preco_custo=?,margem_lucro=?,preco_venda=?,imagem_url=?,descricao_longa=?,observacoes=?,disponivel=? WHERE id=?`,
    [nome,categoria_id,codigo_produto||null,finalidade,unidade_medida,referencia_interna||null,custo,isNaN(margem)?null:margem,precoVenda,imagem_url||null,descricao_longa||null,observacoes||null,disponivel===false?false:true,id],
    (err,result)=>{
      if(err&&err.code==='ER_DUP_ENTRY') return res.status(409).json({ message:'Código do produto duplicado.' });
      if(err) return res.status(500).json({ message:'Erro ao atualizar produto.' });
      if(!result.affectedRows) return res.status(404).json({ message:'Produto não encontrado.' });
      res.json({ message:'Produto atualizado com sucesso!' });
    }
  );
});
app.put(`${API}/produtos/:id/estoque`, isAdmin,(req,res)=>{
  const { id } = req.params;
  const qtd = parseInt(req.body.quantidade_estoque);
  if(isNaN(qtd)||qtd<0) return res.status(400).json({ message:'Quantidade inválida.' });
  db.query('UPDATE produtos SET quantidade_estoque=? WHERE id=?',[qtd,id],(err,result)=>{
    if(err) return res.status(500).json({ message:'Erro ao atualizar estoque.' });
    if(!result.affectedRows) return res.status(404).json({ message:'Produto não encontrado.' });
    res.json({ message:'Estoque atualizado com sucesso!' });
  });
});
app.delete(`${API}/produtos/:id`, isAdmin,(req,res)=>{
  const { id } = req.params;
  db.query('DELETE FROM produtos WHERE id=?',[id],(err,result)=>{
    if(err) return res.status(500).json({ message:'Erro ao deletar produto.' });
    if(!result.affectedRows) return res.status(404).json({ message:'Produto não encontrado.' });
    res.json({ message:'Produto deletado com sucesso!' });
  });
});

// === Gerenciamento de funcionários ===
app.get(`${API}/funcionarios`, isAdmin,(req,res)=>{
  db.query(
    `SELECT id,nome,email,cpf,salario,dia_pagamento,cargo,data_nascimento,chave_pix,rua,numero,bairro,cidade
       FROM usuarios
      WHERE tipo='funcionario' AND ativo=TRUE
      ORDER BY nome ASC`,
    (err,rows)=>{
      if(err) return res.status(500).json({ message:'Erro ao buscar funcionários.' });
      res.json(rows);
    }
  );
});
app.put(`${API}/funcionarios/inativar/:id`, isAdmin,(req,res)=>{
  const { id } = req.params;
  db.query('UPDATE usuarios SET ativo=FALSE WHERE id=? AND tipo="funcionario"',[id],(err)=>{
    if(err) return res.status(500).json({ message:'Erro ao inativar funcionário.' });
    res.json({ message:'Funcionário inativado com sucesso.' });
  });
});
app.get(`${API}/funcionarios/inativos`, isAdmin,(req,res)=>{
  db.query(
    `SELECT id,nome,email,cpf,salario,dia_pagamento,cargo,data_nascimento,chave_pix,rua,numero,bairro,cidade
       FROM usuarios
      WHERE tipo='funcionario' AND ativo=FALSE
      ORDER BY nome ASC`,
    (err,rows)=>{
      if(err) return res.status(500).json({ message:'Erro ao buscar funcionários inativos.' });
      res.json(rows);
    }
  );
});
app.put(`${API}/funcionarios/reativar/:id`, isAdmin,(req,res)=>{
  const { id } = req.params;
  db.query('UPDATE usuarios SET ativo=TRUE WHERE id=? AND tipo="funcionario"',[id],(err)=>{
    if(err) return res.status(500).json({ message:'Erro ao reativar funcionário.' });
    res.json({ message:'Funcionário reativado com sucesso.' });
  });
});

// === PDV para vendas ===
app.post('/api/pdv/vendas', isAdmin, (req, res) => {
  const { itens, metodo, total } = req.body;
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ message: 'Itens da venda são obrigatórios.' });
  }
  const valorTotal = total || itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);

  // Inicia transação
  db.beginTransaction(err => {
    if (err) {
      console.error('[PDV POST] Erro ao iniciar transação:', err);
      return res.status(500).json({ message: 'Erro ao iniciar transação.' });
    }

    // 1) Gravar venda
    db.query('INSERT INTO vendas (total) VALUES (?)', [valorTotal], (e1, r1) => {
      if (e1) {
        console.error('[PDV POST] Erro ao salvar venda:', e1);
        return db.rollback(() => res.status(500).json({ message: 'Erro ao salvar venda.' }));
      }
      const vendaId = r1.insertId;

      // 2) Gravar itens
      const vals = itens.map(i => [vendaId, i.produto_id, i.quantidade, i.preco_unitario]);
      db.query(
        'INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES ?',
        [vals],
        e2 => {
          if (e2) {
            console.error('[PDV POST] Erro ao salvar itens:', e2);
            return db.rollback(() => res.status(500).json({ message: 'Erro ao salvar itens.' }));
          }

          // 3) Atualizar estoque
          Promise.all(
            itens.map(i => new Promise((resolve, reject) => {
              db.query(
                'UPDATE produtos SET quantidade_estoque = quantidade_estoque - ? WHERE id = ?',
                [i.quantidade, i.produto_id],
                err3 => err3 ? reject(err3) : resolve()
              );
            }))
          )
          .then(() => {
            // 4) Gravar ficha PDV
            db.query(
              'INSERT INTO vendas_pdv (venda_id, metodo, total) VALUES (?,?,?)',
              [vendaId, metodo, valorTotal],
              (e4, r4) => {
                if (e4) {
                  console.error('[PDV POST] Erro ao gravar ficha:', e4);
                  return db.rollback(() => res.status(500).json({ message: 'Erro ao gravar ficha PDV.' }));
                }
                // 5) Commit
                db.commit(e5 => {
                  if (e5) {
                    console.error('[PDV POST] Erro ao confirmar venda:', e5);
                    return db.rollback(() => res.status(500).json({ message: 'Erro ao confirmar venda.' }));
                  }
                  res.json({ message: 'Venda registrada!', id: vendaId, vendaId, ficha: r4.insertId, fichaNumero: r4.insertId });
                });
              }
            );
          })
          .catch(errStk => {
            console.error('[PDV POST] Erro ao atualizar estoque:', errStk);
            db.rollback(() => res.status(500).json({ message: 'Erro ao atualizar estoque.' }));
          });
        }
      );
    });
  });
});

// === Rota GET /api/pdv/vendas ===
app.get('/api/pdv/vendas', isAdmin, (req, res) => {
  const data = req.query.data;
  if (!data) {
    return res.status(400).json({ message: 'Data obrigatória no formato YYYY-MM-DD' });
  }
  const inicio = `${data} 00:00:00`;
  const fim    = `${data} 23:59:59`;

  const sql = `
    SELECT 
      vp.id    AS ficha,
      v.id     AS vendaId,
      v.data_venda,
      vp.metodo,
      vp.total AS total,
      vp.id    AS fichaNumero
    FROM vendas v
    JOIN vendas_pdv vp ON vp.venda_id = v.id
    WHERE v.data_venda BETWEEN ? AND ?
    ORDER BY vp.id DESC
  `;
  db.query(sql, [inicio, fim], (err, rows) => {
    if (err) {
      console.error('[GET /api/pdv/vendas] Erro ao buscar vendas PDV:', err);
      return res.status(500).json({ message: 'Erro ao buscar vendas.' });
    }
    // Renomeia para o que o frontend espera:
    const resultado = rows.map(r => ({
      ficha:        r.ficha,
      vendaId:      r.vendaId,
      data_venda:   r.data_venda,
      metodo:       r.metodo,
      totalVenda:   parseFloat(r.total),
      fichaNumero:  r.fichaNumero
    }));
    res.json(resultado);
  });
});

// Rota para buscar produtos para controle de estoque — sem isAdmin, ou com isAdmin se só admin acessar
app.get('/api/produtos/estoque', isAdmin, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const query = `
    SELECT 
      p.id, 
      p.nome, 
      p.codigo_produto, 
      p.preco_venda, 
      p.quantidade_estoque, 
      p.disponivel, 
      c.nome as nome_categoria
    FROM produtos p
    LEFT JOIN categorias_produto c ON p.categoria_id = c.id
    ORDER BY p.nome ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('[GET /api/produtos/estoque] Erro ao buscar produtos para controle de estoque:', err);
      return res.status(500).json({ message: 'Erro ao buscar produtos para controle de estoque.' });
    }
    res.json(results);
  });
});


// === Rotas HTML ===
const send = (file) => (req,res) => res.sendFile(path.join(__dirname, file));
app.get('/', send('index.html'));
app.get('/login.html', send('login.html'));
app.get('/register.html', send('register.html'));
app.get('/home.html', send('home.html'));
app.get('/perfil.html', send('perfil.html'));
app.get('/admin-perfil.html', isAdmin, send('admin-perfil.html'));
app.get('/esqueci.html', send('esqueci.html'));
app.get('/cardapio.html', send('cardapio.html'));
app.get('/gerenciar-categorias.html', isAdmin, send('gerenciar-categorias.html'));
app.get('/gerenciar-produtos.html', isAdmin, send('gerenciar-produtos.html'));
app.get('/controle-estoque.html', isAdmin, send('controle-estoque.html'));
app.get('/cadastrar-funcionario.html', isAdmin, send('cadastrar-funcionario.html'));
app.get('/administracao.html', isAdmin, send('administracao.html'));

// === Inicia servidor ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor Unilanches rodando em http://localhost:${PORT}`));
