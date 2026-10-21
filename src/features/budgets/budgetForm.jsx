import { useState } from "react";

function BudgetForm({ budget, onSetBudget }) {
  const [amount, setAmount] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const convertedAmount = Number(amount);

    if (
      !Number.isFinite(convertedAmount) ||
      convertedAmount <= 0
    ) {
      window.alert(
        "Enter a valid budget greater than zero."
      );
      return;
    }

    onSetBudget(convertedAmount);
    setAmount("");
  }

  return (
    <>
      <h2>Monthly Budget</h2>

      <p>
        Current budget:{" "}
        <strong>£{budget.toFixed(2)}</strong>
      </p>

      <form
        className="budget-form"
        onSubmit={handleSubmit}
      >
        <div className="budget-input">
          <label htmlFor="budget-amount">
            New monthly budget
          </label>

          <div className="currency-input">
            <span>£</span>

            <input
              id="budget-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="1500.00"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
            />
          </div>
        </div>

        <button type="submit">
          Set Budget
        </button>
      </form>
    </>
  );
}

export default BudgetForm;