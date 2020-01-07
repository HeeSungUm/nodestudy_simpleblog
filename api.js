exports.user = {
    last_login: function(db, id, next){
        var query = "UPDATE user SET last_login = Current_Timestamp WHERE id =?";
        var stmt= db.prepare(query);
        stmt.run(id, function (err) {
            next(err);
        });
    },
    create: function(db, body, next) {
        db.serialize(function(){
            var id= body.id;
            var password = body.password;
            var query = "INSERT INTO user(id, password) VALUES (?, ?)"
            var stmt = db.prepare(query);
            stmt.run(id, password, function (err) {
                if(err){
                    //동일한 id 존재
                    next(false)
                } else{
                    next(true)
                }
            });
            stmt.finalize();
        })
    },


    get_list: function(db, query, next) {
        var page = parseInt(query.page);
        db.serialize(function () {
            var result = {
                page:page,

            }
            var query = "SELECT * FROM user WHERE is_deleted = 0 AND is_admin != 1 ORDER BY created_at DESC LIMIT ?, 5";
            var stmt = db.prepare(query);
            stmt.all((page-1)*5, function (err, users) {
                result.users = users;
            });
            query = "SELECT (COUNT(*)-1)/5+1 as max_page FROM user WHERE is_deleted = 0 AND  is_admin != 1";
            db.all(query, function (err, max_page) {
                result.max_page = max_page[0].max_page;
                next(err, result)
            })
        });
    },
    admin_get_list: function(db, query, next) {
        var page = parseInt(query.page);
        db.serialize(function () {
            var result = {
                page:page,

            }
            var query = "SELECT * FROM user WHERE is_deleted = 0 AND is_admin = 1 ORDER BY created_at DESC LIMIT ?, 5";
            var stmt = db.prepare(query);
            stmt.all((page-1)*5, function (err, users) {
                result.users = users;
            });
            query = "SELECT (COUNT(*)-1)/5+1 as max_page FROM user WHERE is_deleted = 0 AND is_admin = 1";
            db.all(query, function (err, max_page) {
                result.max_page = max_page[0].max_page;
                next(err, result)
            })
        });
    },

    login: function(db, id, password, next) {
        db.serialize(function(){
            const query = "SELECT * FROM user where id=? AND password=? AND is_admin=0;";
            var stmt = db.prepare(query);
                stmt.all(id, password, function (err, result) {
                next(err, result);
                console.log(result)
            });
        })
    },

    delete: function(db, id, next) {
        db.serialize(function(){
            var query = "UPDATE user SET is_deleted=1 where id = ?";
            var stmt = db.prepare(query);
            stmt.run(id,  function (err) {
                if(err){
                    next(err);

                }
            });
            query = 'UPDATE post SET content = "관리자에 의해 삭제된 게시글 / 댓글입니다." where user_id = ?'
            stmt=db.prepare(query);
            stmt.all(id, function (err) {
                if (err){
                    next(err);
                }
            });
            query = 'UPDATE comment SET content = "관리자에 의해 삭제된 게시글 / 댓글입니다." where user_id = ?'
            stmt=db.prepare(query);
            stmt.all(id, function (err) {
                next(err)
            });
        })
    }
}

exports.post = {

    get_list: function(db, query, next) {
        var page = parseInt(query.page);
        var sorting = query.sort;
        db.serialize(function(){
            var result = {
                page : page,
                sort : sorting
            };
            if (sorting === "date") {
                query = "SELECT * FROM post ORDER BY created_at DESC " + "LIMIT ?, 5;";
            }
            else if(sorting === "recommend"){
                query = "SELECT * FROM post ORDER BY recommend_count DESC LIMIT ?, 5"
                console.log(query)
            }
            else{
                query = "SELECT * FROM post ORDER BY comment_count DESC LIMIT ?, 5"
            }
            var stmt = db.prepare(query);
            stmt.all((page-1) * 5,  function (err, posts) {
                result.posts = posts;
            });
            query = "SELECT (COUNT(*)-1) / 5 + 1 as max_page FROM post;";
            db.all(query,  function (err, query_result) {
                if (err){

                }else{
                    result.max_page = query_result[0].max_page;
                    next(err, result);
                }
            });
        })
    },

    // id를 가진 게시물을 DB에서 가져와서 next()로 전달.
    // 댓글도 함께 가져옴.
    get: function(db, id, next) {
        db.serialize(function(){
            var result={}
            var query = "SELECT * FROM post WHERE id = ?";
            var stmt = db.prepare(query);
            stmt.all(id, function (err, post) {
                if (post.length>0) {
                    result.post = post[0];
                }else {
                    result.post = {
                        title: "존재하지 않는 게시물입니다."
                    }
                }

            });
            query = "SELECT * FROM comment_recommend_users where post_id = ?"
            stmt = db.prepare(query);
            stmt.all(id, function (err, users) {
                recommend_users = {};
                recommend_users = users;
                result.recommed_users = recommend_users;
            })
            query = "SELECT * FROM comment WHERE post_id = ?";
            stmt = db.prepare(query);
            stmt.all(id, function (err, comments) {
                result.comments = comments;
                next(err, result);

            });

        })
    },

    // 게시물의 조회수를 증가시킴
    increase_view_count: function(db, id, next) {
      var query = "UPDATE post SET view_count = view_count + 1 WHERE id = ? ";
      var stmt = db.prepare(query);
      stmt.run(id, function (err) {
            next(err);
      });
    },

    // 게시물의 추천수를 증가시킴.
    increase_recommend_count: function(db, id, next) {
        var query = "UPDATE post SET recommend_count = recommend_count + 1 Where id = ?";
        var stmt = db.prepare(query);
        stmt.run(id, function (err) {
            next(err);
        })
    },


    // body에 있는 내용으로 새로운 게시물 작성
    create: function(db, title, user_id,content, next) {
        var query = "INSERT INTO post (title, user_id,content) VALUES (?, ? ,?)"
        var stmt = db.prepare(query)
        stmt.run(title, user_id,content, function (err) {
                next(err, this.lastID)
        });
    },

    // body에 있는 내용으로 id 게시물 변경
    modify: function(db, id, title, content, next) {
        var query = "UPDATE post SET title=?, content = ? WHERE id=?"
        var stmt = db.prepare(query)
        stmt.run(title, content, id, function (err) {
            next(err);
        })
    },

    // id 게시물 삭제
    delete: function(db, id, next) {

        var query = "DELETE FROM post WHERE id=?";
        var stmt = db.prepare(query);
        stmt.run(id, function (err) {
            next(err);

        })
    }
};

exports.comment = {

    create: function(db, uid, post_id, content, next) {
        var query =  "INSERT INTO comment(user_id, post_id, content) VALUES (?, ? ,?)";
        var stmt = db.prepare(query);
        stmt.run(uid, post_id, content, function (err) {
            if(err){
                res.sendStatus(500)
            }
            next(err)
        });
        query = "UPDATE post SET comment_count  = comment_count+1 where id = ?";
        stmt=db.prepare(query)
        stmt.run(post_id, function(err){
            if(err){
                res.sendStatus(500);
            }
        });
    },


    delete: function(db, user_id, comment_id, next) {
        var query = "DELETE FROM comment WHERE user_id = ? AND id=?";
        var stmt = db.prepare(query);
        stmt.run(user_id, comment_id, function (err) {
            next(err)
        })
    },

    delete_by_admin: function(db, comment_id, next) {
        var content = "관리자에 의해 삭제된 댓글입니다."
        var query = "UPDATE comment SET content = ? WHERE id = ?"
        stmt = db.prepare(query)
        stmt.run(content, comment_id, function (err) {
            if (err){

            }
            else{
                next(err);
            }
        })
    },
    increase_recommend_count: function(db, post_id, user_id, comment_id ,next) {
        var query = "UPDATE comment SET recommend_count = recommend_count + 1 Where post_id = ?";
        var stmt = db.prepare(query);
        stmt.run(post_id, function (err) {
            if (err){

            }
        })
        query = "INSERT INTO comment_recommend_users (comment_id, user_id, post_id) values (?, ?, ?)";
        stmt = db.prepare(query);
        stmt.run(comment_id, user_id, post_id, function (err) {
            next(err);
        })
    },
    decrease_recommend_count: function(db, post_id, user_id, comment_id ,next) {
        var query = "UPDATE comment SET recommend_count = recommend_count - 1 Where post_id = ?";
        var stmt = db.prepare(query);
        stmt.run(post_id, function (err) {
            if (err){

            }
        })
        query = "DELETE FROM comment_recommend_users where comment_id =? AND user_id = ? AND post_id = ? ";
        stmt = db.prepare(query);
        stmt.run(comment_id, user_id, post_id, function (err) {
            next(err);
        })
    },

    get_list: function(db, query, next) {
        var page = parseInt(query.page);
        db.serialize(function(){
            var result = {
                page : page
            };
            query = "SELECT * FROM comment ORDER BY created_at DESC " +
                "LIMIT ?, 5;";
            var stmt = db.prepare(query);
            stmt.all((page-1) * 5,  function (err, comments) {
                result.comments = comments;
            });
            query = "SELECT (COUNT(*)-1) / 5 + 1 as max_page FROM comment;";
            db.all(query,  function (err, query_result) {
                if (err){

                }else{
                    result.max_page = query_result[0].max_page;
                    next(err, result);
                }
            });
        })
    },
};

exports.admin = {

    login: function(db, id, password, next) {
        db.serialize(function () {
            var query = "SELECT * FROM user WHERE id=? AND password=? AND is_admin=1"
            var stmt = db.prepare(query);
            stmt.all(id, password, function (err, result) {
                next(err, result && result.length>0)
            });
        })
    },
    create: function(db, body, next) {
        db.serialize(function(){
            var id= body.id;
            var password = body.password;
            var query = "INSERT INTO user(id, password, is_admin) VALUES (?, ?, ?)"
            var stmt = db.prepare(query);
            stmt.run(id, password, 1, function (err) {
                if(err){
                    //동일한 id 존재
                    next(false)
                } else{
                    next(true)
                }
            });
            stmt.finalize();
        })
    },
    // 유저를 가져옴.
    get_user: function(db, id, next) {
        db.serialize(function(){
            var result={}
            var query = "SELECT * FROM user WHERE id = ?";
            var stmt = db.prepare(query);
            stmt.all(id, function (err, user) {
                if (user.length>0) {
                    result.id = user[0].id;
                    next(err, result)
                }else {
                    res.sendStatus(500)
                }

            });

        })
    },
    // body에 있는 내용으로 password 변경
    password_modify: function(db, id, password, next) {
        var query = "UPDATE user SET password = ? WHERE id=?";
        var stmt = db.prepare(query);
        stmt.run(password, id, function (err) {
            next(err);
        })
    },
    ip_block : function (db, ip) {
        var query = "INSERT INTO block_ip ip VALUE ?"

    }


}