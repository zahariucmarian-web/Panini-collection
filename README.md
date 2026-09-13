# 🏆 Panini 2026 Sticker Tracker

O aplicație web modernă, rapidă și complet responsive creată special pentru colecționarii albumului oficial **Panini FIFA World Cup 2026** (980 de stickere). Aplicația permite monitorizarea stickerelor deținute, a celor lipsă și a dublurilor, salvând datele în timp real în cloud prin **Vercel KV**.

---

## ✨ Caracteristici Principale

1. **Sincronizare Automată în Cloud**: Datele se salvează instantaneu pe baza de date Vercel KV (Redis). Nu riști să le pierzi dacă deschizi site-ul în mod incognito sau dacă îți golești cache-ul browserului.
2. **Acces Multi-dispozitiv**: Fiecare album are un cod unic de 6 caractere (ex: `x8z2f9`). Poți deschide albumul pe telefon, PC sau tabletă accesând direct linkul tău.
3. **Fără Înregistrare**: Nu ai nevoie de cont, email sau parolă! Doar creezi albumul și salvezi link-ul în semne de carte.
4. **Centru de Schimb (Swap Hub)**: Generează automat o listă curată cu stickerele de care ai nevoie și cele pe care le oferi la schimb, gata de copiat pe WhatsApp sau Messenger.
5. **Backup JSON**: Exportă și importă oricând colecția sub formă de fișier pentru siguranță maximă.

---

## 🚀 Ghid de Găzduire pe Vercel (Gratuit & Rapid)

Aplicația este construită cu **Next.js** și este optimizată pentru a fi găzduită **100% gratuit** pe platforma Vercel.

### Pasul 1: Pune codul pe GitHub
1. Creează un depozit (repository) nou pe contul tău de [GitHub](https://github.com).
2. Inițializează git în folderul proiectului și încarcă codul:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/UTILIZATORUL_TAU/nume-depozit.git
   git push -u origin main
   ```

### Pasul 2: Conectează la Vercel
1. Intră pe [vercel.com](https://vercel.com) și autentifică-te cu contul tău de GitHub.
2. Apasă pe **Add New...** -> **Project**.
3. Selectează depozitul pe care l-ai creat anterior și apasă pe **Import**.
4. Lasă toate setările implicite și apasă pe **Deploy**.

### Pasul 3: Activează Baza de Date Vercel KV (Esențial pentru persistență)
Pentru ca aplicația să poată memora stickerele în cloud, trebuie să îi legi o bază de date gratuită KV (Redis):
1. Din panoul de control al proiectului tău de pe Vercel, mergi la tabul **Storage** (în meniul de sus).
2. Selectează **KV (Redis)** ca tip de stocare și apasă pe **Connect Database**.
3. Apasă pe **Create New**.
4. Selectează o regiune apropiată de tine (ex: *Frankfurt, Germany - fra1*) și acceptă termenii.
5. Apasă pe **Connect**. Vercel va adăuga automat variabilele de mediu necesare în proiectul tău!
6. Mergi la tabul **Deployments**, selectează ultima versiune și dă-i un **Redeploy** (sau dă un nou push pe GitHub) pentru ca aplicația să citească noile setări ale bazei de date.

---

## 🛠️ Dezvoltare Locală

Dacă vrei să rulezi proiectul local pe calculatorul tău:

1. Instalează dependențele:
   ```bash
   npm install
   ```
2. Pornește serverul de dezvoltare:
   ```bash
   npm run dev
   ```
3. Deschide [http://localhost:3000](http://localhost:3000) în browser.

> [!NOTE]
> Când rulezi local fără conexiune la Vercel KV, aplicația va folosi automat o memorie cache locală ca fallback, asigurându-ți o funcționare perfectă pentru testare!
