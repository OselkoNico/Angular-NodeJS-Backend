CREATE DATABASE IF NOT EXISTS gestion_proveedores
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE gestion_proveedores;

CREATE TABLE IF NOT EXISTS proveedores (
  cif         VARCHAR(20)  PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  activity    VARCHAR(120),
  address     VARCHAR(200),
  city        VARCHAR(100),
  postal_code VARCHAR(5),
  phone       VARCHAR(15),
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(120) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;