const ERROR_HEADING = 'Something wrong happened';
const SHOW_DETAILS_LABEL = 'Show details';
const HIDE_DETAILS_LABEL = 'Hide details';
const CLOSE_LABEL = 'Close';
const DETAILS_POLL_MS = 200;
const DETAILS_WAIT_MS = 5000;
const DETAILS_SCREENSHOT = 'console-error-details';

type CapturedErrorDetails = {
  expanded: boolean;
  text: string;
};

const findButtonByText = ($root: JQuery<HTMLElement>, label: string): JQuery<HTMLElement> =>
  $root.find('button, [role="button"]').filter((_, el) => {
    return (el.textContent ?? '').includes(label);
  });

const findShowDetailsButton = ($body: JQuery<HTMLElement>): JQuery<HTMLElement> =>
  findButtonByText($body, SHOW_DETAILS_LABEL).filter((_, el) => !el.closest('[role="dialog"]'));

const detailsAreVisible = ($body: JQuery<HTMLElement>): boolean =>
  $body.find('[role="dialog"]').length > 0 ||
  findButtonByText($body, HIDE_DETAILS_LABEL).length > 0;

const fieldValue = (node: Element): string => {
  if (node.tagName !== 'INPUT' && node.tagName !== 'TEXTAREA') {
    return '';
  }
  return (node as HTMLInputElement).value.trim();
};

const collectText = (root: HTMLElement): string => {
  const visible = root.innerText.trim();
  const extras: string[] = [];
  root.querySelectorAll('pre, code, input, textarea').forEach((node) => {
    const value =
      node.tagName === 'INPUT' || node.tagName === 'TEXTAREA'
        ? fieldValue(node)
        : (node.textContent ?? '').trim();
    if (value && !visible.includes(value)) {
      extras.push(value);
    }
  });
  return [visible, ...extras].filter(Boolean).join('\n\n');
};

const readExpandedDetails = ($body: JQuery<HTMLElement>): string => {
  const dialog = $body.find('[role="dialog"]').last().get(0);
  if (dialog) {
    return collectText(dialog);
  }

  const heading = $body
    .find('h1, h2, h3')
    .filter((_, el) => (el.textContent ?? '').includes(ERROR_HEADING))
    .first();
  const region =
    heading
      .closest('.pf-v5-c-empty-state, .pf-v6-c-empty-state, [role="alert"], section, main')
      .get(0) ??
    heading.parent().get(0) ??
    $body.get(0);
  return region ? collectText(region) : '';
};

const detailsLookReady = ($body: JQuery<HTMLElement>, text: string): boolean => {
  if (
    text.includes('Description:') ||
    text.includes('Stack trace') ||
    text.includes('Component trace')
  ) {
    return true;
  }
  return $body
    .find('[role="dialog"] pre, [role="dialog"] code, [role="dialog"] textarea')
    .toArray()
    .some((el) => (el.textContent ?? '').trim().length > 0 || fieldValue(el).length > 0);
};

const formatDetails = (title: string, captured: CapturedErrorDetails): string =>
  [
    `Test: ${title}`,
    `Spec: ${Cypress.spec.relative}`,
    `Expanded: ${captured.expanded ? 'yes' : 'no'}`,
    '',
    captured.text.trim() || '(no details text found)',
    '',
  ].join('\n');

const isVisible = (el: HTMLButtonElement): boolean => {
  if (el.hidden || el.disabled || el.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  const style = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (!style || style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const topDialog = (doc: Document): Element | null => {
  const dialogs = doc.querySelectorAll('[role="dialog"]');
  return dialogs.item(dialogs.length - 1);
};

const clickCloseButton = (dialog: Element): boolean => {
  const buttons = Array.from(dialog.querySelectorAll('button')).filter((el) => isVisible(el));
  const close =
    buttons.find((el) => el.getAttribute('aria-label') === CLOSE_LABEL) ??
    buttons.find((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim() === CLOSE_LABEL);
  if (!close) {
    return false;
  }
  close.click();
  return true;
};

// PatternFly listens for keydown on document.body and closes when event.key is Escape.
const pressEscape = (doc: Document): void => {
  const view = doc.defaultView;
  if (!view || !doc.body) {
    return;
  }
  doc.body.dispatchEvent(
    new view.KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      code: 'Escape',
      key: 'Escape',
    }),
  );
};

const dismissErrorDetails = (doc: Document): void => {
  try {
    const dialog = topDialog(doc);
    if (dialog && clickCloseButton(dialog)) {
      return;
    }
    pressEscape(doc);
  } catch {
    try {
      pressEscape(doc);
    } catch {
      // The test is already failed; dismissing the modal must not replace that error.
    }
  }
};

type PageSnapshot = {
  $body: JQuery<HTMLElement>;
  expanded: boolean;
  text: string;
};

const pageClosed: CapturedErrorDetails = {
  expanded: false,
  text: '(page closed before error details could be read)',
};

const readPage = (win: Window): null | PageSnapshot => {
  try {
    const body = win.document?.body;
    if (!body) {
      return null;
    }
    const $body = Cypress.$(body);
    return {
      $body,
      expanded: detailsAreVisible($body),
      text: readExpandedDetails($body),
    };
  } catch {
    return null;
  }
};

const captureExpandedDetails = (win: Window): Promise<CapturedErrorDetails> =>
  new Cypress.Promise((resolve) => {
    const started = Date.now();
    const poll = (): void => {
      try {
        const page = readPage(win);
        if (!page) {
          resolve(pageClosed);
          return;
        }
        const ready = page.expanded && detailsLookReady(page.$body, page.text);
        if (ready || Date.now() - started >= DETAILS_WAIT_MS) {
          resolve({ expanded: page.expanded, text: page.text });
          return;
        }
      } catch {
        resolve(pageClosed);
        return;
      }
      setTimeout(poll, DETAILS_POLL_MS);
    };
    poll();
  });

// afterEach still has the page. Cypress.on('fail') runs after the command queue
// has stopped, so it cannot click Show details. This hook does not catch or
// rethrow the test error, so a failed test stays failed.
afterEach(function (): void {
  const test = this.currentTest;
  if (!test || (test.state !== 'failed' && !test.err)) {
    return;
  }

  cy.get('body', { timeout: 10000 }).then(($body) => {
    const showDetails = findShowDetailsButton($body);
    if (!$body.text().includes(ERROR_HEADING) || showDetails.length === 0) {
      return;
    }

    cy.wrap(showDetails.first()).click();
    cy.window()
      .then((win) => captureExpandedDetails(win))
      .then((captured) => {
        // plugins/index.ts writes the .txt after it prefixes the png, using this text.
        cy.task('setConsoleErrorText', formatDetails(test.fullTitle(), captured));
        cy.screenshot(DETAILS_SCREENSHOT, { capture: 'runner', overwrite: true });
        cy.then(() => {
          try {
            const doc = Cypress.$('body').get(0)?.ownerDocument;
            if (doc) {
              dismissErrorDetails(doc);
            }
          } catch {
            // The test is already failed; dismissing the modal must not replace that error.
          }
        });
      });
  });
});
