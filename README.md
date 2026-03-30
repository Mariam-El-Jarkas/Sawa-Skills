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

## 🚀 Features

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

## 🏗 System Architecture

//to be added 

SawaSkills follows a **microservice architecture**.

---

## 🧰 Technology Stack

| Layer | Technology |
|------|------------|
| Backend | Java, Spring Boot, Spring Security |
| Mobile Application | React Native |
| Admin Dashboard | React |
| Machine Learning | Python, Scikit-learn, TF-IDF, Logistic Regression |
| Database | PostgreSQL |
| Communication | REST API, WebSocket |
| Authentication | JWT, OAuth (Google, GitHub, Facebook) |
| DevOps | Docker, Docker Compose |

---

## 📂 Repository Structure
// to be added 


---

## ⚙️ Installation

## Clone the repository

```bash
git clone https://github.com/yourusername/sawa-skills.git
cd sawa-skills

```

## Run with Docker

```bash
docker-compose up --build

```
This command starts:
	•	Backend API
	•	ML Microservice
	•	PostgreSQL Database
    
## Backend Setup 

```bash
cd backend
./mvnw spring-boot:run

```

## Mobile App Setup

```bash
cd mobile-app
npm install
npm start

```

## ML Service Setup

```bash
cd ml-service
pip install -r requirements.txt
python app.py

```

## 📡 API Documentation

The backend exposes REST APIs for all platform features.

Swagger / OpenAPI documentation becomes available once the backend server is running.

Access the API documentation at: //to be added

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

## 🛣 Future Improvements

Planned future enhancements for the SawaSkills platform include:

- **AI-powered skill matching recommendations** to suggest better skill exchange partners.
- **Online learning sessions within the platform**, allowing users to conduct video-based skill sessions directly inside the app.
- **User reputation badges**, such as a **Trusted Trader badge** for users who complete a high number of successful exchanges (e.g., 50+ completed swaps).
- **Dark mode support** to improve user experience and accessibility.
- **Multi-language support** to make the platform accessible to a wider international audience.
- **Advanced moderation tools** to improve community safety and content management.
- **Enhanced push notification system** for real-time updates on swaps, messages, and community activity.
- **Improved reputation and trust system** based on ratings, completed swaps, and community engagement.

## 🤝 Contributing

Contributions are welcome.

If you would like to contribute to this project:

1. Fork the repository
2. Create a new feature branch
3. Commit your changes
4. Push the branch to your fork
5. Submit a Pull Request for review

## 📄 License

Copyright © 2026 SawaSkills

This project is currently under development as part of the **SawaSkills platform initiative**.

All rights reserved.

The source code is provided for demonstration and development purposes.  
Unauthorized copying, modification, distribution, or use of this software without permission is prohibited.
