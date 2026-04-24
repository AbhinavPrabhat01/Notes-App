const newNoteBtn = document.querySelector(".ui-btn.new-note-btn");
const notesList = document.querySelector(".notes-list");
const titleInput = document.querySelector(".title");
const editor = document.querySelector(".editor");
const saveBtn = document.querySelector(".custom-btn.save-btn.noselect");
const deleteBtn = document.querySelector(".custom-btn.delete-btn.noselect");
const emptyState = document.querySelector(".empty-state");
const searchInput = document.querySelector(".search");
const modal = document.getElementById("deleteModal");
const confirmBtn = document.querySelector(".confirm-btn");
const cancelBtn = document.querySelector(".cancel-btn");

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
    creationDate: new Date().toISOString(),
    ismodified: false,
    modificationDate: null,
  };
  notes.push(note);
  return note;
}

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
    const isEdited =
      note.modificationDate !== null &&
      note.modificationDate !== note.creationDate;

    const dateText = isEdited
      ? "Edited " + formatRelativeTime(note.modificationDate)
      : "Created " + formatRelativeTime(note.creationDate);

    const noteItem = document.createElement("div");

    noteItem.classList.add("note-item");
    if (note.id === activeNoteId) {
      noteItem.classList.add("active");
    }

    noteItem.innerHTML = `
      <h4>
  ${truncateAtWord(note.title) || "Untitled"}
  ${note.id === activeNoteId ? '<span class="active-dot"></span>' : ""}
</h4>
      <p>${truncateAtWord(note.content)}</p>
      <span class="note-date">${dateText}</span>
    `;

    noteItem.addEventListener("click", () => {
      activeNoteId = note.id;
      renderNotes(searchInput.value); // keep filter
      renderActiveNote();
    });

    notesList.appendChild(noteItem);
  });
}

setInterval(() => {
  renderNotes(searchInput.value);
}, 60000); // every 1 min

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
  modal.classList.add("active");
});

confirmBtn.addEventListener("click", () => {
  notes = notes.filter((note) => note.id !== activeNoteId);
  activeNoteId = notes.length > 0 ? notes[0].id : null; // select another note or null if none left

  saveToLocalStorage();
  renderNotes(searchInput.value);
  renderActiveNote();

  showToast("Note deleted", "error");

  closeModal();
});

cancelBtn.addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function closeModal() {
  modal.classList.remove("active");
}

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

saveBtn.addEventListener("click", () => {
  if (!activeNoteId || !isDirty) return;

  const activeNote = notes.find((note) => note.id === activeNoteId);
  if (activeNote) {
    if (!activeNote.ismodified) {
      activeNote.ismodified = true;
    } else {
      activeNote.modificationDate = new Date().toISOString();
      
      console.log("Note updated:", activeNote.modificationDate);
    }
  }

  saveToLocalStorage();
  isDirty = false;

  showToast("Note saved");

  renderNotes(searchInput.value);
  renderActiveNote();
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

function showToast(message, type = "success") {
  const container = document.querySelector(".toast-container");

  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.innerText = message;

  container.appendChild(toast);

  // trigger animation
  setTimeout(() => toast.classList.add("show"), 10);

  // auto remove
  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2000);
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);

  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1 min ago" : `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;

  // fallback to normal date for older notes
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
