import fs from 'fs';
import { createEvent, createEvents, EventAttributes, NodeCallback } from 'ics';

const OUTDIR = './output/';

export default async (event: EventAttributes | Array<EventAttributes>, fileName: string) => {
  let value: string;

  try {
    value = await new Promise((resolve, reject) => {
      const simpleCallback: NodeCallback = (error, value) => {
        if (error) {
          reject(error);
        }

        resolve(value);
      }
    
      if (Array.isArray(event)) {
        createEvents(event, simpleCallback);
      } else {
        createEvent(event, simpleCallback);
      }
    });
  } catch (e) {
    throw e;
  }

  if (!fs.existsSync(OUTDIR)){
    fs.mkdirSync(OUTDIR);
  }

  fs.writeFileSync(`${OUTDIR}/${fileName}.ics`, value);
}