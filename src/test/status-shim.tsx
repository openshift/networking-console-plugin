/* The plugin imports the console's Status component by deep path; the stand-in
 * renders the status it is given. */
import * as React from 'react';

const Status = ({ status }: { status?: string }) => <span data-testid="status">{status}</span>;

export default Status;
