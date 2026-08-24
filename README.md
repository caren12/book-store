# Booked — Frontend

React frontend for Booked, an online bookstore and lending library. Fetches live book data from the Google Books API and renders it as store and library listings.

## Tech Stack

- React
- Redux Toolkit
- React Router
- Tailwind CSS
- Vite

## Getting Started

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env` file in this directory:

```
VITE_GOOGLE_BOOKS_API_KEY=your_google_books_api_key_here
```

Get a key from the [Google Cloud Console](https://console.cloud.google.com/):

1. Enable the **Books API** for your project
2. Create an API key under **Credentials**
3. Restrict it under **API restrictions** to **Books API** only
4. Paste it into `.env` as shown above

`.env` is already listed in `.gitignore` — never commit it, and never hardcode the key directly in source files.

### Run the dev server

```bash
npm run dev
```

Vite only reads `.env` at server start, so restart the dev server after adding or changing `.env` values.

### Build for production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── BookCard.jsx
│   ├── pages/
│   │   └── Home.jsx
│   ├── features/
│   │   └── books/
│   │       └── booksSlice.js
│   ├── index.css
│   ├── main.jsx
│   └── App.jsx
├── .env
└── package.json
```

## Key Files

| File | Purpose |
|---|---|
| `features/books/booksSlice.js` | Redux slice — fetches and transforms book data from the Google Books API |
| `components/BookCard.jsx` | Renders a single book preview card (cover, title, author, genre, price) |
| `index.css` | Tailwind config and shared component classes (e.g. `.card-stamp` badges) |

## Notes

- Book data (price, library availability, copy counts) is partially simulated client-side since the Google Books API doesn't provide store/library metadata — see `hashToUnit` and `mapVolumeToBook` in `booksSlice.js`.
- Genre badges use `.card-stamp` in `index.css`; long genre names are shortened at the data layer and truncated with an ellipsis if still too long.