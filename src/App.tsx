import './App.css';
import loadingIcon from './assets/Warning-Moose-Roadsign.svg';
import * as tf from '@tensorflow/tfjs';
import { loadGraphModel } from '@tensorflow/tfjs-converter';
import { RefObject, useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import axios from 'axios';
import { Element, ElementCompact, xml2js } from 'xml-js'

interface IPrediction {
  id: number,
  label: string,
  confidence: number,
}

interface IImage {
  id: number,
  name: string,
  src: string,
  ref: RefObject<HTMLImageElement>
}

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
const IMG_FOLDER = "ANIMAL"; // EMPTY

// WEIGHTS
const DATASET_FOLDER = "BO16"
const WEIGHT_FOLDER = "ResNet-101"; // ResNet-50 VGG-16

// DATASET LABELS
const LABELS = new Map<number, string>()
  .set(0, "ANIMAL")
  .set(1, "EMPTY");


const App = () => {

  const imgDefault = {
    id: 0,
    name: '',
    src: '',

  };

  const [isLoading, setIsLoading] = useState(true);

  // IMAGE HOOKS
  const [imgLabels, setImgLabels] = useState<string[]>(["", "", "", ""]);
  const [imgFolder, setImgFolder] = useState<string>(IMG_FOLDER);
  const [imagesIndexes, setImagesIndexes] = useState<number[]>([0, 1, 2, 3]);
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
    getImages();
  }, []);

  useEffect(() => {
    if (model) {
      const timeOutId = setTimeout(() => predictImages(), 500);
      return () => clearTimeout(timeOutId);
    }
  }, [model, images])

  useEffect(() => {
    if (allImageNames.length) {
      const start = imagesIndexes[0];
      const stop = imagesIndexes[3] + 1;
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
      const newImages = imagesIndexes.map((index, i) => {
        if (index >= allImageNames.length) {
          return getIImage(0, '', i, true);
        }
        return getIImage(index, allImageNames[index], i, false);
      });
      setImages(newImages);
    }
  }, [imagesIndexes])

  const getGraphModel = async () => {
    return loadGraphModel(modelUrl);
  }

  const predictImages = async () => {
    const predictions = await Promise.all(
      images.map(async (img, i) => predict(img, i))
    );
    const predictionLabels = predictions.map((prediction, i) => {
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

        const predictionResult = {
          id: index,
          label: LABELS.get(predictionRounded),
          confidence: predictionRounded ? (100 * prediction[0]) : 100 - (100 * prediction[0])
        } as IPrediction;
        console.log('Prediction Result: ', {...predictionResult, prediction})
        return predictionResult;
      }
      console.log('No model: ', model);
    }
    console.log('No image: ', inputImage);
  }

  const previousImages = () => {
    console.log('Loading previous sequence...');
    const updatedImgIndexes = imagesIndexes.map((index) => {
      const newId = index - 4;
      if (newId >= 0) {
        return newId;
      }
      return index;
    });
    if (_.isEqual(updatedImgIndexes, imagesIndexes)) {
      console.log('No need to update images <')
      return;
    }
    setImagesIndexes(updatedImgIndexes);
  }

  const nextImages = async () => {
    console.log('Loading next sequence...');
    const updatedImgIndexes = images.map((img) => img.id + 4);
    if (updatedImgIndexes.length && updatedImgIndexes[0] >= allImageNames.length) {
      console.log('No need to update images >')
      return;
    }
    setImagesIndexes(updatedImgIndexes);
  }

  const getIImage = (id: number, name: string, i: number, isReset: boolean): IImage => {
    return {
      id: id,
      name: name,
      src: isReset ? '' : `http://localhost:8080/images/${imgFolder}/${allImageNames[id]}`,
      ref: images[i].ref,
    } as IImage;
  }

  const getImages = async () => {
    const response = await (await axios.get(`http://localhost:8080/images/${imgFolder}`)).data;
    const table = response.split(/<\/h1>|<br>/)[1];
    const tableJS = xml2js(table);
    const imageNames = tableJS.elements[0].elements.filter((_row: ElementCompact | Element, i: number) => i !== 0).map((row: ElementCompact | Element) => {
      return row.elements[4].elements[0].elements[0].text;
    });
    console.log('response allImages: ', imageNames);
    setAllImageNames(imageNames);
    setIsLoading(false);
  }

  const listElement = (img: IImage, i:number) => {
    if(img.src && !isLoading){
      return (
        <>
          <a href={img.src} target={'_blank'} rel='noreferrer'>
            <img src={img.src} className="image" alt="" ref={img.ref} crossOrigin="anonymous" />
          </a>
          {imgLabels[i] ?
            <h2>
              <span>{img.name}: </span>
              <span className={imgLabels[i].includes("ANIMAL") ? 'positive' : 'negative'}>{imgLabels[i]}</span>
            </h2>
            :
            <img src={loadingIcon} className="loading-icon-small" alt='' />
          }
      </>
      );
    }else if(!isLoading){
      return (<></>);
    }else {
      return (<img src={loadingIcon} className="loading-icon-large" alt='' />);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Camera trap Classifier</h1>
      </header>
      <ul>
        {images.map((img, i) => {
          return (
            <li key={`${img.id}-${i}`}>
              {listElement(img, i)}
            </li>
          );
        })}
      </ul>
      <div className='App-btn__container'>
        <button onClick={() => previousImages()} disabled={imagesIndexes[0] === 0}>⬅ Previous</button>
        {/* <button onClick={() => predictImages()}>Predict</button> */}
        <button onClick={() => nextImages()} disabled={imagesIndexes[3] >= allImageNames.length}>Next ➡</button>
      </div>
    </div>
  );
}

export default App;
