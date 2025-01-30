-- schema.sql

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Guardada en hash (bcrypt)
  createdAt TEXT,
  updatedAt TEXT
);

-- Tabla Year
CREATE TABLE IF NOT EXISTS Years (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  yearNumber INTEGER NOT NULL,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Tabla MonthlyRecords
CREATE TABLE IF NOT EXISTS MonthlyRecords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  yearId INTEGER NOT NULL,
  month INTEGER,
  grossSalary REAL,
  netSalary REAL,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (userId) REFERENCES Users(id),
  FOREIGN KEY (yearId) REFERENCES Years(id)
);

-- Tabla Accounts
CREATE TABLE IF NOT EXISTS Accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  name TEXT,
  type TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Tabla MonthlyBalances
CREATE TABLE IF NOT EXISTS MonthlyBalances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monthlyRecordId INTEGER NOT NULL,
  accountId INTEGER NOT NULL,
  balance REAL,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (monthlyRecordId) REFERENCES MonthlyRecords(id),
  FOREIGN KEY (accountId) REFERENCES Accounts(id)
);

-- Tabla Categories
CREATE TABLE IF NOT EXISTS Categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  name TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Tabla CategoryAllocations
CREATE TABLE IF NOT EXISTS CategoryAllocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monthlyRecordId INTEGER NOT NULL,
  categoryId INTEGER NOT NULL,
  percentageOfNet REAL,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (monthlyRecordId) REFERENCES MonthlyRecords(id),
  FOREIGN KEY (categoryId) REFERENCES Categories(id)
);

-- Tabla Funds
CREATE TABLE IF NOT EXISTS Funds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  name TEXT,
  isin TEXT,
  categoryType TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Tabla FundContributions
CREATE TABLE IF NOT EXISTS FundContributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monthlyRecordId INTEGER NOT NULL,
  fundId INTEGER NOT NULL,
  percentageOfInvestment REAL,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (monthlyRecordId) REFERENCES MonthlyRecords(id),
  FOREIGN KEY (fundId) REFERENCES Funds(id)
);
