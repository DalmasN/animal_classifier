import { IImage } from "./IImage";

export interface IGallary {
  allImageNames: string[],
  images: IImage[],
  imageIndexes: number[],
  setImageIndexes: React.Dispatch<React.SetStateAction<number[]>>,
  imgLabels: string[],
  isLoading: boolean,
}