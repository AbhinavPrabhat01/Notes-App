const newNoteBtn = document.querySelector(".ui-btn.new-note-btn");
const notesList = document.querySelector(".notes-list");
const titleInput = document.querySelector(".title");
const editor = document.querySelector(".editor");
const saveBtn = document.querySelector(".custom-btn.save-btn.noselect");
const deleteBtn = document.querySelector(".custom-btn.delete-btn.noselect");
const emptyState = document.querySelector(".empty-state");
const searchInput = document.querySelector(".search");

let notes = [];
let isDirty = false;
let activeNoteId = null;

loadFromLocalStorage();
renderNotes();
renderActiveNote();

newNoteBtn.addEventListener("click", () => {
  const note = createNote();
  activeNoteId = note.id;
  renderNotes();
  renderActiveNote();
  console.log("New note created:", note);
});

function createNote() {
  const note = {
    id: Date.now(),
    title: "",
    content: "",
    creationDate: new Date().toLocaleString(),
  };
  notes.push(note);
  return note;
}

// function renderNotes() {
//   notesList.innerHTML = "";
//   notes.forEach((note) => {
//     const noteItem = document.createElement("div");
//     noteItem.addEventListener("click", () => {
//       activeNoteId = note.id;
//       renderNotes();
//       renderActiveNote();
//     });
//     noteItem.classList.add("note-item");
//     if (note.id === activeNoteId) {
//       noteItem.classList.add("active");
//     }
//     noteItem.innerHTML = `
//       <h4>${note.title}</h4>
//       <p>${truncateAtWord(note.content)}</p>
//     `;
//     notesList.appendChild(noteItem);
//   });
// }

function renderNotes(filter = "") {
  notesList.innerHTML = "";

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(filter.toLowerCase()) ||
      note.content.toLowerCase().includes(filter.toLowerCase()),
  );
  if (filteredNotes.length === 0) {
    notesList.innerHTML = `<p style="opacity:0.5;">No notes found</p>`;
  }

  filteredNotes.forEach((note) => {
    const noteItem = document.createElement("div");

    noteItem.classList.add("note-item");
    if (note.id === activeNoteId) {
      noteItem.classList.add("active");
    }

    noteItem.innerHTML = `
      <h4>${note.title || "Untitled"}</h4>
      <p>${truncateAtWord(note.content)}</p>
    `;

    noteItem.addEventListener("click", () => {
      activeNoteId = note.id;
      renderNotes(searchInput.value); // keep filter
      renderActiveNote();
    });

    notesList.appendChild(noteItem);
  });
}

// To truncate the content preview in the note list without breaking words
function truncateAtWord(text, maxLength = 20) {
  if (!text || text.length <= maxLength) return text;

  let truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  // Cut at last space to avoid breaking words
  if (lastSpace > 0) {
    truncated = truncated.substring(0, lastSpace);
  }

  return truncated + "...";
}

function renderActiveNote() {
  const activeNote = notes.find((note) => note.id === activeNoteId);
  if (!activeNote) {
    editor.style.filter = "blur(3px)";
  } else {
    editor.style.filter = "blur(0)";
  }
  if (!activeNote) {
    editor.style.opacity = "0.3";
  } else {
    editor.style.opacity = "1";
  }

  if (!activeNote) {
    emptyState.style.display = "block";
    titleInput.value = "";
    editor.value = "";
    titleInput.disabled = true;
    return;
  }
  titleInput.disabled = false;
  emptyState.style.display = "none";

  titleInput.value = activeNote.title;
  editor.value = activeNote.content;
}

titleInput.addEventListener("input", () => {
  const activeNote = notes.find((note) => note.id === activeNoteId);
  if (activeNote) {
    activeNote.title = titleInput.value;
    isDirty = true;
    renderNotes();
  }
});

editor.addEventListener("input", () => {
  const activeNote = notes.find((note) => note.id === activeNoteId);
  if (activeNote) {
    activeNote.content = editor.value;
    isDirty = true;
    renderNotes();
  }
});

function saveToLocalStorage() {
  localStorage.setItem("notesApp", JSON.stringify(notes));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem("notesApp");
  if (data) {
    notes = JSON.parse(data);
    activeNoteId = null;
  }
}

deleteBtn.addEventListener("click", () => {
  if (!activeNoteId) return;
  const confirmDelete = confirm("Are you sure you want to delete this note?");

  if (!confirmDelete) return;

  notes = notes.filter((note) => note.id !== activeNoteId);

  if (notes.length > 0) {
    activeNoteId = notes[0].id;
  } else {
    activeNoteId = null;
  }

  saveToLocalStorage();
  renderNotes();
  renderActiveNote();
});


saveBtn.addEventListener("click", () => {
  if (!activeNoteId || !isDirty) return;

  saveToLocalStorage();
  isDirty = false;

  // Optional UX feedback (clean, no alert spam)
  saveBtn.querySelector(".text").innerText = "Saved";

  setTimeout(() => {
    saveBtn.querySelector(".text").innerText = "Save";
  }, 3000);
});

window.addEventListener("beforeunload", (e) => {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

// When user clicks anywhere outside the notes, active note should be deselected
notesList.addEventListener("click", (e) => {
  const isNote = e.target.closest(".note-item");
  if (!isNote) {
    activeNoteId = null;
    renderNotes();
    renderActiveNote();
  }
});

searchInput.addEventListener("input", () => {
  renderNotes(searchInput.value);
});
