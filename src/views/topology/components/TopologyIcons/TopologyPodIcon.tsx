import React, { FC } from 'react';

// Kubernetes SVG icon paths adapted from:
// https://github.com/netobserv/netobserv-web-console/blob/main/web/src/components/icons/kubernetes-icons.tsx

type TopologyPodIconProps = {
  height?: number;
  width?: number;
};

const TopologyPodIcon: FC<TopologyPodIconProps> = ({ height = 30, width = 30 }) => {
  const size = Math.min(height, width);
  const scale = (size / 18.035334) * 2;

  return (
    <g
      transform={`translate(${size / 2 - 9.017667 * scale}, ${
        size / 2 - 8.750189 * scale
      }) scale(${scale})`}
    >
      <g transform="translate(-0.86495977,-0.82270299)">
        <path
          d="M 6.2617914,7.036086 9.8826317,5.986087 13.503462,7.036086 9.8826317,8.086087 Z"
          fill="currentColor"
        />
        <path
          d="m 6.2617914,7.43817 0,3.852778 3.3736103,1.868749 0.0167,-4.713193 z"
          fill="currentColor"
        />
        <path
          d="m 13.503462,7.43817 0,3.852778 -3.37361,1.868749 -0.0167,-4.713193 z"
          fill="currentColor"
        />
      </g>
    </g>
  );
};

export default TopologyPodIcon;
