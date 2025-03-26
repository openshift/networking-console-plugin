import React, { FC, JSX } from 'react';

import { DetailsItemComponentProps } from '@openshift-console/dynamic-plugin-sdk';
import {
  ClipboardCopy,
  ClipboardCopyVariant,
  Flex,
  FlexItem,
  List,
  ListItem,
} from '@patternfly/react-core';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  getLayer2JoinSubnets,
  getLayer2Subnets,
  getLayer3JoinSubnets,
  getLayer3Subnets,
  getTopology,
} from '@utils/resources/udns/selectors';
import {
  ClusterUserDefinedNetworkKind,
  UserDefinedNetworkKind,
  UserDefinedNetworkLayer3Subnet,
} from '@utils/resources/udns/types';
import { TopologyKeys } from '@views/udns/form/utils/types';

import UDNLayer2Details from './UDNLayer2Details';
import UDNLayer3Details from './UDNLayer3Details';

const UDNLayerDetails: FC<
  DetailsItemComponentProps<ClusterUserDefinedNetworkKind | UserDefinedNetworkKind>
> = ({ obj }) => {
  const { t } = useNetworkingTranslation();
  const layer3Path = obj.spec?.network ? 'spec.network.layer3' : 'spec.layer3';

  const getEmptyText = () => {
    return <MutedText content={t('Not available')} />;
  };

  const getLayer3SubnetListItem = (subnet: UserDefinedNetworkLayer3Subnet, i: number) => {
    return (
      <ListItem key={`${subnet.cidr}|${subnet.hostSubnet}`}>
        <Flex flex={{ default: 'flex_1' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <DetailsItem
              defaultValue={getEmptyText()}
              label={t('CIDR')}
              obj={obj}
              path={`${layer3Path}.subnets[${i}].cidr`}
            />
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <DetailsItem
              defaultValue={getEmptyText()}
              label={t('HostSubnet')}
              obj={obj}
              path={`${layer3Path}.subnets[${i}].hostSubnet`}
            />
          </FlexItem>
        </Flex>
      </ListItem>
    );
  };

  const getTextListItem = (text: string) => {
    return (
      <ListItem key={text}>
        <ClipboardCopy
          clickTip={t('Copied')}
          hoverTip={t('Copy')}
          isCode
          isReadOnly
          variant={ClipboardCopyVariant.inlineCompact}
        >
          {text}
        </ClipboardCopy>
      </ListItem>
    );
  };

  const getList = (children: JSX.Element[]) => {
    if (!children.length) {
      return getEmptyText();
    }
    return <List>{children}</List>;
  };

  const getContent = () => {
    switch (getTopology(obj)) {
      case TopologyKeys.Layer2:
        return (
          <UDNLayer2Details
            emptyText={getEmptyText()}
            joinSubnets={getList(getLayer2JoinSubnets(obj).map((jsn) => getTextListItem(jsn)))}
            obj={obj}
            subnets={getList(getLayer2Subnets(obj).map((sn) => getTextListItem(sn)))}
          />
        );
      case TopologyKeys.Layer3:
        return (
          <UDNLayer3Details
            emptyText={getEmptyText()}
            joinSubnets={getList(getLayer3JoinSubnets(obj).map((jsn) => getTextListItem(jsn)))}
            obj={obj}
            subnets={getList(getLayer3Subnets(obj).map((sn, i) => getLayer3SubnetListItem(sn, i)))}
          />
        );
      default:
        return <></>;
    }
  };

  return <>{getContent()}</>;
};

export default UDNLayerDetails;
