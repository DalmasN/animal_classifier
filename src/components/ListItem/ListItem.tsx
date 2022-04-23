import * as React from 'react';
import LoadingIcon from '../../assets/LoadingIcon';
import { IListItem } from '../../interfaces/IListItem';

const ListItem = ({ img, label, isLoading }: IListItem) => {

  const PredictionItem = () => {
    return (
      <>
        <a href={img.src} target='_blank' rel='noreferrer'>
          <img src={img.src} className="image" alt="" ref={img.ref} crossOrigin="anonymous" />
        </a>
        {label
          ?
          <h2>
            <span>{img.name}: </span>
            <span className={label.includes("ANIMAL") ? 'positive' : 'negative'}>{label}</span>
          </h2>
          :
          <LoadingIcon className="loading-icon-small" />
        }
      </>
    );
  }

  return (
    <li>
      {(img.src && !isLoading) 
        ? <PredictionItem /> 
        : (isLoading  
            ? <LoadingIcon className="loading-icon-large" /> 
            : <></>
          )
      }
    </li>
  );
}

export default ListItem;