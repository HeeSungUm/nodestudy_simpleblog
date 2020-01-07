
BEGIN;

INSERT INTO user (id, password, is_admin)
VALUES
("root", "password", 1),
("test1", "password", 0),
("test2", "password", 0),
("test3", "password", 0)
;


INSERT INTO post(title, user_id, content, view_count, recommend_count)
VALUES
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100),
("SAMPLE TITLE", "test1" ,"SAMPLE CONTENT", 100, 100)
;

INSERT INTO post(id, title, user_id,content, view_count, recommend_count)
VALUES
(101, "오늘의 일기", "test1","ㅎㅎㅎ<br>GG!", 1010,22),
(102, "오늘의 일기2", "test1","ㅋㅋㅋㅋㅋㅋ", 3, 1),
(103, "냠냠 후루룩", "test1","야호야호", 10, 3),
(104, "오늘의 점심", "test1","굿굿", 15, 20)
;


INSERT INTO comment(post_id, user_id, content) 
VALUES
(101, "test1", "정말 멋져요 ><"),
(101, "test1", "헤헤헤ㅔ"),
(101, "test2", "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ"),
(102, "test1", "헤헤헤ㅔ"),
(102, "test2", "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ"),
(102, "test3", "헤헤헤ㅔ"),
(103, "test3", "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ"),
(103, "test3", "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ"),
(104, "test2", "gggg")
;

insert into comment_recommend_users (comment_id, user_id, post_id)
values
(1, "test1", "101");



COMMIT;

