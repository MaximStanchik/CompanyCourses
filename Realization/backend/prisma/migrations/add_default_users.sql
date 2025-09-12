-- Добавление админа в базу данных ItCourses
INSERT INTO "User" (username, email, password, role, "isVerified", "createdAt", "updatedAt")
VALUES ('admin12345', 'admin@example.com', '$2a$05$7Cqu098ySvvJUrOViilV5OCSi6pdddznShJ/LpUBRYyo2n6IjA4YS', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Добавление юзера в базу данных ItCourses
INSERT INTO "User" (username, email, password, role, "isVerified", "createdAt", "updatedAt")
VALUES ('user12345', 'user@example.com', '$2a$05$7Cqu098ySvvJUrOViilV5OCSi6pdddznShJ/LpUBRYyo2n6IjA4YS', 'USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
