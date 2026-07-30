export type ParsedPortText = {
  name?: string;
  port: string;
  protocol: string;
  targetPort: string;
};

export type ValidationResult = {
  errorMessage: string;
  isValid: boolean;
};

export type ServiceFormFieldErrors = {
  portsError?: string;
  selectorError?: string;
};
