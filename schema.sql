
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
    created_at DATETIME NOT NULL DEFAULT(DATETIME('now')),
    recommend_count INTEGER NOT NULL default (0)
);
alter table post add column comment_count integer NOT NULL default(0);
create table block_ip (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip varchar (16) not null
);
create table comment_recommend_users(
    id integer primary key autoincrement,
    comment_id integer not null ,
    user_id varchar (32) not null
);
alter table user add column last_login datetime ;
alter table comment_recommend_users add column post_id integer;
alter table post add column comment_count integer not null default (0);
COMMIT;


