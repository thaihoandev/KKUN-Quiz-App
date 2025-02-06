# QuizAppBackend

A backend service for a quiz application built using **Spring Boot**. This application supports creating quizzes, adding questions, and managing options for different types of questions.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Quiz Management**: Create, update, delete quizzes.
- **Question Management**:
    - Support for multiple question types (e.g., multiple-choice, true/false).
    - Soft delete functionality for questions.
- **Option Management**: Add, update, and delete options for questions.
- **Database Integration**: Fully integrated with a relational database using JPA.
- **Error Handling**: Provides meaningful error messages for common issues.

---

## Technologies Used

- **Java 22**
- **Spring Boot**
    - Spring Data JPA
    - Spring Web
- **H2 / PostgreSQL** (as database)
- **Lombok** (for cleaner code)
- **ModelMapper** (for DTO to Entity mapping)
- **Maven** (as build tool)

---

## Prerequisites

- **Java Development Kit (JDK)**: Version 21 or above.
- **Maven**: Ensure Maven is installed.
- **Database**:
    - H2 (default in-memory DB for local testing) or
    - PostgreSQL (for production use).

---

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/thaihoandev/QuizAppBackend.git
   cd QuizAppBackend
2. Run code