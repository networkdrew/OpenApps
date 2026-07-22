import { describe, expect, it } from "vitest";
import { renderInlineText, renderMarkdown } from "./markdown";

describe("renderMarkdown — block structure", () => {
  it("renders headings h1-h6", () => {
    for (let level = 1; level <= 6; level++) {
      const html = renderMarkdown(`${"#".repeat(level)} Title`);
      expect(html).toBe(`<h${level}>Title</h${level}>`);
    }
  });

  it("renders a paragraph", () => {
    expect(renderMarkdown("Just some text.")).toBe("<p>Just some text.</p>");
  });

  it("joins soft-wrapped lines within a paragraph with a space", () => {
    expect(renderMarkdown("Line one\nLine two")).toBe(
      "<p>Line one Line two</p>",
    );
  });

  it("turns a trailing double-space line ending into a hard break", () => {
    expect(renderMarkdown("Line one  \nLine two")).toBe(
      "<p>Line one<br />Line two</p>",
    );
  });

  it("separates paragraphs on a blank line", () => {
    expect(renderMarkdown("First\n\nSecond")).toBe(
      "<p>First</p>\n<p>Second</p>",
    );
  });

  it("renders a horizontal rule", () => {
    expect(renderMarkdown("---")).toBe("<hr />");
    expect(renderMarkdown("***")).toBe("<hr />");
  });

  it("renders a blockquote", () => {
    expect(renderMarkdown("> quoted text")).toBe(
      "<blockquote><p>quoted text</p></blockquote>",
    );
  });

  it("renders a multi-line blockquote as one block", () => {
    expect(renderMarkdown("> line one\n> line two")).toBe(
      "<blockquote><p>line one line two</p></blockquote>",
    );
  });

  it("renders an unordered list", () => {
    expect(renderMarkdown("- one\n- two")).toBe(
      "<ul><li>one</li><li>two</li></ul>",
    );
  });

  it("supports *, -, and + as unordered markers", () => {
    expect(renderMarkdown("* one")).toBe("<ul><li>one</li></ul>");
    expect(renderMarkdown("+ one")).toBe("<ul><li>one</li></ul>");
  });

  it("renders an ordered list", () => {
    expect(renderMarkdown("1. one\n2. two")).toBe(
      "<ol><li>one</li><li>two</li></ol>",
    );
  });

  it("renders a task list with checked and unchecked items", () => {
    const html = renderMarkdown("- [ ] todo\n- [x] done");
    expect(html).toContain('class="task-list-item"');
    expect(html).toContain('<input type="checkbox" disabled />');
    expect(html).toContain('<input type="checkbox" disabled checked />');
  });

  it("renders a fenced code block verbatim, without inline parsing", () => {
    const html = renderMarkdown("```\n**not bold** [[not a link]]\n```");
    expect(html).toBe("<pre><code>**not bold** [[not a link]]</code></pre>");
  });

  it("keeps a language hint as a class on fenced code blocks", () => {
    const html = renderMarkdown("```js\nconst x = 1;\n```");
    expect(html).toBe(
      '<pre><code class="language-js">const x = 1;</code></pre>',
    );
  });

  it("does not crash on an unterminated fenced code block", () => {
    expect(() => renderMarkdown("```\nunterminated")).not.toThrow();
  });
});

describe("renderMarkdown — inline formatting", () => {
  it("renders bold with ** and __", () => {
    expect(renderMarkdown("**bold**")).toBe("<p><strong>bold</strong></p>");
    expect(renderMarkdown("__bold__")).toBe("<p><strong>bold</strong></p>");
  });

  it("renders italic with * and _", () => {
    expect(renderMarkdown("*italic*")).toBe("<p><em>italic</em></p>");
    expect(renderMarkdown("_italic_")).toBe("<p><em>italic</em></p>");
  });

  it("renders italic nested inside bold", () => {
    expect(renderMarkdown("**bold *and italic* text**")).toBe(
      "<p><strong>bold <em>and italic</em> text</strong></p>",
    );
  });

  it("renders inline code without interpreting markdown inside it", () => {
    expect(renderMarkdown("`**not bold**`")).toBe(
      "<p><code>**not bold**</code></p>",
    );
  });

  it("renders a link with a safe http(s) url", () => {
    expect(renderMarkdown("[OpenApps](https://example.com)")).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">OpenApps</a></p>',
    );
  });

  it("renders an image with a safe url", () => {
    expect(renderMarkdown("![alt text](https://example.com/x.png)")).toBe(
      '<p><img src="https://example.com/x.png" alt="alt text" loading="lazy" /></p>',
    );
  });

  it("refuses to render a javascript: link as a clickable anchor", () => {
    const html = renderMarkdown("[click me](javascript:alert(1))");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain('href="javascript');
  });

  it("refuses to render a data: image as an <img>", () => {
    const html = renderMarkdown(
      "![x](data:text/html,<script>alert(1)</script>)",
    );
    expect(html).not.toContain("<img");
  });

  it("allows a mailto link", () => {
    expect(renderMarkdown("[email](mailto:a@example.com)")).toContain(
      'href="mailto:a@example.com"',
    );
  });

  it("allows a relative link", () => {
    expect(renderMarkdown("[home](/notes/)")).toContain('href="/notes/"');
  });

  it("supports escaping a literal asterisk", () => {
    expect(renderMarkdown("\\*not italic\\*")).toBe("<p>*not italic*</p>");
  });
});

describe("renderMarkdown — wiki links", () => {
  it("renders a simple wiki link", () => {
    const html = renderMarkdown("[[My Note]]");
    expect(html).toContain('data-wiki-link="My Note"');
    expect(html).toContain(">My Note</a>");
    expect(html).toContain('class="wiki-link"');
  });

  it("renders an aliased wiki link with the alias as display text", () => {
    const html = renderMarkdown("[[My Note|click here]]");
    expect(html).toContain('data-wiki-link="My Note"');
    expect(html).toContain(">click here</a>");
  });

  it("marks a wiki link as missing when noteExists returns false", () => {
    const html = renderMarkdown("[[Ghost]]", { noteExists: () => false });
    expect(html).toContain("wiki-link-missing");
  });

  it("marks a wiki link as existing when noteExists returns true", () => {
    const html = renderMarkdown("[[Real Note]]", { noteExists: () => true });
    expect(html).not.toContain("wiki-link-missing");
  });

  it("does not treat a regular link as a wiki link", () => {
    const html = renderMarkdown("[text](https://example.com)");
    expect(html).not.toContain("data-wiki-link");
  });
});

describe("renderMarkdown / renderInlineText — XSS safety", () => {
  it("escapes a raw script tag instead of executing it", () => {
    const html = renderMarkdown("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes an inline HTML event handler attempt", () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });

  it("escapes HTML inside emphasis and headings too", () => {
    expect(renderInlineText("<b>hi</b>")).toBe("&lt;b&gt;hi&lt;/b&gt;");
    expect(renderMarkdown("# <script>bad()</script>")).toBe(
      "<h1>&lt;script&gt;bad()&lt;/script&gt;</h1>",
    );
  });

  it("escapes HTML inside a link label and safe url content", () => {
    const html = renderMarkdown(
      '[<b>text</b>](https://example.com/"><script>)',
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>text</b>");
  });
});
