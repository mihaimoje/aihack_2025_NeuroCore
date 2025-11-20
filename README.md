# NeuroCore - AI-Powered Team Management System

Un sistem inteligent de management al echipelor și proiectelor cu funcții de detectare burnout și coaching AI.

## 🚀 Funcționalități Principale

- **Autentificare & Autorizare** - Sistem JWT cu roluri multiple (superadmin, manager, developer, tester)
- **Managementul Proiectelor** - Creare, editare și monitorizare proiecte
- **Task Management** - Organizare task-uri cu statusuri, priorități și estimări de timp
- **Team Management** - Gestionarea echipelor și membrilor
- **Burnout Detection** - Monitorizare și alertare pentru riscul de burnout
- **GitHub Integration** - Sincronizare activitate GitHub
- **AI Coach** - Asistent AI pentru îmbunătățirea productivității
- **Insights & Analytics** - Rapoarte și statistici despre performanța echipei

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - Server-side framework
- **MongoDB** + **Mongoose** - Database & ODM
- **JWT** - Autentificare
- **bcrypt** - Hash-uire parole
- **CORS** - Cross-origin requests

### Frontend
- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **React Router** - Routing
- **Sonner** - Toast notifications

## 📦 Instalare și Rulare

### Cerințe Preliminare
- Node.js 18+ 
- MongoDB (cloud sau local)
- npm sau yarn

### 1. Clonare Proiect

```bash
git clone https://github.com/mihaimoje/aihack_2025_NeuroCore.git
cd aihack_2025_NeuroCore
```

### 2. Configurare Backend

```bash
cd backend
npm install
```

Creează fișierul `.env`:
```env
dbURI='mongodb+srv://your-connection-string'
JWT_SECRET='your-secret-key'
```

Populează baza de date cu date de test:
```bash
npm run seed
```

Pornește serverul:
```bash
npm run dev
```

Backend va rula pe `http://localhost:3000`

### 3. Configurare Frontend

```bash
cd frontend
npm install
```

Creează fișierul `.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

Pornește serverul de dezvoltare:
```bash
npm run dev
```

Frontend va rula pe `http://localhost:8080`

## 👥 Credențiale de Test

După rularea `npm run seed`, vei avea următorii utilizatori:

| Rol | Username | Password | Descriere |
|-----|----------|----------|-----------|
| Super Admin | `admin` | `password` | Acces complet la sistem |
| Manager | `manager1` | `password` | Gestionare echipe și proiecte |
| Developer | `alice` | `password` | Developer cu acces la task-uri |
| Developer | `bob` | `password` | Developer cu acces la task-uri |
| Tester | `carol` | `password` | Tester cu acces la task-uri |

## 📁 Structura Proiectului

```
aihack_2025_NeuroCore/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── server.js        # Express server
│   ├── seed.js          # Database seeder
│   └── connectionDb.js  # MongoDB connection
│
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   ├── lib/         # Utilities & API
│   │   └── hooks/       # Custom hooks
│   └── public/
│
└── INTEGRATION.md       # Documentație integrare
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Înregistrare utilizator
- `POST /api/auth/login` - Autentificare
- `GET /api/auth/me` - Utilizator curent

### Users
- `GET /api/users` - Lista utilizatori
- `GET /api/users/:id` - Detalii utilizator
- `PUT /api/users/:id` - Actualizare utilizator
- `DELETE /api/users/:id` - Ștergere utilizator

### Projects
- `GET /api/projects` - Lista proiecte
- `POST /api/projects` - Creare proiect
- `GET /api/projects/:id` - Detalii proiect
- `PUT /api/projects/:id` - Actualizare proiect
- `DELETE /api/projects/:id` - Ștergere proiect

### Tasks
- `GET /api/tasks` - Lista task-uri
- `POST /api/tasks` - Creare task
- `GET /api/tasks/:id` - Detalii task
- `PUT /api/tasks/:id` - Actualizare task
- `DELETE /api/tasks/:id` - Ștergere task

### Teams
- `GET /api/teams` - Lista echipe
- `POST /api/teams` - Creare echipă
- `GET /api/teams/:id` - Detalii echipă
- `PUT /api/teams/:id` - Actualizare echipă
- `DELETE /api/teams/:id` - Ștergere echipă

### Burnout
- `GET /api/burnout` - Scoruri burnout
- `POST /api/burnout` - Creare scor burnout
- `GET /api/burnout/:id` - Detalii scor
- `PUT /api/burnout/:id` - Actualizare scor
- `DELETE /api/burnout/:id` - Ștergere scor

### Insights
- `GET /api/insights` - Lista insights
- `POST /api/insights` - Creare insight
- `GET /api/insights/:id` - Detalii insight
- `PUT /api/insights/:id` - Actualizare insight
- `DELETE /api/insights/:id` - Ștergere insight

## 🗄️ Modele de Date

### User
```javascript
{
  name: String,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: ['superadmin', 'manager', 'developer', 'tester'],
  teamId: ObjectId,
  githubUsername: String,
  githubToken: String
}
```

### Project
```javascript
{
  name: String,
  description: String,
  githubLink: String,
  teamId: ObjectId,
  members: [ObjectId],
  status: ['active', 'archived']
}
```

### Task
```javascript
{
  projectId: ObjectId,
  title: String,
  description: String,
  assignedTo: ObjectId,
  createdBy: ObjectId,
  status: ['to-do', 'in-progress', 'done'],
  priority: ['low', 'medium', 'high'],
  estimateHours: Number,
  realHours: Number,
  dueDate: Date
}
```

## 🔒 Securitate

- Toate parolele sunt hash-uite folosind bcrypt
- Autentificare JWT cu token expirabil
- CORS configurat pentru securitate
- Validare date pe backend
- Protected routes în frontend

## 📝 Dezvoltare Viitoare

- [ ] Integrare completă GitHub API
- [ ] Implementare AI Coach cu GPT
- [ ] Dashboard-uri personalizate
- [ ] Notificări real-time
- [ ] Export rapoarte PDF
- [ ] Mobile app
- [ ] Dark mode

## 🤝 Contribuții

Contribuțiile sunt binevenite! Pentru schimbări majore, deschide mai întâi un issue pentru a discuta ce ai dori să schimbi.

## 📄 Licență

[MIT](LICENSE)

## 👨‍💻 Echipa

Dezvoltat pentru GenAI Hackaton - 3Pillar 2025 by NeuroCore Team

---

Pentru mai multe detalii despre integrarea backend-frontend, vezi [INTEGRATION.md](INTEGRATION.md)
