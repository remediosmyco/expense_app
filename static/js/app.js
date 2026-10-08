document.addEventListener("DOMContentLoaded", () => {
  // Set default date input to today
  document.getElementById("date").valueToDate = new Date();
  document.getElementById("date").value = new Date()
    .toISOString()
    .split("T")[0];

  loadCategories();
  loadDashboardData();

  // Handlers
  document
    .getElementById("expenseForm")
    .addEventListener("submit", handleAddExpense);
  document
    .getElementById("budgetForm")
    .addEventListener("submit", handleUpdateBudget);
});

async function loadCategories() {
  try {
    const response = await fetch("/api/categories");
    const categories = await response.json();
    const categorySelect = document.getElementById("category");
    categorySelect.innerHTML = "";

    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.name;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

async function loadDashboardData() {
  try {
    // Load Expenses
    const expResponse = await fetch("/api/expenses");
    const expenses = await expResponse.json();
    renderExpenseTable(expenses);

    // Load Budget
    const budgetResponse = await fetch("/api/budget");
    const budget = await budgetResponse.json();
    document.getElementById("budgetLimit").textContent =
      `$${budget.limit.toFixed(2)}`;

    const statusEl = document.getElementById("budgetStatus");
    statusEl.textContent = budget.status;
    if (budget.status === "Over Budget") {
      statusEl.style.color = "#dc2626";
    } else if (budget.status.includes("Warning")) {
      statusEl.style.color = "#ea580c";
    } else {
      statusEl.style.color = "#16a34a";
    }

    // Load Report
    const reportResponse = await fetch("/api/report");
    const report = await reportResponse.json();
    document.getElementById("totalSpending").textContent =
      `$${report.total_spending.toFixed(2)}`;
    renderCategorySummary(report.category_totals);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

function renderExpenseTable(expenses) {
  const tbody = document.getElementById("expenseTableBody");
  tbody.innerHTML = "";

  if (expenses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #64748b;">No expenses recorded yet.</td></tr>`;
    return;
  }

  expenses.forEach((exp) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${exp.date}</td>
            <td><strong>${exp.category}</strong></td>
            <td>${exp.description || "-"}</td>
            <td>${exp.payment_method}</td>
            <td>$${exp.amount.toFixed(2)}</td>
            <td><button class="btn btn-danger" onclick="deleteExpense(${exp.id})">Delete</button></td>
        `;
    tbody.appendChild(tr);
  });
}

function renderCategorySummary(categoryTotals) {
  const container = document.getElementById("categorySummary");
  container.innerHTML = "";

  const entries = Object.entries(categoryTotals);
  if (entries.length === 0) {
    container.innerHTML = `<p style="font-size:0.85rem; color:#64748b;">No category data yet.</p>`;
    return;
  }

  entries.forEach(([cat, amount]) => {
    const div = document.createElement("div");
    div.className = "cat-card";
    div.innerHTML = `
            <span>${cat}</span>
            <strong>$${amount.toFixed(2)}</strong>
        `;
    container.appendChild(div);
  });
}

async function handleAddExpense(event) {
  event.preventDefault();
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;
  const paymentMethod = document.getElementById("paymentMethod").value;
  const description = document.getElementById("description").value;

  const newExpense = {
    amount,
    category,
    date,
    payment_method: paymentMethod,
    description,
  };

  try {
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newExpense),
    });

    if (response.ok) {
      document.getElementById("expenseForm").reset();
      document.getElementById("date").value = new Date()
        .toISOString()
        .split("T")[0];
      loadDashboardData();
    }
  } catch (error) {
    console.error("Error adding expense:", error);
  }
}

async function handleUpdateBudget(event) {
  event.preventDefault();
  const limit = document.getElementById("newBudgetLimit").value;

  try {
    const response = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit }),
    });

    if (response.ok) {
      document.getElementById("newBudgetLimit").value = "";
      loadDashboardData();
    }
  } catch (error) {
    console.error("Error updating budget:", error);
  }
}

async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;

  try {
    const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (response.ok) {
      loadDashboardData();
    }
  } catch (error) {
    console.error("Error deleting expense:", error);
  }
}
