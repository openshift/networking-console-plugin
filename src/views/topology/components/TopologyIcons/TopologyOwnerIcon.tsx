import React, { FC } from 'react';
import { GrMultiple } from 'react-icons/gr';

// Kubernetes SVG icon paths and mappings adapted from:
// https://github.com/netobserv/netobserv-web-console/blob/main/web/src/components/icons/kubernetes-icons.tsx

type TopologyOwnerIconProps = {
  height?: number;
  kind?: string;
  width?: number;
};

export const TopologyOwnerIcon: FC<TopologyOwnerIconProps> = ({
  height = 30,
  kind = '',
  width = 30,
}) => {
  const size = Math.min(height, width);
  const scale = (size / 18.035334) * 2;
  const normalizedKind = kind.toLowerCase();

  const content = (() => {
    switch (normalizedKind) {
      case 'deployment':
        return (
          <g transform="translate(-1.64648184,-0.54048037)">
            <path
              d="m 10.225062,13.731632 c -2.442431,0.115545 -4.519721,-1.763246 -4.64972,-4.205169 -0.12969,-2.441923 1.73638,-4.530173 4.17819,-4.673984 2.44112,-0.143811 4.54014,1.71081 4.69808,4.151068 l -1.75708,0.11372 c -0.0954,-1.473818 -1.36311,-2.593935 -2.83746,-2.50708 -1.47434,0.08686 -2.60178,1.348076 -2.52346,2.822899 0.0783,1.474822 1.333,2.609538 2.80825,2.539753 z"
              fill="currentColor"
              fillRule="evenodd"
            />
            <path
              d="m 11.135574,9.0088015 1.39745,3.4205085 3.2263,-3.4205085 z"
              fill="currentColor"
              fillRule="evenodd"
            />
          </g>
        );
      case 'job':
        return (
          <g fill="currentColor" transform="translate(-0.68857003,-0.0818698)">
            <rect height="2.1426713" width="2.2029927" x="5.4527321" y="10.877846" />
            <rect height="2.1426713" width="2.2029927" x="8.6047411" y="10.877846" />
            <rect height="2.1426713" width="2.2029927" x="11.756749" y="10.877846" />
            <rect height="2.1426713" width="2.2029927" x="11.756749" y="7.7276535" />
            <rect height="2.1426713" width="2.2029927" x="8.6148129" y="7.7607269" />
            <rect height="2.1426713" width="2.2029927" x="5.4728899" y="7.7607269" />
            <rect height="2.1426713" width="2.2029927" x="11.756749" y="4.6436005" />
          </g>
        );
      case 'daemonset':
        return (
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="0.529"
            transform="translate(-0.40634803,-0.71687052)"
          >
            <path
              d="m 7.708299,5.2827748 6.524989,0 0,4.5833348 -6.524989,0 z"
              strokeDasharray="1.587,1.587"
            />
            <path
              d="m 6.169549,6.6940855 6.524989,0 0,4.5833355 -6.524989,0 z"
              strokeDasharray="1.587,1.587"
            />
            <path d="m 4.630799,8.1053983 6.524999,0 0,4.5833347 -6.524999,0 z" />
          </g>
        );
      case 'replicaset':
      case 'statefulset':
        return (
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="0.529"
            transform="translate(-0.72384876,-0.0818705)"
          >
            <path
              d="m 8.0530333,5.1290756 6.5250067,0 0,4.583335 -6.5250067,0 z"
              strokeDasharray="1.587,1.587"
            />
            <path
              d="m 6.5142849,6.5403876 6.5250071,0 0,4.5833354 -6.5250071,0 z"
              strokeDasharray="1.587,1.587"
            />
            <path
              d="m 4.9755578,7.9516984 6.5249912,0 0,4.5833346 -6.5249912,0 z"
              fill="currentColor"
            />
          </g>
        );
      default:
        return null;
    }
  })();

  if (!content) return <GrMultiple size={size} />;

  return (
    <g
      transform={`translate(${size / 2 - 9.017667 * scale}, ${
        size / 2 - 8.750189 * scale
      }) scale(${scale})`}
    >
      {content}
    </g>
  );
};

export default TopologyOwnerIcon;
