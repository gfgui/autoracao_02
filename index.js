const express = require('express');
const session = require('express-session');
const { auth, db, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, limit, startAfter, orderBy } = require('./firebase');
const app = express();
const port = 3000;
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } = require('firebase/auth');

app.use(session({
    secret: 'yourSecret',
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.usuarioLogado = req.session.usuarioLogado || null;
    next();
});

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rota principal
app.get('/', async (req, res) => {
    try {
        // Página atual (padrão é 1)
        const page = parseInt(req.query.page) || 1;
        
        // Ordenação (padrão por nome, ascendente)
        const orderField = req.query.orderBy || 'nome'; // 'nome' ou 'preco'
        const direction = req.query.direction || 'asc'; // 'asc' ou 'desc'

        let lastVisible = null;

        if (page > 1) {
            // Precisamos buscar os documentos anteriores para encontrar o último documento da página anterior
            const previousQuery = query(
                collection(db, 'produtos'), 
                orderBy(orderField, direction), 
                limit(LIMIT * (page - 1))
            );
            const previousSnapshot = await getDocs(previousQuery);

            if (previousSnapshot.empty) {
                return res.redirect('/produtos?page=1');
            }

            // Último documento da página anterior
            lastVisible = previousSnapshot.docs[previousSnapshot.docs.length - 1];
        }

        // Consulta para a página atual
        const produtosQuery = lastVisible
            ? query(
                collection(db, 'produtos'), 
                orderBy(orderField, direction), 
                startAfter(lastVisible), 
                limit(LIMIT)
            )
            : query(collection(db, 'produtos'), orderBy(orderField, direction), limit(LIMIT));

        const produtosSnapshot = await getDocs(produtosQuery);
        const produtos = produtosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Verifica se há mais produtos para determinar se o botão "Próxima" deve aparecer
        let hasNextPage = false;
        if (produtos.length > 0) {
            const lastProduto = produtosSnapshot.docs[produtosSnapshot.docs.length - 1];
            const nextPageQuery = query(
                collection(db, 'produtos'), 
                orderBy(orderField, direction), 
                startAfter(lastProduto), 
                limit(1)
            );
            const nextPageSnapshot = await getDocs(nextPageQuery);
            hasNextPage = !nextPageSnapshot.empty;
        }

        // Renderiza a página de produtos com a lista de produtos e informações de paginação
        res.render('produtos', {
            produtos: produtos || [],
            currentPage: page,
            hasNextPage: hasNextPage,
            hasPreviousPage: page > 1,
            orderBy: orderField,
            direction: direction
        });
    } catch (error) {
        console.error('Erro ao recuperar produtos:', error);
        res.render('produtos', { produtos: [], error: 'Erro ao carregar produtos' });
    }
});

const LIMIT = 6;

// Rota de produtos
app.get('/produtos', async (req, res) => {
    try {
        // Página atual (padrão é 1)
        const page = parseInt(req.query.page) || 1;
        
        // Ordenação (padrão por nome, ascendente)
        const orderField = req.query.orderBy || 'nome'; // 'nome' ou 'preco'
        const direction = req.query.direction || 'asc'; // 'asc' ou 'desc'

        let lastVisible = null;

        if (page > 1) {
            // Precisamos buscar os documentos anteriores para encontrar o último documento da página anterior
            const previousQuery = query(
                collection(db, 'produtos'), 
                orderBy(orderField, direction), 
                limit(LIMIT * (page - 1))
            );
            const previousSnapshot = await getDocs(previousQuery);

            if (previousSnapshot.empty) {
                return res.redirect('/produtos?page=1');
            }

            // Último documento da página anterior
            lastVisible = previousSnapshot.docs[previousSnapshot.docs.length - 1];
        }

        // Consulta para a página atual
        const produtosQuery = lastVisible
            ? query(
                collection(db, 'produtos'), 
                orderBy(orderField, direction), 
                startAfter(lastVisible), 
                limit(LIMIT)
            )
            : query(collection(db, 'produtos'), orderBy(orderField, direction), limit(LIMIT));

        const produtosSnapshot = await getDocs(produtosQuery);
        const produtos = produtosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Verifica se há mais produtos para determinar se o botão "Próxima" deve aparecer
        let hasNextPage = false;
        if (produtos.length > 0) {
            const lastProduto = produtosSnapshot.docs[produtosSnapshot.docs.length - 1];
            const nextPageQuery = query(
                collection(db, 'produtos'), 
                orderBy(orderField, direction), 
                startAfter(lastProduto), 
                limit(1)
            );
            const nextPageSnapshot = await getDocs(nextPageQuery);
            hasNextPage = !nextPageSnapshot.empty;
        }

        // Renderiza a página de produtos com a lista de produtos e informações de paginação
        res.render('produtos', {
            produtos: produtos || [],
            currentPage: page,
            hasNextPage: hasNextPage,
            hasPreviousPage: page > 1,
            orderBy: orderField,
            direction: direction
        });
    } catch (error) {
        console.error('Erro ao recuperar produtos:', error);
        res.render('produtos', { produtos: [], error: 'Erro ao carregar produtos' });
    }
});

// Rota de cadastro de usuário
app.get('/cadastro', (req, res) => {
    res.render('cadastro', { user: null, success: null, error: null });
});

app.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        await updateProfile(user, {
            displayName: nome
        });

        res.render('cadastro', { success: 'Usuário registrado com sucesso!', user: user });
    } catch (error) {
        res.render('cadastro', { error: 'Erro ao cadastrar usuário: ' + error.message });
    }
});

// Rota de login
app.get('/login', (req, res) => {
    res.render('login', { user: req.session.usuarioLogado });
});

app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        req.session.usuarioLogado = user.displayName;

        res.redirect('/');
    } catch (error) {
        res.render('login', { error: 'Login inválido! ' });
    }
});

// Rota de logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// Rota de cadastro de produtos
app.get('/cadastro-produtos', (req, res) => {
    res.render('cadastro-produtos');
});

app.post('/cadastro-produtos', async (req, res) => {
    const { nomeProduto, descricao, preco, imgurl } = req.body;

    try {
        await addDoc(collection(db, 'produtos'), {
            nome: nomeProduto,
            descricao: descricao,
            preco: parseFloat(preco),
            imgurl: imgurl
        });

        res.redirect('/produtos');
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        res.render('cadastro-produtos', { error: 'Erro ao cadastrar produto' });
    }
});

// Rota para remover um produto
app.post('/remover-produto/:id', async (req, res) => {
    const id = req.params.id;
    const produtoRef = doc(db, 'produtos', id);

    try {
        await deleteDoc(produtoRef);
        res.redirect('/produtos');
    } catch (error) {
        console.error('Erro ao remover o produto:', error);
        res.status(500).send('Erro ao remover o produto');
    }
});


// Rota para exibir o formulário de edição de produto
app.get('/editar-produto/:id', async (req, res) => {
    const id = req.params.id;
    const produtoRef = doc(db, 'produtos', id);

    try {
        const produtoDoc = await getDoc(produtoRef);
        if (!produtoDoc.exists()) {
            return res.status(404).send('Produto não encontrado');
        }
        res.render('editar-produto', { produto: produtoDoc.data(), id });
    } catch (error) {
        console.error('Erro ao buscar produto para edição:', error);
        res.status(500).send('Erro ao buscar produto');
    }
});

// Rota para salvar as alterações de um produto
app.post('/editar-produto/:id', async (req, res) => {
    const id = req.params.id;
    const { nome, descricao, preco, imgurl } = req.body;
    const produtoRef = doc(db, 'produtos', id);

    try {
        await updateDoc(produtoRef, {
            nome,
            descricao,
            preco: parseFloat(preco),
            imgurl: imgurl
        });
        res.redirect('/produtos');
    } catch (error) {
        console.error('Erro ao atualizar o produto:', error);
        res.status(500).send('Erro ao atualizar o produto');
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
