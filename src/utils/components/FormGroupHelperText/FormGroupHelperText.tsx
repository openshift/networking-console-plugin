import React, { FC } from 'react';

import {
  FormHelperText,
  HelperText,
  HelperTextItem,
  ValidatedOptions,
} from '@patternfly/react-core';

type FormGroupHelperTextProps = {
  validated?: ValidatedOptions;
};

const FormGroupHelperText: FC<FormGroupHelperTextProps> = ({
  children,
  validated = ValidatedOptions.default,
}) => (
  <FormHelperText>
    <HelperText>
      <HelperTextItem variant={validated}>{children}</HelperTextItem>
    </HelperText>
  </FormHelperText>
);

export default FormGroupHelperText;
