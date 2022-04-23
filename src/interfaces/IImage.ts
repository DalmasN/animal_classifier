import { RefObject } from "react";

export interface IImage {
  id: number,
  name: string,
  src: string,
  ref: RefObject<HTMLImageElement>
}