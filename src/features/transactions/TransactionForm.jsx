import { useState } from "react";

const expenseCategories = [
  "Food",
  "Bills",
  "Shopping",
  "Transport",
  "Entertainment",
  "Health",
  "Housing",
  "Subscriptions",
  "Sundry",
  "Other",
];

const incomeCategories = [
  "Salary",
  "Freelance",
  "Business",
  "Investments",
  "Benefits",
  "Other",
];

function TransactionForm({ onAddTransaction }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  const availableCategories =
    type === "income"
      ? incomeCategories
      : expenseCategories;

  function handleTypeChange(event) {
    setType(event.target.value);
    setCategory("");
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const convertedAmount = Number(amount);

    if (!amount) {
      setError("Enter a transaction amount.");
      return;
    }

    if (
      !Number.isFinite(convertedAmount) ||
      convertedAmount <= 0
    ) {
      setError(
        "Enter a valid amount greater than zero."
      );
      return;
    }

    if (!category) {
      setError("Choose a category.");
      return;
    }

    if (!description.trim()) {
      setError("Enter a description.");
      return;
    }

    if (!date) {
      setError("Select a transaction date.");
      return;
    }

    const selectedDate = new Date(
      `${date}T00:00:00`
    );

    if (Number.isNaN(selectedDate.getTime())) {
      setError("Select a valid transaction date.");
      return;
    }

    const transaction = {
      id: Date.now(),
      type,
      amount: convertedAmount,
      category,
      description: description.trim(),
      date,
    };

    onAddTransaction(transaction);

    setAmount("");
    setCategory("");
    setDescription("");
    setDate("");
    setError("");
  }

  return (
    <>
      <h2>Add Transaction</h2>

      <form
        className="transaction-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="form-group">
          <label htmlFor="transaction-type">
            Type
          </label>

          <select
            id="transaction-type"
            value={type}
            onChange={handleTypeChange}
          >
            <option value="expense">
              Expense
            </option>

            <option value="income">
              Income
            </option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="transaction-amount">
            Amount
          </label>

          <input
            id="transaction-amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setError("");
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="transaction-category">
            Category
          </label>

          <select
            id="transaction-category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setError("");
            }}
          >
            <option value="">
              Choose a category
            </option>

            {availableCategories.map(
              (categoryOption) => (
                <option
                  key={categoryOption}
                  value={categoryOption}
                >
                  {categoryOption}
                </option>
              )
            )}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="transaction-description">
            Description
          </label>

          <input
            id="transaction-description"
            type="text"
            maxLength="100"
            placeholder="e.g. Weekly shopping"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setError("");
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="transaction-date">
            Date
          </label>

          <input
            id="transaction-date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setError("");
            }}
          />
        </div>

        {error && (
          <p
            className="form-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <button type="submit">
          Add Transaction
        </button>
      </form>
    </>
  );
}

export default TransactionForm;