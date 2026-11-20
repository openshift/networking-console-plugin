/** Stand-in for the console Redux selector that feeds impersonation into connected pages. */
export const impersonateStateToProps = (): { impersonate: undefined } => ({
  impersonate: undefined,
});
