# TradeSimulator Frontend

Plain HTML/CSS/JS frontend for TradeSimulator v2.0.  
Communicates with the backend via Fetch API calls.

## Setup

### 1. Point to your backend

Edit `config.js` and set your backend URL:

```js
const API_BASE = 'https://your-tradesimulator.onrender.com';
```

For local development:
```js
const API_BASE = 'http://localhost:8080';
```

### 2. Run locally

Just open `index.html` in a browser — no build step needed.

Or serve with any static file server:
```bash
npx serve .
# then open http://localhost:3000
```

## Deploying to GitHub Pages

1. Push this folder to a GitHub repo
2. Go to **Settings → Pages → Source → main branch / root**
3. Your frontend will be live at `https://YOUR_USERNAME.github.io/REPO_NAME`

## Deploying to Netlify

1. Drag and drop this folder onto [netlify.com/drop](https://netlify.com/drop)
2. Set `API_BASE` in `config.js` to your Render backend URL

## Files

| File | Purpose |
|------|---------|
| `index.html` | HTML structure |
| `style.css` | All styles |
| `app.js` | All JavaScript — API calls, rendering, events |
| `config.js` | **Edit this** to set your backend URL |

## Week 2 Features

- **User switcher** — dropdown in navbar switches between Alice, Bob, Charlie (each has independent portfolio, orders, history, notifications)
- **Pricing model selector** — switches backend algorithm at runtime (Random Walk, Mean Reversion, Trend Following)
- **Notification channels** — checkboxes to enable Email and SMS per user (Console always on)
