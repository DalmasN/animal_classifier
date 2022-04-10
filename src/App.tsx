import './App.css';
import * as tf from '@tensorflow/tfjs';
import { loadGraphModel } from '@tensorflow/tfjs-converter';
import { RefObject, useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import axios from 'axios';

interface IPrediction {
  id: number,
  label: string,
  confidence: number,
}

interface IImage {
  id: number,
  name: string,
  src: string,
  ref: RefObject<HTMLImageElement>,
}

// Set isDevlopment to 'true' if you dont want to load model weight and make predictions. 
// Useful when developing other functionality or doing styling changes
const ENVIRONMENT = {
  isDevelopment: false
}

// IMAGE PROPERTIES

const IMAGE_WIDTH = 224;
const IMAGE_HEIGHT = 224;
const CHANNELS = 3;

// DEFAULT STATE

// IMAGE
const IMG_FOLDER = "ANIMAL";

// WEIGHTS
const DATASET_FOLDER = "BO16"
const WEIGHT_FOLDER = "ResNet-101";

// DATASET LABELS
const LABELS = new Map<number, string>()
                    .set(0, "ANIMAL")
                    .set(1, "EMPTY");

const App = () => {

  // IMAGE HOOKS
  const [imgLabels, setImgLabels] = useState<string[]>(["", "", "", ""]);
  const [imgFolder, setImgFolder] = useState<string>(IMG_FOLDER);
  const [imagesIndexes, setImagesIndexes] = useState<number[]>([0, 1, 2, 3]);
  const [images, setImages] = useState<IImage[]>(
    [
      {
        id: imagesIndexes[0],
        name: `${imagesIndexes[0]}.jpg`,
        src: `http://localhost:8080/images/${imgFolder}/${imagesIndexes[0]}.jpg`,
        ref: useRef<HTMLImageElement>(null)
      },
      {
        id: imagesIndexes[1],
        name: `${imagesIndexes[1]}.jpg`,
        src: `http://localhost:8080/images/${imgFolder}/${imagesIndexes[1]}.jpg`,
        ref: useRef<HTMLImageElement>(null)
      },
      {
        id: imagesIndexes[2],
        name: `${imagesIndexes[2]}.jpg`,
        src: `http://localhost:8080/images/${imgFolder}/${imagesIndexes[2]}.jpg`,
        ref: useRef<HTMLImageElement>(null)
      },
      {
        id: imagesIndexes[3],
        name: `${imagesIndexes[3]}.jpg`,
        src: `http://localhost:8080/images/${imgFolder}/${imagesIndexes[3]}.jpg`,
        ref: useRef<HTMLImageElement>(null)
      }
    ]
  );

  // MODEL HOOKS
  const [model, setModel] = useState<tf.GraphModel | undefined>();
  const [weightFolder, setWeightFolder] = useState<string>(WEIGHT_FOLDER);
  const [datasetFolder, setDatasetFolder] = useState<string>(DATASET_FOLDER);
  const [modelUrl, setModelUrl] = useState<string>(`http://localhost:8080/weights/${datasetFolder}/${weightFolder}/model.json`);


  useEffect(() => {
    console.log('Template rendered.');
  },[]);

  useEffect( () => {
    if(model){
      const timeOutId = setTimeout(() => predictImages(), 500);
      return () => clearTimeout(timeOutId);
    }
  }, [model, images])

  useEffect(() => {
    if(!ENVIRONMENT.isDevelopment){
      getGraphModel().then(newModel => {
        setModel(newModel);
        console.log('Model loaded: ', newModel);
      });
    }
  }, [modelUrl]);

  useEffect(() => {
    const newImages = imagesIndexes.map((index, i) => {
      return {
        id: index,
        name: `${index}.jpg`,
        src: `http://localhost:8080/images/${imgFolder}/${index}.jpg`,
        ref: images[i].ref,
      }
    });
    setImages(newImages);
  }, [imagesIndexes])

  const getGraphModel = async () => {
    return loadGraphModel(modelUrl);
  }

  const predictImages = async () => {
    const predictions = await Promise.all(
      images.map(async (img, i) => predict(img, i))
    );
    const predictionLabels = predictions.map((prediction, i) => {
      if(prediction?.label && prediction?.confidence) {
        return `${prediction.label}: ${prediction.confidence.toFixed(2)}%`;
      }
      return `ERROR: Could not make a prediction for image: ${images[i].name}`
    });
    setImgLabels(predictionLabels);
  }

  const predict = async (inputImage: IImage, index: number) => {
    if (inputImage && inputImage.ref.current) {
      const inputTensor = tf.browser.fromPixels(inputImage.ref.current)
                                    .resizeBilinear([IMAGE_WIDTH, IMAGE_HEIGHT])
                                    .reshape([1, IMAGE_WIDTH, IMAGE_HEIGHT, CHANNELS]);
      if (model) {
        const predictionTensor = (model.predict(inputTensor) as tf.Tensor);
        const prediction = await predictionTensor.data();
        const predictionRounded = Math.round(prediction[0]);

        const predictionResult = { 
          id: index,
          label: LABELS.get(predictionRounded),
          confidence: predictionRounded ? (100 * prediction[0]) : 100 - (100 * prediction[0])
        } as IPrediction;

        console.log('Prediction: ', predictionResult)
        return predictionResult;
      }
      console.log('No model: ', model);
    }
    console.log('No image: ', inputImage);
  }

  const previousImages = () => {
    console.log('Loading previous sequence...');

    const updatedImgIndexes = images.map((img) => {
      const newId = img.id - 4;
      if(newId >= 0){
        return newId;
      }
      return img.id;
    });

    if (_.isEqual(updatedImgIndexes, imagesIndexes)){
      console.log('No need to update images')
      return;
    }

    setImagesIndexes(updatedImgIndexes);
  }

  const nextImages = async () => {
    console.log('Loading next sequence...');
   
    const updatedImgIndexes = images.map((img) => img.id + 4);
    setImagesIndexes(updatedImgIndexes);
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Animal Classifier</h1>
        <ul>
          {images.map((img, i) => {
            return (          
              <li key={`${img.id}-${i}`}>
                <img src={img.src} className="image" alt="" ref={img.ref} crossOrigin="anonymous"/>
                {imgLabels[i] &&
                  <h2 style={{color: imgLabels[i].includes("ANIMAL") ? 'green' : 'red'}}>{imgLabels[i]}</h2>
                }
              </li>
            );
          })}
        </ul>
        <div className='App-btn__container'>
          <button onClick={() => previousImages()}>{'<<<'}</button>
          <button onClick={() => predictImages()} disabled={ENVIRONMENT.isDevelopment}>Predict</button>
          <button onClick={() => nextImages()}>{'>>>'}</button>
        </div>
      </header>
    </div>
  );
}

export default App;
