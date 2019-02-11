const asyncify = require('express-asyncify');
const express = require('express');
const mysql = require('promise-mysql');
const fs = require('fs');
const ejs = require('ejs');
const url = require('url');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');


const router = asyncify(express.Router());
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    database: 'test',
    password: 'test'
});


router.use(bodyParser.urlencoded({extended: false}));
router.use(methodOverride('_method'));


// 전체 페이지
router.get("", async function (req, res) {
    try {
        const products = await pool.query('SELECT COUNT(*) AS cnt FROM products');
        const pagingParams = await calculatePagingParams(req, products);
        await renderList(res, pagingParams);
    } catch (e) {
        console.error(e);
    }
});

//삽입 페이지
router.get("/new", async function (req, res) {
    try {
        res.render('insert');
    } catch (e){
        console.error(e);
    }
});

//삽입
router.post("", async function (req, res) {
    try {
        await pool.query('INSERT INTO products(name,modelnumber,series) VALUE (?,?,?)', [req.body.name, req.body.num, req.body.section]);
        res.redirect('/products');
    } catch(e){
        console.error(e);
    }
});

//상세보기
router.get("/:id", async function (req, res) {
    try {
        console.log("상세보기");
        const products = await pool.query('select * from products where id = ?', [req.params.id]);
        res.render('detail', {data:products[0]});
    } catch (e) {
        console.error(e);
    }
});

//수정 페이지
router.get("/:id/edit", async function (req, res) {
    try {
        console.log("수정 페이지");
        const products = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        res.render('edit', {data: products[0]});
    } catch (e) {
        console.error(e)
    }
});

//수정
router.put("/:id", async function (req, res) {
    try {
        console.log("수정 포스트 진행");
        await pool.query('update products set name = ?, modelnumber = ?, series = ? where id = ?', [req.body.name, req.body.num, req.body.section, req.params.id]);
        res.redirect('/products');
    } catch (e) {
        console.error(e);
    }
});

// 삭제
router.delete("/:id", async function (req,res) {
    try {
        console.log('삭제진행');
        const productID = req.params.id;
        await pool.query('DELETE FROM products WHERE id = ?', [productID]);
        res.redirect("/products")
    } catch(e){
        console.error(e);
    }
});

// //메인화면
// router.get("/main", async function (req, res) {
//     try {
//         console.log("메인화면");
//         const template = await fs.readFileSync('main.html','utf-8');
//         res.send(template);
//     } catch (e) {
//         console.error(e);
//     }
// });
//
// router.post("/main", async function (req,res) {
//     try{
//         console.log("로그인 진행");
//         const template = await fs.readFileSync('main.html','utf-8');
//         const users = await pool.query('SELECT * FROM users');
//         const login = await userLogin(req, users);
//         if(login) {
//             res.redirect('/paging/1');
//         } else {
//             //res.status(401).redirect('/main')
//             res.send(ejs.render(template,{login: login}));
//         }
//     } catch (e) {
//         console.error(e)
//     }
// });
//
// const userLogin = (req, users) =>{
//     for(let i = 0; i< users.length; i++){
//         if (req.body.userID === users[i].user_id && req.body.userPASS === users[i].password) {
//             return true;
//         }
//     }
//     return false;
// }

// 페이징에 필요한 parameter 생성
const createPagingParams = () => {
    return {
        contentsPerPage: 10,
        pagePerSet: 10,
        offset: 0
    }
};

//페이징에 필요한 parameter 계산 후 저장
const calculatePagingParams = (req, products) => {
    const pp = createPagingParams();

    //전체 게시물의 개수
    pp.totalContentsCount = products[0].cnt > 0 ? products[0].cnt : 0 ;

    //현재 페이지
    if (req.url === '/'){
        pp.curPage = 1
    }else {
        pp.curPage = req.query.cur;
    }
    pp.totalPage = Math.ceil(pp.totalContentsCount / pp.contentsPerPage);// 전체 페이지수
    pp.totalSet = Math.ceil(pp.totalPage / pp.pagePerSet); //전체 세트수 (세트: 10페이지가 한세트)
    pp.curSet = Math.ceil(pp.curPage / pp.pagePerSet); // 현재 세트 번호
    pp.startPage = ((pp.curSet - 1) * 10) + 1; //현재 세트에서 출력될 시작 페이지
    pp.endPage = (pp.startPage + pp.pagePerSet) - 1; //현재 세트에서 출력될 마지막 페이지

    console.log(`\n\n현재 페이지/전체 페이지 (${pp.curPage} / ${pp.totalPage})`);

    //현재 페이지에서 보이는 첫 게시물의 번호
    if (pp.curPage < 0) {
        pp.offset = 0
    } else {
        pp.offset = (pp.curPage - 1) * 10
    }
    // console.log(pp);

    return pp;
};

//pp: Paging Params
const renderList = async (res, pp) => {
    const products = await pool.query('SELECT * FROM products ORDER BY id DESC LIMIT ?,?', [pp.offset, pp.contentsPerPage]);
    res.render('list', {data:products, paging:pp});
};


module.exports = router;