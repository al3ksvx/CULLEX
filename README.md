# CULLEX ART Ochrona – strona internetowa

Struktura:
- `index.html` – cała strona (O nas, Usługi, Referencje, Zaufali nam, formularze)
- `functions/api/submit.js` – Cloudflare Pages Function, która wysyła zgłoszenia e-mailem

## Wdrożenie (GitHub + Cloudflare Pages)

1. Utwórz repozytorium na GitHubie i wgraj cały folder (z `functions/`).
2. Cloudflare Dashboard > Workers & Pages > Create > Pages > Connect to Git, wybierz repozytorium.
3. Build command: puste. Output directory: `/` (katalog główny).
4. Settings > Variables and Secrets (Production), dodaj:
   - `RESEND_API_KEY` (Secret): klucz z resend.com
   - `TO_EMAIL`: adres, na który mają trafiać zgłoszenia
   - `FROM_EMAIL`: np. `CULLEX ART <formularz@cullexart.pl>` (domena zweryfikowana w Resend)
5. Kalendarz spotkań (blokowanie zajętych godzin): Workers & Pages > KV > Create namespace (np. `bookings`).
   Potem w projekcie Pages: Settings > Bindings > Add > KV namespace, nazwa zmiennej dokładnie `BOOKINGS`. Zrób nowy deploy.
   Bez KV kalendarz działa, ale nie blokuje zajętych godzin.
6. Custom domains > dodaj `cullexart.pl`.

## Do uzupełnienia w index.html
- numer telefonu (`+48 000 000 000`) i adres e-mail w sekcji kontaktu
- opcjonalnie: polityka prywatności, NIP/dane firmy w stopce
