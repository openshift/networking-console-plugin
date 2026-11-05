import {
  InterfaceType,
  NodeNetworkConfigurationInterface,
} from '@kubevirt-ui-ext/kubevirt-api/nmstate';
import { EthernetIcon, LinkIcon, NetworkIcon } from '@patternfly/react-icons';
import { EdgeModel, ModelKind, NodeModel, NodeShape, NodeStatus } from '@patternfly/react-topology';
import {
  BASE_IFACE,
  LINK_AGGREGATION,
  networkNodeLevel,
} from '@utils/resources/nmstate/NodeNetworkStates/constants';
import { findInterfaceByName } from '@utils/resources/nmstate/NodeNetworkStates/selectors';
import { isEmpty } from '@utils/utils/helpers';
import BridgeIcon from '@views/topology/components/BridgeIcon';
import { GROUP, NODE_DIAMETER } from '@views/topology/utils/constants';

const statusMap: { [key: string]: NodeStatus } = {
  absent: NodeStatus.warning,
  down: NodeStatus.danger,
  up: NodeStatus.success,
};

/**
 * Map interface state to PatternFly NodeStatus
 */
const getStatus = (iface: NodeNetworkConfigurationInterface): NodeStatus => {
  return statusMap[iface.state.toLowerCase()] || NodeStatus.default;
};

/**
 * Map interface type to PatternFly icon component
 */
const getIcon = (iface: NodeNetworkConfigurationInterface) => {
  if (
    iface.bridge ||
    iface.type === InterfaceType.OVS_BRIDGE ||
    iface.type === InterfaceType.LINUX_BRIDGE
  )
    return BridgeIcon;
  if (iface.ethernet || iface.type === InterfaceType.ETHERNET) return EthernetIcon;
  if (iface.type === InterfaceType.BOND) return LinkIcon;
  return NetworkIcon;
};

/**
 * Create interface nodes for a single NodeNetworkState
 */
export const createInterfaceNodes = (
  nnsName: string,
  interfaces: NodeNetworkConfigurationInterface[],
  nnceConfiguredInterfaces: NodeNetworkConfigurationInterface[],
): NodeModel[] =>
  interfaces.map((iface) => {
    const isDerivedFromPolicy = findInterfaceByName(nnceConfiguredInterfaces, iface.name);
    return {
      data: {
        bondPorts: iface[LINK_AGGREGATION]?.port,
        bridgePorts: iface.bridge?.port,
        icon: getIcon(iface),
        isDerivedFromPolicy,
        level: networkNodeLevel[iface.type],
        resource: iface,
        type: iface.type,
        vlanBaseInterface: iface.vlan?.[BASE_IFACE],
      },
      height: NODE_DIAMETER,
      id: `${nnsName}~${iface.name}~${iface.type}`,
      label: iface.name,
      parent: nnsName,
      shape: isDerivedFromPolicy ? NodeShape.circle : NodeShape.rect,
      status: getStatus(iface),
      type: ModelKind.node,
      width: NODE_DIAMETER,
    };
  });

/**
 * Create edges between interfaces (bridge/bond/vlan connections)
 */
export const createInterfaceEdges = (childNodes: NodeModel[]): EdgeModel[] => {
  const edges: EdgeModel[] = [];

  childNodes?.forEach((sourceNode) => {
    // Find bridge connections
    if (!isEmpty(sourceNode.data?.bridgePorts)) {
      sourceNode.data?.bridgePorts?.forEach((port) => {
        const targetNode = childNodes.find(
          (target) => target.label === port.name && target.id !== sourceNode.id,
        );

        if (!isEmpty(targetNode)) {
          edges.push({
            data: {
              sourceId: sourceNode.id,
              targetId: targetNode.id,
            },
            id: `${sourceNode.id}~${targetNode.id}-edge`,
            source: sourceNode.id,
            target: targetNode.id,
            type: ModelKind.edge,
          });
        }
      });
    }

    // Find bond connections
    if (!isEmpty(sourceNode.data?.bondPorts)) {
      sourceNode.data?.bondPorts?.forEach((port) => {
        const targetNode = childNodes.find(
          (target) => target.label === port && target.id !== sourceNode.id,
        );

        if (!isEmpty(targetNode)) {
          edges.push({
            data: {
              sourceId: sourceNode.id,
              targetId: targetNode.id,
            },
            id: `${sourceNode.id}~${targetNode.id}-edge`,
            source: sourceNode.id,
            target: targetNode.id,
            type: ModelKind.edge,
          });
        }
      });
    }

    // Find vlan connections
    if (!isEmpty(sourceNode.data?.vlanBaseInterface)) {
      const baseInterface = sourceNode.data?.vlanBaseInterface;

      const targetNode = childNodes.find(
        (target) => target.label === baseInterface && target.id !== sourceNode.id,
      );

      if (!isEmpty(targetNode)) {
        edges.push({
          data: {
            sourceId: sourceNode.id,
            targetId: targetNode.id,
          },
          id: `${sourceNode.id}~${targetNode.id}-edge`,
          source: sourceNode.id,
          target: targetNode.id,
          type: ModelKind.edge,
        });
      }
    }
  });

  return edges;
};

/**
 * Create a group node for a NodeNetworkState
 */
export const createNodeGroup = (
  nnsName: string,
  childNodeIds: string[],
  visible: boolean,
): NodeModel => {
  return {
    children: childNodeIds,
    data: {
      badge: 'NNS',
    },
    group: true,
    id: nnsName,
    label: nnsName,
    style: {
      padding: 40,
    },
    type: GROUP,
    visible,
  };
};
