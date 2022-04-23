import './App.css';
import * as tf from '@tensorflow/tfjs';
import { loadGraphModel } from '@tensorflow/tfjs-converter';
import { useEffect, useRef, useState } from 'react';
import { IImage } from './interfaces/IImage';
import { IPrediction } from './interfaces/IPrediction';
import { getAllImages } from './util/ServerController';
import Gallary from './components/Gallery/Gallery';


// Set isDevlopment to 'true' if you dont want to load model weight and make predictions. 
// Useful when developing other functionality or doing styling changes
const ENVIRONMENT = {
  isDevelopment: false
}

// IMAGE PROPERTIES
const IMAGE_WIDTH = 224;
const IMAGE_HEIGHT = 224;

// DEFAULT STATE

// IMAGE
const NBR_OF_IMAGES = 7;
const IMG_FOLDER = "ANIMAL"; // EMPTY
const imgDefault = {
  id: 0,
  name: '',
  src: '',
};

// WEIGHTS
const DATASET_FOLDER = "BO16"
const WEIGHT_FOLDER = "ResNet-101"; // ResNet-50 VGG-16

// DATASET LABELS
const LABELS = new Map<number, string>()
  .set(0, "ANIMAL")
  .set(1, "EMPTY");

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  // IMAGE HOOKS
  const [imgLabels, setImgLabels] = useState<string[]>(Array(NBR_OF_IMAGES).fill("")); 
  const [imgFolder, setImgFolder] = useState<string>(IMG_FOLDER);
  const [imageIndexes, setImageIndexes] = useState<number[]>(Array.from(Array(NBR_OF_IMAGES), (e,i) => i));
  const [allImageNames, setAllImageNames] = useState<string[]>([]);
  const [images, setImages] = useState<IImage[]>(
    [
      { ...imgDefault, ref: useRef<HTMLImageElement>(null) }, { ...imgDefault, ref: useRef<HTMLImageElement>(null) },
      { ...imgDefault, ref: useRef<HTMLImageElement>(null) }, { ...imgDefault, ref: useRef<HTMLImageElement>(null) }
    ] 
  );

  // MODEL HOOKS
  const [model, setModel] = useState<tf.GraphModel | undefined>();
  const [weightFolder, setWeightFolder] = useState<string>(WEIGHT_FOLDER);
  const [datasetFolder, setDatasetFolder] = useState<string>(DATASET_FOLDER);
  const [modelUrl, setModelUrl] = useState<string>(`http://localhost:8080/weights/${datasetFolder}/${weightFolder}/model.json`);


  useEffect(() => {
    console.log('Template rendered.');
    loadAllImages();
  }, []);

  useEffect(() => {
    if (model) {
      const timeOutId = setTimeout(() => predictImages(), 500);
      return () => clearTimeout(timeOutId);
    }
  }, [model, images])

  useEffect(() => {
    if (allImageNames.length) {
      const start = imageIndexes[0];
      const stop = imageIndexes[3] + 1;
      const newImages = allImageNames.slice(start, stop).map((imgName, i) => {
        return getIImage(start + i, imgName, i, false)
      });
      setImages(newImages);
    }
  }, [allImageNames]);

  useEffect(() => {
    if (!ENVIRONMENT.isDevelopment) {
      getGraphModel().then(newModel => {
        setModel(newModel);
        console.log('Model loaded: ', newModel);
      });
    }
  }, [modelUrl]);

  useEffect(() => {
    if (allImageNames.length) {
      const newImages = imageIndexes.map((index, i) => {
        if (index >= allImageNames.length) {
          return getIImage(0, '', i, true);
        }
        return getIImage(index, allImageNames[index], i, false);
      });
      setImages(newImages);
    }
  }, [imageIndexes])

  const getGraphModel = async () => {
    return loadGraphModel(modelUrl);
  }

  const predictImages = async () => {
    const predictions = await Promise.all(
      images.map(async (img, i) => predict(img, i))
    );
    const predictionLabels = predictions.map((prediction) => {
      if (prediction?.label && prediction?.confidence) {
        return `${prediction.label}: ${prediction.confidence.toFixed(2)}%`;
      }
      return '';
    });
    setImgLabels(predictionLabels);
  }

  const predict = async (inputImage: IImage, index: number) => {
    if (inputImage && inputImage.ref.current) {
      const inputTensor = tf.browser.fromPixels(inputImage.ref.current)
                                    .resizeNearestNeighbor([IMAGE_WIDTH, IMAGE_HEIGHT])
                                    .toFloat()
                                    .expandDims(0);
      if (model) {
        const predictionTensor = (model.predict(inputTensor) as tf.Tensor);
        const prediction = await predictionTensor.data();
        const predictionRounded = Math.round(prediction[0]);

        const predictionResult:IPrediction = {
          id: index,
          label: LABELS.get(predictionRounded) || '',
          confidence: predictionRounded ? (100 * prediction[0]) : 100 - (100 * prediction[0])
        };
        console.log('Prediction Result: ', {...predictionResult, prediction})
        return predictionResult;
      }
      console.log('No model: ', model);
    }
    console.log('No image: ', inputImage);
  }

  const getIImage = (id: number, name: string, i: number, isReset: boolean): IImage => {
    return {
      id: id,
      name: name,
      src: isReset ? '' : `http://localhost:8080/images/${imgFolder}/${name}`,
      ref: images[i].ref,
    } as IImage;
  }

  const loadAllImages = async () => {
    const response = await getAllImages(imgFolder);  
    console.log('response allImages: ', response);
    setAllImageNames(response);
    setIsLoading(false);
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Camera trap Classifier</h1>
      </header>
      <Gallary 
        allImageNames={allImageNames}
        images={images}
        imageIndexes={imageIndexes}
        setImageIndexes={setImageIndexes}
        isLoading={isLoading}
        imgLabels={imgLabels}
      />
    </div>
  );
}

export default App;
