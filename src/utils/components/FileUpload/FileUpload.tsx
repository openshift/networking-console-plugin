import React, { FC } from 'react';

import { FileUpload, FileUploadProps } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

const NetworkingFileUpload: FC<FileUploadProps> = (props) => {
  const { t } = useNetworkingTranslation();
  return <FileUpload {...props} browseButtonText={t('Browse...')} clearButtonText={t('Clear')} />;
};

export default NetworkingFileUpload;
