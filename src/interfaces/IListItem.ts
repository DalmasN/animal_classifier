import { IImage } from "./IImage";

export interface IListItem {
  img: IImage,
  label: string,
  isLoading: boolean,
}