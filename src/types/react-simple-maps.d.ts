declare module "react-simple-maps" {
  import { ComponentProps, ReactNode } from "react";

  interface GeographiesChildrenProps {
    geographies: Array<{ rsmKey: string; [key: string]: unknown }>;
  }

  export function ComposableMap(props: {
    width?: number;
    height?: number;
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
    minZoom?: number;
    maxZoom?: number;
    translateExtent?: [[number, number], [number, number]];
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
    onMoveStart?: (position: { coordinates: [number, number]; zoom: number }) => void;
    onMove?: (position: { x: number; y: number; k: number; dragging: boolean }) => void;
    children?: ReactNode;
  }): JSX.Element;

  export function useMapContext(): {
    projection: (coords: [number, number]) => [number, number] | null;
    path: unknown;
  };
}
