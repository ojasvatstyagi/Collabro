<p align="center">
  <img src="frontend/public/logo2.png" alt="Collabro Logo" width="200" />
</p>

# Collabro 🚀

> **Connect. Collaborate. Create.**  
> A comprehensive platform designed to bridge the gap between developers, designers, and creators, enabling seamless team formation and project collaboration.

![Status](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Table of Contents

- [Idea & Scope](#-idea--scope)
- [System Design](#-system-design)
- [Database Architecture](#-database-architecture)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Future Roadmap](#-future-roadmap)

---

## 💡 Idea & Scope

**Collabro** serves as a specialized networking ecosystem where individuals can showcase their skills, find specific projects that match their interests, and form teams. Unlike generic social networks, Collabro focuses on **skill-based matching** and **project lifecycle management**.

### Application Scope

The current implementation covers:

1.  **User Identity**: Secure authentication, profile building, and portfolio management.
2.  **Project Marketplace**: Users can post project ideas, recruit members, and browse opportunities.
3.  **Team Formation**: Automated and manual team creation with role-based member management.
4.  **Collaboration Tools**: Task assignment, progress tracking, and peer reviews.

---

## 🏗 System Design

Collabro follows a robust **Monolithic Architecture** (migratable to Microservices) with a clear separation of concerns between the Client and Server.

- **Frontend**: A Single Page Application (SPA) built with React and Vite, optimized for performance and responsiveness.
- **Backend**: A RESTful API service developed with Spring Boot, handling business logic, security, and data persistence.
- **Database**: Relational data model using MySQL for structured data integrity.

### High-Level Architecture

```mermaid
graph TD
    User[User / Client] -->|HTTPS| CDN[CDN / Static Assets]
    User -->|API Requests| LB[Load Balancer]
    LB -->|Traffic| API[Spring Boot REST API]
    API -->|Auth| Security[JWT + Spring Security]
    API -->|Data Access| JPA[Spring Data JPA]
    JPA -->|Read/Write| DB[(MySQL Database)]
    API -->|Async Tasks| Email[Email Service]
```

### 🔐 Authentication Architecture

Collabro employs a robust **Stateless Authentication** system designed for security and scalability, minimizing database load while ensuring session persistence.

#### Token Strategy

| Token Type        | Lifespan   | Storage                     | Purpose             |
| ----------------- | ---------- | --------------------------- | ------------------- |
| **Access Token**  | 15 minutes | Memory + localStorage       | API authentication  |
| **Refresh Token** | 7 days     | HTTP-only cookie + Database | Renew access tokens |

#### Authentication Flow

The following sequence diagram illustrates the complete login and automatic token refresh process:

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    Note over U,DB: Login Flow
    U->>FE: Enter credentials
    FE->>BE: POST /api/auth/login
    BE->>DB: Validate credentials
    DB-->>BE: User found
    BE->>BE: Generate access + refresh tokens
    BE->>DB: Save refresh token
    BE-->>FE: Access token (JSON) + Refresh cookie
    FE->>FE: Store access token

    Note over U,DB: API Request with Expired Token
    FE->>BE: API request + Bearer {expired token}
    BE-->>FE: 401 Unauthorized
    FE->>FE: Detect 401, trigger refresh
    FE->>BE: POST /api/auth/refresh (cookie auto-sent)
    BE->>DB: Validate refresh token
    DB-->>BE: Token valid
    BE->>BE: Generate new access token
    BE-->>FE: New access token
    FE->>FE: Update stored token
    FE->>BE: Retry original request
    BE-->>FE: Success response
```

#### Security Features

- **HTTP-Only Cookies**: Refresh tokens are inaccessible to client-side JavaScript, preventing XSS attacks.
- **Automatic Rotation**: New refresh tokens can be issued on use (configurable) to detect theft.
- **Database Revocation**: Admins can revoke sessions by deleting the refresh token from the database.
- **Race Condition Handling**: Frontend request queueing ensures multiple concurrent requests don't trigger multiple refreshes.

---

## 💾 Database Architecture

The database is designed to handle complex relationships between users, teams, and projects. Below is the Entity Relationship (ER) Diagram representing the core schema.

### ER Diagram

```mermaid
erDiagram
    Users ||--|| Profiles : "has"
    Users ||--o{ RefreshTokens : "owns"
    Users }o--|| Roles : "assigned"

    Profiles ||--|{ SocialLinks : "owns"
    Profiles ||--|{ Skills : "possesses"
    Profiles ||--|{ Posts : "authors"
    Profiles ||--|{ Projects : "creates"
    Profiles ||--|{ Tasks : "assigned to"
    Profiles ||--|{ Notifications : "receives"
    Profiles ||--|{ ChatMessages : "sends"
    Profiles ||--|{ ProjectFiles : "uploads"
    Profiles }o--|| Teams : "creates"
    Profiles }o--|| Teams : "owns"
    Profiles }|--|{ Teams : "member of"

    Projects ||--|{ Tasks : "contains"
    Projects ||--o| Teams : "managed by"
    Projects ||--o| Posts : "promoted via"
    Projects ||--|{ Reviews : "receives"
    Projects ||--|{ CollaborationRequests : "receives"
    Projects ||--|{ ChatMessages : "has chat"
    Projects ||--|{ ProjectFiles : "contains"

    Teams ||--o| Posts : "recruits via"

    Posts ||--|{ CollaborationRequests : "triggers"

    CollaborationRequests }|--|| Profiles : "requested by"

    Skills }o--|| SkillDefinitions : "defined by"

    Reviews }o--|| Profiles : "written by"
    Reviews }o--|| Profiles : "targets"
    Reviews }o--|| Projects : "for project"

    ChatMessages }|--|{ Profiles : "read by"

    Users {
        UUID id PK
        string username UK
        string email UK
        string password
        boolean isVerified
        datetime deletedAt
    }

    Profiles {
        UUID id PK
        UUID user_id FK
        string firstname
        string lastname
        string bio
        string education
        string location
        string phone
        string profilePictureUrl
        int completionPercentage
        boolean notificationsEnabled
        datetime deletedAt
    }

    Projects {
        UUID id PK
        UUID profile_id FK "createdBy"
        long team_id FK
        UUID post_id FK
        string title
        string description
        string status
        string level
        int teamSize
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Teams {
        long id PK
        UUID profile_id FK "createdBy"
        UUID owner_id FK "owner"
        string teamName
        string status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Tasks {
        UUID id PK
        UUID project_id FK
        UUID assigned_to FK
        string title
        string description
        string status
        string priority
        datetime deadline
        datetime createdAt
        datetime updatedAt
    }

    Posts {
        UUID id PK
        UUID profile_id FK "author"
        UUID project_id FK
        long team_id FK
        string postType
        string title
        string status
        datetime createdAt
    }

    CollaborationRequests {
        long id PK
        UUID project_id FK
        UUID profile_id FK "requester"
        string status
        string message
        string rejectionReason
        datetime createdAt
        datetime updatedAt
    }

    Reviews {
        UUID id PK
        UUID reviewer_id FK
        UUID reviewed_id FK
        UUID project_id FK
        int rating
        string comment
        datetime createdAt
        datetime updatedAt
    }

    RefreshTokens {
        long id PK
        UUID user_id FK
        string token UK
        datetime expiryDate
        datetime createdAt
    }

    Notifications {
        UUID id PK
        UUID recipient_id FK
        string type
        boolean isRead
        UUID relatedEntityId
        string relatedEntityType
        string payload
        datetime createdAt
    }

    ChatMessages {
        UUID id PK
        UUID project_id FK
        UUID sender_id FK
        string content
        datetime createdAt
    }

    ProjectFiles {
        UUID id PK
        UUID project_id FK
        UUID uploaded_by_id FK
        string fileName
        string fileUrl
        string fileType
        long size
        datetime createdAt
    }

    Skills {
        UUID id PK
        UUID profile_id FK
        UUID skill_definition_id FK
        string proficiency
        datetime createdAt
    }

    SkillDefinitions {
        UUID id PK
        string name UK
        string category
    }

    SocialLinks {
        UUID id PK
        UUID profile_id FK
        string platform
        string url
    }

    Roles {
        long id PK
        string name UK
    }
```

---

## ✨ Core Features

### 🔐 Authentication & Security

- **Secure Registration/Login** with JWT (JSON Web Tokens).
- **Email Verification** using OTP.
- **Role-Based Access Control** (User/Admin).
- **Password Management** (hashing, reset flows).

### 👤 Profile Management

- **Skill Matrix**: Add skills with proficiency levels.
- **Social Integration**: Link GitHub, LinkedIn, and Portfolio.
- **Profile Strength**: Real-time calculation of profile completeness.
- **Avatar Management**: Upload and manage profile pictures.

### 🚀 Project & Team Collaboration

- **Project Creation**: Detailed project specs including tech stack and expected duration.
- **Team Assembly**: Create teams, invite members, and manage rosters.
- **Task Board**: Assign tasks to specific team members with deadlines.
- **Reviews**: Peer review system to build reputation.

### 🤝 Networking

- **Collaboration Requests**: Apply to join projects or teams.
- **Smart Matching**: (Upcoming) Algorithm to recommend projects based on skills.
- **Matchmaking & search**: Find developers and projects based on filters.

---

## 🛠 Tech Stack

### Frontend (Client)

| Tech             | Description                                    |
| :--------------- | :--------------------------------------------- |
| **React 18**     | UI Library for building interactive interfaces |
| **Vite**         | Next Generation Frontend Tooling               |
| **TypeScript**   | Static typing for better developer experience  |
| **TailwindCSS**  | Utility-first CSS framework for styling        |
| **Lucide React** | Beautiful & consistent icon set                |
| **Axios**        | Promise based HTTP client                      |
| **React Router** | Declarative routing                            |

### Backend (Server)

| Tech                | Description                                  |
| :------------------ | :------------------------------------------- |
| **Java 21**         | Core programming language                    |
| **Spring Boot 3.4** | Framework for building production-ready apps |
| **Spring Security** | Authentication and Access Control            |
| **Spring Data JPA** | Abstraction over JDBC/Hibernate              |
| **MySQL**           | Main relational database                     |
| **Lombok**          | Boilerplate code reduction                   |
| **JJWT**            | JWT creation and verification                |

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- **Node.js** (v18+)
- **Java JDK** (21)
- **MySQL** (Running locally or via Docker)
- **Maven** (Included via wrapper)

### 1. Clone the Repository

```bash
git clone https://github.com/ojasvatstyagi/Collabro.git
cd Collabro
```

### 2. Backend Setup

Navigate to the backend directory and configure the database.

```bash
cd backend
```

**Configure Database:**
Update `src/main/resources/application.properties` with your MySQL credentials:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/collabro_db
spring.datasource.username=root
spring.datasource.password=yourpassword
```

**Run the Application:**

```bash
./mvnw spring-boot:run
```

The server will start on `http://localhost:8080`.

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory.

```bash
cd frontend
```

**Install Dependencies:**

```bash
npm install
```

**Run Development Server:**

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🌟 Future Roadmap

- [ ] **Real-time Chat**: WebSocket implementation for team communication.
- [ ] **AI Recommendation Engine**: Analyzing user skills to suggest the perfect team.
- [ ] **CI/CD Integration**: Automated testing and deployment pipelines.
- [ ] **Mobile App**: Native mobile experience using React Native.

---

<p align="center">Made by the Collabro Team</p>
