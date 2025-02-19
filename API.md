### Account: dlnavarro@wisc.edu

Publishable KEY: pk_test_51QtZf905Lo986fYCzPAJM3pp7s7Qv64E9L6a4jAwP0zSc7XxgHpMt2dfkRN3XfWqTj9sPEbjxw89ShCyb8xMy37f005Fx1Leyi

Secret KEY: 
sk_test_51QtZf905Lo986fYCauDB7uTHm0jtKqdNrYC4HkOl8n1CLtdkA5ZJVNF1isK15PqFObQ9Ax8IQutOsgmJRWBla76400Y5BxJB2I

### How to get your own
Make an acount at https://stripe.com/ then click on the tab at the top left that says New Buisnesses. Click and select sandbox. Create a sandbox and note down the keys.

### What is the difference
#### Secret Key:

- Usage: Used on your server to perform any API calls to Stripe.
- Capabilities: Can create, modify, or delete resources (like charges, customers, etc.).
- Security: Must be kept confidential and never exposed to the public. Any misuse can lead to unauthorized actions and potential financial loss.

#### Publishable Key:

- Usage: Meant to be used on the client side (e.g., in your web or mobile app).
- Capabilities: Used to tokenize payment information and perform client-side operations, such as securely collecting card details.
- Security: Designed to be publicly visible; even if someone obtains this key, they cannot perform sensitive actions or access private data.