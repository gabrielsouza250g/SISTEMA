const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin', // coloque sua senha aqui
    database: 'unilanches'
});

connection.connect();

exports.registerUser = (req, res) => {
    const { email, senha } = req.body;
    if (!email.endsWith('@unifucamp.edu.br')) {
        return res.status(400).send({ message: 'Email institucional inválido.' });
    }
    connection.query('INSERT INTO usuarios (email, senha) VALUES (?, ?)', [email, senha], (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: 'Usuário cadastrado com sucesso!' });
    });
};

exports.loginUser = (req, res) => {
    const { email, senha } = req.body;
    connection.query('SELECT * FROM usuarios WHERE email = ? AND senha = ?', [email, senha], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(401).send({ message: 'Credenciais inválidas.' });
        res.send({ message: 'Login realizado com sucesso!' });
    });
};
