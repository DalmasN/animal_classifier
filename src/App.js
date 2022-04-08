import image from  './moose.jpg';  //'./forest.jpg';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import {loadGraphModel} from '@tensorflow/tfjs-converter';
import { useEffect, useRef, useState, useMemo } from 'react';

const IMAGE_WIDTH = 224;
const IMAGE_HEIGHT = 224;
const CHANNELS = 3;

const labels = {
  0: "ANIMAL", 
  1: "EMPTY"
};

const App = () => {

  const imageRef = useRef(null);
  const [imageLabel, setImageLabel] = useState("");
  const [modelUrl, setModelUrl] = useState("http://localhost:8080/weights/BO16/ResNet-101/model.json");
  const [model, setModel] = useState();

  // Expensive operation
/*   const model =  useMemo(() => {
    return loadGraphModel(modelUrl);
  }, [modelUrl]) */

  useEffect(() => {
    //getPred();
/*     const graphModel = await getGraphModel();
    setModel(graphModel); */
    predict(imageRef.current)
      .then(prediction => {
        setImageLabel(`${prediction.label}: ${prediction.confidence}%`)
      })
  });

  useEffect(() => {
    const newModel = getGraphModel().then(p => {
      setModel(p);
    });
    //setModel(newModel);
  }, [modelUrl])

  const getGraphModel = async () => {
    return loadGraphModel(modelUrl);
  }

  const predict = async (inputImage) => {
    const inputTensor = tf.browser.fromPixels(inputImage)
                                  .resizeBilinear([IMAGE_WIDTH, IMAGE_HEIGHT])
                                  .reshape([1, IMAGE_WIDTH, IMAGE_HEIGHT, CHANNELS]);

    const predictionTensor = model.predict(inputTensor);
    const prediction = predictionTensor.dataSync[0];
    const predictionRounded = Math.round(prediction);
    return {
      label: labels[predictionRounded],
      confidence: predictionRounded ? 100 * prediction : 100 - (100 * prediction),
    };
  }

/*   const getPred = async () => {

    const tensor = tf.browser.fromPixels(imageRef.current)
                             .resizeBilinear([IMAGE_WIDTH, IMAGE_HEIGHT])
                             .reshape([1, IMAGE_WIDTH, IMAGE_HEIGHT, CHANNELS]);

    //const t4d = tf.tensor4d(Array.from(tensor.dataSync()),[1,IMAGE_WIDTH,IMAGE_HEIGHT,3])

    const pred = model.predict(tensor);
    const data = pred.dataSync()[0];//print();
    const rounded = Math.round(data);
    const confidence = data ? data * 100 : 
    console.log('data: ', data); 
    console.log('pred: ', pred); 
    return pred;
  } */

  return (
    <div className="App">
      <header className="App-header">
        <img src={image} className="App-logo" alt="logo" ref={imageRef}/>
        <h1>{imageLabel}</h1>
      </header>
    </div>
  );
}

export default App;
