# Security

## Core Rule

Use sample data only.

Do not use real banking data, real customer data, real account numbers, credentials, tokens, or private financial information.

## Prototype Constraints

The first version must not:

- connect to Danske Bank APIs
- connect to external banking APIs
- store real personal data
- ask users to enter real financial data
- include login or authentication
- include payment functionality
- send budget data to external services

## AI Constraints

The budget intelligence must not be a chatbot in v1.

It should be represented as:

- calculations
- forecast cards
- recurring payment detection
- overspending warnings
- short explanations

No real AI provider call is needed for the first prototype.

## Review Checklist

Before accepting code, check that:

- all data is sample data
- no secrets are committed
- no external API calls were added
- no real banking identifiers are present
- budget insights are phrased respectfully
- financial guidance does not feel judgmental or absolute

