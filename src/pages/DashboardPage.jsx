import { useEffect, useState } from "react";
import TransactionForm from "../features/transactions/TransactionForm.jsx";
import BudgetForm from "../features/budgets/budgetForm.jsx";

function DashboardPage() {
  const [transactions, setTransactions] = useState(() => {
    const savedTransactions = localStorage.getItem("transactions");

    if (!savedTransactions) return [];

    try {
      const parsedTransactions = JSON.parse(savedTransactions);
      return Array.isArray(parsedTransactions) ? parsedTransactions : [];
    } catch {
      return [];
    }
  });

  const [budget, setBudget] = useState(() => {
    const savedBudget = localStorage.getItem("monthlyBudget");
    if (savedBudget === null) return 0;

    const convertedBudget = Number(savedBudget);
    return Number.isFinite(convertedBudget) ? convertedBudget : 0;
  });

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editError, setEditError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("monthlyBudget", String(budget));
  }, [budget]);

  useEffect(() => {
    if (!editingTransaction) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setEditingTransaction(null);
        setEditError("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingTransaction]);

  function addTransaction(transaction) {
    setTransactions((previousTransactions) => [
      ...previousTransactions,
      transaction,
    ]);
  }

  function deleteTransaction(id) {
    setTransactions((previousTransactions) =>
      previousTransactions.filter((transaction) => transaction.id !== id)
    );

    if (editingTransaction?.id === id) {
      setEditingTransaction(null);
      setEditError("");
    }
  }

  function openEditModal(id) {
    const transactionToEdit = transactions.find(
      (transaction) => transaction.id === id
    );

    if (!transactionToEdit) return;

    setEditingTransaction({
      ...transactionToEdit,
      amount: String(transactionToEdit.amount),
      category: transactionToEdit.category || "",
      description: transactionToEdit.description || "",
      date: transactionToEdit.date || "",
      type: transactionToEdit.type || "expense",
    });
    setEditError("");
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditingTransaction((previousTransaction) => ({
      ...previousTransaction,
      [name]: value,
    }));
    setEditError("");
  }

  function closeEditModal() {
    setEditingTransaction(null);
    setEditError("");
  }

  function saveEditedTransaction(event) {
    event.preventDefault();
    if (!editingTransaction) return;

    const convertedAmount = Number(editingTransaction.amount);

    if (!Number.isFinite(convertedAmount) || convertedAmount <= 0) {
      setEditError("Enter a valid amount greater than zero.");
      return;
    }
    if (!editingTransaction.category.trim()) {
      setEditError("Enter a transaction category.");
      return;
    }
    if (!editingTransaction.description.trim()) {
      setEditError("Enter a transaction description.");
      return;
    }
    if (!editingTransaction.date) {
      setEditError("Select a transaction date.");
      return;
    }

    const selectedDate = new Date(`${editingTransaction.date}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) {
      setEditError("Select a valid transaction date.");
      return;
    }
    if (
      editingTransaction.type !== "income" &&
      editingTransaction.type !== "expense"
    ) {
      setEditError("Select a valid transaction type.");
      return;
    }

    setTransactions((previousTransactions) =>
      previousTransactions.map((transaction) =>
        transaction.id === editingTransaction.id
          ? {
              ...transaction,
              type: editingTransaction.type,
              amount: convertedAmount,
              category: editingTransaction.category.trim(),
              description: editingTransaction.description.trim(),
              date: editingTransaction.date,
            }
          : transaction
      )
    );
    closeEditModal();
  }

  function formatMonth(monthValue) {
    const [year, month] = monthValue.split("-").map(Number);
    return new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
    }).format(new Date(year, month - 1, 1));
  }

  function formatTransactionDate(dateValue) {
    if (!dateValue) return "No date";

    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateValue;

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function handleTypeFilterChange(event) {
    setTypeFilter(event.target.value);
    setCategoryFilter("all");
  }

  function handleMonthFilterChange(event) {
    setMonthFilter(event.target.value);
    setCategoryFilter("all");
  }

  function clearTransactionFilters() {
    setTypeFilter("all");
    setCategoryFilter("all");
    setMonthFilter("all");
  }

  function resetAllData() {
    const confirmed = window.confirm(
      "Are you sure you want to reset all finance data? This will delete all transactions and reset your monthly budget."
    );
    if (!confirmed) return;

    setTransactions([]);
    setBudget(0);
    setTypeFilter("all");
    setCategoryFilter("all");
    setMonthFilter("all");
    setEditingTransaction(null);
    setEditError("");
  }

  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const balance = income - expenses;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthlyExpenses = transactions
    .filter((transaction) => {
      if (transaction.type !== "expense" || !transaction.date) return false;
      const [year, month] = transaction.date.split("-").map(Number);
      return year === currentYear && month - 1 === currentMonth;
    })
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const remainingBudget = budget - monthlyExpenses;
  const budgetPercentage =
    budget > 0 ? (monthlyExpenses / budget) * 100 : 0;
  const progressValue = Math.min(Math.max(budgetPercentage, 0), 100);

  const availableMonths = [
    ...new Set(
      transactions
        .map((transaction) =>
          transaction.date ? transaction.date.slice(0, 7) : null
        )
        .filter(Boolean)
    ),
  ].sort((firstMonth, secondMonth) =>
    secondMonth.localeCompare(firstMonth)
  );

  const availableFilterCategories = [
    ...new Set(
      transactions
        .filter((transaction) => {
          const matchesType =
            typeFilter === "all" || transaction.type === typeFilter;
          const matchesMonth =
            monthFilter === "all" ||
            transaction.date?.startsWith(monthFilter);
          return matchesType && matchesMonth;
        })
        .map((transaction) => transaction.category)
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesType =
      typeFilter === "all" || transaction.type === typeFilter;
    const matchesCategory =
      categoryFilter === "all" || transaction.category === categoryFilter;
    const matchesMonth =
      monthFilter === "all" || transaction.date?.startsWith(monthFilter);
    return matchesType && matchesCategory && matchesMonth;
  });

  const spendingByCategory = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        (monthFilter === "all" ||
          transaction.date?.startsWith(monthFilter))
    )
    .reduce((totals, transaction) => {
      const category = transaction.category || "Uncategorised";
      const amount = Number(transaction.amount);
      if (Number.isFinite(amount)) {
        totals[category] = (totals[category] || 0) + amount;
      }
      return totals;
    }, {});

  const categoryChartData = Object.entries(spendingByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const highestCategoryAmount =
    categoryChartData.length > 0 ? categoryChartData[0].amount : 0;
  const chartTotalSpending = categoryChartData.reduce(
    (total, item) => total + item.amount,
    0
  );
  const chartPeriodLabel =
    monthFilter === "all" ? "All months" : formatMonth(monthFilter);
  const hasDataToReset = transactions.length > 0 || budget !== 0;

  return (
    <main className="App">
      <h1>Personal Finance Tracker</h1>
      <p>Keep track of your money in one place.</p>

      <div className="summary">
        <div className="balance">
          <h2>Current Balance</h2>
          <p>
            {balance < 0 ? "-" : ""}£{Math.abs(balance).toFixed(2)}
          </p>
        </div>
        <div className="income">
          <h2>Income</h2>
          <p>£{income.toFixed(2)}</p>
        </div>
        <div className="expenses">
          <h2>Expenses</h2>
          <p>£{expenses.toFixed(2)}</p>
        </div>
      </div>

      <section className="budget-section">
        <BudgetForm budget={budget} onSetBudget={setBudget} />
      </section>

      <section className="budget-summary">
        <h2>Monthly Budget Summary</h2>
        <div className="budget-stats">
          <div>
            <span>Budget</span>
            <strong>£{budget.toFixed(2)}</strong>
          </div>
          <div>
            <span>Spent this month</span>
            <strong>£{monthlyExpenses.toFixed(2)}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong
              className={
                remainingBudget < 0 ? "negative-value" : "positive-value"
              }
            >
              {remainingBudget < 0 ? "-" : ""}£
              {Math.abs(remainingBudget).toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="budget-progress">
          <div className="budget-progress-info">
            <span>Budget used</span>
            <strong>{budgetPercentage.toFixed(1)}%</strong>
          </div>
          <progress id="budget-progress" value={progressValue} max="100">
            {progressValue.toFixed(1)}%
          </progress>
        </div>

        {budget > 0 && budgetPercentage >= 100 && (
          <p className="budget-warning">
            You have reached or exceeded your monthly budget.
          </p>
        )}
      </section>

      <section className="spending-chart-section">
        <div className="chart-header">
          <div>
            <h2>Spending by Category</h2>
            <p>{chartPeriodLabel}</p>
          </div>
          <div className="chart-total">
            <span>Total spending</span>
            <strong>£{chartTotalSpending.toFixed(2)}</strong>
          </div>
        </div>

        {categoryChartData.length === 0 ? (
          <p className="empty-state">
            No expense data is available for {chartPeriodLabel}.
          </p>
        ) : (
          <div className="category-chart">
            {categoryChartData.map(({ category, amount }) => {
              const barPercentage =
                highestCategoryAmount > 0
                  ? (amount / highestCategoryAmount) * 100
                  : 0;
              const spendingPercentage =
                chartTotalSpending > 0
                  ? (amount / chartTotalSpending) * 100
                  : 0;

              return (
                <div className="category-chart-row" key={category}>
                  <div className="category-chart-info">
                    <span>{category}</span>
                    <strong>£{amount.toFixed(2)}</strong>
                  </div>
                  <div
                    className="category-bar-track"
                    role="progressbar"
                    aria-label={`${category}: £${amount.toFixed(2)}`}
                    aria-valuenow={amount}
                    aria-valuemin={0}
                    aria-valuemax={highestCategoryAmount}
                  >
                    <div
                      className="category-bar"
                      style={{ width: `${barPercentage}%` }}
                    />
                  </div>
                  <span className="category-percentage">
                    {spendingPercentage.toFixed(1)}% of spending
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="transaction-section">
        <TransactionForm onAddTransaction={addTransaction} />
      </section>

      <section className="transactions">
        <div className="transactions-header">
          <div>
            <h2>Transactions</h2>
            {transactions.length > 0 && (
              <p className="transaction-count">
                Showing {filteredTransactions.length} of {transactions.length}{" "}
                transactions
              </p>
            )}
          </div>

          {(typeFilter !== "all" ||
            categoryFilter !== "all" ||
            monthFilter !== "all") && (
            <button
              className="clear-filters-button"
              type="button"
              onClick={clearTransactionFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {transactions.length > 0 && (
          <div className="transaction-filters">
            <div className="filter-group">
              <label htmlFor="type-filter">Type</label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={handleTypeFilterChange}
              >
                <option value="all">All transactions</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="category-filter">Category</label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">All categories</option>
                {availableFilterCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="month-filter">Month</label>
              <select
                id="month-filter"
                value={monthFilter}
                onChange={handleMonthFilterChange}
              >
                <option value="all">All months</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonth(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {transactions.length === 0 ? (
          <p className="empty-state">
            No transactions yet. Add your first income or expense above.
          </p>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions match your current filters.</p>
            <button type="button" onClick={clearTransactionFilters}>
              Show all transactions
            </button>
          </div>
        ) : (
          <div className="transaction-list">
            {filteredTransactions.map((transaction) => (
              <div
                className={`transaction-item ${transaction.type}`}
                key={transaction.id}
              >
                <div className="transaction-details">
                  <strong>
                    {transaction.type === "income" ? "+" : "-"}£
                    {Number(transaction.amount).toFixed(2)}
                  </strong>
                  <span className="transaction-category">
                    {transaction.category || "Uncategorised"}
                  </span>
                  <span className="transaction-description">
                    {transaction.description || "No description"}
                  </span>
                  <span className="transaction-date">
                    {formatTransactionDate(transaction.date)}
                  </span>
                </div>

                <div className="transaction-actions">
                  <button
                    className="edit-button"
                    type="button"
                    onClick={() => openEditModal(transaction.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => deleteTransaction(transaction.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="reset-data-section">
        <div>
          <h2>Reset Data</h2>
          <p>
            Delete all transactions and reset your monthly budget to £0.00.
          </p>
        </div>
        <button
          className="reset-data-button"
          type="button"
          onClick={resetAllData}
          disabled={!hasDataToReset}
        >
          Reset all data
        </button>
      </section>

      {editingTransaction && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditModal();
          }}
        >
          <section
            className="edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-transaction-title"
          >
            <div className="modal-header">
              <h2 id="edit-transaction-title">Edit Transaction</h2>
              <button
                className="modal-close-button"
                type="button"
                onClick={closeEditModal}
                aria-label="Close edit transaction form"
              >
                ×
              </button>
            </div>

            <form
              className="edit-transaction-form"
              onSubmit={saveEditedTransaction}
              noValidate
            >
              <label htmlFor="edit-type">Transaction type</label>
              <select
                id="edit-type"
                name="type"
                value={editingTransaction.type}
                onChange={handleEditChange}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <label htmlFor="edit-amount">Amount</label>
              <input
                id="edit-amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={editingTransaction.amount}
                onChange={handleEditChange}
              />

              <label htmlFor="edit-category">Category</label>
              <input
                id="edit-category"
                name="category"
                type="text"
                maxLength="40"
                value={editingTransaction.category}
                onChange={handleEditChange}
              />

              <label htmlFor="edit-description">Description</label>
              <input
                id="edit-description"
                name="description"
                type="text"
                maxLength="100"
                value={editingTransaction.description}
                onChange={handleEditChange}
              />

              <label htmlFor="edit-date">Date</label>
              <input
                id="edit-date"
                name="date"
                type="date"
                value={editingTransaction.date}
                onChange={handleEditChange}
              />

              {editError && (
                <p className="form-error" role="alert">
                  {editError}
                </p>
              )}

              <div className="modal-actions">
                <button
                  className="cancel-button"
                  type="button"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button className="save-button" type="submit">
                  Save changes
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default DashboardPage;
