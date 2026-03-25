# TradeSimulator Frontend

Plain HTML/CSS/JS frontend for TradeSimulator v2.0.  
Communicates with the backend via Fetch API calls.


## Files

| File | Purpose |
|------|---------|
| `index.html` | HTML structure |
| `style.css` | All styles |
| `app.js` | All JavaScript — API calls, rendering, events |
| `config.js` | **Edit this** to set your backend URL |



- **User switcher** — dropdown in navbar switches between Alice, Bob, Charlie (each has independent portfolio, orders, history, notifications)
- **Pricing model selector** — switches backend algorithm at runtime (Random Walk, Mean Reversion, Trend Following)
- **Notification channels** — checkboxes to enable Email and SMS per user (Console always on)
