# Sawa-Skills
![Java](https://img.shields.io/badge/Backend-Java%20SpringBoot-green)
![React Native](https://img.shields.io/badge/Mobile-React%20Native-blue)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Python](https://img.shields.io/badge/ML-Python-yellow)
![Docker](https://img.shields.io/badge/DevOps-Docker-blue)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

SawaSkills is a social skill-exchange and volunteer learning platform that enables people to **trade skills, connect with others, participate in volunteer sessions, and learn collaboratively**.

The platform combines **skill swapping, social networking features, and machine learning powered content recommendations** to create a community-driven learning ecosystem.

---

# Project Overview

SawaSkills allows users to:

- Exchange skills with other users
- Offer skills for free as volunteers
- Connect with people who share similar skills
- Join volunteer learning sessions
- Communicate through real-time messaging
- Share posts, stories, and community discussions
- Receive skill-based news recommendations using machine learning

The system is designed as a **full-stack microservice-based platform** including a mobile application, backend API, ML microservice, and real-time messaging infrastructure.

---

# Key Features

## Skill Exchange

- Create skill exchange requests
- Offer skills for free or trade skills
- Skill compatibility matching
- Session scheduling
- Swap lifecycle tracking
- Post-session rating and reviews

---

## Community Platform

- Community feed with posts
- Stories similar to social media platforms
- Nested comments and replies
- Likes and reposting
- Share posts inside and outside the platform

---

## Connections System

- LinkedIn-style connection requests
- Accept or reject connections
- View recommended connections
- Private messaging between connections

---

## Messaging System

- Real-time chat using WebSocket
- Message history storage
- Message notifications
- Conversation management

---

## Volunteer Learning

- Users can apply for volunteer status
- Admin approval system
- Create volunteer learning sessions
- Users can join sessions
- Group communication and announcements

---

## Reviews and Ratings

- Rate users after swap completion
- Optional written reviews
- Average rating calculation

---

## Stories

- Temporary social stories
- Stories expire after 24 hours
- Story viewer tracking

---

## Moderation & Safety

- Report users
- Report posts or comments
- Admin moderation tools
- Content management

---

## Machine Learning Integration

The platform includes a machine learning microservice that automatically classifies skill-related news and distributes them to relevant users.

ML pipeline:

1. News article ingestion
2. Text preprocessing
3. TF-IDF feature extraction
4. Logistic Regression classification
5. Skill category prediction
6. Publish article to community feed
7. Send notifications to users with matching skills

---

# System Architecture

SawaSkills follows a **microservice architecture**.
//to be added later

## Technology Stack

### Backend
- Java
- Spring Boot
- Spring Security
- REST API
- WebSocket
- JWT Authentication

### Mobile Application
- React Native

### Web Admin Dashboard
- React

### Machine Learning
- Python
- Scikit-learn
- TF-IDF Vectorization
- Logistic Regression

### Database
- PostgreSQL

### DevOps
- Docker
- Docker Compose

### Authentication
- JWT Authentication
- OAuth (Google, GitHub, Facebook)

---

## Database Design

The system uses a **PostgreSQL relational database** designed following **Third Normal Form (3NF)** normalization to ensure data consistency, scalability, and efficient querying.

### Core Entities

- User
- Skill
- SkillCategory
- UserSkill
- ExchangeRequest
- SwapRequest
- Review
- Post
- Comment
- Story
- StoryView
- Connection
- Conversation
- Message
- Notification
- VolunteerSession
- VolunteerParticipant
- VolunteerApplication

## Repository Structure

sawa-skills
│
├── backend
│   ├── controllers
│   ├── services
│   ├── repositories
│   ├── models
│   └── config
│
├── mobile-app
│   └── React Native project
│
├── admin-dashboard
│   └── React web application
│
├── ml-service
│   └── Python ML microservice
│
├── docker
│   └── Docker configuration
│
├── docs
│   ├── architecture-diagram.png
│   ├── erd-diagram.png
│   └── system-design.md
│
└── README.md


---

# Installation

## Clone the repository

```bash
git clone https://github.com/yourusername/sawa-skills.git
cd sawa-skills

## Run with Docker

```bash
docker-compose up --build

This command starts:
	•	Backend API
	•	ML Microservice
	•	PostgreSQL Database
    
## Backend Setup 
cd backend
./mvnw spring-boot:run

## Mobile App Setup
cd mobile-app
npm install
npm start

## ML Service Setup
cd ml-service
pip install -r requirements.txt
python app.py


##API Documentation

The backend exposes REST APIs for all platform features.

Swagger / OpenAPI documentation becomes available once the backend server is running.

Access the API documentation at:

http://localhost:8080/swagger-ui.html

## API Modules

| Module | Description |
|------|-------------|
| Authentication | Registration, login, OAuth |
| Users | Profile management |
| Skills | Skill management |
| Exchanges | Skill swap requests |
| Messaging | Chat system |
| Community | Posts, comments, stories |
| Connections | Social network connections |
| Volunteers | Volunteer sessions |
| Notifications | User notifications |
| Admin | Moderation and system management |

## Future Improvements

Planned future features include:

- AI-powered skill matching recommendations
- Video-based learning sessions
- Advanced moderation tools
- Reputation and trust system for users
- Multi-language support
- Enhanced mobile push notification system

## Contributing

Contributions are welcome.

If you would like to contribute to this project:

1. Fork the repository
2. Create a new feature branch
3. Commit your changes
4. Push the branch to your fork
5. Submit a Pull Request for review

## License

This project was developed as a **Software Engineering senior project** and serves as a prototype for a scalable collaborative learning platform.

The code is provided for educational and demonstration purposes.