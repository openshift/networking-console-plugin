/* Guards the harness's translation setup. A missing key is echoed back and then
 * interpolated, so `t('{{count}} annotation', { count: 2 })` renders "2 annotation"
 * with or without a catalog. The plural variants are what a key echo cannot
 * produce: `annotation_one` resolves to "annotation" only from the bundle. */
import * as React from 'react';
import { Trans } from 'react-i18next';
import i18next from 'i18next';

import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const namespace = 'plugin__networking-console-plugin';

describe('english catalog', () => {
  test('catalog text resolves instead of the key', () => {
    expect(i18next.hasResourceBundle('en', namespace)).toBe(true);
    expect(i18next.t('annotation_one')).toBe('annotation');
  });

  test('Trans renders catalog text instead of the key', () => {
    render(<Trans i18nKey="annotation_one" />);

    expect(screen.getByText('annotation')).toBeVisible();
  });
});
