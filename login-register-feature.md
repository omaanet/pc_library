### Oveview

Implement a simple login/register system.

## Registration logic

-   user register (name, email)
-   a mail is sent to user as e-mail validation and with a link to activate the account
-   user receive the mail, click the link and navigate to a page that will:
    -   generate a very simple password
    -   send a welcome email with the generated password
    -   activate the account
    -   automatically login
    -   return to the home page

## Mail configuration

Create a mailer class that will be used to send emails.
This class will be used in the registration process.
Configuration is in the .env file.

## Database schema

```sql
CREATE TABLE "users" (
    [id] INTEGER NOT NULL UNIQUE,
    [email] TEXT NOT NULL UNIQUE,
    [full_name] TEXT NOT NULL,
    [is_activated] BOOLEAN NOT NULL DEFAULT 0,
    [created_at] TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    [updated_at] TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY([id] AUTOINCREMENT)
);
```

## RULES

Always prefer **simple solutions**.
**Avoid duplication** of code whenever possible by checking for existing similar code, utitiles or functions you can use.

If you are not sure about something or if you need more information, STOP and ask me questions!
