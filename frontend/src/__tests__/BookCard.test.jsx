import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BookCard from "../components/BookCard";

const sampleBook = {
  id: 1,
  title: "Dune",
  author: "Frank Herbert",
  genre: "Science Fiction",
  price: 18.5,
  cover_url: "",
  is_in_store: true,
  is_in_library: true,
  available_copies: 2,
};

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

test("renders book title, author and genre", () => {
  renderWithRouter(<BookCard book={sampleBook} />);
  expect(screen.getByText("Dune")).toBeInTheDocument();
  expect(screen.getByText("Frank Herbert")).toBeInTheDocument();
  expect(screen.getByText("Science Fiction")).toBeInTheDocument();
});

test("shows price when the book is in the shop", () => {
  renderWithRouter(<BookCard book={sampleBook} />);
  expect(screen.getByText("$18.50")).toBeInTheDocument();
});

test("shows 'On loan' when there are no available library copies", () => {
  renderWithRouter(<BookCard book={{ ...sampleBook, available_copies: 0 }} />);
  expect(screen.getByText("On loan")).toBeInTheDocument();
});
