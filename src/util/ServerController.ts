import React from "react";
import axios from 'axios';
import { Element, ElementCompact, xml2js } from "xml-js";

export const getAllImages = async (imgFolder:string) => {
  if(imgFolder){
    const response = await (await axios.get(`http://localhost:8080/images/${imgFolder}`)).data;
    const table = response.split(/<\/h1>|<br>/)[1];
    const tableJS = xml2js(table);
    return tableJS.elements[0].elements.filter((_row: ElementCompact | Element, i: number) => i !== 0)
                                       .map((row: ElementCompact | Element) => {
      return row.elements[4].elements[0].elements[0].text;
    });                    
  }
  return [];
}