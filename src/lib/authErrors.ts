// Переклад повідомлень про помилки Supabase Auth українською мовою
const ERROR_MAP: Array<{ match: RegExp; message: string }> = [
  { match: /email not confirmed/i, message: "Email не підтверджено. Перевірте свою пошту та підтвердіть реєстрацію." },
  { match: /invalid login credentials/i, message: "Невірний email або пароль." },
  { match: /invalid credentials/i, message: "Невірний email або пароль." },
  { match: /user already registered/i, message: "Користувач з таким email вже зареєстрований." },
  { match: /user already exists/i, message: "Користувач з таким email вже зареєстрований." },
  { match: /already registered/i, message: "Користувач з таким email вже зареєстрований." },
  { match: /password should be at least/i, message: "Пароль має містити щонайменше 6 символів." },
  { match: /weak password/i, message: "Пароль занадто слабкий. Використайте складніший пароль." },
  { match: /unable to validate email address/i, message: "Невірний формат email адреси." },
  { match: /invalid email/i, message: "Невірний формат email адреси." },
  { match: /email address.*invalid/i, message: "Невірний формат email адреси." },
  { match: /email rate limit exceeded/i, message: "Перевищено ліміт надсилання email. Спробуйте пізніше." },
  { match: /rate limit/i, message: "Забагато спроб. Спробуйте пізніше." },
  { match: /user not found/i, message: "Користувача не знайдено." },
  { match: /token has expired/i, message: "Термін дії посилання сплив. Запросіть нове." },
  { match: /token.*invalid/i, message: "Недійсне посилання. Запросіть нове." },
  { match: /invalid token/i, message: "Недійсне посилання. Запросіть нове." },
  { match: /otp expired/i, message: "Код підтвердження прострочений. Запросіть новий." },
  { match: /signup.*disabled/i, message: "Реєстрація тимчасово недоступна." },
  { match: /signups not allowed/i, message: "Реєстрація тимчасово недоступна." },
  { match: /email link is invalid or has expired/i, message: "Посилання недійсне або прострочене." },
  { match: /new password should be different/i, message: "Новий пароль має відрізнятись від поточного." },
  { match: /same password/i, message: "Новий пароль має відрізнятись від поточного." },
  { match: /network/i, message: "Помилка з'єднання. Перевірте інтернет та спробуйте знову." },
  { match: /failed to fetch/i, message: "Помилка з'єднання. Перевірте інтернет та спробуйте знову." },
  { match: /captcha/i, message: "Помилка перевірки captcha. Спробуйте знову." },
  { match: /provider.*not enabled/i, message: "Цей спосіб входу наразі недоступний." },
  { match: /oauth.*cancel/i, message: "Вхід скасовано." },
  { match: /server error/i, message: "Помилка сервера. Спробуйте пізніше." },
];

export function translateAuthError(error: unknown): string {
  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : (error as { message?: string })?.message ?? "";

  if (!raw) return "Сталася невідома помилка. Спробуйте ще раз.";

  for (const { match, message } of ERROR_MAP) {
    if (match.test(raw)) return message;
  }

  return raw;
}
