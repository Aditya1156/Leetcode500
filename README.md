# DSA 500 Tracker — LeetCode Progress Dashboard

A beautiful, full-featured web app to track your progress across **500 curated LeetCode problems** with a structured **6-month study plan**, real-time cloud sync, and detailed analytics.

**Live Demo:** [leetcode500.web.app](https://leetcode500.web.app)

![Problems Page](https://img.shields.io/badge/Problems-491-blue?style=for-the-badge)
![Topics](https://img.shields.io/badge/Topics-16-orange?style=for-the-badge)
![Study Plan](https://img.shields.io/badge/Study_Plan-6_Months-green?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Cloud_Sync-Firebase-yellow?style=for-the-badge)

---

## Screenshots

### Problems Tracker
> Filter, sort, and mark 491 problems across 16 DSA topics. Each problem includes difficulty, topic, pattern, priority level, and personal notes.

### 6-Month Study Plan
> A week-by-week structured roadmap with 69 sessions — from Arrays & Hashing fundamentals all the way to advanced Dynamic Programming. Track your completion day by day.

### Dashboard
> At-a-glance stats: total solved, completion percentage, current streak, difficulty distribution donut chart, recent activity feed, and per-topic progress bars.

### Topics Overview
> Visual topic cards showing your mastery across all 16 core DSA areas with progress indicators.

---

## Features

### Core Tracking
- **491 Curated Problems** — Hand-picked LeetCode problems covering every important DSA pattern
- **16 Core Topics** — Arrays & Hashing, Two Pointers, Sliding Window, Stack, Binary Search, Linked List, Trees, Tries, Backtracking, Heap/Priority Queue, Graphs, Dynamic Programming, Greedy, Intervals, Math & Geometry, Bit Manipulation
- **4 Priority Levels** — Must Do, Good Practice, Revision, Hard Practice
- **Pattern Tags** — Each problem tagged with its solving pattern (Hash Map, Two Pointers, BFS/DFS, Kadane's, etc.)
- **Personal Notes** — Add notes to any problem with auto-save

### 6-Month Study Plan
- **69 Study Sessions** structured week-by-week
- Starts with fundamentals, builds to advanced topics
- Each session lists specific problems + a focus concept
- Track completion per session with one-click toggle

### Analytics Dashboard
- Total problems solved with animated counters
- Completion percentage
- Current daily streak tracker
- Difficulty distribution (Easy/Medium/Hard) donut chart
- Recent activity feed
- Per-topic progress bars

### Cloud Sync & Auth
- **Google Sign-In** — One-click authentication
- **Firebase Cloud Sync** — Progress saved to Firestore, accessible from any device
- **Offline Support** — localStorage cache for instant loading
- **Automatic Migration** — Existing local progress auto-migrates to cloud on first sign-in

### User Experience
- **Dark/Light Theme** — Toggle with persistent preference
- **Global Search** — `Ctrl+K` to instantly search problems by name, number, topic, or pattern
- **Advanced Filters** — Filter by topic, difficulty, status, priority, and pattern simultaneously
- **Column Sorting** — Sort by any column (ascending/descending)
- **Mobile Responsive** — Full mobile support with bottom tab navigation
- **Profile Sidebar** — Quick access to account settings and sign-out
- **Beautiful Landing Page** — Clean entry point with feature overview

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JavaScript (ES Modules), HTML5, CSS3 |
| **Backend** | Firebase Firestore (NoSQL database) |
| **Auth** | Firebase Authentication (Google OAuth) |
| **Hosting** | Firebase Hosting |
| **Styling** | Custom CSS with CSS Variables (theming), responsive grid |
| **Architecture** | Single Page Application (hash-based routing) |

**Zero build tools. Zero frameworks. Pure vanilla JS.** The entire app runs without React, Vue, Angular, Webpack, or any bundler. Just clean, modular ES6 code.

---

## Project Structure

```
.
├── index.html              # SPA entry point (landing page + app)
├── css/
│   └── style.css           # All styles (~1800 lines, themed with CSS vars)
├── js/
│   ├── app.js              # Router, theme, search, auth, init
│   ├── data.js             # DataStore — central data management + cloud sync
│   ├── db.js               # Firebase Firestore database layer
│   ├── firebase-config.js  # Firebase project configuration
│   ├── dashboard.js        # Dashboard page — stats, charts, progress
│   ├── problems.js         # Problems page — table, filters, sort, status
│   ├── studyplan.js        # Study Plan page — 6-month timeline view
│   ├── topics.js           # Topics page — visual topic cards
│   └── utils.js            # Shared utilities (debounce, escapeHTML, etc.)
├── firebase.json           # Firebase Hosting configuration
├── firestore.rules         # Firestore security rules
└── .firebaserc             # Firebase project alias
```

---

## Getting Started

### Prerequisites
- A Google account (for sign-in)
- [Firebase CLI](https://firebase.google.com/docs/cli) (for local development/deployment)

### Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/Aditya1156/Leetcode500.git
   cd Leetcode500
   ```

2. **Serve locally**
   ```bash
   firebase serve --only hosting --port 5000
   ```

3. **Open in browser**
   ```
   http://localhost:5000
   ```

### Deploy

```bash
firebase deploy --only hosting
```

---

## Data Architecture

```
Firestore
├── appData/                    # Read-only (all users)
│   ├── metadata                # Total counts, topic list, etc.
│   ├── problems_0              # Problems chunk 0
│   ├── problems_1              # Problems chunk 1
│   ├── studyPlan               # 69 study sessions
│   └── topicSummary            # 16 topic summaries
└── users/{uid}/data/           # Per-user (auth-gated)
    └── progress                # Solved status, notes, study plan progress
```

**Security Rules:**
- `appData` — Read-only for all authenticated users, write-only by admin
- `users/{uid}` — Read/write only by the authenticated user who owns it

---

## Security

- All URLs validated before opening (prevents `javascript:` URI injection)
- HTML output escaped via `escapeHTML()` to prevent XSS
- User data isolated per Firebase UID with Firestore security rules
- Google OAuth with Firebase Authentication
- localStorage cleared on sign-out to prevent cross-user data leaks
- Pending cloud syncs flushed before page unload

---

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Author

**Aditya** — [GitHub](https://github.com/Aditya1156)

Built with vanilla JavaScript and a lot of LeetCode grinding.

---

*If this project helps your DSA prep, give it a star!*
