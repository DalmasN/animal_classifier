import * as React from 'react';
import ListItem from '../ListItem/ListItem';
import _ from 'lodash';
import { IGallary } from '../../interfaces/IGallery';

const Gallary = ( { allImageNames, images, imageIndexes, setImageIndexes, imgLabels, isLoading }:IGallary ) => {

  const previousImages = () => {
    console.log('Loading previous sequence...');
    const updatedImgIndexes = imageIndexes.map((index) => {
      const newId = index - 4;
      if (newId >= 0) {
        return newId;
      }
      return index;
    });
    if (_.isEqual(updatedImgIndexes, imageIndexes)) {
      console.log('No need to update images <')
      return;
    }
    setImageIndexes(updatedImgIndexes);
  }

  const nextImages = async () => {
    console.log('Loading next sequence...');
    const updatedImgIndexes = images.map((img) => img.id + 4);
    if (updatedImgIndexes.length && updatedImgIndexes[0] >= allImageNames.length) {
      console.log('No need to update images >')
      return;
    }
    setImageIndexes(updatedImgIndexes);
  }

  return (
    <>
      <ul>
        {images.map((img, i) => {
          return (
            <ListItem key={`${img.id}-${i}`} img={img} label={imgLabels[i]} isLoading={isLoading} />
          );
        })}
      </ul>
      <div className='App-btn__container'>
        <button onClick={() => previousImages()} disabled={imageIndexes[0] === 0}>⬅ Previous</button>
        {/* <button onClick={() => predictImages()}>Predict</button> */}
        <button onClick={() => nextImages()} disabled={imageIndexes[3] >= allImageNames.length}>Next ➡</button>
      </div>
    </>
  );
}

export default Gallary;