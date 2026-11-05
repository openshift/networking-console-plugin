export type ValidationResult = {
  errorMessage: string;
  isValid: boolean;
};

export type ServiceFormFieldErrors = {
  portsError?: string;
  selectorError?: string;
};

export type ServicePortFormData = {
  name: string;
  nodePort?: string;
  port: string;
  protocol: string;
  targetPort: string;
};
