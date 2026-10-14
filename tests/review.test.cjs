// Run with: node --test tests/review.test.cjs
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");

test("results review tracks only missed answers in order and clears on restart", () => {
  const elements = new Map();
  class Element {
    constructor() {
      this.children = [];
      this.textContent = "";
      this.hidden = false;
      this.listeners = {};
      this.classList = { add() {} };
    }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute() {}
    addEventListener(event, handler) { this.listeners[event] = handler; }
    focus() { document.activeElement = this; }
    click() { this.listeners.click(); }
  }
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new Element());
      return elements.get(id);
    },
    createElement() { return new Element(); },
    createTextNode(text) { return { textContent: text }; }
  };
  const source = readFileSync(join(__dirname, "..", "index.html"), "utf8");
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1];
  runInNewContext(`${script}
    globalThis.quizTest = {
      questions, selectAnswer,
      state: () => ({ index, score, selected: [...selectedAnswers] })
    };`, { document, globalThis: document });
  const { questions, selectAnswer, state } = document.quizTest;
  const get = id => document.getElementById(id);
  const text = element => element.textContent + (element.children || []).map(text).join("");

  for (const targetScore of [0, 4, 5, 7, 8, 10]) {
    questions.forEach((question, index) => {
      const selected = index < targetScore ? question.correct : (question.correct + 1) % 4;
      selectAnswer(selected);
      selectAnswer((selected + 1) % 4);
      assert.equal(state().selected[index], selected, "repeat answers cannot overwrite history");
      assert.equal(get("progress").value, index + 1);
      get("next").click();
    });
    assert.equal(state().score, targetScore);
    assert.equal(get("progress").value, 10);
    assert.equal(document.activeElement, get("result-title"));
    assert.equal(get("review").open, false);
    assert.equal(get("review").hidden, targetScore === 10);
    assert.equal(get("no-missed-answers").hidden, targetScore !== 10);
    assert.match(get("review-summary").textContent, new RegExp(`\\(${10 - targetScore}\\)`));
    assert.equal(get("missed-answers").children.length, 10 - targetScore);
    get("missed-answers").children.forEach((item, offset) => {
      const index = targetScore + offset;
      const question = questions[index];
      assert.equal(text(item.children[0]), `Question ${index + 1}: ${question.question}`);
      assert.equal(text(item.children[1]), `Your answer (incorrect): ${question.answers[(question.correct + 1) % 4]}`);
      assert.equal(text(item.children[2]), `Correct answer: ${question.answers[question.correct]}`);
      assert.equal(text(item.children[3]), `Explanation: ${question.fact}`);
    });
    get("review").open = true;
    assert.equal(state().score, targetScore);
    assert.equal(get("progress").value, 10);
    get("restart").click();
    assert.equal(state().selected.length, 0);
    assert.equal(state().score, 0);
    assert.equal(get("progress").value, 0);
    assert.equal(get("missed-answers").children.length, 0);
    assert.equal(get("review-summary").textContent, "");
    assert.equal(get("review").open, false);
    assert.equal(get("review").hidden, true);
    assert.equal(document.activeElement, get("question"));
  }
});
