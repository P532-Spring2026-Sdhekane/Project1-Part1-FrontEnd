let prevPrices = {};
let allNotifications = [];
let activeUser = "alice";

// ── Clock ─────────────────────────────────────────────────────────────────
function updateClock() {
  document.getElementById("clock").textContent =
    new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

function fmt(n) {
  return (
    "$" +
    Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

async function switchUser(userId) {
  activeUser = userId.toLowerCase();

  console.log("[switchUser] Switching to:", activeUser);

  document.getElementById("active-user").textContent =
    userId.charAt(0).toUpperCase() + userId.slice(1);

  allNotifications = [];
  document.getElementById("notif-list").innerHTML =
    '<p class="empty">No notifications yet.</p>';
  document.getElementById("holdings-body").innerHTML =
    '<tr><td colspan="4" class="empty">Loading...</td></tr>';
  document.getElementById("pending-body").innerHTML =
    '<tr><td colspan="4" class="empty">Loading...</td></tr>';
  document.getElementById("history-body").innerHTML =
    '<tr><td colspan="6" class="empty">Loading...</td></tr>';
  document.getElementById("cash").textContent = "...";
  document.getElementById("total-value").textContent = "...";

  try {
    const r = await fetch(
      `${API_BASE}/api/notifications/channels?user=${activeUser}`,
    );
    const data = await r.json();
    document.getElementById("ch-email").checked = data.active.includes("email");
    document.getElementById("ch-sms").checked = data.active.includes("sms");
  } catch (e) {}

  await pollAll();
}

async function switchStrategy(name) {
  try {
    const r = await fetch(`${API_BASE}/api/strategy/${name}`, {
      method: "POST",
    });
    if (!r.ok) console.error("Strategy switch failed");
  } catch (e) {
    console.error("Strategy switch error", e);
  }
}

async function syncStrategy() {
  try {
    const r = await fetch(`${API_BASE}/api/strategy`);
    const data = await r.json();
    document.getElementById("strategy-select").value = data.active;
  } catch (e) {}
}

async function updateChannels() {
  const channels = ["console"];
  if (document.getElementById("ch-email").checked) channels.push("email");
  if (document.getElementById("ch-sms").checked) channels.push("sms");
  try {
    await fetch(`${API_BASE}/api/notifications/channels?user=${activeUser}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channels }),
    });
  } catch (e) {
    console.error("Channel update failed", e);
  }
}

async function fetchPrices() {
  try {
    const r = await fetch(`${API_BASE}/api/prices`);
    const prices = await r.json();
    renderPrices(prices);
    prevPrices = prices;
    const dot = document.getElementById("price-dot");
    dot.style.color = "#38bdf8";
    setTimeout(() => (dot.style.color = "#4ade80"), 300);
  } catch (e) {}
}

function renderPrices(prices) {
  const tbody = document.getElementById("price-body");
  tbody.innerHTML = "";
  for (const [ticker, price] of Object.entries(prices).sort()) {
    const prev = prevPrices[ticker] || price;
    const diff = price - prev;
    const pct = prev ? (diff / prev) * 100 : 0;
    const cls = diff >= 0 ? "up" : "down";
    const sign = diff >= 0 ? "+" : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td style="color:#38bdf8;font-weight:600">${ticker}</td>
                    <td>${fmt(price)}</td>
                    <td class="${cls}">${sign}${pct.toFixed(2)}%</td>`;
    if (Math.abs(diff) > 0.001)
      tr.classList.add(diff >= 0 ? "flash-up" : "flash-down");
    tbody.appendChild(tr);
  }
}

async function fetchPortfolio() {
  const user = activeUser;
  try {
    const url = `${API_BASE}/api/portfolio?user=${user}`;
    console.log("[fetchPortfolio] GET", url);
    const r = await fetch(url);
    const p = await r.json();

    if (user !== activeUser) {
      console.log("[fetchPortfolio] Discarding stale response for", user);
      return;
    }

    document.getElementById("cash").textContent = fmt(p.cash);
    document.getElementById("total-value").textContent = fmt(p.totalValue);
    const tbody = document.getElementById("holdings-body");
    if (!p.holdings || Object.keys(p.holdings).length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="empty">No holdings yet</td></tr>';
    } else {
      tbody.innerHTML = "";
      for (const [ticker, qty] of Object.entries(p.holdings)) {
        const price = prevPrices[ticker] || 0;
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${ticker}</td><td>${qty}</td><td>${fmt(price)}</td><td>${fmt(price * qty)}</td>`;
        tbody.appendChild(tr);
      }
    }
  } catch (e) {
    console.error("[fetchPortfolio] Error:", e);
  }
}

async function fetchPending() {
  const user = activeUser;
  try {
    const url = `${API_BASE}/api/orders/pending?user=${user}`;
    console.log("[fetchPending] GET", url);
    const r = await fetch(url);
    const orders = await r.json();

    if (user !== activeUser) return; // stale guard

    const tbody = document.getElementById("pending-body");
    if (orders.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="empty">No pending orders</td></tr>';
    } else {
      tbody.innerHTML = "";
      orders.forEach((o) => {
        const tr = document.createElement("tr");
        const cls = o.side === "BUY" ? "buy" : "sell";
        tr.innerHTML = `<td style="color:#38bdf8">${o.ticker}</td>
                        <td><span class="badge ${cls}">${o.side}</span></td>
                        <td>${o.quantity}</td><td>${o.status}</td>`;
        tbody.appendChild(tr);
      });
    }
  } catch (e) {
    console.error("[fetchPending] Error:", e);
  }
}

async function fetchHistory() {
  const user = activeUser;
  try {
    const url = `${API_BASE}/api/trades?user=${user}`;
    console.log("[fetchHistory] GET", url);
    const r = await fetch(url);
    const trades = await r.json();

    if (user !== activeUser) return;

    const tbody = document.getElementById("history-body");
    if (trades.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="empty">No trades yet</td></tr>';
    } else {
      tbody.innerHTML = "";
      [...trades].reverse().forEach((t) => {
        const tr = document.createElement("tr");
        const cls = t.side === "BUY" ? "buy" : "sell";
        const ts = new Date(t.timestamp).toLocaleTimeString();
        tr.innerHTML = `<td>${ts}</td><td style="color:#38bdf8">${t.ticker}</td>
                        <td><span class="badge ${cls}">${t.side}</span></td>
                        <td>${t.quantity}</td><td>${fmt(t.price)}</td><td>${fmt(t.totalValue)}</td>`;
        tbody.appendChild(tr);
      });
    }
  } catch (e) {
    console.error("[fetchHistory] Error:", e);
  }
}

async function fetchNotifications() {
  const user = activeUser;
  try {
    const r = await fetch(`${API_BASE}/api/notifications?user=${user}`);
    const data = await r.json();

    if (user !== activeUser) return; // stale guard

    if (data.messages && data.messages.length > 0) {
      allNotifications = [...data.messages, ...allNotifications].slice(0, 30);
      const div = document.getElementById("notif-list");
      div.innerHTML = "";
      allNotifications.forEach((m) => {
        const p = document.createElement("p");
        p.className = "notif-item";
        p.textContent = m;
        div.appendChild(p);
      });
    }
  } catch (e) {}
}

function toggleLimitPrice() {
  const t = document.getElementById("order-type").value;
  document.getElementById("limit-price-row").style.display =
    t === "limit" ? "flex" : "none";
}

async function placeOrder(side) {
  const ticker = document.getElementById("order-ticker").value;
  const type = document.getElementById("order-type").value;
  const quantity = parseInt(document.getElementById("order-qty").value);
  const limitPrice = parseFloat(document.getElementById("limit-price").value);

  if (!quantity || quantity < 1) {
    showMsg("Quantity must be at least 1", false);
    return;
  }

  let url, body;
  if (type === "market") {
    url = `${API_BASE}/api/orders/market?user=${activeUser}`;
    body = { ticker, side, quantity };
  } else {
    if (!limitPrice || limitPrice <= 0) {
      showMsg("Enter a valid limit price", false);
      return;
    }
    url = `${API_BASE}/api/orders/limit?user=${activeUser}`;
    body = { ticker, side, quantity, limitPrice };
  }

  console.log("[placeOrder] POST", url, body);

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (r.ok) {
      showMsg(
        type === "market"
          ? `✓ ${side} ${quantity} ${ticker} executed`
          : `✓ Limit order placed for ${ticker}`,
        true,
      );
      await Promise.all([
        fetchPortfolio(),
        fetchPending(),
        fetchHistory(),
        fetchNotifications(),
      ]);
    } else {
      showMsg(data.error || "Order failed", false);
    }
  } catch (e) {
    showMsg("Network error — is the backend running?", false);
  }
}

function showMsg(msg, ok) {
  const el = document.getElementById("order-msg");
  el.textContent = msg;
  el.className = ok ? "msg-ok" : "msg-err";
  setTimeout(() => (el.textContent = ""), 4000);
}

async function pollAll() {
  await fetchPrices();
  await fetchPortfolio();
  await fetchPending();
  await fetchHistory();
  await fetchNotifications();
}

pollAll();
syncStrategy();
setInterval(pollAll, 5000);
