/* =========================================================
   Hindus of the Genocide page (hindus-of-the-genocide.html)

   Reads data/people-data.json and renders a placard layout:
   portrait image on the left, name + description + link on
   the right. Entirely separate from timeline-data.json.

   To add a new person:
     1. Add an entry to data/people-data.json
     2. Add their image to images/people/
     3. Build their story page at
        hindus-of-the-genocide/their-name.html
        (use people-template.html as the starting point)
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("people-list");
  if (!container) return;

  let entries = [];
  try {
    const res = await fetch("data/people-data.json");
    entries = await res.json();
  } catch (err) {
    console.error("people.js: could not load people-data.json:", err);
    container.innerHTML =
      "<p>Could not load entries. If previewing locally, " +
      "run <code>python3 -m http.server</code> rather than opening the file directly.</p>";
    return;
  }

  if (!entries.length) {
    container.innerHTML =
      "<p style='font-family:var(--f-heading);color:var(--oxblood-soft);'>" +
      "No entries yet — check back soon.</p>";
    return;
  }

  // Update count
  const countEl = document.getElementById("people-count");
  if (countEl) {
    countEl.textContent =
      `${entries.length} ${entries.length === 1 ? "story" : "stories"}`;
  }

  container.innerHTML = entries
    .map((person) => {
      const imgSrc = person.image || "images/people/placeholder-1.jpg";
      const meta = [person.year, person.location].filter(Boolean).join(" · ");

      return `
        <article class="placard">
          <div class="placard__image">
            <img
              src="${imgSrc}"
              alt="${person.name}"
              loading="lazy"
            />
          </div>
          <div class="placard__body">
            ${meta ? `<p class="placard__meta">${meta}</p>` : ""}
            <h3 class="placard__name">${person.name}</h3>
            <p class="placard__desc">${person.description}</p>
            ${
              person.link
                ? `<a href="${person.link}" class="placard__link">
                     Read their story &rarr;
                   </a>`
                : ""
            }
          </div>
        </article>`;
    })
    .join("");
});
