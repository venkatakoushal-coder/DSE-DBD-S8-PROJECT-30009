CREATE DATABASE IF NOT EXISTS edtech_db;
USE edtech_db;

DROP TABLE IF EXISTS educator_interventions;
DROP TABLE IF EXISTS quiz_submissions;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS student_progress;
DROP TABLE IF EXISTS learning_materials;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher') NOT NULL,
  department VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE courses (
  course_id INT AUTO_INCREMENT PRIMARY KEY,
  course_code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  teacher_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE enrollments (
  enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_course (student_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE learning_materials (
  material_id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  material_type VARCHAR(50) NOT NULL,
  resource_url TEXT NOT NULL,
  sequence_order INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE student_progress (
  progress_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  material_id INT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES learning_materials(material_id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_material (student_id, material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quizzes (
  quiz_id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  total_marks INT NOT NULL,
  passing_marks INT NOT NULL,
  time_limit_minutes INT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quiz_questions (
  question_id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL,
  points INT NOT NULL DEFAULT 1,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quiz_submissions (
  submission_id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  student_id INT NOT NULL,
  score INT NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  passed BOOLEAN NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE educator_interventions (
  intervention_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  message TEXT NOT NULL,
  resource_url TEXT NULL,
  status VARCHAR(50) DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (user_id, full_name, email, password, role, department) VALUES
(1, 'Prof. Alan Turing', 'teacher@edtech.edu', '$2a$10$wG10EqyY6MEvrgcpV0nr6uo5p5/7OeOw8BI.XMCFSWc.RIyhGZrVW', 'teacher', 'Computer Science'),
(2, 'Ada Lovelace', 'student@edtech.edu', '$2a$10$wG10EqyY6MEvrgcpV0nr6uo5p5/7OeOw8BI.XMCFSWc.RIyhGZrVW', 'student', 'Computer Science');

INSERT INTO courses (course_id, course_code, title, category, description, teacher_id) VALUES
(1, 'CS101', 'Data Structures and Algorithms', 'Computer Science', 'Comprehensive introduction to core data structures including arrays, linked lists, stacks, queues, trees, and searching/sorting algorithms.', 1),
(2, 'CS102', 'Database Management Systems', 'Information Technology', 'Concepts of relational database modeling, SQL querying, normalization, indexing, transaction ACID properties, and relational algebra.', 1);

INSERT INTO enrollments (enrollment_id, student_id, course_id, status) VALUES
(1, 2, 1, 'active');

INSERT INTO learning_materials (material_id, course_id, title, material_type, resource_url, sequence_order) VALUES
(1, 1, 'Introduction to Arrays and Memory Representation', 'video', 'https://www.youtube.com/watch?v=RBSGKlAoiM4', 1),
(2, 1, 'Singly and Doubly Linked Lists Architecture', 'pdf', 'https://web.stanford.edu/class/cs106b/lectures/linked-lists.pdf', 2),
(3, 1, 'Stack and Queue Operations with Applications', 'article', 'https://en.wikipedia.org/wiki/Stack_(abstract_data_type)', 3),
(4, 1, 'Lab Assignment 1: Custom Doubly Linked List', 'assignment', 'https://github.com/topics/data-structures-assignment', 4),
(5, 2, 'Relational Database Concepts and Relational Algebra', 'video', 'https://www.youtube.com/watch?v=HXV3zeRR3h4', 1),
(6, 2, 'SQL Joins, Grouping and Aggregations Guide', 'pdf', 'https://learnsql.com/blog/sql-joins-cheat-sheet/', 2),
(7, 2, 'Database Normalization: 1NF to BCNF Rules', 'article', 'https://en.wikipedia.org/wiki/Database_normalization', 3);

INSERT INTO student_progress (progress_id, student_id, course_id, material_id, is_completed, completed_at) VALUES
(1, 2, 1, 1, 1, CURRENT_TIMESTAMP);

INSERT INTO quizzes (quiz_id, course_id, title, total_marks, passing_marks, time_limit_minutes) VALUES
(1, 1, 'Data Structures Fundamentals Quiz', 10, 6, 10);

INSERT INTO quiz_questions (question_id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, points) VALUES
(1, 1, 'What is the time complexity to access an element by index in a contiguous array?', 'O(1)', 'O(n)', 'O(log n)', 'O(n^2)', 'A', 5),
(2, 1, 'Which data structure strictly adheres to the Last-In-First-Out (LIFO) operational principle?', 'Queue', 'Stack', 'Tree', 'Graph', 'B', 5);

INSERT INTO educator_interventions (intervention_id, teacher_id, student_id, course_id, message, resource_url, status) VALUES
(1, 1, 2, 1, 'Welcome to CS101. Please review the first lesson on memory representation before the practical lab.', 'https://web.stanford.edu/class/cs106b/lectures/linked-lists.pdf', 'sent');
