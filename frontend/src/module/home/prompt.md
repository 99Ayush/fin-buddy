# Basic prompt: Home

Paste this into your AI coding assistant and attach `requirement.md` from this folder as context.

```
You are building the Home page of Akumas (Fin Buddy), an AI financial companion for people who cannot afford a CA. Read requirement.md in this folder.

Stack: React frontend, Node/Express backend. Work only inside frontend/src/module/home and backend/src/module/home.

Build:
1. Landing, Login, Register screens with a language (English/Hindi) and depth (Fresher/Veteran) toggle.
2. After login, a Home page with tabs: Overview, Career Timeline, Profile, Market Movers.
3. Backend routes for auth, dashboard summary/timeline/profile and markets movers with mock data.
4. Overview reads reports from the shared report store, not from other modules.

Rules: no business numbers from the LLM, strings in home/i18n.js, export only through index.js, show a not-advice disclaimer on Market Movers.
Start with the folder skeleton, then auth, then the Overview, and explain what you did after each step.
```
