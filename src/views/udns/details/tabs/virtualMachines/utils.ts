export const getVMStatusLabelColor = (status: string) => {
  if (!status) {
    return 'grey';
  }

  if (status.includes('Error') || status === 'Stopped') {
    return 'red';
  }

  if (status === 'Running') {
    return 'green';
  }

  return 'orange';
};
