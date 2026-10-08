from flask import Flask, render_template, request, jsonify
from datetime import datetime

app = Flask(__name__)

class Category:
    def __init__(self, name, description=""):
        self.name = name
        self.description = description

    def to_dict(self):
        return {"name": self.name, "description": self.description}


class Expense:
    def __init__(self, expense_id, amount, date, category, description, payment_method="Cash"):
        self.id = expense_id
        self.amount = float(amount)
        self.date = date
        self.category = category
        self.description = description
        self.payment_method = payment_method

    def to_dict(self):
        return {
            "id": self.id,
            "amount": self.amount,
            "date": self.date,
            "category": self.category,
            "description": self.description,
            "payment_method": self.payment_method
        }


class Budget:
    def __init__(self, limit, period="Monthly"):
        self.limit = float(limit)
        self.period = period

    def check_status(self, total_expenses):
        if total_expenses > self.limit:
            return "Over Budget"
        elif total_expenses >= self.limit * 0.8:
            return "Warning: Near Limit"
        return "Within Budget"

    def to_dict(self, total_expenses):
        return {
            "limit": self.limit,
            "period": self.period,
            "status": self.check_status(total_expenses),
            "remaining": max(0.0, self.limit - total_expenses)
        }


class Report:
    def __init__(self, expenses, budget):
        self.expenses = expenses
        self.budget = budget

    def generate_summary(self):
        total_spending = sum(e.amount for e in self.expenses)
        category_totals = {}
        for e in self.expenses:
            category_totals[e.category] = category_totals.get(e.category, 0.0) + e.amount

        return {
            "total_spending": total_spending,
            "category_totals": category_totals,
            "budget_status": self.budget.to_dict(total_spending),
            "total_count": len(self.expenses)
        }



expenses_db = []
categories_db = [
    Category("Supplies", "Office and business supplies"),
    Category("Transportation", "Travel and delivery fees"),
    Category("Utilities", "Electricity, water, internet"),
    Category("Food", "Meals and team expenses")
]
budget_db = Budget(limit=1000.0, period="Monthly")
expense_counter = 1


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/expenses", methods=["GET", "POST"])
def manage_expenses():
    global expense_counter
    if request.method == "POST":
        data = request.json
        new_expense = Expense(
            expense_id=expense_counter,
            amount=data["amount"],
            date=data.get("date", datetime.today().strftime('%Y-%m-%d')),
            category=data["category"],
            description=data.get("description", ""),
            payment_method=data.get("payment_method", "Cash")
        )
        expenses_db.append(new_expense)
        expense_counter += 1
        return jsonify({"message": "Expense added successfully!", "expense": new_expense.to_dict()}), 201

    return jsonify([e.to_dict() for e in expenses_db])


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    global expenses_db
    expenses_db = [e for e in expenses_db if e.id != expense_id]
    return jsonify({"message": "Expense deleted successfully!"})


@app.route("/api/categories", methods=["GET"])
def get_categories():
    return jsonify([c.to_dict() for c in categories_db])


@app.route("/api/budget", methods=["GET", "POST"])
def manage_budget():
    global budget_db
    if request.method == "POST":
        data = request.json
        budget_db.limit = float(data["limit"])
        return jsonify({"message": "Budget updated successfully!"})
    
    total_spending = sum(e.amount for e in expenses_db)
    return jsonify(budget_db.to_dict(total_spending))


@app.route("/api/report", methods=["GET"])
def get_report():
    report = Report(expenses_db, budget_db)
    return jsonify(report.generate_summary())


if __name__ == "__main__":
    app.run(debug=True, port=5000)