
BEGIN TRANSACTION;

CREATE TABLE user (
    id VARCHAR(32) PRIMARY KEY,
    password VARCHAR(32) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT(0),
    created_at DATETIME NOT NULL DEFAULT(DATETIME('now')),
    is_deleted BOOLEAN NOT NULL default(0)
);

CREATE TABLE post (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(128) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    view_count INTEGER NOT NULL DEFAULT(0),
    recommend_count INTEGER NOT NULL DEFAULT(0),
    created_at DATETIME NOT NULL DEFAULT(DATETIME('now')),
    is_deleted BOOLEAN NOT NULL DEFAULT(0)
);

CREATE TABLE comment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT(DATETIME('now'))
);


COMMIT;

select * from post

alter