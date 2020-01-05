var express = require("express");
var bodyParser = require("body-parser");
var api = require("./api.js");
var sqlite3 = require("sqlite3").verbose()
var db = new sqlite3.Database("./blog.db");
var session = require('express-session');
var url = require("url");
var app = express();

// 뷰 등록 + 템플릿 엔진 등록
app.set('views', __dirname + '/views'); // 템플릿이 있는 디렉토리
app.set('view engine', 'ejs'); // 템플릿 엔진
app.engine('html', require('ejs').renderFile);

// 정적 파일 디렉터리 등록
app.use('/public', express.static(__dirname + '/public'));

// 세션 설정
app.use(session({
    secret: 'password123!@#',
    resave: false,
    saveUninitialized: true
   }));

// POST 요청 처리를 위한 body-parser
app.use(bodyParser.urlencoded({ extended: true }));


//////// URL Routing ////////////
app.get("/", function(req, res) {
    obj = {
        user_id: req.session.user_id || null,
        message: req.query.message
    }
    res.render("index.ejs", obj);
});

// 게시물 목록 가져오기
// query 값 목록
// * sort
// - view_count: 조회수 정렬
// - recommend: 추천수 정렬
// * page
// 페이지 인덱스(1부터 시작)
app.get("/posts/:page", function(req, res) {
    var page = req.params.page
    var query = {
        page: page,
    }
    // Sample RESULT
    // result = {
    //     posts: [
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1},
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1},
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1},
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1},
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1},
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1},
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1}
    //     ],
    //     page: page,
    //     max_page: 1
    // }
    api.post.get_list(db, query, function(err, result) {
        if(err) {
            res.sendStatus(500);
        }
        else {
            res.render("posts.ejs", result);
        }
    }) 
});

// id 게시물 가져오기
app.get("/post/:id", function(req, res) {
    // SAMPLE RESULT
    // obj = {
    //     user_id: req.session.user_id || null,
    //     post: {
    //         id: req.params.id,
    //         title: "야호야호",
    //         content: "asdsafjkefqofnqnw<br>"
    //     },
    //     comments: [
    //         { id: 1, user_id: "root", content: "ㅋㅋㅋㅋㅋ "},
    //         { id: 2, user_id: "test1", content: "ㅋㅋㅋㅋㅋ "},
    //         { id: 3, user_id: "test2", content: "ㅋㅋㅋㅋㅋ "},
    //         { id: 4, user_id: "test3", content: "ㅋㅋㅋㅋㅋ "}
    //     ]
    // }
    api.post.get(db, req.params.id, function(err, result) {
        console.log(err, result);
        if(err) {
            res.sendStatus(500);
        }
        else if(result.post) {
            result.user_id = req.session.user_id || null;
            api.post.increase_view_count(db, req.params.id, function(err) {
                res.render("post.ejs", result);
            });
        }
        else {
            res.sendStatus(404);
        }
    })
    
});

// id 게시물에 댓글 추가
// Body 값
// - content: 댓글 내용
app.post("/post/:post_id/comments", function(req, res) {
    if(req.session.user_id) {
        var post_id = req.params.post_id;
        api.comment.create(db, req.session.user_id, post_id, req.body.content,
            function(err) {
                if(err) {
                    res.sendStatus(500);
                } else {
                    res.redirect("/post/" + post_id);
                }
            });
    }
    else {
        // 401 Unauthorized
        res.sendStatus(401);
    }
})

// 추천!
app.get("/post/:post_id/recommend", function(req, res) {
    api.post.increase_recommend_count(db, req.params.post_id, function(err) {
        if(err) {
            res.sendStatus(500);
        } else {
            res.redirect("/post/" + req.params.post_id);
        }
    })
});

// id 댓글 삭제
app.get("/comment/:comment_id/delete", function(req, res) {
    var user_id = req.session.user_id || null;
    if(user_id) {
        var post_id = req.query.post_id;
        var comment_id = req.params.comment_id;
        api.comment.delete(db, user_id, comment_id, function(err, result) {
            res.redirect("/post/" + post_id);    
        })
    }
    else {
        // 401 Unauthorized
        res.sendStatus(401);
    }
})

// 로그인 페이지 가져오기
app.get("/login", function(req, res) {
    res.render("login.ejs", req.query);
});

// 회원가입 페이지 가져오기
app.get("/signup", function(req, res) {
    res.render("signup.ejs", req.query);
});

// 회원가입 요청
app.post("/users", function(req, res) {
    var body = req.body;
    var id = body.id;
    var pw1 = body.password;
    var pw2 = body.password2;

    // ID가 일치하는가?
    if(pw1 === pw2) {
        api.user.create(db, req.body, function(success) {
            if(success) {
                res.redirect(url.format({
                    pathname: "/login",
                    query: {
                        message: "회원가입에 성공했습니다. 로그인해주세요."
                    }
                }));
            }
            else {
                res.redirect(url.format({
                    pathname: "/signup", 
                    query: {
                        message: "이미 존재하는 ID입니다."
                    }
                }));
            }
        });
    }
    else {
        res.redirect(url.format({
            pathname: "/signup", 
            query: {
                message: "비밀번호가 일치하지 않습니다."
            }
        }));
    } 
});

// 로그인 요청
app.post("/login", function(req, res) {
    api.user.login(db, req.body.id, req.body.password, function(err, rows){
        if(rows.length > 0 ) {
            if (rows[0].is_deleted === 1){
                res.send("관리자에 의해 회원탈퇴 되었습니다.")
            }else{
                req.session.user_id = req.body.id;
                req.session.is_admin = false;
                api.user.last_login(db, req.body.id, function (err) {
                    if(err){
                        res.sendStatus(500);
                    }
                });
                res.redirect("/");
            }
        }
        else {
            res.redirect(url.format({
                pathname: "/login",
                query: {
                    message: "잘못된 ID와 비밀번호입니다."
                }
            }));
        }
    });
});

// 로그아웃 요청
app.get("/logout", function(req, res) {
    req.session.destroy(function(err){
        res.redirect("/");
    })
});

// 회원탈퇴 요청
app.get("/leave", function(req, res) {
    var id = req.session.user_id
    api.user.delete(db, id, function(err){
        if(err) {
            res.sendStatus(500);
        }
        else {
            // 세션 비우기
            req.session.destroy(function(err){
                res.redirect(url.format({
                    pathname:  "/",
                    query: {
                        message: "회원탈퇴되었습니다."
                    }
                }));
            })
        }
    });
});
// 게시물 작성하기
app.get("/write", function(req, res) {
    if(req.session.user_id ==null) {
        res.sendStatus(403);
        return;
    }

    res.render("write.ejs");
});

// 게시물 작성 POST 요청
// title: 제목
// content: 내용
app.post("/write", function(req, res) {
    if(req.session.user_id ==null) {
        res.sendStatus(403);
        return;
    }

    api.post.create(db, req.body.title, req.session.user_id, req.body.content, function(err, post_id) {
        if(err) {
            res.sendStatus(500);
        } else {
            res.redirect("/post/" + post_id);
        }    })
});



//
//
//
//////// Admin /////////
app.get("/admin", function(req, res) {
    // 관리자 로그인이 안되어있으면 관리자 로그인으로 이동
    if(req.session.is_admin) {
        res.render("admin.ejs");
    }
    else {
        res.redirect("/admin/login");
    }
});


// 관리자 로그인 페이지를 가져옵니다.
app.get("/admin/login", function(req, res) {
    res.render("admin_login.ejs", {
        message: req.query.message
    });
});

// 관리자 로그인 페이지에서 로그인 시도를 할 경우.
app.post("/admin/login", function(req, res) {
    var id = req.body.id;
    var pw = req.body.password;

    api.admin.login(db, id, pw, function(err, result) {
        if(err) {
            res.sendStatus(500);
        }
        else if(result) {
            req.session.user_id = id;
            req.session.is_admin = true;
            res.redirect("/admin");
        }
        else {
            res.redirect(url.format({
                pathname: "/admin/login",
                query: {
                    message: "잘못된 ID 혹은 비밀번호입니다."
                }
            }));
        }
    })
    
});

// 관리자 로그아웃
app.get("/admin/logout", function(req, res) {
    req.session.destroy(function(err){
        res.redirect("/admin");
    })
});

// 게시물 작성하기
app.get("/admin/write", function(req, res) {
    if(!req.session.is_admin) {
        res.sendStatus(403);
        return;
    }

    res.render("admin_write.ejs");
});

// 게시물 작성 POST 요청
// title: 제목
// content: 내용
app.post("/admin/write", function(req, res) {
    if(!req.session.is_admin) {
        res.sendStatus(403);
        return;
    }

    api.post.create(db, req.body.title, req.body.content, function(err, post_id) {
        if(err) {
            res.sendStatus(500);
        } else {
            res.redirect("/post/" + post_id);
        }
    })
});

// 게시물 목록 보기
app.get("/admin/posts/:page", function(req, res) {
    if(!req.session.is_admin) {
        res.sendStatus(403);
        return;
    }

    var page = parseInt(req.params.page);
    var query = {
        page: page
    };
    // SAMPLE 
    // obj = {
    //     posts: [
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1},
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1},
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1},
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1},
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1},
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1},
    //         {id: 1, title: "HIHIHI", view_count: 1, recommend_count: 1}
    //     ],
    //     page: page,
    //     max_page: 100
    // }
    api.post.get_list(db, query, function(err, result) {
        if(err) {
            res.sendStatus(500);
        }
        else {
            res.render("admin_posts.ejs", result);
        }
    }) 
});

// 게시물 수정하기 페이지
app.get("/admin/post/:id/modify", function(req, res) {
    if(!req.session.is_admin) {
        res.sendStatus(403);
        return;
    }
    api.post.get(db, req.params.id, function(err, result) {
        if(err) {
            res.sendStatus(500);
        }
        else if(result) {
            res.render("admin_modify.ejs", result.post);
        }
        else {
            res.sendStatus(404);
        }
    });
});

// 게시물 수정 요청
app.post("/admin/post/:id/modify", function(req, res) {
    if(!req.session.is_admin) {
        res.sendStatus(403);
        return;
    }

    api.post.modify(db, req.params.id, req.body.title, req.body.content, function(err) {
        if(err) {
            res.sendStatus(500);
        } else {
            res.redirect("/admin/posts/1");
        }
    });
});

// 게시물 삭제하기
app.get("/admin/post/:id/delete", function(req, res) {
    if(!req.session.is_admin) {
        res.sendStatus(403);
        return;
    }

    api.post.delete(db, req.params.id, function(err) {
        if(err) {
            res.sendStatus(500);
        } else {
            res.redirect("/admin/posts/1");
        }
    });
});

// 유저 목록
app.get("/admin/users/:page", function(req, res) {
    if(!req.session.is_admin) {
        res.sendStatus(403);
        return;
    }

    // SAMPLE
    // result = {
    //     page: page,
    //     max_page: 100,
    //     users: [
    //         { id: "test1" },
    //         { id: "test2" },
    //         { id: "test22" },
    //         { id: "test31" },
    //         { id: "test4" },
    //         { id: "test5" },
    //     ]
    // };

    var page = parseInt(req.params.page);
    var query = {
        page: page
    };
    api.user.get_list(db, query, function(err, result) {
        if(err) {
            res.sendStatus(500);
        } else {
            res.render("admin_users.ejs", result);
        }
    });
});
//관리자 계정
app.get("/admin/admin_users/:page", function(req, res) {
    if(!req.session.is_admin) {
        res.sendStatus(403);
        return;
    }

    // SAMPLE
    // result = {
    //     page: page,
    //     max_page: 100,
    //     users: [
    //         { id: "test1" },
    //         { id: "test2" },
    //         { id: "test22" },
    //         { id: "test31" },
    //         { id: "test4" },
    //         { id: "test5" },
    //     ]
    // };

    var page = parseInt(req.params.page);
    var query = {
        page: page
    };
    api.user.admin_get_list(db, query, function(err, result) {
        if(err) {
            res.sendStatus(500);
        } else {
            res.render("admin_admin_users.ejs", result);
        }
    });
});

// id 유저 삭제
app.get("/admin/user/:id/delete", function(req, res) {
    if(!req.session.is_admin) {
        res.sendStatus(403);
        return;
    }

    api.user.delete(db, req.params.id, function(err) {
        if(err) {
            res.sendStatus(500);
        } else {
            res.redirect("/admin/users/1")
        }
    });
});

// 댓글목록 보기
app.get("/admin/comments/:page", function(req, res) {
    if(!req.session.is_admin) {
        res.sendStatus(403);
        return;
    }

    var page = parseInt(req.params.page);
    var query = {
        page: page
    };
    // obj = {
    //     page: page,
    //     max_page: 100,
    //     comments: [
    //         { user_id: "test1", content: "ㅋㅋㅋㅋㅋ" },
    //         { user_id: "test2", content: "ㅋㅋㅋㅋㅋ"  },
    //         { user_id: "test22", content: "ㅋㅋㅋㅋㅋ"  },
    //         { user_id: "test31", content: "ㅋㅋㅋㅋㅋ"  },
    //         { user_id: "test4", content: "ㅋㅋㅋㅋㅋ"  },
    //         { user_id: "test5", content: "ㅋㅋㅋㅋㅋ"  }
    //     ]
    // };
    api.comment.get_list(db, query, function(err, result) {
        if(err) {
            res.sendStatus(500);
        } else {
            res.render("admin_comments.ejs", result);
        }
    });
});

// 관리자가 특정 댓글 삭제
app.get("/admin/comment/:comment_id/delete", function(req, res) {
    if(!req.session.is_admin) {
        res.sendStatus(403);
        return;
    }

    api.comment.delete_by_admin(db, req.params.comment_id, function(err) {
        if(err) {
            res.sendStatus(500)
        }
        else {
            res.redirect("/admin/comments/1");
        }
    })
});


app.listen(12345, function() {
    console.log("서버를 시작합니다.")
});
