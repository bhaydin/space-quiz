# Orbital quiz

## Runtime and architecture

Keep the application as a single, self-contained `index.html` that works when
opened directly with a `file://` URL. HTML, CSS, JavaScript, SVG artwork, and quiz
data are inline. Preserve the no-server, no-dependencies requirement; avoid
external fonts, asset downloads, fetch requests, and module-loading requirements.

The application is a client-side quiz with in-memory state and two views:
questions and results. Reloading starts a fresh run. `index`, `score`, and
`answered` govern the flow:

- `renderQuestion()` creates answer buttons and resets per-question UI.
- `selectAnswer()` locks all answers, scores once, reveals feedback, advances
  progress, and enables Next.
- Next advances only after an answer; the last question opens `showResults()`.
- Restart resets state and renders question one.

## Product and implementation conventions

- Preserve the ten-question space-exploration format, centered narrow column
  (510px maximum), sans-serif typography, and 14-16px body-text target.
- Question records contain `category`, `question`, `answers`, a zero-based
  `correct` index, and an explanatory `fact`. There are four answers per question.
  The ten-question total is also embedded in markup, progress, counters, results,
  and percentage calculations; keep these surfaces consistent when editing data.
- Progress counts answered questions, including incorrect ones; score counts
  correct answers. The `answered` guard and disabled buttons prevent repeat scoring.
- Correct answers use `.correct` / `.good` green styling and `correct-pop`;
  incorrect selections use `.wrong` / `.bad` red styling and `shake`. A wrong
  selection also reveals the correct answer.
- Results use score bands of 0-4, 5-7, and 8-10 with distinct emoji reactions;
  10/10 additionally displays the perfect-mission message.
- Theme colors are CSS custom properties on `:root`, with automatic
  `prefers-color-scheme: dark` overrides. Preserve the
  `prefers-reduced-motion: reduce` animation override.
- Keep native buttons, visible keyboard focus, live score/feedback regions,
  and accessible emoji labels. After answering, focus moves to Next; after
  advancing/restarting, it moves to the question heading; results focus their
  heading. These headings use `tabindex="-1"` without joining the normal Tab order.
- Build answer text and explanations with `textContent` / DOM nodes; existing
  `innerHTML` assignments are for controlled UI templates.

## Running and browser smoke checks

Open `index.html` directly in the integrated browser. On Windows, the default
browser can also be opened from the project root with:

```powershell
Start-Process .\index.html
```

For a single scoring/feedback check, reload, select Neil Armstrong on question
one, and confirm score 1, progress 1/10, green feedback, locked answers, and an
enabled Next button. Selecting Buzz Aldrin instead should leave score 0, show
red shake feedback, and reveal Neil Armstrong as correct.

For the full smoke flow, use real Tab/Shift+Tab and Enter/Space input to select
answers, advance, and restart. Check focus transitions, one-time scoring,
all ten progress increments, final score/percentage, and emoji bands at scores
0, 4, 5, 7, 8, and 10. Restart must clear score/progress and restore enabled
answers. Check the browser for JavaScript errors. DOM `.click()` checks can
exercise state transitions but do not establish native keyboard behavior.
