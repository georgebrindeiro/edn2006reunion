declare module "react-simple-maps" {
  import { ComponentProps, ReactNode } from "react";

  interface GeographiesChildrenProps {
    geographies: Array<{ rsmKey: string; [key: string]: unknown }>;
  }

  export function ComposableMap(props: {
    projectionConfig?: { scale?: number; center?: [number, number]; rotate?: [number, number, number] };
    style?: React.CSSProperties;
    children?: ReactNode;
  }): JSX.Element;

  export function Geographies(props: {
    geography: string | object;
    children: (props: GeographiesChildrenProps) => ReactNode;
  }): JSX.Element;

  export function Geography(props: {
    geography: unknown;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }): JSX.Element;

  export function Marker(props: {
    coordinates: [number, number];
    onClick?: () => void;
    children?: ReactNode;
  }): JSX.Element;

  export function ZoomableGroup(props: {
    center?: [number, number];
    zoom?: number;
    children?: ReactNode;
  }): JSX.Element;
}
