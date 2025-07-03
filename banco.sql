-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS unilanches;

-- Usar o banco
USE unilanches;

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL,
    celular VARCHAR(20)
);
DESCRIBE usuarios;
ALTER TABLE usuarios ADD nome VARCHAR(100);

ALTER TABLE usuarios ADD COLUMN tipo VARCHAR(20) DEFAULT 'cliente';
ALTER TABLE usuarios DROP COLUMN tipo;

SELECT * FROM usuarios;

UPDATE usuarios 
SET tipo = 'funcionario' 
WHERE email = 'gabrielsouza@unifucamp.edu.br';

CREATE TABLE IF NOT EXISTS categorias_produto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE, -- Para uso em URLs e filtros (ex: 'salgados', 'hamburgueres')
    imagem_url VARCHAR(255), -- URL para a imagem da categoria (opcional)
    descricao TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    categoria_id INT, -- Chave estrangeira para categorias_produto
    codigo_produto VARCHAR(50) UNIQUE, -- Pode ser gerado ou manual
    finalidade VARCHAR(50) COMMENT 'Vendas, Uso Interno, Matéria Prima',
    unidade_medida VARCHAR(20) COMMENT 'Unidade, KG, Litro, Porção',
    referencia_interna VARCHAR(100),
    preco_custo DECIMAL(10, 2) DEFAULT 0.00,
    margem_lucro DECIMAL(5, 2), -- Percentual, ex: 20.00 para 20%
    preco_venda DECIMAL(10, 2) NOT NULL,
    imagem_url VARCHAR(255), -- URL para a imagem do produto
    descricao_longa TEXT,
    observacoes TEXT,
    disponivel BOOLEAN DEFAULT TRUE, -- Para controlar se aparece no cardápio
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias_produto(id) ON DELETE SET NULL -- Ou ON DELETE RESTRICT
);

