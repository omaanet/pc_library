# Implementation of a new Reader

## 1. Create a new reader component

-   Use the files in folder `src\app\read-book\[book_id]\_references` as a reference and starting point.
-   Build the new reader component from `index.html`, `script.js` and `style.css`.
-   The new reader component will take the place of `ClientReadBookPage` component.
-   The reader component will load the various images/pages from the server using imagePrefix: 'read-book/[book_id]/pages/page-' and imageExt: '.png'.
-   The `pagesCount` property of Book retrieved from the database will be used to set the `totalPages` property of the reader component.
